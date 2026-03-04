from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/contacts/", include("apps.contacts.urls")),
    path("api/chat/", include("apps.chat.urls")),
    path("api/calls/", include("apps.calls.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
