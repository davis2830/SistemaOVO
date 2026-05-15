from django.contrib import admin

from .models import InventoryBatch, InventoryMovement, Warehouse


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active", "created_at")
    search_fields = ("name",)


@admin.register(InventoryBatch)
class InventoryBatchAdmin(admin.ModelAdmin):
    list_display = ("batch_number", "warehouse", "product", "qty_initial", "qty_remaining", "status", "entry_date")
    list_filter = ("status", "warehouse")
    search_fields = ("batch_number", "product__code")


@admin.register(InventoryMovement)
class InventoryMovementAdmin(admin.ModelAdmin):
    list_display = ("movement_type", "warehouse", "product", "batch", "quantity", "reference_type", "created_at")
    list_filter = ("movement_type", "reference_type", "warehouse")
    search_fields = ("product__code", "batch__batch_number")
    readonly_fields = ("movement_type", "warehouse", "product", "batch", "quantity", "reference_type", "reference_id", "notes", "created_at")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
