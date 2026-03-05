import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone


def _presence_group(user_id):
    return f"user_presence_{user_id}"


CALL_TYPES = frozenset({"call_invite", "call_accept", "call_reject", "call_end"})


class PresenceConsumer(AsyncWebsocketConsumer):
    """
    Global presence WebSocket — one persistent connection per logged-in user.

    Client connects to: ws://.../ws/presence/?token=<access_token>

    Outbound message types (server → client):
      { "type": "presence",    "user_id": ..., "is_online": true/false }
      { "type": "call_invite", "from_user": {...}, "room_id": ... }
      { "type": "call_accept", "from_user": {...}, "room_id": ... }
      { "type": "call_reject", "from_user": {...} }
      { "type": "call_end",    "from_user": {...} }

    Inbound call signal types (client → server, targeted relay):
      { "type": "call_invite", "to_user": <id>, "room_id": <id> }
      { "type": "call_accept", "to_user": <id>, "room_id": <id> }
      { "type": "call_reject", "to_user": <id> }
      { "type": "call_end",    "to_user": <id> }
    """

    async def connect(self):
        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.own_group = _presence_group(self.user.id)
        self.contact_ids = await self._get_contact_ids()

        # Join own group so contacts can reach this connection
        await self.channel_layer.group_add(self.own_group, self.channel_name)

        # Join each contact's group to receive their future presence events
        for contact_id in self.contact_ids:
            await self.channel_layer.group_add(
                _presence_group(contact_id), self.channel_name
            )

        await self.accept()

        # Mark online and notify contacts
        await self._set_online(True)
        await self.channel_layer.group_send(
            self.own_group,
            {"type": "presence.update", "user_id": self.user.id, "is_online": True},
        )

        # Send snapshot of contacts' current status to just this connection
        statuses = await self._get_contact_statuses()
        for user_id, is_online in statuses:
            await self.send(
                json.dumps({"type": "presence", "user_id": user_id, "is_online": is_online})
            )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        event_type = data.get("type")
        if event_type not in CALL_TYPES:
            return

        to_user = data.get("to_user")
        if not to_user:
            return

        await self.channel_layer.group_send(
            _presence_group(to_user),
            {
                "type": "presence.update",
                "signal_type": event_type,
                "from_user": {
                    "id": self.user.id,
                    "display_name": self.user.display_name,
                    "email": self.user.email,
                    "avatar": self.user.avatar.url if self.user.avatar else None,
                },
                "room_id": data.get("room_id"),
            },
        )

    async def disconnect(self, code):
        if not hasattr(self, "own_group"):
            return

        await self._set_online(False)
        await self.channel_layer.group_send(
            self.own_group,
            {"type": "presence.update", "user_id": self.user.id, "is_online": False},
        )

        await self.channel_layer.group_discard(self.own_group, self.channel_name)
        for contact_id in getattr(self, "contact_ids", []):
            await self.channel_layer.group_discard(
                _presence_group(contact_id), self.channel_name
            )

    # ── Channel-layer event handler ────────────────────────────────────────────

    async def presence_update(self, event):
        """Forward a presence or call-signal event to the WebSocket client."""
        if "signal_type" in event:
            # Call signal targeted at this user
            payload = {
                "type": event["signal_type"],
                "from_user": event["from_user"],
            }
            if event.get("room_id") is not None:
                payload["room_id"] = event["room_id"]
            await self.send(json.dumps(payload))
        else:
            # Presence update
            await self.send(
                json.dumps(
                    {
                        "type": "presence",
                        "user_id": event["user_id"],
                        "is_online": event["is_online"],
                    }
                )
            )

    # ── DB helpers ─────────────────────────────────────────────────────────────

    @database_sync_to_async
    def _get_contact_ids(self):
        from apps.contacts.models import Contact

        return list(
            Contact.objects.filter(user=self.user).values_list("friend_id", flat=True)
        )

    @database_sync_to_async
    def _get_contact_statuses(self):
        from django.contrib.auth import get_user_model

        User = get_user_model()
        return list(
            User.objects.filter(id__in=self.contact_ids).values_list("id", "is_online")
        )

    @database_sync_to_async
    def _set_online(self, is_online: bool):
        from django.contrib.auth import get_user_model

        User = get_user_model()
        kwargs = {"is_online": is_online}
        if not is_online:
            kwargs["last_seen"] = timezone.now()
        User.objects.filter(pk=self.user.id).update(**kwargs)
