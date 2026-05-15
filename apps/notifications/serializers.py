"""Serializers for notifications."""
from rest_framework import serializers

from .models import NotificationLog, NotificationTemplate


class NotificationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationTemplate
        fields = (
            "id", "code", "name", "channel",
            "subject_template", "body_template",
            "is_active", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class NotificationLogSerializer(serializers.ModelSerializer):
    template_code = serializers.CharField(source="template.code", read_only=True, default=None)
    recipient_name = serializers.CharField(source="recipient.full_name", read_only=True)

    class Meta:
        model = NotificationLog
        fields = (
            "id", "template", "template_code",
            "recipient", "recipient_name",
            "channel", "subject", "body",
            "status", "reference_type", "reference_id",
            "sent_at", "error_message",
            "created_at",
        )
        read_only_fields = (
            "id", "subject", "body", "status",
            "sent_at", "error_message", "created_at",
        )
