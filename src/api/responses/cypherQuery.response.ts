// Response is chunks of data, each chunk is a list of columns, each column is a list of values
// e.g. MATCH (n) RETURN n returns [[0, 1, 2, ...]] - one chunk with one column of node IDs
export type CypherQueryResponse = unknown[][]

// Error response from the server
export type CypherQueryErrorResponse = {
  error: string
  error_details: string
}

// Custom error class to hold both error type and details
export class CypherQueryError extends Error {
  errorType: string
  errorDetails: string

  constructor(errorType: string, errorDetails: string) {
    super(errorType)
    this.name = 'CypherQueryError'
    this.errorType = errorType
    this.errorDetails = errorDetails
  }
}
