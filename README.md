# Turing Graph Visualizer

A React-based graph visualization application built with Vite, TypeScript, and a custom canvas library.

## 🚀 Quick Start

**First time setup:**
```bash
# Build turingcanvas (required first step)
node build-turingcanvas-now.js

# Install main app dependencies
bun install

# Start development server
bun run dev
```

**Development workflow:**
```bash
bun run dev     # Start development server
bun run build   # Build for production
```

## 📁 Project Structure

- `/src` - Main application source code
- `/turingcanvas` - Custom canvas visualization library
- `/scripts` - Build and utility scripts
- `/vite-plugins` - Custom Vite plugins

## 🔧 Troubleshooting

If you see `Cannot find module 'turingcanvas'` errors:
```bash
node build-turingcanvas-now.js
```

This builds the turingcanvas package which the main app depends on.

## 🏗️ Build Process

The turingcanvas library must be built before the main application can use it. The emergency build script handles this automatically.