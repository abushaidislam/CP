"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Home, RotateCw } from "lucide-react";

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
  /** Full 3-phase cycle duration in milliseconds (reference: 5800ms) */
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

function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

/**
 * Draws the 8-spoke asymmetric radial luminance field.
 * Spokes orbit continuously around (cx, cy) while their outer reach is modulated
 * by angular proximity to 9 o'clock (longest comet ray) vs 3 o'clock (compact dot).
 */
function drawSpokeField(
  ctx: CanvasRenderingContext2D,
  size: number,
  phase: number,
  blurPx: number
) {
  ctx.clearRect(0, 0, size, size);

  const cx = size * 0.615;
  const cy = size * 0.5;
  const innerR = size * 0.145;
  const spokeWidth = size * 0.118;
  const halfW = spokeWidth * 0.5;

  ctx.save();
  if (blurPx > 0) {
    ctx.filter = `blur(${blurPx}px)`;
  }

  for (let i = 0; i < SPOKE_COUNT; i++) {
    const theta = (i * Math.PI * 2) / SPOKE_COUNT + phase;
    const norm = (1 - Math.cos(theta)) * 0.5;
    const lengthFactor = Math.pow(norm, 0.82);
    const outerR = size * (0.215 + 0.305 * lengthFactor);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(theta);

    if (outerR - innerR < spokeWidth * 0.72) {
      // Compact luminous dot near 3 o'clock
      const dotX = outerR - halfW * 0.22;
      const dotR = halfW * 0.96;
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(dotX, 0, dotR, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Rounded-tip comet ray fading smoothly into the hollow core
      const startX = innerR * 0.55;
      const tipX = outerR;
      const grad = ctx.createLinearGradient(startX, 0, tipX, 0);
      grad.addColorStop(0, "rgba(255,255,255,0)");
      grad.addColorStop(0.26, "rgba(255,255,255,0.14)");
      grad.addColorStop(0.56, "rgba(255,255,255,0.68)");
      grad.addColorStop(0.78, "rgba(255,255,255,0.98)");
      grad.addColorStop(1, "rgba(255,255,255,1)");

      ctx.strokeStyle = grad;
      ctx.lineWidth = spokeWidth;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(startX + halfW, 0);
      ctx.lineTo(tipX - halfW, 0);
      ctx.stroke();

      // Reinforce crisp opaque outer cap
      ctx.fillStyle = "rgba(255,255,255,0.96)";
      ctx.beginPath();
      ctx.arc(tipX - halfW, 0, halfW * 0.92, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  ctx.restore();
}

function renderHalftoneMode(
  ctx: CanvasRenderingContext2D,
  size: number,
  sampleData: Uint8ClampedArray,
  sampleSize: number
) {
  const cols = 40;
  const rows = 40;
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

      if (alpha > 0.08) {
        const cx = (c + 0.5) * cellW;
        const barW = cellW * 0.84;
        const barH = Math.max(1.1, cellH * 0.84 * Math.pow(alpha, 0.86));
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
  const cols = 38;
  const rows = 38;
  const cellW = size / cols;
  const cellH = size / rows;
  const fontSize = Math.max(6, Math.round(cellH * 0.98));

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
      if (alpha > 0.74) {
        glyph = "0";
      } else if (alpha > 0.56) {
        glyph = "1";
      } else if (alpha > 0.39) {
        glyph = "/";
      } else if (alpha > 0.23) {
        glyph = ">";
      } else if (alpha > 0.095) {
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
    // Subtle luminous feathering matches the soft airbrushed smooth phase in the reference
    drawSpokeField(ctx, size, phase, 2.4);
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
  const cx = 60;
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
          const outerR = 23 + 27 * Math.pow(norm, 0.84);
          const x1 = cx + Math.cos(theta) * (innerR * 0.7);
          const y1 = cy + Math.sin(theta) * (innerR * 0.7);
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
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.06" />
              <stop offset="56%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
            </linearGradient>
          );
        })}
      </defs>
      {Array.from({ length: SPOKE_COUNT }).map((_, i) => {
        const theta = (i * Math.PI * 2) / SPOKE_COUNT;
        const norm = (1 - Math.cos(theta)) * 0.5;
        const outerR = 23 + 27 * Math.pow(norm, 0.84);

        if (outerR - innerR < 8.5) {
          return (
            <circle
              key={i}
              cx={cx + Math.cos(theta) * outerR}
              cy={cy + Math.sin(theta) * outerR}
              r={5.4}
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
            strokeWidth={10.2}
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
  const startTimeRef = useRef<number | null>(null);
  const manualStartRef = useRef<number>(0);
  const activeModeRef = useRef<DissolveMode>(activeMode);
  activeModeRef.current = activeMode;
  const onAutoModeSyncRef = useRef(onAutoModeSync);
  onAutoModeSyncRef.current = onAutoModeSync;
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

    const sampleSize = 152;
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
    if (startTimeRef.current === null) {
      startTimeRef.current = performance.now();
    }
    const startTime = startTimeRef.current;
    const safeDuration = Math.max(2400, cycleDuration);

    // 9 spoke steps per cycle (9 * 45deg = 405deg) -> 0.644s per spoke step, seamless 8-fold loop
    const totalCyclePhase = (9 * Math.PI * 2) / SPOKE_COUNT;

    const drawFrame = (now: number) => {
      const elapsed = now - startTime;
      const phase = reducedMotion
        ? 0
        : (elapsed / safeDuration) * totalCyclePhase;

      // Render crisp offscreen luminance field for halftone & ASCII quantizers
      drawSpokeField(offCtx, sampleSize, phase, 0.8);
      const sampleData = offCtx.getImageData(0, 0, sampleSize, sampleSize).data;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.fillStyle = accentColor;
      ctx.fillRect(0, 0, logicalSize, logicalSize);

      const currentActiveMode = activeModeRef.current;
      let baseMode: DissolveMode = currentActiveMode;
      let nextMode: DissolveMode = currentActiveMode;
      let wipeT = 0;

      if (autoCycle && !reducedMotion) {
        // Exact 3-act timing extracted from 5.8s reference:
        // 0.00-0.21 Smooth | 0.21-0.31 Wipe->Halftone | 0.31-0.57 Halftone
        // 0.57-0.67 Wipe->ASCII | 0.67-0.88 ASCII | 0.88-0.98 Wipe->Smooth | 0.98-1.00 Smooth
        const cyclePos = (elapsed % safeDuration) / safeDuration;
        if (cyclePos < 0.21) {
          baseMode = "smooth";
          nextMode = "smooth";
          wipeT = 0;
        } else if (cyclePos < 0.31) {
          baseMode = "smooth";
          nextMode = "halftone";
          wipeT = easeInOutQuart((cyclePos - 0.21) / 0.1);
        } else if (cyclePos < 0.57) {
          baseMode = "halftone";
          nextMode = "halftone";
          wipeT = 0;
        } else if (cyclePos < 0.67) {
          baseMode = "halftone";
          nextMode = "ascii";
          wipeT = easeInOutQuart((cyclePos - 0.57) / 0.1);
        } else if (cyclePos < 0.88) {
          baseMode = "ascii";
          nextMode = "ascii";
          wipeT = 0;
        } else if (cyclePos < 0.98) {
          baseMode = "ascii";
          nextMode = "smooth";
          wipeT = easeInOutQuart((cyclePos - 0.88) / 0.1);
        } else {
          baseMode = "smooth";
          nextMode = "smooth";
          wipeT = 0;
        }

        const effectiveMode = wipeT > 0.5 ? nextMode : baseMode;
        if (lastReportedModeRef.current !== effectiveMode) {
          lastReportedModeRef.current = effectiveMode;
          onAutoModeSyncRef.current(effectiveMode);
        }
      } else if (manualWipeTrigger > 0 && !reducedMotion) {
        const manualElapsed = now - manualStartRef.current;
        const manualDuration = 580;
        if (manualElapsed < manualDuration) {
          baseMode = prevManualMode;
          nextMode = currentActiveMode;
          wipeT = easeInOutQuart(Math.min(1, manualElapsed / manualDuration));
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
        const cx = logicalSize * 0.615;
        const cy = logicalSize * 0.5;
        const maxRadius = logicalSize * 0.76;
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
    manualWipeTrigger,
    prevManualMode,
    reducedMotion,
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
  const [prevManualMode, setPrevManualMode] =
    useState<DissolveMode>(initialMode);
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
        showMockups ? "max-w-[672px]" : "max-w-[324px]",
        className
      )}
      {...rest}
    >
      <div
        className={cn(
          "grid gap-[23px]",
          showMockups ? "grid-cols-1 md:grid-cols-[324fr_325fr]" : "grid-cols-1"
        )}
      >
        {/* Left Hero Brand Card (exact 324 x 494 proportion) */}
        <motion.button
          type="button"
          onClick={handleCycleModeClick}
          onKeyDown={handleHeroKeyDown}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.992 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          aria-label={`${brandName} interactive radial dissolve card. Current visual mode: ${activeMode}. Activate to cycle dissolve style.`}
          style={{ backgroundColor: accentColor }}
          className={cn(
            "group relative flex aspect-[324/494] w-full flex-col justify-between overflow-hidden rounded-[26px] px-6 pb-6 pt-5 text-left text-white",
            "cursor-pointer outline-none transition-shadow duration-200",
            "focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 dark:focus-visible:ring-white dark:focus-visible:ring-offset-neutral-950"
          )}
        >
          {/* Subtle Tactile Print Grain Overlay */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.05] mix-blend-overlay"
            aria-hidden="true"
          >
            <filter id={`${uid}-grain`}>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.85"
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
            <span className="font-mono text-[13px] font-medium uppercase tracking-[0.055em] text-white/95">
              {brandName}
            </span>
          </div>

          {/* Center Morphing Radial Emblem */}
          <div className="relative z-10 -mx-2 my-auto flex aspect-square items-center justify-center">
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
          <div className="relative z-10 space-y-[2px] font-mono text-[8.8px] leading-[1.68] tracking-[0.015em] text-white/85">
            {safePoem.map((line, index) => (
              <p key={index} className="m-0">
                {line}
              </p>
            ))}
          </div>
        </motion.button>

        {/* Right Companion Mockups (exact 325x325 + 26px gap + 325x143 = 494px) */}
        {showMockups && (
          <div className="flex flex-col gap-[26px]">
            {/* Top-Right Isometric Phone App Icon Card (1:1 square) */}
            <div className="relative aspect-square w-full overflow-hidden rounded-[26px] bg-[#F2F2F2] dark:bg-neutral-900">
              <svg
                viewBox="0 0 325 325"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-full w-full"
                role="img"
                aria-label={`${brandName} mobile app icon preview`}
              >
                {/* White phone top & side fill */}
                <path
                  d="M244 -10 L44 106 C20 120 20 156 44 170 L306 322 L335 322 L335 -10 Z"
                  className="fill-white dark:fill-neutral-950"
                />

                {/* Side chassis depth extrusion (bottom-left edge) */}
                <path
                  d="M25 142 L25 170 C25 184 35 196 52 206 L256 324 L306 324 L52 178 C35 168 25 156 25 142 Z"
                  className="fill-[#FCFCFC] stroke-[#808080] dark:fill-neutral-900 dark:stroke-neutral-600"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />

                {/* Outer chassis top rim */}
                <path
                  d="M246 -8 L44 109 C20 123 20 154 44 168 L314 324"
                  className="stroke-[#767676] dark:stroke-neutral-500"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                />

                {/* Inner chassis chamfer ring */}
                <path
                  d="M258 -4 L54 114 C31 127 31 153 54 166 L326 323"
                  className="stroke-[#9E9E9E] dark:stroke-neutral-700"
                  strokeWidth="1.05"
                  strokeLinecap="round"
                />

                {/* Screen bezel border with top speaker notch */}
                <path
                  d="M302 -6 L160 76 C144 85 130 85 117 77 L110 73 L64 100 C37 116 37 146 64 162 L328 314"
                  className="stroke-[#8A8A8A] dark:stroke-neutral-600"
                  strokeWidth="1.15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Top earpiece pill & front camera */}
                <path
                  d="M186 48 L238 18 C241 16 244 19 241 22 L189 52 C186 54 183 50 186 48 Z"
                  className="stroke-[#8A8A8A] dark:stroke-neutral-600"
                  strokeWidth="1.15"
                />
                <ellipse
                  cx="258"
                  cy="9"
                  rx="8"
                  ry="4.8"
                  className="stroke-[#8A8A8A] dark:stroke-neutral-600"
                  strokeWidth="1.15"
                />

                {/* 3D Beveled Side Hardware Buttons */}
                {/* Action / Mute switch */}
                <g className="stroke-[#7D7D7D] dark:stroke-neutral-500" strokeWidth="1.15">
                  <path
                    d="M74 201 L102 217 C106 219 107 226 104 230 C101 233 96 232 92 230 L64 214 C60 212 59 205 62 201 C65 198 70 199 74 201 Z"
                    className="fill-white dark:fill-neutral-900"
                  />
                  <path
                    d="M68 205 L96 221 C99 223 100 226 98 228"
                    strokeLinecap="round"
                  />
                </g>

                {/* Volume Up */}
                <g className="stroke-[#7D7D7D] dark:stroke-neutral-500" strokeWidth="1.15">
                  <path
                    d="M138 238 L196 271 C201 274 202 281 198 286 C195 290 189 290 184 287 L126 254 C121 251 120 244 124 239 C127 235 133 235 138 238 Z"
                    className="fill-white dark:fill-neutral-900"
                  />
                  <path
                    d="M132 243 L190 276 C193 278 195 282 193 285"
                    strokeLinecap="round"
                  />
                </g>

                {/* Volume Down */}
                <g className="stroke-[#7D7D7D] dark:stroke-neutral-500" strokeWidth="1.15">
                  <path
                    d="M222 286 L280 319 C285 322 286 329 282 334 C279 338 273 338 268 335 L210 302 C205 299 204 292 208 287 C211 283 217 283 222 286 Z"
                    className="fill-white dark:fill-neutral-900"
                  />
                  <path
                    d="M216 291 L274 324"
                    strokeLinecap="round"
                  />
                </g>

                {/* Isometric 30-deg App Icon Grid */}
                <g transform="translate(168, 156) matrix(0.866, 0.5, -0.866, 0.5, 0, 0)">
                  {/* Highlighted Brand Squircle App Icon */}
                  <g transform="translate(-39, -39)">
                    <rect
                      x="0"
                      y="0"
                      width="78"
                      height="78"
                      rx="20"
                      fill={accentColor}
                    />
                    <g transform="translate(39, 39) rotate(-42) translate(-29, -29)">
                      <MiniRadialMark
                        idPrefix={`${uid}-iso`}
                        className="h-[58px] w-[58px]"
                      />
                    </g>
                  </g>

                  {/* Neighboring Wireframe App Squircles */}
                  <rect
                    x="-39"
                    y="-143"
                    width="78"
                    height="78"
                    rx="20"
                    className="stroke-[#929292] dark:stroke-neutral-700"
                    strokeWidth="1.35"
                  />
                  <rect
                    x="65"
                    y="-39"
                    width="78"
                    height="78"
                    rx="20"
                    className="stroke-[#929292] dark:stroke-neutral-700"
                    strokeWidth="1.35"
                  />
                  <rect
                    x="65"
                    y="-143"
                    width="78"
                    height="78"
                    rx="20"
                    className="stroke-[#929292] dark:stroke-neutral-700"
                    strokeWidth="1.35"
                  />
                  <rect
                    x="169"
                    y="-39"
                    width="78"
                    height="78"
                    rx="20"
                    className="stroke-[#929292] dark:stroke-neutral-700"
                    strokeWidth="1.35"
                  />
                  <rect
                    x="-39"
                    y="-247"
                    width="78"
                    height="78"
                    rx="20"
                    className="stroke-[#929292] dark:stroke-neutral-700"
                    strokeWidth="1.35"
                  />
                </g>
              </svg>
            </div>

            {/* Bottom-Right Browser Tab & Favicon Card (exact 325x143) */}
            <div className="relative aspect-[325/143] w-full overflow-hidden rounded-[26px] bg-[#F2F2F2] pl-6 pt-6 dark:bg-neutral-900">
              <div className="relative flex h-full w-full flex-col overflow-hidden rounded-tl-[22px] border-l border-t border-[#919191] bg-white dark:border-neutral-700 dark:bg-neutral-950">
                {/* Top Window & Active Tab Strip */}
                <div className="relative flex h-[50px] items-stretch bg-white dark:bg-neutral-950">
                  {/* Left Traffic Lights Area */}
                  <div className="relative flex w-[132px] shrink-0 items-center gap-[11px] border-b border-[#9C9C9C] pl-[26px] dark:border-neutral-700">
                    <span className="h-[13px] w-[13px] rounded-full bg-[#CCCCCC] dark:bg-neutral-700" />
                    <span className="h-[13px] w-[13px] rounded-full bg-[#CCCCCC] dark:bg-neutral-700" />
                    <span className="h-[13px] w-[13px] rounded-full bg-[#CCCCCC] dark:bg-neutral-700" />

                    {/* Smooth Concave Safari/Chrome Tab Curve */}
                    <svg
                      viewBox="0 0 22 50"
                      fill="none"
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-px top-0 h-[50px] w-[22px]"
                    >
                      <path
                        d="M22 0 C15 0 11 5 11 12 L11 38 C11 45 7 49.5 0 49.5"
                        className="stroke-[#9C9C9C] dark:stroke-neutral-700"
                        strokeWidth="1.15"
                      />
                    </svg>
                  </div>

                  {/* Active Browser Tab Content */}
                  <div className="flex flex-1 items-center gap-2.5 border-b border-[#9C9C9C] pl-2 pr-2 dark:border-neutral-700">
                    <span
                      style={{ backgroundColor: accentColor }}
                      className="flex h-[31px] w-[31px] shrink-0 items-center justify-center rounded-[7px]"
                    >
                      <MiniRadialMark
                        idPrefix={`${uid}-fav`}
                        className="h-[23px] w-[23px]"
                      />
                    </span>
                    <span className="truncate font-sans text-[19px] font-normal tracking-[-0.025em] text-[#171717] dark:text-neutral-100">
                      {domainSlug}
                    </span>
                  </div>
                </div>

                {/* Browser Navigation & Cropped Pill URL Bar */}
                <div className="flex flex-1 items-center gap-5 bg-white pl-[26px] pr-0 dark:bg-neutral-950">
                  <div className="flex items-center gap-[19px] text-[#9A9A9A] dark:text-neutral-500">
                    <ArrowLeft className="h-[22px] w-[22px]" strokeWidth={1.85} />
                    <ArrowRight className="h-[22px] w-[22px]" strokeWidth={1.85} />
                    <RotateCw className="h-[20px] w-[20px]" strokeWidth={1.85} />
                    <Home className="h-[21px] w-[21px]" strokeWidth={1.8} />
                  </div>

                  {/* Cropped Address Bar Pill */}
                  <div className="ml-2 flex h-[48px] flex-1 items-center gap-2.5 rounded-l-full border-y border-l border-[#919191] pl-5 pr-2 dark:border-neutral-700">
                    {/* Solid Padlock Icon matching reference */}
                    <svg
                      viewBox="0 0 16 18"
                      fill="none"
                      aria-hidden="true"
                      className="h-[16px] w-[14px] shrink-0 text-[#9B9B9B] dark:text-neutral-500"
                    >
                      <path
                        d="M4.5 7.5V5.2C4.5 3.1 6.05 1.5 8 1.5C9.95 1.5 11.5 3.1 11.5 5.2V7.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      <rect
                        x="2"
                        y="7.5"
                        width="12"
                        height="9.5"
                        rx="2"
                        fill="currentColor"
                      />
                    </svg>
                    <span className="truncate font-sans text-[18px] font-normal tracking-[-0.015em] text-[#171717] dark:text-neutral-200">
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
