import type { EdgeEntry } from '@/api/models/edgeEntry.model'
import type { NodeEntry } from '@/api/models/nodeEntry.model'

export type EntityCacheNodeData = NodeEntry

export type EntityCacheEdgeData = EdgeEntry

export class EntityCache {
  nodes = new Map<number, EntityCacheNodeData>()
  edges = new Map<number, EntityCacheEdgeData>()
}
