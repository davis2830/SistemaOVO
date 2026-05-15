"""URL patterns for catalog API."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "catalog"

router = DefaultRouter()
router.register(r"categories", views.ProductCategoryViewSet, basename="category")
router.register(r"products", views.ProductViewSet, basename="product")
router.register(r"price-lists", views.PriceListViewSet, basename="pricelist")
router.register(r"price-list-items", views.PriceListItemViewSet, basename="pricelistitem")

urlpatterns = [
    path("", include(router.urls)),
]
