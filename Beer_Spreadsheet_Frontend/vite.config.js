import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/csrf/': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/api-token-auth/': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/beers/': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/beers_with_ratings/': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/beers_with_average_ratings/': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/users/': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/my-color/': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/rate_beer/': {
        target: backendUrl,
        changeOrigin: true,
      },
    },
  },
})
