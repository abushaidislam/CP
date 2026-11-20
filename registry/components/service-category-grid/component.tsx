"use client";

import React, { useId } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { ArrowRight } from "lucide-react";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type ServiceCategoryColor = "sky" | "peach" | "lavender" | "mint";
export type ServiceCategoryTheme = "auto" | "light" | "dark";

export interface ServiceCategoryItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  color: ServiceCategoryColor;
  href?: string;
}

export interface ServiceCategoryGridProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  /** Array of service category cards to render. Defaults to the 4 reference categories. */
  items?: ServiceCategoryItem[];
  /** Number of columns on medium/desktop viewports (1–4). */
  columns?: 1 | 2 | 3 | 4;
  /** Visual theme mode. "auto" follows Tailwind dark: class on the host document. */
  theme?: ServiceCategoryTheme;
  /** Footer action label displayed on each card. */
  ctaLabel?: string;
  /** Whether to display capability pill tags inside the pastel panel. */
  showTags?: boolean;
  /** Toggle fine monochrome film-grain noise texture over the gradient panels. */
  showNoise?: boolean;
  /** Enable 60fps spring hover lift, spotlight sheen, and arrow micro-interactions. */
  interactiveHover?: boolean;
  /** Callback fired when a card or its Explore action is activated. */
  onExplore?: (item: ServiceCategoryItem) => void;
  /** Optional callback fired when a capability pill tag is clicked. */
  onTagClick?: (tag: string, item: ServiceCategoryItem) => void;
}

export const DEFAULT_SERVICE_CATEGORIES: ServiceCategoryItem[] = [
  {
    id: "web-design",
    title: "Web Design",
    description: "Crafts engaging, user-friendly websites.",
    tags: ["Landing Page", "Website", "One Page"],
    color: "sky",
  },
  {
    id: "graphic-design",
    title: "Graphic Design",
    description: "Creates impactful visuals and branding.",
    tags: ["Packaging", "Brand Identity", "Illustrations", "Logo", "Signage"],
    color: "peach",
  },
  {
    id: "developers",
    title: "Developers",
    description: "Builds functional and scalable solutions.",
    tags: ["Web Applications", "Mobile Apps", "Database", "Add-ons"],
    color: "lavender",
  },
  {
    id: "copywriting",
    title: "Copywriting",
    description: "Delivers persuasive and creative content.",
    tags: ["Blog Posts", "Video Scripts", "Sales Pages", "Slogans"],
    color: "mint",
  },
];

/**
 * Content-tailored multi-stop mesh gradients:
 * - sky (Web Design): Crisp coastal-blueprint & airy glass bloom
 * - peach (Graphic Design): Warm studio-terracotta & apricot-cream glow
 * - lavender (Developers): Sleek twilight-indigo & electric lilac mist
 * - mint (Copywriting): Fresh editorial-sage & seafoam paper warmth
 */
const COLOR_TOKENS: Record<
  ServiceCategoryColor,
  {
    gradientLight: string;
    gradientDark: string;
    spotlightLight: string;
    spotlightDark: string;
    panelRingDark: string;
    pillLight: string;
    pillDark: string;
    pillAuto: string;
  }
> = {
  sky: {
    gradientLight:
      "radial-gradient(120% 90% at 92% 8%, #bfe8ff 0%, rgba(191,232,255,0) 58%), radial-gradient(95% 85% at 10% 95%, #eef6ff 0%, rgba(238,246,255,0) 60%), linear-gradient(145deg, #e5f6ff 0%, #d4eeff 52%, #e3f2ff 100%)",
    gradientDark:
      "radial-gradient(110% 85% at 90% 10%, rgba(56,189,248,0.20) 0%, rgba(56,189,248,0) 58%), radial-gradient(90% 80% at 12% 92%, rgba(99,102,241,0.14) 0%, rgba(99,102,241,0) 60%), linear-gradient(145deg, #0d2233 0%, #122c42 55%, #0f2438 100%)",
    spotlightLight: "rgba(255, 255, 255, 0.55)",
    spotlightDark: "rgba(125, 211, 252, 0.14)",
    panelRingDark: "border border-sky-300/15",
    pillLight: "bg-[#c1eafc]/90 text-[#090c0f] hover:bg-[#b0e2fa]",
    pillDark: "bg-sky-400/15 text-sky-100 hover:bg-sky-400/25",
    pillAuto:
      "bg-[#c1eafc]/90 text-[#090c0f] hover:bg-[#b0e2fa] dark:bg-sky-400/15 dark:text-sky-100 dark:hover:bg-sky-400/25",
  },
  peach: {
    gradientLight:
      "radial-gradient(115% 88% at 90% 10%, #ffc9a6 0%, rgba(255,201,166,0) 58%), radial-gradient(95% 85% at 8% 92%, #fff2e6 0%, rgba(255,242,230,0) 60%), linear-gradient(145deg, #ffe7d6 0%, #ffd9c0 54%, #ffe8d9 100%)",
    gradientDark:
      "radial-gradient(110% 85% at 90% 10%, rgba(251,146,60,0.20) 0%, rgba(251,146,60,0) 58%), radial-gradient(90% 80% at 10% 92%, rgba(244,63,94,0.12) 0%, rgba(244,63,94,0) 60%), linear-gradient(145deg, #2b1a12 0%, #382117 55%, #2e1c14 100%)",
    spotlightLight: "rgba(255, 255, 255, 0.55)",
    spotlightDark: "rgba(253, 186, 116, 0.14)",
    panelRingDark: "border border-orange-300/15",
    pillLight: "bg-[#ffd2b3]/90 text-[#090c0f] hover:bg-[#ffc49c]",
    pillDark: "bg-orange-400/15 text-orange-100 hover:bg-orange-400/25",
    pillAuto:
      "bg-[#ffd2b3]/90 text-[#090c0f] hover:bg-[#ffc49c] dark:bg-orange-400/15 dark:text-orange-100 dark:hover:bg-orange-400/25",
  },
  lavender: {
    gradientLight:
      "radial-gradient(118% 90% at 90% 10%, #d3c2fb 0%, rgba(211,194,251,0) 58%), radial-gradient(95% 85% at 10% 94%, #f2eeff 0%, rgba(242,238,255,0) 60%), linear-gradient(145deg, #eae2fc 0%, #dcd0fa 54%, #e9e1fc 100%)",
    gradientDark:
      "radial-gradient(110% 85% at 90% 10%, rgba(167,139,250,0.22) 0%, rgba(167,139,250,0) 58%), radial-gradient(90% 80% at 12% 92%, rgba(129,140,248,0.14) 0%, rgba(129,140,248,0) 60%), linear-gradient(145deg, #1d1730 0%, #271f42 55%, #201936 100%)",
    spotlightLight: "rgba(255, 255, 255, 0.55)",
    spotlightDark: "rgba(196, 181, 253, 0.14)",
    panelRingDark: "border border-violet-300/15",
    pillLight: "bg-[#d4c6f7]/90 text-[#090c0f] hover:bg-[#c6b4f4]",
    pillDark: "bg-violet-400/15 text-violet-100 hover:bg-violet-400/25",
    pillAuto:
      "bg-[#d4c6f7]/90 text-[#090c0f] hover:bg-[#c6b4f4] dark:bg-violet-400/15 dark:text-violet-100 dark:hover:bg-violet-400/25",
  },
  mint: {
    gradientLight:
      "radial-gradient(118% 90% at 92% 8%, #b3eedf 0%, rgba(179,238,223,0) 58%), radial-gradient(95% 85% at 10% 94%, #ebfcf7 0%, rgba(235,252,247,0) 60%), linear-gradient(145deg, #dcf8f0 0%, #c8f3e7 54%, #daf7ef 100%)",
    gradientDark:
      "radial-gradient(110% 85% at 90% 10%, rgba(52,211,153,0.19) 0%, rgba(52,211,153,0) 58%), radial-gradient(90% 80% at 12% 92%, rgba(45,212,191,0.12) 0%, rgba(45,212,191,0) 60%), linear-gradient(145deg, #0e2620 0%, #13332b 55%, #102a23 100%)",
    spotlightLight: "rgba(255, 255, 255, 0.55)",
    spotlightDark: "rgba(110, 231, 183, 0.14)",
    panelRingDark: "border border-emerald-300/15",
    pillLight: "bg-[#adead9]/90 text-[#090c0f] hover:bg-[#99e3ce]",
    pillDark: "bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/25",
    pillAuto:
      "bg-[#adead9]/90 text-[#090c0f] hover:bg-[#99e3ce] dark:bg-emerald-400/15 dark:text-emerald-100 dark:hover:bg-emerald-400/25",
  },
};

const COLUMN_CLASSES: Record<1 | 2 | 3 | 4, string> = {
  1: "grid-cols-1 max-w-[360px]",
  2: "grid-cols-1 sm:grid-cols-2 max-w-[690px]",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-[1040px]",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-[1380px]",
};

const SPRING_CONFIG = {
  type: "spring" as const,
  stiffness: 360,
  damping: 30,
  mass: 0.75,
};

interface ServiceCategoryCardProps {
  item: ServiceCategoryItem;
  index: number;
  baseId: string;
  theme: ServiceCategoryTheme;
  ctaLabel: string;
  showTags: boolean;
  showNoise: boolean;
  interactiveHover: boolean;
  prefersReducedMotion: boolean;
  onExplore?: (item: ServiceCategoryItem) => void;
  onTagClick?: (tag: string, item: ServiceCategoryItem) => void;
}

function ServiceCategoryCard({
  item,
  index,
  baseId,
  theme,
  ctaLabel,
  showTags,
  showNoise,
  interactiveHover,
  prefersReducedMotion,
  onExplore,
  onTagClick,
}: ServiceCategoryCardProps) {
  const tokens = COLOR_TOKENS[item.color] ?? COLOR_TOKENS.sky;
  const noiseFilterId = `${baseId}-noise-${index}`;
  const headingId = `${baseId}-title-${index}`;
  const descId = `${baseId}-desc-${index}`;

  // Zero-re-render 60fps pointer spotlight
  const rawX = useMotionValue(160);
  const rawY = useMotionValue(120);
  const smoothX = useSpring(rawX, { stiffness: 260, damping: 28, mass: 0.4 });
  const smoothY = useSpring(rawY, { stiffness: 260, damping: 28, mass: 0.4 });

  const lightSpotlightBg = useMotionTemplate`radial-gradient(220px circle at ${smoothX}px ${smoothY}px, ${tokens.spotlightLight}, transparent 75%)`;
  const darkSpotlightBg = useMotionTemplate`radial-gradient(220px circle at ${smoothX}px ${smoothY}px, ${tokens.spotlightDark}, transparent 75%)`;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactiveHover || prefersReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    rawX.set(e.clientX - rect.left);
    rawY.set(e.clientY - rect.top);
  };

  const pillClass =
    theme === "light"
      ? tokens.pillLight
      : theme === "dark"
      ? tokens.pillDark
      : tokens.pillAuto;

  const cardSurfaceClass =
    theme === "light"
      ? "bg-white text-[#090c0f] shadow-[0_12px_32px_-12px_rgba(15,23,42,0.12)] ring-1 ring-black/[0.04]"
      : theme === "dark"
      ? "bg-[#16181f] text-zinc-50 shadow-[0_16px_36px_-12px_rgba(0,0,0,0.5)] ring-1 ring-white/10"
      : "bg-white text-[#090c0f] shadow-[0_12px_32px_-12px_rgba(15,23,42,0.12)] ring-1 ring-black/[0.04] dark:bg-[#16181f] dark:text-zinc-50 dark:shadow-[0_16px_36px_-12px_rgba(0,0,0,0.5)] dark:ring-white/10";

  const titleClass =
    theme === "light"
      ? "text-[#090c0f]"
      : theme === "dark"
      ? "text-zinc-50"
      : "text-[#090c0f] dark:text-zinc-50";

  const descriptionClass =
    theme === "light"
      ? "text-[#2c333d]"
      : theme === "dark"
      ? "text-zinc-300"
      : "text-[#2c333d] dark:text-zinc-300";

  const ctaTextClass =
    theme === "light"
      ? "text-[#090c0f]"
      : theme === "dark"
      ? "text-zinc-100"
      : "text-[#090c0f] dark:text-zinc-100";

  const arrowBoxClass =
    theme === "light"
      ? "bg-[#f1f2f4] text-[#090c0f] group-hover:bg-[#e5e7eb]"
      : theme === "dark"
      ? "bg-white/[0.08] text-zinc-100 group-hover:bg-white/[0.14]"
      : "bg-[#f1f2f4] text-[#090c0f] group-hover:bg-[#e5e7eb] dark:bg-white/[0.08] dark:text-zinc-100 dark:group-hover:bg-white/[0.14]";

  const handleCardActivate = () => {
    onExplore?.(item);
  };

  return (
    <motion.article
      aria-labelledby={headingId}
      aria-describedby={descId}
      initial={
        prefersReducedMotion
          ? false
          : { opacity: 0, y: 18, scale: 0.98 }
      }
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : {
              ...SPRING_CONFIG,
              delay: index * 0.065,
            }
      }
      whileHover={
        interactiveHover && !prefersReducedMotion
          ? { y: -4, scale: 1.008, transition: SPRING_CONFIG }
          : undefined
      }
      whileTap={
        interactiveHover && !prefersReducedMotion
          ? { y: -1, scale: 0.988, transition: { duration: 0.12, ease: "easeOut" } }
          : undefined
      }
      className={cn(
        "group relative flex flex-col justify-between rounded-[22px] p-2.5 will-change-transform transition-shadow duration-300",
        interactiveHover &&
          "hover:shadow-[0_22px_44px_-14px_rgba(15,23,42,0.16)] dark:hover:shadow-[0_24px_48px_-14px_rgba(0,0,0,0.65)]",
        cardSurfaceClass
      )}
    >
      {/* Top Content-Matched Noisy Premium Gradient Panel */}
      <div
        onPointerMove={handlePointerMove}
        className={cn(
          "relative flex flex-1 flex-col justify-between overflow-hidden rounded-[14px] px-5 pt-5 pb-6 min-h-[244px]",
          theme === "dark" && tokens.panelRingDark,
          theme === "auto" && `dark:${tokens.panelRingDark.split(" ").join(" dark:")}`
        )}
      >
        {/* Light / Auto-Light Mesh Gradient Layer */}
        {theme !== "dark" && (
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0",
              theme === "auto" && "dark:opacity-0"
            )}
            style={{ backgroundImage: tokens.gradientLight }}
          />
        )}

        {/* Dark / Auto-Dark Mesh Gradient Layer */}
        {theme !== "light" && (
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0",
              theme === "auto" && "opacity-0 dark:opacity-100"
            )}
            style={{ backgroundImage: tokens.gradientDark }}
          />
        )}

        {/* 60fps GPU Pointer Spotlight Sheen */}
        {interactiveHover && !prefersReducedMotion && (
          <>
            {theme !== "dark" && (
              <motion.div
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                  theme === "auto" && "dark:hidden"
                )}
                style={{ background: lightSpotlightBg }}
              />
            )}
            {theme !== "light" && (
              <motion.div
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                  theme === "auto" && "hidden dark:block"
                )}
                style={{ background: darkSpotlightBg }}
              />
            )}
          </>
        )}

        {/* Monochrome Film-Grain Noise Texture */}
        {showNoise && (
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.055] mix-blend-overlay dark:opacity-[0.08]"
          >
            <filter id={noiseFilterId}>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.82"
                numOctaves="3"
                stitchTiles="stitch"
              />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter={`url(#${noiseFilterId})`} />
          </svg>
        )}

        {/* Crisp 1px Inner Specular Rim Highlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[14px] ring-1 ring-inset ring-white/55 dark:ring-white/10"
        />

        {/* Foreground Copy */}
        <div className="relative z-10">
          <h3
            id={headingId}
            className={cn(
              "text-[26px] font-semibold leading-[1.15] tracking-[-0.025em]",
              titleClass
            )}
          >
            {item.title}
          </h3>
          <p
            id={descId}
            className={cn(
              "mt-2 text-[14.5px] font-normal leading-[1.42] max-w-[26ch]",
              descriptionClass
            )}
          >
            {item.description}
          </p>
        </div>

        {/* Capability Pill Tags */}
        {showTags && item.tags.length > 0 && (
          <ul
            aria-label={`${item.title} capabilities`}
            className="relative z-10 mt-6 flex flex-wrap gap-2"
          >
            {item.tags.map((tag) => (
              <li key={tag}>
                {onTagClick ? (
                  <motion.button
                    type="button"
                    whileHover={
                      interactiveHover && !prefersReducedMotion
                        ? { y: -1.5, transition: { duration: 0.15 } }
                        : undefined
                    }
                    whileTap={
                      interactiveHover && !prefersReducedMotion
                        ? { scale: 0.96 }
                        : undefined
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      onTagClick(tag, item);
                    }}
                    className={cn(
                      "inline-flex items-center rounded-full px-3 py-1 text-[12.5px] font-medium leading-none backdrop-blur-[2px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-1",
                      pillClass
                    )}
                  >
                    {tag}
                  </motion.button>
                ) : (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-3 py-1 text-[12.5px] font-medium leading-none backdrop-blur-[2px] transition-colors duration-150",
                      pillClass
                    )}
                  >
                    {tag}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bottom White Action Footer */}
      {item.href ? (
        <a
          href={item.href}
          onClick={handleCardActivate}
          className="mt-1 flex items-center justify-between rounded-[14px] px-3.5 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white"
        >
          <span
            className={cn(
              "text-[15px] font-semibold tracking-[-0.01em]",
              ctaTextClass
            )}
          >
            {ctaLabel}
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "inline-flex h-9 w-10 items-center justify-center rounded-[10px] transition-colors duration-150",
              arrowBoxClass
            )}
          >
            <ArrowRight
              className={cn(
                "h-4 w-4 will-change-transform transition-transform duration-200 ease-out",
                interactiveHover &&
                  !prefersReducedMotion &&
                  "group-hover:translate-x-1"
              )}
              strokeWidth={2}
            />
          </span>
        </a>
      ) : (
        <button
          type="button"
          onClick={handleCardActivate}
          className="mt-1 flex w-full items-center justify-between rounded-[14px] px-3.5 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white"
        >
          <span
            className={cn(
              "text-[15px] font-semibold tracking-[-0.01em]",
              ctaTextClass
            )}
          >
            {ctaLabel}
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "inline-flex h-9 w-10 items-center justify-center rounded-[10px] transition-colors duration-150",
              arrowBoxClass
            )}
          >
            <ArrowRight
              className={cn(
                "h-4 w-4 will-change-transform transition-transform duration-200 ease-out",
                interactiveHover &&
                  !prefersReducedMotion &&
                  "group-hover:translate-x-1"
              )}
              strokeWidth={2}
            />
          </span>
        </button>
      )}
    </motion.article>
  );
}

export const ServiceCategoryGrid = React.forwardRef<
  HTMLDivElement,
  ServiceCategoryGridProps
>(function ServiceCategoryGrid(
  {
    items = DEFAULT_SERVICE_CATEGORIES,
    columns = 2,
    theme = "auto",
    ctaLabel = "Explore",
    showTags = true,
    showNoise = true,
    interactiveHover = true,
    onExplore,
    onTagClick,
    className,
    ...rest
  },
  ref
) {
  const baseId = useId().replace(/:/g, "");
  const prefersReducedMotion = Boolean(useReducedMotion());

  return (
    <div
      ref={ref}
      role="region"
      aria-label="Service categories"
      className={cn(
        "w-full mx-auto grid gap-6 sm:gap-7 font-sans antialiased",
        COLUMN_CLASSES[columns],
        className
      )}
      {...rest}
    >
      {items.map((item, index) => (
        <ServiceCategoryCard
          key={item.id || `${baseId}-${index}`}
          item={item}
          index={index}
          baseId={baseId}
          theme={theme}
          ctaLabel={ctaLabel}
          showTags={showTags}
          showNoise={showNoise}
          interactiveHover={interactiveHover}
          prefersReducedMotion={prefersReducedMotion}
          onExplore={onExplore}
          onTagClick={onTagClick}
        />
      ))}
    </div>
  );
});

export {
  ServiceCategoryGrid as component,
  ServiceCategoryGrid as Component,
};
export default ServiceCategoryGrid;