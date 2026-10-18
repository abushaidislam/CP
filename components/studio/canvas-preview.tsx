"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  useStudioStore,
  StudioViewport,
  CanvasBackground,
  PreviewTheme,
} from "@/lib/store/studio-store";
import { compileSandboxHtml } from "@/lib/sandbox/sandbox-compiler";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Monitor,
  Tablet,
  Smartphone,
  Maximize2,
  Minimize2,
  RefreshCw,
  MousePointerClick,
  Layers,
  Paintbrush,
  Sun,
  Moon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface CanvasPreviewProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

export function CanvasPreview({ iframeRef }: CanvasPreviewProps) {
  const {
    files,
    viewport,
    canvasBg,
    previewTheme,
    zoom,
    dependencies,
    setViewport,
    setCanvasBg,
    setPreviewTheme,
    setZoom,
    setCompilerState,
    addTerminalLog,
  } = useStudioStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSimulatingHover, setIsSimulatingHover] = useState(false);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [draggedWidth, setDraggedWidth] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);

  // Reset custom dragged width when user picks a viewport button
  const handleSelectViewport = (vp: StudioViewport) => {
    setDraggedWidth(null);
    setViewport(vp);
  };

  // Change preview theme (Dark / Light) with immediate postMessage to sandbox iframe
  const handleThemeChange = (nextTheme: PreviewTheme) => {
    setPreviewTheme(nextTheme);

    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "SET_PREVIEW_THEME",
          theme: nextTheme,
        },
        "*"
      );
    }
  };

  // Compile sandbox HTML when code or settings change
  const { html, error } = useMemo(() => {
    return compileSandboxHtml(
      files["component.tsx"],
      files["demo.tsx"],
      files["index.css"],
      dependencies,
      canvasBg,
      previewTheme
    );
  }, [files, dependencies, canvasBg, previewTheme, reloadKey]);

  // Sync compiler errors with store
  useEffect(() => {
    if (error) {
      setCompilerState(false, error);
    } else {
      setCompilerState(false, null);
    }
  }, [error, setCompilerState]);

  // Listen for iframe postMessage events
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data) {
        if (event.data.type === "TRIGGER_SIMULATED_HOVER") {
          setIsSimulatingHover(true);
          setTimeout(() => setIsSimulatingHover(false), event.data.durationMs || 4000);
        }
        if (event.data.type === "RUNTIME_ERROR") {
          setCompilerState(false, event.data.message);
        }
        if (event.data.type === "SANDBOX_CONSOLE") {
          addTerminalLog({
            type: event.data.level,
            message: event.data.message,
          });
        }
        if (event.data.type === "COMMAND_RESULT") {
          if (event.data.success) {
            addTerminalLog({
              type: "result",
              message: event.data.result,
            });
          } else {
            addTerminalLog({
              type: "error",
              message: `Error: ${event.data.error}`,
            });
          }
        }
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [setCompilerState, addTerminalLog]);

  // Interactive Drag-to-Resize Handle
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current || !cardRef.current || !containerRef.current) return;
      const cardRect = cardRef.current.getBoundingClientRect();
      const newWidth = Math.max(320, Math.min(1600, e.clientX - cardRect.left));
      setDraggedWidth(Math.round(newWidth));
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
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

  // Determine current active width
  const getComputedWidth = () => {
    if (draggedWidth !== null) return `${draggedWidth}px`;
    switch (viewport) {
      case "mobile":
        return "375px";
      case "tablet":
        return "768px";
      case "desktop":
        return "1200px";
      case "responsive":
      default:
        return "100%";
    }
  };

  const getCanvasBackgroundClass = (bg: CanvasBackground) => {
    switch (bg) {
      case "mesh":
        return "vercel-mesh-gradient dark:vercel-mesh-gradient-dark";
      case "grid":
        return "canvas-grid-light dark:canvas-grid-dark";
      case "light":
        return "bg-zinc-100";
      case "black":
        return "bg-black";
      case "dark":
      default:
        return "bg-muted/30";
    }
  };

  const triggerTestSimulation = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      setIsSimulatingHover(true);
      iframeRef.current.contentWindow.postMessage(
        {
          type: "TRIGGER_SIMULATED_HOVER",
          durationMs: 4000,
        },
        "*"
      );
      setTimeout(() => setIsSimulatingHover(false), 4200);
    }
  };

  const isFluidResponsive = viewport === "responsive" && draggedWidth === null;

  return (
    <div
      ref={containerRef}
      className={`flex h-full w-full flex-col bg-background ${
        isFullscreen ? "fixed inset-0 z-50" : "relative"
      }`}
    >
      {/* Top Toolbar */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-background px-3 select-none">
        {/* Left: Viewport & Theme Segmented Controls */}
        <div className="flex items-center gap-2">
          {/* Viewport Control via Shadcn Tabs */}
          <Tabs
            value={isFluidResponsive ? "responsive" : viewport}
            onValueChange={(val) => handleSelectViewport(val as StudioViewport)}
          >
            <TabsList className="h-7 bg-muted/60 p-0.5">
              <TabsTrigger value="responsive" className="h-6 gap-1.5 px-2.5 text-xs font-sans">
                <Layers className="size-3.5" />
                <span className="hidden sm:inline">Fluid</span>
              </TabsTrigger>
              <TabsTrigger value="desktop" className="h-6 gap-1.5 px-2.5 text-xs font-sans">
                <Monitor className="size-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </TabsTrigger>
              <TabsTrigger value="tablet" className="h-6 gap-1.5 px-2.5 text-xs font-sans">
                <Tablet className="size-3.5" />
                <span className="hidden sm:inline">Tablet</span>
              </TabsTrigger>
              <TabsTrigger value="mobile" className="h-6 gap-1.5 px-2.5 text-xs font-sans">
                <Smartphone className="size-3.5" />
                <span className="hidden sm:inline">Mobile</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Separator orientation="vertical" className="h-4 hidden sm:block" />

          {/* Width Indicator */}
          <span className="hidden sm:inline text-xs text-muted-foreground tabular-nums select-none">
            {draggedWidth !== null
              ? `${draggedWidth}px`
              : isFluidResponsive
              ? "100% Fluid"
              : getComputedWidth()}
          </span>
        </div>

        {/* Center: Subtle Status */}
        <div className="flex items-center gap-2">
          {isSimulatingHover && (
            <span className="text-[11px] text-muted-foreground animate-pulse">
              Simulating pointer...
            </span>
          )}
        </div>

        {/* Right: Controls & Zoom */}
        <div className="flex items-center gap-1">
          {/* Simulated Hover trigger */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={triggerTestSimulation}
                disabled={isSimulatingHover}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <MousePointerClick className="size-3.5" />
                <span className="hidden lg:inline text-xs">Simulate</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Simulate pointer hover & interactions inside sandbox
            </TooltipContent>
          </Tooltip>

          {/* Component Preview Dark / Light Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleThemeChange(previewTheme === "dark" ? "light" : "dark")}
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                {previewTheme === "dark" ? (
                  <Sun className="size-3.5 text-amber-500" />
                ) : (
                  <Moon className="size-3.5 text-sky-400" />
                )}
                <span className="sr-only">Toggle preview theme</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Preview theme: {previewTheme === "dark" ? "Dark (click for Light)" : "Light (click for Dark)"}
            </TooltipContent>
          </Tooltip>

          {/* Canvas Background Dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-foreground"
                  >
                    <Paintbrush className="size-3.5" />
                    <span className="sr-only">Canvas background</span>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Canvas background style</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-40 font-sans">
              <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">
                Backdrop
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCanvasBg("mesh")}>
                Subtle Ambient
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCanvasBg("grid")}>
                Dot Grid
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCanvasBg("light")}>
                Solid Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCanvasBg("dark")}>
                Neutral Dark
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCanvasBg("black")}>
                Pure Black
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Zoom Dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    {zoom}%
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Canvas Zoom</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-24">
              <DropdownMenuItem onClick={() => setZoom(50)}>50%</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setZoom(75)}>75%</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setZoom(100)}>100%</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setZoom(125)}>125%</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setZoom(150)}>150%</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Refresh Canvas */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setReloadKey((k) => k + 1)}
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="size-3.5" />
                <span className="sr-only">Reload sandbox</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Force reload sandbox</TooltipContent>
          </Tooltip>

          {/* Fullscreen Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                {isFullscreen ? (
                  <Minimize2 className="size-3.5" />
                ) : (
                  <Maximize2 className="size-3.5" />
                )}
                <span className="sr-only">Fullscreen preview</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isFullscreen ? "Exit fullscreen" : "Fullscreen preview"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Main Canvas Workspace */}
      <div
        className={`flex-1 relative overflow-auto p-4 md:p-6 flex items-center justify-center transition-colors duration-250 ease-smooth-out ${getCanvasBackgroundClass(
          canvasBg
        )}`}
      >
        {/* Elevated Canvas Card */}
        <div
          ref={cardRef}
          style={{
            width: getComputedWidth(),
            maxWidth: isFluidResponsive ? "100%" : "none",
            height: "100%",
            maxHeight: "100%",
            transform: `scale(${zoom / 100})`,
            transformOrigin: "center center",
          }}
          className={`relative ${
            draggedWidth !== null ? "transition-none" : "transition-all duration-250 ease-smooth-out"
          } rounded-xl border border-border shadow-md overflow-hidden bg-background flex flex-col ${
            isFluidResponsive ? "w-full" : ""
          }`}
        >
          {/* Sandboxed Live Iframe with matching theme surface */}
          <div
            className={`relative flex-1 w-full h-full overflow-hidden transition-colors duration-250 ease-smooth-out ${
              previewTheme === "dark" ? "bg-zinc-950" : "bg-white"
            }`}
          >
            <iframe
              ref={iframeRef}
              key={reloadKey}
              srcDoc={html}
              title="21st.dev Live Component Preview"
              sandbox="allow-scripts allow-same-origin allow-modals allow-popups"
              className="w-full h-full border-none bg-transparent"
            />
          </div>

          {/* Interactive Right Edge Drag-to-Resize Handle */}
          <div
            onMouseDown={handleResizeStart}
            title="Drag horizontally to resize preview width"
            className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-primary/10 flex items-center justify-center transition-colors duration-150 ease-smooth-out group z-20"
          >
            <div className="h-8 w-1 rounded-full bg-border group-hover:bg-primary transition-colors duration-150 ease-smooth-out" />
          </div>
        </div>
      </div>
    </div>
  );
}
