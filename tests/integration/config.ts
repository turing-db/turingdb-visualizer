// Shared constants for the API-contract integration suite.
// Both the Vitest globalSetup (which boots turingdb) and the per-worker fetch
// shim import these, so the port/base/graph are defined in exactly one place.

// A dedicated port that won't collide with a dev backend on the default 6666.
export const TEST_PORT = 6699
export const API_BASE = `http://127.0.0.1:${TEST_PORT}`

// Name of the fixture graph seeded by seed.py.
export const TEST_GRAPH = 'vis_test'
