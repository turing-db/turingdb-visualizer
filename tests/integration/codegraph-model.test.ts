/**
 * Unit tests for the parts of the codegraph module that have no server in them:
 * the columnar flattener contract and deep links.
 */
import { describe, expect, test } from 'vitest'
import { CONF_STYLE, NODE_CAP, TIER_COLOR, TYPE_COLOR } from '@/components/viewer/codegraph/model'
import { readDeepLink, writeDeepLink } from '@/components/viewer/codegraph/deeplink'

describe('deep links', () => {
  test('round-trip', () => {
    const url = writeDeepLink({ graph: 'cg_head', focus: 738907186, depth: 2, tab: 'subgraph' }, '/v')
    expect(url).toContain('focus=738907186')
    const back = readDeepLink(url.slice(url.indexOf('?')))
    expect(back).toEqual({ graph: 'cg_head', focus: 738907186, depth: 2, tab: 'subgraph' })
  })

  test('a non-numeric focus is dropped, not passed through as NaN', () => {
    expect(readDeepLink('?focus=notanumber').focus).toBeUndefined()
  })

  test('empty search yields an empty link', () => {
    expect(readDeepLink('')).toEqual({
      graph: undefined, focus: undefined, depth: undefined, tab: undefined,
    })
  })
})

describe('styling contract', () => {
  test('every CodeKind has a colour', () => {
    for (const k of ['dir', 'file', 'class', 'function', 'testcase', 'macro', 'ext', 'unresolved']) {
      expect(TYPE_COLOR[k as keyof typeof TYPE_COLOR]).toBeGreaterThan(0)
    }
  })

  test('confidence opacity is ordered: EXACT >= EXTRACTED > INFERRED > AMBIGUOUS', () => {
    expect(CONF_STYLE.EXACT).toBeGreaterThanOrEqual(CONF_STYLE.EXTRACTED)
    expect(CONF_STYLE.EXTRACTED).toBeGreaterThan(CONF_STYLE.INFERRED)
    expect(CONF_STYLE.INFERRED).toBeGreaterThan(CONF_STYLE.AMBIGUOUS)
  })

  test('every tier has a colour so nothing renders undefined', () => {
    for (const t of ['core', 'test', 'tool', 'fuzz', 'regress', 'sample', 'python']) {
      expect(TIER_COLOR[t]).toBeGreaterThan(0)
    }
  })

  test('the node cap is a real bound', () => {
    expect(NODE_CAP).toBeGreaterThan(0)
    expect(NODE_CAP).toBeLessThanOrEqual(2000)
  })
})

describe('no swallowed errors', () => {
  test('model.ts contains no catch-and-return-empty', async () => {
    const fs = await import('node:fs')
    const src = fs.readFileSync('src/components/viewer/codegraph/model.ts', 'utf8')
    // A swallowed PARSE_ERROR renders as an empty graph and claims success.
    expect(/catch\s*\([^)]*\)\s*\{\s*return\s*\[\]/.test(src)).toBe(false)
    expect(src.includes('.catch(() => [])')).toBe(false)
  })
})

describe('time travel mask', () => {
  test('visibleAt implements gitFirst <= k AND (gitGone == 0 OR gitGone > k)', async () => {
    const { visibleAt, bornAt } = await import('@/components/viewer/codegraph/timetravel')
    const alive = { gitFirst: 0, gitGone: 0 }
    const born1 = { gitFirst: 1, gitGone: 0 }
    const gone1 = { gitFirst: 0, gitGone: 1 }
    expect(visibleAt(alive, 0)).toBe(true)
    expect(visibleAt(alive, 1)).toBe(true)
    // not yet born at stop 0 — and this is why the arc must not DELETE:
    // a mask can hide it now and reveal it at stop 1, a delete could not.
    expect(visibleAt(born1, 0)).toBe(false)
    expect(visibleAt(born1, 1)).toBe(true)
    expect(visibleAt(gone1, 0)).toBe(true)
    expect(visibleAt(gone1, 1)).toBe(false)
    expect(bornAt(born1, 1)).toBe(true)
    expect(bornAt(born1, 0)).toBe(false)
  })

  test('scrubbing BACKWARDS restores a node — the property a delete-based arc loses', async () => {
    const { visibleAt } = await import('@/components/viewer/codegraph/timetravel')
    const n = { gitFirst: 1, gitGone: 0 }
    expect([0, 1, 0].map((k) => visibleAt(n, k))).toEqual([false, true, false])
  })
})
