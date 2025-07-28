import type BaseArgs from './base.args'

export interface GetNodesArgs extends BaseArgs {
  graph: string
  nodeIDs: number[]
}
