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
    path("api/v1/sales/", include("apps.sales.urls", namespace="sales")),
    path("api/v1/delivery/", include("apps.delivery_routes.urls", namespace="delivery_routes")),
    path("api/v1/billing/", include("apps.billing.urls", namespace="billing")),
    path("api/v1/notifications/", include("apps.notifications.urls", namespace="notifications")),
    path("api/v1/reports/", include("apps.reports.urls", namespace="reports")),
]
