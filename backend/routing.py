from django.urls import re_path

from consumers.chat_consumer import ChatConsumer
from consumers.signal_consumer import SignalingConsumer

websocket_urlpatterns = [
    re_path(r"ws/chat/(?P<room_id>\d+)/$", ChatConsumer.as_asgi()),
    re_path(r"ws/signal/(?P<room_id>[^/]+)/$", SignalingConsumer.as_asgi()),
]
