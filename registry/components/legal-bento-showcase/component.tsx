"use client";

import React, { useEffect, useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Calendar,
  Check,
  Download,
  FileText,
  Folder,
  Layers,
  Sparkles,
  Wallet,
} from "lucide-react";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export interface ResearchStackItem {
  id: string;
  label: string;
  isAction?: boolean;
}

export interface DocumentCategoryTile {
  id: string;
  title: string;
  icon: "folder" | "file" | "wallet" | "layers" | "calendar";
  row: 1 | 2;
}

export interface ProjectFileItem {
  id: string;
  name: string;
}

export interface LegalBentoShowcaseProps
  extends React.HTMLAttributes<HTMLElement> {
  theme?: "light" | "dark";
  brandName?: string;
  autoCycleResearch?: boolean;
  showEdgeFades?: boolean;
  onLearnMoreClick?: () => void;
  onBatchDownloadClick?: () => void;
  onInlineDownloadClick?: () => void;
  onAskBrandClick?: () => void;
  onFileDownloadClick?: (file: ProjectFileItem) => void;
}

const RESEARCH_STACK_ITEMS: ResearchStackItem[] = [
  { id: "legal-law", label: "Legal Law Benefits" },
  { id: "sales-mgmt", label: "Sales Management.pdf" },
  { id: "ai-summarize", label: "AI Summarize", isAction: true },
  { id: "transcript", label: "Transcript.docx" },
  { id: "memos", label: "Memos.pdf" },
];

const DOCUMENT_TILES: DocumentCategoryTile[] = [
  { id: "analytics", title: "Analytics Discovery", icon: "file", row: 1 },
  { id: "ai-research", title: "AI-Based Research Doc", icon: "folder", row: 1 },
  { id: "research-analysis", title: "Research & Analysis", icon: "file", row: 1 },
  { id: "financial-legal", title: "Financial Legal Agreement", icon: "wallet", row: 2 },
  { id: "brand-reports", title: "Reports", icon: "layers", row: 2 },
  { id: "agile-notes", title: "Agile & Compliance", icon: "calendar", row: 2 },
];

const PROJECT_FILES: ProjectFileItem[] = [
  { id: "legal-agreement", name: "Legal agreement.doc" },
  { id: "research-solutions", name: "Research & Solutions.pdf" },
  { id: "intelligence-report", name: "Intelligence Analysis Report.doc" },
];

const SMOOTH_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function TileIcon({
  type,
  className,
}: {
  type: DocumentCategoryTile["icon"];
  className?: string;
}) {
  const iconClass = cn("h-3.5 w-3.5 stroke-[1.75]", className);
  switch (type) {
    case "folder":
      return <Folder className={iconClass} aria-hidden="true" />;
    case "wallet":
      return <Wallet className={iconClass} aria-hidden="true" />;
    case "layers":
      return <Layers className={iconClass} aria-hidden="true" />;
    case "calendar":
      return <Calendar className={iconClass} aria-hidden="true" />;
    case "file":
    default:
      return <FileText className={iconClass} aria-hidden="true" />;
  }
}

export const LegalBentoShowcase = React.forwardRef<
  HTMLElement,
  LegalBentoShowcaseProps
>(
  (
    {
      theme = "light",
      brandName = "Bendwick",
      autoCycleResearch = true,
      showEdgeFades = true,
      onLearnMoreClick,
      onBatchDownloadClick,
      onInlineDownloadClick,
      onAskBrandClick,
      onFileDownloadClick,
      className,
      ...props
    },
    ref
  ) => {
    const uid = useId();
    const shouldReduceMotion = useReducedMotion();
    const isDark = theme === "dark";

    const [activeStackIndex, setActiveStackIndex] = useState<number>(2);
    const [isHoveringStack, setIsHoveringStack] = useState<boolean>(false);
    const [selectedTileId, setSelectedTileId] = useState<string>("ai-research");
    const [batchDownloaded, setBatchDownloaded] = useState<boolean>(false);
    const [inlineDownloaded, setInlineDownloaded] = useState<boolean>(false);
    const [askedBrand, setAskedBrand] = useState<boolean>(false);
    const [downloadedFileIds, setDownloadedFileIds] = useState<
      Record<string, boolean>
    >({});

    useEffect(() => {
      if (!autoCycleResearch || isHoveringStack || shouldReduceMotion) {
        return;
      }
      const interval = window.setInterval(() => {
        setActiveStackIndex((prev) => (prev + 1) % RESEARCH_STACK_ITEMS.length);
      }, 2600);
      return () => window.clearInterval(interval);
    }, [autoCycleResearch, isHoveringStack, shouldReduceMotion]);

    const handleBatchDownload = () => {
      setBatchDownloaded(true);
      onBatchDownloadClick?.();
      window.setTimeout(() => setBatchDownloaded(false), 2000);
    };

    const handleInlineDownload = () => {
      setInlineDownloaded(true);
      onInlineDownloadClick?.();
      window.setTimeout(() => setInlineDownloaded(false), 2000);
    };

    const handleAskBrand = () => {
      setAskedBrand((prev) => !prev);
      onAskBrandClick?.();
    };

    const handleFileDownload = (file: ProjectFileItem) => {
      setDownloadedFileIds((prev) => ({ ...prev, [file.id]: true }));
      onFileDownloadClick?.(file);
      window.setTimeout(() => {
        setDownloadedFileIds((prev) => ({ ...prev, [file.id]: false }));
      }, 1800);
    };

    const safeBrand = brandName.trim() || "Bendwick";
    const row1Tiles = DOCUMENT_TILES.filter((t) => t.row === 1);
    const row2Tiles = DOCUMENT_TILES.filter((t) => t.row === 2);

    const serifFontStyle: React.CSSProperties = {
      fontFamily:
        '"Instrument Serif", "Newsreader", "Playfair Display", Georgia, serif',
    };

    return (
      <section
        ref={ref}
        aria-label={`${safeBrand} Legal AI Research Showcase`}
        className={cn(
          "w-full max-w-[1360px] rounded-[28px] p-4 sm:p-5 transition-colors duration-300",
          isDark
            ? "bg-[#12110f] text-[#f5f3f1]"
            : "bg-[#ece8e5] text-[#1e1d19]",
          className
        )}
        {...props}
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,28.5%)_minmax(0,71.5%)] lg:items-stretch">
          {/* CARD 1: Left Tall Dark Card — Proven Research / Rapid Results */}
          <article
            className={cn(
              "flex flex-col justify-between rounded-[22px] p-2.5 transition-colors duration-300",
              isDark
                ? "bg-[#1b1a17] ring-1 ring-white/10"
                : "bg-[#1e1d19]"
            )}
          >
            {/* Top Inner Warm Panel */}
            <div
              onMouseEnter={() => setIsHoveringStack(true)}
              onMouseLeave={() => setIsHoveringStack(false)}
              className={cn(
                "relative flex min-h-[290px] sm:min-h-[325px] flex-col items-center justify-center rounded-[15px] px-5 py-7 overflow-hidden",
                isDark ? "bg-[#25231f]" : "bg-[#ece8e5]"
              )}
            >
              <div
                role="listbox"
                aria-label="Research document actions"
                className="flex w-full max-w-[218px] flex-col gap-2.5"
              >
                {RESEARCH_STACK_ITEMS.map((item, idx) => {
                  const isActive = idx === activeStackIndex;
                  const distance = Math.abs(idx - activeStackIndex);
                  const isFadedEdge = distance >= 2;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onClick={() => setActiveStackIndex(idx)}
                      className={cn(
                        "relative flex h-10 w-full items-center justify-center rounded-[9px] px-4 text-[12.5px] font-medium tracking-[-0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e1d19] focus-visible:ring-offset-1",
                        isActive
                          ? "text-white shadow-[0_6px_18px_rgba(30,29,25,0.18)]"
                          : isFadedEdge
                            ? isDark
                              ? "bg-[#2e2c27]/60 text-[#9c968e]/65 hover:text-[#e5e1dc]"
                              : "bg-[#f5f3f1]/75 text-[#9c968e] hover:text-[#1e1d19]"
                            : isDark
                              ? "bg-[#312f2a] text-[#ece8e5] shadow-xs hover:bg-[#3a3732]"
                              : "bg-white text-[#1e1d19] shadow-[0_1px_3px_rgba(30,29,25,0.06)] hover:bg-[#faf9f8]"
                      )}
                    >
                      {isActive && (
                        <motion.span
                          layoutId={`${uid}-active-stack-pill`}
                          transition={
                            shouldReduceMotion
                              ? { duration: 0 }
                              : { duration: 0.35, ease: SMOOTH_EASE }
                          }
                          className={cn(
                            "absolute inset-0 rounded-[9px]",
                            isDark ? "bg-[#11100e] ring-1 ring-white/15" : "bg-[#1e1d19]"
                          )}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-1.5 truncate">
                        {item.isAction && (
                          <Sparkles
                            className={cn(
                              "h-3 w-3 shrink-0",
                              isActive ? "text-[#ece8e5]" : "opacity-70"
                            )}
                            aria-hidden="true"
                          />
                        )}
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Dark Copy & CTA */}
            <div className="flex flex-1 flex-col justify-between px-4 pb-5 pt-7 sm:px-5">
              <div>
                <h2
                  style={serifFontStyle}
                  className="text-[30px] sm:text-[32px] font-normal leading-[1.08] tracking-[-0.02em] text-[#f5f3f1]"
                >
                  Proven Research
                  <br />
                  Rapid Results
                </h2>
                <p className="mt-4 max-w-[270px] text-[13px] leading-[1.55] text-[#a8a39c]">
                  Complex questions? Solved.
                  <br />
                  Get expertly sourced answers across law, tax, and
                  compliance—backed by citations that speak volumes.
                </p>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={onLearnMoreClick}
                  className={cn(
                    "inline-flex items-center justify-center rounded-full px-5 py-2 text-[12px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5f3f1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e1d19] active:scale-[0.98]",
                    "bg-[#f7f5f3] text-[#1e1d19] hover:bg-white"
                  )}
                >
                  Learn more
                </button>
              </div>
            </div>
          </article>

          {/* RIGHT 2x2 ASYMMETRIC BENTO AREA */}
          <div className="grid grid-cols-1 gap-4">
            {/* TOP ROW: Card 2 (~39%) + Card 3 (~61%) */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,0.405fr)_minmax(0,0.595fr)]">
              {/* CARD 2: Staggered Document Category Grid */}
              <article
                aria-label="Document categories"
                className={cn(
                  "relative flex min-h-[290px] sm:min-h-[330px] flex-col justify-center overflow-hidden rounded-[22px] p-4 transition-colors duration-300",
                  isDark
                    ? "bg-[#1b1a17] ring-1 ring-white/10"
                    : "bg-white"
                )}
              >
                <div className="flex flex-col gap-3">
                  {/* Row 1 */}
                  <div className="flex -ml-14 gap-3">
                    {row1Tiles.map((tile) => {
                      const isSelected = selectedTileId === tile.id;
                      return (
                        <button
                          key={tile.id}
                          type="button"
                          onClick={() => setSelectedTileId(tile.id)}
                          className={cn(
                            "group flex h-[126px] w-[124px] shrink-0 flex-col justify-between rounded-[14px] border p-3.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e1d19]",
                            isDark
                              ? isSelected
                                ? "border-white/25 bg-[#2a2824]"
                                : "border-white/8 bg-[#23211e] hover:border-white/20"
                              : isSelected
                                ? "border-[#d8d3ce] bg-[#f6f4f2] shadow-xs"
                                : "border-[#f1eeeb] bg-[#faf8f7] hover:border-[#e3ded9]"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-[7px] border shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
                              isDark
                                ? "border-white/10 bg-[#1b1a17] text-[#ece8e5]"
                                : "border-[#ece8e5] bg-white text-[#4b4843]"
                            )}
                          >
                            <TileIcon type={tile.icon} />
                          </span>
                          <span
                            className={cn(
                              "text-[11.5px] font-medium leading-[1.3] tracking-[-0.01em]",
                              isDark ? "text-[#ece8e5]" : "text-[#2a2824]"
                            )}
                          >
                            {tile.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Row 2 (offset) */}
                  <div className="flex -ml-4 gap-3">
                    {row2Tiles.map((tile) => {
                      const isSelected = selectedTileId === tile.id;
                      const displayTitle =
                        tile.id === "brand-reports"
                          ? `${safeBrand} Reports`
                          : tile.title;
                      return (
                        <button
                          key={tile.id}
                          type="button"
                          onClick={() => setSelectedTileId(tile.id)}
                          className={cn(
                            "group flex h-[126px] w-[124px] shrink-0 flex-col justify-between rounded-[14px] border p-3.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e1d19]",
                            isDark
                              ? isSelected
                                ? "border-white/25 bg-[#2a2824]"
                                : "border-white/8 bg-[#23211e] hover:border-white/20"
                              : isSelected
                                ? "border-[#d8d3ce] bg-[#f6f4f2] shadow-xs"
                                : "border-[#f1eeeb] bg-[#faf8f7] hover:border-[#e3ded9]"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-[7px] border shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
                              isDark
                                ? "border-white/10 bg-[#1b1a17] text-[#ece8e5]"
                                : "border-[#ece8e5] bg-white text-[#4b4843]"
                            )}
                          >
                            <TileIcon type={tile.icon} />
                          </span>
                          <span
                            className={cn(
                              "text-[11.5px] font-medium leading-[1.3] tracking-[-0.01em]",
                              isDark ? "text-[#ece8e5]" : "text-[#2a2824]"
                            )}
                          >
                            {displayTitle}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Soft Edge Vignette Masks */}
                {showEdgeFades && (
                  <>
                    <div
                      aria-hidden="true"
                      className={cn(
                        "pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r to-transparent",
                        isDark ? "from-[#1b1a17]" : "from-white"
                      )}
                    />
                    <div
                      aria-hidden="true"
                      className={cn(
                        "pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l to-transparent",
                        isDark ? "from-[#1b1a17]" : "from-white"
                      )}
                    />
                    <div
                      aria-hidden="true"
                      className={cn(
                        "pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t to-transparent",
                        isDark ? "from-[#1b1a17]" : "from-white"
                      )}
                    />
                  </>
                )}
              </article>

              {/* CARD 3: Dark Split Card — Privatised & Project-Ready */}
              <article
                className={cn(
                  "grid min-h-[290px] sm:min-h-[330px] grid-cols-1 gap-4 rounded-[22px] p-3 sm:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] transition-colors duration-300",
                  isDark
                    ? "bg-[#1b1a17] ring-1 ring-white/10"
                    : "bg-[#1e1d19]"
                )}
              >
                {/* Left Copy */}
                <div className="flex flex-col justify-center px-3 py-4 sm:px-4">
                  <h2
                    style={serifFontStyle}
                    className="text-[28px] sm:text-[31px] font-normal leading-[1.1] tracking-[-0.02em] text-[#f5f3f1]"
                  >
                    Privatised &amp;
                    <br />
                    Project-Ready
                  </h2>
                  <p className="mt-3 max-w-[200px] text-[12.5px] leading-[1.5] text-[#a8a39c]">
                    Turn Document Chaos Into AI-Powered Clarity.
                  </p>
                </div>

                {/* Right Warm Panel */}
                <div
                  className={cn(
                    "flex flex-col justify-between rounded-[14px] p-5",
                    isDark ? "bg-[#25231f]" : "bg-[#ece8e5]"
                  )}
                >
                  <p
                    className={cn(
                      "text-[13.5px] leading-[1.45] tracking-[-0.01em]",
                      isDark ? "text-[#ece8e5]" : "text-[#2a2824]"
                    )}
                  >
                    No significant deviations from standard operations are
                    permitted before the deal closes.
                  </p>

                  <div className="mt-6 flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={handleBatchDownload}
                      className={cn(
                        "flex w-full items-center justify-between rounded-[9px] border px-3.5 py-2.5 text-[12px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e1d19]",
                        isDark
                          ? "border-white/10 bg-[#1b1a17] text-[#ece8e5] hover:bg-[#2f2c27]"
                          : "border-[#e2ded9] bg-white text-[#1e1d19] hover:bg-[#faf9f8]"
                      )}
                    >
                      <span>Download (55) Files</span>
                      <Download
                        className="h-3.5 w-3.5 opacity-70"
                        aria-hidden="true"
                      />
                    </button>

                    <button
                      type="button"
                      onClick={handleBatchDownload}
                      className={cn(
                        "flex w-full items-center justify-center gap-1.5 rounded-[9px] py-2.5 text-[12px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e1d19] active:scale-[0.98]",
                        isDark
                          ? "bg-[#f5f3f1] text-[#1e1d19] hover:bg-white"
                          : "bg-[#1e1d19] text-[#f5f3f1] hover:bg-[#2c2a25]"
                      )}
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {batchDownloaded ? (
                          <motion.span
                            key="done"
                            initial={
                              shouldReduceMotion ? false : { opacity: 0, y: 4 }
                            }
                            animate={{ opacity: 1, y: 0 }}
                            exit={
                              shouldReduceMotion ? undefined : { opacity: 0, y: -4 }
                            }
                            transition={{ duration: 0.18, ease: SMOOTH_EASE }}
                            className="inline-flex items-center gap-1.5"
                          >
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            Downloaded
                          </motion.span>
                        ) : (
                          <motion.span
                            key="idle"
                            initial={
                              shouldReduceMotion ? false : { opacity: 0, y: 4 }
                            }
                            animate={{ opacity: 1, y: 0 }}
                            exit={
                              shouldReduceMotion ? undefined : { opacity: 0, y: -4 }
                            }
                            transition={{ duration: 0.18, ease: SMOOTH_EASE }}
                          >
                            Download
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>
                </div>
              </article>
            </div>

            {/* BOTTOM ROW: Card 4 (~61%) + Card 5 (~39%) */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,0.61fr)_minmax(0,0.39fr)]">
              {/* CARD 4: Aligned With Your Workflow */}
              <article
                className={cn(
                  "relative grid min-h-[290px] sm:min-h-[330px] grid-cols-1 items-center gap-4 overflow-hidden rounded-[22px] p-6 sm:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] transition-colors duration-300",
                  isDark
                    ? "bg-[#1b1a17] ring-1 ring-white/10"
                    : "bg-white"
                )}
              >
                {/* Left Copy */}
                <div className="relative z-10 flex flex-col justify-center">
                  <h2
                    style={serifFontStyle}
                    className={cn(
                      "text-[28px] sm:text-[31px] font-normal leading-[1.1] tracking-[-0.02em]",
                      isDark ? "text-[#f5f3f1]" : "text-[#1e1d19]"
                    )}
                  >
                    Aligned With
                    <br />
                    Your Workflow
                  </h2>
                  <p
                    className={cn(
                      "mt-3.5 max-w-[235px] text-[12.5px] leading-[1.55]",
                      isDark ? "text-[#a8a39c]" : "text-[#6b6761]"
                    )}
                  >
                    Effortlessly hand off complex, domain specific tasks with
                    simple natural language commands.
                  </p>
                </div>

                {/* Right Contract Backdrop + Floating Tooltip Pill */}
                <div className="relative flex h-full min-h-[200px] items-center justify-center">
                  {/* Faded Contract Document Text */}
                  <div
                    aria-hidden="true"
                    className={cn(
                      "select-none pointer-events-none text-[11px] leading-[1.65] tracking-[-0.005em]",
                      isDark ? "text-white/15" : "text-[#1e1d19]/20"
                    )}
                  >
                    <p>
                      covenants that govern the firm during the period between
                      signing of its merger agreement with Biosciences Inc. These
                      covenants require and ensure the {safeBrand} operates in
                      alignment with standard practices. During this interim
                      period, the company must conduct its operations using
                      commercially reasonable efforts and remain within the
                      bounds of its ordinary course.
                    </p>
                  </div>

                  {showEdgeFades && (
                    <div
                      aria-hidden="true"
                      className={cn(
                        "pointer-events-none absolute inset-0",
                        isDark
                          ? "bg-[radial-gradient(circle_at_center,transparent_25%,#1b1a17_85%)]"
                          : "bg-[radial-gradient(circle_at_center,transparent_25%,#ffffff_85%)]"
                      )}
                    />
                  )}

                  {/* Centered Floating Command Tooltip & Download Pill */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <motion.div
                      initial={false}
                      animate={
                        shouldReduceMotion
                          ? undefined
                          : { y: inlineDownloaded ? -2 : 0 }
                      }
                      transition={{ duration: 0.2, ease: SMOOTH_EASE }}
                      className={cn(
                        "relative rounded-[8px] px-3.5 py-2 text-[11.5px] font-medium shadow-[0_8px_20px_rgba(0,0,0,0.16)]",
                        isDark
                          ? "bg-[#f5f3f1] text-[#1e1d19]"
                          : "bg-[#141311] text-white"
                      )}
                    >
                      <span>Download the Legal.doc</span>
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute left-1/2 top-full -translate-x-1/2 border-x-[5px] border-t-[5px] border-x-transparent",
                          isDark ? "border-t-[#f5f3f1]" : "border-t-[#141311]"
                        )}
                      />
                    </motion.div>

                    <button
                      type="button"
                      onClick={handleInlineDownload}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-4 py-1 text-[11px] font-medium shadow-xs transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e1d19] active:scale-[0.97]",
                        isDark
                          ? "border-white/20 bg-[#25231f] text-[#f5f3f1] hover:bg-[#302d28]"
                          : "border-[#d8d4cf] bg-white text-[#1e1d19] hover:bg-[#f7f5f3]"
                      )}
                    >
                      {inlineDownloaded ? (
                        <>
                          <Check className="h-3 w-3" aria-hidden="true" />
                          Saved
                        </>
                      ) : (
                        "Download"
                      )}
                    </button>
                  </div>
                </div>
              </article>

              {/* CARD 5: Ask Brand + 125 Project Files */}
              <article
                className={cn(
                  "relative flex min-h-[290px] sm:min-h-[330px] flex-col justify-between overflow-hidden rounded-[22px] p-5 transition-colors duration-300",
                  isDark
                    ? "bg-[#1b1a17] ring-1 ring-white/10"
                    : "bg-white"
                )}
              >
                <div>
                  <p
                    className={cn(
                      "text-[13px] leading-[1.48] tracking-[-0.01em]",
                      isDark ? "text-[#ece8e5]" : "text-[#2a2824]"
                    )}
                  >
                    The company must maintain normal operations and avoid
                    significant changes before the merger closes.
                  </p>

                  <button
                    type="button"
                    onClick={handleAskBrand}
                    className={cn(
                      "mt-4 flex w-full items-center justify-center rounded-[9px] py-2.5 text-[12px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e1d19] active:scale-[0.98]",
                      isDark
                        ? "bg-[#f5f3f1] text-[#1e1d19] hover:bg-white"
                        : "bg-[#1e1d19] text-[#f5f3f1] hover:bg-[#2d2b26]"
                    )}
                  >
                    {askedBrand ? `Asking ${safeBrand}…` : `Ask ${safeBrand}`}
                  </button>
                </div>

                <div className="mt-5">
                  <p
                    className={cn(
                      "mb-2.5 text-[11px] font-medium",
                      isDark ? "text-[#a8a39c]" : "text-[#6b6761]"
                    )}
                  >
                    125 Project Files
                  </p>

                  <div className="relative flex flex-col gap-2">
                    {PROJECT_FILES.map((file) => {
                      const isDone = Boolean(downloadedFileIds[file.id]);
                      return (
                        <button
                          key={file.id}
                          type="button"
                          onClick={() => handleFileDownload(file)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-[9px] border px-3 py-2 text-left text-[11.5px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e1d19]",
                            isDark
                              ? "border-white/10 bg-[#23211e] text-[#ece8e5] hover:border-white/20"
                              : "border-[#e8e4e0] bg-white text-[#2a2824] hover:border-[#d4cfc9]"
                          )}
                        >
                          <span className="flex items-center gap-2 truncate pr-2">
                            <Folder
                              className="h-3.5 w-3.5 shrink-0 opacity-60"
                              aria-hidden="true"
                            />
                            <span className="truncate">{file.name}</span>
                          </span>
                          {isDone ? (
                            <Check
                              className="h-3.5 w-3.5 shrink-0 text-emerald-600"
                              aria-hidden="true"
                            />
                          ) : (
                            <Download
                              className="h-3.5 w-3.5 shrink-0 opacity-55"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      );
                    })}

                    {showEdgeFades && (
                      <div
                        aria-hidden="true"
                        className={cn(
                          "pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t to-transparent",
                          isDark ? "from-[#1b1a17]" : "from-white"
                        )}
                      />
                    )}
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>
    );
  }
);

LegalBentoShowcase.displayName = "LegalBentoShowcase";

export {
  LegalBentoShowcase as component,
  LegalBentoShowcase as Component,
};
export default LegalBentoShowcase;