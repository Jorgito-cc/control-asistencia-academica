# API de la plataforma central

Requiere Node.js 22.12 o superior y una base PostgreSQL exclusiva de la plataforma. Esa base
guarda operadores, sesiones, planes, solicitudes e instituciones. Las asistencias se almacenan
en la base propia de cada institución.

Desde esta carpeta, en PowerShell:

```powershell
npm ci
Copy-Item .env.example .env
# Edita .env con la conexión PostgreSQL y las credenciales del operador.
npm start
```

La API escucha en `http://127.0.0.1:4300`. Al iniciar aplica sus migraciones y prepara la cuenta
definida con `PLATFORM_ADMIN_EMAIL` y `PLATFORM_ADMIN_PASSWORD`. La contraseña del operador debe
tener de 12 a 256 caracteres. Para aplicar únicamente las migraciones, usa `npm run db:migrate`.
El backend ejecuta JavaScript directamente y `npm run check` comprueba su sintaxis.

El frontend central redirige `/api` a este servidor. Mantén el proxy bajo el mismo origen público
que el frontend para que la sesión del operador funcione con su cookie. La API de salud responde
en `/api/platform/health` y `/api/health`.

Para vincular una institución desplegada, agrega su origen público a `PLATFORM_TENANT_ORIGINS`.
El servidor verifica la salud de la aplicación académica y solicita la invitación a su API mediante
la clave de vinculación de esa institución. En local, el frontend académico expone ese proxy en
`http://localhost:5173` o `http://127.0.0.1:5173`. Usa en el panel el origen con el que abres la
aplicación académica. La vista previa de correo devuelve el enlace al operador en desarrollo.
Para envíos reales, configura las variables SMTP del ejemplo. En producción configura
`NODE_ENV=production` y HTTPS para el frontend central y las aplicaciones académicas.
