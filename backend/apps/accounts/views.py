import requests
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import LoginSerializer, RegisterSerializer, UserSerializer


def _tokens_for_user(user: User) -> dict:
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {**_tokens_for_user(user), "user": UserSerializer(user, context={"request": request}).data},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        return Response(
            {**_tokens_for_user(user), "user": UserSerializer(user, context={"request": request}).data}
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "Refresh token required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            RefreshToken(refresh_token).blacklist()
        except TokenError:
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_204_NO_CONTENT)


class GoogleAuthView(APIView):
    """
    Accepts a Google ID token (from GSI / Google One Tap).
    Verifies it via Google's tokeninfo endpoint, then issues JWT tokens.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token")
        if not token:
            return Response({"detail": "Google token required."}, status=status.HTTP_400_BAD_REQUEST)

        # Verify the ID token with Google
        resp = requests.get(settings.GOOGLE_TOKENINFO_URL, params={"id_token": token}, timeout=5)
        if resp.status_code != 200:
            return Response({"detail": "Invalid Google token."}, status=status.HTTP_400_BAD_REQUEST)

        google_data = resp.json()

        # Verify the token was issued for our app (prevents token substitution attacks)
        expected_client_id = settings.GOOGLE_CLIENT_ID
        if expected_client_id and google_data.get("aud") != expected_client_id:
            return Response({"detail": "Invalid Google token audience."}, status=status.HTTP_400_BAD_REQUEST)

        email = google_data.get("email")
        if not email:
            return Response({"detail": "Email not available from Google."}, status=status.HTTP_400_BAD_REQUEST)

        display_name = google_data.get("name") or email.split("@")[0]

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": email,
                "display_name": display_name,
            },
        )
        if created:
            user.set_unusable_password()
            user.save()
        elif not user.display_name:
            user.display_name = display_name
            user.save(update_fields=["display_name"])

        return Response(
            {**_tokens_for_user(user), "user": UserSerializer(user, context={"request": request}).data}
        )


class MeView(APIView):
    """GET /api/auth/me/ — return the authenticated user's profile."""

    def get(self, request):
        return Response(UserSerializer(request.user, context={"request": request}).data)
