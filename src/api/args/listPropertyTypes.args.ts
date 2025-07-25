import type BaseArgs from './base.args'

export interface ListPropertyTypesArgs extends BaseArgs {
  graph: string
  nodeIDs?: number[]
}
