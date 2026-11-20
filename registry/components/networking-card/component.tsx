"use client";

import React, { useEffect, useId, useRef, useState } from "react";

function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(" ");
}

function usePrefersReducedMotion(): boolean {
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

export type SynapseCardTheme = "auto" | "dark" | "light";

export interface SynapseCardProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /** Heading displayed in the top-left header cell */
  title?: string;
  /** Editorial description displayed in the top-right header cell */
  description?: string;
  /** Color theme mode. "auto" follows Tailwind dark mode classes */
  theme?: SynapseCardTheme;
  /** Enables autonomous sweeping traversal of the central hub node */
  autoPlay?: boolean;
  /** Speed multiplier for autonomous hub motion (0.2 to 3) */
  speed?: number;
  /** Grid columns across the canvas width (6 to 18). Higher values pack more dots */
  dotDensity?: number;
  /** Visible dot spotlight spread in grid units (2 to 8). Higher values reveal more dots */
  dotReach?: number;
  /** Radial spoke connection reach in grid units (1.6 to 5). Higher values connect more lines */
  lineReach?: number;
  /** Enables subtle tactile click sound via Web Audio API during interaction */
  soundEnabled?: boolean;
  /** Allows pointer hover/drag and keyboard navigation to steer the hub node */
  interactive?: boolean;
  /** Optional callback fired when the number of active radial connections changes */
  onConnectionChange?: (count: number) => void;
}

interface Point {
  x: number;
  y: number;
}

interface NodeMorphState {
  progress: number;
  pullX: number;
  pullY: number;
  wasLinked: boolean;
}

const ORBIT_WAYPOINTS: ReadonlyArray<Point> = [
  { x: 0.0, y: 0.0 },
  { x: -0.28, y: 0.31 },
  { x: 0.16, y: -0.06 },
  { x: 0.76, y: -0.26 },
  { x: 0.08, y: -0.22 },
  { x: -0.48, y: -0.17 },
];

const BASE_CYCLE_SECONDS = 6.6;

function sampleClosedCatmullRom(points: ReadonlyArray<Point>, t: number): Point {
  const n = points.length;
  const wrapped = ((t % 1) + 1) % 1;
  const scaled = wrapped * n;
  const i1 = Math.floor(scaled) % n;
  const u = scaled - Math.floor(scaled);

  const p0 = points[(i1 - 1 + n) % n];
  const p1 = points[i1];
  const p2 = points[(i1 + 1) % n];
  const p3 = points[(i1 + 2) % n];

  const u2 = u * u;
  const u3 = u2 * u;

  const x =
    0.5 *
    (2 * p1.x +
      (-p0.x + p2.x) * u +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3);

  const y =
    0.5 *
    (2 * p1.y +
      (-p0.y + p2.y) * u +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3);

  return { x, y };
}

function easeOutCubic(x: number): number {
  const clamped = Math.min(Math.max(x, 0), 1);
  return 1 - Math.pow(1 - clamped, 3);
}

function clampNumber(value: number, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}

const SynapseCard = React.forwardRef<HTMLElement, SynapseCardProps>(
  (
    {
      title = "SYNAPSE",
      description = "THE ARCHITECTURE OF LIVING CONNECTIONS. A QUIET SYSTEM THAT ADAPTS ITS STRUCTURE IN REAL TIME AS SIGNALS MOVE.",
      theme = "auto",
      autoPlay = true,
      speed = 1,
      dotDensity = 10,
      dotReach = 3.8,
      lineReach = 2.5,
      soundEnabled = false,
      interactive = true,
      onConnectionChange,
      className,
      ...rest
    },
    ref
  ) => {
    const rawId = useId();
    const safeId = rawId.replace(/:/g, "");
    const headingId = `synapse-title-${safeId}`;
    const descId = `synapse-desc-${safeId}`;

    const prefersReducedMotion = usePrefersReducedMotion();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [activeLinks, setActiveLinks] = useState(12);
    const [isPaused, setIsPaused] = useState(false);

    const configRef = useRef({
      autoPlay,
      speed,
      dotDensity,
      dotReach,
      lineReach,
      soundEnabled,
      interactive,
      prefersReducedMotion,
      isPaused,
      theme,
    });
    configRef.current = {
      autoPlay,
      speed: clampNumber(speed, 0.2, 3, 1),
      dotDensity: clampNumber(dotDensity, 6, 18, 10),
      dotReach: clampNumber(dotReach, 2, 8, 3.8),
      lineReach: clampNumber(lineReach, 1.6, 5, 2.5),
      soundEnabled,
      interactive,
      prefersReducedMotion,
      isPaused,
      theme,
    };

    const onConnectionChangeRef = useRef(onConnectionChange);
    onConnectionChangeRef.current = onConnectionChange;

    const pointerRef = useRef({
      active: false,
      keyboardActive: false,
      targetX: 0,
      targetY: 0,
    });

    const hubRef = useRef<Point>({ x: 0, y: 0 });
    const initializedRef = useRef(false);
    const nodeStatesRef = useRef(new Map<string, NodeMorphState>());
    const lastLinkCountRef = useRef(-1);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const lastTickTimeRef = useRef(0);
    const userInteractedRef = useRef(false);

    const playSynapseTick = () => {
      if (!configRef.current.soundEnabled || !userInteractedRef.current) return;
      if (typeof window === "undefined") return;

      const nowMs = performance.now();
      if (nowMs - lastTickTimeRef.current < 44) return;
      lastTickTimeRef.current = nowMs;

      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!AudioCtx) return;

        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") {
          void ctx.resume();
        }

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(310, now + 0.014);

        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1100, now);
        filter.Q.setValueAtTime(1.4, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.016);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.018);
      } catch {
        // Ignore restricted Web Audio contexts
      }
    };

    useEffect(() => {
      return () => {
        if (audioCtxRef.current) {
          void audioCtxRef.current.close();
          audioCtxRef.current = null;
        }
      };
    }, []);

    useEffect(() => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let width = 0;
      let height = 0;
      let dpr = 1;
      let rafId = 0;
      let lastFrameTime = performance.now();
      let phase = 0;

      const resize = () => {
        const rect = container.getBoundingClientRect();
        width = Math.max(1, rect.width);
        height = Math.max(1, rect.height);
        dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        if (!initializedRef.current) {
          hubRef.current = { x: width / 2, y: height / 2 };
          pointerRef.current.targetX = width / 2;
          pointerRef.current.targetY = height / 2;
          initializedRef.current = true;
        }
      };

      resize();
      const observer = new ResizeObserver(resize);
      observer.observe(container);

      const resolveForegroundColor = (): string => {
        if (configRef.current.theme === "dark") return "#ffffff";
        if (configRef.current.theme === "light") return "#09090b";
        const computed = window.getComputedStyle(container).color;
        return computed || "#ffffff";
      };

      const render = (now: number) => {
        const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
        lastFrameTime = now;

        const {
          autoPlay: isAuto,
          speed: spd,
          dotDensity: density,
          dotReach: dReach,
          lineReach: lReach,
          prefersReducedMotion: reduced,
          isPaused: paused,
        } = configRef.current;

        const pitch = width / density;
        const centerX = width / 2;
        const centerY = height / 2;

        let targetX = centerX;
        let targetY = centerY;

        if (pointerRef.current.active || pointerRef.current.keyboardActive) {
          targetX = pointerRef.current.targetX;
          targetY = pointerRef.current.targetY;
        } else if (isAuto && !reduced && !paused) {
          phase = (phase + (dt * spd) / BASE_CYCLE_SECONDS) % 1;
          const norm = sampleClosedCatmullRom(ORBIT_WAYPOINTS, phase);
          targetX = centerX + norm.x * (width * 0.44);
          targetY = centerY + norm.y * (height * 0.36);
        }

        const smoothing = reduced ? 1 : 1 - Math.exp(-dt * 10);
        hubRef.current.x += (targetX - hubRef.current.x) * smoothing;
        hubRef.current.y += (targetY - hubRef.current.y) * smoothing;

        const hx = hubRef.current.x;
        const hy = hubRef.current.y;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);

        const fgColor = resolveForegroundColor();

        const minConnectDist = pitch * 1.42;
        const maxConnectDist = pitch * lReach;
        // Always ensure dots remain visible beyond the active line reach
        const spotlightRadius = Math.max(
          pitch * dReach,
          maxConnectDist + pitch * 0.75
        );
        const maxDotRadius = Math.min(Math.max(pitch * 0.112, 2.6), 7.5);
        const hubRadius = Math.min(Math.max(pitch * 0.175, 5.5), 11.5);

        const colsHalf = Math.ceil(width / (2 * pitch)) + 1;
        const rowsHalf = Math.ceil(height / (2 * pitch)) + 1;

        const morphInRate = reduced ? 1 : 1 - Math.exp(-dt * 15);
        const morphOutRate = reduced ? 1 : 1 - Math.exp(-dt * 11);
        const pullRate = reduced ? 1 : 1 - Math.exp(-dt * 11);

        let activeCount = 0;
        let newlyLinked = false;
        const activeKeys = new Set<string>();

        const drawSpokes: Array<{ x: number; y: number; progress: number }> = [];
        const drawDots: Array<{
          x: number;
          y: number;
          r: number;
          alpha: number;
        }> = [];

        for (let r = -rowsHalf; r <= rowsHalf; r++) {
          const gy = centerY + r * pitch;
          if (gy < -pitch || gy > height + pitch) continue;

          for (let c = -colsHalf; c <= colsHalf; c++) {
            const gx = centerX + c * pitch;
            if (gx < -pitch || gx > width + pitch) continue;

            const key = `${c},${r}`;
            const dx = gx - hx;
            const dy = gy - hy;
            const dist = Math.hypot(dx, dy);

            const isLinked = dist >= minConnectDist && dist <= maxConnectDist;
            if (isLinked) activeCount++;

            let state = nodeStatesRef.current.get(key);
            if (!state && (dist < spotlightRadius || isLinked)) {
              state = {
                progress: isLinked ? 1 : 0,
                pullX: 0,
                pullY: 0,
                wasLinked: isLinked,
              };
              nodeStatesRef.current.set(key, state);
            }

            if (!state) continue;
            activeKeys.add(key);

            const targetProgress = isLinked ? 1 : 0;
            const rate = isLinked ? morphInRate : morphOutRate;
            state.progress += (targetProgress - state.progress) * rate;
            if (state.progress < 0.008 && !isLinked) {
              state.progress = 0;
            }

            if (isLinked && !state.wasLinked) {
              newlyLinked = true;
            }
            state.wasLinked = isLinked;

            const pullStrength =
              isLinked && dist > 1 ? pitch * 0.045 * state.progress : 0;
            const targetPullX = dist > 1 ? (-dx / dist) * pullStrength : 0;
            const targetPullY = dist > 1 ? (-dy / dist) * pullStrength : 0;
            state.pullX += (targetPullX - state.pullX) * pullRate;
            state.pullY += (targetPullY - state.pullY) * pullRate;

            const renderX = gx + state.pullX;
            const renderY = gy + state.pullY;

            if (state.progress > 0.015) {
              drawSpokes.push({
                x: renderX,
                y: renderY,
                progress: state.progress,
              });
            }

            if (dist < spotlightRadius) {
              const t = 1 - dist / spotlightRadius;
              const baseR = Math.max(0.55, maxDotRadius * Math.pow(t, 1.32));
              const morphedR = baseR * (1 + state.progress * 0.12);
              const alpha = t < 0.2 ? t / 0.2 : 1;

              drawDots.push({
                x: renderX,
                y: renderY,
                r: morphedR,
                alpha,
              });
            }
          }
        }

        nodeStatesRef.current.forEach((st, key) => {
          if (!activeKeys.has(key) && st.progress === 0) {
            nodeStatesRef.current.delete(key);
          }
        });

        if (newlyLinked && lastLinkCountRef.current > 0) {
          playSynapseTick();
        }
        if (activeCount !== lastLinkCountRef.current) {
          lastLinkCountRef.current = activeCount;
          setActiveLinks(activeCount);
          onConnectionChangeRef.current?.(activeCount);
        }

        // 1. Draw crisp smoothly morphing radial spokes
        ctx.save();
        ctx.strokeStyle = fgColor;
        ctx.lineCap = "round";
        const baseLineWidth = Math.min(Math.max(pitch * 0.018, 0.9), 1.4);
        for (let i = 0; i < drawSpokes.length; i++) {
          const sp = drawSpokes[i];
          const eased = easeOutCubic(sp.progress);
          const endX = hx + (sp.x - hx) * eased;
          const endY = hy + (sp.y - hy) * eased;

          ctx.globalAlpha = 0.86 * eased;
          ctx.lineWidth = baseLineWidth * (0.8 + 0.2 * eased);
          ctx.beginPath();
          ctx.moveTo(hx, hy);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
        ctx.restore();

        // 2. Draw proximity-scaled crisp grid dots
        ctx.save();
        ctx.fillStyle = fgColor;
        for (let i = 0; i < drawDots.length; i++) {
          const dot = drawDots[i];
          ctx.globalAlpha = dot.alpha;
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // 3. Draw pure solid monochrome central hub node
        ctx.save();
        ctx.fillStyle = fgColor;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(hx, hy, hubRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        rafId = window.requestAnimationFrame(render);
      };

      rafId = window.requestAnimationFrame(render);

      return () => {
        window.cancelAnimationFrame(rafId);
        observer.disconnect();
      };
    }, []);

    const updatePointerFromEvent = (
      event: React.PointerEvent<HTMLDivElement>
    ) => {
      if (!configRef.current.interactive || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
      const y = Math.min(Math.max(event.clientY - rect.top, 0), rect.height);
      pointerRef.current.active = true;
      pointerRef.current.keyboardActive = false;
      pointerRef.current.targetX = x;
      pointerRef.current.targetY = y;
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
      userInteractedRef.current = true;
      updatePointerFromEvent(event);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
      updatePointerFromEvent(event);
    };

    const handlePointerLeave = () => {
      pointerRef.current.active = false;
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!configRef.current.interactive || !containerRef.current) return;
      userInteractedRef.current = true;
      const rect = containerRef.current.getBoundingClientRect();
      const step = rect.width / 18;

      if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key === "ArrowUp" ||
        event.key === "ArrowDown"
      ) {
        event.preventDefault();
        if (!pointerRef.current.keyboardActive) {
          pointerRef.current.targetX = hubRef.current.x;
          pointerRef.current.targetY = hubRef.current.y;
          pointerRef.current.keyboardActive = true;
        }
        if (event.key === "ArrowLeft") {
          pointerRef.current.targetX = Math.max(
            0,
            pointerRef.current.targetX - step
          );
        } else if (event.key === "ArrowRight") {
          pointerRef.current.targetX = Math.min(
            rect.width,
            pointerRef.current.targetX + step
          );
        } else if (event.key === "ArrowUp") {
          pointerRef.current.targetY = Math.max(
            0,
            pointerRef.current.targetY - step
          );
        } else if (event.key === "ArrowDown") {
          pointerRef.current.targetY = Math.min(
            rect.height,
            pointerRef.current.targetY + step
          );
        }
      } else if (event.key === "Home") {
        event.preventDefault();
        pointerRef.current.keyboardActive = false;
        pointerRef.current.active = false;
        pointerRef.current.targetX = rect.width / 2;
        pointerRef.current.targetY = rect.height / 2;
      } else if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        pointerRef.current.keyboardActive = false;
        setIsPaused((prev) => !prev);
      }
    };

    const surfaceThemeClasses =
      theme === "dark"
        ? "bg-[#010002] text-[#f5f5f5] border-[#2d2a2e]"
        : theme === "light"
          ? "bg-white text-zinc-950 border-zinc-200"
          : "bg-white text-zinc-950 border-zinc-200 dark:bg-[#010002] dark:text-[#f5f5f5] dark:border-[#2d2a2e]";

    const dividerThemeClasses =
      theme === "dark"
        ? "border-[#2d2a2e] divide-[#2d2a2e]"
        : theme === "light"
          ? "border-zinc-200 divide-zinc-200"
          : "border-zinc-200 divide-zinc-200 dark:border-[#2d2a2e] dark:divide-[#2d2a2e]";

    const focusRingClasses =
      theme === "dark"
        ? "focus-visible:ring-white/60"
        : theme === "light"
          ? "focus-visible:ring-zinc-900/50"
          : "focus-visible:ring-zinc-900/50 dark:focus-visible:ring-white/60";

    return (
      <article
        ref={ref}
        aria-labelledby={headingId}
        aria-describedby={descId}
        className={cn(
          "w-full max-w-[460px] border select-none overflow-hidden transition-colors duration-200",
          surfaceThemeClasses,
          className
        )}
        style={{
          fontFamily:
            "'Chakra Petch', 'Space Grotesk', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
        }}
        {...rest}
      >
        {/* Clean Swiss split header */}
        <header
          className={cn(
            "grid grid-cols-2 border-b divide-x",
            dividerThemeClasses
          )}
        >
          <div className="flex items-center justify-center px-4 py-7 sm:px-6 sm:py-9">
            <h2
              id={headingId}
              className="text-center text-[14px] sm:text-[16px] font-semibold uppercase tracking-[0.14em] leading-none"
            >
              {title}
            </h2>
          </div>

          <div className="flex items-center px-4 py-5 sm:px-6 sm:py-6">
            <p
              id={descId}
              className="text-left text-[8.5px] sm:text-[9.5px] font-medium uppercase tracking-[0.07em] leading-[1.68]"
            >
              {description}
            </p>
          </div>
        </header>

        {/* Interactive dot-matrix morphing network canvas */}
        <div
          ref={containerRef}
          role="application"
          tabIndex={interactive ? 0 : -1}
          aria-label={`${title} interactive network visualization with ${activeLinks} active radial connections. Use pointer or arrow keys to move the central node, Space to pause or resume, and Home to recenter.`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onKeyDown={handleKeyDown}
          className={cn(
            "relative w-full aspect-[63/69] overflow-hidden outline-none focus-visible:ring-1 focus-visible:ring-inset",
            interactive ? "cursor-crosshair" : "cursor-default",
            focusRingClasses
          )}
        >
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="block h-full w-full"
          />
          <span className="sr-only" aria-live="polite">
            {activeLinks} active connections
          </span>
        </div>
      </article>
    );
  }
);

SynapseCard.displayName = "SynapseCard";

export {
  SynapseCard,
  SynapseCard as component,
  SynapseCard as Component,
};
export default SynapseCard;