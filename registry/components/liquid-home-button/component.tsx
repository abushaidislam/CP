"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type LiquidHomeButtonSize = "sm" | "md" | "lg";
export type LiquidHomeButtonTheme = "auto" | "dark" | "light";

export interface LiquidHomeButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"
  > {
  /** Primary button text label */
  label?: string;
  /** Proportional size preset preserving exact concentric pill-to-orb geometry */
  size?: LiquidHomeButtonSize;
  /** Duration in seconds for one complete liquid caustic sweep cycle */
  orbitDuration?: number;
  /** Intensity multiplier (0 to 1.5) for chromatic refraction and optical bloom */
  glowIntensity?: number;
  /** Color theme mode: 'auto' adapts to Tailwind dark mode, or force 'dark' / 'light' */
  theme?: LiquidHomeButtonTheme;
  /** Optional custom icon replacing the default brushed-silver Home glyph */
  icon?: React.ReactNode;
  /** Enable or pause the continuous liquid chromatic sweep */
  animate?: boolean;
  /** Highlights the button as the active navigation item */
  active?: boolean;
}

const SIZE_CONFIG: Record<
  LiquidHomeButtonSize,
  {
    pill: string;
    innerBezel: string;
    orbPx: number;
    innerDiscPx: number;
    iconBox: string;
    label: string;
    gap: string;
  }
> = {
  sm: {
    pill: "h-12 pl-2 pr-6",
    innerBezel: "inset-[2.5px]",
    orbPx: 32,
    innerDiscPx: 26,
    iconBox: "h-[15px] w-[15px]",
    label: "text-[15px] tracking-[-0.015em]",
    gap: "gap-3",
  },
  md: {
    pill: "h-16 pl-2.5 pr-8",
    innerBezel: "inset-[3.5px]",
    orbPx: 44,
    innerDiscPx: 36,
    iconBox: "h-[20px] w-[20px]",
    label: "text-[20px] tracking-[-0.02em]",
    gap: "gap-4",
  },
  lg: {
    pill: "h-20 pl-3 pr-10",
    innerBezel: "inset-[4.5px]",
    orbPx: 56,
    innerDiscPx: 46,
    iconBox: "h-[26px] w-[26px]",
    label: "text-[26px] tracking-[-0.022em]",
    gap: "gap-5",
  },
};

const VERTEX_SHADER_SRC = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `
precision highp float;

varying vec2 v_uv;
uniform float u_time;
uniform float u_duration;
uniform float u_glow;
uniform float u_hover;
uniform float u_resolution;

const float PI = 3.14159265359;
const float TAU = 6.28318530718;

float angleDiff(float a, float b) {
  return mod(a - b + PI, TAU) - PI;
}

float gauss(float x, float sigma) {
  float t = x / sigma;
  return exp(-0.5 * t * t);
}

// Vivid jewel-like physical spectrum: cobalt -> electric cyan -> aqua -> gold -> orange -> crimson
vec3 spectralColor(float w) {
  vec3 c0 = vec3(0.06, 0.22, 1.00);
  vec3 c1 = vec3(0.00, 0.84, 1.00);
  vec3 c2 = vec3(0.10, 1.00, 0.70);
  vec3 c3 = vec3(1.00, 0.94, 0.16);
  vec3 c4 = vec3(1.00, 0.34, 0.02);
  vec3 c5 = vec3(0.94, 0.04, 0.02);
  if (w < 0.18) return mix(c0, c1, w / 0.18);
  if (w < 0.36) return mix(c1, c2, (w - 0.18) / 0.18);
  if (w < 0.56) return mix(c2, c3, (w - 0.36) / 0.20);
  if (w < 0.78) return mix(c3, c4, (w - 0.56) / 0.22);
  return mix(c4, c5, (w - 0.78) / 0.22);
}

// Saturation-preserving Reinhard-filmic curve (never washes out to grey/pastel)
vec3 toneMap(vec3 x) {
  return clamp(x / (1.0 + x * 0.65), 0.0, 1.0);
}

float studioEnv(float theta, float a1, float a2, float a3, float s1, float s2, float surge) {
  float l1 = gauss(angleDiff(theta, a1), s1) * (1.28 + 1.85 * surge);
  float l2 = gauss(angleDiff(theta, a2), s2) * (1.12 + 0.36 * surge);
  float l3 = gauss(angleDiff(theta, a3), radians(14.0)) * (0.36 * (1.0 - 0.80 * surge));
  return l1 + l2 + l3;
}

void main() {
  vec2 p = (v_uv - 0.5) * 2.0;
  p.y = -p.y;

  float d = length(p);
  float angle = atan(p.y, p.x);

  // Sleek glass torus proportions (outerR = 0.616, innerR = 0.504 -> ratio 0.818)
  float R_mid = 0.560;
  float r_tube = 0.056;
  float outerR = R_mid + r_tube;
  float innerR = R_mid - r_tube;

  // Smooth C-infinity pendulum sweep matching the 5s reference choreography
  float phase = fract(u_time / max(u_duration, 1.0));
  float wave = 0.5 - 0.5 * cos(phase * TAU);
  float surge = pow(wave, 1.65);
  float energy = clamp(u_glow * (1.0 + 0.18 * u_hover), 0.0, 1.8);

  // Measured reference trajectories:
  float a1 = radians(245.0 + 88.0 * wave);
  float a2 = radians(112.0 + 55.0 * wave);
  float a3 = radians(358.0 - 30.0 * wave);

  // Sharp lobe sigmas so 50%+ of the ring stays glossy jet-black obsidian
  float s1 = radians(15.5 + 24.5 * surge);
  float s2 = radians(16.5 + 8.0 * surge);

  float q = (d - R_mid) / r_tube;
  float aaW = max(0.035, 2.2 / (u_resolution * r_tube));
  float torusMask = smoothstep(1.0, 1.0 - aaW, abs(q));

  vec3 torusRgb = vec3(0.0);

  if (torusMask > 0.001) {
    float qClamped = clamp(q, -0.999, 0.999);
    float nz = sqrt(max(0.0001, 1.0 - qClamped * qClamped));
    float fresnel = pow(1.0 - nz, 2.2);

    // Smooth fluid refraction twist (zero high-frequency aliasing dots)
    float twist =
      0.055 * sin(angle * 3.0 - phase * TAU) +
      0.028 * sin(angle * 5.0 + phase * TAU);

    vec3 prism = vec3(0.0);
    for (int i = 0; i < 7; i++) {
      float w = float(i) / 6.0;
      float disp = w - 0.5;
      float thW = angle + disp * (0.50 - 0.14 * surge) + twist * (0.5 + w);
      float eW = studioEnv(thW, a1, a2, a3, s1, s2, surge);

      // Sharp threshold keeps dark obsidian valleys pitch-black and crisp
      float eSharp = pow(max(0.0, eW - 0.15), 1.28);

      // Curved glass caustic ribbon focused across the 3D tube cross-section
      float radFocus = exp(-pow((qClamped - disp * 0.65) * 1.55, 2.0));
      float focus = 0.42 + 1.02 * radFocus + 0.55 * fresnel;

      prism += spectralColor(w) * eSharp * focus;
    }
    prism /= 2.15;

    // Razor-crisp incandescent pure-white core ONLY at the peak crest
    float eCenter = studioEnv(angle + twist * 0.5, a1, a2, a3, s1, s2, surge);
    float whiteCore = pow(max(0.0, eCenter - 0.72), 1.55) * (0.45 + 0.95 * nz);
    vec3 coreCol = vec3(1.0, 0.985, 0.94) * whiteCore * 1.85;

    // Pitch-black glossy obsidian base + crisp 1px outer glass rim highlight
    vec3 obsidian = vec3(0.008, 0.008, 0.012);
    float outerRim = smoothstep(0.76, 0.96, qClamped) * (0.14 + 0.42 * min(1.0, eCenter));
    float innerGroove = smoothstep(-0.78, -0.98, qClamped) * 0.08;

    vec3 torusHdr = obsidian + (prism + coreCol + vec3(outerRim + innerGroove)) * energy;
    torusRgb = toneMap(torusHdr);
  }

  // PURE WARM-WHITE / SOFT GOLD CONTOUR-HUGGING OPTICAL BLOOM (zero pink/magenta)
  vec3 bloomRgb = vec3(0.0);
  float distOut = max(0.0, d - outerR);
  float distIn = max(0.0, innerR - d);
  float distRing = max(distOut, distIn);

  if (distRing > 0.0 && energy > 0.01) {
    float eGlow = studioEnv(angle, a1, a2, a3, s1, s2, surge);
    float eGlowSharp = pow(max(0.0, eGlow - 0.35), 1.35);

    float outFall =
      exp(-distOut * 28.0) * 0.46 +
      exp(-distOut * 10.5) * (0.05 + 0.15 * surge);

    float inFall =
      exp(-distIn * 18.0) * (0.12 + 0.20 * surge) +
      exp(-distIn * 7.5) * (0.025 + 0.065 * surge);

    float fall = d >= outerR ? outFall : inFall;
    float edgeFade = smoothstep(0.98, 0.74, d);

    // Strictly warm-white/gold spectrum (R >= G >= B -> impossible to tint pink)
    vec3 glowTint = vec3(1.00, 0.94, 0.84);
    bloomRgb = toneMap(glowTint * eGlowSharp * fall * edgeFade * energy * 0.56);
  }

  // Premultiplied alpha: opaque glossy torus + pure luminous warm optical bloom
  float bloomAlpha = max(bloomRgb.r, max(bloomRgb.g, bloomRgb.b));
  vec3 outRgb = torusRgb * torusMask + bloomRgb * (1.0 - torusMask);
  float outAlpha = max(torusMask, bloomAlpha * (1.0 - torusMask));

  gl_FragColor = vec4(outRgb, clamp(outAlpha, 0.0, 1.0));
}
`;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function LiquidPrismShaderCanvas({
  orbPx,
  orbitDuration,
  glowIntensity,
  shouldAnimate,
  isHovered,
}: {
  orbPx: number;
  orbitDuration: number;
  glowIntensity: number;
  shouldAnimate: boolean;
  isHovered: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hoverTargetRef = useRef(0);
  const hoverCurrentRef = useRef(0);
  const durationRef = useRef(orbitDuration);
  const glowRef = useRef(glowIntensity);
  const [webglFailed, setWebglFailed] = useState(false);

  // Canvas sized so outerR (0.616 in normalized [-1,1]) equals orbPx / 2 exactly
  const canvasCssSize = Math.round(orbPx / 0.616);

  useEffect(() => {
    hoverTargetRef.current = isHovered ? 1 : 0;
  }, [isHovered]);

  useEffect(() => {
    durationRef.current = orbitDuration;
  }, [orbitDuration]);

  useEffect(() => {
    glowRef.current = glowIntensity;
  }, [glowIntensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
      powerPreference: "high-performance",
    });

    if (!gl) {
      setWebglFailed(true);
      return;
    }

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    if (!vs || !fs) {
      setWebglFailed(true);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      setWebglFailed(true);
      return;
    }

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      setWebglFailed(true);
      return;
    }

    // 2x supersampled HiDPI GPU buffer (min 320px, max 512px) for razor-sharp edges at any zoom
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const gpuSize = Math.min(512, Math.max(320, Math.round(canvasCssSize * dpr * 2)));
    canvas.width = gpuSize;
    canvas.height = gpuSize;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(program, "a_pos");
    const timeLoc = gl.getUniformLocation(program, "u_time");
    const durLoc = gl.getUniformLocation(program, "u_duration");
    const glowLoc = gl.getUniformLocation(program, "u_glow");
    const hoverLoc = gl.getUniformLocation(program, "u_hover");
    const resLoc = gl.getUniformLocation(program, "u_resolution");

    gl.useProgram(program);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
    gl.viewport(0, 0, gpuSize, gpuSize);
    gl.clearColor(0, 0, 0, 0);

    const draw = (elapsedSec: number, hoverVal: number) => {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(timeLoc, elapsedSec);
      gl.uniform1f(durLoc, Math.max(1.2, durationRef.current));
      gl.uniform1f(glowLoc, glowRef.current);
      gl.uniform1f(hoverLoc, hoverVal);
      gl.uniform1f(resLoc, gpuSize);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    if (!shouldAnimate) {
      draw(durationRef.current * 0.14, hoverTargetRef.current);
      return () => {
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
      };
    }

    let rafId = 0;
    let startTime: number | null = null;

    const tick = (now: number) => {
      if (startTime === null) startTime = now;
      const elapsedSec = (now - startTime) / 1000;
      hoverCurrentRef.current +=
        (hoverTargetRef.current - hoverCurrentRef.current) * 0.08;

      draw(elapsedSec, hoverCurrentRef.current);
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [canvasCssSize, shouldAnimate]);

  if (webglFailed) {
    return (
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full p-[5px]"
        style={{
          background:
            "conic-gradient(from 230deg, #050508 0deg, #1d4ed8 22deg, #38bdf8 34deg, #ffffff 44deg, #fb923c 56deg, #991b1b 68deg, #050508 92deg, #050508 210deg, #2563eb 230deg, #ffffff 244deg, #ea580c 258deg, #050508 286deg)",
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{
        width: `${canvasCssSize}px`,
        height: `${canvasCssSize}px`,
      }}
    />
  );
}

function DefaultHomeGlyph({
  uid,
  isLightOnly,
  isDarkOnly,
  className,
}: {
  uid: string;
  isLightOnly: boolean;
  isDarkOnly: boolean;
  className?: string;
}) {
  const darkGradId = `${uid}-home-metal-dark`;
  const lightGradId = `${uid}-home-metal-light`;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn(
        "transition-transform duration-300 ease-out group-hover/liquid-btn:scale-[1.04]",
        className
      )}
      style={{
        filter: isLightOnly
          ? "drop-shadow(0 1.5px 3px rgba(15, 23, 42, 0.22))"
          : "drop-shadow(0 3px 6px rgba(0, 0, 0, 0.55))",
      }}
    >
      <defs>
        <linearGradient
          id={darkGradId}
          x1="4"
          y1="3"
          x2="20"
          y2="21"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="48%" stopColor="#EEF0F4" />
          <stop offset="100%" stopColor="#BFC4CE" />
        </linearGradient>
        <linearGradient
          id={lightGradId}
          x1="4"
          y1="3"
          x2="20"
          y2="21"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#334155" />
          <stop offset="55%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>
      {isDarkOnly ? (
        <path
          d="M11.15 3.25a1.32 1.32 0 0 1 1.7 0l8.35 7.25c.6.52.23 1.5-.56 1.5H19.1v7.2c0 .99-.81 1.8-1.8 1.8h-3.1a.65.65 0 0 1-.65-.65v-4.25a.85.85 0 0 0-.85-.85h-1.4a.85.85 0 0 0-.85.85v4.25a.65.65 0 0 1-.65.65H6.7c-.99 0-1.8-.81-1.8-1.8V12H3.36c-.79 0-1.16-.98-.56-1.5l8.35-7.25Z"
          fill={`url(#${darkGradId})`}
        />
      ) : isLightOnly ? (
        <path
          d="M11.15 3.25a1.32 1.32 0 0 1 1.7 0l8.35 7.25c.6.52.23 1.5-.56 1.5H19.1v7.2c0 .99-.81 1.8-1.8 1.8h-3.1a.65.65 0 0 1-.65-.65v-4.25a.85.85 0 0 0-.85-.85h-1.4a.85.85 0 0 0-.85.85v4.25a.65.65 0 0 1-.65.65H6.7c-.99 0-1.8-.81-1.8-1.8V12H3.36c-.79 0-1.16-.98-.56-1.5l8.35-7.25Z"
          fill={`url(#${lightGradId})`}
        />
      ) : (
        <>
          <path
            d="M11.15 3.25a1.32 1.32 0 0 1 1.7 0l8.35 7.25c.6.52.23 1.5-.56 1.5H19.1v7.2c0 .99-.81 1.8-1.8 1.8h-3.1a.65.65 0 0 1-.65-.65v-4.25a.85.85 0 0 0-.85-.85h-1.4a.85.85 0 0 0-.85.85v4.25a.65.65 0 0 1-.65.65H6.7c-.99 0-1.8-.81-1.8-1.8V12H3.36c-.79 0-1.16-.98-.56-1.5l8.35-7.25Z"
            fill={`url(#${lightGradId})`}
            className="dark:hidden"
          />
          <path
            d="M11.15 3.25a1.32 1.32 0 0 1 1.7 0l8.35 7.25c.6.52.23 1.5-.56 1.5H19.1v7.2c0 .99-.81 1.8-1.8 1.8h-3.1a.65.65 0 0 1-.65-.65v-4.25a.85.85 0 0 0-.85-.85h-1.4a.85.85 0 0 0-.85.85v4.25a.65.65 0 0 1-.65.65H6.7c-.99 0-1.8-.81-1.8-1.8V12H3.36c-.79 0-1.16-.98-.56-1.5l8.35-7.25Z"
            fill={`url(#${darkGradId})`}
            className="hidden dark:block"
          />
        </>
      )}
    </svg>
  );
}

export const LiquidHomeButton = React.forwardRef<
  HTMLButtonElement,
  LiquidHomeButtonProps
>(function LiquidHomeButton(
  {
    label = "Home",
    size = "md",
    orbitDuration = 5,
    glowIntensity = 1,
    theme = "auto",
    icon,
    animate = true,
    active = false,
    disabled = false,
    className,
    type = "button",
    onMouseEnter,
    onMouseLeave,
    ...props
  },
  ref
) {
  const rawId = useId();
  const uid = rawId.replace(/:/g, "");
  const prefersReducedMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  const safeSize: LiquidHomeButtonSize =
    size === "sm" || size === "md" || size === "lg" ? size : "md";
  const safeTheme: LiquidHomeButtonTheme =
    theme === "auto" || theme === "dark" || theme === "light" ? theme : "auto";
  const safeDuration =
    typeof orbitDuration === "number" && Number.isFinite(orbitDuration)
      ? Math.min(20, Math.max(1.2, orbitDuration))
      : 5;
  const safeGlow =
    typeof glowIntensity === "number" && Number.isFinite(glowIntensity)
      ? Math.min(1.5, Math.max(0, glowIntensity))
      : 1;

  const dims = SIZE_CONFIG[safeSize];
  const shouldAnimate = animate && !prefersReducedMotion && !disabled;
  const isDarkOnly = safeTheme === "dark";
  const isLightOnly = safeTheme === "light";

  const outerShellClasses = isDarkOnly
    ? cn(
        "bg-[#101012] shadow-[0_18px_40px_-12px_rgba(0,0,0,0.92),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(255,255,255,0.025)]",
        active ? "border-white/22" : "border-white/[0.09]"
      )
    : isLightOnly
      ? cn(
          "bg-white/85 shadow-[0_12px_28px_-10px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(15,23,42,0.05)]",
          active ? "border-slate-900/22" : "border-slate-900/[0.10]"
        )
      : cn(
          "bg-white/85 dark:bg-[#101012] shadow-[0_12px_28px_-10px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(15,23,42,0.05)] dark:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.92),inset_0_1px_0_rgba(255,255,255,0.09),inset_0_-1px_0_rgba(255,255,255,0.025)]",
          active
            ? "border-slate-900/22 dark:border-white/22"
            : "border-slate-900/[0.10] dark:border-white/[0.09]"
        );

  const innerBezelClasses = isDarkOnly
    ? "bg-gradient-to-b from-[#1a1a1c] via-[#151517] to-[#111113] border-white/[0.065] shadow-[inset_0_1px_1px_rgba(255,255,255,0.07),inset_0_-1px_2px_rgba(0,0,0,0.75)]"
    : isLightOnly
      ? "bg-gradient-to-b from-[#fafbfc] via-[#f1f4f8] to-[#e6ebf2] border-slate-900/[0.07] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),inset_0_-1px_2px_rgba(15,23,42,0.06)]"
      : "bg-gradient-to-b from-[#fafbfc] via-[#f1f4f8] to-[#e6ebf2] dark:from-[#1a1a1c] dark:via-[#151517] dark:to-[#111113] border-slate-900/[0.07] dark:border-white/[0.065] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),inset_0_-1px_2px_rgba(15,23,42,0.06)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.07),inset_0_-1px_2px_rgba(0,0,0,0.75)]";

  const innerDiscClasses = isDarkOnly
    ? "bg-[radial-gradient(circle_at_48%_32%,#37373d_0%,#26262b_60%,#1c1c20_100%)] border-white/[0.14] shadow-[inset_0_1px_2px_rgba(255,255,255,0.18),inset_0_-3px_7px_rgba(0,0,0,0.78)]"
    : isLightOnly
      ? "bg-[radial-gradient(circle_at_48%_32%,#ffffff_0%,#eef2f6_60%,#dce3ec_100%)] border-white/95 shadow-[inset_0_1px_2px_rgba(255,255,255,1),inset_0_-2px_5px_rgba(15,23,42,0.12)]"
      : "bg-[radial-gradient(circle_at_48%_32%,#ffffff_0%,#eef2f6_60%,#dce3ec_100%)] dark:bg-[radial-gradient(circle_at_48%_32%,#37373d_0%,#26262b_60%,#1c1c20_100%)] border-white/95 dark:border-white/[0.14] shadow-[inset_0_1px_2px_rgba(255,255,255,1),inset_0_-2px_5px_rgba(15,23,42,0.12)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.18),inset_0_-3px_7px_rgba(0,0,0,0.78)]";

  const labelColorClasses = isDarkOnly
    ? "text-[#FFFFFF]"
    : isLightOnly
      ? "text-slate-900"
      : "text-slate-900 dark:text-[#FFFFFF]";

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-pressed={active || undefined}
      onMouseEnter={(e) => {
        setIsHovered(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        onMouseLeave?.(e);
      }}
      whileHover={
        disabled || prefersReducedMotion
          ? undefined
          : { y: -1, transition: { type: "spring", stiffness: 420, damping: 28 } }
      }
      whileTap={
        disabled || prefersReducedMotion
          ? undefined
          : { scale: 0.975, transition: { type: "spring", stiffness: 500, damping: 30 } }
      }
      className={cn(
        "group/liquid-btn relative inline-flex select-none items-center rounded-full border backdrop-blur-xl transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/75 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer",
        dims.pill,
        dims.gap,
        outerShellClasses,
        className
      )}
      style={{
        fontFamily:
          '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      }}
      {...props}
    >
      {/* Inner recessed double-bezel glass housing */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute rounded-full border transition-opacity duration-300",
          dims.innerBezel,
          innerBezelClasses
        )}
      />

      {/* Crisp 1px top-edge glass specular highlight across the pill */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-8 top-[1px] h-[1px] rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-80"
      />

      {/* Concentric Circular Liquid Chromatic Prism Medallion */}
      <span
        className="relative z-10 flex shrink-0 items-center justify-center rounded-full"
        style={{
          width: `${dims.orbPx}px`,
          height: `${dims.orbPx}px`,
        }}
      >
        {/* Layer 1: Inner Smoked-Glass Domed Disc */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none relative z-0 rounded-full border",
            innerDiscClasses
          )}
          style={{
            width: `${dims.innerDiscPx}px`,
            height: `${dims.innerDiscPx}px`,
          }}
        />

        {/* Layer 2: Supersampled GPU WebGL GLSL Fragment Shader */}
        <span className="pointer-events-none absolute inset-0 z-10">
          <LiquidPrismShaderCanvas
            orbPx={dims.orbPx}
            orbitDuration={safeDuration}
            glowIntensity={safeGlow}
            shouldAnimate={shouldAnimate}
            isHovered={isHovered}
          />
        </span>

        {/* Layer 3: Crisp Brushed-Silver Home Icon */}
        <span className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          {icon ? (
            <span
              className={cn(
                "flex items-center justify-center",
                isDarkOnly
                  ? "text-white"
                  : isLightOnly
                    ? "text-slate-900"
                    : "text-slate-900 dark:text-white",
                dims.iconBox
              )}
            >
              {icon}
            </span>
          ) : (
            <DefaultHomeGlyph
              uid={uid}
              isDarkOnly={isDarkOnly}
              isLightOnly={isLightOnly}
              className={dims.iconBox}
            />
          )}
        </span>
      </span>

      {/* Label Text */}
      {label ? (
        <span
          className={cn(
            "relative z-10 font-normal leading-none transition-colors duration-200",
            dims.label,
            labelColorClasses
          )}
        >
          {label}
        </span>
      ) : null}
    </motion.button>
  );
});

LiquidHomeButton.displayName = "LiquidHomeButton";

export { LiquidHomeButton as component, LiquidHomeButton as Component };
export default LiquidHomeButton;
