"""Product catalog models — products, categories, price lists."""
from django.db import models

from apps.core.models import ActiveManager, TimeStampedModel


class ProductCategory(TimeStampedModel):
    """Product categories (e.g. Huevo Blanco, Huevo Rojo)."""

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "product_categories"
        verbose_name_plural = "Product Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Product(TimeStampedModel):
    """
    Products with unit conversion: Caja → Cartón → Huevo (unidad base).
    All inventory quantities are stored in base units (individual eggs).
    """

    UNIT_CHOICES = [
        ("UNIDAD", "Unidad (huevo)"),
        ("CARTON", "Cartón"),
        ("CAJA", "Caja"),
    ]

    code = models.CharField(max_length=20, unique=True, db_index=True)
    name = models.CharField(max_length=120)
    category = models.ForeignKey(
        ProductCategory,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="products",
    )
    base_unit = models.CharField(max_length=20, choices=UNIT_CHOICES, default="UNIDAD")
    units_per_carton = models.SmallIntegerField(
        default=30,
        help_text="Number of individual eggs per carton.",
    )
    cartons_per_box = models.SmallIntegerField(
        default=24,
        help_text="Number of cartons per box.",
    )
    is_active = models.BooleanField(default=True, db_index=True)

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "products"
        ordering = ["code"]

    def __str__(self):
        return f"{self.code} — {self.name}"

    @property
    def units_per_box(self):
        """Total base units (eggs) in a box."""
        return self.units_per_carton * self.cartons_per_box

    def convert_to_base_units(self, quantity: float, unit: str) -> float:
        """Convert a quantity in the given unit to base units (eggs)."""
        if unit == "UNIDAD":
            return quantity
        elif unit == "CARTON":
            return quantity * self.units_per_carton
        elif unit == "CAJA":
            return quantity * self.units_per_box
        raise ValueError(f"Unidad desconocida: {unit}")

    def convert_from_base_units(self, base_qty: float, target_unit: str) -> float:
        """Convert base units (eggs) to the target unit."""
        if target_unit == "UNIDAD":
            return base_qty
        elif target_unit == "CARTON":
            return base_qty / self.units_per_carton
        elif target_unit == "CAJA":
            return base_qty / self.units_per_box
        raise ValueError(f"Unidad desconocida: {target_unit}")


class PriceList(TimeStampedModel):
    """Named price lists (e.g. Mayorista, Minorista, Especial)."""

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "price_lists"
        ordering = ["name"]

    def __str__(self):
        return self.name


class PriceListItem(TimeStampedModel):
    """Price per product per unit within a price list, with validity dates."""

    UNIT_CHOICES = Product.UNIT_CHOICES

    price_list = models.ForeignKey(
        PriceList,
        on_delete=models.CASCADE,
        related_name="items",
        db_index=True,
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="price_items",
    )
    unit = models.CharField(max_length=20, choices=UNIT_CHOICES)
    price = models.DecimalField(max_digits=12, decimal_places=4, help_text="Price in GTQ.")
    valid_from = models.DateField()
    valid_to = models.DateField(null=True, blank=True, help_text="Null = no expiration.")

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "price_list_items"
        unique_together = ("price_list", "product", "unit", "valid_from")
        ordering = ["price_list", "product", "valid_from"]

    def __str__(self):
        return f"{self.price_list.name} | {self.product.code} ({self.unit}) = Q{self.price}"
