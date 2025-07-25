#!/bin/bash

set -euo pipefail

# Canvas
cd "$1/../turingcanvas"

echo "- Installing Turing canvas dependencies"
bun i --frozen-lockfile

echo "- Building Turing canvas"
bun run build

echo "- Linting Turing canvas"
bunx biome lint src

echo "- Formatting Turing canvas"
bunx biome format src

# Server
cd "$1/../server"

echo "- Installing server dependencies"
bun i --frozen-lockfile

# Actual app
cd "$1"

echo "- Installing App2 dependencies at $1"
bun i --frozen-lockfile

echo "- Building App2"
bun run build

echo "- Linting App2"
bunx biome lint src

echo "- Formatting App2"
bunx biome format src

