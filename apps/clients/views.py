"""Client API views."""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.users.permissions import ModulePermission

from .models import Client
from .serializers import ClientSerializer


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.select_related("price_list").all()
    serializer_class = ClientSerializer
    permission_classes = (IsAuthenticated, ModulePermission)
    permission_module = "sales"
    search_fields = ("nit", "name", "trade_name")
    filterset_fields = ("client_type", "classification", "is_active", "price_list")
    ordering_fields = ("name", "nit", "created_at")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete(self.request.user)
