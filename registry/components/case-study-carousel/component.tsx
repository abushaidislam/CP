"use client";

import * as React from "react";
import { motion, useReducedMotion, type PanInfo } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

export interface CaseStudyMetric {
  value: string;
  label: string;
}

export interface CaseStudyItem {
  id: string;
  brandName: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  metrics: CaseStudyMetric[];
  visualVariant?: "ferrofluid" | "prism" | "torus" | "sphere" | "monolith";
  imageUrl?: string;
  imageAlt?: string;
}

export interface CaseStudyCarouselProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  badgeIndex?: string;
  badgeLabel?: string;
  heading?: string;
  items?: CaseStudyItem[];
  initialIndex?: number;
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  onCardAction?: (item: CaseStudyItem, index: number) => void;
  onExploreAll?: () => void;
  exploreAllLabel?: string;
  theme?: "light" | "dark";
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showMetrics?: boolean;
  showArrows?: boolean;
  showDots?: boolean;
}

const DEFAULT_ITEMS: CaseStudyItem[] = [
  {
    id: "lgpsmi-workflow",
    brandName: "LGPSMI®",
    title: "AI Workflow Automation for SaaS Company",
    description:
      "We analyze your workflows, bottlenecks, and revenue opportunities.",
    ctaLabel: "Read More",
    ctaHref: "#case-study-lgpsmi",
    visualVariant: "ferrofluid",
    metrics: [
      { value: "+40%", label: "Demo Booking" },
      { value: "+25%", label: "Closing Rate" },
      { value: "3x", label: "Engagement" },
    ],
  },
  {
    id: "linear-ops",
    brandName: "KINETIC",
    title: "Task Assignment for Productive Teams",
    description:
      "Automated sprint triage and smart workload balancing across engineering squads.",
    ctaLabel: "Read More",
    ctaHref: "#case-study-kinetic",
    visualVariant: "prism",
    metrics: [
      { value: "4x", label: "Productivity" },
      { value: "-52%", label: "Triage Time" },
      { value: "99.4%", label: "SLA Delivery" },
    ],
  },
  {
    id: "vortex-billing",
    brandName: "VELORA",
    title: "Predictive Revenue & Churn Intelligence",
    description:
      "Real-time cohort telemetry that flags expansion signals before renewal windows.",
    ctaLabel: "Read More",
    ctaHref: "#case-study-velora",
    visualVariant: "torus",
    metrics: [
      { value: "+31%", label: "Net Retention" },
      { value: "-18%", label: "Churn Rate" },
      { value: "2.4x", label: "LTV Growth" },
    ],
  },
  {
    id: "stratum-support",
    brandName: "STRATUM",
    title: "Autonomous Tier-1 Support Resolution",
    description:
      "Context-aware knowledge synthesis integrated directly into live customer chat.",
    ctaLabel: "Read More",
    ctaHref: "#case-study-stratum",
    visualVariant: "sphere",
    metrics: [
      { value: "78%", label: "Auto-Resolved" },
      { value: "14s", label: "First Response" },
      { value: "4.9/5", label: "CSAT Score" },
    ],
  },
  {
    id: "monolith-data",
    brandName: "MONOLITH",
    title: "Zero-Latency Pipeline Orchestration",
    description:
      "Unified event streaming and schema validation for high-volume fintech ledgers.",
    ctaLabel: "Read More",
    ctaHref: "#case-study-monolith",
    visualVariant: "monolith",
    metrics: [
      { value: "12ms", label: "P99 Latency" },
      { value: "+64%", label: "Throughput" },
      { value: "100%", label: "Audit Trace" },
    ],
  },
];

function BrandMark({
  name,
  isDark,
}: {
  name: string;
  isDark: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-2">
      <svg
        width="20"
        height="14"
        viewBox="0 0 20 14"
        fill="none"
        aria-hidden="true"
        className={isDark ? "text-neutral-100" : "text-neutral-900"}
      >
        <path
          d="M1 12.5L5.5 1.5H18.5L14 12.5H1Z"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
        <path
          d="M4.5 12.5L8.2 1.5M8 12.5L11.7 1.5M11.5 12.5L15.2 1.5"
          stroke="currentColor"
          strokeWidth="1.1"
        />
      </svg>
      <span
        className={cn(
          "text-[13px] font-semibold tracking-[0.06em] uppercase",
          isDark ? "text-neutral-100" : "text-neutral-900"
        )}
      >
        {name}
      </span>
    </div>
  );
}

function CaseStudyArtwork({
  variant = "ferrofluid",
  uid,
  imageUrl,
  imageAlt,
}: {
  variant?: CaseStudyItem["visualVariant"];
  uid: string;
  imageUrl?: string;
  imageAlt?: string;
}) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={imageAlt || "Case study visual"}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    );
  }

  if (variant === "ferrofluid") {
    return (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#2B2D31] via-[#1C1D21] to-[#0F1013]">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(circle at 32% 24%, rgba(255,255,255,0.14), transparent 55%)",
          }}
        />
        <svg
          viewBox="0 0 220 220"
          className="relative h-[78%] w-[78%] drop-shadow-[0_22px_28px_rgba(0,0,0,0.75)]"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id={`${uid}-ferro-base`} cx="45%" cy="38%" r="60%">
              <stop offset="0%" stopColor="#43464D" />
              <stop offset="45%" stopColor="#17181C" />
              <stop offset="85%" stopColor="#070709" />
              <stop offset="100%" stopColor="#020203" />
            </radialGradient>
            <linearGradient
              id={`${uid}-ferro-shine`}
              x1="20%"
              y1="10%"
              x2="80%"
              y2="90%"
            >
              <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
              <stop offset="35%" stopColor="rgba(255,255,255,0.12)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          <ellipse
            cx="110"
            cy="146"
            rx="72"
            ry="32"
            fill={`url(#${uid}-ferro-base)`}
          />
          <path
            d="M44 143 C58 143 85 130 98 106 C105 92 108 78 110 68 C112 78 115 92 122 106 C135 130 162 143 176 143 C170 164 142 174 110 174 C78 174 50 164 44 143 Z"
            fill={`url(#${uid}-ferro-base)`}
          />
          <path
            d="M84 126 C95 112 102 96 106 80 C104 98 98 114 88 128 Z"
            fill={`url(#${uid}-ferro-shine)`}
          />
          <ellipse
            cx="78"
            cy="148"
            rx="22"
            ry="7"
            fill="rgba(255,255,255,0.16)"
          />
          <ellipse
            cx="144"
            cy="147"
            rx="16"
            ry="5"
            fill="rgba(255,255,255,0.12)"
          />
          <path
            d="M110 43 C113.5 49 116 54 116 58.5 C116 62 113.3 64.5 110 64.5 C106.7 64.5 104 62 104 58.5 C104 54 106.5 49 110 43 Z"
            fill={`url(#${uid}-ferro-base)`}
          />
          <circle cx="108.5" cy="57" r="1.8" fill="rgba(255,255,255,0.75)" />
        </svg>
      </div>
    );
  }

  if (variant === "prism") {
    return (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#F3F4F6] via-[#E5E7EB] to-[#D1D5DB]">
        <svg viewBox="0 0 220 220" className="h-[72%] w-[72%]" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-prism-g1`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#D4D4D8" />
              <stop offset="100%" stopColor="#71717A" />
            </linearGradient>
          </defs>
          <rect
            x="55"
            y="55"
            width="110"
            height="110"
            rx="28"
            transform="rotate(-14 110 110)"
            fill={`url(#${uid}-prism-g1)`}
          />
          <rect
            x="64"
            y="64"
            width="92"
            height="92"
            rx="22"
            transform="rotate(8 110 110)"
            fill="rgba(255,255,255,0.65)"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    );
  }

  if (variant === "torus") {
    return (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#1F242D] via-[#15181E] to-[#0B0D11]">
        <svg viewBox="0 0 220 220" className="h-[72%] w-[72%]" aria-hidden="true">
          <defs>
            <linearGradient id={`${uid}-torus-g`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A5B4FC" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#3F3F46" />
              <stop offset="100%" stopColor="#18181B" />
            </linearGradient>
          </defs>
          <circle
            cx="110"
            cy="110"
            r="56"
            fill="none"
            stroke={`url(#${uid}-torus-g)`}
            strokeWidth="26"
          />
          <circle
            cx="110"
            cy="110"
            r="56"
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    );
  }

  if (variant === "sphere") {
    return (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#27272A] via-[#18181B] to-[#09090B]">
        <svg viewBox="0 0 220 220" className="h-[70%] w-[70%]" aria-hidden="true">
          <defs>
            <radialGradient id={`${uid}-sphere-g`} cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#F4F4F5" />
              <stop offset="35%" stopColor="#71717A" />
              <stop offset="85%" stopColor="#18181B" />
              <stop offset="100%" stopColor="#09090B" />
            </radialGradient>
          </defs>
          <circle cx="110" cy="110" r="58" fill={`url(#${uid}-sphere-g)`} />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#1E1E24] via-[#141418] to-[#09090B]">
      <svg viewBox="0 0 220 220" className="h-[72%] w-[72%]" aria-hidden="true">
        <defs>
          <linearGradient id={`${uid}-mono-g`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#52525B" />
            <stop offset="100%" stopColor="#18181B" />
          </linearGradient>
        </defs>
        <rect
          x="52"
          y="46"
          width="50"
          height="128"
          rx="14"
          fill={`url(#${uid}-mono-g)`}
        />
        <rect
          x="118"
          y="46"
          width="50"
          height="128"
          rx="14"
          fill="rgba(255,255,255,0.12)"
          stroke="rgba(255,255,255,0.2)"
        />
      </svg>
    </div>
  );
}

function getCircularOffset(index: number, activeIndex: number, total: number) {
  if (total <= 1) return 0;
  let diff = index - activeIndex;
  const half = total / 2;
  if (diff > half) diff -= total;
  if (diff < -half) diff += total;
  return diff;
}

export const CaseStudyCarousel = React.forwardRef<
  HTMLElement,
  CaseStudyCarouselProps
>(
  (
    {
      badgeIndex = "005",
      badgeLabel = "CASE STUDIES",
      heading = "What We’ve Built",
      items = DEFAULT_ITEMS,
      initialIndex = 0,
      activeIndex: controlledIndex,
      onActiveIndexChange,
      onCardAction,
      onExploreAll,
      exploreAllLabel = "Explore all Case Studies",
      theme = "light",
      autoPlay = false,
      autoPlayInterval = 5000,
      showMetrics = true,
      showArrows = true,
      showDots = true,
      className,
      ...rest
    },
    ref
  ) => {
    const uid = React.useId().replace(/:/g, "");
    const headingId = `${uid}-heading`;
    const shouldReduceMotion = useReducedMotion();

    const safeItems = items.length > 0 ? items : DEFAULT_ITEMS;
    const total = safeItems.length;

    const [internalIndex, setInternalIndex] = React.useState(() =>
      Math.max(0, Math.min(initialIndex, total - 1))
    );
    const [isPaused, setIsPaused] = React.useState(false);

    const isControlled = controlledIndex !== undefined;
    const currentIndex = isControlled
      ? ((controlledIndex % total) + total) % total
      : ((internalIndex % total) + total) % total;

    const setIndex = React.useCallback(
      (next: number) => {
        const normalized = ((next % total) + total) % total;
        if (!isControlled) {
          setInternalIndex(normalized);
        }
        onActiveIndexChange?.(normalized);
      },
      [isControlled, onActiveIndexChange, total]
    );

    const handlePrev = React.useCallback(() => {
      setIndex(currentIndex - 1);
    }, [currentIndex, setIndex]);

    const handleNext = React.useCallback(() => {
      setIndex(currentIndex + 1);
    }, [currentIndex, setIndex]);

    React.useEffect(() => {
      if (!autoPlay || isPaused || total <= 1) return;
      const delay = Math.max(1500, autoPlayInterval);
      const timer = window.setInterval(() => {
        setIndex(currentIndex + 1);
      }, delay);
      return () => window.clearInterval(timer);
    }, [autoPlay, autoPlayInterval, currentIndex, isPaused, setIndex, total]);

    const handleDragEnd = (
      _event: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo
    ) => {
      if (total <= 1) return;
      if (info.offset.x < -50 || info.velocity.x < -300) {
        handleNext();
      } else if (info.offset.x > 50 || info.velocity.x > 300) {
        handlePrev();
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    };

    const isDark = theme === "dark";

    const springTransition = shouldReduceMotion
      ? { duration: 0.15 }
      : {
          type: "spring" as const,
          stiffness: 270,
          damping: 30,
          mass: 0.9,
        };

    return (
      <section
        ref={ref}
        aria-labelledby={headingId}
        aria-roledescription="carousel"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={() => setIsPaused(false)}
        className={cn(
          "relative w-full max-w-[1040px] overflow-hidden rounded-[36px] px-4 py-12 sm:rounded-[44px] sm:px-8 sm:py-16 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400",
          isDark
            ? "bg-[#0D0E12] text-neutral-50 border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.75)]"
            : "bg-white text-neutral-950 border border-black/[0.04] shadow-[0_30px_80px_-24px_rgba(0,0,0,0.12)]",
          className
        )}
        {...rest}
      >
        {/* Top Eyebrow & Heading */}
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[10px] font-medium tracking-[0.08em] uppercase",
              isDark
                ? "bg-white/[0.07] text-neutral-200 ring-1 ring-white/10"
                : "bg-neutral-100/90 text-neutral-800 ring-1 ring-black/[0.04]"
            )}
          >
            <span className={isDark ? "text-neutral-400" : "text-neutral-400"}>
              {badgeIndex}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isDark ? "bg-neutral-100" : "bg-neutral-900"
              )}
            />
            <span>{badgeLabel}</span>
          </div>

          <h2
            id={headingId}
            className={cn(
              "mt-4 text-3xl font-medium tracking-[-0.03em] sm:text-4xl md:text-[42px] md:leading-[1.12]",
              isDark ? "text-white" : "text-[#141414]"
            )}
          >
            {heading}
          </h2>
        </div>

        {/* Multi-Card Depth Carousel Stage */}
        <div
          className="relative mx-auto mt-8 flex h-[470px] w-full max-w-[920px] items-center justify-center sm:mt-10 sm:h-[330px]"
          aria-live="polite"
        >
          {safeItems.map((item, idx) => {
            const offset = getCircularOffset(idx, currentIndex, total);
            const absOffset = Math.abs(offset);
            const isActive = offset === 0;
            const isNeighbor = absOffset === 1;
            const isVisible = absOffset <= 2;

            if (!isVisible && total > 3) return null;

            const xPercent = offset * 44;
            const scale = isActive ? 1 : isNeighbor ? 0.83 : 0.72;
            const opacity = isActive ? 1 : isNeighbor ? 0.65 : 0;
            const zIndex = isActive ? 30 : isNeighbor ? 20 : 10;

            return (
              <motion.article
                key={item.id}
                aria-hidden={!isActive}
                drag={isActive && total > 1 && !shouldReduceMotion ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.16}
                onDragEnd={isActive ? handleDragEnd : undefined}
                onClick={() => {
                  if (!isActive && isNeighbor) {
                    setIndex(idx);
                  }
                }}
                initial={false}
                animate={{
                  x: `${xPercent}%`,
                  scale,
                  opacity,
                  zIndex,
                }}
                transition={springTransition}
                style={{
                  pointerEvents: isActive || isNeighbor ? "auto" : "none",
                }}
                className={cn(
                  "absolute flex w-[92%] max-w-[650px] flex-col overflow-hidden rounded-[34px] p-2.5 sm:h-[308px] sm:flex-row sm:rounded-[40px] sm:p-3",
                  isActive ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
                  isDark
                    ? "bg-[#17181E] border border-white/10 shadow-[0_24px_60px_-14px_rgba(0,0,0,0.7)]"
                    : "bg-[#F5F5F7] border border-black/[0.045] shadow-[0_22px_50px_-14px_rgba(0,0,0,0.1)]"
                )}
              >
                {/* Left Visual Frame */}
                <div
                  className={cn(
                    "relative h-[185px] w-full shrink-0 overflow-hidden rounded-[26px] sm:h-full sm:w-[46%] sm:rounded-[32px]",
                    isDark
                      ? "ring-1 ring-inset ring-white/10"
                      : "ring-1 ring-inset ring-black/[0.06]"
                  )}
                >
                  <CaseStudyArtwork
                    variant={item.visualVariant}
                    uid={`${uid}-${item.id}`}
                    imageUrl={item.imageUrl}
                    imageAlt={item.imageAlt || item.title}
                  />
                </div>

                {/* Right Content Frame */}
                <div className="flex flex-1 flex-col justify-between px-4 py-4 sm:px-7 sm:py-5">
                  <div>
                    <BrandMark name={item.brandName} isDark={isDark} />

                    <h3
                      className={cn(
                        "mt-3.5 text-lg font-medium leading-[1.24] tracking-[-0.02em] sm:text-[21px]",
                        isDark ? "text-neutral-50" : "text-neutral-900"
                      )}
                    >
                      {item.title}
                    </h3>

                    <p
                      className={cn(
                        "mt-2 text-xs leading-[1.55] sm:text-[13px]",
                        isDark ? "text-neutral-400" : "text-neutral-500"
                      )}
                    >
                      {item.description}
                    </p>

                    <div className="mt-3.5">
                      <a
                        href={item.ctaHref || "#"}
                        tabIndex={isActive ? 0 : -1}
                        onClick={(e) => {
                          if (!item.ctaHref || item.ctaHref.startsWith("#")) {
                            e.preventDefault();
                          }
                          e.stopPropagation();
                          onCardAction?.(item, idx);
                        }}
                        className={cn(
                          "group inline-flex items-center gap-1.5 text-xs font-medium underline underline-offset-4 transition-colors",
                          isDark
                            ? "text-neutral-200 decoration-neutral-500 hover:text-white"
                            : "text-neutral-900 decoration-neutral-400 hover:text-neutral-700"
                        )}
                      >
                        <span>{item.ctaLabel || "Read More"}</span>
                        <span
                          className={cn(
                            "inline-flex h-4 w-4 items-center justify-center rounded-full transition-transform duration-200 group-hover:translate-x-0.5",
                            isDark
                              ? "bg-neutral-700 text-neutral-100"
                              : "bg-neutral-400/80 text-white"
                          )}
                        >
                          <ArrowRight className="h-2.5 w-2.5" />
                        </span>
                      </a>
                    </div>
                  </div>

                  {showMetrics && item.metrics.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-2 pt-2">
                      {item.metrics.slice(0, 3).map((metric, mIdx) => (
                        <div key={`${item.id}-metric-${mIdx}`} className="min-w-0">
                          <div
                            className={cn(
                              "truncate text-lg font-medium tracking-[-0.02em] sm:text-[21px]",
                              isDark ? "text-white" : "text-neutral-900"
                            )}
                          >
                            {metric.value}
                          </div>
                          <div
                            className={cn(
                              "truncate text-[10px] sm:text-[11px]",
                              isDark ? "text-neutral-400" : "text-neutral-400"
                            )}
                          >
                            {metric.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.article>
            );
          })}

          {/* Left / Right Circular Controls */}
          {showArrows && total > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous case study"
                className={cn(
                  "absolute left-1 z-40 flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-150 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 sm:left-4",
                  isDark
                    ? "bg-neutral-800 text-white ring-2 ring-white/15 shadow-lg focus-visible:ring-white"
                    : "bg-neutral-950 text-white ring-2 ring-white/90 shadow-[0_8px_20px_rgba(0,0,0,0.22)] focus-visible:ring-neutral-900"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Next case study"
                className={cn(
                  "absolute right-1 z-40 flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-150 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 sm:right-4",
                  isDark
                    ? "bg-neutral-800 text-white ring-2 ring-white/15 shadow-lg focus-visible:ring-white"
                    : "bg-neutral-950 text-white ring-2 ring-white/90 shadow-[0_8px_20px_rgba(0,0,0,0.22)] focus-visible:ring-neutral-900"
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Pagination Dots */}
        {showDots && total > 1 && (
          <div
            className="mt-4 flex items-center justify-center gap-1.5"
            role="tablist"
            aria-label="Case study slides"
          >
            {safeItems.map((item, idx) => {
              const active = idx === currentIndex;
              return (
                <button
                  key={`${item.id}-dot`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`Go to ${item.brandName} case study`}
                  onClick={() => setIndex(idx)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400",
                    active
                      ? "w-5 bg-gradient-to-r from-amber-200 via-rose-200 to-indigo-300"
                      : isDark
                        ? "w-1.5 bg-neutral-700 hover:bg-neutral-500"
                        : "w-1.5 bg-neutral-200 hover:bg-neutral-300"
                  )}
                />
              );
            })}
          </div>
        )}

        {/* Bottom Primary CTA */}
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={onExploreAll}
            className={cn(
              "relative inline-flex items-center justify-center rounded-full px-6 py-2.5 text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus-visible:ring-2",
              isDark
                ? "bg-white text-neutral-950 shadow-[0_0_24px_rgba(165,180,252,0.28)] hover:bg-neutral-100 focus-visible:ring-white"
                : "bg-neutral-950 text-white shadow-[0_0_24px_rgba(129,140,248,0.26),0_6px_18px_rgba(0,0,0,0.2)] ring-1 ring-indigo-300/30 hover:bg-neutral-900 focus-visible:ring-neutral-900"
            )}
          >
            {exploreAllLabel}
          </button>
        </div>
      </section>
    );
  }
);

CaseStudyCarousel.displayName = "CaseStudyCarousel";

export {
  CaseStudyCarousel as component,
  CaseStudyCarousel as Component,
};
export default CaseStudyCarousel;