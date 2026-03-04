from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Message, Room
from .serializers import MessageSerializer, RoomSerializer

User = get_user_model()


class RoomListView(APIView):
    """
    GET  /api/chat/rooms/         — list rooms the user participates in
    POST /api/chat/rooms/         — create a room (or return existing DM)
    """

    def get(self, request):
        rooms = (
            Room.objects.filter(participants=request.user)
            .prefetch_related("participants", "messages")
            .order_by("-created_at")
        )
        return Response(RoomSerializer(rooms, many=True).data)

    def post(self, request):
        room_type = request.data.get("room_type", "dm")
        participant_ids = request.data.get("participant_ids", [])
        name = request.data.get("name", "")

        all_ids = list(set([request.user.id] + [int(i) for i in participant_ids]))

        # For DMs, return the existing room if one already exists
        if room_type == "dm" and len(all_ids) == 2:
            other_id = next(i for i in all_ids if i != request.user.id)
            existing = (
                Room.objects.filter(room_type="dm", participants=request.user)
                .filter(participants__id=other_id)
                .first()
            )
            if existing:
                return Response(RoomSerializer(existing).data)

        room = Room.objects.create(room_type=room_type, name=name)
        room.participants.set(User.objects.filter(id__in=all_ids))
        return Response(RoomSerializer(room).data, status=status.HTTP_201_CREATED)


class MessageListView(APIView):
    """
    GET  /api/chat/rooms/{room_id}/messages/?cursor=<id>&limit=<n>
         — cursor-based paginated message history (newest-first cursor)
    POST /api/chat/rooms/{room_id}/messages/
         — send a message (REST fallback; real-time delivery via WebSocket)
    """

    def _get_room(self, request, room_id):
        try:
            return Room.objects.get(pk=room_id, participants=request.user)
        except Room.DoesNotExist:
            return None

    def get(self, request, room_id):
        room = self._get_room(request, room_id)
        if not room:
            return Response(status=status.HTTP_404_NOT_FOUND)

        limit = min(int(request.query_params.get("limit", 50)), 100)
        cursor = request.query_params.get("cursor")

        qs = room.messages.select_related("sender").order_by("-created_at")
        if cursor:
            qs = qs.filter(id__lt=int(cursor))

        messages = list(qs[:limit])
        next_cursor = messages[-1].id if len(messages) == limit else None

        return Response(
            {
                "messages": MessageSerializer(reversed(messages), many=True).data,
                "next_cursor": next_cursor,
            }
        )

    def post(self, request, room_id):
        room = self._get_room(request, room_id)
        if not room:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = MessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = serializer.save(room=room, sender=request.user)
        return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)
