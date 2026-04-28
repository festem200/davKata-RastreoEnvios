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

Guia demo:

```text
DAV123456789
```
