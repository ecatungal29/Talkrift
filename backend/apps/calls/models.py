from django.conf import settings
from django.db import models


class CallSession(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("active", "Active"),
        ("ended", "Ended"),
        ("missed", "Missed"),
    ]

    caller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="outgoing_calls",
    )
    callee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="incoming_calls",
    )
    room = models.ForeignKey(
        "chat.Room",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="call_sessions",
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Call {self.id}: {self.caller} → {self.callee} ({self.status})"
