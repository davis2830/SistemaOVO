"""Notification service — send notifications from templates."""
from django.template import Context, Template
from django.utils import timezone


def send_notification(*, template, recipient, context_data=None, user=None):
    """
    Create a notification log entry from a template.
    Renders subject and body with context_data.
    Actual delivery (email/SMS/push) is a TODO for Celery tasks.
    """
    from .models import NotificationLog

    ctx = Context(context_data or {})
    subject = Template(template.subject_template).render(ctx) if template.subject_template else ""
    body = Template(template.body_template).render(ctx)

    log = NotificationLog.objects.create(
        template=template,
        recipient=recipient,
        channel=template.channel,
        subject=subject,
        body=body,
        status="PENDING",
        created_by=user,
        updated_by=user,
    )
    return log


def mark_as_read(notification):
    """Mark an internal notification as read."""
    if notification.channel == "INTERNAL" and notification.status in ("PENDING", "SENT"):
        notification.status = "READ"
        notification.save(update_fields=["status", "updated_at"])
    return notification
