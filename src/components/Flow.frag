precision highp float;

// Each texel holds (velocity.xy, displacement.xy) in the same units as the background's uv
uniform sampler2D u_flow;
uniform vec2 u_resolution;
uniform float u_elapsed;
uniform vec2 u_pointer;
uniform vec2 u_previous;
uniform float u_pull;
// Which way the smoke turns, from -1 (clockwise) to 1
uniform float u_spin;

const float RADIUS = 0.16;

void main() {
  float shortSide = min(u_resolution.x, u_resolution.y);
  vec2 texel = gl_FragCoord.xy / u_resolution;
  vec2 position = (gl_FragCoord.xy - 0.5 * u_resolution) / shortSide;

  // The flow carries itself along, so the smoke keeps turning for a while after the pointer has gone
  vec2 upstream = texel - texture2D(u_flow, texel).xy * u_elapsed * shortSide / u_resolution;
  vec4 flow = texture2D(u_flow, upstream);
  vec2 velocity = flow.xy * exp(-1.5 * u_elapsed);

  // The smoke circles the pointer and spreads away from it, which reads as swelling toward the viewer.
  // It is fastest a little way out and still at the very centre.
  vec2 fromPointer = (position - u_pointer) / RADIUS;
  vec2 around = vec2(-fromPointer.y, fromPointer.x);
  velocity += u_pull * (0.2 * u_spin * around + 0.035 * fromPointer) * exp(-dot(fromPointer, fromPointer)) * u_elapsed;

  // A fast sweep also throws the smoke along the path the pointer just travelled
  vec2 motion = u_pointer - u_previous;
  vec2 fromPath = position - u_previous;
  fromPath -= motion * clamp(dot(fromPath, motion) / max(dot(motion, motion), 0.000001), 0.0, 1.0);
  float speed = length(motion) / max(u_elapsed, 0.001);
  velocity += 2.0 * motion * smoothstep(0.8, 2.5, speed) * exp(-4.0 * dot(fromPath, fromPath) / (RADIUS * RADIUS));
  velocity *= min(1.0, 1.5 / max(length(velocity), 0.0001));

  // Displacement fades so the smoke unwinds once it is left alone
  vec2 displacement = flow.zw * exp(-0.5 * u_elapsed) - velocity * u_elapsed;

  gl_FragColor = vec4(velocity, displacement);
}
