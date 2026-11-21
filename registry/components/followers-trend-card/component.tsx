"use client";

import React, { useCallback, useId, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { ArrowUpRight } from "lucide-react";

function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(" ");
}

export interface FollowersTrendPoint {
  /** Numeric follower count for this point */
  value: number;
  /** Optional month or date label for accessibility */
  label?: string;
}

export type FollowersTrendTheme = "auto" | "light" | "dark";

export interface FollowersTrendCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Primary heading displayed at the top-left of the card */
  title?: string;
  /** Secondary muted heading displayed directly beneath the title */
  subtitle?: string;
  /** Ordered time-series data points rendered as vertical bars */
  data?: FollowersTrendPoint[];
  /** Month labels distributed evenly along the x-axis */
  monthLabels?: string[];
  /** Headline total followers metric (defaults to the final bar value) */
  totalFollowers?: number;
  /** Label above the total followers metric */
  totalLabel?: string;
  /** Headline new followers metric */
  newFollowers?: number;
  /** Label above the new followers metric */
  newLabel?: string;
  /** Toggle visibility of the top-right circular action button */
  showActionButton?: boolean;
  /** Accessible label for the top-right action button */
  actionLabel?: string;
  /** Callback invoked when the top-right action button is clicked */
  onActionClick?: () => void;
  /** Callback invoked when the active hovered/focused bar changes */
  onPointChange?: (index: number | null, point: FollowersTrendPoint | null) => void;
  /** Color theme mode ("auto" respects Tailwind dark mode) */
  theme?: FollowersTrendTheme;
}

const DEFAULT_MONTH_LABELS = ["Feb", "Mar", "Apr", "May", "Jun"];

const DEFAULT_DATA: FollowersTrendPoint[] = [
  { value: 44, label: "Feb 1" },
  { value: 48, label: "Feb 6" },
  { value: 56, label: "Feb 11" },
  { value: 61, label: "Feb 16" },
  { value: 94, label: "Feb 22" },
  { value: 166, label: "Feb 27" },
  { value: 246, label: "Mar 4" },
  { value: 322, label: "Mar 9" },
  { value: 392, label: "Mar 14" },
  { value: 396, label: "Mar 19" },
  { value: 400, label: "Mar 24" },
  { value: 412, label: "Mar 29" },
  { value: 415, label: "Apr 3" },
  { value: 427, label: "Apr 8" },
  { value: 434, label: "Apr 13" },
  { value: 425, label: "Apr 18" },
  { value: 418, label: "Apr 23" },
  { value: 422, label: "Apr 28" },
  { value: 414, label: "May 3" },
  { value: 424, label: "May 8" },
  { value: 435, label: "May 13" },
  { value: 438, label: "May 18" },
  { value: 446, label: "May 23" },
  { value: 453, label: "May 28" },
  { value: 462, label: "Jun 2" },
  { value: 471, label: "Jun 7" },
  { value: 488, label: "Jun 12" },
  { value: 514, label: "Jun 17" },
  { value: 542, label: "Jun 21" },
  { value: 568, label: "Jun 25" },
  { value: 587, label: "Jun 30" },
];

interface RollingNumberProps {
  value: number;
  baseDelay?: number;
  reducedMotion: boolean;
  className?: string;
}

function RollingNumber({
  value,
  baseDelay = 0,
  reducedMotion,
  className,
}: RollingNumberProps) {
  const formatted = useMemo(() => value.toLocaleString("en-US"), [value]);
  const chars = useMemo(() => formatted.split(""), [formatted]);

  return (
    <span
      className={cn("inline-flex items-baseline tabular-nums", className)}
      aria-label={formatted}
    >
      {chars.map((char, idx) => {
        const isDigit = /\d/.test(char);
        if (!isDigit || reducedMotion) {
          return (
            <span key={`${idx}-${char}`} aria-hidden="true">
              {char}
            </span>
          );
        }

        return (
          <span
            key={`${idx}-${char}`}
            aria-hidden="true"
            className="inline-block overflow-hidden align-bottom leading-[1.06]"
          >
            <motion.span
              className="inline-block"
              initial={{ y: "105%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              transition={{
                duration: 0.56,
                delay: baseDelay + idx * 0.085,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {char}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}

const CHART_HEIGHT_PX = 164;
const MIN_BAR_HEIGHT_PX = 8;

const FollowersTrendCard = React.forwardRef<
  HTMLDivElement,
  FollowersTrendCardProps
>(
  (
    {
      title = "Followers",
      subtitle = "Trend",
      data = DEFAULT_DATA,
      monthLabels = DEFAULT_MONTH_LABELS,
      totalFollowers,
      totalLabel = "TOTAL FOLLOWERS",
      newFollowers = 116,
      newLabel = "NEW FOLLOWERS",
      showActionButton = true,
      actionLabel = "View followers trend details",
      onActionClick,
      onPointChange,
      theme = "auto",
      className,
      ...rest
    },
    ref
  ) => {
    const prefersReducedMotion = Boolean(useReducedMotion());
    const rawId = useId();
    const safeId = rawId.replace(/:/g, "");
    const chartRef = useRef<HTMLDivElement | null>(null);

    const safeData = useMemo(
      () => (data && data.length > 0 ? data : DEFAULT_DATA),
      [data]
    );

    const maxValue = useMemo(() => {
      return Math.max(...safeData.map((d) => Math.max(0, d.value)), 1);
    }, [safeData]);

    const resolvedTotal =
      typeof totalFollowers === "number" && Number.isFinite(totalFollowers)
        ? totalFollowers
        : safeData[safeData.length - 1]?.value ?? 587;

    const resolvedNew =
      typeof newFollowers === "number" && Number.isFinite(newFollowers)
        ? newFollowers
        : 116;

    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    // Critically-damped spring tracking for floating pill tooltip
    const tooltipRawX = useMotionValue(0);
    const tooltipRawY = useMotionValue(0);
    const tooltipX = useSpring(tooltipRawX, {
      stiffness: 420,
      damping: 34,
      mass: 0.55,
    });
    const tooltipY = useSpring(tooltipRawY, {
      stiffness: 420,
      damping: 34,
      mass: 0.55,
    });
    const tooltipVelX = useVelocity(tooltipX);
    const tooltipRawRotate = useTransform(tooltipVelX, [-900, 0, 900], [-6, 0, 6]);
    const tooltipRotate = useSpring(tooltipRawRotate, {
      stiffness: 320,
      damping: 28,
    });

    const getBarHeightPx = useCallback(
      (value: number) => {
        const clamped = Math.max(0, value);
        return Math.max(
          MIN_BAR_HEIGHT_PX,
          Math.round((clamped / maxValue) * (CHART_HEIGHT_PX - 12))
        );
      },
      [maxValue]
    );

    const updateActiveIndex = useCallback(
      (nextIndex: number | null, jumpImmediately = false) => {
        setActiveIndex((prev) => {
          if (prev !== nextIndex) {
            onPointChange?.(
              nextIndex,
              nextIndex !== null ? safeData[nextIndex] ?? null : null
            );
          }
          return nextIndex;
        });

        if (nextIndex !== null && chartRef.current) {
          const rect = chartRef.current.getBoundingClientRect();
          const count = safeData.length;
          const colWidth = rect.width / Math.max(count, 1);
          const centerX = colWidth * (nextIndex + 0.5);
          const clampedX = Math.max(28, Math.min(rect.width - 28, centerX));
          const barHeight = getBarHeightPx(safeData[nextIndex].value);
          const topY = CHART_HEIGHT_PX - barHeight - 36;

          if (jumpImmediately || prefersReducedMotion) {
            tooltipRawX.set(clampedX);
            tooltipRawY.set(topY);
            tooltipX.jump(clampedX);
            tooltipY.jump(topY);
          } else {
            tooltipRawX.set(clampedX);
            tooltipRawY.set(topY);
          }
        }
      },
      [
        getBarHeightPx,
        onPointChange,
        prefersReducedMotion,
        safeData,
        tooltipRawX,
        tooltipRawY,
        tooltipX,
        tooltipY,
      ]
    );

    const resolveIndexFromClientX = useCallback(
      (clientX: number): number => {
        if (!chartRef.current) return 0;
        const rect = chartRef.current.getBoundingClientRect();
        const relX = Math.max(0, Math.min(rect.width - 0.01, clientX - rect.left));
        const ratio = relX / Math.max(rect.width, 1);
        return Math.min(
          safeData.length - 1,
          Math.max(0, Math.floor(ratio * safeData.length))
        );
      },
      [safeData.length]
    );

    const handlePointerMove = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        const idx = resolveIndexFromClientX(e.clientX);
        updateActiveIndex(idx, activeIndex === null);
      },
      [activeIndex, resolveIndexFromClientX, updateActiveIndex]
    );

    const handlePointerDown = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        const idx = resolveIndexFromClientX(e.clientX);
        updateActiveIndex(idx, activeIndex === null);
      },
      [activeIndex, resolveIndexFromClientX, updateActiveIndex]
    );

    const handlePointerLeave = useCallback(() => {
      updateActiveIndex(null);
    }, [updateActiveIndex]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (safeData.length === 0) return;
        if (e.key === "ArrowRight") {
          e.preventDefault();
          const next =
            activeIndex === null
              ? 0
              : Math.min(safeData.length - 1, activeIndex + 1);
          updateActiveIndex(next, activeIndex === null);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          const next =
            activeIndex === null
              ? safeData.length - 1
              : Math.max(0, activeIndex - 1);
          updateActiveIndex(next, activeIndex === null);
        } else if (e.key === "Home") {
          e.preventDefault();
          updateActiveIndex(0, activeIndex === null);
        } else if (e.key === "End") {
          e.preventDefault();
          updateActiveIndex(safeData.length - 1, activeIndex === null);
        } else if (e.key === "Escape") {
          e.preventDefault();
          updateActiveIndex(null);
        }
      },
      [activeIndex, safeData.length, updateActiveIndex]
    );

    const activePoint = activeIndex !== null ? safeData[activeIndex] : null;

    const isForcedDark = theme === "dark";
    const isForcedLight = theme === "light";

    const cardSurfaceClass = isForcedDark
      ? "bg-gradient-to-b from-[#231728] via-[#1C1220] to-[#140D18] text-[#FAF5FF] border-white/10 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.65)]"
      : isForcedLight
      ? "bg-gradient-to-b from-[#FCD6FB] via-[#FBD2FA] to-[#EAC2EA] text-[#110814] border-white/60 shadow-[0_20px_50px_-24px_rgba(140,70,145,0.28)]"
      : "bg-gradient-to-b from-[#FCD6FB] via-[#FBD2FA] to-[#EAC2EA] text-[#110814] border-white/60 shadow-[0_20px_50px_-24px_rgba(140,70,145,0.28)] dark:from-[#231728] dark:via-[#1C1220] dark:to-[#140D18] dark:text-[#FAF5FF] dark:border-white/10 dark:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.65)]";

    const subtitleClass = isForcedDark
      ? "text-[#A78EB0]"
      : isForcedLight
      ? "text-[#8C7090]"
      : "text-[#8C7090] dark:text-[#A78EB0]";

    const mutedLabelClass = isForcedDark
      ? "text-[#9C82A6]"
      : isForcedLight
      ? "text-[#8C6E90]"
      : "text-[#8C6E90] dark:text-[#9C82A6]";

    const actionButtonClass = isForcedDark
      ? "bg-[#2E2034] text-[#F5ECFA] ring-1 ring-white/10 hover:bg-[#3A2942] shadow-[0_6px_18px_-6px_rgba(0,0,0,0.5)]"
      : isForcedLight
      ? "bg-white text-[#140A18] ring-1 ring-black/[0.04] hover:bg-white/95 shadow-[0_6px_18px_-6px_rgba(120,60,125,0.22)]"
      : "bg-white text-[#140A18] ring-1 ring-black/[0.04] hover:bg-white/95 shadow-[0_6px_18px_-6px_rgba(120,60,125,0.22)] dark:bg-[#2E2034] dark:text-[#F5ECFA] dark:ring-white/10 dark:hover:bg-[#3A2942] dark:shadow-[0_6px_18px_-6px_rgba(0,0,0,0.5)]";

    const activeBarClass = isForcedDark
      ? "bg-[#FAF5FF]"
      : isForcedLight
      ? "bg-[#0E0511]"
      : "bg-[#0E0511] dark:bg-[#FAF5FF]";

    const inactiveBarClass = isForcedDark
      ? "bg-[#4E3857]"
      : isForcedLight
      ? "bg-[#DAB1DC]"
      : "bg-[#DAB1DC] dark:bg-[#4E3857]";

    const tooltipClass = isForcedDark
      ? "bg-[#FAF5FF] text-[#110814] shadow-[0_10px_24px_-8px_rgba(0,0,0,0.55)]"
      : isForcedLight
      ? "bg-[#110814] text-white shadow-[0_10px_24px_-8px_rgba(17,8,20,0.38)]"
      : "bg-[#110814] text-white shadow-[0_10px_24px_-8px_rgba(17,8,20,0.38)] dark:bg-[#FAF5FF] dark:text-[#110814] dark:shadow-[0_10px_24px_-8px_rgba(0,0,0,0.55)]";

    return (
      <motion.div
        ref={ref}
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        aria-labelledby={`${safeId}-title`}
        className={cn(
          "relative flex w-full max-w-[356px] select-none flex-col justify-between overflow-hidden rounded-[32px] border p-7 font-sans antialiased",
          cardSurfaceClass,
          className
        )}
        {...(rest as React.ComponentPropsWithoutRef<typeof motion.div>)}
      >
        {/* Header Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col leading-[1.15]">
            <h2
              id={`${safeId}-title`}
              className="text-[24px] font-semibold tracking-[-0.03em]"
            >
              {title}
            </h2>
            {subtitle ? (
              <span
                className={cn(
                  "text-[24px] font-normal tracking-[-0.03em]",
                  subtitleClass
                )}
              >
                {subtitle}
              </span>
            ) : null}
          </div>

          {showActionButton ? (
            <button
              type="button"
              onClick={onActionClick}
              aria-label={actionLabel}
              className={cn(
                "flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full transition-transform duration-200 ease-out hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2",
                actionButtonClass
              )}
            >
              <ArrowUpRight className="h-[18px] w-[18px] stroke-[2]" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {/* Interactive Bar Chart Section */}
        <div className="mt-10 flex flex-col">
          <div
            ref={chartRef}
            role="slider"
            tabIndex={0}
            aria-label={`${title} ${subtitle} chart`}
            aria-valuemin={0}
            aria-valuemax={safeData.length - 1}
            aria-valuenow={activeIndex ?? safeData.length - 1}
            aria-valuetext={
              activePoint
                ? `${activePoint.label ? `${activePoint.label}: ` : ""}${activePoint.value} followers`
                : `Latest: ${resolvedTotal} followers`
            }
            onPointerMove={handlePointerMove}
            onPointerDown={handlePointerDown}
            onPointerLeave={handlePointerLeave}
            onBlur={handlePointerLeave}
            onKeyDown={handleKeyDown}
            style={{ height: `${CHART_HEIGHT_PX}px` }}
            className="relative flex w-full cursor-crosshair items-end justify-between touch-none rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/40 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
          >
            {/* Floating Spring Pill Tooltip */}
            <AnimatePresence>
              {activePoint !== null && (
                <motion.div
                  key="followers-tooltip"
                  aria-hidden="true"
                  style={{
                    x: tooltipX,
                    y: tooltipY,
                    rotate: prefersReducedMotion ? 0 : tooltipRotate,
                  }}
                  initial={
                    prefersReducedMotion
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 0, scale: 0.84 }
                  }
                  animate={{ opacity: 1, scale: 1 }}
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 0.86 }
                  }
                  transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    "pointer-events-none absolute left-0 top-0 z-20 -translate-x-1/2 rounded-full px-3 py-1 text-[12px] font-semibold leading-none tracking-[-0.01em] tabular-nums",
                    tooltipClass
                  )}
                >
                  {activePoint.value.toLocaleString("en-US")}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Vertical Rounded Bars with Decaying Hover Wake */}
            {safeData.map((point, index) => {
              const barHeight = getBarHeightPx(point.value);
              const isActive = activeIndex === index;

              return (
                <div
                  key={`${safeId}-bar-${index}`}
                  className="flex h-full flex-1 items-end justify-center"
                >
                  <motion.div
                    initial={
                      prefersReducedMotion
                        ? { scaleY: 1 }
                        : { scaleY: 0, opacity: 0.35 }
                    }
                    animate={{ scaleY: 1, opacity: 1 }}
                    transition={{
                      duration: 0.52,
                      delay: prefersReducedMotion ? 0 : 0.06 + index * 0.013,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    style={{
                      height: `${barHeight}px`,
                      transformOrigin: "bottom center",
                    }}
                    className={cn(
                      "w-[2.5px] rounded-full will-change-transform",
                      isActive
                        ? cn(
                            "scale-x-[1.15] transition-[background-color,transform] duration-75 ease-out",
                            activeBarClass
                          )
                        : cn(
                            "scale-x-100 transition-[background-color,transform] duration-[420ms] ease-out",
                            inactiveBarClass
                          )
                    )}
                  />
                </div>
              );
            })}
          </div>

          {/* X-Axis Month Labels */}
          <div
            aria-hidden="true"
            className={cn(
              "mt-3.5 flex items-center justify-between px-0.5 text-[11px] font-medium tracking-[-0.01em]",
              mutedLabelClass
            )}
          >
            {monthLabels.map((month, idx) => (
              <span key={`${safeId}-m-${idx}`}>{month}</span>
            ))}
          </div>
        </div>

        {/* Footer KPI Metrics */}
        <div className="mt-8 grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-1">
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-[0.06em]",
                mutedLabelClass
              )}
            >
              {totalLabel}
            </span>
            <RollingNumber
              value={resolvedTotal}
              baseDelay={0.08}
              reducedMotion={prefersReducedMotion}
              className="text-[36px] font-semibold leading-none tracking-[-0.035em]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-[0.06em]",
                mutedLabelClass
              )}
            >
              {newLabel}
            </span>
            <RollingNumber
              value={resolvedNew}
              baseDelay={0.18}
              reducedMotion={prefersReducedMotion}
              className="text-[36px] font-semibold leading-none tracking-[-0.035em]"
            />
          </div>
        </div>
      </motion.div>
    );
  }
);

FollowersTrendCard.displayName = "FollowersTrendCard";

export {
  FollowersTrendCard,
  FollowersTrendCard as component,
  FollowersTrendCard as Component,
};
export default FollowersTrendCard;