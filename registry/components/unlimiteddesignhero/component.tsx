"use client";

import React, {
  forwardRef,
  useState,
  useEffect,
  useRef,
  useId,
  useCallback,
} from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ShowcaseSlide {
  id: string;
  title: string;
  category: string;
  imageSrc: string;
  alt: string;
}

export interface StartupLogoItem {
  id: string;
  name: string;
  svg: React.ReactNode;
}

export interface LeaderAvatar {
  id: string;
  name: string;
  role: string;
  src: string;
}

export interface PricingPlanOption {
  id: string;
  name: string;
  price: string;
  cadence: string;
  description: string;
  turnaround: string;
  badge?: string;
  features: string[];
}

export interface UnlimitedDesignHeroProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "onSelect"
> {
  /** Top availability status text */
  statusText?: string;
  /** Number of open booking spots remaining */
  spotsLeft?: number;
  /** Whether booking is currently open */
  isBookingOpen?: boolean;
  /** Main headline segments */
  headlineTopLeft?: string;
  headlineTopRight?: string;
  headlineBottomLeft?: string;
  headlineBottomRight?: string;
  /** Supporting value proposition copy */
  subtitleLine1?: string;
  subtitleLine2?: string;
  /** Primary CTA button label */
  ctaText?: string;
  /** Social proof caption below leader avatars */
  trustedText?: string;
  /** Showcase slides inside the top inline pill */
  showcaseSlides?: ShowcaseSlide[];
  /** Auto-advance interval in milliseconds for the top showcase pill */
  slideIntervalMs?: number;
  /** Controlled active slide index */
  activeSlideIndex?: number;
  /** Callback when active slide changes */
  onSlideChange?: (index: number) => void;
  /** Startup logos inside the bottom inline marquee pill */
  logos?: StartupLogoItem[];
  /** Marquee loop duration in seconds */
  marqueeDurationSec?: number;
  /** Leader avatars for social proof stack */
  avatars?: LeaderAvatar[];
  /** Subscription plans displayed when clicking "Choose your plan" */
  plans?: PricingPlanOption[];
  /** Callback when user clicks the primary CTA or selects a plan */
  onCtaClick?: () => void;
  onSelectPlan?: (plan: PricingPlanOption) => void;
}

// ============================================================================
// WEBGL1 "WAVES" SHADER BACKGROUND
// ============================================================================

const WAVES_VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const WAVES_FRAGMENT_SHADER = `
// "Waves" — made with the 21st.dev Shader Builder
// Packed WebGL1 uniforms (the shader exposes readable u_* aliases as macros):
//   u_colors[8] (first 4 used)
//   vec3(0.102, 0.078, 0.137)
//   vec3(0.718, 0.365, 0.412)
//   vec3(0.918, 0.804, 0.761)
//   vec3(1.000, 0.961, 0.922)
//   u_scene = vec4(canvas width, canvas height, seconds * -0.67, 4.0)
//   u_shape = vec4(1.32, 0.49, 0.84, 0.01)
//   u_surface = vec4(1.73, 1.08, 0.07, 2.00)
//   u_finish = vec4(2.27, 0.00, 0.040, 0.35)
//   u_transform = vec4(4984.0, 3.37, 0.40, 1.0)
//   u_space = vec4(-0.13, 0.05, pointer x, pointer y)
//   u_cursor = vec4(presence, 3.0, 0.54, 0.56)

#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec3 u_colors[8];
// Seven packed vectors + eight colour vectors = 15 fragment uniform vectors,
// one below WebGL1's guaranteed minimum. Macros preserve the public u_* API.
uniform vec4 u_scene;      // resolution.xy, time, colour count
uniform vec4 u_shape;      // scale, intensity, paramA, warp
uniform vec4 u_surface;    // detail, contrast, brightness, saturation
uniform vec4 u_finish;     // hue, vignette, blur, grain
uniform vec4 u_transform;  // seed, rotation, drift, OKLab toggle
uniform vec4 u_space;      // offset.xy, pointer.xy
uniform vec4 u_cursor;

#define u_resolution u_scene.xy
#define u_time u_scene.z
#define u_colorCount u_scene.w
#define u_scale u_shape.x
#define u_intensity u_shape.y
#define u_paramA u_shape.z
#define u_warp u_shape.w
#define u_detail u_surface.x
#define u_contrast u_surface.y
#define u_brightness u_surface.z
#define u_saturation u_surface.w
#define u_hue u_finish.x
#define u_vignette u_finish.y
#define u_blur u_finish.z
#define u_grain u_finish.w
#ifdef GL_FRAGMENT_PRECISION_HIGH
#define u_seed u_transform.x
#else
// Keep hash inputs inside mediump's guaranteed +-2^14 range.
#define u_seed mod(u_transform.x, 31.0)
#endif
#define u_rotate u_transform.y
#define u_drift u_transform.z
#define u_oklab u_transform.w
#define u_offset u_space.xy
#define u_mouse u_space.zw
#define u_cursorPresence u_cursor.x
#define u_cursorEffect u_cursor.y
#define u_cursorStrength u_cursor.z
#define u_cursorRadius u_cursor.w

float hash21(vec2 p) {
#ifndef GL_FRAGMENT_PRECISION_HIGH
  p = mod(p, 31.0);
#endif
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

// Even, un-structured white noise for film grain (Dave Hoskins hash12). The
// multiply hash above is fine for value noise but shows a faint axis-aligned
// mesh at integer fragment coords, which reads as a net over flat areas.
float grainHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
#ifndef GL_FRAGMENT_PRECISION_HIGH
  p = mod(p, 31.0);
#endif
  float n = sin(dot(p, vec2(41.0, 289.0)));
  return fract(vec2(15731.743, 7892.321) * n);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(17.0, 9.2);
    a *= 0.5;
  }
  return v;
}

// --- OKLab colour mixing (perceptual), gated by u_oklab -----------------------
vec3 srgbToLinear(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)),
    step(0.04045, c));
}
vec3 linearToSrgb(vec3 c) {
  // max() guards the sRGB branch: out-of-gamut OKLab interpolations can send a
  // channel negative, and pow(negative, ...) is NaN which mix()/step() would
  // then propagate. The linear branch clips such channels to 0 downstream.
  return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055,
    step(0.0031308, c));
}
vec3 linToOklab(vec3 c) {
  float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
  float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
  float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;
  l = pow(max(l, 0.0), 1.0 / 3.0);
  m = pow(max(m, 0.0), 1.0 / 3.0);
  s = pow(max(s, 0.0), 1.0 / 3.0);
  return vec3(
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s);
}
vec3 oklabToLin(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l; m = m * m * m; s = s * s * s;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
}
vec3 mixColour(vec3 a, vec3 b, float t) {
  if (u_oklab > 0.5) {
    vec3 la = linToOklab(srgbToLinear(a));
    vec3 lb = linToOklab(srgbToLinear(b));
    return clamp(linearToSrgb(oklabToLin(mix(la, lb, t))), 0.0, 1.0);
  }
  return mix(a, b, t);
}

// Mix through the recipe colours; x is clamped to 0..1. WebGL1 forbids
// dynamic uniform indexing in fragment shaders, hence the constant loop.
vec3 palette(float x) {
  float n = max(u_colorCount - 1.0, 1.0);
  float f = clamp(x, 0.0, 1.0) * n;
  vec3 col = u_colors[0];
  for (int i = 0; i < 7; i++) {
    if (float(i) < n)
      col = mixColour(col, u_colors[i + 1],
        smoothstep(0.0, 1.0, clamp(f - float(i), 0.0, 1.0)));
  }
  return col;
}

vec3 hueRotate(vec3 col, float a) {
  const mat3 toYIQ = mat3(0.299, 0.596, 0.211,
                          0.587, -0.274, -0.523,
                          0.114, -0.322, 0.312);
  const mat3 toRGB = mat3(1.0, 1.0, 1.0,
                          0.956, -0.272, -1.106,
                          0.621, -0.647, 1.703);
  vec3 yiq = toYIQ * col;
  float ca = cos(a), sa = sin(a);
  yiq = vec3(yiq.x, yiq.y * ca - yiq.z * sa, yiq.y * sa + yiq.z * ca);
  return toRGB * yiq;
}

vec3 shade(vec2 uv, vec2 p, float t) {
  float y = uv.y
    + sin(uv.x * (3.0 + u_intensity * 9.0) + t * 0.8) * 0.08
    + (fbm(p * 2.0 + t * 0.1) - 0.5) * u_intensity * 0.6;
  return palette(y);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 screenUv = uv;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
    / min(u_resolution.x, u_resolution.y);
  float cursorMask = 0.0;

  // Cursor modes 1-3 are local distortions. Push shifts the same screen-space
  // coordinates before field transforms, so Zoom/Rotate don't change its feel.
  if (u_cursorPresence > 0.001) {
    // u_mouse is normalized to -1..1 in canvas space. Convert it to the same
    // aspect-corrected screen space as p so effects stay under the cursor.
    vec2 cursor = (0.5 * u_mouse * u_resolution.xy)
      / min(u_resolution.x, u_resolution.y);
    vec2 cursorDelta = p - cursor;
    if (u_cursorEffect < 0.5) {
      p += cursor * u_cursorPresence * u_cursorStrength * 0.55;
    } else {
      float cursorDistance = length(cursorDelta);
      vec2 cursorDirection = cursorDelta / max(cursorDistance, 0.0001);
      cursorMask = u_cursorPresence
        * (1.0 - smoothstep(0.0, u_cursorRadius, cursorDistance));
      if (u_cursorEffect < 1.5) {
        p -= cursorDirection * cursorMask * u_cursorStrength * 0.24;
      } else if (u_cursorEffect < 2.5) {
        float cursorAngle = cursorMask * u_cursorStrength * 2.2;
        float cc = cos(cursorAngle), cs = sin(cursorAngle);
        p = cursor + mat2(cc, -cs, cs, cc) * cursorDelta;
      } else if (u_cursorEffect < 3.5) {
        float ripple = sin(
          cursorDistance / max(u_cursorRadius, 0.001) * 18.0 - u_time * 5.0);
        p -= cursorDirection * ripple * cursorMask * u_cursorStrength * 0.07;
      }
    }
  }

  // Keep presets that read uv (rather than p) in the same warped space.
  uv = p * min(u_resolution.x, u_resolution.y) / u_resolution.xy + 0.5;
  p *= u_scale;
  // Field transform: rotate, pan, pointer push, slow drift.
  if (abs(u_rotate) > 0.0001) {
    float cr = cos(u_rotate), sr = sin(u_rotate);
    p = mat2(cr, -sr, sr, cr) * p;
  }
  p += u_offset;
  if (u_drift > 0.0001)
    p += u_drift * vec2(sin(u_time * 0.31), cos(u_time * 0.23));
  // Organic domain warp.
  if (u_warp > 0.0) {
    p += u_warp * (vec2(
      fbm(p * u_detail + u_seed),
      fbm(p * u_detail + vec2(5.2, 1.3))) - 0.5);
  }
  // Shade, with an optional soft 5-tap blur.
  vec3 col;
  if (u_blur > 0.0) {
    float e = u_blur;
    float pe = e * u_scale;
    vec2 uvE = vec2(e) * min(u_resolution.x, u_resolution.y) / u_resolution.xy;
    col  = shade(uv, p, u_time) * 0.36;
    col += shade(uv + vec2(uvE.x, 0.0), p + vec2(pe, 0.0), u_time) * 0.16;
    col += shade(uv - vec2(uvE.x, 0.0), p - vec2(pe, 0.0), u_time) * 0.16;
    col += shade(uv + vec2(0.0, uvE.y), p + vec2(0.0, pe), u_time) * 0.16;
    col += shade(uv - vec2(0.0, uvE.y), p - vec2(0.0, pe), u_time) * 0.16;
  } else {
    col = shade(uv, p, u_time);
  }
  // Post: contrast, saturation, hue, brightness, vignette, grain.
  if (abs(u_contrast - 1.0) > 0.0001)
    col = (col - 0.5) * u_contrast + 0.5;
  if (abs(u_saturation - 1.0) > 0.0001) {
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(luma), col, u_saturation);
  }
  if (abs(u_hue) > 0.0001)
    col = hueRotate(col, u_hue);
  if (abs(u_brightness) > 0.0001)
    col += u_brightness;
  if (u_vignette > 0.0001) {
    float vd = length(screenUv - 0.5) * 1.41421356;
    col *= 1.0 - u_vignette * smoothstep(0.35, 1.0, vd);
  }
  if (u_cursorPresence > 0.001 && u_cursorEffect > 3.5)
    col += (vec3(0.18) + col * 0.12) * cursorMask * u_cursorStrength;
  if (u_grain > 0.0001)
    col += (grainHash(
      gl_FragCoord.xy + vec2(u_seed * 17.0, u_seed * 31.0)) - 0.5) * u_grain;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

const WAVES_COLORS = new Float32Array([
  0.102, 0.078, 0.137, 0.718, 0.365, 0.412, 0.918, 0.804, 0.761, 1.0, 0.961,
  0.922, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
]);

interface WavesShaderBackgroundProps {
  reduceMotion?: boolean;
}

const WavesShaderBackground: React.FC<WavesShaderBackgroundProps> = ({
  reduceMotion = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      (canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
      }) as WebGLRenderingContext | null) ||
      (canvas.getContext("experimental-webgl", {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
      }) as WebGLRenderingContext | null);

    if (!gl) return;

    const compileShader = (
      type: number,
      source: string
    ): WebGLShader | null => {
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

    const vs = compileShader(gl.VERTEX_SHADER, WAVES_VERTEX_SHADER);
    const fs = compileShader(gl.FRAGMENT_SHADER, WAVES_FRAGMENT_SHADER);
    if (!vs || !fs) {
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      return;
    }

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      return;
    }

    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, "a_position");
    if (positionLocation >= 0) {
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    }

    const uColorsLoc = gl.getUniformLocation(program, "u_colors");
    const uSceneLoc = gl.getUniformLocation(program, "u_scene");
    const uShapeLoc = gl.getUniformLocation(program, "u_shape");
    const uSurfaceLoc = gl.getUniformLocation(program, "u_surface");
    const uFinishLoc = gl.getUniformLocation(program, "u_finish");
    const uTransformLoc = gl.getUniformLocation(program, "u_transform");
    const uSpaceLoc = gl.getUniformLocation(program, "u_space");
    const uCursorLoc = gl.getUniformLocation(program, "u_cursor");

    if (uColorsLoc) gl.uniform3fv(uColorsLoc, WAVES_COLORS);
    if (uShapeLoc) gl.uniform4f(uShapeLoc, 1.32, 0.49, 0.84, 0.01);
    if (uSurfaceLoc) gl.uniform4f(uSurfaceLoc, 1.73, 1.08, 0.07, 2.0);
    if (uFinishLoc) gl.uniform4f(uFinishLoc, 2.27, 0.0, 0.04, 0.35);
    if (uTransformLoc) gl.uniform4f(uTransformLoc, 4984.0, 3.37, 0.4, 1.0);
    if (uSpaceLoc) gl.uniform4f(uSpaceLoc, -0.13, 0.05, 0.0, 0.0);
    if (uCursorLoc) gl.uniform4f(uCursorLoc, 0.0, 3.0, 0.54, 0.56);

    const updateSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    updateSize();

    let rafId: number | null = null;
    let elapsedMs = 0;
    let lastTimestamp: number | null = null;

    const drawFrame = (seconds: number) => {
      if (uSceneLoc) {
        gl.uniform4f(
          uSceneLoc,
          canvas.width,
          canvas.height,
          seconds * -0.67,
          4.0
        );
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const tick = (now: number) => {
      if (document.hidden) {
        rafId = null;
        lastTimestamp = null;
        return;
      }
      if (lastTimestamp !== null) {
        elapsedMs += now - lastTimestamp;
      }
      lastTimestamp = now;
      drawFrame(elapsedMs * 0.001);
      rafId = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (reduceMotion) {
        drawFrame(0);
        return;
      }
      if (!document.hidden && rafId === null) {
        lastTimestamp = null;
        rafId = requestAnimationFrame(tick);
      }
    };

    const stopLoop = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      lastTimestamp = null;
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopLoop();
      } else {
        startLoop();
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
      if (reduceMotion || document.hidden) {
        drawFrame(elapsedMs * 0.001);
      }
    });
    resizeObserver.observe(canvas);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    startLoop();

    return () => {
      stopLoop();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (buffer) gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [reduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
};

// ============================================================================
// CRITICALLY-DAMPED FRAMER MOTION VARIANTS (ZERO LAYOUT SHIFT)
// ============================================================================

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

const charVariants: Variants = {
  hidden: {
    opacity: 0,
    y: "0.24em",
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    y: "0em",
    filter: "blur(0px)",
    transition: {
      duration: 0.42,
      ease: EASE_OUT_EXPO,
    },
  },
};

const wordTypingVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
    filter: "blur(4px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.36,
      ease: EASE_OUT_EXPO,
    },
  },
};

// ============================================================================
// SUBCOMPONENTS: TYPED HEADLINE & TYPEWRITER BADGE/SUBTITLE
// ============================================================================

interface TypedHeadlineSegmentProps {
  text: string;
  delay?: number;
  stagger?: number;
  className?: string;
  reduceMotion?: boolean;
}

/**
 * Splits a headline segment into individual character spans that type/unblur
 * into place sequentially without shifting layout coordinates.
 */
const TypedHeadlineSegment: React.FC<TypedHeadlineSegmentProps> = ({
  text,
  delay = 0,
  stagger = 0.028,
  className = "",
  reduceMotion = false,
}) => {
  if (reduceMotion) {
    return <span className={className}>{text}</span>;
  }

  const chars = Array.from(text);

  return (
    <motion.span
      aria-label={text}
      className={cn("inline-flex whitespace-pre", className)}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: delay,
            staggerChildren: stagger,
          },
        },
      }}
    >
      {chars.map((char, index) => (
        <motion.span
          key={`${char}-${index}`}
          aria-hidden="true"
          variants={charVariants}
          className="inline-block will-change-[transform,opacity,filter]"
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.span>
  );
};

interface TypewriterStreamTextProps {
  text: string;
  startDelayMs?: number;
  charSpeedMs?: number;
  showCursorWhileTyping?: boolean;
  reduceMotion?: boolean;
  className?: string;
}

/**
 * True character-stream typewriter effect with an auto-hiding terminal cursor
 * for status badges and micro-copy. Reserves full width so bounding box never jumps.
 */
const TypewriterStreamText: React.FC<TypewriterStreamTextProps> = ({
  text,
  startDelayMs = 120,
  charSpeedMs = 24,
  showCursorWhileTyping = true,
  reduceMotion = false,
  className = "",
}) => {
  const [visibleCount, setVisibleCount] = useState(
    reduceMotion ? text.length : 0
  );
  const [isTypingDone, setIsTypingDone] = useState(reduceMotion);

  useEffect(() => {
    if (reduceMotion) {
      setVisibleCount(text.length);
      setIsTypingDone(true);
      return;
    }

    setVisibleCount(0);
    setIsTypingDone(false);

    let intervalId: ReturnType<typeof setInterval> | null = null;
    const startTimeout = setTimeout(() => {
      let idx = 0;
      intervalId = setInterval(() => {
        idx += 1;
        setVisibleCount(idx);
        if (idx >= text.length) {
          if (intervalId) clearInterval(intervalId);
          setIsTypingDone(true);
        }
      }, charSpeedMs);
    }, startDelayMs);

    return () => {
      clearTimeout(startTimeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, startDelayMs, charSpeedMs, reduceMotion]);

  const typedSlice = text.slice(0, visibleCount);
  const untypedSlice = text.slice(visibleCount);

  return (
    <span className={cn("relative inline-block", className)} aria-label={text}>
      <span aria-hidden="true">{typedSlice}</span>
      {showCursorWhileTyping && !isTypingDone && (
        <motion.span
          aria-hidden="true"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.55, repeat: Infinity, ease: "linear" }}
          className="ml-[1px] inline-block h-[0.88em] w-[1.5px] translate-y-[1.5px] bg-[#EF471C] align-baseline"
        />
      )}
      {/* Invisible reserve text prevents width reflow while typing */}
      <span
        aria-hidden="true"
        className="pointer-events-none select-none opacity-0"
      >
        {untypedSlice}
      </span>
    </span>
  );
};

// ============================================================================
// DEFAULT REFERENCE ASSETS (EXTRACTED 1:1 FROM REFERENCE MEDIA)
// ============================================================================

const DEFAULT_SLIDES: ShowcaseSlide[] = [
  {
    id: "mobile-apps",
    title: "Hobby Point & Longboarding Mobile UI",
    category: "iOS & Android Product Design",
    imageSrc:
      "data:image/webp;base64,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",
    alt: "Two mobile app interfaces: Hobby Point collectibles store in yellow and red, and Longboarding e-commerce app in green, yellow, and purple",
  },
  {
    id: "fintech-cards",
    title: "Fintech Checkout & Card Issuance System",
    category: "Design System & Web App",
    imageSrc:
      "data:image/webp;base64,UklGRn4ZAABXRUJQVlA4IHIZAABQWQCdASqSAG8APhkKhEEhBZqBtgQAYSzAGb8gB+IHYbYp7N+N/7mf1z5Y6w/XvvJ+4f+a6yygPMw8n/VP8z/df3N/tnbB8wf9L/8r/cv3H/wndR8xH9D/yH/J/3Xu2/7T1mf3D1EP51/dess9Ab9t/Vn/5n7nfCJ+0n7afAd+uv3/4prvj+7/kz5w/j3z7+C/KX9zecV1R5h/yr7nfiv7t+3X5b/Jn+q/K78bvc/5C/3XqKfjf83/wv5bf3v91eW/sR+w3sO+5H1f/jf4jyD/7D0y+yPsBfzX+lf5T+2/uR/hv//9ef8LxnPPfYF/oH95/4/9v/Mb6ZP7H/0f5v8qvcH9L/+L/LfAR/Mf6x/rf8D+9f+c///1v+yz91/Z2/cRGqstzMlx2pSN+7Pg/JfhFBSh2+KYo7OG8/biLPDH3tF0Ugg0QG9dKE/voghB114sVN3Xr9z5cmORG+E3rdtD8rIWPdNzYrSoBWGBFf2MaiUfoLQ7NerU2QBA/Knxws1DgZ4ZGpVDfQp/OI6VS9hoX8odbLv0kL16U/c+G/XiTu4/LsMfMOAohnS+CT0dpVaXyrlv7t373yDSZ9Z01xPUHsUcwtcwaCWhDTQrPdeTRVFJ30vRg9b19SVwNOoYm3RnSXTTDXzI0QTEEWP1IFrgVqymsF1KAJcJEd8OJRPNKFUAZvyDFHJwDqFFYD9pVbUpyq6VcBVbaNhCY0DCa0vw+Enqh6NZJpWU+MMtDqW9MIZHtUPiQwnmqrFr8++F3CxQu/qZ5eTz130NUeDo6NE7/ZSg4NBMWelowE8Nbi1kFjRbqnXTcoYkaawAIKLN2G3sZRHijyDyM7RK+IYE2RuJcVqGwL1/1GPv2G7+Zm5xWQJ95YV3lIW1sKn8SK9tpJmbgYiYNosSQcHT3zp8nivJf/GYzTC3UN+4AVD3+i2SYZyWOWr7xS6azGSoE/A34WmytkgA/ndP0yF3j9YKRwOJvIKHPG+ExG57EXsMzav93i2ez1IpsySDrkYTO767aJCCz7r5rMJ5c7FFjB2W8korA5dAVWzg5qUt6JWgYtR0tTeb/zfi4HTGqbsVLyc5rG06wm2+PAa8paViBmd34qKSABAH3wFueefuinALfwf+R9RjUqPmNdgCEDX0myLLHUYoEiDt3AH0biOcHcbFFrmAbblKAz+rg0tiu+Qvf7qKSmNlYcMILJc7QKPe+Fb/JNJA/W42G3K75YZNuHTlaJm0MgFeufelRwrgYAFOAb/LjAh/acWmf5Lw3P1jIeKk/Yftn6a+SZwjatTp7dck2VHcnEQaV9ETvVMg9J+HL6kVnYOW7Ax/qRIEUQ5zFDfADJqmvdxfzIGOFMT97xYqAwpjnup6f9ydNQdsEiagzGFknQ9PpANPYjzJFq06mDczB8Gt9rmr6iOEkqZ0Sn3clmVargZW/Su3dQ5p4dr8VQIjrl0/GDIhiqPryF2EgE6F4oex/YZnGWsmjRyMr01vxmOB48kNlD9b2+s6Svk3xFp0xuaazm/mZG1XzrijmOwwFqAOGjQQB5fwEyrp1mcT4SskxTmGpm+G5nldno/xw9pVbofhJTvZ7zetJlZ5wSDOH9oexMBvZC20jYoFQKH9SSKT7Mt+jBsDVBDj0Qe53tovCgstKiQIT7Og048RzwCfOaHhYZ+auD5lVRHElLCMs8l8QqTVUxkcDUFHO+n6RaoXlE9LDtMJT+n1thRC1kI4Gc9H1GMRrIXOZsf/nTpvZp6DITcHji7wOxgRmPDcTil+OoNKTAz13dM74/cGBFeN+HgAHBzPo0gnfb6ZQhtkWWOQPz4qvakpvypmjrfrrOjn6rcyOu82IU0f5nDInGz4u/E+/5Jacda4ATsEEyUFqrVM9zdfGfcTmCZ0HR6AU+0EhP5723G1uDJlJNWCGmkT5DRKmlgFlM0cvsADXUbVEoLcKMS5WGn6fc/hc4Lc8dQQRBQEzGzXJopWkk5K8JVBDM0hLixqpP62XPV9u9XIowTP4qfBM/v/nWqvgf9hYi06++74/+OiKdslhafB24+at3gHYIJ9YyOseb26CMBMR/B0Mq1Tz7RL1pJFlTeOcaxNdHBLr2/+q01Duuoo7IxgbJ6G9bwzdQW1bkHADcE3oO1TieEFdWmQfK1btS1CMEqzjUkfgoQTWAmDN3ZNtMfdkA/ne5r8cMiKGhjnBb0Burk4xr6kD6CyucfXl6fjsX4iL92LpbtdefVlQUQs2+MA/PEVuJ26Jv2obiNRx2ACwhh3/lV5z0p+JU3b+jnUd2QNIQHv/ZQiDyHkXoO7Icb/iCilZYtiag8I//3Ws588lS4KVkTU1Bhx8pyIAXnrBCsIP5oYEMv0hSFdfHKFhB8BDbdm/kRQK4oPKk1HEPS9l//ZtS+/f6BsM0sACIOOJdeQRPFgMQKCNPjycV2Jnx0F1RPuoFwDl/lHRv3iPGDyYlPNzYwxXXm2wxfT1xM+VHk+9uE1RtjxCDlICSSr0tRkbJDVWqRcxzYX5OOwC63Ojtf3mwbf6L2DewDvqmI0FFMAuefVdMdazjAYN/VVvpgzRjoyUuXP8/2XztHGU/4s5z83rhhDmIaJaUI8mbNx0imJbAQZNoAygu6edMV2ftvG+1E5A6qZOXzIf/Qt4k1+mJNt/5bZjbi5lXifPPlnmxx03RHGt8Ca0jS6AZswIsfzRdxTu6yLfmtlRnpnuR8N83+KY/Cz2Q9cSmSBMwvjdc4YqmFnivOMBQmdy+xMt4WT8vwcj8yEH4otyaIZ3wIWwzQjagJvAm4sHrp6h0tbUHe/+g3PEt4eI1k4t+Got58OugEB+UpRL+cQnJFmvOk2yCi03aDDEnXzHUCt/IW76ZC4ASulKeTmSTJm6lswswis0M/D2ajNO0ZWVYpcEi81W7U2EXj8H75sirPAag+h4/zUVcXFJVO8Qo5bWmEjEcbWEnaxLurDGeIVqmYBtp+z/yZW+hGbYcgQDoa2IF0JAyJiRpwVGZcOwnuQoRst+wmtUmgt978SpKUBRszYvXsgV7g1quQE9MPcnJRwLIb4Lpf9cw22GZEE6GJl7KwcRjRdcwXkbvkB/ns66iCAHmDq/SzeRfwZ9CfvXE788EhWrhPjN0kT0uGxmKOolacbrLMOallUY7R5oSaqayopDUl56thRMeR5YfYz5UG4le9L+fZf8NOw0AuRr9BIUeOzo2ScR8BL5a+2uk8DMXe3tOvA/IKTgxVcrCDq6gL6yCAlweShTfT2rd95hwXvlMN6MrSsLBZB2wUIlT7lyj33+gXevJ2/9ieiUTW806yGChUwPrKWL3obUilUKUhh/rCnqeWhr9nu82+uKqwEDhwNBumSKyq1KIPYDuRNNE8+Db/YhRWfKs7TN5A0Eb85gvde+tib03ejKAkMrN3B7T/iTGHn59FHRa3ErLR1zXY8awAi8yiP8mZb83LJirZvvQBmLts8Qu4hmoUGw4gQdtguQuL9YalJZX0X/Av8QoKWXdXROQXaAbK+TYySwFWXrbFXohkOGG1B2S3Vpjc6rLgjOBX+HMcET1L4tPjQiAHUuNmKaUlrO12Cx4bSODYIzH0ZiCCfAap830lWvjrPNh3wZffHayMalinccqCTvOf+P+wgJnK2hX1PLEevv18b3zHUBVmtw9Afd5T0W6BjtnrnNPO6spJVCJKxriLDbl8++xe4PGKYxxTJM2YL4m1oCyLCXA0R4YwUPaBZ5Bzy5zjdsxMz4hCK/jjxDPOJsUAQK6ZzhVcKWUASXk7j1uQ2d1H50eoIXYBJXmOsYG8KwubnM+zDTUqy8PgtGf/Q6/f40hZgwY0rjt/K0tLxeNS9BgFhWr+d2rM7SpK6UB8xmmQYMH77Vl81cKHIvABHBzsUWP1RWiAF/eOXf+GTMsDWUvueeWve7ExJgdWluiT2VO0JLaYpgrT7L7yTjzAzudDd45VXqS3DDRXXinEw3q22oXs6t3Bnk1S61LCtOLF6ijQSl9d6cN6yiQdqo3csMfadsWzgQB0oWlllUaNAHHgSzVp6PRs9CK4PLQQV85zI3D/AbPaz8iGbfkLmvizVQjINtfxGZk+MYqk2Agv0e2qgU41yCCe6b5UNrZqlzezgwuK27KRqbxGzn9XQQ/RnPwiyB/q68p/kV/M8lLCoca2O10N94sleat7KnrJM7BlUjtQZarRqDjvdWXuVffGu2eDT2GKy8ZVVzeC6jLq6achsWKcZu/Hd5uFDXpp9a11dP7Ym9EWTYjF8AnOpwpB0dasmu7V3QeyFsxmLwtDpqRiZOfIqNZCRtGELrMPovBqIZ8f/qzxBjIP+fGJ/qiWkgAGti6oVRbiFV62Gy0H+02HMTEg98ENk8rNPx64tqPqwp7RN3tG5M78zuMfVKnvdNpjkdIDTZ8X+sBlw4lrYmbD8NYXCwYKv7diyQsS5TjA6V5x6/NPAffdpYLWl+mANr+P0EMvyjZh9bU/M5lBXtoNhv8KqOLZeZ1U5x0n3UuEi5JwVIe739LGqRhGT9KUVOfb2RncLh4QPbTS2hJfrZcgfz8i9OFKChxjDTRulfkfnvrdmssTRtr+AXUPydAve/mfC2++CEZpTi4bzDVPCiyFW2ceJWY3PacyldA/K6uwb6SFh2vLPFmBM7FMc5wxaJDiwjxTdXc8pH88YiKObUgD0XF46c/ehvjPLl0+UEKsnD5cXMf+qYMcQ7IuHpTWwMmiC6gyTtX++1/aB95mgqos5tZ9iromp6Gnzu6P9XU0q+uZDyqt1shXjgMyqJm8m8UbY0HF8srU6XiY8nBTCneNbSRHBGWz12UOvmtqaOD4qxdEpvRuQCzsOM0MmfcOPQbSmiblDWTaPJUoZ5epthWQlMkdjh4n32HqTC4TvTyuBHCpERlFnlUB2Ov+/+9Gsk9MFApo1O6Obt+gnf/n05vFIkMOmaNRhLPj3KeXGi9suNRHojg3vNE9KaMfDKSGvAOO/xZ4eNr+NSpelrN0k+/8xpS+0AjDQrhjUclNsFiDLJ64GivmgctQWrP1z2X71ye03UeZUUDm/Ldz9/3dje0x8eX2nahnzz6yxUlWnlQHGcLcIjSr3scADGYuqt9sSAajtkTsZ4Ic3jPI+KX+V/8a1P5XjkfP8zzfCITCWha22tFkbKZ0S/k9blZOMTz3xsLWmtZ5NbecPcB8PFaq2mThqLxHFIhYG5ZefhOiZrCHhY9zetxQPi3n48IPMxLY8i6LkkJ/q6FXyebl4E/mymljjuMLjMdWn5DtfihqMTv6l8o8bsL2y8zd6OMMJmNG4qMDqNjBRtG7ViEtgQLtGnrvPM9kx3KCzU8ZFfppAu+kok88HemS7cxTdp1lGDAfTcrePtgND8CDj4NbLQxF7B9ydh2xEPNbNIp5lcLO/BxYnHUKc5THkE7bLfpQpvjLH7KJ0zOgyyiSVCgE/xN5b6qTjcQmHzz9mCw46qc01UpteiBTIwPxpG53EN65m+T73zMmKwcVFhr85Ailk7TSYvz38PgWLchjsNbvAGpZ5exLJrvNLbfCxHeISkqmNAQZ+Y+WHfHEFyXYxviMUaafsmCZecU34vMlpo388z3dU/lcN8dmtzI/+nqCJn9qL7IQGRiqHyzdOxiYT18yzXHEbYwP0ApehFtg+93UFmMWgNsCeA81c14D5tuMdp8Xti+35QwMSIOp/q+d1ppvpF8Sdyr/ZmUTx9OmV0ICM9mT8vfYV76+WDuTiWw+Q3oMeyjy2YdVrgt77OIXnKQ/vxob1PHs/1hHBFNPN0EDGy2BjKAVoO5C8S2x6IjWEcYfpZE/xzMtHYP9zaTsiUTn/91pO/AIrixwkI1agts9JjL3p8NwputNEdXVBj00ksOMZSdGAFjyOHiZgQedCAQ6C4O3SnFDfStXSsHQis4bkXK17r6k/IDkjJl1tUI27qA/DCvqhdXkYPE7P8Yopv1XGnmW9PypWJr2n2O51PjQzsbJUcLjVL2d/lHFP7vdwYNnGBeuSV9ON3qIXPFRKnYzdE48M6QUMGpCcFcLqxQBWiyEG0SOPwNUe6mN+Peu5elWYafkEKHYdaLd/XC6UWjw1RAbZ9AEKL0UfltoM44TzDU5GH4xwueoedUrmEXu2TV2OkrsQ+4WW43GRKB+E04ac/UyuXVuqPfVAh5iWl8SDJpo5Tl3gJKT5ZvhuqUUM0EufVHNPJx0iDKFdV3CmqkRgVed7y40lpo34uKq2tl75X6eXVq0jYXDjk37EefrtAG5J2pofANMp8p8E5vjVwFqqo5q3QgOj4loV97yC6E7fOEJeRnRWmnBC7eU+7GhoAZ1W0zQ1iiTm2Ht1cbwQUtxr6O68CChzB6zpszsO16PZ/x/+9zNUIqwC2voEk3qaqkPwddutCH5Q45GJwuoRcfTRmp5Hhof6w0iQzUqKn6UIHGNNO6L8Tb+jAgULb87QYBM3rhDGllDVeYxjBbkF0tIOU8p44fybxmMDm/Pgz8Y/LB7LgjoYPDdVuTg6prarRod2QSTHjGr/OT9mhqsYvYNsKaoYZmMaAmU9++uNTDLGVkj+GJ5SI3lZ0jJn2+cQ1OEYb0p9Asudcu4buJSYjXRQCthaC3Y6P1xv9w8BqJlpa6g0TDbFJlFIZV6mlRCkoEoUAAfsG90M+5OCxDAqzjA6eucom6VrjTnUp7t+/h33kiQ6HlrCvb5Exus5wyuiZLmDjfXQiuO1yQ77PKvXNxEJD+AmVcnHxF8A5335kHweCBHnVo7ukIproi1PhiYQ0wG9IeEdPOGoXdka6YM4w6MftHF1m5gdM125Ej3N1vj9I1E56RQXEQDn1i+rkFvq/OOW+T1t4fdvAL5deCfXaaWKina4EXoJFPZtOkeEdv+RNfINXGaN49jbHgd9hDp+eQBUWGdpO5GxedA/Zx7KEuZ9DR76bGANPfWzAGUSwOfO4zOzS+a412l3V+KIg72NmOpcHGKU4ooSwjgNsw9X2y/moscoKvc4yxjJUHYdPeA9FgcOk0vdX+a7GHhbtBgBtzWXocxRMACFHjYrRi9VxNODixNkAwEBwonbx+Ntgeb4VsBukXGfNaHeXF8IhXAD55YRjMmNzqxXk8uQ8MS5BiGIE0yGlSOuQBMGbYzBNIaQEP7CKoGdpZrZE6v/3rkTtGVIl/r4Bl1ym7sUw4OvNyxw9XtKokv7PmtTcaaXtUdcqH7l+XZL+JiAf8KRUMJ8X156SwziNu585J9gf1OkaRcaHSfaYlNcBFXrA0+KgOuwBJu74Fuy/W+P71A56z+oTl2R7gc9vFpFd4XoK8/yTajgOfpwMcBbtp5mV+c/kndz50t2055GpkDGVVuV9ovjxz3ufKh0k8L9S8VgbhJsxs5yGQiBwCKDsmeoySCGWFIVa6a0M/BMkMWVh3/oHN5uHL/k9pXxhtJ+wobeM4R2blcTsnYYAqxRzlmq3u/hGQvM5M0z48rX7raq93pB4BiM8Y8+iBBst4faIWNK1tUGRdfb5Af9+xKLyqZRMdVYca1+cKx+Wfa8RRbtsSq67K0rKOo+oK4UpVCBPS8uXHpMziZC8/sWttbA735yKQFuchg22PubUSdQvNtbNW0Gg7/tpKdqkCvkb1jTfjZ7A8QtwjTXTW0nLbnnVghhf92wW+NlXWL3MryDvTy2PfwapFnuCdUx9WHYmG56lrpqqofUjIJMwyLFGB6Yffi9adeoc2oTtgUXAXkgwaFDQuGyBfyIzlNKlHRWWFNPaUVgNWghwW2uvS8kNWcKlNFH5IcG1BMvh4ALzj1C7r3huT2NPv1EKIHZYR/b/p37pQeii7+qG5Ujpy34qTqhONH1CWPSEl/QTIK5wpzs95rclju6qH5y2iaWrR2Wr1CgH8PW/+1964CDMS9Iys8cUhmxFH61qFL31Pp7RkhBYqyJ/2gswe5amHZuXSgF9VQF1Nz7sexLc8TcHe7Gcd0+DrojQKQgbp//Hq8XipAC3vpSx241BtcIoM+iN6f66y45gEAMEinM/Iu+wwT6NNuTkRxS+K14qGYh5fdxmyCatUT5FRu0/MXPieSSjdVrQECqcwHD0ner/WIz48EfP9F/W3+s5bUjdf+vRVqUm+Cvux2ODhZCVC9Obj4eLNkQcSB4p7FEaJvwbZTztICIPGicrDo2qXWg1tADDHoBL7avsXIlPGyIcFmSzbrN/9ynx8L9RqRoQVsHTG5x29VG4vX2kFEATWK2NSIH7Q3h/nspc3AQn5UqP+/UcFWuDBnZJwlwIgdDerKR6/n8zf6fRvBU8V+qWgsHgJWvp4y60yAnu5Bis6FjEkL/6P2L9ZBHd8cEllvdXFPyAaWrMPpajUr6IvvhTh/6ismXjSKgMKKw9KlSipFiQpcKkHjVxAMWX9D9HeUjIswSuNo9hGGrqIgX/Re21cAkk8nN5dnKl3Rl2aPUSqk02rtpKZz7AlByGJr05Cc0VtlHu+5+41IZy4LCtzg5+7hz7UF7a1OPnqFLX3yyymkvUbz47zrNbEZybH+7cOJheOqnDnWH51mpTM0l6jQhp4C5SQy1o2ZB/Jq8MTklF+vVFmrA/H4C96zUQTdideqdoWd4BzKiuiSOs/LTdGPA4f8uN/TmBtr1mAEfnHD8XyWgCYjmzoZ7Eo0uu8Qb5ySx3Si2TPWk+5gYewh8NPdvoRgsGu91JE/fsIUkTwqfjvf/Lq/7mUxgvxLRu/HBiDjeq8peTAAA",
    alt: "Isometric showcase of fintech interfaces including Secure Checkout, Your Card is Ready, How to Fund It, and Card Generator screens",
  },
];

const DEFAULT_AVATARS: LeaderAvatar[] = [
  {
    id: "leader-1",
    name: "Marcus Vance",
    role: "Founder, LinearFlow",
    src: "data:image/webp;base64,UklGRjICAABXRUJQVlA4ICYCAADwCgCdASoeAB4APhkIg0EhBgGABABhLIATplCOkvK+Hp1x7gL8A3kr9t6Epxl+KDd2Zk3gb4b/lPyA1oz8Zul5msf6cYXPoncT2G/6H2GGnAIPNs+f4/i5Vp3kL4XQOAAA/v6picanutIQnYBUv/4fvL/QWYCbZX//Hcm+JEIHpN7SrpXf/wp57oBsPOQPv04E5PTJX3ah1riCcNZ0mHAWhkLlyp2t1/1FOMC8SvMPs9ruqt3AH+LbC/WyyQKd+MgEnMnENUVo+W0O0BJyFQXKFP8WaNVd0iy5ZsxiPc5EaWYLj+SwL6X9sjQ1snZ3EdoqgEhvmaueg9DV8KEoysuUFXBq5lRGXcVfH6J6+Tgad4uK71GP85FFzC7sJ5Qv8YvoFEqZW//rKd830+rLi//JWTCNGFYcqcr0b5TIamICyw3H17V9i0d85h+R4sT6mJ7HUoCp1Ar0DfFtPh9/5cNAsK87orDV9Kl/5wxFrj8P9bMHrf0dVHAfKLEHvOH8z4Xn7hbr6D/Og/q9LRpz1//4cPqmtGFYIW3fufvFcdrrFlrCg/7Iuw6F6sUdvegMMqu6e/kiP8Bw/Hsnr1c9n77k79mbpJidBMxwxjbeqaRe/zkHh5oGL//+L5//XwkZ2RfSa3DmUFiqI0a0MxKNRbCZ1r3TVvXaQQbl+m9S7pzLKdv5REPzPIAIDFrsj/SpVS9tGZtJ1SzbFP7/jmu+dmPlX13BKAAA",
  },
  {
    id: "leader-2",
    name: "Elena Rostova",
    role: "VP Design, Relay",
    src: "data:image/webp;base64,UklGRmoCAABXRUJQVlA4IF4CAABwDACdASoeAB4APhkKhEEhBgMBAAQAYSzAE6ZQjgb0D8VeTP0C7W/i5lww0ssMehB0rP7e2B39j6ID0F7D8QRmv98yWudGtKq9Q/OkqC/qf/sw2erPdkEWsXBp1F1dFUqprn8Tif7ed9SEN+AA/v/nUemZEQwRQ5sTLFNB3inSEkx23qUo/fkHsFTzU6WXeUv9e7qLDJN2fdv5DY8cNfim9rYhd4bNP3ey7yk3A9agtth/0Sq/0/qCJpUp//wYmLbnK+/yjhqxGN3D49pbrdida6Ah8pCasF//Leg75ZY+QPvd+Eyt0ri3VXOb8+PbpKrO2MGqlxHk9Uc4qnUJ6YkJWXCXqrKW2+YF2wYsq12WF6n55+V94RRI5eEXoawrhxm2EOL/h1dlrcin3/KPmbB9/8tzUdZCO5ofVqIssgWHjW6r168EL3Lg/s6mEPKIn7X/+DV+jJmE4SWx0lcU/cG1+1Jlozz6zPuwuEkP8QNKeund2+9MaCSf33bWH4fKi7kKG9WYWiE0+0bjkxrSj97d6qPud3Qm3l85+wVNesNyB2E+G8NGq9H/a9J24YGe+aSuiy2a3rPQZ1lKnHmI4cBcvjhc+YLJgESk4KXBf+GWhIgmGMYJhw9ZEAyP7iUKcvmlz/3jqmOIc/2v0dmUOupoZX+VEdm3Us7a4x1DZ3fvVJ/zGf0A6USVNq9Jzs6vv2kQZQGCel+KMyZK9qZasNb5TnasLJrKcE8e+/2vvwRzGRcPmmDql5MfMO1RTspHZ+/iTD8/dznqizj65tjv1+rINd3FYtqnsWh5nHwAAAA=",
  },
  {
    id: "leader-3",
    name: "Claire Sterling",
    role: "CEO, Northstar AI",
    src: "data:image/webp;base64,UklGRp4CAABXRUJQVlA4IJICAABwDgCdASoeAB4APhkKhEGhBQEABABhLIATplCOBvFvyM4XrtftCJPutT8hJqvWX+gB5ZPsf/uBXTfA3wE+AT8j8BmX8Z64wO4Y/wGo4/Tf10P8fyy/S3sC/q5/lOAlTjkDNQSkblkRyFazqAForO3+vdx6jjdQPhBpQB7oAP7/SgkGa8TwN7Z09eMU738eW96nnpfolXTzFYnT4IJ/nKPEqzX/VcUtELEDnmrUHdS7VgRvYcFvwcXT52vP98KKtflZe8T//6+6mYGkw+hUBOzvzpqPxBzziOYKb/AlU/qf9F28oIvsUgRsFhrJuBSAES62J+ZQmHwX/xaRhPzLX6okMbKb3BuXdw/junMcUH1jRCcrH3oOgomRWyG+Q1M4+XP9ykCRryMIPMKQmb/hZZ98lbpa3gGtJSb+ncgCD6UqcwgJTnL1OZZ4vlyqRl+gE1MLireNQ+cxjN+GvesYYa9x/+R9YTPjvkcGGXrnjvY5j7421+z5lBf9Zw3p//0sDxUYgfEiLtdYXtiM50f/eu+Fzm7AXWFM6PpDn6lpsM36Q3mVVR7TVWtvK8yIO4iiqkGoZy0EWogGAw/1yDDmLBSK//ZR5xByBzd/uUuOjnTFWtp9UCynPNpWy/8AsfIY5yBPc/KIvDth0BiWwS/yOnnnWJKeieyf9sZ4hZiOir1A2tjPGWl1E6WryoAtZXsYFSpi/0xAB2tW0nLVRtcZWxn5FFwrhvb9Fx/8eYPhrtf/Jtj/81reZG05638HKJu3YwOmJE9z+fX3kbT9o8zfrICxC2nz5xwZTT+zmwBjV11/JjbdNtVbxT+Ut2mu573DzptOOOLnyr9ZvHDEOCNC+Ti3c352wqt+LQ3m86bZMNe/QAAA",
  },
  {
    id: "leader-4",
    name: "David Chen",
    role: "Co-founder, PayGrid",
    src: "data:image/webp;base64,UklGRmoCAABXRUJQVlA4IF4CAAAwDQCdASoeAB4APhkKhEGhBQFVBABhLYATplCOBvKPwv/XLm6dce6uTruAP6rpAMcl9ADyqv2x+C/ykqXq9Q/JfJvfZvyOeTxqVfQGzvfQ/sC/lr+YCe0+yjAe39TXCI4KNA/5XRDDFkE0CkIhkbHnUGgA/vcPyWnHrv//Nv9LxHFl6v0JzX68V3thho8G6nt+rtZQrL/qY+4UfGbBIVC9RYF1VDoDokcyqWUEneX/T33cfOy4OZvlFo3fiHPNTa7zJNFrtfhrnq2UNH4///2233l//FHf36RMU9xPaC+u4f/9sbdHCK07s6T1OuiL1ufCgG72l7iYBGGliT0kDfb8ZDlMPlzDTdx/Mn//jj+vofxmR8breb1eSOyVAlxSnfGnRzOX3LKLvHb6UJ1pX2Qifm/kztM8XcG/J+fMKtCckKcH/qgM9/q+3CyCmPud+RT+GyipfT8f1/42NdXVtHLmIp3+NIu/edTrH0p2i0ZH7LIUIAwqCe+9y2/NYaUNdaEdqfsxb/Pk6o/T8zYWgTlTvBg71/6SP/tdmdqqClV0ciyBEQ1r0dtupKmlDVeb4Q4bQ0G81nrIo2oW9t439cjzaCDVaYocHr/77XXf31hb0omzid0JUQ5C+rO+V9sZWUY0n4kmZy0B4lnPDaHhzmtbJHX+w6/sI1pcDr2VuLHC+fleeNP9j1ol/xVuws7tkHOfjwWwHyjXKKucpe7Db+47//r/ZJwjApQmNvrekUjoTbNZt+xFjCjTOonfR7V+NmNW6ewcm80B2WMtzkx/TkCW2uSenX/A68GdaB9BAAA=",
  },
  {
    id: "leader-5",
    name: "Lukas Meyer",
    role: "Head of Product, Kinetix",
    src: "data:image/webp;base64,UklGRlQCAABXRUJQVlA4IEgCAAAQDwCdASoeAB4APhkIg0EhBgMBgAQAYS2AE6ZQjgbwD8GP1m/zPRC7hdlv2MyrjXT7Ve0BnAP1m3wD9lesA9ADyz/1u+CL9tfSKuVfKLeuGUL+7Zl3HZzanyB/NvsAfqp/tevWVwF/Zju098TdkWZLYmmu0/CrRuzFDUWNpM8f68AA/nrgwn4DmVa1/7q/jTSyH7h+1IgCqMLfG4OFrIBu2lXcZ+aMvpn/14pWq7M9jCfFTkNjlOI1mGCKM4fgPBAqQl/xqPROE9f/AoDt4BuILjXsCzK1stBR37nyLgiq+R2oulYAh//84T6b2+VMuYwCAg49IcJCUwL//kQJEAcN1ao6NvDdKpx5so1wTTnqjrWRuvlo/998J3zkRiPsZSIkm/s3IoGKmz8Py3IGrVu9fTGl/o8t3C433Weye6D9IfxQB599aSKgtlgPrI6p/KrzO89xeR0rzPA0GFWr4AWHwu+nA+QS9oORrWBljWCmda/KnnuZJXX42R09Rr/RWq/yeSrZi+DW5RmWigUx10T9YhXxuVZq5n+Oa1GiJG43BistgqbkvEGUv05M4GA/OR2ZN91+QBN8go6tAQxWL5RbyugCnQuy/4Yc4QBBDfD3NDf8N0jqrTIs//js9TR9bb+y//sp4AnNcLFauVXejaHTxg72lTMYpXv0X9RrgmZZ18i5PZNu3z/1GQ3iAOZ7krb5/2gwGbTxFJvCUcmCwEVNoH358A8HET7MVqIvR4SVnHdcnYZZXiGSt5rXl1E9rDc3s62HyQAAAA==",
  },
];

const DEFAULT_LOGOS: StartupLogoItem[] = [
  {
    id: "logo-ipsum-bars",
    name: "LogoIpsum Studio",
    svg: (
      <svg
        viewBox="0 0 116 44"
        fill="none"
        className="h-[42px] w-auto shrink-0"
        aria-hidden="true"
      >
        <path d="M8 6H15L9 30H2L8 6Z" fill="currentColor" />
        <path d="M19 6H26L20 30H13L19 6Z" fill="currentColor" />
        <path d="M30 6H37L31 38H24L30 6Z" fill="currentColor" />
        <path d="M41 6H48L44 26H37L41 6Z" fill="currentColor" />
        <circle cx="55.5" cy="9.5" r="2.5" fill="currentColor" />
        <text
          x="33"
          y="37"
          fill="currentColor"
          fontSize="7.5"
          fontWeight="800"
          letterSpacing="0.06em"
          fontFamily="Inter, sans-serif"
        >
          IPSUM
        </text>
      </svg>
    ),
  },
  {
    id: "looo-brand",
    name: "LOOO Ventures",
    svg: (
      <svg
        viewBox="0 0 148 44"
        fill="none"
        className="h-[42px] w-auto shrink-0"
        aria-hidden="true"
      >
        <path d="M6 9H13.5V28.5H25V35.5H6V9Z" fill="currentColor" />
        <circle
          cx="41"
          cy="22.2"
          r="10.2"
          stroke="currentColor"
          strokeWidth="6.8"
        />
        <rect
          x="61"
          y="12"
          width="38"
          height="20.4"
          rx="10.2"
          stroke="currentColor"
          strokeWidth="6.8"
        />
        <circle
          cx="119"
          cy="22.2"
          r="10.2"
          stroke="currentColor"
          strokeWidth="6.8"
        />
        <circle cx="137" cy="11" r="2.2" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "infinity-chain",
    name: "Continuum Labs",
    svg: (
      <svg
        viewBox="0 0 124 44"
        fill="none"
        className="h-[42px] w-auto shrink-0"
        aria-hidden="true"
      >
        <path
          d="M22 29C17.5 29 14 25.5 14 21C14 16.5 17.5 13 22 13C25.5 13 28 15 30.5 18.5L37.5 27.5C40 31 42.5 33 46 33C50.5 33 54 29.5 54 25"
          stroke="currentColor"
          strokeWidth="6.2"
          strokeLinecap="round"
        />
        <path
          d="M42 29C37.5 29 34 25.5 34 21C34 16.5 37.5 13 42 13C45.5 13 48 15 50.5 18.5L57.5 27.5C60 31 62.5 33 66 33C70.5 33 74 29.5 74 25"
          stroke="currentColor"
          strokeWidth="6.2"
          strokeLinecap="round"
        />
        <path
          d="M62 29C57.5 29 54 25.5 54 21C54 16.5 57.5 13 62 13C65.5 13 68 15 70.5 18.5L77.5 27.5C80 31 82.5 33 86 33C90.5 33 94 29.5 94 25C94 20.5 90.5 17 86 17"
          stroke="currentColor"
          strokeWidth="6.2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "geometric-parallelogram",
    name: "Kinetix Systems",
    svg: (
      <svg
        viewBox="0 0 112 44"
        fill="none"
        className="h-[42px] w-auto shrink-0"
        aria-hidden="true"
      >
        <path
          d="M18 11H42L36 33H12L18 11Z"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        <path d="M52 8H59L51 36H44L52 8Z" fill="currentColor" />
        <path d="M64 8H71L63 36H56L64 8Z" fill="currentColor" />
        <path d="M76 8H83L75 36H68L76 8Z" fill="currentColor" />
      </svg>
    ),
  },
];

const DEFAULT_PLANS: PricingPlanOption[] = [
  {
    id: "startup-sprint",
    name: "Core Retainer",
    price: "$4,950",
    cadence: "/month",
    description: "One active request at a time for seed & Series A startups.",
    turnaround: "48-hour average delivery",
    features: [
      "Unlimited product UI/UX & design systems",
      "Dedicated senior staff designer",
      "Figma + interactive Framer/React prototypes",
      "Pause or cancel anytime",
    ],
  },
  {
    id: "growth-scale",
    name: "Pro Scale",
    price: "$7,950",
    cadence: "/month",
    badge: "Most Popular",
    description:
      "Two parallel workstreams + production React/Tailwind handoff.",
    turnaround: "24–48 hour priority delivery",
    features: [
      "Two simultaneous active workstreams",
      "Production React + TypeScript + Tailwind code",
      "Brand identity, motion & launch assets",
      "Direct Slack channel & weekly design syncs",
    ],
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const UnlimitedDesignHero = forwardRef<
  HTMLElement,
  UnlimitedDesignHeroProps
>(
  (
    {
      statusText,
      spotsLeft = 2,
      isBookingOpen = true,
      headlineTopLeft = "Unlimited",
      headlineTopRight = "Design",
      headlineBottomLeft = "for",
      headlineBottomRight = "Solid Startups",
      subtitleLine1 = "We help startups and brands create beautiful,",
      subtitleLine2 = "functional products — fast and hassle-free.",
      ctaText = "Choose your plan",
      trustedText = "Trusted by Leaders",
      showcaseSlides = DEFAULT_SLIDES,
      slideIntervalMs = 2800,
      activeSlideIndex: controlledSlideIndex,
      onSlideChange,
      logos = DEFAULT_LOGOS,
      marqueeDurationSec = 10,
      avatars = DEFAULT_AVATARS,
      plans = DEFAULT_PLANS,
      onCtaClick,
      onSelectPlan,
      className,
      style,
      ...rest
    },
    ref
  ) => {
    const instanceId = useId();
    const shouldReduceMotion = Boolean(useReducedMotion());

    // Uncontrolled / Controlled state for Pill 1 vertical carousel
    const [internalSlide, setInternalSlide] = useState(0);
    const [isPill1Hovered, setIsPill1Hovered] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState<string>(
      plans[1]?.id || plans[0]?.id || "growth-scale"
    );
    const [confirmedPlan, setConfirmedPlan] =
      useState<PricingPlanOption | null>(null);
    // Replay key so user can re-trigger the frame-in & typing sequence anytime
    const [animCycleKey, setAnimCycleKey] = useState(0);

    const currentSlide =
      controlledSlideIndex !== undefined ? controlledSlideIndex : internalSlide;

    const advanceSlide = useCallback(() => {
      if (showcaseSlides.length <= 1) return;
      const next = (currentSlide + 1) % showcaseSlides.length;
      if (controlledSlideIndex === undefined) {
        setInternalSlide(next);
      }
      onSlideChange?.(next);
    }, [
      currentSlide,
      showcaseSlides.length,
      controlledSlideIndex,
      onSlideChange,
    ]);

    useEffect(() => {
      if (
        shouldReduceMotion ||
        isPill1Hovered ||
        isModalOpen ||
        showcaseSlides.length <= 1 ||
        controlledSlideIndex !== undefined
      ) {
        return;
      }
      const timer = setInterval(advanceSlide, slideIntervalMs);
      return () => clearInterval(timer);
    }, [
      shouldReduceMotion,
      isPill1Hovered,
      isModalOpen,
      showcaseSlides.length,
      controlledSlideIndex,
      slideIntervalMs,
      advanceSlide,
    ]);

    const handleCtaAction = () => {
      if (onCtaClick) {
        onCtaClick();
      } else {
        setIsModalOpen(true);
      }
    };

    const handleConfirmPlan = (plan: PricingPlanOption) => {
      setConfirmedPlan(plan);
      onSelectPlan?.(plan);
      setTimeout(() => {
        setIsModalOpen(false);
      }, 900);
    };

    const resolvedStatusLabel =
      statusText ??
      (isBookingOpen
        ? `Booking Open — ${spotsLeft} ${spotsLeft === 1 ? "Spot" : "Spots"} Left`
        : "Currently Fully Booked — Join Waitlist");

    const repeatedLogos = [...logos, ...logos, ...logos];
    const subtitleWordsLine1 = subtitleLine1.split(" ");
    const subtitleWordsLine2 = subtitleLine2.split(" ");

    return (
      <section
        ref={ref}
        aria-labelledby={`${instanceId}-hero-heading`}
        className={cn(
          "relative flex min-h-[685px] w-full flex-col items-center justify-center overflow-hidden bg-[#DFDFDF] px-4 py-12 text-[#050505] antialiased selection:bg-[#EF471C] selection:text-[#050505] dark:bg-[#0E0E0E] dark:text-[#F5F5F5] dark:selection:text-white",
          className
        )}
        style={{
          fontFamily:
            "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Plus Jakarta Sans', sans-serif",
          ...style,
        }}
        {...rest}
      >
        {/* Animated WebGL1 "Waves" Shader Background */}
        <WavesShaderBackground reduceMotion={shouldReduceMotion} />

        {/* Dark-theme atmospheric scrim for deeper contrast over the WebGL shader */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(circle_at_50%_40%,rgba(14,12,20,0.48)_0%,rgba(9,8,13,0.78)_100%)] dark:block"
        />

        {/* Main Choreographed Container */}
        <div
          key={animCycleKey}
          className="relative z-10 mx-auto flex w-full max-w-[1040px] flex-col items-center"
        >
          {/* 1. Top Availability Status Badge — Frame-In + Typewriter Stream */}
          <motion.button
            type="button"
            onClick={() => setAnimCycleKey((k) => k + 1)}
            title="Click to replay entrance & typing animation"
            role="status"
            aria-live="polite"
            initial={
              shouldReduceMotion
                ? false
                : { opacity: 0, y: -14, scale: 0.92, filter: "blur(6px)" }
            }
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            transition={{
              duration: 0.52,
              ease: EASE_OUT_EXPO,
            }}
            className="mb-[44px] inline-flex h-[43px] cursor-pointer items-center gap-[10px] rounded-full bg-white px-[19px] shadow-[0_2px_10px_rgba(0,0,0,0.03)] ring-1 ring-black/[0.02] transition-shadow hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF471C] dark:bg-[#18181B]/90 dark:ring-white/15 dark:backdrop-blur-md dark:shadow-[0_4px_16px_rgba(0,0,0,0.45)] dark:hover:bg-[#222226] dark:hover:shadow-[0_6px_20px_rgba(0,0,0,0.55)]"
          >
            <span className="relative flex h-[6px] w-[6px] shrink-0">
              {isBookingOpen && !shouldReduceMotion && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0CB300] opacity-60" />
              )}
              <span
                className={cn(
                  "relative inline-flex h-[6px] w-[6px] rounded-full",
                  isBookingOpen ? "bg-[#0CB300]" : "bg-amber-500"
                )}
              />
            </span>
            <TypewriterStreamText
              text={
                confirmedPlan
                  ? `Spot Reserved — ${confirmedPlan.name} Selected`
                  : resolvedStatusLabel
              }
              startDelayMs={110}
              charSpeedMs={22}
              reduceMotion={shouldReduceMotion}
              className="text-[14.5px] font-medium leading-none tracking-[-0.018em] text-[#141414] tabular-nums dark:text-[#F4F4F5]"
            />
          </motion.button>

          {/* 2. Hero Display Headline with Character-Typed Segments & Spring-Framed Pills */}
          <h1
            id={`${instanceId}-hero-heading`}
            className="flex flex-col items-center text-center font-medium tracking-[-0.056em]"
          >
            {/* ROW 1: "Unlimited" + [Pill 1: Showcase Carousel] + "Design" */}
            <span className="flex flex-wrap items-center justify-center gap-x-[26px] gap-y-3 sm:gap-x-[34px]">
              {/* "Unlimited" — Staggered Character Typing Reveal */}
              <TypedHeadlineSegment
                text={headlineTopLeft}
                delay={0.14}
                stagger={0.028}
                reduceMotion={shouldReduceMotion}
                className="text-[54px] leading-[1.05] text-[#050505] dark:text-[#FAFAFA] sm:text-[82px] md:text-[100px]"
              />

              {/* PILL 1: Vertical Portfolio Showcase Carousel — Frame-In Spring Pop */}
              <motion.button
                type="button"
                onClick={advanceSlide}
                onMouseEnter={() => setIsPill1Hovered(true)}
                onMouseLeave={() => setIsPill1Hovered(false)}
                aria-label={`Featured design work showcase (${
                  showcaseSlides[currentSlide]?.title || "Slide"
                }). Click to switch slide.`}
                initial={
                  shouldReduceMotion
                    ? false
                    : {
                        opacity: 0,
                        scale: 0.72,
                        rotate: -9,
                        skewX: 3.5,
                        y: 14,
                        filter: "blur(8px)",
                      }
                }
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotate: -0.8,
                  skewX: 3.5,
                  y: 0,
                  filter: "blur(0px)",
                }}
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : { scale: 1.035, rotate: -1.6, y: -2 }
                }
                whileTap={shouldReduceMotion ? undefined : { scale: 0.975 }}
                transition={{
                  duration: 0.62,
                  delay: 0.34,
                  ease: EASE_OUT_EXPO,
                }}
                className="group relative inline-flex h-[84px] w-[112px] shrink-0 cursor-pointer overflow-hidden rounded-[30px] border-[2.5px] border-[#141414] bg-[#4338CA] p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF471C] focus-visible:ring-offset-2 dark:border-white/20 dark:focus-visible:ring-offset-[#0E0E0E] sm:h-[98px] sm:w-[130px] sm:rounded-[34px] md:h-[111px] md:w-[146px] md:rounded-[38px]"
                style={{
                  boxShadow:
                    "6px 9px 16px rgba(0, 0, 0, 0.28), 2px 3px 5px rgba(0, 0, 0, 0.22), 1.5px 1.5px 0px #0A0A0A",
                }}
              >
                <motion.div
                  className="flex h-full w-full flex-col"
                  animate={{
                    y: `-${currentSlide * 100}%`,
                  }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : {
                          duration: 0.56,
                          ease: EASE_OUT_EXPO,
                        }
                  }
                >
                  {showcaseSlides.map((slide) => (
                    <div
                      key={slide.id}
                      className="relative h-full w-full shrink-0 overflow-hidden select-none"
                    >
                      <img
                        src={slide.imageSrc}
                        alt={slide.alt}
                        draggable={false}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </motion.div>

                {/* Subtle top specular rim highlight */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/20"
                />
              </motion.button>

              {/* "Design" — Staggered Character Typing Reveal */}
              <TypedHeadlineSegment
                text={headlineTopRight}
                delay={0.44}
                stagger={0.03}
                reduceMotion={shouldReduceMotion}
                className="text-[54px] leading-[1.05] text-[#707070] dark:text-[#A6A6AE] sm:text-[82px] md:text-[100px]"
              />
            </span>

            {/* ROW 2: "for" + [Pill 2: Infinite Startup Logo Marquee] + "Solid Startups" */}
            <span className="mt-[14px] flex flex-wrap items-center justify-center gap-x-[24px] gap-y-3 sm:mt-[22px] sm:gap-x-[32px]">
              {/* "for" — Staggered Character Typing Reveal */}
              <TypedHeadlineSegment
                text={headlineBottomLeft}
                delay={0.56}
                stagger={0.032}
                reduceMotion={shouldReduceMotion}
                className="text-[54px] leading-[1.05] text-[#747474] dark:text-[#A6A6AE] sm:text-[82px] md:text-[100px]"
              />

              {/* PILL 2: Dark Infinite Startup Logo Marquee — Frame-In Spring Pop */}
              <motion.div
                role="region"
                aria-label="Partner startup logos"
                initial={
                  shouldReduceMotion
                    ? false
                    : {
                        opacity: 0,
                        scale: 0.72,
                        rotate: 8,
                        skewX: 3.5,
                        y: 14,
                        filter: "blur(8px)",
                      }
                }
                animate={{
                  opacity: 1,
                  scale: 1,
                  rotate: -0.6,
                  skewX: 3.5,
                  y: 0,
                  filter: "blur(0px)",
                }}
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : { scale: 1.03, rotate: 0.5, y: -2 }
                }
                transition={{
                  duration: 0.62,
                  delay: 0.64,
                  ease: EASE_OUT_EXPO,
                }}
                className="relative inline-flex h-[84px] w-[112px] shrink-0 items-center overflow-hidden rounded-[30px] border-[2.5px] border-[#121212] bg-[#262626] dark:border-white/20 dark:bg-[#18181B] sm:h-[98px] sm:w-[130px] sm:rounded-[34px] md:h-[111px] md:w-[146px] md:rounded-[38px]"
                style={{
                  boxShadow:
                    "6px 9px 16px rgba(0, 0, 0, 0.28), 2px 3px 5px rgba(0, 0, 0, 0.22), 1.5px 1.5px 0px #0A0A0A",
                }}
              >
                {/* Continuous Right-to-Left Marquee Track */}
                <motion.div
                  className="flex items-center gap-[26px] pr-[26px] text-[#707070] dark:text-[#A1A1AA]"
                  animate={
                    shouldReduceMotion ? { x: "0%" } : { x: ["0%", "-33.333%"] }
                  }
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : {
                          duration: marqueeDurationSec,
                          ease: "linear",
                          repeat: Infinity,
                        }
                  }
                >
                  {repeatedLogos.map((logo, idx) => (
                    <span
                      key={`${logo.id}-${idx}`}
                      className="inline-flex items-center justify-center select-none"
                      title={logo.name}
                    >
                      {logo.svg}
                    </span>
                  ))}
                </motion.div>

                {/* Soft Edge Vignette & Inner Specular Rim */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-[inherit]"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(38,38,38,0.65) 0%, rgba(38,38,38,0) 18%, rgba(38,38,38,0) 82%, rgba(38,38,38,0.65) 100%)",
                    boxShadow: "inset 0 1px 1px rgba(255,255,255,0.12)",
                  }}
                />
              </motion.div>

              {/* "Solid Startups" — Staggered Character Typing Reveal */}
              <TypedHeadlineSegment
                text={headlineBottomRight}
                delay={0.72}
                stagger={0.024}
                reduceMotion={shouldReduceMotion}
                className="text-[54px] leading-[1.05] text-[#050505] dark:text-[#FAFAFA] sm:text-[82px] md:text-[100px]"
              />
            </span>
          </h1>

          {/* 3. Supporting Subtitle — Staggered Word Typing Stream */}
          <motion.p
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  delayChildren: 1.02,
                  staggerChildren: 0.036,
                },
              },
            }}
            className="mt-[46px] max-w-[340px] text-center text-[15.5px] font-normal leading-[1.52] tracking-[-0.015em] text-[#727272] dark:text-[#B4B4BC]"
          >
            <span className="inline">
              {subtitleWordsLine1.map((word, idx) => (
                <React.Fragment key={`l1-${idx}`}>
                  <motion.span
                    variants={wordTypingVariants}
                    className="inline-block"
                  >
                    {word}
                  </motion.span>
                  {idx < subtitleWordsLine1.length - 1 ? " " : ""}
                </React.Fragment>
              ))}
            </span>
            <br />
            <span className="inline">
              {subtitleWordsLine2.map((word, idx) => (
                <React.Fragment key={`l2-${idx}`}>
                  <motion.span
                    variants={wordTypingVariants}
                    className="inline-block"
                  >
                    {word}
                  </motion.span>
                  {idx < subtitleWordsLine2.length - 1 ? " " : ""}
                </React.Fragment>
              ))}
            </span>
          </motion.p>

          {/* 4. Bottom Action Bar: Dual-Layer Skeuomorphic CTA + Staggered Leader Avatars */}
          <div className="mt-[52px] flex flex-wrap items-center justify-center gap-[24px]">
            {/* Outer Recessed Pill Bezel (210x64px) — Frame-In Entrance */}
            <motion.div
              initial={
                shouldReduceMotion
                  ? false
                  : { opacity: 0, y: 16, scale: 0.94, filter: "blur(6px)" }
              }
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              transition={{
                duration: 0.56,
                delay: 1.24,
                ease: EASE_OUT_EXPO,
              }}
              className="rounded-full bg-[linear-gradient(180deg,#F4F4F4_0%,#E7E7E7_100%)] p-[7px] shadow-[0_10px_22px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.95)] dark:bg-[linear-gradient(180deg,#2A2A2E_0%,#16161A_100%)] dark:ring-1 dark:ring-white/10 dark:shadow-[0_10px_24px_rgba(0,0,0,0.55),0_2px_6px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.12)]"
            >
              {/* Inner Black Pill CTA Button (196x50px) with Video-Verified Hover Metallic Sheen */}
              <button
                type="button"
                onClick={handleCtaAction}
                className="group relative flex h-[50px] w-[196px] cursor-pointer items-center justify-start overflow-hidden rounded-full bg-[#050505] pl-[25px] pr-[20px] text-left text-[15.5px] font-medium tracking-[-0.015em] text-white shadow-[0_2px_5px_rgba(0,0,0,0.35)] transition-transform duration-200 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF471C] dark:bg-[#FAFAFA] dark:text-[#09090B] dark:shadow-[0_2px_10px_rgba(255,255,255,0.12)]"
              >
                {/* Hover Metallic Graphite Gradient Overlay (Light Mode) */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 dark:hidden"
                  style={{
                    background:
                      "linear-gradient(90deg, #474747 0%, #242424 46%, #525252 100%)",
                  }}
                />
                {/* Hover Metallic Pearl Gradient Overlay (Dark Mode) */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 hidden opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 dark:block"
                  style={{
                    background:
                      "linear-gradient(90deg, #FFFFFF 0%, #E4E4E7 48%, #FFFFFF 100%)",
                  }}
                />
                {/* Top subtle inner specular line */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/10 group-hover:ring-white/20 dark:ring-black/10 dark:group-hover:ring-black/20"
                />
                <span className="relative z-10">
                  {confirmedPlan ? `Selected: ${confirmedPlan.name}` : ctaText}
                </span>
              </button>
            </motion.div>

            {/* Social Proof Stack: 5 Overlapping Leader Avatars + Typed "Trusted by Leaders" */}
            <div className="flex flex-col items-start justify-center">
              <motion.div
                className="flex items-center -space-x-[5px]"
                role="group"
                aria-label="Startup leaders who trust our design studio"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      delayChildren: 1.32,
                      staggerChildren: 0.055,
                    },
                  },
                }}
              >
                {avatars.map((avatar, i) => (
                  <motion.div
                    key={avatar.id}
                    title={`${avatar.name} — ${avatar.role}`}
                    variants={{
                      hidden: { opacity: 0, x: -10, scale: 0.78 },
                      visible: {
                        opacity: 1,
                        x: 0,
                        scale: 1,
                        transition: {
                          duration: 0.4,
                          ease: EASE_OUT_EXPO,
                        },
                      },
                    }}
                    className="relative h-[30px] w-[30px] shrink-0 overflow-hidden rounded-full ring-[1.5px] ring-[#E2E2E2] transition-transform duration-200 hover:z-20 hover:-translate-y-0.5 dark:ring-[#2A2A30]"
                    style={{ zIndex: i + 1 }}
                  >
                    <img
                      src={avatar.src}
                      alt={avatar.name}
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  </motion.div>
                ))}
              </motion.div>
              <TypewriterStreamText
                text={trustedText}
                startDelayMs={1480}
                charSpeedMs={26}
                showCursorWhileTyping={false}
                reduceMotion={shouldReduceMotion}
                className="mt-[5px] pl-[2px] text-[12.5px] font-normal leading-none tracking-[-0.01em] text-[#767676] dark:text-[#B4B4BC]"
              />
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* CONTEXT-AWARE UX: INTERACTIVE PLAN SELECTION MODAL                */}
        {/* ================================================================= */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs dark:bg-black/75"
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${instanceId}-modal-title`}
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsModalOpen(false);
              }}
            >
              <motion.div
                initial={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : { opacity: 0, y: 16, scale: 0.97 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: 10, scale: 0.98 }
                }
                transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
                className="relative w-full max-w-[640px] overflow-hidden rounded-[28px] border border-black/10 bg-[#F7F7F7] p-6 text-[#0A0A0A] shadow-2xl dark:border-white/15 dark:bg-[#141417] dark:text-[#F5F5F5] sm:p-8"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-[#141414] shadow-2xs tabular-nums dark:bg-[#242424] dark:text-[#EAEAEA]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#0CB300]" />
                      {spotsLeft} Booking Spots Available This Month
                    </div>
                    <h2
                      id={`${instanceId}-modal-title`}
                      className="mt-3 text-2xl font-semibold tracking-tight text-[#050505] dark:text-[#FAFAFA]"
                    >
                      Choose your unlimited design plan
                    </h2>
                    <p className="mt-1 text-sm text-[#666666] dark:text-[#A1A1A1]">
                      Transparent monthly subscription. Pause or cancel anytime.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    aria-label="Close plan selector"
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white text-[#444] shadow-2xs transition hover:bg-neutral-200 dark:bg-[#242424] dark:text-[#D4D4D4] dark:hover:bg-[#333333]"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {plans.map((plan) => {
                    const isSelected = selectedPlanId === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedPlanId(plan.id);
                          }
                        }}
                        className={cn(
                          "flex cursor-pointer flex-col justify-between rounded-[20px] border p-5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF471C]",
                          isSelected
                            ? "border-[#050505] bg-white shadow-md ring-1 ring-[#050505] dark:border-white dark:bg-[#1F1F23] dark:ring-white"
                            : "border-black/10 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-[#1B1B1F]/80 dark:hover:bg-[#222227]"
                        )}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-base font-semibold text-[#050505] dark:text-[#FAFAFA]">
                              {plan.name}
                            </span>
                            {plan.badge && (
                              <span className="rounded-full bg-[#EF471C]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#EF471C]">
                                {plan.badge}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-3xl font-semibold tracking-tight text-[#050505] tabular-nums dark:text-[#FAFAFA]">
                              {plan.price}
                            </span>
                            <span className="text-xs text-[#666666] dark:text-[#A1A1A1]">
                              {plan.cadence}
                            </span>
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-[#666666] dark:text-[#A1A1A1]">
                            {plan.description}
                          </p>
                          <ul className="mt-4 space-y-2 border-t border-black/5 pt-3 text-xs text-[#222222] dark:border-white/10 dark:text-[#E0E0E0]">
                            {plan.features.map((feat, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-[#0CB300]">✓</span>
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmPlan(plan);
                          }}
                          className={cn(
                            "mt-5 w-full cursor-pointer rounded-full py-2.5 text-xs font-medium transition",
                            isSelected
                              ? "bg-[#050505] text-white hover:bg-[#242424] dark:bg-white dark:text-[#050505] dark:hover:bg-neutral-200"
                              : "bg-neutral-200 text-[#141414] hover:bg-neutral-300 dark:bg-[#2A2A2A] dark:text-[#F0F0F0] dark:hover:bg-[#363636]"
                          )}
                        >
                          {confirmedPlan?.id === plan.id
                            ? "Spot Reserved ✓"
                            : `Reserve ${plan.name}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    );
  }
);

UnlimitedDesignHero.displayName = "UnlimitedDesignHero";

export default UnlimitedDesignHero;
