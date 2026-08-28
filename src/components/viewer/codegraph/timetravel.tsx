/**
 * CommitScrubber + VerifyBar.
 *
 * **The scrub is a client-side mask, not a query.** Every node carries
 * `gitFirst` (first snapshot it appears in) and `gitGone` (first snapshot it is
 * absent from, 0 = still present), so visibility at stop k is
 *
 *     gitFirst <= k && (gitGone === 0 || gitGone > k)
 *
 * evaluated in JS. Dragging costs zero round trips, which is the only way this
 * is smooth — and the arc is built with ZERO deletes precisely so that a mask
 * is sufficient: a mask can hide, but it can never resurrect, so a build that
 * deleted per snapshot could not scrub backwards.
 *
 * **The VerifyBar exists because time travel has a real trap.** A bare
 * `?commit=<hash>` returns `COMMIT_NOT_LOADED` after a server restart — the
 * commit has to be LOADed first, and `set_commit` on an unloaded commit
 * succeeds silently. So the bar catches that one error, issues `LOAD COMMIT`,
 * retries once, and SAYS it did rather than hiding the repair.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { executeCypherQuery } from '@/api/api'
import * as Q from './queries'
import { TIER_COLOR } from './model'

export interface SnapshotNode {
  sid: number
  label: string
  path: string
  tier: string
  gitFirst: number
  gitGone: number
}

function columns(resp: unknown): unknown[][] {
  const rows: unknown[][] = []
  for (const chunk of (resp ?? []) as unknown[][][]) {
    if (!chunk || chunk.length === 0) continue
    const n = (chunk[0] as unknown[])?.length ?? 0
    for (let i = 0; i < n; i++) rows.push(chunk.map((c) => (c as unknown[])[i]))
  }
  return rows
}

/** Visible at stop k. The one predicate the whole scrubber rests on. */
export function visibleAt(n: { gitFirst: number; gitGone: number }, k: number): boolean {
  return n.gitFirst <= k && (n.gitGone === 0 || n.gitGone > k)
}

/** Newly appeared at exactly this stop — these flash amber. */
export function bornAt(n: { gitFirst: number }, k: number): boolean {
  return n.gitFirst === k
}

interface Props {
  graph?: string
  stops?: Array<{ index: number; ref: string; sha: string }>
}

export const CommitScrubber = ({ graph = 'cg_arc', stops = [] }: Props) => {
  const [nodes, setNodes] = useState<SnapshotNode[] | null>(null)
  const [k, setK] = useState(stops.length ? stops.length - 1 : 1)
  const [error, setError] = useState<string | null>(null)
  const [healed, setHealed] = useState<string | null>(null)
  const [commits, setCommits] = useState<string[]>([])

  /**
   * Run a query, and if it fails with COMMIT_NOT_LOADED, issue LOAD COMMIT and
   * retry exactly once. The repair is REPORTED, not hidden: a silent retry
   * teaches nobody why the first attempt failed.
   */
  const runHealing = useCallback(
    async (query: string, commit?: string): Promise<unknown> => {
      try {
        return await executeCypherQuery({ graph, query, commit })
      } catch (e) {
        const err = e as { errorType?: string; message?: string }
        const kind = err.errorType ?? err.message ?? ''
        if (commit && kind.includes('COMMIT_NOT_LOADED')) {
          await executeCypherQuery({ graph, query: `LOAD COMMIT '${commit}'` })
          setHealed(
            `commit ${commit.slice(0, 8)} was not loaded — issued LOAD COMMIT and retried`
          )
          return await executeCypherQuery({ graph, query, commit })
        }
        throw e
      }
    },
    [graph]
  )

  useEffect(() => {
    let alive = true
    Promise.all([
      runHealing(Q.SNAPSHOT_FILES),
      executeCypherQuery({ graph, query: Q.HISTORY }),
    ])
      .then(([files, hist]) => {
        if (!alive) return
        setNodes(
          columns(files).map((r) => ({
            sid: Number(r[1]), label: String(r[2]), path: String(r[2]),
            tier: String(r[3]), gitFirst: Number(r[5]), gitGone: Number(r[6]),
          }))
        )
        setCommits(columns(hist).map((r) => String(r[0]).replace('(HEAD)', '').trim()))
      })
      .catch((e) => setError((e as Error).message ?? String(e)))
    return () => {
      alive = false
    }
  }, [graph, runHealing])

  /** Recomputed in JS on every drag. No query, no round trip. */
  const view = useMemo(() => {
    if (!nodes) return { visible: 0, born: 0, gone: 0 }
    let visible = 0, born = 0, gone = 0
    for (const n of nodes) {
      if (visibleAt(n, k)) {
        visible++
        if (bornAt(n, k)) born++
      } else if (n.gitGone !== 0 && n.gitGone <= k) gone++
    }
    return { visible, born, gone }
  }, [nodes, k])

  if (error) {
    return (
      <div className="cg-error" role="alert">
        <div className="cg-error-type">time travel unavailable</div>
        <pre className="cg-error-details">{error}</pre>
        <div className="cg-error-hint">
          The arc is <code>cg_arc</code> — build it with <code>codegraph snapshot</code>.
        </div>
      </div>
    )
  }

  const maxK = Math.max(stops.length - 1, 1)
  return (
    <div className="cg-scrubber">
      <label>
        snapshot
        <input
          type="range"
          min={0}
          max={maxK}
          value={k}
          onChange={(e) => setK(Number(e.target.value))}
        />
        <strong>
          {stops[k]?.ref ?? k} {stops[k] ? `(${stops[k].sha.slice(0, 8)})` : ''}
        </strong>
      </label>
      <div className="cg-chips">
        <span className="cg-chip">colour: tier</span>
        {Object.keys(TIER_COLOR).slice(0, 3).map((t) => (
          <span key={t} className="cg-chip">
            <span style={{ color: `#${TIER_COLOR[t].toString(16)}` }}>●</span> {t}
          </span>
        ))}
      </div>
      <div className="cg-scrub-stats">
        {view.visible.toLocaleString()} visible · <span className="cg-born">{view.born} new
        at this stop</span> · {view.gone} gone
        <div className="cg-dim">masked client-side from gitFirst/gitGone — zero round trips</div>
      </div>
      <VerifyBar commits={commits} healed={healed} graph={graph} />
    </div>
  )
}

/** Proves the picture came from a real versioned graph, and reports any repair. */
export const VerifyBar = ({
  commits,
  healed,
  graph,
}: {
  commits: string[]
  healed: string | null
  graph: string
}) => (
  <div className="cg-verify">
    <span className="cg-chip">
      {graph} · {commits.length} commits in db.history()
    </span>
    {commits.slice(0, 3).map((c) => (
      <code key={c} className="cg-hash">
        {c.slice(0, 8)}
      </code>
    ))}
    {healed && <div className="cg-healed">self-healed: {healed}</div>}
  </div>
)
