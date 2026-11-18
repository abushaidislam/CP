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
  /** Enable frosted glassmorphism surface with specular rim highlights */
  glass?: boolean;
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

const MORPH_SPRING = {
  type: "spring" as const,
  stiffness: 320,
  damping: 32,
  mass: 0.88,
};

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
        className="absolute inset-x-3 -bottom-2 h-7 will-change-transform"
        initial={false}
        animate={
          isPulsing
            ? {
                opacity: [0, 0.9, 0.96, 0, 0],
                scaleX: [0.94, 1, 1.03, 0.96, 0.94],
              }
            : {
                opacity: isSteady ? 0.92 : 0,
                scaleX: isSteady ? 1 : 0.95,
              }
        }
        transition={
          isPulsing
            ? {
                duration: 3.4,
                repeat: Infinity,
                times: [0, 0.22, 0.56, 0.8, 1],
                ease: "easeInOut",
              }
            : {
                duration: reducedMotion ? 0 : 0.4,
                ease: [0.22, 1, 0.36, 1],
              }
        }
      >
        <motion.div
          className="relative h-full w-full blur-[11px] will-change-transform"
          animate={
            active && !reducedMotion
              ? { x: ["-7%", "7%", "-7%"] }
              : { x: "0%" }
          }
          transition={
            active && !reducedMotion
              ? {
                  duration: 6.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              : { duration: 0 }
          }
        >
          <span
            className="absolute bottom-0 left-[8%] h-5 w-[28%] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(56,189,248,0.65) 0%, rgba(16,185,129,0.5) 55%, transparent 100%)",
            }}
          />
          <span
            className="absolute bottom-0 left-[29%] h-6 w-[32%] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(236,72,153,0.75) 0%, rgba(168,85,247,0.54) 55%, transparent 100%)",
            }}
          />
          <span
            className="absolute bottom-0 left-[52%] h-5 w-[28%] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(245,158,11,0.54) 0%, rgba(59,130,246,0.48) 60%, transparent 100%)",
            }}
          />
        </motion.div>
      </motion.div>

      {/* Crisp 1px bottom-rim specular gradient line */}
      <motion.div
        className="absolute inset-x-4 bottom-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.7) 20%, rgba(16,185,129,0.78) 36%, rgba(236,72,153,0.95) 54%, rgba(245,158,11,0.72) 72%, rgba(59,130,246,0.58) 86%, transparent 100%)",
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
                times: [0, 0.22, 0.56, 0.8, 1],
                ease: "easeInOut",
              }
            : {
                duration: reducedMotion ? 0 : 0.4,
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
      glass = true,
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
      Math.max(
        MIN_EXPANDED_WIDTH,
        Number.isFinite(expandedWidth) ? expandedWidth : 340
      )
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

    const surfaceClasses = glass
      ? theme === "dark"
        ? cn(
            "bg-[#191919]/75 backdrop-blur-xl backdrop-saturate-150 text-zinc-100",
            "shadow-[0_12px_36px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.09)]",
            isFocused
              ? "border-white/[0.18]"
              : "border-white/[0.10] hover:border-white/[0.16]"
          )
        : theme === "light"
          ? cn(
              "bg-white/75 backdrop-blur-xl backdrop-saturate-150 text-zinc-900",
              "shadow-[0_8px_30px_rgba(0,0,0,0.06),inset_0_1px_0_0_rgba(255,255,255,0.85)]",
              isFocused
                ? "border-zinc-900/[0.16]"
                : "border-zinc-900/[0.08] hover:border-zinc-900/[0.14]"
            )
          : cn(
              "bg-white/75 dark:bg-[#191919]/75 backdrop-blur-xl backdrop-saturate-150 text-zinc-900 dark:text-zinc-100",
              "shadow-[0_8px_30px_rgba(0,0,0,0.06),inset_0_1px_0_0_rgba(255,255,255,0.85)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.09)]",
              isFocused
                ? "border-zinc-900/[0.16] dark:border-white/[0.18]"
                : "border-zinc-900/[0.08] dark:border-white/[0.10] hover:border-zinc-900/[0.14] dark:hover:border-white/[0.16]"
            )
      : theme === "dark"
        ? cn(
            "bg-[#191919] text-zinc-100",
            isFocused
              ? "border-white/[0.16]"
              : "border-white/[0.08] hover:border-white/[0.14]"
          )
        : theme === "light"
          ? cn(
              "bg-white text-zinc-900 shadow-sm",
              isFocused
                ? "border-zinc-300"
                : "border-zinc-200/90 hover:border-zinc-300"
            )
          : cn(
              "bg-white dark:bg-[#191919] text-zinc-900 dark:text-zinc-100 shadow-sm dark:shadow-none",
              isFocused
                ? "border-zinc-300 dark:border-white/[0.16]"
                : "border-zinc-200/90 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/[0.14]"
            );

    const iconClasses =
      theme === "dark"
        ? "text-zinc-400 group-hover:text-zinc-200"
        : theme === "light"
          ? "text-zinc-500 group-hover:text-zinc-800"
          : "text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200";

    const inputTextClasses =
      theme === "dark"
        ? "text-zinc-100 placeholder:text-[#737373] caret-white"
        : theme === "light"
          ? "text-zinc-900 placeholder:text-zinc-400 caret-zinc-900"
          : "text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-[#737373] caret-zinc-900 dark:caret-white";

    const clearBtnClasses =
      theme === "dark"
        ? "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.1]"
        : theme === "light"
          ? "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-900/[0.06]"
          : "text-zinc-400 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100 hover:bg-zinc-900/[0.06] dark:hover:bg-white/[0.1]";

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
          transition={shouldReduceMotion ? { duration: 0 } : MORPH_SPRING}
          style={{ height: COLLAPSED_SIZE, maxWidth: "100%" }}
          className={cn(
            "group relative flex items-center overflow-hidden rounded-full border transition-colors duration-200 will-change-[width]",
            surfaceClasses,
            disabled && "pointer-events-none opacity-50",
            className
          )}
        >
          {/* Subtle top specular glass sheen */}
          {glass && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-60 dark:via-white/20"
            />
          )}

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
            <motion.span
              className="inline-flex items-center justify-center"
              whileHover={shouldReduceMotion ? undefined : { scale: 1.07 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.92 }}
              animate={
                shouldReduceMotion
                  ? undefined
                  : { rotate: isExpanded ? 0 : -6 }
              }
              transition={{
                type: "spring",
                stiffness: 420,
                damping: 26,
              }}
            >
              <Search className="h-[18px] w-[18px]" strokeWidth={2} />
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                key="search-input-wrap"
                initial={
                  shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -6 }
                }
                animate={{ opacity: 1, x: 0 }}
                exit={
                  shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -4 }
                }
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : {
                        duration: 0.22,
                        ease: [0.22, 1, 0.36, 1],
                      }
                }
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
                      initial={
                        shouldReduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, scale: 0.78 }
                      }
                      animate={{ opacity: 1, scale: 1 }}
                      exit={
                        shouldReduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, scale: 0.78 }
                      }
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 460, damping: 28 }
                      }
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