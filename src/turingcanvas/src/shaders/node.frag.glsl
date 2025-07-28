uniform float uOpacity;
uniform float uHasOutline;
varying vec3 vColor;
varying vec2 vUv;

const vec2 OCTAGON_DIAGONAL = vec2(0.70710678, 0.70710678);
const float glowSize = 0.91;
const float outlineWidth = 0.07;
const float separation = 0.1;
const float glowOpacity = 0.09;

float octDistance(in vec2 p, in float size) {
    // Rotate the point by 22.5 degrees to align the edges orthogonally to the 22.5-degree axes
    p = abs(p);
    p = mat2(0.92388, 0.38268, -0.38268, 0.92388) * p; // Rotate by 22.5 degrees

    // Calculate the distance to the nearest edge of the octagon
    float d1 = p.x - size;
    float d2 = p.y - size;
    float d3 = (p.x + p.y) * 0.7071 - size; // Diagonal distance

    // Return the maximum of these distances
    return max(max(d1, d2), d3);
}

void main() {
  // Normalize quad coordinates
  vec2 uv = vUv * 2.0 - 1.0;
  float octSize = 0.56;

  if (uHasOutline > 0.5) {
    // Compute distance from oct
    const float sizeModifier = separation + outlineWidth;
    octSize = octSize - sizeModifier;
    float octDist = octDistance(uv, octSize);

    if (octDist > 0.02 && octDist < sizeModifier + 0.02) {
      // Draw outline pixel
      float outlineDist1 = octDistance(uv, octSize + separation);
      float outlineDist2 = octDistance(uv, octSize + sizeModifier);
      float v1 = 1.0 - smoothstep(0.0, 0.02, outlineDist1);
      float v2 = 1.0 - smoothstep(0.0, 0.02, outlineDist2);
      gl_FragColor = vec4(vColor, (v2 - v1) * uOpacity);
    } else if (octDist > 0.02) {
      // Draw glow
      float glowDist = octDistance(uv, glowSize);
      float v1 = smoothstep(0.02, 0.0, octDist);
      float v2 = smoothstep(0.02, 0.0, glowDist);
      gl_FragColor = vec4(vColor, (v2 - v1) * glowOpacity * uOpacity);
    } else {
      // Draw octagon pixel
      float alpha = smoothstep(0.02, 0.0, octDist);
      gl_FragColor = vec4(vColor, alpha * uOpacity);
    }
  } else {
    // Compute distance from oct
    float octDist = octDistance(uv, octSize);

    if (octDist > 0.02) {
      // Draw octagon pixel
      float glowDist = octDistance(uv, glowSize);
      float v1 = smoothstep(0.02, 0.0, octDist);
      float v2 = smoothstep(0.02, 0.0, glowDist);
      gl_FragColor = vec4(vColor, (v2 - v1) * glowOpacity * uOpacity);
    } else {
      // Draw octagon pixel
      float alpha = smoothstep(0.02, 0.0, octDist * uOpacity);
      gl_FragColor = vec4(vColor, alpha * uOpacity);
    }
  }
}
