"""URL patterns for sales API."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "sales"

router = DefaultRouter()
router.register(r"orders", views.SalesOrderViewSet, basename="salesorder")

urlpatterns = [
    path("", include(router.urls)),
]
