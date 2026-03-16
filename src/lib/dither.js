if (!document.getElementById("dither-shader-defaults")) {
  const s = document.createElement("style");
  s.id = "dither-shader-defaults";
  s.textContent = `
:where(dither-shader){position:absolute;inset:0;display:block;pointer-events:none;z-index:-1}
:where(dither-shader>canvas){width:100%;height:100%;display:block}`.trim();
  document.head.appendChild(s);
}

// ── Shared 1×1 canvas for CSS colour parsing (one per page, not per element) ──
let _cc, _cx;
function parseColor(css) {
  if (!css) return [0, 0, 0, 0];
  if (!_cc) {
    _cc = document.createElement("canvas");
    _cc.width = _cc.height = 1;
    _cx = _cc.getContext("2d");
  }
  try {
    _cx.clearRect(0, 0, 1, 1);
    _cx.fillStyle = css;
    _cx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = _cx.getImageData(0, 0, 1, 1).data;
    return [r / 255, g / 255, b / 255, a / 255];
  } catch {
    return [0, 0, 0, 0];
  }
}

// ── Shaders ────────────────────────────────────────────────────────────────────
const VERT = `#version 300 es
precision highp float;
const vec2 POS[3]=vec2[](vec2(-1,-1),vec2(3,-1),vec2(-1,3));
out vec2 vUv;
void main(){vec2 p=POS[gl_VertexID];vUv=(p+1.)*0.5;gl_Position=vec4(p,0,1);}`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2  res;
uniform int   mode, noiseOctaves;
uniform float dotSize, rotation, contrast, brightness,
              jitter, warp, warpScale, blueNoise,
              noiseScale, useHalftone, seed;
uniform vec4  fgColor, bgColor;
in  vec2 vUv;
out vec4 fragColor;

float hash(vec2 p) {
  // seed rotates the lattice — loops cleanly every integer step of seed
  float s=sin(seed*6.2831853), c=cos(seed*6.2831853);
  p = fract(p*0.3183099 + 0.1 + vec2(s,c));
  p *= 17.;
  return fract(p.x*p.y*(p.x+p.y));
}
float noise(vec2 p) {
  vec2 i=floor(p), f=fract(p), u=f*f*(3.-2.*f);
  return mix(mix(hash(i),         hash(i+vec2(1,0)), u.x),
             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v=0., a=.5;
  for(int i=0;i<6;i++){if(i>=noiseOctaves)break; v+=noise(p)*a; p*=2.; a*=.5;}
  return v;
}
mat2 rot(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}

float halftone(vec2 px, float lum) {
  vec2 cell=floor(px/dotSize), local=fract(px/dotSize)-.5;
  float r = lum*0.5 * (1. + jitter*(hash(cell)-.5));
  float d = length(local);
  return smoothstep(r, r-fwidth(d), d);   // single fwidth call
}

void main() {
  vec2 px = rot(radians(rotation)) * (vUv*res);
  px += warp * hash(floor(px*warpScale)) * 20.;

  float lum = (mode==0) ? fbm(vUv*noiseScale) : hash(px*.01);
  lum = clamp((lum-.5)*contrast + .5 + brightness, 0., 1.)
      + blueNoise*(hash(px)-.5);

  float mask = mix(step(hash(px*.7193), lum), halftone(px,lum), useHalftone);
  fragColor = mix(bgColor, fgColor, mask);
}`;

// ── Custom element ─────────────────────────────────────────────────────────────
class DitherShader extends HTMLElement {
  static observedAttributes = [
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
    "seed",
    "animate",
    "speed", // ← new: drives the built-in animation loop
  ];

  connectedCallback() {
    const p = this.parentElement;
    if (p && getComputedStyle(p).isolation !== "isolate")
      p.style.isolation = "isolate";

    this.canvas = document.createElement("canvas");
    this.appendChild(this.canvas);
    this.gl = this.canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
    });

    // State
    this._dirty = true;
    this._rafPending = false;
    this._animRaf = null;
    this._animTime = null;
    this._animSeed = parseFloat(this.getAttribute("seed")) || 0;
    this._colorsDirty = true;
    this._fgColor = null;
    this._bgColor = null;

    this._initGL();

    this._ro = new ResizeObserver(() => {
      this._dirty = true;
      this._schedule();
    });
    this._ro.observe(this);

    this._onVisibility = () => {
      if (document.hidden) this._stopLoop();
      else if (this.hasAttribute("animate")) this._startLoop();
    };
    document.addEventListener("visibilitychange", this._onVisibility);

    if (this.hasAttribute("animate")) this._startLoop();
    else this._schedule();
  }

  disconnectedCallback() {
    this._ro?.disconnect();
    this._stopLoop();
    document.removeEventListener("visibilitychange", this._onVisibility);
  }

  attributeChangedCallback(name) {
    if (name === "color" || name === "background") this._colorsDirty = true;

    if (name === "animate") {
      this.hasAttribute("animate") ? this._startLoop() : this._stopLoop();
      return;
    }

    this._dirty = true;
    if (!this._animRaf) this._schedule(); // don't double-schedule during loop
  }

  // ── Scheduling ──────────────────────────────────────────────────────────────

  _schedule() {
    if (this._rafPending) return;
    this._rafPending = true;
    requestAnimationFrame(() => {
      this._rafPending = false;
      this._draw();
    });
  }

  _startLoop() {
    if (this._animRaf) return;
    this._animTime = null;
    const loop = (t) => {
      if (!this._animRaf) return;
      if (this._animTime === null) this._animTime = t;
      const dt = (t - this._animTime) / 1000;
      this._animTime = t;
      const speed = parseFloat(this.getAttribute("speed") ?? 1);
      // Accumulate fractionally — stays in [0,1) for precision; loops seamlessly
      // because the shader maps seed → sin/cos(seed·2π)
      this._animSeed = (this._animSeed + dt * speed) % 1;
      this._dirty = true;
      this._draw();
      this._animRaf = requestAnimationFrame(loop);
    };
    this._animRaf = requestAnimationFrame(loop);
  }

  _stopLoop() {
    if (!this._animRaf) return;
    cancelAnimationFrame(this._animRaf);
    this._animRaf = null;
    this._animTime = null;
    this._dirty = true;
    this._schedule();
  }

  // ── WebGL setup ─────────────────────────────────────────────────────────────

  _initGL() {
    const gl = this.gl;

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    this.prog = gl.createProgram();
    gl.attachShader(this.prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(this.prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(this.prog);

    // Empty VAO — gl_VertexID needs no actual vertex buffer
    this.vao = gl.createVertexArray();

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const u = (n) => gl.getUniformLocation(this.prog, n);
    this._u = {
      res: u("res"),
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
      seed: u("seed"),
    };
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  _g(n, d) {
    return parseFloat(this.getAttribute(n) ?? d);
  }

  _resize() {
    const dpr = devicePixelRatio;
    const w = (this.clientWidth * dpr) | 0;
    const h = (this.clientHeight * dpr) | 0;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.gl.viewport(0, 0, w, h);
    }
  }

  _draw() {
    if (!this._dirty || !this.prog) return;
    this._dirty = false;
    this._resize();

    // Only re-parse colours when an attribute actually changed
    if (this._colorsDirty) {
      this._fgColor = parseColor(this.getAttribute("color") ?? "#000000");
      this._bgColor = parseColor(
        this.getAttribute("background") ?? "rgba(0,0,0,0)",
      );
      this._colorsDirty = false;
    }

    const gl = this.gl,
      u = this._u;
    gl.useProgram(this.prog);

    const seed = this._animRaf ? this._animSeed : this._g("seed", 0) % 1;

    gl.uniform2f(u.res, this.canvas.width, this.canvas.height);
    gl.uniform1i(u.mode, this.getAttribute("mode") === "noise" ? 0 : 1);
    gl.uniform1f(u.dotSize, this._g("dot-size", 6));
    gl.uniform1f(u.rotation, this._g("rotation", 0));
    gl.uniform1f(u.contrast, this._g("contrast", 1));
    gl.uniform1f(u.brightness, this._g("brightness", 0));
    gl.uniform1f(u.jitter, this._g("jitter", 0));
    gl.uniform1f(u.warp, this._g("warp", 0));
    gl.uniform1f(u.warpScale, this._g("warp-scale", 0.002));
    gl.uniform1f(u.blueNoise, this._g("blue-noise", 0));
    gl.uniform1f(u.noiseScale, this._g("noise-scale", 3));
    gl.uniform1i(u.noiseOctaves, this._g("noise-octaves", 4));
    gl.uniform1f(u.useHalftone, this._g("halftone", 1));
    gl.uniform1f(u.seed, seed);
    gl.uniform4fv(u.fgColor, this._fgColor);
    gl.uniform4fv(u.bgColor, this._bgColor);

    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

customElements.define("dither-shader", DitherShader);
