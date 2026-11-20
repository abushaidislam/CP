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
  /** Luminosity and caustic ribbon intensity (0.4 to 1.6). */
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

vec3 spectrum(float t) {
  vec3 a = vec3(0.54, 0.50, 0.56);
  vec3 b = vec3(0.46, 0.48, 0.44);
  vec3 c = vec3(1.0, 1.0, 1.0);
  vec3 d = vec3(0.08, 0.36, 0.68);
  return a + b * cos(6.2831853 * (c * t + d));
}

void main() {
  vec2 uv = v_uv;
  float r = length(uv);

  if (r > 1.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float edgeMask = 1.0 - smoothstep(0.986, 1.0, r);
  float z = sqrt(max(0.0, 1.0 - r * r));
  vec3 normal = normalize(vec3(uv, z));

  // Subtle 3D tilt driven by pointer and state energy
  vec3 p = rotateY(u_pointer.x * 0.48 + u_time * 0.22) *
           rotateX(-u_pointer.y * 0.48 + sin(u_time * 0.31) * 0.35) *
           rotateZ(u_time * 0.14) *
           normal;

  float t = u_time;
  float energy = u_state_energy;

  // Folded 3D caustic ribbon sheet 1 (primary sweeping veil)
  float wave1 = dot(p, vec3(1.65, 1.15, 0.95))
              + 1.35 * sin(p.y * 2.1 + p.z * 1.6 + t * 0.85)
              + 0.65 * cos(p.x * 2.6 - t * 0.62);
  float s1 = sin(wave1);
  float crease1 = exp(-abs(s1) * (10.5 + energy * 2.5));
  float veil1 = smoothstep(0.75, 0.0, abs(s1)) * (0.72 + 0.28 * sin(wave1 * 26.0));

  // Folded 3D caustic ribbon sheet 2 (counter-rotating intersection)
  vec3 p2 = rotateY(-t * 0.28 + 1.1) * rotateX(t * 0.21 - 0.6) * normal;
  float wave2 = dot(p2, vec3(-1.35, 1.75, 1.05))
              + 1.25 * cos(p2.x * 2.3 + p2.y * 1.4 - t * 0.78)
              + 0.55 * sin(p2.z * 2.9 + t * 0.54);
  float s2 = sin(wave2);
  float crease2 = exp(-abs(s2) * (11.5 + energy * 2.0));
  float veil2 = smoothstep(0.68, 0.0, abs(s2)) * (0.76 + 0.24 * sin(wave2 * 24.0));

  // Folded 3D caustic ribbon sheet 3 (deep volumetric under-glow)
  vec3 p3 = rotateZ(t * 0.19 - 0.8) * rotateY(t * 0.16) * normal;
  float wave3 = dot(p3, vec3(1.1, -1.4, 1.8))
              + 1.45 * sin(p3.z * 1.9 - p3.x * 1.7 + t * 0.52);
  float s3 = sin(wave3);
  float crease3 = exp(-abs(s3) * 8.0);
  float veil3 = smoothstep(0.85, 0.0, abs(s3)) * 0.55;

  // Spectral dispersion across the folded sheets
  float hueBase = atan(normal.y, normal.x) / 6.2831853 + t * 0.055;
  vec3 col1 = spectrum(hueBase + p.x * 0.22 + 0.12);
  vec3 col2 = spectrum(hueBase + p2.y * 0.26 + 0.48);
  vec3 col3 = spectrum(hueBase + p3.z * 0.24 + 0.78);

  // Fresnel iridescent shell rim
  float fresnel = pow(1.0 - normal.z, 2.35);
  float rimSharp = pow(1.0 - normal.z, 5.2);
  vec3 rimColor = spectrum(hueBase + 0.18 * sin(p.x * 2.2 - t * 0.45) + 0.08 * cos(p.y * 2.4));

  // Deep obsidian-indigo interior core
  vec3 coreColor = vec3(0.024, 0.016, 0.058)
                 + vec3(0.055, 0.032, 0.11) * (1.0 - r * 0.65);

  vec3 ribbons = col1 * veil1 * 0.42
               + col2 * veil2 * 0.38
               + col3 * veil3 * 0.32;

  float totalCrease = crease1 * 0.95 + crease2 * 0.85 + crease3 * 0.55;
  vec3 hotSpec = vec3(0.97, 0.94, 1.0) * pow(clamp(totalCrease, 0.0, 1.4), 1.35) * 0.85;
  vec3 creaseTint = (col1 * crease1 + col2 * crease2 + col3 * crease3) * 0.65;

  vec3 rimGlow = rimColor * (fresnel * 0.92 + rimSharp * 0.65);
  vec3 specularRim = vec3(0.95, 0.97, 1.0) * rimSharp * 0.32;

  vec3 finalColor = coreColor
                  + (ribbons + creaseTint + hotSpec + rimGlow + specularRim) * (u_intensity + u_pulse * 0.38);

  // Soft tone mapping to preserve luminous highlights without harsh clipping
  finalColor = finalColor / (1.0 + 0.35 * finalColor);
  finalColor = pow(max(finalColor, 0.0), vec3(0.94));

  gl_FragColor = vec4(finalColor * edgeMask, edgeMask);
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

  const core = ctx.createRadialGradient(
    cx - radius * 0.15,
    cy - radius * 0.15,
    radius * 0.1,
    cx,
    cy,
    radius
  );
  core.addColorStop(0, "#171033");
  core.addColorStop(0.72, "#090616");
  core.addColorStop(1, "#22f3e8");
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, width, height);

  const angle = time * 0.6;
  const grad = ctx.createLinearGradient(
    cx + Math.cos(angle) * radius,
    cy + Math.sin(angle) * radius,
    cx - Math.cos(angle) * radius,
    cy - Math.sin(angle) * radius
  );
  grad.addColorStop(0, `rgba(34, 243, 232, ${0.42 * intensity})`);
  grad.addColorStop(0.35, `rgba(139, 92, 246, ${0.32 * intensity})`);
  grad.addColorStop(0.68, `rgba(255, 77, 166, ${0.38 * intensity})`);
  grad.addColorStop(1, `rgba(217, 255, 77, ${0.42 * intensity})`);

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

    const stateRef = useRef<OrbState>(state);
    const speedRef = useRef(speed);
    const intensityRef = useRef(intensity);
    const reducedMotionRef = useRef(prefersReducedMotion);

    stateRef.current = state;
    speedRef.current = Math.min(2.5, Math.max(0.2, Number.isFinite(speed) ? speed : 1));
    intensityRef.current = Math.min(
      1.6,
      Math.max(0.4, Number.isFinite(intensity) ? intensity : 1)
    );
    reducedMotionRef.current = prefersReducedMotion;

    const clampedSize = Math.min(680, Math.max(64, Number.isFinite(size) ? size : 320));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const updateCanvasSize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const pixelSize = Math.round(clampedSize * dpr);
        if (canvas.width !== pixelSize || canvas.height !== pixelSize) {
          canvas.width = pixelSize;
          canvas.height = pixelSize;
        }
      };

      updateCanvasSize();

      const gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: true,
        premultipliedAlpha: true,
      });

      let rafId = 0;
      let lastTimestamp = performance.now();
      let elapsed = 2.4; // Start on an expressive iridescent fold frame

      if (!gl) {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const render2D = (now: number) => {
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
        updateCanvasSize();
        const dt = Math.min((now - lastTimestamp) / 1000, 0.05);
        lastTimestamp = now;

        const params = getStateParams(stateRef.current);

        if (!reducedMotionRef.current) {
          elapsed += dt * speedRef.current * params.rate;
        }

        // Critically damped pointer smoothing
        const lerp = 1 - Math.exp(-dt * 8);
        pointerCurrentRef.current.x +=
          (pointerTargetRef.current.x - pointerCurrentRef.current.x) * lerp;
        pointerCurrentRef.current.y +=
          (pointerTargetRef.current.y - pointerCurrentRef.current.y) * lerp;

        // Decay click pulse
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
    }, [clampedSize, prefersReducedMotion, state, speed, intensity]);

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