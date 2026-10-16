"use client";

import React, { useRef, useState, useEffect } from "react";
import { StudioHeader } from "./studio-header";
import { EditorPanel } from "./editor-panel";
import { CanvasPreview } from "./canvas-preview";
import { PublishModal } from "./publish-modal";
import { DependencyModal } from "./dependency-modal";
import { Code, Eye } from "lucide-react";

export function StudioContainer() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("preview");
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

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground font-sans">
      {/* Top Header */}
      <StudioHeader />

      {/* Mobile Tab Toggle (< md screens) */}
      <div className="flex md:hidden border-b border-border bg-background p-1.5 gap-1.5">
        <button
          onClick={() => setMobileTab("editor")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            mobileTab === "editor"
              ? "bg-muted text-foreground border border-border shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Code className="size-3.5" />
          Editor
        </button>
        <button
          onClick={() => setMobileTab("preview")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            mobileTab === "preview"
              ? "bg-muted text-foreground border border-border shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Eye className="size-3.5" />
          Live Preview
        </button>
      </div>

      {/* Main Workspace Body */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Column: Editor Panel */}
        <div
          style={{ width: `${splitRatio}%` }}
          className={`h-full flex-col md:flex ${
            mobileTab === "editor" ? "flex w-full" : "hidden"
          }`}
        >
          <EditorPanel />
        </div>

        {/* Resizable Splitter Divider */}
        <div
          onMouseDown={handleMouseDown}
          className="hidden md:flex relative w-1.5 cursor-col-resize items-center justify-center bg-background hover:bg-primary/20 transition-colors z-20 group"
          title="Drag to resize panels"
        >
          <div className="h-full w-px bg-border group-hover:bg-primary transition-colors" />
        </div>

        {/* Right Column: Canvas Live Preview */}
        <div
          style={{ width: `${100 - splitRatio}%` }}
          className={`h-full flex-1 md:flex ${
            mobileTab === "preview" ? "flex w-full" : "hidden"
          }`}
        >
          <CanvasPreview iframeRef={iframeRef} />
        </div>
      </div>

      {/* Modals & Dialogs */}
      <PublishModal />
      <DependencyModal />
    </div>
  );
}
