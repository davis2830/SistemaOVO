"""URL patterns for warehouses & inventory API."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "warehouses"

router = DefaultRouter()
router.register(r"warehouses", views.WarehouseViewSet, basename="warehouse")
router.register(r"batches", views.InventoryBatchViewSet, basename="batch")
router.register(r"movements", views.InventoryMovementViewSet, basename="movement")

urlpatterns = [
    path("", include(router.urls)),
]
