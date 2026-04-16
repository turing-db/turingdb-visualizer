import * as THREE from 'three'
import { Text } from 'troika-three-text'
import { BASE_EDGE_COLOR, BASE_NODE_COLOR, SELECTED_NODE_COLOR } from './colors'

import type { EdgeMap, NodeMap, NodeShape, TuringNode } from './types'

export class TextRenderer {
  scene: THREE.Scene
  camera: THREE.OrthographicCamera

  primaryNodeColor = new THREE.Color(BASE_NODE_COLOR)
  primaryEdgeColor = new THREE.Color(BASE_EDGE_COLOR)
  selectedColor = new THREE.Color(SELECTED_NODE_COLOR)

  weight: 'normal' | 'bold' = 'normal'
  fontSize = 0.3
  nodeLabels = new Map<number, Text>()
  edgeLabels = new Map<number, Text>()
  nodeOffset = new THREE.Vector3(0.4, -0.1, 0.0)
  nodeShape: NodeShape = 'octagon'

  constructor(scene: THREE.Scene, camera: THREE.OrthographicCamera) {
    this.scene = scene
    this.camera = camera
  }

  private applyLabelAnchor(t: Text) {
    if (this.nodeShape === 'rounded-rect') {
      t.anchorX = 'center'
      t.anchorY = 'middle'
      t.textAlign = 'center'
      t.fontWeight = 'bold'
    } else {
      t.anchorX = 'left'
      t.anchorY = 'baseline'
      t.textAlign = 'left'
      t.fontWeight = this.weight
    }
  }

  setNodeShape(shape: NodeShape, nodes: NodeMap) {
    this.nodeShape = shape
    this.nodeLabels.forEach((t, id) => {
      this.applyLabelAnchor(t)
      const node = nodes.get(id)
      if (node) this.applyEstimatedSize(t.text ?? '', node)
      t.sync(() => {
        if (node) this.measureLabel(t, node)
      })
    })
  }

  // Padding breakdown (world units):
  //   text pad inside rect: ~0.22 horiz, 0.15 vert per side
  //   rectBodyMargin gutter outside rect: 0.2 per side (for selection ring)
  // Total added to the text block: +0.84 width, +0.7 height.
  static readonly PAD_W = 0.95
  static readonly PAD_H = 0.7
  static readonly MIN_W = 1.0
  static readonly MIN_H = 0.75

  // Conservative synchronous estimate of a bold text block width before
  // troika's async layout completes. Slightly over-estimates so the rect never
  // clips the glyphs; measureLabel() shrinks it to the true size afterwards.
  estimateSize(text: string): { width: number; height: number } {
    // Over-estimate glyph width so wide chars (M, W) never get clipped
    // during the brief window before troika's async layout finishes.
    const avgCharW = this.fontSize * 0.72
    return {
      width: text.length * avgCharW,
      height: this.fontSize * 1.2,
    }
  }

  applyEstimatedSize(text: string, node: TuringNode) {
    const { width, height } = this.estimateSize(text)
    node.labelWidth = Math.max(width + TextRenderer.PAD_W, TextRenderer.MIN_W)
    node.labelHeight = Math.max(height + TextRenderer.PAD_H, TextRenderer.MIN_H)
  }

  measureLabel(t: Text, node: TuringNode) {
    const info = t.textRenderInfo
    if (!info) return
    const [minX, minY, maxX, maxY] = info.blockBounds
    const width = maxX - minX
    const height = maxY - minY
    node.labelWidth = Math.max(width + TextRenderer.PAD_W, TextRenderer.MIN_W)
    node.labelHeight = Math.max(height + TextRenderer.PAD_H, TextRenderer.MIN_H)
  }

  addNodeLabel(id: number) {
    const t = new Text()
    const c = new THREE.Color(this.primaryNodeColor)

    t.fontSize = this.fontSize
    t.fontWeight = this.weight
    t.color = c.getHex()
    t.renderOrder = 3
    this.applyLabelAnchor(t)
    this.nodeLabels.set(id, t)
    this.scene.add(t)
  }

  addEdgeLabel(id: number) {
    const t = new Text()
    const c = new THREE.Color(this.primaryEdgeColor)

    t.text = ''
    t.fontSize = this.fontSize
    t.fontWeight = this.weight
    t.color = c.getHex()
    t.anchorX = 'center'
    t.anchorY = 0.05
    t.textAlign = 'center'
    this.edgeLabels.set(id, t)
    this.scene.add(t)
  }

  delNodeLabel(id: number) {
    const label = this.nodeLabels.get(id)
    if (label === undefined) return

    this.scene.remove(label)
    this.nodeLabels.delete(id)
  }

  delEdgeLabel(id: number) {
    const label = this.edgeLabels.get(id)
    if (label === undefined) return

    this.scene.remove(label)
    this.edgeLabels.delete(id)
  }

  setEdgeAngle(id: number, angle: number) {
    const label = this.edgeLabels.get(id)
    if (label === undefined) return

    label.setRotationFromEuler(
      new THREE.Euler(0, 0, Math.abs(angle) > 3.14 / 2 ? angle - 3.14 : angle)
    )
  }

  setEdgeLabelColor(id: number, color: THREE.Color) {
    const label = this.edgeLabels.get(id)
    if (label === undefined) return

    label.color = color.getHex()
  }

  reset() {
    for (const l of this.nodeLabels.values()) {
      this.scene.remove(l)
    }

    this.nodeLabels.clear()

    for (const l of this.edgeLabels.values()) {
      this.scene.remove(l)
    }

    this.edgeLabels.clear()
  }

  update(nodes: NodeMap, edges: EdgeMap) {
    const visible = this.camera.zoom > 0.07
    const centerInShape = this.nodeShape === 'rounded-rect'

    this.nodeLabels.forEach((l, id) => {
      const n = nodes.get(id)
      if (!n) return

      if (centerInShape) {
        l.position.x = n.x
        l.position.y = n.y
      } else {
        l.position.x = n.x + this.nodeOffset.x
        l.position.y = n.y + this.nodeOffset.y
      }

      const c = new THREE.Color(n.color)

      if (!n.isPrimary()) {
        c.r *= 0.6
        c.g *= 0.6
        c.b *= 0.6
      }

      if (n.isSelected()) {
        c.lerp(this.selectedColor, 0.5)
      }

      if (centerInShape) {
        // Label sits inside a translucent body: use the node color (matching the border),
        // brightened so it reads on dark backgrounds.
        const tc = c.clone()
        tc.r = Math.min(1, tc.r * 1.3 + 0.2)
        tc.g = Math.min(1, tc.g * 1.3 + 0.2)
        tc.b = Math.min(1, tc.b * 1.3 + 0.2)
        l.color = tc.getHex()
      } else {
        l.color = c.getHex()
      }
      l.fillOpacity = n.opacity
      l.visible = visible
    })

    this.edgeLabels.forEach((l, id) => {
      const e = edges.get(id)
      if (!e) return

      l.position.x = (e.source.x + e.target.x) / 2.0
      l.position.y = (e.source.y + e.target.y) / 2.0

      l.visible = visible
    })
  }
}
