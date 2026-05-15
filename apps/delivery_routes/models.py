"""Delivery routes — simplified route management."""
from django.conf import settings
from django.db import models

from apps.core.models import ActiveManager, TimeStampedModel


class DeliveryRoute(TimeStampedModel):
    """A named delivery route with assigned driver and schedule."""

    DAY_CHOICES = [
        ("LUN", "Lunes"),
        ("MAR", "Martes"),
        ("MIE", "Miércoles"),
        ("JUE", "Jueves"),
        ("VIE", "Viernes"),
        ("SAB", "Sábado"),
        ("DOM", "Domingo"),
    ]

    name = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True, default="")
    driver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="delivery_routes",
    )
    delivery_days = models.CharField(
        max_length=50, blank=True, default="",
        help_text="Comma-separated day codes: LUN,MIE,VIE",
    )
    zone = models.CharField(max_length=60, blank=True, default="", help_text="Delivery zone or area.")
    is_active = models.BooleanField(default=True, db_index=True)

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "delivery_routes"
        ordering = ["name"]

    def __str__(self):
        return self.name

    @property
    def days_list(self):
        if not self.delivery_days:
            return []
        return [d.strip() for d in self.delivery_days.split(",")]
