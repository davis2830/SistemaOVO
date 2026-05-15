"""URL patterns for purchases API."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "purchases"

router = DefaultRouter()
router.register(r"suppliers", views.SupplierViewSet, basename="supplier")
router.register(r"entries", views.PurchaseEntryViewSet, basename="purchaseentry")

urlpatterns = [
    path("", include(router.urls)),
]
