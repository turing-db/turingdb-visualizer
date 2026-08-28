/**
 * Every Cypher string this module sends, as a named export.
 *
 * They live in one file for one reason: `tests/codegraph-queries.spec.ts`
 * executes ALL of them against a real server and fails on any non-null `error`.
 * A query embedded inline in a component cannot be swept that way, and this
 * codebase has already shipped two panels broken by a dialect change that a
 * sweep would have caught in seconds (`type(r)` -> `edgeType(r)`).
 *
 * Dialect constraints these strings are written around (measured on 1.37):
 *   - no CONTAINS / STARTS WITH / regex: all text filtering is client-side
 *   - no variable-length paths: depth is hand-spelled, one query per hop
 *   - no DISTINCT, no WITH, no OPTIONAL MATCH, no IN
 *   - `edgeType(e)`, never `type(e)` — the latter is a PARSE_ERROR
 *   - projecting a property that exists on ZERO nodes is an ANALYZE_ERROR that
 *     kills the whole query, so every projection here is covered by the
 *     property-existence assertion in the spec test
 */

/** True totals for the panel header. Never render a literal count. */
export const STATS_LABEL_COUNTS = 'CALL db.hierarchicalLabelCounts([])'
export const STATS_EDGE_TYPES = 'CALL db.edgeTypes()'
export const STATS_PROPERTY_TYPES = 'CALL db.propertyTypes()'
export const STATS_LABELS = 'CALL db.labels()'

/**
 * The symbol table, loaded once into a client-side Map.
 * There is no string matching in the dialect, so search filters in JS. Measured
 * ~22 ms for 18,700 rows — a sidecar HTTP process would be slower and is one
 * more thing to run.
 */
export const SYMBOLS_FUNCTIONS =
  'MATCH (n:Function) RETURN n, n.sid, n.qname, n.path, n.line, n.loc, n.tier, n.kind'
export const SYMBOLS_TESTCASES =
  'MATCH (n:TestCase) RETURN n, n.sid, n.qname, n.path, n.line, n.loc, n.tier, n.kind'
export const SYMBOLS_CLASSES =
  'MATCH (n:Class) RETURN n, n.sid, n.qname, n.path, n.line, n.tier, n.kind'

/** One hop out and one hop in from a seed. Depth is spelled, not ranged. */
export const callersOf = (sid: number) =>
  `MATCH (a)-[e:CALLS]->(b) WHERE b.sid = ${sid} ` +
  `RETURN a, a.sid, a.qname, a.path, a.line, a.tier, e.conf, e.ruleId`

export const calleesOf = (sid: number) =>
  `MATCH (a)-[e:CALLS]->(b) WHERE a.sid = ${sid} ` +
  `RETURN b, b.sid, b.qname, b.path, b.line, b.tier, e.conf, e.ruleId`

/** UNWIND landed in 1.37 and replaces a 200-way OR chain per frontier level. */
export const callersOfMany = (sids: number[]) =>
  `UNWIND [${sids.join(', ')}] AS q MATCH (a)-[e:CALLS]->(b) WHERE b.sid = q ` +
  `RETURN a, a.sid, a.qname, a.path, a.line, a.tier, e.conf`

export const nodeBySid = (sid: number) =>
  `MATCH (n) WHERE n.sid = ${sid} RETURN n, n.sid, n.qname, n.path, n.line, n.tier, n.kind`

/** Structural relations. All EXACT — read off the syntax tree, never inferred. */
export const inheritorsOf = (sid: number) =>
  `MATCH (c:Class)-[e:INHERITS]->(b:Class) WHERE b.sid = ${sid} ` +
  `RETURN c, c.sid, c.qname, c.path, c.line`

export const methodsOf = (sid: number) =>
  `MATCH (c:Class)-[e:HAS_METHOD]->(m:Function) WHERE c.sid = ${sid} ` +
  `RETURN m, m.sid, m.qname, m.path, m.line, m.tier`

export const overridesOf = (sid: number) =>
  `MATCH (d:Function)-[e:OVERRIDES]->(b:Function) WHERE b.sid = ${sid} ` +
  `RETURN d, d.sid, d.qname, d.path, d.line`

export const includesOf = (sid: number) =>
  `MATCH (f:File)-[e:INCLUDES]->(g:File) WHERE f.sid = ${sid} ` +
  `RETURN g, g.sid, g.path`

/** Near-duplicate clusters. Gated on NEAR_DUP existing — an absent edge type
 *  is an ANALYZE_ERROR, not an empty result. */
export const DUPES =
  'MATCH (a:Function)-[e:NEAR_DUP]->(b:Function) ' +
  'RETURN a.qname, a.path, a.line, b.qname, b.path, b.line, e.score, e.cluster ' +
  'ORDER BY e.score DESC LIMIT 400'

/** Commit history for the scrubber. Counts are per-commit DELTAS, not totals. */
export const HISTORY = 'CALL db.history()'

/** Edge typing for the canvas. `edgeType`, never `type`. */
export const edgeTypesFor = (edgeIds: number[]) =>
  `MATCH ()-[r]->() WHERE r.sid = ${edgeIds[0] ?? 0} RETURN edgeType(r)`

/** Time travel. The scrub itself is a CLIENT-SIDE MASK on gitFirst/gitGone --
 *  zero round trips per frame -- so these load the masked set ONCE. */
export const SNAPSHOT_FILES =
  'MATCH (n:File) RETURN n, n.sid, n.path, n.tier, n.loc, n.gitFirst, n.gitGone'
export const SNAPSHOT_FUNCTIONS =
  'MATCH (n:Function) RETURN n, n.sid, n.qname, n.path, n.line, n.tier, n.gitFirst, n.gitGone'
