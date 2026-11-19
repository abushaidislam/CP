"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  useStudioStore,
  StudioViewport,
  CanvasBackground,
  PreviewTheme,
} from "@/lib/store/studio-store";
import {
  compileSandboxHtml,
  type PreviewFitMode,
} from "@/lib/sandbox/sandbox-compiler";
import {
  parseDemoControls,
  bakeSettingsIntoDemoCode,
  scaffoldSettingsDemo,
  type DemoControlValue,
} from "@/lib/sandbox/demo-controls";
import { DemoControlsPanel } from "./demo-controls-panel";
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
  Video,
  SlidersHorizontal,
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

export type SandboxHydrationStage =
  | "compiling"
  | "hydrating-deps"
  | "mounting"
  | "ready"
  | "error";

export type SandboxHydrationMode = "cold" | "warm";

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
    userComponents,
    activeVariantByTemplate,
    updateFile,
    updateComponentPreview,
    isRecordingModalOpen,
    setRecordingModalOpen,
  } = useStudioStore();

  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [hasAutoOpenedControls, setHasAutoOpenedControls] = useState<string | null>(null);
  const [controlOverrides, setControlOverrides] = useState<Record<string, DemoControlValue>>({});
  const [fitMode, setFitMode] = useState<PreviewFitMode>("normal");
  const controlOverridesRef = useRef<Record<string, DemoControlValue>>({});
  controlOverridesRef.current = controlOverrides;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSimulatingHover, setIsSimulatingHover] = useState(false);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [draggedWidth, setDraggedWidth] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [isSandboxLoading, setIsSandboxLoading] = useState(true);
  const [hydrationStage, setHydrationStage] =
    useState<SandboxHydrationStage>("compiling");
  const [hydrationMode, setHydrationMode] =
    useState<SandboxHydrationMode>("cold");
  const [isHydrationSlow, setIsHydrationSlow] = useState(false);
  const [runtimePackages, setRuntimePackages] = useState<string[]>([]);
  const lastColdSignatureRef = useRef<string>("");

  // Instant Snapshot Capture States
  const [isCapturingSnapshot, setIsCapturingSnapshot] = useState(false);
  const [captureSuccess, setCaptureSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const pendingCaptureActionRef = useRef<
    "thumbnail" | "both" | "download" | "copy" | null
  >(null);
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

  const handleCaptureSnapshot = (
    action: "thumbnail" | "both" | "download" | "copy" = "thumbnail"
  ) => {
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

  const activeDemoSource = debouncedFiles["default.tsx"] || debouncedFiles["demo.tsx"] || "";

  const parsedDemoControls = useMemo(() => {
    return parseDemoControls(activeDemoSource, debouncedFiles["component.tsx"]);
  }, [activeDemoSource, debouncedFiles]);

  // Reset overrides when switching to a different component template
  useEffect(() => {
    setControlOverrides({});
    controlOverridesRef.current = {};
  }, [currentTemplateId]);

  // Prune any override keys that no longer exist in settings
  useEffect(() => {
    setControlOverrides((prev) => {
      const validKeys = new Set(parsedDemoControls.controls.map((c) => c.key));
      let changed = false;
      const next: Record<string, DemoControlValue> = {};
      for (const [k, v] of Object.entries(prev)) {
        if (validKeys.has(k)) {
          next[k] = v;
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [parsedDemoControls]);

  // Auto-open native controls when a template with active 21st.dev settings loads on wide viewports
  useEffect(() => {
    if (
      parsedDemoControls.status === "active" &&
      parsedDemoControls.controls.length > 0 &&
      hasAutoOpenedControls !== currentTemplateId
    ) {
      setHasAutoOpenedControls(currentTemplateId);
      if (typeof window !== "undefined" && window.innerWidth >= 1200) {
        setIsControlsOpen(true);
      }
    }
  }, [parsedDemoControls.status, parsedDemoControls.controls.length, currentTemplateId, hasAutoOpenedControls]);

  const effectiveControlValues = useMemo(() => {
    return {
      ...parsedDemoControls.defaultValues,
      ...controlOverrides,
    };
  }, [parsedDemoControls.defaultValues, controlOverrides]);

  const modifiedControlKeys = useMemo(() => {
    return Object.keys(controlOverrides).filter((k) => {
      const defVal = parsedDemoControls.defaultValues[k];
      const curVal = controlOverrides[k];
      return JSON.stringify(defVal) !== JSON.stringify(curVal);
    });
  }, [controlOverrides, parsedDemoControls.defaultValues]);

  const pushDemoPropsToIframe = useCallback((nextOverrides: Record<string, DemoControlValue>) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "SET_DEMO_PROPS",
          props: nextOverrides,
        },
        "*"
      );
    }
  }, []);

  const handleControlChange = (key: string, value: DemoControlValue) => {
    setControlOverrides((prev) => {
      const defVal = parsedDemoControls.defaultValues[key];
      const next = { ...prev };
      if (JSON.stringify(defVal) === JSON.stringify(value)) {
        delete next[key];
      } else {
        next[key] = value;
      }
      controlOverridesRef.current = next;
      pushDemoPropsToIframe(next);
      return next;
    });
  };

  const handleResetControlKey = (key: string) => {
    setControlOverrides((prev) => {
      const next = { ...prev };
      delete next[key];
      controlOverridesRef.current = next;
      pushDemoPropsToIframe(next);
      return next;
    });
  };

  const handleResetAllControls = () => {
    setControlOverrides({});
    controlOverridesRef.current = {};
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "RESET_DEMO_PROPS" },
        "*"
      );
    }
  };

  const showQuickToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  const handleCopyBakedDemoCode = () => {
    const rawDemo = files["default.tsx"] || files["demo.tsx"] || "";
    const baked = bakeSettingsIntoDemoCode(rawDemo, controlOverrides);
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(baked).catch(() => {});
    }
    showQuickToast(
      modifiedControlKeys.length > 0
        ? `Copied default.tsx with ${modifiedControlKeys.length} tuned control${modifiedControlKeys.length > 1 ? "s" : ""}`
        : "Copied default.tsx code"
    );
  };

  const handleApplyBakedToEditor = () => {
    if (modifiedControlKeys.length === 0) return;
    const rawDemo = files["default.tsx"] || files["demo.tsx"] || "";
    const baked = bakeSettingsIntoDemoCode(rawDemo, controlOverrides);
    updateFile("default.tsx", baked);
    setControlOverrides({});
    controlOverridesRef.current = {};
    showQuickToast("Tuned controls baked into default.tsx");
  };

  const handleScaffoldControls = () => {
    const scaffolded = scaffoldSettingsDemo(
      files["component.tsx"] || "",
      files["default.tsx"] || files["demo.tsx"] || ""
    );
    updateFile("default.tsx", scaffolded);
    setControlOverrides({});
    controlOverridesRef.current = {};
    showQuickToast("Scaffolded 21st.dev settings controls in default.tsx");
  };

  const handleFitModeChange = (nextFit: PreviewFitMode) => {
    setFitMode(nextFit);
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: "SET_FIT_MODE",
          fitMode: nextFit,
        },
        "*"
      );
    }
  };

  const { html, error, detectedDependencies } = useMemo(() => {
    return compileSandboxHtml(
      debouncedFiles["component.tsx"],
      activeDemoSource,
      debouncedFiles["index.css"],
      dependencies,
      canvasBg,
      previewTheme,
      {
        fitMode,
      }
    );
  }, [debouncedFiles, activeDemoSource, dependencies, canvasBg, previewTheme, fitMode]);

  const activeVariantId =
    activeVariantByTemplate?.[currentTemplateId] || "default";

  const coldSignature = useMemo(() => {
    const depKey = (detectedDependencies || dependencies)
      .slice()
      .sort()
      .join(",");
    return `${currentTemplateId}::${activeVariantId}::${reloadKey}::${depKey}`;
  }, [currentTemplateId, activeVariantId, reloadKey, detectedDependencies, dependencies]);

  const activeHydrationPackages = useMemo(() => {
    const base = ["react@19", "react-dom@19"];
    const extra = (
      runtimePackages.length > 0
        ? runtimePackages
        : detectedDependencies || dependencies
    ).filter(
      (pkg) =>
        pkg &&
        pkg !== "react" &&
        pkg !== "react-dom" &&
        pkg !== "react/jsx-runtime"
    );
    return Array.from(new Set([...base, ...extra])).slice(0, 6);
  }, [runtimePackages, detectedDependencies, dependencies]);

  useEffect(() => {
    if (error) {
      setHydrationStage("error");
      setIsSandboxLoading(false);
      setIsHydrationSlow(false);
      return;
    }

    const isColdStart = lastColdSignatureRef.current !== coldSignature;
    lastColdSignatureRef.current = coldSignature;

    setIsSandboxLoading(true);
    setIsHydrationSlow(false);

    if (isColdStart) {
      setHydrationMode("cold");
      setHydrationStage("compiling");
      setRuntimePackages([]);

      const compileAdvanceTimer = setTimeout(() => {
        setHydrationStage((prev) =>
          prev === "compiling" ? "hydrating-deps" : prev
        );
      }, 90);

      const slowTimer = setTimeout(() => {
        setIsHydrationSlow(true);
      }, 2200);

      const safetyTimer = setTimeout(() => {
        setHydrationStage("ready");
        setIsSandboxLoading(false);
        setIsHydrationSlow(false);
      }, 4800);

      return () => {
        clearTimeout(compileAdvanceTimer);
        clearTimeout(slowTimer);
        clearTimeout(safetyTimer);
      };
    } else {
      setHydrationMode("warm");
      setHydrationStage("hydrating-deps");

      const warmSafetyTimer = setTimeout(() => {
        setHydrationStage("ready");
        setIsSandboxLoading(false);
      }, 2000);

      return () => {
        clearTimeout(warmSafetyTimer);
      };
    }
  }, [html, reloadKey, coldSignature, error]);

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
        if (event.data.type === "SANDBOX_STAGE") {
          if (
            event.data.stage === "hydrating-deps" ||
            event.data.stage === "mounting"
          ) {
            setHydrationStage(event.data.stage);
          }
          if (
            Array.isArray(event.data.packages) &&
            event.data.packages.length > 0
          ) {
            setRuntimePackages(event.data.packages);
          }
        }
        if (event.data.type === "RENDER_SUCCESS") {
          setHydrationStage("ready");
          setIsSandboxLoading(false);
          setIsHydrationSlow(false);
          if (Object.keys(controlOverridesRef.current).length > 0) {
            pushDemoPropsToIframe(controlOverridesRef.current);
          }
        }
        if (event.data.type === "RUNTIME_ERROR") {
          setHydrationStage("error");
          setIsSandboxLoading(false);
          setIsHydrationSlow(false);
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

            const requestedAction = pendingCaptureActionRef.current || "thumbnail";
            pendingCaptureActionRef.current = null;

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
                : requestedAction === "copy"
                ? "Snapshot copied to clipboard"
                : "Card & Repo thumbnail updated";
            setToastMessage(message);

            if (toastTimeoutRef.current) {
              clearTimeout(toastTimeoutRef.current);
            }
            toastTimeoutRef.current = setTimeout(() => {
              setCaptureSuccess(false);
              setToastMessage(null);
            }, 2600);
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
  }, [setCompilerState, addTerminalLog, updateComponentPreview, currentTemplateId, pushDemoPropsToIframe]);

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
      className={`@container flex h-full w-full min-w-0 flex-col overflow-hidden bg-background ${
        isFullscreen ? "fixed inset-0 z-50" : "relative"
      }`}
    >
      {/* Top Toolbar: Pure Icon-Only Instrument Strip */}
      <div className="studio-toolbar-surface flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border px-2.5 @[420px]:px-3 select-none transition-colors overflow-hidden">
        {/* Left: Icon-Only Viewport Switcher & Dimension Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink-0">
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
            className="hidden @[480px]:inline-flex h-5 rounded-none px-1.5 text-[11px] font-sans font-normal text-muted-foreground border-border/60 bg-muted/30 tabular-nums whitespace-nowrap shrink-0"
          >
            {draggedWidth !== null
              ? `${draggedWidth}px`
              : isFluidResponsive
              ? "100% Fluid"
              : getComputedWidth()}
          </Badge>
        </div>

        {/* Center: Subtle Status & Toast */}
        <div role="status" aria-live="polite" className="flex items-center gap-2 min-w-0 overflow-hidden">
          {toastMessage ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-none bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-sans font-medium truncate animate-in fade-in zoom-in-95 duration-200">
              <Check className="size-3 shrink-0" />
              <span className="truncate">{toastMessage}</span>
            </div>
          ) : isSimulatingHover ? (
            <span className="text-[11px] font-sans text-muted-foreground animate-pulse truncate">
              Simulating pointer...
            </span>
          ) : isSandboxLoading && !error && hydrationMode === "warm" ? (
            <div className="flex items-center gap-1.5 text-[11px] font-sans text-muted-foreground truncate">
              <Loader2 className="size-3 animate-spin text-primary shrink-0" />
              <span className="truncate hidden @[360px]:inline">Syncing live changes...</span>
            </div>
          ) : null}
        </div>

        {/* Right: Pure Icon-Only Canvas Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* 21st.dev Native Component Controls Panel Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isControlsOpen ? "secondary" : "outline"}
                size="icon-sm"
                onClick={() => setIsControlsOpen((prev) => !prev)}
                aria-label="Toggle 21st.dev Native Component Controls"
                aria-pressed={isControlsOpen}
                className={cn(
                  "studio-icon-btn relative size-7 rounded-none border-border/80 transition-colors",
                  isControlsOpen
                    ? "bg-muted text-foreground border-foreground/30"
                    : "bg-background/70 text-muted-foreground hover:text-foreground"
                )}
              >
                <SlidersHorizontal className="size-3.5" />
                {parsedDemoControls.status === "active" &&
                  parsedDemoControls.controls.length > 0 && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "pointer-events-none absolute -top-1 -right-1 h-3.5 min-w-3.5 rounded-none px-1 py-0 text-[9px] font-sans font-semibold tabular-nums",
                        modifiedControlKeys.length > 0
                          ? "bg-primary text-primary-foreground"
                          : "bg-foreground/85 text-background"
                      )}
                    >
                      {modifiedControlKeys.length > 0
                        ? modifiedControlKeys.length
                        : parsedDemoControls.controls.length}
                    </Badge>
                  )}
                <span className="sr-only">21st.dev Controls</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-sans text-xs">
              {parsedDemoControls.status === "active"
                ? `21st.dev Native Controls (${parsedDemoControls.controls.length} active${
                    modifiedControlKeys.length > 0 ? `, ${modifiedControlKeys.length} edited` : ""
                  })`
                : "21st.dev Native Component Controls (setup settings)"}
            </TooltipContent>
          </Tooltip>

          {/* Simulated Hover trigger - Icon-Only */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={triggerTestSimulation}
                disabled={isSimulatingHover}
                aria-label="Simulate pointer hover"
                className="studio-icon-btn hidden @[520px]:inline-flex size-7 rounded-none border-border/80 bg-background/70 text-muted-foreground hover:text-foreground"
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
                    className="studio-icon-btn hidden @[460px]:inline-flex size-7 rounded-none border-border/80 bg-background/70 text-muted-foreground hover:text-foreground"
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

          <Separator orientation="vertical" className="hidden @[460px]:block h-4 mx-0.5 bg-border/60" />

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

          {/* Unified Snapshot & Card Thumbnail Studio Menu */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={isCapturingSnapshot}
                    aria-label="Capture preview snapshot"
                    className={cn(
                      "studio-icon-btn relative size-7 rounded-none border-border/80 bg-background/70 transition-colors",
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
                    {userComponents?.[currentTemplateId]?.previewImage &&
                      !captureSuccess &&
                      !isCapturingSnapshot && (
                        <span
                          className="absolute top-1 right-1 size-1.5 rounded-full bg-emerald-500"
                          aria-hidden="true"
                        />
                      )}
                    <span className="sr-only">Capture preview snapshot</span>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-sans text-xs">
                {captureSuccess
                  ? toastMessage || "Snapshot captured!"
                  : isCapturingSnapshot
                  ? "Capturing preview snapshot..."
                  : "Snapshot & Card Thumbnail Studio"}
              </TooltipContent>
            </Tooltip>

            <DropdownMenuContent
              align="end"
              className="w-72 rounded-none p-0 font-sans border-border/80"
            >
              {/* Header + Live Thumbnail Preview Card */}
              <div className="p-3 bg-muted/25 border-b border-border/60 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-foreground font-sans">
                      Snapshot & Card Thumbnail
                    </div>
                    <div className="text-[11px] text-muted-foreground font-sans">
                      Syncs with Component Hub &{" "}
                      <span className="font-mono text-[10px] text-foreground/80">
                        preview.png
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-none text-[10px] px-1.5 py-0 h-5 font-sans",
                      userComponents?.[currentTemplateId]?.previewImage
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-border/70 text-muted-foreground"
                    )}
                  >
                    {userComponents?.[currentTemplateId]?.previewImage
                      ? "Saved"
                      : "Auto"}
                  </Badge>
                </div>

                {/* Mini Thumbnail Preview */}
                <div className="relative h-24 w-full overflow-hidden border border-border/70 bg-background/90 flex items-center justify-center">
                  {userComponents?.[currentTemplateId]?.previewImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={userComponents[currentTemplateId].previewImage}
                      alt="Current component card thumbnail"
                      className="h-full w-full object-cover object-center"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 text-center px-3">
                      <Camera className="size-4 text-muted-foreground/60" />
                      <span className="text-[11px] text-muted-foreground font-sans">
                        No custom thumbnail captured yet
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-1">
                <DropdownMenuItem
                  onClick={() => handleCaptureSnapshot("thumbnail")}
                  disabled={isCapturingSnapshot}
                  className="flex items-start gap-2.5 rounded-none py-2 px-2.5 text-xs cursor-pointer font-sans"
                >
                  <Camera className="size-3.5 mt-0.5 text-primary shrink-0" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-foreground">
                      Update Card & Repo Thumbnail
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Save live view to Hub card &{" "}
                      <span className="font-mono text-[10px]">preview.png</span>
                    </span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => handleCaptureSnapshot("copy")}
                  disabled={isCapturingSnapshot}
                  className="flex items-center gap-2.5 rounded-none py-1.5 px-2.5 text-xs cursor-pointer font-sans"
                >
                  <Copy className="size-3.5 text-muted-foreground shrink-0" />
                  <span>Copy Snapshot PNG to Clipboard</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => handleCaptureSnapshot("download")}
                  disabled={isCapturingSnapshot}
                  className="flex items-center gap-2.5 rounded-none py-1.5 px-2.5 text-xs cursor-pointer font-sans"
                >
                  <Download className="size-3.5 text-muted-foreground shrink-0" />
                  <span>Download PNG File</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => handleCaptureSnapshot("both")}
                  disabled={isCapturingSnapshot}
                  className="flex items-center gap-2.5 rounded-none py-1.5 px-2.5 text-xs cursor-pointer font-sans"
                >
                  <Check className="size-3.5 text-muted-foreground shrink-0" />
                  <span>Capture, Copy & Download All</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 16:9 60fps Interaction Video Studio Trigger */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setRecordingModalOpen(true)}
                aria-label="Open 16:9 60fps Video Studio"
                className="studio-icon-btn size-7 rounded-none border-border/80 bg-background/70 text-muted-foreground hover:text-foreground"
              >
                <Video className="size-3.5" />
                <span className="sr-only">Record 16:9 Video</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-sans text-xs">
              Record 16:9 60fps Interaction Video (Ctrl+Shift+E)
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
                onClick={() => handleCaptureSnapshot("thumbnail")}
                disabled={isCapturingSnapshot}
                className="flex items-center gap-2 rounded-none text-xs cursor-pointer font-sans"
              >
                <Camera className="size-3.5" />
                <span>Update Card & Repo Thumbnail</span>
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
              <DropdownMenuItem
                onClick={() => setRecordingModalOpen(true)}
                className="flex items-center gap-2 rounded-none text-xs cursor-pointer font-sans"
              >
                <Video className="size-3.5 text-primary" />
                <span>Record 16:9 60fps Video...</span>
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
                21st.dev Frame Fit
              </DropdownMenuLabel>
              {[
                { id: "normal" as const, label: "Normal (Full)" },
                { id: "scale" as const, label: "Scale & Center" },
                { id: "crop" as const, label: "Crop & Fade" },
              ].map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => handleFitModeChange(item.id)}
                  className="flex items-center justify-between rounded-none text-xs cursor-pointer"
                >
                  <span>{item.label}</span>
                  {fitMode === item.id && <Check className="size-3.5 text-primary" />}
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

      {/* Main Canvas Stage + Optional 21st.dev Native Controls Dock */}
      <div className="relative flex flex-1 min-h-0 overflow-hidden">
        <div
          className={`flex-1 min-w-0 relative overflow-auto p-4 md:p-6 flex items-center justify-center transition-colors duration-250 ease-smooth-out ${getCanvasBackgroundClass(
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
            {/* Warm Update Non-Blocking Top Progress Strip */}
            {isSandboxLoading && !error && hydrationMode === "warm" && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-0 left-0 right-0 z-20 h-0.5 bg-muted/40 overflow-hidden"
              >
                <div className="h-full w-2/3 bg-primary animate-shimmer" />
              </div>
            )}

            {/* Cold Start Progressive Skeletal Placeholder & Hydration HUD */}
            {isSandboxLoading && !error && hydrationMode === "cold" && (
              <div
                role="status"
                aria-live="polite"
                aria-busy="true"
                aria-label="Initializing component sandbox environment"
                data-testid="canvas-progressive-skeleton"
                className={cn(
                  "absolute inset-0 z-10 flex flex-col justify-between overflow-hidden select-none font-sans transition-opacity duration-200",
                  previewTheme === "dark"
                    ? "bg-zinc-950 text-zinc-100"
                    : "bg-white text-zinc-900"
                )}
              >
                {/* Subtle Architectural Grid Underlay */}
                <div
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute inset-0 bg-[size:24px_24px]",
                    previewTheme === "dark"
                      ? "opacity-25 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)]"
                      : "opacity-40 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]"
                  )}
                />

                {/* Optional Component Preview Silhouette Underlay */}
                {userComponents?.[currentTemplateId]?.previewImage && (
                  <img
                    src={userComponents[currentTemplateId].previewImage}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 w-full h-full object-contain p-10 opacity-10 blur-[1px] select-none"
                  />
                )}

                {/* Top Skeletal Chrome Wireframe Bar */}
                <div
                  aria-hidden="true"
                  className={cn(
                    "relative z-10 flex h-12 shrink-0 items-center justify-between border-b px-5",
                    previewTheme === "dark"
                      ? "border-zinc-800/80 bg-zinc-900/40"
                      : "border-zinc-200/80 bg-zinc-100/60"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "size-5 rounded-none animate-shimmer",
                        previewTheme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
                      )}
                    />
                    <div
                      className={cn(
                        "h-3.5 w-28 rounded-none animate-shimmer",
                        previewTheme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
                      )}
                    />
                  </div>
                  <div className="hidden sm:flex items-center gap-3">
                    <div
                      className={cn(
                        "h-3 w-14 rounded-none animate-shimmer",
                        previewTheme === "dark" ? "bg-zinc-800/70" : "bg-zinc-200/80"
                      )}
                    />
                    <div
                      className={cn(
                        "h-3 w-14 rounded-none animate-shimmer",
                        previewTheme === "dark" ? "bg-zinc-800/70" : "bg-zinc-200/80"
                      )}
                    />
                    <div
                      className={cn(
                        "h-6 w-20 rounded-none animate-shimmer",
                        previewTheme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
                      )}
                    />
                  </div>
                </div>

                {/* Center Stage: Background Wireframe Blocks + Foreground Progressive Hydration HUD */}
                <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
                  {/* Ambient Skeletal Wireframe Silhouette */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-6 flex flex-col items-center justify-center gap-5 opacity-45"
                  >
                    <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div
                        className={cn(
                          "h-36 rounded-none border p-4 flex flex-col justify-between",
                          previewTheme === "dark"
                            ? "border-zinc-800/80 bg-zinc-900/30"
                            : "border-zinc-200 bg-zinc-50/70"
                        )}
                      >
                        <div className="space-y-2">
                          <div
                            className={cn(
                              "h-3 w-20 rounded-none animate-shimmer",
                              previewTheme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
                            )}
                          />
                          <div
                            className={cn(
                              "h-5 w-4/5 rounded-none animate-shimmer",
                              previewTheme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
                            )}
                          />
                          <div
                            className={cn(
                              "h-3 w-2/3 rounded-none animate-shimmer",
                              previewTheme === "dark" ? "bg-zinc-800/70" : "bg-zinc-200/80"
                            )}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "h-7 w-24 rounded-none animate-shimmer",
                              previewTheme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
                            )}
                          />
                          <div
                            className={cn(
                              "h-7 w-20 rounded-none animate-shimmer",
                              previewTheme === "dark" ? "bg-zinc-800/60" : "bg-zinc-200/70"
                            )}
                          />
                        </div>
                      </div>

                      <div
                        className={cn(
                          "hidden md:flex h-36 rounded-none border p-4 flex-col justify-between",
                          previewTheme === "dark"
                            ? "border-zinc-800/80 bg-zinc-900/30"
                            : "border-zinc-200 bg-zinc-50/70"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className={cn(
                              "h-3.5 w-24 rounded-none animate-shimmer",
                              previewTheme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
                            )}
                          />
                          <div
                            className={cn(
                              "size-6 rounded-none animate-shimmer",
                              previewTheme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
                            )}
                          />
                        </div>
                        <div
                          className={cn(
                            "h-16 w-full rounded-none animate-shimmer",
                            previewTheme === "dark" ? "bg-zinc-800/60" : "bg-zinc-200/70"
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Centered Progressive Initialization HUD Card */}
                  <div className="relative z-20 w-full max-w-md rounded-none border border-border bg-card/95 text-card-foreground p-5 shadow-vercel-floating backdrop-blur-md flex flex-col gap-4">
                    {/* Eyebrow & Tabular Progress Percentage */}
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="eyebrow" className="rounded-none">
                        SANDBOX HYDRATION
                      </Badge>
                      <span className="font-mono text-xs font-medium text-muted-foreground tabular-nums">
                        {hydrationStage === "compiling"
                          ? "35%"
                          : hydrationStage === "hydrating-deps"
                          ? "68%"
                          : "92%"}
                      </span>
                    </div>

                    {/* Stage Headline & Description */}
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-none border border-border bg-muted/40">
                        <Loader2 className="size-3.5 animate-spin text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-sans text-xs sm:text-sm font-semibold text-foreground leading-tight">
                          {hydrationStage === "compiling"
                            ? "Initializing sandbox environment..."
                            : hydrationStage === "hydrating-deps"
                            ? "Hydrating sandbox ESM dependencies..."
                            : "Mounting React 19 component tree..."}
                        </p>
                        <p className="font-sans text-[11px] text-muted-foreground mt-1 leading-relaxed">
                          {hydrationStage === "compiling"
                            ? "Transpiling TypeScript AST and assembling import map"
                            : hydrationStage === "hydrating-deps"
                            ? "Streaming browser ES modules and Tailwind runtime"
                            : "Executing component module and hydrating live DOM"}
                        </p>
                      </div>
                    </div>

                    {/* 3-Segment Determinate Progress Bar */}
                    <div className="flex flex-col gap-2">
                      <div
                        aria-hidden="true"
                        className="grid grid-cols-3 gap-1.5 h-1.5 w-full"
                      >
                        <div
                          className={cn(
                            "h-full rounded-none transition-colors duration-200",
                            hydrationStage === "compiling"
                              ? "bg-primary animate-shimmer"
                              : "bg-primary"
                          )}
                        />
                        <div
                          className={cn(
                            "h-full rounded-none transition-colors duration-200",
                            hydrationStage === "compiling"
                              ? "bg-muted"
                              : hydrationStage === "hydrating-deps"
                              ? "bg-primary animate-shimmer"
                              : "bg-primary"
                          )}
                        />
                        <div
                          className={cn(
                            "h-full rounded-none transition-colors duration-200",
                            hydrationStage === "mounting"
                              ? "bg-primary animate-shimmer"
                              : "bg-muted"
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-[11px] font-sans">
                        <div className="flex items-center gap-1 text-foreground font-medium truncate">
                          {hydrationStage !== "compiling" && (
                            <Check className="size-3 text-emerald-500 shrink-0" />
                          )}
                          <span className="truncate">1. Compile AST</span>
                        </div>
                        <div
                          className={cn(
                            "flex items-center gap-1 truncate",
                            hydrationStage === "compiling"
                              ? "text-muted-foreground"
                              : "text-foreground font-medium"
                          )}
                        >
                          {hydrationStage === "mounting" && (
                            <Check className="size-3 text-emerald-500 shrink-0" />
                          )}
                          <span className="truncate">2. Hydrate ESM</span>
                        </div>
                        <div
                          className={cn(
                            "flex items-center gap-1 truncate",
                            hydrationStage === "mounting"
                              ? "text-foreground font-medium"
                              : "text-muted-foreground"
                          )}
                        >
                          <span className="truncate">3. Mount DOM</span>
                        </div>
                      </div>
                    </div>

                    {/* Active ESM Dependencies Strip */}
                    <div className="flex flex-col gap-1.5 pt-2 border-t border-border/70">
                      <div className="flex items-center justify-between text-[11px] font-sans text-muted-foreground">
                        <span>Hydrating Modules</span>
                        <span className="font-mono text-[10px] tabular-nums">
                          {activeHydrationPackages.length} packages
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        {activeHydrationPackages.map((pkg) => (
                          <Badge
                            key={pkg}
                            variant="outline"
                            className="rounded-none px-1.5 py-0.5 text-[10px] font-mono font-normal text-muted-foreground bg-muted/30 border-border/80"
                          >
                            {pkg}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Slow Hydration Retry Action */}
                    {isHydrationSlow && (
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/70">
                        <span className="font-sans text-[11px] text-muted-foreground">
                          Fetching remote ESM modules...
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsReloading(true);
                            setReloadKey((k) => k + 1);
                            setTimeout(() => setIsReloading(false), 500);
                          }}
                          className="h-7 rounded-none font-sans text-xs gap-1.5 shrink-0"
                        >
                          <RefreshCw className="size-3" />
                          <span>Retry Hydration</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Skeletal Footer Strip */}
                <div
                  aria-hidden="true"
                  className={cn(
                    "relative z-10 flex h-9 shrink-0 items-center justify-between border-t px-5",
                    previewTheme === "dark"
                      ? "border-zinc-800/80 bg-zinc-900/30"
                      : "border-zinc-200/80 bg-zinc-100/50"
                  )}
                >
                  <div
                    className={cn(
                      "h-2.5 w-32 rounded-none animate-shimmer",
                      previewTheme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
                    )}
                  />
                  <div
                    className={cn(
                      "h-2.5 w-20 rounded-none animate-shimmer",
                      previewTheme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
                    )}
                  />
                </div>
              </div>
            )}
            {isRecordingModalOpen ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-muted/20 text-muted-foreground font-sans text-xs px-6 text-center">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80">
                  VIDEO STUDIO ACTIVE
                </span>
                <span>
                  Background preview paused to dedicate full 60fps performance to your 16:9 recording stage.
                </span>
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                key={reloadKey}
                srcDoc={html}
                onLoad={() => {
                  setHydrationStage((prev) =>
                    prev === "compiling" ? "hydrating-deps" : prev
                  );
                }}
                title="21st.dev Live Component Preview"
                sandbox="allow-scripts allow-same-origin allow-modals allow-popups"
                className={cn(
                  "w-full h-full border-none bg-transparent transition-opacity duration-200",
                  isSandboxLoading && !error && hydrationMode === "cold"
                    ? "opacity-0"
                    : "opacity-100",
                  isResizing && "pointer-events-none"
                )}
              />
            )}
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

        {/* 21st.dev Native Component Controls Panel (Docked on wide preview, overlay drawer on narrow split) */}
        {isControlsOpen && (
          <DemoControlsPanel
            parsed={parsedDemoControls}
            values={effectiveControlValues}
            modifiedKeys={modifiedControlKeys}
            onChangeValue={handleControlChange}
            onResetKey={handleResetControlKey}
            onResetAll={handleResetAllControls}
            onCopyBakedCode={handleCopyBakedDemoCode}
            onApplyToEditor={handleApplyBakedToEditor}
            onScaffoldControls={handleScaffoldControls}
            onClose={() => setIsControlsOpen(false)}
            className="absolute right-0 top-0 bottom-0 z-30 shadow-2xl @[720px]:static @[720px]:shadow-none"
          />
        )}
      </div>
    </div>
  );
}
