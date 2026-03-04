from django.contrib import admin

from .models import Contact, FriendRequest


@admin.register(FriendRequest)
class FriendRequestAdmin(admin.ModelAdmin):
    list_display = ("from_user", "to_user", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("from_user__email", "to_user__email")


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ("user", "friend", "created_at")
    search_fields = ("user__email", "friend__email")
