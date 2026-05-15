"""RBAC permission classes for DRF views."""
from rest_framework.permissions import BasePermission


class ModulePermission(BasePermission):
    """
    Check module-level permissions based on the user's role.

    Usage in a ViewSet:
        permission_module = "inventory"

    Maps HTTP methods to actions:
        GET     → view
        POST    → create
        PUT     → edit
        PATCH   → edit
        DELETE  → delete
    """

    METHOD_ACTION_MAP = {
        "GET": "view",
        "HEAD": "view",
        "OPTIONS": "view",
        "POST": "create",
        "PUT": "edit",
        "PATCH": "edit",
        "DELETE": "delete",
    }

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        module = getattr(view, "permission_module", None)
        if not module:
            return True

        action = self.METHOD_ACTION_MAP.get(request.method, "view")
        return request.user.has_module_permission(module, action)


class IsAdmin(BasePermission):
    """Only allow admin users or superusers."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return request.user.role and request.user.role.name == "Admin"
