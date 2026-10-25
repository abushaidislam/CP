"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StudioHeader } from "./studio-header";
import { EditorPanel } from "./editor-panel";
import { CanvasPreview } from "./canvas-preview";
import { AiAssistantPanel } from "./ai-assistant-panel";
import { PublishModal } from "./publish-modal";
import { DependencyModal } from "./dependency-modal";
import { SaveCheckpointDialog } from "./save-checkpoint-dialog";
import { CreateVariantDialog } from "./create-variant-dialog";
import { VersionHistorySheet } from "./version-history-sheet";
import { TerminalPanel } from "./terminal-panel";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Eye, Sparkles } from "lucide-react";
import { useStudioStore } from "@/lib/store/studio-store";

export interface StudioContainerProps {
  componentId?: string;
}

export function StudioContainer({ componentId: _componentId }: StudioContainerProps = {}) {
  const {
    isAiPanelOpen,
    toggleAiPanel,
    setAiPanelOpen,
    layoutMode,
    isTerminalOpen,
    isHistorySheetOpen,
    isSaveCheckpointDialogOpen,
  } = useStudioStore();



  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [mobileTab, setMobileTab] = useState<"editor" | "preview" | "ai">("preview");
  const [splitRatio, setSplitRatio] = useState(48); // Left width percentage on desktop
  const isDraggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  // Allow dragging the center splitter divider
  const handleMouseDown = () => {
    isDraggingRef.current = true;
    setIsDragging(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const newRatio = (e.clientX / window.innerWidth) * 100;
      if (newRatio >= 25 && newRatio <= 75) {
        setSplitRatio(newRatio);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Global shortcut to toggle AI Copilot (Ctrl+I or Cmd+I)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
        e.preventDefault();
        toggleAiPanel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleAiPanel]);

  // Synchronize mobile tab with layoutMode
  useEffect(() => {
    if (layoutMode === "editor") {
      setMobileTab("editor");
    } else if (layoutMode === "preview") {
      setMobileTab("preview");
    }
  }, [layoutMode]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground font-sans">
      {/* Top Header */}
      <StudioHeader />

      {/* Mobile Tab Toggle (< md screens) */}
      <div className="flex md:hidden border-b border-border bg-background p-2">
        <Tabs
          value={mobileTab}
          onValueChange={(val) => {
            const next = val as "editor" | "preview" | "ai";
            setMobileTab(next);
            if (next === "ai") {
              setAiPanelOpen(true);
            } else {
              setAiPanelOpen(false);
            }
          }}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 w-full h-8">
            <TabsTrigger value="editor" className="gap-1.5 text-xs">
              <Code className="size-3.5" />
              <span>Editor</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-1.5 text-xs">
              <Eye className="size-3.5" />
              <span>Preview</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-1.5 text-xs">
              <Sparkles className="size-3.5" />
              <span>Copilot</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Workspace Body */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Full-screen drag overlay to prevent iframe event interception */}
        {isDragging && (
          <div className="fixed inset-0 z-50 cursor-col-resize select-none bg-transparent" />
        )}

        {/* Workspace Split Area (Editor + Splitter + Canvas) */}
        <div className="relative flex flex-1 overflow-hidden">
          {/* Editor Column */}
          <div
            style={{
              "--split-width": layoutMode === "editor" ? "100%" : `${splitRatio}%`,
            } as React.CSSProperties}
            className={`h-full flex-col min-w-0 ${
              mobileTab === "editor" ? "flex w-full" : "hidden"
            } md:flex ${
              layoutMode === "editor"
                ? "md:w-full"
                : layoutMode === "preview"
                ? "md:hidden"
                : "md:w-[var(--split-width)]"
            }`}
          >
            <EditorPanel />
          </div>

          {/* Resizable Splitter Divider (only when split on desktop) */}
          {layoutMode === "split" && (
            <div
              role="separator"
              aria-orientation="vertical"
              aria-valuenow={Math.round(splitRatio)}
              aria-valuemin={25}
              aria-valuemax={75}
              aria-label="Panel size divider"
              tabIndex={0}
              onMouseDown={handleMouseDown}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") setSplitRatio((r) => Math.max(25, r - 2));
                if (e.key === "ArrowRight") setSplitRatio((r) => Math.min(75, r + 2));
              }}
              className={`hidden md:flex relative w-1.5 cursor-col-resize items-center justify-center bg-background transition-colors duration-150 ease-smooth-out z-20 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                isDragging ? "bg-primary/20" : "hover:bg-primary/20"
              }`}
              title="Drag or use arrow keys to resize panels"
            >
              <div
                className={`h-full w-px transition-colors duration-150 ease-smooth-out ${
                  isDragging ? "bg-primary shadow-[0_0_8px_rgba(0,112,243,0.5)]" : "bg-border group-hover:bg-primary"
                }`}
              />
            </div>
          )}

          {/* Center / Right Column: Canvas Live Preview */}
          <div
            className={`h-full flex-1 overflow-hidden min-w-0 ${
              isHistorySheetOpen || isSaveCheckpointDialogOpen ? "pointer-events-none select-none" : ""
            } ${
              mobileTab === "preview" ? "flex w-full" : "hidden"
            } md:flex ${layoutMode === "editor" ? "md:hidden" : ""}`}
          >
            <CanvasPreview iframeRef={iframeRef} />
          </div>

          {/* Desktop AI Assistant Slide-over with AnimatePresence */}
          <AnimatePresence>
            {isAiPanelOpen && mobileTab !== "ai" && (
              <motion.div
                key="desktop-ai-copilot-drawer"
                initial={{ x: "100%", opacity: 0.8 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0.8 }}
                transition={{
                  type: "spring",
                  damping: 30,
                  stiffness: 320,
                  mass: 0.8,
                }}
                className="hidden md:flex absolute top-0 right-0 bottom-0 z-30 shadow-2xl"
              >
                <AiAssistantPanel
                  isMobile={false}
                  onClose={() => setAiPanelOpen(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile AI Panel View */}
          {mobileTab === "ai" && (
            <div className="flex md:hidden w-full h-full">
              <AiAssistantPanel
                isMobile={true}
                onClose={() => {
                  setAiPanelOpen(false);
                  setMobileTab("preview");
                }}
              />
            </div>
          )}
        </div>

        {/* Full-Width Bottom Terminal Shelf */}
        <AnimatePresence>
          {isTerminalOpen && (
            <motion.div
              key="studio-terminal-shelf"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <TerminalPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals & Dialogs */}
      <PublishModal />
      <DependencyModal />
      <SaveCheckpointDialog />
      <CreateVariantDialog />
      <VersionHistorySheet />
    </div>
  );
}
