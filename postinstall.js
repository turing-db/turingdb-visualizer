#!/usr/bin/env node

// This script runs automatically after npm/bun install
// It ensures turingcanvas is built and ready to use

import { execSync } from 'child_process'
import { existsSync } from 'fs'

console.log('📦 Running postinstall setup...')

try {
  // Check if turingcanvas is already built
  if (!existsSync('turingcanvas/dist/index.js')) {
    console.log('🔧 Building turingcanvas...')
    execSync('node scripts/build-turingcanvas.js', { stdio: 'inherit' })
  } else {
    console.log('✅ turingcanvas already built')
  }
} catch (error) {
  console.warn('⚠️  Postinstall warning:', error.message)
  console.log('You can manually run: node scripts/setup.js')
}