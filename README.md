# SistemaOVO — Sistema de Gestión de Ventas de Huevos

ERP vertical especializado para el control del flujo comercial de huevos.

## Stack Tecnológico

| Capa | Tecnologías |
|------|------------|
| Backend | Django 5 + DRF, PostgreSQL 16, Celery 5, RabbitMQ, Redis 7 |
| Frontend | React 18 + Vite (próximamente) |
| Infra | Docker, Nginx, Gunicorn |

## Estructura del Proyecto

```
sistemaovo/
├── config/              # Settings, URLs, Celery, WSGI
│   └── settings/        # base.py, development.py, production.py
├── apps/
│   ├── core/            # Base models, mixins, audit trail
│   ├── users/           # Auth (JWT), roles RBAC, permisos
│   ├── catalog/         # Productos, categorías, listas de precio
│   ├── warehouses/      # Bodegas, stock, movimientos (Fase 2)
│   ├── purchases/       # Proveedores, compras (Fase 2)
│   ├── clients/         # Clientes, CRM básico (Fase 3)
│   ├── credits/         # Cuentas por cobrar (Fase 3)
│   ├── sales/           # Pedidos, POS, rutas (Fase 4)
│   ├── billing/         # FEL, facturas, XML (Fase 5)
│   ├── notifications/   # Templates, envíos (Fase 6)
│   └── reports/         # Reportes PDF/Excel (Fase 6)
├── tasks/               # Celery tasks
├── docker-compose.yml
├── Dockerfile
└── requirements.txt
```

## Inicio Rápido

### Con Docker (recomendado)

```bash
cp .env.example .env
docker compose up --build
```

### Sin Docker (desarrollo local)

```bash
# 1. Instalar dependencias
pip install -r requirements.txt

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Asegurar que PostgreSQL, Redis y RabbitMQ estén corriendo

# 4. Migraciones y seed
python manage.py migrate
python manage.py seed_roles

# 5. Crear superusuario
python manage.py createsuperuser

# 6. Correr el servidor
python manage.py runserver
```

## API Endpoints (Fase 1)

### Auth
| Método | URL | Descripción |
|--------|-----|-------------|
| POST | `/api/v1/auth/login/` | Login → JWT tokens |
| POST | `/api/v1/auth/logout/` | Logout → blacklist refresh |
| POST | `/api/v1/auth/refresh/` | Refresh token |
| GET | `/api/v1/auth/me/` | Perfil del usuario actual |
| POST | `/api/v1/auth/change-password/` | Cambiar contraseña |
| GET/POST | `/api/v1/auth/users/` | Listar / Crear usuarios (Admin) |
| GET/PUT/DEL | `/api/v1/auth/users/{id}/` | Detalle / Editar / Desactivar usuario |
| GET/POST | `/api/v1/auth/roles/` | Listar / Crear roles (Admin) |

### Catálogo
| Método | URL | Descripción |
|--------|-----|-------------|
| GET/POST | `/api/v1/catalog/categories/` | Categorías de producto |
| GET/POST | `/api/v1/catalog/products/` | Productos |
| GET/POST | `/api/v1/catalog/price-lists/` | Listas de precios |
| GET/POST | `/api/v1/catalog/price-list-items/` | Items de lista de precios |

### Inventario
| Método | URL | Descripción |
|--------|-----|-------------|
| GET/POST | `/api/v1/inventory/warehouses/` | Bodegas |
| GET/POST | `/api/v1/inventory/batches/` | Lotes de inventario |
| POST | `/api/v1/inventory/batches/adjust/` | Ajuste manual de stock |
| GET | `/api/v1/inventory/movements/` | Movimientos (solo lectura) |

### Compras
| Método | URL | Descripción |
|--------|-----|-------------|
| GET/POST | `/api/v1/purchases/suppliers/` | Proveedores |
| GET/POST | `/api/v1/purchases/entries/` | Entradas de compra (genera lotes automáticamente) |

### Clientes
| Método | URL | Descripción |
|--------|-----|-------------|
| GET/POST | `/api/v1/clients/clients/` | Clientes (NIT, datos fiscales) |

### Créditos
| Método | URL | Descripción |
|--------|-----|-------------|
| GET/POST | `/api/v1/credits/accounts/` | Cuentas de crédito |
| POST | `/api/v1/credits/accounts/payment/` | Registrar pago |
| GET | `/api/v1/credits/transactions/` | Historial de transacciones |

## Principios de Diseño

- **UUID v4** como PK en todos los modelos
- **Soft-delete** — datos nunca se borran físicamente
- **Audit trail** — todo cambio registrado (usuario, IP, valores prev/new)
- **Service layer** — lógica de negocio en `services.py`, no en views
- **RBAC** — permisos granulares por módulo y acción
- **API versionada** — bajo `/api/v1/`

## Roles del Sistema

| Rol | Permisos principales |
|-----|---------------------|
| Admin | Acceso total |
| Vendedor | Ventas, clientes, POS (solo lectura inventario) |
| Bodeguero | Inventario, bodegas, movimientos |
| Contador | Facturación, créditos, reportes |
