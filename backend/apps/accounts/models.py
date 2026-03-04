from django.contrib.auth.models import AbstractUser, UserManager as BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("Email is required.")
        email = self.normalize_email(email)
        extra_fields.setdefault("username", email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self._create_user(email, password, **extra_fields)


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

    objects = UserManager()

    USERNAME_FIELD = "email"
    # Only ask for display_name on createsuperuser; username is auto-set to email
    REQUIRED_FIELDS = ["display_name"]

    def save(self, *args, **kwargs):
        # username must be unique; keep it mirrored to email
        self.username = self.email
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email
