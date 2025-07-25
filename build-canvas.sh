#!/bin/bash

echo "Building turingcanvas..."
cd turingcanvas
bun install
bun run build
cd ..
echo "turingcanvas built successfully!"
echo "Now run: bun install && bun run dev"