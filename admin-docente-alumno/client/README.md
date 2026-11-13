# Frontend de asistencia

`npm ci` instala las dependencias. `npm run dev` sirve la aplicación en
`http://localhost:5173` y redirige `/api` y Socket.IO al backend académico en
`http://localhost:3000`. Para cambiar ese destino en desarrollo, define
`ATTENDANCE_API_URL` antes de ejecutar Vite.

`npm run build` genera `dist/`. Al publicar el frontend, configura el
servidor web para que sirva `index.html` en las rutas de React y redirija
`/api` y el WebSocket al backend. La URL de la API se puede configurar al
compilar con `VITE_API_URL`.
