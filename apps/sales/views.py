"""Sales API views."""
from decimal import Decimal

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.catalog.models import Product
from apps.clients.models import Client
from apps.users.permissions import ModulePermission
from apps.warehouses.models import Warehouse

from .models import SalesOrder
from .serializers import (
    OrderTransitionSerializer,
    SalesOrderCreateSerializer,
    SalesOrderSerializer,
)
from .services import cancel_order, confirm_order, create_sales_order, transition_order


class SalesOrderViewSet(viewsets.ModelViewSet):
    queryset = (
        SalesOrder.objects
        .select_related("client", "seller", "warehouse", "delivery_route")
        .prefetch_related("items__product", "items__batch")
        .all()
    )
    permission_classes = (IsAuthenticated, ModulePermission)
    permission_module = "sales"
    search_fields = ("order_number", "client__name", "client__nit")
    filterset_fields = ("status", "payment_type", "warehouse", "client", "seller", "delivery_route")
    ordering_fields = ("order_date", "total", "created_at")

    def get_serializer_class(self):
        if self.action == "create":
            return SalesOrderCreateSerializer
        return SalesOrderSerializer

    def create(self, request, *args, **kwargs):
        serializer = SalesOrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            client = Client.objects.get(pk=data["client"])
        except Client.DoesNotExist:
            return Response(
                {"success": False, "error": {"code": "CLIENT_NOT_FOUND", "message": "Cliente no encontrado."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            warehouse = Warehouse.objects.get(pk=data["warehouse"])
        except Warehouse.DoesNotExist:
            return Response(
                {"success": False, "error": {"code": "WAREHOUSE_NOT_FOUND", "message": "Bodega no encontrada."}},
                status=status.HTTP_404_NOT_FOUND,
            )

        delivery_route = None
        if data.get("delivery_route"):
            from apps.delivery_routes.models import DeliveryRoute
            try:
                delivery_route = DeliveryRoute.objects.get(pk=data["delivery_route"])
            except DeliveryRoute.DoesNotExist:
                return Response(
                    {"success": False, "error": {"code": "ROUTE_NOT_FOUND", "message": "Ruta no encontrada."}},
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
                "display_unit": item["display_unit"],
                "display_qty": item["display_qty"],
                "unit_price": item["unit_price"],
                "discount_pct": item.get("discount_pct", 0),
            })

        order = create_sales_order(
            client=client,
            seller=request.user,
            warehouse=warehouse,
            order_date=data["order_date"],
            items_data=items_data,
            payment_type=data.get("payment_type", "CONTADO"),
            delivery_route=delivery_route,
            delivery_date=data.get("delivery_date"),
            discount=Decimal(str(data.get("discount", 0))),
            notes=data.get("notes", ""),
            user=request.user,
        )

        result = SalesOrderSerializer(
            SalesOrder.objects
            .select_related("client", "seller", "warehouse", "delivery_route")
            .prefetch_related("items__product", "items__batch")
            .get(pk=order.pk)
        ).data
        return Response({"success": True, "data": result}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="transition")
    def transition(self, request, pk=None):
        """POST /api/v1/sales/orders/{id}/transition/ — change order status."""
        order = self.get_object()
        serializer = OrderTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action_name = serializer.validated_data["action"]
        notes = serializer.validated_data.get("notes", "")

        ACTION_MAP = {
            "confirm": lambda: confirm_order(order, user=request.user),
            "dispatch": lambda: transition_order(order, "DISPATCHED", user=request.user),
            "deliver": lambda: transition_order(order, "DELIVERED", user=request.user),
            "cancel": lambda: cancel_order(order, notes=notes, user=request.user),
        }

        handler = ACTION_MAP.get(action_name)
        if not handler:
            return Response(
                {"success": False, "error": {"code": "INVALID_ACTION", "message": f"Acción '{action_name}' no válida."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        updated_order = handler()
        result = SalesOrderSerializer(
            SalesOrder.objects
            .select_related("client", "seller", "warehouse", "delivery_route")
            .prefetch_related("items__product", "items__batch")
            .get(pk=updated_order.pk)
        ).data
        return Response({"success": True, "data": result})

    def perform_destroy(self, instance):
        instance.soft_delete(self.request.user)
