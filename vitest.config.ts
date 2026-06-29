import path from 'node:path'
import { defineConfig } from 'vitest/config'

// API-contract integration tests. These import the real functions from
// src/api/api.ts and run them against a live TuringDB booted by globalSetup.
// Scoped narrowly to tests/integration so it never picks up the Playwright
// `*.spec.ts` UI tests under tests/.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@turingcanvas': path.resolve(__dirname, './src/turingcanvas/src'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@components': path.resolve(__dirname, './src/components'),
    },
  },
  test: {
    include: ['tests/integration/**/*.test.ts'],
    globalSetup: ['tests/integration/global-setup.ts'],
    setupFiles: ['tests/integration/setup-fetch.ts'],
    testTimeout: 30_000,
    // First run lets uv download/install the turingdb binary, which can be slow.
    hookTimeout: 180_000,
    // One shared server — keep test files serial to avoid cross-file races.
    fileParallelism: false,
  },
})
