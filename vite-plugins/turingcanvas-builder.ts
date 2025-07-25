import { execSync } from 'child_process'
import { existsSync } from 'fs'
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
    
    console.log('🔧 Building turingcanvas dependency...')
    
    try {
      // Run the build script
      execSync('node scripts/build-turingcanvas.js', { 
        stdio: 'inherit',
        cwd: process.cwd()
      })
      
      isBuilt = true
      console.log('✅ turingcanvas ready')
      
    } catch (error) {
      console.error('❌ Failed to build turingcanvas:', error)
      throw error
    }
  }
  
  return {
    name: 'turingcanvas-builder',
    enforce: 'pre',
    
    configResolved() {
      // Build turingcanvas before Vite resolves config and TypeScript checks
      if (!checkIfBuilt()) {
        buildTuringCanvas()
      }
    },
    
    buildStart() {
      // Build turingcanvas before Vite starts building
      if (!checkIfBuilt()) {
        buildTuringCanvas()
      }
    }
  }
}