// Mock API responses for demo/development mode
export const mockGraphStatus = {
  isLoaded: true,
  isLoading: false,
  nodeCount: 150,
  edgeCount: 300,
}

export const mockAvailableGraphs = ['demo-graph', 'sample-network', 'test-graph']

export const mockLabels = {
  labels: ['Person', 'Company', 'Location', 'Product'],
  nodeCounts: [50, 25, 30, 45]
}

export const mockEdgeTypes = ['WORKS_AT', 'LOCATED_IN', 'KNOWS', 'OWNS']

export const mockPropertyTypes = ['name', 'id', 'email', 'type', 'description']

export const mockNodes = {
  data: {
    1: {
      id: 1,
      labels: ['Person'],
      properties: { name: 'John Doe', email: 'john@example.com' },
      in_edge_count: 0,
      out_edge_count: 2
    },
    2: {
      id: 2, 
      labels: ['Company'],
      properties: { name: 'Tech Corp', type: 'Technology' },
      in_edge_count: 1,
      out_edge_count: 0
    },
    3: {
      id: 3,
      labels: ['Location'],
      properties: { name: 'New York', type: 'City' },
      in_edge_count: 1,
      out_edge_count: 0
    }
  },
  nodeCount: 3,
  reachedEnd: true
}

export const mockNodeProperties = {
  'node-1': {
    name: 'John Doe',
    email: 'john@example.com',
    id: 'node-1'
  }
}

export const mockNodeEdges = {
  nodeEdges: {
    nodeID: 'node-1',
    edgeCounts: { 'WORKS_AT': 1, 'KNOWS': 2 }
  },
  edgesGroupedByEdgeType: {
    'WORKS_AT': [
      {
        id: 'edge-1',
        sourceNodeID: 'node-1',
        targetNodeID: 'node-2',
        edgeType: 'WORKS_AT',
        properties: {}
      }
    ],
    'KNOWS': [
      {
        id: 'edge-2',
        sourceNodeID: 'node-1', 
        targetNodeID: 'node-3',
        edgeType: 'KNOWS',
        properties: {}
      }
    ]
  }
}

export const mockNeighbors = {
  neighbors: [
    {
      nodeID: 'node-2',
      edgeID: 'edge-1',
      edgeType: 'WORKS_AT',
      direction: 'OUT'
    }
  ]
}

export const mockEdges = {
  edges: [
    {
      id: 'edge-1',
      sourceNodeID: 'node-1',
      targetNodeID: 'node-2', 
      edgeType: 'WORKS_AT',
      properties: {}
    }
  ]
}