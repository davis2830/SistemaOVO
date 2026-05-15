"""URL patterns for billing API."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "billing"

router = DefaultRouter()
router.register(r"invoices", views.InvoiceViewSet, basename="invoice")

urlpatterns = [
    path("", include(router.urls)),
]
