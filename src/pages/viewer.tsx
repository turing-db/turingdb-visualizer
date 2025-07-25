import { TuringBottomToolbar } from '@/components/viewer/menus/bottom-toolbar'
import { TuringTopToolBar } from '@/components/viewer/menus/top-toolbar'
import { TuringNodeInspector } from '@/components/viewer/node-inspector'
import { useCanvasStore, useVisStore } from '@/stores'
import { type FC, useCallback, useEffect, useRef, useState } from 'react'
import { TuringCanvas, useTuringContext } from 'turingcanvas'

// Use any for now to bypass type issues during development
type NodeData = any
type TuringUserEvents = any

import { TuringContextMenuType } from '@/components/viewer/menus/turing-context-menu-type'

import {
  TuringContextMenu,
  type TuringContextMenuInfo,
} from '@/components/viewer/menus/turing-context-menu'

import useGraphEntities from '@/hooks/use-graph-entities'

const GraphCanvasData: FC = () => {
  const turing = useTuringContext()

  const { data } = useGraphEntities()

  const neighbourhood = useVisStore((state) => state.neighbourhood)
  const turingResetStates = useCanvasStore((state) => state.resetStates)

  useEffect(() => {
    if (!data) return

    const newCanvasNodes = [...data.graphNodes.values()]
      .filter((n) => !turing.instance.nodeMap.has(n.id))
      .map((n) => ({
        id: n.id,
        primary: neighbourhood.has(n.id),
        data: n as NodeData,
      }))

    const newCanvasEdges = [...data.graphEdges.values()]
      .filter((e) => !turing.instance.edgeMap.has(e[0]))
      .map((e) => ({
        id: e[0],
        src: e[1],
        tgt: e[2],
        data: e as NodeData,
      }))

    const deletedNodes = turing.instance.nodes.filter((n) => !data.graphNodes.has(n.id))
    const deletedEdges = turing.instance.edges.filter((e) => !data.graphEdges.has(e.id))

    turing.instance.addNodes(newCanvasNodes)
    turing.instance.addEdges(newCanvasEdges)

    for (const node of deletedNodes) {
      turing.instance.delNode(node.id)
    }

    for (const edge of deletedEdges) {
      turing.instance.delEdge(edge.id)
    }

    for (const node of turing.instance.nodes) {
      if (neighbourhood.has(node.id)) {
        turing.instance.makePrimary(node)
      } else {
        turing.instance.makeSecondary(node)
      }
    }

    if (
      newCanvasNodes.length !== 0 ||
      newCanvasEdges.length !== 0 ||
      deletedNodes.length !== 0 ||
      deletedEdges.length !== 0
    ) {
      turingResetStates('nodeMap', 'nodes', 'selectedNodes', 'edges', 'edgeMap')
    }
  }, [turingResetStates, turing, data, neighbourhood])

  return <></>
}

interface GraphCanvasProps {
  setContextMenuInfo: (info: TuringContextMenuInfo | undefined) => void
}

const GraphCanvas: FC<GraphCanvasProps> = (props) => {
  const { setContextMenuInfo } = props
  const inspectNode = useVisStore((state) => state.inspectNode)

  const turing = useTuringContext()
  const init = useCanvasStore((state) => state.init)
  const closeInspectNodePanel = useVisStore((state) => state.closeInspectNodePanel)
  const { newNeighbours, add: addNeighbour } = useVisStore((state) => state.neighbourhood)

  useEffect(() => {
    init(turing.instance)
    closeInspectNodePanel()
  }, [init, turing.instance, closeInspectNodePanel])

  const events = useRef<Partial<TuringUserEvents>>({
    canvassingleclick: (e: any) => {
      if (!e.detail.n) {
        closeInspectNodePanel()
        return
      }

      inspectNode(e.detail.n.id)
    },

    canvasdoubleclick: (e: any) => {
      const n = e.detail.n
      if (!n) return

      if (n.isPrimary()) {
        newNeighbours([n.id])
        return
      }

      addNeighbour([n.id])
    },

    canvascontextmenu: (e: any) => {
      const node = e.detail.n

      if (node) {
        setContextMenuInfo({
          type: TuringContextMenuType.NODE,
          offset: {
            left: e.detail.event.clientX,
            top: e.detail.event.clientY,
          },
          node,
        })
        return
      }

      setContextMenuInfo({
        type: TuringContextMenuType.CANVAS,
        offset: {
          left: e.detail.event.clientX,
          top: e.detail.event.clientY,
        },
      })
    },
  })

  return (
    <>
      <GraphCanvasData />
      <TuringCanvas
        id="turing-canvas-1"
        className="bg-visualizer-pattern relative"
        events={events.current}
      />
    </>
  )
}

export const TViewerPage = () => {
  const [contextMenuInfo, setContextMenuInfo] = useState<TuringContextMenuInfo | undefined>()
  const closeContextMenu = useCallback(() => setContextMenuInfo(undefined), [])

  return (
    <div className="relative flex flex-1 flex-row overflow-hidden">
      <TuringContextMenu close={closeContextMenu} info={contextMenuInfo} />
      <GraphCanvas setContextMenuInfo={setContextMenuInfo} />
      <div id="cm" />
      <TuringTopToolBar />
      <TuringBottomToolbar />
      <TuringNodeInspector />
    </div>
  )
}
