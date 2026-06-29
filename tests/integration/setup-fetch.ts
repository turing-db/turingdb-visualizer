// Per-worker setup: the api.ts functions call relative URLs like
// `/api/get_graph_status`, relying on the Vite/Express dev proxy to strip the
// `/api` prefix and forward to the TuringDB server. There is no such proxy in
// Node, so we shim global fetch to reproduce it: `/api/X` -> `${API_BASE}/X`.
//
// This lets the tests exercise the *exact* shipping code in src/api/api.ts
// against a real TuringDB, with no changes to that code.
import { API_BASE } from './config'

const realFetch = globalThis.fetch

function rewrite(url: string): string {
  return url.startsWith('/api') ? API_BASE + url.replace(/^\/api/, '') : url
}

globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  if (typeof input === 'string') {
    return realFetch(rewrite(input), init)
  }
  if (input instanceof URL) {
    return realFetch(rewrite(input.toString()), init)
  }
  // Request object — rebuild against the rewritten URL, preserving options.
  const req = input as Request
  return realFetch(new Request(rewrite(req.url), req), init)
}) as typeof fetch
