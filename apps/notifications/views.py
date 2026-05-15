"""Notifications API views."""
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.users.permissions import ModulePermission

from .models import NotificationLog, NotificationTemplate
from .serializers import NotificationLogSerializer, NotificationTemplateSerializer
from .services import mark_as_read


class NotificationTemplateViewSet(viewsets.ModelViewSet):
    queryset = NotificationTemplate.objects.all()
    serializer_class = NotificationTemplateSerializer
    permission_classes = (IsAuthenticated, ModulePermission)
    permission_module = "notifications"
    search_fields = ("code", "name")
    filterset_fields = ("channel", "is_active")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete(self.request.user)


class NotificationLogViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Read-only list of notifications for the current user."""
    serializer_class = NotificationLogSerializer
    permission_classes = (IsAuthenticated,)
    filterset_fields = ("status", "channel")

    def get_queryset(self):
        return (
            NotificationLog.objects
            .filter(recipient=self.request.user)
            .select_related("template", "recipient")
        )

    @action(detail=True, methods=["post"], url_path="read")
    def mark_read(self, request, pk=None):
        """POST /api/v1/notifications/my/{id}/read/"""
        notification = self.get_object()
        updated = mark_as_read(notification)
        return Response({"success": True, "status": updated.status})
