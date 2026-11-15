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

  let effectiveCrOut = Math.min(
    crOut,
    (safeROut - rIn) * 0.45,
    safeROut * span * 0.38
  );
  let effectiveCrIn = Math.min(
    crIn,
    (safeROut - rIn) * 0.45,
    rIn * span * 0.35
  );

  let rCo = safeROut - effectiveCrOut;
  let offCo = Math.asin(
    Math.min(0.99, (halfGap + effectiveCrOut) / Math.max(rCo, 1e-3))
  );
  if (offCo * 2 >= span) {
    effectiveCrOut = Math.max(
      0.5,
      (safeROut * Math.sin(span / 2) - halfGap) / (1 + Math.sin(span / 2))
    );
    rCo = safeROut - effectiveCrOut;
    offCo = Math.asin(
      Math.min(0.99, (halfGap + effectiveCrOut) / Math.max(rCo, 1e-3))
    );
  }

  let rCi = rIn + effectiveCrIn;
  let offCi = Math.asin(
    Math.min(0.99, (halfGap + effectiveCrIn) / Math.max(rCi, 1e-3))
  );
  if (offCi * 2 >= span) {
    effectiveCrIn = Math.max(
      0.5,
      (rIn * Math.sin(span / 2) - halfGap) / (1 - Math.sin(span / 2))
    );
    rCi = rIn + effectiveCrIn;
    offCi = Math.asin(
      Math.min(0.99, (halfGap + effectiveCrIn) / Math.max(rCi, 1e-3))
    );
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
  const trackGradId = `emotion-wheel-track-${uid}`;
  const blurFilterId = `emotion-wheel-blur-${uid}`;
  const rimBlurFilterId = `emotion-wheel-rim-blur-${uid}`;

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
      const asymRad = ((startDeg + stepDeg * 0.64 - 90) * Math.PI) / 180;

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

      const labelRadius =
        isFocused && useMotion ? LABEL_RADIUS + 3 : LABEL_RADIUS;
      const labelX = CENTER + labelRadius * Math.cos(midRad);
      const labelY = CENTER + labelRadius * Math.sin(midRad);

      // Directional vector points along this wedge from inner corner to outer arc
      const gradStartX = CENTER + INNER_RADIUS * Math.cos(midRad);
      const gradStartY = CENTER + INNER_RADIUS * Math.sin(midRad);
      const gradEndX = CENTER + targetFillRadius * Math.cos(midRad);
      const gradEndY = CENTER + targetFillRadius * Math.sin(midRad);

      // Asymmetrical outer-rim bloom focal point
      const glowCenterX = CENTER + targetFillRadius * 0.94 * Math.cos(asymRad);
      const glowCenterY = CENTER + targetFillRadius * 0.94 * Math.sin(asymRad);
      const glowRadius = Math.max(36, (targetFillRadius - INNER_RADIUS) * 0.85);

      const safeSegId = `${uid}-${index}`;

      return {
        index,
        segment,
        initialFillPath,
        outerPath,
        fillPath,
        labelX,
        labelY,
        gradStartX,
        gradStartY,
        gradEndX,
        gradEndY,
        glowCenterX,
        glowCenterY,
        glowRadius,
        clipId: `wedge-clip-${safeSegId}`,
        baseGradId: `wedge-base-${safeSegId}`,
        bloomGradId: `wedge-bloom-${safeSegId}`,
        rimGradId: `wedge-rim-${safeSegId}`,
        crispRimGradId: `wedge-crisp-${safeSegId}`,
        isFocused,
        isDimmed,
        hasVisibleFill: ratio > 0.02,
      };
    });
  }, [segments, maxValue, focusedId, useMotion, uid]);

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
      style={{
        ...(size ? { width: size, height: size, maxWidth: size } : {}),
        ...style,
      }}
    >
      <svg
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        className="w-full h-full block overflow-visible"
        role="img"
        aria-label="Interactive emotion wheel radial chart"
      >
        <defs>
          {/* Deep obsidian recessed track gradient shared across all outer tracks */}
          <radialGradient
            id={trackGradId}
            gradientUnits="userSpaceOnUse"
            cx={CENTER}
            cy={CENTER}
            r={OUTER_RADIUS}
          >
            <stop offset="0%" stopColor="#020612" />
            <stop offset="58%" stopColor="#03091a" />
            <stop offset="86%" stopColor="#071436" />
            <stop offset="100%" stopColor="#0d245c" />
          </radialGradient>

          <filter
            id={blurFilterId}
            x="-35%"
            y="-35%"
            width="170%"
            height="170%"
          >
            <feGaussianBlur stdDeviation="8" result="blur" />
          </filter>

          <filter
            id={rimBlurFilterId}
            x="-25%"
            y="-25%"
            width="150%"
            height="150%"
          >
            <feGaussianBlur stdDeviation="3.5" />
          </filter>

          {computedSegments.map(
            ({
              segment,
              initialFillPath,
              fillPath,
              gradStartX,
              gradStartY,
              gradEndX,
              gradEndY,
              glowCenterX,
              glowCenterY,
              glowRadius,
              clipId,
              baseGradId,
              bloomGradId,
              rimGradId,
              crispRimGradId,
              index,
            }) => (
              <React.Fragment key={segment.id}>
                <clipPath id={clipId}>
                  <motion.path
                    d={fillPath}
                    initial={useMotion ? { d: initialFillPath } : false}
                    animate={{ d: fillPath }}
                    transition={{
                      ...transition,
                      d: {
                        ...SPRING_TRANSITION,
                        delay: useMotion && !focusedId ? index * 0.03 : 0,
                      },
                    }}
                  />
                </clipPath>

                {/* Primary radial base (#020612 near core -> #2667ff -> #467dff at outer arc) */}
                <linearGradient
                  id={baseGradId}
                  gradientUnits="userSpaceOnUse"
                  x1={gradStartX}
                  y1={gradStartY}
                  x2={gradEndX}
                  y2={gradEndY}
                >
                  <stop offset="0%" stopColor="#020612" />
                  <stop offset="38%" stopColor="#040c22" />
                  <stop offset="68%" stopColor="#0d276b" />
                  <stop offset="88%" stopColor="#2667ff" />
                  <stop offset="100%" stopColor="#467dff" />
                </linearGradient>

                {/* Asymmetrical ambient blue radial bloom inside each wedge */}
                <radialGradient
                  id={bloomGradId}
                  gradientUnits="userSpaceOnUse"
                  cx={glowCenterX}
                  cy={glowCenterY}
                  r={glowRadius}
                >
                  <stop offset="0%" stopColor="#c2ffff" stopOpacity="0.34" />
                  <stop offset="36%" stopColor="#467dff" stopOpacity="0.42" />
                  <stop offset="70%" stopColor="#2667ff" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#020612" stopOpacity="0" />
                </radialGradient>

                {/* Soft inset rim glow gradient intensifying toward the outer arc */}
                <linearGradient
                  id={rimGradId}
                  gradientUnits="userSpaceOnUse"
                  x1={gradStartX}
                  y1={gradStartY}
                  x2={gradEndX}
                  y2={gradEndY}
                >
                  <stop offset="0%" stopColor="#2667ff" stopOpacity="0.12" />
                  <stop offset="55%" stopColor="#2667ff" stopOpacity="0.48" />
                  <stop offset="88%" stopColor="#467dff" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#c2ffff" stopOpacity="0.95" />
                </linearGradient>

                {/* Crisp thin #c2ffff outer-edge highlight stroke */}
                <linearGradient
                  id={crispRimGradId}
                  gradientUnits="userSpaceOnUse"
                  x1={gradStartX}
                  y1={gradStartY}
                  x2={gradEndX}
                  y2={gradEndY}
                >
                  <stop offset="0%" stopColor="#467dff" stopOpacity="0.08" />
                  <stop offset="62%" stopColor="#467dff" stopOpacity="0.32" />
                  <stop offset="90%" stopColor="#c2ffff" stopOpacity="0.78" />
                  <stop offset="100%" stopColor="#c2ffff" stopOpacity="1" />
                </linearGradient>
              </React.Fragment>
            )
          )}
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
            clipId,
            baseGradId,
            bloomGradId,
            rimGradId,
            crispRimGradId,
            isFocused,
            isDimmed,
            hasVisibleFill,
          }) => {
            const blurFilter =
              enableBlurShade && isDimmed ? "blur(1.6px)" : "blur(0px)";
            const groupOpacity = enableBlurShade && isDimmed ? 0.42 : 1;

            const wedgeMorphTransition = {
              ...transition,
              d: {
                ...SPRING_TRANSITION,
                delay: useMotion && !focusedId ? index * 0.03 : 0,
              },
            };

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
                className="group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#467dff]/60"
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

                {/* Soft ambient blue halo on hovered/selected wedge */}
                <AnimatePresence>
                  {enableBlurShade && isFocused && (
                    <motion.path
                      key={`${segment.id}-shade`}
                      d={fillPath}
                      fill={segment.color ?? "#2667ff"}
                      filter={`url(#${blurFilterId})`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.5 }}
                      exit={{ opacity: 0 }}
                      transition={transition}
                      style={{ pointerEvents: "none" }}
                    />
                  )}
                </AnimatePresence>

                {/* Recessed #020612 outer track wedge with subtle blue rim */}
                <motion.path
                  d={outerPath}
                  fill={`url(#${trackGradId})`}
                  stroke={
                    isFocused
                      ? "rgba(194, 255, 255, 0.45)"
                      : "rgba(70, 125, 255, 0.24)"
                  }
                  strokeWidth={isFocused ? 1.25 : 0.9}
                  initial={false}
                  animate={{
                    d: outerPath,
                    opacity: isFocused ? 1 : 0.96,
                  }}
                  transition={transition}
                />

                {/* Clipped inner active wedge with recessed rim-lit blue gradient */}
                <motion.g
                  clipPath={`url(#${clipId})`}
                  initial={useMotion ? { opacity: 0 } : false}
                  animate={{ opacity: hasVisibleFill ? 1 : 0 }}
                  transition={transition}
                >
                  {/* Base near-black to #2667ff/#467dff radial gradient */}
                  <motion.path
                    d={fillPath}
                    fill={segment.color ?? `url(#${baseGradId})`}
                    initial={useMotion ? { d: initialFillPath } : false}
                    animate={{ d: fillPath }}
                    transition={wedgeMorphTransition}
                  />

                  {/* Asymmetrical radial blue glow overlay */}
                  {!segment.color && (
                    <motion.path
                      d={fillPath}
                      fill={`url(#${bloomGradId})`}
                      initial={useMotion ? { d: initialFillPath } : false}
                      animate={{ d: fillPath }}
                      transition={wedgeMorphTransition}
                    />
                  )}

                  {/* Soft multi-layered inset blue rim glow */}
                  <motion.path
                    d={fillPath}
                    fill="none"
                    stroke={`url(#${rimGradId})`}
                    strokeWidth={11}
                    filter={`url(#${rimBlurFilterId})`}
                    initial={useMotion ? { d: initialFillPath } : false}
                    animate={{ d: fillPath }}
                    transition={wedgeMorphTransition}
                  />

                  {/* Crisp thin #c2ffff inner edge rim highlight */}
                  <motion.path
                    d={fillPath}
                    fill="none"
                    stroke={`url(#${crispRimGradId})`}
                    strokeWidth={2}
                    initial={useMotion ? { d: initialFillPath } : false}
                    animate={{ d: fillPath }}
                    transition={wedgeMorphTransition}
                  />
                </motion.g>

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
                    fill="#f4f8ff"
                    className="tabular-nums"
                    style={{
                      fontFamily:
                        'Geist, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                      fontSize: "14.5px",
                      fontWeight: isFocused ? 500 : 400,
                      lineHeight: 1,
                      textShadow: "0 1px 4px rgba(2, 6, 18, 0.8)",
                    }}
                  >
                    {segment.value}
                  </text>
                  <text
                    x="0"
                    y="10.5"
                    textAnchor="middle"
                    fill="#c4d8ff"
                    style={{
                      fontFamily:
                        'Geist, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                      fontSize: "9.5px",
                      fontWeight: 400,
                      lineHeight: 1,
                      textShadow: "0 1px 4px rgba(2, 6, 18, 0.85)",
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
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#020612]/95 text-[#f4f8ff] backdrop-blur-md"
              style={{
                boxShadow:
                  "inset 0 -1px 2px rgba(194, 255, 255, 0.8), inset 0 -4px 10px rgba(70, 125, 255, 0.55), inset 0 0 0 1px rgba(70, 125, 255, 0.38), 0 4px 16px rgba(38, 103, 255, 0.35)",
              }}
            >
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
