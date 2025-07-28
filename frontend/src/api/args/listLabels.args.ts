import type BaseArgs from './base.args'

export interface ListLabelsArgs extends BaseArgs {
  graph: string
  currentLabels?: string[]
}
