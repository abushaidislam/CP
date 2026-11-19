"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useShallow } from "zustand/react/shallow";
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
import { CanvasToolbar } from "./canvas/canvas-toolbar";
import { SandboxHydrationOverlay } from "./canvas/sandbox-hydration-overlay";
import { cn } from "@/lib/utils";

const VideoStudioWorkspace = dynamic(
  () =>
    import("./video/video-studio-workspace").then(
      (mod) => mod.VideoStudioWorkspace
    ),
  { ssr: false }
);

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
  } = useStudioStore(
    useShallow((s) => ({
      files: s.files,
      viewport: s.viewport,
      canvasBg: s.canvasBg,
      previewTheme: s.previewTheme,
      zoom: s.zoom,
      dependencies: s.dependencies,
      setViewport: s.setViewport,
      setCanvasBg: s.setCanvasBg,
      setPreviewTheme: s.setPreviewTheme,
      setZoom: s.setZoom,
      setCompilerState: s.setCompilerState,
      addTerminalLog: s.addTerminalLog,
      currentTemplateId: s.currentTemplateId,
      userComponents: s.userComponents,
      activeVariantByTemplate: s.activeVariantByTemplate,
      updateFile: s.updateFile,
      updateComponentPreview: s.updateComponentPreview,
      isRecordingModalOpen: s.isRecordingModalOpen,
      setRecordingModalOpen: s.setRecordingModalOpen,
    }))
  );

  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [hasAutoOpenedControls, setHasAutoOpenedControls] = useState<string | null>(null);
  const [controlOverrides, setControlOverrides] = useState<Record<string, DemoControlValue>>({});
  const [fitMode, setFitMode] = useState<PreviewFitMode>("normal");
  const controlOverridesRef = useRef<Record<string, DemoControlValue>>({});
  controlOverridesRef.current = controlOverrides;
  const previewThemeRef = useRef<PreviewTheme>(previewTheme);
  previewThemeRef.current = previewTheme;
  const fitModeRef = useRef<PreviewFitMode>(fitMode);
  fitModeRef.current = fitMode;

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

  const handleReloadSandbox = () => {
    setIsReloading(true);
    setReloadKey((k) => k + 1);
    setTimeout(() => setIsReloading(false), 500);
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
  }, [
    parsedDemoControls.status,
    parsedDemoControls.controls.length,
    currentTemplateId,
    hasAutoOpenedControls,
  ]);

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

  const pushDemoPropsToIframe = useCallback(
    (nextOverrides: Record<string, DemoControlValue>) => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          {
            type: "SET_DEMO_PROPS",
            props: nextOverrides,
          },
          "*"
        );
      }
    },
    [iframeRef]
  );

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
        ? `Copied default.tsx with ${modifiedControlKeys.length} tuned control${
            modifiedControlKeys.length > 1 ? "s" : ""
          }`
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
      previewThemeRef.current,
      {
        fitMode: fitModeRef.current,
      }
    );
  }, [debouncedFiles, activeDemoSource, dependencies, canvasBg]);

  // Keep live iframe theme & fit mode synchronized via instant postMessage without reloading srcDoc
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "SET_PREVIEW_THEME", theme: previewTheme },
        "*"
      );
    }
  }, [previewTheme, iframeRef]);

  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "SET_FIT_MODE", fitMode },
        "*"
      );
    }
  }, [fitMode, iframeRef]);

  const activeVariantId =
    activeVariantByTemplate?.[currentTemplateId] || "default";

  const coldSignature = useMemo(() => {
    const depKey = (detectedDependencies || dependencies)
      .slice()
      .sort()
      .join(",");
    return `${currentTemplateId}::${activeVariantId}::${reloadKey}::${depKey}`;
  }, [
    currentTemplateId,
    activeVariantId,
    reloadKey,
    detectedDependencies,
    dependencies,
  ]);

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
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) {
        return;
      }
      if (event.data) {
        if (event.data.type === "TRIGGER_SIMULATED_HOVER") {
          setIsSimulatingHover(true);
          setTimeout(
            () => setIsSimulatingHover(false),
            event.data.durationMs || 4000
          );
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
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              { type: "SET_PREVIEW_THEME", theme: previewThemeRef.current },
              "*"
            );
            iframeRef.current.contentWindow.postMessage(
              { type: "SET_FIT_MODE", fitMode: fitModeRef.current },
              "*"
            );
          }
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

            const requestedAction =
              pendingCaptureActionRef.current || "thumbnail";
            pendingCaptureActionRef.current = null;

            if (requestedAction === "both" || requestedAction === "download") {
              try {
                const downloadAnchor = document.createElement("a");
                downloadAnchor.href = dataUrl;
                downloadAnchor.download = `${
                  event.data.componentId || currentTemplateId || "component"
                }-preview.png`;
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
  }, [
    iframeRef,
    setCompilerState,
    addTerminalLog,
    updateComponentPreview,
    currentTemplateId,
    pushDemoPropsToIframe,
  ]);

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
      window.removeEventListener(
        "studio:request-preview-capture",
        handleRequestCapture
      );
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
      if (!isResizingRef.current || !cardRef.current || !containerRef.current)
        return;
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
  const currentPreviewImage = userComponents?.[currentTemplateId]?.previewImage;

  return (
    <div
      ref={containerRef}
      className={`@container flex h-full w-full min-w-0 flex-col overflow-hidden bg-background ${
        isFullscreen ? "fixed inset-0 z-50" : "relative"
      }`}
    >
      {/* Top Toolbar: Pure Icon-Only Instrument Strip */}
      <CanvasToolbar
        viewport={viewport}
        isFluidResponsive={isFluidResponsive}
        draggedWidth={draggedWidth}
        computedWidth={getComputedWidth()}
        onSelectViewport={handleSelectViewport}
        toastMessage={toastMessage}
        isSimulatingHover={isSimulatingHover}
        isSandboxLoading={isSandboxLoading}
        error={error}
        hydrationMode={hydrationMode}
        isControlsOpen={isControlsOpen && !isRecordingModalOpen}
        onToggleControls={() => {
          if (isRecordingModalOpen) {
            setRecordingModalOpen(false);
            setIsControlsOpen(true);
            return;
          }
          setIsControlsOpen((prev) => !prev);
        }}
        parsedDemoControls={parsedDemoControls}
        modifiedControlKeysCount={modifiedControlKeys.length}
        onTriggerTestSimulation={triggerTestSimulation}
        previewTheme={previewTheme}
        onThemeChange={handleThemeChange}
        canvasBg={canvasBg}
        onCanvasBgChange={setCanvasBg}
        isReloading={isReloading}
        onReload={handleReloadSandbox}
        isCapturingSnapshot={isCapturingSnapshot}
        captureSuccess={captureSuccess}
        currentPreviewImage={currentPreviewImage}
        onCaptureSnapshot={handleCaptureSnapshot}
        isRecordingOpen={isRecordingModalOpen}
        onOpenRecordingModal={() => {
          const next = !isRecordingModalOpen;
          if (next) {
            setIsControlsOpen(false);
          }
          setRecordingModalOpen(next);
        }}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
        zoom={zoom}
        onZoomChange={setZoom}
        fitMode={fitMode}
        onFitModeChange={handleFitModeChange}
      />

      {/* Main Canvas Stage + Docked Side Panel (Component Controls OR Video Capture) */}
      <div className="relative flex flex-1 min-h-0 overflow-hidden">
        {isRecordingModalOpen ? (
          <VideoStudioWorkspace
            backdropClassName={getCanvasBackgroundClass(canvasBg)}
            reloadTrigger={reloadKey}
            onClose={() => setRecordingModalOpen(false)}
          />
        ) : (
          <>
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
                    <SandboxHydrationOverlay
                      previewTheme={previewTheme}
                      previewImage={currentPreviewImage}
                      hydrationStage={hydrationStage}
                      activeHydrationPackages={activeHydrationPackages}
                      isHydrationSlow={isHydrationSlow}
                      onRetryHydration={handleReloadSandbox}
                    />
                  )}

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
                    sandbox="allow-scripts allow-modals allow-popups"
                    className={cn(
                      "w-full h-full border-none bg-transparent transition-opacity duration-200",
                      isSandboxLoading && !error && hydrationMode === "cold"
                        ? "opacity-0"
                        : "opacity-100",
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
          </>
        )}
      </div>
    </div>
  );
}
