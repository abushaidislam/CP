"use client";

import * as React from "react";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ArrowUp,
  FileCode,
  GitPullRequest,
  Check,
  X,
  RotateCcw,
  Copy,
  Eye,
  Code2,
  ImagePlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  TraceCollapsible,
  TraceCollapsibleTrigger,
  TraceCollapsibleContent,
} from "@/components/ui/trace";
import type { AttachedImage, AttachedCodeSnippet } from "@/lib/store/studio-store";

// ==========================================
// 1. REASONING (Notion / ChatGPT / Gemini Sequential Thought Stream)
// ==========================================
export interface ReasoningStep {
  title: string;
  description?: string;
  detail?: string;
  status: "done" | "running" | "pending";
}

export interface ReasoningProps {
  children?: React.ReactNode;
  summary?: string;
  isStreaming?: boolean;
  durationSeconds?: number;
  defaultOpen?: boolean;
  activeStep?: string;
  steps?: ReasoningStep[];
  className?: string;
}

export function Reasoning({
  children,
  summary,
  isStreaming = false,
  durationSeconds,
  defaultOpen = false,
  activeStep,
  steps = [],
  className,
}: ReasoningProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen || isStreaming);

  React.useEffect(() => {
    if (isStreaming) {
      setIsOpen(true);
    } else {
      setIsOpen(defaultOpen);
    }
  }, [isStreaming, defaultOpen]);

  // Only reveal steps that have started or completed — sequential step-by-step progression
  const visibleSteps = React.useMemo(
    () => steps.filter((s) => s.status !== "pending"),
    [steps]
  );

  const currentRunningStep = React.useMemo(
    () =>
      visibleSteps.find((s) => s.status === "running") ||
      visibleSteps[visibleSteps.length - 1],
    [visibleSteps]
  );

  return (
    <div className={cn("w-full my-1.5 select-none font-sans", className)}>
      <TraceCollapsible open={isOpen} onOpenChange={setIsOpen}>
        <TraceCollapsibleTrigger
          hideChevron={true}
          className="group/trigger inline-flex items-center gap-2 py-1 px-2 -ml-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer select-none"
        >
          {isStreaming ? (
            <>
              <span className="relative flex size-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground/40 opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-foreground/80" />
              </span>
              <span className="font-medium text-foreground/90 animate-pulse">
                {activeStep || currentRunningStep?.title || "Thinking..."}
              </span>
              {durationSeconds !== undefined && durationSeconds > 0 && (
                <span className="text-[11px] text-muted-foreground/70 font-normal tabular-nums">
                  {durationSeconds}s
                </span>
              )}
            </>
          ) : (
            <span className="font-medium text-muted-foreground group-hover/trigger:text-foreground transition-colors">
              {durationSeconds !== undefined && durationSeconds > 0
                ? `Thought for ${durationSeconds} second${durationSeconds === 1 ? "" : "s"}`
                : "Thought for a few seconds"}
            </span>
          )}

          <ChevronRight className="size-3.5 text-muted-foreground/60 transition-transform duration-200 group-data-[state=open]/trigger:rotate-90" />
        </TraceCollapsibleTrigger>

        <TraceCollapsibleContent className="pt-1 pb-2">
          <div className="relative ml-1.5 pl-4 border-l border-border/70 space-y-3 py-1">
            {visibleSteps.map((st, i) => {
              const isCurrent = isStreaming && st.status === "running";
              const isLast = i === visibleSteps.length - 1;
              return (
                <div
                  key={i}
                  className="relative space-y-1 animate-in fade-in slide-in-from-top-1 duration-300"
                >
                  {/* Timeline Step Dot on the Left Line */}
                  <span
                    className={cn(
                      "absolute -left-[19.5px] top-1.5 size-1.5 rounded-full transition-colors",
                      isCurrent
                        ? "bg-foreground ring-3 ring-background animate-pulse"
                        : "bg-muted-foreground/45 ring-3 ring-background"
                    )}
                  />

                  <div className="text-xs font-medium text-foreground/85 leading-snug font-sans">
                    {st.title}
                  </div>

                  {st.description && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed font-sans">
                      {st.description}
                    </p>
                  )}

                  {isCurrent && !st.description && isLast && (
                    <p className="text-[11px] text-muted-foreground/70 leading-relaxed font-sans italic">
                      Working on this step...
                    </p>
                  )}
                </div>
              );
            })}

            {!isStreaming && (summary || children) && (
              <div className="relative pt-0.5">
                <span className="absolute -left-[19.5px] top-2 size-1.5 rounded-full bg-muted-foreground/30 ring-3 ring-background" />
                <p className="text-[11px] text-muted-foreground/80 leading-relaxed font-sans">
                  {summary || children}
                </p>
              </div>
            )}
          </div>
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </div>
  );
}

// ==========================================
// 2. CHANGE APPROVAL REQUEST CARD (Diff & Review)
// ==========================================
interface DiffLine {
  type: "same" | "add" | "del";
  content: string;
  oldLine?: number;
  newLine?: number;
}

function computeFileDiff(oldText: string, newText: string): {
  added: number;
  removed: number;
  lines: DiffLine[];
} {
  const oldLines = (oldText || "").split("\n");
  const newLines = (newText || "").split("\n");

  // Fast LCS matrix for reasonable file sizes (< 600 lines)
  const M = oldLines.length;
  const N = newLines.length;

  if (M + N > 1200) {
    // Fallback line comparison for huge files
    let added = 0;
    let removed = 0;
    const lines: DiffLine[] = [];
    const maxLen = Math.max(M, N);
    for (let i = 0; i < maxLen; i++) {
      const o = oldLines[i];
      const n = newLines[i];
      if (o === n && o !== undefined) {
        lines.push({ type: "same", content: o, oldLine: i + 1, newLine: i + 1 });
      } else {
        if (o !== undefined) {
          removed++;
          lines.push({ type: "del", content: o, oldLine: i + 1 });
        }
        if (n !== undefined) {
          added++;
          lines.push({ type: "add", content: n, newLine: i + 1 });
        }
      }
    }
    return { added, removed, lines };
  }

  const dp: number[][] = Array.from({ length: M + 1 }, () =>
    new Array(N + 1).fill(0)
  );

  for (let i = M - 1; i >= 0; i--) {
    for (let j = N - 1; j >= 0; j--) {
      if (oldLines[i] === newLines[j]) {
        dp[i][j] = 1 + dp[i + 1][j + 1];
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const lines: DiffLine[] = [];
  let i = 0;
  let j = 0;
  let added = 0;
  let removed = 0;

  while (i < M && j < N) {
    if (oldLines[i] === newLines[j]) {
      lines.push({
        type: "same",
        content: oldLines[i],
        oldLine: i + 1,
        newLine: j + 1,
      });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      removed++;
      lines.push({
        type: "del",
        content: oldLines[i],
        oldLine: i + 1,
      });
      i++;
    } else {
      added++;
      lines.push({
        type: "add",
        content: newLines[j],
        newLine: j + 1,
      });
      j++;
    }
  }

  while (i < M) {
    removed++;
    lines.push({ type: "del", content: oldLines[i], oldLine: i + 1 });
    i++;
  }

  while (j < N) {
    added++;
    lines.push({ type: "add", content: newLines[j], newLine: j + 1 });
    j++;
  }

  return { added, removed, lines };
}

export interface ChangeApprovalCardProps {
  changedFiles: Partial<Record<string, string>>;
  baselineFiles: Record<string, string>;
  approvalStatus: "pending" | "approved" | "rejected";
  onApprove: () => void;
  onReject: () => void;
  onRevert: () => void;
  className?: string;
}

export function ChangeApprovalCard({
  changedFiles,
  baselineFiles,
  approvalStatus,
  onApprove,
  onReject,
  onRevert,
  className,
}: ChangeApprovalCardProps) {
  const fileNames = React.useMemo(
    () =>
      Object.keys(changedFiles).filter(
        (k) => typeof changedFiles[k] === "string" && changedFiles[k]!.trim().length > 0
      ),
    [changedFiles]
  );

  const [selectedFile, setSelectedFile] = React.useState<string>(
    fileNames[0] || "component.tsx"
  );
  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);
  const [viewMode, setViewMode] = React.useState<"diff" | "full">("diff");
  const [copied, setCopied] = React.useState<boolean>(false);
  const [confirmRevert, setConfirmRevert] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (fileNames.length > 0 && !fileNames.includes(selectedFile)) {
      setSelectedFile(fileNames[0]);
    }
  }, [fileNames, selectedFile]);

  const fileDiffs = React.useMemo(() => {
    const map: Record<
      string,
      { added: number; removed: number; lines: DiffLine[]; newCode: string }
    > = {};
    for (const fname of fileNames) {
      const newCode = changedFiles[fname] || "";
      const oldCode = baselineFiles[fname] || "";
      const diff = computeFileDiff(oldCode, newCode);
      map[fname] = { ...diff, newCode };
    }
    return map;
  }, [fileNames, changedFiles, baselineFiles]);

  const totalStats = React.useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const fname of fileNames) {
      added += fileDiffs[fname]?.added || 0;
      removed += fileDiffs[fname]?.removed || 0;
    }
    return { added, removed };
  }, [fileNames, fileDiffs]);

  if (fileNames.length === 0) return null;

  const activeDiff = fileDiffs[selectedFile] || fileDiffs[fileNames[0]];

  const handleCopyActiveFile = async () => {
    if (!activeDiff) return;
    try {
      await navigator.clipboard.writeText(activeDiff.newCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className={cn(
        "mt-3 rounded-xl border bg-card/90 overflow-hidden shadow-2xs transition-all font-sans select-none",
        approvalStatus === "pending" && "border-border",
        approvalStatus === "approved" && "border-emerald-500/30 bg-emerald-500/[0.02]",
        approvalStatus === "rejected" && "border-border/50 opacity-75",
        className
      )}
    >
      {/* 1. Card Top Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/30">
        <div className="flex items-center gap-2 min-w-0">
          {approvalStatus === "pending" && (
            <GitPullRequest className="size-3.5 text-amber-500 shrink-0" />
          )}
          {approvalStatus === "approved" && (
            <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
          )}
          {approvalStatus === "rejected" && (
            <X className="size-3.5 text-muted-foreground shrink-0" />
          )}

          <span className="text-xs font-semibold text-foreground truncate">
            {approvalStatus === "pending" && "Review Proposed Changes"}
            {approvalStatus === "approved" && "Changes Approved & Applied"}
            {approvalStatus === "rejected" && "Changes Dismissed"}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 font-mono text-[10px] px-1.5 py-0.5 rounded bg-background/80 border border-border/50">
            <span className="text-emerald-500 font-medium">
              +{totalStats.added}
            </span>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-rose-400 font-medium">
              -{totalStats.removed}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground font-sans gap-1 rounded-md"
          >
            <Eye className="size-3" />
            <span>{isExpanded ? "Hide diff" : "Inspect diff"}</span>
            {isExpanded ? (
              <ChevronUp className="size-3" />
            ) : (
              <ChevronDown className="size-3" />
            )}
          </Button>
        </div>
      </div>

      {/* 2. File Summary Rows */}
      <div className="divide-y divide-border/40 bg-background/40">
        {fileNames.map((fname) => {
          const st = fileDiffs[fname];
          const isSelected = isExpanded && selectedFile === fname;
          return (
            <div
              key={fname}
              onClick={() => {
                setSelectedFile(fname);
                if (!isExpanded) setIsExpanded(true);
              }}
              className={cn(
                "flex items-center justify-between px-3 py-1.5 text-xs cursor-pointer transition-colors hover:bg-muted/40",
                isSelected && "bg-muted/50"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileCode className="size-3.5 text-muted-foreground shrink-0" />
                <span className="font-mono text-[11px] font-medium text-foreground truncate">
                  {fname}
                </span>
                <Badge
                  variant="secondary"
                  className="text-[9px] py-0 px-1 font-normal font-sans"
                >
                  {approvalStatus === "approved" ? "Applied" : "Modified"}
                </Badge>
              </div>

              <div className="flex items-center gap-2 shrink-0 font-mono text-[10px]">
                <span className="text-emerald-500">+{st?.added || 0}</span>
                <span className="text-rose-400">-{st?.removed || 0}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Expandable Diff & Code Inspector */}
      {isExpanded && activeDiff && (
        <div className="border-t border-border/60 bg-background/80">
          {/* Inspector Sub-header */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-1">
              {fileNames.map((fname) => (
                <Button
                  key={fname}
                  variant={selectedFile === fname ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedFile(fname)}
                  className="h-6 px-2 text-[10px] font-mono rounded-md"
                >
                  {fname}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === "diff" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("diff")}
                className="h-6 px-2 text-[10px] font-sans rounded-md"
              >
                Diff
              </Button>
              <Button
                variant={viewMode === "full" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("full")}
                className="h-6 px-2 text-[10px] font-sans rounded-md"
              >
                Full File
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyActiveFile}
                className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground font-sans gap-1 rounded-md"
              >
                {copied ? (
                  <>
                    <Check className="size-3 text-emerald-500" />
                    <span className="text-emerald-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Code / Diff Scroll Viewport */}
          <div className="max-h-64 overflow-y-auto overflow-x-auto font-mono text-[11px] leading-relaxed select-text">
            {viewMode === "diff" ? (
              <div className="divide-y divide-border/20">
                {activeDiff.lines.map((line, idx) => {
                  // Only show changed lines and up to 2 context lines around changes for clean readability
                  const hasNearbyChange = activeDiff.lines
                    .slice(Math.max(0, idx - 2), Math.min(activeDiff.lines.length, idx + 3))
                    .some((l) => l.type !== "same");

                  if (!hasNearbyChange) {
                    const prevHadNearby =
                      idx > 0 &&
                      activeDiff.lines
                        .slice(Math.max(0, idx - 3), Math.min(activeDiff.lines.length, idx + 2))
                        .some((l) => l.type !== "same");
                    if (prevHadNearby) {
                      return (
                        <div
                          key={`ctx-${idx}`}
                          className="px-3 py-0.5 text-[10px] text-muted-foreground/50 bg-muted/10 font-mono select-none"
                        >
                          ⋯ unchanged context ⋯
                        </div>
                      );
                    }
                    return null;
                  }

                  return (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-start px-2 py-0.5 whitespace-pre font-mono",
                        line.type === "add" &&
                          "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500",
                        line.type === "del" &&
                          "bg-rose-500/10 text-rose-400 border-l-2 border-rose-500 line-through opacity-80",
                        line.type === "same" && "text-muted-foreground/80"
                      )}
                    >
                      <span className="w-7 shrink-0 text-[10px] text-muted-foreground/50 select-none text-right pr-2">
                        {line.newLine ?? line.oldLine ?? ""}
                      </span>
                      <span className="w-4 shrink-0 select-none font-semibold">
                        {line.type === "add" ? "+" : line.type === "del" ? "-" : " "}
                      </span>
                      <span className="flex-1">{line.content}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <pre className="p-3 whitespace-pre text-foreground/90 font-mono">
                {activeDiff.newCode}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* 4. Approval Action Footer */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-border/60 bg-muted/20">
        {approvalStatus === "pending" && (
          <>
            <span className="text-[11px] text-muted-foreground truncate">
              Apply {fileNames.length === 1 ? fileNames[0] : `${fileNames.length} files`} to editor?
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={onReject}
                className="h-7 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground gap-1 rounded-md font-sans"
              >
                <X className="size-3" />
                <span>Reject</span>
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={onApprove}
                className="h-7 px-3 text-xs font-medium gap-1.5 rounded-md font-sans"
              >
                <Check className="size-3.5" />
                <span>Approve & Apply</span>
              </Button>
            </div>
          </>
        )}

        {approvalStatus === "approved" && (
          <>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-medium truncate">
              <Check className="size-3.5 shrink-0" />
              <span className="truncate">
                Applied to {fileNames.join(", ")}
              </span>
            </div>

            {confirmRevert ? (
              <div className="flex items-center gap-1.5 shrink-0 animate-in fade-in duration-150">
                <span className="text-[10px] text-rose-500 font-sans hidden sm:inline">
                  Overwrite current edits?
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmRevert(false)}
                  className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground font-sans rounded-md"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setConfirmRevert(false);
                    onRevert();
                  }}
                  className="h-6 px-2 text-[10px] font-sans rounded-md gap-1"
                >
                  <RotateCcw className="size-2.5" />
                  <span>Confirm Revert</span>
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmRevert(true)}
                className="h-6.5 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground gap-1 rounded-md font-sans shrink-0"
              >
                <RotateCcw className="size-3" />
                <span>Revert</span>
              </Button>
            )}
          </>
        )}

        {approvalStatus === "rejected" && (
          <>
            <span className="text-[11px] text-muted-foreground truncate">
              Changes were dismissed
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={onApprove}
              className="h-6.5 px-2.5 text-[11px] font-medium text-muted-foreground hover:text-foreground gap-1 rounded-md font-sans shrink-0"
            >
              <Code2 className="size-3" />
              <span>Approve Anyway</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3. SUGGESTIONS (Subtle, High-Signal Developer Chips)
// ==========================================
export interface SuggestionGroupProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function SuggestionGroup({
  children,
  className,
  ...props
}: SuggestionGroupProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center gap-1.5 overflow-x-auto py-1 scrollbar-none select-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface SuggestionProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: "outline" | "secondary" | "default";
}

export function Suggestion({
  icon,
  children,
  className,
  variant = "outline",
  ...props
}: SuggestionProps) {
  return (
    <Button
      variant={variant}
      size="sm"
      className={cn(
        "h-6.5 shrink-0 gap-1.5 rounded-md px-2.5 text-[11px] font-medium border-border/60 hover:border-border hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-all duration-150 select-none",
        className
      )}
      {...props}
    >
      {icon && <span className="size-3 shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </Button>
  );
}

// ==========================================
// 4. PLAN & STANDARDS AUDIT (Refined & Compact)
// ==========================================
export interface TaskItemProps {
  id: string;
  title: string;
  description?: string;
  status: "done" | "running" | "error" | "pending";
}

export interface PlanProps {
  title: string;
  tasks: TaskItemProps[];
  defaultOpen?: boolean;
  onAutoFix?: () => void;
  className?: string;
}

export function Plan({
  title,
  tasks,
  defaultOpen = false,
  onAutoFix,
  className,
}: PlanProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const completedCount = tasks.filter((t) => t.status === "done").length;
  const totalCount = tasks.length;
  const isDone = completedCount === totalCount;
  const errorCount = tasks.filter((t) => t.status === "error").length;

  return (
    <div
      className={cn(
        "rounded-lg border border-border/70 bg-card/50 p-2.5 font-sans transition-all",
        isDone ? "border-emerald-500/30 bg-emerald-500/5" : "",
        className
      )}
    >
      <TraceCollapsible open={isOpen} onOpenChange={setIsOpen}>
        <TraceCollapsibleTrigger
          hideChevron={true}
          className="group/trigger flex w-full items-center justify-between text-left hover:no-underline select-none cursor-pointer"
        >
          <div className="flex items-center gap-2">
            {isDone ? (
              <CheckCircle2 className="size-3.5 text-emerald-500" />
            ) : errorCount > 0 ? (
              <AlertCircle className="size-3.5 text-amber-500" />
            ) : (
              <FileCode className="size-3.5 text-muted-foreground" />
            )}
            <span className="text-xs font-medium text-foreground">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Badge
              variant={isDone ? "secondary" : "outline"}
              className={cn(
                "text-[10px] px-1.5 py-0 font-normal font-sans",
                isDone && "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
              )}
            >
              {completedCount}/{totalCount} passed
            </Badge>
            <ChevronDown className="size-3 text-muted-foreground/60 transition-transform duration-200 group-data-[state=open]/trigger:rotate-180" />
          </div>
        </TraceCollapsibleTrigger>

        <TraceCollapsibleContent className="pt-2.5 mt-2 border-t border-border/40">
          <div className="space-y-1.5">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-2 rounded-md p-1.5 transition-colors hover:bg-muted/40"
              >
                <div className="mt-0.5 shrink-0">
                  {task.status === "done" && (
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                  )}
                  {task.status === "running" && (
                    <Loader2 className="size-3.5 animate-spin text-primary" />
                  )}
                  {task.status === "error" && (
                    <AlertCircle className="size-3.5 text-amber-500" />
                  )}
                  {task.status === "pending" && (
                    <div className="size-3 rounded-full border border-muted-foreground/40 mt-0.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      "text-xs font-medium text-foreground font-sans",
                      task.status === "done" && "text-muted-foreground"
                    )}
                  >
                    {task.title}
                  </div>
                  {task.description && (
                    <div className="text-[11px] text-muted-foreground/80 leading-normal mt-0.5 font-sans">
                      {task.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!isDone && onAutoFix && (
            <div className="mt-2.5 pt-2 border-t border-border/40">
              <Button
                variant="outline"
                size="sm"
                onClick={onAutoFix}
                className="w-full h-7 text-xs font-medium font-sans gap-1.5"
              >
                Auto-Fix Guidelines
              </Button>
            </div>
          )}
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </div>
  );
}

// ==========================================
// 5. ATTACHMENT DIALOGS & PREVIEWS (Clean shadcn)
// ==========================================
export interface AttachCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAttach: (snippet: { title: string; language: string; code: string }) => void;
  currentDemoCode?: string;
  currentCssCode?: string;
}

const COMMON_LANGUAGES = [
  { id: "tsx", label: "TSX / React" },
  { id: "typescript", label: "TypeScript" },
  { id: "css", label: "Tailwind / CSS" },
  { id: "json", label: "JSON" },
  { id: "html", label: "HTML" },
  { id: "javascript", label: "JavaScript" },
];

export function AttachCodeDialog({
  open,
  onOpenChange,
  onAttach,
  currentDemoCode,
  currentCssCode,
}: AttachCodeDialogProps) {
  const [title, setTitle] = React.useState("");
  const [language, setLanguage] = React.useState("tsx");
  const [code, setCode] = React.useState("");

  const handleAttach = () => {
    if (!code.trim()) return;
    onAttach({
      title: title.trim() || `Snippet.${language === "typescript" ? "ts" : language}`,
      language,
      code: code.trim(),
    });
    setTitle("");
    setCode("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg font-sans">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-muted border border-border/60">
              <Code2 className="size-4 text-foreground" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold font-sans">
                Paste Code Snippet
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-sans">
                Attach an external component, style definition, or API schema for Copilot to reference.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* Title and Language Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground/80 font-sans">
                Snippet Name / File
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. CardVariants.tsx"
                className="h-8 text-xs font-sans"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-foreground/80 font-sans">
                Syntax / Language
              </label>
              <div className="flex flex-wrap gap-1">
                {COMMON_LANGUAGES.slice(0, 4).map((lang) => (
                  <Button
                    key={lang.id}
                    type="button"
                    variant={language === lang.id ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setLanguage(lang.id)}
                    className="h-6 px-2 text-[10px] font-sans"
                  >
                    {lang.id.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Code Textarea */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-foreground/80 font-sans">
                Code Content
              </label>
              <div className="flex items-center gap-1.5 text-[10px]">
                {currentDemoCode && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTitle("demo.tsx");
                      setLanguage("tsx");
                      setCode(currentDemoCode);
                    }}
                    className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground font-sans"
                  >
                    Use demo.tsx
                  </Button>
                )}
                {currentCssCode && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTitle("index.css");
                      setLanguage("css");
                      setCode(currentCssCode);
                    }}
                    className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground font-sans"
                  >
                    Use index.css
                  </Button>
                )}
              </div>
            </div>

            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// Paste your React component, Tailwind styles, or TypeScript types here..."
              rows={8}
              className="font-mono text-xs leading-relaxed resize-none bg-muted/30 border-border/70"
            />
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between items-center gap-2 pt-2 border-t border-border/50">
          <span className="text-[11px] text-muted-foreground font-sans hidden sm:inline">
            {code ? `${code.split("\n").length} lines` : "Empty snippet"}
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs font-sans"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleAttach}
              disabled={!code.trim()}
              className="h-8 text-xs font-sans gap-1.5"
            >
              <Check className="size-3.5" />
              Attach Snippet
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ImagePreviewDialog({
  image,
  onClose,
}: {
  image: { url: string; name?: string } | null;
  onClose: () => void;
}) {
  if (!image) return null;

  return (
    <Dialog open={!!image} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl font-sans p-4">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xs font-medium text-foreground truncate max-w-[80%] font-sans">
              {image.name || "Attached Image"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="relative flex items-center justify-center rounded-lg border border-border/60 bg-muted/40 p-2 overflow-hidden max-h-[70vh]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt={image.name || "Preview"}
            className="max-h-[65vh] w-auto max-w-full object-contain rounded select-none"
          />
        </div>

        <DialogFooter className="sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-7 text-xs font-sans"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CodePreviewDialog({
  snippet,
  onClose,
}: {
  snippet: AttachedCodeSnippet | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = React.useState(false);
  if (!snippet) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={!!snippet} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl font-sans">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="size-4 text-muted-foreground" />
              <DialogTitle className="text-xs font-medium text-foreground font-sans">
                {snippet.title}
              </DialogTitle>
              <Badge variant="outline" className="text-[10px] py-0 px-1 font-sans">
                {snippet.language.toUpperCase()}
              </Badge>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 gap-1 px-2 text-xs font-sans"
            >
              {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-border/70 bg-muted/50 p-3">
          <pre className="font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap select-text">
            {snippet.code}
          </pre>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-7 text-xs font-sans"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// 6. PROMPT INPUT (Command-Grade Workspace Input with Image & Code Attachments)
// ==========================================
export interface PromptInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  placeholder?: string;
  modelBadge?: React.ReactNode;
  onModelClick?: () => void;
  className?: string;
  // Attachment hooks
  attachedImages?: AttachedImage[];
  onRemoveImage?: (id: string) => void;
  onPreviewImage?: (image: AttachedImage) => void;
  attachedCodeSnippets?: AttachedCodeSnippet[];
  onRemoveCodeSnippet?: (id: string) => void;
  onPreviewCodeSnippet?: (snippet: AttachedCodeSnippet) => void;
  onAttachImageClick?: () => void;
  onAttachCodeClick?: () => void;
  onImageFilesPasted?: (files: File[]) => void;
}

export function PromptInput({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  placeholder = "Ask Copilot to refactor code, audit guidelines, or add components...",
  modelBadge,
  className,
  attachedImages = [],
  onRemoveImage,
  onPreviewImage,
  attachedCodeSnippets = [],
  onRemoveCodeSnippet,
  onPreviewCodeSnippet,
  onAttachImageClick,
  onAttachCodeClick,
  onImageFilesPasted,
}: PromptInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const hasContent =
        value.trim() ||
        attachedImages.length > 0 ||
        attachedCodeSnippets.length > 0;
      if (hasContent && !isLoading) {
        onSubmit();
      }
    }
  };

  // Support direct clipboard image pasting (e.g. Ctrl+V screenshots)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (!e.clipboardData || !onImageFilesPasted) return;
    const items = Array.from(e.clipboardData.items);
    const imageFiles: File[] = [];

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      onImageFilesPasted(imageFiles);
    }
  };

  // Drag and drop onto prompt box
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onImageFilesPasted) {
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (files.length > 0) {
        onImageFilesPasted(files);
      }
    }
  };

  const hasAttachments =
    attachedImages.length > 0 || attachedCodeSnippets.length > 0;
  const canSubmit =
    (value.trim().length > 0 || hasAttachments) && !isLoading;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col rounded-xl border border-border/70 bg-card/70 p-2 shadow-2xs transition-all duration-150 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 focus-within:bg-background/95",
        isDragOver && "border-foreground/50 ring-2 ring-foreground/20 bg-muted/30",
        className
      )}
    >
      {/* Attached Files & Snippets Tray */}
      {hasAttachments && (
        <div className="flex flex-wrap items-center gap-1.5 pb-2 mb-1.5 border-b border-border/40 select-none animate-in fade-in duration-150 max-h-24 overflow-y-auto pr-1">
          {/* Images */}
          {attachedImages.map((img) => (
            <div
              key={img.id}
              className="group relative flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/50 p-1 pr-2 hover:bg-muted/80 transition-all max-w-[190px]"
            >
              {/* Thumbnail image with preview zoom on click */}
              <button
                type="button"
                onClick={() => onPreviewImage?.(img)}
                title="Click to preview image"
                className="relative size-7 shrink-0 overflow-hidden rounded border border-border/60 cursor-pointer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  className="size-full object-cover"
                />
              </button>

              <div
                onClick={() => onPreviewImage?.(img)}
                className="min-w-0 flex-1 cursor-pointer"
                title={img.name}
              >
                <div className="text-[11px] font-medium text-foreground truncate font-sans">
                  {img.name}
                </div>
                <div className="text-[9px] text-muted-foreground font-sans">
                  {img.sizeBytes
                    ? `${(img.sizeBytes / 1024).toFixed(0)} KB`
                    : "Image"}
                </div>
              </div>

              {onRemoveImage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveImage(img.id);
                  }}
                  className="size-4 rounded-full p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                  title="Remove image"
                >
                  <X className="size-3" />
                  <span className="sr-only">Remove</span>
                </Button>
              )}
            </div>
          ))}

          {/* Code Snippets */}
          {attachedCodeSnippets.map((snip) => (
            <div
              key={snip.id}
              className="group relative flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/50 px-2 py-1 hover:bg-muted/80 transition-all max-w-[200px]"
            >
              <div
                onClick={() => onPreviewCodeSnippet?.(snip)}
                className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer"
                title={snip.title}
              >
                <Code2 className="size-3 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-medium text-foreground truncate font-sans">
                    {snip.title}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-sans">
                    <span className="uppercase font-mono">{snip.language}</span>
                    <span>•</span>
                    <span>{snip.code.split("\n").length}L</span>
                  </div>
                </div>
              </div>

              {onRemoveCodeSnippet && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCodeSnippet(snip.id);
                  }}
                  className="size-4 rounded-full p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
                  title="Remove code snippet"
                >
                  <X className="size-3" />
                  <span className="sr-only">Remove</span>
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Main Textarea */}
      <Textarea
        ref={textareaRef}
        rows={2}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={placeholder}
        disabled={isLoading}
        className="min-h-[48px] max-h-[140px] resize-none border-0 p-1 text-xs bg-transparent shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60 font-sans leading-relaxed text-foreground"
      />

      {/* Bottom Command Toolbar */}
      <div className="flex items-center justify-between pt-1.5 border-t border-border/40 select-none">
        <div className="flex items-center gap-1">
          {/* Attach Image Button */}
          {onAttachImageClick && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onAttachImageClick}
                  className="h-6 gap-1 px-1.5 text-[11px] font-normal text-muted-foreground hover:text-foreground hover:bg-muted font-sans rounded-md"
                >
                  <ImagePlus className="size-3.5" />
                  <span className="hidden sm:inline">Image</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                Attach image mockup or screenshot (Ctrl+V supported)
              </TooltipContent>
            </Tooltip>
          )}

          {/* Paste Code Button */}
          {onAttachCodeClick && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onAttachCodeClick}
                  className="h-6 gap-1 px-1.5 text-[11px] font-normal text-muted-foreground hover:text-foreground hover:bg-muted font-sans rounded-md"
                >
                  <Code2 className="size-3.5" />
                  <span className="hidden sm:inline">Paste Code</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                Paste external code snippet or style reference
              </TooltipContent>
            </Tooltip>
          )}

          <div className="h-3 w-px bg-border/60 mx-0.5 shrink-0" />

          {modelBadge && (
            <div className="shrink-0 whitespace-nowrap flex items-center">
              {modelBadge}
            </div>
          )}

          <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground/75 font-sans shrink-0">
            <FileCode className="size-3 text-muted-foreground/60 shrink-0" />
            <span className="font-mono text-[10px]">component.tsx</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-muted-foreground/60 hidden sm:inline-block font-sans">
            <kbd className="px-1 py-0.5 rounded bg-muted/80 font-mono text-[9px] border border-border/40">
              Enter
            </kbd>{" "}
            to send
          </span>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onSubmit}
            disabled={!canSubmit}
            className={cn(
              "size-7 p-0 rounded-lg shrink-0 font-sans transition-all duration-150",
              canSubmit
                ? "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 hover:scale-105 active:scale-95"
                : "opacity-40"
            )}
            title="Send prompt (Enter)"
          >
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ArrowUp className="size-3.5 stroke-[2.5]" />
            )}
            <span className="sr-only">Send prompt</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
