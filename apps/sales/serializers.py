"""Serializers for sales."""
from rest_framework import serializers

from .models import SalesOrder, SalesOrderItem


class SalesOrderItemSerializer(serializers.ModelSerializer):
    product_code = serializers.CharField(source="product.code", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    batch_number = serializers.CharField(source="batch.batch_number", read_only=True, default=None)

    class Meta:
        model = SalesOrderItem
        fields = (
            "id", "product", "product_code", "product_name",
            "display_unit", "display_qty", "qty_base_units",
            "unit_price", "discount_pct", "subtotal",
            "batch", "batch_number",
        )
        read_only_fields = ("id", "qty_base_units", "subtotal", "batch", "batch_number")


class SalesOrderItemInputSerializer(serializers.Serializer):
    """Input for creating order items."""
    product = serializers.UUIDField()
    display_unit = serializers.ChoiceField(choices=["UNIDAD", "CARTON", "CAJA"])
    display_qty = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0.01)
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=4, min_value=0)
    discount_pct = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, default=0)


class SalesOrderSerializer(serializers.ModelSerializer):
    items = SalesOrderItemSerializer(many=True, read_only=True)
    client_name = serializers.CharField(source="client.name", read_only=True)
    client_nit = serializers.CharField(source="client.nit", read_only=True)
    seller_name = serializers.CharField(source="seller.full_name", read_only=True)
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    route_name = serializers.CharField(source="delivery_route.name", read_only=True, default=None)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = SalesOrder
        fields = (
            "id", "order_number", "client", "client_name", "client_nit",
            "seller", "seller_name", "warehouse", "warehouse_name",
            "delivery_route", "route_name",
            "status", "status_display", "payment_type",
            "order_date", "delivery_date",
            "subtotal", "discount", "total",
            "notes", "items",
            "created_at", "updated_at",
        )
        read_only_fields = (
            "id", "order_number", "status", "subtotal", "total",
            "created_at", "updated_at",
        )


class SalesOrderCreateSerializer(serializers.Serializer):
    """Input for creating a complete sales order."""
    client = serializers.UUIDField()
    warehouse = serializers.UUIDField()
    delivery_route = serializers.UUIDField(required=False, allow_null=True, default=None)
    payment_type = serializers.ChoiceField(choices=["CONTADO", "CREDITO"], default="CONTADO")
    order_date = serializers.DateField()
    delivery_date = serializers.DateField(required=False, allow_null=True, default=None)
    discount = serializers.DecimalField(max_digits=14, decimal_places=2, required=False, default=0)
    notes = serializers.CharField(required=False, default="")
    items = SalesOrderItemInputSerializer(many=True, min_length=1)


class OrderTransitionSerializer(serializers.Serializer):
    """Input for transitioning an order's status."""
    action = serializers.ChoiceField(choices=["confirm", "dispatch", "deliver", "cancel"])
    notes = serializers.CharField(required=False, default="")
