"use client";

import React, { useId, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface EmotionSegment {
  id: string;
  label: string;
  value: number;
  maxValue?: number;
  /**
   * Optional explicit radial ratio (0..1) between innerRadius and maxFillRadius
   * to preserve exact visual proportions when needed.
   */
  fillRatio?: number;
  /**
   * Optional custom fill color for this segment's active wedge.
   */
  color?: string;
}

export interface EmotionWheelProps extends React.HTMLAttributes<HTMLDivElement> {
  segments?: EmotionSegment[];
  maxValue?: number;
  size?: number;
  className?: string;
  /** Controlled selected segment id */
  activeId?: string | null;
  /** Uncontrolled initial selected segment id */
  defaultActiveId?: string | null;
  /** Enable depth-of-field blur & dim shade on non-active wedges during hover/selection */
  enableBlurShade?: boolean;
  /** Enable spring-physics morphing on mount, hover, selection, and data updates */
  enableMorphMotion?: boolean;
  /** Show a morphing center readout when a segment is hovered or selected */
  showCenterReadout?: boolean;
  onSegmentSelect?: (segment: EmotionSegment | null) => void;
  onSegmentHover?: (segment: EmotionSegment | null) => void;
}

export const DEFAULT_EMOTION_SEGMENTS: EmotionSegment[] = [
  { id: "happiness", label: "Happiness", value: 12, fillRatio: 1.0 },
  { id: "awe", label: "Awe", value: 10, fillRatio: 0.8656 },
  { id: "admiration", label: "Admiration", value: 5, fillRatio: 0.7352 },
  { id: "surprise", label: "Surprise", value: 12, fillRatio: 1.0 },
  { id: "sadness", label: "Sadness", value: 6, fillRatio: 0.7352 },
  { id: "fear", label: "Fear", value: 4, fillRatio: 0.5494 },
  { id: "anger", label: "Anger", value: 2, fillRatio: 0.3794 },
  { id: "anticipation", label: "Anticipation", value: 5, fillRatio: 0.7431 },
];

const VIEWBOX_SIZE = 360;
const CENTER = VIEWBOX_SIZE / 2;
const INNER_RADIUS = 22;
const OUTER_RADIUS = 162;
const MAX_FILL_RADIUS = 148;
const WEDGE_GAP = 2.2;
const LABEL_RADIUS = 122;

const SPRING_TRANSITION = {
  type: "spring" as const,
  stiffness: 320,
  damping: 25,
  mass: 0.75,
};

/**
 * Generates an SVG path with a constant 9-command structure
 * (M, A, A, A, L, A, A, A, Z) so Framer Motion can smoothly morph `d`
 * across any radius or value change without structural mismatches.
 */
function createRoundedSectorPath(
  cx: number,
  cy: number,
  rIn: number,
  rOut: number,
  startDeg: number,
  endDeg: number,
  halfGap: number,
  crIn: number,
  crOut: number
): string {
  const safeROut = Math.max(rIn + 2, rOut);
  const a1 = ((startDeg - 90) * Math.PI) / 180;
  const a2 = ((endDeg - 90) * Math.PI) / 180;
  const span = a2 - a1;

  const pointAt = (r: number, angle: number): [number, number] => [
    cx + r * Math.cos(angle),
    cy + r * Math.sin(angle),
  ];

  let effectiveCrOut = Math.min(crOut, (safeROut - rIn) * 0.45, safeROut * span * 0.38);
  let effectiveCrIn = Math.min(crIn, (safeROut - rIn) * 0.45, rIn * span * 0.35);

  let rCo = safeROut - effectiveCrOut;
  let offCo = Math.asin(Math.min(0.99, (halfGap + effectiveCrOut) / Math.max(rCo, 1e-3)));
  if (offCo * 2 >= span) {
    effectiveCrOut = Math.max(
      0.5,
      (safeROut * Math.sin(span / 2) - halfGap) / (1 + Math.sin(span / 2))
    );
    rCo = safeROut - effectiveCrOut;
    offCo = Math.asin(Math.min(0.99, (halfGap + effectiveCrOut) / Math.max(rCo, 1e-3)));
  }

  let rCi = rIn + effectiveCrIn;
  let offCi = Math.asin(Math.min(0.99, (halfGap + effectiveCrIn) / Math.max(rCi, 1e-3)));
  if (offCi * 2 >= span) {
    effectiveCrIn = Math.max(
      0.5,
      (rIn * Math.sin(span / 2) - halfGap) / (1 - Math.sin(span / 2))
    );
    rCi = rIn + effectiveCrIn;
    offCi = Math.asin(Math.min(0.99, (halfGap + effectiveCrIn) / Math.max(rCi, 1e-3)));
  }

  const angCo1 = a1 + offCo;
  const angCo2 = a2 - offCo;
  const angCi1 = a1 + offCi;
  const angCi2 = a2 - offCi;

  const pOutStart = pointAt(safeROut, angCo1);
  const pOutEnd = pointAt(safeROut, angCo2);

  const cO2 = pointAt(rCo, angCo2);
  const pRad2Top: [number, number] = [
    cO2[0] + effectiveCrOut * -Math.sin(a2),
    cO2[1] + effectiveCrOut * Math.cos(a2),
  ];

  const cI2 = pointAt(rCi, angCi2);
  const pRad2Bot: [number, number] = [
    cI2[0] + effectiveCrIn * -Math.sin(a2),
    cI2[1] + effectiveCrIn * Math.cos(a2),
  ];

  const pInEnd = pointAt(rIn, angCi2);
  const pInStart = pointAt(rIn, angCi1);

  const cI1 = pointAt(rCi, angCi1);
  const pRad1Bot: [number, number] = [
    cI1[0] + effectiveCrIn * Math.sin(a1),
    cI1[1] - effectiveCrIn * Math.cos(a1),
  ];

  const cO1 = pointAt(rCo, angCo1);
  const pRad1Top: [number, number] = [
    cO1[0] + effectiveCrOut * Math.sin(a1),
    cO1[1] - effectiveCrOut * Math.cos(a1),
  ];

  const f = (n: number) => n.toFixed(2);

  return [
    `M ${f(pRad1Top[0])} ${f(pRad1Top[1])}`,
    `A ${f(effectiveCrOut)} ${f(effectiveCrOut)} 0 0 1 ${f(pOutStart[0])} ${f(pOutStart[1])}`,
    `A ${f(safeROut)} ${f(safeROut)} 0 0 1 ${f(pOutEnd[0])} ${f(pOutEnd[1])}`,
    `A ${f(effectiveCrOut)} ${f(effectiveCrOut)} 0 0 1 ${f(pRad2Top[0])} ${f(pRad2Top[1])}`,
    `L ${f(pRad2Bot[0])} ${f(pRad2Bot[1])}`,
    `A ${f(effectiveCrIn)} ${f(effectiveCrIn)} 0 0 1 ${f(pInEnd[0])} ${f(pInEnd[1])}`,
    `A ${f(rIn)} ${f(rIn)} 0 0 0 ${f(pInStart[0])} ${f(pInStart[1])}`,
    `A ${f(effectiveCrIn)} ${f(effectiveCrIn)} 0 0 1 ${f(pRad1Bot[0])} ${f(pRad1Bot[1])}`,
    "Z",
  ].join(" ");
}

export const EmotionWheel: React.FC<EmotionWheelProps> = ({
  segments = DEFAULT_EMOTION_SEGMENTS,
  maxValue = 12,
  size,
  className,
  activeId: controlledActiveId,
  defaultActiveId = null,
  enableBlurShade = true,
  enableMorphMotion = true,
  showCenterReadout = true,
  onSegmentSelect,
  onSegmentHover,
  style,
  ...props
}) => {
  const uid = useId().replace(/:/g, "");
  const gradientId = `emotion-wheel-grad-${uid}`;
  const blurFilterId = `emotion-wheel-blur-${uid}`;

  const prefersReducedMotion = useReducedMotion();
  const useMotion = enableMorphMotion && !prefersReducedMotion;

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    defaultActiveId
  );

  const selectedId =
    controlledActiveId !== undefined ? controlledActiveId : internalSelectedId;
  const focusedId = hoveredId ?? selectedId;

  const computedSegments = useMemo(() => {
    const count = Math.max(1, segments.length);
    const stepDeg = 360 / count;
    const halfGap = WEDGE_GAP / 2;

    return segments.map((segment, index) => {
      const startDeg = index * stepDeg;
      const endDeg = (index + 1) * stepDeg;
      const midRad = ((startDeg + stepDeg / 2 - 90) * Math.PI) / 180;

      const segmentMax = segment.maxValue ?? maxValue;
      const ratio =
        segment.fillRatio !== undefined
          ? Math.max(0, Math.min(1, segment.fillRatio))
          : segmentMax > 0
            ? Math.max(0, Math.min(1, segment.value / segmentMax))
            : 0;

      const baseFillRadius =
        INNER_RADIUS + ratio * (MAX_FILL_RADIUS - INNER_RADIUS);
      const isFocused = focusedId === segment.id;
      const isDimmed = Boolean(focusedId && !isFocused);

      const targetFillRadius =
        isFocused && useMotion
          ? Math.min(OUTER_RADIUS - 3, baseFillRadius + 6)
          : baseFillRadius;

      const targetOuterRadius =
        isFocused && useMotion ? OUTER_RADIUS + 5 : OUTER_RADIUS;

      const initialFillPath = createRoundedSectorPath(
        CENTER,
        CENTER,
        INNER_RADIUS,
        INNER_RADIUS + 8,
        startDeg,
        endDeg,
        halfGap,
        7,
        8
      );

      const outerPath = createRoundedSectorPath(
        CENTER,
        CENTER,
        INNER_RADIUS,
        targetOuterRadius,
        startDeg,
        endDeg,
        halfGap,
        7,
        14
      );

      const fillPath = createRoundedSectorPath(
        CENTER,
        CENTER,
        INNER_RADIUS,
        targetFillRadius,
        startDeg,
        endDeg,
        halfGap,
        7,
        12
      );

      const labelRadius = isFocused && useMotion ? LABEL_RADIUS + 3 : LABEL_RADIUS;
      const labelX = CENTER + labelRadius * Math.cos(midRad);
      const labelY = CENTER + labelRadius * Math.sin(midRad);

      return {
        index,
        segment,
        initialFillPath,
        outerPath,
        fillPath,
        labelX,
        labelY,
        isFocused,
        isDimmed,
        hasVisibleFill: ratio > 0.02,
      };
    });
  }, [segments, maxValue, focusedId, useMotion]);

  const focusedSegment = useMemo(
    () => segments.find((s) => s.id === focusedId) ?? null,
    [segments, focusedId]
  );

  const handleHover = (segment: EmotionSegment | null) => {
    setHoveredId(segment?.id ?? null);
    onSegmentHover?.(segment);
  };

  const handleSelect = (segment: EmotionSegment) => {
    const nextId = selectedId === segment.id ? null : segment.id;
    if (controlledActiveId === undefined) {
      setInternalSelectedId(nextId);
    }
    onSegmentSelect?.(nextId ? segment : null);
  };

  const transition = useMotion ? SPRING_TRANSITION : { duration: 0 };

  return (
    <div
      {...props}
      className={cn(
        "relative inline-flex w-full max-w-[360px] aspect-square items-center justify-center bg-transparent select-none",
        className
      )}
      style={
        size || style
          ? {
              ...(size ? { width: size, height: size, maxWidth: size } : {}),
              ...style,
            }
          : undefined
      }
    >
      <svg
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        className="w-full h-full block overflow-visible"
        role="img"
        aria-label="Interactive emotion wheel radial chart"
      >
        <defs>
          <linearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1="48"
            y1="48"
            x2="312"
            y2="312"
          >
            <stop offset="0%" stopColor="#e8e2d5" />
            <stop offset="50%" stopColor="#dfd9e2" />
            <stop offset="100%" stopColor="#d5cfe6" />
          </linearGradient>

          <filter
            id={blurFilterId}
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feGaussianBlur stdDeviation="7" result="blur" />
          </filter>
        </defs>

        {computedSegments.map(
          ({
            index,
            segment,
            initialFillPath,
            outerPath,
            fillPath,
            labelX,
            labelY,
            isFocused,
            isDimmed,
            hasVisibleFill,
          }) => {
            const blurFilter =
              enableBlurShade && isDimmed ? "blur(1.6px)" : "blur(0px)";
            const groupOpacity = enableBlurShade && isDimmed ? 0.42 : 1;

            return (
              <motion.g
                key={segment.id}
                onMouseEnter={() => handleHover(segment)}
                onMouseLeave={() => handleHover(null)}
                onFocus={() => handleHover(segment)}
                onBlur={() => handleHover(null)}
                onClick={() => handleSelect(segment)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(segment);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-pressed={selectedId === segment.id}
                aria-label={`${segment.label}: ${segment.value}`}
                className="group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/40 dark:focus-visible:ring-zinc-100/40"
                initial={useMotion ? { opacity: 0, scale: 0.94 } : false}
                animate={{
                  opacity: groupOpacity,
                  scale: 1,
                  filter: blurFilter,
                }}
                whileTap={useMotion ? { scale: 0.97 } : undefined}
                transition={{
                  ...transition,
                  opacity: {
                    duration: 0.22,
                    delay: useMotion && !focusedId ? index * 0.025 : 0,
                  },
                  scale: {
                    ...SPRING_TRANSITION,
                    delay: useMotion && !focusedId ? index * 0.025 : 0,
                  },
                }}
                style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
              >
                <title>{`${segment.label}: ${segment.value}`}</title>

                {/* Soft ambient blur-shade halo on hovered/selected wedge */}
                <AnimatePresence>
                  {enableBlurShade && isFocused && (
                    <motion.path
                      key={`${segment.id}-shade`}
                      d={fillPath}
                      fill={segment.color ?? `url(#${gradientId})`}
                      filter={`url(#${blurFilterId})`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.4 }}
                      exit={{ opacity: 0 }}
                      transition={transition}
                      style={{ pointerEvents: "none" }}
                    />
                  )}
                </AnimatePresence>

                {/* Theme-aware outer track wedge (clean zinc in light mode, charcoal in dark mode) */}
                <motion.path
                  d={outerPath}
                  className="fill-zinc-200 dark:fill-[#555354] stroke-transparent group-focus-visible:stroke-zinc-900/70 dark:group-focus-visible:stroke-zinc-100/70 transition-colors duration-200"
                  strokeWidth={1.5}
                  initial={false}
                  animate={{
                    d: outerPath,
                    opacity: isFocused ? 0.96 : 1,
                  }}
                  transition={transition}
                />

                {/* Inner active value wedge with staggered entrance + spring morphing */}
                <motion.path
                  d={fillPath}
                  fill={segment.color ?? `url(#${gradientId})`}
                  className="stroke-zinc-300/70 dark:stroke-transparent"
                  strokeWidth={1}
                  initial={useMotion ? { d: initialFillPath, opacity: 0 } : false}
                  animate={{
                    d: fillPath,
                    opacity: hasVisibleFill ? 1 : 0,
                  }}
                  transition={{
                    ...transition,
                    d: {
                      ...SPRING_TRANSITION,
                      delay: useMotion && !focusedId ? index * 0.03 : 0,
                    },
                  }}
                />

                {/* Upright value + label */}
                <motion.g
                  initial={false}
                  animate={{
                    x: labelX,
                    y: labelY,
                    scale: isFocused && useMotion ? 1.04 : 1,
                  }}
                  transition={transition}
                  style={{ pointerEvents: "none" }}
                >
                  <text
                    x="0"
                    y="-3"
                    textAnchor="middle"
                    className="fill-zinc-900 tabular-nums"
                    style={{
                      fontFamily:
                        'Geist, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                      fontSize: "14.5px",
                      fontWeight: isFocused ? 500 : 400,
                      lineHeight: 1,
                    }}
                  >
                    {segment.value}
                  </text>
                  <text
                    x="0"
                    y="10.5"
                    textAnchor="middle"
                    className="fill-zinc-800"
                    style={{
                      fontFamily:
                        'Geist, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                      fontSize: "9.5px",
                      fontWeight: 400,
                      lineHeight: 1,
                    }}
                  >
                    {segment.label}
                  </text>
                </motion.g>
              </motion.g>
            );
          }
        )}
      </svg>

      {/* Morphing center readout pill on hover/selection */}
      <AnimatePresence>
        {showCenterReadout && focusedSegment && (
          <motion.div
            key={focusedSegment.id}
            initial={
              useMotion
                ? { opacity: 0, scale: 0.78, filter: "blur(4px)" }
                : { opacity: 0 }
            }
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={
              useMotion
                ? { opacity: 0, scale: 0.78, filter: "blur(4px)" }
                : { opacity: 0 }
            }
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300/80 bg-white/90 text-zinc-900 shadow-sm backdrop-blur-md dark:border-white/15 dark:bg-zinc-900/90 dark:text-zinc-100">
              <span className="text-[11px] font-medium tabular-nums leading-none">
                {focusedSegment.value}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { EmotionWheel as Component };
export default EmotionWheel;