from django.contrib import admin

from .models import NotificationLog, NotificationTemplate


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "channel", "is_active")
    list_filter = ("channel", "is_active")
    search_fields = ("code", "name")


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ("recipient", "channel", "subject", "status", "created_at")
    list_filter = ("status", "channel")
    search_fields = ("subject", "recipient__email")
    readonly_fields = ("subject", "body", "sent_at")
