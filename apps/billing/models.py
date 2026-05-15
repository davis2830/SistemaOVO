"""Invoice models — FEL electronic invoicing for Guatemala."""
from django.conf import settings
from django.db import models

from apps.core.models import ActiveManager, TimeStampedModel


class Invoice(TimeStampedModel):
    """
    Electronic invoice (Factura Electrónica en Línea — FEL).
    Generated from a DELIVERED SalesOrder.
    """

    STATUS_CHOICES = [
        ("DRAFT", "Borrador"),
        ("CERTIFIED", "Certificada"),
        ("CANCELLED", "Anulada"),
        ("ERROR", "Error"),
    ]

    DOCUMENT_TYPES = [
        ("FACT", "Factura"),
        ("FCAM", "Factura Cambiaria"),
        ("FPEQ", "Factura Pequeño Contribuyente"),
        ("NCRE", "Nota de Crédito"),
        ("NDEB", "Nota de Débito"),
    ]

    invoice_number = models.CharField(max_length=30, unique=True, db_index=True, help_text="Auto: FAC-YYYY-NNNN")
    sales_order = models.ForeignKey(
        "sales.SalesOrder", on_delete=models.PROTECT, related_name="invoices",
    )
    client = models.ForeignKey(
        "clients.Client", on_delete=models.PROTECT, related_name="invoices",
    )
    document_type = models.CharField(max_length=4, choices=DOCUMENT_TYPES, default="FACT")
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="DRAFT", db_index=True)
    invoice_date = models.DateField()

    # Totals
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    # FEL certification fields
    fel_uuid = models.CharField(max_length=80, blank=True, default="", db_index=True, help_text="UUID asignado por SAT.")
    fel_series = models.CharField(max_length=30, blank=True, default="")
    fel_number = models.CharField(max_length=30, blank=True, default="")
    fel_certification_date = models.DateTimeField(null=True, blank=True)
    fel_xml = models.TextField(blank=True, default="", help_text="XML firmado y certificado.")
    fel_provider = models.CharField(max_length=30, blank=True, default="", help_text="Certificador usado.")
    fel_error_message = models.TextField(blank=True, default="")

    # Cancellation fields
    cancel_reason = models.TextField(blank=True, default="")
    cancel_date = models.DateTimeField(null=True, blank=True)
    cancel_fel_uuid = models.CharField(max_length=80, blank=True, default="")

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "invoices"
        ordering = ["-invoice_date", "-created_at"]

    def __str__(self):
        return f"{self.invoice_number} — {self.client.name}"


class InvoiceItem(TimeStampedModel):
    """Line items for an invoice."""

    invoice = models.ForeignKey(
        Invoice, on_delete=models.CASCADE, related_name="items",
    )
    product = models.ForeignKey(
        "catalog.Product", on_delete=models.PROTECT, related_name="invoice_items",
    )
    description = models.CharField(max_length=200)
    display_unit = models.CharField(max_length=20)
    display_qty = models.DecimalField(max_digits=12, decimal_places=2)
    unit_price = models.DecimalField(max_digits=12, decimal_places=4)
    discount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    subtotal = models.DecimalField(max_digits=14, decimal_places=2)

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "invoice_items"
        ordering = ["invoice", "created_at"]

    def __str__(self):
        return f"{self.display_qty} {self.display_unit} {self.product.code}"
