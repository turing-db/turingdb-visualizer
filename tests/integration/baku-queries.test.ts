/**
 * THE PHASE GATE for the baku domain module.
 *
 * Runs EVERY Cypher string in `baku/queries.ts` against the live `baku` graph
 * and fails on any non-null `error` — on this dialect a broken query renders as
 * an empty panel, so only a live sweep catches it. Then checks the numbers the
 * presets claim (they are the pipeline's, cross-checked there against
 * scipy/networkx), the model the 3D view is drawn from, and the one contract
 * the shell files must keep: row i of skin.pos.bin IS Vertex {id: i}.
 *
 * Needs the baku graph reachable at BAKU_API (default 127.0.0.1:6682, e.g. a
 * tunnel to the graph's server). Skips, loudly, when it is not.
 */
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, test } from 'vitest'
import type { CypherTable } from '@/api/api'
import { UnsafeQuery, lint } from '@/components/viewer/baku/lint'
import {
  type BakuModel,
  interpret,
  loadModel,
  patchAnchors,
  routedAdjacency,
} from '@/components/viewer/baku/model'
import * as Q from '@/components/viewer/baku/queries'

const BASE = process.env.BAKU_API ?? 'http://127.0.0.1:6682'
const GRAPH = 'baku'

async function run(query: string): Promise<CypherTable> {
  const res = await fetch(`${BASE}/query?graph=${GRAPH}`, { method: 'POST', body: query })
  const j = await res.json()
  if (j.error) throw new Error(`${j.error}: ${j.error_details ?? ''}\n${query.slice(0, 200)}`)
  const rows: unknown[][] = []
  for (const chunk of (j.data ?? []) as unknown[][][]) {
    const n = Math.max(0, ...chunk.map((c) => (Array.isArray(c) ? c.length : 0)))
    for (let i = 0; i < n; i++) rows.push(chunk.map((c) => (c as unknown[])[i]))
  }
  return { columns: j.header?.column_names ?? [], types: j.header?.column_types ?? [], rows }
}

/** Decided BEFORE the suites are defined, so an unreachable graph shows up as
 *  SKIPPED in the summary — not as a row of passes that checked nothing. */
async function reachable(): Promise<boolean> {
  try {
    const r = await fetch(`${BASE}/query?graph=${GRAPH}`, { method: 'POST', body: 'CALL db.labels()' })
    return !(await r.json()).error
  } catch {
    return false
  }
}
const up = await reachable()
if (!up) console.warn(`baku graph not reachable at ${BASE} — open the tunnel; live baku tests SKIPPED`)
const live = up ? describe : describe.skip

let model: BakuModel
beforeAll(async () => {
  if (up) model = await loadModel(run)
}, 120_000)

const STATIC = Object.entries(Q).filter(([, v]) => typeof v === 'string') as Array<[string, string]>

live('every static query runs', () => {
  test.each(STATIC)('%s', async (_name, q) => {
    await expect(run(q)).resolves.toBeDefined()
  })
})

live('presets', () => {
  const runnable = Q.PRESETS.filter((p) => !p.cypher.startsWith('--'))
  test.each(runnable.map((p) => [p.key, p.cypher]))('%s passes the lint and runs', async (_k, q) => {
    expect(lint(q)).toBe(q)
    await expect(run(q)).resolves.toBeDefined()
  })

  test('geodesic: 83.56 m, 170 hops, v:9991 -> v:434', async () => {
    const q = Q.PRESETS.find((p) => p.key === 'geodesic')!.cypher
    const t = await run(q)
    const h = interpret(q, t, model)
    expect(h.pathDist).toBeCloseTo(83.5606, 3)
    expect(h.paths[0].kind).toBe('vertex')
    expect(h.paths[0].ids.length - 1).toBe(170)
    expect(h.paths[0].ids[0]).toBe(9991)
    expect(h.paths[0].ids.at(-1)).toBe(434)
    expect(h.edges.length).toBe(170) // the path's own edges, for the 2D subgraph
  })

  test('load path: 63.73 m, 23 members', async () => {
    const q = Q.PRESETS.find((p) => p.key === 'loadpath')!.cypher
    const h = interpret(q, await run(q), model)
    expect(h.pathDist).toBeCloseTo(63.732, 2)
    expect(h.paths[0].kind).toBe('joint')
    expect(h.paths[0].ids.length - 1).toBe(23)
  })

  test('smoothest: 8 patch hops, ending at p:21', async () => {
    const q = Q.PRESETS.find((p) => p.key === 'smoothest')!.cypher
    const h = interpret(q, await run(q), model)
    expect(h.paths[0].kind).toBe('patch')
    expect(h.paths[0].ids).toEqual([15, 16, 17, 18, 19, 20, 10, 11, 21])
  })

  test('similar: vector search from the seed embedding returns the seed first', async () => {
    const e = await run(Q.patchEmbedding('p:112'))
    const vec = e.rows[0][0] as number[]
    expect(vec.length).toBe(32)
    const q = Q.similarTo(vec, 10)
    expect(lint(q)).toBe(q)
    const t = await run(q)
    expect(t.rows.length).toBe(10)
    const uid = t.columns.indexOf('p.uid')
    const score = t.columns.indexOf('score')
    expect(t.rows[0][uid]).toBe('p:112') // ranked: the seed is its own best match
    const scores = t.rows.map((r) => Number(r[score]))
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
    expect(interpret(q, t, model).patches.size).toBe(10)
  })

  test('node columns are told apart from edge columns (both UInt64)', async () => {
    const q = Q.PRESETS.find((p) => p.key === 'neighbours')!.cypher
    const h = interpret(q, await run(q), model)
    expect(h.patches.has(112)).toBe(true)
    expect(h.vertices.size).toBe(0) // `e` is an edge id; read as a node it would hit random vertices
  })
})

live('inspector cards', () => {
  test('vertex, patch, joint', async () => {
    for (const q of [Q.vertexCard(1234), Q.patchCard(112), Q.jointCard(390)]) {
      const t = await run(q)
      expect(t.rows.length).toBe(1)
    }
  })
})

live('the model the 3D view draws', () => {
  test('counts match the pipeline', () => {
    expect(model.pos.length / 3).toBe(29288)
    expect(model.meshEdges.length / 2).toBe(86739)
    expect(model.meshEdgesDirected).toBe(173478)
    expect(model.patches.filter(Boolean).length).toBe(221)
    expect(model.frame?.node.filter((n) => n >= 0).length).toBe(984)
    expect(model.frame!.members.length / 2).toBe(1218)
    expect(model.frame!.contacts.length / 2).toBe(400)
    expect([...model.frame!.support].filter(Boolean).length).toBe(20)
    expect([...model.vertexPatch].every((p) => p >= 0)).toBe(true)
  })

  test('patch anchors lie on the skin, inside their own patch', () => {
    const a = patchAnchors(model)
    a.forEach((v, p) => {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(model.vertexPatch[v]).toBe(p)
    })
  })

  test('every ADJACENT_TO routes along the skin (none drawn straight)', () => {
    const { pairs, straight } = routedAdjacency(model, patchAnchors(model))
    expect(straight).toBe(0)
    expect(pairs.length).toBeGreaterThan(540 * 2)
  })

  test('skin.pos.bin row i IS Vertex {id: i} (the shell/graph contract)', () => {
    const f = path.resolve(__dirname, '../../public/baku/skin.pos.bin')
    if (!existsSync(f)) {
      console.warn('public/baku/skin.pos.bin missing — run `make web` in baku-graph and copy it; contract NOT checked')
      return
    }
    const b = readFileSync(f)
    const pos = new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4)
    expect(pos.length).toBe(model.pos.length)
    let worst = 0
    for (let i = 0; i < pos.length; i++) worst = Math.max(worst, Math.abs(pos[i] - model.pos[i]))
    expect(worst).toBeLessThan(1e-4) // JSONL rounds to 1e-5 m
  })
})

describe('lint negative controls (these must be BLOCKED)', () => {
  test('a long OR chain', () => {
    const q = `MATCH (v:Vertex) WHERE ${Array.from({ length: 1200 }, (_, i) => `v.id = ${i}`).join(' OR ')} RETURN v`
    expect(() => lint(q)).toThrow(UnsafeQuery)
  })
  test('an endpoint property after shortestPath', () => {
    expect(() =>
      lint("MATCH (a:Joint {uid: 'j:1'}), (b:Joint {uid: 'j:2'}) shortestPath(a, b, length, dist, path) RETURN a.uid")
    ).toThrow(UnsafeQuery)
  })
  test('writes', () => {
    for (const q of ["CREATE (:X {a: 1})", "MATCH (v:Vertex) SET v.flags = 0", 'CHANGE NEW', 'MATCH (n) DETACH DELETE n'])
      expect(() => lint(q)).toThrow(UnsafeQuery)
  })
  test('keywords inside string literals do not count', () => {
    expect(lint("MATCH (z:Zone {name: 'CREATE SET'}) RETURN z")).toBeDefined()
  })
})
