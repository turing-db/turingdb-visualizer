#!/bin/bash

set -e

echo "🔧 Building turingcanvas and main application..."

# Build turingcanvas first
echo "📦 Building turingcanvas..."
cd turingcanvas
bun install --frozen-lockfile
bun run build
cd ..

# Install main app dependencies 
echo "📦 Installing main app dependencies..."
bun install --frozen-lockfile

echo "✅ Build complete! You can now run:"
echo "  bun run dev     # Start development server"
echo "  bun run build   # Build for production"