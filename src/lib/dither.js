if (!document.getElementById("dither-shader-defaults")) {
  const style = document.createElement("style");
  style.id = "dither-shader-defaults";
  style.textContent = `
:where(dither-shader){position:absolute;inset:0;display:block;pointer-events:none;z-index:-1}
:where(dither-shader>canvas){width:100%;height:100%;display:block}`.trim();
  document.head.appendChild(style);
}

let colorCanvas = null;
let colorContext = null;

function parseResolvedColor(css) {
  if (!css) return [0, 0, 0, 0];

  if (!colorCanvas) {
    colorCanvas = document.createElement("canvas");
    colorCanvas.width = colorCanvas.height = 1;
    colorContext = colorCanvas.getContext("2d", { willReadFrequently: true });
  }

  if (!colorContext) return [0, 0, 0, 0];

  try {
    colorContext.clearRect(0, 0, 1, 1);
    colorContext.fillStyle = "rgba(0, 0, 0, 0)";
    colorContext.fillStyle = css;
    colorContext.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = colorContext.getImageData(0, 0, 1, 1).data;
    return [r / 255, g / 255, b / 255, a / 255];
  } catch {
    return [0, 0, 0, 0];
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);

  if (!shader) throw new Error("Failed to create shader.");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;

  const info = gl.getShaderInfoLog(shader) || "Unknown shader compile error.";
  gl.deleteShader(shader);
  throw new Error(info);
}

function createProgram(gl, vertexSource, fragmentSource) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();

  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error("Failed to create shader program.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;

  const info = gl.getProgramInfoLog(program) || "Unknown program link error.";
  gl.deleteProgram(program);
  throw new Error(info);
}

const VERT = `#version 300 es
precision highp float;

layout(location = 0) in vec2 aPosition;

out vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;

uniform vec2 uRes;
uniform vec2 uPointer;
uniform vec4 uFgColor;
uniform vec4 uBgColor;
uniform float uTime;
uniform float uSeed;
uniform float uDotSize;
uniform float uDotSoftness;
uniform float uDotRoundness;
uniform float uDotGain;
uniform float uRotation;
uniform float uContrast;
uniform float uBrightness;
uniform float uDensity;
uniform float uJitter;
uniform float uWarp;
uniform float uWarpScale;
uniform float uBlueNoise;
uniform float uNoiseScale;
uniform float uFlowSpeed;
uniform float uFlowStrength;
uniform float uFlowAngle;
uniform float uMacroStrength;
uniform float uCellStrength;
uniform float uEdgeStrength;
uniform float uFineStrength;
uniform float uGateLow;
uniform float uGateHigh;
uniform float uCursorRadius;
uniform float uCursorStrength;
uniform float uCursorSoftness;
uniform float uPointerActive;
uniform float uNoiseMode;

in vec2 vUv;
out vec4 fragColor;

float saturate(float x) {
  return clamp(x, 0.0, 1.0);
}

mat2 rot(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33 + uSeed * 17.0);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
  float n = hash12(p);
  return vec2(n, hash12(p + n + 19.19));
}

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32 + uSeed * 11.0);
  return fract((p.x + p.y) * p.z);
}

vec3 hash33(vec3 p) {
  return vec3(
    hash13(p + vec3(1.0, 0.0, 0.0)),
    hash13(p + vec3(0.0, 1.0, 0.0)),
    hash13(p + vec3(0.0, 0.0, 1.0))
  );
}

float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);

  float n000 = hash13(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash13(i + vec3(1.0, 1.0, 1.0));

  float nx00 = mix(n000, n100, u.x);
  float nx10 = mix(n010, n110, u.x);
  float nx01 = mix(n001, n101, u.x);
  float nx11 = mix(n011, n111, u.x);
  float nxy0 = mix(nx00, nx10, u.y);
  float nxy1 = mix(nx01, nx11, u.y);

  return mix(nxy0, nxy1, u.z);
}

float fbm3(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;

  for (int i = 0; i < 3; i++) {
    value += noise3(p) * amplitude;
    p = p * 2.01 + vec3(7.3, -5.1, 3.7);
    amplitude *= 0.5;
  }

  return value;
}

vec2 turbulence2(vec3 p) {
  float t1 = fbm3(p + vec3(0.0, 0.0, 0.0));
  float t2 = fbm3(p + vec3(5.2, 1.3, 2.7));
  float t3 = fbm3(p + vec3(-3.8, 4.1, 6.4));
  float t4 = fbm3(p + vec3(7.7, -2.6, 3.9));

  return vec2(t1 - t2, t3 - t4);
}

float bayer4(vec2 cell) {
  vec2 p = mod(cell, 4.0);

  if (p.y < 0.5) {
    if (p.x < 0.5) return 0.0;
    if (p.x < 1.5) return 8.0;
    if (p.x < 2.5) return 2.0;
    return 10.0;
  }

  if (p.y < 1.5) {
    if (p.x < 0.5) return 12.0;
    if (p.x < 1.5) return 4.0;
    if (p.x < 2.5) return 14.0;
    return 6.0;
  }

  if (p.y < 2.5) {
    if (p.x < 0.5) return 3.0;
    if (p.x < 1.5) return 11.0;
    if (p.x < 2.5) return 1.0;
    return 9.0;
  }

  if (p.x < 0.5) return 15.0;
  if (p.x < 1.5) return 7.0;
  if (p.x < 2.5) return 13.0;
  return 5.0;
}

float blueThreshold(vec2 cell) {
  float center = hash12(cell + 101.7);
  float ring =
    hash12(cell + vec2(1.0, 0.0)) +
    hash12(cell + vec2(-1.0, 0.0)) +
    hash12(cell + vec2(0.0, 1.0)) +
    hash12(cell + vec2(0.0, -1.0)) +
    hash12(cell + vec2(1.0, 1.0)) +
    hash12(cell + vec2(-1.0, -1.0));
  float highpass = center - ring / 6.0;
  return fract(center + highpass * 0.85 + (bayer4(cell) + 0.5) / 16.0);
}

float cellEdge3(vec3 p) {
  vec3 base = floor(p);
  float nearest = 1e9;
  float secondNearest = 1e9;

  for (int z = -1; z <= 1; z++) {
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec3 offset = vec3(float(x), float(y), float(z));
        vec3 lattice = base + offset;
        vec3 feature = lattice + hash33(lattice) - 0.5;
        vec3 delta = feature - p;
        float dist = dot(delta, delta);

        if (dist < nearest) {
          secondNearest = nearest;
          nearest = dist;
        } else if (dist < secondNearest) {
          secondNearest = dist;
        }
      }
    }
  }

  return smoothstep(0.015, 0.11, secondNearest - nearest);
}

float gaborField3(vec3 p, vec2 dir) {
  vec3 base = floor(p);
  vec2 axis = normalize(dir + vec2(0.0001, 0.0));
  float sum = 0.0;
  float weight = 0.0;

  for (int z = 0; z <= 1; z++) {
    for (int y = 0; y <= 1; y++) {
      for (int x = 0; x <= 1; x++) {
        vec3 lattice = base + vec3(float(x), float(y), float(z));
        vec3 rnd = hash33(lattice + vec3(17.0, 29.0, 37.0));
        vec3 center = lattice + rnd - 0.5;
        vec3 delta = p - center;
        float envelope = max(
          0.0,
          1.0 - dot(delta.xy, delta.xy) * 1.8 - delta.z * delta.z * 1.3
        );
        envelope *= envelope;
        float frequency = mix(6.0, 11.0, rnd.z);
        float phase = dot(delta.xy, axis) * frequency + rnd.x * 6.2831853;
        sum += cos(phase) * envelope;
        weight += envelope;
      }
    }
  }

  return 0.5 + 0.5 * sum / max(weight, 0.0001);
}

void main() {
  vec2 screen = vUv * uRes;
  vec2 centered = screen - 0.5 * uRes;
  vec2 gridPx = rot(radians(uRotation)) * centered;
  float cellSize = max(uDotSize, 1.25);
  vec2 grid = gridPx / cellSize;
  vec2 cell = floor(grid);
  vec2 local = fract(grid) - 0.5;
  vec2 jitterSeed = hash22(cell + 13.7);

  local -= (jitterSeed - 0.5) * (uJitter * 0.08);

  vec2 flowDir = vec2(sin(radians(uFlowAngle)), -cos(radians(uFlowAngle)));
  vec2 flowNormal = vec2(-flowDir.y, flowDir.x);
  float scale = max(uNoiseScale, 0.001) * 0.055;
  vec3 domain = vec3(grid * scale, uTime * uFlowSpeed * 1.6 + uSeed * 11.0);
  vec2 warp = (hash22(floor(grid * max(uWarpScale * 40.0, 0.08)) + 71.3) - 0.5)
    * (uWarp * 0.025);
  vec2 turbulence = turbulence2(
    vec3(domain.xy * 1.25 + flowDir * domain.z * 0.24, domain.z * 0.92)
  );
  vec2 curlWarp = vec2(turbulence.y, -turbulence.x);

  domain.xy += flowDir * (uTime * uFlowStrength * 0.44);
  domain.xy += warp * 0.22;
  domain.xy += curlWarp * (0.32 * uFlowStrength);
  domain.xy += flowNormal * turbulence.x * (0.08 * uFlowStrength);

  float cellEdge = cellEdge3(domain * vec3(0.62, 0.62, 0.28));
  float gaborMain = gaborField3(
    vec3(domain.xy * 2.1 + vec2(4.1, -2.7), domain.z * 0.75),
    flowDir
  );
  float gaborFine = gaborField3(
    vec3(domain.xy * 4.2 + vec2(-6.3, 8.4), domain.z * 1.3 + 3.7),
    flowDir
  );
  float macroPerlin = fbm3(domain * vec3(0.24, 0.24, 0.1) + vec3(13.0, -9.0, 5.0));
  float macroMask = smoothstep(0.28, 0.72, macroPerlin);

  float gaborRidgeMain = 1.0 - abs(gaborMain * 2.0 - 1.0);
  float gaborRidgeFine = 1.0 - abs(gaborFine * 2.0 - 1.0);
  gaborRidgeMain = pow(saturate(gaborRidgeMain), 1.1);
  gaborRidgeFine = pow(saturate(gaborRidgeFine), 1.4);

  float density = mix(
    gaborRidgeMain,
    gaborRidgeMain * (1.0 - saturate(uFineStrength)) +
      gaborRidgeFine * saturate(uFineStrength),
    uNoiseMode
  );
  density += (macroMask - 0.5) * (uMacroStrength * 0.24);
  density += (cellEdge - 0.5) * (uCellStrength * 0.14);
  density += cellEdge * uEdgeStrength;
  density = clamp(
    (density - 0.5) * uContrast + 0.5 + uBrightness + uDensity * 1.6 - 0.08,
    0.0,
    1.0
  );
  density = smoothstep(min(uGateLow, uGateHigh), max(uGateLow, uGateHigh), density);

  if (uPointerActive > 0.0) {
    float radius = max(uCursorRadius, 1.0);
    float edge = radius * max(uCursorSoftness, 1.0);
    float influence = 1.0 - smoothstep(radius, edge, distance(screen, uPointer));
    density *= 1.0 - influence * uCursorStrength * uPointerActive;
  }

  float circular = length(local);
  float square = max(abs(local.x), abs(local.y));
  float shapeDist = mix(square, circular, saturate(uDotRoundness));
  float ordered = (bayer4(cell) + 0.5) / 16.0;
  float threshold = mix(ordered, blueThreshold(cell), saturate(uBlueNoise));
  threshold = mix(threshold, threshold * 0.42 + 0.36, saturate(uBlueNoise));
  float dotEnabled = step(threshold, density);
  float radius = clamp(
    (0.04 + density * 0.28) * uDotGain * dotEnabled
      * (1.0 + (jitterSeed.x - 0.5) * uJitter * 0.18),
    0.0,
    0.495
  );
  float softness = max(fwidth(shapeDist) * (1.0 + uDotSoftness * 2.5), 0.0008);
  float mask = 1.0 - smoothstep(radius - softness, radius + softness, shapeDist);
  float sparkle = 0.82 + 0.18 * hash12(cell + 41.0);
  float dotAlpha = mask * dotEnabled * max(uFgColor.a, 0.75);
  vec3 dotColor = clamp(uFgColor.rgb * (0.95 + density * 0.5) * sparkle, 0.0, 1.0);

  fragColor = vec4(
    mix(uBgColor.rgb, dotColor, dotAlpha),
    max(uBgColor.a, dotAlpha)
  );
}`;

class DitherShader extends HTMLElement {
  static observedAttributes = [
    "animate",
    "background",
    "blue-noise",
    "brightness",
    "cell-strength",
    "color",
    "contrast",
    "cursor",
    "cursor-radius",
    "cursor-softness",
    "cursor-strength",
    "density",
    "dot-roundness",
    "dot-size",
    "dot-softness",
    "falloff",
    "fine-strength",
    "flow-angle",
    "flow-speed",
    "flow-strength",
    "gate-high",
    "gate-low",
    "halftone",
    "jitter",
    "macro-strength",
    "max-dpr",
    "mode",
    "noise-octaves",
    "noise-scale",
    "rotation",
    "seed",
    "speed",
    "warp",
    "warp-scale",
  ];

  constructor() {
    super();

    this.canvas = null;
    this.gl = null;
    this.prog = null;
    this.vao = null;
    this._u = null;
    this._ro = null;
    this._colorProbe = null;
    this._pointerQuery = null;
    this._pointerListening = false;
    this._visibilityListening = false;
    this._dirty = true;
    this._rafPending = false;
    this._loopActive = false;
    this._animRaf = 0;
    this._lastFrameTime = null;
    this._elapsed = 0;
    this._pixelRatio = 1;
    this._pointerEnabled = false;
    this._pointerX = 0;
    this._pointerY = 0;
    this._pointerActive = 0;
    this._pointerTargetX = 0;
    this._pointerTargetY = 0;
    this._pointerTargetActive = 0;
    this._colorsDirty = true;
    this._paramsDirty = true;
    this._fgColor = new Float32Array([0, 0, 0, 1]);
    this._bgColor = new Float32Array([0, 0, 0, 0]);
    this._params = {
      blueNoise: 0.55,
      brightness: 0,
      cellStrength: -0.085,
      contrast: 1.5,
      cursorRadius: 180,
      cursorSoftness: 1.75,
      cursorStrength: 0.8,
      density: -0.015,
      dotGain: 1.15,
      dotRoundness: 1,
      dotSize: 3.2,
      dotSoftness: 0.35,
      edgeStrength: 0.155,
      fineStrength: 0.68,
      flowAngle: 24,
      flowSpeed: 0.1,
      flowStrength: 0.65,
      gateHigh: 0.765,
      gateLow: 0.66,
      jitter: 0.2,
      macroStrength: 0.525,
      noiseMode: 1,
      noiseScale: 3.4,
      rotation: 32,
      seed: 0,
      warp: 18,
      warpScale: 0.002,
    };

    this._tick = this._tick.bind(this);
    this._onVisibilityChange = this._onVisibilityChange.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerLeave = this._onPointerLeave.bind(this);
    this._onPointerOut = this._onPointerOut.bind(this);
    this._onPointerCapabilityChange =
      this._onPointerCapabilityChange.bind(this);
  }

  connectedCallback() {
    const parent = this.parentElement;
    if (parent && getComputedStyle(parent).isolation !== "isolate") {
      parent.style.isolation = "isolate";
    }

    this._ensureDom();
    this._ensureGL();

    if (!this.gl || !this.prog) return;

    if (!this._ro) {
      this._ro = new ResizeObserver(() => {
        this._dirty = true;
        this._schedule();
      });
    }

    this._ro.observe(this);

    if (!this._visibilityListening) {
      document.addEventListener("visibilitychange", this._onVisibilityChange);
      this._visibilityListening = true;
    }

    this._installPointerHandling();
    this._colorsDirty = true;
    this._dirty = true;

    if (this._flag("animate")) this._startLoop();
    else this._schedule();
  }

  disconnectedCallback() {
    this._ro?.disconnect();
    this._removePointerListeners();
    this._pointerEnabled = false;

    if (this._pointerQuery) {
      if (this._pointerQuery.removeEventListener) {
        this._pointerQuery.removeEventListener(
          "change",
          this._onPointerCapabilityChange,
        );
      } else {
        this._pointerQuery.removeListener(this._onPointerCapabilityChange);
      }

      this._pointerQuery = null;
    }

    if (this._visibilityListening) {
      document.removeEventListener(
        "visibilitychange",
        this._onVisibilityChange,
      );
      this._visibilityListening = false;
    }

    this._stopLoop(false);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (name === "color" || name === "background") {
      this._colorsDirty = true;
    }

    this._paramsDirty = true;

    if (name === "cursor") {
      this._installPointerHandling();
    }

    if (name === "animate") {
      if (!this.isConnected) return;
      if (this._flag("animate")) this._startLoop();
      else this._stopLoop();
      return;
    }

    this._dirty = true;
    if (!this._loopActive) this._schedule();
  }

  _ensureDom() {
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
      this.canvas.setAttribute("aria-hidden", "true");
      this.appendChild(this.canvas);
    }

    if (!this._colorProbe) {
      this._colorProbe = document.createElement("span");
      this._colorProbe.setAttribute("aria-hidden", "true");
      this._colorProbe.style.cssText = [
        "position:absolute",
        "inset:auto auto 0 0",
        "width:0",
        "height:0",
        "overflow:hidden",
        "visibility:hidden",
        "pointer-events:none",
      ].join(";");
      this.appendChild(this._colorProbe);
    }
  }

  _ensureGL() {
    if (this.gl) return;

    this.gl = this.canvas?.getContext("webgl2", {
      alpha: true,
      antialias: false,
      depth: false,
      desynchronized: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
      stencil: false,
    });

    if (!this.gl) return;

    try {
      this.prog = createProgram(this.gl, VERT, FRAG);
    } catch (error) {
      console.error("[dither-shader] Shader setup failed:", error);
      this.gl = null;
      this.prog = null;
      return;
    }

    this.vao = this.gl.createVertexArray();
    this.vbo = this.gl.createBuffer();

    this.gl.bindVertexArray(this.vao);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      this.gl.STATIC_DRAW,
    );
    this.gl.enableVertexAttribArray(0);
    this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.bindVertexArray(null);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    const uniform = (name) => this.gl.getUniformLocation(this.prog, name);
    this._u = {
      bgColor: uniform("uBgColor"),
      blueNoise: uniform("uBlueNoise"),
      brightness: uniform("uBrightness"),
      contrast: uniform("uContrast"),
      cursorRadius: uniform("uCursorRadius"),
      cursorSoftness: uniform("uCursorSoftness"),
      cursorStrength: uniform("uCursorStrength"),
      cellStrength: uniform("uCellStrength"),
      density: uniform("uDensity"),
      dotGain: uniform("uDotGain"),
      dotRoundness: uniform("uDotRoundness"),
      dotSize: uniform("uDotSize"),
      dotSoftness: uniform("uDotSoftness"),
      edgeStrength: uniform("uEdgeStrength"),
      fineStrength: uniform("uFineStrength"),
      fgColor: uniform("uFgColor"),
      flowAngle: uniform("uFlowAngle"),
      flowSpeed: uniform("uFlowSpeed"),
      flowStrength: uniform("uFlowStrength"),
      gateHigh: uniform("uGateHigh"),
      gateLow: uniform("uGateLow"),
      jitter: uniform("uJitter"),
      macroStrength: uniform("uMacroStrength"),
      noiseMode: uniform("uNoiseMode"),
      noiseScale: uniform("uNoiseScale"),
      pointer: uniform("uPointer"),
      pointerActive: uniform("uPointerActive"),
      res: uniform("uRes"),
      rotation: uniform("uRotation"),
      seed: uniform("uSeed"),
      time: uniform("uTime"),
      warp: uniform("uWarp"),
      warpScale: uniform("uWarpScale"),
    };
  }

  _flag(name, fallback = false) {
    const value = this.getAttribute(name);
    if (value == null) return fallback;
    if (value === "") return true;
    return !/^(0|false|no|off)$/i.test(value);
  }

  _number(name, fallback) {
    const raw = this.getAttribute(name);
    if (raw == null || raw === "") return fallback;
    const value = Number.parseFloat(raw);
    return Number.isFinite(value) ? value : fallback;
  }

  _resolveColor(value, fallback) {
    if (!this._colorProbe) return parseResolvedColor(value || fallback);

    this._colorProbe.style.color = fallback;
    this._colorProbe.style.color = value || fallback;
    return parseResolvedColor(getComputedStyle(this._colorProbe).color);
  }

  _updateColors() {
    if (!this._colorsDirty) return;

    this._fgColor = new Float32Array(
      this._resolveColor(this.getAttribute("color"), "currentColor"),
    );
    this._bgColor = new Float32Array(
      this._resolveColor(this.getAttribute("background"), "rgba(0, 0, 0, 0)"),
    );
    this._colorsDirty = false;
  }

  _updateParams() {
    if (!this._paramsDirty) return;

    const legacySpeed = this._number("speed", 0.00000015);
    const flowSpeed = this.hasAttribute("flow-speed")
      ? this._number("flow-speed", 0.045)
      : legacySpeed * 300000;

    this._params = {
      blueNoise: clamp(this._number("blue-noise", 0.55), 0, 1),
      brightness: this._number("brightness", 0),
      cellStrength: clamp(this._number("cell-strength", -0.085), -0.5, 0.5),
      contrast: Math.max(0, this._number("contrast", 1.5)),
      cursorRadius: Math.max(1, this._number("cursor-radius", 0)),
      cursorSoftness: Math.max(1, this._number("cursor-softness", 0)),
      cursorStrength: clamp(this._number("cursor-strength", 0.0), 0, 1.5),
      density: this._number("density", -0.015),
      dotGain: Math.max(0, this._number("halftone", 1.15)),
      dotRoundness: clamp(this._number("dot-roundness", 1), 0, 1),
      dotSize: Math.max(1.25, this._number("dot-size", 3.2)),
      dotSoftness: clamp(this._number("dot-softness", 0.35), 0, 2),
      edgeStrength: clamp(this._number("edge-strength", 0.155), 0, 0.5),
      fineStrength: clamp(this._number("fine-strength", 0.68), 0, 1),
      flowAngle: this._number("flow-angle", 24),
      flowSpeed: Math.max(0, flowSpeed),
      flowStrength: Math.max(0, this._number("flow-strength", 0.65)),
      gateHigh: clamp(this._number("gate-high", 0.765), 0, 1),
      gateLow: clamp(this._number("gate-low", 0.66), 0, 1),
      jitter: Math.max(0, this._number("jitter", 0.2)),
      macroStrength: clamp(this._number("macro-strength", 0.525), 0, 1),
      noiseMode: this.getAttribute("mode") === "grid" ? 0 : 1,
      noiseScale: Math.max(0.001, this._number("noise-scale", 3.4)),
      rotation: this._number("rotation", 32),
      seed: this._number("seed", 0),
      warp: Math.max(0, this._number("warp", 18)),
      warpScale: Math.max(0.0001, this._number("warp-scale", 0.002)),
    };

    this._paramsDirty = false;
  }

  _schedule() {
    if (this._rafPending || this._loopActive) return;

    this._rafPending = true;
    requestAnimationFrame(() => {
      this._rafPending = false;
      this._draw();
    });
  }

  _tick(now) {
    if (!this._loopActive) return;

    if (this._lastFrameTime == null) this._lastFrameTime = now;

    const dt = Math.min((now - this._lastFrameTime) / 1000, 0.05);
    this._lastFrameTime = now;
    this._elapsed += dt;
    this._stepPointer(dt);
    this._dirty = true;
    this._draw();
    this._animRaf = requestAnimationFrame(this._tick);
  }

  _startLoop() {
    if (this._loopActive || document.hidden || !this.gl || !this.prog) return;

    this._loopActive = true;
    this._lastFrameTime = null;
    this._animRaf = requestAnimationFrame(this._tick);
  }

  _stopLoop(redraw = true) {
    if (this._animRaf) cancelAnimationFrame(this._animRaf);

    this._loopActive = false;
    this._animRaf = 0;
    this._lastFrameTime = null;

    if (redraw && this.isConnected) {
      this._dirty = true;
      this._schedule();
    }
  }

  _onVisibilityChange() {
    if (document.hidden) {
      this._stopLoop(false);
      return;
    }

    if (this._flag("animate")) this._startLoop();
    else this._schedule();
  }

  _installPointerHandling() {
    if (!window.matchMedia) return;

    if (!this._pointerQuery) {
      this._pointerQuery = window.matchMedia(
        "(hover: hover) and (pointer: fine)",
      );

      if (this._pointerQuery.addEventListener) {
        this._pointerQuery.addEventListener(
          "change",
          this._onPointerCapabilityChange,
        );
      } else {
        this._pointerQuery.addListener(this._onPointerCapabilityChange);
      }
    }

    const enabled = this._flag("cursor", true) && this._pointerQuery.matches;

    this._pointerEnabled = enabled;

    if (enabled) {
      if (this._pointerListening) return;

      window.addEventListener("pointermove", this._onPointerMove, {
        passive: true,
      });
      window.addEventListener("pointerout", this._onPointerOut);
      window.addEventListener("blur", this._onPointerLeave);
      this._pointerListening = true;
    } else {
      this._removePointerListeners();
      this._pointerActive = 0;
      this._pointerTargetActive = 0;
      this._dirty = true;
      if (!this._loopActive) this._schedule();
    }
  }

  _removePointerListeners() {
    if (!this._pointerListening) return;

    window.removeEventListener("pointermove", this._onPointerMove);
    window.removeEventListener("pointerout", this._onPointerOut);
    window.removeEventListener("blur", this._onPointerLeave);
    this._pointerListening = false;
  }

  _onPointerCapabilityChange() {
    this._installPointerHandling();
    this._dirty = true;
    if (!this._loopActive) this._schedule();
  }

  _onPointerMove(event) {
    if (!this._pointerEnabled || !this.canvas) return;

    const rect = this.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    this._pointerTargetX = clamp(
      (event.clientX - rect.left) * this._pixelRatio,
      0,
      rect.width * this._pixelRatio,
    );
    this._pointerTargetY = clamp(
      (rect.bottom - event.clientY) * this._pixelRatio,
      0,
      rect.height * this._pixelRatio,
    );
    this._pointerTargetActive = 1;

    if (!this._loopActive) {
      this._pointerX = this._pointerTargetX;
      this._pointerY = this._pointerTargetY;
      this._pointerActive = 1;
      this._dirty = true;
      this._schedule();
    }
  }

  _onPointerLeave() {
    this._pointerTargetActive = 0;

    if (!this._loopActive) {
      this._pointerActive = 0;
      this._dirty = true;
      this._schedule();
    }
  }

  _onPointerOut(event) {
    if (event.relatedTarget == null) this._onPointerLeave();
  }

  _stepPointer(dt) {
    if (!this._pointerEnabled) {
      this._pointerActive = 0;
      return;
    }

    const mix = 1 - Math.exp(-dt * 7);
    this._pointerX += (this._pointerTargetX - this._pointerX) * mix;
    this._pointerY += (this._pointerTargetY - this._pointerY) * mix;
    this._pointerActive +=
      (this._pointerTargetActive - this._pointerActive) * mix;

    if (Math.abs(this._pointerTargetX - this._pointerX) < 0.01) {
      this._pointerX = this._pointerTargetX;
    }

    if (Math.abs(this._pointerTargetY - this._pointerY) < 0.01) {
      this._pointerY = this._pointerTargetY;
    }

    if (Math.abs(this._pointerTargetActive - this._pointerActive) < 0.001) {
      this._pointerActive = this._pointerTargetActive;
    }
  }

  _resize() {
    if (!this.canvas || !this.gl) return;

    const defaultCap = this._pointerEnabled ? 2 : 1.5;
    const dprCap = Math.max(1, this._number("max-dpr", defaultCap));
    const nextPixelRatio = Math.min(window.devicePixelRatio || 1, dprCap);
    const width = Math.max(1, Math.round(this.clientWidth * nextPixelRatio));
    const height = Math.max(1, Math.round(this.clientHeight * nextPixelRatio));

    this._pixelRatio = nextPixelRatio;

    if (this.canvas.width === width && this.canvas.height === height) return;

    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
  }

  _draw() {
    if (!this._dirty || !this.gl || !this.prog || !this._u) return;

    this._dirty = false;
    this._resize();
    this._updateColors();
    this._updateParams();

    const width = this.canvas?.width || 0;
    const height = this.canvas?.height || 0;

    if (!width || !height) return;

    const gl = this.gl;
    const u = this._u;
    const p = this._params;

    gl.useProgram(this.prog);
    gl.bindVertexArray(this.vao);
    gl.uniform2f(u.res, width, height);
    gl.uniform2f(u.pointer, this._pointerX, this._pointerY);
    gl.uniform4fv(u.fgColor, this._fgColor);
    gl.uniform4fv(u.bgColor, this._bgColor);
    gl.uniform1f(u.time, this._elapsed);
    gl.uniform1f(u.seed, p.seed);
    gl.uniform1f(u.dotSize, p.dotSize);
    gl.uniform1f(u.dotSoftness, p.dotSoftness);
    gl.uniform1f(u.dotRoundness, p.dotRoundness);
    gl.uniform1f(u.dotGain, p.dotGain);
    gl.uniform1f(u.rotation, p.rotation);
    gl.uniform1f(u.contrast, p.contrast);
    gl.uniform1f(u.brightness, p.brightness);
    gl.uniform1f(u.density, p.density);
    gl.uniform1f(u.jitter, p.jitter);
    gl.uniform1f(u.macroStrength, p.macroStrength);
    gl.uniform1f(u.cellStrength, p.cellStrength);
    gl.uniform1f(u.edgeStrength, p.edgeStrength);
    gl.uniform1f(u.fineStrength, p.fineStrength);
    gl.uniform1f(u.gateLow, p.gateLow);
    gl.uniform1f(u.gateHigh, p.gateHigh);
    gl.uniform1f(u.warp, p.warp);
    gl.uniform1f(u.warpScale, p.warpScale);
    gl.uniform1f(u.blueNoise, p.blueNoise);
    gl.uniform1f(u.noiseScale, p.noiseScale);
    gl.uniform1f(u.flowSpeed, p.flowSpeed);
    gl.uniform1f(u.flowStrength, p.flowStrength);
    gl.uniform1f(u.flowAngle, p.flowAngle);
    gl.uniform1f(u.cursorRadius, p.cursorRadius * this._pixelRatio);
    gl.uniform1f(u.cursorStrength, p.cursorStrength);
    gl.uniform1f(u.cursorSoftness, p.cursorSoftness);
    gl.uniform1f(u.pointerActive, clamp(this._pointerActive, 0, 1));
    gl.uniform1f(u.noiseMode, p.noiseMode);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

if (!customElements.get("dither-shader")) {
  customElements.define("dither-shader", DitherShader);
}
