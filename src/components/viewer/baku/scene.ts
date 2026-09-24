/**
 * BakuScene — the building in 3D with the graph drawn on it, at true scale.
 *
 * Rules (each from a rejected picture):
 *  - Glyphs are in BUILDING UNITS. A mesh edge is ~0.48 m, so the triangle graph
 *    is 1-px lines on the skin and the nodes are centimetres; nothing is sized
 *    for legibility at full zoom, because a node sized that way is a false
 *    statement about the object. Only HIGHLIGHTS are screen-constant, since
 *    their job is to be found.
 *  - Every graph sits ON its geometry (2 cm along the skin normal), never
 *    floating. Patch adjacency is routed along the surface, not drawn as chords.
 *  - Z-up metres in, Y-up out: one rotation on the root group, so every
 *    coordinate below is in the pipeline's ingest frame (= graph x/y/z).
 *  - Render on demand. The laptop is an 8 GB Air; an idle scene draws nothing.
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js'
import type { BakuModel, Highlight, Manifest } from './model'
import { makeRouter, patchAnchors, routedAdjacency } from './model'

export type SkinColour = 'class' | 'patch' | 'curvature' | 'plain'
export type LayerKey =
  | 'skin'
  | 'context'
  | 'steel'
  | 'vertexGraph'
  | 'patchGraph'
  | 'frameGraph'
  | 'zones'

export type Pick =
  | { kind: 'vertex'; id: number }
  | { kind: 'joint'; id: number }
  | { kind: 'patch'; id: number }
  | null

export const CLASS_RGB: Record<string, [number, number, number]> = {
  soffit: [0.29, 0.52, 0.78],
  top: [0.93, 0.74, 0.29],
  transition: [0.62, 0.45, 0.7],
  vertical: [0.45, 0.62, 0.45],
}
const PALETTE: Array<[number, number, number]> = [
  [0.55, 0.71, 0.87],
  [0.97, 0.73, 0.55],
  [0.6, 0.83, 0.6],
  [0.95, 0.6, 0.6],
  [0.78, 0.68, 0.87],
  [0.8, 0.7, 0.62],
  [0.96, 0.76, 0.85],
  [0.85, 0.85, 0.55],
  [0.55, 0.85, 0.87],
]
const HILITE = new THREE.Color(0xe11d74)
const OFFSET = 0.02 // metres along the normal: on the skin, just clear of it

export class BakuScene {
  readonly renderer: THREE.WebGLRenderer
  readonly camera: THREE.PerspectiveCamera
  readonly controls: OrbitControls
  private scene = new THREE.Scene()
  private root = new THREE.Group()
  private layers = new Map<LayerKey, THREE.Object3D>()
  private skin?: THREE.Mesh
  private skinNormals?: Float32Array
  private anchors?: Int32Array
  private router?: ReturnType<typeof makeRouter>
  private hl = new THREE.Group()
  private fat: LineMaterial[] = []
  private marker: THREE.Points
  private frameGroup = new THREE.Group()
  private zoneGroup = new THREE.Group()
  private raf = 0
  private ro: ResizeObserver
  private down: { x: number; y: number } | null = null
  onPick: (p: Pick) => void = () => {}
  /** Adjacencies drawn straight because no surface route was found (should be 0). */
  straightAdjacencies = 0

  constructor(
    private host: HTMLElement,
    private model: BakuModel,
    private manifest: Manifest,
    private assetBase = '/baku'
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0x15191e)
    host.appendChild(this.renderer.domElement as never)
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 2000)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement as never)
    this.controls.addEventListener('change', () => this.render())

    this.root.rotation.x = -Math.PI / 2
    this.scene.add(this.root)
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f99, 1.6))
    const sun = new THREE.DirectionalLight(0xffffff, 1.4)
    sun.position.set(-40, 80, 50)
    this.scene.add(sun)

    const mg = new THREE.BufferGeometry()
    mg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3))
    this.marker = new THREE.Points(
      mg,
      new THREE.PointsMaterial({
        color: 0x111827,
        size: 14,
        sizeAttenuation: false,
        depthTest: false,
      })
    )
    this.marker.visible = false
    this.marker.renderOrder = 10
    this.root.add(this.hl, this.frameGroup, this.zoneGroup, this.marker)

    this.fit()
    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(host)
    this.resize()

    const el = this.renderer.domElement
    el.addEventListener('pointerdown', (e) => (this.down = { x: e.clientX, y: e.clientY }))
    el.addEventListener('pointerup', (e) => {
      if (this.down && Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y) < 4)
        this.pick(e)
      this.down = null
    })
  }

  // ------------------------------------------------------------ building ---
  async loadShell(names: string[]) {
    for (const spec of this.manifest.layers.filter((l) => names.includes(l.name))) {
      const [pos, idx] = await Promise.all(
        [spec.pos, spec.idx].map((f) =>
          fetch(`${this.assetBase}/${f}`).then((r) => {
            if (!r.ok)
              throw new Error(
                `${this.assetBase}/${f}: HTTP ${r.status} — run \`make web\` in baku-graph and copy data/out/web to public/baku/`
              )
            return r.arrayBuffer()
          })
        )
      )
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3))
      g.setIndex(new THREE.BufferAttribute(new Uint32Array(idx), 1))
      g.computeVertexNormals()
      const isSkin = spec.name === 'skin'
      if (isSkin && g.attributes.position.count !== this.model.pos.length / 3) {
        throw new Error(
          `skin.pos.bin has ${g.attributes.position.count} vertices, the graph ${this.model.pos.length / 3}: ` +
            'the shell and the graph come from different builds. Re-run `make web` on the server that holds the graph.'
        )
      }
      const mat = new THREE.MeshLambertMaterial({
        color: isSkin ? 0xffffff : new THREE.Color(...spec.colour),
        vertexColors: isSkin,
        transparent: spec.opacity < 1,
        opacity: spec.opacity,
        side: THREE.DoubleSide,
        depthWrite: spec.opacity >= 1,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      })
      const mesh = new THREE.Mesh(g, mat)
      mesh.name = spec.name
      if (isSkin) {
        g.setAttribute(
          'color',
          new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3), 3)
        )
        this.skin = mesh
        this.skinNormals = g.attributes.normal.array as Float32Array
        this.layers.set('skin', mesh)
      } else if (spec.name === 'frame') {
        this.layers.set('steel', mesh)
      }
      if (isSkin || spec.name === 'frame') {
        this.root.add(mesh)
      } else {
        const ctx = this.layers.get('context') ?? new THREE.Group()
        ctx.add(mesh)
        if (!ctx.parent) this.root.add(ctx)
        this.layers.set('context', ctx)
      }
    }
    this.render()
  }

  /** On the skin, `OFFSET` along the (file mesh) normal, for vertex id v. */
  private lifted(v: number, extra = 0): [number, number, number] {
    const p = this.model.pos
    const n = this.skinNormals
    const o = OFFSET + extra
    return n
      ? [p[v * 3] + n[v * 3] * o, p[v * 3 + 1] + n[v * 3 + 1] * o, p[v * 3 + 2] + n[v * 3 + 2] * o]
      : [p[v * 3], p[v * 3 + 1], p[v * 3 + 2]]
  }

  private liftedArray(extra = 0): Float32Array {
    const n = this.model.pos.length / 3
    const out = new Float32Array(n * 3)
    for (let v = 0; v < n; v++) out.set(this.lifted(v, extra), v * 3)
    return out
  }

  // --------------------------------------------------------------- graph ---
  buildGraphLayers() {
    // Triangle graph: one line per MESH_EDGE, as stored in TuringDB.
    const lifted = this.liftedArray()
    const vg = new THREE.BufferGeometry()
    vg.setAttribute('position', new THREE.BufferAttribute(lifted, 3))
    vg.setIndex(new THREE.BufferAttribute(this.model.meshEdges, 1))
    const tri = new THREE.Group()
    tri.add(
      new THREE.LineSegments(
        vg,
        new THREE.LineBasicMaterial({ color: 0x1f2937, transparent: true, opacity: 0.35 })
      )
    )
    // Vertex nodes: 4 cm, attenuated — true scale, so they appear as you get close.
    const pts = new THREE.Points(
      vg,
      new THREE.PointsMaterial({ color: 0x1f2937, size: 0.04, sizeAttenuation: true })
    )
    tri.add(pts)
    this.layers.set('vertexGraph', tri)
    this.root.add(tri)

    // Patch graph: a 15 cm dot at each on-skin anchor; adjacency routed along the skin.
    this.anchors = patchAnchors(this.model)
    const { pairs, straight } = routedAdjacency(this.model, this.anchors)
    this.straightAdjacencies = straight
    const pg = new THREE.Group()
    const lifted2 = this.liftedArray(OFFSET)
    const eg = new THREE.BufferGeometry()
    eg.setAttribute('position', new THREE.BufferAttribute(lifted2, 3))
    eg.setIndex(new THREE.BufferAttribute(pairs, 1))
    pg.add(new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: 0x111827 })))
    const ap = new Float32Array(this.model.patches.length * 3)
    const ac = new Float32Array(this.model.patches.length * 3)
    this.model.patches.forEach((p, i) => {
      if (!p) return
      ap.set(this.lifted(this.anchors![i], OFFSET), i * 3)
      ac.set(CLASS_RGB[p.cls] ?? [0.6, 0.6, 0.6], i * 3)
    })
    const ag = new THREE.BufferGeometry()
    ag.setAttribute('position', new THREE.BufferAttribute(ap, 3))
    ag.setAttribute('color', new THREE.BufferAttribute(ac, 3))
    pg.add(
      new THREE.Points(
        ag,
        new THREE.PointsMaterial({ size: 0.3, vertexColors: true, sizeAttenuation: true })
      )
    )
    pg.visible = false
    this.layers.set('patchGraph', pg)
    this.root.add(pg)
    this.setFrame(this.model.frame)
    this.setZones(this.model.zones)
    this.render()
  }

  /** Versioned: replaced when the viewed commit changes. */
  setFrame(frame: BakuModel['frame']) {
    this.model.frame = frame
    this.frameGroup.clear()
    this.layers.set('frameGraph', this.frameGroup)
    if (!frame) return this.render()
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(frame.pos, 3))
    const mem = g.clone()
    mem.setIndex(new THREE.BufferAttribute(frame.members, 1))
    const con = g.clone()
    con.setIndex(new THREE.BufferAttribute(frame.contacts, 1))
    this.frameGroup.add(
      new THREE.LineSegments(mem, new THREE.LineBasicMaterial({ color: 0x1d4ed8 })),
      new THREE.LineSegments(con, new THREE.LineBasicMaterial({ color: 0xea580c })),
      new THREE.Points(
        g,
        new THREE.PointsMaterial({ color: 0x1e3a8a, size: 0.1, sizeAttenuation: true })
      )
    )
    const sp: number[] = []
    frame.support.forEach((s, i) => s && sp.push(...frame.pos.subarray(i * 3, i * 3 + 3)))
    const sg = new THREE.BufferGeometry()
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3))
    this.frameGroup.add(
      new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xdc2626, size: 0.36 }))
    )
    this.render()
  }

  setZones(zones: BakuModel['zones']) {
    this.model.zones = zones
    this.zoneGroup.clear()
    this.layers.set('zones', this.zoneGroup)
    const rgb: Record<string, number> = {
      Plaza: 0xf59e0b,
      CurtainWall: 0x3b82f6,
      Canopy: 0xdb2777,
      Lobby: 0x16a34a,
    }
    for (const z of zones) {
      const box = new THREE.Box3(new THREE.Vector3(...z.min), new THREE.Vector3(...z.max))
      this.zoneGroup.add(new THREE.Box3Helper(box, rgb[z.name] ?? 0x64748b))
    }
    this.render()
  }

  // ------------------------------------------------------------- styling ---
  setSkinColour(mode: SkinColour, hl?: Highlight) {
    if (!this.skin) return
    const col = this.skin.geometry.attributes.color as THREE.BufferAttribute
    const arr = col.array as Float32Array
    const { vertexPatch, meanCurv, patches } = this.model
    const c = new THREE.Color()
    for (let v = 0; v < vertexPatch.length; v++) {
      const p = vertexPatch[v]
      let rgb: [number, number, number] = [0.9, 0.9, 0.88]
      if (mode === 'class' && p >= 0) rgb = CLASS_RGB[patches[p]?.cls] ?? rgb
      else if (mode === 'patch' && p >= 0)
        rgb = PALETTE[(p * 7 + (patches[p]?.community ?? 0)) % PALETTE.length]
      else if (mode === 'curvature') {
        const t = Math.max(-1, Math.min(1, meanCurv[v] / 0.12))
        rgb = t < 0 ? [1 + t * 0.7, 1 + t * 0.45, 1] : [1, 1 - t * 0.7, 1 - t * 0.75]
      }
      c.setRGB(...rgb)
      if (hl?.patches.has(p)) c.lerp(HILITE, 0.75)
      arr.set([c.r, c.g, c.b], v * 3)
    }
    col.needsUpdate = true
    this.render()
  }

  setVisible(key: LayerKey, on: boolean) {
    const o = this.layers.get(key)
    if (o) {
      o.visible = on
      if (on && !o.parent) this.root.add(o)
    }
    this.render()
  }

  hasLayer(key: LayerKey) {
    return this.layers.has(key)
  }

  // ----------------------------------------------------------- highlight ---
  setHighlight(h: Highlight, mode: SkinColour) {
    this.hl.clear()
    this.fat = []
    this.setSkinColour(mode, h)
    const pts: number[] = []
    for (const v of h.vertices) pts.push(...this.lifted(v, 0.04))
    if (this.model.frame)
      for (const j of h.joints) pts.push(...this.model.frame.pos.subarray(j * 3, j * 3 + 3))
    if (this.anchors)
      for (const p of h.patches)
        if (this.anchors[p] >= 0) pts.push(...this.lifted(this.anchors[p], 0.05))
    if (pts.length) {
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
      const onePath = h.paths.length > 0
      const p = new THREE.Points(
        g,
        new THREE.PointsMaterial({
          color: HILITE,
          size: onePath ? 5 : 8,
          sizeAttenuation: false,
          depthTest: false,
        })
      )
      p.renderOrder = 5
      this.hl.add(p)
    }
    for (const path of h.paths) {
      const seq: number[] = []
      const at = (k: number): [number, number, number] | null => {
        if (path.kind === 'vertex') return this.lifted(path.ids[k], 0.06)
        if (path.kind === 'joint' && this.model.frame) {
          const f = this.model.frame.pos
          return [f[path.ids[k] * 3], f[path.ids[k] * 3 + 1], f[path.ids[k] * 3 + 2]]
        }
        return null
      }
      // Patch paths are drawn along the skin between anchors, like the adjacency.
      if (path.kind === 'patch' && this.anchors) {
        this.router ??= makeRouter(this.model)
        const r = this.router
        for (let k = 0; k + 1 < path.ids.length; k++) {
          const leg = r(this.anchors[path.ids[k]], this.anchors[path.ids[k + 1]]) ?? [
            this.anchors[path.ids[k]],
            this.anchors[path.ids[k + 1]],
          ]
          for (let i = 0; i + 1 < leg.length; i++)
            seq.push(...this.lifted(leg[i], 0.06), ...this.lifted(leg[i + 1], 0.06))
        }
      } else {
        for (let k = 0; k + 1 < path.ids.length; k++) {
          const a = at(k)
          const b = at(k + 1)
          if (a && b) seq.push(...a, ...b)
        }
      }
      const g = new LineSegmentsGeometry().setPositions(seq)
      const m = new LineMaterial({ color: HILITE.getHex(), linewidth: 4, depthTest: false })
      m.resolution.set(this.host.clientWidth, this.host.clientHeight)
      this.fat.push(m)
      const line = new LineSegments2(g, m)
      line.renderOrder = 6
      this.hl.add(line)
    }
    this.render()
  }

  mark(p: Pick) {
    if (!p) {
      this.marker.visible = false
      return this.render()
    }
    const xyz =
      p.kind === 'vertex'
        ? this.lifted(p.id, 0.05)
        : p.kind === 'patch'
          ? this.lifted(this.anchors?.[p.id] ?? 0, 0.05)
          : Array.from(this.model.frame?.pos.subarray(p.id * 3, p.id * 3 + 3) ?? [0, 0, 0])
    ;(this.marker.geometry.attributes.position as THREE.BufferAttribute).set(xyz)
    this.marker.geometry.attributes.position.needsUpdate = true
    this.marker.visible = true
    this.render()
  }

  // ----------------------------------------------------------------- camera ---
  private worldOf(x: number, y: number, z: number) {
    return this.root.localToWorld(new THREE.Vector3(x, y, z))
  }

  fit() {
    const { min, max } = this.manifest.bbox
    const c = this.worldOf((min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2)
    const size = Math.hypot(max[0] - min[0], max[1] - min[1], max[2] - min[2])
    const el = THREE.MathUtils.degToRad(24)
    const az = THREE.MathUtils.degToRad(-60)
    // ingest (x, y, z-up) -> world (x, z, -y)
    const dir = new THREE.Vector3(
      Math.cos(el) * Math.cos(az),
      Math.sin(el),
      -Math.cos(el) * Math.sin(az)
    )
    this.camera.position.copy(c.clone().add(dir.multiplyScalar(size * 1.5)))
    this.controls.target.copy(c)
    this.controls.update()
  }

  /** Frame a set of ingest-space points (a result) without losing orientation. */
  focus(points: number[]) {
    if (points.length < 3) return
    const box = new THREE.Box3()
    for (let i = 0; i < points.length; i += 3)
      box.expandByPoint(this.worldOf(points[i], points[i + 1], points[i + 2]))
    const c = box.getCenter(new THREE.Vector3())
    const r = Math.max(box.getSize(new THREE.Vector3()).length(), 6)
    const dir = this.camera.position.clone().sub(this.controls.target).normalize()
    this.controls.target.copy(c)
    this.camera.position.copy(c.clone().add(dir.multiplyScalar(r * 1.6)))
    this.controls.update()
  }

  highlightPoints(h: Highlight): number[] {
    const out: number[] = []
    for (const v of h.vertices) out.push(...this.lifted(v))
    if (this.model.frame)
      for (const j of h.joints) out.push(...this.model.frame.pos.subarray(j * 3, j * 3 + 3))
    if (this.anchors)
      for (const p of h.patches) if (this.anchors[p] >= 0) out.push(...this.lifted(this.anchors[p]))
    return out
  }

  // ---------------------------------------------------------------- picking ---
  private pick(e: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect()
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    )
    // World matrices are refreshed by render(), which is on demand: make sure
    // they are current before casting against them.
    this.scene.updateMatrixWorld()
    const ray = new THREE.Raycaster()
    ray.setFromCamera(ndc, this.camera)
    let best: Pick = null
    let bestDepth = Number.POSITIVE_INFINITY
    if (this.skin?.visible) {
      const hit = ray.intersectObject(this.skin, false)[0]
      if (hit?.face) {
        const local = this.root.worldToLocal(hit.point.clone())
        const p = this.model.pos
        const cand = [hit.face.a, hit.face.b, hit.face.c]
        const v = cand.reduce((a, b) =>
          Math.hypot(p[a * 3] - local.x, p[a * 3 + 1] - local.y, p[a * 3 + 2] - local.z) <=
          Math.hypot(p[b * 3] - local.x, p[b * 3 + 1] - local.y, p[b * 3 + 2] - local.z)
            ? a
            : b
        )
        best = { kind: 'vertex', id: v }
        bestDepth = hit.distance
      }
    }
    // Joints are points: pick in SCREEN space (a world-unit ray threshold cannot
    // work for markers whose on-screen size does not follow distance).
    const f = this.model.frame
    if (f && this.frameGroup.visible && this.frameGroup.parent) {
      const v = new THREE.Vector3()
      let bd = 10
      for (let j = 0; j < f.node.length; j++) {
        if (f.node[j] < 0) continue
        v.copy(this.worldOf(f.pos[j * 3], f.pos[j * 3 + 1], f.pos[j * 3 + 2]))
        const depth = v.distanceTo(this.camera.position)
        v.project(this.camera)
        const d = Math.hypot(((v.x - ndc.x) * rect.width) / 2, ((v.y - ndc.y) * rect.height) / 2)
        // only a joint IN FRONT of the skin hit: the frame sits between the two
        // shells, so a joint behind the surface is not what was clicked
        if (d < bd && depth < bestDepth) {
          bd = d
          best = { kind: 'joint', id: j }
        }
      }
    }
    this.mark(best)
    this.onPick(best)
  }

  // ----------------------------------------------------------------- plumbing ---
  private resize() {
    const w = this.host.clientWidth
    const h = this.host.clientHeight
    if (!w || !h) return
    this.renderer.setSize(w, h) // not (w, h, false): that leaves the CSS size at buffer size
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    for (const m of this.fat) m.resolution.set(w, h)
    this.render()
  }

  render() {
    if (this.raf) return
    this.raf = requestAnimationFrame(() => {
      this.raf = 0
      this.renderer.render(this.scene, this.camera)
    })
  }

  dispose() {
    cancelAnimationFrame(this.raf)
    this.ro.disconnect()
    this.controls.dispose()
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh
      m.geometry?.dispose?.()
      const mat = m.material as THREE.Material | THREE.Material[] | undefined
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
      else mat?.dispose?.()
    })
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
