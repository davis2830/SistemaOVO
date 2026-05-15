"""Management command to seed default roles and permissions."""
from django.core.management.base import BaseCommand

from apps.users.models import Role, RolePermission

DEFAULT_ROLES = {
    "Admin": {
        "description": "Administrador del sistema — acceso total.",
        "permissions": [
            # Admin gets all permissions on all modules
            ("users", "view"), ("users", "create"), ("users", "edit"), ("users", "delete"), ("users", "approve"),
            ("catalog", "view"), ("catalog", "create"), ("catalog", "edit"), ("catalog", "delete"),
            ("inventory", "view"), ("inventory", "create"), ("inventory", "edit"), ("inventory", "delete"), ("inventory", "approve"),
            ("sales", "view"), ("sales", "create"), ("sales", "edit"), ("sales", "delete"), ("sales", "approve"),
            ("billing", "view"), ("billing", "create"), ("billing", "edit"), ("billing", "delete"), ("billing", "approve"),
            ("credits", "view"), ("credits", "create"), ("credits", "edit"), ("credits", "delete"), ("credits", "approve"),
            ("reports", "view"), ("reports", "create"),
            ("notifications", "view"), ("notifications", "create"), ("notifications", "edit"),
            ("config", "view"), ("config", "create"), ("config", "edit"), ("config", "delete"),
        ],
    },
    "Vendedor": {
        "description": "Vendedor — acceso a ventas, clientes, POS.",
        "permissions": [
            ("catalog", "view"),
            ("inventory", "view"),
            ("sales", "view"), ("sales", "create"), ("sales", "edit"),
            ("billing", "view"),
            ("credits", "view"),
            ("reports", "view"),
            ("notifications", "view"),
        ],
    },
    "Bodeguero": {
        "description": "Bodeguero — gestión de inventario y bodegas.",
        "permissions": [
            ("catalog", "view"),
            ("inventory", "view"), ("inventory", "create"), ("inventory", "edit"),
            ("sales", "view"),
            ("reports", "view"),
            ("notifications", "view"),
        ],
    },
    "Contador": {
        "description": "Contador — acceso a facturación, créditos y reportes.",
        "permissions": [
            ("catalog", "view"),
            ("inventory", "view"),
            ("sales", "view"),
            ("billing", "view"), ("billing", "create"), ("billing", "edit"),
            ("credits", "view"), ("credits", "create"), ("credits", "edit"), ("credits", "approve"),
            ("reports", "view"), ("reports", "create"),
            ("notifications", "view"),
        ],
    },
}


class Command(BaseCommand):
    help = "Seed default roles and their permissions."

    def add_arguments(self, parser):
        parser.add_argument(
            "--no-input",
            action="store_true",
            help="Do not prompt for confirmation.",
        )

    def handle(self, *args, **options):
        for role_name, config in DEFAULT_ROLES.items():
            role, created = Role.objects.get_or_create(
                name=role_name,
                defaults={
                    "description": config["description"],
                    "is_system": True,
                },
            )
            action = "Created" if created else "Already exists"
            self.stdout.write(f"  {action}: Role '{role_name}'")

            for module, action_name in config["permissions"]:
                RolePermission.objects.get_or_create(
                    role=role,
                    module=module,
                    action=action_name,
                )

        self.stdout.write(self.style.SUCCESS("Roles and permissions seeded successfully."))
