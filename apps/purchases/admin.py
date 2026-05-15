from django.contrib import admin

from .models import PurchaseEntry, PurchaseEntryItem, Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ("nit", "name", "phone", "is_active")
    search_fields = ("nit", "name")
    list_filter = ("is_active",)


class PurchaseEntryItemInline(admin.TabularInline):
    model = PurchaseEntryItem
    extra = 0
    readonly_fields = ("batch",)


@admin.register(PurchaseEntry)
class PurchaseEntryAdmin(admin.ModelAdmin):
    list_display = ("entry_number", "supplier", "warehouse", "entry_date", "total_cost", "status")
    list_filter = ("status", "warehouse")
    search_fields = ("entry_number", "supplier__name")
    inlines = [PurchaseEntryItemInline]
