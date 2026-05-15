from django.contrib import admin

from .models import Client


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("nit", "name", "client_type", "classification", "is_active")
    list_filter = ("client_type", "classification", "is_active")
    search_fields = ("nit", "name", "trade_name")
