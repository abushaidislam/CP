"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useReducedMotion } from "framer-motion";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export type KineticPosterTheme = "auto" | "dark" | "light";

export interface KineticPosterTypographyProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Primary top display word (swaps with bottomWord) */
  topWord?: string;
  /** Center connector display word */
  middleWord?: string;
  /** Primary bottom display word (swaps with topWord) */
  bottomWord?: string;
  /** Top editorial subtitle line */
  subtitle?: string;
  /** Left metadata block lines flanking the middle word */
  leftMeta?: [string, string, string];
  /** Right metadata block lines flanking the middle word */
  rightMeta?: [string, string, string];
  /** Full 2-transition choreography cycle duration in seconds */
  cycleDuration?: number;
  /** Whether the kinetic loop plays automatically */
  autoPlay?: boolean;
  /** Pause the animation while hovered */
  pauseOnHover?: boolean;
  /** Color theme mode ("auto" follows Tailwind dark: mode) */
  theme?: KineticPosterTheme;
}

const DEFAULT_LEFT_META: [string, string, string] = [
  "Nuvora Talk #01",
  "24 October 2026",
  "19:00 CET",
];

const DEFAULT_RIGHT_META: [string, string, string] = [
  "Hosted by Studio Form",
  "Kornhausplatz 14",
  "8004 Zurich",
];

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

export const KineticPosterTypography = React.forwardRef<
  HTMLDivElement,
  KineticPosterTypographyProps
>(
  (
    {
      topWord = "ENERGY",
      middleWord = "IN",
      bottomWord = "MOTION",
      subtitle = "»Energy in Motion« — Principles of Kinetic Graphic Design & Typography",
      leftMeta = DEFAULT_LEFT_META,
      rightMeta = DEFAULT_RIGHT_META,
      cycleDuration = 4.2,
      autoPlay = true,
      pauseOnHover = false,
      theme = "auto",
      className,
      onClick,
      onKeyDown,
      onMouseEnter,
      onMouseLeave,
      ...props
    },
    ref
  ) => {
    const rawId = useId();
    const safeId = rawId.replace(/:/g, "");
    const prefersReducedMotion = useReducedMotion();

    const [isUserPaused, setIsUserPaused] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [reducedSwapped, setReducedSwapped] = useState(false);

    const safeDuration = Math.max(1.6, Math.min(12, Number(cycleDuration) || 4.2));

    const topChars = useMemo(
      () => Array.from((topWord || "ENERGY").trim().toUpperCase()),
      [topWord]
    );
    const middleChars = useMemo(
      () => Array.from((middleWord || "IN").trim().toUpperCase()),
      [middleWord]
    );
    const bottomChars = useMemo(
      () => Array.from((bottomWord || "MOTION").trim().toUpperCase()),
      [bottomWord]
    );

    const maxCols = Math.max(topChars.length, bottomChars.length, 6);
    const displayFontSize = `${(104 / maxCols).toFixed(2)}cqw`;

    const stageRef = useRef<HTMLDivElement | null>(null);
    const row1Ref = useRef<HTMLDivElement | null>(null);
    const row3Ref = useRef<HTMLDivElement | null>(null);

    const topCharRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const middleCharRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const bottomCharRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const markerRefs = useRef<(HTMLSpanElement | null)[]>([]);

    const rowSpanRef = useRef<number>(170);
    const elapsedRef = useRef<number>(0);
    const lastFrameTimeRef = useRef<number | null>(null);

    // Measure exact pixel distance between Row 1 and Row 3 centers for pixel-accurate vertical swap & 3D orbit
    useEffect(() => {
      const measure = () => {
        const r1 = row1Ref.current;
        const r3 = row3Ref.current;
        if (!r1 || !r3) return;
        const rect1 = r1.getBoundingClientRect();
        const rect3 = r3.getBoundingClientRect();
        const center1 = rect1.top + rect1.height / 2;
        const center3 = rect3.top + rect3.height / 2;
        const dist = center3 - center1;
        if (dist > 20) {
          rowSpanRef.current = dist;
        }
      };

      measure();
      const target = stageRef.current;
      if (!target || typeof ResizeObserver === "undefined") return;
      const ro = new ResizeObserver(measure);
      ro.observe(target);
      return () => ro.disconnect();
    }, [topChars.length, bottomChars.length]);

    const applyTransforms = useCallback(
      (progress: number) => {
        const span = rowSpanRef.current;
        const halfSpan = span * 0.5;
        const orbitRadius = span * 0.52;

        // 4-Phase Choreography Timeline:
        // [0.00, 0.16): Hold State A (topWord / middleWord / bottomWord)
        // [0.16, 0.48): Phase 2 — Staggered left-to-right vertical column swap
        // [0.48, 0.64): Hold State B (bottomWord / middleWord / topWord)
        // [0.64, 0.98): Phase 4 — Staggered left-to-right 3D X-axis cylinder flip back to A
        // [0.98, 1.00): Settle Hold State A

        const p = ((progress % 1) + 1) % 1;

        const updateChar = (
          el: HTMLSpanElement | null,
          normIndex: number,
          role: "top" | "middle" | "bottom"
        ) => {
          if (!el) return;

          if (p < 0.16 || p >= 0.98) {
            el.style.transform =
              "translate3d(0px, 0px, 0px) rotateX(0deg) scale3d(1, 1, 1)";
            return;
          }

          if (p < 0.48) {
            // Phase 2: Staggered vertical letter-by-letter swap
            if (role === "middle") {
              el.style.transform =
                "translate3d(0px, 0px, 0px) rotateX(0deg) scale3d(1, 1, 1)";
              return;
            }
            const phaseP = (p - 0.16) / 0.32;
            const staggerSpan = 0.42;
            const charWindow = 1 - staggerSpan;
            const localT = clamp01((phaseP - normIndex * staggerSpan) / charWindow);
            const eased = easeInOutCubic(localT);
            const midPulse = Math.sin(Math.PI * eased);

            const y = role === "top" ? eased * span : -eased * span;
            const scaleY = 1 - 0.12 * midPulse;
            const scaleX = 1 + 0.035 * midPulse;

            el.style.transform = `translate3d(0px, ${y.toFixed(2)}px, 0px) rotateX(0deg) scale3d(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)}, 1)`;
            return;
          }

          if (p < 0.64) {
            // Phase 3: Hold State B
            const y = role === "top" ? span : role === "bottom" ? -span : 0;
            el.style.transform = `translate3d(0px, ${y.toFixed(2)}px, 0px) rotateX(0deg) scale3d(1, 1, 1)`;
            return;
          }

          // Phase 4: Staggered 3D perspective X-axis cylinder flip (0.64 -> 0.98)
          const phaseP = (p - 0.64) / 0.34;
          const staggerSpan = 0.38;
          const charWindow = 1 - staggerSpan;
          const localT = clamp01((phaseP - normIndex * staggerSpan) / charWindow);
          const eased = easeInOutQuart(localT);
          const theta = eased * Math.PI;
          const sinT = Math.sin(theta);
          const cosT = Math.cos(theta);

          // Tilt goes 0deg -> -90deg in first half, flips cleanly at edge-on plane to +90deg -> 0deg so letters land upright
          const tiltDeg =
            theta < Math.PI / 2
              ? -(theta * 180) / Math.PI
              : 180 - (theta * 180) / Math.PI;

          let y = 0;
          let z = 0;

          if (role === "top") {
            // Orbits smoothly from +span (Row 3) back to 0 (Row 1)
            y = halfSpan * (1 + cosT);
            z = -orbitRadius * sinT;
          } else if (role === "bottom") {
            // Orbits smoothly from -span (Row 1) back to 0 (Row 3)
            y = -halfSpan * (1 + cosT);
            z = orbitRadius * sinT;
          } else {
            // Center word flips in-place along the center horizon
            y = 0;
            z = 0;
          }

          el.style.transform = `translate3d(0px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateX(${tiltDeg.toFixed(2)}deg) scale3d(1, 1, 1)`;
        };

        const topDenom = Math.max(1, topChars.length - 1);
        for (let i = 0; i < topChars.length; i++) {
          updateChar(topCharRefs.current[i], i / topDenom, "top");
        }

        const midDenom = Math.max(1, middleChars.length - 1);
        for (let i = 0; i < middleChars.length; i++) {
          const norm =
            middleChars.length === 1 ? 0.5 : 0.32 + (i / midDenom) * 0.36;
          updateChar(middleCharRefs.current[i], norm, "middle");
        }

        const botDenom = Math.max(1, bottomChars.length - 1);
        for (let i = 0; i < bottomChars.length; i++) {
          updateChar(bottomCharRefs.current[i], i / botDenom, "bottom");
        }

        // Synchronized subtle motion for the 4 Swiss registration corner squares
        for (let i = 0; i < 4; i++) {
          const m = markerRefs.current[i];
          if (!m) continue;
          const isLeft = i === 0 || i === 2;
          const isUpper = i === 0 || i === 1;
          const norm = isLeft ? 0.05 : 0.95;

          if (p >= 0.64 && p < 0.98) {
            const phaseP = (p - 0.64) / 0.34;
            const localT = clamp01((phaseP - norm * 0.38) / 0.62);
            const eased = easeInOutQuart(localT);
            const theta = eased * Math.PI;
            const shiftY = Math.sin(theta) * (isUpper ? 10 : -10);
            const scale = 0.65 + 0.35 * Math.abs(Math.cos(theta));
            m.style.transform = `translate3d(0px, ${shiftY.toFixed(2)}px, 0px) scale(${scale.toFixed(3)})`;
          } else if (p >= 0.16 && p < 0.48) {
            const phaseP = (p - 0.16) / 0.32;
            const localT = clamp01((phaseP - norm * 0.42) / 0.58);
            const eased = easeInOutCubic(localT);
            const shiftY = Math.sin(Math.PI * eased) * (isUpper ? -6 : 6);
            m.style.transform = `translate3d(0px, ${shiftY.toFixed(2)}px, 0px) scale(1)`;
          } else {
            m.style.transform = "translate3d(0px, 0px, 0px) scale(1)";
          }
        }
      },
      [topChars.length, middleChars.length, bottomChars.length]
    );

    const isRunning =
      autoPlay && !isUserPaused && !(pauseOnHover && isHovered) && !prefersReducedMotion;

    useEffect(() => {
      if (prefersReducedMotion) {
        applyTransforms(reducedSwapped ? 0.56 : 0);
        return;
      }

      if (!isRunning) {
        lastFrameTimeRef.current = null;
        applyTransforms(elapsedRef.current / safeDuration);
        return;
      }

      let rafId = 0;
      const tick = (now: number) => {
        if (lastFrameTimeRef.current !== null) {
          const dt = Math.min(0.05, (now - lastFrameTimeRef.current) / 1000);
          elapsedRef.current = (elapsedRef.current + dt) % safeDuration;
        }
        lastFrameTimeRef.current = now;
        applyTransforms(elapsedRef.current / safeDuration);
        rafId = window.requestAnimationFrame(tick);
      };

      rafId = window.requestAnimationFrame(tick);
      return () => {
        window.cancelAnimationFrame(rafId);
        lastFrameTimeRef.current = null;
      };
    }, [isRunning, safeDuration, prefersReducedMotion, reducedSwapped, applyTransforms]);

    const handleToggle = useCallback(() => {
      if (prefersReducedMotion) {
        setReducedSwapped((prev) => !prev);
      } else {
        setIsUserPaused((prev) => !prev);
      }
    }, [prefersReducedMotion]);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      handleToggle();
      onClick?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleToggle();
      }
      onKeyDown?.(e);
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
      setIsHovered(true);
      onMouseEnter?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      setIsHovered(false);
      onMouseLeave?.(e);
    };

    const themeClasses =
      theme === "dark"
        ? "bg-black text-white border-white/10"
        : theme === "light"
          ? "bg-white text-black border-black/10"
          : "bg-white text-black border-black/10 dark:bg-black dark:text-white dark:border-white/10";

    const markerBgClasses =
      theme === "dark"
        ? "bg-white"
        : theme === "light"
          ? "bg-black"
          : "bg-black dark:bg-white";

    const focusRingClasses =
      theme === "dark"
        ? "focus-visible:ring-white/60"
        : theme === "light"
          ? "focus-visible:ring-black/60"
          : "focus-visible:ring-black/60 dark:focus-visible:ring-white/60";

    const isPausedState = prefersReducedMotion
      ? false
      : !autoPlay || isUserPaused || (pauseOnHover && isHovered);

    return (
      <div
        ref={(node) => {
          stageRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        role="button"
        tabIndex={0}
        aria-pressed={isUserPaused || reducedSwapped}
        aria-labelledby={`${safeId}-title`}
        aria-describedby={`${safeId}-desc`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          containerType: "inline-size",
          fontFamily:
            '"Helvetica Neue", "Inter", "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
        }}
        className={cn(
          "relative w-full max-w-[540px] aspect-square overflow-hidden select-none border transition-colors duration-300 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          themeClasses,
          focusRingClasses,
          className
        )}
        {...props}
      >
        {/* Accessible screen-reader summary */}
        <span id={`${safeId}-title`} className="sr-only">
          {`${topWord} ${middleWord} ${bottomWord} — Kinetic Typography Poster`}
        </span>
        <span id={`${safeId}-desc`} className="sr-only">
          {prefersReducedMotion
            ? "Press Enter or Space to toggle swapped headline arrangement."
            : isPausedState
              ? "Animation paused. Press Enter or Space to resume."
              : "Animated kinetic typography poster. Press Enter or Space to pause."}
        </span>

        {/* Top Editorial Subtitle */}
        {subtitle && (
          <header
            className="absolute inset-x-[6%] top-[6.5%] text-center font-medium tracking-[-0.01em] opacity-90"
            style={{ fontSize: "2.05cqw", lineHeight: 1.25 }}
          >
            {subtitle}
          </header>
        )}

        {/* Main 3-Row Kinetic Lockup with 3D Perspective Stage */}
        <div
          className="absolute inset-x-[6.5%] bottom-[9%] flex flex-col justify-between"
          style={{
            perspective: "900px",
            transformStyle: "preserve-3d",
            gap: "1.4cqw",
          }}
        >
          {/* Row 1: Top Word */}
          <div
            ref={row1Ref}
            aria-hidden="true"
            className="relative flex w-full items-center justify-between font-medium uppercase leading-[0.84] tracking-[-0.03em]"
            style={{
              fontSize: displayFontSize,
              transformStyle: "preserve-3d",
            }}
          >
            {topChars.map((char, i) => (
              <span
                key={`top-${i}-${char}`}
                ref={(el) => {
                  topCharRefs.current[i] = el;
                }}
                className="inline-block will-change-transform"
                style={{
                  transformOrigin: "50% 50%",
                  backfaceVisibility: "visible",
                }}
              >
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </div>

          {/* Row 2: Left Metadata + Center Connector Word + Right Metadata + 4 Corner Registration Squares */}
          <div
            className="relative grid w-full grid-cols-[1fr_auto_1fr] items-center"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* 4 Swiss Corner Registration Squares framing the middle band */}
            <span
              ref={(el) => {
                markerRefs.current[0] = el;
              }}
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute -top-[0.7cqw] left-[0.2cqw] will-change-transform",
                markerBgClasses
              )}
              style={{ width: "1.25cqw", height: "1.25cqw" }}
            />
            <span
              ref={(el) => {
                markerRefs.current[1] = el;
              }}
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute -top-[0.7cqw] right-[0.2cqw] will-change-transform",
                markerBgClasses
              )}
              style={{ width: "1.25cqw", height: "1.25cqw" }}
            />
            <span
              ref={(el) => {
                markerRefs.current[2] = el;
              }}
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute -bottom-[0.7cqw] left-[0.2cqw] will-change-transform",
                markerBgClasses
              )}
              style={{ width: "1.25cqw", height: "1.25cqw" }}
            />
            <span
              ref={(el) => {
                markerRefs.current[3] = el;
              }}
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute -bottom-[0.7cqw] right-[0.2cqw] will-change-transform",
                markerBgClasses
              )}
              style={{ width: "1.25cqw", height: "1.25cqw" }}
            />

            {/* Left 3-line Metadata Block */}
            <div
              className="flex flex-col items-center justify-center pr-[2cqw] text-center font-medium tabular-nums tracking-[-0.01em] opacity-90"
              style={{ fontSize: "2.1cqw", lineHeight: 1.24 }}
            >
              {leftMeta.map((line, idx) => (
                <span key={`left-meta-${idx}`} className="block whitespace-nowrap">
                  {line}
                </span>
              ))}
            </div>

            {/* Center Display Word */}
            <div
              aria-hidden="true"
              className="flex items-center justify-center font-medium uppercase leading-[0.84] tracking-[-0.03em]"
              style={{
                fontSize: displayFontSize,
                transformStyle: "preserve-3d",
              }}
            >
              {middleChars.map((char, i) => (
                <span
                  key={`mid-${i}-${char}`}
                  ref={(el) => {
                    middleCharRefs.current[i] = el;
                  }}
                  className="inline-block will-change-transform"
                  style={{
                    transformOrigin: "50% 50%",
                    backfaceVisibility: "visible",
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </div>

            {/* Right 3-line Metadata Block */}
            <div
              className="flex flex-col items-center justify-center pl-[2cqw] text-center font-medium tabular-nums tracking-[-0.01em] opacity-90"
              style={{ fontSize: "2.1cqw", lineHeight: 1.24 }}
            >
              {rightMeta.map((line, idx) => (
                <span key={`right-meta-${idx}`} className="block whitespace-nowrap">
                  {line}
                </span>
              ))}
            </div>
          </div>

          {/* Row 3: Bottom Word */}
          <div
            ref={row3Ref}
            aria-hidden="true"
            className="relative flex w-full items-center justify-between font-medium uppercase leading-[0.84] tracking-[-0.03em]"
            style={{
              fontSize: displayFontSize,
              transformStyle: "preserve-3d",
            }}
          >
            {bottomChars.map((char, i) => (
              <span
                key={`bot-${i}-${char}`}
                ref={(el) => {
                  bottomCharRefs.current[i] = el;
                }}
                className="inline-block will-change-transform"
                style={{
                  transformOrigin: "50% 50%",
                  backfaceVisibility: "visible",
                }}
              >
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }
);

KineticPosterTypography.displayName = "KineticPosterTypography";

export {
  KineticPosterTypography as component,
  KineticPosterTypography as Component,
};
export default KineticPosterTypography;