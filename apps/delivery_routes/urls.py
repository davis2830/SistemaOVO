"""URL patterns for delivery routes API."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "delivery_routes"

router = DefaultRouter()
router.register(r"routes", views.DeliveryRouteViewSet, basename="deliveryroute")

urlpatterns = [
    path("", include(router.urls)),
]
