precision highp float;

// Each texel holds (velocity.xy, displacement.xy) in the same units as the background's uv
uniform sampler2D u_flow;
uniform vec2 u_resolution;
uniform float u_elapsed;
uniform vec2 u_pointer;
uniform vec2 u_previous;
uniform float u_puff;

const float RADIUS = 0.12;

void main() {
  float shortSide = min(u_resolution.x, u_resolution.y);
  vec2 texel = gl_FragCoord.xy / u_resolution;
  vec2 position = (gl_FragCoord.xy - 0.5 * u_resolution) / shortSide;

  // The flow carries itself along, so a push keeps travelling after the pointer has gone
  vec2 upstream = texel - texture2D(u_flow, texel).xy * u_elapsed * shortSide / u_resolution;
  vec4 flow = texture2D(u_flow, upstream);
  vec2 velocity = flow.xy * exp(-1.5 * u_elapsed);

  // The pointer pushes the smoke ahead of it and lets it curl back around the sides,
  // which is what leaves eddies instead of a straight smear
  vec2 motion = u_pointer - u_previous;
  vec2 fromPath = position - u_previous;
  fromPath -= motion * clamp(dot(fromPath, motion) / max(dot(motion, motion), 0.000001), 0.0, 1.0);
  float nearPath = exp(-dot(fromPath, fromPath) / (RADIUS * RADIUS));
  float side = motion.x * fromPath.y - motion.y * fromPath.x;
  vec2 push = motion + 1.2 * side * vec2(-fromPath.y, fromPath.x) / (RADIUS * RADIUS);
  float speed = length(motion) / u_elapsed;
  velocity += push * nearPath * (0.3 + 0.35 * min(speed, 3.0));

  // A press puffs the smoke outward
  vec2 fromPointer = position - u_pointer;
  velocity += 2.0 * u_puff * fromPointer * exp(-dot(fromPointer, fromPointer) / (4.0 * RADIUS * RADIUS));

  velocity *= min(1.0, 1.5 / max(length(velocity), 0.0001));

  // Displacement fades slowly so the smoke drifts back to rest over several seconds
  vec2 displacement = flow.zw * exp(-0.2 * u_elapsed) - velocity * u_elapsed;

  gl_FragColor = vec4(velocity, displacement);
}
