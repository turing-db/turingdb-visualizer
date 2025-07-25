#!/usr/bin/env node

// Force rebuild turingcanvas immediately
import { execSync } from 'child_process'
import { existsSync } from 'fs'

console.log('🔧 Force building turingcanvas...')

try {
  // Check if turingcanvas directory exists
  if (!existsSync('turingcanvas')) {
    console.error('❌ turingcanvas directory not found!')
    process.exit(1)
  }

  // Change to turingcanvas directory and build
  process.chdir('turingcanvas')
  
  // Install dependencies if needed
  if (!existsSync('node_modules')) {
    console.log('📦 Installing turingcanvas dependencies...')
    try {
      execSync('npm install', { stdio: 'inherit' })
    } catch (error) {
      console.error('❌ Failed to install dependencies:', error.message)
      process.exit(1)
    }
  }
  
  // Build the package
  console.log('🏗️  Building turingcanvas package...')
  try {
    execSync('npm run build', { stdio: 'inherit' })
  } catch (error) {
    console.error('❌ Failed to build turingcanvas:', error.message)
    process.exit(1)
  }
  
  // Go back to root
  process.chdir('..')
  
  console.log('✅ turingcanvas force built successfully!')
  
} catch (error) {
  console.error('❌ Failed to force build turingcanvas:', error.message)
  process.exit(1)
}