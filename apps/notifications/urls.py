"""URL patterns for notifications API."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "notifications"

router = DefaultRouter()
router.register(r"templates", views.NotificationTemplateViewSet, basename="notificationtemplate")
router.register(r"my", views.NotificationLogViewSet, basename="notificationlog")

urlpatterns = [
    path("", include(router.urls)),
]
