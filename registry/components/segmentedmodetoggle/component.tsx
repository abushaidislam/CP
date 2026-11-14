"use client";

import React, { useCallback, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface ToggleOption<T extends string = string> {
  /** Unique identifier for the option */
  value: T;
  /** Primary display label (e.g., "Future", "Now") */
  label: string;
  /** Optional superscript index (e.g., "01", "02") */
  index?: string;
  /** Optional accessible description */
  ariaLabel?: string;
  /** Disable interaction for this specific option */
  disabled?: boolean;
}

export type ToggleSize = "sm" | "md" | "lg" | "display";

export interface SegmentedModeToggleProps<T extends string = string>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** List of options to render (2 or more) */
  options?: readonly ToggleOption<T>[];
  /** Controlled active value */
  value?: T;
  /** Uncontrolled initial active value */
  defaultValue?: T;
  /** Callback fired when the active option changes */
  onChange?: (value: T) => void;
  /** Visual scale preset: "display" matches the 675x206 reference dimensions */
  size?: ToggleSize;
  /** Accessible label for the radiogroup */
  ariaLabel?: string;
  /** Optional additional class names for the outer container */
  className?: string;
  /** Disables the entire toggle */
  disabled?: boolean;
}

const DEFAULT_OPTIONS: readonly ToggleOption<"future" | "now">[] = [
  { value: "future", label: "Future", index: "01" },
  { value: "now", label: "Now", index: "02" },
];

const SIZE_STYLES: Record<
  ToggleSize,
  {
    container: string;
    label: string;
    index: string;
  }
> = {
  sm: {
    container: "h-10 min-w-[200px] p-[3px]",
    label: "text-sm tracking-[-0.025em]",
    index: "text-[9px] -top-[0.55em] ml-[1.5px] tracking-[-0.02em]",
  },
  md: {
    container: "h-12 min-w-[248px] p-[3.5px]",
    label: "text-base tracking-[-0.03em]",
    index: "text-[10px] -top-[0.6em] ml-[2px] tracking-[-0.02em]",
  },
  lg: {
    container: "h-16 min-w-[336px] p-1",
    label: "text-xl tracking-[-0.03em]",
    index: "text-[11px] -top-[0.6em] ml-[2px] tracking-[-0.02em]",
  },
  display: {
    container: "w-full max-w-[675px] h-[206px] p-[5.5px]",
    label: "text-[42px] sm:text-[58px] leading-none tracking-[-0.035em]",
    index:
      "text-[13px] sm:text-[18px] leading-none -top-[1.15em] ml-[3px] tracking-[-0.02em]",
  },
};

export function SegmentedModeToggle<T extends string = string>({
  options = DEFAULT_OPTIONS as unknown as readonly ToggleOption<T>[],
  value,
  defaultValue,
  onChange,
  size = "md",
  ariaLabel = "Mode selector",
  className,
  disabled = false,
  style,
  ...props
}: SegmentedModeToggleProps<T>) {
  const groupId = useId();
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const isControlled = value !== undefined;
  const fallbackDefault =
    defaultValue ?? (options.length > 1 ? options[1].value : options[0]?.value);
  const [internalValue, setInternalValue] = useState<T>(fallbackDefault);

  const activeValue = isControlled ? value : internalValue;
  const activeIndex = Math.max(
    0,
    options.findIndex((opt) => opt.value === activeValue)
  );

  const selectOption = useCallback(
    (nextValue: T, optionDisabled?: boolean) => {
      if (disabled || optionDisabled || nextValue === activeValue) return;
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onChange?.(nextValue);
    },
    [activeValue, disabled, isControlled, onChange]
  );

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) => {
    if (disabled || options.length === 0) return;

    let targetIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      targetIndex = (currentIndex + 1) % options.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      targetIndex = (currentIndex - 1 + options.length) % options.length;
    } else if (event.key === "Home") {
      targetIndex = 0;
    } else if (event.key === "End") {
      targetIndex = options.length - 1;
    }

    if (targetIndex === null) return;
    event.preventDefault();

    // Skip disabled options when navigating via keyboard
    let steps = 0;
    while (options[targetIndex]?.disabled && steps < options.length) {
      targetIndex =
        event.key === "ArrowLeft" ||
        event.key === "ArrowUp" ||
        event.key === "End"
          ? (targetIndex - 1 + options.length) % options.length
          : (targetIndex + 1) % options.length;
      steps++;
    }

    const nextOption = options[targetIndex];
    if (nextOption && !nextOption.disabled) {
      selectOption(nextOption.value, nextOption.disabled);
      buttonRefs.current[targetIndex]?.focus();
    }
  };

  const preset = SIZE_STYLES[size];
  const count = Math.max(1, options.length);

  return (
    <div
      {...props}
      role="radiogroup"
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      className={cn(
        "relative inline-grid select-none items-center rounded-full bg-[#1c1c1c] dark:bg-[#242424] dark:ring-1 dark:ring-white/10",
        "font-sans antialiased",
        disabled && "opacity-50 cursor-not-allowed",
        preset.container,
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
        ...style,
      }}
    >
      {/* Sliding active pill */}
      <div
        aria-hidden="true"
        className="pointer-events-none relative col-span-full row-start-1 h-full w-full"
      >
        <div
          className={cn(
            "h-full rounded-full bg-[#e9e9e9] dark:bg-[#f2f2f2] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          )}
          style={{
            width: `${100 / count}%`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />
      </div>

      {/* Interactive segments */}
      {options.map((option, idx) => {
        const isSelected = option.value === activeValue;
        const isOptionDisabled = disabled || Boolean(option.disabled);

        return (
          <button
            key={option.value}
            ref={(el) => {
              buttonRefs.current[idx] = el;
            }}
            id={`${groupId}-${option.value}`}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={
              option.ariaLabel ??
              (option.index ? `${option.label} ${option.index}` : option.label)
            }
            disabled={isOptionDisabled}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => selectOption(option.value, option.disabled)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            style={{ gridColumnStart: idx + 1, gridRowStart: 1 }}
            className={cn(
              "relative z-10 flex h-full w-full items-center justify-center rounded-full px-3",
              "font-medium transition-colors duration-200 motion-reduce:transition-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f8f8f8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1c1c1c] dark:focus-visible:ring-white dark:focus-visible:ring-offset-[#242424]",
              isOptionDisabled
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer",
              isSelected
                ? "text-[#090909] dark:text-[#090909]"
                : "text-[#f8f8f8] hover:text-white/90 dark:text-[#f8f8f8] dark:hover:text-white"
            )}
          >
            <span className={cn("inline-flex items-baseline", preset.label)}>
              <span>{option.label}</span>
              {option.index !== undefined && (
                <sup
                  className={cn(
                    "relative font-medium tabular-nums",
                    preset.index
                  )}
                >
                  {option.index}
                </sup>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedModeToggle;
