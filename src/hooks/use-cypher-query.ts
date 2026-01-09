import { useMutation } from '@tanstack/react-query'
import { executeCypherQuery } from '@/api'
import { useAppStore, useCanvasStore, useVisStore } from '@/stores'
import { prepareQuery, ColumnMappingType, type ColumnMapping } from '@/utils/cypher-query-modifier'

// Get the number of rows in a chunk (max length of any column)
function getRowCount(chunk: unknown[][]): number {
  return Math.max(0, ...chunk.map((col) => (Array.isArray(col) ? col.length : 0)))
}

// Process query response based on column mapping
function processResponse(
  data: unknown[][],
  columnMapping: ColumnMapping[]
): { nodeIDs: number[]; nodeLabels: Map<number, string> } {
  const nodeIDs: number[] = []
  const nodeLabels = new Map<number, string>()

  for (const chunk of data) {
    if (!Array.isArray(chunk)) continue

    const rowCount = getRowCount(chunk)

    for (let rowIdx = 0; rowIdx < rowCount; rowIdx++) {
      let pendingNodeId: number | null = null

      for (let colIdx = 0; colIdx < chunk.length; colIdx++) {
        const column = chunk[colIdx]
        if (!Array.isArray(column)) continue

        const value = column[rowIdx]
        const mapping = columnMapping[colIdx]
        if (!mapping) continue

        switch (mapping.type) {
          case ColumnMappingType.Node:
            if (typeof value === 'number') {
              nodeIDs.push(value)
            }
            break

          case ColumnMappingType.NodeForProperty:
            // Node variable added for a property projection
            if (typeof value === 'number') {
              pendingNodeId = value
              nodeIDs.push(pendingNodeId)
            }
            break

          case ColumnMappingType.NodeProperty:
            // Use the pending node ID to associate this property as a label
            if (pendingNodeId !== null && value !== null && value !== undefined) {
              nodeLabels.set(pendingNodeId, String(value))
              pendingNodeId = null
            }
            break

          case ColumnMappingType.Ignore:
            // Edge variables, expressions - skip
            break
        }
      }
    }
  }

  return { nodeIDs, nodeLabels }
}

export const useCypherQuery = () => {
  const graphName = useAppStore((state) => state.graphName)
  const neighbourhood = useVisStore((state) => state.neighbourhood)
  const canvasActions = useCanvasStore((state) => state.actions)
  const nodeMap = useCanvasStore((state) => state.nodeMap)

  return useMutation({
    mutationFn: async (query: string) => {
      if (!graphName) {
        throw new Error('No graph selected')
      }

      // Parse and potentially modify the query
      const { query: modifiedQuery, columnMapping } = prepareQuery(query)

      // Execute the (possibly modified) query
      const data = await executeCypherQuery({
        graph: graphName,
        query: modifiedQuery,
      })

      return { data, columnMapping }
    },
    onSuccess: async ({ data, columnMapping }) => {
      if (!data || !Array.isArray(data) || data.length === 0) {
        if (graphName) {
          neighbourhood.reset(graphName)
        }
        return
      }

      // Process response based on column mapping
      const { nodeIDs, nodeLabels } = processResponse(data, columnMapping)

      if (graphName) {
        // Clear existing graph and show only the query results
        neighbourhood.reset(graphName)

        if (nodeIDs.length > 0) {
          // Deduplicate node IDs and add via neighbourhood (fetches full node data)
          const uniqueNodeIDs = [...new Set(nodeIDs)]
          await neighbourhood.add(uniqueNodeIDs)

          // Apply custom labels from property projections
          if (nodeLabels.size > 0) {
            const currentNodeMap = nodeMap()
            for (const [nodeId, label] of nodeLabels) {
              const node = currentNodeMap.get(nodeId)
              if (node) {
                canvasActions.setNodeLabel(node, label)
              }
            }
          }
        }

        // Delay fitView to let the simulation position the nodes
        setTimeout(() => canvasActions.fitView(), 500)
      }
    },
  })
}

export default useCypherQuery
