# davKata-RastreoEnvios

## Instalación del entorno

Este proyecto usará:

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

La versión de Node debe mostrar:

```bash
v24.15.0
```

## 2. Instalar Angular CLI 21.2.8

Instalar Angular CLI de forma global:

```bash
npm install -g @angular/cli@21.2.8
```

Verificar la instalación:

```bash
ng version
```

## Estructura del proyecto

El repositorio contiene dos aplicaciones:

- `frontend/`: aplicación Angular 21 con organización modular por `core`, `shared` y `features`.
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

Las credenciales, URLs, limites operativos y secretos se configuran en esos archivos `.env`, no en el codigo.
El backend tambien requiere `JWT_SECRET` y `JWT_ACCESS_TOKEN_EXPIRES_IN` para firmar tokens de autenticacion.

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

Este comando genera el cliente Prisma y carga la data inicial.
La semilla crea el usuario administrador definido por `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
y el usuario operador definido por `SEED_OPERATOR_EMAIL` / `SEED_OPERATOR_PASSWORD`.
La password se almacena hasheada con bcrypt usando el cost factor `SEED_BCRYPT_COST_FACTOR`.

Comandos Prisma por separado:

```bash
npm --workspace backend run prisma:generate
npm --workspace backend run prisma:push
npm --workspace backend run db:seed
```

Usar `prisma:push` si la base ya existia y necesita sincronizar las tablas del schema.


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

## Contrato OpenAPI:

```text
insumos/openapi.json
```
## Esquema SQL:

```text
insumos/init-db.sql
```

## Variables de Entorno:

```text
Se debe de crear el archivo .env en la ruta /backend/ con base al archivo .env.example
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

Ejecutar pruebas de integración de repositorios Prisma:

```bash
npm run test:integration
```

Las pruebas de integración usan PostgreSQL y preparan una base separada con sufijo `_test`
derivada de `DATABASE_URL`, por ejemplo `dav_kata_rastreo_envios_test`.
Tambien puedes definir `TEST_DATABASE_URL` en `backend/.env` si quieres usar otra base.

## Diagramas de arquitectura simplificados

### Backend

```text
+--------------------+       +--------------------------------------+
| Backend Typescript | ----> | Express API                          |
|                    |       | /health, /api/auth, /api/routes      |
+--------------------+       +------------------+-------------------+
                                              |
                                              v
                         +--------------------+--------------------+
                         | Middlewares                             |
                         | correlation id, logger, helmet, CORS,  |
                         | JSON, auth, roles, errores             |
                         +--------------------+--------------------+
                                              |
                                              v
                         +--------------------+--------------------+
                         | Controllers                             |
                         | AuthController, RoutesController        |
                         +--------------------+--------------------+
                                              |
                                              v
                         +--------------------+--------------------+
                         | Application use cases                   |
                         | login, CRUD rutas, import CSV, filtros, |
                         | tracking                                |
                         +----------+-------------------+----------+
                                    |                   |
                                    v                   v
                  +-----------------+---------+   +-----+------------------+
                  | Domain                    |   | CachedTrackingAdapter  |
                  | entidades, constantes,    |   +-----+------------------+
                  | puertos                   |         |
                  +-----------------+---------+         v
                                    |             +-----+------------------+
                                    v             | SoapTrackingAdapter    |
                  +-----------------+---------+   +-----+------------------+
                  | Prisma repositories       |         |
                  | UserRepository,           |         v
                  | RouteRepository           |   +-----+------------------+
                  +-----------------+---------+   | Servicio SOAP tracking |
                                    |             +------------------------+
                                    v
                  +-----------------+---------+
                  | PostgreSQL                |
                  +---------------------------+
```

### Frontend

```text
+---------------------+
| Usuario / navegador |
+----------+----------+
           |
           v
+----------+-------------------------------------------+
| Angular app                                          |
| main.ts, app.config, app.routes                      |
+----------+-------------------------------------------+
           |
           v
+----------+-------------------------------------------+
| Rutas lazy                                           |
| login, dashboard, routes, route-monitoring, tracking |
+----------+-------------------------------------------+
           |
           +--------------------+
           |                    |
           v                    v
+----------+----------+   +-----+----------------------+
| authGuard           |   | Features                   |
+----------+----------+   | auth, dashboard, routes,   |
           |              | tracking                   |
           v              +-----+----------------------+
+----------+----------+         |
| AuthService         |         +----------------------------+
+---------------------+         |                            |
                                v                            v
                 +--------------+----------------+   +-------+----------------+
                 | Services                      |   | Shared components      |
                 | AuthService, RoutesService,   |   | AppShell, MetricCard,  |
                 | RouteDashboardService,        |   | charts, heatmap,       |
                 | TrackingService               |   | ranked routes          |
                 +--------------+----------------+   +------------------------+
                                |
                                v
                 +--------------+----------------+
                 | HttpClient                    |
                 | JWT interceptor,              |
                 | error interceptor             |
                 +--------------+----------------+
                                |
                                v
                 +--------------+----------------+
                 | Backend API                   |
                 | http://localhost:3000/api     |
                 +-------------------------------+

                 +-------------------------------+
                 | Core models                   |
                 | Route, Shipment, Auth         |
                 +-------------------------------+
```

## Estrategia de manejo de estado en frontend

El frontend maneja el estado principalmente de forma local por feature usando Angular Signals.
Cada página conserva su propio estado de interfaz, como datos cargados, filtros, paginación,
ordenamiento, errores y estados de carga, mediante `signal` y `computed`.

Los servicios inyectables encapsulan la comunicación con el backend y retornan `Observable`
de RxJS. La sesión de usuario se persiste en `localStorage`, donde se guardan el `accessToken`
y los datos básicos del usuario. El token se agrega a las peticiones con el `jwtInterceptor`,
mientras que los errores HTTP se centralizan con el `errorInterceptor`.

No se usa un store global como NgRx porque el estado actual está acotado por pantalla y no
requiere coordinación compleja entre módulos. Esta decisión mantiene el frontend simple,
directo y fácil de mantener.

## Justificación de arquitectura hexagonal en backend

Se usó arquitectura hexagonal en el backend para separar la lógica de negocio de los detalles técnicos como Express, Prisma, PostgreSQL o servicios externos. De esta forma, los casos de uso dependen de puertos e interfaces, no de implementaciones concretas.
Esta separación facilita las pruebas, el mantenimiento y la extensión del sistema. Por ejemplo, se puede cambiar un adaptador como la base de datos, el servicio SOAP de tracking o la capa HTTP sin afectar el dominio ni la lógica principal de la aplicación.


## Justificación de arquitectura modular en frontend

Se usó una arquitectura modular en el frontend para separar responsabilidades entre `core`,
`shared` y `features`. La carpeta `core` concentra piezas transversales como modelos,
guards, interceptores y configuración de API; `shared` contiene componentes reutilizables;
y `features` agrupa las pantallas y servicios propios de cada funcionalidad.

Esta organización facilita el mantenimiento y evita mezclar lógica de diferentes módulos.
También permite cargar pantallas mediante rutas lazy, reutilizar componentes comunes y mantener
servicios especializados para autenticación, rutas, dashboard y tracking.

## Supuestos asumidos

Para el monitoreo de rutas se asumió que era necesario mostrar una tabla completa con los datos
solicitados en el enunciado. Por esta razón, la vista de monitoreo presenta la información de las
rutas en formato tabular, permitiendo consultar de forma directa los campos relevantes para el
seguimiento y análisis operativo.

También se asumió que el filtro del dashboard debía afectar todos los indicadores presentes en
la página, ya que no se especificaba con precisión el alcance o finalidad exacta del filtro.
Por esto, al aplicar el filtro se recalculan los diferentes bloques del dashboard con base en
el mismo criterio seleccionado.
