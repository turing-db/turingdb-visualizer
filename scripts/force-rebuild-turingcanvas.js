#!/usr/bin/env node

import { execSync } from 'child_process'
import { rmSync, existsSync } from 'fs'
import path from 'path'

const TURINGCANVAS_DIR = 'turingcanvas'
const DIST_DIR = path.join(TURINGCANVAS_DIR, 'dist')

console.log('🧹 Force cleaning and rebuilding turingcanvas...')

try {
  // Clean dist directory completely
  if (existsSync(DIST_DIR)) {
    console.log('🗑️  Removing old dist directory...')
    rmSync(DIST_DIR, { recursive: true, force: true })
  }

  // Change to turingcanvas directory
  process.chdir(TURINGCANVAS_DIR)
  
  // Clean any cached build files
  if (existsSync('node_modules/.cache')) {
    rmSync('node_modules/.cache', { recursive: true, force: true })
  }
  
  // Build the package with explicit settings
  console.log('🏗️  Building turingcanvas package with relaxed TypeScript...')
  execSync('npm run build', { stdio: 'inherit' })
  
  // Go back to root
  process.chdir('..')
  
  console.log('✅ turingcanvas completely rebuilt!')
  
} catch (error) {
  console.error('❌ Failed to rebuild turingcanvas:', error.message)
  console.log('📋 Try running this manually:')
  console.log('  cd turingcanvas')
  console.log('  rm -rf dist')
  console.log('  npm run build')
  console.log('  cd ..')
  process.exit(1)
}