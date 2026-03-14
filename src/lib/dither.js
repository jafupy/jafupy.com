/**
 * <dither-shader> — WebGL2 halftone dithering overlay
 *
 * A zero-dependency custom element that renders a GPU-accelerated halftone
 * dither pattern over its host area. Supports two noise modes (fbm / random),
 * full CSS colour theming, and fine-grained control over dot appearance.
 *
 * @element dither-shader
 *
 * ─── COLOUR ─────────────────────────────────────────────────────────────────
 *
 * @attr {CSSColor} color
 *   Foreground (dot) colour. Accepts any valid CSS colour string.
 *   Default: #000000
 *   Examples: "red", "#ff6600", "hsl(200 80% 50%)", "rgba(0,0,0,0.5)"
 *
 * @attr {CSSColor} background
 *   Background (gap) colour. Accepts any valid CSS colour string.
 *   Default: transparent (rgba(0,0,0,0))
 *   Examples: "white", "#f5f0e8", "oklch(95% 0.02 90)"
 *
 * @attr {number} halftone
 *   Blend between smooth stipple dithering (0) and structured halftone dot
 *   grid (1). At 0, luminance is thresholded against random noise — no cell
 *   structure, no contour artifacts. Intermediate values mix both.
 *   Default: 1
 *
 * ─── PATTERN ─────────────────────────────────────────────────────────────────
 *
 * @attr {"noise"|"random"} mode
 *   Pattern generation mode.
 *   - "noise"  — smooth fbm noise (default)
 *   - "random" — fully random per-pixel hash
 *   Default: "noise"
 *
 * @attr {number} dot-size
 *   Halftone cell size in pixels. Larger = bigger dots.
 *   Default: 6
 *
 * @attr {number} rotation
 *   Rotation of the halftone grid in degrees.
 *   Default: 0
 *
 * @attr {number} contrast
 *   Contrast multiplier applied to the noise luminance.
 *   Default: 1
 *
 * @attr {number} brightness
 *   Brightness offset applied after contrast. Range: roughly -1 to 1.
 *   Default: 0
 *
 * ─── DISTORTION ──────────────────────────────────────────────────────────────
 *
 * @attr {number} jitter
 *   Per-cell size jitter. Adds organic variance to dot radii.
 *   Default: 0
 *
 * @attr {number} warp
 *   Domain-warp strength. Displaces the grid before sampling.
 *   Default: 0
 *
 * @attr {number} warp-scale
 *   Frequency of the warp noise. Higher = finer warp.
 *   Default: 0.002
 *
 * @attr {number} blue-noise
 *   Amount of blue-noise dither added on top of the pattern.
 *   Default: 0
 *
 * ─── NOISE TUNING ────────────────────────────────────────────────────────────
 *
 * @attr {number} noise-scale
 *   Zoom / frequency of the fbm noise. Higher = more zoomed in.
 *   Default: 3
 *
 * @attr {number} noise-octaves
 *   Number of fbm octaves (1–6). More = more detail, slightly slower.
 *   Default: 4
 *
 * ─── USAGE ───────────────────────────────────────────────────────────────────
 *
 * Basic overlay (black dots on transparent):
 *   <dither-shader></dither-shader>
 *
 * Cream dots on dark background:
 *   <dither-shader color="#f5f0e8" background="#1a1a1a"></dither-shader>
 *
 * Tinted noise with warp:
 *   <dither-shader
 *     color="hsl(30 90% 55%)"
 *     background="hsl(220 20% 10%)"
 *     dot-size="8"
 *     warp="1.5"
 *     noise-octaves="6">
 *   </dither-shader>
 *
 * ─── NOTES ───────────────────────────────────────────────────────────────────
 *
 * - Requires WebGL2. No fallback is provided.
 * - Default styles (position, inset, pointer-events) are injected as a
 *   low-specificity stylesheet so they can be freely overridden by external CSS.
 *   The default z-index is -1, so all sibling content renders above the shader
 *   without any extra configuration. Override with z-index in your own CSS to
 *   layer the shader above specific elements.
 * - Colour parsing uses an offscreen <canvas> and reads back a single pixel,
 *   so any colour the browser can parse (including oklch, color-mix, etc.) works.
 */

// Inject default styles once per document, at low specificity, so external
// CSS (including z-index) always wins via the normal cascade.
if (!document.getElementById("dither-shader-defaults")) {
  const s = document.createElement("style");
  s.id = "dither-shader-defaults";
  s.textContent = `
dither-shader {
  position: absolute;
  inset: 0;
  display: block;
  pointer-events: none;
  z-index: -1;
}
dither-shader > canvas {
  width: 100%;
  height: 100%;
  display: block;
}
  `.trim();
  document.head.appendChild(s);
}
class DitherShader extends HTMLElement {
  static get observedAttributes() {
    return [
      "mode",
      "color",
      "background",
      "dot-size",
      "rotation",
      "contrast",
      "brightness",
      "jitter",
      "warp",
      "warp-scale",
      "blue-noise",
      "noise-scale",
      "noise-octaves",
      "halftone",
    ];
  }

  constructor() {
    super();
    // Light DOM — no shadow root
  }

  connectedCallback() {
    const p = this.parentElement;
    if (p && getComputedStyle(p).isolation !== "isolate") {
      p.style.isolation = "isolate";
    }

    this.canvas = document.createElement("canvas");
    this.appendChild(this.canvas);

    this.gl = this.canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
    });
    this._init();

    this._ro = new ResizeObserver(() => {
      this._dirty = true;
      this._draw();
    });
    this._ro.observe(this);
  }

  disconnectedCallback() {
    this._ro?.disconnect();
  }

  attributeChangedCallback() {
    this._dirty = true;
    this._draw();
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  /**
   * Parse any CSS colour string → [r, g, b, a] in 0–1 range.
   * Falls back to [0, 0, 0, 0] for invalid / missing values.
   *
   * @param {string|null} css
   * @returns {[number,number,number,number]}
   */
  _parseColor(css) {
    if (!css) return [0, 0, 0, 0];
    try {
      const c = document.createElement("canvas");
      c.width = 1;
      c.height = 1;
      const ctx = c.getContext("2d");
      ctx.fillStyle = css; // browser normalises the colour
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      return [r / 255, g / 255, b / 255, a / 255];
    } catch {
      return [0, 0, 0, 0];
    }
  }

  _getAttr(n, d) {
    return parseFloat(this.getAttribute(n) ?? d);
  }

  _init() {
    const gl = this.gl;

    const vert = `#version 300 es
precision highp float;

const vec2 pos[3]=vec2[](
  vec2(-1.0,-1.0),
  vec2( 3.0,-1.0),
  vec2(-1.0, 3.0)
);

out vec2 vUv;

void main(){
  vec2 p=pos[gl_VertexID];
  vUv=(p+1.0)*0.5;
  gl_Position=vec4(p,0,1);
}`;

    const frag = `#version 300 es
precision highp float;

uniform vec2 resolution;
uniform int  mode;

uniform float dotSize;
uniform float rotation;
uniform float contrast;
uniform float brightness;
uniform float jitter;
uniform float warp;
uniform float warpScale;
uniform float blueNoise;
uniform float noiseScale;
uniform int   noiseOctaves;
uniform float useHalftone;

// ── Colour ──
uniform vec4 fgColor;   // dot colour
uniform vec4 bgColor;   // background colour

in  vec2 vUv;
out vec4 fragColor;

float hash(vec2 p){
  p=fract(p*0.3183099+.1);
  p*=17.0;
  return fract(p.x*p.y*(p.x+p.y));
}

float noise(vec2 p){
  vec2 i=floor(p);
  vec2 f=fract(p);
  float a=hash(i);
  float b=hash(i+vec2(1,0));
  float c=hash(i+vec2(0,1));
  float d=hash(i+vec2(1,1));
  vec2 u=f*f*(3.0-2.0*f);
  return mix(a,b,u.x)+(c-a)*u.y*(1.0-u.x)+(d-b)*u.x*u.y;
}

float fbm(vec2 p){
  float v=0.0,a=0.5;
  for(int i=0;i<6;i++){
    if(i>=noiseOctaves) break;
    v+=noise(p)*a;
    p*=2.0;
    a*=0.5;
  }
  return v;
}

mat2 rot(float a){
  float s=sin(a),c=cos(a);
  return mat2(c,-s,s,c);
}

float halftone(vec2 px, float lum){
  vec2  cell  = floor(px/dotSize);
  vec2  local = fract(px/dotSize)-0.5;
  float r     = lum*0.5;
  float n     = hash(cell);
  r          *= 1.0+jitter*(n-0.5);
  float d     = length(local);
  float aa    = fwidth(d);
  return smoothstep(r,r-aa,d);
}

void main(){
  vec2 px = vUv*resolution;
  px = rot(radians(rotation))*px;

  float warpN = hash(floor(px*warpScale));
  px += warp*warpN*20.0;

  float lum = (mode==0) ? fbm(vUv*noiseScale) : hash(px*0.01);

  lum = (lum-0.5)*contrast+0.5+brightness;
  lum = clamp(lum,0.0,1.0);
  lum += blueNoise*(hash(px)-0.5);

  // 0 = random stipple dither (no contours), 1 = structured halftone grid
  float stipple  = step(hash(px * 0.7193), lum);
  float dots     = halftone(px, lum);
  float mask     = mix(stipple, dots, useHalftone);

  // Blend background → foreground using dot mask
  fragColor = mix(bgColor, fgColor, mask);
}`;

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    this.prog = gl.createProgram();
    gl.attachShader(this.prog, compile(gl.VERTEX_SHADER, vert));
    gl.attachShader(this.prog, compile(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(this.prog);

    // Bind a VAO to silence the "attrib 0 not enabled" warning.
    // The shader uses gl_VertexID only, but WebGL requires attrib 0
    // to be array-enabled to avoid expensive software emulation on desktop GL.
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Cache uniform locations — getUniformLocation is not free
    const u = (name) => gl.getUniformLocation(this.prog, name);
    this._u = {
      resolution: u("resolution"),
      mode: u("mode"),
      dotSize: u("dotSize"),
      rotation: u("rotation"),
      contrast: u("contrast"),
      brightness: u("brightness"),
      jitter: u("jitter"),
      warp: u("warp"),
      warpScale: u("warpScale"),
      blueNoise: u("blueNoise"),
      noiseScale: u("noiseScale"),
      noiseOctaves: u("noiseOctaves"),
      useHalftone: u("useHalftone"),
      fgColor: u("fgColor"),
      bgColor: u("bgColor"),
    };

    this._dirty = true;
    this._draw();
  }

  _resize() {
    const dpr = devicePixelRatio;
    const w = this.clientWidth * dpr;
    const h = this.clientHeight * dpr;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.gl.viewport(0, 0, w, h);
      this._dirty = true;
    }
  }

  _draw() {
    if (!this._dirty || !this.prog) return;
    this._dirty = false;

    this._resize();

    const gl = this.gl;
    const prog = this.prog;
    const u = this._u;
    gl.useProgram(prog);

    gl.uniform2f(u.resolution, this.canvas.width, this.canvas.height);
    gl.uniform1i(u.mode, this.getAttribute("mode") === "noise" ? 0 : 1);
    gl.uniform1f(u.dotSize, this._getAttr("dot-size", 6));
    gl.uniform1f(u.rotation, this._getAttr("rotation", 0));
    gl.uniform1f(u.contrast, this._getAttr("contrast", 1));
    gl.uniform1f(u.brightness, this._getAttr("brightness", 0));
    gl.uniform1f(u.jitter, this._getAttr("jitter", 0));
    gl.uniform1f(u.warp, this._getAttr("warp", 0));
    gl.uniform1f(u.warpScale, this._getAttr("warp-scale", 0.002));
    gl.uniform1f(u.blueNoise, this._getAttr("blue-noise", 0));
    gl.uniform1f(u.noiseScale, this._getAttr("noise-scale", 3));
    gl.uniform1i(u.noiseOctaves, this._getAttr("noise-octaves", 4));
    gl.uniform1f(u.useHalftone, this._getAttr("halftone", 1));

    const fg = this._parseColor(this.getAttribute("color") ?? "#000000");
    const bg = this._parseColor(
      this.getAttribute("background") ?? "rgba(0,0,0,0)",
    );
    gl.uniform4fv(u.fgColor, fg);
    gl.uniform4fv(u.bgColor, bg);

    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

customElements.define("dither-shader", DitherShader);
