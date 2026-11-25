"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus, X } from "lucide-react";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type RitualIconKind = "plan" | "water" | "sun" | "moon" | "check";

export interface DailyRitualItem {
  id: string;
  label: string;
  completed: boolean;
  icon?: RitualIconKind;
  color?: string;
}

export type DailyRitualTheme = "auto" | "light" | "dark";

export interface DailyRitualChecklistProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onToggle"> {
  /** Controlled list of daily rituals */
  items?: DailyRitualItem[];
  /** Initial list of daily rituals when uncontrolled */
  defaultItems?: DailyRitualItem[];
  /** Called whenever the list changes (toggle, add, or remove) */
  onItemsChange?: (items: DailyRitualItem[]) => void;
  /** Called when an individual ritual is toggled */
  onToggle?: (item: DailyRitualItem) => void;
  /** Called when a new ritual is added */
  onAdd?: (item: DailyRitualItem) => void;
  /** Called when a ritual is removed */
  onRemove?: (id: string) => void;
  /** Show the floating pill '+' button to add new rituals */
  allowAdd?: boolean;
  /** Allow removing items via subtle hover/focus remove control */
  allowRemove?: boolean;
  /** Apply strikethrough & muted label styling to completed rituals */
  strikethroughCompleted?: boolean;
  /** Primary accent color for the moon/default completed icon */
  accentColor?: string;
  /** Visual theme mode ('auto' follows host Tailwind dark class) */
  theme?: DailyRitualTheme;
  /** Placeholder text for the inline new-ritual input */
  addPlaceholder?: string;
}

export const DEFAULT_RITUAL_ITEMS: DailyRitualItem[] = [
  {
    id: "plan-a-day",
    label: "Plan a day",
    completed: false,
    icon: "plan",
    color: "#10b981",
  },
  {
    id: "drink-water",
    label: "Drink water",
    completed: false,
    icon: "water",
    color: "#0ea5e9",
  },
  {
    id: "get-sunlight",
    label: "Get Sunlight",
    completed: false,
    icon: "sun",
    color: "#f59e0b",
  },
  {
    id: "wind-down",
    label: "Wind Down",
    completed: true,
    icon: "moon",
  },
];

function inferIconKind(label: string): RitualIconKind {
  const lower = label.toLowerCase();
  if (/(water|hydrat|drink|tea|coffee)/.test(lower)) return "water";
  if (/(sun|walk|outside|morning|run|stretch)/.test(lower)) return "sun";
  if (/(wind|sleep|night|rest|bed|moon|read)/.test(lower)) return "moon";
  if (/(plan|schedule|journal|focus|write|work)/.test(lower)) return "plan";
  return "check";
}

function DashedCheckSquare({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("h-6 w-6 shrink-0", className)}
    >
      <rect
        x="2.25"
        y="2.25"
        width="19.5"
        height="19.5"
        rx="5.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeDasharray="4.1 2.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CompletedRitualGlyph({
  kind,
  color,
}: {
  kind: RitualIconKind;
  color: string;
}) {
  if (kind === "moon") {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="h-6 w-6 shrink-0"
      >
        <path
          d="M20.354 15.354A9 9 0 0 1 8.646 3.646 9.003 9.003 0 0 0 12 21a9.003 9.003 0 0 0 8.354-5.646Z"
          fill={color}
        />
      </svg>
    );
  }

  if (kind === "water") {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="h-6 w-6 shrink-0"
      >
        <path
          d="M12 2.5C12 2.5 5.25 10.1 5.25 14.5C5.25 18.2279 8.27208 21.25 12 21.25C15.7279 21.25 18.75 18.2279 18.75 14.5C18.75 10.1 12 2.5 12 2.5Z"
          fill={color}
        />
      </svg>
    );
  }

  if (kind === "sun") {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="h-6 w-6 shrink-0"
      >
        <circle cx="12" cy="12" r="5" fill={color} />
        <path
          d="M12 2.25V4.5M12 19.5V21.75M4.5 12H2.25M21.75 12H19.5M6.697 6.697L5.106 5.106M18.894 18.894L17.303 17.303M17.303 6.697L18.894 5.106M5.106 18.894L6.697 17.303"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (kind === "plan") {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="h-6 w-6 shrink-0"
      >
        <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill={color} />
        <path
          d="M8.25 12.4L10.8 14.95L15.9 9.45"
          stroke="#ffffff"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-6 w-6 shrink-0"
    >
      <circle cx="12" cy="12" r="9.5" fill={color} />
      <path
        d="M8.3 12.35L10.85 14.9L15.85 9.5"
        stroke="#ffffff"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const SPRING_ICON = {
  type: "spring" as const,
  stiffness: 440,
  damping: 30,
  mass: 0.75,
};

const SPRING_ROW = {
  type: "spring" as const,
  stiffness: 380,
  damping: 32,
  mass: 0.85,
};

export const DailyRitualChecklist = React.forwardRef<
  HTMLDivElement,
  DailyRitualChecklistProps
>(function DailyRitualChecklist(
  {
    items: controlledItems,
    defaultItems = DEFAULT_RITUAL_ITEMS,
    onItemsChange,
    onToggle,
    onAdd,
    onRemove,
    allowAdd = true,
    allowRemove = true,
    strikethroughCompleted = false,
    accentColor = "#4b22e0",
    theme = "auto",
    addPlaceholder = "New daily ritual...",
    className,
    ...rest
  },
  ref
) {
  const rawId = useId();
  const uid = rawId.replace(/:/g, "");
  const prefersReducedMotion = useReducedMotion();

  const [internalItems, setInternalItems] =
    useState<DailyRitualItem[]>(defaultItems);
  const [isAdding, setIsAdding] = useState(false);
  const [draftLabel, setDraftLabel] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const items = controlledItems ?? internalItems;

  useEffect(() => {
    if (isAdding) {
      inputRef.current?.focus();
    }
  }, [isAdding]);

  const commitItems = (next: DailyRitualItem[]) => {
    if (controlledItems === undefined) {
      setInternalItems(next);
    }
    onItemsChange?.(next);
  };

  const handleToggle = (id: string) => {
    let toggled: DailyRitualItem | undefined;
    const next = items.map((item) => {
      if (item.id !== id) return item;
      toggled = { ...item, completed: !item.completed };
      return toggled;
    });
    commitItems(next);
    if (toggled) {
      onToggle?.(toggled);
    }
  };

  const handleRemove = (id: string) => {
    const next = items.filter((item) => item.id !== id);
    commitItems(next);
    onRemove?.(id);
  };

  const handleAddSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = draftLabel.trim();
    if (!trimmed) {
      setIsAdding(false);
      setDraftLabel("");
      return;
    }

    const inferredIcon = inferIconKind(trimmed);
    const defaultIconColor =
      inferredIcon === "water"
        ? "#0ea5e9"
        : inferredIcon === "sun"
          ? "#f59e0b"
          : inferredIcon === "plan"
            ? "#10b981"
            : undefined;

    const newItem: DailyRitualItem = {
      id: `${uid}-${Date.now()}`,
      label: trimmed,
      completed: false,
      icon: inferredIcon,
      color: defaultIconColor,
    };

    commitItems([...items, newItem]);
    onAdd?.(newItem);
    setDraftLabel("");
    setIsAdding(false);
  };

  const isForcedLight = theme === "light";
  const isForcedDark = theme === "dark";

  const surfaceText = isForcedLight
    ? "text-[#060606]"
    : isForcedDark
      ? "text-neutral-50"
      : "text-[#060606] dark:text-neutral-50";

  const mutedText = isForcedLight
    ? "text-[#8a8a8a]"
    : isForcedDark
      ? "text-neutral-500"
      : "text-[#8a8a8a] dark:text-neutral-500";

  const checkboxColor = isForcedLight
    ? "text-[#969595] group-hover:text-[#6b6a6a]"
    : isForcedDark
      ? "text-neutral-500 group-hover:text-neutral-300"
      : "text-[#969595] group-hover:text-[#6b6a6a] dark:text-neutral-500 dark:group-hover:text-neutral-300";

  const dividerMidColor = isForcedLight
    ? "text-[#b1b1b1]"
    : isForcedDark
      ? "text-neutral-700"
      : "text-[#b1b1b1] dark:text-neutral-700";

  const dividerEndColor = isForcedLight
    ? "text-[#d5d5d5]"
    : isForcedDark
      ? "text-neutral-800"
      : "text-[#d5d5d5] dark:text-neutral-800";

  const pillClasses = isForcedLight
    ? "bg-[#f6f6f6] text-[#6e6b6e] hover:bg-[#ededed] hover:text-[#262626]"
    : isForcedDark
      ? "bg-neutral-800/90 text-neutral-400 hover:bg-neutral-700/90 hover:text-neutral-100"
      : "bg-[#f6f6f6] text-[#6e6b6e] hover:bg-[#ededed] hover:text-[#262626] dark:bg-neutral-800/90 dark:text-neutral-400 dark:hover:bg-neutral-700/90 dark:hover:text-neutral-100";

  const focusRing = isForcedLight
    ? "focus-visible:ring-2 focus-visible:ring-[#4b22e0]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
    : isForcedDark
      ? "focus-visible:ring-2 focus-visible:ring-indigo-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
      : "focus-visible:ring-2 focus-visible:ring-[#4b22e0]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-indigo-400/50 dark:focus-visible:ring-offset-neutral-950";

  const containerBg = isForcedLight
    ? "bg-white"
    : isForcedDark
      ? "bg-neutral-950"
      : "bg-transparent";

  return (
    <div
      ref={ref}
      className={cn(
        "w-full max-w-[300px] select-none rounded-2xl px-2 py-2 font-sans antialiased",
        containerBg,
        className
      )}
      style={{
        fontFamily:
          '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
      {...rest}
    >
      <ul
        role="list"
        aria-label="Daily rituals checklist"
        className="flex flex-col"
      >
        <AnimatePresence initial={false}>
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1 && !isAdding;
            const iconKind = item.icon ?? "check";
            const resolvedColor = item.color ?? accentColor;

            return (
              <motion.li
                key={item.id}
                layout={!prefersReducedMotion}
                initial={
                  prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }
                }
                animate={{ opacity: 1, y: 0 }}
                exit={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, height: 0, overflow: "hidden" }
                }
                transition={SPRING_ROW}
                className="relative flex flex-col"
              >
                <div className="group flex h-[60px] items-center justify-between px-3.5">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={item.completed}
                    aria-labelledby={`${uid}-label-${item.id}`}
                    onClick={() => handleToggle(item.id)}
                    className={cn(
                      "flex min-w-0 flex-1 cursor-pointer items-center gap-6 rounded-lg py-1.5 text-left outline-none transition-opacity",
                      focusRing
                    )}
                  >
                    <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
                      <AnimatePresence mode="wait" initial={false}>
                        {item.completed ? (
                          <motion.span
                            key="checked"
                            initial={
                              prefersReducedMotion
                                ? { opacity: 1 }
                                : { scale: 0.45, rotate: -24, opacity: 0 }
                            }
                            animate={{ scale: 1, rotate: 0, opacity: 1 }}
                            exit={
                              prefersReducedMotion
                                ? { opacity: 0 }
                                : { scale: 0.55, rotate: 16, opacity: 0 }
                            }
                            transition={SPRING_ICON}
                            className="flex items-center justify-center"
                          >
                            <CompletedRitualGlyph
                              kind={iconKind}
                              color={resolvedColor}
                            />
                          </motion.span>
                        ) : (
                          <motion.span
                            key="unchecked"
                            initial={
                              prefersReducedMotion
                                ? { opacity: 1 }
                                : { scale: 0.72, opacity: 0 }
                            }
                            animate={{ scale: 1, opacity: 1 }}
                            exit={
                              prefersReducedMotion
                                ? { opacity: 0 }
                                : { scale: 0.72, opacity: 0 }
                            }
                            transition={SPRING_ICON}
                            className={cn(
                              "flex items-center justify-center transition-colors duration-150",
                              checkboxColor
                            )}
                          >
                            <DashedCheckSquare />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>

                    <span
                      id={`${uid}-label-${item.id}`}
                      className={cn(
                        "truncate text-[20px] font-bold leading-none tracking-[-0.025em] transition-colors duration-200",
                        item.completed && strikethroughCompleted
                          ? cn("line-through decoration-2", mutedText)
                          : surfaceText
                      )}
                    >
                      {item.label}
                    </span>
                  </button>

                  {allowRemove && (
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      aria-label={`Remove ${item.label}`}
                      className={cn(
                        "ml-1 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md opacity-0 outline-none transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100",
                        isForcedLight
                          ? "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                          : isForcedDark
                            ? "text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200"
                            : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200",
                        focusRing
                      )}
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2.25} />
                    </button>
                  )}
                </div>

                <div
                  aria-hidden="true"
                  className={cn(
                    "h-[1.5px] w-full bg-[repeating-linear-gradient(to_right,currentColor_0,currentColor_4px,transparent_4px,transparent_7.5px)]",
                    isLast ? dividerEndColor : dividerMidColor
                  )}
                />
              </motion.li>
            );
          })}

          {isAdding && (
            <motion.li
              key="add-row"
              initial={
                prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -6 }
              }
              animate={{ opacity: 1, y: 0 }}
              exit={
                prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }
              }
              transition={SPRING_ROW}
              className="flex flex-col"
            >
              <form
                onSubmit={handleAddSubmit}
                className="flex h-[60px] items-center gap-6 px-3.5"
              >
                <DashedCheckSquare
                  className={cn(
                    isForcedLight
                      ? "text-[#969595]"
                      : isForcedDark
                        ? "text-neutral-500"
                        : "text-[#969595] dark:text-neutral-500"
                  )}
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={draftLabel}
                  onChange={(e) => setDraftLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setDraftLabel("");
                      setIsAdding(false);
                    }
                  }}
                  onBlur={() => {
                    if (draftLabel.trim()) {
                      handleAddSubmit();
                    } else {
                      setIsAdding(false);
                    }
                  }}
                  placeholder={addPlaceholder}
                  aria-label="New daily ritual name"
                  maxLength={40}
                  className={cn(
                    "w-full min-w-0 bg-transparent text-[20px] font-bold leading-none tracking-[-0.025em] outline-none placeholder:font-semibold",
                    surfaceText,
                    isForcedLight
                      ? "placeholder:text-neutral-400"
                      : isForcedDark
                        ? "placeholder:text-neutral-600"
                        : "placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
                  )}
                />
              </form>
              <div
                aria-hidden="true"
                className={cn(
                  "h-[1.5px] w-full bg-[repeating-linear-gradient(to_right,currentColor_0,currentColor_4px,transparent_4px,transparent_7.5px)]",
                  dividerEndColor
                )}
              />
            </motion.li>
          )}
        </AnimatePresence>
      </ul>

      {allowAdd && (
        <div className="mt-8 flex justify-center">
          <motion.button
            type="button"
            onMouseDown={(e) => {
              if (isAdding) e.preventDefault();
            }}
            onClick={() => {
              if (isAdding) {
                handleAddSubmit();
              } else {
                setIsAdding(true);
              }
            }}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
            transition={SPRING_ICON}
            aria-label={
              isAdding
                ? draftLabel.trim()
                  ? "Confirm new ritual"
                  : "Cancel adding ritual"
                : "Add new ritual"
            }
            className={cn(
              "flex h-[50px] w-[78px] cursor-pointer items-center justify-center rounded-full outline-none transition-colors duration-150",
              pillClasses,
              focusRing
            )}
          >
            <motion.span
              animate={{
                rotate: isAdding && !draftLabel.trim() ? 45 : 0,
              }}
              transition={SPRING_ICON}
              className="flex items-center justify-center"
            >
              <Plus className="h-[22px] w-[22px]" strokeWidth={2.2} />
            </motion.span>
          </motion.button>
        </div>
      )}
    </div>
  );
});

DailyRitualChecklist.displayName = "DailyRitualChecklist";

export { DailyRitualChecklist as component, DailyRitualChecklist as Component };
export default DailyRitualChecklist;