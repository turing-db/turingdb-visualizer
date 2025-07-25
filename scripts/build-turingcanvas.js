#!/usr/bin/env node

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'

const TURINGCANVAS_DIR = 'turingcanvas'
const DIST_DIR = path.join(TURINGCANVAS_DIR, 'dist')

function buildTuringCanvas() {
  console.log('🔧 Building turingcanvas...')
  
  try {
    // Change to turingcanvas directory and build
    process.chdir(TURINGCANVAS_DIR)
    
    // Install dependencies if needed
    if (!existsSync('node_modules')) {
      console.log('📦 Installing turingcanvas dependencies...')
      execSync('bun install --frozen-lockfile', { stdio: 'inherit' })
    }
    
    // Build the package
    console.log('🏗️  Building turingcanvas package...')
    execSync('bun run build', { stdio: 'inherit' })
    
    // Go back to root
    process.chdir('..')
    
    console.log('✅ turingcanvas built successfully!')
    
  } catch (error) {
    console.error('❌ Failed to build turingcanvas:', error.message)
    process.exit(1)
  }
}

function checkIfBuilt() {
  return existsSync(DIST_DIR) && existsSync(path.join(DIST_DIR, 'index.js'))
}

// Build if not already built or if forced
const force = process.argv.includes('--force')
if (force || !checkIfBuilt()) {
  buildTuringCanvas()
} else {
  console.log('✅ turingcanvas already built')
}