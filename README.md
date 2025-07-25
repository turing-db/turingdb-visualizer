# Turing Graph Visualizer

## Setup

The project automatically builds `turingcanvas` when you install dependencies or start development.

### Quick Start

```bash
bun install    # Automatically runs setup
bun run dev    # Starts development server
```

### Manual Setup (if needed)

If automatic setup fails:

```bash
node scripts/setup.js
```

## Development

Start the development server:

```bash
bun run dev
```

The app automatically ensures `turingcanvas` is built before starting.

## Building

Build for production:

```bash
bun run build
```

## Scripts

- `node scripts/setup.js` - Complete project setup (builds turingcanvas + installs dependencies)
- `node scripts/build-turingcanvas-now.js` - Quick build of turingcanvas package
- `node scripts/build-turingcanvas.js` - Build turingcanvas with options  
- `node scripts/clean.js` - Clean all build artifacts and dependencies

## Troubleshooting

If you encounter TypeScript errors about missing `turingcanvas` module:

1. Quick fix: `node scripts/build-turingcanvas-now.js`
2. Or clean setup: `node scripts/clean.js && bun install`
3. Then start: `bun run dev`
