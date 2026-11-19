"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, FileText, RotateCcw } from "lucide-react";

function cn(...inputs: Array<string | undefined | null | false>): string {
  return inputs.filter(Boolean).join(" ");
}

export type ReceiptStatus = "ready" | "printing" | "printed";

export interface ReceiptLineItem {
  id?: string;
  name: string;
  price: number;
  quantity?: number;
}

export interface ThermalReceiptProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onReset"> {
  /** Header title displayed on the top-left of the shell */
  title?: string;
  /** Order identifier displayed in the header pill and receipt metadata */
  orderNumber?: string;
  /** Merchant or store name printed at the top of the receipt */
  merchantName?: string;
  /** Location or branch subtitle printed below the merchant name */
  merchantLocation?: string;
  /** Formatted date and time string printed on the receipt */
  timestamp?: string;
  /** Optional table or counter label appended to the order line */
  tableLabel?: string;
  /** Line items included in the order */
  items?: ReceiptLineItem[];
  /** Currency symbol prepended to monetary amounts */
  currencySymbol?: string;
  /** Service charge rate as a decimal (e.g., 0.1 for 10%) */
  serviceChargeRate?: number;
  /** Tax rate as a decimal (e.g., 0.05 for 5%) */
  taxRate?: number;
  /** Closing message printed above the payment section */
  thankYouMessage?: string;
  /** Caption displayed above the QR code */
  paymentCaption?: string;
  /** Payment handle / UPI ID displayed below the QR code (click to copy) */
  paymentHandle?: string;
  /** Toggle visibility of the scan-to-pay QR section */
  showQrCode?: boolean;
  /** Milliseconds between each thermally printed line */
  printSpeed?: number;
  /** Automatically begin printing when mounted */
  autoPrint?: boolean;
  /** Controlled receipt lifecycle state */
  status?: ReceiptStatus;
  /** Initial uncontrolled receipt lifecycle state */
  defaultStatus?: ReceiptStatus;
  /** Callback fired whenever the receipt status transitions */
  onStatusChange?: (status: ReceiptStatus) => void;
  /** Callback fired when printing is triggered */
  onPrint?: () => void;
  /** Callback fired when the receipt is torn off and reset */
  onTearOff?: () => void;
}

const DEFAULT_ITEMS: ReceiptLineItem[] = [
  { id: "vietnamese-coffee", name: "Vietnamese Coffee", price: 280 },
  { id: "cinnamon-roll", name: "Cinnamon Roll", price: 150 },
];

const SMOOTH_SPRING = {
  type: "spring" as const,
  stiffness: 320,
  damping: 34,
  mass: 0.9,
};

function formatCurrency(amount: number, symbol: string): string {
  return `${symbol}${amount.toFixed(2)}`;
}

/**
 * Generates a deterministic 21x21 Version-1-style QR matrix with authentic
 * finder patterns, separators, timing patterns, and seeded data modules.
 */
function generateQrMatrix(seedText: string): boolean[][] {
  const size = 21;
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array<boolean>(size).fill(false)
  );
  const reserved: boolean[][] = Array.from({ length: size }, () =>
    Array<boolean>(size).fill(false)
  );

  const placeFinder = (rowOffset: number, colOffset: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = rowOffset + r;
        const cc = colOffset + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        reserved[rr][cc] = true;
        if (r === -1 || r === 7 || c === -1 || c === 7) {
          matrix[rr][cc] = false;
        } else if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[rr][cc] = true;
        } else {
          matrix[rr][cc] = false;
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    reserved[6][i] = true;
    matrix[6][i] = i % 2 === 0;
    reserved[i][6] = true;
    matrix[i][6] = i % 2 === 0;
  }

  // Dark module
  reserved[13][8] = true;
  matrix[13][8] = true;

  // Deterministic hash PRNG from seedText
  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (reserved[r][c]) continue;
      hash ^= hash << 13;
      hash ^= hash >>> 17;
      hash ^= hash << 5;
      matrix[r][c] = (hash >>> 0) % 100 < 52;
    }
  }

  return matrix;
}

interface SerratedEdgeProps {
  position: "top" | "bottom";
  patternId: string;
}

function SerratedEdge({ position, patternId }: SerratedEdgeProps) {
  const isTop = position === "top";
  return (
    <svg
      aria-hidden="true"
      className="block h-[7px] w-full text-white dark:text-zinc-950 select-none shrink-0"
      preserveAspectRatio="none"
    >
      <defs>
        <pattern
          id={patternId}
          width="12"
          height="7"
          patternUnits="userSpaceOnUse"
        >
          {isTop ? (
            <polygon points="0,7 6,0 12,7" fill="currentColor" />
          ) : (
            <polygon points="0,0 6,7 12,0" fill="currentColor" />
          )}
        </pattern>
      </defs>
      <rect width="100%" height="7" fill={`url(#${patternId})`} />
    </svg>
  );
}

interface ReceiptStep {
  id: string;
  render: () => React.ReactNode;
}

const ThermalReceipt = forwardRef<HTMLDivElement, ThermalReceiptProps>(
  (
    {
      title = "Receipt",
      orderNumber = "#4471",
      merchantName = "BLUE TOKAI COFFEE",
      merchantLocation = "Koramangala 8th Block · Bangalore",
      timestamp = "MAY 17, 2026 · 09:24 AM",
      tableLabel = "TABLE 12",
      items = DEFAULT_ITEMS,
      currencySymbol = "₹",
      serviceChargeRate = 0.1,
      taxRate = 0.05,
      thankYouMessage = "Thank you",
      paymentCaption = "SCAN TO PAY · UPI",
      paymentHandle = "bluetokai@hdfcbank",
      showQrCode = true,
      printSpeed = 115,
      autoPrint = false,
      status: controlledStatus,
      defaultStatus = "ready",
      onStatusChange,
      onPrint,
      onTearOff,
      className,
      ...rest
    },
    ref
  ) => {
    const rawId = useId();
    const uid = rawId.replace(/:/g, "");
    const shouldReduceMotion = useReducedMotion();

    const isControlled = controlledStatus !== undefined;
    const [uncontrolledStatus, setUncontrolledStatus] = useState<ReceiptStatus>(
      autoPrint ? "printing" : defaultStatus
    );
    const currentStatus = isControlled ? controlledStatus : uncontrolledStatus;

    const [printedCount, setPrintedCount] = useState<number>(
      currentStatus === "printed" ? 999 : 0
    );
    const [isTearing, setIsTearing] = useState(false);
    const [copied, setCopied] = useState(false);

    const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const setStatus = useCallback(
      (next: ReceiptStatus) => {
        if (!isControlled) {
          setUncontrolledStatus(next);
        }
        onStatusChange?.(next);
      },
      [isControlled, onStatusChange]
    );

    const safeItems = items.length > 0 ? items : DEFAULT_ITEMS;

    const totals = useMemo(() => {
      const subtotal = safeItems.reduce(
        (sum, item) => sum + item.price * (item.quantity ?? 1),
        0
      );
      const serviceCharge = subtotal * Math.max(0, serviceChargeRate);
      const tax = subtotal * Math.max(0, taxRate);
      const grandTotal = subtotal + serviceCharge + tax;
      return { subtotal, serviceCharge, tax, grandTotal };
    }, [safeItems, serviceChargeRate, taxRate]);

    const itemSummary = useMemo(
      () => safeItems.map((item) => item.name).join(" · "),
      [safeItems]
    );

    const qrMatrix = useMemo(
      () => generateQrMatrix(`${paymentHandle}|${orderNumber}|${totals.grandTotal}`),
      [paymentHandle, orderNumber, totals.grandTotal]
    );

    const steps = useMemo<ReceiptStep[]>(() => {
      const list: ReceiptStep[] = [
        {
          id: "merchant",
          render: () => (
            <div className="pt-4 text-center font-mono text-[14px] font-bold tracking-[0.14em] text-zinc-900 dark:text-zinc-100 uppercase">
              {merchantName}
            </div>
          ),
        },
        {
          id: "location",
          render: () => (
            <div className="mt-1.5 text-center font-mono text-[11px] tracking-[0.01em] text-zinc-500 dark:text-zinc-400">
              {merchantLocation}
            </div>
          ),
        },
        {
          id: "timestamp",
          render: () => (
            <div className="mt-1.5 text-center font-mono text-[10.5px] tracking-[0.06em] text-zinc-400 dark:text-zinc-500 uppercase">
              {timestamp}
            </div>
          ),
        },
        {
          id: "order-meta",
          render: () => (
            <div className="mt-1 text-center font-mono text-[10.5px] tracking-[0.06em] text-zinc-400 dark:text-zinc-500 uppercase">
              {`ORDER ${orderNumber}${tableLabel ? ` · ${tableLabel}` : ""}`}
            </div>
          ),
        },
        {
          id: "divider-1",
          render: () => (
            <div
              aria-hidden="true"
              className="my-3.5 border-t border-dashed border-zinc-200 dark:border-zinc-800"
            />
          ),
        },
      ];

      safeItems.forEach((item, index) => {
        const lineTotal = item.price * (item.quantity ?? 1);
        const qtyPrefix =
          item.quantity && item.quantity > 1 ? `${item.quantity}x ` : "";
        list.push({
          id: `item-${item.id ?? index}`,
          render: () => (
            <div
              className={cn(
                "flex items-baseline justify-between gap-3 font-mono text-[12px] leading-relaxed",
                index > 0 && "mt-1.5"
              )}
            >
              <span className="truncate text-zinc-700 dark:text-zinc-300">
                {qtyPrefix}
                {item.name}
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {formatCurrency(lineTotal, currencySymbol)}
              </span>
            </div>
          ),
        });
      });

      list.push(
        {
          id: "divider-2",
          render: () => (
            <div
              aria-hidden="true"
              className="my-3.5 border-t border-dashed border-zinc-200 dark:border-zinc-800"
            />
          ),
        },
        {
          id: "subtotal",
          render: () => (
            <div className="flex items-baseline justify-between gap-3 font-mono text-[11.5px] text-zinc-500 dark:text-zinc-400">
              <span>Subtotal</span>
              <span className="tabular-nums">
                {formatCurrency(totals.subtotal, currencySymbol)}
              </span>
            </div>
          ),
        },
        {
          id: "service-charge",
          render: () => (
            <div className="mt-1.5 flex items-baseline justify-between gap-3 font-mono text-[11.5px] text-zinc-500 dark:text-zinc-400">
              <span>{`Service charge (${Math.round(serviceChargeRate * 100)}%)`}</span>
              <span className="tabular-nums">
                {formatCurrency(totals.serviceCharge, currencySymbol)}
              </span>
            </div>
          ),
        },
        {
          id: "tax",
          render: () => (
            <div className="mt-1.5 flex items-baseline justify-between gap-3 font-mono text-[11.5px] text-zinc-500 dark:text-zinc-400">
              <span>{`Tax (${Math.round(taxRate * 100)}%)`}</span>
              <span className="tabular-nums">
                {formatCurrency(totals.tax, currencySymbol)}
              </span>
            </div>
          ),
        },
        {
          id: "total",
          render: () => (
            <div className="mt-2.5 flex items-baseline justify-between gap-3 font-mono text-[13.5px] font-bold text-zinc-950 dark:text-zinc-50">
              <span className="tracking-[0.04em]">TOTAL</span>
              <span className="tabular-nums">
                {formatCurrency(totals.grandTotal, currencySymbol)}
              </span>
            </div>
          ),
        },
        {
          id: "divider-3",
          render: () => (
            <div
              aria-hidden="true"
              className="my-3.5 border-t border-dashed border-zinc-200 dark:border-zinc-800"
            />
          ),
        },
        {
          id: "thank-you",
          render: () => (
            <div className="pb-1 text-center font-mono text-[11.5px] tracking-[0.03em] text-zinc-500 dark:text-zinc-400">
              {thankYouMessage}{" "}
              <span aria-hidden="true" className="text-zinc-700 dark:text-zinc-300">
                ♥
              </span>
            </div>
          ),
        }
      );

      return list;
    }, [
      merchantName,
      merchantLocation,
      timestamp,
      orderNumber,
      tableLabel,
      safeItems,
      currencySymbol,
      totals,
      serviceChargeRate,
      taxRate,
      thankYouMessage,
    ]);

    const totalSteps = steps.length;
    const clampedPrintedCount = Math.min(printedCount, totalSteps);

    // Sync autoPrint prop changes
    useEffect(() => {
      if (autoPrint && currentStatus === "ready") {
        setPrintedCount(0);
        setStatus("printing");
      }
    }, [autoPrint, currentStatus, setStatus]);

    // Step-by-step thermal line feed timer
    useEffect(() => {
      if (currentStatus !== "printing") return;

      if (shouldReduceMotion) {
        setPrintedCount(totalSteps);
        setStatus("printed");
        return;
      }

      if (clampedPrintedCount >= totalSteps) {
        const doneTimer = setTimeout(() => {
          setStatus("printed");
        }, Math.max(120, Math.min(260, printSpeed * 1.4)));
        return () => clearTimeout(doneTimer);
      }

      const safeSpeed = Math.max(40, Math.min(500, printSpeed));
      const delay = clampedPrintedCount === 0 ? 220 : safeSpeed;
      const stepTimer = setTimeout(() => {
        setPrintedCount((prev) => prev + 1);
      }, delay);

      return () => clearTimeout(stepTimer);
    }, [
      currentStatus,
      clampedPrintedCount,
      totalSteps,
      printSpeed,
      shouldReduceMotion,
      setStatus,
    ]);

    // Cleanup transient timers on unmount
    useEffect(() => {
      return () => {
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
        if (tearTimerRef.current) clearTimeout(tearTimerRef.current);
      };
    }, []);

    const handleStartPrint = useCallback(() => {
      if (currentStatus !== "ready") return;
      setIsTearing(false);
      setPrintedCount(0);
      setStatus("printing");
      onPrint?.();
    }, [currentStatus, setStatus, onPrint]);

    const handleTearOff = useCallback(() => {
      if (currentStatus !== "printed" || isTearing) return;
      onTearOff?.();

      if (shouldReduceMotion) {
        setPrintedCount(0);
        setStatus("ready");
        return;
      }

      setIsTearing(true);
      tearTimerRef.current = setTimeout(() => {
        setIsTearing(false);
        setPrintedCount(0);
        setStatus("ready");
      }, 280);
    }, [currentStatus, isTearing, onTearOff, shouldReduceMotion, setStatus]);

    const handleCopyPaymentHandle = useCallback(() => {
      if (!paymentHandle || typeof navigator === "undefined" || !navigator.clipboard) {
        return;
      }
      navigator.clipboard.writeText(paymentHandle).then(() => {
        setCopied(true);
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
        copyTimerRef.current = setTimeout(() => setCopied(false), 1600);
      }).catch(() => {
        // Silently ignore clipboard denial in restricted iframes
      });
    }, [paymentHandle]);

    const footerLabel =
      currentStatus === "ready"
        ? "Tap print to issue the receipt"
        : currentStatus === "printing"
          ? "Printing..."
          : "Tear off the receipt to reset";

    const visibleSteps =
      currentStatus === "printed" ? steps : steps.slice(0, clampedPrintedCount);

    return (
      <motion.section
        ref={ref}
        layout={!shouldReduceMotion}
        transition={SMOOTH_SPRING}
        aria-labelledby={`${uid}-heading`}
        className={cn(
          "w-full max-w-[360px] rounded-[28px] bg-[#EFEFF1] dark:bg-zinc-900 p-3",
          "border border-black/[0.06] dark:border-white/[0.08]",
          "shadow-[0_14px_34px_-10px_rgba(0,0,0,0.12),0_2px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.55)]",
          "select-none",
          className
        )}
        {...(rest as Record<string, unknown>)}
      >
        {/* Top Shell Header */}
        <header className="flex items-center justify-between px-2.5 pt-1.5 pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <h2
              id={`${uid}-heading`}
              className="text-[15px] font-semibold tracking-[-0.02em] text-zinc-900 dark:text-zinc-100"
            >
              {title}
            </h2>
            <span className="inline-flex items-center rounded-full bg-zinc-200/85 dark:bg-zinc-800 px-2.5 py-0.5 font-mono text-[11px] font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
              {orderNumber}
            </span>
          </div>

          <div className="flex items-center justify-end min-h-[28px]">
            <AnimatePresence mode="wait" initial={false}>
              {currentStatus === "ready" && (
                <motion.span
                  key="status-ready"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.16 }}
                  className="text-[12.5px] font-medium text-zinc-400 dark:text-zinc-500"
                >
                  Ready
                </motion.span>
              )}

              {currentStatus === "printing" && (
                <motion.span
                  key="status-printing"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.16 }}
                  aria-live="polite"
                  className="font-mono text-[12px] tabular-nums text-zinc-500 dark:text-zinc-400"
                >
                  {`printing ${clampedPrintedCount}/${totalSteps}`}
                </motion.span>
              )}

              {currentStatus === "printed" && (
                <motion.button
                  key="status-printed"
                  type="button"
                  onClick={handleTearOff}
                  disabled={isTearing}
                  initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.18 }}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium",
                    "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200",
                    "border border-black/[0.07] dark:border-white/[0.09] shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
                    "hover:bg-zinc-50 dark:hover:bg-zinc-700/80 active:scale-[0.97] transition-all cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 focus-visible:ring-offset-1"
                  )}
                >
                  <RotateCcw className="h-3.5 w-3.5 stroke-[2]" aria-hidden="true" />
                  <span>Tear off</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Center Stage: Ready Card <-> Thermal Receipt Paper */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {currentStatus === "ready" ? (
              <motion.div
                key="stage-ready"
                initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "flex flex-col items-center justify-center text-center",
                  "rounded-[20px] bg-white dark:bg-zinc-950 px-6 py-11",
                  "border border-black/[0.04] dark:border-white/[0.06]"
                )}
              >
                <div
                  aria-hidden="true"
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800/90 text-zinc-500 dark:text-zinc-400"
                >
                  <FileText className="h-5 w-5 stroke-[1.75]" />
                </div>

                <h3 className="text-[15.5px] font-semibold tracking-[-0.015em] text-zinc-900 dark:text-zinc-100">
                  Order ready
                </h3>

                <p className="mt-1 max-w-[260px] truncate text-[13px] text-zinc-500 dark:text-zinc-400">
                  {itemSummary}
                </p>

                <button
                  type="button"
                  onClick={handleStartPrint}
                  className={cn(
                    "mt-6 inline-flex items-center justify-center rounded-full px-5 py-2.5",
                    "bg-zinc-900 dark:bg-zinc-100 text-[13px] font-medium text-white dark:text-zinc-900",
                    "hover:bg-zinc-800 dark:hover:bg-white active:scale-[0.97] transition-all cursor-pointer",
                    "shadow-[0_2px_8px_rgba(0,0,0,0.12)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
                  )}
                >
                  Print receipt
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="stage-paper"
                layout={!shouldReduceMotion}
                initial={shouldReduceMotion ? false : { opacity: 0, y: -12 }}
                animate={
                  isTearing
                    ? { opacity: 0, y: 28, rotate: -1.5, scale: 0.97 }
                    : { opacity: 1, y: 0, rotate: 0, scale: 1 }
                }
                exit={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
                transition={SMOOTH_SPRING}
                className="flex flex-col"
              >
                <SerratedEdge position="top" patternId={`${uid}-tooth-top`} />

                <div className="bg-white dark:bg-zinc-950 px-5 pb-4 min-h-[72px] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:shadow-none">
                  {visibleSteps.map((step) => (
                    <motion.div
                      key={step.id}
                      initial={shouldReduceMotion ? false : { opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                    >
                      {step.render()}
                    </motion.div>
                  ))}

                  {/* Scan-to-Pay QR Section reveals upon completion */}
                  <AnimatePresence initial={false}>
                    {currentStatus === "printed" && showQrCode && (
                      <motion.div
                        key="qr-section"
                        initial={
                          shouldReduceMotion
                            ? false
                            : { opacity: 0, height: 0 }
                        }
                        animate={{ opacity: 1, height: "auto" }}
                        exit={
                          shouldReduceMotion
                            ? undefined
                            : { opacity: 0, height: 0 }
                        }
                        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3.5 border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-4 pb-1 flex flex-col items-center">
                          <span className="font-mono text-[10px] tracking-[0.14em] text-zinc-400 dark:text-zinc-500 uppercase">
                            {paymentCaption}
                          </span>

                          <div
                            className="mt-3 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                            role="img"
                            aria-label={`Payment QR code for ${paymentHandle}`}
                          >
                            <svg
                              viewBox="0 0 21 21"
                              className="h-[108px] w-[108px] text-zinc-950"
                              shapeRendering="crispEdges"
                            >
                              {qrMatrix.map((row, rIdx) =>
                                row.map((filled, cIdx) =>
                                  filled ? (
                                    <rect
                                      key={`${rIdx}-${cIdx}`}
                                      x={cIdx}
                                      y={rIdx}
                                      width={1}
                                      height={1}
                                      fill="currentColor"
                                    />
                                  ) : null
                                )
                              )}
                            </svg>
                          </div>

                          <button
                            type="button"
                            onClick={handleCopyPaymentHandle}
                            title="Copy payment ID"
                            className={cn(
                              "mt-2.5 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5",
                              "font-mono text-[11px] text-zinc-500 dark:text-zinc-400",
                              "hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100"
                            )}
                          >
                            <span>{copied ? "Copied handle" : paymentHandle}</span>
                            {copied && (
                              <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Bottom serrated edge appears once paper finishes feeding */}
                {currentStatus === "printed" ? (
                  <SerratedEdge
                    position="bottom"
                    patternId={`${uid}-tooth-bottom`}
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="h-[2px] w-full bg-gradient-to-b from-black/[0.06] to-transparent dark:from-black/40"
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Persistent Shell Footer */}
        <footer className="pt-3 pb-1 text-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={footerLabel}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: -2 }}
              transition={{ duration: 0.16 }}
              aria-live="polite"
              className="text-[12px] font-medium text-zinc-400 dark:text-zinc-500"
            >
              {footerLabel}
            </motion.p>
          </AnimatePresence>
        </footer>
      </motion.section>
    );
  }
);

ThermalReceipt.displayName = "ThermalReceipt";

export {
  ThermalReceipt,
  ThermalReceipt as component,
  ThermalReceipt as Component,
};
export default ThermalReceipt;