#!/usr/bin/env node

// Emergency build script to get turingcanvas built immediately
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚨 Emergency turingcanvas build started...');

try {
  // Change to turingcanvas directory
  process.chdir('turingcanvas');
  
  // Install dependencies
  console.log('📦 Installing turingcanvas dependencies...');
  execSync('bun install', { stdio: 'inherit' });
  
  // Build the package
  console.log('🔧 Building turingcanvas...');
  execSync('bun run build', { stdio: 'inherit' });
  
  // Verify build
  const distPath = path.join(process.cwd(), 'dist');
  const indexPath = path.join(distPath, 'index.js');
  
  if (fs.existsSync(indexPath)) {
    console.log('✅ turingcanvas built successfully!');
    console.log(`📂 Built files available at: ${distPath}`);
  } else {
    throw new Error('Build completed but dist/index.js not found');
  }
  
  // Go back to root
  process.chdir('..');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}