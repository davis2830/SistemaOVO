"""Serializers for delivery routes."""
from rest_framework import serializers

from .models import DeliveryRoute


class DeliveryRouteSerializer(serializers.ModelSerializer):
    driver_name = serializers.CharField(source="driver.full_name", read_only=True, default=None)
    days_list = serializers.ListField(read_only=True)

    class Meta:
        model = DeliveryRoute
        fields = (
            "id", "name", "description", "driver", "driver_name",
            "delivery_days", "days_list", "zone",
            "is_active", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
