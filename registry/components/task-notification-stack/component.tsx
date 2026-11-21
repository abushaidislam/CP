"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell, Check, Clock, MoreHorizontal, RotateCcw, Trash2, X } from "lucide-react";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export interface TaskNotificationItem {
  id: string;
  title: string;
  subtitle: string;
  primaryLabel?: string;
  secondaryLabel?: string;
}

export interface TaskNotificationStackProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Controlled or initial list of stacked task notifications */
  tasks?: TaskNotificationItem[];
  /** Override the front card's title (useful for single-card or live preview binding) */
  title?: string;
  /** Override the front card's metadata subtitle */
  subtitle?: string;
  /** Default primary CTA button label */
  primaryLabel?: string;
  /** Default secondary snooze button label */
  secondaryLabel?: string;
  /** Maximum number of visible stacked cards (1 to 4) */
  stackDepth?: number;
  /** Visual theme mode: "auto" follows Tailwind dark: class */
  theme?: "auto" | "light" | "dark";
  /** Fired when a task is marked as done */
  onCompleteTask?: (task: TaskNotificationItem) => void;
  /** Fired when a task is snoozed via Remind Me Later or menu */
  onSnoozeTask?: (task: TaskNotificationItem, durationLabel?: string) => void;
  /** Fired when a task is dismissed via the close button */
  onDismissTask?: (task: TaskNotificationItem) => void;
  /** Fired when all tasks are cleared */
  onDismissAll?: () => void;
}

const DEFAULT_TASKS: TaskNotificationItem[] = [
  {
    id: "task-1",
    title: "Send notes to Johnny",
    subtitle: "New Task • Assigned to You 3m ago",
  },
  {
    id: "task-2",
    title: "Review Q3 design specs",
    subtitle: "New Task • Assigned by Maya 14m ago",
  },
  {
    id: "task-3",
    title: "Approve API schema PR",
    subtitle: "New Task • Assigned by Devon 28m ago",
  },
  {
    id: "task-4",
    title: "Finalize release changelog",
    subtitle: "New Task • Assigned to You 1h ago",
  },
];

function TaskReceiptIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M8.5 5.5C8.5 4.39543 9.39543 3.5 10.5 3.5H25.5C26.6046 3.5 27.5 4.39543 27.5 5.5V22.2"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 5.5V34.2C8.5 35.02 9.44 35.48 10.08 34.97L12.35 33.15C12.73 32.85 13.27 32.85 13.65 33.15L15.85 34.92C16.23 35.22 16.77 35.22 17.15 34.92L19.35 33.15C19.73 32.85 20.27 32.85 20.65 33.15L21.9 34.15"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="14" cy="11.5" r="1.5" fill="currentColor" />
      <path
        d="M18 11.5H22.5"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="14" cy="18" r="1.5" fill="currentColor" />
      <path
        d="M18 18H22.5"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="14" cy="24.5" r="1.5" fill="currentColor" />
      <path
        d="M18 24.5H20.5"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="29.5" cy="31" r="7.5" fill="currentColor" />
      <path
        d="M29.5 27.7V34.3M26.2 31H32.8"
        stroke="var(--task-icon-cutout, #f4f4f4)"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ScallopedCheckBadge({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M12 2.25C13.15 2.25 14.12 3.01 14.48 4.06C15.56 3.74 16.75 4.06 17.52 4.88C18.29 5.7 18.55 6.91 18.17 7.97C19.2 8.39 19.9 9.4 19.9 10.55C19.9 11.7 19.2 12.71 18.17 13.13C18.55 14.19 18.29 15.4 17.52 16.22C16.75 17.04 15.56 17.36 14.48 17.04C14.12 18.09 13.15 18.85 12 18.85C10.85 18.85 9.88 18.09 9.52 17.04C8.44 17.36 7.25 17.04 6.48 16.22C5.71 15.4 5.45 14.19 5.83 13.13C4.8 12.71 4.1 11.7 4.1 10.55C4.1 9.4 4.8 8.39 5.83 7.97C5.45 6.91 5.71 5.7 6.48 4.88C7.25 4.06 8.44 3.74 9.52 4.06C9.88 3.01 10.85 2.25 12 2.25Z"
        transform="translate(0 1.45)"
        fill="currentColor"
      />
      <path
        d="M9.15 12.1L11.05 14L14.95 10.1"
        stroke="#48c75b"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type ExitIntent = "complete" | "dismiss" | "snooze";

export const TaskNotificationStack = React.forwardRef<
  HTMLDivElement,
  TaskNotificationStackProps
>(function TaskNotificationStack(
  {
    tasks,
    title,
    subtitle,
    primaryLabel = "Mark as Done",
    secondaryLabel = "Remind Me Later",
    stackDepth = 3,
    theme = "auto",
    onCompleteTask,
    onSnoozeTask,
    onDismissTask,
    onDismissAll,
    className,
    ...rest
  },
  ref
) {
  const prefersReducedMotion = useReducedMotion();
  const rawId = useId();
  const uid = rawId.replace(/:/g, "");

  const buildInitialTasks = useCallback((): TaskNotificationItem[] => {
    const source = tasks && tasks.length > 0 ? tasks : DEFAULT_TASKS;
    return source.map((item, idx) =>
      idx === 0
        ? {
            ...item,
            title: title ?? item.title,
            subtitle: subtitle ?? item.subtitle,
          }
        : item
    );
  }, [tasks, title, subtitle]);

  const [queue, setQueue] = useState<TaskNotificationItem[]>(buildInitialTasks);
  const [exitIntent, setExitIntent] = useState<ExitIntent>("complete");
  const [completedCount, setCompletedCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQueue((prev) => {
      if (prev.length === 0) return prev;
      const first = prev[0];
      const nextTitle = title ?? first.title;
      const nextSubtitle = subtitle ?? first.subtitle;
      if (first.title === nextTitle && first.subtitle === nextSubtitle) {
        return prev;
      }
      return [{ ...first, title: nextTitle, subtitle: nextSubtitle }, ...prev.slice(1)];
    });
  }, [title, subtitle]);

  useEffect(() => {
    if (tasks && tasks.length > 0) {
      setQueue(
        tasks.map((item, idx) =>
          idx === 0
            ? {
                ...item,
                title: title ?? item.title,
                subtitle: subtitle ?? item.subtitle,
              }
            : item
        )
      );
    }
  }, [tasks, title, subtitle]);

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, []);

  const flashStatus = useCallback((msg: string) => {
    setStatusMessage(msg);
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => {
      setStatusMessage(null);
    }, 2200);
  }, []);

  const clampedDepth = Math.max(1, Math.min(4, Math.round(stackDepth)));
  const visibleCards = queue.slice(0, clampedDepth);
  const frontTask = visibleCards[0];

  const handleComplete = useCallback(() => {
    if (!frontTask) return;
    setMenuOpen(false);
    setExitIntent("complete");
    setCompletedCount((c) => c + 1);
    setQueue((prev) => prev.slice(1));
    onCompleteTask?.(frontTask);
    flashStatus(`Completed "${frontTask.title}"`);
  }, [frontTask, onCompleteTask, flashStatus]);

  const handleDismiss = useCallback(() => {
    if (!frontTask) return;
    setMenuOpen(false);
    setExitIntent("dismiss");
    setQueue((prev) => prev.slice(1));
    onDismissTask?.(frontTask);
    flashStatus(`Dismissed "${frontTask.title}"`);
  }, [frontTask, onDismissTask, flashStatus]);

  const handleSnooze = useCallback(
    (durationLabel = "30m") => {
      if (!frontTask) return;
      setMenuOpen(false);
      setExitIntent("snooze");
      const snoozedItem: TaskNotificationItem = {
        ...frontTask,
        subtitle: `Snoozed • Reminding in ${durationLabel}`,
      };
      setQueue((prev) => {
        if (prev.length <= 1) return [snoozedItem];
        return [...prev.slice(1), snoozedItem];
      });
      onSnoozeTask?.(frontTask, durationLabel);
      flashStatus(`Snoozed for ${durationLabel}`);
    },
    [frontTask, onSnoozeTask, flashStatus]
  );

  const handleDismissAll = useCallback(() => {
    setMenuOpen(false);
    setExitIntent("dismiss");
    setQueue([]);
    onDismissAll?.();
    flashStatus("Cleared all notifications");
  }, [onDismissAll, flashStatus]);

  const handleReset = useCallback(() => {
    setCompletedCount(0);
    setQueue(buildInitialTasks());
    setStatusMessage(null);
  }, [buildInitialTasks]);

  const isDark = theme === "dark";
  const isLight = theme === "light";

  const outerShellClass = cn(
    "rounded-[34px] p-[10px] transition-colors",
    isLight &&
      "bg-[#fefefe] shadow-[0_14px_34px_-10px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]",
    isDark &&
      "bg-[#26262a] shadow-[0_18px_40px_-10px_rgba(0,0,0,0.65),0_2px_6px_rgba(0,0,0,0.4)] ring-1 ring-white/[0.08]",
    !isLight &&
      !isDark &&
      "bg-[#fefefe] dark:bg-[#26262a] shadow-[0_14px_34px_-10px_rgba(0,0,0,0.12),0_2px_6px_rgba(0,0,0,0.04)] dark:shadow-[0_18px_40px_-10px_rgba(0,0,0,0.65),0_2px_6px_rgba(0,0,0,0.4)] ring-1 ring-black/[0.04] dark:ring-white/[0.08]"
  );

  const innerShellClass = cn(
    "rounded-[24px] transition-colors",
    isLight && "bg-[#f4f4f4] [--task-icon-cutout:#f4f4f4]",
    isDark && "bg-[#18181b] [--task-icon-cutout:#18181b]",
    !isLight &&
      !isDark &&
      "bg-[#f4f4f4] dark:bg-[#18181b] [--task-icon-cutout:#f4f4f4] dark:[--task-icon-cutout:#18181b]"
  );

  const titleClass = cn(
    "text-[23px] sm:text-[26px] font-semibold leading-[1.16] tracking-[-0.028em] truncate",
    isLight && "text-[#1d1d1f]",
    isDark && "text-[#f4f4f5]",
    !isLight && !isDark && "text-[#1d1d1f] dark:text-[#f4f4f5]"
  );

  const subtitleClass = cn(
    "text-[13px] sm:text-[14px] font-medium leading-[1.3] tracking-[-0.01em] tabular-nums truncate",
    isLight && "text-[#8e8e93]",
    isDark && "text-[#a1a1aa]",
    !isLight && !isDark && "text-[#8e8e93] dark:text-[#a1a1aa]"
  );

  const iconColorClass = cn(
    isLight && "text-[#8e8e93]",
    isDark && "text-[#a1a1aa]",
    !isLight && !isDark && "text-[#8e8e93] dark:text-[#a1a1aa]"
  );

  const floatingRingClass = cn(
    "flex h-[34px] w-[34px] items-center justify-center rounded-full p-[3.5px] transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#45c458] focus-visible:ring-offset-2",
    isLight && "bg-[#fefefe] shadow-[0_4px_12px_rgba(0,0,0,0.12)]",
    isDark && "bg-[#26262a] shadow-[0_4px_12px_rgba(0,0,0,0.5)]",
    !isLight &&
      !isDark &&
      "bg-[#fefefe] dark:bg-[#26262a] shadow-[0_4px_12px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
  );

  const floatingInnerClass = cn(
    "flex h-full w-full items-center justify-center rounded-full text-white transition-colors duration-150",
    isLight && "bg-[#97979b] hover:bg-[#7d7d82] active:bg-[#6c6c70]",
    isDark && "bg-[#52525b] hover:bg-[#71717a] active:bg-[#3f3f46]",
    !isLight &&
      !isDark &&
      "bg-[#97979b] hover:bg-[#7d7d82] active:bg-[#6c6c70] dark:bg-[#52525b] dark:hover:bg-[#71717a]"
  );

  const secondaryBtnClass = cn(
    "inline-flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[14.5px] font-medium tracking-[-0.01em] transition-[transform,color,background-color] duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#45c458] focus-visible:ring-offset-2",
    isLight &&
      "bg-gradient-to-b from-[#ffffff] to-[#f1f1f2] text-[#8a8a8e] border border-black/[0.05] shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] hover:from-[#ffffff] hover:to-[#e9e9eb] hover:text-[#636366] active:scale-[0.98]",
    isDark &&
      "bg-gradient-to-b from-[#2e2e33] to-[#232327] text-[#d4d4d8] border border-white/[0.08] shadow-[0_4px_12px_-2px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] hover:from-[#36363c] hover:to-[#29292e] hover:text-white active:scale-[0.98]",
    !isLight &&
      !isDark &&
      "bg-gradient-to-b from-[#ffffff] to-[#f1f1f2] dark:from-[#2e2e33] dark:to-[#232327] text-[#8a8a8e] dark:text-[#d4d4d8] border border-black/[0.05] dark:border-white/[0.08] shadow-[0_4px_12px_-2px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] dark:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] hover:to-[#e9e9eb] dark:hover:to-[#29292e] hover:text-[#636366] dark:hover:text-white active:scale-[0.98]"
  );

  const menuSurfaceClass = cn(
    "absolute right-0 top-[42px] z-50 w-44 rounded-2xl p-1.5 backdrop-blur-md",
    isLight &&
      "bg-white/95 text-[#1d1d1f] border border-black/[0.07] shadow-[0_14px_30px_-6px_rgba(0,0,0,0.16)]",
    isDark &&
      "bg-[#222226]/95 text-[#f4f4f5] border border-white/[0.1] shadow-[0_14px_30px_-6px_rgba(0,0,0,0.65)]",
    !isLight &&
      !isDark &&
      "bg-white/95 dark:bg-[#222226]/95 text-[#1d1d1f] dark:text-[#f4f4f5] border border-black/[0.07] dark:border-white/[0.1] shadow-[0_14px_30px_-6px_rgba(0,0,0,0.16)] dark:shadow-[0_14px_30px_-6px_rgba(0,0,0,0.65)]"
  );

  const menuItemClass = cn(
    "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-medium transition-colors duration-150",
    isLight && "hover:bg-black/[0.05] text-[#3a3a3c]",
    isDark && "hover:bg-white/[0.08] text-[#e4e4e7]",
    !isLight &&
      !isDark &&
      "hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-[#3a3a3c] dark:text-[#e4e4e7]"
  );

  const springTransition = prefersReducedMotion
    ? { duration: 0.12 }
    : { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.85 };

  const stackExtraHeight = Math.max(0, visibleCards.length - 1) * 18;

  return (
    <div
      ref={ref}
      role="region"
      aria-label="Task notifications"
      className={cn(
        "relative w-full max-w-[468px] mx-auto pt-4 select-none",
        className
      )}
      style={{ paddingBottom: `${stackExtraHeight + 8}px` }}
      {...rest}
    >
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {statusMessage ?? ""}
      </div>

      <div className="relative w-full min-h-[188px]">
        <AnimatePresence mode="popLayout" initial={false}>
          {visibleCards.length > 0 ? (
            visibleCards.map((card, index) => {
              const isFront = index === 0;
              const yOffset = index * 18;
              const scale = 1 - index * 0.065;
              const zIndex = clampedDepth - index + 10;

              const exitAnim = prefersReducedMotion
                ? { opacity: 0 }
                : exitIntent === "complete"
                ? { opacity: 0, y: -22, scale: 0.96 }
                : exitIntent === "snooze"
                ? { opacity: 0, y: 26, scale: 0.9 }
                : { opacity: 0, x: 36, scale: 0.95 };

              return (
                <motion.article
                  key={card.id}
                  layout={!prefersReducedMotion}
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: yOffset + 16, scale: scale * 0.96 }
                  }
                  animate={{
                    opacity: 1,
                    y: yOffset,
                    scale,
                    zIndex,
                  }}
                  exit={{
                    ...exitAnim,
                    zIndex: 40,
                    pointerEvents: "none",
                    transition: {
                      duration: prefersReducedMotion ? 0.1 : 0.22,
                      ease: [0.22, 1, 0.36, 1],
                    },
                  }}
                  transition={springTransition}
                  aria-hidden={!isFront}
                  className={cn(
                    "w-full origin-bottom",
                    isFront ? "relative" : "absolute inset-0 pointer-events-none"
                  )}
                >
                  {isFront && (
                    <div
                      ref={menuRef}
                      className="absolute -top-[14px] right-[18px] z-30 flex items-center gap-[7px]"
                    >
                      <button
                        type="button"
                        aria-label="More task options"
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        aria-controls={`${uid}-menu`}
                        onClick={() => setMenuOpen((o) => !o)}
                        className={floatingRingClass}
                      >
                        <span className={floatingInnerClass}>
                          <MoreHorizontal className="h-[15px] w-[15px]" strokeWidth={2.6} />
                        </span>
                      </button>

                      <button
                        type="button"
                        aria-label={`Dismiss ${card.title}`}
                        onClick={handleDismiss}
                        className={floatingRingClass}
                      >
                        <span className={floatingInnerClass}>
                          <X className="h-[14px] w-[14px]" strokeWidth={2.8} />
                        </span>
                      </button>

                      <AnimatePresence>
                        {menuOpen && (
                          <motion.div
                            id={`${uid}-menu`}
                            role="menu"
                            initial={
                              prefersReducedMotion
                                ? { opacity: 0 }
                                : { opacity: 0, y: -6, scale: 0.96 }
                            }
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={
                              prefersReducedMotion
                                ? { opacity: 0 }
                                : { opacity: 0, y: -4, scale: 0.96 }
                            }
                            transition={{ duration: 0.14, ease: "easeOut" }}
                            className={menuSurfaceClass}
                          >
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => handleSnooze("15m")}
                              className={menuItemClass}
                            >
                              <Clock className="h-3.5 w-3.5 opacity-70" />
                              <span>Snooze 15 min</span>
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => handleSnooze("1h")}
                              className={menuItemClass}
                            >
                              <Clock className="h-3.5 w-3.5 opacity-70" />
                              <span>Snooze 1 hour</span>
                            </button>
                            <div
                              className={cn(
                                "my-1 h-px",
                                isLight && "bg-black/[0.06]",
                                isDark && "bg-white/[0.08]",
                                !isLight && !isDark && "bg-black/[0.06] dark:bg-white/[0.08]"
                              )}
                            />
                            <button
                              type="button"
                              role="menuitem"
                              onClick={handleDismissAll}
                              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13px] font-medium tabular-nums text-red-500 transition-colors duration-150 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Dismiss all ({queue.length})</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  <div className={outerShellClass}>
                    <div
                      className={cn(
                        innerShellClass,
                        "px-5 sm:px-6 pt-5 pb-5 flex flex-col gap-5"
                      )}
                    >
                      <div className="flex items-center gap-3.5 pr-6">
                        <div className={cn("shrink-0 pt-0.5", iconColorClass)}>
                          <TaskReceiptIcon className="h-[42px] w-[40px]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={subtitleClass}>{card.subtitle}</p>
                          <h3 className={titleClass}>{card.title}</h3>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <button
                          type="button"
                          tabIndex={isFront ? 0 : -1}
                          onClick={() => handleSnooze("30m")}
                          className={secondaryBtnClass}
                        >
                          <Bell
                            className="h-[15px] w-[15px] shrink-0 fill-current"
                            strokeWidth={2}
                          />
                          <span>{card.secondaryLabel ?? secondaryLabel}</span>
                        </button>

                        <button
                          type="button"
                          tabIndex={isFront ? 0 : -1}
                          onClick={handleComplete}
                          className={cn(
                            "inline-flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[14.5px] font-medium tracking-[-0.01em] text-white select-none transition-[transform,filter,box-shadow] duration-150",
                            "bg-gradient-to-b from-[#4fcf60] via-[#47c458] to-[#35b84e]",
                            "border border-[#2da343]/50",
                            "shadow-[0_6px_16px_-3px_rgba(54,185,79,0.44),inset_0_1px_1px_rgba(255,255,255,0.38)]",
                            "hover:brightness-[1.03] hover:shadow-[0_8px_18px_-3px_rgba(54,185,79,0.52),inset_0_1px_1px_rgba(255,255,255,0.45)]",
                            "active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#45c458] focus-visible:ring-offset-2"
                          )}
                        >
                          <ScallopedCheckBadge className="h-[19px] w-[19px] shrink-0 text-[#117423]" />
                          <span>{card.primaryLabel ?? primaryLabel}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })
          ) : (
            <motion.div
              key="empty-state"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={springTransition}
              className={outerShellClass}
            >
              <div
                className={cn(
                  innerShellClass,
                  "px-6 py-7 flex flex-col items-center justify-center text-center gap-3.5"
                )}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#45c458]/15 text-[#35b84e]">
                  <Check className="h-5 w-5" strokeWidth={2.8} />
                </div>
                <div className="space-y-0.5">
                  <h3
                    className={cn(
                      "text-[19px] font-semibold tracking-[-0.02em]",
                      isLight
                        ? "text-[#1d1d1f]"
                        : isDark
                        ? "text-[#f4f4f5]"
                        : "text-[#1d1d1f] dark:text-[#f4f4f5]"
                    )}
                  >
                    All caught up
                  </h3>
                  <p className={cn(subtitleClass, "tabular-nums")}>
                    {completedCount > 0
                      ? `${completedCount} ${completedCount === 1 ? "task" : "tasks"} completed`
                      : "No pending task notifications"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className={cn(secondaryBtnClass, "mt-1 px-4 py-2 text-[13.5px]")}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Restore tasks</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

TaskNotificationStack.displayName = "TaskNotificationStack";

export { TaskNotificationStack as component, TaskNotificationStack as Component };
export default TaskNotificationStack;