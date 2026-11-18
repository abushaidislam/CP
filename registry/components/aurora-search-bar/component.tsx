"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, X } from "lucide-react";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type AuroraMode = "pulse" | "always" | "focus" | "off";
export type AuroraSearchTheme = "auto" | "light" | "dark";

export interface AuroraSearchBarProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "defaultValue" | "onChange" | "size"
  > {
  /** Controlled search query value */
  value?: string;
  /** Uncontrolled initial search query value */
  defaultValue?: string;
  /** Callback fired when the search query changes */
  onValueChange?: (value: string) => void;
  /** Callback fired when the user presses Enter to submit */
  onSearch?: (value: string) => void;
  /** Controlled expanded state */
  expanded?: boolean;
  /** Initial expanded state when uncontrolled */
  defaultExpanded?: boolean;
  /** Callback fired when expanded/collapsed state changes */
  onExpandedChange?: (expanded: boolean) => void;
  /** Expanded pill width in pixels */
  expandedWidth?: number;
  /** Bottom-edge aurora shimmer behavior */
  auroraMode?: AuroraMode;
  /** Color theme override; defaults to "auto" to follow Tailwind dark mode */
  theme?: AuroraSearchTheme;
  /** Collapse the pill when clicking outside while the input is empty */
  collapseOnClickOutside?: boolean;
  /** Additional classes for the outer pill container */
  className?: string;
  /** Additional classes for the input element */
  inputClassName?: string;
}

const COLLAPSED_SIZE = 48;
const MIN_EXPANDED_WIDTH = 200;
const MAX_EXPANDED_WIDTH = 640;

const AuroraEdgeGlow: React.FC<{
  active: boolean;
  mode: AuroraMode;
  reducedMotion: boolean;
}> = ({ active, mode, reducedMotion }) => {
  if (mode === "off") return null;

  const isPulsing = mode === "pulse" && active && !reducedMotion;
  const isSteady =
    (mode === "always" || mode === "focus" || (mode === "pulse" && reducedMotion)) &&
    active;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
    >
      {/* Soft diffused multi-color aurora plumes rising from the bottom inner edge */}
      <motion.div
        className="absolute inset-x-3 -bottom-2 h-7"
        initial={false}
        animate={
          isPulsing
            ? {
                opacity: [0, 0.92, 0.96, 0, 0],
                scaleX: [0.94, 1, 1.03, 0.96, 0.94],
              }
            : {
                opacity: isSteady ? 0.9 : 0,
                scaleX: isSteady ? 1 : 0.95,
              }
        }
        transition={
          isPulsing
            ? {
                duration: 3.4,
                repeat: Infinity,
                times: [0, 0.2, 0.55, 0.78, 1],
                ease: "easeInOut",
              }
            : {
                duration: reducedMotion ? 0 : 0.35,
                ease: [0.22, 1, 0.36, 1],
              }
        }
      >
        <motion.div
          className="relative h-full w-full blur-[10px]"
          animate={
            active && !reducedMotion
              ? { x: ["-6%", "6%", "-6%"] }
              : { x: "0%" }
          }
          transition={
            active && !reducedMotion
              ? {
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              : { duration: 0 }
          }
        >
          <span
            className="absolute bottom-0 left-[10%] h-5 w-[26%] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(56,189,248,0.62) 0%, rgba(16,185,129,0.48) 55%, transparent 100%)",
            }}
          />
          <span
            className="absolute bottom-0 left-[30%] h-6 w-[30%] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(236,72,153,0.72) 0%, rgba(168,85,247,0.52) 55%, transparent 100%)",
            }}
          />
          <span
            className="absolute bottom-0 left-[52%] h-5 w-[26%] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(245,158,11,0.52) 0%, rgba(59,130,246,0.46) 60%, transparent 100%)",
            }}
          />
        </motion.div>
      </motion.div>

      {/* Crisp 1px bottom-rim specular gradient line */}
      <motion.div
        className="absolute inset-x-4 bottom-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.65) 20%, rgba(16,185,129,0.75) 36%, rgba(236,72,153,0.92) 54%, rgba(245,158,11,0.7) 72%, rgba(59,130,246,0.55) 86%, transparent 100%)",
        }}
        initial={false}
        animate={
          isPulsing
            ? {
                opacity: [0, 0.95, 1, 0, 0],
              }
            : {
                opacity: isSteady ? 0.95 : 0,
              }
        }
        transition={
          isPulsing
            ? {
                duration: 3.4,
                repeat: Infinity,
                times: [0, 0.2, 0.55, 0.78, 1],
                ease: "easeInOut",
              }
            : {
                duration: reducedMotion ? 0 : 0.35,
                ease: [0.22, 1, 0.36, 1],
              }
        }
      />
    </div>
  );
};

export const AuroraSearchBar = forwardRef<HTMLInputElement, AuroraSearchBarProps>(
  (
    {
      value: controlledValue,
      defaultValue = "",
      onValueChange,
      onSearch,
      expanded: controlledExpanded,
      defaultExpanded = false,
      onExpandedChange,
      expandedWidth = 340,
      auroraMode = "pulse",
      theme = "auto",
      collapseOnClickOutside = true,
      placeholder = "Search",
      disabled = false,
      className,
      inputClassName,
      onFocus,
      onBlur,
      onKeyDown,
      "aria-label": ariaLabel = "Search",
      ...restInputProps
    },
    forwardedRef
  ) => {
    const rawId = useId();
    const inputId = `aurora-search-${rawId.replace(/:/g, "")}`;
    const shouldReduceMotion = Boolean(useReducedMotion());

    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
    const [uncontrolledExpanded, setUncontrolledExpanded] =
      useState(defaultExpanded);
    const [isFocused, setIsFocused] = useState(false);

    const isValueControlled = controlledValue !== undefined;
    const isExpandedControlled = controlledExpanded !== undefined;

    const currentValue = isValueControlled ? controlledValue : uncontrolledValue;
    const isExpanded = isExpandedControlled
      ? controlledExpanded
      : uncontrolledExpanded;

    const containerRef = useRef<HTMLDivElement>(null);
    const internalInputRef = useRef<HTMLInputElement>(null);

    const setInputRef = useCallback(
      (node: HTMLInputElement | null) => {
        internalInputRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      },
      [forwardedRef]
    );

    const clampedWidth = Math.min(
      MAX_EXPANDED_WIDTH,
      Math.max(MIN_EXPANDED_WIDTH, Number.isFinite(expandedWidth) ? expandedWidth : 340)
    );

    const setExpandedState = useCallback(
      (next: boolean) => {
        if (!isExpandedControlled) {
          setUncontrolledExpanded(next);
        }
        onExpandedChange?.(next);
      },
      [isExpandedControlled, onExpandedChange]
    );

    const setValueState = useCallback(
      (next: string) => {
        if (!isValueControlled) {
          setUncontrolledValue(next);
        }
        onValueChange?.(next);
      },
      [isValueControlled, onValueChange]
    );

    const focusInputSoon = useCallback(() => {
      requestAnimationFrame(() => {
        internalInputRef.current?.focus();
      });
    }, []);

    useEffect(() => {
      if (!collapseOnClickOutside || !isExpanded) return;

      const handlePointerDown = (event: PointerEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node) &&
          currentValue.length === 0
        ) {
          setExpandedState(false);
        }
      };

      document.addEventListener("pointerdown", handlePointerDown);
      return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, [collapseOnClickOutside, isExpanded, currentValue.length, setExpandedState]);

    const handleTriggerClick = () => {
      if (disabled) return;
      if (!isExpanded) {
        setExpandedState(true);
        focusInputSoon();
      } else if (currentValue.length === 0) {
        setExpandedState(false);
      } else {
        onSearch?.(currentValue);
      }
    };

    const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      setValueState("");
      internalInputRef.current?.focus();
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (currentValue.length > 0) {
          setValueState("");
        } else {
          setExpandedState(false);
          internalInputRef.current?.blur();
        }
      } else if (e.key === "Enter") {
        onSearch?.(currentValue);
      }
      onKeyDown?.(e);
    };

    const auroraActive =
      isExpanded &&
      (auroraMode === "always" ||
        auroraMode === "pulse" ||
        (auroraMode === "focus" && (isFocused || currentValue.length > 0)));

    const surfaceClasses =
      theme === "dark"
        ? "bg-[#191919] border-white/[0.08] text-zinc-100 hover:border-white/[0.14]"
        : theme === "light"
          ? "bg-white border-zinc-200/90 text-zinc-900 shadow-sm hover:border-zinc-300"
          : "bg-white dark:bg-[#191919] border-zinc-200/90 dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100 shadow-sm dark:shadow-none hover:border-zinc-300 dark:hover:border-white/[0.14]";

    const iconClasses =
      theme === "dark"
        ? "text-zinc-500 group-hover:text-zinc-300"
        : theme === "light"
          ? "text-zinc-400 group-hover:text-zinc-700"
          : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300";

    const inputTextClasses =
      theme === "dark"
        ? "text-zinc-100 placeholder:text-[#6b6b6b] caret-white"
        : theme === "light"
          ? "text-zinc-900 placeholder:text-zinc-400 caret-zinc-900"
          : "text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-[#6b6b6b] caret-zinc-900 dark:caret-white";

    const clearBtnClasses =
      theme === "dark"
        ? "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.08]"
        : theme === "light"
          ? "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
          : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.08]";

    return (
      <div
        ref={containerRef}
        className="inline-flex max-w-full items-center justify-center"
      >
        <motion.div
          role="search"
          aria-label={ariaLabel}
          initial={false}
          animate={{
            width: isExpanded ? clampedWidth : COLLAPSED_SIZE,
          }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                  type: "spring",
                  stiffness: 380,
                  damping: 34,
                  mass: 0.85,
                }
          }
          style={{ height: COLLAPSED_SIZE, maxWidth: "100%" }}
          className={cn(
            "group relative flex items-center overflow-hidden rounded-full border transition-colors duration-200",
            surfaceClasses,
            disabled && "pointer-events-none opacity-50",
            className
          )}
        >
          <AuroraEdgeGlow
            active={auroraActive}
            mode={auroraMode}
            reducedMotion={shouldReduceMotion}
          />

          <button
            type="button"
            onClick={handleTriggerClick}
            disabled={disabled}
            aria-expanded={isExpanded}
            aria-controls={inputId}
            aria-label={
              isExpanded
                ? currentValue.length > 0
                  ? "Submit search"
                  : "Collapse search"
                : "Expand search"
            }
            className={cn(
              "relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-zinc-400/60",
              iconClasses
            )}
          >
            <Search className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>

          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                key="search-input-wrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.18,
                  ease: "easeOut",
                }}
                className="relative z-10 flex min-w-0 flex-1 items-center pr-3"
              >
                <input
                  {...restInputProps}
                  id={inputId}
                  ref={setInputRef}
                  type="search"
                  value={currentValue}
                  disabled={disabled}
                  placeholder={placeholder}
                  aria-label={ariaLabel}
                  onChange={(e) => setValueState(e.target.value)}
                  onFocus={(e) => {
                    setIsFocused(true);
                    onFocus?.(e);
                  }}
                  onBlur={(e) => {
                    setIsFocused(false);
                    onBlur?.(e);
                  }}
                  onKeyDown={handleInputKeyDown}
                  className={cn(
                    "h-full w-full min-w-0 bg-transparent text-[15px] font-normal tracking-[-0.01em] outline-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
                    inputTextClasses,
                    inputClassName
                  )}
                />

                <AnimatePresence>
                  {currentValue.length > 0 && (
                    <motion.button
                      type="button"
                      onClick={handleClear}
                      aria-label="Clear search"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.14 }}
                      className={cn(
                        "ml-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/60",
                        clearBtnClasses
                      )}
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2} />
                    </motion.button>
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

AuroraSearchBar.displayName = "AuroraSearchBar";

export { AuroraSearchBar as component, AuroraSearchBar as Component };
export default AuroraSearchBar;