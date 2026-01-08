// Response is chunks of data, each chunk is a list of columns, each column is a list of values
// e.g. MATCH (n) RETURN n returns [[0, 1, 2, ...]] - one chunk with one column of node IDs
export type CypherQueryResponse = unknown[][]
