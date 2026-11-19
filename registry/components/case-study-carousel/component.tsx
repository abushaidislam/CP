"use client";

import * as React from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
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
  accentGradient?: string;
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
  glassmorphism?: boolean;
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
    accentGradient:
      "from-indigo-400/25 via-rose-300/20 to-amber-200/25",
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
    accentGradient:
      "from-sky-400/25 via-cyan-300/20 to-indigo-300/25",
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
    accentGradient:
      "from-violet-400/25 via-fuchsia-300/20 to-sky-300/25",
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
    accentGradient:
      "from-emerald-300/25 via-teal-300/20 to-cyan-300/25",
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
    accentGradient:
      "from-amber-300/25 via-orange-300/20 to-rose-300/25",
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
  isActive,
  shouldReduceMotion,
  imageUrl,
  imageAlt,
}: {
  variant?: CaseStudyItem["visualVariant"];
  uid: string;
  isActive: boolean;
  shouldReduceMotion: boolean | null;
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

  const floatAnimation =
    isActive && !shouldReduceMotion
      ? {
          y: [0, -4, 0],
          scale: [1, 1.025, 1],
        }
      : { y: 0, scale: 1 };

  const floatTransition =
    isActive && !shouldReduceMotion
      ? {
          duration: 4.5,
          repeat: Infinity,
          repeatType: "mirror" as const,
          ease: "easeInOut" as const,
        }
      : { duration: 0.3 };

  if (variant === "ferrofluid") {
    return (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#2B2D31] via-[#1C1D21] to-[#0E0F12]">
        <div
          className="pointer-events-none absolute inset-0 opacity-75"
          style={{
            background:
              "radial-gradient(circle at 30% 22%, rgba(165,180,252,0.18), transparent 52%), radial-gradient(circle at 75% 78%, rgba(251,191,36,0.12), transparent 50%)",
          }}
        />
        <motion.svg
          viewBox="0 0 220 220"
          animate={floatAnimation}
          transition={floatTransition}
          className="relative h-[78%] w-[78%] drop-shadow-[0_22px_28px_rgba(0,0,0,0.78)]"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id={`${uid}-ferro-base`} cx="45%" cy="38%" r="60%">
              <stop offset="0%" stopColor="#4A4E57" />
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
              <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
              <stop offset="35%" stopColor="rgba(255,255,255,0.14)" />
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
          <circle cx="108.5" cy="57" r="1.8" fill="rgba(255,255,255,0.8)" />
        </motion.svg>
      </div>
    );
  }

  if (variant === "prism") {
    return (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#F1F5F9] via-[#E2E8F0] to-[#CBD5E1]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 30% 25%, rgba(56,189,248,0.28), transparent 55%), radial-gradient(circle at 78% 80%, rgba(129,140,248,0.22), transparent 50%)",
          }}
        />
        <motion.svg
          viewBox="0 0 220 220"
          animate={floatAnimation}
          transition={floatTransition}
          className="relative h-[74%] w-[74%] drop-shadow-[0_18px_24px_rgba(15,23,42,0.14)]"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`${uid}-prism-g1`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#64748B" />
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
            fill="rgba(255,255,255,0.62)"
            stroke="rgba(255,255,255,0.95)"
            strokeWidth="1.5"
          />
        </motion.svg>
      </div>
    );
  }

  if (variant === "torus") {
    return (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#1E1B2E] via-[#151421] to-[#0A0A10]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 30% 25%, rgba(192,132,252,0.22), transparent 55%)",
          }}
        />
        <motion.svg
          viewBox="0 0 220 220"
          animate={floatAnimation}
          transition={floatTransition}
          className="relative h-[74%] w-[74%] drop-shadow-[0_20px_28px_rgba(0,0,0,0.65)]"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`${uid}-torus-g`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C4B5FD" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#4C1D95" />
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
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1.5"
          />
        </motion.svg>
      </div>
    );
  }

  if (variant === "sphere") {
    return (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#132A27] via-[#0F1E1D] to-[#080F0E]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 32% 28%, rgba(52,211,153,0.22), transparent 55%)",
          }}
        />
        <motion.svg
          viewBox="0 0 220 220"
          animate={floatAnimation}
          transition={floatTransition}
          className="relative h-[70%] w-[70%] drop-shadow-[0_20px_28px_rgba(0,0,0,0.65)]"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id={`${uid}-sphere-g`} cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#ECFDF5" />
              <stop offset="35%" stopColor="#34D399" stopOpacity="0.85" />
              <stop offset="85%" stopColor="#064E3B" />
              <stop offset="100%" stopColor="#022C22" />
            </radialGradient>
          </defs>
          <circle cx="110" cy="110" r="58" fill={`url(#${uid}-sphere-g)`} />
        </motion.svg>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#271E1B] via-[#1A1412] to-[#0D0A09]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 30% 25%, rgba(251,191,36,0.2), transparent 55%)",
        }}
      />
      <motion.svg
        viewBox="0 0 220 220"
        animate={floatAnimation}
        transition={floatTransition}
        className="relative h-[72%] w-[72%]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`${uid}-mono-g`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#27272A" />
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
          stroke="rgba(255,255,255,0.24)"
        />
      </motion.svg>
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
      glassmorphism = true,
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

    const activeItem = safeItems[currentIndex];

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
      if (info.offset.x < -45 || info.velocity.x < -280) {
        handleNext();
      } else if (info.offset.x > 45 || info.velocity.x > 280) {
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
          stiffness: 215,
          damping: 28,
          mass: 1.02,
        };

    const activeAura =
      activeItem?.accentGradient ||
      "from-indigo-400/25 via-rose-300/20 to-amber-200/25";

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
            ? "bg-[#0B0C10] text-neutral-50 border border-white/10 shadow-[0_32px_90px_-20px_rgba(0,0,0,0.85)]"
            : "bg-white text-neutral-950 border border-black/[0.04] shadow-[0_32px_90px_-24px_rgba(0,0,0,0.12)]",
          className
        )}
        {...rest}
      >
        {/* Ambient Dynamic Color Aura (enhances glassmorphism depth) */}
        {glassmorphism && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeItem?.id || currentIndex}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: shouldReduceMotion ? 0.15 : 0.7, ease: "easeOut" }}
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute left-1/2 top-1/2 h-[380px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r blur-[90px]",
                activeAura,
                isDark ? "opacity-55" : "opacity-75"
              )}
            />
          </AnimatePresence>
        )}

        {/* Top Eyebrow & Heading */}
        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[10px] font-medium tracking-[0.08em] uppercase",
              glassmorphism
                ? isDark
                  ? "bg-white/[0.08] backdrop-blur-md text-neutral-200 ring-1 ring-white/15 shadow-sm"
                  : "bg-white/75 backdrop-blur-md text-neutral-800 ring-1 ring-black/[0.06] shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
                : isDark
                  ? "bg-white/[0.07] text-neutral-200 ring-1 ring-white/10"
                  : "bg-neutral-100/90 text-neutral-800 ring-1 ring-black/[0.04]"
            )}
          >
            <span className="text-neutral-400">{badgeIndex}</span>
            <span
              aria-hidden="true"
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isDark ? "bg-neutral-100" : "bg-neutral-900"
              )}
            />
            <span>{badgeLabel}</span>
          </motion.div>

          <motion.h2
            id={headingId}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05, ease: "easeOut" }}
            className={cn(
              "mt-4 text-3xl font-medium tracking-[-0.03em] sm:text-4xl md:text-[42px] md:leading-[1.12]",
              isDark ? "text-white" : "text-[#141414]"
            )}
          >
            {heading}
          </motion.h2>
        </div>

        {/* Multi-Card 3D Perspective Depth Stage */}
        <div
          className="relative z-10 mx-auto mt-8 flex h-[480px] w-full max-w-[920px] items-center justify-center sm:mt-10 sm:h-[336px]"
          style={{ perspective: "1200px" }}
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
            const rotateY = shouldReduceMotion ? 0 : offset * -6;
            const opacity = isActive ? 1 : isNeighbor ? 0.72 : 0;
            const zIndex = isActive ? 30 : isNeighbor ? 20 : 10;
            const blurValue =
              shouldReduceMotion || isActive ? "blur(0px)" : "blur(1.25px)";

            return (
              <motion.article
                key={item.id}
                aria-hidden={!isActive}
                drag={isActive && total > 1 && !shouldReduceMotion ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
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
                  rotateY,
                  opacity,
                  zIndex,
                  filter: blurValue,
                }}
                transition={springTransition}
                style={{
                  pointerEvents: isActive || isNeighbor ? "auto" : "none",
                  transformStyle: "preserve-3d",
                }}
                className={cn(
                  "absolute flex w-[92%] max-w-[650px] flex-col overflow-hidden rounded-[34px] p-2.5 sm:h-[312px] sm:flex-row sm:rounded-[40px] sm:p-3",
                  isActive ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
                  glassmorphism
                    ? isDark
                      ? "bg-white/[0.06] backdrop-blur-2xl border border-white/15 ring-1 ring-inset ring-white/10 shadow-[0_28px_70px_-14px_rgba(0,0,0,0.8)]"
                      : "bg-white/75 backdrop-blur-2xl border border-white/80 ring-1 ring-inset ring-black/[0.04] shadow-[0_24px_60px_-14px_rgba(15,23,42,0.12)]"
                    : isDark
                      ? "bg-[#17181E] border border-white/10 shadow-[0_24px_60px_-14px_rgba(0,0,0,0.7)]"
                      : "bg-[#F5F5F7] border border-black/[0.045] shadow-[0_22px_50px_-14px_rgba(0,0,0,0.1)]"
                )}
              >
                {/* Specular Glass Highlight Strip */}
                {glassmorphism && (
                  <div
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent to-transparent",
                      isDark ? "via-white/30" : "via-white"
                    )}
                  />
                )}

                {/* Left Visual Frame */}
                <div
                  className={cn(
                    "relative h-[185px] w-full shrink-0 overflow-hidden rounded-[26px] sm:h-full sm:w-[46%] sm:rounded-[32px]",
                    isDark
                      ? "ring-1 ring-inset ring-white/15"
                      : "ring-1 ring-inset ring-black/[0.06]"
                  )}
                >
                  <CaseStudyArtwork
                    variant={item.visualVariant}
                    uid={`${uid}-${item.id}`}
                    isActive={isActive}
                    shouldReduceMotion={shouldReduceMotion}
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
                        isDark ? "text-neutral-400" : "text-neutral-600"
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
                              ? "bg-white/15 text-neutral-100"
                              : "bg-neutral-500/80 text-white"
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
                        <motion.div
                          key={`${item.id}-metric-${mIdx}`}
                          initial={false}
                          animate={{
                            opacity: isActive ? 1 : 0.65,
                            y: isActive || shouldReduceMotion ? 0 : 4,
                          }}
                          transition={{
                            duration: shouldReduceMotion ? 0.1 : 0.35,
                            delay: isActive && !shouldReduceMotion ? mIdx * 0.05 : 0,
                            ease: "easeOut",
                          }}
                          className="min-w-0"
                        >
                          <div
                            className={cn(
                              "truncate text-lg font-medium tracking-[-0.02em] sm:text-[21px]",
                              isDark ? "text-white" : "text-neutral-900"
                            )}
                          >
                            {metric.value}
                          </div>
                          <div className="truncate text-[10px] text-neutral-400 sm:text-[11px]">
                            {metric.label}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.article>
            );
          })}

          {/* Left / Right Glassmorphic Circular Controls */}
          {showArrows && total > 1 && (
            <>
              <motion.button
                type="button"
                onClick={handlePrev}
                aria-label="Previous case study"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.08 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
                className={cn(
                  "absolute left-1 z-40 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-shadow duration-200 focus:outline-none focus-visible:ring-2 sm:left-4",
                  isDark
                    ? "bg-white/15 text-white ring-1 ring-white/25 shadow-[0_8px_28px_rgba(0,0,0,0.5)] hover:bg-white/25 focus-visible:ring-white"
                    : "bg-neutral-950/85 text-white ring-2 ring-white/85 shadow-[0_10px_26px_rgba(0,0,0,0.22)] hover:bg-neutral-950 focus-visible:ring-neutral-900"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </motion.button>

              <motion.button
                type="button"
                onClick={handleNext}
                aria-label="Next case study"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.08 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
                className={cn(
                  "absolute right-1 z-40 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-shadow duration-200 focus:outline-none focus-visible:ring-2 sm:right-4",
                  isDark
                    ? "bg-white/15 text-white ring-1 ring-white/25 shadow-[0_8px_28px_rgba(0,0,0,0.5)] hover:bg-white/25 focus-visible:ring-white"
                    : "bg-neutral-950/85 text-white ring-2 ring-white/85 shadow-[0_10px_26px_rgba(0,0,0,0.22)] hover:bg-neutral-950 focus-visible:ring-neutral-900"
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </motion.button>
            </>
          )}
        </div>

        {/* Morphing Iridescent Pagination Dots */}
        {showDots && total > 1 && (
          <div
            className="relative z-10 mt-4 flex items-center justify-center gap-1.5"
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
                  className="relative flex h-2 items-center justify-center px-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 rounded-full"
                >
                  {active ? (
                    <motion.span
                      layoutId={`${uid}-active-dot`}
                      transition={
                        shouldReduceMotion
                          ? { duration: 0.1 }
                          : { type: "spring", stiffness: 360, damping: 28 }
                      }
                      className="block h-1.5 w-6 rounded-full bg-gradient-to-r from-amber-200 via-rose-300 to-indigo-400 shadow-[0_0_10px_rgba(165,180,252,0.55)]"
                    />
                  ) : (
                    <span
                      className={cn(
                        "block h-1.5 w-1.5 rounded-full transition-colors duration-200",
                        isDark
                          ? "bg-neutral-700 hover:bg-neutral-500"
                          : "bg-neutral-300/80 hover:bg-neutral-400"
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Bottom Primary CTA with Iridescent Glass Glow */}
        <div className="relative z-10 mt-6 flex justify-center">
          <motion.button
            type="button"
            onClick={onExploreAll}
            whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.02 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={cn(
              "relative inline-flex items-center justify-center rounded-full px-6 py-2.5 text-xs font-medium backdrop-blur-md transition-shadow duration-200 focus:outline-none focus-visible:ring-2",
              isDark
                ? "bg-white/95 text-neutral-950 ring-1 ring-white/40 shadow-[0_0_28px_rgba(165,180,252,0.35),0_8px_20px_rgba(0,0,0,0.4)] focus-visible:ring-white"
                : "bg-neutral-950/95 text-white ring-1 ring-indigo-300/40 shadow-[0_0_28px_rgba(129,140,248,0.32),0_8px_20px_rgba(0,0,0,0.22)] focus-visible:ring-neutral-900"
            )}
          >
            {exploreAllLabel}
          </motion.button>
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