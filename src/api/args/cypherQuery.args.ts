import type BaseArgs from './base.args'

export interface CypherQueryArgs extends BaseArgs {
  graph: string
  query: string
}
