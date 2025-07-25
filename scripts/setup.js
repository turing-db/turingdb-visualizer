#!/usr/bin/env node

import { execSync } from 'child_process'

console.log('🚀 Setting up project...')

try {
  // Build turingcanvas first
  console.log('📦 Building turingcanvas...')
  execSync('node scripts/build-turingcanvas.js --force', { stdio: 'inherit' })
  
  // Install main dependencies
  console.log('📦 Installing main app dependencies...')
  execSync('bun install --frozen-lockfile', { stdio: 'inherit' })
  
  console.log('✅ Setup complete!')
  console.log('')
  console.log('Available commands:')
  console.log('  bun run dev     # Start development server')
  console.log('  bun run build   # Build for production')
  console.log('  node scripts/clean.js  # Clean all build artifacts')
  
} catch (error) {
  console.error('❌ Setup failed:', error.message)
  process.exit(1)
}