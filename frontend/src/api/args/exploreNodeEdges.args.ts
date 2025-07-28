import type BaseArgs from './base.args'

export enum ExploreEdgeDir {
  Outgoing = 0,
  Incoming = 1,
  Both = 2,
}

export interface ExploreNodeEdgesArgs extends BaseArgs {
  graph: string
  nodeID: number
  limit?: number
  skip?: number
  nodeProperties?: { [stringPropTypeID: number]: string }
  edgeProperties?: { [stringPropTypeID: number]: string }
  nodeLabels?: string[]
  edgeTypes?: string[]
  edgeDir?: ExploreEdgeDir
}
