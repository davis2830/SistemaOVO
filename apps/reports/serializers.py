"""Serializers for reports."""
from rest_framework import serializers

from .models import ReportDefinition, ReportLog


class ReportDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportDefinition
        fields = (
            "id", "code", "name", "description",
            "module", "default_format", "is_active",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class ReportLogSerializer(serializers.ModelSerializer):
    report_code = serializers.CharField(source="definition.code", read_only=True)
    report_name = serializers.CharField(source="definition.name", read_only=True)
    requested_by_name = serializers.CharField(source="requested_by.full_name", read_only=True)

    class Meta:
        model = ReportLog
        fields = (
            "id", "definition", "report_code", "report_name",
            "requested_by", "requested_by_name",
            "status", "output_format", "parameters",
            "file_path", "file_size",
            "error_message",
            "started_at", "completed_at", "created_at",
        )
        read_only_fields = (
            "id", "status", "file_path", "file_size",
            "error_message", "started_at", "completed_at", "created_at",
        )


class GenerateReportSerializer(serializers.Serializer):
    """Input for requesting a report generation."""
    definition = serializers.UUIDField()
    output_format = serializers.ChoiceField(choices=["PDF", "EXCEL", "CSV"], required=False)
    parameters = serializers.DictField(required=False, default=dict)
