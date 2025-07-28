import type { BoxSelectionMesh } from './meshes'
import * as THREE from 'three'
import type { TuringNode } from './types'

const NEAR_PLANE = new THREE.Plane(new THREE.Vector3(0, 0, -1), -0.1)
const FAR_PLANE = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1000.0)

export class BoxSelectionTool {
  start = new THREE.Vector3()
  end = new THREE.Vector3()
  bounding = new THREE.Box3()

  mesh: BoxSelectionMesh
  raycaster: THREE.Raycaster
  camera: THREE.Camera

  constructor(mesh: BoxSelectionMesh, raycaster: THREE.Raycaster, camera: THREE.Camera) {
    this.mesh = mesh
    this.raycaster = raycaster
    this.camera = camera
  }

  selecting() {
    return this.mesh.visible
  }

  reset() {
    this.mesh.visible = false
    this.start.x = 0
    this.start.y = 0
    this.end.x = 0
    this.end.y = 0
  }

  beginSelection(mouse: THREE.Vector2) {
    this.mesh.visible = true
    this.start = this.#getWorldIntersection(NEAR_PLANE, mouse)
    this.start.z = -10
  }

  updateSelection(mouse: THREE.Vector2) {
    if (!this.mesh.visible) return

    this.end = this.#getWorldIntersection(FAR_PLANE, mouse)
    this.end.z = 10

    const pos = this.end.add(this.start).divideScalar(2.0)
    this.mesh.position.set(pos.x, pos.y, pos.z)
    this.mesh.scale.set(
      Math.abs(this.end.x - this.start.x) * 2,
      Math.abs(this.end.y - this.start.y) * 2,
      10
    )
    this.mesh.matrixWorldNeedsUpdate = true
  }

  hide() {
    this.mesh.visible = false
  }

  select(nodes: TuringNode[]) {
    this.mesh.visible = false
    const point = new THREE.Vector3()
    point.z = 0

    this.bounding.setFromObject(this.mesh)

    return nodes
      .filter((node) => {
        point.x = node.x
        point.y = node.y
        return this.bounding.containsPoint(point)
      })
      .map((n) => n.id)
  }

  #getWorldIntersection(plane: THREE.Plane, mouse: THREE.Vector2) {
    const intersection = new THREE.Vector3()
    this.raycaster.setFromCamera(mouse, this.camera)
    this.raycaster.ray.intersectPlane(plane, intersection)
    return intersection
  }
}
