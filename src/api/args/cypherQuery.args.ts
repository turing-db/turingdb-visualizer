import type BaseArgs from './base.args'

export interface CypherQueryArgs extends BaseArgs {
  graph: string
  query: string
  /**
   * Pin a past commit (time travel). The commit must be LOADed first --
   * `set_commit` on an unloaded commit succeeds silently and then every read
   * returns COMMIT_NOT_LOADED.
   */
  commit?: string
  /**
   * Pin an open change. Changes do NOT survive a server restart and cannot be
   * listed back, so an id has to be handed in rather than rediscovered.
   */
  change?: string
}
