import type BaseArgs from './base.args'

export interface ListNodesArgs extends BaseArgs {
  graph: string
  skip?: number
  limit?: number
  labels?: string[]
  properties?: Map<string, string>
}
