"use client";

import React, { useMemo } from "react";
import { StudioFileName } from "@/lib/store/studio-store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FileCode2, CheckCircle2 } from "lucide-react";

export type DiffLineType = "added" | "removed" | "unchanged";

export interface DiffLine {
  type: DiffLineType;
  oldLineNumber: number | null;
  newLineNumber: number | null;
  content: string;
}

export interface DiffResult {
  lines: DiffLine[];
  addedCount: number;
  removedCount: number;
}

export interface VersionDiffViewerProps {
  oldCode: string; // The checkpoint code
  newCode: string; // The current working code (or code being compared)
  filename: StudioFileName;
  oldLabel?: string; // Default: "Checkpoint"
  newLabel?: string; // Default: "Current"
  className?: string;
}

/**
 * Computes a line-by-line diff between two strings using longest common subsequence (LCS)
 * with common prefix and suffix optimizations.
 */
export function computeLineDiff(oldCode: string, newCode: string): DiffResult {
  const cleanOld = oldCode.replace(/\r\n/g, "\n");
  const cleanNew = newCode.replace(/\r\n/g, "\n");

  if (cleanOld === cleanNew) {
    if (cleanOld.length === 0) {
      return { lines: [], addedCount: 0, removedCount: 0 };
    }
    const lines: DiffLine[] = cleanOld.split("\n").map((content, idx) => ({
      type: "unchanged",
      oldLineNumber: idx + 1,
      newLineNumber: idx + 1,
      content,
    }));
    return { lines, addedCount: 0, removedCount: 0 };
  }

  const oldLines = cleanOld.length === 0 ? [] : cleanOld.split("\n");
  const newLines = cleanNew.length === 0 ? [] : cleanNew.split("\n");

  if (oldLines.length === 0) {
    const lines: DiffLine[] = newLines.map((content, idx) => ({
      type: "added",
      oldLineNumber: null,
      newLineNumber: idx + 1,
      content,
    }));
    return { lines, addedCount: lines.length, removedCount: 0 };
  }

  if (newLines.length === 0) {
    const lines: DiffLine[] = oldLines.map((content, idx) => ({
      type: "removed",
      oldLineNumber: idx + 1,
      newLineNumber: null,
      content,
    }));
    return { lines, addedCount: 0, removedCount: lines.length };
  }

  // 1. Identify common prefix
  let prefixCount = 0;
  while (
    prefixCount < oldLines.length &&
    prefixCount < newLines.length &&
    oldLines[prefixCount] === newLines[prefixCount]
  ) {
    prefixCount++;
  }

  // 2. Identify common suffix
  let suffixCount = 0;
  while (
    suffixCount < oldLines.length - prefixCount &&
    suffixCount < newLines.length - prefixCount &&
    oldLines[oldLines.length - 1 - suffixCount] ===
      newLines[newLines.length - 1 - suffixCount]
  ) {
    suffixCount++;
  }

  const midA = oldLines.slice(prefixCount, oldLines.length - suffixCount);
  const midB = newLines.slice(prefixCount, newLines.length - suffixCount);

  // 3. LCS dynamic programming on remaining middle section
  const nA = midA.length;
  const nB = midB.length;
  const dp: number[][] = Array.from({ length: nA + 1 }, () =>
    new Array(nB + 1).fill(0)
  );

  for (let i = 0; i < nA; i++) {
    for (let j = 0; j < nB; j++) {
      if (midA[i] === midB[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  let i = nA;
  let j = nB;
  const midOps: Array<{ type: DiffLineType; content: string }> = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && midA[i - 1] === midB[j - 1]) {
      midOps.push({ type: "unchanged", content: midA[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      midOps.push({ type: "added", content: midB[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      midOps.push({ type: "removed", content: midA[i - 1] });
      i--;
    }
  }

  midOps.reverse();

  // 4. Assemble final lines with line numbering
  let curOld = 1;
  let curNew = 1;
  const lines: DiffLine[] = [];
  let addedCount = 0;
  let removedCount = 0;

  // Prefix
  for (let p = 0; p < prefixCount; p++) {
    lines.push({
      type: "unchanged",
      oldLineNumber: curOld++,
      newLineNumber: curNew++,
      content: oldLines[p],
    });
  }

  // Middle
  for (const op of midOps) {
    if (op.type === "unchanged") {
      lines.push({
        type: "unchanged",
        oldLineNumber: curOld++,
        newLineNumber: curNew++,
        content: op.content,
      });
    } else if (op.type === "removed") {
      removedCount++;
      lines.push({
        type: "removed",
        oldLineNumber: curOld++,
        newLineNumber: null,
        content: op.content,
      });
    } else if (op.type === "added") {
      addedCount++;
      lines.push({
        type: "added",
        oldLineNumber: null,
        newLineNumber: curNew++,
        content: op.content,
      });
    }
  }

  // Suffix
  for (let s = oldLines.length - suffixCount; s < oldLines.length; s++) {
    lines.push({
      type: "unchanged",
      oldLineNumber: curOld++,
      newLineNumber: curNew++,
      content: oldLines[s],
    });
  }

  return { lines, addedCount, removedCount };
}

export function VersionDiffViewer({
  oldCode,
  newCode,
  filename,
  oldLabel = "Checkpoint",
  newLabel = "Current",
  className,
}: VersionDiffViewerProps) {
  const { lines, addedCount, removedCount } = useMemo(
    () => computeLineDiff(oldCode, newCode),
    [oldCode, newCode]
  );

  const isClean = addedCount === 0 && removedCount === 0;

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card/60 overflow-hidden flex flex-col",
        className
      )}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/40 text-foreground">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode2 className="size-3.5 text-muted-foreground shrink-0" />
          <span className="font-mono text-xs font-medium text-foreground truncate">
            {filename}
          </span>
          <div className="flex items-center gap-1.5 ml-1 shrink-0">
            {addedCount > 0 && (
              <span className="text-xs text-emerald-400 font-sans font-medium">
                {`+${addedCount}`}
              </span>
            )}
            {removedCount > 0 && (
              <span className="text-xs text-rose-400 font-sans font-medium">
                {`-${removedCount}`}
              </span>
            )}
          </div>
        </div>

        <Badge
          variant="outline"
          className="text-[10px] font-sans text-muted-foreground shrink-0"
        >
          {oldLabel} vs {newLabel}
        </Badge>
      </div>

      {/* Code lines container / Empty state */}
      {isClean ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <CheckCircle2 className="size-8 text-emerald-500/80 mb-2.5" />
          <p className="font-sans text-xs text-muted-foreground">
            No changes detected between this checkpoint and current files.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-auto max-h-[460px] py-1 font-mono text-xs">
          <div className="min-w-full w-fit">
            {lines.map((line, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-stretch leading-5 transition-colors",
                  line.type === "added" &&
                    "bg-emerald-500/10 text-emerald-300 border-l-2 border-emerald-500",
                  line.type === "removed" &&
                    "bg-rose-500/10 text-rose-300 border-l-2 border-rose-500",
                  line.type === "unchanged" &&
                    "text-muted-foreground/90 border-l-2 border-transparent hover:bg-muted/30"
                )}
              >
                {/* Old line number gutter */}
                <span
                  aria-hidden="true"
                  className="w-8 shrink-0 font-mono text-[11px] text-muted-foreground/60 text-right pr-2 select-none"
                >
                  {line.oldLineNumber ?? ""}
                </span>

                {/* New line number gutter */}
                <span
                  aria-hidden="true"
                  className="w-8 shrink-0 font-mono text-[11px] text-muted-foreground/60 text-right pr-2 select-none"
                >
                  {line.newLineNumber ?? ""}
                </span>

                {/* Prefix indicator */}
                <span
                  aria-hidden="true"
                  className="w-4 shrink-0 font-mono select-none px-1 text-center"
                >
                  {line.type === "added"
                    ? "+"
                    : line.type === "removed"
                    ? "-"
                    : " "}
                </span>

                {/* Line content */}
                <span className="font-mono text-xs whitespace-pre select-text flex-1 min-h-[1.25rem] pr-2">
                  {line.content || "\u00A0"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
