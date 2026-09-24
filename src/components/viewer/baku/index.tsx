import { type CypherTable, executeCypherQueryTable, getNodeEdgeIDs } from '@/api/api'
import { useCanvasStore, useVisStore } from '@/stores'
/**
 * BakuPanel — the Heydar Aliyev Center section in 3D, with its TuringDB graph
 * drawn on it, a Cypher console, preset queries and time travel. It docks LEFT;
 * the stock 2D canvas stays on the right and shows each result as a subgraph,
 * so one query lights up in both views and a click in either selects in both.
 *
 * Rules this panel keeps:
 *  1. The graph layers are drawn FROM TuringDB, not from files. Only the skin's
 *     triangles and the context meshes are files (`make web` in baku-graph).
 *  2. Never swallow an error: a failed query on this dialect looks exactly like
 *     an empty result. Failures render red with the engine's own message.
 *  3. Every free-text query goes through `lint` first — this is a shared server,
 *     so the console is read-only and refuses shapes known to misbehave on 1.37.
 *  4. Totals come from query results, never literals.
 */
import { Spinner } from '@blueprintjs/core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './baku.css'
import { UnsafeQuery, lint } from './lint'
import {
  type BakuModel,
  type Highlight,
  type Manifest,
  emptyHighlight,
  interpret,
  loadFrame,
  loadLabels,
  loadModel,
  loadZones,
} from './model'
import * as Q from './queries'
import { BakuScene, CLASS_RGB, type LayerKey, type Pick, type SkinColour } from './scene'

interface Commit {
  hash: string
  nodes: number
  edges: number
  head: boolean
}

interface Failure {
  errorType: string
  errorDetails: string
}

const LAYER_LABELS: Array<[LayerKey, string]> = [
  ['skin', 'Skin'],
  ['vertexGraph', 'Triangle graph'],
  ['patchGraph', 'Patch graph'],
  ['frameGraph', 'Frame graph'],
  ['zones', 'Zones'],
  ['context', 'Glass, floor'],
  ['steel', 'Steel mesh (21 MB)'],
]

const CANVAS_CAP = 400

const asFailure = (e: unknown): Failure => {
  const err = e as { errorType?: string; errorDetails?: string; message?: string; name?: string }
  if (e instanceof UnsafeQuery)
    return { errorType: 'Blocked before sending', errorDetails: e.message }
  return {
    errorType: err.errorType ?? err.name ?? 'Error',
    errorDetails: err.errorDetails || err.message || String(e),
  }
}

/** The one benign failure: a label that does not exist yet at an older commit. */
const explainAtCommit = (f: Failure, commit?: string): string | null =>
  commit && /Unknown (label|edge type)/i.test(f.errorDetails + f.errorType)
    ? 'That label or edge type does not exist at this commit — it was added later. Pick a newer commit to query it.'
    : null

export const BakuPanel = ({ graph = 'baku' }: { graph?: string }) => {
  const host = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<BakuScene | null>(null)
  const modelRef = useRef<BakuModel | null>(null)
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [ready, setReady] = useState(false)
  const [boot, setBoot] = useState('loading the building shell…')
  const [fatal, setFatal] = useState<Failure | null>(null)
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    skin: true,
    context: true,
    steel: false,
    vertexGraph: true,
    patchGraph: false,
    frameGraph: true,
    zones: false,
  })
  const [colour, setColour] = useState<SkinColour>('class')
  const [commits, setCommits] = useState<Commit[]>([])
  const [commit, setCommit] = useState<string | undefined>(undefined)
  const [commitNote, setCommitNote] = useState<string | null>(null)
  const [healed, setHealed] = useState<string | null>(null)
  const [text, setText] = useState(Q.PRESETS[0].cypher)
  const [preset, setPreset] = useState<string>(Q.PRESETS[0].key)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<CypherTable | null>(null)
  const [failure, setFailure] = useState<Failure | null>(null)
  const [hl, setHl] = useState<Highlight>(emptyHighlight())
  const [elapsed, setElapsed] = useState<number | null>(null)
  const [canvasNote, setCanvasNote] = useState<string | null>(null)
  const [picked, setPicked] = useState<Pick>(null)
  const [card, setCard] = useState<CypherTable | null>(null)
  const [stats, setStats] = useState<Record<string, number>>({})

  const neighbourhood = useVisStore((s) => s.neighbourhood)
  const inspectNodeInfo = useVisStore((s) => s.inspectNodeInfo)
  const canvasActions = useCanvasStore((s) => s.actions)

  /** Run one statement at the viewed commit. A COMMIT_NOT_LOADED (after a
   *  restart) is repaired with LOAD COMMIT and retried ONCE, and the repair is
   *  reported, not hidden. */
  const run = useCallback(
    // `null` means HEAD explicitly. (A bare `undefined` would fall back to the
    // default parameter, i.e. to whichever commit was viewed BEFORE.)
    async (query: string, pinned?: string | null): Promise<CypherTable> => {
      const at = pinned === undefined ? commit : (pinned ?? undefined)
      try {
        return await executeCypherQueryTable({ graph, query, commit: at })
      } catch (e) {
        const kind = (e as { errorType?: string }).errorType ?? ''
        if (at && kind.includes('COMMIT_NOT_LOADED')) {
          await executeCypherQueryTable({ graph, query: `LOAD COMMIT '${at}'` })
          setHealed(`commit ${at.slice(0, 8)} was not loaded — issued LOAD COMMIT and retried`)
          return await executeCypherQueryTable({ graph, query, commit: at })
        }
        throw e
      }
    },
    [graph, commit]
  )

  // ---------------------------------------------------------------- boot ---
  useEffect(() => {
    let alive = true
    let scene: BakuScene | null = null
    ;(async () => {
      const man = (await fetch('/baku/manifest.json').then((r) => {
        if (!r.ok)
          throw new Error(
            '/baku/manifest.json not found. Run `make web` in baku-graph and copy data/out/web to public/baku/.'
          )
        return r.json()
      })) as Manifest
      if (!alive) return
      setManifest(man)
      setBoot('reading the graph from TuringDB…')
      const t0 = performance.now()
      const model = await loadModel((q) => executeCypherQueryTable({ graph, query: q }))
      if (!alive || !host.current) return
      modelRef.current = model
      setBoot('drawing…')
      scene = new BakuScene(host.current, model, man)
      sceneRef.current = scene
      // dev-only handle for debugging in the console / browser automation
      if (import.meta.env.DEV) (window as unknown as { __baku: BakuScene }).__baku = scene
      await scene.loadShell(man.layers.filter((l) => l.default).map((l) => l.name))
      scene.buildGraphLayers()
      scene.setSkinColour('class')
      scene.setVisible('patchGraph', false)
      scene.setVisible('zones', false)
      const hist = await executeCypherQueryTable({ graph, query: Q.HISTORY })
      if (!alive) return
      setCommits(
        hist.rows.map((r) => ({
          hash: String(r[0]).replace('(HEAD)', '').trim(),
          head: String(r[0]).includes('(HEAD)'),
          nodes: Number(r[1]),
          edges: Number(r[2]),
        }))
      )
      setStats({
        vertices: model.pos.length / 3,
        meshEdges: model.meshEdgesDirected,
        patches: model.patches.filter(Boolean).length,
        adjacency: model.adjacency.length / 2,
        joints: model.frame ? model.frame.node.filter((n) => n >= 0).length : 0,
        members: model.frame ? model.frame.members.length / 2 : 0,
        contacts: model.frame ? model.frame.contacts.length / 2 : 0,
        loadMs: Math.round(performance.now() - t0),
        straight: scene.straightAdjacencies,
      })
      scene.onPick = (p) => setPicked(p)
      setReady(true)
    })().catch((e) => alive && setFatal(asFailure(e)))
    return () => {
      alive = false
      scene?.dispose()
      sceneRef.current = null
    }
  }, [graph])

  // --------------------------------------------------------- layer/colour ---
  const toggle = useCallback(
    async (key: LayerKey) => {
      const s = sceneRef.current
      if (!s || !manifest) return
      const on = !layers[key]
      if (key === 'steel' && on && !s.hasLayer('steel')) {
        setBoot('loading the steel mesh…')
        await s.loadShell(['frame']).catch((e) => setFatal(asFailure(e)))
        setBoot('')
      }
      s.setVisible(key, on)
      setLayers((l) => ({ ...l, [key]: on }))
    },
    [layers, manifest]
  )

  useEffect(() => {
    sceneRef.current?.setSkinColour(colour, hl)
  }, [colour, hl])

  // ------------------------------------------------------------- 2D canvas ---
  /** Show a result in the stock canvas as exactly its subgraph. Paths carry
   *  their own edges; for node sets the edges among them are fetched. */
  const showInCanvas = useCallback(
    async (h: Highlight) => {
      const ids = h.nodeIDs.slice(0, CANVAS_CAP)
      setCanvasNote(
        h.nodeIDs.length > CANVAS_CAP
          ? `2D shows the first ${CANVAS_CAP} of ${h.nodeIDs.length} nodes`
          : null
      )
      if (!ids.length) {
        neighbourhood.setSubgraph(graph, [], [])
        return
      }
      let edges = h.edges
      if (!h.paths.length) {
        const set = new Set(ids)
        const data = await getNodeEdgeIDs({ graph, nodeIDs: ids, defaultLimit: 400 })
        edges = []
        for (const [id, entry] of Object.entries(data)) {
          for (const o of entry.outs)
            if (set.has(o.tgtID)) edges.push([o.edgeID, Number(id), o.tgtID])
        }
      }
      neighbourhood.setSubgraph(graph, ids, edges)
      // setSubgraph is synchronous but the canvas then FETCHES the nodes; fitting
      // now would frame an empty canvas. Wait for the load to finish first.
      await canvasSettled()
      canvasActions.autoFit(Math.min(2500 + ids.length * 5, 5000), 1.5)
    },
    [graph, neighbourhood, canvasActions]
  )

  // ---------------------------------------------------------------- query ---
  const execute = useCallback(
    // `key` is passed in, not read from state: a preset click calls this in the
    // same tick as setPreset, when `preset` still holds the previous value.
    async (query: string, key: string = preset) => {
      const model = modelRef.current
      const s = sceneRef.current
      if (!model || !s) return
      setRunning(true)
      setFailure(null)
      setHealed(null)
      const t0 = performance.now()
      try {
        let q = query
        if (key === 'similar' && query.startsWith('--')) {
          // The seed embedding is read from the graph, then searched with.
          const e = await run(Q.patchEmbedding('p:112'))
          const vec = (e.rows[0]?.[0] as number[]) ?? []
          if (!vec.length) throw new Error('p:112 has no embedding at this commit')
          q = Q.similarTo(vec, 10)
          setText(q)
        }
        const t = await run(lint(q))
        const h = interpret(q, t, model)
        setResult(t)
        setHl(h)
        setElapsed(Math.round(performance.now() - t0))
        s.setHighlight(h, colour)
        if (h.patches.size && !layers.patchGraph && h.paths.some((p) => p.kind === 'patch')) {
          s.setVisible('patchGraph', true)
          setLayers((l) => ({ ...l, patchGraph: true }))
        }
        s.focus(s.highlightPoints(h))
        await showInCanvas(h)
      } catch (e) {
        // A failure must not leave the PREVIOUS result on screen looking current.
        setFailure(asFailure(e))
        setResult(null)
        const none = emptyHighlight()
        setHl(none)
        s.setHighlight(none, colour)
      } finally {
        setRunning(false)
      }
    },
    [run, preset, colour, layers.patchGraph, showInCanvas]
  )

  const choose = (p: Q.Preset) => {
    setPreset(p.key)
    setText(p.cypher)
    void execute(p.cypher, p.key)
  }

  const clear = () => {
    const e = emptyHighlight()
    setHl(e)
    setResult(null)
    setFailure(null)
    sceneRef.current?.setHighlight(e, colour)
    neighbourhood.setSubgraph(graph, [], [])
  }

  // ------------------------------------------------------------- picking ---
  useEffect(() => {
    if (!picked) return setCard(null)
    const q =
      picked.kind === 'vertex'
        ? Q.vertexCard(picked.id)
        : picked.kind === 'patch'
          ? Q.patchCard(picked.id)
          : Q.jointCard(picked.id)
    run(q)
      .then(setCard)
      .catch((e) => setFailure(asFailure(e)))
  }, [picked, run])

  const pickedNode = useMemo(() => {
    const m = modelRef.current
    if (!picked || !m) return undefined
    if (picked.kind === 'vertex') return m.vertexNode[picked.id]
    if (picked.kind === 'patch') return m.patches[picked.id]?.node
    return m.frame?.node[picked.id]
  }, [picked])

  /** 3D -> 2D: the picked node plus its real neighbours, via the stock loader. */
  const showNeighbours = async () => {
    if (pickedNode === undefined || pickedNode < 0) return
    neighbourhood.reset(graph)
    await neighbourhood.add([pickedNode])
    await canvasSettled()
    canvasActions.autoFit(2500, 1.5)
  }

  /** 2D -> 3D: a node inspected in the canvas is marked on the building. */
  useEffect(() => {
    const m = modelRef.current
    const s = sceneRef.current
    if (!inspectNodeInfo || !m || !s) return
    const e = m.byNode.get(inspectNodeInfo.nodeID)
    if (e?.kind === 'vertex' || e?.kind === 'joint') s.mark({ kind: e.kind, id: e.id })
    else if (e?.kind === 'patch') s.mark({ kind: 'patch', id: e.id })
  }, [inspectNodeInfo])

  // --------------------------------------------------------- time travel ---
  const viewCommit = useCallback(
    async (hash: string | undefined) => {
      const s = sceneRef.current
      if (!s) return
      setCommit(hash)
      setCommitNote('loading…')
      // A highlight names nodes of the commit it was queried at; it is not
      // evidence about this one (the frame may not even exist here).
      const none = emptyHighlight()
      setHl(none)
      setResult(null)
      setFailure(null)
      s.setHighlight(none, colour)
      s.mark(null)
      setPicked(null)
      neighbourhood.setSubgraph(graph, [], [])
      try {
        const at = (q: string) => run(q, hash ?? null)
        const labels = await loadLabels(at)
        s.setFrame(labels.has('Joint') ? await loadFrame(at) : null)
        s.setZones(labels.has('Zone') ? await loadZones(at) : [])
        const joints = labels.has('Joint')
          ? Number((await at('MATCH (j:Joint) RETURN count(j)')).rows[0][0])
          : 0
        const zones = labels.has('Zone')
          ? Number((await at('MATCH (z:Zone) RETURN count(z)')).rows[0][0])
          : 0
        setCommitNote(
          !labels.has('Vertex')
            ? 'Before the load: the graph is empty at this commit.'
            : `${labels.size} labels · ${zones} zones · ${joints} frame joints at this commit` +
                (labels.has('Joint') ? '' : ' (the frame does not exist yet)')
        )
      } catch (e) {
        setCommitNote(null)
        setFailure(asFailure(e))
      }
    },
    [run, colour, graph, neighbourhood]
  )

  // ------------------------------------------------------------------ view ---
  const cols = result?.columns ?? []
  const rows = result?.rows.slice(0, 200) ?? []
  const commitIdx = commit ? commits.findIndex((c) => c.hash === commit) : 0
  const summary = useMemo(() => {
    const parts: string[] = []
    if (hl.vertices.size) parts.push(`${hl.vertices.size} vertices`)
    if (hl.patches.size) parts.push(`${hl.patches.size} patches`)
    if (hl.joints.size) parts.push(`${hl.joints.size} joints`)
    if (hl.zones.size) parts.push(`${hl.zones.size} zones`)
    if (hl.paths.length) {
      const p = hl.paths[0]
      parts.push(`path ${hl.pathDist?.toFixed(2) ?? '?'} · ${p.ids.length - 1} hops`)
    }
    return parts.join(' · ')
  }, [hl])

  if (fatal) {
    return (
      <div className="bk-panel bk-fatal" role="alert">
        <div className="bk-error-type">{fatal.errorType}</div>
        <pre className="bk-error-details">{fatal.errorDetails}</pre>
        <div className="bk-hint">
          The graph is served from <code>{graph}</code> through <code>/api</code> (TURING_API_PORT).
          If the graph is on another machine, tunnel its port (e.g.{' '}
          <code>ssh -f -N -L 6682:127.0.0.1:6682 &lt;user&gt;@&lt;graph-host&gt;</code>) and start
          the visualizer with <code>TURING_API_PORT=6682 npm run dev</code>.
        </div>
      </div>
    )
  }

  return (
    <div
      className="bk-panel"
      onClick={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <header className="bk-header">
        <span className="bk-title">Heydar Aliyev Center · section</span>
        {!ready && (
          <span className="bk-boot">
            <Spinner size={12} /> {boot}
          </span>
        )}
        {ready && (
          <span className="bk-totals">
            {stats.vertices.toLocaleString()} Vertex · {stats.meshEdges.toLocaleString()} MESH_EDGE
            · {stats.patches} Patch · {stats.joints} Joint · {stats.members.toLocaleString()} MEMBER
            · {stats.contacts} CONTACT — read from TuringDB in {stats.loadMs} ms
          </span>
        )}
      </header>

      <div className="bk-viewport">
        <div ref={host} className="bk-gl" />
        <div className="bk-layers">
          {LAYER_LABELS.map(([k, label]) => (
            <label key={k}>
              <input
                type="checkbox"
                checked={layers[k]}
                onChange={() => void toggle(k)}
                disabled={!ready}
              />
              {label}
            </label>
          ))}
          <div className="bk-colour">
            skin colour
            {(['class', 'patch', 'curvature', 'plain'] as SkinColour[]).map((m) => (
              <button key={m} aria-pressed={colour === m} onClick={() => setColour(m)}>
                {m}
              </button>
            ))}
          </div>
          {colour === 'class' && (
            <div className="bk-legend">
              {Object.entries(CLASS_RGB).map(([c, [r, g, b]]) => (
                <span key={c}>
                  <i style={{ background: `rgb(${r * 255},${g * 255},${b * 255})` }} />
                  {c}
                </span>
              ))}
            </div>
          )}
          {stats.straight > 0 && (
            <div className="bk-warn">
              {stats.straight} patch adjacencies drawn straight (no surface route)
            </div>
          )}
        </div>

        {picked && card && (
          <div className="bk-card">
            <button
              className="bk-x"
              onClick={() => {
                setPicked(null)
                sceneRef.current?.mark(null)
              }}
            >
              ×
            </button>
            <h4>{String(card.rows[0]?.[0] ?? '')}</h4>
            <table>
              <tbody>
                {card.columns.slice(1).map((c, i) => (
                  <tr key={c}>
                    <th>{c}</th>
                    <td>{fmt(card.rows[0]?.[i + 1])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="bk-btn" onClick={() => void showNeighbours()}>
              show its neighbours in the graph view →
            </button>
          </div>
        )}

        <div className="bk-credit">{manifest?.attribution}</div>
      </div>

      <div className="bk-timeline">
        <span className="bk-dim">commit</span>
        {commits
          .slice()
          .reverse()
          .map((c, i) => (
            <button
              key={c.hash}
              aria-pressed={(commit ?? commits[0]?.hash) === c.hash}
              title={`${c.hash} · +${c.nodes} nodes · +${c.edges} edges (per-commit deltas)`}
              onClick={() => void viewCommit(c.head ? undefined : c.hash)}
            >
              {i}
              {c.head ? ' HEAD' : ''}
            </button>
          ))}
        <span className="bk-dim">
          {commit
            ? `viewing ${commit.slice(0, 8)} (${commits.length - 1 - commitIdx} of ${commits.length - 1})`
            : 'HEAD'}
          {commitNote ? ` — ${commitNote}` : ''}
        </span>
        {healed && <span className="bk-healed">self-healed: {healed}</span>}
      </div>

      <div className="bk-console">
        <nav className="bk-presets">
          {(['Surface', 'Patches', 'Frame', 'Graph', 'Versions'] as const).map((g) => (
            <section key={g}>
              <h5>{g}</h5>
              {Q.PRESETS.filter((p) => p.group === g).map((p) => (
                <button
                  key={p.key}
                  aria-pressed={preset === p.key}
                  onClick={() => choose(p)}
                  disabled={!ready}
                >
                  {p.title}
                  <small>{p.note}</small>
                </button>
              ))}
            </section>
          ))}
        </nav>
        <div className="bk-editor">
          <textarea
            value={text}
            spellCheck={false}
            onChange={(e) => {
              setText(e.target.value)
              setPreset('')
            }}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') void execute(text)
            }}
          />
          <div className="bk-run">
            <button
              className="bk-btn bk-primary"
              onClick={() => void execute(text)}
              disabled={!ready || running}
            >
              {running ? 'running…' : 'Run ⌘↵'}
            </button>
            <button className="bk-btn" onClick={clear}>
              clear
            </button>
            <span className="bk-chip">read-only · linted</span>
            {summary && <span className="bk-summary">{summary}</span>}
            {elapsed !== null && result && (
              <span className="bk-dim">
                {result.rows.length.toLocaleString()} rows · {result.timeMs?.toFixed(1)} ms server ·{' '}
                {elapsed} ms total
              </span>
            )}
            {canvasNote && <span className="bk-chip bk-warn">{canvasNote}</span>}
            {hl.unknown > 0 && (
              <span className="bk-chip">
                {hl.unknown} result nodes are not drawn in 3D (Building, Zone, Level…)
              </span>
            )}
          </div>
          {failure && (
            <div className="bk-error" role="alert">
              <div className="bk-error-type">{failure.errorType}</div>
              <pre className="bk-error-details">{failure.errorDetails}</pre>
              {explainAtCommit(failure, commit) && (
                <div className="bk-hint">{explainAtCommit(failure, commit)}</div>
              )}
            </div>
          )}
          {result && (
            <div className="bk-table">
              <table>
                <thead>
                  <tr>
                    {cols.map((c, i) => (
                      <th key={c} title={result.types[i]}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      {r.map((v, j) => (
                        <td key={j}>{fmt(v)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.rows.length > rows.length && (
                <div className="bk-dim">
                  first {rows.length} of {result.rows.length.toLocaleString()} rows
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** Resolves once the stock canvas has started and finished loading a new node
 *  set (GraphCanvasData owns `graphLoading`), or after 3 s regardless. */
async function canvasSettled(): Promise<void> {
  const t0 = performance.now()
  let seenLoading = false
  while (performance.now() - t0 < 3000) {
    await new Promise((r) => setTimeout(r, 50))
    const loading = useVisStore.getState().graphLoading
    if (loading) seenLoading = true
    else if (seenLoading || performance.now() - t0 > 600) return
  }
}

function fmt(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(4)
  if (Array.isArray(v))
    return v.length > 8 ? `[${v.slice(0, 8).join(', ')}, … ${v.length} items]` : `[${v.join(', ')}]`
  return String(v)
}

export default BakuPanel
