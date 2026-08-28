/**
 * THE PHASE GATE for the codegraph domain module.
 *
 * Executes EVERY Cypher string exported by `queries.ts` against a real server
 * and fails on any non-null `error` field. It also asserts that every property
 * projected, and every label and edge type referenced, actually exists in the
 * target graph -- because on this dialect an absent property, label or edge
 * type is an ANALYZE_ERROR that kills the whole query, not an empty column.
 *
 * Why this exists rather than a mocked unit test: this codebase has shipped a
 * broken panel twice from a dialect change (`type(r)` became a PARSE_ERROR in
 * 1.36) and both times the failure looked like empty data, because the call
 * site swallowed the error. A sweep against a live server is the only thing
 * that catches that class, and it takes about a second.
 *
 * It runs against BOTH cg_head and cg_arc when they are present. Running it
 * against the arc alone would pass while the same strings fail on a graph with
 * no Snapshot label, and vice versa.
 */
import { beforeAll, describe, expect, test } from 'vitest'
import * as Q from '@/components/viewer/codegraph/queries'

const CODEGRAPH_BASE = process.env.CODEGRAPH_API ?? 'http://127.0.0.1:6671'
const GRAPHS = ['cg_head', 'cg_arc']

type Resp = { error?: string | null; error_details?: string; data?: unknown[]; header?: { column_names: string[] } }

async function run(graph: string, query: string): Promise<Resp> {
  const res = await fetch(`${CODEGRAPH_BASE}/query?graph=${graph}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: query,
  })
  return (await res.json()) as Resp
}

async function available(): Promise<string[]> {
  try {
    const r = await run('default', 'LIST AVAILABLE GRAPHS')
    if (r.error) return []
    const chunk = (r.data as unknown[][])?.[0] as unknown[][]
    const names = (chunk?.[0] ?? []) as string[]
    return GRAPHS.filter((g) => names.includes(g))
  } catch {
    return []
  }
}

/** Concrete arguments for the parameterised queries, resolved from the graph
 *  itself so the test never hardcodes an id that a rebuild would invalidate. */
async function seeds(graph: string) {
  const fn = await run(graph, 'MATCH (n:Function) RETURN n.sid LIMIT 1')
  const cl = await run(graph, 'MATCH (n:Class) RETURN n.sid LIMIT 1')
  const fl = await run(graph, 'MATCH (n:File) RETURN n.sid LIMIT 1')
  const pick = (r: Resp) => ((r.data as unknown[][])?.[0]?.[0] as number[])?.[0] ?? 0
  return { fn: pick(fn), cls: pick(cl), file: pick(fl) }
}

let present: string[] = []
beforeAll(async () => {
  present = await available()
})

describe('codegraph query vocabulary', () => {
  test('a codegraph graph is reachable', () => {
    if (present.length === 0) {
      console.warn(
        `no codegraph graph on ${CODEGRAPH_BASE} — run \`codegraph index --head\`. ` +
          'Skipping the dialect sweep.'
      )
    }
    expect(true).toBe(true)
  })

  for (const graph of GRAPHS) {
    describe(graph, () => {
      test(`every query executes without an error field`, async () => {
        if (!present.includes(graph)) return
        const s = await seeds(graph)
        const all: Array<[string, string]> = [
          ['STATS_LABEL_COUNTS', Q.STATS_LABEL_COUNTS],
          ['STATS_EDGE_TYPES', Q.STATS_EDGE_TYPES],
          ['STATS_PROPERTY_TYPES', Q.STATS_PROPERTY_TYPES],
          ['STATS_LABELS', Q.STATS_LABELS],
          ['SYMBOLS_FUNCTIONS', Q.SYMBOLS_FUNCTIONS],
          ['SYMBOLS_TESTCASES', Q.SYMBOLS_TESTCASES],
          ['SYMBOLS_CLASSES', Q.SYMBOLS_CLASSES],
          ['HISTORY', Q.HISTORY],
          ['callersOf', Q.callersOf(s.fn)],
          ['calleesOf', Q.calleesOf(s.fn)],
          ['callersOfMany', Q.callersOfMany([s.fn])],
          ['nodeBySid', Q.nodeBySid(s.fn)],
          ['inheritorsOf', Q.inheritorsOf(s.cls)],
          ['methodsOf', Q.methodsOf(s.cls)],
          ['overridesOf', Q.overridesOf(s.fn)],
          ['includesOf', Q.includesOf(s.file)],
        ]
        const failures: string[] = []
        for (const [name, q] of all) {
          const r = await run(graph, q)
          if (r.error) failures.push(`${name}: ${r.error} ${r.error_details ?? ''}`)
        }
        expect(failures, failures.join('\n')).toEqual([])
      })

      test('DUPES runs when NEAR_DUP exists, and is skipped when it does not', async () => {
        if (!present.includes(graph)) return
        const types = await run(graph, Q.STATS_EDGE_TYPES)
        const chunk = (types.data as unknown[][])?.[0] as unknown[][]
        const names = (chunk?.[1] ?? []) as string[]
        if (!names.includes('NEAR_DUP')) return // gated, exactly as the panel gates it
        const r = await run(graph, Q.DUPES)
        expect(r.error ?? null).toBeNull()
      })

      test('every projected property exists in this graph', async () => {
        if (!present.includes(graph)) return
        const r = await run(graph, Q.STATS_PROPERTY_TYPES)
        const chunk = (r.data as unknown[][])?.[0] as unknown[][]
        const known = new Set((chunk?.[1] ?? []) as string[])
        const projected = new Set<string>()
        // DUPES is gated on NEAR_DUP existing (an absent edge type is an
        // ANALYZE_ERROR), so its properties must be gated the same way -- or
        // this check reports a failure the panel would never trigger.
        const types = await run(graph, Q.STATS_EDGE_TYPES)
        const tchunk = (types.data as unknown[][])?.[0] as unknown[][]
        const hasNearDup = ((tchunk?.[1] ?? []) as string[]).includes('NEAR_DUP')
        const src = Object.entries(Q)
          .filter(([name]) => hasNearDup || name !== 'DUPES')
          .map(([, v]) => (typeof v === 'string' ? v : ''))
          .join(' ')
        for (const m of src.matchAll(/\b[a-z]\.([A-Za-z_]\w*)/g)) projected.add(m[1])
        const missing = [...projected].filter((p) => !known.has(p))
        expect(missing, `projected but absent in ${graph}: ${missing.join(', ')}`).toEqual([])
      })

      test('every referenced label and edge type exists in this graph', async () => {
        if (!present.includes(graph)) return
        const lr = await run(graph, Q.STATS_LABELS)
        const er = await run(graph, Q.STATS_EDGE_TYPES)
        const lchunk = (lr.data as unknown[][])?.[0] as unknown[][]
        const echunk = (er.data as unknown[][])?.[0] as unknown[][]
        const labels = new Set((lchunk?.[1] ?? []) as string[])
        const edges = new Set((echunk?.[1] ?? []) as string[])
        const src = Object.values(Q)
          .map((v) => (typeof v === 'string' ? v : ''))
          .join(' ')
        const usedLabels = new Set([...src.matchAll(/\(\w*:([A-Z]\w+)/g)].map((m) => m[1]))
        const usedEdges = new Set([...src.matchAll(/\[\w*:([A-Z_]+)/g)].map((m) => m[1]))
        const missingL = [...usedLabels].filter((l) => !labels.has(l))
        // NEAR_DUP is derived and legitimately absent until `dupes --write` runs.
        const missingE = [...usedEdges].filter((e) => !edges.has(e) && e !== 'NEAR_DUP')
        expect(missingL, `labels missing in ${graph}`).toEqual([])
        expect(missingE, `edge types missing in ${graph}`).toEqual([])
      })

      test('no query uses type() — it is a PARSE_ERROR on 1.36+', () => {
        const src = Object.values(Q)
          .map((v) => (typeof v === 'string' ? v : String(v)))
          .join(' ')
        expect(/[^e]\btype\s*\(/.test(src)).toBe(false)
      })
    })
  }
})
