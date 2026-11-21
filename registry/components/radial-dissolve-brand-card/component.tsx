"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Home, Lock, RotateCw } from "lucide-react";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export type DissolveMode = "smooth" | "halftone" | "ascii";

export interface RadialDissolveBrandCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Brand display name shown in the hero header and browser tab */
  brandName?: string;
  /** Primary brand accent color (hex) */
  accentColor?: string;
  /** Four-line poetic caption displayed at the bottom-left of the hero card */
  poemLines?: string[];
  /** Automatically cycle through Smooth, Halftone, and ASCII dissolve modes */
  autoCycle?: boolean;
  /** Full 3-phase cycle duration in milliseconds */
  cycleDuration?: number;
  /** Initial visual shader mode */
  initialMode?: DissolveMode;
  /** Show the companion isometric mobile icon and browser favicon preview cards */
  showMockups?: boolean;
  /** Optional callback fired whenever the active dissolve mode changes */
  onModeChange?: (mode: DissolveMode) => void;
}

const DEFAULT_POEM_LINES = [
  "When form dissolves, the center hears,",
  "A silent pulse behind the years.",
  "Each shape begins, yet leaves no trace –",
  "Just rhythm folding into space.",
];

const MODE_ORDER: DissolveMode[] = ["smooth", "halftone", "ascii"];

const SPOKE_COUNT = 8;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function drawSpokeField(
  ctx: CanvasRenderingContext2D,
  size: number,
  phase: number,
  softness: number
) {
  ctx.clearRect(0, 0, size, size);

  const cx = size * 0.585;
  const cy = size * 0.5;
  const innerR = size * 0.145;
  const spokeWidth = size * 0.094;
  const halfW = spokeWidth * 0.5;

  for (let i = 0; i < SPOKE_COUNT; i++) {
    const theta = (i * Math.PI * 2) / SPOKE_COUNT + phase;
    const norm = (1 - Math.cos(theta)) * 0.5;
    const lengthFactor = Math.pow(norm, 0.88);
    const outerR = size * (0.215 + 0.255 * lengthFactor);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(theta);

    if (outerR - innerR < spokeWidth * 0.95) {
      // Short focal dot near 3 o'clock
      const dotX = outerR - halfW * 0.35;
      const dotR = halfW * (0.94 + 0.06 * softness);
      const radGrad = ctx.createRadialGradient(
        dotX,
        0,
        dotR * 0.65,
        dotX,
        0,
        dotR * (1.06 + 0.1 * softness)
      );
      radGrad.addColorStop(0, "rgba(255,255,255,1)");
      radGrad.addColorStop(0.82, "rgba(255,255,255,0.96)");
      radGrad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(dotX, 0, dotR * (1.06 + 0.1 * softness), 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Tapered glowing radial capsule fading smoothly inward
      const startX = innerR * 0.72;
      const tipX = outerR;
      const grad = ctx.createLinearGradient(startX, 0, tipX, 0);
      grad.addColorStop(0, "rgba(255,255,255,0)");
      grad.addColorStop(0.24, "rgba(255,255,255,0.16)");
      grad.addColorStop(0.55, "rgba(255,255,255,0.68)");
      grad.addColorStop(0.8, "rgba(255,255,255,0.98)");
      grad.addColorStop(1, "rgba(255,255,255,1)");

      ctx.strokeStyle = grad;
      ctx.lineWidth = spokeWidth;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(startX + halfW, 0);
      ctx.lineTo(tipX - halfW, 0);
      ctx.stroke();

      // Crisp rounded outer highlight cap
      ctx.fillStyle = "rgba(255,255,255,0.98)";
      ctx.beginPath();
      ctx.arc(tipX - halfW, 0, halfW * 0.92, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

function renderHalftoneMode(
  ctx: CanvasRenderingContext2D,
  size: number,
  sampleData: Uint8ClampedArray,
  sampleSize: number
) {
  const cols = 38;
  const rows = 38;
  const cellW = size / cols;
  const cellH = size / rows;

  ctx.fillStyle = "#FFFFFF";

  for (let r = 0; r < rows; r++) {
    const sy = Math.min(
      sampleSize - 1,
      Math.floor(((r + 0.5) / rows) * sampleSize)
    );
    const cy = (r + 0.5) * cellH;

    for (let c = 0; c < cols; c++) {
      const sx = Math.min(
        sampleSize - 1,
        Math.floor(((c + 0.5) / cols) * sampleSize)
      );
      const alpha = sampleData[(sy * sampleSize + sx) * 4 + 3] / 255;

      if (alpha > 0.085) {
        const cx = (c + 0.5) * cellW;
        const barW = cellW * 0.85;
        const barH = Math.max(1.15, cellH * 0.85 * Math.pow(alpha, 0.88));
        ctx.fillRect(cx - barW * 0.5, cy - barH * 0.5, barW, barH);
      }
    }
  }
}

function renderAsciiMode(
  ctx: CanvasRenderingContext2D,
  size: number,
  sampleData: Uint8ClampedArray,
  sampleSize: number
) {
  const cols = 36;
  const rows = 36;
  const cellW = size / cols;
  const cellH = size / rows;
  const fontSize = Math.max(6, Math.round(cellH * 0.96));

  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let r = 0; r < rows; r++) {
    const sy = Math.min(
      sampleSize - 1,
      Math.floor(((r + 0.5) / rows) * sampleSize)
    );
    const cy = (r + 0.5) * cellH;

    for (let c = 0; c < cols; c++) {
      const sx = Math.min(
        sampleSize - 1,
        Math.floor(((c + 0.5) / cols) * sampleSize)
      );
      const alpha = sampleData[(sy * sampleSize + sx) * 4 + 3] / 255;

      let glyph = "";
      if (alpha > 0.76) {
        glyph = "0";
      } else if (alpha > 0.57) {
        glyph = "1";
      } else if (alpha > 0.4) {
        glyph = "/";
      } else if (alpha > 0.24) {
        glyph = ">";
      } else if (alpha > 0.1) {
        glyph = ".";
      }

      if (glyph) {
        const cx = (c + 0.5) * cellW;
        ctx.fillText(glyph, cx, cy);
      }
    }
  }
}

function renderModeToContext(
  ctx: CanvasRenderingContext2D,
  mode: DissolveMode,
  size: number,
  phase: number,
  sampleData: Uint8ClampedArray,
  sampleSize: number
) {
  if (mode === "smooth") {
    drawSpokeField(ctx, size, phase, 1);
  } else if (mode === "halftone") {
    renderHalftoneMode(ctx, size, sampleData, sampleSize);
  } else {
    renderAsciiMode(ctx, size, sampleData, sampleSize);
  }
}

interface MiniRadialMarkProps {
  className?: string;
  idPrefix: string;
}

function MiniRadialMark({ className, idPrefix }: MiniRadialMarkProps) {
  const cx = 56;
  const cy = 50;
  const innerR = 16;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        {Array.from({ length: SPOKE_COUNT }).map((_, i) => {
          const theta = (i * Math.PI * 2) / SPOKE_COUNT;
          const norm = (1 - Math.cos(theta)) * 0.5;
          const outerR = 23 + 23 * Math.pow(norm, 0.85);
          const x1 = cx + Math.cos(theta) * (innerR * 0.75);
          const y1 = cy + Math.sin(theta) * (innerR * 0.75);
          const x2 = cx + Math.cos(theta) * outerR;
          const y2 = cy + Math.sin(theta) * outerR;
          return (
            <linearGradient
              key={i}
              id={`${idPrefix}-sg-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.08" />
              <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.78" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
            </linearGradient>
          );
        })}
      </defs>
      {Array.from({ length: SPOKE_COUNT }).map((_, i) => {
        const theta = (i * Math.PI * 2) / SPOKE_COUNT;
        const norm = (1 - Math.cos(theta)) * 0.5;
        const outerR = 23 + 23 * Math.pow(norm, 0.85);

        if (outerR - innerR < 9) {
          return (
            <circle
              key={i}
              cx={cx + Math.cos(theta) * outerR}
              cy={cy + Math.sin(theta) * outerR}
              r={5.2}
              fill="#FFFFFF"
            />
          );
        }

        const x1 = cx + Math.cos(theta) * innerR;
        const y1 = cy + Math.sin(theta) * innerR;
        const x2 = cx + Math.cos(theta) * outerR;
        const y2 = cy + Math.sin(theta) * outerR;

        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={`url(#${idPrefix}-sg-${i})`}
            strokeWidth={9.5}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

interface RadialDissolveCanvasProps {
  accentColor: string;
  autoCycle: boolean;
  cycleDuration: number;
  activeMode: DissolveMode;
  manualWipeTrigger: number;
  prevManualMode: DissolveMode;
  reducedMotion: boolean;
  onAutoModeSync: (mode: DissolveMode) => void;
}

function RadialDissolveCanvas({
  accentColor,
  autoCycle,
  cycleDuration,
  activeMode,
  manualWipeTrigger,
  prevManualMode,
  reducedMotion,
  onAutoModeSync,
}: RadialDissolveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const manualStartRef = useRef<number>(0);
  const lastReportedModeRef = useRef<DissolveMode>(activeMode);

  useEffect(() => {
    if (manualWipeTrigger > 0) {
      manualStartRef.current = performance.now();
    }
  }, [manualWipeTrigger]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sampleSize = 144;
    if (!offscreenRef.current) {
      const off = document.createElement("canvas");
      off.width = sampleSize;
      off.height = sampleSize;
      offscreenRef.current = off;
    }
    const offCtx = offscreenRef.current.getContext("2d", {
      willReadFrequently: true,
    });
    if (!offCtx) return;

    const logicalSize = 320;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = logicalSize * dpr;
    canvas.height = logicalSize * dpr;

    let rafId = 0;
    const startTime = performance.now();
    const safeDuration = Math.max(2400, cycleDuration);

    const drawFrame = (now: number) => {
      const elapsed = now - startTime;
      const phase = reducedMotion ? 0 : (elapsed / safeDuration) * Math.PI * 0.5;

      // Render offscreen luminance field for halftone & ASCII sampling
      drawSpokeField(offCtx, sampleSize, phase, 0.25);
      const sampleData = offCtx.getImageData(0, 0, sampleSize, sampleSize).data;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.fillStyle = accentColor;
      ctx.fillRect(0, 0, logicalSize, logicalSize);

      let baseMode: DissolveMode = activeMode;
      let nextMode: DissolveMode = activeMode;
      let wipeT = 0;

      if (autoCycle && !reducedMotion) {
        const cyclePos = (elapsed % safeDuration) / safeDuration;
        if (cyclePos < 0.16) {
          baseMode = "smooth";
          nextMode = "smooth";
          wipeT = 0;
        } else if (cyclePos < 0.36) {
          baseMode = "smooth";
          nextMode = "halftone";
          wipeT = easeInOutCubic((cyclePos - 0.16) / 0.2);
        } else if (cyclePos < 0.52) {
          baseMode = "halftone";
          nextMode = "halftone";
          wipeT = 0;
        } else if (cyclePos < 0.72) {
          baseMode = "halftone";
          nextMode = "ascii";
          wipeT = easeInOutCubic((cyclePos - 0.52) / 0.2);
        } else if (cyclePos < 0.86) {
          baseMode = "ascii";
          nextMode = "ascii";
          wipeT = 0;
        } else {
          baseMode = "ascii";
          nextMode = "smooth";
          wipeT = easeInOutCubic((cyclePos - 0.86) / 0.14);
        }

        const effectiveMode = wipeT > 0.5 ? nextMode : baseMode;
        if (lastReportedModeRef.current !== effectiveMode) {
          lastReportedModeRef.current = effectiveMode;
          onAutoModeSync(effectiveMode);
        }
      } else if (manualWipeTrigger > 0 && !reducedMotion) {
        const manualElapsed = now - manualStartRef.current;
        const manualDuration = 720;
        if (manualElapsed < manualDuration) {
          baseMode = prevManualMode;
          nextMode = activeMode;
          wipeT = easeInOutCubic(Math.min(1, manualElapsed / manualDuration));
        }
      }

      renderModeToContext(
        ctx,
        baseMode,
        logicalSize,
        phase,
        sampleData,
        sampleSize
      );

      if (wipeT > 0.001 && baseMode !== nextMode) {
        const cx = logicalSize * 0.585;
        const cy = logicalSize * 0.5;
        const maxRadius = logicalSize * 0.72;
        const currentRadius = wipeT * maxRadius;

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, currentRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = accentColor;
        ctx.fillRect(0, 0, logicalSize, logicalSize);
        renderModeToContext(
          ctx,
          nextMode,
          logicalSize,
          phase,
          sampleData,
          sampleSize
        );
        ctx.restore();
      }

      ctx.restore();

      if (!reducedMotion) {
        rafId = window.requestAnimationFrame(drawFrame);
      }
    };

    rafId = window.requestAnimationFrame(drawFrame);

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [
    accentColor,
    autoCycle,
    cycleDuration,
    activeMode,
    manualWipeTrigger,
    prevManualMode,
    reducedMotion,
    onAutoModeSync,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full select-none object-contain"
      aria-hidden="true"
    />
  );
}

export const RadialDissolveBrandCard = React.forwardRef<
  HTMLDivElement,
  RadialDissolveBrandCardProps
>(function RadialDissolveBrandCard(
  {
    brandName = "ANOTHER AI THING",
    accentColor = "#ED370A",
    poemLines = DEFAULT_POEM_LINES,
    autoCycle = true,
    cycleDuration = 5800,
    initialMode = "smooth",
    showMockups = true,
    onModeChange,
    className,
    ...rest
  },
  ref
) {
  const rawId = useId();
  const uid = rawId.replace(/:/g, "");
  const prefersReducedMotion = Boolean(useReducedMotion());

  const [manualAutoCycle, setManualAutoCycle] = useState<boolean>(autoCycle);
  const [activeMode, setActiveMode] = useState<DissolveMode>(initialMode);
  const [prevManualMode, setPrevManualMode] = useState<DissolveMode>(initialMode);
  const [manualWipeTrigger, setManualWipeTrigger] = useState<number>(0);

  useEffect(() => {
    setManualAutoCycle(autoCycle);
  }, [autoCycle]);

  const handleAutoModeSync = useCallback(
    (mode: DissolveMode) => {
      setActiveMode(mode);
      onModeChange?.(mode);
    },
    [onModeChange]
  );

  const handleCycleModeClick = useCallback(() => {
    const currentIndex = MODE_ORDER.indexOf(activeMode);
    const next = MODE_ORDER[(currentIndex + 1) % MODE_ORDER.length];
    setManualAutoCycle(false);
    setPrevManualMode(activeMode);
    setActiveMode(next);
    setManualWipeTrigger((n) => n + 1);
    onModeChange?.(next);
  }, [activeMode, onModeChange]);

  const handleHeroKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleCycleModeClick();
      }
    },
    [handleCycleModeClick]
  );

  const domainSlug = useMemo(() => {
    const cleaned = brandName.toLowerCase().replace(/[^a-z0-9]/g, "");
    return cleaned || "anotheraithing";
  }, [brandName]);

  const safePoem = poemLines.length > 0 ? poemLines : DEFAULT_POEM_LINES;

  return (
    <div
      ref={ref}
      className={cn(
        "w-full select-none",
        showMockups ? "max-w-[720px]" : "max-w-[352px]",
        className
      )}
      {...rest}
    >
      <div
        className={cn(
          "grid gap-5",
          showMockups
            ? "grid-cols-1 md:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]"
            : "grid-cols-1"
        )}
      >
        {/* Left Hero Brand Card */}
        <motion.button
          type="button"
          onClick={handleCycleModeClick}
          onKeyDown={handleHeroKeyDown}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.992 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          aria-label={`${brandName} interactive radial dissolve card. Current visual mode: ${activeMode}. Activate to cycle dissolve style.`}
          style={{ backgroundColor: accentColor }}
          className={cn(
            "group relative flex min-h-[470px] w-full flex-col justify-between overflow-hidden rounded-[28px] p-6 text-left text-white",
            "cursor-pointer outline-none transition-shadow duration-200",
            "focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 dark:focus-visible:ring-white dark:focus-visible:ring-offset-neutral-950"
          )}
        >
          {/* Subtle Tactile Print Grain Overlay */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.055] mix-blend-overlay"
            aria-hidden="true"
          >
            <filter id={`${uid}-grain`}>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.82"
                numOctaves="3"
                stitchTiles="stitch"
              />
            </filter>
            <rect width="100%" height="100%" filter={`url(#${uid}-grain)`} />
          </svg>

          {/* Header */}
          <div className="relative z-10 flex items-center gap-2.5">
            <MiniRadialMark
              idPrefix={`${uid}-hdr`}
              className="h-[22px] w-[22px] shrink-0"
            />
            <span className="font-mono text-[13px] font-medium uppercase tracking-[0.06em] text-white/95">
              {brandName}
            </span>
          </div>

          {/* Center Morphing Radial Emblem */}
          <div className="relative z-10 my-auto flex aspect-square w-full items-center justify-center py-2">
            <RadialDissolveCanvas
              accentColor={accentColor}
              autoCycle={manualAutoCycle}
              cycleDuration={cycleDuration}
              activeMode={activeMode}
              manualWipeTrigger={manualWipeTrigger}
              prevManualMode={prevManualMode}
              reducedMotion={prefersReducedMotion}
              onAutoModeSync={handleAutoModeSync}
            />
          </div>

          {/* Bottom-Left Poetic Copy */}
          <div className="relative z-10 space-y-0.5 font-mono text-[9.5px] leading-[1.68] tracking-[0.01em] text-white/85">
            {safePoem.map((line, index) => (
              <p key={index} className="m-0">
                {line}
              </p>
            ))}
          </div>
        </motion.button>

        {/* Right Companion Mockups */}
        {showMockups && (
          <div className="flex flex-col gap-5">
            {/* Top-Right Isometric Phone App Icon Card */}
            <div className="relative flex-1 min-h-[296px] overflow-hidden rounded-[28px] bg-[#F2F2F2] dark:bg-neutral-900">
              <svg
                viewBox="0 0 360 326"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-full w-full"
                role="img"
                aria-label={`${brandName} mobile app icon preview`}
              >
                {/* Isometric Smartphone Body & Side Depth */}
                <path
                  d="M274 -18 L48 112 C24 126 24 152 48 166 L262 290 L372 226 L372 -18 Z"
                  className="fill-white dark:fill-neutral-950"
                />
                {/* Bottom chamfered rim extrusion */}
                <path
                  d="M30 140 L30 164 C30 175 37 185 50 193 L252 310 L252 284 L50 167 C37 159 30 150 30 140 Z"
                  className="fill-[#FAFAFA] stroke-[#8B8B8B] dark:fill-neutral-900 dark:stroke-neutral-600"
                  strokeWidth="1.25"
                  strokeLinejoin="round"
                />
                {/* Outer top bezel contour */}
                <path
                  d="M286 -20 L52 115 C26 130 26 154 52 169 L258 288"
                  className="stroke-[#7D7D7D] dark:stroke-neutral-500"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
                {/* Inner bezel frame */}
                <path
                  d="M298 -10 L62 126 C40 139 40 156 62 169 L272 290"
                  className="stroke-[#A1A1A1] dark:stroke-neutral-700"
                  strokeWidth="1.15"
                  strokeLinecap="round"
                />
                {/* Screen inner boundary with top notch indentation */}
                <path
                  d="M324 -12 L286 10 L226 45 C216 51 202 52 192 46 L178 38 L76 97 C54 110 54 134 76 147 L286 268"
                  className="stroke-[#969696] dark:stroke-neutral-600"
                  strokeWidth="1.15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Earpiece pill & front sensor */}
                <path
                  d="M214 29 L268 -2 C271 -4 274 -1 271 2 L217 33 C214 35 211 31 214 29 Z"
                  className="stroke-[#969696] dark:stroke-neutral-600"
                  strokeWidth="1.15"
                />
                <ellipse
                  cx="288"
                  cy="-6"
                  rx="7.5"
                  ry="4.5"
                  className="stroke-[#969696] dark:stroke-neutral-600"
                  strokeWidth="1.15"
                />

                {/* Side Hardware Buttons (Mute + Volume Up + Volume Down) */}
                <path
                  d="M72 197 L96 211 C100 213 101 218 98 221 C95 224 91 223 87 221 L63 207 C59 205 58 200 61 197 C64 194 68 195 72 197 Z"
                  className="fill-white stroke-[#8B8B8B] dark:fill-neutral-900 dark:stroke-neutral-500"
                  strokeWidth="1.2"
                />
                <path
                  d="M124 227 L174 256 C178 258 179 264 176 268 C173 271 168 271 164 268 L114 239 C110 237 109 231 112 227 C115 224 120 224 124 227 Z"
                  className="fill-white stroke-[#8B8B8B] dark:fill-neutral-900 dark:stroke-neutral-500"
                  strokeWidth="1.2"
                />
                <path
                  d="M196 269 L246 298 C250 300 251 306 248 310 C245 313 240 313 236 310 L186 281 C182 279 181 273 184 269 C187 266 192 266 196 269 Z"
                  className="fill-white stroke-[#8B8B8B] dark:fill-neutral-900 dark:stroke-neutral-500"
                  strokeWidth="1.2"
                />

                {/* Isometric App Grid Plane */}
                <g transform="translate(174, 164) matrix(0.866, 0.5, -0.866, 0.5, 0, 0)">
                  {/* Active Brand App Icon */}
                  <g transform="translate(-44, -44)">
                    <rect
                      x="0"
                      y="0"
                      width="68"
                      height="68"
                      rx="16"
                      fill={accentColor}
                    />
                    <g transform="translate(8, 8)">
                      <MiniRadialMark
                        idPrefix={`${uid}-iso`}
                        className="h-[52px] w-[52px]"
                      />
                    </g>
                  </g>

                  {/* Neighboring Wireframe App Icons */}
                  <rect
                    x="-44"
                    y="-132"
                    width="68"
                    height="68"
                    rx="16"
                    className="stroke-[#AEAEAE] dark:stroke-neutral-700"
                    strokeWidth="1.35"
                  />
                  <rect
                    x="44"
                    y="-44"
                    width="68"
                    height="68"
                    rx="16"
                    className="stroke-[#AEAEAE] dark:stroke-neutral-700"
                    strokeWidth="1.35"
                  />
                  <rect
                    x="44"
                    y="-132"
                    width="68"
                    height="68"
                    rx="16"
                    className="stroke-[#AEAEAE] dark:stroke-neutral-700"
                    strokeWidth="1.35"
                  />
                  <rect
                    x="132"
                    y="-44"
                    width="68"
                    height="68"
                    rx="16"
                    className="stroke-[#AEAEAE] dark:stroke-neutral-700"
                    strokeWidth="1.35"
                  />
                  <rect
                    x="-44"
                    y="44"
                    width="68"
                    height="68"
                    rx="16"
                    className="stroke-[#AEAEAE] dark:stroke-neutral-700"
                    strokeWidth="1.35"
                  />
                  <rect
                    x="44"
                    y="44"
                    width="68"
                    height="68"
                    rx="16"
                    className="stroke-[#AEAEAE] dark:stroke-neutral-700"
                    strokeWidth="1.35"
                  />
                </g>
              </svg>
            </div>

            {/* Bottom-Right Browser Tab & Favicon Card */}
            <div className="relative h-[154px] overflow-hidden rounded-[28px] bg-[#F2F2F2] pl-6 pt-6 dark:bg-neutral-900">
              <div className="flex h-full w-full flex-col overflow-hidden rounded-tl-[16px] border-l border-t border-[#9B9B9B] bg-white dark:border-neutral-700 dark:bg-neutral-950">
                {/* Browser Top Tab Strip */}
                <div className="flex h-[52px] items-end border-b border-[#B5B5B5] bg-[#FAFAFA] dark:border-neutral-800 dark:bg-neutral-900/70">
                  {/* Window Traffic Dots */}
                  <div className="flex h-full items-center gap-2.5 px-5">
                    <span className="h-3 w-3 rounded-full bg-[#CFCFCF] dark:bg-neutral-700" />
                    <span className="h-3 w-3 rounded-full bg-[#CFCFCF] dark:bg-neutral-700" />
                    <span className="h-3 w-3 rounded-full bg-[#CFCFCF] dark:bg-neutral-700" />
                  </div>

                  {/* Active Browser Tab */}
                  <div className="relative -mb-px flex h-[44px] flex-1 items-center gap-2.5 rounded-tl-[12px] border-l border-t border-[#B5B5B5] bg-white pl-3.5 pr-2 dark:border-neutral-700 dark:bg-neutral-950">
                    <span
                      style={{ backgroundColor: accentColor }}
                      className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[7px]"
                    >
                      <MiniRadialMark
                        idPrefix={`${uid}-fav`}
                        className="h-[21px] w-[21px]"
                      />
                    </span>
                    <span className="truncate font-sans text-[17px] font-medium tracking-[-0.02em] text-neutral-900 dark:text-neutral-100">
                      {domainSlug}
                    </span>
                  </div>
                </div>

                {/* Browser Navigation & Address Bar */}
                <div className="flex flex-1 items-center gap-5 bg-white pl-5 pr-0 dark:bg-neutral-950">
                  <div className="flex items-center gap-4 text-[#9E9E9E] dark:text-neutral-500">
                    <ArrowLeft className="h-[20px] w-[20px]" strokeWidth={1.8} />
                    <ArrowRight className="h-[20px] w-[20px]" strokeWidth={1.8} />
                    <RotateCw className="h-[19px] w-[19px]" strokeWidth={1.8} />
                    <Home className="h-[20px] w-[20px]" strokeWidth={1.75} />
                  </div>

                  {/* Cropped Address Pill */}
                  <div className="ml-1 flex h-[44px] flex-1 items-center gap-2.5 rounded-l-full border-y border-l border-[#9B9B9B] pl-4 pr-2 dark:border-neutral-700">
                    <Lock
                      className="h-[15px] w-[15px] shrink-0 text-[#9E9E9E] dark:text-neutral-500"
                      strokeWidth={2}
                    />
                    <span className="truncate font-sans text-[16px] text-neutral-900 dark:text-neutral-200">
                      {domainSlug.slice(0, 2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

RadialDissolveBrandCard.displayName = "RadialDissolveBrandCard";

export {
  RadialDissolveBrandCard as component,
  RadialDissolveBrandCard as Component,
};
export default RadialDissolveBrandCard;