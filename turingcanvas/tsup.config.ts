import { defineConfig } from 'tsup'

export default defineConfig({
  format: ['cjs', 'esm'],
  entry: ['./src/index.ts'],
  dts: true,
  shims: true,
  skipNodeModulesBundle: true,
  clean: true,
  esbuildOptions(options) {
    options.loader = {
      ...options.loader,
      '.glsl': 'text',
    }
  },
})
