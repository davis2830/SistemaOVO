"""Reports — generated report log and scheduling."""
from django.conf import settings
from django.db import models

from apps.core.models import ActiveManager, TimeStampedModel


class ReportDefinition(TimeStampedModel):
    """Available report types."""

    FORMAT_CHOICES = [
        ("PDF", "PDF"),
        ("EXCEL", "Excel"),
        ("CSV", "CSV"),
    ]

    code = models.CharField(max_length=60, unique=True, db_index=True)
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True, default="")
    module = models.CharField(max_length=30, help_text="Module this report belongs to (sales, inventory, etc.)")
    default_format = models.CharField(max_length=5, choices=FORMAT_CHOICES, default="PDF")
    is_active = models.BooleanField(default=True)

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "report_definitions"
        ordering = ["module", "code"]

    def __str__(self):
        return f"{self.code} — {self.name}"


class ReportLog(TimeStampedModel):
    """Log of generated reports."""

    STATUS_CHOICES = [
        ("PENDING", "Pendiente"),
        ("PROCESSING", "Procesando"),
        ("COMPLETED", "Completado"),
        ("FAILED", "Fallido"),
    ]

    definition = models.ForeignKey(
        ReportDefinition, on_delete=models.PROTECT, related_name="logs",
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="report_logs",
    )
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="PENDING", db_index=True)
    output_format = models.CharField(max_length=5, choices=ReportDefinition.FORMAT_CHOICES)
    parameters = models.JSONField(default=dict, blank=True, help_text="Filter parameters used.")
    file_path = models.CharField(max_length=500, blank=True, default="")
    file_size = models.PositiveIntegerField(null=True, blank=True)
    error_message = models.TextField(blank=True, default="")
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    objects = ActiveManager()
    all_objects = models.Manager()

    class Meta:
        db_table = "report_logs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.definition.code} — {self.status}"
