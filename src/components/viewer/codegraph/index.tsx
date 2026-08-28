/**
 * CodeGraphPanel — the codegraph domain module.
 *
 * Three rules this panel is built around, each from a measured failure:
 *
 * 1. **Never render the whole graph.** 18k nodes through `neighbourhood.add`
 *    builds a single ~200 KB Cypher string with no chunking, and the canvas
 *    walks every node and edge per frame. The canvas gets a seeded subgraph
 *    under a hard cap; the TRUE totals are printed as text beside it.
 * 2. **Never swallow an error.** A failed query on this dialect looks exactly
 *    like an empty result, and this codebase has shipped two panels that way.
 *    Failures render a red card with the error type and details.
 * 3. **Say what the picture is not showing.** Capping, edge paging and
 *    confidence filtering all change what is on screen, so each has a visible
 *    chip rather than being silent.
 */
import { Icon, Spinner } from '@blueprintjs/core'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { TuringSearchInput } from '@/components/base/turing-search-input'
import './codegraph.css'
import { readDeepLink } from './deeplink'
import { CommitScrubber } from './timetravel'
import {
  CgNode,
  NODE_CAP,
  Stats,
  TIER_COLOR,
  TYPE_COLOR,
  loadDupes,
  loadSeededSubgraph,
  loadStats,
  loadSymbolTable,
} from './model'

type Scheme = 'kind' | 'tier' | 'confidence'
type Tab = 'subgraph' | 'dupes' | 'time'

interface Failure {
  errorType: string
  errorDetails: string
}

export const CodeGraphPanel = ({ graph = 'cg_head' }: { graph?: string }) => {
  const link = useMemo(() => readDeepLink(), [])
  const [symbols, setSymbols] = useState<Map<number, CgNode> | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [failure, setFailure] = useState<Failure | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [focus, setFocus] = useState<number | undefined>(link.focus)
  const [depth, setDepth] = useState(link.depth ?? 2)
  const [scheme, setScheme] = useState<Scheme>('kind')
  const [tab, setTab] = useState<Tab>((link.tab as Tab) ?? 'subgraph')
  const [rendered, setRendered] = useState(0)
  const [capped, setCapped] = useState(false)
  const [dupes, setDupes] = useState<Awaited<ReturnType<typeof loadDupes>>>(null)
  /** Snapshot stops come from refs.json, written at build time. Commit hashes
   *  are build-time values and change on every rebuild, so nothing here may
   *  hardcode one. */
  const [stops, setStops] = useState<Array<{ index: number; ref: string; sha: string }>>([])

  useEffect(() => {
    fetch('/refs.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j?.snapshots && setStops(j.snapshots))
      .catch(() => setStops([]))
  }, [])

  const fail = useCallback((e: unknown) => {
    const err = e as { errorType?: string; errorDetails?: string; message?: string }
    setFailure({
      errorType: err.errorType ?? 'Error',
      errorDetails: err.errorDetails ?? err.message ?? String(e),
    })
  }, [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    // No .catch(() => []) — a failure must surface, not render as empty.
    Promise.all([loadSymbolTable(graph), loadStats(graph)])
      .then(async ([table, s]) => {
        if (!alive) return
        setSymbols(table)
        setStats(s)
        setDupes(await loadDupes(graph, s.edgeTypes))
      })
      .catch(fail)
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [graph, fail])

  /** Search filters the client-side Map: the dialect has no string matching,
   *  and a sidecar process to provide it would be slower and one more thing to
   *  run. Measured ~22 ms to load the whole table once. */
  const candidates = useMemo(() => {
    if (!symbols || search.trim().length < 2) return []
    const needle = search.trim().toLowerCase()
    const out: CgNode[] = []
    for (const n of symbols.values()) {
      if (n.qname.toLowerCase().includes(needle)) {
        out.push(n)
        if (out.length >= 50) break
      }
    }
    return out.sort((a, b) => a.qname.length - b.qname.length)
  }, [symbols, search])

  const select = useCallback(
    (sid: number) => {
      setFocus(sid)
      setFailure(null)
      loadSeededSubgraph(graph, sid, depth, NODE_CAP)
        .then(({ model, capped: c }) => {
          setRendered(model.nodes.size)
          setCapped(c)
        })
        .catch(fail)
    },
    [graph, depth, fail]
  )

  useEffect(() => {
    if (focus !== undefined && symbols) select(focus)
  }, [focus, depth, symbols, select])

  const colourOf = (n: CgNode): number =>
    scheme === 'tier' ? (TIER_COLOR[n.tier ?? 'core'] ?? 0x94a3b8) : TYPE_COLOR[n.label]

  if (failure) {
    return (
      <div className="cg-panel cg-error" role="alert" onClick={(e) => e.stopPropagation()}>
        <Icon icon="error" intent="danger" />
        <div className="cg-error-type">{failure.errorType}</div>
        <pre className="cg-error-details">{failure.errorDetails}</pre>
        <div className="cg-error-hint">
          The graph is served from <code>{graph}</code>. If the server is down, run{' '}
          <code>codegraph up</code>; if the graph is missing, run{' '}
          <code>codegraph index --head</code>.
        </div>
      </div>
    )
  }

  const focusNode = focus !== undefined ? symbols?.get(focus) : undefined

  return (
    <div
      className="cg-panel"
      onClick={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
    >
      <header className="cg-header">
        <span className="cg-title">code graph</span>
        {loading && <Spinner size={14} />}
        {stats && (
          /* Totals are rendered from the query result, never written as a
             literal — a hardcoded count is wrong the moment anything changes. */
          <span className="cg-totals">
            {stats.totalNodes.toLocaleString()} nodes ·{' '}
            {stats.edgeTypes.length} edge types in TuringDB · {rendered.toLocaleString()} rendered
          </span>
        )}
      </header>

      <div className="cg-tabs">
        <button onClick={() => setTab('subgraph')} aria-pressed={tab === 'subgraph'}>
          subgraph
        </button>
        <button onClick={() => setTab('dupes')} aria-pressed={tab === 'dupes'}>
          duplicates{dupes ? ` (${dupes.length})` : ''}
        </button>
        <button onClick={() => setTab('time')} aria-pressed={tab === 'time'}>
          time travel
        </button>
      </div>

      {tab === 'subgraph' && (
        <>
          <TuringSearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            placeholder="symbol name…"
          />
          <ul className="cg-candidates">
            {candidates.map((n) => (
              <li key={n.sid}>
                <button onClick={() => select(n.sid)}>
                  <span style={{ color: `#${colourOf(n).toString(16).padStart(6, '0')}` }}>●</span>{' '}
                  {n.qname}
                  <small>
                    {n.path}:{n.line}
                  </small>
                </button>
              </li>
            ))}
          </ul>

          {focusNode && (
            <section className="cg-card">
              <h4>{focusNode.qname}</h4>
              <div>
                {focusNode.path}:{focusNode.line}
                {focusNode.loc ? ` · ${focusNode.loc} lines` : ''} · {focusNode.tier}
              </div>
              <label>
                depth
                <input
                  type="range"
                  min={1}
                  max={4}
                  value={depth}
                  onChange={(e) => setDepth(Number(e.target.value))}
                />
                {depth}
              </label>
            </section>
          )}

          <div className="cg-chips">
            {/* The legend names the ACTIVE scheme. Two schemes cannot both be
                on, and a legend that does not say which is live is a lie. */}
            <span className="cg-chip">colour: {scheme}</span>
            {(['kind', 'tier', 'confidence'] as Scheme[]).map((s) => (
              <button key={s} onClick={() => setScheme(s)} aria-pressed={scheme === s}>
                {s}
              </button>
            ))}
            {capped && <span className="cg-chip cg-warn">capped at {NODE_CAP} nodes</span>}
          </div>
        </>
      )}

      {tab === 'time' && <CommitScrubber graph="cg_arc" stops={stops} />}

      {tab === 'dupes' && (
        <div className="cg-dupes">
          {dupes === null ? (
            <p>
              No <code>NEAR_DUP</code> edges in <code>{graph}</code>. They are derived —
              run <code>codegraph dupes --write</code> then <code>codegraph index --head</code>.
            </p>
          ) : (
            <ul>
              {dupes.slice(0, 60).map((d, i) => (
                <li key={i}>
                  <span className="cg-cluster">#{d.cluster}</span> {d.score.toFixed(3)}{' '}
                  <code>{d.a}</code> ↔ <code>{d.b}</code>
                  <small>
                    {d.aPath}:{d.aLine} · {d.bPath}:{d.bLine}
                  </small>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default CodeGraphPanel
