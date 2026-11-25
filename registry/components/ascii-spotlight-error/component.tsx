"use client";

import React, { useEffect, useId, useRef, useState } from "react";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);

    const onChange = (event: MediaQueryListEvent) => {
      setReduced(event.matches);
    };

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);

  return reduced;
}

export type AsciiSpotlightTheme = "auto" | "dark" | "light";

export interface AsciiSpotlightErrorProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Primary error or status headline displayed beneath the beacon. */
  message?: string;
  /** Optional secondary description beneath the headline. */
  description?: string;
  /** Maximum reach of the ASCII spotlight beam in pixels. */
  beamLength?: number;
  /** Total angular spread of the spotlight cone in degrees. */
  coneAngle?: number;
  /** Monospace grid cell pitch in pixels. */
  cellSize?: number;
  /** Ordered ASCII luminance ramp from dimmest to brightest. */
  charset?: string;
  /** Angular tracking damping factor (higher = snappier). */
  smoothing?: number;
  /** Subtle organic character shimmer along the beam. */
  shimmer?: boolean;
  /** Color theme mode: follows Tailwind dark mode when set to "auto". */
  theme?: AsciiSpotlightTheme;
  /** Optional custom icon replacing the default geometric prism triangle. */
  icon?: React.ReactNode;
  /** Optional recovery action label (e.g. "Try again"). */
  actionLabel?: string;
  /** Callback fired when the optional recovery action button is clicked. */
  onAction?: () => void;
}

const DEFAULT_CHARSET = " .:-=+*#%@";
const RESTING_ANGLE = -Math.PI / 2;

function parseRgbString(color: string): [number, number, number] {
  const match = color.match(/\d+(\.\d+)?/g);
  if (!match || match.length < 3) return [245, 245, 245];
  return [
    Math.round(Number(match[0])),
    Math.round(Number(match[1])),
    Math.round(Number(match[2])),
  ];
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

const AsciiSpotlightError = React.forwardRef<
  HTMLDivElement,
  AsciiSpotlightErrorProps
>(function AsciiSpotlightError(
  {
    message = "Something went wrong",
    description,
    beamLength = 360,
    coneAngle = 56,
    cellSize = 12,
    charset = DEFAULT_CHARSET,
    smoothing = 0.14,
    shimmer = true,
    theme = "auto",
    icon,
    actionLabel,
    onAction,
    className,
    ...rest
  },
  forwardedRef
) {
  const rawId = useId();
  const headingId = `ascii-spotlight-heading-${rawId.replace(/:/g, "")}`;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const beaconRef = useRef<HTMLDivElement | null>(null);

  const prefersReducedMotion = useReducedMotion();

  const safeBeamLength = clamp(beamLength, 140, 720);
  const safeConeAngle = clamp(coneAngle, 16, 130);
  const safeCellSize = clamp(Math.round(cellSize), 8, 22);
  const safeSmoothing = clamp(smoothing, 0.03, 0.45);
  const safeCharset = charset.length >= 2 ? charset : DEFAULT_CHARSET;

  const setMergedRef = (node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (typeof forwardedRef === "function") {
      forwardedRef(node);
    } else if (forwardedRef) {
      forwardedRef.current = node;
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let originX = 0;
    let originY = 0;
    let rgb: [number, number, number] = [245, 245, 245];

    let currentAngle = RESTING_ANGLE;
    let targetAngle = RESTING_ANGLE;
    let pointerActive = false;
    let rafId = 0;
    let lastTime = performance.now();

    const readForegroundColor = () => {
      if (theme === "dark") {
        rgb = [245, 245, 245];
        return;
      }
      if (theme === "light") {
        rgb = [18, 18, 18];
        return;
      }
      const computed = window.getComputedStyle(container).color;
      rgb = parseRgbString(computed);
    };

    const measure = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const beacon = beaconRef.current;
      if (beacon) {
        const bRect = beacon.getBoundingClientRect();
        originX = bRect.left - rect.left + bRect.width * 0.5;
        originY = bRect.top - rect.top + bRect.height * 0.45;
      } else {
        originX = width * 0.5;
        originY = height * 0.5;
      }

      readForegroundColor();
    };

    const drawFrame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      if (prefersReducedMotion) {
        currentAngle = pointerActive ? targetAngle : RESTING_ANGLE;
      } else {
        const factor = 1 - Math.exp(-safeSmoothing * 60 * dt);
        let delta = targetAngle - currentAngle;
        while (delta > Math.PI) delta -= Math.PI * 2;
        while (delta < -Math.PI) delta += Math.PI * 2;
        currentAngle += delta * factor;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const fontSize = Math.max(8, Math.round(safeCellSize * 0.94));
      ctx.font = `500 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const halfConeRad = ((safeConeAngle * Math.PI) / 180) * 0.5;
      const maxCharIndex = safeCharset.length - 1;
      const minDist = 11;
      const distSpan = Math.max(1, safeBeamLength - minDist);

      const startCol = Math.max(
        0,
        Math.floor((originX - safeBeamLength) / safeCellSize)
      );
      const endCol = Math.min(
        Math.ceil(width / safeCellSize),
        Math.ceil((originX + safeBeamLength) / safeCellSize)
      );
      const startRow = Math.max(
        0,
        Math.floor((originY - safeBeamLength) / safeCellSize)
      );
      const endRow = Math.min(
        Math.ceil(height / safeCellSize),
        Math.ceil((originY + safeBeamLength) / safeCellSize)
      );

      const timeSec = now * 0.001;
      const [r, g, b] = rgb;
      const halfCell = safeCellSize * 0.5;

      for (let row = startRow; row <= endRow; row++) {
        const cy = row * safeCellSize + halfCell;
        const dy = cy - originY;

        for (let col = startCol; col <= endCol; col++) {
          const cx = col * safeCellSize + halfCell;
          const dx = cx - originX;

          const distSq = dx * dx + dy * dy;
          if (
            distSq < minDist * minDist ||
            distSq > safeBeamLength * safeBeamLength
          ) {
            continue;
          }

          const cellAngle = Math.atan2(dy, dx);
          let diff = cellAngle - currentAngle;
          if (diff > Math.PI) diff -= Math.PI * 2;
          else if (diff < -Math.PI) diff += Math.PI * 2;

          const absDiff = Math.abs(diff);
          if (absDiff >= halfConeRad) continue;

          const dist = Math.sqrt(distSq);
          const normDist = (dist - minDist) / distSpan;
          const radialFalloff = Math.pow(1 - normDist, 1.55);

          const normAngle = absDiff / halfConeRad;
          const angularFalloff = Math.pow(
            Math.cos(normAngle * (Math.PI * 0.5)),
            1.65
          );

          let intensity = radialFalloff * angularFalloff;

          if (shimmer && !prefersReducedMotion) {
            const wave =
              Math.sin(col * 12.9898 + row * 78.233 + timeSec * 2.6) * 0.028;
            intensity = Math.max(0, Math.min(1, intensity + wave * intensity));
          }

          if (intensity <= 0.015) continue;

          const charIndex = Math.min(
            maxCharIndex,
            Math.max(1, Math.round(intensity * maxCharIndex))
          );
          const ch = safeCharset[charIndex];
          if (!ch || ch === " ") continue;

          const alpha = Math.min(0.88, Math.pow(intensity, 0.85) * 0.88);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
          ctx.fillText(ch, cx, cy);
        }
      }
    };

    const tick = (now: number) => {
      drawFrame(now);
      if (!prefersReducedMotion) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      const dx = px - originX;
      const dy = py - originY;
      if (dx * dx + dy * dy > 16) {
        targetAngle = Math.atan2(dy, dx);
        pointerActive = true;
        if (prefersReducedMotion) {
          drawFrame(performance.now());
        }
      }
    };

    const handlePointerLeave = () => {
      pointerActive = false;
      targetAngle = RESTING_ANGLE;
      if (prefersReducedMotion) {
        drawFrame(performance.now());
      }
    };

    measure();

    const resizeObserver = new ResizeObserver(() => {
      measure();
      if (prefersReducedMotion) {
        drawFrame(performance.now());
      }
    });
    resizeObserver.observe(container);

    const handleThemeSync = () => {
      readForegroundColor();
      if (prefersReducedMotion) {
        drawFrame(performance.now());
      }
    };

    const mutationObserver = new MutationObserver(handleThemeSync);
    mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    });

    const colorSchemeMq =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-color-scheme: dark)")
        : null;
    if (colorSchemeMq && typeof colorSchemeMq.addEventListener === "function") {
      colorSchemeMq.addEventListener("change", handleThemeSync);
    }

    container.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    container.addEventListener("pointerdown", handlePointerMove, {
      passive: true,
    });
    container.addEventListener("pointerleave", handlePointerLeave);

    if (prefersReducedMotion) {
      drawFrame(performance.now());
    } else {
      rafId = window.requestAnimationFrame(tick);
    }

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      if (
        colorSchemeMq &&
        typeof colorSchemeMq.removeEventListener === "function"
      ) {
        colorSchemeMq.removeEventListener("change", handleThemeSync);
      }
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerdown", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [
    safeBeamLength,
    safeConeAngle,
    safeCellSize,
    safeCharset,
    safeSmoothing,
    shimmer,
    theme,
    prefersReducedMotion,
  ]);

  const themeClasses =
    theme === "dark"
      ? "bg-black text-[#ededed]"
      : theme === "light"
        ? "bg-white text-neutral-950"
        : "bg-white text-neutral-950 dark:bg-black dark:text-[#ededed]";

  return (
    <div
      ref={setMergedRef}
      role="alert"
      aria-live="polite"
      aria-labelledby={headingId}
      className={cn(
        "relative flex w-full min-h-[520px] flex-col items-center justify-center overflow-hidden px-6 py-16 transition-colors duration-200 select-none",
        themeClasses,
        className
      )}
      {...rest}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      />

      <div className="relative z-10 flex flex-col items-center text-center">
        <div
          ref={beaconRef}
          aria-hidden="true"
          className="flex items-center justify-center"
        >
          {icon ?? (
            <svg
              width="23"
              height="21"
              viewBox="0 0 23 21"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="block h-[21px] w-[23px] text-current"
              shapeRendering="geometricPrecision"
            >
              <polygon
                points="11.5,0.5 22.75,20.25 0.25,20.25"
                fill="currentColor"
              />
            </svg>
          )}
        </div>

        <h1
          id={headingId}
          className="mt-5 font-sans text-[24px] font-medium leading-[1.2] tracking-[-0.025em] text-current"
        >
          {message}
        </h1>

        {description ? (
          <p className="mt-2.5 max-w-sm text-[14px] leading-relaxed text-neutral-500 dark:text-neutral-400">
            {description}
          </p>
        ) : null}

        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className={cn(
              "mt-6 inline-flex items-center justify-center rounded-md border px-4 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              theme === "dark"
                ? "border-neutral-800 bg-neutral-950 text-neutral-100 hover:bg-neutral-900 focus-visible:ring-neutral-400 focus-visible:ring-offset-black"
                : theme === "light"
                  ? "border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-100 focus-visible:ring-neutral-900 focus-visible:ring-offset-white"
                  : "border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-100 focus-visible:ring-neutral-900 focus-visible:ring-offset-white dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900 dark:focus-visible:ring-neutral-400 dark:focus-visible:ring-offset-black"
            )}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
});

AsciiSpotlightError.displayName = "AsciiSpotlightError";

export {
  AsciiSpotlightError,
  AsciiSpotlightError as component,
  AsciiSpotlightError as Component,
};
export default AsciiSpotlightError;