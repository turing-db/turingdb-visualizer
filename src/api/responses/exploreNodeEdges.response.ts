import type { EdgeEntry } from '../models/edgeEntry.model'

export type ExploreNodeEdgesResponse = {
  outs: EdgeEntry[]
  outCount: number
  ins: EdgeEntry[]
  inCount: number
}
