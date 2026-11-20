"use client";

import React, { useEffect, useId, useRef, useState } from "react";

function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(" ");
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setReduced(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return reduced;
}

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

export interface IridescentOrbProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onClick"> {
  /** Diameter of the orb in pixels. */
  size?: number;
  /** Behavioral presence state of the orb. */
  state?: OrbState;
  /** Animation speed multiplier (0.2 to 2.5). */
  speed?: number;
  /** Luminosity and gradient intensity (0.4 to 1.6). */
  intensity?: number;
  /** Enables pointer-reactive 3D field tilt and click pulse. */
  interactive?: boolean;
  /** Accessible label describing the orb's purpose or status. */
  ariaLabel?: string;
  /** Optional click handler when interactive is enabled. */
  onClick?: (event: React.SyntheticEvent<HTMLDivElement>) => void;
}

const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = a_position;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

varying vec2 v_uv;

uniform float u_time;
uniform float u_intensity;
uniform float u_pulse;
uniform float u_state_energy;
uniform vec2 u_pointer;

mat3 rotateY(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
}

mat3 rotateX(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c);
}

mat3 rotateZ(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0);
}

// Rich iridescent spectrum tuned to cyan, emerald, lime, gold, rose-magenta, and violet
vec3 iridescentPalette(float t) {
  vec3 a = vec3(0.52, 0.50, 0.56);
  vec3 b = vec3(0.48, 0.48, 0.44);
  vec3 c = vec3(1.00, 1.00, 1.00);
  vec3 d = vec3(0.02, 0.30, 0.64);
  return clamp(a + b * cos(6.2831853 * (c * t + d)), 0.0, 1.0);
}

vec3 acesToneMap(vec3 x) {
  float a = 2.51;
  float b = 0.03;
  float c = 2.43;
  float d = 0.59;
  float e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main() {
  vec2 uv = v_uv;
  float r = length(uv);

  if (r > 1.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float edgeMask = 1.0 - smoothstep(0.985, 1.0, r);
  float z = sqrt(max(0.0, 1.0 - r * r));
  vec3 normal = normalize(vec3(uv, z));

  float t = u_time;
  float energy = u_state_energy;

  // 3D rotated sphere space for volumetric gradients & ribbons
  vec3 p = rotateY(u_pointer.x * 0.5 + t * 0.24) *
           rotateX(-u_pointer.y * 0.5 + sin(t * 0.33) * 0.38) *
           rotateZ(t * 0.15) *
           normal;

  // 1. Smooth volumetric plasma gradient inside the sphere
  float flow1 = sin(p.x * 1.9 + p.y * 1.4 + t * 0.65)
              + 0.65 * cos(p.z * 2.2 - p.x * 1.3 + t * 0.48);
  float flow2 = cos(p.y * 2.1 - p.z * 1.7 - t * 0.58)
              + 0.55 * sin(p.x * 1.6 + p.z * 1.8 - t * 0.42);

  float angle = atan(normal.y, normal.x) / 6.2831853;
  vec3 gradA = iridescentPalette(angle + flow1 * 0.16 + t * 0.06);
  vec3 gradB = iridescentPalette(angle + flow2 * 0.18 + 0.34 - t * 0.04);

  // Soft cloudy interior blend (deep indigo-violet base + luminous gradient mist)
  vec3 deepBase = vec3(0.032, 0.020, 0.088);
  float mistMask = smoothstep(-0.6, 1.1, flow1 * 0.45 + flow2 * 0.35 + 0.25);
  vec3 interiorGradient = mix(deepBase, mix(gradA, gradB, 0.5), 0.26 + 0.32 * mistMask);
  // Subtle dark center depth so ribbons pop
  interiorGradient *= mix(0.58, 1.05, smoothstep(0.0, 0.92, r));

  // 2. Folded 3D caustic ribbon sheet 1 (primary sweeping veil)
  float wave1 = dot(p, vec3(1.55, 1.15, 0.95))
              + 1.35 * sin(p.y * 2.0 + p.z * 1.5 + t * 0.82)
              + 0.60 * cos(p.x * 2.5 - t * 0.58);
  float s1 = sin(wave1);
  float crease1 = exp(-abs(s1) * (9.5 + energy * 2.5));
  float veil1 = smoothstep(0.78, 0.0, abs(s1)) * (0.76 + 0.24 * sin(wave1 * 24.0));

  // 3. Folded 3D caustic ribbon sheet 2 (counter-rotating intersection)
  vec3 p2 = rotateY(-t * 0.26 + 1.15) * rotateX(t * 0.22 - 0.55) * normal;
  float wave2 = dot(p2, vec3(-1.30, 1.65, 1.05))
              + 1.20 * cos(p2.x * 2.2 + p2.y * 1.4 - t * 0.74)
              + 0.50 * sin(p2.z * 2.8 + t * 0.50);
  float s2 = sin(wave2);
  float crease2 = exp(-abs(s2) * (10.5 + energy * 2.0));
  float veil2 = smoothstep(0.72, 0.0, abs(s2)) * (0.78 + 0.22 * sin(wave2 * 22.0));

  vec3 ribbonCol1 = iridescentPalette(angle + p.x * 0.22 + t * 0.07 + 0.10);
  vec3 ribbonCol2 = iridescentPalette(angle + p2.y * 0.25 - t * 0.05 + 0.52);

  vec3 ribbons = ribbonCol1 * veil1 * 0.48 + ribbonCol2 * veil2 * 0.42;

  float totalCrease = crease1 * 0.95 + crease2 * 0.85;
  vec3 creaseTint = ribbonCol1 * crease1 * 0.72 + ribbonCol2 * crease2 * 0.65;
  vec3 hotSpec = vec3(0.98, 0.95, 1.0) * pow(clamp(totalCrease, 0.0, 1.4), 1.45) * 0.88;

  // 4. Vivid 360-degree Fresnel iridescent rim
  float fresnel = pow(1.0 - normal.z, 2.15);
  float rimSharp = pow(1.0 - normal.z, 5.0);
  vec3 rimColor = iridescentPalette(
    angle + 0.16 * sin(normal.x * 2.4 - t * 0.5) + 0.12 * cos(normal.y * 2.2 + t * 0.35) + t * 0.05
  );
  vec3 rimGlow = rimColor * (fresnel * 1.18 + rimSharp * 0.75)
               + vec3(0.96, 0.98, 1.0) * rimSharp * 0.32;

  float power = u_intensity + u_pulse * 0.38;
  vec3 color = interiorGradient * (0.85 + 0.35 * u_intensity)
             + (ribbons + creaseTint + hotSpec + rimGlow) * power;

  color = acesToneMap(color);
  color = pow(color, vec3(0.95));

  gl_FragColor = vec4(color * edgeMask, edgeMask);
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

function drawFallback2D(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  intensity: number
) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2;

  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  const base = ctx.createRadialGradient(
    cx - radius * 0.18,
    cy - radius * 0.18,
    radius * 0.08,
    cx,
    cy,
    radius
  );
  base.addColorStop(0, "#1c1245");
  base.addColorStop(0.55, "#2b1654");
  base.addColorStop(0.85, "#0d0924");
  base.addColorStop(1, "#22f3e8");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  const angle = time * 0.65;
  const grad = ctx.createLinearGradient(
    cx + Math.cos(angle) * radius,
    cy + Math.sin(angle) * radius,
    cx - Math.cos(angle) * radius,
    cy - Math.sin(angle) * radius
  );
  grad.addColorStop(0, `rgba(34, 243, 232, ${0.58 * intensity})`);
  grad.addColorStop(0.28, `rgba(139, 92, 246, ${0.46 * intensity})`);
  grad.addColorStop(0.56, `rgba(255, 77, 166, ${0.54 * intensity})`);
  grad.addColorStop(0.82, `rgba(255, 196, 77, ${0.48 * intensity})`);
  grad.addColorStop(1, `rgba(52, 245, 122, ${0.55 * intensity})`);

  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export const IridescentOrb = React.forwardRef<HTMLDivElement, IridescentOrbProps>(
  (
    {
      size = 320,
      state = "idle",
      speed = 1,
      intensity = 1,
      interactive = true,
      ariaLabel,
      className,
      style,
      onClick,
      onKeyDown,
      ...rest
    },
    ref
  ) => {
    const rawId = useId();
    const safeId = rawId.replace(/:/g, "");
    const prefersReducedMotion = useReducedMotion();

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const pointerTargetRef = useRef({ x: 0, y: 0 });
    const pointerCurrentRef = useRef({ x: 0, y: 0 });
    const pulseRef = useRef(0);

    const clampedSize = Math.min(680, Math.max(64, Number.isFinite(size) ? size : 320));

    const sizeRef = useRef(clampedSize);
    const stateRef = useRef<OrbState>(state);
    const speedRef = useRef(speed);
    const intensityRef = useRef(intensity);
    const reducedMotionRef = useRef(prefersReducedMotion);

    sizeRef.current = clampedSize;
    stateRef.current = state;
    speedRef.current = Math.min(2.5, Math.max(0.2, Number.isFinite(speed) ? speed : 1));
    intensityRef.current = Math.min(
      1.6,
      Math.max(0.4, Number.isFinite(intensity) ? intensity : 1)
    );
    reducedMotionRef.current = prefersReducedMotion;

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const syncCanvasResolution = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const pixelSize = Math.round(sizeRef.current * dpr);
        if (canvas.width !== pixelSize || canvas.height !== pixelSize) {
          canvas.width = pixelSize;
          canvas.height = pixelSize;
        }
      };

      syncCanvasResolution();

      const gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
      });

      let rafId = 0;
      let lastTimestamp = performance.now();
      let elapsed = 2.4;

      if (!gl) {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const render2D = (now: number) => {
          syncCanvasResolution();
          const dt = Math.min((now - lastTimestamp) / 1000, 0.05);
          lastTimestamp = now;
          if (!reducedMotionRef.current) {
            elapsed += dt * speedRef.current;
          }
          drawFallback2D(
            ctx,
            canvas.width,
            canvas.height,
            elapsed,
            intensityRef.current
          );
          if (!reducedMotionRef.current) {
            rafId = requestAnimationFrame(render2D);
          }
        };

        rafId = requestAnimationFrame(render2D);
        return () => cancelAnimationFrame(rafId);
      }

      const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
      const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
      if (!vertexShader || !fragmentShader) return;

      const program = gl.createProgram();
      if (!program) return;

      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        return;
      }

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW
      );

      const positionLoc = gl.getAttribLocation(program, "a_position");
      const timeLoc = gl.getUniformLocation(program, "u_time");
      const intensityLoc = gl.getUniformLocation(program, "u_intensity");
      const pulseLoc = gl.getUniformLocation(program, "u_pulse");
      const energyLoc = gl.getUniformLocation(program, "u_state_energy");
      const pointerLoc = gl.getUniformLocation(program, "u_pointer");

      const getStateParams = (currentState: OrbState) => {
        switch (currentState) {
          case "listening":
            return { rate: 1.15, energy: 0.45, pulseAmp: 0.14 };
          case "thinking":
            return { rate: 1.75, energy: 0.85, pulseAmp: 0.08 };
          case "speaking":
            return { rate: 1.45, energy: 0.7, pulseAmp: 0.35 };
          case "idle":
          default:
            return { rate: 0.85, energy: 0.2, pulseAmp: 0.04 };
        }
      };

      const renderFrame = (now: number) => {
        syncCanvasResolution();
        const dt = Math.min((now - lastTimestamp) / 1000, 0.05);
        lastTimestamp = now;

        const params = getStateParams(stateRef.current);

        if (!reducedMotionRef.current) {
          elapsed += dt * speedRef.current * params.rate;
        }

        const lerp = 1 - Math.exp(-dt * 8);
        pointerCurrentRef.current.x +=
          (pointerTargetRef.current.x - pointerCurrentRef.current.x) * lerp;
        pointerCurrentRef.current.y +=
          (pointerTargetRef.current.y - pointerCurrentRef.current.y) * lerp;

        pulseRef.current *= Math.exp(-dt * 5.5);

        const speakingWave =
          stateRef.current === "speaking" && !reducedMotionRef.current
            ? (0.5 + 0.5 * Math.sin(elapsed * 5.2)) * params.pulseAmp
            : params.pulseAmp * (0.5 + 0.5 * Math.sin(elapsed * 1.6));

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

        gl.uniform1f(timeLoc, elapsed);
        gl.uniform1f(intensityLoc, intensityRef.current);
        gl.uniform1f(pulseLoc, pulseRef.current + speakingWave);
        gl.uniform1f(energyLoc, params.energy);
        gl.uniform2f(
          pointerLoc,
          pointerCurrentRef.current.x,
          pointerCurrentRef.current.y
        );

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        if (!reducedMotionRef.current) {
          rafId = requestAnimationFrame(renderFrame);
        }
      };

      rafId = requestAnimationFrame(renderFrame);

      return () => {
        cancelAnimationFrame(rafId);
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
      };
    }, [prefersReducedMotion]);

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
      if (!interactive || prefersReducedMotion) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      pointerTargetRef.current = {
        x: Math.max(-1, Math.min(1, nx)),
        y: Math.max(-1, Math.min(1, ny)),
      };
    };

    const handlePointerLeave = () => {
      pointerTargetRef.current = { x: 0, y: 0 };
    };

    const triggerActivation = (event: React.SyntheticEvent<HTMLDivElement>) => {
      if (!interactive) return;
      if (!prefersReducedMotion) {
        pulseRef.current = 1.0;
      }
      onClick?.(event);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (!interactive) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        triggerActivation(event);
      }
    };

    const computedLabel =
      ariaLabel || `Iridescent AI presence orb in ${state} state`;

    return (
      <div
        ref={ref}
        id={`iridescent-orb-${safeId}`}
        role={interactive ? "button" : "img"}
        tabIndex={interactive ? 0 : undefined}
        aria-label={computedLabel}
        data-state={state}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onClick={interactive ? triggerActivation : undefined}
        onKeyDown={handleKeyDown}
        style={{
          width: clampedSize,
          height: clampedSize,
          ...style,
        }}
        className={cn(
          "relative inline-flex shrink-0 select-none items-center justify-center rounded-full",
          "transition-transform duration-300 ease-out",
          interactive &&
            "cursor-pointer hover:scale-[1.015] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent",
          className
        )}
        {...rest}
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="block h-full w-full rounded-full"
        />
      </div>
    );
  }
);

IridescentOrb.displayName = "IridescentOrb";

export { IridescentOrb as component, IridescentOrb as Component };
export default IridescentOrb;