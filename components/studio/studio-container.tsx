"use client";

import React, { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import { StudioHeader } from "./studio-header";
import { EditorPanel } from "./editor-panel";
import { CanvasPreview } from "./canvas-preview";
import { SaveCheckpointDialog } from "./save-checkpoint-dialog";
import { CreateVariantDialog } from "./create-variant-dialog";
import { KeyboardShortcutsDialog } from "./keyboard-shortcuts-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Eye, Sparkles } from "lucide-react";
import { useStudioStore } from "@/lib/store/studio-store";
import { useSyncSecuritySession } from "@/lib/hooks/use-sync-security-session";

// Code-split heavy optional panels & modals so initial Studio workspace stays lightweight
const AiAssistantPanel = dynamic(
  () => import("./ai-assistant-panel").then((mod) => mod.AiAssistantPanel),
  { ssr: false }
);
const TerminalPanel = dynamic(
  () => import("./terminal-panel").then((mod) => mod.TerminalPanel),
  { ssr: false }
);
const DependencyModal = dynamic(
  () => import("./dependency-modal").then((mod) => mod.DependencyModal),
  { ssr: false }
);
const VersionHistorySheet = dynamic(
  () => import("./version-history-sheet").then((mod) => mod.VersionHistorySheet),
  { ssr: false }
);
const SecurityShieldModal = dynamic(
  () => import("./security-shield-modal").then((mod) => mod.SecurityShieldModal),
  { ssr: false }
);
const RepoSyncModal = dynamic(
  () => import("./repo-sync-modal").then((mod) => mod.RepoSyncModal),
  { ssr: false }
);

export interface StudioContainerProps {
  componentId?: string;
}

export function StudioContainer(props: StudioContainerProps = {}) {
  void props.componentId;
  const {
    isAiPanelOpen,
    toggleAiPanel,
    setAiPanelOpen,
    layoutMode,
    isTerminalOpen,
    isHistorySheetOpen,
    isSaveCheckpointDialogOpen,
    isCreateVariantDialogOpen,
    isDependencyModalOpen,
    isSecurityModalOpen,
    isRepoSyncModalOpen,
    isPublishModalOpen,
    autoSaveToRepo,
    repoSyncStatus,
    currentTemplateId,
    hydrateFromProjectRepo,
    saveComponentToProjectRepo,
    setRecordingModalOpen,
  } = useStudioStore(
    useShallow((state) => ({
      isAiPanelOpen: state.isAiPanelOpen,
      toggleAiPanel: state.toggleAiPanel,
      setAiPanelOpen: state.setAiPanelOpen,
      layoutMode: state.layoutMode,
      isTerminalOpen: state.isTerminalOpen,
      isHistorySheetOpen: state.isHistorySheetOpen,
      isSaveCheckpointDialogOpen: state.isSaveCheckpointDialogOpen,
      isCreateVariantDialogOpen: state.isCreateVariantDialogOpen,
      isDependencyModalOpen: state.isDependencyModalOpen,
      isSecurityModalOpen: state.isSecurityModalOpen,
      isRepoSyncModalOpen: state.isRepoSyncModalOpen,
      isPublishModalOpen: state.isPublishModalOpen,
      autoSaveToRepo: state.autoSaveToRepo,
      repoSyncStatus: state.repoSyncStatus,
      currentTemplateId: state.currentTemplateId,
      hydrateFromProjectRepo: state.hydrateFromProjectRepo,
      saveComponentToProjectRepo: state.saveComponentToProjectRepo,
      setRecordingModalOpen: state.setRecordingModalOpen,
    }))
  );

  useSyncSecuritySession();

  useEffect(() => {
    hydrateFromProjectRepo?.();
  }, [hydrateFromProjectRepo]);

  // Debounced auto-save to project repository when edits are made and autoSaveToRepo is on
  useEffect(() => {
    if (!autoSaveToRepo || repoSyncStatus !== "dirty") return;
    const timer = setTimeout(() => {
      saveComponentToProjectRepo?.({ componentId: currentTemplateId });
    }, 1800);
    return () => clearTimeout(timer);
  }, [autoSaveToRepo, repoSyncStatus, currentTemplateId, saveComponentToProjectRepo]);



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

  // Global shortcuts: Ctrl/Cmd+I for AI Copilot, Ctrl/Cmd+Shift+E for Video Capture side panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
        e.preventDefault();
        toggleAiPanel();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        const latest = useStudioStore.getState();
        const nextOpen = !latest.isRecordingModalOpen;
        if (nextOpen) {
          if (latest.layoutMode === "editor") {
            latest.setLayoutMode("split");
          }
          setMobileTab("preview");
        }
        setRecordingModalOpen(nextOpen);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleAiPanel, setRecordingModalOpen]);

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
      <main
        id="main-content"
        tabIndex={-1}
        aria-label="Component Studio Workspace"
        className="relative flex flex-1 flex-col overflow-hidden focus:outline-none"
      >
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
                if (e.key === "Home") {
                  e.preventDefault();
                  setSplitRatio(25);
                }
                if (e.key === "End") {
                  e.preventDefault();
                  setSplitRatio(75);
                }
              }}
              className={`hidden md:flex relative w-1.5 cursor-col-resize items-center justify-center bg-background transition-colors duration-150 ease-smooth-out z-20 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
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
            {isAiPanelOpen && (
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
                className="hidden md:flex absolute top-0 right-0 bottom-0 z-30 shadow-2xl max-w-[calc(100vw-48px)]"
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
            <div className="flex md:hidden w-full h-full min-h-0 min-w-0 overflow-hidden">
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
      </main>

      {/* Modals & Dialogs (Conditionally mounted & code-split when closed) */}
      {(isRepoSyncModalOpen || isPublishModalOpen) && <RepoSyncModal />}
      {isDependencyModalOpen && <DependencyModal />}
      {isSaveCheckpointDialogOpen && <SaveCheckpointDialog />}
      {isCreateVariantDialogOpen && <CreateVariantDialog />}
      {isHistorySheetOpen && <VersionHistorySheet />}
      <KeyboardShortcutsDialog />
      {isSecurityModalOpen && <SecurityShieldModal />}
    </div>
  );
}
