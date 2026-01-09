# Cypher Query Panel Implementation

This document describes the implementation work done on the `query-panel` branch, which adds a Cypher query execution panel to the TuringDB Visualizer.

## Branch Overview

**Branch:** `query-panel`
**Base:** `main`
**Commits:** 4

---

## Commit 1: Implement cypher query panel

**Hash:** `031fc8f`
**Files changed:** 24 files (+650/-55 lines)

### Summary

Initial implementation of the Cypher query panel feature, providing the core infrastructure for executing Cypher queries and displaying results on the graph canvas.

### Changes

#### API Layer (`src/api/`)

- **`api.ts`**: Added `executeCypherQuery()` function that sends Cypher queries to the `/api/query` endpoint via POST request with the query as plain text body.

- **`args/cypherQuery.args.ts`**: New file defining the `CypherQueryArgs` interface with `graph` and `query` properties.

- **`responses/cypherQuery.response.ts`**: New file defining `CypherQueryResponse` type as a chunked columnar format (`unknown[][]`).

#### React Hook (`src/hooks/`)

- **`use-cypher-query.ts`**: New React Query mutation hook that:
  - Executes the Cypher query against the selected graph
  - On success, resets the current neighbourhood and populates it with query result node IDs
  - Uses `neighbourhood.add()` to fetch full node data for visualization

#### UI Components (`src/components/viewer/menus/`)

- **`top-toolbar.tsx`**: Major updates:
  - Added `InputGroup` for Cypher query input with monospace font
  - Execute button (play icon) with loading state
  - Clear canvas button (trash icon)
  - Keyboard shortcut: `Ctrl+Enter` to execute query
  - Responsive width based on node inspector panel state

#### State Management (`src/stores/`)

- **`vis.store.ts`**: Added `isNodeInspectorExtended` state and `setNodeInspectorExtended()` action to track inspector panel width for toolbar positioning.

#### Canvas Layer (`src/turingcanvas/src/`)

- **`instance.ts`**: Added `fitView(padding)` method that:
  - Calculates bounding box of all visible nodes
  - Computes optimal zoom level to fit all nodes
  - Centers the camera on the node cluster
  - Updates OrbitControls target

- **`store.ts`**: Exposed `fitView()` action in canvas store actions.

---

## Commit 2: Display error box if query error

**Hash:** `d8bf8dc`
**Files changed:** 3 files (+74/-23 lines)

### Summary

Added error handling and display for failed Cypher queries.

### Changes

#### API Layer (`src/api/`)

- **`api.ts`**: Updated `executeCypherQuery()` to check for error responses and throw `CypherQueryError` with error type and details.

- **`responses/cypherQuery.response.ts`**: Added:
  - `CypherQueryErrorResponse` type for server error responses
  - `CypherQueryError` custom error class extending `Error` with `errorType` and `errorDetails` properties

#### UI Components

- **`top-toolbar.tsx`**: Added error display card that:
  - Shows red-themed error banner with error type
  - Displays detailed error message in a scrollable monospace pre block
  - Includes dismiss button to clear the error
  - Max width of 600px, max height of 200px for details

---

## Commit 3: Add default cypher query

**Hash:** `4727276`
**Files changed:** 2 files (+88/-1 lines)

### Summary

Added a default query to the input field and created project documentation.

### Changes

- **`top-toolbar.tsx`**: Set default query value to `MATCH (n) RETURN n LIMIT 100`
- **`CLAUDE.md`**: Added comprehensive project documentation for Claude Code assistance

---

## Commit 4: Handle node IDs and property projections

**Hash:** `6517b48`
**Files changed:** 3 files (+403/-24 lines)

### Summary

Major enhancement to intelligently parse and modify Cypher queries to properly handle node variables and property projections, enabling advanced query patterns like `MATCH (n) RETURN n.name`.

### Changes

#### Cypher Parser (`src/utils/cypher-parser.ts`)

New utility for parsing Cypher queries:

- **`VariableType`** enum: `Node`, `Edge`, `Unknown`
- **`ReturnElementType`** enum: `Variable`, `Property`, `Expression`
- **`parseCypherQuery()`**: Parses query to extract:
  - Variable definitions from MATCH patterns (nodes and edges)
  - RETURN clause elements classified by type
- Handles:
  - Node patterns: `(n)`, `(n:Label)`, `(n:Label1:Label2)`
  - Edge patterns: `[e]`, `[e:TYPE]`, `[e:TYPE1|TYPE2]`
  - Property access: `n.property`
  - Function calls and expressions

#### Query Modifier (`src/utils/cypher-query-modifier.ts`)

New utility for modifying queries to ensure node IDs are available:

- **`ColumnMappingType`** enum: `Node`, `NodeForProperty`, `NodeProperty`, `Ignore`
- **`prepareQuery()`**: Main entry point that:
  1. Parses the query
  2. Identifies property projections on nodes not in RETURN
  3. Modifies query to insert node variables before their properties
  4. Returns column mapping for response processing

Example transformation:
```cypher
-- Input:
MATCH (n) RETURN n.name

-- Modified to:
MATCH (n) RETURN n, n.name
-- Column mapping: [NodeForProperty, NodeProperty]
```

#### Hook Updates (`src/hooks/use-cypher-query.ts`)

Major refactoring to use the new parsing infrastructure:

- **`processResponse()`**: New function that processes query results based on column mapping:
  - Extracts node IDs from `Node` and `NodeForProperty` columns
  - Associates property values as custom labels for nodes from `NodeProperty` columns

- **Flow:**
  1. Parse and potentially modify the query
  2. Execute modified query
  3. Process response using column mapping
  4. Add nodes to neighbourhood
  5. Apply custom labels from property projections
  6. Fit view after layout settles

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Top Toolbar UI                           │
│  ┌──────────────────────┐  ┌────┐  ┌─────┐                     │
│  │  Cypher Query Input  │  │ >  │  │ Del │  [Other controls]   │
│  └──────────────────────┘  └────┘  └─────┘                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    useCypherQuery Hook                          │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │ prepareQuery │ -> │ API Request  │ -> │ processResponse  │   │
│  │ (parse/mod)  │    │ (execute)    │    │ (extract nodes)  │   │
│  └─────────────┘    └──────────────┘    └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Neighbourhood                              │
│  reset() -> add(nodeIDs) -> fetch full node data                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TuringCanvas                               │
│  Render nodes -> Apply custom labels -> fitView()               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Features

1. **Query Execution**: Execute arbitrary Cypher queries via the top toolbar
2. **Error Handling**: Clear error display with type and detailed message
3. **Smart Query Parsing**: Automatic modification of queries to extract node IDs for property projections
4. **Custom Labels**: Property values (e.g., `n.name`) displayed as node labels on the canvas
5. **Auto Fit View**: Camera automatically adjusts to show all query result nodes
6. **Responsive UI**: Toolbar width adapts to node inspector panel state

---

## Property Projection Handling and Query Rewriting

This section provides an in-depth explanation of how the system handles Cypher queries that use property projections (e.g., `RETURN n.name` instead of `RETURN n`).

### The Problem

The TuringDB visualizer needs **node IDs** to render nodes on the canvas. When a user returns a full node variable like `RETURN n`, the server returns the node's internal ID, which can be used to fetch and display the node.

However, when users write queries with **property projections**, the server only returns the property values, not the node IDs:

```cypher
-- This query:
MATCH (n:Person) RETURN n.name, n.age

-- Returns data like:
[["Alice", "Bob", "Charlie"], [25, 30, 35]]

-- But we need node IDs to visualize the nodes!
```

Without node IDs, the visualizer cannot:
1. Fetch the full node data (labels, all properties)
2. Render the nodes on the canvas
3. Show relationships between nodes

### The Solution: Automatic Query Rewriting

The system automatically rewrites queries to inject the necessary node variables while preserving the user's intended output semantics. This happens transparently—the user writes natural Cypher queries, and the system handles the rest.

### Processing Pipeline

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  User's Query   │ --> │  Parse Query    │ --> │ Identify Missing│
│                 │     │                 │     │   Variables     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Process Response│ <-- │ Execute Modified│ <-- │  Rewrite Query  │
│ with Mapping    │     │     Query       │     │ + Build Mapping │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │
        ▼
┌─────────────────┐
│ Render Nodes    │
│ with Labels     │
└─────────────────┘
```

### Step 1: Query Parsing (`cypher-parser.ts`)

The parser extracts two key pieces of information:

#### 1.1 Variable Extraction

Scans the MATCH clause to identify all node and edge variables:

```typescript
// Regex for node patterns: (varName) or (varName:Label)
const nodePattern = /\((\w+)(?::\w+)*\)/g

// Regex for edge patterns: [varName] or [varName:TYPE]
const edgePattern = /\[(\w+)(?::[^\]]+)?\]/g
```

**Example:**
```cypher
MATCH (person:Person)-[knows:KNOWS]->(friend:Person)
```
Extracted variables:
- `person` → Node
- `knows` → Edge
- `friend` → Node

#### 1.2 RETURN Clause Analysis

Parses the RETURN clause to classify each element:

```typescript
type ReturnElement =
  | { type: 'Variable', name: string, variableType: VariableType }
  | { type: 'Property', variable: string, property: string, variableType: VariableType }
  | { type: 'Expression' }  // Functions, aggregations, literals, etc.
```

**Classification rules:**
- Simple identifier (`n`) → Variable
- Dot notation (`n.name`) → Property access
- Anything else (`count(n)`, `n.age + 1`, `"literal"`) → Expression

**Example:**
```cypher
RETURN n, n.name, count(m), m.age
```
Parsed as:
1. `n` → Variable (Node)
2. `n.name` → Property (Node `n`, property `name`)
3. `count(m)` → Expression
4. `m.age` → Property (Node `m`, property `age`)

#### 1.3 Handling Complex RETURN Clauses

The parser correctly handles:

- **Nested parentheses** in function calls:
  ```cypher
  RETURN collect(n.name), avg(n.age)
  ```

- **ORDER BY, LIMIT, SKIP suffixes**:
  ```cypher
  RETURN n.name ORDER BY n.age LIMIT 10
  -- Only "n.name" is parsed as a return element
  ```

### Step 2: Identifying Missing Variables (`cypher-query-modifier.ts`)

After parsing, the system identifies which node variables need to be injected:

```typescript
function findMissingVariables(parsed: ParsedQuery): Set<string> {
  const missing = new Set<string>()
  const presentNodeVariables = new Set<string>()

  // First pass: find node variables already in RETURN
  for (const elem of parsed.returnElements) {
    if (elem.type === 'Variable' && elem.variableType === 'Node') {
      presentNodeVariables.add(elem.name)
    }
  }

  // Second pass: find property projections on nodes NOT in RETURN
  for (const elem of parsed.returnElements) {
    if (elem.type === 'Property' && elem.variableType === 'Node') {
      if (!presentNodeVariables.has(elem.variable)) {
        missing.add(elem.variable)
      }
    }
  }

  return missing
}
```

**Example analysis:**

| Query | Present Nodes | Properties Used | Missing |
|-------|---------------|-----------------|---------|
| `RETURN n` | {n} | {} | {} |
| `RETURN n.name` | {} | {n} | {n} |
| `RETURN n, n.name` | {n} | {n} | {} |
| `RETURN n.name, m.age` | {} | {n, m} | {n, m} |
| `RETURN n, m.age` | {n} | {m} | {m} |

### Step 3: Query Rewriting

The query is rewritten to insert missing node variables **immediately before** their first property projection:

```typescript
function modifyQuery(query: string, parsed: ParsedQuery, missing: Set<string>): string
```

**Rewriting rules:**
1. Locate the RETURN clause in the original query
2. Split RETURN elements by comma (respecting parentheses)
3. For each property projection on a missing variable, insert the variable before it
4. Only insert each variable once (track with `addedVariables` set)
5. Preserve ORDER BY, LIMIT, SKIP suffixes

**Examples:**

```cypher
-- Input:
MATCH (n) RETURN n.name
-- Output:
MATCH (n) RETURN n, n.name

-- Input:
MATCH (n)-[e]->(m) RETURN n.name, m.id
-- Output:
MATCH (n)-[e]->(m) RETURN n, n.name, m, m.id

-- Input:
MATCH (n) RETURN n.name, n.age  -- Same variable, multiple properties
-- Output:
MATCH (n) RETURN n, n.name, n.age  -- Variable inserted only once

-- Input:
MATCH (n) RETURN n, n.name  -- Variable already present
-- Output:
MATCH (n) RETURN n, n.name  -- No modification needed

-- Input:
MATCH (n) RETURN n.name ORDER BY n.age LIMIT 10
-- Output:
MATCH (n) RETURN n, n.name ORDER BY n.age LIMIT 10  -- Suffix preserved
```

### Step 4: Building Column Mapping

Alongside the rewritten query, the system builds a **column mapping** that describes what each column in the response represents:

```typescript
enum ColumnMappingType {
  Node,            // A node variable the user explicitly returned
  NodeForProperty, // A node variable we injected for a property projection
  NodeProperty,    // A property value (follows its associated node)
  Ignore,          // Edge variables, expressions, unknown types
}
```

**Example mapping:**

```cypher
-- Rewritten query:
MATCH (n)-[e]->(m) RETURN n, n.name, m, m.id, e, count(*)

-- Column mapping:
[
  { type: NodeForProperty, forVariable: "n" },  // Column 0: injected n
  { type: NodeProperty, variable: "n", property: "name" },  // Column 1: n.name
  { type: NodeForProperty, forVariable: "m" },  // Column 2: injected m
  { type: NodeProperty, variable: "m", property: "id" },  // Column 3: m.id
  { type: Ignore },  // Column 4: edge variable e
  { type: Ignore },  // Column 5: expression count(*)
]
```

### Step 5: Response Processing

The server returns data in **chunked columnar format**:

```typescript
type CypherQueryResponse = unknown[][]
// Example: [[[1, 2, 3], ["Alice", "Bob", "Charlie"], [4, 5, 6], [101, 102, 103]]]
//           ^chunk     ^col0     ^col1              ^col2     ^col3
```

The `processResponse()` function iterates through this data using the column mapping:

```typescript
function processResponse(data: unknown[][], columnMapping: ColumnMapping[]): {
  nodeIDs: number[]
  nodeLabels: Map<number, string>
}
```

**Processing algorithm:**

```typescript
for (const chunk of data) {
  const rowCount = getRowCount(chunk)

  for (let rowIdx = 0; rowIdx < rowCount; rowIdx++) {
    let pendingNodeId: number | null = null  // Track node for property association

    for (let colIdx = 0; colIdx < chunk.length; colIdx++) {
      const value = chunk[colIdx][rowIdx]
      const mapping = columnMapping[colIdx]

      switch (mapping.type) {
        case ColumnMappingType.Node:
          // Direct node variable - just collect the ID
          nodeIDs.push(value)
          break

        case ColumnMappingType.NodeForProperty:
          // Injected node - collect ID and remember for next property
          nodeIDs.push(value)
          pendingNodeId = value
          break

        case ColumnMappingType.NodeProperty:
          // Property value - associate with pending node as a label
          if (pendingNodeId !== null && value != null) {
            nodeLabels.set(pendingNodeId, String(value))
            pendingNodeId = null  // Reset for next pair
          }
          break

        case ColumnMappingType.Ignore:
          // Skip edge variables and expressions
          break
      }
    }
  }
}
```

**Key insight:** The `NodeForProperty` → `NodeProperty` pairing works because the query rewriter always places the node variable **immediately before** its property. This creates a predictable adjacency in the response columns.

### Step 6: Rendering with Custom Labels

After processing, nodes are added to the canvas and custom labels are applied:

```typescript
// Add all discovered nodes (deduplicated)
const uniqueNodeIDs = [...new Set(nodeIDs)]
await neighbourhood.add(uniqueNodeIDs)

// Apply property values as custom labels
for (const [nodeId, label] of nodeLabels) {
  const node = nodeMap().get(nodeId)
  if (node) {
    canvasActions.setNodeLabel(node, label)
  }
}
```

This means if a user queries `RETURN n.name`, the nodes will display their `name` property value as labels on the canvas instead of the default label.

### Complete Example Walkthrough

**User query:**
```cypher
MATCH (p:Person)-[:KNOWS]->(f:Person)
RETURN p.name, f.name
LIMIT 5
```

**Step 1 - Parse:**
```
Variables: { p: Node, f: Node }
Return elements:
  - { type: Property, variable: "p", property: "name", variableType: Node }
  - { type: Property, variable: "f", property: "name", variableType: Node }
```

**Step 2 - Identify missing:**
```
Present node variables: {}
Properties on nodes: { p, f }
Missing: { p, f }
```

**Step 3 - Rewrite query:**
```cypher
MATCH (p:Person)-[:KNOWS]->(f:Person)
RETURN p, p.name, f, f.name
LIMIT 5
```

**Step 4 - Build mapping:**
```
[
  { type: NodeForProperty, forVariable: "p" },
  { type: NodeProperty, variable: "p", property: "name" },
  { type: NodeForProperty, forVariable: "f" },
  { type: NodeProperty, variable: "f", property: "name" },
]
```

**Step 5 - Server response (example):**
```json
[[[1, 2, 1], ["Alice", "Bob", "Alice"], [3, 4, 5], ["Charlie", "David", "Eve"]]]
```

**Step 6 - Process response:**
```
Row 0: p=1 (label="Alice"), f=3 (label="Charlie")
Row 1: p=2 (label="Bob"),   f=4 (label="David")
Row 2: p=1 (label="Alice"), f=5 (label="Eve")

nodeIDs: [1, 3, 2, 4, 1, 5]
nodeLabels: { 1: "Alice", 3: "Charlie", 2: "Bob", 4: "David", 5: "Eve" }
```

**Step 7 - Render:**
```
Unique nodes added: [1, 2, 3, 4, 5]
Labels applied:
  - Node 1 displays "Alice"
  - Node 2 displays "Bob"
  - Node 3 displays "Charlie"
  - Node 4 displays "David"
  - Node 5 displays "Eve"
```

### Edge Cases and Limitations

1. **Edge property projections** (`e.weight`) are ignored—only node properties trigger rewriting

2. **Expressions** (`count(n)`, `n.age + 1`) are ignored—they don't map to visualizable nodes

3. **Multiple properties on same node** only use the first property as the label:
   ```cypher
   RETURN n.name, n.age  -- Node displays "name", "age" is discarded for labeling
   ```

4. **Aliased returns** (`RETURN n.name AS personName`) are not currently handled—the parser looks for literal `variable.property` patterns

5. **DISTINCT keyword** is preserved but doesn't affect the rewriting logic

6. **UNION queries** are not specially handled—each part would need separate processing

---

## Files Added/Modified

### New Files
| File | Purpose |
|------|---------|
| `src/api/args/cypherQuery.args.ts` | Query request arguments type |
| `src/api/responses/cypherQuery.response.ts` | Response types and error class |
| `src/hooks/use-cypher-query.ts` | React Query mutation hook |
| `src/utils/cypher-parser.ts` | Cypher query parser |
| `src/utils/cypher-query-modifier.ts` | Query modification for node ID extraction |

### Modified Files
| File | Changes |
|------|---------|
| `src/api/api.ts` | Added `executeCypherQuery()` function |
| `src/components/viewer/menus/top-toolbar.tsx` | Query input UI, error display |
| `src/stores/vis.store.ts` | Inspector extended state |
| `src/turingcanvas/src/instance.ts` | `fitView()` method |
| `src/turingcanvas/src/store.ts` | Exposed `fitView` action |

---

## Detailed File-by-File Changes

### `src/api/args/cypherQuery.args.ts` (New File)

Defines the TypeScript interface for Cypher query API requests:

```typescript
export interface CypherQueryArgs extends BaseArgs {
  graph: string   // Name of the graph to query
  query: string   // The Cypher query string
}
```

---

### `src/api/responses/cypherQuery.response.ts` (New File)

Defines response types and error handling for Cypher queries:

```typescript
// Response format: chunks of columnar data
// Example: MATCH (n) RETURN n returns [[0, 1, 2, ...]]
export type CypherQueryResponse = unknown[][]

// Server error response structure
export type CypherQueryErrorResponse = {
  error: string
  error_details: string
}

// Custom error class for query failures
export class CypherQueryError extends Error {
  errorType: string      // e.g., "SyntaxError", "SemanticError"
  errorDetails: string   // Detailed error message from server

  constructor(errorType: string, errorDetails: string) {
    super(errorType)
    this.name = 'CypherQueryError'
    this.errorType = errorType
    this.errorDetails = errorDetails
  }
}
```

---

### `src/api/api.ts` (Modified)

Added the `executeCypherQuery()` function:

```typescript
export async function executeCypherQuery(args: CypherQueryArgs): Promise<CypherQueryResponse> {
  return await fetch(`/api/query?graph=${args.graph}`, {
    method: 'POST',
    signal: args.controller?.signal,
    headers: {
      'Content-Type': 'text/plain',  // Query sent as plain text body
    },
    body: args.query,
  }).then((res) =>
    res.text().then((text) => {
      const json = JSON.parse(text)
      if (json.error) {
        throw new CypherQueryError(json.error, json.error_details || '')
      }
      return json.data
    })
  )
}
```

Key implementation details:
- Uses `text/plain` content type (query is raw Cypher text)
- Parses response and checks for `error` field
- Throws `CypherQueryError` on failure with both error type and details
- Returns `json.data` on success (columnar format)

---

### `src/utils/cypher-parser.ts` (New File)

Parses Cypher queries to extract variable definitions and RETURN clause structure.

**Enums:**
```typescript
enum VariableType { Node, Edge, Unknown }
enum ReturnElementType { Variable, Property, Expression }
```

**Type definitions:**
```typescript
type ReturnElement =
  | { type: Variable; name: string; variableType: VariableType }
  | { type: Property; variable: string; property: string; variableType: VariableType }
  | { type: Expression }

interface ParsedQuery {
  variables: Map<string, VariableType>  // All defined variables
  returnElements: ReturnElement[]        // Parsed RETURN clause
}
```

**Key functions:**

- `extractVariables(query)`: Uses regex to find node `(n)` and edge `[e]` patterns in MATCH clauses
- `extractReturnClause(query)`: Isolates the RETURN clause, handling ORDER BY/LIMIT/SKIP suffixes
- `splitReturnElements(clause)`: Splits by commas while respecting parentheses depth for function calls
- `classifyReturnElement(element, variables)`: Determines if element is a variable, property access, or expression
- `parseCypherQuery(query)`: Main entry point combining all parsing logic

---

### `src/utils/cypher-query-modifier.ts` (New File)

Modifies queries to ensure node IDs are available for property projections.

**Problem solved:** When a user writes `MATCH (n) RETURN n.name`, the response only contains property values, not node IDs. The visualizer needs node IDs to display nodes.

**Solution:** Automatically insert the node variable before its property projection.

**Enums and types:**
```typescript
enum ColumnMappingType {
  Node,            // Direct node variable (e.g., n)
  NodeForProperty, // Node inserted for a property projection
  NodeProperty,    // Property value (e.g., n.name)
  Ignore,          // Edge variables, expressions
}

type ColumnMapping =
  | { type: Node }
  | { type: NodeForProperty; forVariable: string }
  | { type: NodeProperty; variable: string; property: string }
  | { type: Ignore }
```

**Key functions:**

- `findMissingVariables(parsed)`: Identifies node variables used in property projections but not returned directly
- `modifyQuery(query, parsed, missing)`: Rewrites RETURN clause to insert missing variables before their properties
- `buildColumnMapping(parsed, missing)`: Creates mapping array describing what each result column contains
- `prepareQuery(query)`: Main entry point returning modified query and column mapping

**Example transformation:**
```
Input:  MATCH (n)-[e]->(m) RETURN n.name, m.id
Output: MATCH (n)-[e]->(m) RETURN n, n.name, m, m.id
Mapping: [NodeForProperty, NodeProperty, NodeForProperty, NodeProperty]
```

---

### `src/hooks/use-cypher-query.ts` (New File, then Modified)

React Query mutation hook for executing Cypher queries.

**Helper functions:**

```typescript
// Get row count from chunked columnar data
function getRowCount(chunk: unknown[][]): number {
  return Math.max(0, ...chunk.map((col) => (Array.isArray(col) ? col.length : 0)))
}

// Process response based on column mapping
function processResponse(data: unknown[][], columnMapping: ColumnMapping[]): {
  nodeIDs: number[]
  nodeLabels: Map<number, string>  // nodeID -> label from property projection
}
```

**Response processing logic:**
- Iterates through chunks and rows
- For `Node` columns: extracts node ID directly
- For `NodeForProperty` columns: extracts node ID and stores as "pending"
- For `NodeProperty` columns: associates value with pending node ID as a label
- For `Ignore` columns: skips (edge variables, expressions)

**Main hook:**
```typescript
export const useCypherQuery = () => {
  const graphName = useAppStore((state) => state.graphName)
  const neighbourhood = useVisStore((state) => state.neighbourhood)
  const canvasActions = useCanvasStore((state) => state.actions)
  const nodeMap = useCanvasStore((state) => state.nodeMap)

  return useMutation({
    mutationFn: async (query: string) => {
      // 1. Parse and modify query
      const { query: modifiedQuery, columnMapping } = prepareQuery(query)
      // 2. Execute query
      const data = await executeCypherQuery({ graph: graphName, query: modifiedQuery })
      return { data, columnMapping }
    },
    onSuccess: async ({ data, columnMapping }) => {
      // 3. Process response
      const { nodeIDs, nodeLabels } = processResponse(data, columnMapping)
      // 4. Reset canvas and add nodes
      neighbourhood.reset(graphName)
      await neighbourhood.add([...new Set(nodeIDs)])
      // 5. Apply custom labels from property projections
      for (const [nodeId, label] of nodeLabels) {
        const node = nodeMap().get(nodeId)
        if (node) canvasActions.setNodeLabel(node, label)
      }
      // 6. Fit view after layout settles
      setTimeout(() => canvasActions.fitView(), 500)
    },
  })
}
```

---

### `src/components/viewer/menus/top-toolbar.tsx` (Modified)

Major UI additions for the query panel.

**State and hooks:**
```typescript
const [query, setQuery] = useState('MATCH (n) RETURN n LIMIT 100')
const { mutate, isPending, error, reset } = useCypherQuery()
const neighbourhood = useVisStore((state) => state.neighbourhood)
const inspectNodeInfo = useVisStore((state) => state.inspectNodeInfo)
const isNodeInspectorExtended = useVisStore((state) => state.isNodeInspectorExtended)
```

**Event handlers:**
```typescript
const executeQuery = useCallback(() => {
  if (!query.trim() || isPending) return
  reset()           // Clear previous error
  mutate(query.trim())
}, [query, isPending, mutate, reset])

const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    executeQuery()  // Ctrl+Enter shortcut
  }
}, [executeQuery])

const clearCanvas = useCallback(() => {
  neighbourhood.reset(neighbourhood.graph)
}, [neighbourhood])
```

**UI components added:**

1. **Query input** - `InputGroup` with:
   - Monospace font for query text
   - Responsive width (400px/300px/200px based on inspector state)
   - Placeholder text with shortcut hint
   - Loading spinner as right element when executing

2. **Execute button** - Play icon, primary intent, disabled when empty/loading

3. **Clear button** - Trash icon to reset canvas

4. **Error display card** - Conditionally rendered when `error` exists:
   - Red-themed header with error icon and type
   - Dismiss button (X icon)
   - Scrollable details section with monospace pre-formatted text
   - Max dimensions: 600px width, 200px height for details

**Responsive positioning:**
```typescript
className={clsx(
  'absolute top-0 m-4 transition-[left] duration-300',
  inspectNodeInfo
    ? isNodeInspectorExtended
      ? 'left-[28.125rem]'   // Extended inspector
      : 'left-[15.625rem]'   // Normal inspector
    : 'left-0'               // No inspector
)}
```

---

### `src/stores/vis.store.ts` (Modified)

Added state for tracking node inspector panel width:

```typescript
// Added to VisStore type:
isNodeInspectorExtended: boolean
setNodeInspectorExtended: (extended: boolean) => void

// Added to store implementation:
isNodeInspectorExtended: false,
setNodeInspectorExtended: (extended: boolean) =>
  set(() => ({ isNodeInspectorExtended: extended })),
```

This state is used by `top-toolbar.tsx` to adjust the query input position when the inspector panel changes width.

---

### `src/turingcanvas/src/instance.ts` (Modified)

Added `fitView()` method to the `TuringInstance` class:

```typescript
fitView(padding = 1.2) {
  if (this.nodes.length === 0) return

  // Calculate bounding box of all nodes
  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity

  for (const node of this.nodes) {
    minX = Math.min(minX, node.x)
    maxX = Math.max(maxX, node.x)
    minY = Math.min(minY, node.y)
    maxY = Math.max(maxY, node.y)
  }

  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  const width = (maxX - minX) || 1   // Avoid division by zero
  const height = (maxY - minY) || 1

  // Calculate zoom to fit all nodes with padding
  const camera = this.renderer.camera
  const viewWidth = camera.right - camera.left
  const viewHeight = camera.bottom - camera.top

  const zoomX = viewWidth / (width * padding)
  const zoomY = viewHeight / (height * padding)
  const zoom = Math.min(zoomX, zoomY, 1)  // Cap at 1 to avoid over-zooming

  // Update camera
  camera.position.x = centerX
  camera.position.y = centerY
  camera.zoom = zoom
  camera.updateProjectionMatrix()

  // Update OrbitControls target
  this.events.controls.target.set(centerX, centerY, 0)
  this.events.controls.update()
}
```

---

### `src/turingcanvas/src/store.ts` (Modified)

Exposed `fitView` action in the canvas store:

```typescript
// Added to actions type:
actions: {
  // ... existing actions
  fitView: (padding?: number) => void
}

// Added to actions implementation:
fitView: (padding?: number) => {
  instanceRef.current?.fitView(padding)
},
```

---

## Usage

1. Enter a Cypher query in the input field (default: `MATCH (n) RETURN n LIMIT 100`)
2. Press `Ctrl+Enter` or click the play button to execute
3. Results display on the canvas
4. Use the trash button to clear the canvas
5. Errors display below the toolbar with dismiss option
