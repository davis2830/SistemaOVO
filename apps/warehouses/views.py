"""Warehouse & inventory API views."""
from decimal import Decimal

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.exceptions import InsufficientStock
from apps.users.permissions import ModulePermission

from .models import InventoryBatch, InventoryMovement, InventoryService, Warehouse
from .serializers import (
    AdjustmentSerializer,
    InventoryBatchSerializer,
    InventoryMovementSerializer,
    WarehouseSerializer,
)


class WarehouseViewSet(viewsets.ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = (IsAuthenticated, ModulePermission)
    permission_module = "inventory"
    search_fields = ("name",)
    filterset_fields = ("is_active",)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete(self.request.user)


class InventoryBatchViewSet(viewsets.ModelViewSet):
    queryset = InventoryBatch.objects.select_related("warehouse", "product", "supplier").all()
    serializer_class = InventoryBatchSerializer
    permission_classes = (IsAuthenticated, ModulePermission)
    permission_module = "inventory"
    search_fields = ("batch_number", "product__code", "product__name")
    filterset_fields = ("warehouse", "product", "status", "supplier")
    ordering_fields = ("entry_date", "qty_remaining", "created_at")

    def perform_create(self, serializer):
        batch = serializer.save(
            qty_remaining=serializer.validated_data["qty_initial"],
            created_by=self.request.user,
            updated_by=self.request.user,
        )
        InventoryMovement.objects.create(
            movement_type="ENTRADA",
            warehouse=batch.warehouse,
            product=batch.product,
            batch=batch,
            quantity=batch.qty_initial,
            reference_type="PURCHASE",
            notes=f"Entrada inicial lote {batch.batch_number}",
            created_by=self.request.user,
            updated_by=self.request.user,
        )

    def perform_destroy(self, instance):
        instance.soft_delete(self.request.user)

    @action(detail=False, methods=["post"], url_path="adjust")
    def adjust_stock(self, request):
        """POST /api/v1/inventory/batches/adjust/ — manual adjustment."""
        serializer = AdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            batch = InventoryBatch.objects.get(pk=serializer.validated_data["batch"])
        except InventoryBatch.DoesNotExist:
            return Response(
                {"success": False, "error": {"code": "BATCH_NOT_FOUND", "message": "Lote no encontrado."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        movement = InventoryService.record_adjustment(
            batch=batch,
            new_qty=Decimal(str(serializer.validated_data["new_qty"])),
            notes=serializer.validated_data["notes"],
            user=request.user,
        )
        return Response({"success": True, "data": InventoryMovementSerializer(movement).data})


class InventoryMovementViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only: movements are created through services, not directly."""
    queryset = InventoryMovement.objects.select_related(
        "warehouse", "product", "batch", "created_by"
    ).all()
    serializer_class = InventoryMovementSerializer
    permission_classes = (IsAuthenticated, ModulePermission)
    permission_module = "inventory"
    filterset_fields = ("warehouse", "product", "movement_type", "reference_type")
    ordering_fields = ("created_at", "quantity")
