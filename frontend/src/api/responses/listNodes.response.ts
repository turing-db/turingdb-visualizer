import type { NodeEntries } from '../models/nodeEntries.model'

export type ListNodesResponse = {
  data: NodeEntries
  nodeCount: number
  reachedEnd: boolean
}
