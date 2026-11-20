"use client";

import React, { useId, useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type StickyServicesTheme = "auto" | "light" | "dark";
export type ServicePreviewVariant =
  | "identities"
  | "systems"
  | "guidelines"
  | "toolkits"
  | "direction";

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
  cardCount?: number;
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
  {
    id: "toolkits",
    indexLabel: "4",
    category: "(Toolkits)",
    headline:
      "Delivering production-ready motion toolkits for product teams.",
    description:
      "We translate motion principles into reusable code tokens, easing curves, and component libraries—bridging design and engineering without friction.",
    previewVariant: "toolkits",
  },
  {
    id: "direction",
    indexLabel: "5",
    category: "(Direction)",
    headline:
      "Directing launch films and kinetic moments that move audiences.",
    description:
      "We art-direct flagship brand films, product reveals, and interactive web moments built to capture attention and elevate every launch.",
    previewVariant: "direction",
  },
];

const EDITORIAL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface PreviewMediaProps {
  variant: ServicePreviewVariant;
  animate: boolean;
  prefersReducedMotion: boolean;
}

function ServicePreviewMedia({
  variant,
  animate,
  prefersReducedMotion,
}: PreviewMediaProps) {
  const hoverMotion = prefersReducedMotion
    ? undefined
    : { y: -2, scale: 1.015 };

  if (variant === "identities") {
    return (
      <motion.div
        whileHover={hoverMotion}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="relative flex aspect-[16/9] w-[205px] items-center justify-center overflow-hidden rounded-[6px] border border-black/10 bg-[#E2FF65] text-[#09090B] sm:w-[218px]"
        aria-hidden="true"
      >
        <motion.div
          className="pointer-events-none absolute inset-0 bg-[#0B33FF]"
          animate={
            animate
              ? {
                  opacity: [0, 0, 1, 1, 0],
                }
              : { opacity: 0 }
          }
          transition={
            animate
              ? {
                  duration: 6,
                  times: [0, 0.62, 0.68, 0.9, 0.96],
                  repeat: Infinity,
                  ease: EDITORIAL_EASE,
                }
              : undefined
          }
        />

        <motion.div
          className="absolute inset-0 flex items-center justify-start px-5"
          animate={
            animate
              ? {
                  opacity: [1, 1, 0, 0, 1],
                  x: [0, 12, 24, -12, 0],
                }
              : { opacity: 0 }
          }
          transition={
            animate
              ? {
                  duration: 6,
                  times: [0, 0.25, 0.34, 0.92, 1],
                  repeat: Infinity,
                  ease: EDITORIAL_EASE,
                }
              : undefined
          }
        >
          <svg
            viewBox="0 0 48 32"
            className="h-9 w-12 text-[#09090B]"
            fill="currentColor"
          >
            <path d="M4 4h7l9 12-9 12H4l9-12L4 4zm17 0h8l9 12-9 12h-8l9-12-9-12z" />
          </svg>
        </motion.div>

        <motion.div
          className="relative z-10 flex items-center gap-2.5 px-4"
          animate={
            animate
              ? {
                  opacity: [0, 0, 1, 1, 0, 0],
                  y: [8, 8, 0, 0, -6, 8],
                }
              : { opacity: 1, y: 0 }
          }
          transition={
            animate
              ? {
                  duration: 6,
                  times: [0, 0.26, 0.36, 0.6, 0.68, 1],
                  repeat: Infinity,
                  ease: EDITORIAL_EASE,
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
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 17l-5-5 5-5" />
              <path d="M18 17l-5-5 5-5" />
            </svg>
          </div>
          <div className="flex flex-col leading-[0.94] font-semibold tracking-[-0.03em] text-[#09090B]">
            <span className="text-[17px]">Back</span>
            <span className="text-[17px]">Market</span>
          </div>
        </motion.div>
      </motion.div>
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
      <motion.div
        whileHover={hoverMotion}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="relative grid aspect-[16/9] w-[205px] grid-cols-4 grid-rows-2 gap-1 overflow-hidden rounded-[6px] border border-black/15 bg-[#09090B] p-1.5 sm:w-[218px] dark:border-white/15"
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
              animate
                ? {
                    opacity: [0.86, 1, 0.86],
                    scale: [1, 1.025, 1],
                  }
                : undefined
            }
            transition={
              animate
                ? {
                    duration: 3.4,
                    delay: idx * 0.16,
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
            {tile.label && <span className={tile.accent}>{tile.label}</span>}
          </motion.div>
        ))}
      </motion.div>
    );
  }

  if (variant === "guidelines") {
    const pills = [
      "bg-[#3B82F6]",
      "bg-[#14B8A6]",
      "bg-[#22C55E]",
      "bg-[#F97316]",
      "bg-[#EC4899]",
      "bg-[#8B5CF6]",
    ];

    return (
      <motion.div
        whileHover={hoverMotion}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="relative aspect-[16/9] w-[205px] overflow-hidden rounded-[6px] bg-gradient-to-br from-[#4338CA] via-[#2563EB] to-[#06B6D4] p-[4px] sm:w-[218px]"
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
                  animate
                    ? {
                        x: [0, 4, 0],
                      }
                    : undefined
                }
                transition={
                  animate
                    ? {
                        duration: 2.8,
                        delay: idx * 0.12,
                        repeat: Infinity,
                        ease: EDITORIAL_EASE,
                      }
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === "toolkits") {
    return (
      <motion.div
        whileHover={hoverMotion}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="relative flex aspect-[16/9] w-[205px] flex-col justify-between overflow-hidden rounded-[6px] border border-black/15 bg-[#111114] p-3 text-white sm:w-[218px] dark:border-white/15"
        aria-hidden="true"
      >
        <div className="flex items-center justify-between text-[9px] font-medium tracking-tight text-zinc-400">
          <span>ease.editorial</span>
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[8px] text-zinc-200">
            0.65s
          </span>
        </div>

        <svg viewBox="0 0 160 52" className="h-12 w-full overflow-visible">
          <path
            d="M4 46 C 36 46, 48 6, 156 6"
            fill="none"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth="1.5"
          />
          <motion.path
            d="M4 46 C 36 46, 48 6, 156 6"
            fill="none"
            stroke="#A3E635"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0.25 }}
            animate={
              animate
                ? { pathLength: [0.15, 1, 0.15] }
                : { pathLength: 1 }
            }
            transition={
              animate
                ? { duration: 3.8, repeat: Infinity, ease: EDITORIAL_EASE }
                : undefined
            }
          />
          <motion.circle
            r="3.5"
            fill="#FFFFFF"
            cx="4"
            cy="46"
            animate={
              animate
                ? {
                    cx: [4, 54, 156, 4],
                    cy: [46, 14, 6, 46],
                  }
                : { cx: 156, cy: 6 }
            }
            transition={
              animate
                ? { duration: 3.8, repeat: Infinity, ease: EDITORIAL_EASE }
                : undefined
            }
          />
        </svg>

        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#A3E635]" />
          <span className="text-[9px] text-zinc-400">
            cubic-bezier(0.16, 1, 0.3, 1)
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={hoverMotion}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="relative flex aspect-[16/9] w-[205px] flex-col justify-between overflow-hidden rounded-[6px] border border-black/15 bg-[#18181B] p-3 text-white sm:w-[218px] dark:border-white/15"
      aria-hidden="true"
    >
      <div className="flex items-center justify-between text-[9px] tracking-wider text-zinc-400 uppercase">
        <span className="flex items-center gap-1.5">
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-rose-500"
            animate={animate ? { opacity: [1, 0.25, 1] } : undefined}
            transition={
              animate ? { duration: 1.4, repeat: Infinity } : undefined
            }
          />
          REEL 05
        </span>
        <span className="font-mono text-[9px] text-zinc-300">00:14:08</span>
      </div>

      <div className="flex items-center justify-center">
        <span className="text-[15px] font-semibold tracking-[-0.03em] text-white">
          Brand Film
        </span>
      </div>

      <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/15">
        <motion.div
          className="h-full rounded-full bg-white"
          animate={
            animate ? { width: ["12%", "88%", "12%"] } : { width: "64%" }
          }
          transition={
            animate
              ? { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
        />
      </div>
    </motion.div>
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
  const cardRef = useRef<HTMLLIElement>(null);
  const headingId = useId();
  const isLast = index === total - 1;

  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start start", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 28,
    mass: 0.2,
  });

  const shouldDim = enableStackDimming && !prefersReducedMotion && !isLast;

  const overlayOpacity = useTransform(
    smoothProgress,
    [0.1, 0.85],
    shouldDim ? [0, 1] : [0, 0]
  );

  const cardScale = useTransform(
    smoothProgress,
    [0.1, 0.9],
    shouldDim ? [1, 0.986] : [1, 1]
  );

  const cardY = useTransform(
    smoothProgress,
    [0.1, 0.9],
    shouldDim ? [0, -8] : [0, 0]
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
      ? "bg-[#ECECEE]/72"
      : "bg-[#ECECEE]/72 dark:bg-black/45";

  return (
    <li
      ref={cardRef}
      className="sticky top-0 list-none"
      style={{ zIndex: index + 1 }}
    >
      <motion.article
        aria-labelledby={headingId}
        style={{
          scale: cardScale,
          y: cardY,
          transformOrigin: "top center",
        }}
        className={cn(
          "relative w-full border-t will-change-transform",
          index > 0 && "shadow-[0_-6px_24px_rgba(0,0,0,0.025)]",
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

        <div className="relative z-10 mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-y-6 px-6 pt-8 pb-16 sm:px-10 sm:pt-10 sm:pb-24 md:grid-cols-12 md:gap-x-6">
          <div className="overflow-hidden md:col-span-3">
            <motion.span
              initial={prefersReducedMotion ? false : { y: "35%", opacity: 0 }}
              whileInView={{ y: "0%", opacity: 1 }}
              viewport={{ once: true, amount: 0.12 }}
              transition={{ duration: 0.65, ease: EDITORIAL_EASE }}
              className="block text-[4.5rem] leading-[0.84] font-medium tracking-[-0.05em] tabular-nums select-none sm:text-[6.5rem] lg:text-[8.75rem]"
              aria-hidden="true"
            >
              {item.indexLabel ?? String(index + 1)}
            </motion.span>
          </div>

          <div className="overflow-hidden md:col-span-2 md:pt-1">
            <motion.span
              initial={prefersReducedMotion ? false : { y: "100%", opacity: 0 }}
              whileInView={{ y: "0%", opacity: 1 }}
              viewport={{ once: true, amount: 0.12 }}
              transition={{
                duration: 0.55,
                delay: 0.05,
                ease: EDITORIAL_EASE,
              }}
              className="inline-block text-[12px] font-medium tracking-[-0.01em] sm:text-[13px]"
            >
              {item.category}
            </motion.span>
          </div>

          <div className="flex flex-col md:col-span-7">
            <div className="overflow-hidden">
              <motion.h3
                id={headingId}
                initial={
                  prefersReducedMotion ? false : { y: "28%", opacity: 0 }
                }
                whileInView={{ y: "0%", opacity: 1 }}
                viewport={{ once: true, amount: 0.12 }}
                transition={{
                  duration: 0.68,
                  delay: 0.08,
                  ease: EDITORIAL_EASE,
                }}
                className="max-w-[540px] text-[1.625rem] leading-[1.08] font-medium tracking-[-0.03em] sm:text-[2.125rem] lg:text-[2.5rem]"
              >
                {item.headline}
              </motion.h3>
            </div>

            <motion.div
              initial={
                prefersReducedMotion ? false : { y: 14, opacity: 0 }
              }
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.12 }}
              transition={{
                duration: 0.6,
                delay: 0.14,
                ease: EDITORIAL_EASE,
              }}
              className="mt-8 mb-8"
            >
              {item.customPreview ? (
                item.customPreview
              ) : (
                <ServicePreviewMedia
                  variant={item.previewVariant ?? "identities"}
                  animate={animatePreviews && !prefersReducedMotion}
                  prefersReducedMotion={prefersReducedMotion}
                />
              )}
            </motion.div>

            <motion.p
              initial={
                prefersReducedMotion ? false : { y: 12, opacity: 0 }
              }
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.12 }}
              transition={{
                duration: 0.6,
                delay: 0.18,
                ease: EDITORIAL_EASE,
              }}
              className={cn(
                "max-w-[490px] text-[12.5px] leading-[1.5] font-normal sm:text-[13px]",
                mutedTextClasses
              )}
            >
              {item.description}
            </motion.p>
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
      cardCount,
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

    const baseItems = items.length > 0 ? items : DEFAULT_SERVICE_ITEMS;
    const clampedCount =
      typeof cardCount === "number" && Number.isFinite(cardCount)
        ? Math.max(1, Math.min(baseItems.length, Math.round(cardCount)))
        : baseItems.length;
    const visibleItems = baseItems.slice(0, clampedCount);

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
        <header className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-y-4 px-6 pt-10 pb-14 sm:px-10 sm:pt-12 sm:pb-20 md:grid-cols-12 md:items-start md:gap-x-6">
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
          {visibleItems.map((item, idx) => (
            <StickyServiceCard
              key={item.id}
              item={item}
              index={idx}
              total={visibleItems.length}
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