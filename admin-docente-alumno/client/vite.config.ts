import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // ws: también redirige la conexión en tiempo real (/api/socket.io).
      '/api': { target: process.env.ATTENDANCE_API_URL ?? 'http://localhost:3000', ws: true },
    },
  },
})
