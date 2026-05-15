"""Serializers for the catalog module."""
from rest_framework import serializers

from .models import PriceList, PriceListItem, Product, ProductCategory


class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = ("id", "name", "description", "is_active", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True, default=None)
    units_per_box = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "code",
            "name",
            "category",
            "category_name",
            "base_unit",
            "units_per_carton",
            "cartons_per_box",
            "units_per_box",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class PriceListSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceList
        fields = ("id", "name", "description", "is_active", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")


class PriceListItemSerializer(serializers.ModelSerializer):
    product_code = serializers.CharField(source="product.code", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    price_list_name = serializers.CharField(source="price_list.name", read_only=True)

    class Meta:
        model = PriceListItem
        fields = (
            "id",
            "price_list",
            "price_list_name",
            "product",
            "product_code",
            "product_name",
            "unit",
            "price",
            "valid_from",
            "valid_to",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
