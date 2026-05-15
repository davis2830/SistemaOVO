"""Catalog API views — products, categories, price lists."""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.users.permissions import ModulePermission

from .models import PriceList, PriceListItem, Product, ProductCategory
from .serializers import (
    PriceListItemSerializer,
    PriceListSerializer,
    ProductCategorySerializer,
    ProductSerializer,
)


class ProductCategoryViewSet(viewsets.ModelViewSet):
    """CRUD for product categories."""

    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer
    permission_classes = (IsAuthenticated, ModulePermission)
    permission_module = "catalog"
    search_fields = ("name",)
    filterset_fields = ("is_active",)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete(self.request.user)


class ProductViewSet(viewsets.ModelViewSet):
    """CRUD for products."""

    queryset = Product.objects.select_related("category").all()
    serializer_class = ProductSerializer
    permission_classes = (IsAuthenticated, ModulePermission)
    permission_module = "catalog"
    search_fields = ("code", "name")
    filterset_fields = ("category", "is_active", "base_unit")
    ordering_fields = ("code", "name", "created_at")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete(self.request.user)


class PriceListViewSet(viewsets.ModelViewSet):
    """CRUD for price lists."""

    queryset = PriceList.objects.all()
    serializer_class = PriceListSerializer
    permission_classes = (IsAuthenticated, ModulePermission)
    permission_module = "catalog"
    search_fields = ("name",)
    filterset_fields = ("is_active",)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete(self.request.user)


class PriceListItemViewSet(viewsets.ModelViewSet):
    """CRUD for price list items."""

    queryset = PriceListItem.objects.select_related("price_list", "product").all()
    serializer_class = PriceListItemSerializer
    permission_classes = (IsAuthenticated, ModulePermission)
    permission_module = "catalog"
    filterset_fields = ("price_list", "product", "unit")
    ordering_fields = ("price", "valid_from")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete(self.request.user)
