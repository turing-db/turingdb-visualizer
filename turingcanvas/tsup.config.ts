import { defineConfig } from 'tsup'

export default defineConfig({
  format: ['esm'],
  entry: ['./src/index.ts'],
  dts: false,
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
    // Force JavaScript output, no TypeScript checking
    options.logLevel = 'silent'
    options.target = 'es2020'
    options.format = 'esm'
  },
})
