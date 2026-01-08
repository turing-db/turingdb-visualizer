import { useMutation } from '@tanstack/react-query'
import { executeCypherQuery } from '@/api'
import { useVisStore, useAppStore, useCanvasStore } from '@/stores'

export const useCypherQuery = () => {
  const graphName = useAppStore((state) => state.graphName)
  const neighbourhood = useVisStore((state) => state.neighbourhood)
  const fitView = useCanvasStore((state) => state.actions.fitView)

  return useMutation({
    mutationFn: async (query: string) => {
      if (!graphName) {
        throw new Error('No graph selected')
      }

      return await executeCypherQuery({
        graph: graphName,
        query,
      })
    },
    onSuccess: async (data) => {
      if (!data || !Array.isArray(data) || data.length === 0) return

      // Response structure: [ [chunk], [chunk], ... ]
      // Each chunk: [ [column1_values], [column2_values], ... ]
      // For MATCH (n) RETURN n, we get [ [[0, 1, 2, ...]] ]
      const nodeIDs: number[] = []
      for (const chunk of data) {
        if (Array.isArray(chunk)) {
          for (const column of chunk) {
            if (Array.isArray(column)) {
              for (const value of column) {
                if (typeof value === 'number') {
                  nodeIDs.push(value)
                }
              }
            }
          }
        }
      }

      if (graphName) {
        // Clear existing graph and show only the query results
        neighbourhood.reset(graphName)
        if (nodeIDs.length > 0) {
          await neighbourhood.add(nodeIDs)
        }
        // Delay fitView to let the simulation position the nodes
        setTimeout(() => fitView(), 500)
      }
    },
  })
}

export default useCypherQuery
