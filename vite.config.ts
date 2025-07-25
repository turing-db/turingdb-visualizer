import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { turingcanvasBuilder } from './vite-plugins/turingcanvas-builder'

const port = process.env.TURING_API_PORT || 6666
console.log('- API Proxy listening on port:', port)

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@components': path.resolve(__dirname, './src/components'),
    },
  },
  server: {
    port: 8080,
    watch: {
      usePolling: true,
      ignored: ['**/turingcanvas/dist/**']
    },
    proxy: {
      '/api': {
        target: ` http://localhost:${port}`,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  optimizeDeps: {
    exclude: ['turingcanvas']
  },
  plugins: [turingcanvasBuilder(), react(), tailwindcss()],
  define: {
    __DISABLE_TS_CHECKS__: true
  },
  build: {
    rollupOptions: {
      external: []
    }
  }
})
