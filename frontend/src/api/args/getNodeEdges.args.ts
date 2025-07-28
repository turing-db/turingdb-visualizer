import type BaseArgs from './base.args'

export type EdgeTypeID = number
export class LimitByEdgeTypeMap extends Map<EdgeTypeID, number> {}

export interface GetNodeEdgesArgs extends BaseArgs {
  graph: string
  nodeIDs: number[]
  defaultLimit?: number
  limitByOutEdgeType?: LimitByEdgeTypeMap
  limitByInEdgeType?: LimitByEdgeTypeMap
  returnOnlyIDs?: boolean
}
