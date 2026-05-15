from django.contrib import admin

from .models import CreditAccount, CreditTransaction


@admin.register(CreditAccount)
class CreditAccountAdmin(admin.ModelAdmin):
    list_display = ("client", "credit_limit", "current_balance", "is_active")
    list_filter = ("is_active",)
    search_fields = ("client__name", "client__nit")


@admin.register(CreditTransaction)
class CreditTransactionAdmin(admin.ModelAdmin):
    list_display = ("account", "transaction_type", "amount", "balance_after", "payment_method", "created_at")
    list_filter = ("transaction_type", "payment_method")
    search_fields = ("account__client__name", "reference_number")
    readonly_fields = (
        "account", "transaction_type", "amount", "balance_after",
        "payment_method", "reference_type", "reference_id", "reference_number",
        "notes", "created_at",
    )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
