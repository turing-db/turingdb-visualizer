#!/usr/bin/env node

import { execSync } from 'child_process'
import { rmSync, existsSync } from 'fs'
import path from 'path'

const TURINGCANVAS_DIR = 'turingcanvas'
const DIST_DIR = path.join(TURINGCANVAS_DIR, 'dist')

console.log('🧹 Complete clean and rebuild...')

try {
  // Remove ALL build artifacts
  if (existsSync(DIST_DIR)) {
    console.log('🗑️  Removing turingcanvas dist directory...')
    rmSync(DIST_DIR, { recursive: true, force: true })
  }

  if (existsSync('dist')) {
    console.log('🗑️  Removing main app dist directory...')
    rmSync('dist', { recursive: true, force: true })
  }

  // Clean node_modules cache
  if (existsSync('node_modules/.vite')) {
    rmSync('node_modules/.vite', { recursive: true, force: true })
  }

  // Change to turingcanvas directory
  process.chdir(TURINGCANVAS_DIR)
  
  // Clean any cached build files
  if (existsSync('node_modules/.cache')) {
    rmSync('node_modules/.cache', { recursive: true, force: true })
  }
  
  // Rebuild turingcanvas with no TypeScript checking
  console.log('🏗️  Building turingcanvas with relaxed settings...')
  execSync('npm run build', { stdio: 'inherit' })
  
  // Go back to root
  process.chdir('..')
  
  console.log('✅ Complete rebuild finished!')
  console.log('🚀 You can now run: bun run dev')
  
} catch (error) {
  console.error('❌ Failed to rebuild:', error.message)
  process.exit(1)
}