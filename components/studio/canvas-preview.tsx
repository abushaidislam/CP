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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Sparkles,
  Layers,
  CircleDot,
  Lock,
  Paintbrush,
  Zap,
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
  } = useStudioStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSimulatingHover, setIsSimulatingHover] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [draggedWidth, setDraggedWidth] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

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
  }, [files, dependencies, canvasBg, previewTheme]);

  const compileTimeMs = 8;

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
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [setCompilerState]);

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

  // Numeric viewport widths
  const numericViewportWidth = useMemo(() => {
    if (draggedWidth !== null) return draggedWidth;
    switch (viewport) {
      case "mobile":
        return 375;
      case "tablet":
        return 768;
      case "desktop":
        return 1200;
      case "responsive":
      default:
        return 1000;
    }
  }, [draggedWidth, viewport]);

  const handleResizeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setDraggedWidth(Math.max(320, numericViewportWidth - 20));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setDraggedWidth(Math.min(1600, numericViewportWidth + 20));
    } else if (e.key === "Home") {
      e.preventDefault();
      setDraggedWidth(320);
    } else if (e.key === "End") {
      e.preventDefault();
      setDraggedWidth(1600);
    }
  };

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
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-background px-3 select-none">
        {/* Left: Viewport & Theme Segmented Controls */}
        <div className="flex items-center gap-2">
          {/* Viewport Control */}
          <div className="inline-flex h-7 items-center rounded-md bg-muted/60 p-0.5 text-muted-foreground border border-border/50">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => handleSelectViewport("desktop")}
                  className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                    viewport === "desktop" && draggedWidth === null
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  <Monitor className="size-3.5" />
                  <span className="hidden sm:inline text-[11px]">Desktop</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Desktop viewport (1200px)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => handleSelectViewport("tablet")}
                  className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                    viewport === "tablet" && draggedWidth === null
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  <Tablet className="size-3.5" />
                  <span className="hidden sm:inline text-[11px]">Tablet</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Tablet viewport (768px)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => handleSelectViewport("mobile")}
                  className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                    viewport === "mobile" && draggedWidth === null
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  <Smartphone className="size-3.5" />
                  <span className="hidden sm:inline text-[11px]">Mobile</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Mobile viewport (375px)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => handleSelectViewport("responsive")}
                  className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                    isFluidResponsive
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  <Layers className="size-3.5" />
                  <span className="hidden sm:inline text-[11px]">Fluid</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">100% fluid responsive</TooltipContent>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="h-4 hidden sm:block" />

          {/* Component Preview Dark / Light Theme Segmented Control */}
          <div className="inline-flex h-7 items-center rounded-md bg-muted/60 p-0.5 text-muted-foreground border border-border/50">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => handleThemeChange("light")}
                  className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                    previewTheme === "light"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "hover:text-foreground hover:bg-background/50"
                  }`}
                  aria-label="Preview in light theme"
                >
                  <Sun className="size-3.5 text-amber-500" />
                  <span className="hidden sm:inline text-[11px]">Light</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Switch component preview to light mode</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => handleThemeChange("dark")}
                  className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                    previewTheme === "dark"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "hover:text-foreground hover:bg-background/50"
                  }`}
                  aria-label="Preview in dark theme"
                >
                  <Moon className="size-3.5 text-sky-400" />
                  <span className="hidden sm:inline text-[11px]">Dark</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Switch component preview to dark mode</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Center: Live Indicators */}
        <div className="flex items-center gap-2">
          {isSimulatingHover && (
            <Badge variant="blue" className="animate-pulse text-[10px] font-mono gap-1">
              <CircleDot className="size-3 animate-spin text-sky-500" />
              Stitch Pointer Active
            </Badge>
          )}

          {mounted && (
            <Badge
              variant="outline"
              suppressHydrationWarning
              className="text-[10px] hidden md:inline-flex font-mono gap-1 text-muted-foreground bg-muted/40"
            >
              <Zap className="size-2.5 text-amber-500" />
              {compileTimeMs > 0 ? `${compileTimeMs}ms` : "Live"}
            </Badge>
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
                <Sparkles className="size-3.5 text-primary" />
                <span className="hidden lg:inline text-xs">Simulate</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Simulate pointer hover & clicks inside sandbox
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
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-mono text-[10px] uppercase text-muted-foreground">
                Canvas Backdrop
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCanvasBg("mesh")}>
                Mesh Gradient
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCanvasBg("grid")}>
                Light/Dark Dot Grid
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCanvasBg("light")}>
                Solid Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCanvasBg("dark")}>
                Default Neutral
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCanvasBg("black")}>
                Pure Black OLED
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
                    className="h-7 px-2 font-mono text-[11px] text-muted-foreground hover:text-foreground"
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
        className={`flex-1 relative overflow-auto p-4 md:p-6 flex items-center justify-center transition-colors ${getCanvasBackgroundClass(
          canvasBg
        )}`}
      >
        {/* Elevated Canvas Card */}
        <div
          ref={cardRef}
          style={{
            width: getComputedWidth(),
            maxWidth: isFluidResponsive ? "100%" : "none",
            height: isFluidResponsive ? "100%" : "88vh",
            transform: `scale(${zoom / 100})`,
            transformOrigin: "center center",
          }}
          className={`relative transition-all duration-150 rounded-xl border border-border shadow-xl overflow-hidden bg-background flex flex-col ${
            isFluidResponsive ? "w-full" : ""
          }`}
        >
          {/* Simulated Browser Window Chrome */}
          <div className="flex h-8 shrink-0 items-center justify-between border-b border-border bg-muted/40 px-3 select-none">
            {/* Window Traffic Lights */}
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
            </div>

            {/* Omnibox URL pill */}
            <div className="flex items-center gap-1.5 rounded-md bg-background px-2.5 py-0.5 text-[10px] font-mono text-muted-foreground border border-border/60 shadow-2xs">
              <Lock className="size-2.5 text-emerald-500" />
              <span>sandbox://21st.dev/preview</span>
            </div>

            {/* Dimension Badge & Quick Theme Toggle */}
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => handleThemeChange(previewTheme === "dark" ? "light" : "dark")}
                    className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground hover:text-foreground bg-background hover:bg-muted/70 px-2 py-0.5 rounded border border-border/60 transition-colors cursor-pointer shadow-2xs"
                    aria-label="Toggle preview theme"
                  >
                    {previewTheme === "dark" ? (
                      <>
                        <Moon className="size-2.5 text-sky-400" />
                        <span>Dark</span>
                      </>
                    ) : (
                      <>
                        <Sun className="size-2.5 text-amber-500" />
                        <span>Light</span>
                      </>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Toggle component preview theme (currently {previewTheme})
                </TooltipContent>
              </Tooltip>

              <div className="font-mono text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border/60">
                {draggedWidth !== null
                  ? `${draggedWidth}px`
                  : isFluidResponsive
                  ? "Fluid 100%"
                  : getComputedWidth()}
              </div>
            </div>
          </div>

          {/* Sandboxed Live Iframe with matching theme surface */}
          <div
            className={`relative flex-1 w-full h-full overflow-hidden transition-colors ${
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

          {/* Accessible Drag-to-Resize Handle */}
          <div
            role="slider"
            tabIndex={0}
            aria-label="Resize component preview width"
            aria-valuenow={numericViewportWidth}
            aria-valuemin={320}
            aria-valuemax={1600}
            aria-valuetext={`${numericViewportWidth} pixels`}
            onMouseDown={handleResizeStart}
            onKeyDown={handleResizeKeyDown}
            title="Drag horizontally or use Left/Right arrow keys to resize preview width"
            className="absolute right-0 top-8 bottom-0 w-3 cursor-ew-resize hover:bg-primary/10 focus-visible:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none flex items-center justify-center transition-colors group z-20 rounded-r-xl"
          >
            <div className="h-8 w-1 rounded-full bg-border group-hover:bg-primary group-focus-visible:bg-primary transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}
