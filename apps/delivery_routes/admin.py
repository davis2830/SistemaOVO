from django.contrib import admin

from .models import DeliveryRoute


@admin.register(DeliveryRoute)
class DeliveryRouteAdmin(admin.ModelAdmin):
    list_display = ("name", "driver", "delivery_days", "zone", "is_active")
    list_filter = ("is_active", "zone")
    search_fields = ("name",)
