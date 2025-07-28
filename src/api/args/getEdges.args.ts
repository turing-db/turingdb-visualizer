import type BaseArgs from './base.args'

export interface GetEdgesArgs extends BaseArgs {
  graph: string
  edgeIDs: number[]
}
