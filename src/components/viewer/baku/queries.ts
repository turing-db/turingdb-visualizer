/**
 * Every Cypher string the baku module sends, as a named export.
 *
 * One file, for the same reason as codegraph's: `tests/integration/baku-queries.test.ts`
 * executes ALL of them against the live `baku` graph and fails on any non-null
 * `error`, so a dialect change surfaces as a red test, not as an empty panel.
 *
 * Dialect constraints these are written around (TuringDB 1.37, measured):
 *   - no query parameters: ids are interpolated, and only ever as integers or
 *     through `lit()` in lint.ts
 *   - after `shortestPath`, RETURN only `dist` / `path` (endpoint projections are
 *     not supported there); `path` interleaves node and edge ids
 *     (even positions = nodes, odd = edges)
 *   - `shortestPath` is DIRECTED; the graph stores every mesh/patch/frame edge
 *     both ways, so any pair routes
 *   - batching is `UNWIND`, never a long OR chain
 *   - an absent label or property is an ANALYZE_ERROR, not an empty result —
 *     which is exactly what an older commit looks like before the frame existed
 */

// ---------------------------------------------------------------- layers ---
// The 3D view draws the graph FROM these queries. Only the skin's triangles and
// the context layers come from files (public/baku/, `make web` in baku-graph).

/** `v` is the internal node id: it is what every other query and the 2D canvas
 *  speak, so it is the key the 3D view maps back from. */
export const LAYER_VERTICES = 'MATCH (v:Vertex) RETURN v, v.id, v.x, v.y, v.z, v.meanCurv'
export const LAYER_MESH_EDGES = 'MATCH (a:Vertex)-[e:MESH_EDGE]->(b:Vertex) RETURN a.id, b.id'
export const LAYER_VERTEX_PATCH = 'MATCH (v:Vertex)-[:IN_PATCH]->(p:Patch) RETURN v.id, p.id'
export const LAYER_PATCHES =
  'MATCH (p:Patch) RETURN p, p.id, p.uid, p.class, p.area, p.betweenness, p.community'
export const LAYER_ADJACENCY = 'MATCH (a:Patch)-[e:ADJACENT_TO]->(b:Patch) RETURN a.id, b.id'
export const LAYER_JOINTS = 'MATCH (j:Joint) RETURN j, j.id, j.x, j.y, j.z'
export const LAYER_SUPPORTS = 'MATCH (j:Support) RETURN j.id'
export const LAYER_MEMBERS = 'MATCH (a:Joint)-[e:MEMBER]->(b:Joint) RETURN a.id, b.id'
export const LAYER_CONTACTS = 'MATCH (a:Joint)-[e:CONTACT]->(b:Joint) RETURN a.id, b.id'
export const LAYER_ZONES =
  'MATCH (z:Zone) RETURN z, z.name, z.minX, z.minY, z.minZ, z.maxX, z.maxY, z.maxZ'

// ------------------------------------------------------------ catalogue ---
export const LABELS = 'CALL db.labels()'
export const LABEL_COUNTS = 'CALL db.hierarchicalLabelCounts([])'
/** Newest first; row 0 carries a `(HEAD)` suffix. Counts are per-commit DELTAS. */
export const HISTORY = 'CALL db.history()'

// ------------------------------------------------------------- inspector ---
export const vertexCard = (id: number) =>
  `MATCH (v:Vertex {id: ${Math.trunc(id)}})-[:IN_PATCH]->(p:Patch) ` +
  'RETURN v.uid, v.x, v.y, v.z, v.height, v.meanCurv, v.gaussCurv, v.degree, v.isBoundary, ' +
  'v.flags, p.uid, p.class, p.area'
export const patchCard = (id: number) =>
  `MATCH (p:Patch {id: ${Math.trunc(id)}})-[:IN_ZONE]->(z:Zone) ` +
  'RETURN p.uid, p.class, p.area, p.meanCurv, p.maxCurv, p.elongation, p.betweenness, ' +
  'p.community, p.component, p.flags, z.name'
export const jointCard = (id: number) =>
  `MATCH (j:Joint {id: ${Math.trunc(id)}}) RETURN j.uid, j.x, j.y, j.z, j.height, j.degree`

/** Resolve `path` node ids (internal) to what they are. */
export const getNodes = (ids: number[]) =>
  `CALL db.getNodes([${ids.map((i) => Math.trunc(i)).join(', ')}]) YIELD id, properties RETURN id, properties`

export const patchEmbedding = (uid: string) => `MATCH (p:Patch {uid: '${uid}'}) RETURN p.emb`

// ---------------------------------------------------------------- presets ---
export interface Preset {
  key: string
  group: 'Surface' | 'Patches' | 'Frame' | 'Graph' | 'Versions'
  title: string
  /** What this proves, in one line — shown under the title. */
  note: string
  cypher: string
}

/** Endpoints are the pipeline's own (baku-graph `queries.py` / `frame_load.py`,
 *  cross-checked there against scipy/networkx), so the numbers shown here can
 *  be compared with SPEC.md and the stills. */
export const PRESETS: Preset[] = [
  {
    key: 'geodesic',
    group: 'Surface',
    title: 'Geodesic: Plaza foot to the apex',
    note: 'shortestPath over 173k MESH_EDGE weighted by length. Expect 83.56 m, 170 hops.',
    cypher:
      "MATCH (a:Vertex {uid: 'v:9991'}), (b:Vertex {uid: 'v:434'}) " +
      'shortestPath(a, b, length, dist, path) RETURN dist, path',
  },
  {
    key: 'boundary',
    group: 'Surface',
    title: 'Boundary vertices of the skin',
    note: 'The free edges of the modelled section (isBoundary).',
    cypher: 'MATCH (v:Vertex) WHERE v.isBoundary = true RETURN v, v.uid, v.height',
  },
  {
    key: 'crown',
    group: 'Surface',
    title: 'Most convex vertices',
    note: 'Top 200 by mean curvature at the 1.5 m scale.',
    cypher: 'MATCH (v:Vertex) RETURN v, v.uid, v.meanCurv ORDER BY v.meanCurv DESC LIMIT 200',
  },
  {
    key: 'smoothest',
    group: 'Patches',
    title: 'Smoothest route: Plaza to the crest',
    note: 'shortestPath over ADJACENT_TO weighted by smoothCost. Expect 8 hops.',
    cypher:
      "MATCH (a:Patch {uid: 'p:15'}), (b:Patch {uid: 'p:21'}) " +
      'shortestPath(a, b, smoothCost, dist, path) RETURN dist, path',
  },
  {
    key: 'neighbours',
    group: 'Patches',
    title: 'Neighbours of the curl crown (p:112)',
    note: 'One hop of ADJACENT_TO: a small subgraph that reads well in 2D.',
    cypher:
      "MATCH (p:Patch {uid: 'p:112'})-[e:ADJACENT_TO]->(q:Patch) RETURN p, q, q.uid, q.class, e.sharedLength",
  },
  {
    key: 'canopy',
    group: 'Patches',
    title: 'Patches in the Canopy zone',
    note: 'IN_ZONE, a derived partition (config/zones.yaml).',
    cypher: "MATCH (z:Zone {name: 'Canopy'})<-[:IN_ZONE]-(p:Patch) RETURN z, p, p.uid, p.class",
  },
  {
    key: 'hotspots',
    group: 'Patches',
    title: 'Hotspots: top 20 by betweenness',
    note: 'Patches most smoothest-routes pass through.',
    cypher:
      'MATCH (p:Patch) RETURN p, p.uid, p.class, p.betweenness ORDER BY p.betweenness DESC LIMIT 20',
  },
  {
    key: 'similar',
    group: 'Patches',
    title: 'Shape-similar to the curl crown (vector search)',
    note: 'VECTOR SEARCH on the 32-dim patch descriptor. The seed embedding is read first.',
    cypher: '-- built at run time from p:112.emb (see "similar" in index.tsx)',
  },
  {
    key: 'loadpath',
    group: 'Frame',
    title: 'Load path: apex to the nearest support',
    note: 'shortestPath over MEMBER + CONTACT by length. Expect 63.73 m, 23 members.',
    cypher:
      "MATCH (a:Joint {uid: 'j:390'}), (b:Joint {uid: 'j:407'}) " +
      'shortestPath(a, b, length, dist, path) RETURN dist, path',
  },
  {
    key: 'supports',
    group: 'Frame',
    title: 'Supports',
    note: 'Joints within 1 m of the ground slab (label :Support).',
    cypher: 'MATCH (j:Support) RETURN j, j.uid, j.z, j.degree',
  },
  {
    key: 'hubs',
    group: 'Frame',
    title: 'Busiest joints',
    note: 'Joints where the most members meet.',
    cypher: 'MATCH (j:Joint) RETURN j, j.uid, j.degree ORDER BY j.degree DESC LIMIT 25',
  },
  {
    key: 'labels',
    group: 'Graph',
    title: 'What is in the graph',
    note: 'Label counts, including the class sublabels.',
    cypher: LABEL_COUNTS,
  },
  {
    key: 'history',
    group: 'Versions',
    title: 'Commit history',
    note: 'Per-commit deltas: load, zones, flags write-back, two frame builds.',
    cypher: HISTORY,
  },
]

/** The seed + vector search, as two statements (the embedding is not a literal). */
export const similarTo = (vec: number[], k = 10) =>
  `VECTOR SEARCH IN patch_shape FOR ${Math.trunc(k)} (${vec.map((x) => x.toString()).join(', ')}) ` +
  // ORDER BY is needed: the join back to Patch does not keep the search's rank order
  'YIELD ids, score MATCH (p:Patch) WHERE p.id = ids RETURN p, p.uid, p.class, score ORDER BY score DESC'
