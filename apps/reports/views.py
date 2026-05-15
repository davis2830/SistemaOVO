"""Reports API views."""
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.users.permissions import ModulePermission

from .models import ReportDefinition, ReportLog
from .serializers import (
    GenerateReportSerializer,
    ReportDefinitionSerializer,
    ReportLogSerializer,
)


class ReportDefinitionViewSet(viewsets.ModelViewSet):
    queryset = ReportDefinition.objects.all()
    serializer_class = ReportDefinitionSerializer
    permission_classes = (IsAuthenticated, ModulePermission)
    permission_module = "reports"
    search_fields = ("code", "name")
    filterset_fields = ("module", "is_active")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete(self.request.user)

    @action(detail=False, methods=["post"], url_path="generate")
    def generate(self, request):
        """POST /api/v1/reports/definitions/generate/ — request report generation."""
        serializer = GenerateReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            definition = ReportDefinition.objects.get(pk=data["definition"], is_active=True)
        except ReportDefinition.DoesNotExist:
            return Response(
                {"success": False, "error": {"code": "REPORT_NOT_FOUND", "message": "Reporte no encontrado o inactivo."}},
                status=404,
            )

        log = ReportLog.objects.create(
            definition=definition,
            requested_by=request.user,
            output_format=data.get("output_format", definition.default_format),
            parameters=data.get("parameters", {}),
            status="PENDING",
            created_by=request.user,
            updated_by=request.user,
        )

        # TODO: Dispatch Celery task for async generation
        result = ReportLogSerializer(log).data
        return Response({"success": True, "data": result}, status=201)


class ReportLogViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Read-only list of report generations for the current user."""
    serializer_class = ReportLogSerializer
    permission_classes = (IsAuthenticated,)
    filterset_fields = ("status", "output_format")

    def get_queryset(self):
        return (
            ReportLog.objects
            .filter(requested_by=self.request.user)
            .select_related("definition", "requested_by")
        )
