from django.contrib import admin

from .models import ReportDefinition, ReportLog


@admin.register(ReportDefinition)
class ReportDefinitionAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "module", "default_format", "is_active")
    list_filter = ("module", "is_active")
    search_fields = ("code", "name")


@admin.register(ReportLog)
class ReportLogAdmin(admin.ModelAdmin):
    list_display = ("definition", "requested_by", "status", "output_format", "created_at")
    list_filter = ("status", "output_format")
    readonly_fields = ("started_at", "completed_at", "file_path")
