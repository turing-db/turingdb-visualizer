import { LimitByEdgeTypeMap } from '@/api/args'
import type { NodeEntry } from '@/api/models/nodeEntry.model'
import { useEdgePagination } from './useEdgePagination'
import { getNodeEdges, getNodes } from '@/api'
import type { EdgeEntry } from '@/api/models/edgeEntry.model'
import { groupBy } from 'lodash'
import { EdgeDirection } from '../constants'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

export interface UseNodeEdgesProps {
  node: NodeEntry
  graph: string
  direction: EdgeDirection
}

export type NodeEdges = {
  edges: EdgeEntry[]
  edgeCounts: { [edgeTypeID: number]: number }
}

export const useNodeEdges = (args: UseNodeEdgesProps) => {
  const { pagination, incrementPage } = useEdgePagination()

  const { data: ne } = useQuery({
    staleTime: 1000 * 60 * 5,
    queryKey: [
      'node-edges',
      args.graph,
      args.node.id,
      ...[...pagination.pageByEdgeType.entries()],
      pagination.countPerPage,
      args.direction,
    ],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const limitByEdgeType = new LimitByEdgeTypeMap(
        pagination.pageByEdgeType
          .entries()
          .map(([edgeTypeID, page]) => [edgeTypeID, (page + 1) * pagination.countPerPage])
      )

      const nodeEdges = await getNodeEdges({
        graph: args.graph,
        nodeIDs: [args.node.id],
        defaultLimit: pagination.countPerPage,
        limitByInEdgeType: args.direction === EdgeDirection.IN ? limitByEdgeType : undefined,
        limitByOutEdgeType: args.direction === EdgeDirection.OUT ? limitByEdgeType : undefined,
      }).then((allNodeEdges) => {
        const nodeEdges = allNodeEdges[args.node.id]
        return {
          edges: args.direction === EdgeDirection.IN ? nodeEdges.ins : nodeEdges.outs,
          edgeCounts:
            args.direction === EdgeDirection.IN ? nodeEdges.inEdgeCounts : nodeEdges.outEdgeCounts,
        }
      })

      return nodeEdges
    },
  })

  const { data, isPending } = useQuery({
    queryKey: ['node-edges', args.graph, args.node.id, args.direction, ne],
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    enabled: !!ne,
    queryFn: async () => {
      if (!ne) return undefined
      const edges = ne.edges
      const edgeCounts = ne.edgeCounts
      const indexInEdge = args.direction === EdgeDirection.IN ? 1 : 2

      const nodes = await getNodes({
        graph: args.graph,
        nodeIDs: edges.map((e) => e[indexInEdge]),
      })

      const nodeEntriesWithType = edges
        .map((e) => ({ id: e[indexInEdge], typeId: e[3] }))
        .map((v) => {
          const b = Object.values(nodes).find((r) => r.id === v.id)

          if (b !== undefined) {
            return { ...b, typeId: v.typeId }
          }

          return undefined
        })
        .filter((v) => v !== undefined)

      const edgesGroupedByEdgeType = groupBy(nodeEntriesWithType, (v) => v.typeId)

      return {
        nodeEdges: { edges, edgeCounts },
        nodeEntriesWithType,
        edgesGroupedByEdgeType,
      }
    },
  })

  return { isPending, data, incrementPage }
}
