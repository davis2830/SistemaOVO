"""Billing API views."""
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.sales.models import SalesOrder
from apps.users.permissions import ModulePermission

from .models import Invoice
from .serializers import (
    CancelInvoiceSerializer,
    CreateInvoiceSerializer,
    InvoiceSerializer,
)
from .services import cancel_invoice, certify_invoice, create_invoice_from_order


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = (
        Invoice.objects
        .select_related("client", "sales_order")
        .prefetch_related("items__product")
        .all()
    )
    serializer_class = InvoiceSerializer
    permission_classes = (IsAuthenticated, ModulePermission)
    permission_module = "billing"
    search_fields = ("invoice_number", "client__name", "client__nit", "fel_uuid")
    filterset_fields = ("status", "document_type", "client")
    ordering_fields = ("invoice_date", "total", "created_at")

    def create(self, request, *args, **kwargs):
        serializer = CreateInvoiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            order = SalesOrder.objects.get(pk=serializer.validated_data["sales_order"])
        except SalesOrder.DoesNotExist:
            return Response(
                {"success": False, "error": {"code": "ORDER_NOT_FOUND", "message": "Pedido no encontrado."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        invoice = create_invoice_from_order(order, user=request.user)
        result = InvoiceSerializer(
            Invoice.objects
            .select_related("client", "sales_order")
            .prefetch_related("items__product")
            .get(pk=invoice.pk)
        ).data
        return Response({"success": True, "data": result}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="certify")
    def certify(self, request, pk=None):
        """POST /api/v1/billing/invoices/{id}/certify/ — send to FEL."""
        invoice = self.get_object()
        certified = certify_invoice(invoice, user=request.user)
        result = InvoiceSerializer(
            Invoice.objects
            .select_related("client", "sales_order")
            .prefetch_related("items__product")
            .get(pk=certified.pk)
        ).data
        return Response({"success": True, "data": result})

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel_invoice(self, request, pk=None):
        """POST /api/v1/billing/invoices/{id}/cancel/ — cancel via FEL."""
        invoice = self.get_object()
        serializer = CancelInvoiceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cancelled = cancel_invoice(
            invoice,
            reason=serializer.validated_data["reason"],
            user=request.user,
        )
        result = InvoiceSerializer(
            Invoice.objects
            .select_related("client", "sales_order")
            .prefetch_related("items__product")
            .get(pk=cancelled.pk)
        ).data
        return Response({"success": True, "data": result})

    def perform_destroy(self, instance):
        instance.soft_delete(self.request.user)
