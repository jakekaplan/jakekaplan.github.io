precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
// Each texel holds (velocity.xy, displacement.xy), written by Flow.frag
uniform sampler2D u_flow;
// Where the pointer is and how hard it is pulling, both eased, in the same units as uv
uniform vec2 u_view;
uniform float u_pull;

const vec3 NIGHT = vec3(0.043, 0.055, 0.075);
const vec3 DEEP = vec3(0.09, 0.15, 0.34);
const vec3 SILVER = vec3(0.72, 0.80, 0.94);
const vec3 EMBER = vec3(0.95, 0.64, 0.36);
const vec3 ARC = vec3(0.50, 0.70, 1.0);

// Rotates and doubles the frequency between noise octaves
const mat2 OCTAVE = mat2(1.6, 1.2, -1.2, 1.6);

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = OCTAVE * p + 11.7;
    amplitude *= 0.5;
  }
  return value;
}

// Sparse points of light that drift upward and flicker
float motes(vec2 p, float t) {
  float glow = 0.0;
  for (int i = 0; i < 2; i++) {
    float layer = float(i);
    vec2 grid = p * (5.0 + 4.0 * layer) + 31.0 * layer;
    grid.y -= t * (0.5 + 0.3 * layer);
    vec2 cell = floor(grid);
    float seed = hash(cell);
    vec2 center = 0.5 + 0.3 * (vec2(hash(cell + 1.3), hash(cell + 7.1)) - 0.5);
    float flicker = 0.5 + 0.5 * sin(t * (4.0 + 9.0 * seed) + seed * 40.0);
    glow += step(0.86, seed) * flicker * smoothstep(0.05, 0.0, length(fract(grid) - center));
  }
  return glow;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
  float t = u_time * 0.05;

  // How far the pointer has turned the smoke here
  vec2 turn = texture2D(u_flow, gl_FragCoord.xy / u_resolution).zw;

  // The smoke rises toward the viewer under the pointer, and stays up for as long as it is still turned
  vec2 fromView = uv - u_view;
  float under = u_pull * exp(-dot(fromView, fromView) / 0.05);
  float lift = min(under + 0.6 * smoothstep(0.0, 0.12, length(turn)), 1.6);

  // The far layer barely answers the pointer. Each layer slides against the view by its own amount.
  // Noise warped by noise warped by noise, each drifting its own way.
  vec2 p = (uv + 0.3 * turn - 0.02 * u_view) * 1.8;
  vec2 q = vec2(fbm(p + vec2(0.0, 0.6 * t)), fbm(p + vec2(5.2, 1.3) - 0.5 * t));
  vec2 r = vec2(
    fbm(p + 3.2 * q + vec2(1.7, 9.2) + 0.35 * t),
    fbm(p + 3.2 * q + vec2(8.3, 2.8) - 0.3 * t)
  );
  float f = fbm(p + 3.0 * r);

  // Brightest behind the middle of the page, fading into the dark at the edges
  vec2 fromCenter = uv * vec2(0.7, 1.0);
  float focus = exp(-3.0 * dot(fromCenter, fromCenter));

  float veil = smoothstep(0.42, 0.88, f);
  float wisp = pow(1.0 - abs(2.0 * f - 1.0), 8.0);

  vec3 color = NIGHT;
  color += DEEP * veil * (0.06 + 0.7 * focus);
  color += SILVER * wisp * r.x * focus * 0.3;
  color += EMBER * wisp * smoothstep(0.5, 0.75, q.y) * focus * 0.22;

  color += mix(SILVER, EMBER, step(0.9, hash(floor(uv * 40.0))))
    * motes(uv + 0.6 * turn - 0.05 * u_view, t) * (0.1 + 0.45 * focus);

  // The near layer is thin smoke in front of everything else. It follows the pointer fully, and where
  // it rises it swells, thickens, hides what is behind it and catches the light along its strands.
  vec2 n = (uv + turn - 0.1 * u_view - 0.2 * under * fromView) * 1.7 + 40.0;
  vec2 w = vec2(fbm(n + vec2(0.0, 0.9 * t)), fbm(n + vec2(3.1, 7.4) - 0.7 * t));
  float g = fbm(n + 3.0 * w + 0.3 * t);
  float strand = pow(1.0 - abs(2.0 * g - 1.0), 6.0);
  float haze = 0.5 * smoothstep(0.35, 0.75, g) + 0.5 * strand;
  color = mix(
    color,
    NIGHT + (0.8 + 0.6 * lift) * DEEP + 0.14 * lift * strand * SILVER,
    haze * min(0.12 + 0.7 * lift, 0.9) * (0.4 + 0.6 * focus)
  );

  // Dither to keep the dark gradients from banding
  color += (hash(gl_FragCoord.xy + fract(u_time)) - 0.5) / 128.0;

  gl_FragColor = vec4(color, 1.0);
}
