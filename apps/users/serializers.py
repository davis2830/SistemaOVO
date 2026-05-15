"""Serializers for auth & user management."""
from django.contrib.auth import authenticate
from rest_framework import serializers

from .models import Role, RolePermission, User


class RolePermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RolePermission
        fields = ("id", "module", "action")
        read_only_fields = ("id",)


class RoleSerializer(serializers.ModelSerializer):
    permissions = RolePermissionSerializer(many=True, read_only=True)

    class Meta:
        model = Role
        fields = ("id", "name", "description", "is_system", "permissions")
        read_only_fields = ("id", "is_system")


class RoleCreateSerializer(serializers.ModelSerializer):
    permissions = RolePermissionSerializer(many=True, required=False)

    class Meta:
        model = Role
        fields = ("name", "description", "permissions")

    def create(self, validated_data):
        permissions_data = validated_data.pop("permissions", [])
        role = Role.objects.create(**validated_data)
        for perm in permissions_data:
            RolePermission.objects.create(role=role, **perm)
        return role


class UserSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source="role.name", read_only=True, default=None)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "role_name",
            "is_active",
            "date_joined",
            "last_login",
            "must_change_pwd",
        )
        read_only_fields = ("id", "date_joined", "last_login")


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("username", "email", "first_name", "last_name", "password", "role")

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(
            username=attrs["username"],
            password=attrs["password"],
        )
        if not user:
            try:
                failed_user = User.objects.get(username=attrs["username"])
                failed_user.record_failed_login()
            except User.DoesNotExist:
                pass
            raise serializers.ValidationError("Credenciales inválidas.")

        if user.is_locked:
            raise serializers.ValidationError(
                "Cuenta bloqueada por múltiples intentos fallidos. Intente en 30 minutos."
            )

        if not user.is_active:
            raise serializers.ValidationError("Cuenta desactivada.")

        user.reset_failed_attempts()
        attrs["user"] = user
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Contraseña actual incorrecta.")
        return value
