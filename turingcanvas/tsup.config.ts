import { defineConfig } from 'tsup'

export default defineConfig({
  format: ['cjs', 'esm'],
  entry: ['./src/index.ts'],
  dts: false, // Disable TypeScript declaration files
  shims: true,
  skipNodeModulesBundle: true,
  clean: true,
  minify: false,
  sourcemap: false,
  esbuildOptions(options) {
    options.loader = {
      ...options.loader,
      '.glsl': 'text',
    }
    // Disable TypeScript checking completely in esbuild
    options.logLevel = 'silent'
  },
})
