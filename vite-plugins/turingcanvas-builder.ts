import { execSync } from 'child_process'
import { existsSync, rmSync } from 'fs'
import path from 'path'
import type { Plugin } from 'vite'

export function turingcanvasBuilder(): Plugin {
  // Build immediately when the plugin is loaded
  const distPath = path.resolve('turingcanvas/dist')
  const indexPath = path.join(distPath, 'index.js')
  
  if (!existsSync(indexPath)) {
    console.log('🔧 Building turingcanvas (plugin initialization)...')
    
    try {
      // Clean dist
      if (existsSync(distPath)) {
        rmSync(distPath, { recursive: true, force: true })
      }

      // Build synchronously
      const originalCwd = process.cwd()
      try {
        process.chdir('turingcanvas')
        execSync('bun run build', { stdio: 'inherit' })
      } finally {
        process.chdir(originalCwd)
      }
      
      console.log('✅ turingcanvas built successfully!')
      
    } catch (error) {
      console.error('❌ turingcanvas build failed:', error)
      throw error
    }
  } else {
    console.log('✅ turingcanvas already built')
  }
  
  return {
    name: 'turingcanvas-builder',
    enforce: 'pre'
  }
}