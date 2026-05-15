from django.contrib import admin

from .models import PriceList, PriceListItem, Product, ProductCategory


@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active", "created_at")
    search_fields = ("name",)


class PriceListItemInline(admin.TabularInline):
    model = PriceListItem
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "category", "base_unit", "units_per_carton", "cartons_per_box", "is_active")
    list_filter = ("category", "is_active")
    search_fields = ("code", "name")


@admin.register(PriceList)
class PriceListAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active", "created_at")
    inlines = [PriceListItemInline]


@admin.register(PriceListItem)
class PriceListItemAdmin(admin.ModelAdmin):
    list_display = ("price_list", "product", "unit", "price", "valid_from", "valid_to")
    list_filter = ("price_list", "unit")
    search_fields = ("product__code", "product__name")
