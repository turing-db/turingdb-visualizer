varying vec3 vColor;
varying vec2 vUv;
varying vec2 vScale;

uniform float uOpacity;

void main() {
    vec2 uv = vUv;
    uv.x = 1.0 - uv.x;

    // Map vUv [0,1]^2 → normalized [-1,1] on Y so the stem is symmetric
    // around the horizontal midline.
    float ny = vUv.y * 2.0 - 1.0;

    const float relHeadSize = 0.85;
    const float relPadding = 0.15;
    const float relStemThickness = 0.14;

    // Aspect-correct scalar sizes along the edge's local x (length) axis.
    float headSize = relHeadSize / vScale.x * vScale.y;
    float padding = relPadding / vScale.x;
    float stemThickness = relStemThickness;
    float stemEnding = 1.0 - headSize - padding;

    // Feather width along x in uv units, calibrated to ~0.5 world units on screen.
    float xFeather = min(0.5 / max(vScale.x, 0.001), 0.04);
    float yFeather = 0.12;

    // Stem: antialiased horizontal bar; tapers at its far (head) end.
    float stemAlongX = smoothstep(stemEnding + xFeather, stemEnding - xFeather, uv.x);
    float stemAlongY = 1.0 - smoothstep(
        stemThickness - yFeather,
        stemThickness + yFeather,
        abs(ny)
    );
    float stem = stemAlongX * stemAlongY;

    // Arrow head: triangle collapsing to a point at the tip.
    float headRun = (1.0 - padding - uv.x) / headSize; // 0 at base, 1 at tip
    float headInX = smoothstep(-xFeather, xFeather, headRun)
        * smoothstep(1.0 + xFeather, 1.0 - xFeather, headRun);
    float headInY = 1.0 - smoothstep(
        max(headRun - yFeather, 0.0),
        max(headRun + yFeather, 0.001),
        abs(ny)
    );
    float head = headInX * headInY;

    float alpha = max(stem, head);
    if (alpha <= 0.001) discard;
    gl_FragColor = vec4(vColor, alpha * uOpacity);
}
