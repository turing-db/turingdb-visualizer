import { useMemo } from 'react'

import { useVisStore } from '@/stores'
import useGraphInfo from './use-graph-info'
import { useAppStore } from '@/stores'

const defaultIDs: { nodeIDs: number[]; edgeIDs: number[] } = {
  nodeIDs: [],
  edgeIDs: [],
}

export const useGraphEntityIDs = () => {
  const graphName = useAppStore((state) => state.graphName)
  const graph = useGraphInfo(graphName)
  const hiddenNodes = useVisStore((state) => state.hiddenNodes)
  const neighbourhood = useVisStore((state) => state.neighbourhood)

  const { nodeIDs, edgeIDs } = useMemo(() => {
    if (!graph.info) return defaultIDs

    const neighbourIDs = [...neighbourhood.entries()]
    const nodeIDs = [
      ...new Set(
        neighbourIDs
          .flatMap(([nodeID, graphEntry]) =>
            [
              nodeID,
              graphEntry.ins.map((neighbour) => neighbour.srcID),
              graphEntry.outs.map((neighbour) => neighbour.tgtID),
            ].flat()
          )
          .filter((id) => !hiddenNodes.has(id))
      ),
    ]

    const edgeIDs = [
      ...new Set(
        neighbourIDs
          .flatMap(([, entry]) => [
            entry.ins.filter((neighbour) => !hiddenNodes.has(neighbour.srcID)).map((e) => e.edgeID),
            entry.outs
              .filter((neighbour) => !hiddenNodes.has(neighbour.tgtID))
              .map((e) => e.edgeID),
          ])
          .flat()
      ),
    ]

    return {
      nodeIDs,
      edgeIDs,
    }
  }, [graph.info, hiddenNodes, neighbourhood])

  return {
    nodeIDs,
    edgeIDs,
  }
}

export default useGraphEntityIDs
