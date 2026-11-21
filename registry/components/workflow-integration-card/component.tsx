"use client";

import React, { useId, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type WorkflowBranchId = "hub" | "left" | "center" | "right";
export type WorkflowCardTheme = "auto" | "light" | "dark";

export interface WorkflowIntegrationCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Card headline shown in the footer section */
  title?: string;
  /** Supporting description shown beneath the headline */
  description?: string;
  /** Enables animated data-flow pulses along the dashed connector paths */
  animated?: boolean;
  /** Enables hover, click, and keyboard focus branch highlighting with tooltips */
  interactive?: boolean;
  /** Primary accent color used for port indicators, avatar fill, and active paths */
  accentColor?: string;
  /** Color theme mode ("auto" follows Tailwind dark mode / Studio toggle) */
  theme?: WorkflowCardTheme;
  /** Optional callback fired when an interactive node or cluster is selected */
  onBranchSelect?: (branch: WorkflowBranchId | null) => void;
}

const VALID_HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

function sanitizeAccent(color?: string): string {
  if (color && VALID_HEX_RE.test(color.trim())) {
    return color.trim();
  }
  return "#6400f3";
}

function SlackIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("w-6 h-6", className)}
    >
      <path
        d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"
        fill="#E01E5A"
      />
      <path
        d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"
        fill="#36C5F0"
      />
      <path
        d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"
        fill="#2EB67D"
      />
      <path
        d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"
        fill="#ECB22E"
      />
    </svg>
  );
}

function NotionIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("w-6 h-6", className)}
    >
      <path
        d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"
        fill="currentColor"
      />
    </svg>
  );
}

function AutomationBurstIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={cn("w-7 h-7", className)}
    >
      <g fill="#ee4b0e">
        <rect x="12.2" y="2.5" width="3.6" height="8" rx="0.6" />
        <rect x="12.2" y="17.5" width="3.6" height="8" rx="0.6" />
        <rect x="2.5" y="12.2" width="8" height="3.6" rx="0.6" />
        <rect x="17.5" y="12.2" width="8" height="3.6" rx="0.6" />
        <rect
          x="12.2"
          y="2.5"
          width="3.6"
          height="8"
          rx="0.6"
          transform="rotate(45 14 14)"
        />
        <rect
          x="12.2"
          y="17.5"
          width="3.6"
          height="8"
          rx="0.6"
          transform="rotate(45 14 14)"
        />
        <rect
          x="2.5"
          y="12.2"
          width="8"
          height="3.6"
          rx="0.6"
          transform="rotate(45 14 14)"
        />
        <rect
          x="17.5"
          y="12.2"
          width="8"
          height="3.6"
          rx="0.6"
          transform="rotate(45 14 14)"
        />
      </g>
    </svg>
  );
}

function MakeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 24"
      fill="none"
      aria-hidden="true"
      className={cn("w-6 h-6", className)}
    >
      <path
        d="M8.55 3.6a1.1 1.1 0 0 1 1.44.54l1.95 4.44-4.76 11.42a1.1 1.1 0 0 1-1.44.58l-2.6-1.08a1.1 1.1 0 0 1-.58-1.44L8.55 3.6z"
        fill="#b009d2"
      />
      <path
        d="M13.68 3.22a1.1 1.1 0 0 1 1.3-.85l2.75.56a1.1 1.1 0 0 1 .85 1.3l-3.05 15.16a1.1 1.1 0 0 1-1.3.85l-2.75-.56a1.1 1.1 0 0 1-.85-1.3l3.05-15.16z"
        fill="#b009d2"
      />
      <rect x="20.1" y="3.2" width="4.8" height="17.4" rx="1.1" fill="#b009d2" />
    </svg>
  );
}

function BranchRouterIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 24"
      fill="none"
      aria-hidden="true"
      className={cn("w-6 h-6", className)}
    >
      <path
        d="M5.2 12L17.5 6.2M5.2 12L17.5 17.8"
        stroke="currentColor"
        strokeWidth="3.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.8 3.1L22.5 5.4L17.9 10.6L15.8 3.1Z"
        fill="currentColor"
      />
      <path
        d="M15.8 20.9L22.5 18.6L17.9 13.4L15.8 20.9Z"
        fill="currentColor"
      />
    </svg>
  );
}

function UserAvatarGraphic({
  gradientId,
  accentColor,
}: {
  gradientId: string;
  accentColor: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className="w-full h-full"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="32"
          y1="8"
          x2="32"
          y2="64"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.68" />
          <stop offset="50%" stopColor={accentColor} stopOpacity="0.92" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0.80" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="21" r="10.4" fill={`url(#${gradientId})`} />
      <path
        d="M10 64C10 47.8 19.4 38 32 38C44.6 38 54 47.8 54 64H10Z"
        fill={`url(#${gradientId})`}
      />
    </svg>
  );
}

const BRANCH_LABELS: Record<WorkflowBranchId, string> = {
  hub: "Your Operations Hub",
  center: "Core Automation",
  left: "Slack + Notion",
  right: "Make + Routing",
};

const PATH_LEFT = "M 193 68 L 162 68 A 46 46 0 0 0 116 114 L 116 221";
const PATH_CENTER = "M 230 105 L 230 151";
const PATH_RIGHT = "M 267 68 L 298 68 A 46 46 0 0 1 344 114 L 344 221";

export const WorkflowIntegrationCard = React.forwardRef<
  HTMLDivElement,
  WorkflowIntegrationCardProps
>(function WorkflowIntegrationCard(
  {
    title = "Built for You",
    description = "Every system is fully tailored to your processes, no templates, just precision-built operations.",
    animated = true,
    interactive = true,
    accentColor = "#6400f3",
    theme = "auto",
    onBranchSelect,
    className,
    ...rest
  },
  ref
) {
  const rawId = useId();
  const uid = rawId.replace(/:/g, "");
  const shouldReduceMotion = useReducedMotion();
  const accent = sanitizeAccent(accentColor);

  const [hoveredBranch, setHoveredBranch] = useState<WorkflowBranchId | null>(
    null
  );
  const [selectedBranch, setSelectedBranch] = useState<WorkflowBranchId | null>(
    null
  );

  const activeBranch: WorkflowBranchId | null = interactive
    ? hoveredBranch ?? selectedBranch
    : null;

  const isPathHighlighted = (branch: "left" | "center" | "right") => {
    if (!activeBranch) return false;
    return activeBranch === "hub" || activeBranch === branch;
  };

  const handleToggleBranch = (branch: WorkflowBranchId) => {
    if (!interactive) return;
    const next = selectedBranch === branch ? null : branch;
    setSelectedBranch(next);
    onBranchSelect?.(next);
  };

  const isForcedDark = theme === "dark";
  const isForcedLight = theme === "light";

  const surfaceClasses = isForcedDark
    ? "bg-zinc-950 border-zinc-800/90 text-zinc-50 shadow-[0_18px_45px_-18px_rgba(0,0,0,0.65)]"
    : isForcedLight
      ? "bg-white border-zinc-200/80 text-zinc-900 shadow-[0_18px_45px_-20px_rgba(15,23,42,0.12)]"
      : "bg-white dark:bg-zinc-950 border-zinc-200/80 dark:border-zinc-800/90 text-zinc-900 dark:text-zinc-50 shadow-[0_18px_45px_-20px_rgba(15,23,42,0.12)] dark:shadow-[0_18px_45px_-18px_rgba(0,0,0,0.65)]";

  const dividerClasses = isForcedDark
    ? "border-zinc-800/80"
    : isForcedLight
      ? "border-zinc-200/75"
      : "border-zinc-200/75 dark:border-zinc-800/80";

  const subtitleClasses = isForcedDark
    ? "text-zinc-400"
    : isForcedLight
      ? "text-zinc-500"
      : "text-zinc-500 dark:text-zinc-400";

  const outerBezelClasses = isForcedDark
    ? "bg-zinc-900/90 border-zinc-800 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.6)]"
    : isForcedLight
      ? "bg-white/90 border-zinc-200/80 shadow-[0_8px_20px_-8px_rgba(15,23,42,0.08)]"
      : "bg-white/90 dark:bg-zinc-900/90 border-zinc-200/80 dark:border-zinc-800 shadow-[0_8px_20px_-8px_rgba(15,23,42,0.08)] dark:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.6)]";

  const innerTileClasses = isForcedDark
    ? "bg-zinc-950 border-zinc-800/90 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
    : isForcedLight
      ? "bg-white border-zinc-100 text-zinc-900 shadow-[0_2px_6px_-2px_rgba(15,23,42,0.06)]"
      : "bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800/90 text-zinc-900 dark:text-zinc-100 shadow-[0_2px_6px_-2px_rgba(15,23,42,0.06)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

  const ghostTileClasses = isForcedDark
    ? "bg-zinc-900/50 border-zinc-800/60"
    : isForcedLight
      ? "bg-white/75 border-zinc-200/55 shadow-[0_2px_8px_-4px_rgba(15,23,42,0.05)]"
      : "bg-white/75 dark:bg-zinc-900/50 border-zinc-200/55 dark:border-zinc-800/60 shadow-[0_2px_8px_-4px_rgba(15,23,42,0.05)] dark:shadow-none";

  const portRingClasses = isForcedDark
    ? "fill-zinc-950 stroke-zinc-700"
    : isForcedLight
      ? "fill-white stroke-zinc-200"
      : "fill-white dark:fill-zinc-950 stroke-zinc-200 dark:stroke-zinc-700";

  const dashedLineBaseClasses = isForcedDark
    ? "stroke-zinc-700"
    : isForcedLight
      ? "stroke-zinc-300"
      : "stroke-zinc-300 dark:stroke-zinc-700";

  const tooltipClasses = isForcedDark
    ? "bg-zinc-900 text-zinc-100 border-zinc-700/80 shadow-lg"
    : isForcedLight
      ? "bg-zinc-900 text-white border-zinc-800 shadow-lg"
      : "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-800 dark:border-zinc-200 shadow-lg";

  const dotColor = isForcedDark
    ? "rgba(255,255,255,0.12)"
    : "rgba(148,163,184,0.36)";

  const hatchColor = isForcedDark
    ? "rgba(255,255,255,0.03)"
    : "rgba(15,23,42,0.026)";

  const showPulses = animated && !shouldReduceMotion;

  return (
    <div
      ref={ref}
      role="region"
      aria-labelledby={`${uid}-title`}
      className={cn(
        "relative w-full max-w-[460px] overflow-hidden rounded-[26px] border transition-colors duration-200",
        surfaceClasses,
        className
      )}
      {...rest}
    >
      {/* Top Interactive Workflow Architecture Canvas */}
      <div className="relative w-full aspect-[460/308] overflow-hidden select-none">
        {/* Subtle dot-matrix background grid */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0",
            !isForcedDark && !isForcedLight && "dark:opacity-35"
          )}
          style={{
            backgroundImage: `radial-gradient(${dotColor} 1px, transparent 1px)`,
            backgroundSize: "14px 14px",
            backgroundPosition: "7px 7px",
          }}
        />
        {/* Soft edge vignette over dot matrix */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0",
            isForcedDark
              ? "bg-[radial-gradient(ellipse_at_center,transparent_58%,rgba(9,9,11,0.85)_100%)]"
              : isForcedLight
                ? "bg-[radial-gradient(ellipse_at_center,transparent_58%,rgba(255,255,255,0.85)_100%)]"
                : "bg-[radial-gradient(ellipse_at_center,transparent_58%,rgba(255,255,255,0.85)_100%)] dark:bg-[radial-gradient(ellipse_at_center,transparent_58%,rgba(9,9,11,0.85)_100%)]"
          )}
        />

        {/* Floating background ghost placeholder tiles */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute w-[7.8%] aspect-square rounded-[10px] border",
            ghostTileClasses
          )}
          style={{ left: "14.5%", top: "17%" }}
        />
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute w-[7.8%] aspect-square rounded-[10px] border",
            ghostTileClasses
          )}
          style={{ left: "15.2%", top: "54%" }}
        />
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute w-[7.8%] aspect-square rounded-[10px] border",
            ghostTileClasses
          )}
          style={{ left: "73.2%", top: "14.5%" }}
        />
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute w-[7.8%] aspect-square rounded-[10px] border",
            ghostTileClasses
          )}
          style={{ left: "81.2%", top: "38.5%" }}
        />

        {/* SVG Dashed Connector Lines + Live Signal Pulses */}
        <svg
          viewBox="0 0 460 308"
          fill="none"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full"
        >
          {/* Base dashed paths */}
          <path
            d={PATH_LEFT}
            strokeWidth="1.5"
            strokeDasharray="4 4"
            strokeLinecap="round"
            className={cn(
              "transition-colors duration-200",
              !isPathHighlighted("left") && dashedLineBaseClasses
            )}
            stroke={isPathHighlighted("left") ? accent : undefined}
            strokeOpacity={isPathHighlighted("left") ? 0.85 : 1}
          />
          <path
            d={PATH_CENTER}
            strokeWidth="1.5"
            strokeDasharray="4 4"
            strokeLinecap="round"
            className={cn(
              "transition-colors duration-200",
              !isPathHighlighted("center") && dashedLineBaseClasses
            )}
            stroke={isPathHighlighted("center") ? accent : undefined}
            strokeOpacity={isPathHighlighted("center") ? 0.85 : 1}
          />
          <path
            d={PATH_RIGHT}
            strokeWidth="1.5"
            strokeDasharray="4 4"
            strokeLinecap="round"
            className={cn(
              "transition-colors duration-200",
              !isPathHighlighted("right") && dashedLineBaseClasses
            )}
            stroke={isPathHighlighted("right") ? accent : undefined}
            strokeOpacity={isPathHighlighted("right") ? 0.85 : 1}
          />

          {/* Subtle flowing signal pulses along each path */}
          {showPulses && (
            <>
              <motion.path
                d={PATH_LEFT}
                stroke={accent}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="18 220"
                initial={{ strokeDashoffset: 238 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "linear",
                }}
                strokeOpacity={isPathHighlighted("left") ? 0.95 : 0.45}
              />
              <motion.path
                d={PATH_CENTER}
                stroke={accent}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="10 60"
                initial={{ strokeDashoffset: 70 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{
                  duration: 1.9,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 0.4,
                }}
                strokeOpacity={isPathHighlighted("center") ? 0.95 : 0.45}
              />
              <motion.path
                d={PATH_RIGHT}
                stroke={accent}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="18 220"
                initial={{ strokeDashoffset: 238 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "linear",
                  delay: 0.9,
                }}
                strokeOpacity={isPathHighlighted("right") ? 0.95 : 0.45}
              />
            </>
          )}
        </svg>

        {/* Top Center Node: User Operations Hub */}
        <motion.button
          type="button"
          aria-label="Your Operations Hub"
          aria-pressed={selectedBranch === "hub"}
          disabled={!interactive}
          onClick={() => handleToggleBranch("hub")}
          onMouseEnter={() => interactive && setHoveredBranch("hub")}
          onMouseLeave={() => interactive && setHoveredBranch(null)}
          onFocus={() => interactive && setHoveredBranch("hub")}
          onBlur={() => interactive && setHoveredBranch(null)}
          whileHover={
            interactive && !shouldReduceMotion ? { y: -2 } : undefined
          }
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          className={cn(
            "absolute -translate-x-1/2 -translate-y-1/2 rounded-[20px] border p-[5px] transition-shadow duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            outerBezelClasses,
            interactive ? "cursor-pointer" : "cursor-default"
          )}
          style={{
            left: "50%",
            top: "22.08%",
            width: "16.1%",
            aspectRatio: "1 / 1",
            borderColor:
              activeBranch === "hub" ? `${accent}66` : undefined,
          }}
        >
          <div
            className={cn(
              "w-full h-full overflow-hidden rounded-[15px] border flex items-end justify-center",
              innerTileClasses
            )}
          >
            <UserAvatarGraphic
              gradientId={`${uid}-avatar-grad`}
              accentColor={accent}
            />
          </div>
        </motion.button>

        {/* Center Middle Node: Core Automation (Zapier-style 8-spoke burst) */}
        <motion.button
          type="button"
          aria-label="Core Automation Engine"
          aria-pressed={selectedBranch === "center"}
          disabled={!interactive}
          onClick={() => handleToggleBranch("center")}
          onMouseEnter={() => interactive && setHoveredBranch("center")}
          onMouseLeave={() => interactive && setHoveredBranch(null)}
          onFocus={() => interactive && setHoveredBranch("center")}
          onBlur={() => interactive && setHoveredBranch(null)}
          whileHover={
            interactive && !shouldReduceMotion ? { y: -2 } : undefined
          }
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          className={cn(
            "absolute -translate-x-1/2 -translate-y-1/2 rounded-[18px] border p-[5px] transition-shadow duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            outerBezelClasses,
            interactive ? "cursor-pointer" : "cursor-default"
          )}
          style={{
            left: "50%",
            top: "59.74%",
            width: "14.35%",
            aspectRatio: "1 / 1",
            borderColor:
              isPathHighlighted("center") ? `${accent}66` : undefined,
          }}
        >
          <div
            className={cn(
              "w-full h-full rounded-[13px] border flex items-center justify-center",
              innerTileClasses
            )}
          >
            <AutomationBurstIcon className="w-[54%] h-[54%]" />
          </div>
        </motion.button>

        {/* Bottom-Left Cluster: Slack + Notion */}
        <motion.button
          type="button"
          aria-label="Slack and Notion Integrations"
          aria-pressed={selectedBranch === "left"}
          disabled={!interactive}
          onClick={() => handleToggleBranch("left")}
          onMouseEnter={() => interactive && setHoveredBranch("left")}
          onMouseLeave={() => interactive && setHoveredBranch(null)}
          onFocus={() => interactive && setHoveredBranch("left")}
          onBlur={() => interactive && setHoveredBranch(null)}
          whileHover={
            interactive && !shouldReduceMotion ? { y: -2 } : undefined
          }
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          className={cn(
            "absolute -translate-x-1/2 -translate-y-1/2 rounded-[18px] border p-[5px] grid grid-cols-2 gap-[6px] transition-shadow duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            outerBezelClasses,
            interactive ? "cursor-pointer" : "cursor-default"
          )}
          style={{
            left: "25.22%",
            top: "81.82%",
            width: "26.52%",
            height: "20.13%",
            borderColor:
              isPathHighlighted("left") ? `${accent}66` : undefined,
          }}
        >
          <div
            className={cn(
              "w-full h-full rounded-[12px] border flex items-center justify-center",
              innerTileClasses
            )}
          >
            <SlackIcon className="w-[52%] h-[52%]" />
          </div>
          <div
            className={cn(
              "w-full h-full rounded-[12px] border flex items-center justify-center",
              innerTileClasses
            )}
          >
            <NotionIcon className="w-[52%] h-[52%]" />
          </div>
        </motion.button>

        {/* Bottom-Right Cluster: Make + Conditional Router */}
        <motion.button
          type="button"
          aria-label="Make and Workflow Routing Integrations"
          aria-pressed={selectedBranch === "right"}
          disabled={!interactive}
          onClick={() => handleToggleBranch("right")}
          onMouseEnter={() => interactive && setHoveredBranch("right")}
          onMouseLeave={() => interactive && setHoveredBranch(null)}
          onFocus={() => interactive && setHoveredBranch("right")}
          onBlur={() => interactive && setHoveredBranch(null)}
          whileHover={
            interactive && !shouldReduceMotion ? { y: -2 } : undefined
          }
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          className={cn(
            "absolute -translate-x-1/2 -translate-y-1/2 rounded-[18px] border p-[5px] grid grid-cols-2 gap-[6px] transition-shadow duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            outerBezelClasses,
            interactive ? "cursor-pointer" : "cursor-default"
          )}
          style={{
            left: "74.78%",
            top: "81.82%",
            width: "26.52%",
            height: "20.13%",
            borderColor:
              isPathHighlighted("right") ? `${accent}66` : undefined,
          }}
        >
          <div
            className={cn(
              "w-full h-full rounded-[12px] border flex items-center justify-center",
              innerTileClasses
            )}
          >
            <MakeIcon className="w-[54%] h-[54%]" />
          </div>
          <div
            className={cn(
              "w-full h-full rounded-[12px] border flex items-center justify-center",
              innerTileClasses
            )}
          >
            <BranchRouterIcon className="w-[54%] h-[54%]" />
          </div>
        </motion.button>

        {/* SVG Port Dots Overlay (rendered above node edges for crisp 1:1 overlap) */}
        <svg
          viewBox="0 0 460 308"
          fill="none"
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full"
        >
          {[
            { cx: 193, cy: 68, active: isPathHighlighted("left") },
            { cx: 267, cy: 68, active: isPathHighlighted("right") },
            { cx: 230, cy: 105, active: isPathHighlighted("center") },
            { cx: 230, cy: 151, active: isPathHighlighted("center") },
            { cx: 116, cy: 221, active: isPathHighlighted("left") },
            { cx: 344, cy: 221, active: isPathHighlighted("right") },
          ].map((port, idx) => (
            <g key={idx}>
              <circle
                cx={port.cx}
                cy={port.cy}
                r={port.active ? 6.5 : 5.5}
                strokeWidth="1"
                className={cn("transition-colors duration-200", portRingClasses)}
              />
              <circle
                cx={port.cx}
                cy={port.cy}
                r={port.active ? 3 : 2.3}
                fill={accent}
                className="transition-opacity duration-200"
              />
            </g>
          ))}
        </svg>

        {/* Subtle Floating Branch Indicator Pill (only visible during hover/focus/selection) */}
        <AnimatePresence>
          {activeBranch && (
            <motion.div
              key={activeBranch}
              initial={
                shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }
              }
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className={cn(
                "pointer-events-none absolute top-3 right-3 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-tight",
                tooltipClasses
              )}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
                style={{ backgroundColor: accent }}
              />
              {BRANCH_LABELS[activeBranch]}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Footer Copy Section with Subtle Diagonal Hatch Texture */}
      <div className={cn("relative border-t px-7 py-6 sm:px-8 sm:py-7", dividerClasses)}>
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0",
            !isForcedDark && !isForcedLight && "dark:opacity-20"
          )}
          style={{
            backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 10px, ${hatchColor} 10px, ${hatchColor} 11px)`,
          }}
        />
        <div className="relative">
          <h3
            id={`${uid}-title`}
            className="text-[21px] sm:text-[22px] font-medium tracking-[-0.025em] leading-[1.25]"
          >
            {title}
          </h3>
          <p
            className={cn(
              "mt-2 text-[14px] sm:text-[14.5px] leading-[1.55] font-normal max-w-[38ch]",
              subtitleClasses
            )}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
});

WorkflowIntegrationCard.displayName = "WorkflowIntegrationCard";

export {
  WorkflowIntegrationCard as component,
  WorkflowIntegrationCard as Component,
};
export default WorkflowIntegrationCard;