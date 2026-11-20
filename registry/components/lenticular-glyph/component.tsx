"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type LenticularGlyphTheme = "auto" | "dark" | "light";

export interface LenticularGlyphProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Single character, monogram, or short text refracted through the lenticular grid. */
  text?: string;
  /** Playback speed multiplier for the 5.65s kinetic cycle (0.25 to 3). */
  speed?: number;
  /** Whether the lenticular lens wave loops automatically. */
  autoPlay?: boolean;
  /** Enables pointer-reactive optical lens modulation on hover and click/keyboard pause. */
  interactive?: boolean;
  /** Color theme: "auto" adapts to light/dark mode via Tailwind dark: classes. */
  theme?: LenticularGlyphTheme;
  /** Optional custom font stack for the rendered glyph texture. */
  fontFamily?: string;
}

const LOOP_DURATION_SECONDS = 5.65;
const TEXTURE_SIZE = 1024;

// [normalizedTime (0..1), cellCount (N), sampleZoom (S)]
// Reverse-engineered from the 5.65s reference loop:
// fine halftone halo -> wide multi-glyph matrix -> chunky faceted glyph -> nested tiles -> halftone halo
const KEYFRAMES: ReadonlyArray<readonly [number, number, number]> = [
  [0.0, 108.0, 0.082],
  [0.1, 82.0, 0.112],
  [0.22, 22.0, 0.52],
  [0.31, 14.5, 0.84],
  [0.41, 11.0, 0.34],
  [0.53, 9.5, 0.145],
  [0.66, 10.5, 0.19],
  [0.76, 14.0, 0.36],
  [0.86, 48.0, 0.21],
  [0.94, 96.0, 0.092],
  [1.0, 108.0, 0.082],
];

const VERTEX_SHADER_SOURCE = `
  attribute vec2 aPosition;
  varying vec2 vUv;
  void main() {
    vUv = aPosition * 0.5 + 0.5;
    vUv.y = 1.0 - vUv.y;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform float uCells;
  uniform float uZoom;
  uniform vec3 uBgColor;
  uniform vec3 uFgColor;

  void main() {
    vec2 p = (vUv - 0.5) * uCells;
    vec2 cellCenter = (floor(p) + 0.5) / uCells + 0.5;
    vec2 local = fract(p) - 0.5;
    vec2 sampleUv = cellCenter + local * uZoom;

    float inside =
      step(0.0, sampleUv.x) *
      step(sampleUv.x, 1.0) *
      step(0.0, sampleUv.y) *
      step(sampleUv.y, 1.0);

    float glyphMask = texture2D(uTexture, clamp(sampleUv, 0.0, 1.0)).a * inside;
    vec3 color = mix(uBgColor, uFgColor, glyphMask);
    gl_FragColor = vec4(color, 1.0);
  }
`;

function easeInOutSine(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return 0.5 - 0.5 * Math.cos(Math.PI * clamped);
}

function evaluateLoopCurve(normalizedTime: number): { cells: number; zoom: number } {
  const u = ((normalizedTime % 1) + 1) % 1;
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    const [t0, n0, s0] = KEYFRAMES[i];
    const [t1, n1, s1] = KEYFRAMES[i + 1];
    if (u >= t0 && u <= t1) {
      const span = t1 - t0;
      const localT = span > 0 ? (u - t0) / span : 0;
      const eased = easeInOutSine(localT);
      // Logarithmic interpolation on cell count preserves uniform visual scaling speed
      const cells = Math.exp(Math.log(n0) * (1 - eased) + Math.log(n1) * eased);
      const zoom = s0 * (1 - eased) + s1 * eased;
      return { cells, zoom };
    }
  }
  return { cells: KEYFRAMES[0][1], zoom: KEYFRAMES[0][2] };
}

function parseCssRgb(cssColor: string, fallback: [number, number, number]): [number, number, number] {
  const match = cssColor.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (!match) return fallback;
  return [
    Math.min(1, Math.max(0, Number(match[1]) / 255)),
    Math.min(1, Math.max(0, Number(match[2]) / 255)),
    Math.min(1, Math.max(0, Number(match[3]) / 255)),
  ];
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (event: MediaQueryListEvent) => setReduced(event.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

function drawGlyphTexture(
  canvas: HTMLCanvasElement,
  rawText: string,
  fontFamily: string
): void {
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);

  const label = (rawText || "G").trim().slice(0, 6) || "G";
  const maxBox = TEXTURE_SIZE * 0.46;

  // Start large and shrink cleanly to fit the reference ~46% centered bounding box
  let fontSize = Math.round(TEXTURE_SIZE * 0.56);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const measureAt = (size: number) => {
    ctx.font = `900 ${size}px ${fontFamily}`;
    return ctx.measureText(label);
  };

  let metrics = measureAt(fontSize);
  let width =
    (metrics.actualBoundingBoxLeft ?? 0) + (metrics.actualBoundingBoxRight ?? 0) ||
    metrics.width;
  let height =
    (metrics.actualBoundingBoxAscent ?? sizeFallback(fontSize)) +
    (metrics.actualBoundingBoxDescent ?? 0);

  if (width > maxBox || height > maxBox) {
    const scale = Math.min(maxBox / Math.max(width, 1), maxBox / Math.max(height, 1));
    fontSize = Math.max(32, Math.floor(fontSize * scale));
    metrics = measureAt(fontSize);
    width =
      (metrics.actualBoundingBoxLeft ?? 0) + (metrics.actualBoundingBoxRight ?? 0) ||
      metrics.width;
    height =
      (metrics.actualBoundingBoxAscent ?? sizeFallback(fontSize)) +
      (metrics.actualBoundingBoxDescent ?? 0);
  }

  const ascent = metrics.actualBoundingBoxAscent ?? fontSize * 0.72;
  const descent = metrics.actualBoundingBoxDescent ?? fontSize * 0.08;
  const left = metrics.actualBoundingBoxLeft ?? width / 2;
  const right = metrics.actualBoundingBoxRight ?? width / 2;

  const centerX = TEXTURE_SIZE / 2 + (left - right) / 2;
  const centerY = TEXTURE_SIZE / 2 + (ascent - descent) / 2;

  ctx.fillText(label, centerX, centerY);
}

function sizeFallback(fontSize: number): number {
  return fontSize * 0.74;
}

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

function renderCanvas2DFallback(
  canvas: HTMLCanvasElement,
  sourceCanvas: HTMLCanvasElement,
  cells: number,
  zoom: number,
  bgCss: string,
  fgCss: string
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const size = Math.min(canvas.width, canvas.height);
  if (size <= 0) return;

  ctx.fillStyle = bgCss;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Tinted source copy for 2D compositing
  const tintCanvas = document.createElement("canvas");
  tintCanvas.width = sourceCanvas.width;
  tintCanvas.height = sourceCanvas.height;
  const tctx = tintCanvas.getContext("2d");
  if (!tctx) return;
  tctx.drawImage(sourceCanvas, 0, 0);
  tctx.globalCompositeOperation = "source-in";
  tctx.fillStyle = fgCss;
  tctx.fillRect(0, 0, tintCanvas.width, tintCanvas.height);

  const count = Math.max(1, Math.round(cells));
  const cellPx = size / count;
  const srcSize = sourceCanvas.width;
  const halfSample = zoom * 0.5;

  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      const cellU = (col + 0.5) / count;
      const cellV = (row + 0.5) / count;

      const sx = (cellU - halfSample) * srcSize;
      const sy = (cellV - halfSample) * srcSize;
      const sw = zoom * srcSize;
      const sh = zoom * srcSize;

      ctx.save();
      ctx.beginPath();
      ctx.rect(col * cellPx, row * cellPx, cellPx + 0.5, cellPx + 0.5);
      ctx.clip();
      ctx.drawImage(
        tintCanvas,
        sx,
        sy,
        sw,
        sh,
        col * cellPx,
        row * cellPx,
        cellPx,
        cellPx
      );
      ctx.restore();
    }
  }
}

export const LenticularGlyph = React.forwardRef<HTMLDivElement, LenticularGlyphProps>(
  function LenticularGlyph(
    {
      text = "G",
      speed = 1,
      autoPlay = true,
      interactive = true,
      theme = "auto",
      fontFamily = '"Inter", "Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif',
      className,
      onClick,
      onKeyDown,
      onPointerMove,
      onPointerLeave,
      ...rest
    },
    ref
  ) {
    const reactId = useId();
    const safeId = reactId.replace(/:/g, "");
    const prefersReducedMotion = usePrefersReducedMotion();

    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const [userPaused, setUserPaused] = useState(false);

    // Mutable animation state stored in refs for zero-rerender 60-120fps rendering
    const animRef = useRef({
      progress: 0,
      lastTime: 0,
      pointerActive: false,
      pointerX: 0.5,
      pointerY: 0.5,
      smoothCells: KEYFRAMES[0][1],
      smoothZoom: KEYFRAMES[0][2],
      bgRgb: [0, 0, 0] as [number, number, number],
      fgRgb: [1, 1, 1] as [number, number, number],
      bgCss: "rgb(0, 0, 0)",
      fgCss: "rgb(255, 255, 255)",
      textureDirty: true,
    });

    const isPlaying = autoPlay && !userPaused && !prefersReducedMotion;
    const clampedSpeed = Number.isFinite(speed) ? Math.min(3, Math.max(0.25, speed)) : 1;

    const propsRef = useRef({
      isPlaying,
      speed: clampedSpeed,
      interactive,
      prefersReducedMotion,
    });
    propsRef.current = {
      isPlaying,
      speed: clampedSpeed,
      interactive,
      prefersReducedMotion,
    };

    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        containerRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

    const syncThemeColors = useCallback(() => {
      const el = containerRef.current;
      if (!el || typeof window === "undefined") return;
      const style = window.getComputedStyle(el);
      const bgCss = style.backgroundColor || "rgb(0, 0, 0)";
      const fgCss = style.color || "rgb(255, 255, 255)";
      animRef.current.bgCss = bgCss;
      animRef.current.fgCss = fgCss;
      animRef.current.bgRgb = parseCssRgb(bgCss, [0, 0, 0]);
      animRef.current.fgRgb = parseCssRgb(fgCss, [1, 1, 1]);
    }, []);

    // Regenerate offscreen glyph texture when text or font changes
    useEffect(() => {
      if (typeof document === "undefined") return;
      if (!sourceCanvasRef.current) {
        sourceCanvasRef.current = document.createElement("canvas");
      }
      drawGlyphTexture(sourceCanvasRef.current, text, fontFamily);
      animRef.current.textureDirty = true;

      // Re-draw once web fonts finish loading so glyph proportions stay crisp
      let cancelled = false;
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          if (cancelled || !sourceCanvasRef.current) return;
          drawGlyphTexture(sourceCanvasRef.current, text, fontFamily);
          animRef.current.textureDirty = true;
        });
      }
      return () => {
        cancelled = true;
      };
    }, [text, fontFamily]);

    // Sync resolved CSS colors from Tailwind theme classes (including live dark-mode toggles)
    useEffect(() => {
      syncThemeColors();
      if (typeof window === "undefined") return;

      const rootObserver = new MutationObserver(() => {
        syncThemeColors();
      });
      rootObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "style", "data-theme"],
      });

      const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
      const mqHandler = () => syncThemeColors();
      mq?.addEventListener?.("change", mqHandler);

      return () => {
        rootObserver.disconnect();
        mq?.removeEventListener?.("change", mqHandler);
      };
    }, [theme, syncThemeColors]);

    // Reset pause state when autoPlay is toggled externally
    useEffect(() => {
      setUserPaused(false);
    }, [autoPlay]);

    // WebGL + Canvas 2D fallback render loop
    useEffect(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      if (!sourceCanvasRef.current) {
        sourceCanvasRef.current = document.createElement("canvas");
        drawGlyphTexture(sourceCanvasRef.current, text, fontFamily);
      }

      const gl = canvas.getContext("webgl", {
        alpha: false,
        antialias: true,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
        powerPreference: "high-performance",
      });

      let program: WebGLProgram | null = null;
      let vertexShader: WebGLShader | null = null;
      let fragmentShader: WebGLShader | null = null;
      let positionBuffer: WebGLBuffer | null = null;
      let texture: WebGLTexture | null = null;

      let uTextureLoc: WebGLUniformLocation | null = null;
      let uCellsLoc: WebGLUniformLocation | null = null;
      let uZoomLoc: WebGLUniformLocation | null = null;
      let uBgColorLoc: WebGLUniformLocation | null = null;
      let uFgColorLoc: WebGLUniformLocation | null = null;

      if (gl) {
        vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
        fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
        if (vertexShader && fragmentShader) {
          program = gl.createProgram();
          if (program) {
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
              gl.deleteProgram(program);
              program = null;
            }
          }
        }

        if (program) {
          gl.useProgram(program);

          positionBuffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
          gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
            gl.STATIC_DRAW
          );

          const aPositionLoc = gl.getAttribLocation(program, "aPosition");
          gl.enableVertexAttribArray(aPositionLoc);
          gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

          uTextureLoc = gl.getUniformLocation(program, "uTexture");
          uCellsLoc = gl.getUniformLocation(program, "uCells");
          uZoomLoc = gl.getUniformLocation(program, "uZoom");
          uBgColorLoc = gl.getUniformLocation(program, "uBgColor");
          uFgColorLoc = gl.getUniformLocation(program, "uFgColor");

          texture = gl.createTexture();
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.uniform1i(uTextureLoc, 0);
          animRef.current.textureDirty = true;
        }
      }

      const updateCanvasSize = () => {
        const rect = container.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const side = Math.max(1, Math.round(Math.min(rect.width, rect.height) * dpr));
        if (canvas.width !== side || canvas.height !== side) {
          canvas.width = side;
          canvas.height = side;
        }
        if (gl) {
          gl.viewport(0, 0, canvas.width, canvas.height);
        }
      };

      updateCanvasSize();
      const resizeObserver = new ResizeObserver(updateCanvasSize);
      resizeObserver.observe(container);

      let rafId = 0;

      const tick = (now: number) => {
        const state = animRef.current;
        const {
          isPlaying: activePlay,
          speed: playSpeed,
          interactive: isInteractive,
          prefersReducedMotion: reduced,
        } = propsRef.current;

        const dt =
          state.lastTime > 0 ? Math.min(0.1, (now - state.lastTime) / 1000) : 0;
        state.lastTime = now;

        if (activePlay && !state.pointerActive) {
          state.progress =
            (state.progress + (dt * playSpeed) / LOOP_DURATION_SECONDS) % 1;
        }

        let targetCells: number;
        let targetZoom: number;

        if (reduced && !state.pointerActive) {
          // Crisp sculptural faceted state for prefers-reduced-motion
          targetCells = 9.5;
          targetZoom = 0.145;
        } else if (isInteractive && state.pointerActive) {
          // Horizontal pointer scrubs grid density logarithmically (8..108)
          // Vertical pointer scrubs optical zoom (0.085..0.84)
          const minLog = Math.log(8.5);
          const maxLog = Math.log(108);
          targetCells = Math.exp(minLog + (maxLog - minLog) * state.pointerX);
          targetZoom = 0.085 + (0.84 - 0.085) * state.pointerY;
        } else {
          const evaluated = evaluateLoopCurve(state.progress);
          targetCells = evaluated.cells;
          targetZoom = evaluated.zoom;
        }

        // Critically damped exponential smoothing for butter-smooth pointer handoff
        const smoothing = state.pointerActive ? 1 - Math.exp(-12 * dt) : 1 - Math.exp(-18 * dt);
        if (dt === 0 || (!state.pointerActive && activePlay)) {
          state.smoothCells += (targetCells - state.smoothCells) * Math.min(1, Math.max(smoothing, 0.35));
          state.smoothZoom += (targetZoom - state.smoothZoom) * Math.min(1, Math.max(smoothing, 0.35));
        } else {
          state.smoothCells += (targetCells - state.smoothCells) * smoothing;
          state.smoothZoom += (targetZoom - state.smoothZoom) * smoothing;
        }

        if (gl && program && texture) {
          if (state.textureDirty && sourceCanvasRef.current) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(
              gl.TEXTURE_2D,
              0,
              gl.RGBA,
              gl.RGBA,
              gl.UNSIGNED_BYTE,
              sourceCanvasRef.current
            );
            gl.generateMipmap(gl.TEXTURE_2D);
            state.textureDirty = false;
          }

          gl.useProgram(program);
          gl.uniform1f(uCellsLoc, state.smoothCells);
          gl.uniform1f(uZoomLoc, state.smoothZoom);
          gl.uniform3fv(uBgColorLoc, state.bgRgb);
          gl.uniform3fv(uFgColorLoc, state.fgRgb);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        } else if (sourceCanvasRef.current) {
          renderCanvas2DFallback(
            canvas,
            sourceCanvasRef.current,
            state.smoothCells,
            state.smoothZoom,
            state.bgCss,
            state.fgCss
          );
        }

        rafId = window.requestAnimationFrame(tick);
      };

      rafId = window.requestAnimationFrame(tick);

      return () => {
        window.cancelAnimationFrame(rafId);
        resizeObserver.disconnect();
        if (gl) {
          if (texture) gl.deleteTexture(texture);
          if (positionBuffer) gl.deleteBuffer(positionBuffer);
          if (program) gl.deleteProgram(program);
          if (vertexShader) gl.deleteShader(vertexShader);
          if (fragmentShader) gl.deleteShader(fragmentShader);
        }
      };
    }, [fontFamily, text]);

    const handlePointerMove = useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        if (interactive) {
          const rect = event.currentTarget.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            animRef.current.pointerActive = true;
            animRef.current.pointerX = Math.min(
              1,
              Math.max(0, (event.clientX - rect.left) / rect.width)
            );
            animRef.current.pointerY = Math.min(
              1,
              Math.max(0, (event.clientY - rect.top) / rect.height)
            );
          }
        }
        onPointerMove?.(event);
      },
      [interactive, onPointerMove]
    );

    const handlePointerLeave = useCallback(
      (event: React.PointerEvent<HTMLDivElement>) => {
        animRef.current.pointerActive = false;
        onPointerLeave?.(event);
      },
      [onPointerLeave]
    );

    const togglePlayback = useCallback(() => {
      if (!interactive) return;
      setUserPaused((prev) => !prev);
    }, [interactive]);

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        togglePlayback();
        onClick?.(event);
      },
      [togglePlayback, onClick]
    );

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (interactive && (event.key === " " || event.key === "Enter")) {
          event.preventDefault();
          togglePlayback();
        }
        onKeyDown?.(event);
      },
      [interactive, togglePlayback, onKeyDown]
    );

    const themeClasses =
      theme === "dark"
        ? "bg-black text-white border-white/10"
        : theme === "light"
          ? "bg-white text-neutral-950 border-black/10"
          : "bg-white text-neutral-950 border-black/10 dark:bg-black dark:text-white dark:border-white/10";

    const displayLabel = (text || "G").trim().slice(0, 6) || "G";

    return (
      <div
        ref={setRefs}
        id={`lenticular-glyph-${safeId}`}
        role={interactive ? "button" : "img"}
        tabIndex={interactive ? 0 : undefined}
        aria-pressed={interactive ? !isPlaying : undefined}
        aria-label={
          interactive
            ? `Kinetic lenticular glyph "${displayLabel}". ${isPlaying ? "Playing" : "Paused"}. Move pointer to modulate refraction or press Space to toggle playback.`
            : `Kinetic lenticular glyph "${displayLabel}".`
        }
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative aspect-square w-full max-w-[480px] select-none overflow-hidden rounded-2xl border",
          "transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black",
          interactive ? "cursor-crosshair" : "cursor-default",
          themeClasses,
          className
        )}
        {...rest}
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="block h-full w-full"
        />
      </div>
    );
  }
);

LenticularGlyph.displayName = "LenticularGlyph";

export { LenticularGlyph as component, LenticularGlyph as Component };
export default LenticularGlyph;