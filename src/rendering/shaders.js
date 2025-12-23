// Ported from ProjectedImageRenderer.kt and fragment_shader.glsl

export const OverlayVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const OverlayFragmentShader = `
  uniform sampler2D uTexture;
  uniform float uOpacity;
  uniform float uBrightness;
  uniform float uContrast;
  uniform float uSaturation;
  uniform vec3 uColorBalance;

  varying vec2 vUv;

  void main() {
    vec4 texColor = texture2D(uTexture, vUv);

    // Brightness (Additive or Multiplicative? Android code says: color.rgb *= u_ColorBalance)
    // The previous main.jsx had: brightnessMult = adjustments.brightness * 2; mesh.material.color.setRGB(...)
    // Let's implement full pipeline: Saturation -> Contrast -> Brightness -> Color Balance

    vec3 color = texColor.rgb;

    // 1. Saturation
    vec3 gray = vec3(dot(color, vec3(0.299, 0.587, 0.114)));
    color = mix(gray, color, uSaturation);

    // 2. Contrast
    color = (color - 0.5) * uContrast + 0.5;

    // 3. Brightness
    // Standard brightness is usually adding: color += uBrightness
    // But PWA prototype used multiplicative.
    // Let's use additive for "Brightness" as it makes more sense for "Brightness/Contrast" tools.
    // However, if the default is 0, additive is safe.
    color += uBrightness;

    // 4. Color Balance (Multiplicative)
    color *= uColorBalance;

    gl_FragColor = vec4(color, texColor.a * uOpacity);
  }
`;
