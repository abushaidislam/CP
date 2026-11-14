"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export interface ToolbarItem {
  id: string;
  label: string;
  shortcuts?: string[];
  hasNotification?: boolean;
  isActive?: boolean;
  icon: React.ReactNode;
  onClick?: () => void;
}

export interface FloatingToolbarProps {
  /** Optional custom toolbar items. Defaults to the 6-item preview toolbar. */
  items?: ToolbarItem[];
  /** Optional controlled active item ID (only shown when explicitly passed) */
  activeId?: string | null;
  /** Callback fired when an item is clicked or triggered via keyboard shortcut */
  onItemSelect?: (item: ToolbarItem) => void;
  /** Optional extra classes for the outer wrapper */
  className?: string;
}

const CommentIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.85"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 3a9 9 0 0 1 9 9 9 9 0 0 1-9 9H5.2a1.2 1.2 0 0 1-1.08-1.72l1.15-2.3A8.96 8.96 0 0 1 3 12a9 9 0 0 1 9-9Z" />
  </svg>
);

const InboxIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.85"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5.45 5.11 3 12v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6l-2.45-6.89A2 2 0 0 0 16.67 4H7.33a2 2 0 0 0-1.88 1.11Z" />
    <path d="M3 12h4.5l1.8 2.5h5.4L16.5 12H21" />
  </svg>
);

const FeatureFlagsIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.85"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="2" y="6.5" width="20" height="11" rx="5.5" />
    <circle cx="8" cy="12" r="2.75" />
  </svg>
);

const DraftModeIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.85"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path
      d="M2.5 12c1.9-3.6 5.4-5.75 9.5-5.75s7.6 2.15 9.5 5.75c-1.9 3.6-5.4 5.75-9.5 5.75S4.4 15.6 2.5 12Z"
      strokeDasharray="3.2 2.8"
    />
    <circle cx="12" cy="12" r="2.6" />
  </svg>
);

const ShareIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.85"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 3.5v11" />
    <path d="m7.5 8 4.5-4.5L16.5 8" />
    <path d="M4.5 14v4.25A2.25 2.25 0 0 0 6.75 20.5h10.5a2.25 2.25 0 0 0 2.25-2.25V14" />
  </svg>
);

const MenuIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.85"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4.5 7.5h15" />
    <path d="M4.5 12h15" />
    <path d="M4.5 16.5h15" />
  </svg>
);

export const DEFAULT_TOOLBAR_ITEMS: ToolbarItem[] = [
  { id: "comment", label: "Comment", shortcuts: ["C"], icon: <CommentIcon /> },
  { id: "inbox", label: "Inbox", hasNotification: true, icon: <InboxIcon /> },
  { id: "feature-flags", label: "Feature Flags", icon: <FeatureFlagsIcon /> },
  { id: "draft-mode", label: "Draft Mode", icon: <DraftModeIcon /> },
  { id: "share", label: "Share", icon: <ShareIcon /> },
  {
    id: "menu",
    label: "Menu",
    shortcuts: ["⌘", "K"],
    hasNotification: true,
    icon: <MenuIcon />,
  },
];

interface ItemMetrics {
  tooltipLeft: number;
  tooltipWidth: number;
  buttonCenterX: number;
}

const TOOLTIP_HORIZONTAL_PADDING = 14;
const SPRING_CONFIG = {
  type: "spring" as const,
  stiffness: 460,
  damping: 36,
  mass: 0.75,
};

export function FloatingToolbar({
  items = DEFAULT_TOOLBAR_ITEMS,
  activeId = null,
  onItemSelect,
  className = "",
}: FloatingToolbarProps) {
  const uid = useId();
  const prefersReducedMotion = useReducedMotion();

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [dismissedNotifications, setDismissedNotifications] = useState<
    string[]
  >([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<ItemMetrics[]>([]);

  const toolbarRef = useRef<HTMLDivElement>(null);
  const measureTrackRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);

  const activeTooltipIndex = hoveredIndex ?? focusedIndex;

  const prevTooltipIndexRef = useRef<number | null>(null);
  const isTransitioningBetweenItems =
    prevTooltipIndexRef.current !== null &&
    activeTooltipIndex !== null &&
    prevTooltipIndexRef.current !== activeTooltipIndex;

  useEffect(() => {
    prevTooltipIndexRef.current = activeTooltipIndex;
  }, [activeTooltipIndex]);

  const measureLayout = useCallback(() => {
    if (!toolbarRef.current) return;

    const nextMetrics: ItemMetrics[] = items.map((_, idx) => {
      const btn = buttonRefs.current[idx];
      const lbl = labelRefs.current[idx];

      return {
        buttonCenterX: btn
          ? btn.offsetLeft + btn.offsetWidth / 2
          : idx * 44 + 26,
        tooltipLeft: lbl ? lbl.offsetLeft : 0,
        tooltipWidth: lbl ? lbl.offsetWidth : 80,
      };
    });

    setMetrics(nextMetrics);
  }, [items]);

  useLayoutEffect(() => {
    measureLayout();

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => measureLayout())
        : null;

    if (observer && measureTrackRef.current) {
      observer.observe(measureTrackRef.current);
    }

    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(measureLayout);
    }

    window.addEventListener("resize", measureLayout);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measureLayout);
    };
  }, [measureLayout]);

  const triggerItem = useCallback(
    (item: ToolbarItem) => {
      if (item.hasNotification) {
        setDismissedNotifications((prev) =>
          prev.includes(item.id) ? prev : [...prev, item.id]
        );
      }

      item.onClick?.();
      onItemSelect?.(item);
      setStatusMessage(`${item.label} triggered`);
    },
    [onItemSelect]
  );

  useEffect(() => {
    if (!statusMessage) return;
    const timer = window.setTimeout(() => setStatusMessage(null), 1600);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (isTyping) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        const menuItem = items.find((i) => i.id === "menu");
        if (menuItem) {
          e.preventDefault();
          triggerItem(menuItem);
        }
        return;
      }

      if (
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        e.key.toLowerCase() === "c"
      ) {
        const commentItem = items.find((i) => i.id === "comment");
        if (commentItem) {
          e.preventDefault();
          triggerItem(commentItem);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items, triggerItem]);

  const activeMetric =
    activeTooltipIndex !== null ? metrics[activeTooltipIndex] : undefined;

  const tooltipPillWidth = activeMetric
    ? activeMetric.tooltipWidth + TOOLTIP_HORIZONTAL_PADDING * 2
    : 0;

  const tooltipX = activeMetric
    ? activeMetric.buttonCenterX - tooltipPillWidth / 2
    : 0;

  const targetTrackX = activeMetric
    ? TOOLTIP_HORIZONTAL_PADDING - activeMetric.tooltipLeft
    : 0;

  return (
    <div
      className={`relative inline-flex flex-col items-start select-none ${className}`}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {/* Hidden measurement track for exact tooltip widths */}
      <div
        ref={measureTrackRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute -top-20 left-0 flex items-center gap-6 whitespace-nowrap"
      >
        {items.map((item, idx) => (
          <div
            key={`measure-${item.id}`}
            ref={(el) => {
              labelRefs.current[idx] = el;
            }}
            className="inline-flex items-center gap-2 text-[13.5px] font-medium tracking-[-0.01em]"
          >
            <span>{item.label}</span>
            {item.shortcuts && item.shortcuts.length > 0 && (
              <span className="inline-flex items-center gap-1">
                {item.shortcuts.map((key) => (
                  <kbd
                    key={key}
                    className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-[6px] border border-white/25 px-1.5 font-sans text-[11.5px] font-medium leading-none"
                  >
                    {key}
                  </kbd>
                ))}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Morphing + Sliding Tooltip Pill */}
      <AnimatePresence>
        {activeTooltipIndex !== null && activeMetric && (
          <motion.div
            key="floating-tooltip"
            role="tooltip"
            initial={
              prefersReducedMotion
                ? { opacity: 0, x: tooltipX, width: tooltipPillWidth }
                : {
                    opacity: 0,
                    y: 4,
                    scale: 0.94,
                    x: tooltipX,
                    width: tooltipPillWidth,
                  }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1, x: tooltipX, width: tooltipPillWidth }
                : {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    x: tooltipX,
                    width: tooltipPillWidth,
                  }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0, transition: { duration: 0.1 } }
                : {
                    opacity: 0,
                    y: 3,
                    scale: 0.95,
                    transition: { duration: 0.12, ease: "easeOut" },
                  }
            }
            transition={
              prefersReducedMotion ? { duration: 0.12 } : SPRING_CONFIG
            }
            style={{
              left: 0,
              transformOrigin: "bottom center",
              backgroundColor: "#050505",
            }}
            className="pointer-events-none absolute bottom-full z-20 mb-2.5 flex h-[36px] items-center overflow-hidden rounded-[12px] border border-white/10 text-white shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
          >
            <motion.div
              initial={{ x: targetTrackX }}
              animate={{ x: targetTrackX }}
              transition={
                prefersReducedMotion || !isTransitioningBetweenItems
                  ? { duration: 0 }
                  : SPRING_CONFIG
              }
              className="flex items-center gap-6 whitespace-nowrap"
            >
              {items.map((item) => (
                <div
                  key={`tooltip-item-${item.id}`}
                  className="inline-flex items-center gap-2 text-[13.5px] font-medium tracking-[-0.01em] text-white"
                >
                  <span>{item.label}</span>
                  {item.shortcuts && item.shortcuts.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      {item.shortcuts.map((key) => (
                        <kbd
                          key={key}
                          className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-[6px] border border-white/25 bg-white/[0.04] px-1.5 font-sans text-[11.5px] font-medium leading-none text-white/90"
                        >
                          {key}
                        </kbd>
                      ))}
                    </span>
                  )}
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Floating Toolbar Pill */}
      <nav
        ref={toolbarRef}
        aria-label="Preview toolbar"
        style={{ backgroundColor: "#1F1F1F" }}
        className="relative flex items-center gap-1 rounded-full border border-white/[0.08] p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.28),0_2px_6px_rgba(0,0,0,0.18)]"
      >
        {items.map((item, idx) => {
          const isHovered = hoveredIndex === idx;
          const isSelected = item.isActive ?? activeId === item.id;
          const showNotification =
            Boolean(item.hasNotification) &&
            !dismissedNotifications.includes(item.id);

          return (
            <motion.button
              key={item.id}
              ref={(el) => {
                buttonRefs.current[idx] = el;
              }}
              type="button"
              whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
              aria-label={
                item.shortcuts?.length
                  ? `${item.label} (${item.shortcuts.join(" ")})`
                  : item.label
              }
              aria-pressed={isSelected || undefined}
              onMouseEnter={() => setHoveredIndex(idx)}
              onFocus={(e) => {
                if (e.currentTarget.matches(":focus-visible")) {
                  setFocusedIndex(idx);
                }
              }}
              onBlur={() => setFocusedIndex(null)}
              onClick={() => triggerItem(item)}
              className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E90FF] ${
                isHovered || isSelected
                  ? "text-white"
                  : "text-[#E2E2E2] hover:text-white"
              }`}
            >
              {isSelected && (
                <span className="absolute inset-0 -z-20 rounded-full bg-white/[0.14] ring-1 ring-white/25" />
              )}

              {isHovered && (
                <motion.span
                  layoutId={`toolbar-hover-${uid}`}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0.1 }
                      : { type: "spring", stiffness: 500, damping: 35 }
                  }
                  className="absolute inset-0 -z-10 rounded-full bg-white/[0.16]"
                />
              )}

              <span className="relative flex items-center justify-center">
                {item.icon}
                {showNotification && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#1E90FF] ring-2 ring-[#1F1F1F]"
                  />
                )}
              </span>
            </motion.button>
          );
        })}
      </nav>

      <span className="sr-only" role="status" aria-live="polite">
        {statusMessage ?? ""}
      </span>
    </div>
  );
}

export default FloatingToolbar;