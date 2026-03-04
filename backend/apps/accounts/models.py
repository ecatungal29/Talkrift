from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model using email as the primary identifier.
    `username` is kept (required by AbstractUser) but auto-set to the email value.
    """

    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=100)
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = "email"
    # Only ask for display_name on createsuperuser; username is auto-set to email
    REQUIRED_FIELDS = ["display_name"]

    def save(self, *args, **kwargs):
        # username must be unique; keep it mirrored to email
        self.username = self.email
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email
