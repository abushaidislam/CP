"use client";

import React, { useEffect, useId, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUp, ArrowUpRight, Check } from "lucide-react";

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

export interface FooterLink {
  label: string;
  href: string;
  badge?: string;
  external?: boolean;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface FooterSocialLink {
  label: string;
  href: string;
  icon: "x" | "github" | "linkedin" | "youtube";
}

export interface LiquidMorphFooterProps
  extends React.HTMLAttributes<HTMLElement> {
  /** Brand display name shown in the header mark and default wordmark. */
  brandName?: string;
  /** Optional override for the monumental liquid-morph wordmark text. */
  wordmarkText?: string;
  /** Short editorial tagline beneath the brand mark. */
  tagline?: string;
  /** Structured navigation columns. */
  columns?: FooterColumn[];
  /** Bottom legal links. */
  legalLinks?: FooterLink[];
  /** Social icon links rendered in the bottom utility bar. */
  socialLinks?: FooterSocialLink[];
  /** Copyright notice text. */
  copyrightText?: string;
  /** Toggle the inline newsletter capture form. */
  showNewsletter?: boolean;
  /** Label above the newsletter input. */
  newsletterHeading?: string;
  /** Placeholder text for the newsletter email input. */
  newsletterPlaceholder?: string;
  /** Callback invoked when a valid email is submitted. */
  onSubscribe?: (email: string) => void | Promise<void>;
  /** Optional callback when a footer link is clicked. */
  onLinkClick?: (link: FooterLink) => void;
  /** Font size for the monumental liquid-morph wordmark (40 to 240). */
  fontSize?: number;
  /** Cursor influence radius for the liquid-morph wordmark (35 to 240). */
  morphRadius?: number;
  /** Inflation intensity for the liquid-morph wordmark (0.3 to 1.8). */
  morphIntensity?: number;
  /** Whether the giant wordmark renders in italic style. */
  italicWordmark?: boolean;
  /** Toggle the back-to-top utility button. */
  showBackToTop?: boolean;
  /** Color theme mode. Defaults to "auto" to follow light/dark mode. */
  theme?: LiquidMorphTheme;
}

interface GlyphPoint {
  x: number;
  y: number;
  inflation: number;
  vel: number;
  ox: number;
  oy: number;
}

interface TrailNode {
  x: number;
  y: number;
  strength: number;
}

const DEFAULT_FONT_FAMILY =
  '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const DEFAULT_COLUMNS: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Components", href: "#components" },
      { label: "Motion Primitives", href: "#motion", badge: "New" },
      { label: "Templates", href: "#templates" },
      { label: "Changelog", href: "#changelog" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#docs" },
      { label: "Design Tokens", href: "#tokens" },
      { label: "Showcase", href: "#showcase" },
      { label: "CLI Reference", href: "#cli" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Nuvora", href: "#about" },
      { label: "Journal", href: "#journal" },
      { label: "Careers", href: "#careers" },
      { label: "Contact", href: "#contact" },
    ],
  },
];

const DEFAULT_LEGAL_LINKS: FooterLink[] = [
  { label: "Privacy", href: "#privacy" },
  { label: "Terms", href: "#terms" },
  { label: "Security", href: "#security" },
];

const DEFAULT_SOCIAL_LINKS: FooterSocialLink[] = [
  { label: "X", href: "#x", icon: "x" },
  { label: "GitHub", href: "#github", icon: "github" },
  { label: "LinkedIn", href: "#linkedin", icon: "linkedin" },
  { label: "YouTube", href: "#youtube", icon: "youtube" },
];

function clamp(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.min(max, Math.max(min, val));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function resolveRgb(color: string): [number, number, number] {
  if (typeof document === "undefined") return [255, 255, 255];
  const probe = document.createElement("canvas");
  probe.width = 1;
  probe.height = 1;
  const ctx = probe.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [255, 255, 255];
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const data = ctx.getImageData(0, 0, 1, 1).data;
  return [data[0], data[1], data[2]];
}

function buildMetaballSprite(color: string): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const size = 64;
  const half = size / 2;
  const sprite = document.createElement("canvas");
  sprite.width = size;
  sprite.height = size;
  const ctx = sprite.getContext("2d");
  if (!ctx) return null;

  const [r, g, b] = resolveRgb(color);
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
  grad.addColorStop(0.38, `rgba(${r}, ${g}, ${b}, 0.92)`);
  grad.addColorStop(0.68, `rgba(${r}, ${g}, ${b}, 0.42)`);
  grad.addColorStop(0.88, `rgba(${r}, ${g}, ${b}, 0.1)`);
  grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return sprite;
}

const LiquidMorphText = React.forwardRef<HTMLDivElement, LiquidMorphTextProps>(
  (
    {
      text = "nuvora",
      fontSize = 184,
      radius = 105,
      intensity = 1.05,
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

    const safeText = text && text.trim().length > 0 ? text : "nuvora";
    const safeFontSize = clamp(fontSize, 40, 240);
    const safeRadius = clamp(radius, 35, 240);
    const safeIntensity = clamp(intensity, 0.3, 1.8);
    const safeWeight = clamp(fontWeight, 300, 900);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const gooCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const spriteCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const pointsRef = useRef<GlyphPoint[]>([]);
    const dimensionsRef = useRef({ width: 640, height: 260 });
    const [canvasSize, setCanvasSize] = useState({ width: 640, height: 260 });
    const [isFocused, setIsFocused] = useState(false);

    const pointerRef = useRef({
      active: false,
      targetX: -9999,
      targetY: -9999,
      curX: -9999,
      curY: -9999,
      velX: 0,
      velY: 0,
      strength: 0,
    });

    const trailRef = useRef<TrailNode[]>([
      { x: -9999, y: -9999, strength: 0 },
      { x: -9999, y: -9999, strength: 0 },
      { x: -9999, y: -9999, strength: 0 },
      { x: -9999, y: -9999, strength: 0 },
      { x: -9999, y: -9999, strength: 0 },
    ]);

    const waveRef = useRef<{ active: boolean; progress: number }>({
      active: false,
      progress: 0,
    });

    const rafIdRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(0);
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

        spriteCanvasRef.current = buildMetaballSprite(inkColor);
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

      const padX = Math.ceil(safeFontSize * 0.56);
      const padY = Math.ceil(safeFontSize * 0.48);
      const measuredW = Math.ceil(
        Math.max(
          metrics.width,
          (metrics.actualBoundingBoxLeft || 0) +
            (metrics.actualBoundingBoxRight || 0)
        )
      );
      const width = Math.max(220, measuredW + padX * 2);
      const height = Math.max(140, Math.ceil(safeFontSize * 1.12) + padY * 2);

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
      const step = Math.max(4, Math.round(safeFontSize * 0.04));
      const samples: GlyphPoint[] = [];

      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const alpha = imgData[(y * width + x) * 4 + 3];
          if (alpha > 110) {
            samples.push({
              x,
              y,
              inflation: 0,
              vel: 0,
              ox: 0,
              oy: 0,
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
      lastTimeRef.current = performance.now();

      const stepFrame = (now: number) => {
        const gooCanvas = gooCanvasRef.current;
        const offscreen = offscreenCanvasRef.current;
        const sprite = spriteCanvasRef.current;
        if (!gooCanvas || !offscreen || !sprite) {
          rafIdRef.current = null;
          return;
        }

        const ctx = gooCanvas.getContext("2d");
        if (!ctx) {
          rafIdRef.current = null;
          return;
        }

        const dt = clamp((now - lastTimeRef.current) / 1000, 0.001, 0.04);
        lastTimeRef.current = now;

        const { width, height } = dimensionsRef.current;
        const pointer = pointerRef.current;
        const trail = trailRef.current;
        const wave = waveRef.current;
        const points = pointsRef.current;

        if (wave.active) {
          wave.progress += dt * 1.15;
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
            pointer.velX = 0;
            pointer.velY = 0;
          } else {
            const omega = 18;
            const dx = pointer.curX - pointer.targetX;
            const dy = pointer.curY - pointer.targetY;
            const decay = Math.exp(-omega * dt);
            const nextCurX =
              pointer.targetX + (dx + (pointer.velX + omega * dx) * dt) * decay;
            const nextCurY =
              pointer.targetY + (dy + (pointer.velY + omega * dy) * dt) * decay;
            pointer.velX = (pointer.velX - omega * (pointer.velX + omega * dx) * dt) * decay;
            pointer.velY = (pointer.velY - omega * (pointer.velY + omega * dy) * dt) * decay;
            pointer.curX = nextCurX;
            pointer.curY = nextCurY;
          }
          const alphaIn = 1 - Math.exp(-11 * dt);
          pointer.strength += (1 - pointer.strength) * alphaIn;
        } else {
          const alphaOut = 1 - Math.exp(-6.5 * dt);
          pointer.strength += (0 - pointer.strength) * alphaOut;
        }

        const trailLambdas = [13, 10, 7.8, 6.0, 4.6];
        for (let i = 0; i < trail.length; i++) {
          const leaderX = i === 0 ? pointer.curX : trail[i - 1].x;
          const leaderY = i === 0 ? pointer.curY : trail[i - 1].y;
          if (trail[i].x < -5000 && pointer.curX > -5000) {
            trail[i].x = leaderX;
            trail[i].y = leaderY;
          } else {
            const f = 1 - Math.exp(-trailLambdas[i] * dt);
            trail[i].x += (leaderX - trail[i].x) * f;
            trail[i].y += (leaderY - trail[i].y) * f;
          }
          const targetStrength = pointer.strength * (0.82 - i * 0.13);
          const sf = 1 - Math.exp(-8.5 * dt);
          trail[i].strength += (targetStrength - trail[i].strength) * sf;
        }

        const effectiveRadius = safeRadius * (safeFontSize / 136);
        const maxInflateR = safeFontSize * 0.215 * safeIntensity;
        const baseDotR = Math.max(3, safeFontSize * 0.036);
        const pullMax = safeFontSize * 0.052 * safeIntensity;

        const riseRate = 1 - Math.exp(-13.5 * dt);
        const fallRate = 1 - Math.exp(-6.2 * dt);
        const pullRate = 1 - Math.exp(-10 * dt);

        let maxInflation = 0;
        let nearestDistSq = Infinity;

        for (let i = 0; i < points.length; i++) {
          const p = points[i];

          let targetInf = 0;
          let targetOx = 0;
          let targetOy = 0;

          if (pointer.strength > 0.004) {
            const dx = pointer.curX - p.x;
            const dy = pointer.curY - p.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < nearestDistSq) nearestDistSq = distSq;

            if (distSq < effectiveRadius * effectiveRadius) {
              const dist = Math.sqrt(distSq);
              const falloff = smoothstep(effectiveRadius, 0, dist);
              targetInf = falloff * pointer.strength;
              if (dist > 0.5) {
                const pull = falloff * pointer.strength * pullMax * 0.42;
                targetOx = (dx / dist) * pull;
                targetOy = (dy / dist) * pull;
              }
            }
          }

          for (let t = 0; t < trail.length; t++) {
            const tn = trail[t];
            if (tn.strength < 0.015) continue;
            const dx = tn.x - p.x;
            const dy = tn.y - p.y;
            const rTrail = effectiveRadius * (0.88 - t * 0.09);
            const distSq = dx * dx + dy * dy;
            if (distSq < rTrail * rTrail) {
              const falloff = smoothstep(rTrail, 0, Math.sqrt(distSq));
              const wakeInf = falloff * tn.strength * 0.85;
              if (wakeInf > targetInf) {
                targetInf = wakeInf;
              }
            }
          }

          const rate = targetInf > p.inflation ? riseRate : fallRate;
          p.inflation += (targetInf - p.inflation) * rate;
          p.ox += (targetOx - p.ox) * pullRate;
          p.oy += (targetOy - p.oy) * pullRate;

          if (p.inflation > maxInflation) {
            maxInflation = p.inflation;
          }
        }

        ctx.clearRect(0, 0, width, height);

        const targetGooOpacity = smoothstep(0.008, 0.16, maxInflation);
        const opacityRate = 1 - Math.exp(-14 * dt);
        gooOpacityRef.current += (targetGooOpacity - gooOpacityRef.current) * opacityRate;
        gooCanvas.style.opacity = gooOpacityRef.current.toFixed(3);

        if (gooOpacityRef.current > 0.005) {
          ctx.drawImage(offscreen, 0, 0);

          for (let i = 0; i < points.length; i++) {
            const p = points[i];
            if (p.inflation < 0.01) continue;
            const r = baseDotR + p.inflation * maxInflateR;
            const px = p.x + p.ox;
            const py = p.y + p.oy;
            ctx.drawImage(sprite, px - r, py - r, r * 2, r * 2);
          }

          const nearestDist = Math.sqrt(nearestDistSq);
          if (pointer.strength > 0.04 && nearestDist < effectiveRadius * 0.6) {
            const bridgeProximity = smoothstep(effectiveRadius * 0.6, 0, nearestDist);
            const bridgeR =
              safeFontSize * 0.145 * safeIntensity * pointer.strength * bridgeProximity;
            if (bridgeR > 2) {
              ctx.drawImage(
                sprite,
                pointer.curX - bridgeR,
                pointer.curY - bridgeR,
                bridgeR * 2,
                bridgeR * 2
              );
            }
          }
        }

        if (
          !pointer.active &&
          !wave.active &&
          pointer.strength < 0.003 &&
          maxInflation < 0.003 &&
          gooOpacityRef.current < 0.005
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

    const blurStdDev = clamp(Number((safeFontSize * 0.038).toFixed(2)), 2.5, 8.5);

    const themeClasses =
      theme === "dark"
        ? "bg-transparent text-white"
        : theme === "light"
          ? "bg-transparent text-[#121212]"
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
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 30 -13"
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

function NuvoraBrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={cn("h-6 w-6 shrink-0", className)}
    >
      <path
        d="M5 20.5V7.5C5 6.67 5.67 6 6.5 6H9.4C10.02 6 10.58 6.38 10.8 6.96L15.85 18.2V7.5C15.85 6.67 16.52 6 17.35 6H21.5C22.33 6 23 6.67 23 7.5V20.5C23 21.33 22.33 22 21.5 22H18.6C17.98 22 17.42 21.62 17.2 21.04L12.15 9.8V20.5C12.15 21.33 11.48 22 10.65 22H6.5C5.67 22 5 21.33 5 20.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SocialGlyph({ icon }: { icon: FooterSocialLink["icon"] }) {
  switch (icon) {
    case "x":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-3.5 w-3.5">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "github":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4">
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-3.5 w-3.5">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-4 w-4">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
  }
}

const LiquidMorphFooter = React.forwardRef<HTMLElement, LiquidMorphFooterProps>(
  (
    {
      brandName = "Nuvora",
      wordmarkText,
      tagline = "Design systems and motion primitives engineered for the modern web.",
      columns = DEFAULT_COLUMNS,
      legalLinks = DEFAULT_LEGAL_LINKS,
      socialLinks = DEFAULT_SOCIAL_LINKS,
      copyrightText,
      showNewsletter = true,
      newsletterHeading = "Release notes & motion dispatches",
      newsletterPlaceholder = "you@company.com",
      onSubscribe,
      onLinkClick,
      fontSize = 184,
      morphRadius = 105,
      morphIntensity = 1.05,
      italicWordmark = true,
      showBackToTop = true,
      theme = "auto",
      className,
      style,
      ...rest
    },
    ref
  ) => {
    const rawId = useId();
    const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
    const emailInputId = `footer-email-${safeId}`;
    const emailErrorId = `footer-email-err-${safeId}`;
    const prefersReducedMotion = useReducedMotion();

    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "error" | "subscribed">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const resolvedWordmark =
      wordmarkText && wordmarkText.trim().length > 0
        ? wordmarkText.trim()
        : brandName.trim().toLowerCase() || "nuvora";

    const resolvedCopyright =
      copyrightText ?? `© ${new Date().getFullYear()} ${brandName} Inc. All rights reserved.`;

    const isDark = theme === "dark";
    const isLight = theme === "light";

    const surfaceClasses = isDark
      ? "bg-[#0a0a0a] text-neutral-100 border-white/[0.08]"
      : isLight
        ? "bg-white text-neutral-950 border-neutral-200/90"
        : "bg-white text-neutral-950 border-neutral-200/90 dark:bg-[#0a0a0a] dark:text-neutral-100 dark:border-white/[0.08]";

    const dividerClasses = isDark
      ? "border-white/[0.08]"
      : isLight
        ? "border-neutral-200/80"
        : "border-neutral-200/80 dark:border-white/[0.08]";

    const mutedTextClasses = isDark
      ? "text-neutral-400"
      : isLight
        ? "text-neutral-600"
        : "text-neutral-600 dark:text-neutral-400";

    const subtleTextClasses = isDark
      ? "text-neutral-500"
      : isLight
        ? "text-neutral-500"
        : "text-neutral-500 dark:text-neutral-500";

    const linkClasses = isDark
      ? "text-neutral-400 hover:text-white"
      : isLight
        ? "text-neutral-600 hover:text-neutral-950"
        : "text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white";

    const headingClasses = isDark
      ? "text-neutral-200"
      : isLight
        ? "text-neutral-900"
        : "text-neutral-900 dark:text-neutral-200";

    const inputWrapperClasses = isDark
      ? "border-white/[0.12] bg-white/[0.03] focus-within:border-white/30"
      : isLight
        ? "border-neutral-200 bg-neutral-50/70 focus-within:border-neutral-400"
        : "border-neutral-200 bg-neutral-50/70 focus-within:border-neutral-400 dark:border-white/[0.12] dark:bg-white/[0.03] dark:focus-within:border-white/30";

    const submitButtonClasses = isDark
      ? "bg-white text-neutral-950 hover:bg-neutral-200"
      : isLight
        ? "bg-neutral-950 text-white hover:bg-neutral-800"
        : "bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200";

    const iconButtonClasses = isDark
      ? "border-white/[0.1] text-neutral-400 hover:border-white/25 hover:text-white hover:bg-white/[0.04]"
      : isLight
        ? "border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-neutral-950 hover:bg-neutral-100/70"
        : "border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-neutral-950 hover:bg-neutral-100/70 dark:border-white/[0.1] dark:text-neutral-400 dark:hover:border-white/25 dark:hover:text-white dark:hover:bg-white/[0.04]";

    const badgeClasses = isDark
      ? "border-white/15 bg-white/[0.06] text-neutral-300"
      : isLight
        ? "border-neutral-200 bg-neutral-100 text-neutral-700"
        : "border-neutral-200 bg-neutral-100 text-neutral-700 dark:border-white/15 dark:bg-white/[0.06] dark:text-neutral-300";

    const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const trimmed = email.trim();
      if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        setStatus("error");
        setErrorMessage("Enter a valid email address.");
        return;
      }

      setErrorMessage("");
      setStatus("subscribed");
      setEmail("");
      try {
        await onSubscribe?.(trimmed);
      } catch {
        setStatus("error");
        setErrorMessage("Unable to subscribe right now. Please try again.");
      }
    };

    const handleScrollTop = () => {
      if (typeof window !== "undefined") {
        window.scrollTo({
          top: 0,
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
      }
    };

    const handleFooterLinkClick = (
      e: React.MouseEvent<HTMLAnchorElement>,
      link: FooterLink
    ) => {
      if (onLinkClick) {
        onLinkClick(link);
      }
      if (link.href.startsWith("#")) {
        e.preventDefault();
      }
    };

    return (
      <footer
        ref={ref}
        aria-label={`${brandName} footer`}
        className={cn(
          "relative w-full overflow-hidden border-t transition-colors duration-200",
          surfaceClasses,
          className
        )}
        style={{
          fontFamily: DEFAULT_FONT_FAMILY,
          ...style,
        }}
        {...rest}
      >
        {/* Crisp 1px specular rim highlight along the top edge */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent",
            isDark
              ? "via-white/25"
              : isLight
                ? "via-neutral-400/50"
                : "via-neutral-400/50 dark:via-white/25"
          )}
        />

        <div className="mx-auto w-full max-w-7xl px-6 sm:px-8 lg:px-10">
          {/* Upper Architectural Grid */}
          <div className="grid grid-cols-1 gap-12 py-14 sm:py-16 lg:grid-cols-12 lg:gap-10">
            {/* Brand + Newsletter Column */}
            <div className="flex flex-col justify-between gap-8 lg:col-span-5">
              <div className="space-y-4">
                <a
                  href="#top"
                  onClick={(e) => {
                    e.preventDefault();
                    handleScrollTop();
                  }}
                  className="inline-flex items-center gap-2.5 rounded-md text-base font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/60"
                >
                  <NuvoraBrandMark />
                  <span>{brandName}</span>
                </a>
                <p
                  className={cn(
                    "max-w-sm text-sm leading-relaxed",
                    mutedTextClasses
                  )}
                >
                  {tagline}
                </p>
              </div>

              {showNewsletter && (
                <div className="max-w-sm space-y-2.5">
                  <label
                    htmlFor={emailInputId}
                    className={cn(
                      "block text-xs font-medium tracking-wide",
                      headingClasses
                    )}
                  >
                    {newsletterHeading}
                  </label>
                  <form
                    onSubmit={handleSubscribe}
                    noValidate
                    className={cn(
                      "flex items-center rounded-full border p-1 transition-colors duration-200",
                      inputWrapperClasses
                    )}
                  >
                    <input
                      id={emailInputId}
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (status !== "idle") {
                          setStatus("idle");
                          setErrorMessage("");
                        }
                      }}
                      placeholder={newsletterPlaceholder}
                      aria-invalid={status === "error"}
                      aria-describedby={
                        status === "error" ? emailErrorId : undefined
                      }
                      className="w-full min-w-0 bg-transparent px-3.5 py-2 text-sm outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                    />
                    <button
                      type="submit"
                      aria-label={
                        status === "subscribed" ? "Subscribed" : "Subscribe"
                      }
                      className={cn(
                        "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/70",
                        submitButtonClasses
                      )}
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {status === "subscribed" ? (
                          <motion.span
                            key="done"
                            initial={
                              prefersReducedMotion ? false : { opacity: 0, y: 4 }
                            }
                            animate={{ opacity: 1, y: 0 }}
                            exit={
                              prefersReducedMotion ? undefined : { opacity: 0, y: -4 }
                            }
                            transition={{ duration: 0.18 }}
                            className="inline-flex items-center gap-1"
                          >
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Joined</span>
                          </motion.span>
                        ) : (
                          <motion.span
                            key="idle"
                            initial={
                              prefersReducedMotion ? false : { opacity: 0, y: 4 }
                            }
                            animate={{ opacity: 1, y: 0 }}
                            exit={
                              prefersReducedMotion ? undefined : { opacity: 0, y: -4 }
                            }
                            transition={{ duration: 0.18 }}
                            className="inline-flex items-center gap-1"
                          >
                            <span>Subscribe</span>
                            <ArrowRight
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  </form>

                  <div className="min-h-[18px]" aria-live="polite">
                    {status === "error" && (
                      <p
                        id={emailErrorId}
                        className="text-xs text-red-500 dark:text-red-400"
                      >
                        {errorMessage}
                      </p>
                    )}
                    {status === "subscribed" && (
                      <p className={cn("text-xs", mutedTextClasses)}>
                        You&apos;re on the list for quarterly releases.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Structured Navigation Columns */}
            <nav
              aria-label="Footer navigation"
              className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7 lg:pl-8"
            >
              {columns.map((col) => (
                <div key={col.title} className="space-y-4">
                  <h2
                    className={cn(
                      "text-xs font-semibold uppercase tracking-[0.14em]",
                      headingClasses
                    )}
                  >
                    {col.title}
                  </h2>
                  <ul className="space-y-2.5">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          target={link.external ? "_blank" : undefined}
                          rel={link.external ? "noreferrer noopener" : undefined}
                          onClick={(e) => handleFooterLinkClick(e, link)}
                          className={cn(
                            "group inline-flex items-center gap-1.5 rounded-sm text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/60",
                            linkClasses
                          )}
                        >
                          <span>{link.label}</span>
                          {link.badge && (
                            <span
                              className={cn(
                                "rounded-full border px-1.5 py-0.5 text-[10px] font-medium leading-none tracking-tight",
                                badgeClasses
                              )}
                            >
                              {link.badge}
                            </span>
                          )}
                          <ArrowUpRight
                            aria-hidden="true"
                            className="h-3 w-3 -translate-x-0.5 translate-y-0.5 opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-70"
                          />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          {/* Monumental Interactive Liquid Morph Wordmark Stage */}
          <div
            className={cn(
              "relative flex flex-col items-center justify-center border-t py-6 sm:py-10",
              dividerClasses
            )}
          >
            <p
              className={cn(
                "mb-1 select-none text-[10px] font-medium uppercase tracking-[0.22em]",
                subtleTextClasses
              )}
            >
              Hover or press enter to morph
            </p>
            <div className="flex w-full items-center justify-center overflow-hidden">
              <LiquidMorphText
                text={resolvedWordmark}
                fontSize={fontSize}
                radius={morphRadius}
                intensity={morphIntensity}
                italic={italicWordmark}
                theme={theme}
                className="w-full"
              />
            </div>
          </div>

          {/* Bottom Utility Bar */}
          <div
            className={cn(
              "flex flex-col items-start justify-between gap-4 border-t py-6 sm:flex-row sm:items-center",
              dividerClasses
            )}
          >
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
              <span className={cn("tabular-nums", subtleTextClasses)}>
                {resolvedCopyright}
              </span>
              <div className="flex items-center gap-4">
                {legalLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={(e) => handleFooterLinkClick(e, link)}
                    className={cn(
                      "rounded-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/60",
                      linkClasses
                    )}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  onClick={(e) => {
                    if (social.href.startsWith("#")) e.preventDefault();
                  }}
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/60",
                    iconButtonClasses
                  )}
                >
                  <SocialGlyph icon={social.icon} />
                </a>
              ))}

              {showBackToTop && (
                <button
                  type="button"
                  onClick={handleScrollTop}
                  aria-label="Back to top"
                  className={cn(
                    "group ml-1 inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/60",
                    iconButtonClasses
                  )}
                >
                  <span>Top</span>
                  <ArrowUp
                    aria-hidden="true"
                    className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5"
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>
    );
  }
);

LiquidMorphFooter.displayName = "LiquidMorphFooter";

export {
  LiquidMorphFooter,
  LiquidMorphText,
  LiquidMorphFooter as component,
  LiquidMorphFooter as Component,
};
export default LiquidMorphFooter;