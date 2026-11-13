import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const proxy = {
  '/api': { target: process.env.PLATFORM_API_URL ?? 'http://127.0.0.1:4300' },
}

export default defineConfig({
  plugins: [react()],
  cacheDir: '.vite',
  server: { host: '127.0.0.1', port: 5175, strictPort: true, proxy },
  preview: { host: '127.0.0.1', port: 4175, strictPort: true, proxy },
})
