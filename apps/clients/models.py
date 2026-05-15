"""Client models — CRM básico with fiscal data."""
from django.db import models

from apps.core.models import ActiveManager, TimeStampedModel


class Client(TimeStampedModel):
    """Client with fiscal data (NIT, razón social) for FEL billing."""

    TYPE_CHOICES = [
        ("CONTADO", "Contado"),
        ("CREDITO", "Crédito"),
    ]

    CLASSIFICATION_CHOICES = [
        ("MAYORISTA", "Mayorista"),
        ("MINORISTA", "Minorista"),
        ("ESPECIAL", "Especial"),
    ]

    nit = models.CharField(max_length=20, unique=True, db_index=True, help_text="NIT del cliente (requerido para FEL).")
    name = models.CharField(max_length=200, db_index=True, help_text="Razón social.")
    trade_name = models.CharField(max_length=200, blank=True, default="", help_text="Nombre comercial.")
    address = models.TextField(help_text="Dirección fiscal.")
    phone = models.CharField(max_length=20, blank=True, default="")
    email = models.EmailField(max_length=254, blank=True, default="")
    client_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default="CONTADO")
    classification = models.CharField(max_length=15, choices=CLASSIFICATION_CHOICES, default="MINORISTA")
    price_list = models.ForeignKey(
        "catalog.PriceList",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="clients",
    )
    notes = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True, db_index=True)

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "clients"
        ordering = ["name"]

    def __str__(self):
        return f"{self.nit} — {self.name}"
