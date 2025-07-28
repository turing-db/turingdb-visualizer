# Turing canvas

Visualizer library using [threejs](https://threejs.org/) and [d3 force layout](https://d3js.org/d3-force).

Usage with React:

```jsx
import { Button } from "@blueprintjs/core";

import {
  TuringCanvas,
  TuringContextProvider,
  useTuringContext,
} from "turingcanvas";

const ViewerPage = () => {
  const turing = useTuringContext();

  return (
    <>
      <Button
        onClick={() => {
          turing.instance.addNode();
        }}
      >
        Add node
      </Button>
      <Button
        onClick={() => {
          const nodes = Object.values(turing.instance.selectedNodes);
          if (nodes.length === 2) {
            turing.instance.addEdge(nodes[0].index, nodes[1].index);
          }
        }}
      >
        Add edge
      </Button>
      <div className="flex flex-col h-full w-full bg-gray-950">
        <TuringCanvas />
      </div>
    </>
  );
};

export default function Home() {
  return (
    <TuringContextProvider>
      <ViewerPage />
    </TuringContextProvider>
  );
}
```

The library can render ~20k nodes for now.

# Implementation

## Rendering

### Interface

The library exports a `TuringCanvas` component and a `TuringContextProvider`
context that wraps the `TuringRenderer` instance.
The interface of the `TuringRenderer` is simple:

```ts
export class TuringRenderer {
  init();
  addNode(pos?: { x: number; y: number });
  addNodes(pos: { x: number; y: number }, count: number);
  addEdge(sourceID: number, targetID: number);
  terminate();
}
```

### Meshes

The meshes are defined in the `src/meshes.ts` file:

- Edges: They are stored in one big buffer containing 120'000 floats (i.e. 40'000 3-component vectors).
  Right now, they are rendered as a simple line (using the OpenGL GL_LINE_STRIPS primitive), but we might
  have to switch to rendering quads in the future for better control (of the thickness for example). At the
  start of the program we set the draw range with `.setDrawRange(0, 0)`, since we don't want to render anything.
- Nodes: They are rendered using GPU Instancing with the `THREE.InstancedMesh` class. The base geometry is a plane
  with a custom fragment shader to render the hexagon:

```glsl
varying vec2 vUv;
varying vec3 vColor;

float hex(in vec2 p){
    const float hexSize = 0.7;
    const vec2 s = vec2(1, 1.7320508);
    p = abs(p);
    return max(dot(p, s * 0.5), p.x) - hexSize;
}

void main( ) {
    vec2 uv = vUv * 2.0 - 1.0; // normalize the UV from -1.0 to 1.0
    float hexv = hex(uv);      // Compute the hexagon value (1.0 if the pixel is inside
                               // the hexagon, 0.0 if outside.
    float v = smoothstep(0.02, 0.0, hexv); // smoothstep the value to obtain a smooth
                                           // border (simulating antialiasing)
    if (v < 0.05) discard;                 // discard the pixel if outside the hexagon

    gl_FragColor = vec4(vColor.xyz, v);    // set the pixel color to the input color
                                           // with opacity `v`
}
```

- Labels: Rendered using the [troika-three-text](https://www.npmjs.com/package/troika-three-text) library. Label
  rendering is enabled/disabled dynamically depending on the `camera.zoom` value.

### Scene

The camera is orthographic and can easily be changed to a perspective mode to render 3D, although
this would require to switch to a 3D force simulation, and 3D rendered nodes (spheres probably, cubes,
or maybe even using GL_POINTS);

## Force simulation

The simulation is given by:

```ts
const createForceLink = (edges: SimEdge[]) => {
  return d3.forceLink(edges).distance(2);
};

const createForceSimulation = (nodes: SimNode[], edges: SimEdge[]) => {
  return d3
    .forceSimulation(nodes)
    .force("link", createForceLink(edges))
    .force("charge", d3.forceManyBody().strength(-0.2).theta(1.3))
    .force("x", d3.forceX())
    .force("y", d3.forceY());
};
```

and it is manually ticked during in the render loop. Everytime a node or edge is added, we
manually increase the temperature of the simulation:

```ts
  addNode(node: TuringNode) {
    /**/
    this.sim.alpha(0.4);
  }

  addEdge(edge: TuringEdge) {
    /**/
    this.sim.alpha(0.4);
  }
```

# Layoutcpp C++ Library

The library is compiled to wasm + javascript, and the files are copied
to `./turing` at the end of the build step.

Building instructions (emscripten required):

```bash
cd turing
emcmake cmake . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build
```

Loading the library:

```javascript
import MainModuleFactory from "./turing";
MainModuleFactory().then((mod) => {
  const engine = new mod.TuringLayoutEngine();
  engine.sayHello();
});
```

> This does not work right now due to bundling issues (I could not get
> it to work as an npm package
