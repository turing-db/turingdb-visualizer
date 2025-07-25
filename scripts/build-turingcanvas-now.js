#!/usr/bin/env node

// Quick script to build turingcanvas immediately
// This can be run manually when needed

import { execSync } from 'child_process'

console.log('🔧 Building turingcanvas immediately...')

try {
  execSync('node scripts/build-turingcanvas.js --force', { stdio: 'inherit' })
  console.log('✅ turingcanvas built successfully! You can now run bun run dev')
} catch (error) {
  console.error('❌ Failed to build turingcanvas:', error.message)
  process.exit(1)
}