/**
 * Data layer for the baku module: the graph, loaded from TuringDB, in the shape
 * the 3D view draws.
 *
 * Load-bearing facts:
 *  1. Two id spaces. `Vertex.id` / `Patch.id` / `Joint.id` are the pipeline's
 *     dense indices (row i of skin.pos.bin is Vertex {id: i}); the bare variable
 *     (`RETURN v`) is the engine's INTERNAL node id, which is what every query
 *     result, `shortestPath` path and the 2D canvas speak. Both are loaded, and
 *     the maps below translate. Internal ids are per-build values — never store one.
 *  2. Nothing here catches and returns empty. On this dialect a failed query
 *     looks exactly like an empty graph, so errors propagate to a red card.
 *  3. The frame and the zones are VERSIONED: they do not exist at early commits,
 *     where referencing their labels is an ANALYZE_ERROR, so their loaders are
 *     gated on `db.labels()` at the commit being viewed.
 */
import type { CypherTable } from '@/api/api'
import * as Q from './queries'

export interface Manifest {
  attribution: string
  groundZ: number
  bbox: { min: [number, number, number]; max: [number, number, number] }
  layers: Array<{
    name: string
    vertices: number
    triangles: number
    pos: string
    idx: string
    colour: [number, number, number]
    opacity: number
    default: boolean
    mb: number
  }>
}

export interface PatchInfo {
  id: number
  node: number
  uid: string
  cls: string
  area: number
  betweenness: number
  community: number
}

export interface ZoneInfo {
  name: string
  node: number
  min: [number, number, number]
  max: [number, number, number]
}

export interface FrameLayer {
  pos: Float32Array
  node: Int32Array
  support: Uint8Array
  members: Uint32Array
  contacts: Uint32Array
}

export interface BakuModel {
  /** Vertex positions FROM THE GRAPH (x, y, z), indexed by Vertex.id. */
  pos: Float32Array
  meanCurv: Float32Array
  vertexNode: Int32Array
  vertexPatch: Int32Array
  /** Undirected mesh edges as id pairs (the graph stores each both ways). */
  meshEdges: Uint32Array
  meshEdgesDirected: number
  patches: PatchInfo[]
  adjacency: Uint32Array
  frame: FrameLayer | null
  zones: ZoneInfo[]
  labels: Set<string>
  /** internal node id -> what it is */
  byNode: Map<number, { kind: 'vertex' | 'patch' | 'joint' | 'zone'; id: number }>
}

export type Run = (query: string) => Promise<CypherTable>

const num = (v: unknown) => Number(v)

/** Undirected, deduplicated pairs from a directed edge list. */
function undirected(rows: unknown[][]): Uint32Array {
  const seen = new Set<number>()
  const out: number[] = []
  for (const r of rows) {
    const a = num(r[0])
    const b = num(r[1])
    const lo = Math.min(a, b)
    const hi = Math.max(a, b)
    const key = lo * 1_000_003 + hi
    if (seen.has(key)) continue
    seen.add(key)
    out.push(lo, hi)
  }
  return Uint32Array.from(out)
}

export async function loadLabels(run: Run): Promise<Set<string>> {
  const t = await run(Q.LABELS)
  const col = t.columns.indexOf('label')
  return new Set(t.rows.map((r) => String(r[col >= 0 ? col : 1])))
}

export async function loadFrame(run: Run): Promise<FrameLayer> {
  const [joints, supports, members, contacts] = await Promise.all([
    run(Q.LAYER_JOINTS),
    run(Q.LAYER_SUPPORTS),
    run(Q.LAYER_MEMBERS),
    run(Q.LAYER_CONTACTS),
  ])
  const n = Math.max(0, ...joints.rows.map((r) => num(r[1]))) + 1
  const pos = new Float32Array(n * 3)
  const node = new Int32Array(n).fill(-1)
  for (const r of joints.rows) {
    const id = num(r[1])
    node[id] = num(r[0])
    pos.set([num(r[2]), num(r[3]), num(r[4])], id * 3)
  }
  const support = new Uint8Array(n)
  for (const r of supports.rows) support[num(r[0])] = 1
  return {
    pos,
    node,
    support,
    members: undirected(members.rows),
    contacts: undirected(contacts.rows),
  }
}

export async function loadZones(run: Run): Promise<ZoneInfo[]> {
  const t = await run(Q.LAYER_ZONES)
  return t.rows.map((r) => ({
    node: num(r[0]),
    name: String(r[1]),
    min: [num(r[2]), num(r[3]), num(r[4])],
    max: [num(r[5]), num(r[6]), num(r[7])],
  }))
}

/** The whole model at one commit. Vertex/patch layers are gated on `Vertex`
 *  existing (they do from the load commit on); frame and zones on theirs. */
export async function loadModel(run: Run): Promise<BakuModel> {
  const labels = await loadLabels(run)
  if (!labels.has('Vertex')) {
    throw new Error(
      'No Vertex label at this commit: it predates the LOAD JSONL of the skin graph. Pick a later commit.'
    )
  }
  const [verts, edges, vp, patches, adj] = await Promise.all([
    run(Q.LAYER_VERTICES),
    run(Q.LAYER_MESH_EDGES),
    run(Q.LAYER_VERTEX_PATCH),
    run(Q.LAYER_PATCHES),
    run(Q.LAYER_ADJACENCY),
  ])
  const nv = verts.rows.length
  const pos = new Float32Array(nv * 3)
  const meanCurv = new Float32Array(nv)
  const vertexNode = new Int32Array(nv).fill(-1)
  const byNode: BakuModel['byNode'] = new Map()
  for (const r of verts.rows) {
    const id = num(r[1])
    if (id >= nv) throw new Error(`Vertex.id ${id} out of range: ids must be dense 0..${nv - 1}`)
    vertexNode[id] = num(r[0])
    pos.set([num(r[2]), num(r[3]), num(r[4])], id * 3)
    meanCurv[id] = num(r[5])
    byNode.set(num(r[0]), { kind: 'vertex', id })
  }
  const vertexPatch = new Int32Array(nv).fill(-1)
  for (const r of vp.rows) vertexPatch[num(r[0])] = num(r[1])

  const plist: PatchInfo[] = []
  for (const r of patches.rows) {
    const p: PatchInfo = {
      node: num(r[0]),
      id: num(r[1]),
      uid: String(r[2]),
      cls: String(r[3]),
      area: num(r[4]),
      betweenness: num(r[5]),
      community: num(r[6]),
    }
    plist[p.id] = p
    byNode.set(p.node, { kind: 'patch', id: p.id })
  }

  const frame = labels.has('Joint') ? await loadFrame(run) : null
  if (frame) frame.node.forEach((n, id) => n >= 0 && byNode.set(n, { kind: 'joint', id }))
  const zones = labels.has('Zone') ? await loadZones(run) : []
  zones.forEach((z, i) => byNode.set(z.node, { kind: 'zone', id: i }))

  return {
    pos,
    meanCurv,
    vertexNode,
    vertexPatch,
    meshEdges: undirected(edges.rows),
    meshEdgesDirected: edges.rows.length,
    patches: plist,
    adjacency: undirected(adj.rows),
    frame,
    zones,
    labels,
    byNode,
  }
}

// ------------------------------------------------------- surface routing ---

/** CSR adjacency of the vertex graph, weighted by edge length. */
function csr(model: BakuModel) {
  const n = model.pos.length / 3
  const deg = new Uint32Array(n + 1)
  const E = model.meshEdges
  for (let i = 0; i < E.length; i++) deg[E[i] + 1]++
  for (let i = 0; i < n; i++) deg[i + 1] += deg[i]
  const nbr = new Uint32Array(E.length)
  const fill = deg.slice(0, n)
  for (let i = 0; i < E.length; i += 2) {
    nbr[fill[E[i]]++] = E[i + 1]
    nbr[fill[E[i + 1]]++] = E[i]
  }
  return { start: deg, nbr }
}

const dist3 = (p: Float32Array, a: number, b: number) =>
  Math.hypot(p[a * 3] - p[b * 3], p[a * 3 + 1] - p[b * 3 + 1], p[a * 3 + 2] - p[b * 3 + 2])

/** Per patch, its vertex nearest the patch's own mean position. A curved
 *  patch's centroid lies off the surface; its anchor lies on it. */
export function patchAnchors(model: BakuModel): Int32Array {
  const P = model.patches.length
  const sum = new Float64Array(P * 3)
  const cnt = new Uint32Array(P)
  const { pos, vertexPatch } = model
  for (let v = 0; v < vertexPatch.length; v++) {
    const p = vertexPatch[v]
    if (p < 0) continue
    sum[p * 3] += pos[v * 3]
    sum[p * 3 + 1] += pos[v * 3 + 1]
    sum[p * 3 + 2] += pos[v * 3 + 2]
    cnt[p]++
  }
  const best = new Float64Array(P).fill(Number.POSITIVE_INFINITY)
  const anchor = new Int32Array(P).fill(-1)
  for (let v = 0; v < vertexPatch.length; v++) {
    const p = vertexPatch[v]
    if (p < 0 || !cnt[p]) continue
    const d = Math.hypot(
      pos[v * 3] - sum[p * 3] / cnt[p],
      pos[v * 3 + 1] - sum[p * 3 + 1] / cnt[p],
      pos[v * 3 + 2] - sum[p * 3 + 2] / cnt[p]
    )
    if (d < best[p]) {
      best[p] = d
      anchor[p] = v
    }
  }
  return anchor
}

/** A* over the vertex graph (Euclidean heuristic, exact since edges are straight
 *  segments). Adjacent patches are metres apart, so each search is local. */
export function makeRouter(model: BakuModel) {
  const { start, nbr } = csr(model)
  const n = model.pos.length / 3
  const g = new Float64Array(n)
  const came = new Int32Array(n)
  const stamp = new Uint32Array(n)
  let epoch = 0
  return (src: number, dst: number): number[] | null => {
    epoch++
    const open: Array<[number, number]> = [[dist3(model.pos, src, dst), src]]
    g[src] = 0
    came[src] = -1
    stamp[src] = epoch
    while (open.length) {
      // linear min-scan: the open set stays small (adjacent patches are metres apart)
      let bi = 0
      for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i
      const [, u] = open[bi]
      open[bi] = open[open.length - 1]
      open.pop()
      if (u === dst) {
        const path = [dst]
        let v = dst
        while (came[v] >= 0) path.push((v = came[v]))
        return path.reverse()
      }
      for (let k = start[u]; k < start[u + 1]; k++) {
        const w = nbr[k]
        const cand = g[u] + dist3(model.pos, u, w)
        if (stamp[w] !== epoch || cand < g[w]) {
          stamp[w] = epoch
          g[w] = cand
          came[w] = u
          open.push([cand + dist3(model.pos, w, dst), w])
        }
      }
      if (open.length > 50_000) return null
    }
    return null
  }
}

/** Every ADJACENT_TO pair as a route along the skin between anchors, flattened
 *  to mesh-edge pairs for one LineSegments. Returns the pairs and how many
 *  adjacencies had no surface route (drawn straight — should be 0). */
export function routedAdjacency(model: BakuModel, anchors: Int32Array) {
  const route = makeRouter(model)
  const seg = new Set<number>()
  let straight = 0
  const out: number[] = []
  const A = model.adjacency
  for (let i = 0; i < A.length; i += 2) {
    const a = anchors[A[i]]
    const b = anchors[A[i + 1]]
    if (a < 0 || b < 0) continue
    const r = route(a, b)
    if (!r) {
      straight++
      out.push(a, b)
      continue
    }
    for (let k = 0; k + 1 < r.length; k++) {
      const lo = Math.min(r[k], r[k + 1])
      const hi = Math.max(r[k], r[k + 1])
      const key = lo * 1_000_003 + hi
      if (!seg.has(key)) {
        seg.add(key)
        out.push(lo, hi)
      }
    }
  }
  return { pairs: Uint32Array.from(out), straight }
}

// ------------------------------------------------------ result → picture ---

export interface Highlight {
  vertices: Set<number>
  patches: Set<number>
  joints: Set<number>
  zones: Set<number>
  /** Ordered paths (shortestPath results), each as dense ids of one kind. */
  paths: Array<{ kind: 'vertex' | 'patch' | 'joint'; ids: number[] }>
  /** For the 2D canvas: the internal node ids and any edges known between them. */
  nodeIDs: number[]
  edges: Array<[number, number, number]>
  unknown: number
  pathDist?: number
}

export const emptyHighlight = (): Highlight => ({
  vertices: new Set(),
  patches: new Set(),
  joints: new Set(),
  zones: new Set(),
  paths: [],
  nodeIDs: [],
  edges: [],
  unknown: 0,
})

/** Node variables bound in `(x...)` patterns — to tell a node column from an
 *  edge column: both arrive typed UInt64 and their id spaces overlap. */
function nodeVariables(query: string): Set<string> {
  const out = new Set<string>()
  for (const m of query.matchAll(/\(\s*([A-Za-z_]\w*)\s*(?=[:){\s])/g)) out.add(m[1])
  for (const m of query.matchAll(/shortestPath\s*\(\s*(\w+)\s*,\s*(\w+)/gi)) {
    out.add(m[1])
    out.add(m[2])
  }
  return out
}

/** Interpret ANY result: node columns, `path` columns and `v:/p:/j:` uid strings. */
export function interpret(query: string, t: CypherTable, model: BakuModel): Highlight {
  const h = emptyHighlight()
  const nodeVars = nodeVariables(query)
  const nodes = new Set<number>()
  const put = (node: number) => {
    const e = model.byNode.get(node)
    if (!e) {
      h.unknown++
      return
    }
    nodes.add(node)
    if (e.kind === 'vertex') h.vertices.add(e.id)
    else if (e.kind === 'patch') h.patches.add(e.id)
    else if (e.kind === 'joint') h.joints.add(e.id)
    else h.zones.add(e.id)
  }
  t.columns.forEach((name, c) => {
    const type = t.types[c]
    if (type === 'Path') {
      for (const r of t.rows) {
        const path = (r[c] as number[]) ?? []
        const ids: number[] = []
        let kind: 'vertex' | 'patch' | 'joint' | null = null
        for (let i = 0; i < path.length; i += 2) {
          const e = model.byNode.get(path[i])
          put(path[i])
          if (e && e.kind !== 'zone') {
            kind = e.kind
            ids.push(e.id)
          }
          if (i + 2 < path.length) h.edges.push([path[i + 1], path[i], path[i + 2]])
        }
        if (kind && ids.length) h.paths.push({ kind, ids })
      }
      const d = t.columns.indexOf('dist')
      if (d >= 0 && t.rows[0]) h.pathDist = Number(t.rows[0][d])
    } else if (nodeVars.has(name) && /Int/.test(type)) {
      for (const r of t.rows) put(Number(r[c]))
    } else if (type === 'String') {
      for (const r of t.rows) {
        const m = /^([vpj]):(\d+)$/.exec(String(r[c]))
        if (!m) continue
        const id = Number(m[2])
        const node =
          m[1] === 'v'
            ? model.vertexNode[id]
            : m[1] === 'p'
              ? model.patches[id]?.node
              : model.frame?.node[id]
        if (node !== undefined && node >= 0) put(node)
      }
    }
  })
  h.nodeIDs = [...nodes]
  return h
}
