"""Serializers for clients."""
from rest_framework import serializers

from .models import Client


class ClientSerializer(serializers.ModelSerializer):
    price_list_name = serializers.CharField(source="price_list.name", read_only=True, default=None)

    class Meta:
        model = Client
        fields = (
            "id", "nit", "name", "trade_name", "address",
            "phone", "email", "client_type", "classification",
            "price_list", "price_list_name", "notes",
            "is_active", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
