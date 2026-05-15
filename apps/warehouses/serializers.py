"""Serializers for warehouses & inventory."""
from rest_framework import serializers

from .models import InventoryBatch, InventoryMovement, Warehouse


class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = ("id", "name", "address", "is_active", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class InventoryBatchSerializer(serializers.ModelSerializer):
    product_code = serializers.CharField(source="product.code", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True, default=None)

    class Meta:
        model = InventoryBatch
        fields = (
            "id", "batch_number", "warehouse", "warehouse_name",
            "product", "product_code", "product_name",
            "supplier", "supplier_name",
            "qty_initial", "qty_remaining", "unit_cost",
            "entry_date", "expiry_date", "status",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "qty_remaining", "status", "created_at", "updated_at")


class InventoryMovementSerializer(serializers.ModelSerializer):
    product_code = serializers.CharField(source="product.code", read_only=True)
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    batch_number = serializers.CharField(source="batch.batch_number", read_only=True)
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True, default=None)

    class Meta:
        model = InventoryMovement
        fields = (
            "id", "movement_type", "warehouse", "warehouse_name",
            "product", "product_code", "batch", "batch_number",
            "quantity", "reference_type", "reference_id", "notes",
            "created_by_name", "created_at",
        )
        read_only_fields = ("id", "created_at")


class AdjustmentSerializer(serializers.Serializer):
    """Input for manual stock adjustment."""
    batch = serializers.UUIDField()
    new_qty = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)
    notes = serializers.CharField(min_length=5)
