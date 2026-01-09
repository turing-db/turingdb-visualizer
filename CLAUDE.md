# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development
npm run dev              # Start dev server (Vite, binds 0.0.0.0)

# Build
npm run build            # Production build
npm run build:dev        # Development build

# Production
npm run prod             # Build and start Express server
npm run start            # Start preview server (requires prior build)
```

**Environment Variables:**
- `TURING_FRONTEND_PORT` - Frontend port (default: 8080)
- `TURING_API_PORT` - Backend API port (default: 6666)

## Architecture Overview

This is a React/TypeScript graph visualization application for TuringDB, using Three.js for GPU-accelerated rendering.

### Core Stack
- **Vite** - Build tool and dev server
- **React 18** + TypeScript - UI framework
- **Three.js** + D3.js - Graph rendering and force simulation
- **Zustand** - Client state management
- **TanStack React Query** - Server state and caching
- **Blueprint.js** - UI component library
- **Tailwind CSS** - Styling

### Key Directories

**`docs/`** - Implementation notes and documentation
- Contains detailed design decisions and technical documentation
- **Must be carefully read** before making changes to related areas

**`src/turingcanvas/`** - Internal Three.js visualization library
- GPU-instanced hexagon nodes (handles ~20k nodes)
- D3 force-directed layout simulation
- Custom GLSL shaders for node/edge rendering
- `TuringInstance` manages all canvas state (nodes, edges, selection)
- Has its own tsconfig with relaxed settings (`strict: false`)

**`src/stores/`** - Zustand state management
- `app.store.ts` - Theme, current page, selected graph
- `vis.store.ts` - Entity cache, neighbourhood tracking, node inspector state, hidden nodes
- `canvas.store.ts` - Re-exports canvas store from turingcanvas

**`src/api/`** - Backend API integration
- `api.ts` - API functions (getNodes, getEdges, executeCypherQuery, etc.)
- `args/` - Request type definitions
- `responses/` - Response type definitions
- API proxied through Vite to `http://localhost:${TURING_API_PORT}`

**`src/hooks/`** - Custom React hooks
- `use-graph-entities.ts` - Fetches and caches graph data
- `use-cypher-query.ts` - Executes Cypher queries with graph reset

**`src/components/viewer/`** - Main visualization UI
- `menus/top-toolbar.tsx` - Query input and toolbar buttons
- `node-inspector/` - Side panel showing node details (collapsible/expandable)
- Context menus for canvas and node interactions

### State Flow

1. User selects graph → `app.store.graphName` updated
2. Entities fetched via React Query hooks → cached in `vis.store.entityCache`
3. Visible nodes tracked in `vis.store.neighbourhood` (a `NeighbourMap`)
4. Canvas renders via `turingcanvas` which syncs with `canvas.store`
5. Node selection triggers `vis.store.inspectNodeInfo` → opens inspector panel

### TypeScript Configuration

Path aliases configured in `tsconfig.json`:
- `@/*` → `./src/*`
- `@turingcanvas` → `./src/turingcanvas/src/index.ts`

The turingcanvas library is excluded from strict type checking but included via path alias.

## Code Style

Biome handles formatting and linting:
- 2-space indentation
- 100-character line width
- Auto import organization
