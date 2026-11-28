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

export type KineticPosterTheme = "dark" | "light" | "auto";
export type KineticPosterLayout = "section" | "poster";

export interface KineticPosterTypographyProps
  extends React.HTMLAttributes<HTMLElement> {
  /** Primary top display word (swaps with bottomWord) */
  topWord?: string;
  /** Center connector display word */
  middleWord?: string;
  /** Primary bottom display word (swaps with topWord) */
  bottomWord?: string;
  /** Top editorial subtitle line (pass empty string to hide) */
  subtitle?: string;
  /** Left metadata lines flanking the middle word */
  leftMeta?: string[];
  /** Right metadata lines flanking the middle word */
  rightMeta?: string[];
  /** Layout mode: "section" fills a full-screen hero block; "poster" renders a 1:1 square card */
  layout?: KineticPosterLayout;
  /** Full choreography cycle duration in seconds */
  cycleDuration?: number;
  /** Whether the kinetic loop plays automatically */
  autoPlay?: boolean;
  /** Enable the subtle Swiss poster zoom-out breath during transitions */
  cameraZoom?: boolean;
  /** Pause the animation while hovered */
  pauseOnHover?: boolean;
  /** Color theme mode ("dark" matches the pure black Swiss poster reference) */
  theme?: KineticPosterTheme;
}

const DEFAULT_LEFT_META: string[] = [
  "Nuvora Talk #01",
  "24 October 2026",
  "19:00 CET",
];

const DEFAULT_RIGHT_META: string[] = [
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

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

export const KineticPosterTypography = React.forwardRef<
  HTMLElement,
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
      layout = "section",
      cycleDuration = 4.5,
      autoPlay = true,
      cameraZoom = true,
      pauseOnHover = false,
      theme = "dark",
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

    const safeDuration = Math.max(2.0, Math.min(12, Number(cycleDuration) || 4.5));

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
    const displayFontSize = `${(111 / maxCols).toFixed(2)}cqw`;

    const frameRef = useRef<HTMLDivElement | null>(null);
    const cameraRef = useRef<HTMLDivElement | null>(null);
    const row1Ref = useRef<HTMLDivElement | null>(null);
    const row3Ref = useRef<HTMLDivElement | null>(null);

    const topCharRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const middleCharRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const botExitRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const botEnterRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const botOrbitRefs = useRef<(HTMLSpanElement | null)[]>([]);

    const rowSpanRef = useRef<number>(195);
    const rowHeightRef = useRef<number>(95);
    const elapsedRef = useRef<number>(0);
    const lastFrameTimeRef = useRef<number | null>(null);

    useEffect(() => {
      const measure = () => {
        const r1 = row1Ref.current;
        const r3 = row3Ref.current;
        if (!r1 || !r3) return;
        const dist = r3.offsetTop - r1.offsetTop;
        if (dist > 20) {
          rowSpanRef.current = dist;
        }
        if (r1.offsetHeight > 10) {
          rowHeightRef.current = r1.offsetHeight;
        }
      };

      measure();
      const target = frameRef.current;
      if (!target || typeof ResizeObserver === "undefined") return;
      const ro = new ResizeObserver(measure);
      ro.observe(target);
      return () => ro.disconnect();
    }, [topChars.length, bottomChars.length, layout]);

    const applyTransforms = useCallback(
      (progress: number) => {
        const span = rowSpanRef.current;
        const rowH = rowHeightRef.current;
        const halfSpan = span * 0.5;
        const orbitRadius = span * 0.58;

        const p = ((progress % 1) + 1) % 1;

        if (cameraRef.current) {
          let camScale = 1;
          if (cameraZoom) {
            if (p < 0.10) {
              camScale = 1;
            } else if (p < 0.24) {
              const t = easeInOutSine((p - 0.10) / 0.14);
              camScale = 1 - 0.19 * t;
            } else if (p < 0.88) {
              camScale = 0.81;
            } else if (p < 0.98) {
              const t = easeInOutSine((p - 0.88) / 0.10);
              camScale = 0.81 + 0.19 * t;
            } else {
              camScale = 1;
            }
          }
          cameraRef.current.style.transform = `scale(${camScale.toFixed(4)})`;
        }

        const topDenom = Math.max(1, topChars.length - 1);
        const botDenom = Math.max(1, bottomChars.length - 1);
        const midDenom = Math.max(1, middleChars.length - 1);

        // --- TOP WORD (unclipped vertical drop Row 1 -> Row 3, then 3D X-axis cylinder return) ---
        for (let i = 0; i < topChars.length; i++) {
          const el = topCharRefs.current[i];
          if (!el) continue;
          const norm = topChars.length === 1 ? 0 : i / topDenom;

          if (p < 0.14 || p >= 0.94) {
            el.style.transform = "translate3d(0px, 0px, 0px) rotateX(0deg)";
          } else if (p < 0.48) {
            const phaseP = (p - 0.14) / 0.34;
            const staggerSpan = 0.46;
            const localT = clamp01((phaseP - norm * staggerSpan) / (1 - staggerSpan));
            const eased = easeInOutCubic(localT);
            const y = eased * span;
            el.style.transform = `translate3d(0px, ${y.toFixed(2)}px, 0px) rotateX(0deg)`;
          } else if (p < 0.64) {
            el.style.transform = `translate3d(0px, ${span.toFixed(2)}px, 0px) rotateX(0deg)`;
          } else {
            const phaseP = (p - 0.64) / 0.30;
            const staggerSpan = 0.36;
            const localT = clamp01((phaseP - norm * staggerSpan) / (1 - staggerSpan));
            const eased = easeInOutQuart(localT);
            const theta = eased * Math.PI;
            const sinT = Math.sin(theta);
            const cosT = Math.cos(theta);

            const tiltDeg =
              theta < Math.PI / 2
                ? -(theta * 180) / Math.PI
                : 180 - (theta * 180) / Math.PI;

            const y = halfSpan * (1 + cosT);
            const z = -orbitRadius * sinT;
            el.style.transform = `translate3d(0px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateX(${tiltDeg.toFixed(2)}deg)`;
          }
        }

        // --- BOTTOM WORD (slit-masked upward wipe Row 3 -> Row 1, then 3D X-axis cylinder return) ---
        for (let i = 0; i < bottomChars.length; i++) {
          const exitEl = botExitRefs.current[i];
          const enterEl = botEnterRefs.current[i];
          const orbitEl = botOrbitRefs.current[i];
          const norm = bottomChars.length === 1 ? 0 : i / botDenom;

          if (p < 0.14 || p >= 0.94) {
            if (exitEl) {
              exitEl.style.opacity = "1";
              exitEl.style.transform = "translate3d(0px, 0px, 0px)";
            }
            if (enterEl) {
              enterEl.style.opacity = "0";
              enterEl.style.transform = `translate3d(0px, ${(rowH * 1.15).toFixed(2)}px, 0px)`;
            }
            if (orbitEl) {
              orbitEl.style.opacity = "0";
              orbitEl.style.transform = "translate3d(0px, 0px, 0px) rotateX(0deg)";
            }
          } else if (p < 0.48) {
            const phaseP = (p - 0.14) / 0.34;
            const staggerSpan = 0.46;
            const localT = clamp01((phaseP - norm * staggerSpan) / (1 - staggerSpan));
            const eased = easeInOutCubic(localT);

            const exitT = clamp01(eased * 1.35);
            const enterT = clamp01((eased - 0.22) / 0.78);
            const exitEased = easeInOutCubic(exitT);
            const enterEased = easeInOutCubic(enterT);

            if (exitEl) {
              exitEl.style.opacity = exitT >= 0.99 ? "0" : "1";
              exitEl.style.transform = `translate3d(0px, ${(-exitEased * rowH * 1.15).toFixed(2)}px, 0px)`;
            }
            if (enterEl) {
              enterEl.style.opacity = enterT <= 0.01 ? "0" : "1";
              enterEl.style.transform = `translate3d(0px, ${((1 - enterEased) * rowH * 1.15).toFixed(2)}px, 0px)`;
            }
            if (orbitEl) {
              orbitEl.style.opacity = "0";
            }
          } else if (p < 0.64) {
            if (exitEl) exitEl.style.opacity = "0";
            if (enterEl) {
              enterEl.style.opacity = "0";
              enterEl.style.transform = "translate3d(0px, 0px, 0px)";
            }
            if (orbitEl) {
              orbitEl.style.opacity = "1";
              orbitEl.style.transform = `translate3d(0px, ${(-span).toFixed(2)}px, 0px) rotateX(0deg)`;
            }
          } else {
            if (exitEl) exitEl.style.opacity = "0";
            if (enterEl) enterEl.style.opacity = "0";
            if (orbitEl) {
              const phaseP = (p - 0.64) / 0.30;
              const staggerSpan = 0.36;
              const localT = clamp01((phaseP - norm * staggerSpan) / (1 - staggerSpan));
              const eased = easeInOutQuart(localT);
              const theta = eased * Math.PI;
              const sinT = Math.sin(theta);
              const cosT = Math.cos(theta);

              const tiltDeg =
                theta < Math.PI / 2
                  ? -(theta * 180) / Math.PI
                  : 180 - (theta * 180) / Math.PI;

              const y = -halfSpan * (1 + cosT);
              const z = orbitRadius * sinT;
              orbitEl.style.opacity = "1";
              orbitEl.style.transform = `translate3d(0px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateX(${tiltDeg.toFixed(2)}deg)`;
            }
          }
        }

        // --- CENTER WORD (flips in-place along the center horizon during Phase 4) ---
        for (let i = 0; i < middleChars.length; i++) {
          const el = middleCharRefs.current[i];
          if (!el) continue;

          if (p >= 0.64 && p < 0.94) {
            const norm =
              middleChars.length === 1 ? 0.5 : 0.36 + (i / midDenom) * 0.28;
            const phaseP = (p - 0.64) / 0.30;
            const staggerSpan = 0.36;
            const localT = clamp01((phaseP - norm * staggerSpan) / (1 - staggerSpan));
            const eased = easeInOutQuart(localT);
            const theta = eased * Math.PI;
            const tiltDeg =
              theta < Math.PI / 2
                ? -(theta * 180) / Math.PI
                : 180 - (theta * 180) / Math.PI;

            el.style.transform = `translate3d(0px, 0px, 0px) rotateX(${tiltDeg.toFixed(2)}deg)`;
          } else {
            el.style.transform = "translate3d(0px, 0px, 0px) rotateX(0deg)";
          }
        }
      },
      [topChars.length, middleChars.length, bottomChars.length, cameraZoom]
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

    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
      handleToggle();
      onClick?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        handleToggle();
      }
      onKeyDown?.(e);
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
      setIsHovered(true);
      onMouseEnter?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
      setIsHovered(false);
      onMouseLeave?.(e);
    };

    const themeClasses =
      theme === "dark"
        ? "bg-black text-white"
        : theme === "light"
          ? "bg-white text-black"
          : "bg-white text-black dark:bg-black dark:text-white";

    const posterBorderClasses =
      layout === "poster"
        ? theme === "light"
          ? "border border-black/10"
          : theme === "auto"
            ? "border border-black/10 dark:border-transparent"
            : ""
        : "";

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

    const isSection = layout === "section";

    return (
      <section
        ref={ref}
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
          fontFamily:
            '"Helvetica Neue", "Neue Haas Grotesk", "Inter", "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
        }}
        className={cn(
          "relative overflow-hidden select-none transition-colors duration-300 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset",
          isSection
            ? "flex min-h-[100dvh] w-full items-center justify-center px-4 py-6 sm:px-8 sm:py-10"
            : "w-full max-w-[540px] aspect-square",
          themeClasses,
          posterBorderClasses,
          focusRingClasses,
          className
        )}
        {...props}
      >
        {/* Accessible screen-reader summary */}
        <h2 id={`${safeId}-title`} className="sr-only">
          {`${topWord} ${middleWord} ${bottomWord}`}
        </h2>
        <span id={`${safeId}-desc`} className="sr-only">
          {prefersReducedMotion
            ? "Press Enter or Space to toggle swapped headline arrangement."
            : isPausedState
              ? "Animation paused. Press Enter or Space to resume."
              : "Animated kinetic typography hero. Press Enter or Space to pause."}
        </span>

        {/* Proportional Swiss Square Stage — fills poster mode 100%, or scales fluidly up to min(92vw, 88dvh, 760px) inside full-screen section mode */}
        <div
          ref={frameRef}
          style={{ containerType: "inline-size" }}
          className={cn(
            "relative aspect-square overflow-visible",
            isSection
              ? "w-full max-w-[min(92vw,88dvh,760px)]"
              : "h-full w-full"
          )}
        >
          {/* Camera Zoom Wrapper — reproduces the reference's full-bleed -> framed gallery zoom breath */}
          <div
            ref={cameraRef}
            className="relative h-full w-full will-change-transform"
            style={{ transformOrigin: "50% 50%" }}
          >
            {/* Top Editorial Subtitle — stark negative space below */}
            {subtitle && (
              <header
                className="absolute inset-x-[4%] top-[3%] text-center font-normal tracking-[-0.01em] opacity-95"
                style={{ fontSize: "2.1cqw", lineHeight: 1.2 }}
              >
                {subtitle}
              </header>
            )}

            {/* Main 3-Row Kinetic Lockup with Dramatic 3D Perspective Stage */}
            <div
              className="absolute inset-x-[2.8%] bottom-[3.2%] flex flex-col justify-between"
              style={{
                perspective: "420px",
                transformStyle: "preserve-3d",
                gap: "1.3cqw",
              }}
            >
              {/* Row 1: Top Word (Unclipped drop layer + Slit-masked incoming bottomWord layer) */}
              <div
                ref={row1Ref}
                aria-hidden="true"
                className="relative flex w-full items-center justify-between font-normal uppercase leading-[0.82] tracking-[-0.045em]"
                style={{
                  fontSize: displayFontSize,
                  transformStyle: "preserve-3d",
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0 flex w-full items-center justify-between overflow-hidden"
                  style={{ zIndex: 10 }}
                >
                  {bottomChars.map((char, i) => (
                    <span
                      key={`bot-enter-${i}-${char}`}
                      ref={(el) => {
                        botEnterRefs.current[i] = el;
                      }}
                      className="inline-block will-change-transform"
                      style={{ opacity: 0 }}
                    >
                      {char === " " ? "\u00A0" : char}
                    </span>
                  ))}
                </div>

                {topChars.map((char, i) => (
                  <span
                    key={`top-${i}-${char}`}
                    ref={(el) => {
                      topCharRefs.current[i] = el;
                    }}
                    className="relative inline-block will-change-transform"
                    style={{
                      zIndex: 20,
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
                style={{ transformStyle: "preserve-3d", zIndex: 15 }}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute -top-[0.4cqw] left-[0.1cqw]",
                    markerBgClasses
                  )}
                  style={{ width: "1.35cqw", height: "1.35cqw" }}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute -top-[0.4cqw] right-[0.1cqw]",
                    markerBgClasses
                  )}
                  style={{ width: "1.35cqw", height: "1.35cqw" }}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute -bottom-[0.4cqw] left-[0.1cqw]",
                    markerBgClasses
                  )}
                  style={{ width: "1.35cqw", height: "1.35cqw" }}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute -bottom-[0.4cqw] right-[0.1cqw]",
                    markerBgClasses
                  )}
                  style={{ width: "1.35cqw", height: "1.35cqw" }}
                />

                {/* Left Metadata Block */}
                <div
                  className="flex flex-col items-center justify-center pr-[1.5cqw] text-center font-normal tabular-nums tracking-[-0.01em] opacity-95"
                  style={{ fontSize: "2.15cqw", lineHeight: 1.24 }}
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
                  className="flex items-center justify-center font-normal uppercase leading-[0.82] tracking-[-0.045em]"
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

                {/* Right Metadata Block */}
                <div
                  className="flex flex-col items-center justify-center pl-[1.5cqw] text-center font-normal tabular-nums tracking-[-0.01em] opacity-95"
                  style={{ fontSize: "2.15cqw", lineHeight: 1.24 }}
                >
                  {rightMeta.map((line, idx) => (
                    <span key={`right-meta-${idx}`} className="block whitespace-nowrap">
                      {line}
                    </span>
                  ))}
                </div>
              </div>

              {/* Row 3: Bottom Word (Slit-masked exit layer + 3D orbiting return layer) */}
              <div
                ref={row3Ref}
                aria-hidden="true"
                className="relative flex w-full items-center justify-between font-normal uppercase leading-[0.82] tracking-[-0.045em]"
                style={{
                  fontSize: displayFontSize,
                  transformStyle: "preserve-3d",
                }}
              >
                <div
                  className="flex w-full items-center justify-between overflow-hidden"
                  style={{ zIndex: 10 }}
                >
                  {bottomChars.map((char, i) => (
                    <span
                      key={`bot-exit-${i}-${char}`}
                      ref={(el) => {
                        botExitRefs.current[i] = el;
                      }}
                      className="inline-block will-change-transform"
                    >
                      {char === " " ? "\u00A0" : char}
                    </span>
                  ))}
                </div>

                <div
                  className="pointer-events-none absolute inset-0 flex w-full items-center justify-between"
                  style={{ transformStyle: "preserve-3d", zIndex: 18 }}
                >
                  {bottomChars.map((char, i) => (
                    <span
                      key={`bot-orbit-${i}-${char}`}
                      ref={(el) => {
                        botOrbitRefs.current[i] = el;
                      }}
                      className="inline-block will-change-transform"
                      style={{
                        opacity: 0,
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
          </div>
        </div>
      </section>
    );
  }
);

KineticPosterTypography.displayName = "KineticPosterTypography";

export {
  KineticPosterTypography as component,
  KineticPosterTypography as Component,
};
export default KineticPosterTypography;
