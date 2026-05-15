"""Notifications — templates and log for system notifications."""
from django.conf import settings
from django.db import models

from apps.core.models import ActiveManager, TimeStampedModel


class NotificationTemplate(TimeStampedModel):
    """Reusable notification templates."""

    CHANNEL_CHOICES = [
        ("EMAIL", "Correo Electrónico"),
        ("SMS", "SMS"),
        ("PUSH", "Push Notification"),
        ("INTERNAL", "Notificación Interna"),
    ]

    code = models.CharField(max_length=60, unique=True, db_index=True, help_text="e.g. INVOICE_READY, LOW_STOCK")
    name = models.CharField(max_length=120)
    channel = models.CharField(max_length=10, choices=CHANNEL_CHOICES, default="INTERNAL")
    subject_template = models.CharField(max_length=200, blank=True, default="")
    body_template = models.TextField(help_text="Supports Django template syntax with {{ context_vars }}.")
    is_active = models.BooleanField(default=True)

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "notification_templates"
        ordering = ["code"]

    def __str__(self):
        return f"{self.code} ({self.channel})"


class NotificationLog(TimeStampedModel):
    """Log of sent notifications — append-only."""

    STATUS_CHOICES = [
        ("PENDING", "Pendiente"),
        ("SENT", "Enviado"),
        ("FAILED", "Fallido"),
        ("READ", "Leído"),
    ]

    template = models.ForeignKey(
        NotificationTemplate, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="logs",
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications",
    )
    channel = models.CharField(max_length=10, choices=NotificationTemplate.CHANNEL_CHOICES)
    subject = models.CharField(max_length=200, blank=True, default="")
    body = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="PENDING", db_index=True)
    reference_type = models.CharField(max_length=30, blank=True, default="")
    reference_id = models.UUIDField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, default="")

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "notification_logs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.channel} → {self.recipient} ({self.status})"
