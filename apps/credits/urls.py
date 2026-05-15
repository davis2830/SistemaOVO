"""URL patterns for credits API."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "credits"

router = DefaultRouter()
router.register(r"accounts", views.CreditAccountViewSet, basename="creditaccount")
router.register(r"transactions", views.CreditTransactionViewSet, basename="credittransaction")

urlpatterns = [
    path("", include(router.urls)),
]
