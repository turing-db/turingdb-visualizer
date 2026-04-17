import * as THREE from 'three'
import { BASE_EDGE_COLOR, SELECTED_EDGE_COLOR, SELECTED_NODE_COLOR } from './colors'
import type { TuringInstance } from './instance'

import {
  type BoxSelectionMesh,
  type EdgeMesh,
  type NodeMesh,
  createBoxSelectionMesh,
  createEdgeMesh,
  createNodeMesh,
  getEdgeBufferIndex,
  getEdgeDrawRange,
  getEdgeIndexInBuffer,
  getNodeBufferIndex,
  getNodeDrawRange,
  getNodeIndexInBuffer,
} from './meshes'

import { getBoxSelectionMaterial, getEdgeMaterial, getNodeMaterial } from './shaders'
import { TextRenderer } from './textrenderer'
import type { NodeShape, TuringEdge, TuringNode } from './types'

/** Turing renderer class, contains the GraphicsRenderer and the scene */
export class TuringRenderer {
  instance: TuringInstance
  renderer: THREE.WebGLRenderer | null = null
  scene: THREE.Scene
  camera: THREE.OrthographicCamera

  textRenderer: TextRenderer

  boxSelectionMesh: BoxSelectionMesh
  nodeMeshes: NodeMesh[] = []
  edgeMeshes: EdgeMesh[] = []
  boxSelectionMaterial: THREE.MeshBasicMaterial
  nodeMaterial: THREE.ShaderMaterial
  edgeMaterial: THREE.ShaderMaterial

  selectedNodeColor = new THREE.Color(SELECTED_NODE_COLOR)
  selectedEdgeColor = new THREE.Color(SELECTED_EDGE_COLOR)
  edgeColor = new THREE.Color(BASE_EDGE_COLOR)

  width = 0
  height = 0
  aspect = 1
  boundX = 10
  boundY = 10

  constructor(instance: TuringInstance) {
    this.instance = instance
    this.scene = new THREE.Scene()
    this.camera = new THREE.OrthographicCamera()

    this.scene.add(this.camera)

    this.camera.position.set(0, 0, -50)
    this.camera.up = new THREE.Vector3(0, -1, 0)
    this.camera.lookAt(0, 0, 0)
    this.camera.updateProjectionMatrix()

    this.nodeMaterial = getNodeMaterial()
    this.edgeMaterial = getEdgeMaterial()
    this.boxSelectionMaterial = getBoxSelectionMaterial()

    this.boxSelectionMesh = createBoxSelectionMesh(this.boxSelectionMaterial)
    this.scene.add(this.boxSelectionMesh)

    this.textRenderer = new TextRenderer(this.scene, this.camera)
  }

  init(animate: () => void) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      canvas: this.instance.canvas,
    })

    this.onResize()
    this.renderer.setAnimationLoop(animate)
  }

  reset() {
    this.textRenderer.reset()

    for (const mesh of this.nodeMeshes) {
      this.scene.remove(mesh)
    }

    for (const mesh of this.edgeMeshes) {
      this.scene.remove(mesh)
    }

    this.nodeMeshes = []
    this.edgeMeshes = []
  }

  onResize() {
    if (!this.renderer) return

    const canvas = this.instance.canvas

    this.width = canvas.offsetWidth
    this.height = canvas.offsetHeight
    this.aspect = this.width / this.height
    this.boundX = 10
    this.boundY = this.boundX / this.aspect

    this.renderer.setSize(this.width, this.height, false)
    this.renderer.setPixelRatio(window.devicePixelRatio)

    this.camera.left = -this.boundX / 2
    this.camera.right = this.boundX / 2
    this.camera.top = -this.boundY / 2
    this.camera.bottom = this.boundY / 2
    this.camera.updateProjectionMatrix()
  }

  update() {
    if (!this.renderer) return

    this.nodeMeshes.forEach((mesh, i) => {
      mesh.count = getNodeDrawRange(i, this.instance.nodes.length)
    })

    this.edgeMeshes.forEach((mesh, i) => {
      mesh.count = getEdgeDrawRange(i, this.instance.edges.length)
    })

    this.textRenderer.update(this.instance.nodeMap, this.instance.edgeMap)
    this.renderer.render(this.scene, this.camera)
  }

  disconnect() {
    if (!this.renderer) return

    this.renderer.dispose()
    this.renderer.forceContextLoss()
    this.renderer = null
  }

  createScene() {}

  setNodeShape(shape: NodeShape) {
    const uShape = this.nodeMaterial.uniforms.uShape
    if (uShape) uShape.value = shape === 'rounded-rect' ? 1.0 : 0.0
  }

  updateNodeUniforms(n: TuringNode) {
    const bufi = getNodeBufferIndex(n.index)
    const i = getNodeIndexInBuffer(n.index)

    const col = new THREE.Color(n.color)

    if (!n.isPrimary()) {
      col.r *= 0.6
      col.g *= 0.6
      col.b *= 0.6
    }

    if (n.isSelected()) {
      col.lerp(this.selectedNodeColor, 0.5)
    }

    const mesh = this.nodeMeshes[bufi]
    if (!mesh) return

    mesh.setColorAt(i, col)
    mesh.setUniformAt('uHasOutline', i, Number(n.isSelected()))
    mesh.setUniformAt('uOpacity', i, n.opacity)

    if (!mesh.instanceColor) return
    mesh.instanceColor.needsUpdate = true
  }

  addNode(nodeID: number, nodeIndex: number) {
    const bufIndex = getNodeBufferIndex(nodeIndex)

    if (bufIndex >= this.nodeMeshes.length) {
      const mesh = createNodeMesh(this.nodeMaterial)

      this.nodeMeshes.push(mesh)
      this.scene.add(mesh)
    }

    this.textRenderer.addNodeLabel(nodeID)
  }

  delNode(nodeID: number) {
    this.textRenderer.delNodeLabel(nodeID)
  }

  addEdge(edgeID: number, edgeIndex: number) {
    const bufIndex = getEdgeBufferIndex(edgeIndex)

    if (bufIndex >= this.edgeMeshes.length) {
      const mesh = createEdgeMesh(this.edgeMaterial)
      this.edgeMeshes.push(mesh)
      this.scene.add(mesh)
    }

    this.textRenderer.addEdgeLabel(edgeID)
  }

  delEdge(edgeID: number) {
    this.textRenderer.delEdgeLabel(edgeID)
  }

  setMvps(nodes: TuringNode[], edges: TuringEdge[], edgeScale: number) {
    const baseScale = new THREE.Vector3(1.0, 1.0, 1.0)
    const primaryMat = new THREE.Matrix4()
    const secondaryMat = new THREE.Matrix4()
    primaryMat.scale(baseScale)
    secondaryMat.scale(new THREE.Vector3(0.8, 0.8, 0.8))

    const isRect = this.instance.nodeShape === 'rounded-rect'
    const rectMat = new THREE.Matrix4()

    // Nodes
    nodes.forEach((n, i) => {
      const bufIndex = getNodeBufferIndex(i)
      const nodeIndex = getNodeIndexInBuffer(i)

      if (isRect) {
        // Always scale to the measured label dimensions — troika text is not
        // scaled by the instance matrix, so shrinking the rect would clip
        // the text. Secondary-state styling is conveyed by color dimming
        // (see updateNodeUniforms) rather than by size.
        rectMat.makeScale(n.labelWidth, n.labelHeight, 1)
        rectMat.setPosition(n.x, n.y, 0)
        this.nodeMeshes[bufIndex].setMatrixAt(nodeIndex, rectMat)
      } else {
        const mat = n.isPrimary() ? primaryMat : secondaryMat
        mat.setPosition(n.x, n.y, 0)
        this.nodeMeshes[bufIndex].setMatrixAt(nodeIndex, mat)
      }
    })

    // Distance from a node's center to the point along `dir` where the edge
    // should start/end, so the arrow sits just outside the node shape.
    const nodeExitDistance = (n: TuringNode, dir: THREE.Vector2): number => {
      if (isRect) {
        const hw = n.labelWidth / 2
        const hh = n.labelHeight / 2
        const adx = Math.max(Math.abs(dir.x), 1e-4)
        const ady = Math.max(Math.abs(dir.y), 1e-4)
        return Math.min(hw / adx, hh / ady)
      }
      // Octagon: apothem of the drawn shape. Primary plane scale 1.0,
      // secondary 0.8, octagon size 0.56 in uv-doubled space → ~0.56 * 0.5
      // world units at scale 1.
      return n.isPrimary() ? 0.28 : 0.22
    }

    // Edges
    const tmpVec = new THREE.Vector2()
    edges.forEach((e, i) => {
      const bufIndex = getEdgeBufferIndex(i)
      const edgeIndex = getEdgeIndexInBuffer(i)

      const mat = primaryMat
      const a = e.source as TuringNode
      const b = e.target as TuringNode
      const vec = new THREE.Vector2(a.x - b.x, a.y - b.y)

      this.edgeMeshes[bufIndex].setUniformAt('uOpacity', edgeIndex, 0.75)
      const color =
        a.isSelected() && b.isSelected()
          ? new THREE.Color(this.selectedEdgeColor)
          : new THREE.Color(this.edgeColor)

      if (!a.isPrimary() || !b.isPrimary()) {
        color.lerp(new THREE.Color(0.2, 0.2, 0.25), 0.6)
        baseScale.y = 0.09
      } else {
        baseScale.y = 0.11
      }

      this.edgeMeshes[bufIndex].setColorAt(edgeIndex, color)
      this.textRenderer.setEdgeLabelColor(edgeIndex, color)

      const mesh = this.edgeMeshes[bufIndex]
      if (!mesh || !mesh.instanceColor) return
      mesh.instanceColor.needsUpdate = true

      const fullLen = vec.length()
      if (fullLen < 1e-4) return

      const direction = vec.clone().normalize()
      const angle = Math.atan2(direction.y, direction.x)
      this.textRenderer.setEdgeAngle(e.id, angle)

      // `direction` points from target → source. Shorten both ends so the
      // arrow head lands just past the target's boundary.
      const exitFromSource = nodeExitDistance(a, tmpVec.set(-direction.x, -direction.y))
      const exitFromTarget = nodeExitDistance(b, direction)
      const effectiveLen = Math.max(fullLen - exitFromSource - exitFromTarget, 0.05)

      // Midpoint of the shortened segment.
      const startX = a.x - direction.x * exitFromSource
      const startY = a.y - direction.y * exitFromSource
      const endX = b.x + direction.x * exitFromTarget
      const endY = b.y + direction.y * exitFromTarget

      baseScale.y *= edgeScale
      baseScale.x = effectiveLen

      mat.makeRotationZ(angle)
      mat.scale(baseScale)
      mat.setPosition((startX + endX) / 2.0, (startY + endY) / 2.0, 0.0)
      this.edgeMeshes[bufIndex].setMatrixAt(edgeIndex, mat)
    })

    // Update matrices
    for (const mesh of this.nodeMeshes) {
      mesh.instanceMatrix.needsUpdate = true
      mesh.computeBoundingSphere()
    }

    for (const mesh of this.edgeMeshes) {
      mesh.instanceMatrix.needsUpdate = true
      mesh.computeBoundingSphere()
    }
  }
}
