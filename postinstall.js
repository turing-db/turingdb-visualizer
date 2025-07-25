#!/usr/bin/env node

// This script runs automatically after npm/bun install
// It ensures turingcanvas is built and ready to use

import { execSync } from 'child_process'

console.log('📦 Running postinstall setup...')

try {
  // Run the full setup script to ensure everything is built
  console.log('🚀 Running setup script...')
  execSync('node scripts/setup.js', { stdio: 'inherit' })
} catch (error) {
  console.warn('⚠️  Postinstall warning:', error.message)
  console.log('You can manually run: node scripts/setup.js')
}