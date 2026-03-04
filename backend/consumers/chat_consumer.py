import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for a single chat room.

    Client connects to: ws://.../ws/chat/<room_id>/?token=<access_token>

    Inbound message types (client → server):
      { "type": "message",      "content": "..." }
      { "type": "typing",       "is_typing": true/false }
      { "type": "read_receipt", "message_id": 123 }

    Outbound message types (server → client):
      { "type": "message",  "message": {...} }
      { "type": "typing",   "user_id": ..., "display_name": ..., "is_typing": ... }
      { "type": "read_receipt", "user_id": ..., "message_id": ... }
      { "type": "presence", "user_id": ..., "is_online": ... }
    """

    # ── Connection lifecycle ───────────────────────────────────────────────────

    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.group_name = f"chat_{self.room_id}"
        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            await self.close(code=4001)
            return

        if not await self._user_in_room():
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        await self._set_online(True)
        await self._broadcast_presence(True)

    async def disconnect(self, code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            await self._set_online(False)
            await self._broadcast_presence(False)

    # ── Receive ───────────────────────────────────────────────────────────────

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        event_type = data.get("type")
        if event_type == "message":
            await self._handle_message(data)
        elif event_type == "typing":
            await self._handle_typing(data)
        elif event_type == "read_receipt":
            await self._handle_read_receipt(data)

    # ── Inbound handlers ──────────────────────────────────────────────────────

    async def _handle_message(self, data):
        content = (data.get("content") or "").strip()
        if not content:
            return

        message = await self._save_message(content)

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "chat.message",
                "message": {
                    "id": message.id,
                    "content": message.content,
                    "message_type": message.message_type,
                    "created_at": message.created_at.isoformat(),
                    "room": self.room_id,
                    "sender": {
                        "id": self.user.id,
                        "email": self.user.email,
                        "display_name": self.user.display_name,
                        "avatar": self.user.avatar.url if self.user.avatar else None,
                    },
                },
            },
        )

    async def _handle_typing(self, data):
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "chat.typing",
                "user_id": self.user.id,
                "display_name": self.user.display_name,
                "is_typing": bool(data.get("is_typing")),
            },
        )

    async def _handle_read_receipt(self, data):
        message_id = data.get("message_id")
        if not message_id:
            return
        await self._mark_read(message_id)
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "chat.read_receipt",
                "user_id": self.user.id,
                "message_id": message_id,
            },
        )

    # ── Channel-layer event handlers (group_send → send) ──────────────────────

    async def chat_message(self, event):
        await self.send(json.dumps({"type": "message", "message": event["message"]}))

    async def chat_typing(self, event):
        # Don't echo typing back to the sender
        if event["user_id"] == self.user.id:
            return
        await self.send(
            json.dumps(
                {
                    "type": "typing",
                    "user_id": event["user_id"],
                    "display_name": event["display_name"],
                    "is_typing": event["is_typing"],
                }
            )
        )

    async def chat_read_receipt(self, event):
        await self.send(
            json.dumps(
                {
                    "type": "read_receipt",
                    "user_id": event["user_id"],
                    "message_id": event["message_id"],
                }
            )
        )

    async def chat_presence(self, event):
        await self.send(
            json.dumps(
                {
                    "type": "presence",
                    "user_id": event["user_id"],
                    "is_online": event["is_online"],
                }
            )
        )

    # ── DB helpers ────────────────────────────────────────────────────────────

    @database_sync_to_async
    def _user_in_room(self):
        from apps.chat.models import Room

        return Room.objects.filter(pk=self.room_id, participants=self.user).exists()

    @database_sync_to_async
    def _save_message(self, content: str):
        from apps.chat.models import Message, Room

        room = Room.objects.get(pk=self.room_id)
        return Message.objects.create(room=room, sender=self.user, content=content)

    @database_sync_to_async
    def _mark_read(self, message_id: int):
        from apps.chat.models import Message

        try:
            Message.objects.get(pk=message_id).read_by.add(self.user)
        except Message.DoesNotExist:
            pass

    @database_sync_to_async
    def _set_online(self, is_online: bool):
        from django.contrib.auth import get_user_model

        User = get_user_model()
        kwargs = {"is_online": is_online}
        if not is_online:
            kwargs["last_seen"] = timezone.now()
        User.objects.filter(pk=self.user.id).update(**kwargs)

    async def _broadcast_presence(self, is_online: bool):
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "chat.presence",
                "user_id": self.user.id,
                "is_online": is_online,
            },
        )
