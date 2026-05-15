"""User & Role models — RBAC with granular permissions."""
import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class Role(models.Model):
    """System roles: Admin, Vendedor, Bodeguero, Contador."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=60, unique=True)
    description = models.TextField(null=True, blank=True)
    is_system = models.BooleanField(default=False, help_text="System roles cannot be deleted.")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "roles"
        ordering = ["name"]

    def __str__(self):
        return self.name


class RolePermission(models.Model):
    """Granular permissions per role: module + action."""

    ACTIONS = [
        ("view", "Ver"),
        ("create", "Crear"),
        ("edit", "Editar"),
        ("delete", "Eliminar"),
        ("approve", "Aprobar"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="permissions")
    module = models.CharField(max_length=60)  # e.g. "inventory", "billing", "credits"
    action = models.CharField(max_length=20, choices=ACTIONS)

    class Meta:
        db_table = "role_permissions"
        unique_together = ("role", "module", "action")
        ordering = ["module", "action"]

    def __str__(self):
        return f"{self.role.name}: {self.module}.{self.action}"


class UserManager(BaseUserManager):
    """Custom manager for User model (email-based)."""

    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError("El email es obligatorio.")
        if not username:
            raise ValueError("El username es obligatorio.")
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("must_change_pwd", False)
        return self.create_user(username, email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model with UUID PK and role-based access."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(max_length=254, unique=True, db_index=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    role = models.ForeignKey(
        Role,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="users",
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)

    # Security fields
    failed_attempts = models.SmallIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    must_change_pwd = models.BooleanField(default=True, help_text="Force password change on first login.")

    objects = UserManager()

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email"]

    class Meta:
        db_table = "users"
        ordering = ["username"]

    def __str__(self):
        return self.username

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username

    @property
    def is_locked(self):
        if self.locked_until and self.locked_until > timezone.now():
            return True
        return False

    def record_failed_login(self):
        """Increment failed attempts; lock account after 5 failures."""
        self.failed_attempts += 1
        if self.failed_attempts >= 5:
            self.locked_until = timezone.now() + timezone.timedelta(minutes=30)
        self.save(update_fields=["failed_attempts", "locked_until"])

    def reset_failed_attempts(self):
        if self.failed_attempts > 0 or self.locked_until:
            self.failed_attempts = 0
            self.locked_until = None
            self.save(update_fields=["failed_attempts", "locked_until"])

    def has_module_permission(self, module: str, action: str) -> bool:
        """Check if user's role grants a specific permission."""
        if self.is_superuser:
            return True
        if not self.role:
            return False
        return self.role.permissions.filter(module=module, action=action).exists()
