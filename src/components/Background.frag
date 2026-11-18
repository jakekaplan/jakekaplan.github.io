precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
// Each texel holds (velocity.xy, displacement.xy), written by Flow.frag
uniform sampler2D u_flow;

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

  // Where the pointer has stirred the smoke to, and how fast it is still moving
  vec4 flow = texture2D(u_flow, gl_FragCoord.xy / u_resolution);
  vec2 smoke = uv + flow.zw;
  float stir = smoothstep(0.0, 0.25, length(flow.xy));

  // Noise warped by noise warped by noise, each layer drifting its own way
  vec2 p = smoke * 1.8;
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

  // Smoke that is still moving lights up along the threads running through it
  float thread = pow(1.0 - abs(2.0 * f - 1.0), 24.0);
  color += DEEP * veil * stir * 0.6;
  color += ARC * thread * stir * 1.2;

  color += mix(SILVER, EMBER, step(0.9, hash(floor(uv * 40.0)))) * motes(smoke, t) * (0.1 + 0.45 * focus + stir);

  // Dither to keep the dark gradients from banding
  color += (hash(gl_FragCoord.xy + fract(u_time)) - 0.5) / 128.0;

  gl_FragColor = vec4(color, 1.0);
}
