from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken


@database_sync_to_async
def _get_user(token_key: str):
    from django.contrib.auth import get_user_model

    User = get_user_model()
    try:
        token = AccessToken(token_key)
        return User.objects.get(id=token["user_id"])
    except (TokenError, User.DoesNotExist, KeyError):
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Reads a JWT access token from the WebSocket query string:
      ws://host/ws/chat/1/?token=<access_token>
    and populates scope["user"].
    """

    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token_list = params.get("token", [])

        scope["user"] = (
            await _get_user(token_list[0]) if token_list else AnonymousUser()
        )
        return await super().__call__(scope, receive, send)
