"use client";

import React, { useRef, useState, useEffect } from "react";
import { StudioHeader } from "./studio-header";
import { EditorPanel } from "./editor-panel";
import { CanvasPreview } from "./canvas-preview";
import { AiAssistantPanel } from "./ai-assistant-panel";
import { PublishModal } from "./publish-modal";
import { DependencyModal } from "./dependency-modal";
import { TerminalPanel } from "./terminal-panel";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Eye, Sparkles } from "lucide-react";
import { useStudioStore } from "@/lib/store/studio-store";

export function StudioContainer() {
  const { isAiPanelOpen, toggleAiPanel, layoutMode, isTerminalOpen } = useStudioStore();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [mobileTab, setMobileTab] = useState<"editor" | "preview" | "ai">("preview");
  const [splitRatio, setSplitRatio] = useState(48); // Left width percentage on desktop
  const isDraggingRef = useRef(false);

  // Allow dragging the center splitter divider
  const handleMouseDown = () => {
    isDraggingRef.current = true;
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

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground font-sans">
      {/* Top Header */}
      <StudioHeader />

      {/* Mobile Tab Toggle (< md screens) */}
      <div className="flex md:hidden border-b border-border bg-background p-2">
        <Tabs
          value={mobileTab}
          onValueChange={(val) => setMobileTab(val as "editor" | "preview" | "ai")}
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
              <Sparkles className="size-3.5 text-primary" />
              <span>Copilot</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Workspace Body */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Workspace Split Area (Editor + Splitter + Canvas) */}
        <div className="relative flex flex-1 overflow-hidden">
          {/* Editor Column */}
          {(layoutMode === "split" || layoutMode === "editor") && (
            <div
              style={{
                width: layoutMode === "editor" ? "100%" : `${splitRatio}%`,
              }}
              className={`h-full flex-col md:flex ${
                mobileTab === "editor"
                  ? "flex w-full"
                  : layoutMode === "editor"
                  ? "flex"
                  : "hidden"
              }`}
            >
              <EditorPanel />
            </div>
          )}

          {/* Resizable Splitter Divider (only when split) */}
          {layoutMode === "split" && (
            <div
              onMouseDown={handleMouseDown}
              className="hidden md:flex relative w-1.5 cursor-col-resize items-center justify-center bg-background hover:bg-primary/20 transition-colors duration-150 ease-smooth-out z-20 group"
              title="Drag to resize panels"
            >
              <div className="h-full w-px bg-border group-hover:bg-primary transition-colors duration-150 ease-smooth-out" />
            </div>
          )}

          {/* Center / Right Column: Canvas Live Preview */}
          {(layoutMode === "split" || layoutMode === "preview") && (
            <div
              className={`h-full flex-1 md:flex overflow-hidden ${
                mobileTab === "preview"
                  ? "flex w-full"
                  : layoutMode === "preview"
                  ? "flex"
                  : "hidden"
              }`}
            >
              <CanvasPreview iframeRef={iframeRef} />
            </div>
          )}

          {/* AI Assistant Panel: Smooth slide-over drawer on desktop, tab view on mobile */}
          <div
            className={`transition-transform duration-250 ease-smooth-out ${
              mobileTab === "ai"
                ? "flex w-full h-full"
                : isAiPanelOpen
                ? "hidden md:flex absolute top-0 right-0 bottom-0 z-30 shadow-2xl animate-in slide-in-from-right duration-200"
                : "hidden"
            }`}
          >
            <AiAssistantPanel />
          </div>
        </div>

        {/* Full-Width Bottom Terminal Shelf */}
        {isTerminalOpen && <TerminalPanel />}
      </div>

      {/* Modals & Dialogs */}
      <PublishModal />
      <DependencyModal />
    </div>
  );
}
