import type BaseArgs from './base.args'

export interface ListEdgeTypesArgs extends BaseArgs {
  graph: string
  edgeIDs?: number[]
}
