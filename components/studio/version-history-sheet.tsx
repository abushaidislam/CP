"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStudioStore, StudioFileName } from "@/lib/store/studio-store";
import { VersionDiffViewer } from "./version-diff-viewer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GitBranch,
  X,
  BookmarkPlus,
  History,
  Eye,
  RotateCcw,
  GitFork,
  Trash2,
  ArrowLeft,
} from "lucide-react";

/**
 * Formats checkpoint creation time into a human-friendly relative or date string.
 */
function formatCheckpointDate(createdAt?: number, timestamp?: string): string {
  const date = createdAt ? new Date(createdAt) : timestamp ? new Date(timestamp) : new Date();
  if (isNaN(date.getTime())) {
    return timestamp || "Recently";
  }

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
}

export function VersionHistorySheet() {
  const {
    variantsByTemplate,
    activeVariantByTemplate,
    currentTemplateId,
    isHistorySheetOpen,
    setHistorySheetOpen,
    selectedCheckpointId,
    setSelectedCheckpointId,
    restoreCheckpoint,
    forkCheckpointToNewVariant,
    deleteCheckpoint,
    files,
    setSaveCheckpointDialogOpen,
  } = useStudioStore();

  const [activeDiffFile, setActiveDiffFile] = useState<StudioFileName>("component.tsx");
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [confirmDiffRestore, setConfirmDiffRestore] = useState(false);
  const [forkingId, setForkingId] = useState<string | null>(null);
  const [forkName, setForkName] = useState<string>("");

  // Resolve active variant and its checkpoints
  const variants = variantsByTemplate[currentTemplateId] || [];
  const activeVariantId = activeVariantByTemplate[currentTemplateId];
  const activeVariant = variants.find((v) => v.id === activeVariantId) || variants[0];
  const checkpoints = activeVariant?.checkpoints || [];

  // Selected checkpoint for diff comparison
  const selectedCp = checkpoints.find((cp) => cp.id === selectedCheckpointId);

  // Close sheet and reset selected diff checkpoint
  const handleClose = React.useCallback(() => {
    setSelectedCheckpointId(null);
    setHistorySheetOpen(false);
  }, [setSelectedCheckpointId, setHistorySheetOpen]);

  // Close sheet on Escape key
  useEffect(() => {
    if (!isHistorySheetOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHistorySheetOpen, handleClose]);

  return (
    <AnimatePresence>
      {isHistorySheetOpen && (
        <>
          {/* Dark semi-transparent backdrop overlay */}
          <motion.div
            key="version-history-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.22,
              ease: [0.22, 1, 0.36, 1],
            }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-black/60 pointer-events-auto"
            aria-hidden="true"
          />

          {/* Drawer container */}
          <motion.div
            key="version-history-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Version History"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%", transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
            transition={{ type: "spring", damping: 30, stiffness: 320, mass: 0.8 }}
            className="fixed inset-y-0 right-0 z-50 flex flex-col bg-background border-l border-border shadow-2xl w-full sm:w-[540px] md:w-[600px] lg:w-[680px] will-change-transform"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <h2 className="font-sans font-semibold text-base text-foreground truncate">
                  Version History
                </h2>
                <Badge variant="outline" className="font-sans text-xs gap-1 shrink-0">
                  <GitBranch className="size-3" />
                  <span className="truncate max-w-[120px]">
                    {activeVariant?.name || "Default"}
                  </span>
                </Badge>
                <Badge variant="secondary" className="font-sans text-xs shrink-0">
                  {`${checkpoints.length} ${checkpoints.length === 1 ? "checkpoint" : "checkpoints"}`}
                </Badge>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={handleClose}
                aria-label="Close version history"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* View Switching: Diff Inspection View vs Timeline View */}
            {selectedCheckpointId !== null ? (
              /* Diff Inspection View */
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Diff Header Bar */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/70 bg-muted/20 shrink-0 gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCheckpointId(null)}
                    className="font-sans text-xs gap-1.5"
                  >
                    <ArrowLeft className="size-3.5" />
                    Back to timeline
                  </Button>

                  <span
                    className="font-sans text-xs font-medium truncate max-w-[200px] text-foreground text-center"
                    title={selectedCp?.name}
                  >
                    {selectedCp?.name || "Checkpoint"}
                  </span>

                  {selectedCp && (
                    !confirmDiffRestore ? (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => setConfirmDiffRestore(true)}
                        className="font-sans text-xs gap-1.5 ml-auto"
                      >
                        <RotateCcw className="size-3.5" />
                        Restore Checkpoint
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1.5 ml-auto animate-in fade-in duration-150">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            restoreCheckpoint(selectedCp.id);
                            setSelectedCheckpointId(null);
                            setConfirmDiffRestore(false);
                          }}
                          className="font-sans text-xs h-7"
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setConfirmDiffRestore(false)}
                          className="font-sans text-xs h-7"
                        >
                          Cancel
                        </Button>
                      </div>
                    )
                  )}
                </div>

                {!selectedCp ? (
                  <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                    <p className="text-xs text-muted-foreground font-sans mb-3">
                      Checkpoint not found or was removed.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCheckpointId(null)}
                      className="font-sans text-xs gap-1.5"
                    >
                      <ArrowLeft className="size-3.5" />
                      Back to timeline
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* File selector tabs */}
                    <div className="px-4 pt-3 pb-2 border-b border-border bg-background/50 shrink-0">
                      <Tabs
                        value={activeDiffFile}
                        onValueChange={(val) => setActiveDiffFile(val as StudioFileName)}
                        className="w-full"
                      >
                        <TabsList className="grid grid-cols-3 w-full h-8">
                          <TabsTrigger value="component.tsx" className="font-mono text-xs">
                            component.tsx
                          </TabsTrigger>
                          <TabsTrigger value="demo.tsx" className="font-mono text-xs">
                            demo.tsx
                          </TabsTrigger>
                          <TabsTrigger value="index.css" className="font-mono text-xs">
                            index.css
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    {/* Diff Viewer container */}
                    <div className="flex-1 overflow-y-auto p-4">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={activeDiffFile}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <VersionDiffViewer
                            oldCode={selectedCp.files[activeDiffFile] || ""}
                            newCode={files[activeDiffFile] || ""}
                            filename={activeDiffFile}
                            oldLabel={selectedCp.name}
                            newLabel="Current Working"
                          />
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Timeline View */
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Action Bar */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-muted/20 shrink-0">
                  <span className="text-xs text-muted-foreground font-sans">
                    Snapshots & Checkpoints
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSaveCheckpointDialogOpen(true)}
                    className="font-sans text-xs gap-1.5"
                  >
                    <BookmarkPlus className="size-3.5" />
                    Save Checkpoint
                  </Button>
                </div>

                {checkpoints.length === 0 ? (
                  /* Empty state */
                  <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
                      <History className="size-6" />
                    </div>
                    <h3 className="text-sm font-medium font-sans text-foreground mb-1">
                      No checkpoints saved yet for this variant.
                    </h3>
                    <p className="text-xs text-muted-foreground font-sans max-w-xs mb-4">
                      Checkpoints allow you to take snapshots of your code and restore them anytime.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setSaveCheckpointDialogOpen(true)}
                      className="font-sans text-xs gap-1.5"
                    >
                      <BookmarkPlus className="size-3.5" />
                      Create First Checkpoint
                    </Button>
                  </div>
                ) : (
                  /* Scrollable timeline list */
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {checkpoints.map((cp, idx) => {
                      const isConfirmingRestore = confirmRestoreId === cp.id;
                      const isForking = forkingId === cp.id;

                      return (
                        <div
                          key={cp.id}
                          className="rounded-lg border border-border/60 bg-card p-3.5 hover:border-primary/40 transition-colors shadow-2xs animate-in fade-in duration-150"
                        >
                          {/* Top row */}
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-sans font-medium text-sm text-foreground break-words flex-1">
                              {cp.name}
                            </span>
                            <span className="text-xs text-muted-foreground font-sans shrink-0 whitespace-nowrap">
                              {formatCheckpointDate(cp.createdAt, cp.timestamp)}
                            </span>
                          </div>

                          {/* Description / notes */}
                          {cp.description && (
                            <p className="text-xs text-muted-foreground font-sans mt-1 line-clamp-2">
                              {cp.description}
                            </p>
                          )}

                          {/* Action buttons row */}
                          <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-border/40">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedCheckpointId(cp.id)}
                              className="h-7 text-xs font-sans gap-1 active:scale-[0.98] transition-all duration-100"
                            >
                              <Eye className="size-3" /> Compare
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setForkingId(null);
                                setConfirmRestoreId(cp.id);
                              }}
                              className="h-7 text-xs font-sans gap-1 text-amber-500 hover:text-amber-400 active:scale-[0.98] transition-all duration-100"
                            >
                              <RotateCcw className="size-3" /> Restore
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setConfirmRestoreId(null);
                                setForkingId(cp.id);
                                setForkName(`Fork of ${cp.name}`);
                              }}
                              className="h-7 text-xs font-sans gap-1 active:scale-[0.98] transition-all duration-100"
                            >
                              <GitFork className="size-3" /> Fork
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirmRestoreId === cp.id) setConfirmRestoreId(null);
                                if (forkingId === cp.id) setForkingId(null);
                                deleteCheckpoint(cp.id);
                              }}
                              className="h-7 text-xs font-sans gap-1 text-destructive hover:text-destructive ml-auto active:scale-[0.98] transition-all duration-100"
                              aria-label={`Delete checkpoint ${cp.name}`}
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>

                          {/* Inline confirmation for Restore */}
                          <AnimatePresence>
                            {isConfirmingRestore && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                                className="overflow-hidden mt-2.5 rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 flex flex-col gap-2"
                              >
                                <p className="text-xs text-amber-500 font-sans">
                                  Restore this checkpoint? Unsaved working changes will be replaced.
                                </p>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      restoreCheckpoint(cp.id);
                                      setSelectedCheckpointId(null);
                                      setConfirmRestoreId(null);
                                    }}
                                    className="font-sans text-xs h-7 active:scale-[0.98] transition-transform duration-100"
                                  >
                                    Yes, Restore
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setConfirmRestoreId(null)}
                                    className="font-sans text-xs h-7 active:scale-[0.98] transition-transform duration-100"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Inline prompt for Fork */}
                          <AnimatePresence>
                            {isForking && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                                className="overflow-hidden mt-2.5 rounded-md border border-border/80 bg-muted/40 p-2.5 flex flex-col gap-2"
                              >
                                <label
                                  htmlFor={`fork-input-${cp.id}`}
                                  className="text-xs font-medium text-foreground font-sans"
                                >
                                  New Variant Name
                                </label>
                                <Input
                                  id={`fork-input-${cp.id}`}
                                  value={forkName}
                                  onChange={(e) => setForkName(e.target.value)}
                                  className="h-8 text-xs font-sans transition-all duration-150"
                                  placeholder="Variant name..."
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && forkName.trim()) {
                                      e.preventDefault();
                                      forkCheckpointToNewVariant(cp.id, forkName.trim());
                                      setForkingId(null);
                                    } else if (e.key === "Escape") {
                                      e.stopPropagation();
                                      setForkingId(null);
                                    }
                                  }}
                                />
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      if (forkName.trim()) {
                                        forkCheckpointToNewVariant(cp.id, forkName.trim());
                                        setForkingId(null);
                                      }
                                    }}
                                    disabled={!forkName.trim()}
                                    className="font-sans text-xs h-7 active:scale-[0.98] transition-transform duration-100"
                                  >
                                    Create Fork
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setForkingId(null)}
                                    className="font-sans text-xs h-7 active:scale-[0.98] transition-transform duration-100"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
