from rest_framework import serializers

from apps.accounts.serializers import UserSerializer

from .models import Contact, FriendRequest


class FriendRequestSerializer(serializers.ModelSerializer):
    from_user = UserSerializer(read_only=True)
    to_user = UserSerializer(read_only=True)

    class Meta:
        model = FriendRequest
        fields = ("id", "from_user", "to_user", "status", "created_at")


class ContactSerializer(serializers.ModelSerializer):
    # `friend` field exposed as `user` to match the frontend interface
    user = UserSerializer(source="friend", read_only=True)
    is_online = serializers.BooleanField(source="friend.is_online", read_only=True)

    class Meta:
        model = Contact
        fields = ("id", "user", "created_at", "is_online")
