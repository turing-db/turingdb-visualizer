#!/bin/bash

echo "🚀 Manual turingcanvas build..."

# Go to turingcanvas directory
cd turingcanvas || exit 1

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the package
echo "🏗️  Building package..."
npm run build

# Check if build was successful
if [ -f "dist/index.js" ]; then
    echo "✅ Build successful!"
    echo "📄 Generated files:"
    ls -la dist/
else
    echo "❌ Build failed - no index.js found"
    exit 1
fi

cd ..
echo "🎉 turingcanvas is now ready!"