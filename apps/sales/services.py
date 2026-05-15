"""Sales service layer — order creation, confirmation with stock reservation, dispatch."""
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from apps.core.exceptions import BusinessLogicError, InsufficientStock
from apps.credits.models import CreditAccount, CreditService
from apps.warehouses.models import InventoryBatch, InventoryService


def _generate_order_number():
    """Generate next sequential order number: PED-YYYY-NNNN."""
    from .models import SalesOrder
    year = timezone.now().year
    prefix = f"PED-{year}-"
    last = (
        SalesOrder.all_objects
        .filter(order_number__startswith=prefix)
        .order_by("-order_number")
        .first()
    )
    if last:
        seq = int(last.order_number.split("-")[-1]) + 1
    else:
        seq = 1
    return f"{prefix}{seq:04d}"


def calculate_item_totals(item_data, product):
    """Calculate base units and subtotal for an order item."""
    qty_base = product.convert_to_base_units(
        float(item_data["display_qty"]), item_data["display_unit"]
    )
    subtotal = item_data["display_qty"] * item_data["unit_price"]
    if item_data.get("discount_pct", 0) > 0:
        subtotal *= (1 - item_data["discount_pct"] / 100)
    return Decimal(str(qty_base)), subtotal


@transaction.atomic
def create_sales_order(*, client, seller, warehouse, order_date, items_data,
                       payment_type="CONTADO", delivery_route=None,
                       delivery_date=None, discount=Decimal("0"), notes="", user=None):
    """
    Create a sales order in DRAFT status.
    items_data: list of dicts with product, display_unit, display_qty, unit_price, discount_pct
    """
    from .models import SalesOrder, SalesOrderItem

    order = SalesOrder.objects.create(
        order_number=_generate_order_number(),
        client=client,
        seller=seller,
        warehouse=warehouse,
        delivery_route=delivery_route,
        status="DRAFT",
        payment_type=payment_type,
        order_date=order_date,
        delivery_date=delivery_date,
        discount=discount,
        notes=notes,
        created_by=user,
        updated_by=user,
    )

    subtotal = Decimal("0")
    for item_data in items_data:
        product = item_data["product"]
        qty_base, item_subtotal = calculate_item_totals(item_data, product)

        SalesOrderItem.objects.create(
            order=order,
            product=product,
            display_unit=item_data["display_unit"],
            display_qty=item_data["display_qty"],
            qty_base_units=qty_base,
            unit_price=item_data["unit_price"],
            discount_pct=item_data.get("discount_pct", 0),
            subtotal=item_subtotal,
            created_by=user,
            updated_by=user,
        )
        subtotal += item_subtotal

    order.subtotal = subtotal
    order.total = subtotal - discount
    order.save(update_fields=["subtotal", "total", "updated_at"])
    return order


@transaction.atomic
def confirm_order(order, user=None):
    """
    Confirm a DRAFT order:
    1. Validate stock availability (FIFO batch assignment)
    2. Reserve stock (deduct from batches)
    3. If CREDITO, validate credit limit and charge
    4. Transition to CONFIRMED
    """
    from .models import SalesOrder

    if not order.can_transition_to("CONFIRMED"):
        raise BusinessLogicError(f"No se puede confirmar un pedido en estado {order.get_status_display()}.")

    locked_order = SalesOrder.objects.select_for_update().get(pk=order.pk)
    items = locked_order.items.select_related("product").all()

    for item in items:
        available = (
            InventoryBatch.objects
            .filter(
                warehouse=locked_order.warehouse,
                product=item.product,
                status="ACTIVE",
                is_deleted=False,
            )
            .order_by("entry_date")
        )

        remaining_need = item.qty_base_units
        assigned_batch = None

        for batch in available:
            if remaining_need <= 0:
                break
            if batch.qty_remaining >= remaining_need:
                InventoryService.record_exit(
                    batch=batch,
                    quantity=remaining_need,
                    reference_type="SALE",
                    reference_id=locked_order.pk,
                    notes=f"Pedido {locked_order.order_number}",
                    user=user,
                )
                assigned_batch = batch
                remaining_need = Decimal("0")
            else:
                remaining_need -= batch.qty_remaining
                InventoryService.record_exit(
                    batch=batch,
                    quantity=batch.qty_remaining,
                    reference_type="SALE",
                    reference_id=locked_order.pk,
                    notes=f"Pedido {locked_order.order_number} (parcial)",
                    user=user,
                )
                assigned_batch = batch

        if remaining_need > 0:
            raise InsufficientStock(
                f"Stock insuficiente para {item.product.code}: faltan {remaining_need} unidades base."
            )

        item.batch = assigned_batch
        item.save(update_fields=["batch", "updated_at"])

    if locked_order.payment_type == "CREDITO":
        try:
            credit_account = CreditAccount.objects.get(
                client=locked_order.client, is_active=True, is_deleted=False,
            )
        except CreditAccount.DoesNotExist:
            raise BusinessLogicError("El cliente no tiene cuenta de crédito activa.")

        CreditService.charge(
            account=credit_account,
            amount=locked_order.total,
            reference_type="SALE",
            reference_id=locked_order.pk,
            reference_number=locked_order.order_number,
            notes=f"Pedido {locked_order.order_number}",
            user=user,
        )

    locked_order.status = "CONFIRMED"
    locked_order.updated_by = user
    locked_order.save(update_fields=["status", "updated_by", "updated_at"])
    return locked_order


@transaction.atomic
def cancel_order(order, notes="", user=None):
    """
    Cancel an order:
    - If CONFIRMED/DISPATCHED: return stock to batches, reverse credit charge if applicable
    - DRAFT: just cancel
    """
    from .models import SalesOrder

    if not order.can_transition_to("CANCELLED"):
        raise BusinessLogicError(f"No se puede anular un pedido en estado {order.get_status_display()}.")

    locked_order = SalesOrder.objects.select_for_update().get(pk=order.pk)

    if locked_order.status in ("CONFIRMED", "DISPATCHED"):
        items = locked_order.items.select_related("batch").all()
        for item in items:
            if item.batch:
                InventoryService.record_entry(
                    batch=item.batch,
                    quantity=item.qty_base_units,
                    reference_type="RETURN",
                    reference_id=locked_order.pk,
                    notes=f"Anulación pedido {locked_order.order_number}",
                    user=user,
                )

        if locked_order.payment_type == "CREDITO":
            try:
                credit_account = CreditAccount.objects.get(
                    client=locked_order.client, is_active=True, is_deleted=False,
                )
                CreditService.adjustment(
                    account=credit_account,
                    amount=-locked_order.total,
                    notes=f"Anulación pedido {locked_order.order_number}",
                    user=user,
                )
            except CreditAccount.DoesNotExist:
                pass

    locked_order.status = "CANCELLED"
    locked_order.notes = f"{locked_order.notes}\n[ANULADO] {notes}".strip()
    locked_order.updated_by = user
    locked_order.save(update_fields=["status", "notes", "updated_by", "updated_at"])
    return locked_order


@transaction.atomic
def transition_order(order, new_status, user=None):
    """Generic transition for DISPATCHED / DELIVERED states."""
    if not order.can_transition_to(new_status):
        raise BusinessLogicError(
            f"Transición inválida: {order.get_status_display()} → {new_status}"
        )
    order.status = new_status
    order.updated_by = user
    order.save(update_fields=["status", "updated_by", "updated_at"])
    return order
