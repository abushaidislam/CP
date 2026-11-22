"use client";

import React, { useId, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type WorkflowTheme = "auto" | "light" | "dark";
export type TechToolId =
  | "pulse-chat"
  | "relay-mail"
  | "vector-studio"
  | "motion-canvas"
  | "sprint-up"
  | "orbit-tasks";

export type WorkflowNodeId =
  | "client"
  | "task"
  | "notes"
  | "subtasks"
  | "subtask-1"
  | "pm"
  | "ux";

export interface ProjectWorkflowTreeProps {
  clientName?: string;
  onboardedDate?: string;
  taskTitle?: string;
  notesUpdated?: string;
  notesPreview?: string;
  subtaskTitle?: string;
  animateFlow?: boolean;
  interactive?: boolean;
  showGrid?: boolean;
  theme?: WorkflowTheme;
  onNodeSelect?: (nodeId: WorkflowNodeId | null) => void;
  className?: string;
}

const TOOL_META: Record<TechToolId, { label: string; bg: string }> = {
  "pulse-chat": { label: "Pulse Chat", bg: "#3F0E40" },
  "relay-mail": { label: "Relay Mail", bg: "#FFFFFF" },
  "vector-studio": { label: "Vector Studio", bg: "#18181B" },
  "motion-canvas": { label: "Motion Canvas", bg: "#0088FF" },
  "sprint-up": { label: "Sprint Board", bg: "#FFFFFF" },
  "orbit-tasks": { label: "Orbit Tasks", bg: "#F46B6B" },
};

function TechIcon({
  tool,
  interactive,
  isDark,
  isLight,
}: {
  tool: TechToolId;
  interactive: boolean;
  isDark: boolean;
  isLight: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const meta = TOOL_META[tool];

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => interactive && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        role="img"
        aria-label={meta.label}
        tabIndex={interactive ? 0 : -1}
        onFocus={() => interactive && setHovered(true)}
        onBlur={() => setHovered(false)}
        className={cn(
          "relative flex h-[25px] w-[25px] shrink-0 items-center justify-center rounded-[6.5px] transition-transform duration-150",
          interactive &&
            "cursor-pointer hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
          tool === "relay-mail" || tool === "sprint-up"
            ? isDark
              ? "bg-zinc-800 ring-1 ring-white/10 shadow-sm"
              : isLight
                ? "bg-white ring-1 ring-slate-200/90 shadow-[0_1px_3px_rgba(15,23,42,0.08)]"
                : "bg-white dark:bg-zinc-800 ring-1 ring-slate-200/90 dark:ring-white/10 shadow-[0_1px_3px_rgba(15,23,42,0.08)]"
            : "shadow-[0_1px_3px_rgba(15,23,42,0.14)]"
        )}
        style={
          tool !== "relay-mail" && tool !== "sprint-up"
            ? { backgroundColor: meta.bg }
            : undefined
        }
      >
        {tool === "pulse-chat" && (
          <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" aria-hidden="true">
            <rect x="4" y="9.5" width="6.5" height="3" rx="1.5" fill="#36C5F0" />
            <circle cx="9" cy="6.2" r="1.7" fill="#36C5F0" />
            <rect x="11.5" y="4" width="3" height="6.5" rx="1.5" fill="#2EB67D" />
            <circle cx="17.8" cy="9" r="1.7" fill="#2EB67D" />
            <rect x="13.5" y="11.5" width="6.5" height="3" rx="1.5" fill="#ECB22E" />
            <circle cx="15" cy="17.8" r="1.7" fill="#ECB22E" />
            <rect x="9.5" y="13.5" width="3" height="6.5" rx="1.5" fill="#E01E5A" />
            <circle cx="6.2" cy="15" r="1.7" fill="#E01E5A" />
          </svg>
        )}
        {tool === "relay-mail" && (
          <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" aria-hidden="true">
            <path
              d="M4 7.5V17a1.5 1.5 0 0 0 1.5 1.5H7V11l5 3.6 5-3.6v7.5h1.5A1.5 1.5 0 0 0 20 17V7.5"
              stroke="#EA4335"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 7.5a1.5 1.5 0 0 1 2.4-1.2L12 10.5l5.6-4.2A1.5 1.5 0 0 1 20 7.5"
              stroke="#4285F4"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M4 11v6a1.5 1.5 0 0 0 1.5 1.5H7V11H4Z" fill="#34A853" />
            <path d="M20 11v6a1.5 1.5 0 0 1-1.5 1.5H17V11h3Z" fill="#FBBC05" />
          </svg>
        )}
        {tool === "vector-studio" && (
          <svg viewBox="0 0 24 24" className="h-[14px] w-[14px]" fill="none" aria-hidden="true">
            <rect x="6" y="4" width="6" height="5.3" rx="2.65" fill="#F24E1E" />
            <rect x="12" y="4" width="6" height="5.3" rx="2.65" fill="#FF7262" />
            <rect x="6" y="9.35" width="6" height="5.3" rx="2.65" fill="#A259FF" />
            <circle cx="15" cy="12" r="2.65" fill="#1ABCFE" />
            <path
              d="M6 17.35A2.65 2.65 0 0 1 8.65 14.7H12v2.65a2.65 2.65 0 0 1-6 0Z"
              fill="#0ACF83"
            />
          </svg>
        )}
        {tool === "motion-canvas" && (
          <svg viewBox="0 0 24 24" className="h-[14px] w-[14px]" fill="none" aria-hidden="true">
            <path d="M6.5 5h11v4.6h-5.5L6.5 5Z" fill="#FFFFFF" />
            <path d="M6.5 9.6h5.5l5.5 4.7h-11V9.6Z" fill="#CFE8FF" />
            <path d="M6.5 14.3H12V19l-5.5-4.7Z" fill="#93C5FD" />
          </svg>
        )}
        {tool === "sprint-up" && (
          <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" aria-hidden="true">
            <path
              d="M6.5 11.2 12 6.5l5.5 4.7"
              stroke="#F43F5E"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6.5 15.8c1.6 1.7 3.5 2.5 5.5 2.5s3.9-.8 5.5-2.5"
              stroke="#6366F1"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        )}
        {tool === "orbit-tasks" && (
          <svg viewBox="0 0 24 24" className="h-[14px] w-[14px]" fill="none" aria-hidden="true">
            <circle cx="12" cy="7.5" r="2.7" fill="#FFFFFF" />
            <circle cx="7.4" cy="15.5" r="2.7" fill="#FFFFFF" fillOpacity="0.92" />
            <circle cx="16.6" cy="15.5" r="2.7" fill="#FFFFFF" fillOpacity="0.92" />
          </svg>
        )}
      </div>

      <span className="pointer-events-none absolute -top-7 left-1/2 z-50 -translate-x-1/2">
        <AnimatePresence>
          {hovered && (
            <motion.span
              initial={{ opacity: 0, y: 4, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 3, scale: 0.94 }}
              transition={{ duration: 0.14 }}
              className="block whitespace-nowrap rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-white shadow-md dark:bg-zinc-100 dark:text-zinc-900"
            >
              {meta.label}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </div>
  );
}

function IllustratedAvatar({
  variant,
  size = "sm",
}: {
  variant: "pm" | "ux" | "dev";
  size?: "sm" | "lg";
}) {
  const dim = size === "lg" ? "h-[42px] w-[42px]" : "h-[21px] w-[21px]";

  if (variant === "pm") {
    return (
      <div
        className={cn(
          dim,
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FBF0DA] ring-1 ring-amber-200/60 dark:bg-amber-950/60 dark:ring-amber-700/40"
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 40 40" className="h-full w-full" fill="none">
          <circle cx="20" cy="17.5" r="7.2" fill="#F2C29B" />
          <path
            d="M13.2 18.2c0 4.6 3 7.6 6.8 7.6s6.8-3 6.8-7.6c-1.4 1.8-3.8 2.4-6.8 2.4s-5.4-.6-6.8-2.4Z"
            fill="#3B2314"
          />
          <path
            d="M16.5 16.2h1.6M21.9 16.2h1.6"
            stroke="#2D1A10"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M18.6 19.8c.8.6 2 .6 2.8 0"
            stroke="#F8D9C0"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path d="M10 37c1.6-6 5.2-9 10-9s8.4 3 10 9" fill="#5B4636" />
        </svg>
      </div>
    );
  }

  if (variant === "ux") {
    return (
      <div
        className={cn(
          dim,
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EEE9FB] ring-1 ring-violet-200/70 dark:bg-violet-950/60 dark:ring-violet-700/40"
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 40 40" className="h-full w-full" fill="none">
          <path
            d="M12.5 16.5c0-5 3.3-8.5 7.5-8.5s7.5 3.5 7.5 8.5v2.5h-15v-2.5Z"
            fill="#3F3D56"
          />
          <circle cx="20" cy="18.2" r="6.8" fill="#F3C9A8" />
          <path
            d="M13 15.6c2.2-2.6 5.4-3.8 10.2-3.4 2 .2 3.2 1.2 4 2.8-2.6-.7-5.6-1-8.2-.8-2.2.2-4.2.7-6 1.4Z"
            fill="#2C2A3E"
          />
          <circle cx="17.5" cy="18.2" r="1.5" stroke="#2C2A3E" strokeWidth="1.1" />
          <circle cx="22.5" cy="18.2" r="1.5" stroke="#2C2A3E" strokeWidth="1.1" />
          <path d="M19 18.2h2" stroke="#2C2A3E" strokeWidth="1.1" />
          <path d="M10.5 37c1.5-5.8 4.8-8.8 9.5-8.8s8 3 9.5 8.8" fill="#8B7EC8" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={cn(
        dim,
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FBE9E7] ring-1 ring-rose-200/70 dark:bg-rose-950/60 dark:ring-rose-700/40"
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 40 40" className="h-full w-full" fill="none">
        <circle cx="20" cy="18" r="6.8" fill="#E8B490" />
        <path
          d="M13 15c1-4.2 3.5-6.5 7-6.5s6 2.3 7 6.5c-2.5-1.5-4.8-2-7-2s-4.5.5-7 2Z"
          fill="#1F2937"
        />
        <path
          d="M17.2 17.5h1.4M21.4 17.5h1.4"
          stroke="#1F2937"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path d="M10.5 37c1.5-5.8 4.8-8.6 9.5-8.6s8 2.8 9.5 8.6" fill="#374151" />
      </svg>
    </div>
  );
}

function TechStackBadge({
  isDark,
  isLight,
}: {
  isDark: boolean;
  isLight: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[25px] shrink-0 items-center rounded-[7px] px-2.5 text-[10.5px] font-medium tracking-[-0.01em]",
        isDark
          ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/20"
          : isLight
            ? "bg-[#FEF8E2] text-[#D1A22A]"
            : "bg-[#FEF8E2] text-[#D1A22A] dark:bg-amber-500/15 dark:text-amber-300 dark:ring-1 dark:ring-amber-400/20"
      )}
    >
      Tech-Stack
    </span>
  );
}

const ProjectWorkflowTree = React.forwardRef<HTMLDivElement, ProjectWorkflowTreeProps>(
  (
    {
      clientName = "Nuvora",
      onboardedDate = "25 Jun",
      taskTitle = "Web Design",
      notesUpdated = "Today",
      notesPreview = "Prioritize minimal hero hierarchy & mobile checkout flow.",
      subtaskTitle = "Create Wireframe",
      animateFlow = true,
      interactive = true,
      showGrid = true,
      theme = "auto",
      onNodeSelect,
      className,
    },
    ref
  ) => {
    const rawId = useId();
    const uid = rawId.replace(/:/g, "");
    const shouldReduceMotion = useReducedMotion();
    const motionEnabled = animateFlow && !shouldReduceMotion;

    const [activeNode, setActiveNode] = useState<WorkflowNodeId | null>(null);
    const [frontSubtask, setFrontSubtask] = useState<"list" | "wireframe">("wireframe");
    const [wireframeDone, setWireframeDone] = useState(false);

    const isDark = theme === "dark";
    const isLight = theme === "light";

    const handleSelect = (nodeId: WorkflowNodeId) => {
      if (!interactive) return;
      const next = activeNode === nodeId ? null : nodeId;
      setActiveNode(next);
      onNodeSelect?.(next);
    };

    const surfaceClass = isDark
      ? "bg-zinc-900/95 border-zinc-800/90 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.55),0_2px_6px_rgba(0,0,0,0.35)]"
      : isLight
        ? "bg-white border-slate-200/75 shadow-[0_12px_30px_-8px_rgba(15,23,42,0.08),0_2px_6px_rgba(15,23,42,0.04)]"
        : "bg-white dark:bg-zinc-900/95 border-slate-200/75 dark:border-zinc-800/90 shadow-[0_12px_30px_-8px_rgba(15,23,42,0.08),0_2px_6px_rgba(15,23,42,0.04)] dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.55)]";

    const titleClass = isDark
      ? "text-zinc-100"
      : isLight
        ? "text-slate-900"
        : "text-slate-900 dark:text-zinc-100";

    const mutedClass = isDark
      ? "text-zinc-400"
      : isLight
        ? "text-slate-400"
        : "text-slate-400 dark:text-zinc-400";

    const activeRingClass = isDark
      ? "ring-2 ring-sky-400/70 border-sky-400/60"
      : isLight
        ? "ring-2 ring-sky-400/60 border-sky-300"
        : "ring-2 ring-sky-400/60 border-sky-300 dark:border-sky-400/60";

    const portFillClass = isDark
      ? "fill-zinc-900"
      : isLight
        ? "fill-white"
        : "fill-white dark:fill-zinc-900";

    const springTransition = shouldReduceMotion
      ? { duration: 0.01 }
      : { type: "spring" as const, stiffness: 360, damping: 28, mass: 0.9 };

    const isPathActive = (targets: WorkflowNodeId[]) =>
      activeNode !== null && targets.includes(activeNode);

    return (
      <div
        ref={ref}
        role="region"
        aria-label={`Project workflow tree for ${clientName} ${taskTitle}`}
        className={cn(
          "relative mx-auto w-full max-w-[780px] select-none font-sans antialiased",
          className
        )}
      >
        {showGrid && (
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0 rounded-3xl",
              isDark
                ? "opacity-35"
                : isLight
                  ? "opacity-75"
                  : "opacity-75 dark:opacity-35"
            )}
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(148, 163, 184, 0.28) 1.25px, transparent 1.25px)",
              backgroundSize: "20px 20px",
              maskImage:
                "radial-gradient(ellipse 72% 70% at 50% 50%, black 42%, transparent 98%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 72% 70% at 50% 50%, black 42%, transparent 98%)",
            }}
          />
        )}

        {/* DESKTOP SPATIAL TREE (760 x 590) */}
        <div className="relative mx-auto hidden h-[590px] w-[760px] md:block">
          <svg
            viewBox="0 0 760 590"
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            fill="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={`${uid}-beam`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
                <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* 1. Client -> Task vertical connector */}
            <path
              d="M 360 72 L 360 106"
              stroke={isPathActive(["client", "task"]) ? "#38BDF8" : "#8CC2F8"}
              strokeWidth={isPathActive(["client", "task"]) ? "2" : "1.6"}
              strokeLinecap="round"
            />
            <circle
              cx="360"
              cy="72"
              r="3.8"
              className={portFillClass}
              stroke={isPathActive(["client", "task"]) ? "#38BDF8" : "#8CC2F8"}
              strokeWidth="1.75"
            />

            {/* 2. Task -> Client Notes horizontal connector */}
            <path
              d="M 484 166 L 516 166"
              stroke={isPathActive(["notes", "task"]) ? "#38BDF8" : "#8CC2F8"}
              strokeWidth={isPathActive(["notes", "task"]) ? "2" : "1.6"}
              strokeLinecap="round"
            />
            <circle
              cx="484"
              cy="166"
              r="3.8"
              className={portFillClass}
              stroke={isPathActive(["notes", "task"]) ? "#38BDF8" : "#8CC2F8"}
              strokeWidth="1.75"
            />

            {/* 3. Task -> Subtasks dashed curved S-arrow */}
            <motion.path
              d="M 360 227 C 358 260, 326 278, 294 268 C 254 256, 198 242, 188 296"
              stroke={isPathActive(["subtasks", "subtask-1"]) ? "#38BDF8" : "#8CC2F8"}
              strokeWidth={isPathActive(["subtasks", "subtask-1"]) ? "2" : "1.6"}
              strokeDasharray="4.5 4.5"
              strokeLinecap="round"
              animate={motionEnabled ? { strokeDashoffset: [0, -18] } : undefined}
              transition={
                motionEnabled
                  ? { duration: 1.8, repeat: Infinity, ease: "linear" }
                  : undefined
              }
            />
            <path
              d="M 183.5 290.5 L 188 297.5 L 193.5 291.5"
              stroke={isPathActive(["subtasks", "subtask-1"]) ? "#38BDF8" : "#8CC2F8"}
              strokeWidth={isPathActive(["subtasks", "subtask-1"]) ? "2" : "1.6"}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* 4. Task -> Assigned Roles orthogonal rounded branch */}
            <path
              d="M 360 227 L 360 248 Q 360 262 374 262 L 552 262 Q 566 262 566 276 L 566 290"
              stroke={isPathActive(["pm", "ux"]) ? "#38BDF8" : "#8CC2F8"}
              strokeWidth={isPathActive(["pm", "ux"]) ? "2" : "1.6"}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {motionEnabled && (
              <motion.path
                d="M 360 227 L 360 248 Q 360 262 374 262 L 552 262 Q 566 262 566 276 L 566 290"
                stroke="#38BDF8"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeDasharray="24 260"
                animate={{ strokeDashoffset: [284, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                opacity={0.7}
              />
            )}

            {/* Shared bottom port circle on Task Card */}
            <circle
              cx="360"
              cy="227"
              r="3.8"
              className={portFillClass}
              stroke={
                isPathActive(["subtasks", "subtask-1", "pm", "ux"])
                  ? "#38BDF8"
                  : "#8CC2F8"
              }
              strokeWidth="1.75"
            />

            {/* 5. Assigned Roles pill -> Project Manager */}
            <path
              d="M 566 322 L 566 340"
              stroke={isPathActive(["pm", "ux"]) ? "#38BDF8" : "#8CC2F8"}
              strokeWidth={isPathActive(["pm", "ux"]) ? "2" : "1.6"}
              strokeLinecap="round"
            />

            {/* 6. Project Manager -> UX Designer */}
            <path
              d="M 566 450 L 566 472"
              stroke={isPathActive(["ux"]) ? "#38BDF8" : "#8CC2F8"}
              strokeWidth={isPathActive(["ux"]) ? "2" : "1.6"}
              strokeLinecap="round"
            />
            <circle
              cx="566"
              cy="450"
              r="3.8"
              className={portFillClass}
              stroke={isPathActive(["ux"]) ? "#38BDF8" : "#8CC2F8"}
              strokeWidth="1.75"
            />
          </svg>

          {/* NODE 1: CLIENT PILL */}
          <div className="absolute left-[216px] top-[16px] w-[288px]">
            <motion.button
              type="button"
              onClick={() => handleSelect("client")}
              whileHover={interactive && !shouldReduceMotion ? { y: -2 } : undefined}
              transition={springTransition}
              aria-pressed={activeNode === "client"}
              className={cn(
                "flex h-[56px] w-full items-center justify-between rounded-[16px] border px-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                surfaceClass,
                activeNode === "client" && activeRingClass,
                interactive ? "cursor-pointer" : "cursor-default"
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn("text-[13px] font-medium", mutedClass)}>
                  Client:
                </span>
                <span
                  className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[7px] bg-gradient-to-br from-[#6D73F5] to-[#4F46E5] shadow-[0_2px_8px_rgba(79,70,229,0.35)]"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24" className="h-[13px] w-[13px]" fill="none">
                    <path
                      d="M13.2 3.5 6.8 13h4.5l-.6 7.5 6.5-9.5h-4.5l.5-7.5Z"
                      fill="#FFFFFF"
                    />
                  </svg>
                </span>
                <span className={cn("text-[14.5px] font-semibold tracking-[-0.015em]", titleClass)}>
                  {clientName}
                </span>
              </div>
              <span className={cn("tabular-nums text-[11px] font-normal opacity-80", mutedClass)}>
                Onboarded: {onboardedDate}
              </span>
            </motion.button>
          </div>

          {/* NODE 2: MAIN TASK CARD */}
          <div className="absolute left-[236px] top-[106px] w-[248px]">
            <motion.div
              role={interactive ? "button" : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-pressed={interactive ? activeNode === "task" : undefined}
              onClick={() => handleSelect("task")}
              onKeyDown={(e) => {
                if (interactive && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  handleSelect("task");
                }
              }}
              whileHover={interactive && !shouldReduceMotion ? { y: -2 } : undefined}
              transition={springTransition}
              className={cn(
                "flex h-[121px] w-full flex-col justify-between rounded-[18px] border px-[18px] py-[15px] text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                surfaceClass,
                activeNode === "task" && activeRingClass,
                interactive ? "cursor-pointer" : "cursor-default"
              )}
            >
              <div>
                <h3 className={cn("text-[15px] font-semibold leading-snug tracking-[-0.015em]", titleClass)}>
                  Task: {taskTitle}
                </h3>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={cn("text-[11.5px] font-normal", mutedClass)}>
                    Assigned to
                  </span>
                  <div className="flex items-center gap-1">
                    <IllustratedAvatar variant="pm" size="sm" />
                    <IllustratedAvatar variant="ux" size="sm" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <TechStackBadge isDark={isDark} isLight={isLight} />
                <div className="flex items-center gap-1">
                  <TechIcon tool="pulse-chat" interactive={interactive} isDark={isDark} isLight={isLight} />
                  <TechIcon tool="relay-mail" interactive={interactive} isDark={isDark} isLight={isLight} />
                  <TechIcon tool="vector-studio" interactive={interactive} isDark={isDark} isLight={isLight} />
                  <TechIcon tool="motion-canvas" interactive={interactive} isDark={isDark} isLight={isLight} />
                  <TechIcon tool="sprint-up" interactive={interactive} isDark={isDark} isLight={isLight} />
                </div>
              </div>
            </motion.div>
          </div>

          {/* NODE 3: CLIENT NOTES PILL */}
          <div className="absolute left-[516px] top-[138px] w-[228px]">
            <motion.button
              type="button"
              onClick={() => handleSelect("notes")}
              whileHover={interactive && !shouldReduceMotion ? { x: 2 } : undefined}
              transition={springTransition}
              aria-pressed={activeNode === "notes"}
              className={cn(
                "flex h-[56px] w-full items-center gap-2.5 rounded-[16px] border px-3.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                surfaceClass,
                activeNode === "notes" && activeRingClass,
                interactive ? "cursor-pointer" : "cursor-default"
              )}
            >
              <span
                className={cn(
                  "flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[6.5px]",
                  isDark
                    ? "bg-zinc-700"
                    : isLight
                      ? "bg-[#C7CCD6]"
                      : "bg-[#C7CCD6] dark:bg-zinc-700"
                )}
                aria-hidden="true"
              >
                <span className="h-[10px] w-[10px] rounded-full border-[2px] border-white" />
              </span>
              <span className={cn("whitespace-nowrap text-[13.5px] font-medium tracking-[-0.01em]", titleClass)}>
                Client Notes
              </span>
              <span
                className={cn(
                  "h-4 w-px shrink-0",
                  isDark ? "bg-zinc-800" : isLight ? "bg-slate-200/80" : "bg-slate-200/80 dark:bg-zinc-800"
                )}
                aria-hidden="true"
              />
              <span className={cn("truncate text-[11px] opacity-75", mutedClass)}>
                Updated: {notesUpdated}
              </span>
            </motion.button>

            <AnimatePresence>
              {activeNode === "notes" && interactive && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={springTransition}
                  className={cn(
                    "mt-2 rounded-xl border p-3 text-[11.5px] leading-relaxed",
                    surfaceClass,
                    mutedClass
                  )}
                >
                  <div className={cn("mb-1 flex items-center gap-1.5 text-[11px] font-semibold", titleClass)}>
                    <Sparkles className="h-3 w-3 text-sky-500" />
                    Latest Brief Note
                  </div>
                  {notesPreview}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* NODE 4: LEFT BRANCH — TILTED INTERACTIVE SUBTASK STACK */}
          <div className="absolute left-[38px] top-[304px] h-[220px] w-[285px]">
            <motion.div
              role={interactive ? "button" : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label="Subtasks list card"
              onClick={() => {
                if (!interactive) return;
                setFrontSubtask("list");
                handleSelect("subtasks");
              }}
              onKeyDown={(e) => {
                if (interactive && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  setFrontSubtask("list");
                  handleSelect("subtasks");
                }
              }}
              drag={interactive && !shouldReduceMotion}
              dragSnapToOrigin
              dragElastic={0.16}
              animate={{
                rotate: frontSubtask === "list" ? 3.2 : 6.2,
                y: frontSubtask === "list" ? -6 : 0,
                scale: frontSubtask === "list" ? 1.02 : 0.99,
                zIndex: frontSubtask === "list" ? 30 : 10,
              }}
              whileHover={
                interactive && !shouldReduceMotion
                  ? { y: frontSubtask === "list" ? -8 : -4 }
                  : undefined
              }
              transition={springTransition}
              className={cn(
                "absolute left-0 top-0 w-[262px] rounded-[18px] border px-[18px] py-[15px] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                surfaceClass,
                activeNode === "subtasks" && activeRingClass,
                interactive ? "cursor-grab active:cursor-grabbing" : "cursor-default"
              )}
            >
              {interactive && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-3.5 right-6 flex h-7 w-7 items-center justify-center drop-shadow-sm"
                >
                  <svg viewBox="0 0 28 28" className="h-[24px] w-[24px]" fill="none">
                    <path
                      d="M9.5 14.5v-5a1.6 1.6 0 0 1 3.2 0v3.2m0-4.4a1.6 1.6 0 0 1 3.2 0v4.4m0-3.5a1.6 1.6 0 0 1 3.2 0v4.2m0-2.4a1.6 1.6 0 0 1 3.1.5v4.3c0 4-2.8 6.8-6.8 6.8h-1.6c-2.8 0-4.6-1.4-6-3.7l-1.9-3.1a1.5 1.5 0 0 1 2.4-1.8l1.2 1.3v-3.2Z"
                      fill="#FFFFFF"
                      stroke="#111827"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              )}

              <h4 className={cn("text-[14.5px] font-semibold tracking-[-0.015em]", titleClass)}>
                Subtasks: List Below
              </h4>
              <div className="mt-1.5 flex items-center gap-2">
                <span className={cn("text-[11.5px]", mutedClass)}>Assigned to</span>
                <div className="flex items-center gap-1">
                  <IllustratedAvatar variant="pm" size="sm" />
                  <IllustratedAvatar variant="ux" size="sm" />
                  <IllustratedAvatar variant="dev" size="sm" />
                </div>
              </div>
              <div className="mt-4 h-7" aria-hidden="true" />
            </motion.div>

            <motion.div
              role={interactive ? "button" : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={`Subtask 1: ${subtaskTitle}`}
              onClick={() => {
                if (!interactive) return;
                setFrontSubtask("wireframe");
                handleSelect("subtask-1");
              }}
              onKeyDown={(e) => {
                if (interactive && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  setFrontSubtask("wireframe");
                  handleSelect("subtask-1");
                }
              }}
              drag={interactive && !shouldReduceMotion}
              dragSnapToOrigin
              dragElastic={0.18}
              animate={{
                rotate: frontSubtask === "wireframe" ? 6.4 : 4.2,
                y: frontSubtask === "wireframe" ? 0 : 12,
                scale: frontSubtask === "wireframe" ? 1 : 0.97,
                zIndex: frontSubtask === "wireframe" ? 25 : 15,
              }}
              whileHover={
                interactive && !shouldReduceMotion
                  ? { y: frontSubtask === "wireframe" ? -3 : 8 }
                  : undefined
              }
              transition={springTransition}
              className={cn(
                "absolute left-[10px] top-[68px] w-[244px] rounded-[18px] border px-[17px] py-[14px] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                surfaceClass,
                activeNode === "subtask-1" && activeRingClass,
                interactive ? "cursor-grab active:cursor-grabbing" : "cursor-default"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <h4
                  className={cn(
                    "tabular-nums text-[14px] font-semibold leading-snug tracking-[-0.015em]",
                    titleClass,
                    wireframeDone && "line-through opacity-60"
                  )}
                >
                  Subtask 1: {subtaskTitle}
                </h4>
                {interactive && (
                  <button
                    type="button"
                    aria-label={wireframeDone ? "Mark subtask incomplete" : "Mark subtask complete"}
                    onClick={(e) => {
                      e.stopPropagation();
                      setWireframeDone((prev) => !prev);
                    }}
                    className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                      wireframeDone
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : isDark
                          ? "border-zinc-700 hover:border-sky-400"
                          : isLight
                            ? "border-slate-300 hover:border-sky-400"
                            : "border-slate-300 dark:border-zinc-700 hover:border-sky-400"
                    )}
                  >
                    {wireframeDone && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                  </button>
                )}
              </div>

              <div className="mt-1.5 flex items-center gap-2">
                <span className={cn("text-[11px]", mutedClass)}>Assigned to</span>
                <IllustratedAvatar variant="ux" size="sm" />
              </div>

              <div className="mt-3.5 flex items-center gap-1.5">
                <TechStackBadge isDark={isDark} isLight={isLight} />
                <div className="flex items-center gap-1">
                  <TechIcon tool="pulse-chat" interactive={interactive} isDark={isDark} isLight={isLight} />
                  <TechIcon tool="relay-mail" interactive={interactive} isDark={isDark} isLight={isLight} />
                  <TechIcon tool="vector-studio" interactive={interactive} isDark={isDark} isLight={isLight} />
                  <TechIcon tool="motion-canvas" interactive={interactive} isDark={isDark} isLight={isLight} />
                </div>
              </div>
            </motion.div>
          </div>

          {/* NODE 5: ASSIGNED ROLES PILL */}
          <div className="absolute left-[506px] top-[290px] w-[120px] text-center">
            <div
              className={cn(
                "inline-flex h-[32px] items-center justify-center rounded-[10px] border px-3.5 text-[11px] font-medium tracking-[-0.01em]",
                surfaceClass,
                mutedClass
              )}
            >
              Assigned Roles
            </div>
          </div>

          {/* NODE 6: PROJECT MANAGER ROLE CARD */}
          <div className="absolute left-[442px] top-[340px] w-[248px]">
            <motion.div
              role={interactive ? "button" : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-pressed={interactive ? activeNode === "pm" : undefined}
              onClick={() => handleSelect("pm")}
              onKeyDown={(e) => {
                if (interactive && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  handleSelect("pm");
                }
              }}
              whileHover={interactive && !shouldReduceMotion ? { y: -2 } : undefined}
              transition={springTransition}
              className={cn(
                "flex h-[110px] w-full flex-col justify-between rounded-[18px] border px-[17px] py-[14px] text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                surfaceClass,
                activeNode === "pm" && activeRingClass,
                interactive ? "cursor-pointer" : "cursor-default"
              )}
            >
              <div className="flex items-center gap-3">
                <IllustratedAvatar variant="pm" size="lg" />
                <div className="min-w-0">
                  <h4 className={cn("truncate text-[14.5px] font-semibold leading-tight tracking-[-0.015em]", titleClass)}>
                    Project Manager
                  </h4>
                  <p className={cn("mt-0.5 truncate text-[11.5px]", mutedClass)}>
                    Managing Project Progress
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <TechStackBadge isDark={isDark} isLight={isLight} />
                <div className="flex items-center gap-1">
                  <TechIcon tool="pulse-chat" interactive={interactive} isDark={isDark} isLight={isLight} />
                  <TechIcon tool="relay-mail" interactive={interactive} isDark={isDark} isLight={isLight} />
                  <TechIcon tool="orbit-tasks" interactive={interactive} isDark={isDark} isLight={isLight} />
                </div>
              </div>
            </motion.div>
          </div>

          {/* NODE 7: UX DESIGNER ROLE CARD */}
          <div className="absolute left-[442px] top-[472px] w-[248px]">
            <motion.div
              role={interactive ? "button" : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-pressed={interactive ? activeNode === "ux" : undefined}
              onClick={() => handleSelect("ux")}
              onKeyDown={(e) => {
                if (interactive && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  handleSelect("ux");
                }
              }}
              whileHover={interactive && !shouldReduceMotion ? { y: -2 } : undefined}
              transition={springTransition}
              className={cn(
                "flex h-[110px] w-full flex-col justify-between rounded-[18px] border px-[17px] py-[14px] text-left transition-opacity duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                surfaceClass,
                activeNode === "ux" ? activeRingClass : "opacity-90 hover:opacity-100",
                interactive ? "cursor-pointer" : "cursor-default"
              )}
            >
              <div className="flex items-center gap-3">
                <IllustratedAvatar variant="ux" size="lg" />
                <div className="min-w-0">
                  <h4 className={cn("truncate text-[14.5px] font-semibold leading-tight tracking-[-0.015em]", titleClass)}>
                    UX Designer
                  </h4>
                  <p className={cn("mt-0.5 truncate text-[11.5px]", mutedClass)}>
                    Designing UX Elements
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <TechStackBadge isDark={isDark} isLight={isLight} />
                <div className="flex items-center gap-1">
                  <TechIcon tool="pulse-chat" interactive={interactive} isDark={isDark} isLight={isLight} />
                  <TechIcon tool="vector-studio" interactive={interactive} isDark={isDark} isLight={isLight} />
                  <TechIcon tool="motion-canvas" interactive={interactive} isDark={isDark} isLight={isLight} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* MOBILE / COMPACT STACKED TREE (< 768px) */}
        <div className="relative flex flex-col items-center gap-3 px-2 py-4 md:hidden">
          <div className={cn("flex w-full max-w-[320px] items-center justify-between rounded-2xl border px-4 py-3", surfaceClass)}>
            <div className="flex items-center gap-2">
              <span className={cn("text-xs font-medium", mutedClass)}>Client:</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-[#6D73F5] to-[#4F46E5]">
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
                  <path d="M13.2 3.5 6.8 13h4.5l-.6 7.5 6.5-9.5h-4.5l.5-7.5Z" fill="#FFFFFF" />
                </svg>
              </span>
              <span className={cn("text-sm font-semibold", titleClass)}>{clientName}</span>
            </div>
            <span className={cn("tabular-nums text-[11px]", mutedClass)}>
              Onboarded: {onboardedDate}
            </span>
          </div>

          <div className="h-5 w-0.5 bg-sky-300/80" aria-hidden="true" />

          <div className={cn("w-full max-w-[320px] rounded-2xl border p-4", surfaceClass)}>
            <h3 className={cn("text-[15px] font-semibold", titleClass)}>Task: {taskTitle}</h3>
            <div className="mt-1.5 flex items-center gap-2">
              <span className={cn("text-xs", mutedClass)}>Assigned to</span>
              <IllustratedAvatar variant="pm" size="sm" />
              <IllustratedAvatar variant="ux" size="sm" />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <TechStackBadge isDark={isDark} isLight={isLight} />
              <TechIcon tool="pulse-chat" interactive={interactive} isDark={isDark} isLight={isLight} />
              <TechIcon tool="relay-mail" interactive={interactive} isDark={isDark} isLight={isLight} />
              <TechIcon tool="vector-studio" interactive={interactive} isDark={isDark} isLight={isLight} />
              <TechIcon tool="motion-canvas" interactive={interactive} isDark={isDark} isLight={isLight} />
              <TechIcon tool="sprint-up" interactive={interactive} isDark={isDark} isLight={isLight} />
            </div>
          </div>

          <div className={cn("flex w-full max-w-[320px] items-center justify-between rounded-2xl border px-4 py-3", surfaceClass)}>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-300 dark:bg-zinc-700">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-white" />
              </span>
              <span className={cn("text-sm font-medium", titleClass)}>Client Notes</span>
            </div>
            <span className={cn("text-[11px]", mutedClass)}>Updated: {notesUpdated}</span>
          </div>

          <div className="h-5 w-0.5 border-l-2 border-dashed border-sky-300/80" aria-hidden="true" />

          <div className={cn("w-full max-w-[320px] rounded-2xl border p-4", surfaceClass)}>
            <h4 className={cn("tabular-nums text-sm font-semibold", titleClass)}>
              Subtask 1: {subtaskTitle}
            </h4>
            <div className="mt-1.5 flex items-center gap-2">
              <span className={cn("text-xs", mutedClass)}>Assigned to</span>
              <IllustratedAvatar variant="ux" size="sm" />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <TechStackBadge isDark={isDark} isLight={isLight} />
              <TechIcon tool="pulse-chat" interactive={interactive} isDark={isDark} isLight={isLight} />
              <TechIcon tool="relay-mail" interactive={interactive} isDark={isDark} isLight={isLight} />
              <TechIcon tool="vector-studio" interactive={interactive} isDark={isDark} isLight={isLight} />
              <TechIcon tool="motion-canvas" interactive={interactive} isDark={isDark} isLight={isLight} />
            </div>
          </div>

          <div className={cn("rounded-lg border px-3 py-1 text-[11px] font-medium", surfaceClass, mutedClass)}>
            Assigned Roles
          </div>

          <div className="grid w-full max-w-[320px] grid-cols-1 gap-3">
            <div className={cn("rounded-2xl border p-4", surfaceClass)}>
              <div className="flex items-center gap-3">
                <IllustratedAvatar variant="pm" size="lg" />
                <div>
                  <h4 className={cn("text-sm font-semibold", titleClass)}>Project Manager</h4>
                  <p className={cn("text-xs", mutedClass)}>Managing Project Progress</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <TechStackBadge isDark={isDark} isLight={isLight} />
                <TechIcon tool="pulse-chat" interactive={interactive} isDark={isDark} isLight={isLight} />
                <TechIcon tool="relay-mail" interactive={interactive} isDark={isDark} isLight={isLight} />
                <TechIcon tool="orbit-tasks" interactive={interactive} isDark={isDark} isLight={isLight} />
              </div>
            </div>

            <div className={cn("rounded-2xl border p-4", surfaceClass)}>
              <div className="flex items-center gap-3">
                <IllustratedAvatar variant="ux" size="lg" />
                <div>
                  <h4 className={cn("text-sm font-semibold", titleClass)}>UX Designer</h4>
                  <p className={cn("text-xs", mutedClass)}>Designing UX Elements</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <TechStackBadge isDark={isDark} isLight={isLight} />
                <TechIcon tool="pulse-chat" interactive={interactive} isDark={isDark} isLight={isLight} />
                <TechIcon tool="vector-studio" interactive={interactive} isDark={isDark} isLight={isLight} />
                <TechIcon tool="motion-canvas" interactive={interactive} isDark={isDark} isLight={isLight} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ProjectWorkflowTree.displayName = "ProjectWorkflowTree";

export {
  ProjectWorkflowTree,
  ProjectWorkflowTree as component,
  ProjectWorkflowTree as Component,
};
export default ProjectWorkflowTree;