"""Credit account & payment views."""
from decimal import Decimal

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.users.permissions import ModulePermission

from .models import CreditAccount, CreditService, CreditTransaction
from .serializers import (
    CreditAccountSerializer,
    CreditTransactionSerializer,
    PaymentSerializer,
)


class CreditAccountViewSet(viewsets.ModelViewSet):
    queryset = CreditAccount.objects.select_related("client").all()
    serializer_class = CreditAccountSerializer
    permission_classes = (IsAuthenticated, ModulePermission)
    permission_module = "credits"
    search_fields = ("client__name", "client__nit")
    filterset_fields = ("is_active",)
    ordering_fields = ("current_balance", "credit_limit", "created_at")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete(self.request.user)

    @action(detail=False, methods=["post"], url_path="payment")
    def record_payment(self, request):
        """POST /api/v1/credits/accounts/payment/"""
        serializer = PaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            account = CreditAccount.objects.get(pk=data["account"])
        except CreditAccount.DoesNotExist:
            return Response(
                {"success": False, "error": {"code": "ACCOUNT_NOT_FOUND", "message": "Cuenta de crédito no encontrada."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        txn = CreditService.payment(
            account=account,
            amount=Decimal(str(data["amount"])),
            payment_method=data["payment_method"],
            reference_number=data.get("reference_number", ""),
            notes=data.get("notes", ""),
            user=request.user,
        )
        return Response({"success": True, "data": CreditTransactionSerializer(txn).data})


class CreditTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only: transactions are created through services."""
    queryset = CreditTransaction.objects.select_related("account__client", "created_by").all()
    serializer_class = CreditTransactionSerializer
    permission_classes = (IsAuthenticated, ModulePermission)
    permission_module = "credits"
    filterset_fields = ("account", "transaction_type", "payment_method")
    ordering_fields = ("amount", "created_at")
