"""Serializers for credits."""
from rest_framework import serializers

from .models import CreditAccount, CreditTransaction


class CreditAccountSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source="client.name", read_only=True)
    client_nit = serializers.CharField(source="client.nit", read_only=True)
    available_credit = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    utilization_pct = serializers.FloatField(read_only=True)

    class Meta:
        model = CreditAccount
        fields = (
            "id", "client", "client_name", "client_nit",
            "credit_limit", "current_balance", "available_credit",
            "utilization_pct", "is_active",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "current_balance", "created_at", "updated_at")


class CreditTransactionSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source="account.client.name", read_only=True)
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True, default=None)

    class Meta:
        model = CreditTransaction
        fields = (
            "id", "account", "client_name", "transaction_type",
            "amount", "balance_after", "payment_method",
            "reference_type", "reference_id", "reference_number",
            "notes", "created_by_name", "created_at",
        )
        read_only_fields = ("id", "balance_after", "created_at")


class PaymentSerializer(serializers.Serializer):
    """Input for recording a payment."""
    account = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0.01)
    payment_method = serializers.ChoiceField(choices=CreditTransaction.PAYMENT_METHODS)
    reference_number = serializers.CharField(required=False, default="")
    notes = serializers.CharField(required=False, default="")
