import { defineConfig } from 'tsup'

export default defineConfig({
  format: ['esm'],
  entry: ['./src/index.ts'],
  dts: true,
  shims: true,
  skipNodeModulesBundle: true,
  clean: true,
  minify: false,
  sourcemap: false,
  target: 'es2020',
  outExtension: () => ({ js: '.js' }),
  esbuildOptions(options) {
    options.loader = {
      ...options.loader,
      '.glsl': 'text',
    }
    options.target = 'es2020'
    options.format = 'esm'
  },
})
