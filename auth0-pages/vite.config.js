import { defineConfig } from 'vite'
import handlebars from 'vite-plugin-handlebars'
import { resolve } from 'path'
import { viteSingleFile } from 'vite-plugin-singlefile'

const projectRootDir = resolve(__dirname)
const srcDir = resolve(projectRootDir, 'src')

export default defineConfig(() => {
  const args = process.argv.slice(2)
  const pageArg = args.find((arg) => arg.startsWith('--PAGE='))
  const page = pageArg ? pageArg.split('=')[1] : null

  return {
    root: srcDir,
    publicDir: resolve(projectRootDir, 'public'),
    build: {
      outDir: resolve(projectRootDir, 'dist'),
      emptyOutDir: false,
      rollupOptions: {
        input:
          page === 'login' ? resolve(srcDir, 'login.html') : resolve(srcDir, 'password-reset.html'),
      },
    },
    plugins: [
      handlebars({
        partialDirectory: resolve(srcDir, 'partials'),
        context() {
          return {
            title: page === 'login' ? 'Auth' : 'Password Reset',
          }
        },
      }),
      viteSingleFile(),
    ],
  }
})
