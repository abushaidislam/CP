"use client";

import React, { useId, useMemo, useRef, useState, useEffect } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(" ");
}

export type MatrixChevronAccent = "lime" | "amber" | "cyan" | "coral";
export type MatrixChevronSize = "sm" | "md" | "lg";

export interface MatrixChevronButtonProps
  extends Omit<HTMLMotionProps<"button">, "children" | "className"> {
  /** Primary button label displayed in the resting state. */
  label?: string;
  /** Accent color preset for the tactile expanding pill. */
  accent?: MatrixChevronAccent;
  /** Size preset scaling height, pill width, chevron matrix, and typography. */
  size?: MatrixChevronSize;
  /** Duration in seconds for one full left-to-right dot-matrix wave cycle. */
  waveSpeed?: number;
  /** Optional controlled expanded state (overrides internal hover/focus state). */
  expanded?: boolean;
  /** Optional custom classes merged onto the button element. */
  className?: string;
}

interface AccentPalette {
  pillGradient: string;
  pillInnerShadow: string;
  dotActive: string;
  dotMid: string;
  dotDimFill: string;
  dotDimStroke: string;
  dotGlow: string;
  ambientGlowDark: string;
  focusRing: string;
}

const ACCENT_PALETTES: Record<MatrixChevronAccent, AccentPalette> = {
  lime: {
    pillGradient:
      "linear-gradient(180deg, #e7ff72 0%, #d8fd35 46%, #d2fe00 100%)",
    pillInnerShadow:
      "inset 0 1.5px 1px rgba(255, 255, 255, 0.8), inset 0 -1.5px 1.5px rgba(120, 152, 0, 0.35), inset 1px 0 1px rgba(255, 255, 255, 0.35), inset -1px 0 1px rgba(255, 255, 255, 0.35)",
    dotActive: "#1a2016",
    dotMid: "#5b7119",
    dotDimFill: "#d6fe28",
    dotDimStroke: "rgba(26, 32, 22, 0.36)",
    dotGlow: "rgba(255, 255, 255, 0.42)",
    ambientGlowDark: "rgba(210, 254, 0, 0.22)",
    focusRing: "focus-visible:ring-[#d2fe00]/70",
  },
  amber: {
    pillGradient:
      "linear-gradient(180deg, #ffe27a 0%, #ffc426 48%, #ffaa00 100%)",
    pillInnerShadow:
      "inset 0 1.5px 1px rgba(255, 255, 255, 0.8), inset 0 -1.5px 1.5px rgba(168, 96, 0, 0.35), inset 1px 0 1px rgba(255, 255, 255, 0.35), inset -1px 0 1px rgba(255, 255, 255, 0.35)",
    dotActive: "#23190b",
    dotMid: "#82560c",
    dotDimFill: "#ffbe1f",
    dotDimStroke: "rgba(35, 25, 11, 0.34)",
    dotGlow: "rgba(255, 255, 255, 0.42)",
    ambientGlowDark: "rgba(255, 176, 0, 0.24)",
    focusRing: "focus-visible:ring-[#ffb800]/70",
  },
  cyan: {
    pillGradient:
      "linear-gradient(180deg, #8ef8ff 0%, #3ce9ff 48%, #00d9f5 100%)",
    pillInnerShadow:
      "inset 0 1.5px 1px rgba(255, 255, 255, 0.82), inset 0 -1.5px 1.5px rgba(0, 125, 150, 0.35), inset 1px 0 1px rgba(255, 255, 255, 0.35), inset -1px 0 1px rgba(255, 255, 255, 0.35)",
    dotActive: "#0b1e26",
    dotMid: "#126072",
    dotDimFill: "#2be4fc",
    dotDimStroke: "rgba(11, 30, 38, 0.34)",
    dotGlow: "rgba(255, 255, 255, 0.45)",
    ambientGlowDark: "rgba(0, 217, 245, 0.24)",
    focusRing: "focus-visible:ring-[#00d9f5]/70",
  },
  coral: {
    pillGradient:
      "linear-gradient(180deg, #ff9d7e 0%, #ff744d 48%, #ff572c 100%)",
    pillInnerShadow:
      "inset 0 1.5px 1px rgba(255, 255, 255, 0.72), inset 0 -1.5px 1.5px rgba(156, 36, 10, 0.38), inset 1px 0 1px rgba(255, 255, 255, 0.3), inset -1px 0 1px rgba(255, 255, 255, 0.3)",
    dotActive: "#260f0a",
    dotMid: "#7d2914",
    dotDimFill: "#ff6e47",
    dotDimStroke: "rgba(38, 15, 10, 0.36)",
    dotGlow: "rgba(255, 255, 255, 0.36)",
    ambientGlowDark: "rgba(255, 87, 44, 0.26)",
    focusRing: "focus-visible:ring-[#ff6a42]/70",
  },
};

interface SizeMetrics {
  height: number;
  inset: number;
  outerRadius: number;
  innerRadius: number;
  idlePillWidth: number;
  chevronWidth: number;
  chevronHeight: number;
  chevronGap: number;
  textPaddingLeft: number;
  textPaddingRight: number;
  fontSizeClass: string;
}

const SIZE_METRICS: Record<MatrixChevronSize, SizeMetrics> = {
  sm: {
    height: 48,
    inset: 3,
    outerRadius: 12,
    innerRadius: 9,
    idlePillWidth: 58,
    chevronWidth: 13.5,
    chevronHeight: 17,
    chevronGap: 10,
    textPaddingLeft: 76,
    textPaddingRight: 20,
    fontSizeClass: "text-[14px]",
  },
  md: {
    height: 58,
    inset: 3.5,
    outerRadius: 14,
    innerRadius: 10.5,
    idlePillWidth: 70,
    chevronWidth: 16,
    chevronHeight: 20,
    chevronGap: 12,
    textPaddingLeft: 92,
    textPaddingRight: 24,
    fontSizeClass: "text-[17px]",
  },
  lg: {
    height: 68,
    inset: 4,
    outerRadius: 16,
    innerRadius: 12,
    idlePillWidth: 82,
    chevronWidth: 19,
    chevronHeight: 23.5,
    chevronGap: 14,
    textPaddingLeft: 108,
    textPaddingRight: 28,
    fontSizeClass: "text-[19px]",
  },
};

// 10-dot chevron matrix on a 4-column x 5-row grid (matches reference geometry)
const CHEVRON_DOTS: ReadonlyArray<{ col: number; row: number }> = [
  { col: 0, row: 0 },
  { col: 1, row: 0 },
  { col: 1, row: 1 },
  { col: 2, row: 1 },
  { col: 2, row: 2 },
  { col: 3, row: 2 },
  { col: 1, row: 3 },
  { col: 2, row: 3 },
  { col: 0, row: 4 },
  { col: 1, row: 4 },
];

const EXPAND_TRANSITION = {
  type: "spring" as const,
  stiffness: 320,
  damping: 32,
  mass: 0.85,
};

export const MatrixChevronButton = React.forwardRef<
  HTMLButtonElement,
  MatrixChevronButtonProps
>(function MatrixChevronButton(
  {
    label = "Book a demo",
    accent = "lime",
    size = "md",
    waveSpeed = 1.6,
    expanded: controlledExpanded,
    disabled = false,
    className,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    type = "button",
    ...rest
  },
  forwardedRef
) {
  const rawId = useId();
  const safeId = useMemo(() => rawId.replace(/[^a-zA-Z0-9_-]/g, ""), [rawId]);
  const prefersReducedMotion = useReducedMotion();

  const innerRef = useRef<HTMLButtonElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [buttonWidth, setButtonWidth] = useState<number>(0);

  const palette = ACCENT_PALETTES[accent] ?? ACCENT_PALETTES.lime;
  const metrics = SIZE_METRICS[size] ?? SIZE_METRICS.md;
  const clampedWaveSpeed = Number.isFinite(waveSpeed)
    ? Math.min(Math.max(waveSpeed, 0.5), 5)
    : 1.6;

  useEffect(() => {
    const node = innerRef.current;
    if (!node) return;

    const updateWidth = () => {
      const nextWidth = node.getBoundingClientRect().width;
      if (nextWidth > 0) setButtonWidth(nextWidth);
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);
    return () => observer.disconnect();
  }, [label, size]);

  const setRefs = (node: HTMLButtonElement | null) => {
    innerRef.current = node;
    if (typeof forwardedRef === "function") {
      forwardedRef(node);
    } else if (forwardedRef) {
      forwardedRef.current = node;
    }
  };

  const isExpanded =
    !disabled &&
    (controlledExpanded !== undefined
      ? controlledExpanded
      : isHovered || isFocused);

  // Align Chevron #1 dead-center inside the idle left pill and fill any button width evenly
  const chevronPaddingLeft = (metrics.idlePillWidth - metrics.chevronWidth) / 2;
  const pitch = metrics.chevronWidth + metrics.chevronGap;
  const availableInnerWidth = Math.max(
    buttonWidth - metrics.inset * 2,
    metrics.idlePillWidth + pitch * 6
  );
  const chevronCount = Math.max(
    7,
    Math.floor(
      (availableInnerWidth - chevronPaddingLeft * 2 + metrics.chevronGap) /
        pitch
    )
  );

  const expandedWidth =
    buttonWidth > 0
      ? Math.max(metrics.idlePillWidth, buttonWidth - metrics.inset * 2)
      : "calc(100% - 7px)";

  const keyframesName = `mcb-wave-${safeId}`;

  return (
    <div className="relative isolate inline-flex items-center justify-center">
      {/* Scoped keyframes for zero-rerender 60fps dot-matrix traveling wave */}
      {!prefersReducedMotion && (
        <style>{`
          @keyframes ${keyframesName} {
            0%, 100% {
              fill: ${palette.dotActive};
              stroke: ${palette.dotActive};
              stroke-opacity: 0;
              opacity: 1;
            }
            18% {
              fill: ${palette.dotMid};
              stroke: ${palette.dotDimStroke};
              stroke-opacity: 0.4;
              opacity: 0.92;
            }
            42% {
              fill: ${palette.dotDimFill};
              stroke: ${palette.dotDimStroke};
              stroke-opacity: 0.95;
              opacity: 0.82;
            }
            68% {
              fill: ${palette.dotMid};
              stroke: ${palette.dotDimStroke};
              stroke-opacity: 0.35;
              opacity: 0.94;
            }
            88% {
              fill: ${palette.dotActive};
              stroke: ${palette.dotActive};
              stroke-opacity: 0;
              opacity: 1;
            }
          }
        `}</style>
      )}

      {/* Dynamic elevation shadow anchored to the expanding tactile pill */}
      <motion.span
        aria-hidden="true"
        initial={false}
        animate={{
          width: isExpanded ? expandedWidth : metrics.idlePillWidth,
          opacity: disabled ? 0.2 : 1,
        }}
        transition={
          prefersReducedMotion ? { duration: 0 } : EXPAND_TRANSITION
        }
        style={{
          left: metrics.inset,
          bottom: 2,
          height: Math.round(metrics.height * 0.55),
          borderRadius: metrics.innerRadius,
          ["--mcb-glow-dark" as string]: palette.ambientGlowDark,
        }}
        className={cn(
          "pointer-events-none absolute z-0",
          "shadow-[0_14px_24px_-4px_rgba(15,23,42,0.34),0_6px_12px_-3px_rgba(15,23,42,0.2)]",
          "dark:shadow-[0_14px_28px_-4px_var(--mcb-glow-dark),0_8px_16px_-4px_rgba(0,0,0,0.65)]"
        )}
      />

      <motion.button
        ref={setRefs}
        type={type}
        disabled={disabled}
        aria-label={label}
        whileTap={
          disabled || prefersReducedMotion ? undefined : { scale: 0.985 }
        }
        transition={{ duration: 0.12 }}
        onMouseEnter={(e) => {
          setIsHovered(true);
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          setIsHovered(false);
          onMouseLeave?.(e);
        }}
        onFocus={(e) => {
          if (e.target.matches(":focus-visible")) {
            setIsFocused(true);
          }
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        style={{
          height: metrics.height,
          borderRadius: metrics.outerRadius,
          paddingLeft: metrics.textPaddingLeft,
          paddingRight: metrics.textPaddingRight,
        }}
        className={cn(
          "relative z-10 inline-flex select-none items-center justify-center overflow-hidden",
          "bg-[#1d2129] text-white font-semibold tracking-[-0.015em] whitespace-nowrap",
          "ring-1 ring-inset ring-white/[0.06] dark:ring-white/[0.12]",
          "outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          palette.focusRing,
          disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer",
          metrics.fontSizeClass,
          className
        )}
        {...rest}
      >
        {/* Stationary label smoothly wiped beneath the expanding pill */}
        <span className="relative z-0 leading-none">{label}</span>

        {/* Expanding tactile glossy keycap pill with clipped chevron matrix */}
        <motion.span
          aria-hidden="true"
          initial={false}
          animate={{
            width: isExpanded ? expandedWidth : metrics.idlePillWidth,
          }}
          transition={
            prefersReducedMotion ? { duration: 0 } : EXPAND_TRANSITION
          }
          style={{
            top: metrics.inset,
            bottom: metrics.inset,
            left: metrics.inset,
            borderRadius: metrics.innerRadius,
            background: palette.pillGradient,
            boxShadow: palette.pillInnerShadow,
          }}
          className="pointer-events-none absolute z-10 overflow-hidden"
        >
          {/* Subtle top glossy highlight band for sculpted 3D surface depth */}
          <span
            className="pointer-events-none absolute inset-x-0 top-0 h-[44%]"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0) 100%)",
            }}
          />

          {/* Anchored row of dot-matrix chevrons uncovered during expansion */}
          <span
            className="absolute inset-y-0 left-0 flex items-center"
            style={{
              paddingLeft: chevronPaddingLeft,
              gap: metrics.chevronGap,
            }}
          >
            {Array.from({ length: chevronCount }).map((_, chevronIdx) => (
              <svg
                key={chevronIdx}
                width={metrics.chevronWidth}
                height={metrics.chevronHeight}
                viewBox="0 0 22 28"
                fill="none"
                className="shrink-0 overflow-visible"
              >
                {CHEVRON_DOTS.map(({ col, row }, dotIdx) => {
                  const cx = 3 + col * 5.3;
                  const cy = 3.4 + row * 5.3;
                  // Continuous left-to-right phase across chevrons AND dot columns
                  const phaseFraction =
                    (chevronIdx + col * 0.14) / Math.max(chevronCount, 7);
                  const delaySeconds = -(
                    (1 - (phaseFraction % 1)) *
                    clampedWaveSpeed
                  );

                  return (
                    <g key={dotIdx}>
                      {/* Subtle recessed luminous rim behind each dot */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={2.55}
                        fill={palette.dotGlow}
                      />
                      <circle
                        cx={cx}
                        cy={cy}
                        r={2.05}
                        fill={palette.dotActive}
                        stroke={palette.dotDimStroke}
                        strokeWidth={0.55}
                        strokeOpacity={0}
                        style={
                          prefersReducedMotion || disabled
                            ? undefined
                            : {
                                animationName: keyframesName,
                                animationDuration: `${clampedWaveSpeed}s`,
                                animationTimingFunction: "ease-in-out",
                                animationIterationCount: "infinite",
                                animationDelay: `${delaySeconds.toFixed(3)}s`,
                              }
                        }
                      />
                    </g>
                  );
                })}
              </svg>
            ))}
          </span>
        </motion.span>
      </motion.button>
    </div>
  );
});

MatrixChevronButton.displayName = "MatrixChevronButton";

export {
  MatrixChevronButton as component,
  MatrixChevronButton as Component,
};
export default MatrixChevronButton;