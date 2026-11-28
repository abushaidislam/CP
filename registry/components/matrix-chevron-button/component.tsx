"use client";

import React, { useId, useMemo, useRef, useState, useEffect } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(" ");
}

export type MatrixChevronAccent = "lime" | "amber" | "cyan" | "coral";
export type MatrixChevronSize = "sm" | "md" | "lg";
export type MatrixChevronTrigger = "click" | "hover";

export interface MatrixChevronButtonProps
  extends Omit<HTMLMotionProps<"button">, "children" | "className"> {
  /** Primary button label displayed in the resting state. */
  label?: string;
  /** Hex color for the expanding tactile pill (renders a native color picker in 21st.dev Controls). */
  accentColor?: string;
  /** Hex color for the outer button chassis (renders a native color picker in 21st.dev Controls). */
  chassisColor?: string;
  /** Optional named accent preset used when accentColor is not provided. */
  accent?: MatrixChevronAccent;
  /** Size preset scaling height, pill width, chevron matrix, and typography. */
  size?: MatrixChevronSize;
  /** Interaction mode: click to toggle expansion (default) or hover to expand. */
  trigger?: MatrixChevronTrigger;
  /** Duration in seconds for one full left-to-right dot-matrix wave cycle. */
  waveSpeed?: number;
  /** Optional controlled expanded state (overrides internal click/hover state). */
  expanded?: boolean;
  /** Callback fired when the expanded state toggles in click mode. */
  onExpandedChange?: (expanded: boolean) => void;
  /** Optional custom classes merged onto the button element. */
  className?: string;
}

const ACCENT_PRESET_HEX: Record<MatrixChevronAccent, string> = {
  lime: "#d2fe00",
  amber: "#ffb300",
  cyan: "#00d9f5",
  coral: "#ff5c33",
};

type Rgb = [number, number, number];

function parseHexColor(input: string | undefined, fallback: Rgb): Rgb {
  if (!input || typeof input !== "string") return fallback;
  const cleaned = input.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    const r = parseInt(cleaned[0] + cleaned[0], 16);
    const g = parseInt(cleaned[1] + cleaned[1], 16);
    const b = parseInt(cleaned[2] + cleaned[2], 16);
    return [r, g, b];
  }
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    const r = parseInt(cleaned.slice(0, 2), 16);
    const g = parseInt(cleaned.slice(2, 4), 16);
    const b = parseInt(cleaned.slice(4, 6), 16);
    return [r, g, b];
  }
  return fallback;
}

function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function rgbToHex([r, g, b]: Rgb): string {
  return `#${[r, g, b]
    .map((v) => Math.min(255, Math.max(0, v)).toString(16).padStart(2, "0"))
    .join("")}`;
}

function rgbToRgba([r, g, b]: Rgb, alpha: number): string {
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getRelativeLuminance([r, g, b]: Rgb): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

interface DerivedPalette {
  pillGradient: string;
  pillInnerShadow: string;
  dotActive: string;
  dotMid: string;
  dotDimFill: string;
  dotDimStroke: string;
  dotGlow: string;
  ambientGlowDark: string;
  focusRingColor: string;
  chassisHex: string;
  labelColor: string;
}

function buildDynamicPalette(
  accentHexInput: string | undefined,
  chassisHexInput: string | undefined
): DerivedPalette {
  const base = parseHexColor(accentHexInput, [210, 254, 0]);
  const chassis = parseHexColor(chassisHexInput, [29, 33, 41]);

  const topStop = mixRgb(base, [255, 255, 255], 0.32);
  const midStop = mixRgb(base, [255, 255, 255], 0.12);
  const bottomBevel = mixRgb(base, [0, 0, 0], 0.42);

  const isLightAccent = getRelativeLuminance(base) > 0.34;
  const inkTarget: Rgb = isLightAccent ? [22, 28, 18] : [255, 255, 255];
  const dotActiveRgb = mixRgb(inkTarget, base, 0.06);
  const dotMidRgb = mixRgb(dotActiveRgb, base, 0.48);
  const dotDimRgb = mixRgb(base, [255, 255, 255], isLightAccent ? 0.12 : 0.18);

  const isLightChassis = getRelativeLuminance(chassis) > 0.45;

  return {
    pillGradient: `linear-gradient(180deg, ${rgbToHex(topStop)} 0%, ${rgbToHex(midStop)} 46%, ${rgbToHex(base)} 100%)`,
    pillInnerShadow: `inset 0 1.5px 1px rgba(255, 255, 255, ${isLightAccent ? 0.8 : 0.45}), inset 0 -1.5px 1.5px ${rgbToRgba(bottomBevel, 0.42)}, inset 1px 0 1px rgba(255, 255, 255, 0.32), inset -1px 0 1px rgba(255, 255, 255, 0.32)`,
    dotActive: rgbToHex(dotActiveRgb),
    dotMid: rgbToHex(dotMidRgb),
    dotDimFill: rgbToHex(dotDimRgb),
    dotDimStroke: rgbToRgba(dotActiveRgb, 0.38),
    dotGlow: isLightAccent
      ? "rgba(255, 255, 255, 0.42)"
      : "rgba(255, 255, 255, 0.16)",
    ambientGlowDark: rgbToRgba(base, 0.24),
    focusRingColor: rgbToRgba(base, 0.72),
    chassisHex: rgbToHex(chassis),
    labelColor: isLightChassis ? "#111827" : "#ffffff",
  };
}

interface SizeMetrics {
  height: number;
  inset: number;
  outerRadius: number;
  innerRadius: number;
  idlePillWidth: number;
  chevronWidth: number;
  chevronHeight: number;
  idealChevronGap: number;
  textPaddingLeft: number;
  textPaddingRight: number;
  fontSizeClass: string;
}

const SIZE_METRICS: Record<MatrixChevronSize, SizeMetrics> = {
  sm: {
    height: 48,
    inset: 2.5,
    outerRadius: 8,
    innerRadius: 5.5,
    idlePillWidth: 52,
    chevronWidth: 12.5,
    chevronHeight: 15.5,
    idealChevronGap: 9.5,
    textPaddingLeft: 70,
    textPaddingRight: 18,
    fontSizeClass: "text-[14px]",
  },
  md: {
    height: 58,
    inset: 3,
    outerRadius: 10,
    innerRadius: 7,
    idlePillWidth: 62,
    chevronWidth: 14.5,
    chevronHeight: 18.5,
    idealChevronGap: 11,
    textPaddingLeft: 86,
    textPaddingRight: 22,
    fontSizeClass: "text-[17px]",
  },
  lg: {
    height: 68,
    inset: 3.5,
    outerRadius: 11.5,
    innerRadius: 8,
    idlePillWidth: 74,
    chevronWidth: 17.5,
    chevronHeight: 22,
    idealChevronGap: 13,
    textPaddingLeft: 102,
    textPaddingRight: 26,
    fontSizeClass: "text-[20px]",
  },
};

// 10-dot chevron matrix on a 4-column x 5-row grid (exact reference geometry)
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
    accentColor,
    chassisColor = "#1d2129",
    accent = "lime",
    size = "md",
    trigger = "click",
    waveSpeed = 1.6,
    expanded: controlledExpanded,
    onExpandedChange,
    disabled = false,
    className,
    onClick,
    onKeyDown,
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
  const [isClickedOpen, setIsClickedOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [buttonWidth, setButtonWidth] = useState<number>(0);

  const resolvedAccentHex =
    accentColor ?? ACCENT_PRESET_HEX[accent] ?? ACCENT_PRESET_HEX.lime;

  const palette = useMemo(
    () => buildDynamicPalette(resolvedAccentHex, chassisColor),
    [resolvedAccentHex, chassisColor]
  );

  const metrics = SIZE_METRICS[size] ?? SIZE_METRICS.md;
  const clampedWaveSpeed = Number.isFinite(waveSpeed)
    ? Math.min(Math.max(waveSpeed, 0.5), 5)
    : 1.6;

  useEffect(() => {
    if (disabled) {
      setIsClickedOpen(false);
      setIsHovered(false);
      setIsFocused(false);
    }
  }, [disabled]);

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
      : trigger === "hover"
        ? isHovered || isFocused
        : isClickedOpen);

  // Guaranteed symmetrical left/right margins + even chevron spacing for any label width
  const sideMargin = (metrics.idlePillWidth - metrics.chevronWidth) / 2;
  const fallbackInnerWidth =
    sideMargin * 2 + metrics.chevronWidth * 7 + metrics.idealChevronGap * 6;
  const expandedInnerWidth =
    buttonWidth > 0
      ? Math.max(metrics.idlePillWidth, buttonWidth - metrics.inset * 2)
      : fallbackInnerWidth;

  const usableSpan = Math.max(
    metrics.chevronWidth,
    expandedInnerWidth - sideMargin * 2
  );
  const idealPitch = metrics.chevronWidth + metrics.idealChevronGap;
  const chevronCount = Math.max(
    2,
    Math.round((usableSpan + metrics.idealChevronGap) / idealPitch)
  );
  const dynamicGap =
    chevronCount > 1
      ? Math.max(
          4,
          (usableSpan - chevronCount * metrics.chevronWidth) /
            (chevronCount - 1)
        )
      : 0;

  const expandedWidth =
    buttonWidth > 0
      ? expandedInnerWidth
      : `calc(100% - ${metrics.inset * 2}px)`;

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
        aria-pressed={trigger === "click" ? isExpanded : undefined}
        whileTap={
          disabled || prefersReducedMotion ? undefined : { scale: 0.985 }
        }
        transition={{ duration: 0.12 }}
        onClick={(e) => {
          if (!disabled && trigger === "click") {
            const next = !isExpanded;
            if (controlledExpanded === undefined) {
              setIsClickedOpen(next);
            }
            onExpandedChange?.(next);
          }
          onClick?.(e);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape" && trigger === "click" && isExpanded) {
            if (controlledExpanded === undefined) {
              setIsClickedOpen(false);
            }
            onExpandedChange?.(false);
          }
          onKeyDown?.(e);
        }}
        onMouseEnter={(e) => {
          if (trigger === "hover") setIsHovered(true);
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          if (trigger === "hover") setIsHovered(false);
          onMouseLeave?.(e);
        }}
        onFocus={(e) => {
          if (trigger === "hover" && e.target.matches(":focus-visible")) {
            setIsFocused(true);
          }
          onFocus?.(e);
        }}
        onBlur={(e) => {
          if (trigger === "hover") setIsFocused(false);
          onBlur?.(e);
        }}
        style={{
          height: metrics.height,
          borderRadius: metrics.outerRadius,
          paddingLeft: metrics.textPaddingLeft,
          paddingRight: metrics.textPaddingRight,
          backgroundColor: palette.chassisHex,
          color: palette.labelColor,
          ["--tw-ring-color" as string]: palette.focusRingColor,
        }}
        className={cn(
          "relative z-10 inline-flex select-none items-center justify-center overflow-hidden",
          "font-bold tracking-[-0.015em] whitespace-nowrap",
          "ring-1 ring-inset ring-white/[0.06] dark:ring-white/[0.12]",
          "outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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

          {/* Symmetrical row of dot-matrix chevrons anchored to Chevron #1's idle center */}
          <span
            className="absolute inset-y-0 left-0 flex items-center"
            style={{
              width: expandedInnerWidth,
              paddingLeft: sideMargin,
              paddingRight: sideMargin,
              gap: dynamicGap,
            }}
          >
            {Array.from({ length: chevronCount }).map((_, chevronIdx) => {
              const isSecondary = chevronIdx > 0;
              return (
                <motion.svg
                  key={chevronIdx}
                  width={metrics.chevronWidth}
                  height={metrics.chevronHeight}
                  viewBox="0 0 21 26"
                  fill="none"
                  initial={false}
                  animate={{
                    opacity: isSecondary ? (isExpanded ? 1 : 0) : 1,
                  }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : {
                          duration: isExpanded ? 0.14 : 0.1,
                          delay: isExpanded ? Math.min(chevronIdx * 0.02, 0.12) : 0,
                        }
                  }
                  className="shrink-0 overflow-visible"
                >
                  {CHEVRON_DOTS.map(({ col, row }, dotIdx) => {
                    const cx = 3 + col * 5.0;
                    const cy = 3.0 + row * 5.0;
                    // Continuous left-to-right phase across chevrons AND dot columns
                    const phaseFraction =
                      (chevronIdx + col * 0.14) / Math.max(chevronCount, 2);
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
                          r={2.65}
                          fill={palette.dotGlow}
                        />
                        <circle
                          cx={cx}
                          cy={cy}
                          r={2.2}
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
                </motion.svg>
              );
            })}
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
