from rest_framework import serializers

from apps.accounts.serializers import UserSerializer

from .models import Message, Room


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    read_by_ids = serializers.SerializerMethodField()
    reactions = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ("id", "room", "sender", "content", "message_type", "file", "created_at", "read_by_ids", "reactions")
        read_only_fields = ("id", "room", "sender", "created_at", "read_by_ids", "reactions")

    def get_read_by_ids(self, obj):
        return list(obj.read_by.values_list("id", flat=True))

    def get_reactions(self, obj):
        result = {}
        for r in obj.reactions.all():
            result.setdefault(r.emoji, []).append(r.user_id)
        return result

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if data.get("file") and request:
            data["file"] = request.build_absolute_uri(data["file"])
        return data


class RoomSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = ("id", "name", "room_type", "participants", "last_message", "created_at")

    def get_last_message(self, obj):
        last = obj.messages.last()
        return MessageSerializer(last).data if last else None
