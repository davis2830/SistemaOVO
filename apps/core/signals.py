"""Audit trail signals — captures changes on all TimeStampedModel subclasses."""
import json
import threading

from django.db.models.signals import post_save, pre_delete, pre_save
from django.dispatch import receiver

from .models import AuditLog, TimeStampedModel

_request_store = threading.local()


def set_current_request(request):
    """Call from middleware to store the current request for audit logging."""
    _request_store.request = request


def get_current_request():
    return getattr(_request_store, "request", None)


def _get_client_ip(request):
    if request is None:
        return None
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def _serialize_value(value):
    """Convert a value to a JSON-safe representation."""
    if value is None:
        return None
    try:
        json.dumps(value)
        return value
    except (TypeError, ValueError):
        return str(value)


def _get_field_values(instance):
    """Get a dict of field name → serializable value for the instance."""
    values = {}
    for field in instance._meta.concrete_fields:
        val = getattr(instance, field.attname, None)
        values[field.attname] = _serialize_value(val)
    return values


@receiver(pre_save)
def capture_old_values(sender, instance, **kwargs):
    """Store old values before save for comparison."""
    if not issubclass(sender, TimeStampedModel):
        return
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            instance._old_values = _get_field_values(old_instance)
        except sender.DoesNotExist:
            instance._old_values = None
    else:
        instance._old_values = None


@receiver(post_save)
def log_save(sender, instance, created, **kwargs):
    """Log CREATE or UPDATE after a successful save."""
    if not issubclass(sender, TimeStampedModel):
        return
    if sender is AuditLog:
        return

    request = get_current_request()
    action = "CREATE" if created else "UPDATE"
    old_values = getattr(instance, "_old_values", None)
    new_values = _get_field_values(instance)

    if not created and old_values:
        changed = {k: new_values[k] for k in new_values if old_values.get(k) != new_values[k]}
        if not changed:
            return
        old_values = {k: old_values[k] for k in changed}
        new_values = changed

    AuditLog.objects.create(
        user=getattr(request, "user", None) if request and hasattr(request, "user") and request.user.is_authenticated else None,
        action=action,
        model_name=sender.__name__,
        object_id=str(instance.pk),
        old_values=old_values,
        new_values=new_values if not created else _get_field_values(instance),
        ip_address=_get_client_ip(request),
        user_agent=request.META.get("HTTP_USER_AGENT") if request else None,
    )


@receiver(pre_delete)
def log_delete(sender, instance, **kwargs):
    """Log physical DELETE (should be rare — we use soft-delete)."""
    if not issubclass(sender, TimeStampedModel):
        return

    request = get_current_request()

    AuditLog.objects.create(
        user=getattr(request, "user", None) if request and hasattr(request, "user") and request.user.is_authenticated else None,
        action="DELETE",
        model_name=sender.__name__,
        object_id=str(instance.pk),
        old_values=_get_field_values(instance),
        new_values=None,
        ip_address=_get_client_ip(request),
        user_agent=request.META.get("HTTP_USER_AGENT") if request else None,
    )
