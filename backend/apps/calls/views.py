from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CallSession
from .serializers import CallSessionSerializer

User = get_user_model()


class CallSessionListView(APIView):
    """POST /api/calls/ — initiate a call session."""

    def post(self, request):
        callee_id = request.data.get("callee_id")
        if not callee_id:
            return Response({"detail": "callee_id required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            callee = User.objects.get(pk=callee_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        call = CallSession.objects.create(
            caller=request.user,
            callee=callee,
            room_id=request.data.get("room_id"),
        )
        return Response(CallSessionSerializer(call).data, status=status.HTTP_201_CREATED)


class CallSessionDetailView(APIView):
    """PATCH /api/calls/{id}/ — update call status (active / ended / missed)."""

    def patch(self, request, pk):
        try:
            call = CallSession.objects.get(pk=pk)
        except CallSession.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if request.user not in (call.caller, call.callee):
            return Response(status=status.HTTP_403_FORBIDDEN)

        new_status = request.data.get("status")
        if new_status not in ("active", "ended", "missed"):
            return Response({"detail": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST)

        if new_status == "active" and not call.started_at:
            call.started_at = timezone.now()
        elif new_status in ("ended", "missed") and not call.ended_at:
            call.ended_at = timezone.now()

        call.status = new_status
        call.save()
        return Response(CallSessionSerializer(call).data)
