varying vec3 vColor;
varying vec2 vUv;

void main() {
    vec4 instancePosition = instanceMatrix * vec4(position, 1.0);
    vUv = uv;
    vColor = instanceColor;

    gl_Position = projectionMatrix
                * viewMatrix
                * modelMatrix
                * instanceMatrix
                * vec4(position, 1.0);
}
