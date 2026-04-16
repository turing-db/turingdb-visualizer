import {
  parseCypherQuery,
  ReturnElementType,
  VariableType,
  type ParsedQuery,
  type ReturnElement,
} from './cypher-parser'

export enum ColumnMappingType {
  Node = 'node',
  NodeForProperty = 'nodeForProperty',
  NodeProperty = 'nodeProperty',
  Ignore = 'ignore',
}

export type ColumnMapping =
  | { type: ColumnMappingType.Node }
  | { type: ColumnMappingType.NodeForProperty; forVariable: string }
  | { type: ColumnMappingType.NodeProperty; variable: string; property: string }
  | { type: ColumnMappingType.Ignore }

export interface ModifiedQuery {
  query: string
  columnMapping: ColumnMapping[]
}

// Find which node variables need to be added for property projections
function findMissingVariables(parsed: ParsedQuery): Set<string> {
  const missing = new Set<string>()
  const presentNodeVariables = new Set<string>()

  // First pass: find which node variables are already in the RETURN
  for (const elem of parsed.returnElements) {
    if (elem.type === ReturnElementType.Variable && elem.variableType === VariableType.Node) {
      presentNodeVariables.add(elem.name)
    }
  }

  // Second pass: find property projections on nodes that aren't in RETURN
  for (const elem of parsed.returnElements) {
    if (elem.type === ReturnElementType.Property && elem.variableType === VariableType.Node) {
      if (!presentNodeVariables.has(elem.variable)) {
        missing.add(elem.variable)
      }
    }
  }

  return missing
}

// Split RETURN clause by commas, respecting parentheses
function splitReturnClause(clause: string): string[] {
  const elements: string[] = []
  let current = ''
  let parenDepth = 0

  for (const char of clause) {
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

// Modify the query to add missing variables before their property projections
function modifyQuery(query: string, missing: Set<string>): string {
  if (missing.size === 0) {
    return query
  }

  // Find the RETURN clause position
  const returnMatch = query.match(/\bRETURN\s+/i)
  if (!returnMatch || returnMatch.index === undefined) {
    return query
  }

  const returnStart = returnMatch.index + returnMatch[0].length
  const beforeReturn = query.substring(0, returnStart)
  const afterReturn = query.substring(returnStart)

  // Find where ORDER BY, LIMIT, SKIP start (if present)
  const suffixMatch = afterReturn.match(/\s+(ORDER\s+BY|LIMIT|SKIP)\s+/i)
  const returnClause = suffixMatch ? afterReturn.substring(0, suffixMatch.index) : afterReturn
  const suffix = suffixMatch ? afterReturn.substring(suffixMatch.index!) : ''

  // Split and rebuild the RETURN elements, inserting variables before their properties
  const elements = splitReturnClause(returnClause)
  const newElements: string[] = []
  const addedVariables = new Set<string>()

  for (const elem of elements) {
    const trimmed = elem.trim()

    // Check if this is a property access for a missing variable
    const propertyMatch = trimmed.match(/^(\w+)\.(\w+)$/)
    if (propertyMatch) {
      const varName = propertyMatch[1]
      if (missing.has(varName) && !addedVariables.has(varName)) {
        // Add the variable before its property
        newElements.push(varName)
        addedVariables.add(varName)
      }
    }

    newElements.push(trimmed)
  }

  return beforeReturn + newElements.join(', ') + suffix
}

// Map a single return element to a column mapping
function mapElement(elem: ReturnElement): ColumnMapping {
  switch (elem.type) {
    case ReturnElementType.Variable:
      if (elem.variableType === VariableType.Node) {
        return { type: ColumnMappingType.Node }
      }
      // Edge variables and unknown types are ignored
      return { type: ColumnMappingType.Ignore }

    case ReturnElementType.Property:
      if (elem.variableType === VariableType.Node) {
        return {
          type: ColumnMappingType.NodeProperty,
          variable: elem.variable,
          property: elem.property,
        }
      }
      // Edge properties and unknown types are ignored
      return { type: ColumnMappingType.Ignore }

    case ReturnElementType.Expression:
      return { type: ColumnMappingType.Ignore }
  }
}

// Build column mapping for the modified query
function buildColumnMapping(parsed: ParsedQuery, missing: Set<string>): ColumnMapping[] {
  const mapping: ColumnMapping[] = []
  const addedVariables = new Set<string>()

  for (const elem of parsed.returnElements) {
    // Check if we need to add a variable before this element
    if (elem.type === ReturnElementType.Property && elem.variableType === VariableType.Node) {
      if (missing.has(elem.variable) && !addedVariables.has(elem.variable)) {
        mapping.push({ type: ColumnMappingType.NodeForProperty, forVariable: elem.variable })
        addedVariables.add(elem.variable)
      }
    }

    // Add mapping for the current element
    mapping.push(mapElement(elem))
  }

  return mapping
}

export function prepareQuery(query: string): ModifiedQuery {
  const parsed = parseCypherQuery(query)
  const missing = findMissingVariables(parsed)
  const modifiedQuery = modifyQuery(query, missing)
  const columnMapping = buildColumnMapping(parsed, missing)

  return { query: modifiedQuery, columnMapping }
}
