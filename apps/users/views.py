"""Auth & user management views."""
from rest_framework import generics, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Role, User
from .permissions import IsAdmin
from .serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    RoleCreateSerializer,
    RoleSerializer,
    UserCreateSerializer,
    UserSerializer,
)


class LoginView(APIView):
    """POST /api/v1/auth/login/ — Authenticate and return JWT tokens."""

    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "success": True,
                "data": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": UserSerializer(user).data,
                    "must_change_pwd": user.must_change_pwd,
                },
            }
        )


class LogoutView(APIView):
    """POST /api/v1/auth/logout/ — Blacklist the refresh token."""

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"success": False, "error": {"code": "MISSING_TOKEN", "message": "Refresh token requerido."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            return Response(
                {"success": False, "error": {"code": "INVALID_TOKEN", "message": "Token inválido o expirado."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"success": True, "data": {"message": "Sesión cerrada correctamente."}})


class MeView(generics.RetrieveAPIView):
    """GET /api/v1/auth/me/ — Current user profile."""

    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """POST /api/v1/auth/change-password/"""

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.must_change_pwd = False
        user.save(update_fields=["password", "must_change_pwd"])

        return Response({"success": True, "data": {"message": "Contraseña actualizada correctamente."}})


class UserViewSet(viewsets.ModelViewSet):
    """CRUD for users — Admin only."""

    queryset = User.objects.select_related("role").all()
    permission_classes = (IsAuthenticated, IsAdmin)

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        return UserSerializer

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])


class RoleViewSet(viewsets.ModelViewSet):
    """CRUD for roles — Admin only."""

    queryset = Role.objects.prefetch_related("permissions").all()
    permission_classes = (IsAuthenticated, IsAdmin)

    def get_serializer_class(self):
        if self.action == "create":
            return RoleCreateSerializer
        return RoleSerializer

    def perform_destroy(self, instance):
        if instance.is_system:
            return Response(
                {"success": False, "error": {"code": "SYSTEM_ROLE", "message": "No se puede eliminar un rol del sistema."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        instance.delete()
