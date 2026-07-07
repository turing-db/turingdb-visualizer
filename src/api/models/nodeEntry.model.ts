import type { PropertyValueType } from './propertyValueType.model'

export interface NodeEntry {
  id: number
  in_edge_count: number
  labels: string[]
  out_edge_count: number
  // Keyed by property NAME; values are typed (string | number | boolean),
  // matching EdgeEntry and what db.getNodes / ProcUtils actually emit.
  properties: { [propType: string]: PropertyValueType }
}
