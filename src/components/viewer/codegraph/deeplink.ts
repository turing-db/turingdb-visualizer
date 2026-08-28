/**
 * Deep links: `?graph=&focus=&depth=&tab=`.
 *
 * Upstream has no URL handling at all (grep for useSearchParams|URLSearchParams|
 * location.hash returns nothing), so this is additive and touches nothing else.
 *
 * `focus` is a content-derived `sid`, not an internal node id. Internal ids are
 * per-build and collide across graphs, so a link built from one would silently
 * point at a different symbol after any rebuild.
 */
export interface DeepLink {
  graph?: string
  focus?: number
  depth?: number
  tab?: string
}

export function readDeepLink(search: string = window.location.search): DeepLink {
  const p = new URLSearchParams(search)
  const num = (k: string) => {
    const v = p.get(k)
    if (v === null) return undefined
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
  }
  return {
    graph: p.get('graph') ?? undefined,
    focus: num('focus'),
    depth: num('depth'),
    tab: p.get('tab') ?? undefined,
  }
}

export function writeDeepLink(link: DeepLink, base: string = window.location.pathname): string {
  const p = new URLSearchParams()
  if (link.graph) p.set('graph', link.graph)
  if (link.focus !== undefined) p.set('focus', String(link.focus))
  if (link.depth !== undefined) p.set('depth', String(link.depth))
  if (link.tab) p.set('tab', link.tab)
  const qs = p.toString()
  return qs ? `${base}?${qs}` : base
}
