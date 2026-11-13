# Aplicación de asistencia

El administrador institucional crea cuentas de docentes. Cada docente gestiona
sus propios módulos, estudiantes, horarios, asistencias y reportes. Los
estudiantes ingresan por el enlace de su módulo y pueden marcar su asistencia.

## Arranque local

1. Crea una base PostgreSQL para la institución y un usuario con permisos para
   aplicar las migraciones de esa base.
2. Desde `server/`, copia `.env.example` a `.env` y configura `DB_HOST`,
   `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` y un `JWT_SECRET` aleatorio.
   En PowerShell puedes usar `Copy-Item .env.example .env`.
3. En una base vacía, configura `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `ADMIN_NAME`
   para crear el primer administrador. Si el acceso inicial se va a emitir
   desde la plataforma central, configura `PLATFORM_TENANT_SLUG` y
   `PLATFORM_BOOTSTRAP_KEY`. Usa una clave distinta por institución.
4. En `server/`, ejecuta `npm ci` y `npm run start:dev`. NestJS aplica las
   migraciones de `server/src/database/migrations/` y escucha en el puerto 3000.
5. En otra terminal, desde `client/`, ejecuta `npm ci` y `npm run dev`.
   Abre `http://localhost:5173/login`.

## Prueba con Excel

1. Ingresa como administrador y crea una cuenta desde **Docentes**.
2. Ingresa con la cuenta docente y abre **Nuevo módulo**. Carga
   [estudiantes_demo.xlsx](ejemplos/estudiantes_demo.xlsx) y
   [fechas_demo_noviembre_2026.xlsx](ejemplos/fechas_demo_noviembre_2026.xlsx).
   Ajusta las fechas del Excel al día de la prueba si corresponde.
3. Valida los archivos, activa el módulo y copia el enlace de estudiantes.
4. Abre el enlace con otro navegador o una ventana privada. Ingresa el número de
   registro del estudiante y marca asistencia durante una clase habilitada.
5. Desde la cuenta docente, abre **Módulos** y descarga el Excel de asistencias.

El enlace de activación del primer administrador usa `/activar`. Las tablas
académicas y las cuentas de la institución viven en esta base. Consulta la
[guía del backend](server/README.md) y los
[requisitos originales de asistencia](Requerimientos_Control_Asistencia.pdf).
