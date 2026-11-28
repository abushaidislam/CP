"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type ApiKeysCardTheme = "auto" | "dark" | "light";

export interface ApiKeysCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Primary card heading */
  title?: string;
  /** Supporting description below the heading */
  description?: string;
  /** Monospace status text inside the center authentication pill */
  statusText?: string;
  /** Continuously animate without requiring hover or focus */
  autoPlay?: boolean;
  /** Controlled active state (overrides internal hover/toggle state when defined) */
  active?: boolean;
  /** Callback fired when active state changes */
  onActiveChange?: (active: boolean) => void;
  /** Color theme mode: auto follows Tailwind dark mode */
  theme?: ApiKeysCardTheme;
}

const SPINNER_SPOKES = Array.from({ length: 12 }, (_, i) => i);

const SERVER_LED_PATTERNS: Array<
  Array<{ delay: number; duration: number; peak: number }>
> = [
  [
    { delay: 0.0, duration: 1.5, peak: 0.95 },
    { delay: 0.4, duration: 1.9, peak: 0.85 },
    { delay: 0.9, duration: 1.4, peak: 0.5 },
    { delay: 0.2, duration: 1.7, peak: 0.9 },
    { delay: 0.7, duration: 1.3, peak: 0.95 },
    { delay: 0.1, duration: 2.1, peak: 0.75 },
    { delay: 0.5, duration: 1.6, peak: 0.85 },
    { delay: 1.1, duration: 1.8, peak: 0.6 },
    { delay: 0.3, duration: 1.4, peak: 1.0 },
  ],
  [
    { delay: 0.3, duration: 1.6, peak: 1.0 },
    { delay: 0.8, duration: 1.4, peak: 0.85 },
    { delay: 0.1, duration: 1.9, peak: 0.7 },
    { delay: 0.6, duration: 1.5, peak: 0.95 },
    { delay: 0.0, duration: 1.8, peak: 0.9 },
    { delay: 0.9, duration: 1.3, peak: 0.95 },
    { delay: 0.2, duration: 2.0, peak: 0.65 },
    { delay: 0.5, duration: 1.5, peak: 1.0 },
    { delay: 1.0, duration: 1.7, peak: 0.85 },
  ],
  [
    { delay: 0.5, duration: 1.8, peak: 0.8 },
    { delay: 0.1, duration: 1.5, peak: 0.9 },
    { delay: 0.7, duration: 2.0, peak: 0.55 },
    { delay: 0.3, duration: 1.4, peak: 0.85 },
    { delay: 0.9, duration: 1.7, peak: 0.75 },
    { delay: 0.2, duration: 1.6, peak: 0.9 },
    { delay: 0.8, duration: 1.9, peak: 0.6 },
    { delay: 0.4, duration: 1.3, peak: 0.85 },
    { delay: 0.0, duration: 1.8, peak: 0.7 },
  ],
];

const MATRIX_ACTIVE_CELLS: Array<
  Array<{ idx: number; color: "cyan" | "indigo"; delay: number; duration: number }>
> = [
  [
    { idx: 2, color: "cyan", delay: 0.1, duration: 1.6 },
    { idx: 6, color: "indigo", delay: 0.5, duration: 2.0 },
    { idx: 8, color: "cyan", delay: 0.9, duration: 1.4 },
    { idx: 12, color: "cyan", delay: 0.3, duration: 1.8 },
    { idx: 16, color: "indigo", delay: 0.7, duration: 1.5 },
    { idx: 18, color: "cyan", delay: 1.1, duration: 1.7 },
    { idx: 22, color: "cyan", delay: 0.4, duration: 1.9 },
  ],
  [
    { idx: 1, color: "indigo", delay: 0.2, duration: 1.7 },
    { idx: 7, color: "cyan", delay: 0.6, duration: 1.5 },
    { idx: 11, color: "cyan", delay: 0.0, duration: 1.9 },
    { idx: 13, color: "indigo", delay: 0.8, duration: 1.4 },
    { idx: 17, color: "cyan", delay: 0.4, duration: 1.6 },
    { idx: 21, color: "cyan", delay: 1.0, duration: 1.8 },
    { idx: 23, color: "indigo", delay: 0.3, duration: 2.1 },
  ],
  [
    { idx: 3, color: "cyan", delay: 0.4, duration: 1.9 },
    { idx: 7, color: "indigo", delay: 0.9, duration: 1.6 },
    { idx: 12, color: "cyan", delay: 0.2, duration: 1.7 },
    { idx: 15, color: "cyan", delay: 0.6, duration: 1.5 },
    { idx: 19, color: "indigo", delay: 1.0, duration: 1.8 },
    { idx: 22, color: "cyan", delay: 0.1, duration: 2.0 },
  ],
];

const VENT_SLITS = Array.from({ length: 22 }, (_, i) => i);
const MATRIX_CELLS = Array.from({ length: 25 }, (_, i) => i);

interface BusTraceProps {
  d: string;
  maskId: string;
  gradId: string;
  isActive: boolean;
  prefersReducedMotion: boolean;
  delay: number;
  duration: number;
  repeatDelay: number;
  isDarkTheme: boolean | null;
}

function BusTrace({
  d,
  maskId,
  gradId,
  isActive,
  prefersReducedMotion,
  delay,
  duration,
  repeatDelay,
  isDarkTheme,
}: BusTraceProps) {
  const pathRef = useRef<SVGPathElement | null>(null);
  const [totalLength, setTotalLength] = useState<number>(120);

  useEffect(() => {
    if (pathRef.current) {
      const len = pathRef.current.getTotalLength();
      if (Number.isFinite(len) && len > 0) {
        setTotalLength(Math.ceil(len));
      }
    }
  }, [d]);

  const pulseLength = 44;

  const baseStrokeClass =
    isDarkTheme === true
      ? "stroke-[#2f3039]"
      : isDarkTheme === false
        ? "stroke-[#d4d6e0]"
        : "stroke-[#d4d6e0] dark:stroke-[#2f3039]";

  return (
    <g>
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          {isActive && !prefersReducedMotion ? (
            <motion.path
              d={d}
              fill="none"
              stroke="white"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${pulseLength} ${totalLength + pulseLength + 40}`}
              initial={{ strokeDashoffset: pulseLength }}
              animate={{ strokeDashoffset: -(totalLength + 20) }}
              transition={{
                duration,
                delay,
                repeat: Infinity,
                repeatDelay,
                ease: [0.4, 0, 0.2, 1],
              }}
            />
          ) : isActive && prefersReducedMotion ? (
            <path
              d={d}
              fill="none"
              stroke="white"
              strokeWidth="6"
              strokeOpacity="0.65"
            />
          ) : null}
        </mask>
      </defs>

      {/* Base hairline */}
      <path
        ref={pathRef}
        d={d}
        fill="none"
        className={baseStrokeClass}
        strokeWidth="1"
        strokeLinecap="round"
      />

      {/* Luminous dotted pulse masked to this exact branch */}
      {isActive && (
        <path
          d={d}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeDasharray="1.4 4.4"
          mask={`url(#${maskId})`}
        />
      )}
    </g>
  );
}

interface ServerBladeProps {
  index: number;
  isActive: boolean;
  prefersReducedMotion: boolean;
  isDarkTheme: boolean | null;
}

function ServerBlade({
  index,
  isActive,
  prefersReducedMotion,
  isDarkTheme,
}: ServerBladeProps) {
  const ledPattern = SERVER_LED_PATTERNS[index % SERVER_LED_PATTERNS.length];
  const activeMatrixMap = useMemo(() => {
    const map = new Map<
      number,
      { color: "cyan" | "indigo"; delay: number; duration: number }
    >();
    const items = MATRIX_ACTIVE_CELLS[index % MATRIX_ACTIVE_CELLS.length];
    for (const item of items) {
      map.set(item.idx, {
        color: item.color,
        delay: item.delay,
        duration: item.duration,
      });
    }
    return map;
  }, [index]);

  const chassisClass =
    isDarkTheme === true
      ? "bg-gradient-to-b from-[#2f3038] to-[#23242b] border-[#15151a] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_12px_rgba(0,0,0,0.45)]"
      : isDarkTheme === false
        ? "bg-gradient-to-b from-[#ffffff] to-[#eceef4] border-[#d3d6e2] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_3px_10px_rgba(15,23,42,0.08)]"
        : "bg-gradient-to-b from-[#ffffff] to-[#eceef4] border-[#d3d6e2] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_3px_10px_rgba(15,23,42,0.08)] dark:from-[#2f3038] dark:to-[#23242b] dark:border-[#15151a] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_12px_rgba(0,0,0,0.45)]";

  const rivetClass =
    isDarkTheme === true
      ? "bg-[#15151a] shadow-[0_0.5px_0_rgba(255,255,255,0.08)]"
      : isDarkTheme === false
        ? "bg-[#c5c9d6] shadow-[0_0.5px_0_rgba(255,255,255,0.9)]"
        : "bg-[#c5c9d6] shadow-[0_0.5px_0_rgba(255,255,255,0.9)] dark:bg-[#15151a] dark:shadow-[0_0.5px_0_rgba(255,255,255,0.08)]";

  const dialOuterClass =
    isDarkTheme === true
      ? "bg-[#1b1c21] border-[#141418] shadow-[inset_0_1px_2px_rgba(0,0,0,0.7),0_1px_0_rgba(255,255,255,0.06)]"
      : isDarkTheme === false
        ? "bg-[#e3e6ef] border-[#cbd0de] shadow-[inset_0_1px_2px_rgba(15,23,42,0.12),0_1px_0_rgba(255,255,255,0.85)]"
        : "bg-[#e3e6ef] border-[#cbd0de] shadow-[inset_0_1px_2px_rgba(15,23,42,0.12),0_1px_0_rgba(255,255,255,0.85)] dark:bg-[#1b1c21] dark:border-[#141418] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.7),0_1px_0_rgba(255,255,255,0.06)]";

  const dialInnerClass =
    isDarkTheme === true
      ? "bg-[#26272e] border-[#383a45]/60"
      : isDarkTheme === false
        ? "bg-[#f6f7fa] border-[#d2d6e3]"
        : "bg-[#f6f7fa] border-[#d2d6e3] dark:bg-[#26272e] dark:border-[#383a45]/60";

  const ventClass =
    isDarkTheme === true
      ? "bg-[#15161b]"
      : isDarkTheme === false
        ? "bg-[#c8ccd8]"
        : "bg-[#c8ccd8] dark:bg-[#15161b]";

  const screenClass =
    isDarkTheme === true
      ? "bg-[#141419] border-[#0f0f13] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]"
      : isDarkTheme === false
        ? "bg-[#1e2230] border-[#cbd0de] shadow-[inset_0_1px_3px_rgba(0,0,0,0.35)]"
        : "bg-[#1e2230] border-[#cbd0de] shadow-[inset_0_1px_3px_rgba(0,0,0,0.35)] dark:bg-[#141419] dark:border-[#0f0f13] dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]";

  const ledOffClass =
    isDarkTheme === true
      ? "bg-[#1a1b22]"
      : isDarkTheme === false
        ? "bg-[#d4d8e3]"
        : "bg-[#d4d8e3] dark:bg-[#1a1b22]";

  return (
    <div
      className={cn(
        "relative flex h-[50px] w-[196px] sm:w-[252px] items-center justify-between rounded-[6px] border px-2 sm:px-2.5",
        chassisClass
      )}
    >
      {/* Left rack mount rivets */}
      <div className="flex flex-col justify-between h-[36px] mr-1.5">
        <span className={cn("h-[3.5px] w-[3.5px] rounded-full", rivetClass)} />
        <span className={cn("h-[3.5px] w-[3.5px] rounded-full", rivetClass)} />
      </div>

      {/* Circular recessed power/port ring */}
      <div
        className={cn(
          "flex h-[22px] w-[22px] sm:h-[24px] sm:w-[24px] shrink-0 items-center justify-center rounded-full border",
          dialOuterClass
        )}
      >
        <div
          className={cn(
            "h-[13px] w-[13px] sm:h-[15px] sm:w-[15px] rounded-full border",
            dialInnerClass
          )}
        />
      </div>

      {/* 3x3 Status LED Matrix */}
      <div className="ml-2 sm:ml-2.5 grid grid-cols-3 gap-x-[3.5px] sm:gap-x-[4px] gap-y-[3.5px] shrink-0">
        {ledPattern.map((led, ledIdx) => (
          <div
            key={ledIdx}
            className={cn(
              "relative h-[2.5px] w-[7px] sm:w-[8px] rounded-[1px] overflow-hidden",
              ledOffClass
            )}
          >
            {isActive && (
              <motion.span
                className="absolute inset-0 rounded-[1px] bg-[#67e8f9] shadow-[0_0_5px_rgba(56,189,248,0.85)]"
                initial={{ opacity: 0.15 }}
                animate={
                  prefersReducedMotion
                    ? { opacity: led.peak * 0.75 }
                    : { opacity: [0.15, led.peak, 0.2, led.peak * 0.7, 0.15] }
                }
                transition={
                  prefersReducedMotion
                    ? { duration: 0.2 }
                    : {
                        duration: led.duration,
                        delay: led.delay,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }
                }
              />
            )}
          </div>
        ))}
      </div>

      {/* Ventilation Grille */}
      <div className="mx-2 sm:mx-2.5 flex flex-1 items-center justify-center gap-[2px] overflow-hidden">
        {VENT_SLITS.map((slit) => (
          <span
            key={slit}
            className={cn("h-[13px] w-[1.8px] shrink-0 rounded-[0.5px]", ventClass)}
          />
        ))}
      </div>

      {/* 5x5 Telemetry Dot Matrix Screen */}
      <div
        className={cn(
          "grid h-[26px] w-[26px] sm:h-[28px] sm:w-[28px] shrink-0 grid-cols-5 grid-rows-5 gap-[2px] rounded-[4px] border p-[4px]",
          screenClass
        )}
      >
        {MATRIX_CELLS.map((cellIdx) => {
          const activeCell = activeMatrixMap.get(cellIdx);
          return (
            <div
              key={cellIdx}
              className="relative flex items-center justify-center"
            >
              <span className="h-[2px] w-[2px] rounded-full bg-white/[0.06]" />
              {isActive && activeCell && (
                <motion.span
                  className={cn(
                    "absolute h-[2.2px] w-[2.2px] rounded-full",
                    activeCell.color === "cyan"
                      ? "bg-[#67e8f9] shadow-[0_0_4px_rgba(103,232,249,0.9)]"
                      : "bg-[#818cf8] shadow-[0_0_4px_rgba(129,140,248,0.85)]"
                  )}
                  initial={{ opacity: 0.1 }}
                  animate={
                    prefersReducedMotion
                      ? { opacity: 0.8 }
                      : { opacity: [0.1, 1, 0.25, 0.85, 0.1] }
                  }
                  transition={
                    prefersReducedMotion
                      ? { duration: 0.2 }
                      : {
                          duration: activeCell.duration,
                          delay: activeCell.delay,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }
                  }
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Right rack mount rivets */}
      <div className="flex flex-col justify-between h-[36px] ml-1.5">
        <span className={cn("h-[3.5px] w-[3.5px] rounded-full", rivetClass)} />
        <span className={cn("h-[3.5px] w-[3.5px] rounded-full", rivetClass)} />
      </div>
    </div>
  );
}

export const ApiKeysCard = React.forwardRef<HTMLDivElement, ApiKeysCardProps>(
  (
    {
      title = "API Keys",
      description = "Give every user secure, production-ready API keys without building any of the underlying boilerplate code or UI.",
      statusText = "Authenticating...",
      autoPlay = false,
      active: controlledActive,
      onActiveChange,
      theme = "auto",
      className,
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
      onClick,
      onKeyDown,
      ...rest
    },
    ref
  ) => {
    const rawId = useId();
    const uid = rawId.replace(/:/g, "");
    const prefersReducedMotion = Boolean(useReducedMotion());

    const [isHovered, setIsHovered] = useState(false);
    const [isPinned, setIsPinned] = useState(false);

    const isControlled = controlledActive !== undefined;
    const isActive = isControlled
      ? controlledActive
      : autoPlay || isHovered || isPinned;

    const isDarkTheme: boolean | null =
      theme === "dark" ? true : theme === "light" ? false : null;

    const handleSetActive = (next: boolean) => {
      if (onActiveChange) {
        onActiveChange(next);
      }
    };

    const cardSurfaceClass =
      isDarkTheme === true
        ? "bg-[#212126] border-[#2e2e36] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_40px_rgba(0,0,0,0.45)]"
        : isDarkTheme === false
          ? "bg-[#f8f9fc] border-[#e2e5ef] text-[#0f172a] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_32px_rgba(15,23,42,0.07)]"
          : "bg-[#f8f9fc] border-[#e2e5ef] text-[#0f172a] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_32px_rgba(15,23,42,0.07)] dark:bg-[#212126] dark:border-[#2e2e36] dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_40px_rgba(0,0,0,0.45)]";

    const descClass =
      isDarkTheme === true
        ? "text-[#9394a1]"
        : isDarkTheme === false
          ? "text-[#575c6e]"
          : "text-[#575c6e] dark:text-[#9394a1]";

    const pillWellClass =
      isDarkTheme === true
        ? "bg-[#17171c] border-white/[0.04] shadow-[inset_0_2px_5px_rgba(0,0,0,0.65)]"
        : isDarkTheme === false
          ? "bg-[#eaedf5] border-[#d6dae6] shadow-[inset_0_2px_4px_rgba(15,23,42,0.08)]"
          : "bg-[#eaedf5] border-[#d6dae6] shadow-[inset_0_2px_4px_rgba(15,23,42,0.08)] dark:bg-[#17171c] dark:border-white/[0.04] dark:shadow-[inset_0_2px_5px_rgba(0,0,0,0.65)]";

    const pillInnerClass =
      isDarkTheme === true
        ? "bg-gradient-to-b from-[#34353e] to-[#292a31] border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_6px_rgba(0,0,0,0.45)]"
        : isDarkTheme === false
          ? "bg-gradient-to-b from-[#ffffff] to-[#f2f4f9] border-[#d2d6e3] shadow-[inset_0_1px_0_rgba(255,255,255,1),0_2px_6px_rgba(15,23,42,0.08)]"
          : "bg-gradient-to-b from-[#ffffff] to-[#f2f4f9] border-[#d2d6e3] shadow-[inset_0_1px_0_rgba(255,255,255,1),0_2px_6px_rgba(15,23,42,0.08)] dark:from-[#34353e] dark:to-[#292a31] dark:border-white/[0.08] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_6px_rgba(0,0,0,0.45)]";

    const pillTextClass = isActive
      ? isDarkTheme === true
        ? "text-[#ededf2]"
        : isDarkTheme === false
          ? "text-[#0f172a]"
          : "text-[#0f172a] dark:text-[#ededf2]"
      : isDarkTheme === true
        ? "text-[#7d7f8c]"
        : isDarkTheme === false
          ? "text-[#646b7d]"
          : "text-[#646b7d] dark:text-[#7d7f8c]";

    const spokeColorClass =
      isDarkTheme === true
        ? "bg-[#e4e4ec]"
        : isDarkTheme === false
          ? "bg-[#334155]"
          : "bg-[#334155] dark:bg-[#e4e4ec]";

    const laptopLidFrameClass =
      isDarkTheme === true
        ? "bg-[#17171c] border-[#444652] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
        : isDarkTheme === false
          ? "bg-[#1a1c24] border-[#b4b9c9] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
          : "bg-[#1a1c24] border-[#b4b9c9] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] dark:bg-[#17171c] dark:border-[#444652] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]";

    const laptopBaseClass =
      isDarkTheme === true
        ? "bg-gradient-to-b from-[#6e707d] via-[#50525e] to-[#3a3b45] shadow-[0_8px_18px_rgba(0,0,0,0.55)]"
        : isDarkTheme === false
          ? "bg-gradient-to-b from-[#d9dde8] via-[#c2c7d6] to-[#a9b0c2] shadow-[0_8px_16px_rgba(15,23,42,0.14)]"
          : "bg-gradient-to-b from-[#d9dde8] via-[#c2c7d6] to-[#a9b0c2] shadow-[0_8px_16px_rgba(15,23,42,0.14)] dark:from-[#6e707d] dark:via-[#50525e] dark:to-[#3a3b45] dark:shadow-[0_8px_18px_rgba(0,0,0,0.55)]";

    const laptopNotchClass =
      isDarkTheme === true
        ? "bg-[#3c3d47]"
        : isDarkTheme === false
          ? "bg-[#9ea5b8]"
          : "bg-[#9ea5b8] dark:bg-[#3c3d47]";

    const bottomFadeClass =
      isDarkTheme === true
        ? "from-[#212126] via-[#212126]/65 to-transparent"
        : isDarkTheme === false
          ? "from-[#f8f9fc] via-[#f8f9fc]/65 to-transparent"
          : "from-[#f8f9fc] via-[#f8f9fc]/65 to-transparent dark:from-[#212126] dark:via-[#212126]/65 dark:to-transparent";

    const leftGradId = `${uid}-left-grad`;
    const rightGradId = `${uid}-right-grad`;

    return (
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        aria-pressed={isActive}
        aria-label={`${title}: ${isActive ? statusText : "Hover or press to preview authentication flow"}`}
        onMouseEnter={(e) => {
          setIsHovered(true);
          handleSetActive(true);
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          setIsHovered(false);
          if (!isPinned && !autoPlay) {
            handleSetActive(false);
          }
          onMouseLeave?.(e);
        }}
        onFocus={(e) => {
          setIsHovered(true);
          handleSetActive(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsHovered(false);
          if (!isPinned && !autoPlay) {
            handleSetActive(false);
          }
          onBlur?.(e);
        }}
        onClick={(e) => {
          if (!isControlled) {
            setIsPinned((prev) => {
              const next = !prev;
              handleSetActive(next || autoPlay);
              return next;
            });
          }
          onClick?.(e);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!isControlled) {
              setIsPinned((prev) => {
                const next = !prev;
                handleSetActive(next || autoPlay);
                return next;
              });
            }
          }
          onKeyDown?.(e);
        }}
        className={cn(
          "group relative w-full max-w-[840px] overflow-hidden rounded-2xl border select-none transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
          cardSurfaceClass,
          className
        )}
        {...rest}
      >
        {/* Header Copy */}
        <div className="relative z-10 px-6 pt-6 sm:px-7 sm:pt-7">
          <h3 className="text-[15px] sm:text-base font-semibold tracking-[-0.015em] leading-snug">
            {title}
          </h3>
          <p
            className={cn(
              "mt-2 max-w-[395px] text-[13.5px] sm:text-[14px] leading-[1.55]",
              descClass
            )}
          >
            {description}
          </p>
        </div>

        {/* Interactive Architecture Diagram */}
        <div className="relative z-0 mt-3 sm:mt-4 pl-4 pr-0 sm:px-6 pb-3 sm:pb-4">
          <div className="relative flex items-center justify-between h-[162px] -mr-10 sm:mr-0">
            {/* LEFT NODE: 3D Perspective Laptop */}
            <div className="relative flex flex-col items-center shrink-0 pt-2">
              <div
                className="relative w-[108px] sm:w-[158px] h-[70px] sm:h-[98px]"
                style={{ perspective: "760px" }}
              >
                <motion.div
                  className={cn(
                    "relative h-full w-full rounded-t-[8px] border-[1.5px] p-[3.5px] sm:p-[4px] overflow-hidden",
                    laptopLidFrameClass
                  )}
                  style={{
                    transformOrigin: "50% 100%",
                    transformStyle: "preserve-3d",
                  }}
                  initial={false}
                  animate={{
                    rotateX: isActive ? 0 : -74,
                    opacity: isActive ? 1 : 0.92,
                  }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0.15 }
                      : {
                          type: "spring",
                          stiffness: 210,
                          damping: 26,
                          mass: 0.9,
                        }
                  }
                >
                  {/* Screen Glass */}
                  <div className="relative h-full w-full rounded-[4px] bg-[#1b1c22] overflow-hidden flex flex-col items-center justify-center">
                    {/* Subtle diagonal screen glass reflection */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -top-6 -right-6 h-[140%] w-[55%] rotate-[24deg] bg-white/[0.025]"
                    />

                    {/* Subtle User Avatar Silhouette */}
                    <motion.div
                      aria-hidden="true"
                      className="flex flex-col items-center mb-1.5"
                      initial={false}
                      animate={{ opacity: isActive ? 1 : 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="h-[11px] w-[11px] sm:h-[14px] sm:w-[14px] rounded-full bg-white/[0.045]" />
                      <div className="mt-[2px] h-[8px] w-[20px] sm:h-[10px] sm:w-[26px] rounded-t-full bg-white/[0.04]" />
                    </motion.div>

                    {/* Recessed Token Input Pill with Glowing Cyan Bar */}
                    <motion.div
                      aria-hidden="true"
                      className="relative h-[9px] w-[38px] sm:h-[11px] sm:w-[54px] rounded-full bg-[#101015] border border-white/[0.06] overflow-hidden flex items-center px-[3px]"
                      initial={false}
                      animate={{ opacity: isActive ? 1 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.div
                        className="h-[3px] sm:h-[3.5px] rounded-full bg-[#5eead4] shadow-[0_0_8px_rgba(56,189,248,0.9)]"
                        initial={{ width: "42%", x: 0 }}
                        animate={
                          isActive && !prefersReducedMotion
                            ? {
                                width: ["32%", "64%", "38%", "56%", "32%"],
                                x: [0, 6, 2, 8, 0],
                              }
                            : { width: "48%", x: 0 }
                        }
                        transition={
                          isActive && !prefersReducedMotion
                            ? {
                                duration: 2.0,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }
                            : { duration: 0.2 }
                        }
                      />
                    </motion.div>
                  </div>
                </motion.div>
              </div>

              {/* Machined Metallic Laptop Base Lip */}
              <div
                className={cn(
                  "relative z-10 h-[7px] sm:h-[9px] w-[124px] sm:w-[178px] rounded-b-[6px] rounded-t-[1.5px] flex items-start justify-center",
                  laptopBaseClass
                )}
              >
                {/* Front thumb indent notch */}
                <div
                  className={cn(
                    "h-[2.5px] sm:h-[3px] w-[20px] sm:w-[24px] rounded-b-[3px]",
                    laptopNotchClass
                  )}
                />
              </div>
            </div>

            {/* LEFT DATA BUS: Laptop -> Authenticating Pill */}
            <div className="relative flex-1 min-w-[20px] h-[24px] -mx-[2px] -mt-1">
              <svg
                viewBox="0 0 120 24"
                preserveAspectRatio="none"
                className="h-full w-full overflow-visible"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient
                    id={leftGradId}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                    <stop offset="45%" stopColor="#818cf8" stopOpacity="0.9" />
                    <stop offset="85%" stopColor="#38bdf8" stopOpacity="1" />
                    <stop offset="100%" stopColor="#a5f3fc" stopOpacity="1" />
                  </linearGradient>
                </defs>
                <BusTrace
                  d="M 0 12 L 120 12"
                  maskId={`${uid}-left-mask`}
                  gradId={leftGradId}
                  isActive={isActive}
                  prefersReducedMotion={prefersReducedMotion}
                  delay={0}
                  duration={0.85}
                  repeatDelay={1.15}
                  isDarkTheme={isDarkTheme}
                />
              </svg>
            </div>

            {/* CENTER NODE: Recessed Authenticating Status Pill */}
            <div
              className={cn(
                "relative z-10 shrink-0 rounded-[12px] border p-[4px] -mt-1",
                pillWellClass
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-2 sm:gap-3 rounded-[8px] border px-3 sm:px-5 py-2 sm:py-2.5 transition-colors duration-300",
                  pillInnerClass
                )}
              >
                {/* 12-Spoke Segmented Radial Activity Spinner */}
                <motion.div
                  aria-hidden="true"
                  className="relative h-[15px] w-[15px] sm:h-[18px] sm:w-[18px] shrink-0"
                  animate={
                    isActive && !prefersReducedMotion
                      ? { rotate: 360 }
                      : { rotate: 0 }
                  }
                  transition={
                    isActive && !prefersReducedMotion
                      ? {
                          duration: 1.1,
                          repeat: Infinity,
                          ease: "linear",
                        }
                      : { duration: 0.2 }
                  }
                >
                  {SPINNER_SPOKES.map((spoke) => {
                    const opacity = isActive
                      ? 0.2 + (spoke / 11) * 0.8
                      : 0.12 + (spoke / 11) * 0.35;
                    return (
                      <span
                        key={spoke}
                        className="absolute inset-0 flex justify-center"
                        style={{ transform: `rotate(${spoke * 30}deg)` }}
                      >
                        <span
                          className={cn(
                            "h-[3.8px] sm:h-[4.2px] w-[1.5px] sm:w-[1.6px] rounded-full transition-opacity duration-300",
                            spokeColorClass
                          )}
                          style={{ opacity }}
                        />
                      </span>
                    );
                  })}
                </motion.div>

                <span
                  className={cn(
                    "font-mono tabular-nums text-[11px] sm:text-[13px] tracking-[0.02em] whitespace-nowrap transition-colors duration-300",
                    pillTextClass
                  )}
                >
                  {statusText}
                </span>
              </div>
            </div>

            {/* RIGHT 3-BRANCH DATA BUS: Pill -> 3U Server Rack */}
            <div className="relative w-[40px] sm:w-[76px] h-[162px] shrink-0 -mx-[2px]">
              <svg
                viewBox="0 0 76 162"
                preserveAspectRatio="none"
                className="h-full w-full overflow-visible"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient
                    id={rightGradId}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                    <stop offset="50%" stopColor="#818cf8" stopOpacity="0.9" />
                    <stop offset="85%" stopColor="#38bdf8" stopOpacity="1" />
                    <stop offset="100%" stopColor="#a5f3fc" stopOpacity="1" />
                  </linearGradient>
                </defs>

                {/* Top branch -> Server Blade 1 exact center (y = 25) */}
                <BusTrace
                  d="M 0 71 L 34 71 Q 42 71 47 63 L 58 33 Q 62 25 70 25 L 76 25"
                  maskId={`${uid}-right-top-mask`}
                  gradId={rightGradId}
                  isActive={isActive}
                  prefersReducedMotion={prefersReducedMotion}
                  delay={0.85}
                  duration={0.85}
                  repeatDelay={1.15}
                  isDarkTheme={isDarkTheme}
                />

                {/* Middle branch -> Server Blade 2 exact center (y = 81) */}
                <BusTrace
                  d="M 0 77 L 26 77 Q 34 77 39 79 L 44 80 Q 49 81 57 81 L 76 81"
                  maskId={`${uid}-right-mid-mask`}
                  gradId={rightGradId}
                  isActive={isActive}
                  prefersReducedMotion={prefersReducedMotion}
                  delay={0.85}
                  duration={0.85}
                  repeatDelay={1.15}
                  isDarkTheme={isDarkTheme}
                />

                {/* Bottom branch -> Server Blade 3 exact center (y = 137) */}
                <BusTrace
                  d="M 0 83 L 18 83 Q 26 83 31 90 L 54 130 Q 59 137 67 137 L 76 137"
                  maskId={`${uid}-right-bot-mask`}
                  gradId={rightGradId}
                  isActive={isActive}
                  prefersReducedMotion={prefersReducedMotion}
                  delay={0.85}
                  duration={0.85}
                  repeatDelay={1.15}
                  isDarkTheme={isDarkTheme}
                />
              </svg>
            </div>

            {/* RIGHT NODE: Stacked 3U Server Rack */}
            <div className="relative flex flex-col gap-[6px] shrink-0">
              {[0, 1, 2].map((bladeIdx) => (
                <ServerBlade
                  key={bladeIdx}
                  index={bladeIdx}
                  isActive={isActive}
                  prefersReducedMotion={prefersReducedMotion}
                  isDarkTheme={isDarkTheme}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Subtle bottom vignette fade over lower edge of 3rd server blade */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t",
            bottomFadeClass
          )}
        />
      </div>
    );
  }
);

ApiKeysCard.displayName = "ApiKeysCard";

export { ApiKeysCard as component, ApiKeysCard as Component };
export default ApiKeysCard;