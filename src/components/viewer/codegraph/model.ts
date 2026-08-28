/**
 * Data layer for the codegraph panel.
 *
 * Three things here are not obvious and are load-bearing:
 *
 * 1. Responses are COLUMN-oriented. `data` is a list of chunks, each chunk a
 *    list of COLUMNS, not rows. Every consumer that treats it as rows gets
 *    plausible nonsense, so there is exactly one flattener and everything goes
 *    through it.
 * 2. Errors arrive as HTTP 200 with a non-null `error`. `executeCypherQuery`
 *    already throws on that, so NOTHING here may catch-and-return-empty: a
 *    swallowed PARSE_ERROR looks exactly like an empty graph.
 * 3. The canvas is never given the whole graph. It gets a seeded subgraph under
 *    a hard cap, and the true totals are printed as text beside it.
 */
import { executeCypherQuery } from '@/api/api'
import * as Q from './queries'

export type CodeKind =
  | 'dir' | 'file' | 'class' | 'function' | 'testcase' | 'macro' | 'ext' | 'unresolved'

export interface CgNode {
  sid: number
  qname: string
  path: string
  line: number
  loc?: number
  tier?: string
  kind?: string
  label: CodeKind
}

export interface CgEdge {
  src: number
  dst: number
  type: string
  conf?: string
  ruleId?: string
}

export interface CgModel {
  nodes: Map<number, CgNode>
  edges: CgEdge[]
  /** degree per sid in THIS model — compared against the canvas to detect
   *  silently truncated edge loads. */
  degree: Map<number, number>
}

/** Node colour by artefact kind (default scheme in the subgraph tab). */
export const TYPE_COLOR: Record<CodeKind, number> = {
  dir: 0x64748b,
  file: 0x60a5fa,
  class: 0xa78bfa,
  function: 0x34d399,
  testcase: 0xf472b6,
  macro: 0xfbbf24,
  ext: 0x94a3b8,
  unresolved: 0xef4444,
}

/** Node colour by tier (default scheme in the time-travel tab). */
export const TIER_COLOR: Record<string, number> = {
  core: 0x34d399,
  test: 0xf472b6,
  tool: 0xfbbf24,
  fuzz: 0x94a3b8,
  regress: 0x94a3b8,
  sample: 0x94a3b8,
  python: 0x94a3b8,
}

/**
 * Confidence is expressed by opacity in v1. `setEdgeColor`/`setEdgeWidth` do
 * not exist on the upstream canvas, so per-edge styling waits for the Phase-10
 * backport rather than being faked.
 */
export const CONF_STYLE: Record<string, number> = {
  EXACT: 1.0,
  EXTRACTED: 1.0,
  INFERRED: 0.45,
  AMBIGUOUS: 0.2,
}

export const NODE_CAP = 800

/**
 * The ONE columnar flattener. `data` is chunk[] where each chunk is column[].
 * For chunk k, row i is `[chunk[0][i], chunk[1][i], ...]`.
 */
function columns(resp: unknown): unknown[][] {
  const rows: unknown[][] = []
  const chunks = (resp ?? []) as unknown[][][]
  for (const chunk of chunks) {
    if (!chunk || chunk.length === 0) continue
    const n = (chunk[0] as unknown[])?.length ?? 0
    for (let i = 0; i < n; i++) rows.push(chunk.map((col) => (col as unknown[])[i]))
  }
  return rows
}

async function q(graph: string, query: string, commit?: string): Promise<unknown[][]> {
  // Deliberately no try/catch: executeCypherQuery throws on the error field and
  // the panel renders a red card. Returning [] here would render an empty graph
  // and claim success.
  const data = await executeCypherQuery({ graph, query, commit })
  return columns(data)
}

function kindOf(label: string, kind?: string): CodeKind {
  if (label === 'TestCase') return 'testcase'
  if (label === 'Class') return 'class'
  if (label === 'ExternalHeader') return 'ext'
  if (label === 'File' || kind === 'file') return 'file'
  if (kind === 'dir') return 'dir'
  return 'function'
}

/** Load every symbol into a client-side Map. There is no string matching in the
 *  dialect, so search filters here — measured ~22 ms for the whole table. */
export async function loadSymbolTable(graph: string): Promise<Map<number, CgNode>> {
  const out = new Map<number, CgNode>()
  const specs: Array<[string, string]> = [
    [Q.SYMBOLS_FUNCTIONS, 'Function'],
    [Q.SYMBOLS_TESTCASES, 'TestCase'],
    [Q.SYMBOLS_CLASSES, 'Class'],
  ]
  for (const [query, label] of specs) {
    const rows = await q(graph, query)
    for (const r of rows) {
      const [, sid, qname, path, line, ...rest] = r as [unknown, number, string, string, number, ...unknown[]]
      const hasLoc = label !== 'Class'
      const loc = hasLoc ? (rest[0] as number) : undefined
      const tier = (hasLoc ? rest[1] : rest[0]) as string
      const kind = (hasLoc ? rest[2] : rest[1]) as string
      out.set(sid, { sid, qname, path, line, loc, tier, kind, label: kindOf(label, kind) })
    }
  }
  return out
}

export interface Stats {
  labelCounts: Array<[string, number]>
  edgeTypes: string[]
  totalNodes: number
}

export async function loadStats(graph: string): Promise<Stats> {
  const counts = await q(graph, Q.STATS_LABEL_COUNTS)
  const types = await q(graph, Q.STATS_EDGE_TYPES)
  const labelCounts = counts.map((r) => [String(r[0]), Number(r[1])] as [string, number])
  return {
    labelCounts,
    edgeTypes: types.map((r) => String(r[1])),
    totalNodes: labelCounts.reduce((a, [, n]) => a + n, 0),
  }
}

/**
 * Seeded subgraph: BFS out from one symbol, capped. Returns the model AND
 * whether the cap bit, so the panel can show a `capped` chip rather than
 * silently drawing a partial picture.
 */
export async function loadSeededSubgraph(
  graph: string,
  seed: number,
  depth: number,
  cap: number = NODE_CAP
): Promise<{ model: CgModel; capped: boolean }> {
  const nodes = new Map<number, CgNode>()
  const edges: CgEdge[] = []
  const degree = new Map<number, number>()
  const seen = new Set<number>([seed])

  const seedRows = await q(graph, Q.nodeBySid(seed))
  for (const r of seedRows) {
    const [, sid, qname, path, line, tier, kind] = r as [unknown, number, string, string, number, string, string]
    nodes.set(sid, { sid, qname, path, line, tier, kind, label: kindOf('Function', kind) })
  }

  let frontier = [seed]
  let capped = false
  for (let d = 0; d < depth; d++) {
    if (frontier.length === 0) break
    const rows = await q(graph, Q.callersOfMany(frontier))
    const next: number[] = []
    for (const r of rows) {
      const [, sid, qname, path, line, tier, conf] = r as [unknown, number, string, string, number, string, string]
      if (nodes.size >= cap) {
        capped = true
        break
      }
      if (!nodes.has(sid)) {
        nodes.set(sid, { sid, qname, path, line, tier, label: 'function' })
      }
      edges.push({ src: sid, dst: frontier[0], type: 'CALLS', conf })
      degree.set(sid, (degree.get(sid) ?? 0) + 1)
      if (!seen.has(sid)) {
        seen.add(sid)
        next.push(sid)
      }
    }
    frontier = next
  }
  return { model: { nodes, edges, degree }, capped }
}

export async function loadHistory(graph: string): Promise<Array<[string, number, number, number]>> {
  const rows = await q(graph, Q.HISTORY)
  return rows.map((r) => [String(r[0]), Number(r[1]), Number(r[2]), Number(r[3])])
}

/** NEAR_DUP is DERIVED, so it is legitimately absent until `dupes --write` has
 *  run. An absent edge type is an ANALYZE_ERROR, so this is gated, not tried. */
export async function loadDupes(graph: string, edgeTypes: string[]) {
  if (!edgeTypes.includes('NEAR_DUP')) return null
  const rows = await q(graph, Q.DUPES)
  return rows.map((r) => ({
    a: String(r[0]), aPath: String(r[1]), aLine: Number(r[2]),
    b: String(r[3]), bPath: String(r[4]), bLine: Number(r[5]),
    score: Number(r[6]), cluster: Number(r[7]),
  }))
}
