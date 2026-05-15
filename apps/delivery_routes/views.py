"""Delivery routes API views."""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.users.permissions import ModulePermission

from .models import DeliveryRoute
from .serializers import DeliveryRouteSerializer


class DeliveryRouteViewSet(viewsets.ModelViewSet):
    queryset = DeliveryRoute.objects.select_related("driver").all()
    serializer_class = DeliveryRouteSerializer
    permission_classes = (IsAuthenticated, ModulePermission)
    permission_module = "sales"
    search_fields = ("name", "zone")
    filterset_fields = ("is_active", "driver")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete(self.request.user)
