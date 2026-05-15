from django.contrib import admin

from .models import Invoice, InvoiceItem


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 0
    readonly_fields = ("subtotal",)


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = (
        "invoice_number", "client", "document_type", "status",
        "total", "fel_uuid", "invoice_date",
    )
    list_filter = ("status", "document_type", "fel_provider")
    search_fields = ("invoice_number", "client__name", "client__nit", "fel_uuid")
    inlines = [InvoiceItemInline]
    readonly_fields = (
        "invoice_number", "subtotal", "total",
        "fel_uuid", "fel_series", "fel_number",
        "fel_certification_date", "fel_xml",
    )
