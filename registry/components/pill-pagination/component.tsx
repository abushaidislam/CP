"use client";

import React, { useId, useState, useEffect, useMemo } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(" ");
}

export type PaginationTheme = "light" | "dark";

export interface TactilePaginationProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  /** Total number of pages */
  totalPages?: number;
  /** Controlled current page (1-indexed) */
  page?: number;
  /** Initial page when uncontrolled (1-indexed) */
  defaultPage?: number;
  /** Callback fired when page changes */
  onPageChange?: (page: number) => void;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Controlled active page size */
  pageSize?: number;
  /** Initial page size when uncontrolled */
  defaultPageSize?: number;
  /** Callback fired when page size changes */
  onPageSizeChange?: (pageSize: number) => void;
  /** Toggle visibility of the bottom row-count selector pill */
  showPageSizeSelector?: boolean;
  /** Label suffix shown on the active page size pill */
  pageSizeUnitLabel?: string;
  /** Number of sibling pages shown around the active page */
  siblingCount?: number;
  /** Color theme variant */
  theme?: PaginationTheme;
  /** Disable all pagination interactions */
  disabled?: boolean;
}

type PageItem = number | "ellipsis-left" | "ellipsis-right";

function buildPageRange(
  currentPage: number,
  totalPages: number,
  siblingCount: number
): PageItem[] {
  const safeTotal = Math.max(1, Math.floor(totalPages));
  const safeCurrent = Math.min(Math.max(1, currentPage), safeTotal);

  // Reference shows 5 visible slots at page 1 of 10: [1, 2, 3, ..., 10]
  const totalSlots = siblingCount * 2 + 3;

  if (safeTotal <= totalSlots + 2) {
    return Array.from({ length: safeTotal }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(safeCurrent - siblingCount, 1);
  const rightSibling = Math.min(safeCurrent + siblingCount, safeTotal);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < safeTotal - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftCount = Math.max(3, 2 * siblingCount + 1);
    const leftRange = Array.from({ length: leftCount }, (_, i) => i + 1);
    return [...leftRange, "ellipsis-right", safeTotal];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightCount = Math.max(3, 2 * siblingCount + 1);
    const rightRange = Array.from(
      { length: rightCount },
      (_, i) => safeTotal - rightCount + 1 + i
    );
    return [1, "ellipsis-left", ...rightRange];
  }

  const middleRange = Array.from(
    { length: rightSibling - leftSibling + 1 },
    (_, i) => leftSibling + i
  );
  return [1, "ellipsis-left", ...middleRange, "ellipsis-right", safeTotal];
}

const TactilePagination = React.forwardRef<HTMLElement, TactilePaginationProps>(
  (
    {
      totalPages = 10,
      page: controlledPage,
      defaultPage = 1,
      onPageChange,
      pageSizeOptions = [5, 10, 20],
      pageSize: controlledPageSize,
      defaultPageSize = 5,
      onPageSizeChange,
      showPageSizeSelector = true,
      pageSizeUnitLabel = "rows",
      siblingCount = 1,
      theme = "light",
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    const baseId = useId();
    const shouldReduceMotion = useReducedMotion();

    const safeTotalPages = Math.max(1, Math.floor(totalPages));
    const clampedDefaultPage = Math.min(
      Math.max(1, Math.floor(defaultPage)),
      safeTotalPages
    );

    const [internalPage, setInternalPage] = useState<number>(clampedDefaultPage);
    const isPageControlled = controlledPage !== undefined;
    const currentPage = Math.min(
      Math.max(1, Math.floor(isPageControlled ? controlledPage : internalPage)),
      safeTotalPages
    );

    const validOptions = useMemo(() => {
      const cleaned = pageSizeOptions.filter(
        (n) => typeof n === "number" && Number.isFinite(n) && n > 0
      );
      return cleaned.length > 0 ? cleaned : [5, 10, 20];
    }, [pageSizeOptions]);

    const initialSize = validOptions.includes(defaultPageSize)
      ? defaultPageSize
      : validOptions[0];

    const [internalPageSize, setInternalPageSize] = useState<number>(initialSize);
    const isSizeControlled = controlledPageSize !== undefined;
    const currentPageSize = isSizeControlled
      ? controlledPageSize
      : internalPageSize;

    useEffect(() => {
      if (!isPageControlled) {
        setInternalPage(clampedDefaultPage);
      }
    }, [clampedDefaultPage, isPageControlled]);

    useEffect(() => {
      if (!isSizeControlled) {
        setInternalPageSize(initialSize);
      }
    }, [initialSize, isSizeControlled]);

    const handlePageSelect = (nextPage: number) => {
      if (disabled) return;
      const clamped = Math.min(Math.max(1, nextPage), safeTotalPages);
      if (clamped === currentPage) return;
      if (!isPageControlled) {
        setInternalPage(clamped);
      }
      onPageChange?.(clamped);
    };

    const handlePageSizeSelect = (nextSize: number) => {
      if (disabled) return;
      if (nextSize === currentPageSize) return;
      if (!isSizeControlled) {
        setInternalPageSize(nextSize);
      }
      onPageSizeChange?.(nextSize);
    };

    const pageItems = useMemo(
      () => buildPageRange(currentPage, safeTotalPages, siblingCount),
      [currentPage, safeTotalPages, siblingCount]
    );

    const isDark = theme === "dark";
    const canGoPrev = !disabled && currentPage > 1;
    const canGoNext = !disabled && currentPage < safeTotalPages;

    const springTransition = shouldReduceMotion
      ? { duration: 0 }
      : { type: "spring" as const, stiffness: 520, damping: 38, mass: 0.8 };

    return (
      <nav
        ref={ref}
        aria-label="Pagination"
        className={cn(
          "inline-flex flex-col items-center gap-[22px] select-none",
          disabled && "opacity-60 pointer-events-none",
          className
        )}
        {...props}
      >
        {/* Top Pagination Bar */}
        <div
          className={cn(
            "inline-flex items-center gap-1 p-1 rounded-[14px] transition-colors",
            isDark
              ? "bg-[#232326] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_2px_6px_rgba(0,0,0,0.4)]"
              : "bg-[#dbdbdb] shadow-[inset_0_1px_1px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]"
          )}
        >
          {/* Prev Button */}
          <button
            type="button"
            onClick={() => handlePageSelect(currentPage - 1)}
            disabled={!canGoPrev}
            aria-label="Previous page"
            className={cn(
              "inline-flex items-center justify-center gap-1 h-[34px] px-3 rounded-[10px] text-[14px] font-medium leading-none tracking-[-0.01em] transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
              isDark
                ? "bg-[#323236] text-[#f4f4f5] shadow-[0_1px_2px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] focus-visible:ring-white/40"
                : "bg-[#ffffff] text-[#2c2827] shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(0,0,0,0.03)] focus-visible:ring-[#2c2827]/40",
              canGoPrev
                ? isDark
                  ? "hover:bg-[#3b3b40] active:scale-[0.97] cursor-pointer"
                  : "hover:bg-[#fafafa] active:scale-[0.97] cursor-pointer"
                : "opacity-55 cursor-not-allowed"
            )}
          >
            <ChevronLeft className="w-3.5 h-3.5 stroke-[2.2]" aria-hidden="true" />
            <span>Prev</span>
          </button>

          {/* Page Numbers */}
          <div className="inline-flex items-center gap-0.5 px-0.5">
            {pageItems.map((item) => {
              if (item === "ellipsis-left" || item === "ellipsis-right") {
                return (
                  <span
                    key={item}
                    aria-hidden="true"
                    className={cn(
                      "inline-flex items-center justify-center w-8 h-[34px] text-[14px] font-medium tracking-wider",
                      isDark ? "text-[#a1a1aa]" : "text-[#2c2827]/80"
                    )}
                  >
                    ...
                  </span>
                );
              }

              const isActive = item === currentPage;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => handlePageSelect(item)}
                  aria-label={`Page ${item}`}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative inline-flex items-center justify-center min-w-[34px] h-[34px] px-2 rounded-[10px] text-[14px] font-medium tabular-nums transition-colors duration-150 cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
                    isDark
                      ? "focus-visible:ring-white/40"
                      : "focus-visible:ring-[#2c2827]/40",
                    isActive
                      ? isDark
                        ? "text-[#18181b]"
                        : "text-[#ffffff]"
                      : isDark
                        ? "text-[#d4d4d8] hover:text-white"
                        : "text-[#2c2827] hover:text-black"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId={`${baseId}-active-page-pill`}
                      transition={springTransition}
                      className={cn(
                        "absolute inset-0 rounded-[10px]",
                        isDark
                          ? "bg-[#ffffff] shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
                          : "bg-[#2c2827] shadow-[0_1px_2px_rgba(0,0,0,0.18)]"
                      )}
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative z-10">{item}</span>
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={() => handlePageSelect(currentPage + 1)}
            disabled={!canGoNext}
            aria-label="Next page"
            className={cn(
              "inline-flex items-center justify-center gap-1 h-[34px] px-3 rounded-[10px] text-[14px] font-medium leading-none tracking-[-0.01em] transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
              isDark
                ? "bg-[#323236] text-[#f4f4f5] shadow-[0_1px_2px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] focus-visible:ring-white/40"
                : "bg-[#ffffff] text-[#2c2827] shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(0,0,0,0.03)] focus-visible:ring-[#2c2827]/40",
              canGoNext
                ? isDark
                  ? "hover:bg-[#3b3b40] active:scale-[0.97] cursor-pointer"
                  : "hover:bg-[#fafafa] active:scale-[0.97] cursor-pointer"
                : "opacity-55 cursor-not-allowed"
            )}
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[2.2]" aria-hidden="true" />
          </button>
        </div>

        {/* Bottom Rows-Per-Page Selector Pill */}
        <AnimatePresence initial={false}>
          {showPageSizeSelector && (
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={
                shouldReduceMotion ? { duration: 0 } : { duration: 0.18, ease: "easeOut" }
              }
              role="group"
              aria-label="Rows per page"
              className={cn(
                "inline-flex items-center gap-0.5 p-1 rounded-[14px] transition-colors",
                isDark
                  ? "bg-[#232326] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_2px_6px_rgba(0,0,0,0.4)]"
                  : "bg-[#dbdbdb] shadow-[inset_0_1px_1px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]"
              )}
            >
              {validOptions.map((size) => {
                const isSelected = size === currentPageSize;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handlePageSizeSelect(size)}
                    aria-pressed={isSelected}
                    aria-label={`${size} ${pageSizeUnitLabel} per page`}
                    className={cn(
                      "relative inline-flex items-center justify-center h-[34px] px-3 rounded-[10px] text-[14px] tabular-nums transition-colors duration-150 cursor-pointer",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
                      isDark
                        ? "focus-visible:ring-white/40"
                        : "focus-visible:ring-[#2c2827]/40",
                      isSelected
                        ? isDark
                          ? "font-semibold text-[#ffffff]"
                          : "font-semibold text-[#2c2827]"
                        : isDark
                          ? "font-medium text-[#d4d4d8] hover:text-white"
                          : "font-medium text-[#2c2827] hover:text-black"
                    )}
                  >
                    {isSelected && (
                      <motion.span
                        layoutId={`${baseId}-active-size-pill`}
                        transition={springTransition}
                        className={cn(
                          "absolute inset-0 rounded-[10px]",
                          isDark
                            ? "bg-[#323236] shadow-[0_1px_2px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]"
                            : "bg-[#ffffff] shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(0,0,0,0.03)]"
                        )}
                        aria-hidden="true"
                      />
                    )}
                    <span className="relative z-10 whitespace-nowrap">
                      {isSelected ? `${size} ${pageSizeUnitLabel}` : size}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    );
  }
);

TactilePagination.displayName = "TactilePagination";

export { TactilePagination as component, TactilePagination as Component, TactilePagination };
export default TactilePagination;