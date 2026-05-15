"""Purchase entry service — creates batches and movements atomically."""
from django.db import transaction
from django.utils import timezone

from apps.warehouses.models import InventoryBatch, InventoryMovement


def _generate_entry_number():
    """Generate next sequential entry number: EC-YYYY-NNNN."""
    from .models import PurchaseEntry
    year = timezone.now().year
    prefix = f"EC-{year}-"
    last = (
        PurchaseEntry.all_objects
        .filter(entry_number__startswith=prefix)
        .order_by("-entry_number")
        .first()
    )
    if last:
        seq = int(last.entry_number.split("-")[-1]) + 1
    else:
        seq = 1
    return f"{prefix}{seq:04d}"


def _generate_batch_number(product_code: str):
    """Generate a unique batch number: LOT-PROD-YYYYMMDD-NNN."""
    today = timezone.now().strftime("%Y%m%d")
    prefix = f"LOT-{product_code}-{today}-"
    last = (
        InventoryBatch.all_objects
        .filter(batch_number__startswith=prefix)
        .order_by("-batch_number")
        .first()
    )
    if last:
        seq = int(last.batch_number.split("-")[-1]) + 1
    else:
        seq = 1
    return f"{prefix}{seq:03d}"


@transaction.atomic
def process_purchase_entry(purchase_entry, items_data, user=None):
    """
    Process a purchase entry: for each item, create an InventoryBatch
    and an initial ENTRADA movement.

    items_data: list of dicts with keys: product, quantity_received, unit_cost, expiry_date (optional)
    """
    from .models import PurchaseEntryItem

    total = 0
    for item_data in items_data:
        product = item_data["product"]
        qty = item_data["quantity_received"]
        cost = item_data["unit_cost"]
        subtotal = qty * cost

        batch = InventoryBatch.objects.create(
            batch_number=_generate_batch_number(product.code),
            warehouse=purchase_entry.warehouse,
            product=product,
            supplier=purchase_entry.supplier,
            qty_initial=qty,
            qty_remaining=qty,
            unit_cost=cost,
            entry_date=purchase_entry.entry_date,
            expiry_date=item_data.get("expiry_date"),
            created_by=user,
            updated_by=user,
        )

        InventoryMovement.objects.create(
            movement_type="ENTRADA",
            warehouse=purchase_entry.warehouse,
            product=product,
            batch=batch,
            quantity=qty,
            reference_type="PURCHASE",
            reference_id=purchase_entry.pk,
            notes=f"Compra {purchase_entry.entry_number}",
            created_by=user,
            updated_by=user,
        )

        PurchaseEntryItem.objects.create(
            purchase_entry=purchase_entry,
            product=product,
            quantity_received=qty,
            unit_cost=cost,
            subtotal=subtotal,
            expiry_date=item_data.get("expiry_date"),
            batch=batch,
            created_by=user,
            updated_by=user,
        )

        total += subtotal

    purchase_entry.total_cost = total
    purchase_entry.save(update_fields=["total_cost", "updated_at"])
    return purchase_entry
