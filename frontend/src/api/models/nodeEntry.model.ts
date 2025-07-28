export interface NodeEntry {
  id: number
  in_edge_count: number
  labels: string[]
  out_edge_count: number
  properties: { [propType: string]: string }
}
