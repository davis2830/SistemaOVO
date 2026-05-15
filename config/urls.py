"""SistemaOVO URL configuration."""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("apps.users.urls", namespace="users")),
    path("api/v1/catalog/", include("apps.catalog.urls", namespace="catalog")),
    path("api/v1/inventory/", include("apps.warehouses.urls", namespace="warehouses")),
    path("api/v1/purchases/", include("apps.purchases.urls", namespace="purchases")),
    path("api/v1/clients/", include("apps.clients.urls", namespace="clients")),
    path("api/v1/credits/", include("apps.credits.urls", namespace="credits")),
]
