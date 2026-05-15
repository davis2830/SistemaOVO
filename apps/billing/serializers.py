"""Serializers for billing."""
from rest_framework import serializers

from .models import Invoice, InvoiceItem


class InvoiceItemSerializer(serializers.ModelSerializer):
    product_code = serializers.CharField(source="product.code", read_only=True)

    class Meta:
        model = InvoiceItem
        fields = (
            "id", "product", "product_code", "description",
            "display_unit", "display_qty", "unit_price",
            "discount", "subtotal",
        )
        read_only_fields = ("id",)


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, read_only=True)
    client_name = serializers.CharField(source="client.name", read_only=True)
    client_nit = serializers.CharField(source="client.nit", read_only=True)
    order_number = serializers.CharField(source="sales_order.order_number", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    document_type_display = serializers.CharField(source="get_document_type_display", read_only=True)

    class Meta:
        model = Invoice
        fields = (
            "id", "invoice_number", "sales_order", "order_number",
            "client", "client_name", "client_nit",
            "document_type", "document_type_display",
            "status", "status_display", "invoice_date",
            "subtotal", "discount", "total",
            "fel_uuid", "fel_series", "fel_number",
            "fel_certification_date", "fel_provider",
            "fel_error_message",
            "cancel_reason", "cancel_date", "cancel_fel_uuid",
            "items",
            "created_at", "updated_at",
        )
        read_only_fields = (
            "id", "invoice_number", "status", "subtotal", "discount", "total",
            "fel_uuid", "fel_series", "fel_number", "fel_certification_date",
            "fel_provider", "fel_error_message",
            "cancel_reason", "cancel_date", "cancel_fel_uuid",
            "created_at", "updated_at",
        )


class CreateInvoiceSerializer(serializers.Serializer):
    """Input: just the sales order ID."""
    sales_order = serializers.UUIDField()


class CancelInvoiceSerializer(serializers.Serializer):
    """Input for cancelling a certified invoice."""
    reason = serializers.CharField(min_length=10)
