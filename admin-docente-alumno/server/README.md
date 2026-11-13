# API académica

API NestJS del sistema de asistencia. El administrador de la institución gestiona las cuentas docentes. Cada docente gestiona sus módulos y estudiantes. Los estudiantes consultan y registran su asistencia en su módulo activo.

## Desarrollo local

Se necesita Node.js y una base PostgreSQL para la institución. Desde esta carpeta, copia `.env.example` a `.env` y configura `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` y un `JWT_SECRET` aleatorio. El usuario de base de datos debe poder aplicar las migraciones.

```sh
npm ci
npm run migration:run
npm run start:dev
```

La configuración de ejemplo escucha en `http://localhost:3000/api`, permite el frontend en `http://localhost:5173` y expone `GET /api/health` para verificar la conexión a PostgreSQL. El WebSocket usa `/api/socket.io` en el mismo puerto. Ajusta `PORT`, `HOST` y `CORS_ORIGIN` al entorno donde se ejecute.

En una instalación local con base vacía, define `ADMIN_EMAIL` y `ADMIN_PASSWORD` para crear la primera cuenta al arrancar. Conserva el mismo `JWT_SECRET` entre reinicios.

## Alta por invitación desde el portal central

En una instalación nueva que se activa por invitación, configura `PLATFORM_TENANT_SLUG` y `PLATFORM_BOOTSTRAP_KEY` con el identificador y la clave de esa institución. La clave debe tener al menos 32 caracteres y coincidir con la que usa el portal central. La primera cuenta se crea cuando el administrador abre la invitación y elige su contraseña.

El portal central solicita la invitación por `POST /api/auth/invitations/bootstrap` con la clave como token Bearer. El enlace se canjea por `POST /api/auth/invitations/activate`. Cada instalación utiliza su propia base académica.

## Compilación y pruebas

```sh
npm run build
npm run start:prod
npm test -- --runInBand
```
