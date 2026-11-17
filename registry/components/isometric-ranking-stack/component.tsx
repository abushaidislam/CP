"use client";

import React, { useId, useState } from "react";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useReducedMotion,
} from "framer-motion";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export interface StackStep {
  id: string;
  label: string;
  description: string;
}

export interface IsometricRankingStackProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /** Color theme: "auto" follows Tailwind's .dark class, or force "dark" / "light" */
  theme?: "auto" | "dark" | "light";
  /** Hero headline text */
  headline?: string;
  /** Supporting paragraph below the headline */
  subtitle?: string;
  /** Primary CTA button label */
  primaryCtaText?: string;
  /** Secondary CTA button label */
  secondaryCtaText?: string;
  /** User prompt shown in the top-right floating card */
  promptText?: string;
  /** Prompt author name */
  promptAuthor?: string;
  /** Recommended brand name in the AI answer card */
  answerBrand?: string;
  /** AI answer body text */
  answerText?: string;
  /** Initial active tier index (0 = bottom "Indexed", 3 = top "Named first", -1 = wireframe idle) */
  initialStep?: number;
  /** Callback fired when the primary CTA button is clicked */
  onPrimaryClick?: () => void;
  /** Callback fired when the secondary CTA button is clicked */
  onSecondaryClick?: () => void;
}

const DEFAULT_STEPS: StackStep[] = [
  {
    id: "indexed",
    label: "Indexed",
    description: "Search engines can find and read your pages.",
  },
  {
    id: "mentioned",
    label: "Mentioned",
    description: "AI answers say your name when buyers ask.",
  },
  {
    id: "cited",
    label: "Cited",
    description: "Answers link your pages as their source.",
  },
  {
    id: "named-first",
    label: "Named first",
    description: "AI recommends you before anyone else.",
  },
];

const EASE_OUT_QUINT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const CONNECTOR_SPRING = {
  type: "spring" as const,
  stiffness: 320,
  damping: 32,
  mass: 0.75,
};

// Isometric cube geometry in SVG coordinate space (540 x 440)
const CX = 315;
const TOP_Y = 92;
const DX = 118;
const DY = 68;
const LAYER_H = 38;
const NUM_LAYERS = 4;

function getPlanePoints(planeIndex: number) {
  // planeIndex 0 = very top plane, 4 = very bottom plane
  const y0 = TOP_Y + planeIndex * LAYER_H;
  return {
    top: { x: CX, y: y0 },
    right: { x: CX + DX, y: y0 + DY },
    bottom: { x: CX, y: y0 + DY * 2 },
    left: { x: CX - DX, y: y0 + DY },
  };
}

function OpenAiMiniIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-3.5 w-3.5 shrink-0 text-current"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5Z"
      />
    </svg>
  );
}

export const IsometricRankingStack = React.forwardRef<
  HTMLElement,
  IsometricRankingStackProps
>(
  (
    {
      theme = "auto",
      headline = "Go from indexed to recommended",
      subtitle = "Search engines find your pages. AI decides if it trusts them enough to say your name. Cited shows the step you are on for every prompt, and what moves you up.",
      primaryCtaText = "Start for free",
      secondaryCtaText = "See how scoring works",
      promptText = "best invoicing app for a two-person studio?",
      promptAuthor = "Maya",
      answerBrand = "Ledgerly.",
      answerText = "It shares clients between seats and chases late invoices for you.",
      initialStep = -1,
      onPrimaryClick,
      onSecondaryClick,
      className,
      style,
      ...rest
    },
    ref
  ) => {
    const uid = useId();
    const shouldReduceMotion = Boolean(useReducedMotion());

    const normalizedInitial =
      Number.isInteger(initialStep) && initialStep >= 0 && initialStep < NUM_LAYERS
        ? initialStep
        : null;

    const [hoveredStep, setHoveredStep] = useState<number | null>(
      normalizedInitial
    );
    const [lockedStep, setLockedStep] = useState<number | null>(
      normalizedInitial
    );

    const activeStep = hoveredStep ?? lockedStep;
    const activeData = activeStep !== null ? DEFAULT_STEPS[activeStep] : null;

    const isForcedDark = theme === "dark";
    const isForcedLight = theme === "light";

    const surfaceClasses = isForcedDark
      ? "bg-[#0A0A0A] text-[#F5F5F7]"
      : isForcedLight
        ? "bg-[#FAFAFA] text-[#09090B]"
        : "bg-transparent text-[#09090B] dark:text-[#F5F5F7]";

    const subtitleClasses = isForcedDark
      ? "text-[#8E8E93]"
      : isForcedLight
        ? "text-[#52525B]"
        : "text-[#52525B] dark:text-[#8E8E93]";

    const cardClasses = isForcedDark
      ? "bg-[#151517]/95 border-white/[0.09] text-[#A1A1AA] shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
      : isForcedLight
        ? "bg-white/95 border-black/[0.08] text-[#52525B] shadow-[0_10px_28px_rgba(0,0,0,0.07)]"
        : "bg-white/95 border-black/[0.08] text-[#52525B] shadow-[0_10px_28px_rgba(0,0,0,0.07)] dark:bg-[#151517]/95 dark:border-white/[0.09] dark:text-[#A1A1AA] dark:shadow-[0_12px_32px_rgba(0,0,0,0.45)]";

    const cardStrongText = isForcedDark
      ? "text-[#F5F5F7]"
      : isForcedLight
        ? "text-[#09090B]"
        : "text-[#09090B] dark:text-[#F5F5F7]";

    const secondaryBtnClasses = isForcedDark
      ? "bg-[#151517] text-[#E5E5EA] border border-white/10 hover:bg-[#1C1C20] hover:border-white/[0.16] focus-visible:ring-offset-[#0A0A0A]"
      : isForcedLight
        ? "bg-white text-[#18181B] border border-black/[0.12] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[#F4F4F5] focus-visible:ring-offset-[#FAFAFA]"
        : "bg-white text-[#18181B] border border-black/[0.12] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[#F4F4F5] focus-visible:ring-offset-[#FAFAFA] dark:bg-[#151517] dark:text-[#E5E5EA] dark:border-white/10 dark:shadow-none dark:hover:bg-[#1C1C20] dark:hover:border-white/[0.16] dark:focus-visible:ring-offset-[#0A0A0A]";

    // Plane index for the top face of the currently active step (step 3 -> plane 0, step 0 -> plane 3)
    const activePlaneIndex =
      activeStep !== null ? NUM_LAYERS - 1 - activeStep : null;
    const activeConnectorY =
      activePlaneIndex !== null
        ? TOP_Y + activePlaneIndex * LAYER_H + DY
        : TOP_Y + DY;

    // Precompute isometric floor grid lines around the bottom plane
    const gridLines: Array<{ x1: number; y1: number; x2: number; y2: number }> =
      [];
    const floorOriginY = TOP_Y + NUM_LAYERS * LAYER_H + DY * 2;
    const stepSize = 28;
    const gridCount = 8;
    for (let i = -gridCount; i <= gridCount; i++) {
      // Lines parallel to right-up axis
      const sx1 = CX + i * stepSize;
      const sy1 = floorOriginY - Math.abs(i) * 0;
      gridLines.push({
        x1: sx1 - gridCount * stepSize,
        y1: sy1 - (gridCount * stepSize * DY) / DX + (i * stepSize * DY) / DX,
        x2: sx1 + gridCount * stepSize,
        y2: sy1 + (gridCount * stepSize * DY) / DX + (i * stepSize * DY) / DX,
      });
      // Lines parallel to left-up axis
      gridLines.push({
        x1: sx1 - gridCount * stepSize,
        y1: sy1 + (gridCount * stepSize * DY) / DX - (i * stepSize * DY) / DX,
        x2: sx1 + gridCount * stepSize,
        y2: sy1 - (gridCount * stepSize * DY) / DX - (i * stepSize * DY) / DX,
      });
    }

    const topPlane = getPlanePoints(0);
    const bottomPlane = getPlanePoints(NUM_LAYERS);

    return (
      <MotionConfig reducedMotion="user">
        <section
          ref={ref}
          aria-labelledby={`${uid}-heading`}
          className={cn(
            "relative w-full overflow-hidden px-4 py-12 sm:px-8 sm:py-16 lg:px-12",
            "antialiased transition-colors duration-200",
            surfaceClasses,
            className
          )}
          style={{
            fontFamily:
              '"Inter", "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            ...style,
          }}
          {...rest}
        >
          <div className="mx-auto grid w-full max-w-[1160px] grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
            {/* Left Copy & CTAs */}
            <div className="flex flex-col items-start text-left lg:col-span-5">
              <h2
                id={`${uid}-heading`}
                className="max-w-[440px] font-medium tracking-[-0.03em] leading-[1.1] text-[2.15rem] sm:text-[2.75rem] lg:text-[3.05rem]"
              >
                {headline}
              </h2>

              <p
                className={cn(
                  "mt-5 max-w-[400px] text-[0.95rem] sm:text-[1rem] leading-[1.58] tracking-[-0.005em]",
                  subtitleClasses
                )}
              >
                {subtitle}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onPrimaryClick}
                  className={cn(
                    "relative inline-flex h-11 items-center justify-center rounded-full px-6",
                    "text-[0.875rem] font-medium tracking-[-0.01em] text-white",
                    "transition-all duration-150 hover:brightness-110 active:scale-[0.98]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A7AFF] focus-visible:ring-offset-2",
                    isForcedDark
                      ? "focus-visible:ring-offset-[#0A0A0A]"
                      : isForcedLight
                        ? "focus-visible:ring-offset-[#FAFAFA]"
                        : "focus-visible:ring-offset-[#FAFAFA] dark:focus-visible:ring-offset-[#0A0A0A]"
                  )}
                  style={{
                    background:
                      "radial-gradient(120% 100% at 50% 0%, #3E6EFF 0%, #1C3A8A 48%, #101218 100%)",
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.3), 0 0 0 1px rgba(255,255,255,0.12), 0 4px 12px rgba(16,18,24,0.18)",
                  }}
                >
                  <span className="relative z-10">{primaryCtaText}</span>
                </button>

                <button
                  type="button"
                  onClick={onSecondaryClick}
                  className={cn(
                    "inline-flex h-11 items-center justify-center rounded-full px-6",
                    "text-[0.875rem] font-medium tracking-[-0.01em]",
                    "transition-all duration-150 active:scale-[0.98]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A7AFF] focus-visible:ring-offset-2",
                    secondaryBtnClasses
                  )}
                >
                  {secondaryCtaText}
                </button>
              </div>
            </div>

            {/* Right Interactive Isometric Stack */}
            <div className="relative flex w-full items-center justify-center lg:col-span-7">
              <div
                className="relative w-full max-w-[620px] select-none"
                onMouseLeave={() => setHoveredStep(null)}
              >
                {/* Top-Right Prompt Card */}
                <div
                  className={cn(
                    "relative z-10 ml-auto mb-2 w-fit max-w-[260px] rounded-xl border px-3.5 py-2.5 text-left text-[0.78rem] leading-[1.45] backdrop-blur-md sm:absolute sm:right-2 sm:top-0 sm:mb-0",
                    cardClasses
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#D97757] to-[#7C3AED] text-[10px] font-semibold text-white"
                    >
                      {promptAuthor.slice(0, 1).toUpperCase()}
                    </span>
                    <p>
                      <span className={cn("font-semibold", cardStrongText)}>
                        {promptAuthor}
                      </span>{" "}
                      {promptText}
                    </p>
                  </div>
                </div>

                {/* Top-Left AI Answer Card */}
                <div
                  className={cn(
                    "relative z-10 mb-3 w-fit max-w-[270px] rounded-xl border px-3.5 py-2.5 text-left text-[0.78rem] leading-[1.45] backdrop-blur-md sm:absolute sm:left-4 sm:top-16 sm:mb-0",
                    cardClasses
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                        isForcedDark
                          ? "border-white/15 bg-[#1F1F23] text-white"
                          : isForcedLight
                            ? "border-black/10 bg-[#F4F4F5] text-[#18181B]"
                            : "border-black/10 bg-[#F4F4F5] text-[#18181B] dark:border-white/15 dark:bg-[#1F1F23] dark:text-white"
                      )}
                    >
                      <OpenAiMiniIcon />
                    </span>
                    <p>
                      <span className={cn("font-semibold", cardStrongText)}>
                        {answerBrand}
                      </span>{" "}
                      {answerText}
                    </p>
                  </div>
                </div>

                {/* Isometric SVG Stack */}
                <svg
                  viewBox="0 0 540 440"
                  className="h-auto w-full overflow-visible"
                  role="group"
                  aria-label="Interactive AI visibility ranking layers"
                >
                  <defs>
                    {/* Floor Grid Radial Fade */}
                    <radialGradient
                      id={`${uid}-grid-mask-grad`}
                      cx="50%"
                      cy="50%"
                      r="50%"
                    >
                      <stop offset="20%" stopColor="white" stopOpacity="1" />
                      <stop offset="100%" stopColor="white" stopOpacity="0" />
                    </radialGradient>
                    <mask id={`${uid}-grid-mask`}>
                      <ellipse
                        cx={CX}
                        cy={floorOriginY - 25}
                        rx="230"
                        ry="135"
                        fill={`url(#${uid}-grid-mask-grad)`}
                      />
                    </mask>

                    {/* Active Top Face Gradient */}
                    <linearGradient
                      id={`${uid}-top-face-dark`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#1B1B1E" />
                      <stop offset="50%" stopColor="#323237" />
                      <stop offset="100%" stopColor="#1F1F23" />
                    </linearGradient>
                    <linearGradient
                      id={`${uid}-top-face-light`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#E4E4E7" />
                      <stop offset="50%" stopColor="#F4F4F5" />
                      <stop offset="100%" stopColor="#D4D4D8" />
                    </linearGradient>
                  </defs>

                  {/* Isometric Floor Grid */}
                  <g
                    mask={`url(#${uid}-grid-mask)`}
                    className={cn(
                      isForcedDark
                        ? "stroke-white/[0.08]"
                        : isForcedLight
                          ? "stroke-black/[0.07]"
                          : "stroke-black/[0.07] dark:stroke-white/[0.08]"
                    )}
                    strokeWidth="1"
                  >
                    {gridLines.map((line, i) => (
                      <line
                        key={i}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                      />
                    ))}
                  </g>

                  {/* Hidden Back Vertical & Bottom Edges (Dashed) */}
                  <g
                    className={cn(
                      isForcedDark
                        ? "stroke-white/25"
                        : isForcedLight
                          ? "stroke-black/20"
                          : "stroke-black/20 dark:stroke-white/25"
                    )}
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  >
                    <line
                      x1={topPlane.top.x}
                      y1={topPlane.top.y}
                      x2={bottomPlane.top.x}
                      y2={bottomPlane.top.y}
                    />
                    <line
                      x1={bottomPlane.left.x}
                      y1={bottomPlane.left.y}
                      x2={bottomPlane.top.x}
                      y2={bottomPlane.top.y}
                    />
                    <line
                      x1={bottomPlane.right.x}
                      y1={bottomPlane.right.y}
                      x2={bottomPlane.top.x}
                      y2={bottomPlane.top.y}
                    />
                  </g>

                  {/* Top Plane Internal 2x2 Grid Lines */}
                  <g
                    className={cn(
                      isForcedDark
                        ? "stroke-white/20"
                        : isForcedLight
                          ? "stroke-black/15"
                          : "stroke-black/15 dark:stroke-white/20"
                    )}
                    strokeWidth="1"
                  >
                    <line
                      x1={(topPlane.top.x + topPlane.left.x) / 2}
                      y1={(topPlane.top.y + topPlane.left.y) / 2}
                      x2={(topPlane.right.x + topPlane.bottom.x) / 2}
                      y2={(topPlane.right.y + topPlane.bottom.y) / 2}
                    />
                    <line
                      x1={(topPlane.top.x + topPlane.right.x) / 2}
                      y1={(topPlane.top.y + topPlane.right.y) / 2}
                      x2={(topPlane.left.x + topPlane.bottom.x) / 2}
                      y2={(topPlane.left.y + topPlane.bottom.y) / 2}
                    />
                  </g>

                  {/* 4 Cumulative Tiers (Rendered bottom-to-top: 0 -> 3) */}
                  {DEFAULT_STEPS.map((step, stepIndex) => {
                    const topIdx = NUM_LAYERS - 1 - stepIndex;
                    const pTop = getPlanePoints(topIdx);
                    const pBot = getPlanePoints(topIdx + 1);
                    const isFilled =
                      activeStep !== null && stepIndex <= activeStep;
                    const isTopActive = activeStep === stepIndex;

                    const leftFacePoints = `${pTop.left.x},${pTop.left.y} ${pTop.bottom.x},${pTop.bottom.y} ${pBot.bottom.x},${pBot.bottom.y} ${pBot.left.x},${pBot.left.y}`;
                    const rightFacePoints = `${pTop.bottom.x},${pTop.bottom.y} ${pTop.right.x},${pTop.right.y} ${pBot.right.x},${pBot.right.y} ${pBot.bottom.x},${pBot.bottom.y}`;
                    const topFacePoints = `${pTop.top.x},${pTop.top.y} ${pTop.right.x},${pTop.right.y} ${pTop.bottom.x},${pTop.bottom.y} ${pTop.left.x},${pTop.left.y}`;

                    return (
                      <g
                        key={step.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`${step.label}: ${step.description}`}
                        aria-pressed={lockedStep === stepIndex}
                        className="cursor-pointer outline-none"
                        onMouseEnter={() => setHoveredStep(stepIndex)}
                        onFocus={() => setHoveredStep(stepIndex)}
                        onBlur={() => setHoveredStep(null)}
                        onClick={() =>
                          setLockedStep((prev) =>
                            prev === stepIndex ? null : stepIndex
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setLockedStep((prev) =>
                              prev === stepIndex ? null : stepIndex
                            );
                          }
                        }}
                      >
                        {/* Top face (only filled on the highest active tier) */}
                        <motion.polygon
                          points={topFacePoints}
                          initial={false}
                          animate={{ opacity: isTopActive ? 1 : 0 }}
                          transition={{
                            duration: shouldReduceMotion ? 0 : 0.24,
                            ease: EASE_OUT_QUINT,
                          }}
                          fill={
                            isForcedLight
                              ? `url(#${uid}-top-face-light)`
                              : `url(#${uid}-top-face-dark)`
                          }
                          className={cn(
                            !isForcedDark &&
                              !isForcedLight &&
                              "fill-[#E4E4E7] dark:fill-[#26262A]"
                          )}
                        />

                        {/* Left side face */}
                        <motion.polygon
                          points={leftFacePoints}
                          initial={false}
                          animate={{ opacity: isFilled ? 1 : 0 }}
                          transition={{
                            duration: shouldReduceMotion ? 0 : 0.24,
                            ease: EASE_OUT_QUINT,
                          }}
                          className={cn(
                            isForcedDark
                              ? "fill-[#1E1E22]"
                              : isForcedLight
                                ? "fill-[#D4D4D8]"
                                : "fill-[#D4D4D8] dark:fill-[#1E1E22]"
                          )}
                        />

                        {/* Right side face */}
                        <motion.polygon
                          points={rightFacePoints}
                          initial={false}
                          animate={{ opacity: isFilled ? 1 : 0 }}
                          transition={{
                            duration: shouldReduceMotion ? 0 : 0.24,
                            ease: EASE_OUT_QUINT,
                          }}
                          className={cn(
                            isForcedDark
                              ? "fill-[#141417]"
                              : isForcedLight
                                ? "fill-[#E4E4E7]"
                                : "fill-[#E4E4E7] dark:fill-[#141417]"
                          )}
                        />

                        {/* Wireframe perimeter for this tier */}
                        <g
                          className={cn(
                            "transition-colors duration-200",
                            isTopActive
                              ? isForcedDark
                                ? "stroke-white/90"
                                : isForcedLight
                                  ? "stroke-black/80"
                                  : "stroke-black/80 dark:stroke-white/90"
                              : isForcedDark
                                ? "stroke-white/45"
                                : isForcedLight
                                  ? "stroke-black/30"
                                  : "stroke-black/30 dark:stroke-white/45"
                          )}
                          strokeWidth={isTopActive ? "1.25" : "1"}
                          fill="none"
                        >
                          {/* Top diamond front edges */}
                          <polyline
                            points={`${pTop.left.x},${pTop.left.y} ${pTop.bottom.x},${pTop.bottom.y} ${pTop.right.x},${pTop.right.y}`}
                          />
                          {/* Top diamond back edges */}
                          <polyline
                            points={`${pTop.left.x},${pTop.left.y} ${pTop.top.x},${pTop.top.y} ${pTop.right.x},${pTop.right.y}`}
                            opacity={isFilled && !isTopActive ? 0.22 : 0.85}
                          />
                          {/* Bottom diamond front edges */}
                          <polyline
                            points={`${pBot.left.x},${pBot.left.y} ${pBot.bottom.x},${pBot.bottom.y} ${pBot.right.x},${pBot.right.y}`}
                          />
                          {/* Vertical corner posts */}
                          <line
                            x1={pTop.left.x}
                            y1={pTop.left.y}
                            x2={pBot.left.x}
                            y2={pBot.left.y}
                          />
                          <line
                            x1={pTop.bottom.x}
                            y1={pTop.bottom.y}
                            x2={pBot.bottom.x}
                            y2={pBot.bottom.y}
                          />
                          <line
                            x1={pTop.right.x}
                            y1={pTop.right.y}
                            x2={pBot.right.x}
                            y2={pBot.right.y}
                          />
                        </g>

                        {/* Vertex anchor dots */}
                        <g
                          className={cn(
                            isForcedDark
                              ? "fill-[#0A0A0A] stroke-white/80"
                              : isForcedLight
                                ? "fill-[#FAFAFA] stroke-black/70"
                                : "fill-[#FAFAFA] stroke-black/70 dark:fill-[#0A0A0A] dark:stroke-white/80"
                          )}
                          strokeWidth="1.2"
                        >
                          <circle cx={pTop.left.x} cy={pTop.left.y} r="2.2" />
                          <circle
                            cx={pTop.bottom.x}
                            cy={pTop.bottom.y}
                            r="2.2"
                          />
                          <circle cx={pTop.right.x} cy={pTop.right.y} r="2.2" />
                          <circle cx={pTop.top.x} cy={pTop.top.y} r="2.2" />
                        </g>
                      </g>
                    );
                  })}

                  {/* Isometric Cited Brand Ring on Top Plane */}
                  <g
                    transform={`translate(${CX}, ${TOP_Y + DY - 12}) scale(1, 0.577) rotate(-45)`}
                    className="pointer-events-none"
                  >
                    <path
                      d="M 18 0 A 18 18 0 1 1 5.5 -17.1"
                      fill="none"
                      stroke={isForcedLight ? "#18181B" : "#F5F5F7"}
                      className={cn(
                        !isForcedDark &&
                          !isForcedLight &&
                          "stroke-[#18181B] dark:stroke-[#F5F5F7]"
                      )}
                      strokeWidth="5.5"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="14"
                      cy="-11"
                      r="3.2"
                      fill={isForcedLight ? "#18181B" : "#F5F5F7"}
                      className={cn(
                        !isForcedDark &&
                          !isForcedLight &&
                          "fill-[#18181B] dark:fill-[#F5F5F7]"
                      )}
                    />
                  </g>

                  {/* Active Tier Connector Line + Dot */}
                  <AnimatePresence>
                    {activeData && (
                      <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, y: activeConnectorY }}
                        exit={{ opacity: 0 }}
                        transition={
                          shouldReduceMotion
                            ? { duration: 0 }
                            : {
                                opacity: { duration: 0.18 },
                                y: CONNECTOR_SPRING,
                              }
                        }
                        className="pointer-events-none"
                      >
                        <line
                          x1={108}
                          y1={0}
                          x2={CX - DX - 10}
                          y2={0}
                          className={cn(
                            isForcedDark
                              ? "stroke-white/35"
                              : isForcedLight
                                ? "stroke-black/30"
                                : "stroke-black/30 dark:stroke-white/35"
                          )}
                          strokeWidth="1"
                        />
                        <circle
                          cx={CX - DX - 10}
                          cy={0}
                          r="2.6"
                          className={cn(
                            isForcedDark
                              ? "fill-white"
                              : isForcedLight
                                ? "fill-[#09090B]"
                                : "fill-[#09090B] dark:fill-white"
                          )}
                        />
                      </motion.g>
                    )}
                  </AnimatePresence>
                </svg>

                {/* Active Tier Callout Label (positioned cleanly on left side) */}
                <AnimatePresence mode="wait">
                  {activeData && activePlaneIndex !== null && (
                    <motion.div
                      key={activeData.id}
                      initial={
                        shouldReduceMotion
                          ? { opacity: 1 }
                          : { opacity: 0, x: -6 }
                      }
                      animate={{ opacity: 1, x: 0 }}
                      exit={
                        shouldReduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, x: -4 }
                      }
                      transition={{
                        duration: shouldReduceMotion ? 0 : 0.2,
                        ease: EASE_OUT_QUINT,
                      }}
                      style={{
                        top: `${(activeConnectorY / 440) * 100}%`,
                      }}
                      className="pointer-events-none absolute left-0 hidden w-[18%] -translate-y-1/2 pr-2 text-right sm:block"
                    >
                      <p
                        className={cn(
                          "text-[0.82rem] font-semibold leading-tight",
                          cardStrongText
                        )}
                      >
                        {activeData.label}
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-[0.72rem] leading-[1.35]",
                          subtitleClasses
                        )}
                      >
                        {activeData.description}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Mobile Interactive Step Pills */}
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:hidden">
                  {DEFAULT_STEPS.map((step, idx) => {
                    const selected = activeStep === idx;
                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() =>
                          setLockedStep((prev) => (prev === idx ? null : idx))
                        }
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          selected
                            ? isForcedLight
                              ? "border-black/25 bg-black/5 text-[#09090B]"
                              : "border-white/30 bg-white/10 text-white"
                            : isForcedLight
                              ? "border-black/10 text-[#52525B]"
                              : "border-white/10 text-[#8E8E93]"
                        )}
                      >
                        {step.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      </MotionConfig>
    );
  }
);

IsometricRankingStack.displayName = "IsometricRankingStack";

export { IsometricRankingStack as component, IsometricRankingStack as Component };
export default IsometricRankingStack;