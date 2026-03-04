from rest_framework import serializers

from apps.accounts.serializers import UserSerializer

from .models import CallSession


class CallSessionSerializer(serializers.ModelSerializer):
    caller = UserSerializer(read_only=True)
    callee = UserSerializer(read_only=True)

    class Meta:
        model = CallSession
        fields = ("id", "caller", "callee", "room", "status", "started_at", "ended_at", "created_at")
        read_only_fields = ("id", "caller", "created_at")
