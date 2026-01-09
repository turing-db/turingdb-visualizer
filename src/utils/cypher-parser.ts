export enum VariableType {
  Node = 'node',
  Edge = 'edge',
  Unknown = 'unknown',
}

export enum ReturnElementType {
  Variable = 'variable',
  Property = 'property',
  Expression = 'expression',
}

export type ReturnElement =
  | { type: ReturnElementType.Variable; name: string; variableType: VariableType }
  | { type: ReturnElementType.Property; variable: string; property: string; variableType: VariableType }
  | { type: ReturnElementType.Expression }

export interface ParsedQuery {
  variables: Map<string, VariableType>
  returnElements: ReturnElement[]
}

// Extract variable definitions from MATCH clause
function extractVariables(query: string): Map<string, VariableType> {
  const variables = new Map<string, VariableType>()

  // Match node patterns: (n) or (n:Label) or (n:Label1:Label2)
  const nodePattern = /\((\w+)(?::\w+)*\)/g
  let match: RegExpExecArray | null
  while ((match = nodePattern.exec(query)) !== null) {
    const varName = match[1]
    if (varName) {
      variables.set(varName, VariableType.Node)
    }
  }

  // Match edge patterns: [e] or [e:TYPE] or [e:TYPE1|TYPE2]
  const edgePattern = /\[(\w+)(?::[^\]]+)?\]/g
  while ((match = edgePattern.exec(query)) !== null) {
    const varName = match[1]
    if (varName) {
      variables.set(varName, VariableType.Edge)
    }
  }

  return variables
}

// Split RETURN clause elements, handling parentheses and function calls
function splitReturnElements(returnClause: string): string[] {
  const elements: string[] = []
  let current = ''
  let parenDepth = 0

  for (const char of returnClause) {
    if (char === '(') {
      parenDepth++
      current += char
    } else if (char === ')') {
      parenDepth--
      current += char
    } else if (char === ',' && parenDepth === 0) {
      elements.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  if (current.trim()) {
    elements.push(current.trim())
  }

  return elements
}

// Extract the RETURN clause from a query
function extractReturnClause(query: string): string | null {
  // Case-insensitive match for RETURN keyword
  const returnMatch = query.match(/\bRETURN\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|\s+SKIP|\s*$)/is)
  return returnMatch ? returnMatch[1].trim() : null
}

// Classify a single return element
function classifyReturnElement(
  element: string,
  variables: Map<string, VariableType>
): ReturnElement {
  const trimmed = element.trim()

  // Check for simple variable: just a word
  const variableMatch = trimmed.match(/^(\w+)$/)
  if (variableMatch) {
    const name = variableMatch[1]
    const variableType = variables.get(name) ?? VariableType.Unknown
    return { type: ReturnElementType.Variable, name, variableType }
  }

  // Check for property access: variable.property
  const propertyMatch = trimmed.match(/^(\w+)\.(\w+)$/)
  if (propertyMatch) {
    const variable = propertyMatch[1]
    const property = propertyMatch[2]
    const variableType = variables.get(variable) ?? VariableType.Unknown
    return { type: ReturnElementType.Property, variable, property, variableType }
  }

  // Everything else is an expression
  return { type: ReturnElementType.Expression }
}

export function parseCypherQuery(query: string): ParsedQuery {
  const variables = extractVariables(query)
  const returnClause = extractReturnClause(query)

  if (!returnClause) {
    return { variables, returnElements: [] }
  }

  const rawElements = splitReturnElements(returnClause)
  const returnElements = rawElements.map((el) => classifyReturnElement(el, variables))

  return { variables, returnElements }
}
