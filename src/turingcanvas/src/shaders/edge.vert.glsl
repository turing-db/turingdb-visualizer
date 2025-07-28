varying vec3 vColor;
varying vec2 vUv;
varying vec2 vScale;

void main() {
  vec4 instancePosition = instanceMatrix * vec4(position, 1.0);
  vec3 xScale = vec3(instanceMatrix[0][0], instanceMatrix[0][1], instanceMatrix[0][2]);
  vec3 yScale = vec3(instanceMatrix[1][0], instanceMatrix[1][1], instanceMatrix[1][2]);
  float xScaleMagnitude = length(xScale);
  float yScaleMagnitude = length(yScale);
  vScale.x = xScaleMagnitude;
  vScale.y = yScaleMagnitude;

  vUv = uv;
  vColor = instanceColor;

  gl_Position = projectionMatrix
              * viewMatrix
              * modelMatrix
              * instanceMatrix
              * vec4(position, 1.0);
}
