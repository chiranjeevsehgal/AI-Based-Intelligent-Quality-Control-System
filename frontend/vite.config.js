import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    watch: {
      usePolling: true, // Needed for Docker volumes
    },
    host: '0.0.0.0', // Listen on all network interfaces
    // strictPort: true, // Don't try another port if 5173 is taken
    proxy: {
      '/api': {
        target: 'http://backend:5001',
        changeOrigin: true,
      }
    }
  }
})
