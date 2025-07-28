import * as THREE from 'three'
import { Text } from 'troika-three-text'
import { BASE_EDGE_COLOR, BASE_NODE_COLOR, SELECTED_NODE_COLOR } from './colors'

import type { EdgeMap, NodeMap } from './types'

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

  constructor(scene: THREE.Scene, camera: THREE.OrthographicCamera) {
    this.scene = scene
    this.camera = camera
  }

  addNodeLabel(id: number) {
    const t = new Text()
    const c = new THREE.Color(this.primaryNodeColor)

    t.fontSize = this.fontSize
    t.fontWeight = this.weight
    t.color = c.getHex()
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
    this.nodeLabels.forEach((l, id) => {
      const n = nodes.get(id)
      if (!n) return

      l.position.x = n.x + this.nodeOffset.x
      l.position.y = n.y + this.nodeOffset.y

      const c = new THREE.Color(n.color)

      if (!n.isPrimary()) {
        c.r *= 0.6
        c.g *= 0.6
        c.b *= 0.6
      }

      if (n.isSelected()) {
        c.lerp(this.selectedColor, 0.5)
      }

      l.color = c.getHex()
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
