#!/usr/bin/env node

import { execSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'

console.log('🔧 Immediate turingcanvas build...')

const TURINGCANVAS_DIR = 'turingcanvas'
const DIST_DIR = path.join(TURINGCANVAS_DIR, 'dist')

try {
  // Check if turingcanvas directory exists
  if (!existsSync(TURINGCANVAS_DIR)) {
    console.error('❌ turingcanvas directory not found!')
    process.exit(1)
  }

  console.log('📁 Found turingcanvas directory')
  
  // Change to turingcanvas directory
  process.chdir(TURINGCANVAS_DIR)
  
  // Install dependencies if needed
  if (!existsSync('node_modules')) {
    console.log('📦 Installing turingcanvas dependencies...')
    execSync('npm install', { stdio: 'inherit' })
  }
  
  // Ensure dist directory exists and clean it
  if (existsSync('dist')) {
    console.log('🗑️  Cleaning existing dist directory...')
    const { rmSync } = await import('fs')
    rmSync('dist', { recursive: true, force: true })
  }
  
  // Build the package
  console.log('🏗️  Building turingcanvas package...')
  execSync('npm run build', { stdio: 'inherit' })
  
  // Check if build was successful
  if (existsSync('dist/index.js')) {
    console.log('✅ Build successful!')
    console.log('📄 Generated files:')
    try {
      execSync('ls -la dist/', { stdio: 'inherit' })
    } catch {
      console.log('📄 Dist directory created')
    }
  } else {
    console.error('❌ Build failed - no index.js found')
    process.exit(1)
  }
  
  // Go back to root
  process.chdir('..')
  
  console.log('✅ turingcanvas is now ready!')
  
} catch (error) {
  console.error('❌ Failed to build turingcanvas:', error.message)
  process.exit(1)
}