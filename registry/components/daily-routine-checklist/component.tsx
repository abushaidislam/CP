"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus, X } from "lucide-react";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type RoutineIconType = "sparkles" | "droplet" | "sun" | "moon" | "check";

export interface RoutineItem {
  id: string;
  label: string;
  completed: boolean;
  icon?: RoutineIconType;
  color?: string;
}

export interface DailyRoutineChecklistProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onToggle"> {
  /** Controlled list of routine items */
  items?: RoutineItem[];
  /** Initial list of routine items when uncontrolled */
  defaultItems?: RoutineItem[];
  /** Callback fired whenever the items list changes */
  onItemsChange?: (items: RoutineItem[]) => void;
  /** Callback fired when an item is toggled */
  onToggle?: (item: RoutineItem) => void;
  /** Callback fired when a new item is added */
  onAdd?: (item: RoutineItem) => void;
  /** Callback fired when an item is removed */
  onRemove?: (id: string) => void;
  /** Color theme override ("auto" respects Tailwind dark mode) */
  theme?: "auto" | "light" | "dark";
  /** Whether to show the bottom pill button to add new routine items */
  allowAdd?: boolean;
  /** Whether to apply strikethrough and subtle muting to completed labels */
  strikeCompleted?: boolean;
  /** Primary accent color used for the default moon/check icons and focus ring */
  accentColor?: string;
  /** Placeholder text for the inline new-item input */
  inputPlaceholder?: string;
  /** Accessible label for the checklist region */
  ariaLabel?: string;
}

export const DEFAULT_ROUTINE_ITEMS: RoutineItem[] = [
  {
    id: "plan-a-day",
    label: "Plan a day",
    completed: false,
    icon: "sparkles",
    color: "#10b981",
  },
  {
    id: "drink-water",
    label: "Drink water",
    completed: false,
    icon: "droplet",
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

function DashedCheckBox({ isDarkForced, isLightForced }: { isDarkForced: boolean; isLightForced: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      className={cn(
        "block h-[18px] w-[18px] transition-colors duration-150",
        isDarkForced
          ? "text-neutral-500 group-hover/row:text-neutral-300"
          : isLightForced
            ? "text-[#a9a8ab] group-hover/row:text-[#76757a]"
            : "text-[#a9a8ab] group-hover/row:text-[#76757a] dark:text-neutral-500 dark:group-hover/row:text-neutral-300"
      )}
    >
      <rect
        x="1.25"
        y="1.25"
        width="15.5"
        height="15.5"
        rx="4.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="3.1 2.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CompletedIcon({
  icon,
  color,
}: {
  icon: RoutineIconType;
  color: string;
}) {
  switch (icon) {
    case "moon":
      return (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="block h-[18px] w-[18px]"
        >
          <path
            d="M20.354 15.354A9 9 0 0 1 8.646 3.646 9.003 9.003 0 0 0 12 21a9.003 9.003 0 0 0 8.354-5.646Z"
            fill={color}
          />
        </svg>
      );
    case "droplet":
      return (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="block h-[18px] w-[18px]"
        >
          <path
            d="M12 2.69 17.66 8.35a8 8 0 1 1-11.32 0L12 2.69Z"
            fill={color}
          />
        </svg>
      );
    case "sun":
      return (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="block h-[18px] w-[18px]"
        >
          <circle cx="12" cy="12" r="5" fill={color} />
          <path
            d="M12 2.5v2.2M12 19.3v2.2M4.7 4.7l1.55 1.55M17.75 17.75l1.55 1.55M2.5 12h2.2M19.3 12h2.2M4.7 19.3l1.55-1.55M17.75 6.25l1.55-1.55"
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "sparkles":
      return (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="block h-[18px] w-[18px]"
        >
          <path
            d="M12 2.5 14.45 9.55 21.5 12l-7.05 2.45L12 21.5l-2.45-7.05L2.5 12l7.05-2.45L12 2.5Z"
            fill={color}
          />
        </svg>
      );
    case "check":
    default:
      return (
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          aria-hidden="true"
          className="block h-[18px] w-[18px]"
        >
          <rect x="0.75" y="0.75" width="16.5" height="16.5" rx="4.75" fill={color} />
          <path
            d="M5.25 9.25 7.75 11.75 12.75 6.5"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

export const DailyRoutineChecklist = React.forwardRef<
  HTMLDivElement,
  DailyRoutineChecklistProps
>(
  (
    {
      items: controlledItems,
      defaultItems = DEFAULT_ROUTINE_ITEMS,
      onItemsChange,
      onToggle,
      onAdd,
      onRemove,
      theme = "auto",
      allowAdd = true,
      strikeCompleted = false,
      accentColor = "#5d37e6",
      inputPlaceholder = "New habit...",
      ariaLabel = "Daily routine checklist",
      className,
      ...rest
    },
    ref
  ) => {
    const rawId = useId();
    const safeId = rawId.replace(/:/g, "");
    const prefersReducedMotion = useReducedMotion();

    const isControlled = controlledItems !== undefined;
    const [internalItems, setInternalItems] = useState<RoutineItem[]>(defaultItems);
    const items = isControlled ? controlledItems : internalItems;

    const [isAdding, setIsAdding] = useState(false);
    const [draftLabel, setDraftLabel] = useState("");
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
      if (isAdding && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isAdding]);

    const updateItems = (next: RoutineItem[]) => {
      if (!isControlled) {
        setInternalItems(next);
      }
      onItemsChange?.(next);
    };

    const handleToggle = (id: string) => {
      let toggledItem: RoutineItem | undefined;
      const next = items.map((item) => {
        if (item.id !== id) return item;
        toggledItem = { ...item, completed: !item.completed };
        return toggledItem;
      });
      updateItems(next);
      if (toggledItem) {
        onToggle?.(toggledItem);
      }
    };

    const handleRemove = (id: string) => {
      const next = items.filter((item) => item.id !== id);
      updateItems(next);
      onRemove?.(id);
    };

    const handleCommitAdd = () => {
      const trimmed = draftLabel.trim();
      if (!trimmed) {
        setIsAdding(false);
        setDraftLabel("");
        return;
      }
      const newItem: RoutineItem = {
        id: `${safeId}-${Date.now()}`,
        label: trimmed,
        completed: false,
        icon: "check",
      };
      updateItems([...items, newItem]);
      onAdd?.(newItem);
      setDraftLabel("");
      setIsAdding(false);
    };

    const handleAddButtonClick = () => {
      if (isAdding) {
        handleCommitAdd();
      } else {
        setIsAdding(true);
      }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleCommitAdd();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setDraftLabel("");
        setIsAdding(false);
      }
    };

    const isDarkForced = theme === "dark";
    const isLightForced = theme === "light";

    const dividerClass = isDarkForced
      ? "bg-[radial-gradient(circle,_rgba(255,255,255,0.16)_1px,_transparent_1px)]"
      : isLightForced
        ? "bg-[radial-gradient(circle,_#d4d4d8_1px,_transparent_1px)]"
        : "bg-[radial-gradient(circle,_#d4d4d8_1px,_transparent_1px)] dark:bg-[radial-gradient(circle,_rgba(255,255,255,0.16)_1px,_transparent_1px)]";

    const labelBaseClass = isDarkForced
      ? "text-neutral-100"
      : isLightForced
        ? "text-[#151415]"
        : "text-[#151415] dark:text-neutral-100";

    const labelCompletedClass = isDarkForced
      ? "text-neutral-500 line-through decoration-neutral-600"
      : isLightForced
        ? "text-[#8e8d92] line-through decoration-[#c2c1c6]"
        : "text-[#8e8d92] line-through decoration-[#c2c1c6] dark:text-neutral-500 dark:decoration-neutral-600";

    const springTransition = prefersReducedMotion
      ? { duration: 0.01 }
      : { type: "spring" as const, stiffness: 520, damping: 32, mass: 0.7 };

    const rowTransition = prefersReducedMotion
      ? { duration: 0.01 }
      : { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const };

    return (
      <div
        ref={ref}
        role="region"
        aria-label={ariaLabel}
        className={cn(
          "w-full max-w-[272px] select-none font-sans antialiased",
          isDarkForced && "text-neutral-100",
          isLightForced && "text-[#151415]",
          className
        )}
        style={{
          fontFamily:
            "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
        {...rest}
      >
        <ul className="m-0 list-none p-0">
          <AnimatePresence initial={false}>
            {items.map((item) => {
              const iconColor = item.color || accentColor;
              return (
                <motion.li
                  key={item.id}
                  layout={!prefersReducedMotion}
                  initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  transition={rowTransition}
                  className="group/row relative overflow-hidden"
                >
                  <div className="flex items-center justify-between px-3 py-[13px]">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={item.completed}
                      onClick={() => handleToggle(item.id)}
                      className={cn(
                        "flex flex-1 items-center gap-[18px] rounded-md text-left outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-offset-2",
                        isDarkForced
                          ? "focus-visible:ring-offset-neutral-950"
                          : isLightForced
                            ? "focus-visible:ring-offset-white"
                            : "focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950"
                      )}
                      style={
                        {
                          "--tw-ring-color": accentColor,
                        } as React.CSSProperties
                      }
                    >
                      <span className="relative flex h-[20px] w-[20px] shrink-0 items-center justify-center">
                        <AnimatePresence mode="wait" initial={false}>
                          {item.completed ? (
                            <motion.span
                              key="completed"
                              initial={
                                prefersReducedMotion
                                  ? { opacity: 0 }
                                  : { scale: 0.45, rotate: -18, opacity: 0 }
                              }
                              animate={{ scale: 1, rotate: 0, opacity: 1 }}
                              exit={
                                prefersReducedMotion
                                  ? { opacity: 0 }
                                  : { scale: 0.55, rotate: 12, opacity: 0 }
                              }
                              transition={springTransition}
                              className="flex items-center justify-center"
                            >
                              <CompletedIcon
                                icon={item.icon ?? "check"}
                                color={iconColor}
                              />
                            </motion.span>
                          ) : (
                            <motion.span
                              key="unchecked"
                              initial={
                                prefersReducedMotion
                                  ? { opacity: 0 }
                                  : { scale: 0.72, opacity: 0 }
                              }
                              animate={{ scale: 1, opacity: 1 }}
                              exit={
                                prefersReducedMotion
                                  ? { opacity: 0 }
                                  : { scale: 0.72, opacity: 0 }
                              }
                              transition={springTransition}
                              className="flex items-center justify-center"
                            >
                              <DashedCheckBox
                                isDarkForced={isDarkForced}
                                isLightForced={isLightForced}
                              />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </span>

                      <span
                        className={cn(
                          "truncate text-[17px] font-semibold leading-[1.3] tracking-[-0.02em] transition-colors duration-200",
                          item.completed && strikeCompleted
                            ? labelCompletedClass
                            : labelBaseClass
                        )}
                      >
                        {item.label}
                      </span>
                    </button>

                    <button
                      type="button"
                      aria-label={`Remove ${item.label}`}
                      onClick={() => handleRemove(item.id)}
                      className={cn(
                        "ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full opacity-0 transition-opacity duration-150 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 group-hover/row:opacity-100",
                        isDarkForced
                          ? "text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200"
                          : isLightForced
                            ? "text-[#b0afb3] hover:bg-[#f2f2f4] hover:text-[#4b4a4f]"
                            : "text-[#b0afb3] hover:bg-[#f2f2f4] hover:text-[#4b4a4f] dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                      )}
                      style={
                        {
                          "--tw-ring-color": accentColor,
                        } as React.CSSProperties
                      }
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2.2} />
                    </button>
                  </div>

                  <div
                    aria-hidden="true"
                    className={cn(
                      "h-[1.5px] w-full bg-[length:5px_1.5px] bg-repeat-x",
                      dividerClass
                    )}
                  />
                </motion.li>
              );
            })}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {isAdding && (
              <motion.li
                key={`${safeId}-composer`}
                initial={prefersReducedMotion ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={rowTransition}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-[18px] px-3 py-[13px]">
                  <span className="flex h-[20px] w-[20px] shrink-0 items-center justify-center">
                    <DashedCheckBox
                      isDarkForced={isDarkForced}
                      isLightForced={isLightForced}
                    />
                  </span>
                  <input
                    ref={inputRef}
                    id={`${safeId}-new-habit-input`}
                    type="text"
                    value={draftLabel}
                    onChange={(e) => setDraftLabel(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    onBlur={() => {
                      if (!draftLabel.trim()) {
                        setIsAdding(false);
                      }
                    }}
                    placeholder={inputPlaceholder}
                    aria-label="New routine item title"
                    className={cn(
                      "w-full bg-transparent text-[17px] font-semibold leading-[1.3] tracking-[-0.02em] outline-none",
                      isDarkForced
                        ? "text-neutral-100 placeholder:text-neutral-500"
                        : isLightForced
                          ? "text-[#151415] placeholder:text-[#b2b1b5]"
                          : "text-[#151415] placeholder:text-[#b2b1b5] dark:text-neutral-100 dark:placeholder:text-neutral-500"
                    )}
                  />
                </div>
                <div
                  aria-hidden="true"
                  className={cn(
                    "h-[1.5px] w-full bg-[length:5px_1.5px] bg-repeat-x",
                    dividerClass
                  )}
                />
              </motion.li>
            )}
          </AnimatePresence>
        </ul>

        {allowAdd && (
          <div className="mt-7 flex justify-center">
            <motion.button
              type="button"
              onClick={handleAddButtonClick}
              whileHover={prefersReducedMotion ? undefined : { scale: 1.04 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
              transition={springTransition}
              aria-label={isAdding ? "Confirm new routine item" : "Add routine item"}
              className={cn(
                "flex h-[38px] w-[68px] items-center justify-center rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                isDarkForced
                  ? "bg-neutral-800/85 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 focus-visible:ring-offset-neutral-950"
                  : isLightForced
                    ? "bg-[#f5f5f7] text-[#9e9da1] hover:bg-[#ededf0] hover:text-[#636267] focus-visible:ring-offset-white"
                    : "bg-[#f5f5f7] text-[#9e9da1] hover:bg-[#ededf0] hover:text-[#636267] focus-visible:ring-offset-white dark:bg-neutral-800/85 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 dark:focus-visible:ring-offset-neutral-950"
              )}
              style={
                {
                  "--tw-ring-color": accentColor,
                } as React.CSSProperties
              }
            >
              <Plus className="h-[19px] w-[19px]" strokeWidth={2.2} />
            </motion.button>
          </div>
        )}
      </div>
    );
  }
);

DailyRoutineChecklist.displayName = "DailyRoutineChecklist";

export { DailyRoutineChecklist as component, DailyRoutineChecklist as Component };
export default DailyRoutineChecklist;