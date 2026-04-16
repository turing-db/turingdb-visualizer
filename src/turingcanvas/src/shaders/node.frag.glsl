uniform float uOpacity;
uniform float uHasOutline;
uniform float uShape;
varying vec3 vColor;
varying vec2 vUv;
varying vec2 vHalfExtents;

const float glowSize = 0.91;
const float outlineWidth = 0.07;
const float separation = 0.1;
const float glowOpacity = 0.09;
const float edgeFeather = 0.02;

const float rectCornerRadius = 0.09;
const float rectBorderHalf = 0.016;
const float rectBodyMargin = 0.2;
const float rectFeather = 0.008;
const float rectFillAlpha = 0.18;
const float rectFillSelectedAlpha = 0.42;
const float rectBorderAlpha = 1.0;

float octDistance(in vec2 p, in float size) {
    p = abs(p);
    p = mat2(0.92388, 0.38268, -0.38268, 0.92388) * p;
    float d1 = p.x - size;
    float d2 = p.y - size;
    float d3 = (p.x + p.y) * 0.7071 - size;
    return max(max(d1, d2), d3);
}

float roundRectDistance(in vec2 p, in vec2 halfExtents, in float r) {
    vec2 d = abs(p) - halfExtents + vec2(r);
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
}

void renderOctagon() {
    vec2 uv = vUv * 2.0 - 1.0;
    float shapeSize = 0.56;

    if (uHasOutline > 0.5) {
        float sizeModifier = separation + outlineWidth;
        shapeSize = shapeSize - sizeModifier;
        float d = octDistance(uv, shapeSize);

        if (d > edgeFeather && d < sizeModifier + edgeFeather) {
            float o1 = octDistance(uv, shapeSize + separation);
            float o2 = octDistance(uv, shapeSize + sizeModifier);
            float v1 = 1.0 - smoothstep(0.0, edgeFeather, o1);
            float v2 = 1.0 - smoothstep(0.0, edgeFeather, o2);
            gl_FragColor = vec4(vColor, (v2 - v1) * uOpacity);
        } else if (d > edgeFeather) {
            float gd = octDistance(uv, glowSize);
            float v1 = smoothstep(edgeFeather, 0.0, d);
            float v2 = smoothstep(edgeFeather, 0.0, gd);
            gl_FragColor = vec4(vColor, (v2 - v1) * glowOpacity * uOpacity);
        } else {
            float alpha = smoothstep(edgeFeather, 0.0, d);
            gl_FragColor = vec4(vColor, alpha * uOpacity);
        }
    } else {
        float d = octDistance(uv, shapeSize);

        if (d > edgeFeather) {
            float gd = octDistance(uv, glowSize);
            float v1 = smoothstep(edgeFeather, 0.0, d);
            float v2 = smoothstep(edgeFeather, 0.0, gd);
            gl_FragColor = vec4(vColor, (v2 - v1) * glowOpacity * uOpacity);
        } else {
            float alpha = smoothstep(edgeFeather, 0.0, d * uOpacity);
            gl_FragColor = vec4(vColor, alpha * uOpacity);
        }
    }
}

void renderRoundedRect() {
    vec2 pos = (vUv * 2.0 - 1.0) * vHalfExtents;

    // Rect body fills most of the plane, reserving a gutter for the selection ring.
    vec2 bodyHalf = max(vHalfExtents - vec2(rectBodyMargin), vec2(0.02));
    float bodyRadius = min(rectCornerRadius, min(bodyHalf.x, bodyHalf.y));
    float d = roundRectDistance(pos, bodyHalf, bodyRadius);

    float selected = step(0.5, uHasOutline);
    float fillA = mix(rectFillAlpha, rectFillSelectedAlpha, selected);
    float borderThickness = rectBorderHalf;

    // Interior fill (translucent body color) — fills inside the border's inner edge.
    float interiorMask = smoothstep(rectFeather, -rectFeather, d + borderThickness);
    float fillAlpha = fillA * interiorMask;

    // Border ring centered on the rect edge — sharp like D3.
    float borderMask = 1.0
        - smoothstep(borderThickness - rectFeather, borderThickness + rectFeather, abs(d));
    float borderAlpha = rectBorderAlpha * borderMask;

    float alpha = max(fillAlpha, borderAlpha);

    // On selection, draw an outer ring outside the body for the selected state.
    if (selected > 0.5) {
        float ringInner = borderThickness + separation;
        float ringOuter = ringInner + outlineWidth;
        float selMask = smoothstep(ringOuter + rectFeather, ringOuter - rectFeather, d)
            * smoothstep(ringInner - rectFeather, ringInner + rectFeather, d);
        alpha = max(alpha, selMask);
    }

    if (alpha <= 0.001) discard;
    gl_FragColor = vec4(vColor, alpha * uOpacity);
}

void main() {
    if (uShape > 0.5) {
        renderRoundedRect();
    } else {
        renderOctagon();
    }
}
