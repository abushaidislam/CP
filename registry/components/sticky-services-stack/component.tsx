"use client";

import React, { useId, useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type StickyServicesTheme = "auto" | "light" | "dark";
export type ServicePreviewVariant = "identities" | "systems" | "guidelines";

export interface ServiceStackItem {
  id: string;
  indexLabel?: string;
  category: string;
  headline: string;
  description: string;
  previewVariant?: ServicePreviewVariant;
  customPreview?: React.ReactNode;
}

export interface StickyServicesStackProps
  extends React.HTMLAttributes<HTMLElement> {
  sectionLabel?: string;
  sectionIntro?: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  items?: ServiceStackItem[];
  theme?: StickyServicesTheme;
  enableStackDimming?: boolean;
  animatePreviews?: boolean;
}

export const DEFAULT_SERVICE_ITEMS: ServiceStackItem[] = [
  {
    id: "identities",
    indexLabel: "1",
    category: "(Identities)",
    headline: "Creating motion identities that are compelling and distinct.",
    description:
      "We craft motion identities that embody the core and character of brands. Each identity is created with intention—to be distinct, differentiated, compelling and scalable into broader systems.",
    previewVariant: "identities",
  },
  {
    id: "systems",
    indexLabel: "2",
    category: "(Systems)",
    headline: "Building motion systems that scale your identity.",
    description:
      "We build motion systems that scale harmoniously across formats, teams, and touchpoints, ensuring consistency through detailed guidelines and toolkits.",
    previewVariant: "systems",
  },
  {
    id: "guidelines",
    indexLabel: "3",
    category: "(Guidelines)",
    headline:
      "Developing motion guidelines that ensure consistency and excellence.",
    description:
      "We develop best practices and documentation that empower internal and external teams to ensure the identity is consistent and output at the highest of standards.",
    previewVariant: "guidelines",
  },
];

interface PreviewMediaProps {
  variant: ServicePreviewVariant;
  animate: boolean;
}

function ServicePreviewMedia({ variant, animate }: PreviewMediaProps) {
  const shouldAnimate = animate;

  if (variant === "identities") {
    return (
      <div
        className="relative flex aspect-[16/9] w-[208px] items-center justify-center overflow-hidden rounded-[6px] border border-black/10 bg-[#E2FF65] text-[#09090B] shadow-xs sm:w-[224px]"
        aria-hidden="true"
      >
        <motion.div
          className="flex items-center gap-2.5 px-4"
          animate={
            shouldAnimate
              ? {
                  x: [0, -6, 0],
                }
              : undefined
          }
          transition={
            shouldAnimate
              ? {
                  duration: 3.6,
                  repeat: Infinity,
                  ease: [0.22, 1, 0.36, 1],
                }
              : undefined
          }
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] bg-[#09090B] text-[#E2FF65]">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 17l-5-5 5-5" />
              <path d="M18 17l-5-5 5-5" />
            </svg>
          </div>
          <div className="flex flex-col leading-[0.95] font-semibold tracking-[-0.03em]">
            <span className="text-[17px]">Back</span>
            <span className="text-[17px]">Market</span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (variant === "systems") {
    const tiles = [
      { bg: "bg-gradient-to-br from-[#1D4ED8] to-[#7C3AED]", label: "" },
      { bg: "bg-[#0F172A]", shape: "arc" as const },
      { bg: "bg-[#F8FAFC] text-[#0F172A]", label: "e", accent: "text-[#EF4444]" },
      { bg: "bg-[#F8FAFC] text-[#0F172A]", label: "X", accent: "text-[#F59E0B]" },
      { bg: "bg-gradient-to-tr from-[#2563EB] to-[#38BDF8]", label: "" },
      { bg: "bg-[#020617]", shape: "cross" as const },
      { bg: "bg-gradient-to-br from-[#064E3B] to-[#0EA5E9]", shape: "orb" as const },
      { bg: "bg-[#111827] text-white", label: "H" },
    ];

    return (
      <div
        className="relative grid aspect-[16/9] w-[208px] grid-cols-4 grid-rows-2 gap-1 overflow-hidden rounded-[6px] border border-black/15 bg-[#09090B] p-1.5 shadow-xs sm:w-[224px] dark:border-white/15"
        aria-hidden="true"
      >
        {tiles.map((tile, idx) => (
          <motion.div
            key={idx}
            className={cn(
              "relative flex items-center justify-center overflow-hidden rounded-[3px] text-[13px] font-bold tracking-tight",
              tile.bg
            )}
            animate={
              shouldAnimate
                ? {
                    opacity: [0.88, 1, 0.88],
                    scale: [1, 1.02, 1],
                  }
                : undefined
            }
            transition={
              shouldAnimate
                ? {
                    duration: 3.2,
                    delay: idx * 0.18,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
                : undefined
            }
          >
            {tile.shape === "arc" && (
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <path d="M4 20A16 16 0 0 1 20 4v16H4Z" fill="#3B82F6" />
                <circle cx="15" cy="15" r="4" fill="#FACC15" />
              </svg>
            )}
            {tile.shape === "cross" && (
              <svg viewBox="0 0 24 24" className="h-4 w-4">
                <path
                  d="M5 5l14 14M19 5L5 19"
                  stroke="#38BDF8"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
            {tile.shape === "orb" && (
              <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-[#22C55E] via-[#0EA5E9] to-[#A855F7]" />
            )}
            {tile.label && (
              <span className={tile.accent}>{tile.label}</span>
            )}
          </motion.div>
        ))}
      </div>
    );
  }

  const pills = [
    "bg-[#3B82F6]",
    "bg-[#14B8A6]",
    "bg-[#22C55E]",
    "bg-[#F97316]",
    "bg-[#EC4899]",
    "bg-[#8B5CF6]",
  ];

  return (
    <div
      className="relative aspect-[16/9] w-[208px] overflow-hidden rounded-[6px] bg-gradient-to-br from-[#4338CA] via-[#2563EB] to-[#06B6D4] p-[4px] shadow-xs sm:w-[224px]"
      aria-hidden="true"
    >
      <div className="flex h-full w-full flex-col justify-between rounded-[3px] bg-white p-2.5 text-[#0F172A]">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] leading-[1.1] font-semibold tracking-[-0.02em] text-[#4338CA]">
            How does
            <br />
            Canva move?
          </span>
          <span className="mt-1 h-[2px] w-10 rounded-full bg-slate-200" />
          <span className="h-[2px] w-7 rounded-full bg-slate-200" />
        </div>
        <div className="flex flex-col items-end gap-[2px]">
          {pills.map((pillColor, idx) => (
            <motion.span
              key={pillColor}
              className={cn("h-[6px] w-5 rounded-full", pillColor)}
              style={{ marginRight: `${(pills.length - 1 - idx) * 9}px` }}
              animate={
                shouldAnimate
                  ? {
                      x: [0, 3, 0],
                    }
                  : undefined
              }
              transition={
                shouldAnimate
                  ? {
                      duration: 2.6,
                      delay: idx * 0.14,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface StickyServiceCardProps {
  item: ServiceStackItem;
  index: number;
  total: number;
  enableStackDimming: boolean;
  animatePreviews: boolean;
  prefersReducedMotion: boolean;
  isDarkForced: boolean;
  isLightForced: boolean;
}

function StickyServiceCard({
  item,
  index,
  total,
  enableStackDimming,
  animatePreviews,
  prefersReducedMotion,
  isDarkForced,
  isLightForced,
}: StickyServiceCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const isLast = index === total - 1;

  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start start", "end start"],
  });

  const shouldDim = enableStackDimming && !prefersReducedMotion && !isLast;

  const overlayOpacity = useTransform(
    scrollYProgress,
    [0.15, 0.85],
    shouldDim ? [0, 1] : [0, 0]
  );

  const cardScale = useTransform(
    scrollYProgress,
    [0.15, 0.9],
    shouldDim ? [1, 0.985] : [1, 1]
  );

  const surfaceClasses = isDarkForced
    ? "bg-[#09090B] text-zinc-50 border-white/10"
    : isLightForced
      ? "bg-white text-zinc-950 border-black/10"
      : "bg-white text-zinc-950 border-black/10 dark:bg-[#09090B] dark:text-zinc-50 dark:border-white/10";

  const mutedTextClasses = isDarkForced
    ? "text-zinc-400"
    : isLightForced
      ? "text-zinc-600"
      : "text-zinc-600 dark:text-zinc-400";

  const dimOverlayClasses = isDarkForced
    ? "bg-black/45"
    : isLightForced
      ? "bg-zinc-200/55"
      : "bg-zinc-200/55 dark:bg-black/45";

  return (
    <li
      ref={cardRef}
      className="sticky top-0 list-none"
      style={{ zIndex: index + 1 }}
    >
      <motion.article
        aria-labelledby={headingId}
        style={{ scale: cardScale, transformOrigin: "top center" }}
        className={cn(
          "relative w-full border-t transition-colors duration-200",
          index > 0 && "shadow-[0_-12px_32px_rgba(0,0,0,0.035)]",
          surfaceClasses
        )}
      >
        <motion.div
          aria-hidden="true"
          style={{ opacity: overlayOpacity }}
          className={cn(
            "pointer-events-none absolute inset-0 z-20",
            dimOverlayClasses
          )}
        />

        <div className="relative z-10 mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-y-6 px-5 pt-8 pb-16 sm:px-8 sm:pt-10 sm:pb-24 md:grid-cols-12 md:gap-x-6">
          <div className="md:col-span-3">
            <span
              className="block text-[4.5rem] leading-[0.86] font-normal tracking-[-0.05em] tabular-nums select-none sm:text-[6.5rem] lg:text-[8.75rem]"
              aria-hidden="true"
            >
              {item.indexLabel ?? String(index + 1)}
            </span>
          </div>

          <div className="md:col-span-2 md:pt-1">
            <span className="inline-block text-[12px] font-medium tracking-[-0.01em] sm:text-[13px]">
              {item.category}
            </span>
          </div>

          <div className="flex flex-col md:col-span-7">
            <h3
              id={headingId}
              className="max-w-[540px] text-[1.625rem] leading-[1.08] font-medium tracking-[-0.03em] sm:text-[2.125rem] lg:text-[2.5rem]"
            >
              {item.headline}
            </h3>

            <div className="mt-7 mb-7">
              {item.customPreview ? (
                item.customPreview
              ) : (
                <ServicePreviewMedia
                  variant={item.previewVariant ?? "identities"}
                  animate={animatePreviews && !prefersReducedMotion}
                />
              )}
            </div>

            <p
              className={cn(
                "max-w-[500px] text-[13px] leading-[1.55] font-normal",
                mutedTextClasses
              )}
            >
              {item.description}
            </p>
          </div>
        </div>
      </motion.article>
    </li>
  );
}

export const StickyServicesStack = React.forwardRef<
  HTMLElement,
  StickyServicesStackProps
>(
  (
    {
      sectionLabel = "(Services)",
      sectionIntro = "From core brand foundations to cross-functional moments.",
      ctaLabel = "Let's work together",
      ctaHref = "#contact",
      onCtaClick,
      items = DEFAULT_SERVICE_ITEMS,
      theme = "auto",
      enableStackDimming = true,
      animatePreviews = true,
      className,
      ...rest
    },
    ref
  ) => {
    const prefersReducedMotion = Boolean(useReducedMotion());
    const sectionTitleId = useId();

    const isDarkForced = theme === "dark";
    const isLightForced = theme === "light";

    const containerThemeClasses = isDarkForced
      ? "bg-[#09090B] text-zinc-50"
      : isLightForced
        ? "bg-white text-zinc-950"
        : "bg-white text-zinc-950 dark:bg-[#09090B] dark:text-zinc-50";

    const safeItems = items.length > 0 ? items : DEFAULT_SERVICE_ITEMS;

    return (
      <section
        ref={ref}
        aria-labelledby={sectionTitleId}
        className={cn(
          "relative w-full font-sans antialiased",
          containerThemeClasses,
          className
        )}
        style={{
          fontFamily:
            '"Plus Jakarta Sans", "Inter", "Helvetica Neue", Arial, sans-serif',
        }}
        {...rest}
      >
        <header className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-y-4 px-5 pt-10 pb-14 sm:px-8 sm:pt-12 sm:pb-20 md:grid-cols-12 md:items-start md:gap-x-6">
          <div className="md:col-span-5">
            <h2
              id={sectionTitleId}
              className="text-[12.5px] font-medium tracking-[-0.01em] sm:text-[13px]"
            >
              {sectionLabel}
            </h2>
          </div>

          <div className="md:col-span-4">
            <p className="max-w-[260px] text-[12.5px] leading-[1.38] font-medium tracking-[-0.01em] sm:text-[13px]">
              {sectionIntro}
            </p>
          </div>

          <div className="md:col-span-3 md:flex md:justify-end">
            {ctaLabel && (
              <a
                href={ctaHref}
                onClick={onCtaClick}
                className={cn(
                  "inline-block border-b pb-0.5 text-[12.5px] font-medium tracking-[-0.01em] transition-opacity duration-200 hover:opacity-65 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:text-[13px]",
                  isDarkForced
                    ? "border-zinc-50 focus-visible:ring-zinc-400 focus-visible:ring-offset-[#09090B]"
                    : isLightForced
                      ? "border-zinc-950 focus-visible:ring-zinc-900 focus-visible:ring-offset-white"
                      : "border-zinc-950 focus-visible:ring-zinc-900 focus-visible:ring-offset-white dark:border-zinc-50 dark:focus-visible:ring-zinc-400 dark:focus-visible:ring-offset-[#09090B]"
                )}
              >
                {ctaLabel}
              </a>
            )}
          </div>
        </header>

        <ol className="relative m-0 flex flex-col p-0">
          {safeItems.map((item, idx) => (
            <StickyServiceCard
              key={item.id}
              item={item}
              index={idx}
              total={safeItems.length}
              enableStackDimming={enableStackDimming}
              animatePreviews={animatePreviews}
              prefersReducedMotion={prefersReducedMotion}
              isDarkForced={isDarkForced}
              isLightForced={isLightForced}
            />
          ))}
        </ol>
      </section>
    );
  }
);

StickyServicesStack.displayName = "StickyServicesStack";

export {
  StickyServicesStack as component,
  StickyServicesStack as Component,
};
export default StickyServicesStack;