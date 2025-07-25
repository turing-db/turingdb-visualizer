#!/usr/bin/env node

import { rmSync, existsSync } from 'fs'
import path from 'path'

const pathsToClean = [
  'turingcanvas/dist',
  'turingcanvas/node_modules',
  'node_modules',
  'dist',
  '.vite'
]

console.log('🧹 Cleaning project...')

for (const cleanPath of pathsToClean) {
  if (existsSync(cleanPath)) {
    console.log(`  Removing ${cleanPath}`)
    rmSync(cleanPath, { recursive: true, force: true })
  }
}

console.log('✅ Clean complete!')
console.log('Run "bun install" and "bun run dev" to start fresh')