"""Purchase API views."""
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.catalog.models import Product
from apps.users.permissions import ModulePermission
from apps.warehouses.models import Warehouse

from .models import PurchaseEntry, Supplier
from .serializers import (
    PurchaseEntryCreateSerializer,
    PurchaseEntrySerializer,
    SupplierSerializer,
)
from .services import _generate_entry_number, process_purchase_entry


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = (IsAuthenticated, ModulePermission)
    permission_module = "inventory"
    search_fields = ("nit", "name", "trade_name")
    filterset_fields = ("is_active",)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete(self.request.user)


class PurchaseEntryViewSet(viewsets.ModelViewSet):
    queryset = PurchaseEntry.objects.select_related("supplier", "warehouse").prefetch_related("items__product", "items__batch").all()
    permission_classes = (IsAuthenticated, ModulePermission)
    permission_module = "inventory"
    filterset_fields = ("supplier", "warehouse", "status")
    ordering_fields = ("entry_date", "total_cost", "created_at")

    def get_serializer_class(self):
        if self.action == "create":
            return PurchaseEntryCreateSerializer
        return PurchaseEntrySerializer

    def create(self, request, *args, **kwargs):
        serializer = PurchaseEntryCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            supplier = Supplier.objects.get(pk=data["supplier"])
            warehouse = Warehouse.objects.get(pk=data["warehouse"])
        except (Supplier.DoesNotExist, Warehouse.DoesNotExist) as e:
            return Response(
                {"success": False, "error": {"code": "NOT_FOUND", "message": str(e)}},
                status=status.HTTP_404_NOT_FOUND,
            )

        items_data = []
        for item in data["items"]:
            try:
                product = Product.objects.get(pk=item["product"])
            except Product.DoesNotExist:
                return Response(
                    {"success": False, "error": {"code": "PRODUCT_NOT_FOUND", "message": f"Producto {item['product']} no encontrado."}},
                    status=status.HTTP_404_NOT_FOUND,
                )
            items_data.append({
                "product": product,
                "quantity_received": item["quantity_received"],
                "unit_cost": item["unit_cost"],
                "expiry_date": item.get("expiry_date"),
            })

        entry = PurchaseEntry.objects.create(
            entry_number=_generate_entry_number(),
            supplier=supplier,
            warehouse=warehouse,
            entry_date=data["entry_date"],
            notes=data.get("notes", ""),
            created_by=request.user,
            updated_by=request.user,
        )

        process_purchase_entry(entry, items_data, user=request.user)

        result = PurchaseEntrySerializer(
            PurchaseEntry.objects.select_related("supplier", "warehouse")
            .prefetch_related("items__product", "items__batch")
            .get(pk=entry.pk)
        ).data
        return Response({"success": True, "data": result}, status=status.HTTP_201_CREATED)

    def perform_destroy(self, instance):
        instance.soft_delete(self.request.user)
