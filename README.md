# davKata-RastreoEnvios

## Instalación del entorno

Este proyecto usara:

- Node.js: `24.15.0` LTS
- npm: incluido con Node.js
- Angular CLI: `21.2.8`

## 1. Instalar Node.js 24.15.0 LTS

Se recomienda instalar Node.js usando `nvm`, porque permite manejar varias versiones de Node en el mismo equipo.

Instalar `nvm`:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

Abrir otra terminal. Luego instalar Node.js `24.15.0`:

```bash
nvm install 24.15.0
nvm use 24.15.0
nvm alias default 24.15.0
```

Verificar la instalación:

```bash
node --version
npm --version
```

La version de Node debe mostrar:

```bash
v24.15.0
```

## 2. Instalar Angular CLI 21.2.8

Instalar Angular CLI de forma global:

```bash
npm install -g @angular/cli@21.2.8
```

Verificar la instalacion:

```bash
ng version
```

## Estructura del proyecto

El repositorio contiene dos aplicaciones:

- `frontend/`: aplicacion Angular 21 con organizacion modular por `core`, `shared` y `features`.
- `backend/`: API TypeScript con arquitectura hexagonal.

Capas principales del backend:

- `domain`: entidades y puertos.
- `application`: casos de uso.
- `infrastructure`: adaptadores HTTP y repositorios.

## Base de datos local

La base de datos local usa PostgreSQL con Docker Compose y Prisma como ORM.

Crear los archivos de entorno:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Las credenciales y `DATABASE_URL` se configuran en esos archivos `.env`, no en el codigo.
El backend tambien requiere `JWT_SECRET` para firmar tokens de autenticacion.

Levantar PostgreSQL:

```bash
docker compose up -d postgres
```

Validar que el contenedor este corriendo:

```bash
docker compose ps
```

Datos de conexion local:

```text
host: localhost
port: 5432
database: dav_kata_rastreo_envios
user/password: ver .env y backend/.env
```

El script de inicializacion se encuentra en:

```text
insumos/init-db.sql
```

Comandos Prisma:

```bash
npm --workspace backend run db:setup
```

Ese comando genera el cliente Prisma y carga la data inicial.
La semilla crea el usuario administrador `admin@test.com` con password `123456`
y el usuario operador `operador@test.com` con password `123456`.
La password se almacena hasheada con bcrypt usando cost factor `12`.

Comandos Prisma por separado:

```bash
npm --workspace backend run prisma:generate
npm --workspace backend run prisma:push
npm --workspace backend run db:seed
```

Usar `prisma:push` si la base ya existia y necesita sincronizar las tablas del schema.

Detener PostgreSQL:

```bash
docker compose down
```

## Ejecutar en desarrollo

Usar la version de Node definida para el proyecto:

```bash
nvm use
```

Instalar dependencias:

```bash
npm install
```

### Levantar todo el proyecto

Este comando levanta backend y frontend al mismo tiempo:

```bash
npm run dev
```

### Levantar solo el frontend

```bash
npm run dev:frontend
```

El frontend queda disponible en:

```text
http://localhost:4200
```

### Levantar solo el backend

```bash
npm run dev:backend
```

El backend queda disponible en:

```text
http://localhost:3000
```

URLs locales:

- Frontend: `http://localhost:4200`
- Backend: `http://localhost:3000`
- Salud backend: `http://localhost:3000/health`

## Autenticacion y autorizacion

El endpoint publico de login es:

```http
POST /api/auth/login
Content-Type: application/json
```

Body:

```json
{
  "email": "admin@test.com",
  "password": "123456"
}
```

Respuesta:

```json
{
  "accessToken": "...",
  "expiresIn": "8h",
  "user": {
    "id": 1,
    "role": "ADMIN"
  }
}
```

Las rutas privadas bajo `/api/routes` requieren el header:

```http
Authorization: Bearer <accessToken>
```

Politica de roles:

- `ADMIN`: acceso total a rutas, filtros, tracking, creacion, importacion CSV, actualizacion y desactivacion.
- `OPERADOR`: `GET /api/routes` y `GET /api/routes/:id`.

### Logs estructurados del backend

El backend emite logs JSON con Pino. Cada request usa el header `x-correlation-id`;
si el cliente no lo envia, la API genera uno y lo retorna en la respuesta.

Ejemplo de uso dentro de un handler:

```ts
request.log.info({
  correlationId: request.correlationId,
  code: 400,
  method: 'GET',
  endpoint: '/api/routes',
  message: 'SOAP timeout'
});
```

Contrato OpenAPI:

```text
insumos/openapi.json
```

## Pruebas

Ejecutar pruebas unitarias del backend y frontend:

```bash
npm test
```

Ejecutar pruebas unitarias del backend con cobertura:

```bash
npm run test:coverage
```

Ejecutar pruebas de integracion de repositorios Prisma:

```bash
npm run test:integration
```

Las pruebas de integracion usan PostgreSQL y preparan una base separada con sufijo `_test`
derivada de `DATABASE_URL`, por ejemplo `dav_kata_rastreo_envios_test`.
Tambien puedes definir `TEST_DATABASE_URL` en `backend/.env` si quieres usar otra base.
