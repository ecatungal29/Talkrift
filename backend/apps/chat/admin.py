from django.contrib import admin

from .models import Message, Room


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "room_type", "created_at")
    list_filter = ("room_type",)
    filter_horizontal = ("participants",)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "room", "sender", "message_type", "created_at")
    list_filter = ("message_type",)
    search_fields = ("content", "sender__email")
    raw_id_fields = ("room", "sender")
