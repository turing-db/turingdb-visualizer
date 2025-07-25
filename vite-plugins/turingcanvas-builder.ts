import { execSync } from 'child_process'
import { existsSync, rmSync } from 'fs'
import path from 'path'
import type { Plugin } from 'vite'

export function turingcanvasBuilder(): Plugin {
  let isBuilt = false
  
  const checkIfBuilt = () => {
    const distPath = path.resolve('turingcanvas/dist')
    return existsSync(distPath) && existsSync(path.join(distPath, 'index.js'))
  }
  
  const buildTuringCanvas = () => {
    if (isBuilt) return
    
    console.log('🔧 Building turingcanvas...')
    
    try {
      // Only remove turingcanvas dist, not everything
      const distPath = 'turingcanvas/dist'
      if (existsSync(distPath)) {
        console.log(`🗑️  Cleaning ${distPath}...`)
        rmSync(distPath, { recursive: true, force: true })
      }

      // Build turingcanvas
      console.log('🏗️  Building turingcanvas package...')
      const originalCwd = process.cwd()
      try {
        process.chdir('turingcanvas')
        execSync('bun run build', { stdio: 'inherit' })
      } finally {
        process.chdir(originalCwd)
      }
      
      isBuilt = true
      console.log('✅ turingcanvas built successfully!')
      
    } catch (error) {
      console.error('❌ turingcanvas build failed:', error)
      throw error
    }
  }
  
  return {
    name: 'turingcanvas-builder',
    enforce: 'pre',
    
    buildStart() {
      // Only build if not already built
      if (!isBuilt && !checkIfBuilt()) {
        buildTuringCanvas()
      }
    }
  }
}