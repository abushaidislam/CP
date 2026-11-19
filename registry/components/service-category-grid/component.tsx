"use client";

import React, { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
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
  /** Enable subtle hover lift and arrow nudge micro-interactions. */
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

const COLOR_TOKENS: Record<
  ServiceCategoryColor,
  {
    panelLight: string;
    panelDark: string;
    panelAuto: string;
    pillLight: string;
    pillDark: string;
    pillAuto: string;
  }
> = {
  sky: {
    panelLight: "bg-[#e0f4ff]",
    panelDark: "bg-[#112636] border border-sky-400/15",
    panelAuto: "bg-[#e0f4ff] dark:bg-[#112636] dark:border dark:border-sky-400/15",
    pillLight: "bg-[#c1eafc] text-[#090c0f] hover:bg-[#b0e2fa]",
    pillDark: "bg-sky-400/15 text-sky-100 hover:bg-sky-400/25",
    pillAuto:
      "bg-[#c1eafc] text-[#090c0f] hover:bg-[#b0e2fa] dark:bg-sky-400/15 dark:text-sky-100 dark:hover:bg-sky-400/25",
  },
  peach: {
    panelLight: "bg-[#ffe1cd]",
    panelDark: "bg-[#2e1e15] border border-orange-300/15",
    panelAuto: "bg-[#ffe1cd] dark:bg-[#2e1e15] dark:border dark:border-orange-300/15",
    pillLight: "bg-[#ffd2b3] text-[#090c0f] hover:bg-[#ffc49c]",
    pillDark: "bg-orange-400/15 text-orange-100 hover:bg-orange-400/25",
    pillAuto:
      "bg-[#ffd2b3] text-[#090c0f] hover:bg-[#ffc49c] dark:bg-orange-400/15 dark:text-orange-100 dark:hover:bg-orange-400/25",
  },
  lavender: {
    panelLight: "bg-[#e4dbfa]",
    panelDark: "bg-[#221b38] border border-violet-300/15",
    panelAuto: "bg-[#e4dbfa] dark:bg-[#221b38] dark:border dark:border-violet-300/15",
    pillLight: "bg-[#d4c6f7] text-[#090c0f] hover:bg-[#c6b4f4]",
    pillDark: "bg-violet-400/15 text-violet-100 hover:bg-violet-400/25",
    pillAuto:
      "bg-[#d4c6f7] text-[#090c0f] hover:bg-[#c6b4f4] dark:bg-violet-400/15 dark:text-violet-100 dark:hover:bg-violet-400/25",
  },
  mint: {
    panelLight: "bg-[#d5f6ed]",
    panelDark: "bg-[#112b25] border border-emerald-300/15",
    panelAuto: "bg-[#d5f6ed] dark:bg-[#112b25] dark:border dark:border-emerald-300/15",
    pillLight: "bg-[#adead9] text-[#090c0f] hover:bg-[#99e3ce]",
    pillDark: "bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/25",
    pillAuto:
      "bg-[#adead9] text-[#090c0f] hover:bg-[#99e3ce] dark:bg-emerald-400/15 dark:text-emerald-100 dark:hover:bg-emerald-400/25",
  },
};

const COLUMN_CLASSES: Record<1 | 2 | 3 | 4, string> = {
  1: "grid-cols-1 max-w-[360px]",
  2: "grid-cols-1 sm:grid-cols-2 max-w-[690px]",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-[1040px]",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-[1380px]",
};

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
    interactiveHover = true,
    onExplore,
    onTagClick,
    className,
    ...rest
  },
  ref
) {
  const baseId = useId().replace(/:/g, "");
  const prefersReducedMotion = useReducedMotion();

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
      {items.map((item, index) => {
        const tokens = COLOR_TOKENS[item.color] ?? COLOR_TOKENS.sky;
        const panelClass =
          theme === "light"
            ? tokens.panelLight
            : theme === "dark"
            ? tokens.panelDark
            : tokens.panelAuto;
        const pillClass =
          theme === "light"
            ? tokens.pillLight
            : theme === "dark"
            ? tokens.pillDark
            : tokens.pillAuto;

        const headingId = `${baseId}-title-${index}`;
        const descId = `${baseId}-desc-${index}`;

        const handleCardActivate = () => {
          onExplore?.(item);
        };

        return (
          <motion.article
            key={item.id || `${baseId}-${index}`}
            aria-labelledby={headingId}
            aria-describedby={descId}
            initial={
              prefersReducedMotion
                ? false
                : { opacity: 0, y: 12 }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : {
                    duration: 0.35,
                    delay: index * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }
            }
            whileHover={
              interactiveHover && !prefersReducedMotion
                ? { y: -3, transition: { duration: 0.2, ease: "easeOut" } }
                : undefined
            }
            className={cn(
              "group relative flex flex-col justify-between rounded-[22px] p-2.5 transition-shadow duration-200",
              interactiveHover &&
                "hover:shadow-[0_20px_40px_-14px_rgba(15,23,42,0.16)] dark:hover:shadow-[0_22px_44px_-14px_rgba(0,0,0,0.65)]",
              cardSurfaceClass
            )}
          >
            {/* Top Pastel Capability Panel */}
            <div
              className={cn(
                "flex flex-1 flex-col justify-between rounded-[14px] px-5 pt-5 pb-6 min-h-[244px]",
                panelClass
              )}
            >
              <div>
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

              {showTags && item.tags.length > 0 && (
                <ul
                  aria-label={`${item.title} capabilities`}
                  className="mt-6 flex flex-wrap gap-2"
                >
                  {item.tags.map((tag) => (
                    <li key={tag}>
                      {onTagClick ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTagClick(tag, item);
                          }}
                          className={cn(
                            "inline-flex items-center rounded-full px-3 py-1 text-[12.5px] font-medium leading-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-1",
                            pillClass
                          )}
                        >
                          {tag}
                        </button>
                      ) : (
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-3 py-1 text-[12.5px] font-medium leading-none transition-colors duration-150",
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
                      "h-4 w-4 transition-transform duration-200",
                      interactiveHover &&
                        !prefersReducedMotion &&
                        "group-hover:translate-x-0.5"
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
                      "h-4 w-4 transition-transform duration-200",
                      interactiveHover &&
                        !prefersReducedMotion &&
                        "group-hover:translate-x-0.5"
                    )}
                    strokeWidth={2}
                  />
                </span>
              </button>
            )}
          </motion.article>
        );
      })}
    </div>
  );
});

export {
  ServiceCategoryGrid as component,
  ServiceCategoryGrid as Component,
};
export default ServiceCategoryGrid;