import * as THREE from 'three'
import { InstancedUniformsMesh } from 'three-instanced-uniforms-mesh'
import { BASE_EDGE_COLOR } from './colors'

export const NODES_PER_BUFFER = 20000
export const EDGES_PER_BUFFER = 20000

export const getEdgeBufferIndex = (edgeIndex: number) => {
  return Math.floor(edgeIndex / EDGES_PER_BUFFER)
}

export const getEdgeIndexInBuffer = (edgeIndex: number) => {
  return edgeIndex % EDGES_PER_BUFFER
}

export const getNodeBufferIndex = (nodeIndex: number) => {
  return Math.floor(nodeIndex / NODES_PER_BUFFER)
}

export const getNodeIndexInBuffer = (nodeIndex: number) => {
  return nodeIndex % NODES_PER_BUFFER
}

export const getNodeDrawRange = (bufIndex: number, totalNodeCount: number) =>
  bufIndex < Math.floor(totalNodeCount / NODES_PER_BUFFER)
    ? NODES_PER_BUFFER
    : totalNodeCount % NODES_PER_BUFFER

export const getEdgeDrawRange = (bufIndex: number, totalEdgeCount: number) =>
  bufIndex < Math.floor(totalEdgeCount / EDGES_PER_BUFFER)
    ? EDGES_PER_BUFFER
    : totalEdgeCount % EDGES_PER_BUFFER

export function createNodeMesh(mat: THREE.ShaderMaterial) {
  const nodeGeometry = new THREE.PlaneGeometry(1, 1)
  const count = NODES_PER_BUFFER
  const mesh = new InstancedUniformsMesh(nodeGeometry, mat, count)
  const col = new THREE.Color(1, 1, 1)

  for (let i = 0; i < NODES_PER_BUFFER; i++) {
    mesh.setColorAt(i, col)
  }

  mesh.instanceColor!.needsUpdate = true
  mesh.renderOrder = 2
  mesh.frustumCulled = false

  return mesh
}

export function createEdgeMesh(mat: THREE.ShaderMaterial) {
  const edgeGeometry = new THREE.PlaneGeometry(1, 1)
  const count = EDGES_PER_BUFFER
  const mesh = new InstancedUniformsMesh(edgeGeometry, mat, count)
  const col = new THREE.Color(BASE_EDGE_COLOR)

  for (let i = 0; i < EDGES_PER_BUFFER; i++) {
    mesh.setColorAt(i, col)
  }

  mesh.instanceColor!.needsUpdate = true
  mesh.renderOrder = 1

  return mesh
}

export function createBoxSelectionMesh(mat: THREE.MeshBasicMaterial) {
  const boxGeometry = new THREE.PlaneGeometry(1, 1)
  // TODO Make dynamic position and scale
  const mesh = new THREE.Mesh(boxGeometry, mat)
  mesh.renderOrder = 3
  mesh.visible = false

  return mesh
}

export type NodeMesh = ReturnType<typeof createNodeMesh>
export type EdgeMesh = ReturnType<typeof createEdgeMesh>
export type BoxSelectionMesh = ReturnType<typeof createBoxSelectionMesh>
