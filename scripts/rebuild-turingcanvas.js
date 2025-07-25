#!/usr/bin/env node

import { execSync } from 'child_process'
import { rmSync, existsSync } from 'fs'
import path from 'path'

const TURINGCANVAS_DIR = 'turingcanvas'
const DIST_DIR = path.join(TURINGCANVAS_DIR, 'dist')

console.log('🧹 Cleaning and rebuilding turingcanvas...')

try {
  // Clean dist directory
  if (existsSync(DIST_DIR)) {
    rmSync(DIST_DIR, { recursive: true, force: true })
  }

  // Change to turingcanvas directory
  process.chdir(TURINGCANVAS_DIR)
  
  // Build the package
  console.log('🏗️  Building turingcanvas package...')
  execSync('npm run build', { stdio: 'inherit' })
  
  // Go back to root
  process.chdir('..')
  
  console.log('✅ turingcanvas rebuilt successfully!')
  
} catch (error) {
  console.error('❌ Failed to rebuild turingcanvas:', error.message)
  process.exit(1)
}