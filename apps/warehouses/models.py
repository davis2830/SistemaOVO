"""Warehouse, inventory batches, and stock movements."""
from decimal import Decimal

from django.conf import settings
from django.db import models, transaction

from apps.core.exceptions import InsufficientStock
from apps.core.models import ActiveManager, TimeStampedModel


class Warehouse(TimeStampedModel):
    """Physical warehouse location."""

    name = models.CharField(max_length=120, unique=True)
    address = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True, db_index=True)

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "warehouses"
        ordering = ["name"]

    def __str__(self):
        return self.name


class InventoryBatch(TimeStampedModel):
    """
    A batch of product received into a warehouse.
    qty_initial / qty_remaining are always in BASE UNITS (individual eggs).
    """

    STATUS_CHOICES = [
        ("ACTIVE", "Activo"),
        ("DEPLETED", "Agotado"),
        ("EXPIRED", "Expirado"),
    ]

    batch_number = models.CharField(max_length=30, unique=True, db_index=True)
    warehouse = models.ForeignKey(
        Warehouse, on_delete=models.PROTECT, related_name="batches", db_index=True,
    )
    product = models.ForeignKey(
        "catalog.Product", on_delete=models.PROTECT, related_name="batches",
    )
    supplier = models.ForeignKey(
        "purchases.Supplier", null=True, blank=True, on_delete=models.PROTECT, related_name="batches",
    )
    qty_initial = models.DecimalField(max_digits=12, decimal_places=2, help_text="In base units.")
    qty_remaining = models.DecimalField(max_digits=12, decimal_places=2, help_text="In base units.")
    unit_cost = models.DecimalField(max_digits=12, decimal_places=4, help_text="Cost per base unit in GTQ.")
    entry_date = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="ACTIVE", db_index=True)

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "inventory_batches"
        ordering = ["entry_date", "batch_number"]

    def __str__(self):
        return f"{self.batch_number} ({self.product.code})"


class InventoryMovement(TimeStampedModel):
    """
    Every stock change is recorded as a movement.
    quantity: positive = entry, negative = exit.
    """

    TYPE_CHOICES = [
        ("ENTRADA", "Entrada"),
        ("SALIDA", "Salida"),
        ("AJUSTE", "Ajuste"),
        ("TRANSFERENCIA", "Transferencia"),
        ("DEVOLUCION", "Devolución"),
    ]

    REFERENCE_CHOICES = [
        ("PURCHASE", "Compra"),
        ("SALE", "Venta"),
        ("ADJUSTMENT", "Ajuste manual"),
        ("TRANSFER", "Transferencia"),
        ("RETURN", "Devolución"),
    ]

    movement_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    warehouse = models.ForeignKey(
        Warehouse, on_delete=models.PROTECT, related_name="movements", db_index=True,
    )
    product = models.ForeignKey(
        "catalog.Product", on_delete=models.PROTECT, related_name="movements", db_index=True,
    )
    batch = models.ForeignKey(
        InventoryBatch, on_delete=models.PROTECT, related_name="movements",
    )
    quantity = models.DecimalField(max_digits=12, decimal_places=2, help_text="+ entry / - exit, in base units.")
    reference_type = models.CharField(max_length=20, choices=REFERENCE_CHOICES, blank=True, default="")
    reference_id = models.UUIDField(null=True, blank=True, help_text="ID of the source document.")
    notes = models.TextField(blank=True, default="")

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "inventory_movements"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.movement_type} {self.quantity} — {self.product.code}"


class InventoryService:
    """
    Service layer for atomic inventory operations.
    All stock mutations go through here to guarantee consistency.
    """

    @staticmethod
    @transaction.atomic
    def record_entry(*, batch: InventoryBatch, quantity: Decimal, reference_type: str = "PURCHASE",
                     reference_id=None, notes: str = "", user=None) -> InventoryMovement:
        """Record a stock entry (positive movement)."""
        locked_batch = InventoryBatch.objects.select_for_update().get(pk=batch.pk)
        locked_batch.qty_remaining += quantity
        if locked_batch.status == "DEPLETED":
            locked_batch.status = "ACTIVE"
        locked_batch.save(update_fields=["qty_remaining", "status", "updated_at"])

        return InventoryMovement.objects.create(
            movement_type="ENTRADA",
            warehouse=locked_batch.warehouse,
            product=locked_batch.product,
            batch=locked_batch,
            quantity=quantity,
            reference_type=reference_type,
            reference_id=reference_id,
            notes=notes,
            created_by=user,
            updated_by=user,
        )

    @staticmethod
    @transaction.atomic
    def record_exit(*, batch: InventoryBatch, quantity: Decimal, reference_type: str = "SALE",
                    reference_id=None, notes: str = "", user=None) -> InventoryMovement:
        """Record a stock exit (negative movement). Raises InsufficientStock."""
        locked_batch = InventoryBatch.objects.select_for_update().get(pk=batch.pk)
        if locked_batch.qty_remaining < quantity:
            raise InsufficientStock(
                f"Lote {locked_batch.batch_number}: disponible={locked_batch.qty_remaining}, solicitado={quantity}"
            )
        locked_batch.qty_remaining -= quantity
        if locked_batch.qty_remaining == 0:
            locked_batch.status = "DEPLETED"
        locked_batch.save(update_fields=["qty_remaining", "status", "updated_at"])

        return InventoryMovement.objects.create(
            movement_type="SALIDA",
            warehouse=locked_batch.warehouse,
            product=locked_batch.product,
            batch=locked_batch,
            quantity=-quantity,
            reference_type=reference_type,
            reference_id=reference_id,
            notes=notes,
            created_by=user,
            updated_by=user,
        )

    @staticmethod
    @transaction.atomic
    def record_adjustment(*, batch: InventoryBatch, new_qty: Decimal, notes: str,
                          user=None) -> InventoryMovement:
        """Adjust stock to a new quantity. Notes are mandatory."""
        if not notes.strip():
            raise ValueError("Los ajustes de inventario requieren justificación.")
        locked_batch = InventoryBatch.objects.select_for_update().get(pk=batch.pk)
        diff = new_qty - locked_batch.qty_remaining
        locked_batch.qty_remaining = new_qty
        locked_batch.status = "DEPLETED" if new_qty == 0 else "ACTIVE"
        locked_batch.save(update_fields=["qty_remaining", "status", "updated_at"])

        return InventoryMovement.objects.create(
            movement_type="AJUSTE",
            warehouse=locked_batch.warehouse,
            product=locked_batch.product,
            batch=locked_batch,
            quantity=diff,
            reference_type="ADJUSTMENT",
            notes=notes,
            created_by=user,
            updated_by=user,
        )
