# MonoMarket Tickets

MonoMarket Tickets es un monorepo full-stack (NestJS + React) que sigue la filosofía **contract-first**. La especificación OpenAPI se mantiene en `packages/contracts` y a partir de ella se generan los tipos TypeScript usados por el backend y el frontend.

## Arquitectura

- `apps/api`: backend NestJS con Prisma y colas Bull.
- `apps/web`: frontend React + Vite.
- `apps/scanner`: PWA para el lector QR y control de accesos (React + Vite).
- `packages/contracts`: especificación OpenAPI y tipos generados.
- `packages/config` y `packages/tsconfig`: utilidades y configuraciones compartidas.

## Requisitos

- Node.js >= 20
- pnpm >= 8
- Docker (opcional, pero recomendado para levantar Postgres y/o los servicios completos)

## Instalación rápida

```bash
pnpm install
pnpm run contracts:generate
pnpm run build:packages
```

## Variables de entorno

### Backend (`apps/api/.env`)

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión de Postgres. |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Configuración de autenticación. |
| `OPENPAY_MERCHANT_ID`, `OPENPAY_PRIVATE_KEY`, `OPENPAY_PUBLIC_KEY`, `OPENPAY_PRODUCTION=false` | **Llaves privadas de Openpay (solo backend)**. Usa credenciales sandbox y deja `OPENPAY_PRODUCTION=false` mientras pruebas. |
| `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_INTEGRATOR_ID` | **Llaves privadas de Mercado Pago (solo backend)**. Usa el Access Token de prueba; el integrator id es opcional. |
| `MP_PUBLIC_KEY` (deprecated) | Compatibilidad hacia atrás, utiliza preferentemente `MP_PUBLIC_KEY`. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM` | Configuración de correo (opcional). |

> Las llaves privadas nunca se comparten con el frontend. Solo el backend conoce `OPENPAY_PRIVATE_KEY` y `MP_ACCESS_TOKEN`.

### Frontend (`apps/web/.env`)

| Variable | Descripción |
| --- | --- |
| `VITE_API_URL` | URL del backend (ej. `http://localhost:3000/api`). |
| `VITE_OPENPAY_MERCHANT_ID`, `VITE_OPENPAY_PUBLIC_KEY`, `VITE_OPENPAY_SANDBOX=true` | **Llaves públicas de Openpay** para tokenizar tarjetas desde el navegador. |
| `VITE_MP_PUBLIC_KEY`, `VITE_MP_LOCALE=es-MX` | Llave pública de Mercado Pago y locale para Checkout Pro / Wallet Brick. |

### Scanner (`apps/scanner/.env`)

| Variable | Descripcion |
| --- | --- |
| `VITE_API_URL` | URL del backend para validar tickets (ej. `http://localhost:3000/api`). |



## Desarrollo local

```bash
# Levanta API y Web con watch + contratos actualizados
pnpm run dev

# Servicios individuales
pnpm run dev:api
pnpm run dev:web
```

Antes de iniciar asegúrate de tener la base de datos creada (puedes usar Docker o tu propio Postgres) y haber copiado los `.env`:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

## Pagos (sandbox)

1. **Openpay**: el frontend usa Openpay.js para tokenizar tarjetas. Proporciona `VITE_OPENPAY_*` en `apps/web/.env` y en el backend configura `OPENPAY_*` en `apps/api/.env`. Mantén `OPENPAY_PRODUCTION=false` mientras utilices las llaves sandbox.
2. **Mercado Pago Checkout Pro**: el frontend pide una preferencia al backend (`POST /payments/mercadopago/preference`) usando la llave pública (`VITE_MP_PUBLIC_KEY`) y genera el botón/Wallet Brick. El backend firma la preferencia con `MP_ACCESS_TOKEN` y opcionalmente `MP_INTEGRATOR_ID`.
3. **Webhooks**: `POST /webhooks/mercadopago` registra el evento (por ahora sólo se loguea `type/action/data.id`).

## Docker

### Desarrollo (API + Web + Scanner + DB)

`docker-compose.dev.yml` ahora levanta PostgreSQL junto con la API, el frontend principal y el scanner en modo watch dentro de contenedores dedicados:

```bash
pnpm run docker:dev:build          # Construye e inicia Postgres + API + Web + Scanner
pnpm run docker:dev                # Reutiliza las imagenes ya construidas
pnpm run docker:dev:down           # Detiene los servicios
```

Servicios expuestos por defecto:
- **Web**: http://localhost:5173
- **Scanner**: http://localhost:5174
- **API**: http://localhost:3000
- **PostgreSQL**: localhost:5432

La API lee las variables de `apps/api/.env`, por lo que debes rellenarlas antes de ejecutar el stack.

### Producci?n / staging

`docker-compose.yml` construye la API y ambos frontends listos para producci?n junto con Postgres:

```bash
pnpm run docker:prod:build   # Construye backend + frontend web + scanner + db
pnpm run docker:prod         # Inicia usando las imagenes existentes
pnpm run docker:prod:down    # Detiene servicios
```

#### Variables importantes en `docker-compose.yml`

- `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_INTEGRATOR_ID`
- `OPENPAY_MERCHANT_ID`, `OPENPAY_PRIVATE_KEY`, `OPENPAY_PUBLIC_KEY`, `OPENPAY_PRODUCTION`
- `VITE_API_URL`, `WEB_PORT`, `SCANNER_VITE_API_URL`, `SCANNER_PORT`
- `SMTP_*`, `EMAIL_FROM`, `CORS_ORIGIN`, `JWT_*`

Puedes gestionarlas a través de un `.env` en el root del proyecto o asignarlas en el entorno donde ejecutes Docker.

## Base de datos

```bash
cd apps/api
pnpm run prisma:migrate      # aplica migraciones
pnpm run prisma:generate     # genera Prisma Client
pnpm run prisma:studio       # UI para explorar la DB
```

## Contratos y tipos

Cada cambio en `packages/contracts/openapi/monomarket-tickets.yaml` requiere regenerar los tipos:

```bash
pnpm run contracts:generate
```

Los tipos compilados se distribuyen mediante `pnpm run build:packages`.

## Pruebas y calidad

```bash
pnpm run test          # Ejecuta todas las pruebas
pnpm run lint          # Linter en cada workspace (puede emitir warnings)
pnpm run typecheck     # tsc --noEmit en todos los paquetes
```

## Scripts útiles

| Script | Descripción |
| --- | --- |
| `pnpm run dev` | Compila contratos, empaqueta dependencias compartidas y lanza API + Web. |
| `pnpm run build` | Compila contratos + config + API + Web. |
| `pnpm run docker:dev:build` | Postgres + API + Web + Scanner en contenedores para desarrollo/sandbox. |
| `pnpm run docker:prod:build` | Stack completo (Postgres + API + Web + Scanner) listo para despliegue. |

## Licencia

Propietario: MonoMarket Tickets.
