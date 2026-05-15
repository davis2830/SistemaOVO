"""Billing service layer — invoice creation, FEL certification, cancellation."""
from django.db import transaction
from django.utils import timezone

from apps.core.exceptions import BusinessLogicError
from apps.sales.models import SalesOrder

from .fel_providers.base import FELProvider
from .fel_providers.mock_provider import MockFELProvider
from .xml_builder import build_invoice_xml


def _get_fel_provider() -> FELProvider:
    """
    Return the configured FEL provider.
    TODO: Read from settings/DB to support runtime switching.
    """
    return MockFELProvider()


def _generate_invoice_number():
    """Generate next sequential invoice number: FAC-YYYY-NNNN."""
    from .models import Invoice
    year = timezone.now().year
    prefix = f"FAC-{year}-"
    last = (
        Invoice.all_objects
        .filter(invoice_number__startswith=prefix)
        .order_by("-invoice_number")
        .first()
    )
    if last:
        seq = int(last.invoice_number.split("-")[-1]) + 1
    else:
        seq = 1
    return f"{prefix}{seq:04d}"


@transaction.atomic
def create_invoice_from_order(order, user=None):
    """
    Generate an invoice from a DELIVERED sales order.
    Copies items from the order to invoice items.
    """
    from .models import Invoice, InvoiceItem

    if order.status != "DELIVERED":
        raise BusinessLogicError(
            f"Solo se pueden facturar pedidos ENTREGADOS. Estado actual: {order.get_status_display()}"
        )

    if order.invoices.filter(status__in=["DRAFT", "CERTIFIED"]).exists():
        raise BusinessLogicError("Este pedido ya tiene una factura activa.")

    invoice = Invoice.objects.create(
        invoice_number=_generate_invoice_number(),
        sales_order=order,
        client=order.client,
        document_type="FACT",
        invoice_date=timezone.now().date(),
        subtotal=order.subtotal,
        discount=order.discount,
        total=order.total,
        created_by=user,
        updated_by=user,
    )

    for order_item in order.items.select_related("product").all():
        InvoiceItem.objects.create(
            invoice=invoice,
            product=order_item.product,
            description=f"{order_item.product.name} ({order_item.display_unit})",
            display_unit=order_item.display_unit,
            display_qty=order_item.display_qty,
            unit_price=order_item.unit_price,
            discount=0,
            subtotal=order_item.subtotal,
            created_by=user,
            updated_by=user,
        )

    return invoice


@transaction.atomic
def certify_invoice(invoice, user=None):
    """
    Send invoice to FEL provider for certification.
    Updates invoice with UUID, series, number, signed XML.
    """
    from .models import Invoice

    if invoice.status != "DRAFT":
        raise BusinessLogicError(f"Solo se pueden certificar facturas en BORRADOR. Estado: {invoice.status}")

    locked = Invoice.objects.select_for_update().get(pk=invoice.pk)
    provider = _get_fel_provider()
    xml = build_invoice_xml(locked)

    result = provider.certify(xml)

    if result.success:
        locked.status = "CERTIFIED"
        locked.fel_uuid = result.uuid
        locked.fel_series = result.series
        locked.fel_number = result.number
        locked.fel_xml = result.signed_xml
        locked.fel_provider = provider.provider_name
        locked.fel_certification_date = timezone.now()
        locked.fel_error_message = ""

        # Transition the sales order to INVOICED
        order = locked.sales_order
        if order.can_transition_to("INVOICED"):
            order.status = "INVOICED"
            order.updated_by = user
            order.save(update_fields=["status", "updated_by", "updated_at"])
    else:
        locked.status = "ERROR"
        locked.fel_error_message = result.error_message
        locked.fel_provider = provider.provider_name

    locked.updated_by = user
    locked.save(update_fields=[
        "status", "fel_uuid", "fel_series", "fel_number", "fel_xml",
        "fel_provider", "fel_certification_date", "fel_error_message",
        "updated_by", "updated_at",
    ])
    return locked


@transaction.atomic
def cancel_invoice(invoice, reason, user=None):
    """Cancel a certified invoice via FEL provider."""
    from .models import Invoice

    if invoice.status != "CERTIFIED":
        raise BusinessLogicError("Solo se pueden anular facturas CERTIFICADAS.")

    if not reason.strip():
        raise BusinessLogicError("Se requiere motivo de anulación.")

    locked = Invoice.objects.select_for_update().get(pk=invoice.pk)
    provider = _get_fel_provider()

    result = provider.cancel(locked.fel_uuid, reason)

    if result.success:
        locked.status = "CANCELLED"
        locked.cancel_reason = reason
        locked.cancel_date = timezone.now()
        locked.cancel_fel_uuid = result.cancel_uuid
    else:
        locked.fel_error_message = f"Error al anular: {result.error_message}"

    locked.updated_by = user
    locked.save(update_fields=[
        "status", "cancel_reason", "cancel_date", "cancel_fel_uuid",
        "fel_error_message", "updated_by", "updated_at",
    ])
    return locked
