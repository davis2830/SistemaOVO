"""URL patterns for reports API."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "reports"

router = DefaultRouter()
router.register(r"definitions", views.ReportDefinitionViewSet, basename="reportdefinition")
router.register(r"logs", views.ReportLogViewSet, basename="reportlog")

urlpatterns = [
    path("", include(router.urls)),
]
