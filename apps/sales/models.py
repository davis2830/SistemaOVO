"""Sales orders and order items."""
from django.conf import settings
from django.db import models

from apps.core.models import ActiveManager, TimeStampedModel


class SalesOrder(TimeStampedModel):
    """
    A sales order (pedido) for a client.
    Flow: DRAFT → CONFIRMED → DISPATCHED → DELIVERED → INVOICED
    Can also be CANCELLED at any point before INVOICED.
    """

    STATUS_CHOICES = [
        ("DRAFT", "Borrador"),
        ("CONFIRMED", "Confirmado"),
        ("DISPATCHED", "Despachado"),
        ("DELIVERED", "Entregado"),
        ("INVOICED", "Facturado"),
        ("CANCELLED", "Anulado"),
    ]

    PAYMENT_TYPE_CHOICES = [
        ("CONTADO", "Contado"),
        ("CREDITO", "Crédito"),
    ]

    order_number = models.CharField(max_length=20, unique=True, db_index=True, help_text="Auto: PED-YYYY-NNNN")
    client = models.ForeignKey(
        "clients.Client", on_delete=models.PROTECT, related_name="sales_orders",
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="sales_orders",
        help_text="Vendedor asignado.",
    )
    warehouse = models.ForeignKey(
        "warehouses.Warehouse", on_delete=models.PROTECT, related_name="sales_orders",
    )
    delivery_route = models.ForeignKey(
        "delivery_routes.DeliveryRoute",
        null=True, blank=True, on_delete=models.SET_NULL, related_name="sales_orders",
    )
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="DRAFT", db_index=True)
    payment_type = models.CharField(max_length=10, choices=PAYMENT_TYPE_CHOICES, default="CONTADO")
    order_date = models.DateField()
    delivery_date = models.DateField(null=True, blank=True)
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    notes = models.TextField(blank=True, default="")

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "sales_orders"
        ordering = ["-order_date", "-created_at"]

    def __str__(self):
        return f"{self.order_number} — {self.client.name}"

    VALID_TRANSITIONS = {
        "DRAFT": ("CONFIRMED", "CANCELLED"),
        "CONFIRMED": ("DISPATCHED", "CANCELLED"),
        "DISPATCHED": ("DELIVERED", "CANCELLED"),
        "DELIVERED": ("INVOICED",),
        "INVOICED": (),
        "CANCELLED": (),
    }

    def can_transition_to(self, new_status: str) -> bool:
        return new_status in self.VALID_TRANSITIONS.get(self.status, ())


class SalesOrderItem(TimeStampedModel):
    """Line items for a sales order — quantities in base units (eggs)."""

    order = models.ForeignKey(
        SalesOrder, on_delete=models.CASCADE, related_name="items",
    )
    product = models.ForeignKey(
        "catalog.Product", on_delete=models.PROTECT, related_name="sales_items",
    )
    display_unit = models.CharField(
        max_length=20, choices=[("UNIDAD", "Unidad"), ("CARTON", "Cartón"), ("CAJA", "Caja")],
        default="CAJA", help_text="Unit shown to user on the order.",
    )
    display_qty = models.DecimalField(
        max_digits=12, decimal_places=2, help_text="Quantity in display_unit.",
    )
    qty_base_units = models.DecimalField(
        max_digits=12, decimal_places=2, help_text="Quantity in base units (eggs) — auto-calculated.",
    )
    unit_price = models.DecimalField(max_digits=12, decimal_places=4, help_text="Price per display_unit.")
    discount_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    subtotal = models.DecimalField(max_digits=14, decimal_places=2)
    batch = models.ForeignKey(
        "warehouses.InventoryBatch",
        null=True, blank=True, on_delete=models.SET_NULL, related_name="sales_items",
        help_text="Batch assigned on confirmation (FIFO).",
    )

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "sales_order_items"
        ordering = ["order", "created_at"]

    def __str__(self):
        return f"{self.display_qty} {self.display_unit} {self.product.code}"
