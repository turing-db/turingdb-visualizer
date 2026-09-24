# baku — a building section as a graph, in 3D

Domain module for the `baku` graph (baku-graph: the Heydar Aliyev Center
section, CC BY 4.0 Hector.Barba, remeshed and segmented into a TuringDB graph).
It mounts for graph `baku` only (`BAKU_GRAPHS` in `src/pages/viewer.tsx`), docks
LEFT, and keeps the stock 2D canvas on the right. A query result lights up in
both views, and a click in either selects in both.

## Run

```bash
# if the graph's server is on another machine, tunnel its port
ssh -f -N -L 6682:127.0.0.1:6682 <user>@<graph-host>
# the building shell (not in git): built by baku-graph `make web`
rsync -a <graph-host>:baku-graph/data/out/web/ public/baku/
TURING_API_PORT=6682 npm run dev      # then http://localhost:8080/?graph=baku
```

## What comes from where

| Drawn | Source |
|---|---|
| Triangle graph (29,288 `Vertex`, 86,739 `MESH_EDGE`), patch graph, frame graph, zones | **TuringDB, live**, `LAYER_*` in `queries.ts` |
| Skin triangles, glass, mullions, floor, section cut, steel mesh (on demand, 21 MB) | `public/baku/*.bin` from `make web`. Row i of `skin.pos.bin` is `Vertex {id: i}` |
| Highlights, 2D subgraph, property cards | query results |

## Files

- `queries.ts`: every Cypher string, plus the presets (geodesic, smoothest route, zone, hotspots, vector similarity, frame load path, supports, history).
- `lint.ts`: runs before any free-text query. Read-only; blocks OR chains of more than 1,000 terms and endpoint projections after `shortestPath` (shapes known to misbehave on 1.37).
- `model.ts`: loads the layers, translates between the two id spaces, anchors patches on the skin, A*-routes adjacency along the surface, and turns any result into highlights.
- `scene.ts`: three.js scene. Glyphs are at building scale and render on demand. Joints are picked in screen space.
- `index.tsx`: the panel: layers, colour modes, presets, editor, results table, commit bar (time travel with `LOAD COMMIT` self-heal), property card.

## Changes outside the module

- `api.ts`: `executeCypherQueryTable`. It has the same error contract as `executeCypherQuery` but keeps the column names and types.
- `neighbour-map.ts`: `setSubgraph(graph, nodes, edges)`, which shows exactly a result's subgraph. `add` pulls up to 10 neighbours per node, which buries a 171-node path in about 1,000 nodes of context.
- `turingcanvas` `autoFit(ms, maxZoom = 1)`: `fitView` capped zoom at 1, so a 7-node result could never be enlarged. The default is unchanged.

## Test

`npx vitest run --config vitest.config.ts tests/integration/baku-queries.test.ts`
runs every query, checks the presets' numbers against the pipeline (83.56 m / 170
hops, 63.73 m / 23 members, 8 patch hops), checks the model counts and the shell/graph
vertex-order contract, and checks the lint's negative controls. It hits `BAKU_API`
(default: the tunnel), and the live suites show as SKIPPED when the graph is unreachable.
