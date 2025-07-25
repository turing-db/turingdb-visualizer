import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { turingcanvasBuilder } from './vite-plugins/turingcanvas-builder'
import { componentTagger } from "lovable-tagger"
import glsl from 'vite-plugin-glsl'

const port = process.env.TURING_API_PORT || 6666
console.log('- API Proxy listening on port:', port)

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@components': path.resolve(__dirname, './src/components'),
      'turingcanvas': path.resolve(__dirname, './turingcanvas/src/index.ts'),
    },
  },
  server: {
    host: "::",
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
  plugins: [
    glsl(),
    turingcanvasBuilder(), 
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  esbuild: {
    target: 'es2020'
  },
  build: {
    rollupOptions: {
      external: []
    }
  }
}))
