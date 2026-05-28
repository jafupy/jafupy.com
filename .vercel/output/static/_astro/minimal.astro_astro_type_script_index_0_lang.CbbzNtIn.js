import{g as _}from"./index.DDlvirwQ.js";if(!document.getElementById("dither-shader-defaults")){const r=document.createElement("style");r.id="dither-shader-defaults",r.textContent=`
:where(dither-shader){position:absolute;inset:0;display:block;pointer-events:none;z-index:-1}
:where(dither-shader>canvas){width:100%;height:100%;display:block}`.trim(),document.head.appendChild(r)}let u=null,l=null;function b(r){if(!r)return[0,0,0,0];if(u||(u=document.createElement("canvas"),u.width=u.height=1,l=u.getContext("2d",{willReadFrequently:!0})),!l)return[0,0,0,0];try{l.clearRect(0,0,1,1),l.fillStyle="rgba(0, 0, 0, 0)",l.fillStyle=r,l.fillRect(0,0,1,1);const[t,o,e,i]=l.getImageData(0,0,1,1).data;return[t/255,o/255,e/255,i/255]}catch{return[0,0,0,0]}}function s(r,t,o){return Math.min(o,Math.max(t,r))}function w(r,t,o){const e=r.createShader(t);if(!e)throw new Error("Failed to create shader.");if(r.shaderSource(e,o),r.compileShader(e),r.getShaderParameter(e,r.COMPILE_STATUS))return e;const i=r.getShaderInfoLog(e)||"Unknown shader compile error.";throw r.deleteShader(e),new Error(i)}function L(r,t,o){const e=w(r,r.VERTEX_SHADER,t),i=w(r,r.FRAGMENT_SHADER,o),n=r.createProgram();if(!n)throw r.deleteShader(e),r.deleteShader(i),new Error("Failed to create shader program.");if(r.attachShader(n,e),r.attachShader(n,i),r.linkProgram(n),r.deleteShader(e),r.deleteShader(i),r.getProgramParameter(n,r.LINK_STATUS))return n;const a=r.getProgramInfoLog(n)||"Unknown program link error.";throw r.deleteProgram(n),new Error(a)}const F=`#version 300 es
precision highp float;

layout(location = 0) in vec2 aPosition;

out vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`,E=`#version 300 es
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
}`;class M extends HTMLElement{static observedAttributes=["animate","background","blue-noise","brightness","cell-strength","color","contrast","cursor","cursor-radius","cursor-softness","cursor-strength","density","dot-roundness","dot-size","dot-softness","falloff","fine-strength","flow-angle","flow-speed","flow-strength","gate-high","gate-low","halftone","jitter","macro-strength","max-dpr","mode","noise-octaves","noise-scale","rotation","seed","speed","warp","warp-scale"];constructor(){super(),this.canvas=null,this.gl=null,this.prog=null,this.vao=null,this._u=null,this._ro=null,this._colorProbe=null,this._pointerQuery=null,this._pointerListening=!1,this._visibilityListening=!1,this._dirty=!0,this._rafPending=!1,this._loopActive=!1,this._animRaf=0,this._lastFrameTime=null,this._elapsed=0,this._pixelRatio=1,this._pointerEnabled=!1,this._pointerX=0,this._pointerY=0,this._pointerActive=0,this._pointerTargetX=0,this._pointerTargetY=0,this._pointerTargetActive=0,this._colorsDirty=!0,this._paramsDirty=!0,this._fgColor=new Float32Array([0,0,0,1]),this._bgColor=new Float32Array([0,0,0,0]),this._params={blueNoise:.55,brightness:0,cellStrength:-.085,contrast:1.5,cursorRadius:180,cursorSoftness:1.75,cursorStrength:.8,density:-.015,dotGain:1.15,dotRoundness:1,dotSize:3.2,dotSoftness:.35,edgeStrength:.155,fineStrength:.68,flowAngle:24,flowSpeed:.1,flowStrength:.65,gateHigh:.765,gateLow:.66,jitter:.2,macroStrength:.525,noiseMode:1,noiseScale:3.4,rotation:32,seed:0,warp:18,warpScale:.002},this._tick=this._tick.bind(this),this._onVisibilityChange=this._onVisibilityChange.bind(this),this._onPointerMove=this._onPointerMove.bind(this),this._onPointerLeave=this._onPointerLeave.bind(this),this._onPointerOut=this._onPointerOut.bind(this),this._onPointerCapabilityChange=this._onPointerCapabilityChange.bind(this)}connectedCallback(){const t=this.parentElement;t&&getComputedStyle(t).isolation!=="isolate"&&(t.style.isolation="isolate"),this._ensureDom(),this._ensureGL(),!(!this.gl||!this.prog)&&(this._ro||(this._ro=new ResizeObserver(()=>{this._dirty=!0,this._schedule()})),this._ro.observe(this),this._visibilityListening||(document.addEventListener("visibilitychange",this._onVisibilityChange),this._visibilityListening=!0),this._installPointerHandling(),this._colorsDirty=!0,this._dirty=!0,this._flag("animate")?this._startLoop():this._schedule())}disconnectedCallback(){this._ro?.disconnect(),this._removePointerListeners(),this._pointerEnabled=!1,this._pointerQuery&&(this._pointerQuery.removeEventListener?this._pointerQuery.removeEventListener("change",this._onPointerCapabilityChange):this._pointerQuery.removeListener(this._onPointerCapabilityChange),this._pointerQuery=null),this._visibilityListening&&(document.removeEventListener("visibilitychange",this._onVisibilityChange),this._visibilityListening=!1),this._stopLoop(!1)}attributeChangedCallback(t,o,e){if(o!==e){if((t==="color"||t==="background")&&(this._colorsDirty=!0),this._paramsDirty=!0,t==="cursor"&&this._installPointerHandling(),t==="animate"){if(!this.isConnected)return;this._flag("animate")?this._startLoop():this._stopLoop();return}this._dirty=!0,this._loopActive||this._schedule()}}_ensureDom(){this.canvas||(this.canvas=document.createElement("canvas"),this.canvas.setAttribute("aria-hidden","true"),this.appendChild(this.canvas)),this._colorProbe||(this._colorProbe=document.createElement("span"),this._colorProbe.setAttribute("aria-hidden","true"),this._colorProbe.style.cssText=["position:absolute","inset:auto auto 0 0","width:0","height:0","overflow:hidden","visibility:hidden","pointer-events:none"].join(";"),this.appendChild(this._colorProbe))}_ensureGL(){if(this.gl||(this.gl=this.canvas?.getContext("webgl2",{alpha:!0,antialias:!1,depth:!1,desynchronized:!0,powerPreference:"high-performance",preserveDrawingBuffer:!1,stencil:!1}),!this.gl))return;try{this.prog=L(this.gl,F,E)}catch(o){console.error("[dither-shader] Shader setup failed:",o),this.gl=null,this.prog=null;return}this.vao=this.gl.createVertexArray(),this.vbo=this.gl.createBuffer(),this.gl.bindVertexArray(this.vao),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbo),this.gl.bufferData(this.gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),this.gl.STATIC_DRAW),this.gl.enableVertexAttribArray(0),this.gl.vertexAttribPointer(0,2,this.gl.FLOAT,!1,0,0),this.gl.bindVertexArray(null),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,null),this.gl.disable(this.gl.DEPTH_TEST),this.gl.enable(this.gl.BLEND),this.gl.blendFunc(this.gl.SRC_ALPHA,this.gl.ONE_MINUS_SRC_ALPHA);const t=o=>this.gl.getUniformLocation(this.prog,o);this._u={bgColor:t("uBgColor"),blueNoise:t("uBlueNoise"),brightness:t("uBrightness"),contrast:t("uContrast"),cursorRadius:t("uCursorRadius"),cursorSoftness:t("uCursorSoftness"),cursorStrength:t("uCursorStrength"),cellStrength:t("uCellStrength"),density:t("uDensity"),dotGain:t("uDotGain"),dotRoundness:t("uDotRoundness"),dotSize:t("uDotSize"),dotSoftness:t("uDotSoftness"),edgeStrength:t("uEdgeStrength"),fineStrength:t("uFineStrength"),fgColor:t("uFgColor"),flowAngle:t("uFlowAngle"),flowSpeed:t("uFlowSpeed"),flowStrength:t("uFlowStrength"),gateHigh:t("uGateHigh"),gateLow:t("uGateLow"),jitter:t("uJitter"),macroStrength:t("uMacroStrength"),noiseMode:t("uNoiseMode"),noiseScale:t("uNoiseScale"),pointer:t("uPointer"),pointerActive:t("uPointerActive"),res:t("uRes"),rotation:t("uRotation"),seed:t("uSeed"),time:t("uTime"),warp:t("uWarp"),warpScale:t("uWarpScale")}}_flag(t,o=!1){const e=this.getAttribute(t);return e==null?o:e===""?!0:!/^(0|false|no|off)$/i.test(e)}_number(t,o){const e=this.getAttribute(t);if(e==null||e==="")return o;const i=Number.parseFloat(e);return Number.isFinite(i)?i:o}_resolveColor(t,o){return this._colorProbe?(this._colorProbe.style.color=o,this._colorProbe.style.color=t||o,b(getComputedStyle(this._colorProbe).color)):b(t||o)}_updateColors(){this._colorsDirty&&(this._fgColor=new Float32Array(this._resolveColor(this.getAttribute("color"),"currentColor")),this._bgColor=new Float32Array(this._resolveColor(this.getAttribute("background"),"rgba(0, 0, 0, 0)")),this._colorsDirty=!1)}_updateParams(){if(!this._paramsDirty)return;const t=this._number("speed",15e-8),o=this.hasAttribute("flow-speed")?this._number("flow-speed",.045):t*3e5;this._params={blueNoise:s(this._number("blue-noise",.55),0,1),brightness:this._number("brightness",0),cellStrength:s(this._number("cell-strength",-.085),-.5,.5),contrast:Math.max(0,this._number("contrast",1.5)),cursorRadius:Math.max(1,this._number("cursor-radius",0)),cursorSoftness:Math.max(1,this._number("cursor-softness",0)),cursorStrength:s(this._number("cursor-strength",0),0,1.5),density:this._number("density",-.015),dotGain:Math.max(0,this._number("halftone",1.15)),dotRoundness:s(this._number("dot-roundness",1),0,1),dotSize:Math.max(1.25,this._number("dot-size",3.2)),dotSoftness:s(this._number("dot-softness",.35),0,2),edgeStrength:s(this._number("edge-strength",.155),0,.5),fineStrength:s(this._number("fine-strength",.68),0,1),flowAngle:this._number("flow-angle",24),flowSpeed:Math.max(0,o),flowStrength:Math.max(0,this._number("flow-strength",.65)),gateHigh:s(this._number("gate-high",.765),0,1),gateLow:s(this._number("gate-low",.66),0,1),jitter:Math.max(0,this._number("jitter",.2)),macroStrength:s(this._number("macro-strength",.525),0,1),noiseMode:this.getAttribute("mode")==="grid"?0:1,noiseScale:Math.max(.001,this._number("noise-scale",3.4)),rotation:this._number("rotation",32),seed:this._number("seed",0),warp:Math.max(0,this._number("warp",18)),warpScale:Math.max(1e-4,this._number("warp-scale",.002))},this._paramsDirty=!1}_schedule(){this._rafPending||this._loopActive||(this._rafPending=!0,requestAnimationFrame(()=>{this._rafPending=!1,this._draw()}))}_tick(t){if(!this._loopActive)return;this._lastFrameTime==null&&(this._lastFrameTime=t);const o=Math.min((t-this._lastFrameTime)/1e3,.05);this._lastFrameTime=t,this._elapsed+=o,this._stepPointer(o),this._dirty=!0,this._draw(),this._animRaf=requestAnimationFrame(this._tick)}_startLoop(){this._loopActive||document.hidden||!this.gl||!this.prog||(this._loopActive=!0,this._lastFrameTime=null,this._animRaf=requestAnimationFrame(this._tick))}_stopLoop(t=!0){this._animRaf&&cancelAnimationFrame(this._animRaf),this._loopActive=!1,this._animRaf=0,this._lastFrameTime=null,t&&this.isConnected&&(this._dirty=!0,this._schedule())}_onVisibilityChange(){if(document.hidden){this._stopLoop(!1);return}this._flag("animate")?this._startLoop():this._schedule()}_installPointerHandling(){if(!window.matchMedia)return;this._pointerQuery||(this._pointerQuery=window.matchMedia("(hover: hover) and (pointer: fine)"),this._pointerQuery.addEventListener?this._pointerQuery.addEventListener("change",this._onPointerCapabilityChange):this._pointerQuery.addListener(this._onPointerCapabilityChange));const t=this._flag("cursor",!0)&&this._pointerQuery.matches;if(this._pointerEnabled=t,t){if(this._pointerListening)return;window.addEventListener("pointermove",this._onPointerMove,{passive:!0}),window.addEventListener("pointerout",this._onPointerOut),window.addEventListener("blur",this._onPointerLeave),this._pointerListening=!0}else this._removePointerListeners(),this._pointerActive=0,this._pointerTargetActive=0,this._dirty=!0,this._loopActive||this._schedule()}_removePointerListeners(){this._pointerListening&&(window.removeEventListener("pointermove",this._onPointerMove),window.removeEventListener("pointerout",this._onPointerOut),window.removeEventListener("blur",this._onPointerLeave),this._pointerListening=!1)}_onPointerCapabilityChange(){this._installPointerHandling(),this._dirty=!0,this._loopActive||this._schedule()}_onPointerMove(t){if(!this._pointerEnabled||!this.canvas)return;const o=this.getBoundingClientRect();!o.width||!o.height||(this._pointerTargetX=s((t.clientX-o.left)*this._pixelRatio,0,o.width*this._pixelRatio),this._pointerTargetY=s((o.bottom-t.clientY)*this._pixelRatio,0,o.height*this._pixelRatio),this._pointerTargetActive=1,this._loopActive||(this._pointerX=this._pointerTargetX,this._pointerY=this._pointerTargetY,this._pointerActive=1,this._dirty=!0,this._schedule()))}_onPointerLeave(){this._pointerTargetActive=0,this._loopActive||(this._pointerActive=0,this._dirty=!0,this._schedule())}_onPointerOut(t){t.relatedTarget==null&&this._onPointerLeave()}_stepPointer(t){if(!this._pointerEnabled){this._pointerActive=0;return}const o=1-Math.exp(-t*7);this._pointerX+=(this._pointerTargetX-this._pointerX)*o,this._pointerY+=(this._pointerTargetY-this._pointerY)*o,this._pointerActive+=(this._pointerTargetActive-this._pointerActive)*o,Math.abs(this._pointerTargetX-this._pointerX)<.01&&(this._pointerX=this._pointerTargetX),Math.abs(this._pointerTargetY-this._pointerY)<.01&&(this._pointerY=this._pointerTargetY),Math.abs(this._pointerTargetActive-this._pointerActive)<.001&&(this._pointerActive=this._pointerTargetActive)}_resize(){if(!this.canvas||!this.gl)return;const t=this._pointerEnabled?2:1.5,o=Math.max(1,this._number("max-dpr",t)),e=Math.min(window.devicePixelRatio||1,o),i=Math.max(1,Math.round(this.clientWidth*e)),n=Math.max(1,Math.round(this.clientHeight*e));this._pixelRatio=e,!(this.canvas.width===i&&this.canvas.height===n)&&(this.canvas.width=i,this.canvas.height=n,this.gl.viewport(0,0,i,n))}_draw(){if(!this._dirty||!this.gl||!this.prog||!this._u)return;this._dirty=!1,this._resize(),this._updateColors(),this._updateParams();const t=this.canvas?.width||0,o=this.canvas?.height||0;if(!t||!o)return;const e=this.gl,i=this._u,n=this._params;e.useProgram(this.prog),e.bindVertexArray(this.vao),e.uniform2f(i.res,t,o),e.uniform2f(i.pointer,this._pointerX,this._pointerY),e.uniform4fv(i.fgColor,this._fgColor),e.uniform4fv(i.bgColor,this._bgColor),e.uniform1f(i.time,this._elapsed),e.uniform1f(i.seed,n.seed),e.uniform1f(i.dotSize,n.dotSize),e.uniform1f(i.dotSoftness,n.dotSoftness),e.uniform1f(i.dotRoundness,n.dotRoundness),e.uniform1f(i.dotGain,n.dotGain),e.uniform1f(i.rotation,n.rotation),e.uniform1f(i.contrast,n.contrast),e.uniform1f(i.brightness,n.brightness),e.uniform1f(i.density,n.density),e.uniform1f(i.jitter,n.jitter),e.uniform1f(i.macroStrength,n.macroStrength),e.uniform1f(i.cellStrength,n.cellStrength),e.uniform1f(i.edgeStrength,n.edgeStrength),e.uniform1f(i.fineStrength,n.fineStrength),e.uniform1f(i.gateLow,n.gateLow),e.uniform1f(i.gateHigh,n.gateHigh),e.uniform1f(i.warp,n.warp),e.uniform1f(i.warpScale,n.warpScale),e.uniform1f(i.blueNoise,n.blueNoise),e.uniform1f(i.noiseScale,n.noiseScale),e.uniform1f(i.flowSpeed,n.flowSpeed),e.uniform1f(i.flowStrength,n.flowStrength),e.uniform1f(i.flowAngle,n.flowAngle),e.uniform1f(i.cursorRadius,n.cursorRadius*this._pixelRatio),e.uniform1f(i.cursorStrength,n.cursorStrength),e.uniform1f(i.cursorSoftness,n.cursorSoftness),e.uniform1f(i.pointerActive,s(this._pointerActive,0,1)),e.uniform1f(i.noiseMode,n.noiseMode),e.drawArrays(e.TRIANGLES,0,3)}}customElements.get("dither-shader")||customElements.define("dither-shader",M);const T=200,D=.8,k=.15,d=v("h1#wordmark"),z=v("div#fade"),f=v("div#content"),W=document.querySelector("button#cmdk_trigger");function v(r){const t=document.querySelector(r);if(!(t instanceof HTMLElement))throw new Error(`Minimal layout expected ${r} element.`);return t}let m=!1,p=0,h=null;function y(r,t){const o=getComputedStyle(document.documentElement),e=o.getPropertyValue(r).trim(),i=parseFloat(o.fontSize);return e.endsWith("rem")?parseFloat(e)*i:e.endsWith("px")?parseFloat(e):t*i}function N(r,t){const o=y("--breakpoint-sm",40),e=y("--breakpoint-md",48),i=t/3,n=t/2;if(r<=o)return i;if(r>=e)return n;const a=(r-o)/(e-o);return i+(n-i)*a}function x(){return Math.max(0,Math.min(window.scrollY/T,1))}function C(){h||(h=_.timeline({paused:!0}).fromTo(z,{opacity:0},{opacity:D,ease:"none",duration:1}).to(d,{filter:"blur(8px)",ease:"none",duration:.5},"<"))}function A(){C(),h&&h.progress(m?1:x())}function H(){p||(p=requestAnimationFrame(()=>{p=0,!m&&A()}))}function P(r){h&&(_.killTweensOf(h),_.to(h,{progress:r,duration:k,ease:"power2.out",overwrite:"auto"}))}function B(){m=!0,P(1)}function G(){m=!1,P(x())}async function O({element:r,paddingRem:t=8}){await document.fonts.ready;const o=r.innerText.length>15?2:1,e=parseFloat(getComputedStyle(document.documentElement).fontSize),i=window.innerWidth-t*e*2;r.style.maxWidth=`${i}px`,r.style.whiteSpace="normal";let n=8,a=8,g=2e3;for(;a<=g;){const c=a+g>>1;r.style.fontSize=`${c}px`,Y(r)>o||r.scrollWidth>i?g=c-1:(n=c,a=c+1)}r.style.fontSize=`${n}px`}function Y(r){const t=getComputedStyle(r),o=parseFloat(t.fontSize),e=t.lineHeight==="normal"?o*1.2:parseFloat(t.lineHeight);return Math.round(r.scrollHeight/e)}function X(){return window.innerWidth>f.clientWidth+64?8:(window.innerWidth-f.clientWidth)/2/16+1.5}function U(){const t=d.getBoundingClientRect().bottom-48;f.style.marginTop=`${t}px`,f.style.setProperty("--content-resting-offset",`${t}px`)}async function R(){d.style.top=`${N(window.innerWidth,window.innerHeight)}px`,await O({element:d,paddingRem:X()}),U(),C(),A()}function V(){window.innerWidth!==S&&(S=window.innerWidth,R())}function q(){window.dispatchEvent(new CustomEvent("cmdk-toggle"))}window.addEventListener("cmdk-opened",B);window.addEventListener("cmdk-closed",G);window.addEventListener("scroll",H,{passive:!0});let S=window.innerWidth;R();window.addEventListener("resize",V);W?.addEventListener("click",q);export{O as fitHeading};
