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
  Loader2,
  MoreHorizontal,
  Check,
  Camera,
  Download,
  Copy,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

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
    currentTemplateId,
    updateComponentPreview,
  } = useStudioStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSimulatingHover, setIsSimulatingHover] = useState(false);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [draggedWidth, setDraggedWidth] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [isSandboxLoading, setIsSandboxLoading] = useState(true);

  // Instant Snapshot Capture States
  const [isCapturingSnapshot, setIsCapturingSnapshot] = useState(false);
  const [captureSuccess, setCaptureSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const pendingCaptureActionRef = useRef<"both" | "download" | "copy" | null>(null);
  const captureTimeoutRef = useRef<NodeJS.Timeout | number | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | number | null>(null);

  // Debounce files (200ms) to ensure butter-smooth 60fps typing in CodeMirror
  const [debouncedFiles, setDebouncedFiles] = useState(files);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFiles(files);
    }, 200);
    return () => clearTimeout(timer);
  }, [files]);

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);

  const handleSelectViewport = (vp: StudioViewport) => {
    setDraggedWidth(null);
    setViewport(vp);
  };

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

  const handleCaptureSnapshot = (action: "both" | "download" | "copy" = "both") => {
    pendingCaptureActionRef.current = action;
    setIsCapturingSnapshot(true);
    setCaptureSuccess(false);
    setToastMessage(null);

    if (captureTimeoutRef.current) {
      clearTimeout(captureTimeoutRef.current);
    }
    captureTimeoutRef.current = setTimeout(() => {
      setIsCapturingSnapshot(false);
      pendingCaptureActionRef.current = null;
    }, 4500);

    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "CAPTURE_PREVIEW",
          componentId: currentTemplateId,
        },
        "*"
      );
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { html, error } = useMemo(() => {
    return compileSandboxHtml(
      debouncedFiles["component.tsx"],
      debouncedFiles["default.tsx"] || debouncedFiles["demo.tsx"] || "",
      debouncedFiles["index.css"],
      dependencies,
      canvasBg,
      previewTheme
    );
  }, [debouncedFiles, dependencies, canvasBg, previewTheme, reloadKey]);

  useEffect(() => {
    setIsSandboxLoading(true);
    const timer = setTimeout(() => setIsSandboxLoading(false), 4500);
    return () => clearTimeout(timer);
  }, [html, reloadKey]);

  useEffect(() => {
    if (error) {
      setCompilerState(false, error);
    } else {
      setCompilerState(false, null);
    }
  }, [error, setCompilerState]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data) {
        if (event.data.type === "TRIGGER_SIMULATED_HOVER") {
          setIsSimulatingHover(true);
          setTimeout(() => setIsSimulatingHover(false), event.data.durationMs || 4000);
        }
        if (event.data.type === "RENDER_SUCCESS") {
          setIsSandboxLoading(false);
        }
        if (event.data.type === "RUNTIME_ERROR") {
          setIsSandboxLoading(false);
          setCompilerState(false, event.data.message);
        }
        if (event.data.type === "SANDBOX_CONSOLE") {
          addTerminalLog({
            type: event.data.level,
            message: event.data.message,
          });
        }
        if (event.data.type === "PREVIEW_CAPTURED") {
          if (captureTimeoutRef.current) {
            clearTimeout(captureTimeoutRef.current);
            captureTimeoutRef.current = null;
          }
          setIsCapturingSnapshot(false);

          if (event.data.dataUrl) {
            const dataUrl = event.data.dataUrl as string;
            updateComponentPreview(
              event.data.componentId || currentTemplateId,
              dataUrl
            );

            const requestedAction = pendingCaptureActionRef.current;
            pendingCaptureActionRef.current = null;

            if (requestedAction) {
              if (requestedAction === "both" || requestedAction === "download") {
                try {
                  const downloadAnchor = document.createElement("a");
                  downloadAnchor.href = dataUrl;
                  downloadAnchor.download = `${event.data.componentId || currentTemplateId || "component"}-preview.png`;
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  document.body.removeChild(downloadAnchor);
                } catch {
                  // Ignore download trigger errors in restricted contexts
                }
              }

              if (requestedAction === "both" || requestedAction === "copy") {
                if (typeof window !== "undefined" && navigator.clipboard) {
                  fetch(dataUrl)
                    .then((res) => res.blob())
                    .then((blob) => {
                      if (window.ClipboardItem && navigator.clipboard.write) {
                        const item = new ClipboardItem({ "image/png": blob });
                        navigator.clipboard.write([item]).catch(() => {
                          navigator.clipboard.writeText(dataUrl);
                        });
                      } else {
                        navigator.clipboard.writeText(dataUrl);
                      }
                    })
                    .catch(() => {
                      navigator.clipboard.writeText(dataUrl);
                    });
                }
              }

              setCaptureSuccess(true);
              const message =
                requestedAction === "both"
                  ? "Snapshot downloaded & copied"
                  : requestedAction === "download"
                  ? "Snapshot PNG downloaded"
                  : "Snapshot copied to clipboard";
              setToastMessage(message);

              if (toastTimeoutRef.current) {
                clearTimeout(toastTimeoutRef.current);
              }
              toastTimeoutRef.current = setTimeout(() => {
                setCaptureSuccess(false);
                setToastMessage(null);
              }, 2600);
            }
          }

          window.dispatchEvent(
            new CustomEvent("studio:preview-captured", { detail: event.data })
          );
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
    return () => {
      window.removeEventListener("message", handleMessage);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      if (captureTimeoutRef.current) clearTimeout(captureTimeoutRef.current);
    };
  }, [setCompilerState, addTerminalLog, updateComponentPreview, currentTemplateId]);

  useEffect(() => {
    const handleRequestCapture = (e: Event) => {
      const customEvent = e as CustomEvent<{ componentId?: string }>;
      const targetId = customEvent.detail?.componentId || currentTemplateId;
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { type: "CAPTURE_PREVIEW", componentId: targetId },
          "*"
        );
      }
    };
    window.addEventListener("studio:request-preview-capture", handleRequestCapture);
    return () => {
      window.removeEventListener("studio:request-preview-capture", handleRequestCapture);
    };
  }, [iframeRef, currentTemplateId]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    setIsResizing(true);
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
        setIsResizing(false);
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
      {/* Top Toolbar: Pure Icon-Only Instrument Strip */}
      <div className="studio-toolbar-surface flex h-11 shrink-0 items-center justify-between border-b border-border px-3 select-none transition-colors">
        {/* Left: Icon-Only Viewport Switcher & Dimension Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <Tabs
            value={isFluidResponsive ? "responsive" : viewport}
            onValueChange={(val) => handleSelectViewport(val as StudioViewport)}
          >
            <TabsList className="h-7 bg-muted/60 dark:bg-muted/40 p-0.5 rounded-none border border-border/80 gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="responsive"
                    aria-label="Fluid responsive viewport"
                    className="size-6 p-0 text-xs font-sans rounded-none transition-colors"
                  >
                    <Layers className="size-3.5" />
                    <span className="sr-only">Fluid</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="font-sans text-xs">
                  Fluid Viewport (100%)
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="desktop"
                    aria-label="Desktop viewport"
                    className="size-6 p-0 text-xs font-sans rounded-none transition-colors"
                  >
                    <Monitor className="size-3.5" />
                    <span className="sr-only">Desktop</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="font-sans text-xs">
                  Desktop Viewport (1200px)
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="tablet"
                    aria-label="Tablet viewport"
                    className="size-6 p-0 text-xs font-sans rounded-none transition-colors"
                  >
                    <Tablet className="size-3.5" />
                    <span className="sr-only">Tablet</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="font-sans text-xs">
                  Tablet Viewport (768px)
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="mobile"
                    aria-label="Mobile viewport"
                    className="size-6 p-0 text-xs font-sans rounded-none transition-colors"
                  >
                    <Smartphone className="size-3.5" />
                    <span className="sr-only">Mobile</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="font-sans text-xs">
                  Mobile Viewport (375px)
                </TooltipContent>
              </Tooltip>
            </TabsList>
          </Tabs>

          <Badge
            variant="outline"
            className="hidden xl:inline-flex h-5 rounded-none px-1.5 text-[11px] font-sans font-normal text-muted-foreground border-border/60 bg-muted/30 tabular-nums shrink-0"
          >
            {draggedWidth !== null
              ? `${draggedWidth}px`
              : isFluidResponsive
              ? "100% Fluid"
              : getComputedWidth()}
          </Badge>
        </div>

        {/* Center: Subtle Status & Toast */}
        <div role="status" aria-live="polite" className="flex items-center gap-2">
          {toastMessage ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-none bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-sans font-medium animate-in fade-in zoom-in-95 duration-200">
              <Check className="size-3 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          ) : isSimulatingHover ? (
            <span className="text-[11px] font-sans text-muted-foreground animate-pulse">
              Simulating pointer...
            </span>
          ) : null}
        </div>

        {/* Right: Pure Icon-Only Canvas Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Simulated Hover trigger - Icon-Only */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={triggerTestSimulation}
                disabled={isSimulatingHover}
                aria-label="Simulate pointer hover"
                className="studio-icon-btn hidden xl:inline-flex size-7 rounded-none border-border/80 bg-background/70 text-muted-foreground hover:text-foreground"
              >
                <MousePointerClick className="size-3.5" />
                <span className="sr-only">Simulate</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-sans text-xs">
              Simulate pointer hover & interactions inside sandbox
            </TooltipContent>
          </Tooltip>

          {/* Component Preview Dark / Light Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => handleThemeChange(previewTheme === "dark" ? "light" : "dark")}
                className="studio-icon-btn size-7 rounded-none border-border/80 bg-background/70 text-muted-foreground hover:text-foreground"
              >
                {previewTheme === "dark" ? (
                  <Sun className="size-3.5 text-amber-500" />
                ) : (
                  <Moon className="size-3.5 text-sky-400" />
                )}
                <span className="sr-only">Toggle preview theme</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-sans text-xs">
              Preview theme: {previewTheme === "dark" ? "Dark (click for Light)" : "Light (click for Dark)"}
            </TooltipContent>
          </Tooltip>

          {/* Canvas Background Dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="studio-icon-btn hidden xl:inline-flex size-7 rounded-none border-border/80 bg-background/70 text-muted-foreground hover:text-foreground"
                  >
                    <Paintbrush className="size-3.5" />
                    <span className="sr-only">Canvas background</span>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-sans text-xs">
                Canvas background style
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-40 rounded-none font-sans">
              <DropdownMenuLabel className="text-[10px] uppercase font-sans text-muted-foreground">
                Backdrop
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCanvasBg("mesh")} className="rounded-none">
                Subtle Ambient
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCanvasBg("grid")} className="rounded-none">
                Dot Grid
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCanvasBg("light")} className="rounded-none">
                Solid Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCanvasBg("dark")} className="rounded-none">
                Neutral Dark
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCanvasBg("black")} className="rounded-none">
                Pure Black
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="hidden xl:block h-4 mx-0.5 bg-border/60" />

          {/* Refresh Canvas */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => {
                  setIsReloading(true);
                  setReloadKey((k) => k + 1);
                  setTimeout(() => setIsReloading(false), 500);
                }}
                className="studio-icon-btn size-7 rounded-none border-border/80 bg-background/70 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw
                  className={cn(
                    "size-3.5 transition-transform duration-500 ease-smooth-out",
                    isReloading && "rotate-180"
                  )}
                />
                <span className="sr-only">Reload sandbox</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-sans text-xs">
              Force reload sandbox
            </TooltipContent>
          </Tooltip>

          {/* Instant Snapshot Capture Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => handleCaptureSnapshot("both")}
                disabled={isCapturingSnapshot}
                className={cn(
                  "studio-icon-btn size-7 rounded-none border-border/80 bg-background/70 transition-colors",
                  captureSuccess
                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/40"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isCapturingSnapshot ? (
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                ) : captureSuccess ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <Camera className="size-3.5" />
                )}
                <span className="sr-only">Capture preview snapshot</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-sans text-xs">
              {captureSuccess
                ? "Snapshot downloaded & copied!"
                : isCapturingSnapshot
                ? "Capturing preview snapshot..."
                : "Capture snapshot (download & copy)"}
            </TooltipContent>
          </Tooltip>

          {/* Fullscreen Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="studio-icon-btn size-7 rounded-none border-border/80 bg-background/70 text-muted-foreground hover:text-foreground"
              >
                {isFullscreen ? (
                  <Minimize2 className="size-3.5" />
                ) : (
                  <Maximize2 className="size-3.5" />
                )}
                <span className="sr-only">Fullscreen preview</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-sans text-xs">
              {isFullscreen ? "Exit fullscreen" : "Fullscreen preview"}
            </TooltipContent>
          </Tooltip>

          {/* Tablet & Compact Overflow (...) Menu */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="studio-icon-btn size-7 rounded-none border-border/80 bg-background/70 text-muted-foreground hover:text-foreground"
                  >
                    <MoreHorizontal className="size-3.5" />
                    <span className="sr-only">More canvas options</span>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-sans text-xs">
                More options
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-56 rounded-none font-sans">
              <DropdownMenuLabel className="text-[10px] uppercase font-sans text-muted-foreground flex items-center justify-between">
                <span>Canvas Options</span>
                <span className="text-[10px] text-muted-foreground/80 font-normal">
                  {zoom}% zoom
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={triggerTestSimulation}
                disabled={isSimulatingHover}
                className="flex items-center gap-2 rounded-none text-xs cursor-pointer font-sans"
              >
                <MousePointerClick className="size-3.5" />
                <span>Simulate Interaction</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] uppercase font-sans text-muted-foreground">
                Snapshot & Export
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => handleCaptureSnapshot("both")}
                disabled={isCapturingSnapshot}
                className="flex items-center gap-2 rounded-none text-xs cursor-pointer font-sans"
              >
                <Camera className="size-3.5" />
                <span>Download & Copy Snapshot</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleCaptureSnapshot("download")}
                disabled={isCapturingSnapshot}
                className="flex items-center gap-2 rounded-none text-xs cursor-pointer font-sans"
              >
                <Download className="size-3.5" />
                <span>Download PNG only</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleCaptureSnapshot("copy")}
                disabled={isCapturingSnapshot}
                className="flex items-center gap-2 rounded-none text-xs cursor-pointer font-sans"
              >
                <Copy className="size-3.5" />
                <span>Copy image to clipboard</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] uppercase font-sans text-muted-foreground">
                Backdrop
              </DropdownMenuLabel>
              {[
                { id: "mesh" as const, label: "Subtle Ambient" },
                { id: "grid" as const, label: "Dot Grid" },
                { id: "light" as const, label: "Solid Light" },
                { id: "dark" as const, label: "Neutral Dark" },
                { id: "black" as const, label: "Pure Black" },
              ].map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => setCanvasBg(item.id)}
                  className="flex items-center justify-between rounded-none text-xs cursor-pointer"
                >
                  <span>{item.label}</span>
                  {canvasBg === item.id && <Check className="size-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] uppercase font-sans text-muted-foreground">
                Zoom Level
              </DropdownMenuLabel>
              {[50, 75, 100, 125, 150].map((level) => (
                <DropdownMenuItem
                  key={level}
                  onClick={() => setZoom(level)}
                  className="flex items-center justify-between rounded-none text-xs cursor-pointer"
                >
                  <span>{level}%</span>
                  {zoom === level && <Check className="size-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Canvas Workspace */}
      <div
        className={`flex-1 relative overflow-auto p-4 md:p-6 flex items-center justify-center transition-colors duration-250 ease-smooth-out ${getCanvasBackgroundClass(
          canvasBg
        )}`}
      >
        {isResizing && (
          <div className="fixed inset-0 z-50 cursor-ew-resize select-none bg-transparent" />
        )}

        {/* Sharp Architectural Canvas Card */}
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
          className={cn(
            "relative rounded-none border border-border shadow-vercel-floating overflow-hidden bg-background flex flex-col",
            isFluidResponsive ? "w-full" : "",
            draggedWidth !== null
              ? "transition-none"
              : "transition-[width,transform] duration-250 ease-smooth-out"
          )}
        >
          <div
            className={`relative flex-1 w-full h-full overflow-hidden transition-colors duration-250 ease-smooth-out ${
              previewTheme === "dark" ? "bg-zinc-950" : "bg-white"
            }`}
          >
            {isSandboxLoading && !error && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/70 backdrop-blur-xs gap-3 font-sans select-none pointer-events-none transition-opacity">
                <Loader2 className="size-6 animate-spin text-primary" />
                <span className="font-sans text-xs text-muted-foreground animate-pulse">
                  Compiling component sandbox...
                </span>
              </div>
            )}
            <iframe
              ref={iframeRef}
              key={reloadKey}
              srcDoc={html}
              title="21st.dev Live Component Preview"
              sandbox="allow-scripts allow-same-origin allow-modals allow-popups"
              className={cn(
                "w-full h-full border-none bg-transparent",
                isResizing && "pointer-events-none"
              )}
            />
          </div>

          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize preview viewport width"
            aria-valuenow={
              draggedWidth ??
              (viewport === "mobile"
                ? 375
                : viewport === "tablet"
                ? 768
                : 1200)
            }
            aria-valuemin={320}
            aria-valuemax={1600}
            tabIndex={0}
            onMouseDown={handleResizeStart}
            onKeyDown={(e) => {
              const step = e.shiftKey ? 50 : 20;
              const currentW =
                draggedWidth ??
                (cardRef.current?.offsetWidth ||
                  (viewport === "mobile"
                    ? 375
                    : viewport === "tablet"
                    ? 768
                    : 1200));
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                setDraggedWidth(Math.max(320, currentW - step));
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                setDraggedWidth(Math.min(1600, currentW + step));
              }
            }}
            title="Drag or use arrow keys to resize preview width"
            className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring flex items-center justify-center transition-colors duration-150 ease-smooth-out group z-20"
          >
            <div
              className={cn(
                "h-8 w-1 rounded-none transition-colors duration-150 ease-smooth-out",
                isResizing ? "bg-primary" : "bg-border group-hover:bg-primary"
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
