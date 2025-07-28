import * as THREE from 'three'
import type { TuringInstance } from './instance'
import {
  CanvasContextMenuEvent,
  CanvasDoubleClickEvent,
  CanvasMouseDownEvent,
  CanvasMouseUpEvent,
  CanvasNodeDragEvent,
  CanvasNodeSelectEvent,
  CanvasSingleClickEvent,
  type PartialTuringUserEvents,
  TuringCustomEventNames,
  type TuringEdge,
  type TuringNode,
} from './types'

import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { BoxSelectionTool } from './box-selection-tool'
import type { Events } from './canvas'

export class TuringEvents {
  instance: TuringInstance
  mousePosition = new THREE.Vector2()
  worldMousePosition = new THREE.Vector2()
  hoveredNode: TuringNode | null = null
  hoveredEdge: TuringEdge | null = null

  mouseDragOrigin = new THREE.Vector2()
  nodeDragOrigins: THREE.Vector2[] = []
  dragVector = new THREE.Vector3()
  draggedNodes: TuringNode[] = []

  mouseMoved = 0
  dragging = false
  dragOccured = false
  downT0 = 0
  upT0 = 0
  clickCallback?: NodeJS.Timeout
  doubleClick = false
  userEvents: PartialTuringUserEvents = {}
  controls: OrbitControls
  raycaster: THREE.Raycaster
  boxSelection: BoxSelectionTool

  // Core events
  boundOnCoreMouseDown!: (e: MouseEvent) => void
  boundOnCoreMouseUp!: (e: MouseEvent) => void
  boundOnCoreMouseMove!: (e: MouseEvent) => void
  boundOnCoreResize!: () => void
  boundOnCoreWindowFocusOut!: () => void
  boundOnCoreClick!: (e: MouseEvent) => void
  boundOnCoreContextMenu!: (e: MouseEvent) => void

  // Canvas events
  boundOnCanvasMouseDown!: (e: CanvasMouseDownEvent) => void
  boundOnCanvasNodeDrag!: (e: CanvasNodeDragEvent) => void
  boundOnCanvasNodeSelect!: (e: CanvasNodeSelectEvent) => void
  boundOnCanvasMouseUp!: (e: CanvasMouseUpEvent) => void
  boundOnCanvasSingleClick!: (e: CanvasSingleClickEvent) => void
  boundOnCanvasDoubleClick!: (e: CanvasDoubleClickEvent) => void
  boundOnCanvasContextMenu!: (e: CanvasContextMenuEvent) => void

  constructor(instance: TuringInstance) {
    this.instance = instance

    const camera = this.instance.renderer.camera
    this.controls = new OrbitControls(camera, this.instance.canvas as unknown as HTMLElement)
    this.raycaster = new THREE.Raycaster()

    this.boxSelection = new BoxSelectionTool(
      this.instance.renderer.boxSelectionMesh,
      this.raycaster,
      camera
    )
  }

  init(events: Events) {
    const canvas = this.instance.canvas

    // Bind core events
    this.boundOnCoreMouseDown = this.onCoreMouseDown.bind(this)
    this.boundOnCoreMouseUp = this.onCoreMouseUp.bind(this)
    this.boundOnCoreMouseMove = this.onCoreMouseMove.bind(this)
    this.boundOnCoreResize = this.onCoreResize.bind(this)
    this.boundOnCoreWindowFocusOut = this.onCoreWindowFocusOut.bind(this)
    this.boundOnCoreClick = this.onCoreClick.bind(this)
    this.boundOnCoreContextMenu = this.onCoreContextMenu.bind(this)

    // Bind canvas events
    this.boundOnCanvasNodeDrag = this.onCanvasNodeDrag.bind(this)
    this.boundOnCanvasNodeSelect = this.onCanvasNodeSelect.bind(this)
    this.boundOnCanvasMouseDown = this.onCanvasMouseDown.bind(this)
    this.boundOnCanvasMouseUp = this.onCanvasMouseUp.bind(this)
    this.boundOnCanvasSingleClick = this.onCanvasSingleClick.bind(this)
    this.boundOnCanvasDoubleClick = this.onCanvasDoubleClick.bind(this)
    this.boundOnCanvasContextMenu = this.onCanvasContextMenu.bind(this)

    // Add core events
    canvas.addEventListener('mousedown', this.boundOnCoreMouseDown)
    canvas.addEventListener('mouseup', this.boundOnCoreMouseUp)
    canvas.addEventListener('mousemove', this.boundOnCoreMouseMove)
    window.addEventListener('resize', this.boundOnCoreResize)
    window.addEventListener('focusout', this.boundOnCoreWindowFocusOut)
    canvas.addEventListener('click', this.boundOnCoreClick)
    canvas.addEventListener('contextmenu', this.boundOnCoreContextMenu)

    // Add canvas events
    canvas.addEventListener('canvasnodedrag', this.boundOnCanvasNodeDrag)
    canvas.addEventListener('canvasnodeselect', this.boundOnCanvasNodeSelect)
    canvas.addEventListener('canvasmousedown', this.boundOnCanvasMouseDown)
    canvas.addEventListener('canvasmouseup', this.boundOnCanvasMouseUp)
    canvas.addEventListener('canvassingleclick', this.boundOnCanvasSingleClick)
    canvas.addEventListener('canvasdoubleclick', this.boundOnCanvasDoubleClick)
    canvas.addEventListener('canvascontextmenu', this.boundOnCanvasContextMenu)

    this.controls.domElement = canvas as unknown as HTMLElement
    this.controls.connect()

    const setEvent = <K extends keyof PartialTuringUserEvents>(evName: K) => {
      if (this.userEvents[evName]) {
        canvas.removeEventListener(evName, this.userEvents[evName])
      }

      if (events[evName]) {
        this.userEvents[evName] = events[evName]
        canvas.addEventListener(evName, this.userEvents[evName])
      }
    }

    for (const name of TuringCustomEventNames) {
      setEvent(name)
    }
  }

  terminate() {
    this.controls.disconnect()

    const canvas = this.instance.canvas

    // Remove core events
    canvas.removeEventListener('mousedown', this.boundOnCoreMouseDown)
    canvas.removeEventListener('mouseup', this.boundOnCoreMouseUp)
    canvas.removeEventListener('mousemove', this.boundOnCoreMouseMove)
    canvas.removeEventListener('click', this.boundOnCoreClick)
    window.removeEventListener('resize', this.boundOnCoreResize)
    window.removeEventListener('focusout', this.boundOnCoreWindowFocusOut)

    // Remove canvas events
    canvas.removeEventListener('canvasnodedrag', this.boundOnCanvasNodeDrag)
    canvas.removeEventListener('canvasnodeselect', this.boundOnCanvasNodeSelect)
    canvas.removeEventListener('canvasmousedown', this.boundOnCanvasMouseDown)
    canvas.removeEventListener('canvasmouseup', this.boundOnCanvasMouseUp)
    canvas.removeEventListener('canvassingleclick', this.boundOnCanvasSingleClick)
    canvas.removeEventListener('canvasdoubleclick', this.boundOnCanvasDoubleClick)
    canvas.removeEventListener('canvascontextmenu', this.boundOnCanvasContextMenu)
  }

  createControls() {
    const cam = this.instance.renderer?.camera
    this.controls.target.set(cam.position.x, cam.position.y, 0)

    this.controls.enableRotate = false
    this.controls.enableDamping = false
    this.controls.enableZoom = true
    this.controls.enablePan = true
    this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN
    this.controls.mouseButtons.RIGHT = null
  }

  update() {
    this.controls.update()

    this.raycaster.setFromCamera(this.mousePosition, this.instance.renderer.camera)

    for (const mesh of this.instance.renderer.nodeMeshes) {
      const intersection = this.raycaster.intersectObject(mesh)

      if (intersection.length > 0) {
        const instanceID = intersection[0].instanceId
        if (instanceID !== undefined) {
          this.instance.hoverNode(this.instance.nodes[instanceID])
        }
      } else {
        this.instance.unhoverNode()
      }
    }

    this.boxSelection.updateSelection(this.mousePosition)
  }

  onCoreMouseDown(event: MouseEvent) {
    event.preventDefault()

    this.instance.canvas.dispatchEvent(
      new CanvasMouseDownEvent({
        event,
        n: this.hoveredNode || undefined,
        e: undefined,
      })
    )

    if (event.button === 2) {
      this.instance.canvas.dispatchEvent(
        new CanvasContextMenuEvent({
          event,
          n: this.hoveredNode || undefined,
          e: undefined,
        })
      )
      this.instance.unhoverNode()
    }
  }

  onCoreMouseUp(event: MouseEvent) {
    event.preventDefault()
    this.instance.canvas.dispatchEvent(
      new CanvasMouseUpEvent({
        event,
        n: this.hoveredNode || undefined,
        e: undefined,
      })
    )

    const actualmousePositionx = (event.offsetX / this.instance.renderer.width) * 2 - 1
    const actualmousePositiony = -(event.offsetY / this.instance.renderer.height) * 2 + 1
    if (
      this.mousePosition.x !== actualmousePositionx &&
      this.mousePosition.y !== actualmousePositiony
    ) {
      this.instance.unhoverNode()
    }
  }

  onCoreMouseMove(event: MouseEvent) {
    event.preventDefault()
    this.mousePosition.x = (event.offsetX / this.instance.renderer.width) * 2 - 1
    this.mousePosition.y = -(event.offsetY / this.instance.renderer.height) * 2 + 1
    this.mouseMoved++

    if (this.draggedNodes.length === 0) {
      this.dragging = false
      this.controls.enablePan = true
      this.controls.update()
      return
    }

    this.controls.enablePan = false
    this.controls.update()

    const dx = this.mousePosition.x - this.mouseDragOrigin.x
    const dy = this.mousePosition.y - this.mouseDragOrigin.y
    this.dragVector.x = dx
    this.dragVector.y = dy
    this.dragVector.z = 0

    const len = this.dragVector.lengthSq()
    if (len > 0.0001) {
      this.dragging = true
    }

    if (this.dragging) {
      this.instance.canvas.dispatchEvent(
        new CanvasNodeDragEvent({
          event,
          nodes: this.draggedNodes,
        })
      )
    }
  }

  onCoreResize() {
    this.instance.renderer.onResize()
  }

  onCoreClick(event: MouseEvent) {
    event.preventDefault()
    clearTimeout(this.clickCallback)
    const n = this.hoveredNode

    if (event.button === 0) {
      if (event.detail === 1) {
        this.clickCallback = setTimeout(() => {
          if (this.dragOccured) return

          this.instance.canvas.dispatchEvent(
            new CanvasSingleClickEvent({
              event,
              n: n || undefined,
              e: undefined,
            })
          )
        }, 130)
      } else {
        this.instance.canvas.dispatchEvent(
          new CanvasDoubleClickEvent({
            event,
            n: n || undefined,
            e: undefined,
          })
        )
      }
    }
  }

  onCoreContextMenu(event: MouseEvent) {
    event.preventDefault()
  }

  onCoreWindowFocusOut() {
    this.boxSelection.reset()
  }

  onCanvasNodeDrag(e: CanvasNodeDragEvent) {
    const cam = this.instance.renderer?.camera
    this.dragVector.unproject(cam)
    this.dragVector.x -= cam.position.x
    this.dragVector.y -= cam.position.y
    const simulatedNodes = this.instance.simulation.getNodes()

    e.detail.nodes.forEach((n, i) => {
      const origin = this.nodeDragOrigins[i]
      n.x = origin.x + this.dragVector.x
      n.y = origin.y + this.dragVector.y

      const simulatedNode = simulatedNodes.at(n.index)
      if (!simulatedNode) return

      simulatedNode.x = n.x
      simulatedNode.y = n.y
    })
  }

  onCanvasNodeSelect(/*e: CanvasNodeSelectEvent*/) {
    // Do nothing for now
  }

  onCanvasMouseUp(e: CanvasMouseUpEvent) {
    this.draggedNodes = []
    this.nodeDragOrigins = []

    if (this.mouseMoved > 10) {
      this.dragOccured = true
    }

    if (this.dragging) return
    if (!this.boxSelection.selecting()) return

    let selection = this.boxSelection.select(this.instance.nodes)
    if (selection.length === 0) return

    if (!e.detail.event.shiftKey) {
      this.instance.unselectAll()
      for (const id of selection) {
        const n = this.instance.nodeMap.get(id)
        if (!n) continue
        this.instance.selectNode(n)
      }

      this.instance.canvas.dispatchEvent(
        new CanvasNodeSelectEvent({
          event: e.detail.event,
          selectedNodeIDs: selection,
        })
      )
    } else {
      selection = selection.filter((id) => !this.instance.selectedNodes.has(id))
      for (const id of selection) {
        const n = this.instance.nodeMap.get(id)
        if (!n) continue
        this.instance.selectNode(n)
      }

      if (selection.length !== 0) {
        this.instance.canvas.dispatchEvent(
          new CanvasNodeSelectEvent({
            event: e.detail.event,
            selectedNodeIDs: selection,
          })
        )
      }
    }
  }

  onCanvasMouseDown(ev: CanvasMouseDownEvent) {
    this.dragOccured = false
    this.mouseMoved = 0

    const native = ev.detail.event

    if (native.button !== 0) return

    if (native.ctrlKey || native.metaKey || native.shiftKey) {
      this.boxSelection.beginSelection(this.mousePosition)
      return
    }

    if (!this.hoveredNode) return

    this.draggedNodes = Array.from(this.instance.selectedNodes.values())

    if (!this.hoveredNode.isSelected()) {
      this.draggedNodes.push(this.hoveredNode)
    }

    this.nodeDragOrigins = this.draggedNodes.map((n) => new THREE.Vector2(n.x, n.y))
    this.mouseDragOrigin.x = this.mousePosition.x
    this.mouseDragOrigin.y = this.mousePosition.y
  }

  onCanvasSingleClick(e: CanvasSingleClickEvent) {
    const dispatch = (nodeIDs: number[]) => {
      this.instance.canvas.dispatchEvent(
        new CanvasNodeSelectEvent({
          event: e.detail.event,
          selectedNodeIDs: nodeIDs,
        })
      )
    }

    if (!e.detail.event.metaKey && !e.detail.event.shiftKey && !e.detail.event.ctrlKey) {
      if (e.detail.n) {
        if (e.detail.n.isSelected()) {
          this.instance.unselectAll()
          dispatch([])
        } else {
          this.instance.unselectAll()
          this.instance.selectNode(e.detail.n)
          dispatch([e.detail.n.id])
        }
      } else {
        this.instance.unselectAll()
        dispatch([])
      }
    } else {
      if (e.detail.n && !e.detail.n.isSelected()) {
        this.instance.selectNode(e.detail.n)
        dispatch([e.detail.n.id])
      }
    }
  }

  onCanvasDoubleClick(/*e: CanvasDoubleClickEvent*/) {
    // Do nothing for now
  }

  onCanvasContextMenu(e: CanvasContextMenuEvent) {
    const dispatch = (nodeIDs: number[]) => {
      this.instance.canvas.dispatchEvent(
        new CanvasNodeSelectEvent({
          event: e.detail.event,
          selectedNodeIDs: nodeIDs,
        })
      )
    }

    if (e.detail.n && !e.detail.n.isSelected()) {
      if (!e.detail.event.metaKey && !e.detail.event.shiftKey && !e.detail.event.ctrlKey) {
        this.instance.unselectAll()
      }

      this.instance.selectNode(e.detail.n)
      dispatch([e.detail.n.id])
    }
  }
}
