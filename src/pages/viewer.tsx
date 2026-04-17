import { TuringBottomToolbar } from '@/components/viewer/menus/bottom-toolbar'
import { TuringTopToolBar } from '@/components/viewer/menus/top-toolbar'
import { HierarchyBrowser } from '@/components/viewer/hierarchy-browser'
import { TuringNodeInspector } from '@/components/viewer/node-inspector'
import { useCanvasStore, useVisStore } from '@/stores'
import { type FC, useCallback, useEffect, useRef, useState } from 'react'
import { type NodeData, TuringCanvas, type TuringUserEvents, useTuringContext } from '@turingcanvas'

import { TuringContextMenuType } from '@/components/viewer/menus/turing-context-menu-type'

import {
  TuringContextMenu,
  type TuringContextMenuInfo,
} from '@/components/viewer/menus/turing-context-menu'

import useGraphEntities from '@/hooks/use-graph-entities'

// Size of each batch submitted to the canvas per animation frame. Tuned so a
// single batch fits comfortably in one frame on mid-range hardware.
const BATCH_SIZE = 500

const yieldToBrowser = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

const GraphCanvasData: FC = () => {
  const turing = useTuringContext()

  const { data } = useGraphEntities()

  const neighbourhood = useVisStore((state) => state.neighbourhood)
  const setGraphLoading = useVisStore((state) => state.setGraphLoading)
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

    const didChange =
      newCanvasNodes.length !== 0 ||
      newCanvasEdges.length !== 0 ||
      deletedNodes.length !== 0 ||
      deletedEdges.length !== 0

    // No-op effect runs fire during mid-pipeline store updates (e.g. after
    // neighbourhood.reset when both canvas and data are empty). They must
    // not clear graphLoading — that stays owned by useCypherQuery.onMutate
    // until the final render batch completes here.
    if (!didChange) return

    let cancelled = false

    const run = async () => {
      setGraphLoading(true)
      try {
        for (let i = 0; i < newCanvasNodes.length; i += BATCH_SIZE) {
          if (cancelled) return
          turing.instance.addNodes(newCanvasNodes.slice(i, i + BATCH_SIZE))
          if (newCanvasNodes.length > BATCH_SIZE) await yieldToBrowser()
        }

        for (let i = 0; i < newCanvasEdges.length; i += BATCH_SIZE) {
          if (cancelled) return
          turing.instance.addEdges(newCanvasEdges.slice(i, i + BATCH_SIZE))
          if (newCanvasEdges.length > BATCH_SIZE) await yieldToBrowser()
        }

        for (const node of deletedNodes) {
          if (cancelled) return
          turing.instance.delNode(node.id)
        }
        for (const edge of deletedEdges) {
          if (cancelled) return
          turing.instance.delEdge(edge.id)
        }

        for (const node of turing.instance.nodes) {
          if (neighbourhood.has(node.id)) turing.instance.makePrimary(node)
          else turing.instance.makeSecondary(node)
        }

        turingResetStates('nodeMap', 'nodes', 'selectedNodes', 'edges', 'edgeMap')
      } finally {
        if (!cancelled) setGraphLoading(false)
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [turingResetStates, turing, data, neighbourhood, setGraphLoading])

  return <></>
}

interface GraphCanvasProps {
  setContextMenuInfo: (info: TuringContextMenuInfo | undefined) => void
}

const GraphCanvas: FC<GraphCanvasProps> = (props) => {
  const { setContextMenuInfo } = props
  const inspectNode = useVisStore((state) => state.inspectNode)

  const closeInspectNodePanel = useVisStore((state) => state.closeInspectNodePanel)
  const { newNeighbours, add: addNeighbour } = useVisStore((state) => state.neighbourhood)

  useEffect(() => {
    closeInspectNodePanel()
  }, [closeInspectNodePanel])

  const events = useRef<Partial<TuringUserEvents>>({
    canvassingleclick: (e) => {
      if (!e.detail.n) {
        closeInspectNodePanel()
        return
      }

      inspectNode(e.detail.n.id)
    },

    canvasdoubleclick: (e) => {
      const n = e.detail.n
      if (!n) return

      if (n.isPrimary()) {
        newNeighbours([n.id])
        return
      }

      addNeighbour([n.id])
    },

    canvascontextmenu: (e) => {
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
      <HierarchyBrowser />
    </div>
  )
}
