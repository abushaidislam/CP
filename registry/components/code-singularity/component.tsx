"use client";

import React, { useEffect, useId, useRef, useState } from "react";

function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(" ");
}

function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReduced(mq.matches);
    update();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }
    mq.addListener(update);
    return () => mq.removeListener(update);
  }, []);

  return prefersReduced;
}

function parseHexToRgb(hex: string): [number, number, number] {
  const fallback: [number, number, number] = [1.0, 0.478, 0.102]; // #ff7a1a
  if (typeof hex !== "string") return fallback;
  const clean = hex.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    const r = parseInt(clean[0] + clean[0], 16) / 255;
    const g = parseInt(clean[1] + clean[1], 16) / 255;
    const b = parseInt(clean[2] + clean[2], 16) / 255;
    return [r, g, b];
  }
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;
    return [r, g, b];
  }
  return fallback;
}

const DEFAULT_CODE_LINES: readonly string[] = [
  "export async function converge(horizon: Vector3, mass: number) {",
  "  const schRadius = (2 * G * mass) / (C * C);",
  "  const metric = tensors.kerrNewman({ spin: 0.998, charge: 0 });",
  "  for (let i = 0; i < geodesic.steps; i++) {",
  "    const r = Math.hypot(p.x - cx, p.y - cy);",
  "    const dilation = Math.sqrt(Math.max(1e-5, 1 - schRadius / r));",
  "    stream.push({ phi: Math.atan2(p.y, p.x), warp: 1 / dilation });",
  "  }",
  "  return { eventHorizon: schRadius, flux: integrate(stream) };",
  "}",
  "interface SingularityState { phase: number; redshift: Float32Array; }",
  "const photonSphere = (r: number, theta: number) => 1.5 * r * Math.cos(theta);",
  "async function* readTelemetry(pipe: ReadableStream<Uint8Array>) {",
  "  const reader = pipe.getReader();",
  "  while (true) { const { done, value } = await reader.read();",
  "    if (done) break; yield decodePacket(value, { entropy: 0.94 });",
  "  }",
  "}",
  "const warpMatrix = new Float32Array([1, 0, -0.42, 0, 1, 0.18]);",
  "function emitAccretion(flux: number, kelvin: number): Spectrum {",
  "  return blackbody(kelvin * Math.pow(flux, 0.25)).normalize();",
  "}",
  'export const KERNEL_HASH = "0x9f4c8e2a1b7d04e6f3a8c5d9e1b2f4a7";',
  "if (singularity.density > CRITICAL_LIMIT) triggerCollapse(nodes);",
];

const VERTEX_SHADER = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying vec2 vUv;

uniform vec2 uRes;
uniform float uPhase;
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uAccent;
uniform float uIntensity;
uniform sampler2D uCodeTex;

const float PI = 3.14159265359;
const float TAU = 6.28318530718;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.52;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = rot * p * 2.04 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

mat2 rot2(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

vec3 renderStars(vec2 uv, float t) {
  vec3 col = vec3(0.0);
  for (int layer = 0; layer < 2; layer++) {
    float scale = layer == 0 ? 50.0 : 94.0;
    vec2 gv = fract(uv * scale) - 0.5;
    vec2 id = floor(uv * scale);
    float rnd = hash21(id + float(layer) * 37.0);
    if (rnd > 0.942) {
      vec2 offs = vec2(hash21(id * 1.3), hash21(id * 2.7)) - 0.5;
      float d = length(gv - offs * 0.65);
      float size = (layer == 0 ? 0.044 : 0.028) * (0.6 + 0.6 * fract(rnd * 91.7));
      float star = smoothstep(size, 0.0, d);
      float twinkle = 0.72 + 0.28 * sin(t * 2.3 + rnd * 40.0);
      vec3 tint = mix(vec3(0.76, 0.87, 1.0), vec3(1.0, 0.91, 0.82), fract(rnd * 17.3));
      col += tint * star * twinkle * (layer == 0 ? 0.85 : 0.52);
    }
  }
  return col;
}

void main() {
  float aspect = uRes.x / max(uRes.y, 1.0);
  vec2 p = (vUv - 0.5) * 2.0;
  p.x *= aspect;

  // Interactive pointer gravitational parallax
  p += uMouse * 0.045;

  float ph = fract(uPhase);

  // Temporal sequence matching the 6s reference:
  // 0.00 - 0.32: Side-angle curved code sheet pulled into singularity
  // 0.32 - 0.56: Spaghettification into silver streaks + camera sweep
  // 0.56 - 0.82: 360-degree radial hyperspace tunnel plunging inward
  // 0.82 - 0.95: Event horizon expansion & turbulent plasma corona
  // 0.95 - 1.00: Smooth loop return
  float sweep = smoothstep(0.32, 0.56, ph);
  float plunge = smoothstep(0.56, 0.92, ph);
  float loopReset = smoothstep(0.95, 1.0, ph);

  float minSpan = min(aspect, 1.0);
  vec2 sidePos = vec2(-0.46 * aspect, 0.14);
  vec2 bhPos = mix(sidePos, vec2(0.0, 0.0), sweep);
  bhPos = mix(bhPos, sidePos, loopReset);

  float rSide = 0.145 * minSpan;
  float rTunnel = 0.135 * minSpan;
  float rPlunge = 0.52 * minSpan;
  float rHole = mix(rSide, rTunnel, sweep);
  rHole = mix(rHole, rPlunge, pow(plunge, 1.55));
  rHole = mix(rHole, rSide, loopReset);

  vec2 rel = p - bhPos;
  float sideEllip = (1.0 - sweep) * (1.0 - loopReset) + loopReset;
  float tunnelVis = smoothstep(0.45, 0.58, ph) * (1.0 - smoothstep(0.80, 0.90, ph)) * (1.0 - loopReset);

  // Perspective-tilted singularity silhouette in side view; subtle eye-like horizon in tunnel
  vec2 bhRel = rot2(-0.40 * sideEllip) * rel;
  bhRel.x *= mix(1.0, 1.24, sideEllip);
  bhRel.y *= mix(1.0, 1.16, tunnelVis * (1.0 - plunge * 0.65));

  float r = length(bhRel);
  float ang = atan(bhRel.y, bhRel.x);

  // Gravitational lensing on deep-space starfield
  vec2 lensedUv = p - normalize(rel + vec2(1e-4)) * (rHole * rHole / (length(rel) + 0.08)) * 0.45;
  vec3 col = vec3(0.008, 0.011, 0.022);
  col += renderStars(lensedUv, uTime);

  // 1. Turbulent swirling accretion disk & lensed cyan-blue plasma corona
  float ringDist = (r - rHole) / max(rHole, 0.05);
  float swirlSpeed = uTime * 0.52 + ph * 3.4;

  vec2 swirlCoord = vec2(
    cos(ang - swirlSpeed * 0.42 + 1.35 / (ringDist + 0.55)),
    sin(ang - swirlSpeed * 0.42 + 1.35 / (ringDist + 0.55))
  ) * (1.65 + ringDist * 1.35);

  float n1 = fbm(swirlCoord * 2.1 + vec2(uTime * 0.11, -uTime * 0.08));
  float n2 = fbm(swirlCoord * 3.8 + vec2(n1 * 2.4, -n1 * 1.9) + swirlSpeed * 0.14);
  float plasma = smoothstep(0.22, 0.88, n2);

  float innerGlow = exp(-max(ringDist, 0.0) * mix(5.0, 2.25, plunge));
  float hotRim = exp(-abs(ringDist - 0.04) * mix(18.0, 10.5, plunge));
  float outerHalo = exp(-max(ringDist - 0.08, 0.0) * mix(2.7, 1.22, plunge));
  float blueNoise = fbm(swirlCoord * 2.6 - vec2(uTime * 0.08, n1 * 1.4));

  float doppler = 0.74 + 0.36 * sin(ang + 1.15);
  float flare = exp(-abs(bhRel.y + bhRel.x * 0.35) * 14.0) * exp(-max(ringDist, 0.0) * 1.8) * sideEllip;

  vec3 hotCoreCol = mix(uAccent, vec3(1.0, 0.93, 0.78), 0.58);
  vec3 orangePlasma = mix(uAccent * 0.62, uAccent * 1.38, plasma);
  vec3 coolBlue = vec3(0.45, 0.72, 0.98);
  vec3 iceWhite = vec3(0.84, 0.93, 1.0);

  vec3 accretion = vec3(0.0);
  accretion += orangePlasma * innerGlow * (0.65 + 1.18 * plasma) * doppler * mix(1.05, 1.48, plunge);
  accretion += hotCoreCol * hotRim * (0.75 + 0.65 * n2) * 1.25;
  accretion += mix(coolBlue, iceWhite, blueNoise * 0.65) * outerHalo * (0.35 + 0.75 * blueNoise) * mix(0.65, 0.88, plunge);
  accretion += mix(uAccent, iceWhite, 0.45) * flare * 0.92;

  float outsideHole = smoothstep(rHole * 0.96, rHole * 1.045, r);
  col += accretion * outsideHole * uIntensity;

  // 2. Curved 3D hyperbolic code-sheet funnel & spaghettification (Stage 1 & 2)
  float sideVis = (1.0 - smoothstep(0.44, 0.56, ph)) + loopReset;
  if (sideVis > 0.001) {
    float dx = rel.x + rHole * 0.25;
    float dy = rel.y - 0.12 * dx;

    float tX = max(dx, 0.0);
    float funnelHalfH = rHole * 0.92 + 0.96 * pow(tX, 1.42) + 0.18 * tX;
    float inFunnel = smoothstep(-0.02, 0.08, dx) * (1.0 - smoothstep(funnelHalfH * 0.92, funnelHalfH * 1.04, abs(dy)));

    if (inFunnel > 0.001) {
      float vNorm = clamp(dy / max(funnelHalfH, 0.001), -0.999, 0.999);
      float vCyl = asin(vNorm) / (PI * 0.5);
      float uStream = pow(tX + 0.05, 0.62) * 2.15;

      float spag = smoothstep(0.28, 0.49, ph) * (1.0 - loopReset);
      float scroll = uTime * 0.22 + ph * 1.1;
      float uCoord = uStream * mix(1.0, 0.07, spag) + scroll * mix(1.0, 2.2, spag);
      float vCoord = vCyl * 1.45 + 0.5;

      float codeVal = texture2D(uCodeTex, vec2(uCoord, vCoord)).r;
      if (spag > 0.05) {
        float streak = 0.0;
        streak += texture2D(uCodeTex, vec2(uCoord + 0.04, vCoord)).r;
        streak += texture2D(uCodeTex, vec2(uCoord + 0.09, vCoord)).r;
        streak += texture2D(uCodeTex, vec2(uCoord - 0.05, vCoord)).r;
        float lineStripe = smoothstep(0.24, 0.78, sin(vCoord * 158.0) * 0.5 + 0.5);
        codeVal = mix(codeVal, max(streak * 0.45, lineStripe * (0.45 + 0.55 * codeVal)), spag);
      }

      float cylShade = pow(max(0.0, cos(vCyl * PI * 0.44)), 0.72);
      float edgeRim = pow(abs(vNorm), 3.4);
      float nearHole = exp(-tX * 4.5);

      vec3 codeTint = mix(
        vec3(0.84, 0.91, 0.99),
        mix(uAccent, vec3(1.0, 0.92, 0.75), 0.35),
        clamp(nearHole * 0.85 + edgeRim * 0.45, 0.0, 1.0)
      );
      vec3 sheetBg = mix(vec3(0.025, 0.04, 0.068), uAccent * 0.30, nearHole * 0.7 + edgeRim * 0.35);

      float borderGlow = smoothstep(0.82, 0.99, abs(vNorm)) * (0.55 + 0.65 * nearHole);
      vec3 borderCol = mix(coolBlue, uAccent, clamp(nearHole * 1.4 + 0.25, 0.0, 1.0));

      vec3 sheetCol = sheetBg * (0.55 + 0.45 * cylShade)
                    + codeTint * codeVal * (0.44 + 0.88 * cylShade) * mix(1.0, 1.25, spag)
                    + borderCol * borderGlow * 0.85;

      float mask = inFunnel * sideVis * outsideHole;
      col = mix(col, sheetCol * uIntensity, clamp(mask * 0.94, 0.0, 1.0));
    }
  }

  // 3. 360-degree radial hyperspace code tunnel (Stage 3)
  if (tunnelVis > 0.001) {
    float tr = length(rel);
    float tang = atan(rel.y, rel.x);

    float numRays = 56.0;
    float rayId = floor((tang + PI) / TAU * numRays);
    float rayLocal = fract((tang + PI) / TAU * numRays) - 0.5;
    float rayRnd = hash21(vec2(rayId, 13.7));

    float widthFactor = mix(0.18, 0.33, smoothstep(rHole, 1.15, tr));
    float rayCore = smoothstep(widthFactor, widthFactor * 0.30, abs(rayLocal));

    float beamTex = 0.74 + 0.26 * texture2D(uCodeTex, vec2(0.45 / (tr + 0.15) + uTime * 0.85, rayId / numRays)).r;

    float plungePull = smoothstep(0.68, 0.88, ph);
    float innerEdge = rHole * (0.98 + plungePull * (1.58 + rayRnd * 0.75));
    float bottomLinger = smoothstep(0.2, -0.8, sin(tang)) * 0.24 * plungePull;
    innerEdge -= bottomLinger;

    float radialMask = smoothstep(innerEdge * 0.96, innerEdge * 1.12, tr);

    float ringOverlap = exp(-abs(tr - rHole * 1.45) * 4.5);
    vec3 rayCol = mix(vec3(0.82, 0.88, 0.96), vec3(1.0, 0.96, 0.90), ringOverlap * 0.55);
    rayCol *= (0.72 + 0.38 * rayRnd) * beamTex;

    float rayAlpha = rayCore * radialMask * tunnelVis;
    col = mix(col, col * 0.36 + rayCol * uIntensity, clamp(rayAlpha * 0.92, 0.0, 1.0));
  }

  // Pure black event horizon core
  float coreBlack = smoothstep(rHole * 0.92, rHole * 1.01, r);
  col *= coreBlack;

  // Filmic tone mapping
  col = col / (1.0 + col * 0.42);
  col = pow(max(col, 0.0), vec3(0.95));

  gl_FragColor = vec4(col, 1.0);
}
`;

function buildCodeTextureCanvas(lines: readonly string[]): HTMLCanvasElement {
  const size = 1024;
  const off = document.createElement("canvas");
  off.width = size;
  off.height = size;
  const ctx = off.getContext("2d");
  if (!ctx) return off;

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, size, size);

  ctx.font =
    '600 18px "JetBrains Mono", "Fira Code", "SFMono-Regular", Menlo, Consolas, monospace';
  ctx.textBaseline = "top";

  const source = lines.length > 0 ? lines : DEFAULT_CODE_LINES;
  const rowHeight = 24;
  const rowCount = Math.ceil(size / rowHeight);

  for (let row = 0; row < rowCount; row++) {
    const primary = source[row % source.length];
    const secondary = source[(row * 7 + 3) % source.length];
    const combined = `${primary}   ${secondary}`.slice(0, 112);
    const indent = ((row * 3) % 5) * 14;
    const alpha = 0.72 + ((row * 19) % 10) * 0.028;
    ctx.fillStyle = `rgba(235, 244, 255, ${alpha.toFixed(2)})`;
    ctx.fillText(combined, indent, row * rowHeight + 3);
  }

  return off;
}

export interface CodeSingularityProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Playback speed multiplier for the 6-second singularity cycle (0.1 to 3). */
  speed?: number;
  /** Whether the singularity sequence loops automatically. */
  autoPlay?: boolean;
  /** Timeline phase in [0, 1]: 0.0 code funnel, 0.42 spaghettification, 0.66 warp tunnel, 0.90 plasma horizon. */
  phase?: number;
  /** Enables subtle pointer-driven gravitational parallax tilt. */
  interactive?: boolean;
  /** Hex color for the molten inner accretion plasma (default: #ff7a1a). */
  accretionColor?: string;
  /** Luminance & bloom intensity multiplier (0.4 to 1.8). */
  intensity?: number;
  /** Optional custom source code lines rendered into the curved gravitational code funnel. */
  codeLines?: string[];
  /** Accessible description for screen readers. */
  ariaLabel?: string;
  /** Optional foreground content layered above the live WebGL canvas. */
  children?: React.ReactNode;
}

const CYCLE_DURATION_SECONDS = 6.0;

export const CodeSingularity = React.forwardRef<
  HTMLDivElement,
  CodeSingularityProps
>(function CodeSingularity(
  {
    speed = 1,
    autoPlay = true,
    phase = 0,
    interactive = true,
    accretionColor = "#ff7a1a",
    intensity = 1,
    codeLines,
    ariaLabel = "Animated black hole singularity pulling curved streams of source code into a glowing accretion disk",
    className,
    children,
    ...rest
  },
  ref
) {
  const rawId = useId();
  const canvasId = `code-singularity-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reducedMotion = useReducedMotion();
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  // Live uniform refs so prop updates apply at 60fps without rebuilding the WebGL context
  const propsRef = useRef({
    speed,
    autoPlay,
    phase,
    interactive,
    accretionColor,
    intensity,
    reducedMotion,
  });

  useEffect(() => {
    propsRef.current = {
      speed: Number.isFinite(speed) ? Math.min(3, Math.max(0.1, speed)) : 1,
      autoPlay: Boolean(autoPlay),
      phase: Number.isFinite(phase) ? ((phase % 1) + 1) % 1 : 0,
      interactive: Boolean(interactive),
      accretionColor,
      intensity: Number.isFinite(intensity)
        ? Math.min(1.8, Math.max(0.4, intensity))
        : 1,
      reducedMotion,
    };
  }, [
    speed,
    autoPlay,
    phase,
    interactive,
    accretionColor,
    intensity,
    reducedMotion,
  ]);

  const pointerTargetRef = useRef({ x: 0, y: 0 });
  const pointerCurrentRef = useRef({ x: 0, y: 0 });

  const setMergedRef = (node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const gl = canvas.getContext("webgl", {
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });

    if (!gl) {
      setWebglUnavailable(true);
      return;
    }

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) {
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      setWebglUnavailable(true);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      setWebglUnavailable(true);
      return;
    }

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      setWebglUnavailable(true);
      return;
    }

    gl.useProgram(program);

    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const codeCanvas = buildCodeTextureCanvas(codeLines ?? DEFAULT_CODE_LINES);
    const codeTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, codeTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      codeCanvas
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);

    const uResLoc = gl.getUniformLocation(program, "uRes");
    const uPhaseLoc = gl.getUniformLocation(program, "uPhase");
    const uTimeLoc = gl.getUniformLocation(program, "uTime");
    const uMouseLoc = gl.getUniformLocation(program, "uMouse");
    const uAccentLoc = gl.getUniformLocation(program, "uAccent");
    const uIntensityLoc = gl.getUniformLocation(program, "uIntensity");
    const uCodeTexLoc = gl.getUniformLocation(program, "uCodeTex");

    gl.uniform1i(uCodeTexLoc, 0);

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    resize();
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    ro?.observe(container);

    let rafId = 0;
    let elapsedPhase = 0;
    let totalTime = 0;
    let lastTs = performance.now();

    const renderFrame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - lastTs) / 1000));
      lastTs = now;

      const current = propsRef.current;
      const shouldAnimate = current.autoPlay && !current.reducedMotion;

      if (shouldAnimate) {
        elapsedPhase =
          (elapsedPhase + (dt * current.speed) / CYCLE_DURATION_SECONDS) % 1;
        totalTime += dt * current.speed;
      }

      const activePhase = shouldAnimate
        ? (elapsedPhase + current.phase) % 1
        : current.phase;

      // Smoothly damp pointer parallax
      const targetX =
        current.interactive && !current.reducedMotion
          ? pointerTargetRef.current.x
          : 0;
      const targetY =
        current.interactive && !current.reducedMotion
          ? pointerTargetRef.current.y
          : 0;
      const damp = 1 - Math.exp(-dt * 6.5);
      pointerCurrentRef.current.x +=
        (targetX - pointerCurrentRef.current.x) * damp;
      pointerCurrentRef.current.y +=
        (targetY - pointerCurrentRef.current.y) * damp;

      const [r, g, b] = parseHexToRgb(current.accretionColor);

      gl.uniform2f(uResLoc, canvas.width, canvas.height);
      gl.uniform1f(uPhaseLoc, activePhase);
      gl.uniform1f(
        uTimeLoc,
        shouldAnimate ? totalTime : activePhase * CYCLE_DURATION_SECONDS
      );
      gl.uniform2f(
        uMouseLoc,
        pointerCurrentRef.current.x,
        pointerCurrentRef.current.y
      );
      gl.uniform3f(uAccentLoc, r, g, b);
      gl.uniform1f(uIntensityLoc, current.intensity);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafId = window.requestAnimationFrame(renderFrame);
    };

    rafId = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(rafId);
      ro?.disconnect();
      gl.deleteTexture(codeTexture);
      gl.deleteBuffer(quadBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [codeLines]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || reducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1);
    pointerTargetRef.current = { x: nx, y: ny };
  };

  const handlePointerLeave = () => {
    pointerTargetRef.current = { x: 0, y: 0 };
  };

  return (
    <div
      ref={setMergedRef}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={cn(
        "relative w-full h-full overflow-hidden bg-[#020307] select-none",
        className
      )}
      {...rest}
    >
      {webglUnavailable ? (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 26% 44%, #000000 10%, ${accretionColor} 18%, rgba(122,184,255,0.35) 30%, #020307 62%)`,
          }}
        />
      ) : (
        <canvas
          id={canvasId}
          ref={canvasRef}
          aria-hidden="true"
          className="block w-full h-full"
        />
      )}

      {children ? (
        <div className="relative z-10 w-full h-full">{children}</div>
      ) : null}
    </div>
  );
});

export {
  CodeSingularity as component,
  CodeSingularity as Component,
};
export default CodeSingularity;