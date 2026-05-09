import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

/** Laravel `php artisan serve` — must match `dev:api` in package.json */
const API_PROXY_TARGET = process.env.VITE_API_PROXY_TARGET ?? 'http://127.0.0.1:8000'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Same-origin `/api/v1/*` in dev → Laravel (no CORS, no wrong port in browser)
      '/api': {
        target: API_PROXY_TARGET,
        changeOrigin: true,
      },
      // Serve uploaded media from Laravel storage through Vite in development.
      '/storage': {
        target: API_PROXY_TARGET,
        changeOrigin: true,
      },
    },
  },
})
