varying vec3 vColor;
varying vec2 vUv;
varying vec2 vHalfExtents;

void main() {
    vec2 scale = vec2(
        length(instanceMatrix[0].xyz),
        length(instanceMatrix[1].xyz)
    );
    vHalfExtents = scale * 0.5;
    vUv = uv;
    vColor = instanceColor;

    gl_Position = projectionMatrix
                * viewMatrix
                * modelMatrix
                * instanceMatrix
                * vec4(position, 1.0);
}
