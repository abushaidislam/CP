"use client";

import React, { useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Droplet,
  SquarePen,
  LayoutGrid,
  Flag,
  AlertCircle,
} from "lucide-react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type ShowcaseTheme = "auto" | "light" | "dark";
export type PMToolId = "asana" | "monday" | "trello" | "clickup";
export type FeatureCardId = "usage" | "collaboration" | "portal";

export interface UsageBreakdownItem {
  id: string;
  label: string;
  value: number;
  color: string;
}

export interface TaskStatusItem {
  id: string;
  label: string;
  count: number;
  percent: number;
  color: string;
}

export interface RetainerSolutionShowcaseProps
  extends React.HTMLAttributes<HTMLElement> {
  /** Small uppercase eyebrow badge label */
  eyebrow?: string;
  /** Main display headline (supports \n line breaks) */
  heading?: string;
  /** Supporting subtitle copy below the headline */
  subtitle?: string;
  /** Central hub brand name */
  hubLabel?: string;
  /** Toggle animated light-beam pulses along SVG connector paths */
  animateBeams?: boolean;
  /** Color theme override; "auto" follows Tailwind dark: classes */
  theme?: ShowcaseTheme;
  /** Controlled active PM integration tool */
  activeTool?: PMToolId | null;
  /** Callback fired when a PM tool node is selected */
  onToolSelect?: (tool: PMToolId | null) => void;
  /** Optional custom usage metrics for Card 1 */
  usageMetrics?: UsageBreakdownItem[];
  /** Available retainer hours displayed in Card 1 & Card 3 */
  availableHours?: number;
  /** Monthly agreement hours displayed in Card 3 */
  agreementHours?: number;
  /** Remaining days notice displayed in Card 1 & Card 3 */
  daysRemainingText?: string;
  /** Client greeting name displayed in Card 3 */
  clientName?: string;
  /** Optional custom task status breakdown for Card 2 */
  taskStatuses?: TaskStatusItem[];
}

const DEFAULT_USAGE_METRICS: UsageBreakdownItem[] = [
  { id: "spent", label: "Spent", value: 8, color: "#79A8F8" },
  { id: "projected", label: "Projected", value: 15, color: "#B689EC" },
  { id: "available", label: "Available", value: 23, color: "#EE9777" },
  { id: "rollover", label: "Rollover", value: 12, color: "#EED268" },
];

const DEFAULT_TASK_STATUSES: TaskStatusItem[] = [
  { id: "todo", label: "To do", count: 8, percent: 42, color: "#6FA3F7" },
  {
    id: "design",
    label: "In design",
    count: 12,
    percent: 68,
    color: "#B689EC",
  },
  { id: "dev", label: "In dev", count: 10, percent: 56, color: "#EE9268" },
  { id: "client", label: "In client", count: 5, percent: 28, color: "#E8C858" },
];

const SMOOTH_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* -------------------------------------------------------------------------- */
/* Pure SVG Brand Marks (Zero <svg><text>)                                    */
/* -------------------------------------------------------------------------- */

function AsanaLogo() {
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <svg
        width="20"
        height="19"
        viewBox="0 0 24 22"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <circle cx="12" cy="5.2" r="4.3" fill="#F06A6A" />
        <circle cx="5.2" cy="16.4" r="4.3" fill="#F06A6A" />
        <circle cx="18.8" cy="16.4" r="4.3" fill="#F06A6A" />
      </svg>
      <span className="text-[19px] font-medium tracking-[-0.03em] leading-none">
        asana
      </span>
    </span>
  );
}

function MondayLogo() {
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <svg
        width="22"
        height="16"
        viewBox="0 0 28 20"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          d="M3.2 16.5L8.4 4.2"
          stroke="#FF3D57"
          strokeWidth="4.2"
          strokeLinecap="round"
        />
        <path
          d="M11.6 16.5L16.8 4.2"
          stroke="#FFCB00"
          strokeWidth="4.2"
          strokeLinecap="round"
        />
        <circle cx="22.8" cy="15.2" r="2.7" fill="#00CA72" />
      </svg>
      <span className="text-[17.5px] font-bold tracking-[-0.035em] leading-none">
        monday
      </span>
    </span>
  );
}

function TrelloLogo() {
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <svg
        width="18"
        height="18"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="20" height="20" rx="3.5" fill="#0079BF" />
        <rect x="3.2" y="3.4" width="5.4" height="11.4" rx="1.2" fill="#FFFFFF" />
        <rect x="11.4" y="3.4" width="5.4" height="7.4" rx="1.2" fill="#FFFFFF" />
      </svg>
      <span className="text-[18px] font-bold tracking-[-0.03em] leading-none">
        Trello
      </span>
    </span>
  );
}

function ClickUpLogo({ uid }: { uid: string }) {
  const topGradId = `${uid}-cu-top`;
  const botGradId = `${uid}-cu-bot`;
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <svg
        width="18"
        height="20"
        viewBox="0 0 22 24"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id={topGradId} x1="3" y1="11" x2="19" y2="3" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FD71AF" />
            <stop offset="1" stopColor="#FFC800" />
          </linearGradient>
          <linearGradient id={botGradId} x1="2" y1="18" x2="20" y2="18" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7B68EE" />
            <stop offset="1" stopColor="#49CCF9" />
          </linearGradient>
        </defs>
        <path
          d="M4.2 10.6L11 4.4L17.8 10.6"
          stroke={`url(#${topGradId})`}
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3.8 15.2C5.6 18.2 8.2 19.6 11 19.6C13.8 19.6 16.4 18.2 18.2 15.2"
          stroke={`url(#${botGradId})`}
          strokeWidth="3.4"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[17.5px] font-bold tracking-[-0.03em] leading-none">
        ClickUp
      </span>
    </span>
  );
}

function HubEmblem() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect x="10.2" y="2.2" width="3.6" height="3.6" rx="1" fill="#FFFFFF" />
      <rect x="10.2" y="18.2" width="3.6" height="3.6" rx="1" fill="#FFFFFF" />
      <rect x="2.2" y="10.2" width="3.6" height="3.6" rx="1" fill="#FFFFFF" />
      <rect x="18.2" y="10.2" width="3.6" height="3.6" rx="1" fill="#FFFFFF" />
      <rect
        x="4.8"
        y="4.8"
        width="3.4"
        height="3.4"
        rx="1"
        fill="#FFFFFF"
        fillOpacity="0.92"
      />
      <rect
        x="15.8"
        y="4.8"
        width="3.4"
        height="3.4"
        rx="1"
        fill="#FFFFFF"
        fillOpacity="0.92"
      />
      <rect
        x="4.8"
        y="15.8"
        width="3.4"
        height="3.4"
        rx="1"
        fill="#FFFFFF"
        fillOpacity="0.92"
      />
      <rect
        x="15.8"
        y="15.8"
        width="3.4"
        height="3.4"
        rx="1"
        fill="#FFFFFF"
        fillOpacity="0.92"
      />
    </svg>
  );
}

function MiniAvatar({
  initials,
  bg,
}: {
  initials: string;
  bg: string;
}) {
  return (
    <span
      className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[7px] font-semibold text-white ring-[1.5px] ring-white dark:ring-zinc-900"
      style={{ backgroundColor: bg }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Component                                                             */
/* -------------------------------------------------------------------------- */

export const RetainerSolutionShowcase = React.forwardRef<
  HTMLElement,
  RetainerSolutionShowcaseProps
>(function RetainerSolutionShowcase(
  {
    eyebrow = "SOLUTION",
    heading = "Offer your clients a better retainer\nexperience, scale your agency",
    subtitle = "Effortlessly integrate with the PM tools you love and seamlessly manage the entire internal process behind the scenes.",
    hubLabel = "retainable",
    animateBeams = true,
    theme = "auto",
    activeTool: controlledTool,
    onToolSelect,
    usageMetrics = DEFAULT_USAGE_METRICS,
    availableHours = 136,
    agreementHours = 180,
    daysRemainingText = "10 days left to use",
    clientName = "Alexander M. Whitfield",
    taskStatuses = DEFAULT_TASK_STATUSES,
    className,
    ...rest
  },
  ref
) {
  const uid = useId().replace(/:/g, "");
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animateBeams && !prefersReducedMotion;

  const [internalTool, setInternalTool] = useState<PMToolId | null>(null);
  const [hoveredTool, setHoveredTool] = useState<PMToolId | null>(null);
  const [hoveredCard, setHoveredCard] = useState<FeatureCardId | null>(null);
  const [hoveredUsageId, setHoveredUsageId] = useState<string | null>(null);
  const [hoveredStatusId, setHoveredStatusId] = useState<string | null>(null);

  const selectedTool =
    controlledTool !== undefined ? controlledTool : internalTool;
  const activeHighlightTool = hoveredTool ?? selectedTool;

  const handleToolClick = (tool: PMToolId) => {
    const next = selectedTool === tool ? null : tool;
    if (controlledTool === undefined) {
      setInternalTool(next);
    }
    onToolSelect?.(next);
  };

  const totalUsage = Math.max(
    1,
    usageMetrics.reduce((acc, item) => acc + Math.max(0, item.value), 0)
  );

  const headingLines = heading.split("\n");

  const isForcedDark = theme === "dark";
  const isForcedLight = theme === "light";

  const themeClass = (lightCls: string, darkCls: string, autoDarkCls: string) => {
    if (isForcedDark) return darkCls;
    if (isForcedLight) return lightCls;
    return `${lightCls} ${autoDarkCls}`;
  };

  const lineStrokeClass = themeClass(
    "stroke-[#DCDCE3]",
    "stroke-zinc-700/80",
    "dark:stroke-zinc-700/80"
  );
  const activeLineStrokeClass = themeClass(
    "stroke-[#18181F]",
    "stroke-zinc-200",
    "dark:stroke-zinc-200"
  );
  const nodeFillClass = themeClass(
    "fill-white stroke-[#CFCFD9]",
    "fill-zinc-900 stroke-zinc-600",
    "dark:fill-zinc-900 dark:stroke-zinc-600"
  );

  const pmCardBase = cn(
    "group relative z-10 flex h-[54px] w-full items-center justify-center rounded-[12px] border px-4 transition-colors transition-shadow duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    themeClass(
      "bg-white border-[#EBEBF0] text-[#1E1E24] shadow-[0_4px_14px_-4px_rgba(15,23,42,0.06)] hover:border-[#D4D4DE] hover:shadow-[0_8px_20px_-6px_rgba(15,23,42,0.1)] focus-visible:ring-zinc-900",
      "bg-zinc-900/95 border-zinc-800 text-zinc-100 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.45)] hover:border-zinc-700 focus-visible:ring-zinc-200",
      "dark:bg-zinc-900/95 dark:border-zinc-800 dark:text-zinc-100 dark:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.45)] dark:hover:border-zinc-700 dark:focus-visible:ring-zinc-200"
    )
  );

  const pmCardSelected = themeClass(
    "border-[#18181F]/30 ring-2 ring-[#18181F]/10 shadow-[0_10px_24px_-8px_rgba(15,23,42,0.14)]",
    "border-zinc-400/50 ring-2 ring-white/10 shadow-[0_10px_24px_-8px_rgba(0,0,0,0.6)]",
    "dark:border-zinc-400/50 dark:ring-white/10 dark:shadow-[0_10px_24px_-8px_rgba(0,0,0,0.6)]"
  );

  return (
    <section
      ref={ref}
      aria-labelledby={`${uid}-heading`}
      className={cn(
        "relative w-full max-w-[1040px] mx-auto overflow-hidden rounded-[28px] border px-5 py-10 sm:px-9 sm:py-12 lg:px-14 lg:py-14 font-sans antialiased transition-colors duration-200",
        themeClass(
          "bg-[#F6F6F8] border-[#EBEBF0] text-[#18181F] shadow-[0_18px_50px_-24px_rgba(15,23,42,0.12)]",
          "bg-[#101014] border-zinc-800/90 text-zinc-100 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.65)]",
          "dark:bg-[#101014] dark:border-zinc-800/90 dark:text-zinc-100 dark:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.65)]"
        ),
        className
      )}
      {...rest}
    >
      {/* Subtle top specular rim */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-px",
          themeClass(
            "bg-gradient-to-r from-transparent via-white to-transparent",
            "bg-gradient-to-r from-transparent via-white/15 to-transparent",
            "dark:bg-gradient-to-r dark:from-transparent dark:via-white/15 dark:to-transparent"
          )
        )}
      />

      {/* Header Block */}
      <header className="mx-auto flex max-w-[660px] flex-col items-center text-center">
        {eyebrow && (
          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]",
              themeClass(
                "bg-white border-[#ECECF1] text-[#555562] shadow-[0_2px_8px_rgba(15,23,42,0.05)]",
                "bg-zinc-900 border-zinc-800 text-zinc-300 shadow-[0_2px_8px_rgba(0,0,0,0.3)]",
                "dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
              )
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "inline-flex h-3 w-3 items-center justify-center rounded-full",
                themeClass("bg-[#EAEAF0]", "bg-zinc-800", "dark:bg-zinc-800")
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  themeClass("bg-[#18181F]", "bg-zinc-100", "dark:bg-zinc-100")
                )}
              />
            </span>
            <span>{eyebrow}</span>
          </div>
        )}

        <h2
          id={`${uid}-heading`}
          className={cn(
            "mt-4 text-[28px] sm:text-[38px] lg:text-[44px] font-medium leading-[1.12] tracking-[-0.032em]",
            themeClass("text-[#18181F]", "text-zinc-50", "dark:text-zinc-50")
          )}
        >
          {headingLines.map((line, idx) => (
            <React.Fragment key={idx}>
              {line}
              {idx < headingLines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </h2>

        {subtitle && (
          <p
            className={cn(
              "mt-3.5 max-w-[440px] text-[13.5px] sm:text-[14.5px] leading-[1.52]",
              themeClass("text-[#6E6E7A]", "text-zinc-400", "dark:text-zinc-400")
            )}
          >
            {subtitle}
          </p>
        )}
      </header>

      {/* Integration Hub + Connector Architecture */}
      <div className="relative mt-9 sm:mt-11">
        {/* Desktop SVG Connector Lines */}
        <svg
          aria-hidden="true"
          viewBox="0 0 928 214"
          fill="none"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-x-0 top-0 hidden h-[214px] w-full md:block"
        >
          {/* Left Top (Asana) -> Left Junction */}
          <path
            d="M 184 27 L 246 27 Q 260 27 260 41 L 260 68"
            className={cn(
              "transition-colors duration-200",
              activeHighlightTool === "asana"
                ? activeLineStrokeClass
                : lineStrokeClass
            )}
            strokeWidth={activeHighlightTool === "asana" ? 1.5 : 1.15}
          />
          {/* Left Bottom (Monday) -> Left Junction */}
          <path
            d="M 184 109 L 246 109 Q 260 109 260 95 L 260 68"
            className={cn(
              "transition-colors duration-200",
              activeHighlightTool === "monday"
                ? activeLineStrokeClass
                : lineStrokeClass
            )}
            strokeWidth={activeHighlightTool === "monday" ? 1.5 : 1.15}
          />
          {/* Left Junction -> Center Hub */}
          <path
            d="M 260 68 L 352 68"
            className={cn(
              "transition-colors duration-200",
              activeHighlightTool === "asana" || activeHighlightTool === "monday"
                ? activeLineStrokeClass
                : lineStrokeClass
            )}
            strokeWidth={
              activeHighlightTool === "asana" || activeHighlightTool === "monday"
                ? 1.5
                : 1.15
            }
          />

          {/* Right Top (Trello) -> Right Junction */}
          <path
            d="M 744 27 L 682 27 Q 668 27 668 41 L 668 68"
            className={cn(
              "transition-colors duration-200",
              activeHighlightTool === "trello"
                ? activeLineStrokeClass
                : lineStrokeClass
            )}
            strokeWidth={activeHighlightTool === "trello" ? 1.5 : 1.15}
          />
          {/* Right Bottom (ClickUp) -> Right Junction */}
          <path
            d="M 744 109 L 682 109 Q 668 109 668 95 L 668 68"
            className={cn(
              "transition-colors duration-200",
              activeHighlightTool === "clickup"
                ? activeLineStrokeClass
                : lineStrokeClass
            )}
            strokeWidth={activeHighlightTool === "clickup" ? 1.5 : 1.15}
          />
          {/* Right Junction -> Center Hub */}
          <path
            d="M 668 68 L 576 68"
            className={cn(
              "transition-colors duration-200",
              activeHighlightTool === "trello" || activeHighlightTool === "clickup"
                ? activeLineStrokeClass
                : lineStrokeClass
            )}
            strokeWidth={
              activeHighlightTool === "trello" || activeHighlightTool === "clickup"
                ? 1.5
                : 1.15
            }
          />

          {/* Center Hub -> Bottom Junction */}
          <path
            d="M 464 106 L 464 166"
            className={cn(
              "transition-colors duration-200",
              hoveredCard || activeHighlightTool
                ? activeLineStrokeClass
                : lineStrokeClass
            )}
            strokeWidth={hoveredCard || activeHighlightTool ? 1.4 : 1.15}
          />

          {/* Bottom Junction -> Card 1 (Usage) */}
          <path
            d="M 464 166 L 164 166 Q 150 166 150 180 L 150 214"
            className={cn(
              "transition-colors duration-200",
              hoveredCard === "usage" ? activeLineStrokeClass : lineStrokeClass
            )}
            strokeWidth={hoveredCard === "usage" ? 1.5 : 1.15}
          />
          {/* Bottom Junction -> Card 2 (Collaboration) */}
          <path
            d="M 464 166 L 464 214"
            className={cn(
              "transition-colors duration-200",
              hoveredCard === "collaboration"
                ? activeLineStrokeClass
                : lineStrokeClass
            )}
            strokeWidth={hoveredCard === "collaboration" ? 1.5 : 1.15}
          />
          {/* Bottom Junction -> Card 3 (Portal) */}
          <path
            d="M 464 166 L 764 166 Q 778 166 778 180 L 778 214"
            className={cn(
              "transition-colors duration-200",
              hoveredCard === "portal" ? activeLineStrokeClass : lineStrokeClass
            )}
            strokeWidth={hoveredCard === "portal" ? 1.5 : 1.15}
          />

          {/* Animated Data Beams */}
          {shouldAnimate && (
            <>
              <motion.path
                d="M 184 27 L 246 27 Q 260 27 260 41 L 260 68 L 352 68"
                stroke="#F06A6A"
                strokeWidth="1.75"
                strokeLinecap="round"
                initial={{ pathLength: 0.16, pathOffset: 0, opacity: 0 }}
                animate={{
                  pathOffset: [0, 1],
                  opacity: [0, 0.9, 0.9, 0],
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  repeatDelay: 1.4,
                  ease: "easeInOut",
                }}
              />
              <motion.path
                d="M 184 109 L 246 109 Q 260 109 260 95 L 260 68 L 352 68"
                stroke="#FFCB00"
                strokeWidth="1.75"
                strokeLinecap="round"
                initial={{ pathLength: 0.16, pathOffset: 0, opacity: 0 }}
                animate={{
                  pathOffset: [0, 1],
                  opacity: [0, 0.9, 0.9, 0],
                }}
                transition={{
                  duration: 2.8,
                  delay: 0.9,
                  repeat: Infinity,
                  repeatDelay: 1.4,
                  ease: "easeInOut",
                }}
              />
              <motion.path
                d="M 744 27 L 682 27 Q 668 27 668 41 L 668 68 L 576 68"
                stroke="#0079BF"
                strokeWidth="1.75"
                strokeLinecap="round"
                initial={{ pathLength: 0.16, pathOffset: 0, opacity: 0 }}
                animate={{
                  pathOffset: [0, 1],
                  opacity: [0, 0.9, 0.9, 0],
                }}
                transition={{
                  duration: 2.8,
                  delay: 0.45,
                  repeat: Infinity,
                  repeatDelay: 1.4,
                  ease: "easeInOut",
                }}
              />
              <motion.path
                d="M 744 109 L 682 109 Q 668 109 668 95 L 668 68 L 576 68"
                stroke="#7B68EE"
                strokeWidth="1.75"
                strokeLinecap="round"
                initial={{ pathLength: 0.16, pathOffset: 0, opacity: 0 }}
                animate={{
                  pathOffset: [0, 1],
                  opacity: [0, 0.9, 0.9, 0],
                }}
                transition={{
                  duration: 2.8,
                  delay: 1.35,
                  repeat: Infinity,
                  repeatDelay: 1.4,
                  ease: "easeInOut",
                }}
              />
              {/* Outgoing hub pulses to cards */}
              <motion.path
                d="M 464 106 L 464 166 L 164 166 Q 150 166 150 180 L 150 214"
                stroke="#B689EC"
                strokeWidth="1.75"
                strokeLinecap="round"
                initial={{ pathLength: 0.14, pathOffset: 0, opacity: 0 }}
                animate={{
                  pathOffset: [0, 1],
                  opacity: [0, 0.85, 0.85, 0],
                }}
                transition={{
                  duration: 2.4,
                  delay: 1.8,
                  repeat: Infinity,
                  repeatDelay: 1.8,
                  ease: "easeInOut",
                }}
              />
              <motion.path
                d="M 464 106 L 464 214"
                stroke="#6FA3F7"
                strokeWidth="1.75"
                strokeLinecap="round"
                initial={{ pathLength: 0.24, pathOffset: 0, opacity: 0 }}
                animate={{
                  pathOffset: [0, 1],
                  opacity: [0, 0.85, 0.85, 0],
                }}
                transition={{
                  duration: 1.8,
                  delay: 2.0,
                  repeat: Infinity,
                  repeatDelay: 2.4,
                  ease: "easeInOut",
                }}
              />
              <motion.path
                d="M 464 106 L 464 166 L 764 166 Q 778 166 778 180 L 778 214"
                stroke="#EE9268"
                strokeWidth="1.75"
                strokeLinecap="round"
                initial={{ pathLength: 0.14, pathOffset: 0, opacity: 0 }}
                animate={{
                  pathOffset: [0, 1],
                  opacity: [0, 0.85, 0.85, 0],
                }}
                transition={{
                  duration: 2.4,
                  delay: 2.2,
                  repeat: Infinity,
                  repeatDelay: 1.8,
                  ease: "easeInOut",
                }}
              />
            </>
          )}

          {/* Junction Nodes */}
          <circle cx="260" cy="68" r="3" className={nodeFillClass} strokeWidth="1.2" />
          <circle cx="668" cy="68" r="3" className={nodeFillClass} strokeWidth="1.2" />
          <circle cx="464" cy="166" r="3" className={nodeFillClass} strokeWidth="1.2" />
        </svg>

        {/* Top Integration Row */}
        <div className="relative z-10 grid grid-cols-1 items-center gap-4 md:h-[136px] md:grid-cols-[184px_1fr_184px] md:gap-0">
          {/* Left Stack: Asana + Monday */}
          <div className="grid grid-cols-2 gap-3 md:flex md:flex-col md:justify-between md:gap-7">
            <button
              type="button"
              aria-pressed={selectedTool === "asana"}
              onClick={() => handleToolClick("asana")}
              onMouseEnter={() => setHoveredTool("asana")}
              onMouseLeave={() => setHoveredTool(null)}
              className={cn(
                pmCardBase,
                selectedTool === "asana" && pmCardSelected
              )}
            >
              <AsanaLogo />
            </button>

            <button
              type="button"
              aria-pressed={selectedTool === "monday"}
              onClick={() => handleToolClick("monday")}
              onMouseEnter={() => setHoveredTool("monday")}
              onMouseLeave={() => setHoveredTool(null)}
              className={cn(
                pmCardBase,
                selectedTool === "monday" && pmCardSelected
              )}
            >
              <MondayLogo />
            </button>
          </div>

          {/* Center Hub Pill: retainable */}
          <div className="flex items-center justify-center py-2 md:py-0">
            <motion.div
              animate={
                activeHighlightTool && !prefersReducedMotion
                  ? { scale: 1.02 }
                  : { scale: 1 }
              }
              transition={{ duration: 0.25, ease: SMOOTH_EASE }}
              className={cn(
                "rounded-full p-[6px] transition-shadow duration-300",
                themeClass(
                  "bg-white/95 border border-white shadow-[0_18px_36px_-8px_rgba(15,23,42,0.22),0_4px_12px_-2px_rgba(15,23,42,0.1)]",
                  "bg-zinc-800/80 border border-zinc-700/80 shadow-[0_18px_36px_-8px_rgba(0,0,0,0.75)]",
                  "dark:bg-zinc-800/80 dark:border-zinc-700/80 dark:shadow-[0_18px_36px_-8px_rgba(0,0,0,0.75)]"
                )
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center gap-3 rounded-full px-7 py-3.5",
                  "bg-gradient-to-b from-[#2B2B32] via-[#1B1B20] to-[#121216] text-white",
                  "shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),inset_0_-2px_5px_rgba(0,0,0,0.55)]"
                )}
              >
                <HubEmblem />
                <span className="text-[19px] font-medium tracking-[-0.025em] leading-none">
                  {hubLabel}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Right Stack: Trello + ClickUp */}
          <div className="grid grid-cols-2 gap-3 md:flex md:flex-col md:justify-between md:gap-7">
            <button
              type="button"
              aria-pressed={selectedTool === "trello"}
              onClick={() => handleToolClick("trello")}
              onMouseEnter={() => setHoveredTool("trello")}
              onMouseLeave={() => setHoveredTool(null)}
              className={cn(
                pmCardBase,
                selectedTool === "trello" && pmCardSelected
              )}
            >
              <TrelloLogo />
            </button>

            <button
              type="button"
              aria-pressed={selectedTool === "clickup"}
              onClick={() => handleToolClick("clickup")}
              onMouseEnter={() => setHoveredTool("clickup")}
              onMouseLeave={() => setHoveredTool(null)}
              className={cn(
                pmCardBase,
                selectedTool === "clickup" && pmCardSelected
              )}
            >
              <ClickUpLogo uid={uid} />
            </button>
          </div>
        </div>

        {/* Bottom 3 Pastel Feature Cards */}
        <div className="mt-8 grid grid-cols-1 gap-5 md:mt-[78px] md:grid-cols-3">
          {/* CARD 1: Usage transparency (Lavender) */}
          <article
            onMouseEnter={() => setHoveredCard("usage")}
            onMouseLeave={() => setHoveredCard(null)}
            className={cn(
              "group relative flex h-[346px] flex-col overflow-hidden rounded-[20px] border-[3px] transition-shadow duration-300",
              themeClass(
                "border-white bg-gradient-to-b from-[#F4ECFA] via-[#F1E8F8] to-[#EDE2F6] shadow-[0_10px_28px_-10px_rgba(15,23,42,0.09)] hover:shadow-[0_16px_36px_-12px_rgba(88,48,140,0.16)]",
                "border-zinc-800/90 bg-gradient-to-b from-[#231B2E] via-[#1D1726] to-[#181320] shadow-[0_12px_32px_-12px_rgba(0,0,0,0.6)]",
                "dark:border-zinc-800/90 dark:bg-gradient-to-b dark:from-[#231B2E] dark:via-[#1D1726] dark:to-[#181320] dark:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.6)]"
              )
            )}
          >
            {/* Subtle dot-grid texture */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.35]"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(120, 90, 160, 0.22) 1px, transparent 1px)",
                backgroundSize: "10px 10px",
              }}
            />

            {/* Card Header */}
            <div className="relative z-10 px-5 pt-5">
              <div className="flex items-center gap-2">
                <Droplet
                  className={cn(
                    "h-4 w-4 shrink-0",
                    themeClass("text-[#1E1E26]", "text-purple-200", "dark:text-purple-200")
                  )}
                  strokeWidth={2}
                />
                <h3
                  className={cn(
                    "text-[15.5px] font-semibold tracking-[-0.018em]",
                    themeClass("text-[#18181F]", "text-zinc-50", "dark:text-zinc-50")
                  )}
                >
                  Usage transparency
                </h3>
              </div>
              <p
                className={cn(
                  "mt-1.5 text-[12.5px] leading-[1.45]",
                  themeClass("text-[#5F5E6B]", "text-zinc-400", "dark:text-zinc-400")
                )}
              >
                Gain real-time insights into your retainer hours, track spent and
                available time.
              </p>
            </div>

            {/* Card 1 Inner UI Mockup */}
            <div className="relative z-10 mt-auto h-[212px] w-full">
              {/* Base Hours Card */}
              <div
                className={cn(
                  "absolute bottom-5 left-4 right-[-16px] rounded-[14px] border p-4",
                  themeClass(
                    "bg-white/95 border-white shadow-[0_10px_26px_-8px_rgba(40,20,80,0.1)]",
                    "bg-zinc-900/90 border-zinc-800 shadow-[0_10px_26px_-8px_rgba(0,0,0,0.5)]",
                    "dark:bg-zinc-900/90 dark:border-zinc-800 dark:shadow-[0_10px_26px_-8px_rgba(0,0,0,0.5)]"
                  )
                )}
              >
                <div
                  className={cn(
                    "text-[10.5px] font-medium",
                    themeClass("text-[#52525E]", "text-zinc-400", "dark:text-zinc-400")
                  )}
                >
                  Hours
                </div>

                {/* Multi-Segment Bar */}
                <div className="mt-2.5 flex h-[15px] w-full overflow-hidden rounded-[5px] bg-zinc-100 dark:bg-zinc-800">
                  {usageMetrics.map((seg) => {
                    const widthPct = (Math.max(0, seg.value) / totalUsage) * 100;
                    const dimmed =
                      hoveredUsageId !== null && hoveredUsageId !== seg.id;
                    return (
                      <div
                        key={seg.id}
                        onMouseEnter={() => setHoveredUsageId(seg.id)}
                        onMouseLeave={() => setHoveredUsageId(null)}
                        style={{
                          width: `${widthPct}%`,
                          backgroundColor: seg.color,
                        }}
                        className={cn(
                          "h-full transition-opacity duration-200 cursor-pointer",
                          dimmed ? "opacity-35" : "opacity-100"
                        )}
                        title={`${seg.label}: ${seg.value} hr`}
                      />
                    );
                  })}
                </div>

                {/* 4 KPI Figures */}
                <div className="mt-4 grid grid-cols-4 gap-1.5 pr-4">
                  {usageMetrics.map((metric) => {
                    const active = hoveredUsageId === metric.id;
                    return (
                      <div
                        key={metric.id}
                        onMouseEnter={() => setHoveredUsageId(metric.id)}
                        onMouseLeave={() => setHoveredUsageId(null)}
                        className="cursor-pointer transition-opacity duration-200"
                      >
                        <div
                          className={cn(
                            "text-[21px] font-light leading-none tracking-[-0.03em] tabular-nums transition-colors duration-200",
                            active
                              ? themeClass("text-[#111116]", "text-white", "dark:text-white")
                              : themeClass("text-[#2B2B34]", "text-zinc-200", "dark:text-zinc-200")
                          )}
                        >
                          {metric.value}
                        </div>
                        <div
                          className={cn(
                            "mt-1 text-[9.5px] leading-tight truncate",
                            themeClass("text-[#7D7D8A]", "text-zinc-500", "dark:text-zinc-500")
                          )}
                        >
                          {metric.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Floating Available Hours Popover */}
              <motion.div
                animate={
                  hoveredCard === "usage" && !prefersReducedMotion
                    ? { y: -3 }
                    : { y: 0 }
                }
                transition={{ duration: 0.25, ease: SMOOTH_EASE }}
                className={cn(
                  "absolute right-4 top-2 w-[134px] rounded-[13px] border px-3.5 py-3 backdrop-blur-md",
                  themeClass(
                    "bg-white/95 border-white shadow-[0_16px_32px_-8px_rgba(38,20,74,0.16)]",
                    "bg-zinc-900/95 border-zinc-700/80 shadow-[0_16px_32px_-8px_rgba(0,0,0,0.65)]",
                    "dark:bg-zinc-900/95 dark:border-zinc-700/80 dark:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.65)]"
                  )
                )}
              >
                <div
                  className={cn(
                    "text-[9.5px] font-medium",
                    themeClass("text-[#6B6B78]", "text-zinc-400", "dark:text-zinc-400")
                  )}
                >
                  Available hours
                </div>
                <div className="mt-1 flex items-baseline gap-0.5">
                  <span
                    className={cn(
                      "text-[30px] font-light leading-none tracking-[-0.04em] tabular-nums",
                      themeClass("text-[#18181F]", "text-zinc-50", "dark:text-zinc-50")
                    )}
                  >
                    {availableHours}
                  </span>
                  <span
                    className={cn(
                      "text-[13px] font-normal",
                      themeClass("text-[#4B4B57]", "text-zinc-400", "dark:text-zinc-400")
                    )}
                  >
                    hr
                  </span>
                </div>
                <div
                  className={cn(
                    "mt-1.5 text-[8.5px]",
                    themeClass("text-[#8A8A96]", "text-zinc-500", "dark:text-zinc-500")
                  )}
                >
                  {daysRemainingText}
                </div>
              </motion.div>
            </div>
          </article>

          {/* CARD 2: Task collaboration (Sky Blue) */}
          <article
            onMouseEnter={() => setHoveredCard("collaboration")}
            onMouseLeave={() => setHoveredCard(null)}
            className={cn(
              "group relative flex h-[346px] flex-col overflow-hidden rounded-[20px] border-[3px] transition-shadow duration-300",
              themeClass(
                "border-white bg-gradient-to-b from-[#E8F3FC] via-[#E3EFFB] to-[#DCE9F9] shadow-[0_10px_28px_-10px_rgba(15,23,42,0.09)] hover:shadow-[0_16px_36px_-12px_rgba(25,75,145,0.16)]",
                "border-zinc-800/90 bg-gradient-to-b from-[#162233] via-[#131D2B] to-[#101824] shadow-[0_12px_32px_-12px_rgba(0,0,0,0.6)]",
                "dark:border-zinc-800/90 dark:bg-gradient-to-b dark:from-[#162233] dark:via-[#131D2B] dark:to-[#101824] dark:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.6)]"
              )
            )}
          >
            {/* Subtle dot-grid texture */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.35]"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(55, 115, 185, 0.22) 1px, transparent 1px)",
                backgroundSize: "10px 10px",
              }}
            />

            {/* Card Header */}
            <div className="relative z-10 px-5 pt-5">
              <div className="flex items-center gap-2">
                <SquarePen
                  className={cn(
                    "h-4 w-4 shrink-0",
                    themeClass("text-[#1E1E26]", "text-sky-200", "dark:text-sky-200")
                  )}
                  strokeWidth={2}
                />
                <h3
                  className={cn(
                    "text-[15.5px] font-semibold tracking-[-0.018em]",
                    themeClass("text-[#18181F]", "text-zinc-50", "dark:text-zinc-50")
                  )}
                >
                  Task collaboration
                </h3>
              </div>
              <p
                className={cn(
                  "mt-1.5 text-[12.5px] leading-[1.45]",
                  themeClass("text-[#5F5E6B]", "text-zinc-400", "dark:text-zinc-400")
                )}
              >
                Organize tasks, set clear priorities, and track progress
                seamlessly.
              </p>
            </div>

            {/* Card 2 Inner UI Mockup */}
            <div className="relative z-10 mt-auto h-[212px] w-full">
              {/* Background Task Table */}
              <div
                className={cn(
                  "absolute inset-x-0 bottom-0 h-[132px] border-t px-4 pt-2.5 text-[9px]",
                  themeClass(
                    "bg-white/60 border-white/80 text-[#52525E]",
                    "bg-zinc-900/55 border-zinc-800/80 text-zinc-400",
                    "dark:bg-zinc-900/55 dark:border-zinc-800/80 dark:text-zinc-400"
                  )
                )}
              >
                <div className="flex items-center justify-between text-[7.5px] font-medium uppercase tracking-[0.06em] opacity-70">
                  <span>Priority</span>
                  <span>Assignee</span>
                </div>
                <div className="mt-2.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Flag className="h-2.5 w-2.5 fill-[#6FA3F7] text-[#6FA3F7]" />
                      Medium
                    </span>
                    <span className="flex -space-x-1">
                      <MiniAvatar initials="AL" bg="#5B8DEF" />
                      <MiniAvatar initials="MK" bg="#9B72CF" />
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Flag className="h-2.5 w-2.5 fill-[#6FA3F7] text-[#6FA3F7]" />
                      Medium
                    </span>
                    <MiniAvatar initials="SR" bg="#E88B63" />
                  </div>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Flag className="h-2.5 w-2.5 fill-[#E86F51] text-[#E86F51]" />
                      High
                    </span>
                    <span className="text-[8.5px] tabular-nums opacity-75">
                      05/11
                    </span>
                    <span className="text-[8.5px] tabular-nums opacity-75">
                      2 to 4 hr
                    </span>
                    <span className="text-[8.5px] tabular-nums opacity-75">
                      03:30 hrs
                    </span>
                    <span className="flex -space-x-1">
                      <MiniAvatar initials="JD" bg="#4A77D4" />
                      <MiniAvatar initials="EL" bg="#D97B54" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Task's Status Card */}
              <motion.div
                animate={
                  hoveredCard === "collaboration" && !prefersReducedMotion
                    ? { y: -3 }
                    : { y: 0 }
                }
                transition={{ duration: 0.25, ease: SMOOTH_EASE }}
                className={cn(
                  "absolute left-1/2 top-2 w-[184px] -translate-x-1/2 rounded-[14px] border p-3.5 backdrop-blur-md",
                  themeClass(
                    "bg-white/95 border-white shadow-[0_16px_34px_-8px_rgba(15,40,85,0.16)]",
                    "bg-zinc-900/95 border-zinc-700/80 shadow-[0_16px_34px_-8px_rgba(0,0,0,0.65)]",
                    "dark:bg-zinc-900/95 dark:border-zinc-700/80 dark:shadow-[0_16px_34px_-8px_rgba(0,0,0,0.65)]"
                  )
                )}
              >
                <div
                  className={cn(
                    "text-[11px] font-semibold tracking-[-0.01em]",
                    themeClass("text-[#1E1E26]", "text-zinc-100", "dark:text-zinc-100")
                  )}
                >
                  Task&apos;s status
                </div>
                <div className="mt-2.5 space-y-2">
                  {taskStatuses.map((status) => {
                    const isDimmed =
                      hoveredStatusId !== null && hoveredStatusId !== status.id;
                    return (
                      <div
                        key={status.id}
                        onMouseEnter={() => setHoveredStatusId(status.id)}
                        onMouseLeave={() => setHoveredStatusId(null)}
                        className={cn(
                          "cursor-pointer transition-opacity duration-150",
                          isDimmed ? "opacity-45" : "opacity-100"
                        )}
                      >
                        <div className="flex items-center justify-between text-[8.5px]">
                          <span
                            className={themeClass(
                              "text-[#5C5C68]",
                              "text-zinc-300",
                              "dark:text-zinc-300"
                            )}
                          >
                            {status.label}
                          </span>
                          <span
                            className={cn(
                              "tabular-nums",
                              themeClass("text-[#8A8A96]", "text-zinc-500", "dark:text-zinc-500")
                            )}
                          >
                            {status.count}
                          </span>
                        </div>
                        <div
                          className={cn(
                            "mt-1 h-[4px] w-full overflow-hidden rounded-full",
                            themeClass("bg-[#F0F0F5]", "bg-zinc-800", "dark:bg-zinc-800")
                          )}
                        >
                          <motion.div
                            initial={
                              prefersReducedMotion
                                ? { width: `${status.percent}%` }
                                : { width: "0%" }
                            }
                            animate={{ width: `${status.percent}%` }}
                            transition={{ duration: 0.7, ease: SMOOTH_EASE }}
                            style={{ backgroundColor: status.color }}
                            className="h-full rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </article>

          {/* CARD 3: Client-facing portal (Peach / Apricot) */}
          <article
            onMouseEnter={() => setHoveredCard("portal")}
            onMouseLeave={() => setHoveredCard(null)}
            className={cn(
              "group relative flex h-[346px] flex-col overflow-hidden rounded-[20px] border-[3px] transition-shadow duration-300",
              themeClass(
                "border-white bg-gradient-to-b from-[#FCEEE4] via-[#FAEAE0] to-[#F7E3D6] shadow-[0_10px_28px_-10px_rgba(15,23,42,0.09)] hover:shadow-[0_16px_36px_-12px_rgba(165,85,40,0.16)]",
                "border-zinc-800/90 bg-gradient-to-b from-[#2B1F1A] via-[#241A16] to-[#1D1512] shadow-[0_12px_32px_-12px_rgba(0,0,0,0.6)]",
                "dark:border-zinc-800/90 dark:bg-gradient-to-b dark:from-[#2B1F1A] dark:via-[#241A16] dark:to-[#1D1512] dark:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.6)]"
              )
            )}
          >
            {/* Subtle dot-grid texture */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.35]"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(185, 110, 65, 0.22) 1px, transparent 1px)",
                backgroundSize: "10px 10px",
              }}
            />

            {/* Card Header */}
            <div className="relative z-10 px-5 pt-5">
              <div className="flex items-center gap-2">
                <LayoutGrid
                  className={cn(
                    "h-4 w-4 shrink-0",
                    themeClass("text-[#1E1E26]", "text-orange-200", "dark:text-orange-200")
                  )}
                  strokeWidth={2}
                />
                <h3
                  className={cn(
                    "text-[15.5px] font-semibold tracking-[-0.018em]",
                    themeClass("text-[#18181F]", "text-zinc-50", "dark:text-zinc-50")
                  )}
                >
                  Client-facing portal
                </h3>
              </div>
              <p
                className={cn(
                  "mt-1.5 text-[12.5px] leading-[1.45]",
                  themeClass("text-[#5F5E6B]", "text-zinc-400", "dark:text-zinc-400")
                )}
              >
                Provide clients with a clear overview of agreements, hours, and
                tasks
              </p>
            </div>

            {/* Card 3 Inner UI Mockup */}
            <div className="relative z-10 mt-auto h-[212px] w-full">
              {/* Background Client Portal Surface */}
              <div
                className={cn(
                  "absolute bottom-0 left-9 right-[-18px] top-3 rounded-tl-[14px] border-l border-t p-3.5",
                  themeClass(
                    "bg-white/88 border-white shadow-[0_8px_24px_-6px_rgba(80,40,15,0.08)]",
                    "bg-zinc-900/85 border-zinc-800 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.5)]",
                    "dark:bg-zinc-900/85 dark:border-zinc-800 dark:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.5)]"
                  )
                )}
              >
                <div
                  className={cn(
                    "text-[10.5px] font-semibold tracking-[-0.01em] truncate",
                    themeClass("text-[#22222A]", "text-zinc-100", "dark:text-zinc-100")
                  )}
                >
                  Hello {clientName}!
                </div>

                {/* Secondary Available Hours Peek (Right Side) */}
                <div className="mt-2.5 flex justify-end pr-3">
                  <div
                    className={cn(
                      "w-[106px] rounded-[10px] border px-2.5 py-2",
                      themeClass(
                        "bg-[#FAFAFC] border-[#F0F0F5]",
                        "bg-zinc-800/70 border-zinc-700/60",
                        "dark:bg-zinc-800/70 dark:border-zinc-700/60"
                      )
                    )}
                  >
                    <div
                      className={cn(
                        "text-[8px] font-medium",
                        themeClass("text-[#6B6B78]", "text-zinc-400", "dark:text-zinc-400")
                      )}
                    >
                      Available hours
                    </div>
                    <div className="mt-0.5 flex items-baseline gap-0.5">
                      <span
                        className={cn(
                          "text-[22px] font-light leading-none tracking-[-0.04em] tabular-nums",
                          themeClass("text-[#18181F]", "text-zinc-100", "dark:text-zinc-100")
                        )}
                      >
                        {availableHours}
                      </span>
                      <span
                        className={cn(
                          "text-[10px]",
                          themeClass("text-[#555562]", "text-zinc-400", "dark:text-zinc-400")
                        )}
                      >
                        hr
                      </span>
                    </div>
                    <div
                      className={cn(
                        "mt-1 truncate text-[7.5px]",
                        themeClass("text-[#8A8A96]", "text-zinc-500", "dark:text-zinc-500")
                      )}
                    >
                      {daysRemainingText} them
                    </div>
                  </div>
                </div>

                {/* Latest Tasks Mini Table */}
                <div className="mt-3.5 pr-4">
                  <div
                    className={cn(
                      "text-[8.5px] font-semibold",
                      themeClass("text-[#3B3B45]", "text-zinc-300", "dark:text-zinc-300")
                    )}
                  >
                    Latest tasks
                  </div>
                  <div
                    className={cn(
                      "mt-1.5 grid grid-cols-[1fr_auto_auto] gap-2 text-[6.8px] font-medium uppercase tracking-[0.05em]",
                      themeClass("text-[#9494A0]", "text-zinc-500", "dark:text-zinc-500")
                    )}
                  >
                    <span>Task title</span>
                    <span>Priority</span>
                    <span>Due date</span>
                  </div>
                  <div
                    className={cn(
                      "mt-1.5 grid grid-cols-[1fr_auto_auto] items-center gap-2 text-[8px] leading-[1.3]",
                      themeClass("text-[#3F3F4A]", "text-zinc-300", "dark:text-zinc-300")
                    )}
                  >
                    <span className="line-clamp-2">
                      Review and incorporate feedback from the client
                    </span>
                    <span className="inline-flex items-center gap-1 whitespace-nowrap">
                      <Flag className="h-2.5 w-2.5 fill-[#6FA3F7] text-[#6FA3F7]" />
                      Medium
                    </span>
                    <span className="tabular-nums opacity-80">04/12</span>
                  </div>
                </div>
              </div>

              {/* Floating Agreement Card (Left Overlap) */}
              <motion.div
                animate={
                  hoveredCard === "portal" && !prefersReducedMotion
                    ? { y: -3 }
                    : { y: 0 }
                }
                transition={{ duration: 0.25, ease: SMOOTH_EASE }}
                className={cn(
                  "absolute left-4 top-[42px] w-[148px] rounded-[13px] border p-3.5 backdrop-blur-md",
                  themeClass(
                    "bg-white/95 border-white shadow-[0_16px_32px_-8px_rgba(80,35,10,0.16)]",
                    "bg-zinc-900/95 border-zinc-700/80 shadow-[0_16px_32px_-8px_rgba(0,0,0,0.65)]",
                    "dark:bg-zinc-900/95 dark:border-zinc-700/80 dark:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.65)]"
                  )
                )}
              >
                <div
                  className={cn(
                    "text-[9.5px] font-medium",
                    themeClass("text-[#6B6B78]", "text-zinc-400", "dark:text-zinc-400")
                  )}
                >
                  Agreement
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span
                    className={cn(
                      "text-[29px] font-light leading-none tracking-[-0.04em] tabular-nums",
                      themeClass("text-[#18181F]", "text-zinc-50", "dark:text-zinc-50")
                    )}
                  >
                    {agreementHours}
                  </span>
                  <span
                    className={cn(
                      "text-[12px] font-normal",
                      themeClass("text-[#4B4B57]", "text-zinc-400", "dark:text-zinc-400")
                    )}
                  >
                    hr/mo
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <AlertCircle
                    className="h-3 w-3 shrink-0 fill-[#EA6A47] text-white dark:text-zinc-900"
                    aria-hidden="true"
                  />
                  <span
                    className={cn(
                      "text-[8.5px] leading-none truncate",
                      themeClass("text-[#7D7D8A]", "text-zinc-400", "dark:text-zinc-400")
                    )}
                  >
                    {daysRemainingText} them
                  </span>
                </div>
              </motion.div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
});

RetainerSolutionShowcase.displayName = "RetainerSolutionShowcase";

export {
  RetainerSolutionShowcase as component,
  RetainerSolutionShowcase as Component,
};
export default RetainerSolutionShowcase;