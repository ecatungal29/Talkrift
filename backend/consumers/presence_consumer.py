import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.utils import timezone


def _presence_group(user_id):
    return f"user_presence_{user_id}"


class PresenceConsumer(AsyncWebsocketConsumer):
    """
    Global presence WebSocket — one persistent connection per logged-in user.

    Client connects to: ws://.../ws/presence/?token=<access_token>

    Outbound message types (server → client):
      { "type": "presence", "user_id": ..., "is_online": true/false }

    On connect:
      - Mark the user online in the DB
      - Join own presence group  (user_presence_<self.user.id>)
      - Join each contact's presence group  (user_presence_<contact_id>)
        so this connection receives future presence events from those contacts
      - Broadcast own online status to own presence group
        (contacts who are already connected will receive it)
      - Send a snapshot of each contact's current is_online value
        directly to this connection

    On disconnect:
      - Mark the user offline / update last_seen
      - Broadcast own offline status to own presence group
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
        """Forward a presence event from the channel layer to the WebSocket client."""
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
