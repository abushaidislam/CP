"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Transition } from "framer-motion";
import { Check, ChevronsLeftRight } from "lucide-react";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type FrequencyOption = "Daily" | "Weekly" | "Monthly" | "Yearly";
export type WeekdayOption = "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
export type FrequencySelectorTheme = "auto" | "light" | "dark";

export interface FrequencySelection {
  frequency: FrequencyOption;
  dayOfWeek: WeekdayOption;
}

export interface FrequencySelectorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** Left-hand label displayed in the collapsed state. */
  label?: string;
  /** Controlled selected frequency. */
  value?: FrequencyOption;
  /** Initial frequency when uncontrolled. */
  defaultValue?: FrequencyOption;
  /** Controlled day of week used when frequency is "Weekly". */
  dayOfWeek?: WeekdayOption;
  /** Initial day of week when uncontrolled. */
  defaultDayOfWeek?: WeekdayOption;
  /** Controlled expanded/collapsed state. */
  open?: boolean;
  /** Initial expanded/collapsed state when uncontrolled. */
  defaultOpen?: boolean;
  /** Fired when the user confirms a selection. */
  onChange?: (selection: FrequencySelection) => void;
  /** Fired when the selector opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Color theme mode. Defaults to "auto" (follows Tailwind dark mode). */
  theme?: FrequencySelectorTheme;
  /** Disables interaction. */
  disabled?: boolean;
}

const FREQUENCY_OPTIONS: readonly FrequencyOption[] = [
  "Daily",
  "Weekly",
  "Monthly",
  "Yearly",
];

const WEEKDAY_OPTIONS: readonly WeekdayOption[] = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

const WEEKDAY_FULL_NAMES: Record<WeekdayOption, string> = {
  Sun: "Sunday",
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
};

const SPRING_PILL: Transition = {
  type: "spring",
  stiffness: 440,
  damping: 36,
  mass: 0.85,
};

const SPRING_LAYOUT: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 34,
  mass: 0.9,
};

const INSTANT_TRANSITION: Transition = {
  duration: 0.01,
};

const THEME_CLASSES: Record<
  FrequencySelectorTheme,
  {
    shell: string;
    label: string;
    surface: string;
    triggerHover: string;
    primaryText: string;
    mutedText: string;
    mutedHover: string;
    chevron: string;
    activePill: string;
    confirmBtn: string;
    focusRing: string;
  }
> = {
  auto: {
    shell:
      "bg-[#f2f2f2] dark:bg-neutral-900 border border-black/[0.03] dark:border-white/[0.06]",
    label: "text-[#5c5c5c] dark:text-neutral-400",
    surface:
      "bg-white dark:bg-neutral-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.28)]",
    triggerHover: "hover:bg-[#fafafa] dark:hover:bg-neutral-700/80",
    primaryText: "text-[#111111] dark:text-neutral-50",
    mutedText: "text-[#6e6e73] dark:text-neutral-400",
    mutedHover: "hover:text-[#111111] dark:hover:text-neutral-200",
    chevron: "text-[#8e8e93] dark:text-neutral-400",
    activePill: "bg-[#efefef] dark:bg-neutral-700",
    confirmBtn:
      "bg-[#0a0a0a] text-white hover:bg-[#222222] dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200",
    focusRing:
      "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-900/30 dark:focus-visible:ring-white/40",
  },
  light: {
    shell: "bg-[#f2f2f2] border border-black/[0.03]",
    label: "text-[#5c5c5c]",
    surface: "bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
    triggerHover: "hover:bg-[#fafafa]",
    primaryText: "text-[#111111]",
    mutedText: "text-[#6e6e73]",
    mutedHover: "hover:text-[#111111]",
    chevron: "text-[#8e8e93]",
    activePill: "bg-[#efefef]",
    confirmBtn: "bg-[#0a0a0a] text-white hover:bg-[#222222]",
    focusRing:
      "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-900/30",
  },
  dark: {
    shell: "bg-neutral-900 border border-white/[0.06]",
    label: "text-neutral-400",
    surface: "bg-neutral-800 shadow-[0_1px_2px_rgba(0,0,0,0.28)]",
    triggerHover: "hover:bg-neutral-700/80",
    primaryText: "text-neutral-50",
    mutedText: "text-neutral-400",
    mutedHover: "hover:text-neutral-200",
    chevron: "text-neutral-400",
    activePill: "bg-neutral-700",
    confirmBtn: "bg-white text-neutral-950 hover:bg-neutral-200",
    focusRing:
      "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/40",
  },
};

const FrequencySelector = React.forwardRef<HTMLDivElement, FrequencySelectorProps>(
  (
    {
      label = "Frequency",
      value,
      defaultValue = "Daily",
      dayOfWeek,
      defaultDayOfWeek = "Tue",
      open,
      defaultOpen = false,
      onChange,
      onOpenChange,
      theme = "auto",
      disabled = false,
      className,
      ...rest
    },
    ref
  ) => {
    const rawId = useId();
    const uid = rawId.replace(/:/g, "");
    const shouldReduceMotion = useReducedMotion();

    const isFreqControlled = value !== undefined;
    const isDayControlled = dayOfWeek !== undefined;
    const isOpenControlled = open !== undefined;

    const [internalFreq, setInternalFreq] = useState<FrequencyOption>(defaultValue);
    const [internalDay, setInternalDay] = useState<WeekdayOption>(defaultDayOfWeek);
    const [internalOpen, setInternalOpen] = useState<boolean>(defaultOpen);

    const committedFreq = isFreqControlled ? value : internalFreq;
    const committedDay = isDayControlled ? dayOfWeek : internalDay;
    const isOpen = isOpenControlled ? open : internalOpen;

    const [draftFreq, setDraftFreq] = useState<FrequencyOption>(committedFreq);
    const [draftDay, setDraftDay] = useState<WeekdayOption>(committedDay);

    const triggerRef = useRef<HTMLButtonElement>(null);
    const freqRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const dayRefs = useRef<Array<HTMLButtonElement | null>>([]);

    useEffect(() => {
      setDraftFreq(committedFreq);
    }, [committedFreq]);

    useEffect(() => {
      setDraftDay(committedDay);
    }, [committedDay]);

    const setOpenState = useCallback(
      (nextOpen: boolean) => {
        if (!isOpenControlled) {
          setInternalOpen(nextOpen);
        }
        onOpenChange?.(nextOpen);
      },
      [isOpenControlled, onOpenChange]
    );

    const handleOpen = useCallback(() => {
      if (disabled) return;
      setDraftFreq(committedFreq);
      setDraftDay(committedDay);
      setOpenState(true);
    }, [committedDay, committedFreq, disabled, setOpenState]);

    const handleConfirm = useCallback(() => {
      if (!isFreqControlled) {
        setInternalFreq(draftFreq);
      }
      if (!isDayControlled) {
        setInternalDay(draftDay);
      }
      onChange?.({ frequency: draftFreq, dayOfWeek: draftDay });
      setOpenState(false);
      requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }, [
      draftDay,
      draftFreq,
      isDayControlled,
      isFreqControlled,
      onChange,
      setOpenState,
    ]);

    const handleCancel = useCallback(() => {
      setDraftFreq(committedFreq);
      setDraftDay(committedDay);
      setOpenState(false);
      requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }, [committedDay, committedFreq, setOpenState]);

    const handleContainerKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!isOpen) return;
        if (event.key === "Escape") {
          event.preventDefault();
          handleCancel();
        }
      },
      [handleCancel, isOpen]
    );

    const handleFrequencyKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          const next = (index + 1) % FREQUENCY_OPTIONS.length;
          setDraftFreq(FREQUENCY_OPTIONS[next]);
          freqRefs.current[next]?.focus();
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          const prev =
            (index - 1 + FREQUENCY_OPTIONS.length) % FREQUENCY_OPTIONS.length;
          setDraftFreq(FREQUENCY_OPTIONS[prev]);
          freqRefs.current[prev]?.focus();
        } else if (event.key === "Enter") {
          event.preventDefault();
          handleConfirm();
        }
      },
      [handleConfirm]
    );

    const handleWeekdayKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          const next = (index + 1) % WEEKDAY_OPTIONS.length;
          setDraftDay(WEEKDAY_OPTIONS[next]);
          dayRefs.current[next]?.focus();
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          const prev =
            (index - 1 + WEEKDAY_OPTIONS.length) % WEEKDAY_OPTIONS.length;
          setDraftDay(WEEKDAY_OPTIONS[prev]);
          dayRefs.current[prev]?.focus();
        } else if (event.key === "Enter") {
          event.preventDefault();
          handleConfirm();
        }
      },
      [handleConfirm]
    );

    const showWeekdays = isOpen && draftFreq === "Weekly";
    const summaryLabel =
      committedFreq === "Weekly"
        ? `${committedFreq}, ${committedDay}`
        : committedFreq;

    const styles = THEME_CLASSES[theme];
    const layoutTransition = shouldReduceMotion ? INSTANT_TRANSITION : SPRING_LAYOUT;
    const pillTransition = shouldReduceMotion ? INSTANT_TRANSITION : SPRING_PILL;
    const blurOffset = shouldReduceMotion ? "blur(0px)" : "blur(6px)";

    return (
      <div
        ref={ref}
        onKeyDown={handleContainerKeyDown}
        className={cn(
          "w-full max-w-[400px] select-none font-sans antialiased",
          disabled && "opacity-55 pointer-events-none",
          className
        )}
        {...rest}
      >
        <motion.div
          layout
          transition={layoutTransition}
          animate={{
            borderRadius: showWeekdays ? 28 : 32,
          }}
          className={cn(
            "relative w-full p-[10px] overflow-hidden transition-colors duration-200",
            styles.shell
          )}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {!isOpen ? (
              <motion.div
                key="collapsed"
                layout="position"
                initial={{ opacity: 0, filter: blurOffset }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: blurOffset }}
                transition={
                  shouldReduceMotion
                    ? INSTANT_TRANSITION
                    : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
                }
                onClick={handleOpen}
                className={cn(
                  "flex items-center justify-between gap-3 h-[44px] w-full",
                  !disabled && "cursor-pointer"
                )}
              >
                <span
                  id={`freq-label-${uid}`}
                  className={cn(
                    "pl-[14px] text-[15px] font-medium tracking-[-0.01em] truncate",
                    styles.label
                  )}
                >
                  {label}
                </span>

                <button
                  ref={triggerRef}
                  type="button"
                  disabled={disabled}
                  aria-labelledby={`freq-label-${uid}`}
                  aria-expanded={false}
                  aria-controls={`freq-panel-${uid}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpen();
                  }}
                  className={cn(
                    "inline-flex items-center justify-center gap-[10px] h-[44px] pl-[18px] pr-[14px] rounded-full shrink-0",
                    "text-[15px] font-medium tracking-[-0.01em] whitespace-nowrap",
                    "transition-colors duration-150 outline-none cursor-pointer",
                    styles.surface,
                    styles.triggerHover,
                    styles.primaryText,
                    styles.focusRing
                  )}
                >
                  <span>{summaryLabel}</span>
                  <ChevronsLeftRight
                    aria-hidden="true"
                    className={cn("w-[15px] h-[15px] shrink-0", styles.chevron)}
                    strokeWidth={2.2}
                  />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="expanded"
                id={`freq-panel-${uid}`}
                layout="position"
                initial={{ opacity: 0, filter: blurOffset }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: blurOffset }}
                transition={
                  shouldReduceMotion
                    ? INSTANT_TRANSITION
                    : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
                }
                className="flex flex-col w-full"
              >
                {/* Top row: Frequency options + circular confirm button */}
                <div className="flex items-center gap-[10px] w-full">
                  <div
                    role="radiogroup"
                    aria-label={label}
                    className={cn(
                      "flex-1 min-w-0 h-[44px] rounded-full p-[4px] flex items-center justify-between",
                      styles.surface
                    )}
                  >
                    {FREQUENCY_OPTIONS.map((option, index) => {
                      const isSelected = draftFreq === option;
                      return (
                        <button
                          key={option}
                          ref={(el) => {
                            freqRefs.current[index] = el;
                          }}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={isSelected ? 0 : -1}
                          onClick={() => setDraftFreq(option)}
                          onKeyDown={(e) => handleFrequencyKeyDown(e, index)}
                          className={cn(
                            "relative flex-1 h-full px-2 rounded-full flex items-center justify-center",
                            "text-[14px] font-medium tracking-[-0.01em] whitespace-nowrap",
                            "transition-colors duration-150 outline-none cursor-pointer",
                            styles.focusRing,
                            isSelected
                              ? styles.primaryText
                              : cn(styles.mutedText, styles.mutedHover)
                          )}
                        >
                          {isSelected && (
                            <motion.span
                              layoutId={`freq-active-pill-${uid}`}
                              transition={pillTransition}
                              className={cn(
                                "absolute inset-0 rounded-full",
                                styles.activePill
                              )}
                            />
                          )}
                          <span className="relative z-10">{option}</span>
                        </button>
                      );
                    })}
                  </div>

                  <motion.button
                    type="button"
                    aria-label={`Confirm ${
                      draftFreq === "Weekly"
                        ? `${draftFreq}, ${WEEKDAY_FULL_NAMES[draftDay]}`
                        : draftFreq
                    }`}
                    initial={
                      shouldReduceMotion
                        ? { opacity: 1, scale: 1 }
                        : { opacity: 0.4, scale: 0.82 }
                    }
                    animate={{ opacity: 1, scale: 1 }}
                    exit={
                      shouldReduceMotion
                        ? { opacity: 0, scale: 1 }
                        : { opacity: 0, scale: 0.82 }
                    }
                    transition={
                      shouldReduceMotion
                        ? INSTANT_TRANSITION
                        : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
                    }
                    onClick={handleConfirm}
                    className={cn(
                      "h-[44px] w-[44px] shrink-0 rounded-full flex items-center justify-center",
                      "transition-colors duration-150 outline-none cursor-pointer",
                      styles.confirmBtn,
                      styles.focusRing
                    )}
                  >
                    <Check
                      aria-hidden="true"
                      className="w-[18px] h-[18px]"
                      strokeWidth={2.6}
                    />
                  </motion.button>
                </div>

                {/* Second row: Weekday picker (revealed when "Weekly" is selected) */}
                <AnimatePresence initial={false}>
                  {showWeekdays && (
                    <motion.div
                      key="weekday-row"
                      initial={{
                        opacity: 0,
                        height: 0,
                        marginTop: 0,
                        filter: blurOffset,
                      }}
                      animate={{
                        opacity: 1,
                        height: 44,
                        marginTop: 10,
                        filter: "blur(0px)",
                      }}
                      exit={{
                        opacity: 0,
                        height: 0,
                        marginTop: 0,
                        filter: blurOffset,
                      }}
                      transition={
                        shouldReduceMotion
                          ? INSTANT_TRANSITION
                          : { duration: 0.26, ease: [0.22, 1, 0.36, 1] }
                      }
                      className="overflow-hidden w-full"
                    >
                      <div
                        role="radiogroup"
                        aria-label="Day of week"
                        className={cn(
                          "w-full h-[44px] rounded-full p-[4px] grid grid-cols-7 items-center",
                          styles.surface
                        )}
                      >
                        {WEEKDAY_OPTIONS.map((day, index) => {
                          const isSelected = draftDay === day;
                          return (
                            <button
                              key={day}
                              ref={(el) => {
                                dayRefs.current[index] = el;
                              }}
                              type="button"
                              role="radio"
                              aria-label={WEEKDAY_FULL_NAMES[day]}
                              aria-checked={isSelected}
                              tabIndex={isSelected ? 0 : -1}
                              onClick={() => setDraftDay(day)}
                              onKeyDown={(e) => handleWeekdayKeyDown(e, index)}
                              className={cn(
                                "relative h-full rounded-full flex items-center justify-center",
                                "text-[13.5px] font-medium tracking-[-0.01em] whitespace-nowrap",
                                "transition-colors duration-150 outline-none cursor-pointer",
                                styles.focusRing,
                                isSelected
                                  ? styles.primaryText
                                  : cn(styles.mutedText, styles.mutedHover)
                              )}
                            >
                              {isSelected && (
                                <motion.span
                                  layoutId={`day-active-pill-${uid}`}
                                  transition={pillTransition}
                                  className={cn(
                                    "absolute inset-0 rounded-full",
                                    styles.activePill
                                  )}
                                />
                              )}
                              <span className="relative z-10">{day}</span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }
);

FrequencySelector.displayName = "FrequencySelector";

export {
  FrequencySelector,
  FrequencySelector as component,
  FrequencySelector as Component,
};
export default FrequencySelector;