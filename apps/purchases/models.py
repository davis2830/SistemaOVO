"""Suppliers and purchase entries — simplified for robustness without over-engineering."""
from django.db import models

from apps.core.models import ActiveManager, TimeStampedModel


class Supplier(TimeStampedModel):
    """Supplier (proveedor) of eggs."""

    nit = models.CharField(max_length=20, unique=True, db_index=True, help_text="NIT del proveedor.")
    name = models.CharField(max_length=200, db_index=True)
    trade_name = models.CharField(max_length=200, blank=True, default="", help_text="Nombre comercial.")
    address = models.TextField(blank=True, default="")
    phone = models.CharField(max_length=20, blank=True, default="")
    email = models.EmailField(max_length=254, blank=True, default="")
    contact_person = models.CharField(max_length=150, blank=True, default="")
    notes = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True, db_index=True)

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "suppliers"
        ordering = ["name"]

    def __str__(self):
        return f"{self.nit} — {self.name}"


class PurchaseEntry(TimeStampedModel):
    """
    A purchase entry records a delivery from a supplier.
    Simplified: no formal PO approval workflow.
    When created, it generates an InventoryBatch + initial movement automatically.
    """

    STATUS_CHOICES = [
        ("RECEIVED", "Recibido"),
        ("PARTIAL", "Parcial"),
        ("CANCELLED", "Anulado"),
    ]

    entry_number = models.CharField(max_length=20, unique=True, db_index=True, help_text="Auto: EC-2024-0001")
    supplier = models.ForeignKey(
        Supplier, on_delete=models.PROTECT, related_name="purchase_entries",
    )
    warehouse = models.ForeignKey(
        "warehouses.Warehouse", on_delete=models.PROTECT, related_name="purchase_entries",
    )
    entry_date = models.DateField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="RECEIVED")
    total_cost = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    notes = models.TextField(blank=True, default="")

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "purchase_entries"
        ordering = ["-entry_date"]

    def __str__(self):
        return f"{self.entry_number} — {self.supplier.name}"


class PurchaseEntryItem(TimeStampedModel):
    """Line items for a purchase entry."""

    purchase_entry = models.ForeignKey(
        PurchaseEntry, on_delete=models.CASCADE, related_name="items",
    )
    product = models.ForeignKey(
        "catalog.Product", on_delete=models.PROTECT, related_name="purchase_items",
    )
    quantity_received = models.DecimalField(max_digits=12, decimal_places=2, help_text="In base units.")
    unit_cost = models.DecimalField(max_digits=12, decimal_places=4, help_text="Cost per base unit.")
    subtotal = models.DecimalField(max_digits=14, decimal_places=2)
    expiry_date = models.DateField(null=True, blank=True)
    batch = models.ForeignKey(
        "warehouses.InventoryBatch",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="purchase_items",
        help_text="Auto-linked batch created on save.",
    )

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "purchase_entry_items"
        ordering = ["purchase_entry", "product"]

    def __str__(self):
        return f"{self.product.code} × {self.quantity_received}"
