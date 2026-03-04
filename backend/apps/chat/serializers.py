from rest_framework import serializers

from apps.accounts.serializers import UserSerializer

from .models import Message, Room


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ("id", "room", "sender", "content", "message_type", "file", "created_at")
        read_only_fields = ("id", "room", "sender", "created_at")


class RoomSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = ("id", "name", "room_type", "participants", "last_message", "created_at")

    def get_last_message(self, obj):
        last = obj.messages.last()
        return MessageSerializer(last).data if last else None
