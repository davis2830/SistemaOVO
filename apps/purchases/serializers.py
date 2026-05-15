"""Serializers for purchases."""
from rest_framework import serializers

from .models import PurchaseEntry, PurchaseEntryItem, Supplier


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = (
            "id", "nit", "name", "trade_name", "address",
            "phone", "email", "contact_person", "notes",
            "is_active", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class PurchaseEntryItemSerializer(serializers.ModelSerializer):
    product_code = serializers.CharField(source="product.code", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    batch_number = serializers.CharField(source="batch.batch_number", read_only=True, default=None)

    class Meta:
        model = PurchaseEntryItem
        fields = (
            "id", "product", "product_code", "product_name",
            "quantity_received", "unit_cost", "subtotal",
            "expiry_date", "batch", "batch_number",
        )
        read_only_fields = ("id", "subtotal", "batch", "batch_number")


class PurchaseEntryItemInputSerializer(serializers.Serializer):
    """Input for creating purchase entry items."""
    product = serializers.UUIDField()
    quantity_received = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0.01)
    unit_cost = serializers.DecimalField(max_digits=12, decimal_places=4, min_value=0)
    expiry_date = serializers.DateField(required=False, allow_null=True, default=None)


class PurchaseEntrySerializer(serializers.ModelSerializer):
    items = PurchaseEntryItemSerializer(many=True, read_only=True)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)

    class Meta:
        model = PurchaseEntry
        fields = (
            "id", "entry_number", "supplier", "supplier_name",
            "warehouse", "warehouse_name", "entry_date",
            "status", "total_cost", "notes", "items",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "entry_number", "total_cost", "status", "created_at", "updated_at")


class PurchaseEntryCreateSerializer(serializers.Serializer):
    """Input for creating a complete purchase entry with items."""
    supplier = serializers.UUIDField()
    warehouse = serializers.UUIDField()
    entry_date = serializers.DateField()
    notes = serializers.CharField(required=False, default="")
    items = PurchaseEntryItemInputSerializer(many=True, min_length=1)
