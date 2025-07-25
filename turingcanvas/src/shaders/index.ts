import * as THREE from 'three'
import nodeVert from './node.vert.glsl'
import nodeFrag from './node.frag.glsl'
import edgeVert from './edge.vert.glsl'
import edgeFrag from './edge.frag.glsl'

export const getNodeMaterial = () => {
  return new THREE.ShaderMaterial({
    // TODO Try to make it FrontSide
    // Works for rendering, but not for the raycaster
    side: THREE.DoubleSide,
    vertexShader: nodeVert,
    fragmentShader: nodeFrag,
    uniforms: { uHasOutline: { value: 0.0 }, uOpacity: { value: 1.0 } },
    blending: THREE.CustomBlending,
    blendSrc: THREE.SrcAlphaFactor,
    depthTest: false,
  })
}

export const getEdgeMaterial = () =>
  new THREE.ShaderMaterial({
    // TODO Try to make it FrontSide
    // Works for rendering, but not for the raycaster
    // Maybe due to clockwise front detection
    side: THREE.DoubleSide,
    vertexShader: edgeVert,
    fragmentShader: edgeFrag,
    uniforms: { uOpacity: { value: 1.0 } },
    blending: THREE.CustomBlending,
    blendSrc: THREE.SrcAlphaFactor,
    depthTest: false,
  })

export const getBoxSelectionMaterial = () =>
  new THREE.MeshBasicMaterial({
    side: THREE.FrontSide,
    blending: THREE.CustomBlending,
    blendSrc: THREE.SrcAlphaFactor,
    depthTest: false,
    color: 0x2255ff,
    opacity: 0.3,
  })
