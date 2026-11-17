/**
 * GLSL of the NL logo (src/components/nl/scene.ts). The monogram is the
 * reference render itself, wrapped onto a relief built from the same picture;
 * three data textures say, per pixel, the surface normal and height, which pen
 * stroke it belongs to and how far along it is, and the depth of that stroke.
 */

/** Shared by the relief and the card: the textures, the pen progress and the age of each pixel. */
export const COMMON = `
precision highp float;
uniform sampler2D uColor, uD1, uD2, uD3, uGlow;
uniform vec3 uP, uDur, uSoft;
uniform float uTime, uBloom, uHover, uIdle, uFloor, uRefl, uFade, uProf;
uniform vec2 uSweep, uMouse, uZr;
const vec2 SZ = vec2(768.0, 512.0);
const float ASPECT = 1.5;
float pick(vec3 v, float id){ return id < 0.5 ? v.x : (id < 1.5 ? v.y : v.z); }
vec3 tap(vec2 uv){ vec3 t = texture2D(uD2, uv).rgb; float s = (t.r * 65280.0 + t.g * 255.0) / 65535.0; float id = floor(t.b * 2.0 + 0.5); return vec3(pick(uP, id) - s, s, id); }
vec3 ageAt(vec2 uv){
  vec2 px = uv * SZ - 0.5; vec2 f = fract(px); vec2 b = (floor(px) + 0.5) / SZ; vec2 e = 1.0 / SZ;
  vec3 a = tap(b), b1 = tap(b + vec2(e.x, 0.0)), c = tap(b + vec2(0.0, e.y)), d = tap(b + e);
  float age = mix(mix(a.x, b1.x, f.x), mix(c.x, d.x, f.x), f.y);
  vec3 n = f.x < 0.5 ? (f.y < 0.5 ? a : c) : (f.y < 0.5 ? b1 : d);
  return vec3(age, n.y, n.z);
}
vec3 hueRot(vec3 c, float a){ const vec3 k = vec3(0.57735); float ca = cos(a), sa = sin(a); return c * ca + cross(k, c) * sa + k * dot(k, c) * (1.0 - ca); }
`

/** The relief: a grid lifted by the height texture, swelling up behind the pen. */
export const RELIEF_VERTEX =
    COMMON
    + `
uniform float uSide; varying vec2 vQ; varying vec3 vView;
void main(){
  vec2 q = vec2(uv.x, 1.0 - uv.y); vQ = q;
  float prof = texture2D(uD1, q).b, zb = mix(uZr.x, uZr.y, texture2D(uD3, q).r);
  vec3 t = tap(q); float ageS = max(t.x, 0.0) * pick(uDur, t.z);
  float grow = smoothstep(0.0, pick(uSoft, t.z) * 10.0, t.x);                                   // the metal swells up behind the pen
  float wob = 1.0 + 0.55 * exp(-ageS * 2.2) * sin(ageS * 8.0) + 1.5 * exp(-ageS * 7.0)                       // a fat bead of mercury rolls at the pen
            + uIdle * 0.16 * sin(q.x * 11.0 + q.y * 7.0 - uTime * 1.1) + uIdle * 0.08 * sin(q.x * 27.0 - q.y * 19.0 + uTime * 1.7);
  vec3 p = position; p.z = zb + uSide * prof * uProf * grow * wob;
  vec4 mv = modelViewMatrix * vec4(p, 1.0); vView = mv.xyz; gl_Position = projectionMatrix * mv;
}`

/** The metal: the reference colours, gloss, small rainbow glints, a moving key light. */
export const RELIEF_FRAGMENT =
    COMMON
    + `
uniform float uSide; uniform mat3 uNM; varying vec2 vQ; varying vec3 vView;
// a soft studio: an overhead box, two side strips and one thin streak
float env(vec3 r, float t){
  float e = smoothstep(0.44, 0.56, r.y + 0.12 * sin(r.x * 3.0 + t * 0.4)) * 0.95;          // sharp-edged boxes: a wet, polished surface shows them crisp
  e += smoothstep(0.83, 0.91, abs(r.x + 0.18 * sin(t * 0.33))) * 0.8;
  e += exp(-pow((r.y + 0.12 - 0.55 * r.x + 0.25 * sin(t * 0.27)) / 0.04, 2.0)) * 0.8;
  return e;
}
void main(){
  vec2 q = vQ;
  vec3 ag = ageAt(q); float s = ag.y, id = ag.z; float ageS = max(ag.x, 0.0) * pick(uDur, id);
  vec3 d1 = texture2D(uD1, q).rgb; vec2 n = d1.xy * 2.0 - 1.0; n *= smoothstep(0.02, 0.06, length(n));

  float wob = 0.0080 * exp(-ageS * 2.4) * sin(ageS * 9.0) + uIdle * 0.0007 * sin(q.x * 30.0 + q.y * 21.0 - uTime * 1.3);
  vec2 flow = vec2(sin(q.y * 17.0 + uTime * 0.9 + sin(q.x * 9.0 + uTime * 0.4)), cos(q.x * 14.0 - uTime * 0.7 + cos(q.y * 8.0))) * uIdle;   // the surface never quite stands still
  vec2 dm = (q - uMouse) * vec2(ASPECT, 1.0); float dl = length(dm);
  vec2 disp = n * wob + flow * 0.0007 + normalize(dm + 1e-5) / vec2(ASPECT, 1.0) * 0.0042 * sin(dl * 34.0 - uTime * 4.2) * exp(-dl * 5.0) * uHover;
  vec4 c = texture2D(uColor, q + disp);
  if (c.a < 0.004 || ag.x < 0.0) discard;

  // the iridescent edges drift
  // gloss: deeper blacks, cleaner whites
  { vec3 k = c.rgb / max(c.a, 1e-3); vec3 g = pow(mix(k, k * k * (3.0 - 2.0 * k), 0.6), vec3(1.08)) * 1.07; c.rgb = mix(k, g, smoothstep(0.35, 0.95, c.a)) * c.a; }
  float band = exp(-pow((q.x + (q.y - 0.5) * 0.3 - uSweep.x) / 0.05, 2.0)) * uSweep.y;
  float sat = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
  c.rgb = mix(c.rgb, hueRot(c.rgb, 0.6 * sin(uTime * 0.8 + q.y * 5.0 + q.x * 7.0)), smoothstep(0.06, 0.30, sat) * smoothstep(0.5, 0.95, c.a) * (0.3 + 0.7 * uIdle));

  // silver first: the rainbow survives only as small glints that wander over the metal and flare up under the passing light
  { float g1 = smoothstep(0.62, 0.95, 0.5 + 0.5 * sin(q.x * 9.0 + q.y * 6.0 + uTime * 0.55)), g2 = smoothstep(0.55, 0.95, 0.5 + 0.5 * sin(q.x * 5.0 - q.y * 11.0 - uTime * 0.4));
    float keep = clamp(0.10 + g1 * g2 * 0.75 + band * 0.45, 0.0, 1.0);
    float gray = dot(c.rgb, vec3(0.299, 0.587, 0.114)); c.rgb = mix(vec3(gray) * vec3(0.985, 0.995, 1.02), c.rgb, keep); }

  // live reflections: what the studio adds now, minus what the reference render already has baked in at rest
  vec2 nf = n + flow * 0.05 + normalize(dm + 1e-5) * 0.35 * sin(dl * 34.0 - uTime * 4.2) * exp(-dl * 5.0) * uHover;
  vec3 No = normalize(vec3(nf.x * 1.25, -nf.y * 1.25, max(0.22, 1.0 - dot(nf, nf)))) * vec3(1.0, 1.0, uSide);
  vec3 R = reflect(normalize(vView), normalize(uNM * No)), R0 = reflect(vec3(0.0, 0.0, -1.0), No * vec3(1.0, 1.0, uSide));
  float live = env(R, uTime) - env(R0, 0.0);
  c.rgb = max(c.rgb + vec3(1.0) * (max(live, 0.0) * 0.5 + min(live, 0.0) * 0.12) * c.a * (0.25 + 0.75 * uIdle), 0.0);   // add highlights, never a grey wash
  vec3 Ls = normalize(vec3(0.75 * sin(uTime * 0.55), 0.5 + 0.35 * cos(uTime * 0.41), 0.75));
  c.rgb += vec3(1.0) * (pow(max(dot(R, Ls), 0.0), 160.0) * 1.6 + pow(max(dot(R, normalize(vec3(-Ls.x, 0.6, 0.8))), 0.0), 220.0) * 1.2) * c.a * uIdle;   // small wet hot spots that travel

  // a key light drifting above the piece: the side that faces it brightens, the far side falls into shadow, the hot spot travels
  vec3 Lk = normalize(vec3(1.15 * sin(uTime * 0.32), 0.9 + 0.3 * sin(uTime * 0.21 + 1.3), 0.6 + 0.2 * cos(uTime * 0.27)));
  float facing = dot(normalize(uNM * No), Lk);
  c.rgb *= mix(1.0, 0.62 + 0.62 * smoothstep(-0.35, 0.85, facing), 0.7 * uIdle);
  float kspec = pow(max(dot(R, Lk), 0.0), 70.0), ksoft = smoothstep(0.80, 0.985, dot(R, Lk));
  c.rgb += vec3(1.0, 0.995, 0.985) * (kspec * 1.5 + ksoft * 0.22) * c.a * uIdle;

  // a band of light that crosses the piece
  c.rgb += (vec3(1.0, 0.985, 0.96) * (0.5 + 0.65 * No.z) + hueRot(vec3(0.55, 0.1, 0.0), q.y * 9.0 + uSweep.x * 6.0) * 0.22 * (1.0 - No.z)) * band * c.a;

  // white-hot just behind the pen
  c.rgb = mix(c.rgb, vec3(0.97, 0.985, 1.0) * c.a * 1.1, exp(-ageS * 9.0) * 0.6);
  if (uSide < 0.0) c.rgb *= 0.55;
  c *= smoothstep(0.0, pick(uSoft, id), ag.x) * uFade;
  if (c.a < 0.004) discard;
  gl_FragColor = vec4(c.rgb / c.a, c.a);                                   // straight alpha: coverage does the edge
}`

export const CARD_VERTEX = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`

/** Behind the relief: a soft halo, the glowing pen tips and the water reflection under the floor line. */
export const CARD_FRAGMENT =
    COMMON
    + `
uniform vec3 uTips[3]; uniform vec4 uRange; varying vec2 vUv;
void main(){
  vec2 p = vec2(mix(uRange.x, uRange.y, vUv.x), mix(uRange.w, uRange.z, vUv.y));
  float edge = smoothstep(0.0, 0.14, vUv.x) * smoothstep(1.0, 0.86, vUv.x) * smoothstep(0.0, 0.14, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
  float depth = p.y - uFloor; vec3 col = vec3(0.0); float a = 0.0, rmul = 1.0; vec2 pp = p;
  if (depth < 0.0) {
    vec3 t = tap(p); col = texture2D(uGlow, p).rgb * uBloom * smoothstep(-0.01, 0.03, t.x); col = mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, 0.2);
  } else {
    // dark still water: a crisp mirror right at the contact line, slow ripples breaking it up further out
    float z = sqrt(depth + 0.0015);
    float w1 = sin(z * 150.0 - uTime * 1.3 + p.x * 5.0), w2 = sin(z * 210.0 + uTime * 1.7 - p.x * 7.0), w3 = sin(z * 70.0 - uTime * 0.6 + p.x * 2.0);
    float w = w1 * 0.5 + w2 * 0.25 + w3 * 0.25;
    float amp = 0.0005 + depth * 0.032;
    vec2 q = vec2(p.x + w * amp, uFloor - depth * 1.08 - (w2 * 0.4 + w3 * 0.6) * amp * 0.6);
    q.y = min(q.y, uFloor - 0.001);
    vec4 acc = vec4(0.0); float sp = 0.0004 + depth * 0.010;
    for (int i = 0; i < 7; i++) { vec2 qq = q + vec2((float(i) - 3.0) * sp, (float(i) - 3.0) * sp * 0.9); vec3 t = tap(qq); acc += texture2D(uColor, qq) * smoothstep(0.0, pick(uSoft, t.z), t.x); }
    acc /= 7.0;
    float fade = exp(-depth * 3.2) * uRefl * smoothstep(0.0, 0.005, depth);
    float shimmer = 0.84 + 0.16 * w;
    col = acc.rgb * fade * 0.66 * shimmer; col = mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, 0.22); a = acc.a * fade * 0.5;
    // highlights catch the crests of the ripples; the key light leaves a long soft streak on the water
    float crest = pow(max(w3 * 0.6 + w1 * 0.4, 0.0), 3.0);
    col += vec3(1.0) * crest * acc.a * fade * 0.18;
    float lx = 0.5 + 0.48 * sin(uTime * 0.32);
    col += vec3(0.95, 0.97, 1.0) * exp(-pow((q.x - lx) / 0.07, 2.0)) * exp(-depth * 7.0) * (0.02 + acc.a * 0.35) * uRefl * smoothstep(0.0, 0.01, depth) * (0.8 + 0.2 * w2);
    vec3 t0 = tap(q); col += texture2D(uGlow, q).rgb * smoothstep(-0.01, 0.03, t0.x) * fade * 0.08;
    rmul = fade * 0.6; pp = q;
  }
  for (int i = 0; i < 3; i++) { vec2 dd = (pp - uTips[i].xy) * vec2(ASPECT, 1.0); col += vec3(0.93, 0.96, 1.0) * min(uTips[i].z * 0.00010 / (dot(dd, dd) + 0.00007), 1.6) * rmul; }
  gl_FragColor = vec4(col, a) * uFade * edge;
}`

/** Mercury beads thrown off the pen. */
export const DROP_VERTEX = `attribute float aSize; uniform float uPx; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = aSize * uPx / -mv.z; gl_Position = projectionMatrix * mv; }`

export const DROP_FRAGMENT = `uniform sampler2D uMap; uniform float uFade; void main(){ vec4 t = texture2D(uMap, gl_PointCoord); if (t.a < 0.02) discard; gl_FragColor = vec4(t.rgb, t.a * uFade); }`
