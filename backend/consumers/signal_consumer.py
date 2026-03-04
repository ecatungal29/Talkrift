import json

from channels.generic.websocket import AsyncWebsocketConsumer


class SignalingConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for WebRTC signaling.

    Client connects to: ws://.../ws/signal/<room_id>/?token=<access_token>

    Inbound message types (client → server, relayed to peers):
      { "type": "offer",         "data": <RTCSessionDescription>, "to_user": <id> }
      { "type": "answer",        "data": <RTCSessionDescription>, "to_user": <id> }
      { "type": "ice_candidate", "data": <RTCIceCandidate>,       "to_user": <id> }

    The server relays each message to all other peers in the signaling room
    (optionally targeting a specific user via `to_user`).

    Outbound (server → client):
      { "type": "offer"|"answer"|"ice_candidate", "from_user": <id>, "data": ... }
    """

    RELAY_TYPES = frozenset({"offer", "answer", "ice_candidate"})

    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.group_name = f"signal_{self.room_id}"
        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            await self.close(code=4001)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        if data.get("type") not in self.RELAY_TYPES:
            return

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "signal.relay",
                "from_user": self.user.id,
                "signal_type": data["type"],
                "payload": data.get("data"),
                "to_user": data.get("to_user"),
            },
        )

    async def signal_relay(self, event):
        # Never send back to the originator
        if event["from_user"] == self.user.id:
            return

        # If targeted, only deliver to the intended recipient
        to_user = event.get("to_user")
        if to_user is not None and to_user != self.user.id:
            return

        await self.send(
            json.dumps(
                {
                    "type": event["signal_type"],
                    "from_user": event["from_user"],
                    "data": event["payload"],
                }
            )
        )
