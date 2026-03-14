if (!document.getElementById("dither-shader-defaults")) {
  const s = document.createElement("style");
  s.id = "dither-shader-defaults";
  s.textContent = `
:where(dither-shader) {
  position: absolute;
  inset: 0;
  display: block;
  pointer-events: none;
  z-index: -1;
}
:where(dither-shader > canvas) {
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
      "seed",
    ];
  }

  constructor() {
    super();
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

  get seed() {
    return parseFloat(this.getAttribute("seed")) || 0;
  }

  set seed(v) {
    this.setAttribute("seed", v);
    this._draw();
  }

  _parseColor(css) {
    if (!css) return [0, 0, 0, 0];
    try {
      const c = document.createElement("canvas");
      c.width = 1;
      c.height = 1;
      const ctx = c.getContext("2d");
      ctx.fillStyle = css;
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
uniform int mode;
uniform float dotSize;
uniform float rotation;
uniform float contrast;
uniform float brightness;
uniform float jitter;
uniform float warp;
uniform float warpScale;
uniform float blueNoise;
uniform float noiseScale;
uniform int noiseOctaves;
uniform float useHalftone;
uniform float seed; // looping seed

uniform vec4 fgColor;
uniform vec4 bgColor;

in vec2 vUv;
out vec4 fragColor;

float hash(vec2 p){
  float s = sin(seed * 6.2831853);
  float c = cos(seed * 6.2831853);
  p = fract(p*0.3183099 + 0.1 + vec2(s,c));
  p *= 17.0;
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

float halftone(vec2 px,float lum){
  vec2 cell = floor(px/dotSize);
  vec2 local = fract(px/dotSize)-0.5;
  float r = lum*0.5;
  float n = hash(cell);
  r *= 1.0+jitter*(n-0.5);
  float d = length(local);
  float aa = fwidth(d);
  return smoothstep(r,r-aa,d);
}

void main(){
  vec2 px = vUv*resolution;
  px = rot(radians(rotation))*px;

  float warpN = hash(floor(px*warpScale));
  px += warp*warpN*20.0;

  float lum = (mode==0)?fbm(vUv*noiseScale):hash(px*0.01);
  lum = (lum-0.5)*contrast + 0.5 + brightness;
  lum = clamp(lum,0.0,1.0);
  lum += blueNoise*(hash(px)-0.5);

  float stipple = step(hash(px*0.7193), lum);
  float dots = halftone(px, lum);
  float mask = mix(stipple, dots, useHalftone);

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

    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

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
      seed: u("seed"),
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
    const u = this._u;
    gl.useProgram(this.prog);

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
    gl.uniform1f(u.seed, this.seed % 1); // looping seed

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
