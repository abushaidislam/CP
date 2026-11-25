"use client";

import React, { useEffect, useId, useRef, useState, useCallback } from "react";
import { useReducedMotion } from "framer-motion";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type LiquidMorphTheme = "auto" | "dark" | "light";

export interface LiquidMorphTextProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Text string to render with liquid metaball hover physics. */
  text?: string;
  /** Font size in pixels (clamped between 40 and 240). */
  fontSize?: number;
  /** Radius of cursor liquid influence in pixels. */
  radius?: number;
  /** Inflation strength multiplier (0.3 to 1.8). */
  intensity?: number;
  /** Whether to render the typography in slanted italic style. */
  italic?: boolean;
  /** Color theme mode. Defaults to "auto" to follow light/dark mode. */
  theme?: LiquidMorphTheme;
  /** Optional font family stack. */
  fontFamily?: string;
  /** Font weight for the display typography. */
  fontWeight?: number;
}

interface GlyphPoint {
  x: number;
  y: number;
  inflation: number;
  vx: number;
  vy: number;
  phase: number;
}

interface TrailNode {
  x: number;
  y: number;
  strength: number;
}

const DEFAULT_FONT_FAMILY =
  '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

function clamp(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.min(max, Math.max(min, val));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

const LiquidMorphText = React.forwardRef<HTMLDivElement, LiquidMorphTextProps>(
  (
    {
      text = "morph",
      fontSize = 136,
      radius = 95,
      intensity = 1,
      italic = true,
      theme = "auto",
      fontFamily = DEFAULT_FONT_FAMILY,
      fontWeight = 600,
      className,
      style,
      onPointerMove,
      onPointerEnter,
      onPointerLeave,
      onKeyDown,
      ...rest
    },
    ref
  ) => {
    const rawId = useId();
    const filterId = `liquid-morph-goo-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const prefersReducedMotion = useReducedMotion();

    const safeText = text && text.trim().length > 0 ? text : "morph";
    const safeFontSize = clamp(fontSize, 40, 240);
    const safeRadius = clamp(radius, 35, 240);
    const safeIntensity = clamp(intensity, 0.3, 1.8);
    const safeWeight = clamp(fontWeight, 300, 900);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const gooCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const pointsRef = useRef<GlyphPoint[]>([]);
    const dimensionsRef = useRef({ width: 520, height: 260 });
    const [canvasSize, setCanvasSize] = useState({ width: 520, height: 260 });
    const [isFocused, setIsFocused] = useState(false);

    const pointerRef = useRef({
      active: false,
      targetX: -9999,
      targetY: -9999,
      curX: -9999,
      curY: -9999,
      strength: 0,
    });

    const trailRef = useRef<TrailNode[]>([
      { x: -9999, y: -9999, strength: 0 },
      { x: -9999, y: -9999, strength: 0 },
      { x: -9999, y: -9999, strength: 0 },
    ]);

    const waveRef = useRef<{ active: boolean; progress: number }>({
      active: false,
      progress: 0,
    });

    const rafIdRef = useRef<number | null>(null);
    const inkColorRef = useRef<string>("#ffffff");
    const gooOpacityRef = useRef<number>(0);

    const mergedRef = useCallback(
      (node: HTMLDivElement | null) => {
        containerRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [ref]
    );

    const resolveInkColor = useCallback((): string => {
      if (theme === "dark") return "#ffffff";
      if (theme === "light") return "#121212";
      if (typeof window !== "undefined" && containerRef.current) {
        const computed = window.getComputedStyle(containerRef.current).color;
        if (computed) return computed;
      }
      return "#ffffff";
    }, [theme]);

    const drawBaseLayer = useCallback(
      (width: number, height: number, inkColor: string) => {
        const baseCanvas = baseCanvasRef.current;
        const offscreen = offscreenCanvasRef.current;
        if (!baseCanvas || !offscreen) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        baseCanvas.width = Math.round(width * dpr);
        baseCanvas.height = Math.round(height * dpr);

        const ctx = baseCanvas.getContext("2d");
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);

        const fontSpec = `${italic ? "italic " : ""}${safeWeight} ${safeFontSize}px ${fontFamily}`;
        ctx.font = fontSpec;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = inkColor;
        ctx.fillText(safeText, width / 2, height / 2 + safeFontSize * 0.03);

        offscreen.width = width;
        offscreen.height = height;
        const offCtx = offscreen.getContext("2d");
        if (!offCtx) return;
        offCtx.clearRect(0, 0, width, height);
        offCtx.font = fontSpec;
        offCtx.textAlign = "center";
        offCtx.textBaseline = "middle";
        offCtx.fillStyle = inkColor;
        offCtx.fillText(safeText, width / 2, height / 2 + safeFontSize * 0.03);
      },
      [safeText, safeFontSize, safeWeight, italic, fontFamily]
    );

    const buildGlyphSamples = useCallback(() => {
      if (typeof document === "undefined") return;

      const measureCanvas = document.createElement("canvas");
      const measureCtx = measureCanvas.getContext("2d");
      if (!measureCtx) return;

      const fontSpec = `${italic ? "italic " : ""}${safeWeight} ${safeFontSize}px ${fontFamily}`;
      measureCtx.font = fontSpec;
      const metrics = measureCtx.measureText(safeText);

      const padX = Math.ceil(safeFontSize * 0.72);
      const padY = Math.ceil(safeFontSize * 0.65);
      const measuredW = Math.ceil(
        Math.max(
          metrics.width,
          (metrics.actualBoundingBoxLeft || 0) +
            (metrics.actualBoundingBoxRight || 0)
        )
      );
      const width = Math.max(220, measuredW + padX * 2);
      const height = Math.max(140, Math.ceil(safeFontSize * 1.15) + padY * 2);

      dimensionsRef.current = { width, height };
      setCanvasSize((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height }
      );

      if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = document.createElement("canvas");
      }

      const inkColor = resolveInkColor();
      inkColorRef.current = inkColor;

      const gooCanvas = gooCanvasRef.current;
      if (gooCanvas) {
        gooCanvas.width = width;
        gooCanvas.height = height;
      }

      drawBaseLayer(width, height, inkColor);

      const offscreen = offscreenCanvasRef.current;
      const offCtx = offscreen.getContext("2d", { willReadFrequently: true });
      if (!offCtx) return;

      const imgData = offCtx.getImageData(0, 0, width, height).data;
      const step = Math.max(4, Math.round(safeFontSize * 0.044));
      const samples: GlyphPoint[] = [];

      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const alpha = imgData[(y * width + x) * 4 + 3];
          if (alpha > 110) {
            samples.push({
              x,
              y,
              inflation: 0,
              vx: 0,
              vy: 0,
              phase: (x * 0.13 + y * 0.19) % (Math.PI * 2),
            });
          }
        }
      }

      pointsRef.current = samples;
    }, [safeText, safeFontSize, safeWeight, italic, fontFamily, resolveInkColor, drawBaseLayer]);

    useEffect(() => {
      buildGlyphSamples();

      let cancelled = false;
      if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          if (!cancelled) {
            buildGlyphSamples();
          }
        });
      }
      return () => {
        cancelled = true;
      };
    }, [buildGlyphSamples]);

    useEffect(() => {
      if (typeof window === "undefined") return;

      const syncColor = () => {
        const nextColor = resolveInkColor();
        if (nextColor !== inkColorRef.current) {
          inkColorRef.current = nextColor;
          const { width, height } = dimensionsRef.current;
          drawBaseLayer(width, height, nextColor);
        }
      };

      syncColor();

      if (theme !== "auto") return;

      const observer = new MutationObserver(syncColor);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "data-theme", "style"],
      });

      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", syncColor);

      return () => {
        observer.disconnect();
        mq.removeEventListener("change", syncColor);
      };
    }, [theme, resolveInkColor, drawBaseLayer]);

    const runAnimationLoop = useCallback(() => {
      if (rafIdRef.current !== null) return;

      const stepFrame = () => {
        const gooCanvas = gooCanvasRef.current;
        const offscreen = offscreenCanvasRef.current;
        if (!gooCanvas || !offscreen) {
          rafIdRef.current = null;
          return;
        }

        const ctx = gooCanvas.getContext("2d");
        if (!ctx) {
          rafIdRef.current = null;
          return;
        }

        const { width, height } = dimensionsRef.current;
        const pointer = pointerRef.current;
        const trail = trailRef.current;
        const wave = waveRef.current;
        const points = pointsRef.current;

        if (wave.active) {
          wave.progress += 0.022;
          const pad = safeFontSize * 0.4;
          const waveX = pad + (width - pad * 2) * wave.progress;
          const waveY =
            height * 0.52 +
            Math.sin(wave.progress * Math.PI * 2) * (safeFontSize * 0.14);
          pointer.targetX = waveX;
          pointer.targetY = waveY;
          pointer.active = true;
          if (wave.progress >= 1.15) {
            wave.active = false;
            pointer.active = false;
          }
        }

        if (pointer.active) {
          if (pointer.curX < -5000) {
            pointer.curX = pointer.targetX;
            pointer.curY = pointer.targetY;
          } else {
            pointer.curX += (pointer.targetX - pointer.curX) * 0.2;
            pointer.curY += (pointer.targetY - pointer.curY) * 0.2;
          }
          pointer.strength += (1 - pointer.strength) * 0.18;
        } else {
          pointer.strength += (0 - pointer.strength) * 0.12;
        }

        const trailFollowRates = [0.14, 0.095, 0.065];
        for (let i = 0; i < trail.length; i++) {
          const leaderX = i === 0 ? pointer.curX : trail[i - 1].x;
          const leaderY = i === 0 ? pointer.curY : trail[i - 1].y;
          if (trail[i].x < -5000 && pointer.curX > -5000) {
            trail[i].x = leaderX;
            trail[i].y = leaderY;
          } else {
            trail[i].x += (leaderX - trail[i].x) * trailFollowRates[i];
            trail[i].y += (leaderY - trail[i].y) * trailFollowRates[i];
          }
          const targetStrength = pointer.strength * (0.78 - i * 0.18);
          trail[i].strength += (targetStrength - trail[i].strength) * 0.14;
        }

        const effectiveRadius = safeRadius * (safeFontSize / 136);
        const maxInflateR = safeFontSize * 0.175 * safeIntensity;
        const baseDotR = Math.max(2.5, safeFontSize * 0.032);
        const pullMax = safeFontSize * 0.055 * safeIntensity;

        let maxInflation = 0;
        let nearestDistSq = Infinity;

        for (let i = 0; i < points.length; i++) {
          const p = points[i];

          let targetInf = 0;
          let targetVx = 0;
          let targetVy = 0;

          if (pointer.strength > 0.005) {
            const dx = pointer.curX - p.x;
            const dy = pointer.curY - p.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < nearestDistSq) nearestDistSq = distSq;

            const dist = Math.sqrt(distSq);
            if (dist < effectiveRadius) {
              const falloff = smoothstep(effectiveRadius, 0, dist);
              const organicBoost = 0.88 + 0.24 * Math.sin(p.phase);
              targetInf = falloff * pointer.strength * organicBoost;
              const pull = falloff * pointer.strength * pullMax;
              if (dist > 0.5) {
                targetVx = (dx / dist) * pull * 0.42;
                targetVy = (dy / dist) * pull * 0.42;
              }
            }
          }

          for (let t = 0; t < trail.length; t++) {
            const tn = trail[t];
            if (tn.strength < 0.02) continue;
            const dx = tn.x - p.x;
            const dy = tn.y - p.y;
            const rTrail = effectiveRadius * (0.85 - t * 0.12);
            const distSq = dx * dx + dy * dy;
            if (distSq < rTrail * rTrail) {
              const falloff = smoothstep(rTrail, 0, Math.sqrt(distSq));
              const wakeInf = falloff * tn.strength * 0.82;
              if (wakeInf > targetInf) {
                targetInf = wakeInf;
              }
            }
          }

          const ease = targetInf > p.inflation ? 0.22 : 0.11;
          p.inflation += (targetInf - p.inflation) * ease;
          p.vx += (targetVx - p.vx) * 0.16;
          p.vy += (targetVy - p.vy) * 0.16;

          if (p.inflation > maxInflation) {
            maxInflation = p.inflation;
          }
        }

        ctx.clearRect(0, 0, width, height);

        const targetGooOpacity = clamp(maxInflation * 5.5, 0, 1);
        gooOpacityRef.current += (targetGooOpacity - gooOpacityRef.current) * 0.22;
        gooCanvas.style.opacity = gooOpacityRef.current.toFixed(3);

        if (gooOpacityRef.current > 0.008) {
          // Draw base text silhouette clipped to active molten zone so distant letters stay razor-sharp
          ctx.save();
          ctx.beginPath();
          const clipR = effectiveRadius * 1.45;
          if (pointer.curX > -5000) {
            ctx.moveTo(pointer.curX + clipR, pointer.curY);
            ctx.arc(pointer.curX, pointer.curY, clipR, 0, Math.PI * 2);
          }
          for (let t = 0; t < trail.length; t++) {
            if (trail[t].x > -5000) {
              const tr = clipR * (0.9 - t * 0.12);
              ctx.moveTo(trail[t].x + tr, trail[t].y);
              ctx.arc(trail[t].x, trail[t].y, tr, 0, Math.PI * 2);
            }
          }
          ctx.clip();
          ctx.drawImage(offscreen, 0, 0);
          ctx.restore();

          ctx.fillStyle = inkColorRef.current;
          ctx.beginPath();
          for (let i = 0; i < points.length; i++) {
            const p = points[i];
            if (p.inflation < 0.012) continue;
            const r = baseDotR + p.inflation * maxInflateR;
            const px = p.x + p.vx;
            const py = p.y + p.vy;
            ctx.moveTo(px + r, py);
            ctx.arc(px, py, r, 0, Math.PI * 2);
          }

          const nearestDist = Math.sqrt(nearestDistSq);
          if (pointer.strength > 0.05 && nearestDist < effectiveRadius * 0.55) {
            const bridgeProximity = smoothstep(effectiveRadius * 0.55, 0, nearestDist);
            const bridgeR =
              safeFontSize * 0.115 * safeIntensity * pointer.strength * bridgeProximity;
            if (bridgeR > 2) {
              ctx.moveTo(pointer.curX + bridgeR, pointer.curY);
              ctx.arc(pointer.curX, pointer.curY, bridgeR, 0, Math.PI * 2);
            }
          }

          ctx.fill();
        }

        if (
          !pointer.active &&
          !wave.active &&
          pointer.strength < 0.004 &&
          maxInflation < 0.004 &&
          gooOpacityRef.current < 0.008
        ) {
          gooCanvas.style.opacity = "0";
          ctx.clearRect(0, 0, width, height);
          rafIdRef.current = null;
          return;
        }

        rafIdRef.current = window.requestAnimationFrame(stepFrame);
      };

      rafIdRef.current = window.requestAnimationFrame(stepFrame);
    }, [safeFontSize, safeRadius, safeIntensity]);

    useEffect(() => {
      return () => {
        if (rafIdRef.current !== null) {
          window.cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
      };
    }, []);

    const updatePointerFromEvent = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        const canvas = baseCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const { width, height } = dimensionsRef.current;
        const scaleX = width / rect.width;
        const scaleY = height / rect.height;

        pointerRef.current.targetX = (e.clientX - rect.left) * scaleX;
        pointerRef.current.targetY = (e.clientY - rect.top) * scaleY;
        pointerRef.current.active = true;
        waveRef.current.active = false;
      },
      []
    );

    const handlePointerEnter = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!prefersReducedMotion) {
          updatePointerFromEvent(e);
          runAnimationLoop();
        }
        onPointerEnter?.(e);
      },
      [prefersReducedMotion, updatePointerFromEvent, runAnimationLoop, onPointerEnter]
    );

    const handlePointerMove = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!prefersReducedMotion) {
          updatePointerFromEvent(e);
          runAnimationLoop();
        }
        onPointerMove?.(e);
      },
      [prefersReducedMotion, updatePointerFromEvent, runAnimationLoop, onPointerMove]
    );

    const handlePointerLeave = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        pointerRef.current.active = false;
        onPointerLeave?.(e);
      },
      [onPointerLeave]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!prefersReducedMotion && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          waveRef.current = { active: true, progress: 0 };
          pointerRef.current.curX = -9999;
          runAnimationLoop();
        }
        onKeyDown?.(e);
      },
      [prefersReducedMotion, runAnimationLoop, onKeyDown]
    );

    const blurStdDev = clamp(Number((safeFontSize * 0.056).toFixed(2)), 3.2, 12);

    const themeClasses =
      theme === "dark"
        ? "bg-[#121212] text-white"
        : theme === "light"
          ? "bg-white text-[#121212]"
          : "bg-transparent text-[#121212] dark:text-white";

    return (
      <div
        ref={mergedRef}
        role="img"
        aria-label={safeText}
        tabIndex={0}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative inline-flex max-w-full select-none items-center justify-center rounded-2xl transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/60 dark:focus-visible:ring-neutral-500/60",
          prefersReducedMotion ? "cursor-default" : "cursor-pointer",
          themeClasses,
          className
        )}
        style={style}
        {...rest}
      >
        <span className="sr-only">{safeText}</span>

        <svg
          aria-hidden="true"
          className="pointer-events-none absolute h-0 w-0 overflow-hidden"
          focusable="false"
        >
          <defs>
            <filter
              id={filterId}
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation={blurStdDev}
                result="blur"
              />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -11"
                result="goo"
              />
              <feComposite in="goo" in2="goo" operator="atop" />
            </filter>
          </defs>
        </svg>

        <div
          className="relative max-w-full"
          style={{
            width: canvasSize.width,
            aspectRatio: `${canvasSize.width} / ${canvasSize.height}`,
          }}
        >
          <canvas
            ref={baseCanvasRef}
            aria-hidden="true"
            className={cn(
              "block h-full w-full transition-opacity duration-200",
              prefersReducedMotion && isFocused && "opacity-85"
            )}
          />

          {!prefersReducedMotion && (
            <canvas
              ref={gooCanvasRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full"
              style={{
                opacity: 0,
                filter: `url(#${filterId})`,
                willChange: "filter, opacity",
              }}
            />
          )}
        </div>
      </div>
    );
  }
);

LiquidMorphText.displayName = "LiquidMorphText";

export {
  LiquidMorphText,
  LiquidMorphText as component,
  LiquidMorphText as Component,
};
export default LiquidMorphText;