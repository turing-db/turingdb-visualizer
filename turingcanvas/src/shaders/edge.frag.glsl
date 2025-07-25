varying vec3 vColor;
varying vec2 vUv;
varying vec2 vScale;

uniform float uOpacity;

void main() {
    vec2 uv = vUv;
    uv.x = 1.0 - uv.x;
    uv.y = 1.0 - uv.y;
    vec2 normalizedUv = vUv * 2.0 - 1.0;
    
    const float relHeadSize = 1.0;
    const float relPadding = 0.2;
    const float relStemThickness = 0.23;

    float headSize = relHeadSize / vScale.x * vScale.y;
    float padding = relPadding / vScale.x;
    float stemThickness = relStemThickness;
    float stemEnding = 1.0 - headSize - padding;
    
    // Check if we're in the arrow stem
    bool inStem = abs(normalizedUv.y) < stemThickness && uv.x < stemEnding;
    
    bool inHeadSquare = uv.x >= stemEnding && uv.x < 1.0 - padding;

    float factor = (1.0 - padding - uv.x) / headSize;
    bool inHead = inHeadSquare && abs(normalizedUv.y) < factor;
    
    if (inStem || inHead) {
        gl_FragColor = vec4(vColor, uOpacity);
    } else {
        discard;
    }
}
