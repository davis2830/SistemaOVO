from django.contrib import admin

from .models import SalesOrder, SalesOrderItem


class SalesOrderItemInline(admin.TabularInline):
    model = SalesOrderItem
    extra = 0
    readonly_fields = ("qty_base_units", "subtotal", "batch")


@admin.register(SalesOrder)
class SalesOrderAdmin(admin.ModelAdmin):
    list_display = ("order_number", "client", "seller", "status", "payment_type", "total", "order_date")
    list_filter = ("status", "payment_type", "warehouse")
    search_fields = ("order_number", "client__name", "client__nit")
    inlines = [SalesOrderItemInline]
    readonly_fields = ("order_number", "subtotal", "total")
