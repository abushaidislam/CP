"use client";

import React, { useId, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export type PaginationPageItem = number | "ellipsis-start" | "ellipsis-end";

export interface PillPaginationProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onChange"> {
  /** Current active 1-based page number (controlled). */
  page?: number;
  /** Initial active 1-based page number (uncontrolled). */
  defaultPage?: number;
  /** Total number of pages available. */
  totalPages?: number;
  /** Callback fired when the active page changes. */
  onPageChange?: (page: number) => void;
  /** Current selected page size (controlled). */
  pageSize?: number;
  /** Initial selected page size (uncontrolled). */
  defaultPageSize?: number;
  /** Available page size options shown in the lower pill bar. */
  pageSizeOptions?: number[];
  /** Suffix appended only to the active page size pill (e.g., "rows"). */
  pageSizeUnitLabel?: string;
  /** Callback fired when the page size changes. */
  onPageSizeChange?: (pageSize: number) => void;
  /** Whether to render the secondary page size selector pill bar. */
  showPageSizeSelector?: boolean;
  /** Number of sibling pages displayed adjacent to the current page. */
  siblingCount?: number;
  /** Accessible label for the pagination navigation landmark. */
  ariaLabel?: string;
}

function buildPageRange(
  currentPage: number,
  totalPages: number,
  siblingCount: number
): PaginationPageItem[] {
  const safeTotal = Math.max(1, Math.floor(totalPages));
  const safeCurrent = Math.min(Math.max(1, Math.floor(currentPage)), safeTotal);
  const safeSiblings = Math.max(0, Math.floor(siblingCount));

  // Total visible slots before truncation: first + last + current + 2*siblings + 2 ellipses
  const totalSlots = safeSiblings * 2 + 5;

  if (safeTotal <= totalSlots) {
    return Array.from({ length: safeTotal }, (_, index) => index + 1);
  }

  const leftSiblingIndex = Math.max(safeCurrent - safeSiblings, 1);
  const rightSiblingIndex = Math.min(safeCurrent + safeSiblings, safeTotal);

  const shouldShowLeftEllipsis = leftSiblingIndex > 2;
  const shouldShowRightEllipsis = rightSiblingIndex < safeTotal - 1;

  if (!shouldShowLeftEllipsis && shouldShowRightEllipsis) {
    const leftItemCount = 3 + 2 * safeSiblings;
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, "ellipsis-end", safeTotal];
  }

  if (shouldShowLeftEllipsis && !shouldShowRightEllipsis) {
    const rightItemCount = 3 + 2 * safeSiblings;
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => safeTotal - rightItemCount + i + 1
    );
    return [1, "ellipsis-start", ...rightRange];
  }

  const middleRange = Array.from(
    { length: rightSiblingIndex - leftSiblingIndex + 1 },
    (_, i) => leftSiblingIndex + i
  );
  return [1, "ellipsis-start", ...middleRange, "ellipsis-end", safeTotal];
}

export const PillPagination = React.forwardRef<HTMLElement, PillPaginationProps>(
  (
    {
      page: controlledPage,
      defaultPage = 1,
      totalPages = 10,
      onPageChange,
      pageSize: controlledPageSize,
      defaultPageSize = 5,
      pageSizeOptions = [5, 10, 20],
      pageSizeUnitLabel = "rows",
      onPageSizeChange,
      showPageSizeSelector = true,
      siblingCount = 1,
      ariaLabel = "Pagination",
      className,
      ...rest
    },
    ref
  ) => {
    const instanceId = useId();
    const shouldReduceMotion = useReducedMotion();

    const safeTotalPages = Math.max(1, Math.floor(totalPages));

    const [uncontrolledPage, setUncontrolledPage] = useState<number>(() =>
      Math.min(Math.max(1, Math.floor(defaultPage)), safeTotalPages)
    );
    const [uncontrolledPageSize, setUncontrolledPageSize] = useState<number>(
      () =>
        pageSizeOptions.includes(defaultPageSize)
          ? defaultPageSize
          : pageSizeOptions[0] ?? 5
    );

    const activePage = Math.min(
      Math.max(
        1,
        Math.floor(
          controlledPage !== undefined ? controlledPage : uncontrolledPage
        )
      ),
      safeTotalPages
    );

    const activePageSize =
      controlledPageSize !== undefined
        ? controlledPageSize
        : uncontrolledPageSize;

    const pageItems = useMemo(
      () => buildPageRange(activePage, safeTotalPages, siblingCount),
      [activePage, safeTotalPages, siblingCount]
    );

    const handlePageSelect = (nextPage: number) => {
      const clamped = Math.min(Math.max(1, nextPage), safeTotalPages);
      if (clamped === activePage) return;
      if (controlledPage === undefined) {
        setUncontrolledPage(clamped);
      }
      onPageChange?.(clamped);
    };

    const handlePageSizeSelect = (nextSize: number) => {
      if (nextSize === activePageSize) return;
      if (controlledPageSize === undefined) {
        setUncontrolledPageSize(nextSize);
      }
      onPageSizeChange?.(nextSize);
    };

    const isPrevDisabled = activePage <= 1;
    const isNextDisabled = activePage >= safeTotalPages;

    const springTransition = shouldReduceMotion
      ? { duration: 0 }
      : { type: "spring" as const, stiffness: 460, damping: 36, mass: 0.8 };

    return (
      <nav
        ref={ref}
        aria-label={ariaLabel}
        className={cn(
          "inline-flex flex-col items-center gap-[22px] select-none font-sans antialiased",
          className
        )}
        {...rest}
      >
        {/* Primary Page Navigation Pill Track */}
        <div
          role="group"
          aria-label="Page navigation"
          className={cn(
            "inline-flex items-center p-[6px] rounded-[20px]",
            "bg-[#DCDCDC] dark:bg-[#232326]",
            "border border-black/[0.03] dark:border-white/[0.06]"
          )}
        >
          {/* Previous Button */}
          <button
            type="button"
            onClick={() => handlePageSelect(activePage - 1)}
            disabled={isPrevDisabled}
            aria-label="Go to previous page"
            className={cn(
              "inline-flex items-center justify-center gap-[6px] h-[42px] px-[16px] rounded-[14px]",
              "text-[15px] font-medium leading-none tracking-[-0.01em]",
              "bg-[#FAFAFA] text-[#171717] dark:bg-[#141416] dark:text-[#F4F4F5]",
              "shadow-[0_1px_2px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.02)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)]",
              "transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/40 dark:focus-visible:ring-white/40",
              isPrevDisabled
                ? "opacity-60 cursor-not-allowed"
                : "hover:bg-white dark:hover:bg-[#1C1C1F] active:scale-[0.98] cursor-pointer"
            )}
          >
            <ChevronLeft className="w-[15px] h-[15px] stroke-[2.2] opacity-85" />
            <span>Prev</span>
          </button>

          {/* Numeric Page Items */}
          <div className="inline-flex items-center gap-[4px] px-[8px]">
            {pageItems.map((item) => {
              if (item === "ellipsis-start" || item === "ellipsis-end") {
                return (
                  <span
                    key={item}
                    aria-hidden="true"
                    className="inline-flex items-center justify-center w-[36px] h-[42px] text-[15px] font-medium text-[#222222] dark:text-[#A1A1AA] tracking-[0.04em]"
                  >
                    ...
                  </span>
                );
              }

              const isActive = item === activePage;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => handlePageSelect(item)}
                  aria-label={`Page ${item}`}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative inline-flex items-center justify-center min-w-[42px] h-[42px] px-[10px] rounded-[14px]",
                    "text-[15px] font-medium leading-none tabular-nums",
                    "transition-colors duration-150 cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/40 dark:focus-visible:ring-white/40",
                    isActive
                      ? "text-white dark:text-[#111113]"
                      : "text-[#1E1E1E] hover:text-black dark:text-[#D4D4D8] dark:hover:text-white"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId={`${instanceId}-active-page`}
                      transition={springTransition}
                      className="absolute inset-0 rounded-[14px] bg-[#141414] dark:bg-[#F4F4F5] shadow-[0_2px_6px_rgba(0,0,0,0.18)]"
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
            onClick={() => handlePageSelect(activePage + 1)}
            disabled={isNextDisabled}
            aria-label="Go to next page"
            className={cn(
              "inline-flex items-center justify-center gap-[6px] h-[42px] px-[16px] rounded-[14px]",
              "text-[15px] font-medium leading-none tracking-[-0.01em]",
              "bg-[#FAFAFA] text-[#171717] dark:bg-[#141416] dark:text-[#F4F4F5]",
              "shadow-[0_1px_2px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.02)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)]",
              "transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/40 dark:focus-visible:ring-white/40",
              isNextDisabled
                ? "opacity-60 cursor-not-allowed"
                : "hover:bg-white dark:hover:bg-[#1C1C1F] active:scale-[0.98] cursor-pointer"
            )}
          >
            <span>Next</span>
            <ChevronRight className="w-[15px] h-[15px] stroke-[2.2] opacity-85" />
          </button>
        </div>

        {/* Secondary Rows Per Page Segmented Pill Track */}
        {showPageSizeSelector && pageSizeOptions.length > 0 && (
          <div
            role="radiogroup"
            aria-label="Rows per page"
            className={cn(
              "inline-flex items-center p-[6px] gap-[4px] rounded-[20px]",
              "bg-[#DCDCDC] dark:bg-[#232326]",
              "border border-black/[0.03] dark:border-white/[0.06]"
            )}
          >
            {pageSizeOptions.map((size) => {
              const isSelected = size === activePageSize;
              const label =
                isSelected && pageSizeUnitLabel
                  ? `${size} ${pageSizeUnitLabel}`
                  : `${size}`;

              return (
                <button
                  key={size}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`${size} ${pageSizeUnitLabel || "rows"} per page`}
                  onClick={() => handlePageSizeSelect(size)}
                  className={cn(
                    "relative inline-flex items-center justify-center h-[42px] px-[16px] rounded-[14px]",
                    "text-[15px] leading-none tracking-[-0.01em] tabular-nums whitespace-nowrap",
                    "transition-colors duration-150 cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717]/40 dark:focus-visible:ring-white/40",
                    isSelected
                      ? "font-semibold text-[#141414] dark:text-[#F4F4F5]"
                      : "font-medium text-[#222222] hover:text-black dark:text-[#A1A1AA] dark:hover:text-white"
                  )}
                >
                  {isSelected && (
                    <motion.span
                      layoutId={`${instanceId}-active-size`}
                      transition={springTransition}
                      className="absolute inset-0 rounded-[14px] bg-[#FAFAFA] dark:bg-[#141416] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.02)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)]"
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </button>
              );
            })}
          </div>
        )}
      </nav>
    );
  }
);

PillPagination.displayName = "PillPagination";

export { PillPagination as component, PillPagination as Component };
export default PillPagination;