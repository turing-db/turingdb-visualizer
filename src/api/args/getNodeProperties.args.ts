import type BaseArgs from './base.args'

export interface GetNodePropertiesArgs extends BaseArgs {
  graph: string
  nodeIDs: number[]
  properties: string[]
}
