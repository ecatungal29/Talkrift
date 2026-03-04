from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Contact, FriendRequest
from .serializers import ContactSerializer, FriendRequestSerializer

User = get_user_model()


class ContactListView(APIView):
    """GET /api/contacts/ — list the authenticated user's contacts."""

    def get(self, request):
        contacts = Contact.objects.filter(user=request.user).select_related("friend")
        return Response(ContactSerializer(contacts, many=True).data)


class ContactDetailView(APIView):
    """DELETE /api/contacts/{id}/ — remove a contact (both sides)."""

    def delete(self, request, pk):
        try:
            contact = Contact.objects.get(pk=pk, user=request.user)
        except Contact.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        # Remove both directed edges of the friendship
        Contact.objects.filter(
            Q(user=request.user, friend=contact.friend)
            | Q(user=contact.friend, friend=request.user)
        ).delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class UserSearchView(APIView):
    """GET /api/contacts/search/?q=... — search users by name or email."""

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response([])

        users = (
            User.objects.filter(
                Q(display_name__icontains=query) | Q(email__icontains=query)
            )
            .exclude(id=request.user.id)
            .order_by("display_name")[:20]
        )

        # Batch-fetch existing relationships for efficiency
        user_ids = [u.id for u in users]

        contact_ids = set(
            Contact.objects.filter(user=request.user, friend__in=user_ids).values_list(
                "friend_id", flat=True
            )
        )
        sent_ids = set(
            FriendRequest.objects.filter(
                from_user=request.user, to_user__in=user_ids, status="pending"
            ).values_list("to_user_id", flat=True)
        )
        received_ids = set(
            FriendRequest.objects.filter(
                from_user__in=user_ids, to_user=request.user, status="pending"
            ).values_list("from_user_id", flat=True)
        )

        results = []
        for user in users:
            if user.id in contact_ids:
                relationship = "contact"
            elif user.id in sent_ids:
                relationship = "pending_sent"
            elif user.id in received_ids:
                relationship = "pending_received"
            else:
                relationship = "none"

            results.append(
                {
                    "id": user.id,
                    "display_name": user.display_name,
                    "email": user.email,
                    "avatar": user.avatar.url if user.avatar else None,
                    "relationship": relationship,
                }
            )

        return Response(results)


class FriendRequestCreateView(APIView):
    """POST /api/contacts/requests/ — send a friend request."""

    def post(self, request):
        to_user_id = request.data.get("to_user_id")
        if not to_user_id:
            return Response({"detail": "to_user_id required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            to_user = User.objects.get(pk=to_user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if to_user == request.user:
            return Response(
                {"detail": "Cannot send a friend request to yourself."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if Contact.objects.filter(user=request.user, friend=to_user).exists():
            return Response({"detail": "Already contacts."}, status=status.HTTP_400_BAD_REQUEST)

        # Check for an existing reverse request — auto-accept instead
        reverse = FriendRequest.objects.filter(
            from_user=to_user, to_user=request.user, status="pending"
        ).first()
        if reverse:
            reverse.status = "accepted"
            reverse.save()
            Contact.objects.get_or_create(user=request.user, friend=to_user)
            Contact.objects.get_or_create(user=to_user, friend=request.user)
            return Response(FriendRequestSerializer(reverse).data, status=status.HTTP_201_CREATED)

        req, created = FriendRequest.objects.get_or_create(
            from_user=request.user,
            to_user=to_user,
            defaults={"status": "pending"},
        )
        if not created:
            if req.status == "pending":
                return Response({"detail": "Request already sent."}, status=status.HTTP_400_BAD_REQUEST)
            # Re-send a previously rejected request
            req.status = "pending"
            req.save()

        return Response(FriendRequestSerializer(req).data, status=status.HTTP_201_CREATED)


class IncomingRequestsView(APIView):
    """GET /api/contacts/requests/incoming/"""

    def get(self, request):
        qs = FriendRequest.objects.filter(
            to_user=request.user, status="pending"
        ).select_related("from_user", "to_user")
        return Response(FriendRequestSerializer(qs, many=True).data)


class OutgoingRequestsView(APIView):
    """GET /api/contacts/requests/outgoing/"""

    def get(self, request):
        qs = FriendRequest.objects.filter(
            from_user=request.user, status="pending"
        ).select_related("from_user", "to_user")
        return Response(FriendRequestSerializer(qs, many=True).data)


class FriendRequestActionView(APIView):
    """
    POST /api/contacts/requests/{id}/accept/
    POST /api/contacts/requests/{id}/reject/
    """

    def post(self, request, pk, action):
        try:
            friend_request = FriendRequest.objects.get(
                pk=pk, to_user=request.user, status="pending"
            )
        except FriendRequest.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if action == "accept":
            friend_request.status = "accepted"
            friend_request.save()
            Contact.objects.get_or_create(user=request.user, friend=friend_request.from_user)
            Contact.objects.get_or_create(user=friend_request.from_user, friend=request.user)
        elif action == "reject":
            friend_request.status = "rejected"
            friend_request.save()
        else:
            return Response(status=status.HTTP_400_BAD_REQUEST)

        return Response(status=status.HTTP_204_NO_CONTENT)
