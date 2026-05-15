"""Celery configuration for SistemaOVO."""
import os

from celery import Celery
from kombu import Queue

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")

app = Celery("sistemaovo")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

# Queue definitions
app.conf.task_queues = (
    Queue("default", routing_key="default"),
    Queue("fel", routing_key="fel.#"),
    Queue("fel_cancel", routing_key="fel.cancel"),
    Queue("notifications", routing_key="notify.#"),
    Queue("reports", routing_key="report.#"),
    Queue("credits", routing_key="credit.#"),
)

app.conf.task_default_queue = "default"
app.conf.task_default_routing_key = "default"

# Task routing
app.conf.task_routes = {
    "apps.billing.tasks.submit_fel_invoice": {
        "queue": "fel",
        "routing_key": "fel.submit",
    },
    "apps.billing.tasks.cancel_fel_invoice": {
        "queue": "fel_cancel",
        "routing_key": "fel.cancel",
    },
    "apps.notifications.tasks.send_notification": {
        "queue": "notifications",
        "routing_key": "notify.send",
    },
    "apps.reports.tasks.generate_report": {
        "queue": "reports",
        "routing_key": "report.generate",
    },
    "apps.credits.tasks.*": {
        "queue": "credits",
        "routing_key": "credit.update",
    },
}
