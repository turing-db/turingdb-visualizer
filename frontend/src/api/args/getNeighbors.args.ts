import type BaseArgs from './base.args'

export interface GetNeighborsArgs extends BaseArgs {
  graph: string
  nodeIDs: number[]
  limitPerNode?: number
}
