"use client";

import React, { useCallback, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Gauge, Layers, Pointer, Send } from "lucide-react";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type SplitAccordionTheme = "auto" | "light" | "dark";

export interface SplitAccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
}

export interface SplitAccordionProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue"> {
  /** Accordion items to render. Defaults to the Interaction Design showcase set. */
  items?: SplitAccordionItem[];
  /** Controlled array of open item indices. */
  openIndices?: number[];
  /** Callback fired whenever open indices change. */
  onOpenChange?: (indices: number[]) => void;
  /** Initial open item index for uncontrolled usage (-1 for all collapsed). */
  defaultOpenIndex?: number;
  /** Allow multiple items to remain detached/open simultaneously. */
  allowMultiple?: boolean;
  /** Allow collapsing the currently active item back into the unified card. */
  collapsible?: boolean;
  /** Vertical separation gap (in px) around an expanded card. */
  splitGap?: number;
  /** Transition duration in seconds for detachment, corner morphing, and reveal. */
  duration?: number;
  /** Surface color theme. Defaults to "auto" to follow Tailwind dark mode. */
  theme?: SplitAccordionTheme;
}

function InteractionTargetIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M21 12a9 9 0 1 0-9 9" />
      <path d="M17.2 12a5.2 5.2 0 1 0-5.2 5.2" />
      <path d="M12.5 12.5 15 20l1.6-3.4L20 15l-7.5-2.5Z" />
    </svg>
  );
}

export const DEFAULT_SPLIT_ACCORDION_ITEMS: SplitAccordionItem[] = [
  {
    id: "interaction-design",
    title: "What is Interaction Design?",
    content:
      "Designing how users interact with digital interfaces with intuitive experiences.",
    icon: <InteractionTargetIcon className="h-[20px] w-[20px]" />,
  },
  {
    id: "principles-patterns",
    title: "Principles & Patterns",
    content:
      "Fundamental guidelines and repeated solutions that ensure consistency and usability in design.",
    icon: <Layers className="h-[20px] w-[20px]" strokeWidth={1.75} />,
  },
  {
    id: "usability-accessibility",
    title: "Usability & Accessibility",
    content:
      "Focusing on making digital designs easy to use and accessible for everyone, including those with disabilities.",
    icon: <Pointer className="h-[20px] w-[20px]" strokeWidth={1.75} />,
  },
  {
    id: "prototyping-testing",
    title: "Prototyping & Testing",
    content:
      "Validating design concepts early through interactive mockups and iterative user feedback.",
    icon: <Send className="h-[20px] w-[20px]" strokeWidth={1.75} />,
  },
  {
    id: "ux-optimisation",
    title: "UX Optimisation",
    content:
      "Improving the overall user experience by enhancing usability and satisfaction.",
    icon: <Gauge className="h-[20px] w-[20px]" strokeWidth={1.75} />,
  },
];

const CARD_RADIUS = 20;
const EASE_CURVE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const SplitAccordion = React.forwardRef<
  HTMLDivElement,
  SplitAccordionProps
>(function SplitAccordion(
  {
    items = DEFAULT_SPLIT_ACCORDION_ITEMS,
    openIndices: controlledOpenIndices,
    onOpenChange,
    defaultOpenIndex = 1,
    allowMultiple = false,
    collapsible = true,
    splitGap = 12,
    duration = 0.36,
    theme = "auto",
    className,
    ...rest
  },
  ref
) {
  const rawId = useId();
  const baseId = rawId.replace(/:/g, "");
  const prefersReducedMotion = useReducedMotion();
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const clampGap = Number.isFinite(splitGap)
    ? Math.max(4, Math.min(32, splitGap))
    : 12;
  const effectiveDuration = prefersReducedMotion
    ? 0.01
    : Number.isFinite(duration)
      ? Math.max(0.1, Math.min(1.0, duration))
      : 0.36;

  const [uncontrolledOpen, setUncontrolledOpen] = useState<number[]>(() => {
    if (defaultOpenIndex >= 0 && defaultOpenIndex < items.length) {
      return [defaultOpenIndex];
    }
    return [];
  });

  const isControlled = controlledOpenIndices !== undefined;
  const activeIndices = isControlled ? controlledOpenIndices : uncontrolledOpen;
  const openSet = new Set(activeIndices);

  const commitOpenIndices = useCallback(
    (next: number[]) => {
      if (!isControlled) {
        setUncontrolledOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  const toggleIndex = useCallback(
    (index: number) => {
      const isCurrentlyOpen = openSet.has(index);

      if (allowMultiple) {
        if (isCurrentlyOpen) {
          if (!collapsible && activeIndices.length <= 1) return;
          commitOpenIndices(activeIndices.filter((i) => i !== index));
        } else {
          commitOpenIndices([...activeIndices, index].sort((a, b) => a - b));
        }
        return;
      }

      if (isCurrentlyOpen) {
        if (!collapsible) return;
        commitOpenIndices([]);
      } else {
        commitOpenIndices([index]);
      }
    },
    [activeIndices, allowMultiple, collapsible, commitOpenIndices, openSet]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      const count = items.length;
      if (count === 0) return;

      let nextIndex: number | null = null;
      if (event.key === "ArrowDown") {
        nextIndex = (index + 1) % count;
      } else if (event.key === "ArrowUp") {
        nextIndex = (index - 1 + count) % count;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = count - 1;
      }

      if (nextIndex !== null) {
        event.preventDefault();
        buttonRefs.current[nextIndex]?.focus();
      }
    },
    [items.length]
  );

  const themeClasses = {
    cardBase:
      theme === "dark"
        ? "border-zinc-800 bg-zinc-900 text-zinc-100"
        : theme === "light"
          ? "border-[#E6E6EA] bg-[#FDFDFD] text-[#09090B]"
          : "border-[#E6E6EA] bg-[#FDFDFD] text-[#09090B] dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100",
    cardOpen:
      theme === "dark"
        ? "bg-zinc-900/95 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.45)]"
        : theme === "light"
          ? "bg-[#FAF9FE] shadow-[0_6px_20px_-6px_rgba(15,23,42,0.06)]"
          : "bg-[#FAF9FE] shadow-[0_6px_20px_-6px_rgba(15,23,42,0.06)] dark:bg-zinc-800/80 dark:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.45)]",
    rowHover:
      theme === "dark"
        ? "hover:bg-zinc-800/60"
        : theme === "light"
          ? "hover:bg-[#FAF9FC]"
          : "hover:bg-[#FAF9FC] dark:hover:bg-zinc-800/60",
    title:
      theme === "dark"
        ? "text-zinc-50"
        : theme === "light"
          ? "text-[#0A0A0C]"
          : "text-[#0A0A0C] dark:text-zinc-50",
    body:
      theme === "dark"
        ? "text-zinc-400"
        : theme === "light"
          ? "text-[#4A4952]"
          : "text-[#4A4952] dark:text-zinc-400",
    icon:
      theme === "dark"
        ? "text-zinc-400"
        : theme === "light"
          ? "text-[#727176]"
          : "text-[#727176] dark:text-zinc-400",
    chevron:
      theme === "dark"
        ? "text-zinc-500"
        : theme === "light"
          ? "text-[#9F9FA4]"
          : "text-[#9F9FA4] dark:text-zinc-500",
    focusRing:
      theme === "dark"
        ? "focus-visible:ring-zinc-100/25"
        : theme === "light"
          ? "focus-visible:ring-zinc-900/15"
          : "focus-visible:ring-zinc-900/15 dark:focus-visible:ring-zinc-100/25",
  };

  const transition = {
    duration: effectiveDuration,
    ease: EASE_CURVE,
  };

  return (
    <div
      ref={ref}
      className={cn(
        "w-full max-w-[420px] select-none font-sans antialiased",
        className
      )}
      {...rest}
    >
      {items.map((item, index) => {
        const isOpen = openSet.has(index);
        const isPrevOpen = index > 0 && openSet.has(index - 1);
        const isNextOpen = index < items.length - 1 && openSet.has(index + 1);

        const isGroupStart = index === 0 || isOpen || isPrevOpen;
        const isGroupEnd = index === items.length - 1 || isOpen || isNextOpen;
        const isSeparatedFromPrev = index > 0 && (isOpen || isPrevOpen);

        const topRadius = isGroupStart ? CARD_RADIUS : 0;
        const bottomRadius = isGroupEnd ? CARD_RADIUS : 0;
        const marginTop = index === 0 ? 0 : isSeparatedFromPrev ? clampGap : -2;

        const triggerId = `${baseId}-trigger-${index}`;
        const panelId = `${baseId}-panel-${index}`;

        return (
          <motion.div
            key={item.id}
            initial={false}
            animate={{
              marginTop,
              borderTopLeftRadius: topRadius,
              borderTopRightRadius: topRadius,
              borderBottomLeftRadius: bottomRadius,
              borderBottomRightRadius: bottomRadius,
            }}
            transition={transition}
            className={cn(
              "relative overflow-hidden border transition-[background-color,border-color,box-shadow] duration-200",
              themeClasses.cardBase,
              isOpen && cn("z-10", themeClasses.cardOpen),
              !isGroupStart && "border-t-transparent dark:border-t-transparent",
              !isGroupEnd && "border-b-transparent dark:border-b-transparent"
            )}
          >
            <h3 className="m-0 font-normal">
              <button
                ref={(el) => {
                  buttonRefs.current[index] = el;
                }}
                id={triggerId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggleIndex(index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={cn(
                  "group flex w-full cursor-pointer items-center justify-between gap-3 px-5 py-[16px] text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset",
                  themeClasses.focusRing,
                  !isOpen && themeClasses.rowHover
                )}
              >
                <span className="flex min-w-0 items-center gap-3.5">
                  {item.icon && (
                    <span
                      className={cn(
                        "flex shrink-0 items-center justify-center transition-colors duration-200",
                        themeClasses.icon
                      )}
                    >
                      {item.icon}
                    </span>
                  )}
                  <span
                    className={cn(
                      "truncate text-[15.5px] font-medium leading-[1.35] tracking-[-0.015em]",
                      themeClasses.title
                    )}
                  >
                    {item.title}
                  </span>
                </span>

                <motion.span
                  initial={false}
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={transition}
                  className={cn(
                    "flex shrink-0 items-center justify-center",
                    themeClasses.chevron
                  )}
                  aria-hidden="true"
                >
                  <ChevronDown className="h-[18px] w-[18px]" strokeWidth={1.9} />
                </motion.span>
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={transition}
                  className="overflow-hidden"
                >
                  <motion.div
                    initial={{ y: -4 }}
                    animate={{ y: 0 }}
                    exit={{ y: -4 }}
                    transition={transition}
                    className={cn(
                      "px-5 pb-[18px] pt-0 text-[14.5px] font-normal leading-[1.52] tracking-[-0.005em]",
                      themeClasses.body
                    )}
                  >
                    {item.content}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
});

SplitAccordion.displayName = "SplitAccordion";

export { SplitAccordion as component, SplitAccordion as Component };
export default SplitAccordion;