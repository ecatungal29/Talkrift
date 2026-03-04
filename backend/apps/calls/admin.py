from django.contrib import admin

from .models import CallSession


@admin.register(CallSession)
class CallSessionAdmin(admin.ModelAdmin):
    list_display = ("id", "caller", "callee", "status", "started_at", "ended_at", "created_at")
    list_filter = ("status",)
    search_fields = ("caller__email", "callee__email")
    raw_id_fields = ("caller", "callee", "room")
