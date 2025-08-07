import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import glsl from 'vite-plugin-glsl'

const port = process.env.TURING_API_PORT || 6666
console.log('- API Proxy listening on port:', port)

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@turingcanvas': path.resolve(__dirname, './src/turingcanvas/src'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@components': path.resolve(__dirname, './src/components'),
    },
  },
  server: {
    allowedHosts: true,
    port: 8080,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api': {
        target: ` http://localhost:${port}`,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  plugins: [react(), tailwindcss(), glsl()],
})
