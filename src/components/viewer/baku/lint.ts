/**
 * The guard every query from the free-text box goes through before it is sent.
 *
 * A port of baku-graph's `cypher.lint` (the Python pipeline runs the same rules),
 * plus a read-only rule. The box talks to a SHARED server, so query shapes that
 * are known to misbehave on 1.37 are refused here rather than sent: very long
 * boolean chains in one WHERE (use UNWIND), and endpoint property projections
 * after shortestPath (resolve the path's ids separately). A typo in a demo
 * should produce a red message here, not a problem for everyone else on the instance.
 */

export const MAX_BOOLEAN_TERMS = 1000

export class UnsafeQuery extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnsafeQuery'
  }
}

const STRING = /'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g

/** Strip string literals so keywords inside them do not count. */
const bare = (q: string) => q.replace(STRING, "''")

// Statement keywords that write or mutate server state. Reads (MATCH, CALL,
// VECTOR SEARCH, LOAD COMMIT for time travel) stay allowed.
const WRITES =
  /\b(CREATE|SET|DELETE|DETACH|REMOVE|MERGE|DROP|COMMIT|SUBMIT|CHANGE|LOAD\s+(JSONL|CSV|GML|PARQUET|VECTOR|GRAPH)|INSTALL|MERGE_DATAPARTS)\b/i

export function lint(query: string, { readOnly = true } = {}): string {
  const q = bare(query)
  if (!q.trim()) throw new UnsafeQuery('empty query')
  if (readOnly) {
    const m = q.match(WRITES)
    if (m) {
      throw new UnsafeQuery(
        `"${m[0].toUpperCase()}" writes to the graph. This console is read-only: writes go ` +
          'through the pipeline (baku-graph), so the shared instance is never edited from a demo.'
      )
    }
  }
  const terms = (q.match(/\b(OR|AND)\b/gi)?.length ?? 0) + 1
  if (/\bWHERE\b/i.test(q) && terms > MAX_BOOLEAN_TERMS) {
    throw new UnsafeQuery(
      `${terms} boolean terms in WHERE (cap ${MAX_BOOLEAN_TERMS}). Batch with UNWIND instead.`
    )
  }
  const sp = q.match(
    /shortestPath\s*\(\s*(\w+)\s*,\s*(\w+)\s*,\s*\w+\s*,\s*(\w+)\s*,\s*(\w+)\s*\)/i
  )
  if (sp) {
    const [, src, dst, dist, path] = sp
    const ret = q.match(/\bRETURN\b([\s\S]*)$/i)
    const items = ret
      ? ret[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : []
    const extra = items.filter((x) => x !== dist && x !== path)
    if (extra.length) {
      throw new UnsafeQuery(
        `after shortestPath, RETURN only ${dist} and ${path} (got ${extra.join(', ')}). ` +
          'Endpoint properties are not supported here; the path is resolved separately.'
      )
    }
    if (ret && new RegExp(`\\b(${src}|${dst})\\s*\\.`).test(ret[1])) {
      throw new UnsafeQuery('endpoint property projected after shortestPath')
    }
  }
  return query
}

/** A single-quoted Cypher string literal (there are no query parameters). */
export function lit(value: string): string {
  const s = value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
  return `'${s}'`
}
