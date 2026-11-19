"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStudioStore, type RecordingConfig } from "@/lib/store/studio-store";
import { compileSandboxHtml } from "@/lib/sandbox/sandbox-compiler";
import { DEFAULT_TEMPLATES } from "@/lib/sandbox/default-templates";
import {
  detectCaptureCapabilities,
  drawCanvasCursorOverlay,
  getResolutionDimensions,
  startStageRecording,
  transcodeRecordingToMp4,
  type CaptureEngineUsed,
  type CursorTelemetryState,
  type StageRecorderHandle,
  type StageRecordingResult,
} from "@/lib/video/stage-recorder";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Video,
  Square,
  Play,
  Pause,
  RotateCcw,
  Download,
  Sparkles,
  Hand,
  MousePointer2,
  ArrowDownUp,
  RefreshCw,
  Loader2,
  Check,
  AlertTriangle,
  Sun,
  Moon,
  Film,
} from "lucide-react";
import { cn } from "@/lib/utils";

type StudioPhase =
  | "idle"
  | "previewing"
  | "countdown"
  | "recording"
  | "processing"
  | "review"
  | "error";

interface DiscoveredTargetsInfo {
  interactiveCount: number;
  scrollableDistance: number;
  hasCanvas: boolean;
}

function formatTimecode(ms: number): string {
  const safe = Math.max(0, ms);
  const totalSec = Math.floor(safe / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const centis = Math.floor((safe % 1000) / 10);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(centis).padStart(2, "0")}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function slugifyFilename(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "component"
  );
}

export function VideoRecordingModal() {
  const {
    isRecordingModalOpen,
    setRecordingModalOpen,
    recordingConfig,
    setRecordingConfig,
    files,
    dependencies,
    canvasBg,
    previewTheme,
    setPreviewTheme,
    currentTemplateId,
    userComponents,
  } = useStudioStore();

  const [phase, setPhase] = useState<StudioPhase>("idle");
  const [countdownValue, setCountdownValue] = useState<number>(3);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [stageReady, setStageReady] = useState<boolean>(false);
  const [stageReloadKey, setStageReloadKey] = useState<number>(0);
  const [discoveredTargets, setDiscoveredTargets] = useState<DiscoveredTargetsInfo>({
    interactiveCount: 0,
    scrollableDistance: 0,
    hasCanvas: false,
  });

  const [activeEngine, setActiveEngine] = useState<CaptureEngineUsed>("native-region");
  const [recordingResult, setRecordingResult] = useState<StageRecordingResult | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [cachedMp4Url, setCachedMp4Url] = useState<string | null>(null);
  const [isTranscodingMp4, setIsTranscodingMp4] = useState<boolean>(false);
  const [serverFfmpegReady, setServerFfmpegReady] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [exportToast, setExportToast] = useState<string | null>(null);

  // Review player state
  const [isReviewPlaying, setIsReviewPlaying] = useState<boolean>(true);
  const [reviewCurrentTime, setReviewCurrentTime] = useState<number>(0);
  const [reviewDuration, setReviewDuration] = useState<number>(0);

  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const stageIframeRef = useRef<HTMLIFrameElement | null>(null);
  const stageCursorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastCursorTelemetryRef = useRef<CursorTelemetryState | null>(null);
  const reviewVideoRef = useRef<HTMLVideoElement | null>(null);
  const recorderRef = useRef<StageRecorderHandle | null>(null);
  const timerRafRef = useRef<number | null>(null);
  const recordStartTsRef = useRef<number>(0);
  const safetyStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const capabilities = useMemo(() => detectCaptureCapabilities(), []);

  const currentComponentName = useMemo(() => {
    const userComp = userComponents?.[currentTemplateId];
    if (userComp?.name) return userComp.name;
    const tmpl = DEFAULT_TEMPLATES.find((t) => t.id === currentTemplateId);
    return tmpl?.name || "Component Showcase";
  }, [userComponents, currentTemplateId]);

  const { html: sandboxHtml, error: compileError } = useMemo(() => {
    if (!isRecordingModalOpen) {
      return { html: "", error: null };
    }
    return compileSandboxHtml(
      files["component.tsx"],
      files["default.tsx"] || files["demo.tsx"] || "",
      files["index.css"],
      dependencies,
      canvasBg,
      previewTheme,
      { videoStudio: true }
    );
  }, [isRecordingModalOpen, files, dependencies, canvasBg, previewTheme]);

  // Check server FFmpeg availability when modal opens
  useEffect(() => {
    if (!isRecordingModalOpen) return;
    let cancelled = false;
    fetch("/api/video-transcode")
      .then((res) => (res.ok ? res.json() : { available: false }))
      .then((data) => {
        if (!cancelled) {
          setServerFfmpegReady(Boolean(data?.available));
        }
      })
      .catch(() => {
        if (!cancelled) setServerFfmpegReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isRecordingModalOpen]);

  const postToStage = useCallback((message: Record<string, unknown>) => {
    try {
      stageIframeRef.current?.contentWindow?.postMessage(message, "*");
    } catch {
      // Ignore cross-origin post failures
    }
  }, []);

  const clearParentCursorCanvas = useCallback(() => {
    const canvas = stageCursorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const drawParentCursorCanvas = useCallback(
    (telemetry: CursorTelemetryState) => {
      const canvas = stageCursorCanvasRef.current;
      const container = stageContainerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.round(rect.width * dpr);
      const targetH = Math.round(rect.height * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, targetW, targetH);

      if (!telemetry.visible && (!telemetry.ripples || telemetry.ripples.length === 0)) {
        return;
      }

      drawCanvasCursorOverlay(
        ctx,
        targetW,
        targetH,
        telemetry,
        previewTheme === "dark"
      );
    },
    [previewTheme]
  );

  const forwardBoundaryPointerToStage = useCallback(
    (
      e: React.PointerEvent<HTMLDivElement>,
      eventType: "move" | "down" | "up"
    ) => {
      if (recordingConfig.mode !== "manual" || !stageReady) return;
      const container = stageContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      postToStage({
        type: "VIDEO_STUDIO_EXTERNAL_POINTER",
        nx,
        ny,
        eventType,
      });
    },
    [recordingConfig.mode, stageReady, postToStage]
  );

  // Push live configuration changes into the stage iframe
  useEffect(() => {
    if (!isRecordingModalOpen || !stageReady) return;
    postToStage({
      type: "VIDEO_STUDIO_CONFIG",
      mode: recordingConfig.mode,
      durationSec: recordingConfig.duration,
      autoHover: recordingConfig.autoHover,
      autoClick: recordingConfig.autoClick,
      autoScroll: recordingConfig.autoScroll,
      loopReturnToTop: recordingConfig.loopReturnToTop,
      showCursor: recordingConfig.showCursor,
      clickRipples: recordingConfig.clickRipples,
      renderInParentOverlay: true,
    });
    if (!recordingConfig.showCursor || recordingConfig.mode !== "manual") {
      if (phase === "idle") {
        clearParentCursorCanvas();
      }
    }
  }, [
    isRecordingModalOpen,
    stageReady,
    recordingConfig,
    phase,
    postToStage,
    clearParentCursorCanvas,
  ]);

  const showExportToast = useCallback((msg: string) => {
    setExportToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setExportToast(null);
    }, 3200);
  }, []);

  const stopTimers = useCallback(() => {
    if (timerRafRef.current) {
      cancelAnimationFrame(timerRafRef.current);
      timerRafRef.current = null;
    }
    if (safetyStopTimerRef.current) {
      clearTimeout(safetyStopTimerRef.current);
      safetyStopTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  const revokeMediaUrls = useCallback(() => {
    if (previewVideoUrl) {
      URL.revokeObjectURL(previewVideoUrl);
    }
    if (cachedMp4Url && cachedMp4Url !== previewVideoUrl) {
      URL.revokeObjectURL(cachedMp4Url);
    }
    setPreviewVideoUrl(null);
    setCachedMp4Url(null);
    setRecordingResult(null);
  }, [previewVideoUrl, cachedMp4Url]);

  const stopRecording = useCallback(async () => {
    stopTimers();
    postToStage({ type: "VIDEO_STUDIO_STOP" });

    const handle = recorderRef.current;
    if (!handle) {
      setPhase("idle");
      return;
    }
    recorderRef.current = null;
    setPhase("processing");

    try {
      const result = await handle.stop();
      const url = URL.createObjectURL(result.blob);
      setRecordingResult(result);
      setPreviewVideoUrl(url);
      if (result.mimeType.includes("video/mp4")) {
        setCachedMp4Url(url);
      } else {
        setCachedMp4Url(null);
      }
      setReviewDuration(result.durationMs / 1000);
      setReviewCurrentTime(0);
      setIsReviewPlaying(true);
      setPhase("review");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to finalize video recording."
      );
      setPhase("error");
    }
  }, [postToStage, stopTimers]);

  // Listen to messages from the 16:9 Video Studio sandbox iframe
  useEffect(() => {
    if (!isRecordingModalOpen) return;

    const handleMessage = (event: MessageEvent) => {
      if (
        stageIframeRef.current &&
        event.source !== stageIframeRef.current.contentWindow
      ) {
        return;
      }

      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "RENDER_SUCCESS") {
        setStageReady(true);
        setTimeout(() => postToStage({ type: "VIDEO_STUDIO_SCAN" }), 180);
      }

      if (data.type === "VIDEO_STUDIO_TARGETS") {
        setDiscoveredTargets({
          interactiveCount: Number(data.interactiveCount || 0),
          scrollableDistance: Number(data.scrollableDistance || 0),
          hasCanvas: Boolean(data.hasCanvas),
        });
      }

      if (data.type === "VIDEO_STUDIO_CURSOR_STATE") {
        const telemetry = data as CursorTelemetryState;
        lastCursorTelemetryRef.current = telemetry;
        drawParentCursorCanvas(telemetry);
        recorderRef.current?.updateCursorTelemetry(telemetry);
      }

      if (data.type === "VIDEO_STUDIO_FRAME_DATA") {
        recorderRef.current?.pushFrameDataUrl(
          Number(data.requestId || 0),
          typeof data.dataUrl === "string" ? data.dataUrl : null
        );
      }

      if (data.type === "VIDEO_STUDIO_CHOREOGRAPHY_COMPLETE") {
        if (data.dryRun) {
          setPhase((prev) => (prev === "previewing" ? "idle" : prev));
        } else if (recorderRef.current) {
          void stopRecording();
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isRecordingModalOpen, postToStage, stopRecording, drawParentCursorCanvas]);

  // Clean up active recording & object URLs when dialog closes
  useEffect(() => {
    if (!isRecordingModalOpen) {
      stopTimers();
      if (recorderRef.current) {
        recorderRef.current.cancel();
        recorderRef.current = null;
      }
      lastCursorTelemetryRef.current = null;
      clearParentCursorCanvas();
      setPhase("idle");
      setStageReady(false);
      setElapsedMs(0);
      setErrorMessage(null);
      setExportToast(null);
      setIsTranscodingMp4(false);
      revokeMediaUrls();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecordingModalOpen]);

  const handleTogglePreviewRun = () => {
    if (phase === "previewing") {
      postToStage({ type: "VIDEO_STUDIO_RESET" });
      clearParentCursorCanvas();
      setPhase("idle");
      return;
    }
    setErrorMessage(null);
    setPhase("previewing");
    postToStage({
      type: "VIDEO_STUDIO_START_AUTOPILOT",
      durationSec: recordingConfig.duration,
      dryRun: true,
      config: {
        autoHover: recordingConfig.autoHover,
        autoClick: recordingConfig.autoClick,
        autoScroll: recordingConfig.autoScroll,
        loopReturnToTop: recordingConfig.loopReturnToTop,
        showCursor: recordingConfig.showCursor,
        clickRipples: recordingConfig.clickRipples,
        renderInParentOverlay: true,
      },
    });
  };

  const beginActualRecording = useCallback(
    async (engineOverride?: "auto" | "native" | "direct") => {
      if (!stageContainerRef.current) return;
      setErrorMessage(null);
      revokeMediaUrls();

      if (recordingConfig.mode === "manual") {
        postToStage({
          type: "VIDEO_STUDIO_PREPARE_MANUAL",
          config: {
            showCursor: recordingConfig.showCursor,
            clickRipples: recordingConfig.clickRipples,
            renderInParentOverlay: true,
          },
        });
      } else {
        postToStage({ type: "VIDEO_STUDIO_RESET" });
      }

      const engineToUse = engineOverride || recordingConfig.captureEngine;

      const launchCapture = async () => {
        if (!stageContainerRef.current) return;
        try {
          const handle = await startStageRecording({
            stageElement: stageContainerRef.current,
            iframeElement: stageIframeRef.current,
            resolution: recordingConfig.resolution,
            fps: recordingConfig.fps,
            preferredFormat: recordingConfig.format,
            preferredEngine: engineToUse,
            previewTheme,
            showCursor: recordingConfig.showCursor,
            initialCursorTelemetry: lastCursorTelemetryRef.current,
            onTrackEnded: () => {
              if (recorderRef.current) {
                void stopRecording();
              }
            },
          });

          recorderRef.current = handle;
          setActiveEngine(handle.engine);
          setPhase("recording");
          recordStartTsRef.current = performance.now();
          setElapsedMs(0);

          // Live tabular timer loop
          const tickTimer = () => {
            if (!recorderRef.current) return;
            setElapsedMs(performance.now() - recordStartTsRef.current);
            timerRafRef.current = requestAnimationFrame(tickTimer);
          };
          timerRafRef.current = requestAnimationFrame(tickTimer);

          // Kick off sandbox choreography or manual spring tracking
          if (recordingConfig.mode === "autopilot") {
            postToStage({
              type: "VIDEO_STUDIO_START_AUTOPILOT",
              durationSec: recordingConfig.duration,
              dryRun: false,
              config: {
                autoHover: recordingConfig.autoHover,
                autoClick: recordingConfig.autoClick,
                autoScroll: recordingConfig.autoScroll,
                loopReturnToTop: recordingConfig.loopReturnToTop,
                showCursor: recordingConfig.showCursor,
                clickRipples: recordingConfig.clickRipples,
                renderInParentOverlay: true,
              },
            });

            // Hard safety stop just past the timeline end
            safetyStopTimerRef.current = setTimeout(() => {
              if (recorderRef.current) {
                void stopRecording();
              }
            }, recordingConfig.duration * 1000 + 1400);
          } else {
            // Focus stage iframe immediately so live pointer, clicks, and wheel scroll respond right away
            try {
              stageIframeRef.current?.contentWindow?.focus();
            } catch {
              // Ignore focus restriction
            }
            postToStage({
              type: "VIDEO_STUDIO_START_MANUAL",
              config: {
                showCursor: recordingConfig.showCursor,
                clickRipples: recordingConfig.clickRipples,
                renderInParentOverlay: true,
              },
            });
          }
        } catch (err) {
          stopTimers();
          postToStage({ type: "VIDEO_STUDIO_STOP" });
          const rawMsg = err instanceof Error ? err.message : String(err);
          const friendly = /cancel|denied|NotAllowedError/i.test(rawMsg)
            ? "Screen capture permission was declined or blocked in this preview frame. You can retry or use the zero-permission Direct Stage Engine."
            : rawMsg;
          setErrorMessage(friendly);
          setPhase("error");
        }
      };

      // Run optional 3-2-1 countdown BEFORE acquiring/starting in Direct mode,
      // or right after quick setup so the countdown never enters the 16:9 frame.
      if (recordingConfig.countdown && engineToUse === "direct") {
        setPhase("countdown");
        setCountdownValue(3);
        let remaining = 3;
        countdownTimerRef.current = setInterval(() => {
          remaining -= 1;
          if (remaining <= 0) {
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current);
              countdownTimerRef.current = null;
            }
            void launchCapture();
          } else {
            setCountdownValue(remaining);
          }
        }, 750);
      } else {
        await launchCapture();
      }
    },
    [
      recordingConfig,
      previewTheme,
      postToStage,
      revokeMediaUrls,
      stopRecording,
      stopTimers,
    ]
  );

  const handleDownloadWebm = () => {
    if (!previewVideoUrl || !recordingResult) return;
    const ext = recordingResult.mimeType.includes("video/mp4") ? "mp4" : "webm";
    const slug = slugifyFilename(currentComponentName);
    const a = document.createElement("a");
    a.href = previewVideoUrl;
    a.download = `${slug}-${recordingConfig.resolution}-${recordingConfig.fps}fps.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showExportToast(`Downloaded ${ext.toUpperCase()} (${recordingConfig.resolution} · ${recordingConfig.fps}fps)`);
  };

  const handleDownloadMp4 = async () => {
    if (!recordingResult) return;
    const slug = slugifyFilename(currentComponentName);
    const filename = `${slug}-${recordingConfig.resolution}-${recordingConfig.fps}fps.mp4`;

    if (cachedMp4Url) {
      const a = document.createElement("a");
      a.href = cachedMp4Url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showExportToast(`Downloaded MP4 (${recordingConfig.resolution} · ${recordingConfig.fps}fps)`);
      return;
    }

    setIsTranscodingMp4(true);
    setErrorMessage(null);
    try {
      const mp4Blob = await transcodeRecordingToMp4({
        blob: recordingResult.blob,
        fps: recordingConfig.fps,
        resolution: recordingConfig.resolution,
      });
      const mp4Url = URL.createObjectURL(mp4Blob);
      setCachedMp4Url(mp4Url);

      const a = document.createElement("a");
      a.href = mp4Url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showExportToast(
        `Encoded & downloaded H.264 MP4 (${formatBytes(mp4Blob.size)})`
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Unable to encode MP4. You can download WebM directly."
      );
    } finally {
      setIsTranscodingMp4(false);
    }
  };

  const handleNewTake = () => {
    revokeMediaUrls();
    setErrorMessage(null);
    setExportToast(null);
    setElapsedMs(0);
    setPhase("idle");
    postToStage({ type: "VIDEO_STUDIO_RESET" });
  };

  const handleReviewPlayPause = () => {
    const vid = reviewVideoRef.current;
    if (!vid) return;
    if (vid.paused) {
      void vid.play();
      setIsReviewPlaying(true);
    } else {
      vid.pause();
      setIsReviewPlaying(false);
    }
  };

  const handleReviewRestart = () => {
    const vid = reviewVideoRef.current;
    if (!vid) return;
    vid.currentTime = 0;
    void vid.play();
    setIsReviewPlaying(true);
  };

  const { width: targetWidth, height: targetHeight } = getResolutionDimensions(
    recordingConfig.resolution
  );

  const isBusy =
    phase === "recording" || phase === "countdown" || phase === "processing";

  const recordingProgressPct =
    recordingConfig.mode === "autopilot"
      ? Math.min(100, (elapsedMs / (recordingConfig.duration * 1000)) * 100)
      : 100;

  return (
    <Dialog
      open={isRecordingModalOpen}
      onOpenChange={(open) => {
        if (!open && phase === "recording") {
          recorderRef.current?.cancel();
          recorderRef.current = null;
          stopTimers();
        }
        setRecordingModalOpen(open);
      }}
    >
      <DialogContent
        onFocusOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (phase === "recording") {
            e.preventDefault();
          }
        }}
        className="max-w-[1360px] w-[calc(100vw-2rem)] max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0 rounded-none border border-border bg-card font-sans"
      >
        {/* Top Studio Header Bar */}
        <DialogHeader className="studio-toolbar-surface flex-row items-center justify-between gap-4 border-b border-border px-5 py-3.5 pr-14 shrink-0 space-y-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-8 items-center justify-center rounded-none border border-border bg-background text-primary shrink-0">
              <Film className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  VIDEO STUDIO
                </span>
                <span aria-hidden="true" className="text-muted-foreground/50 text-xs">
                  ·
                </span>
                <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                  {targetWidth}×{targetHeight} · {recordingConfig.fps} FPS · 16:9
                </span>
              </div>
              <DialogTitle className="text-sm sm:text-base font-semibold tracking-tight text-foreground font-sans truncate">
                {currentComponentName}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Record a smooth 16:9 60fps interaction showcase video of your live component with Auto-Pilot choreography or Manual Live capture.
              </DialogDescription>
            </div>
          </div>

          {/* Header Utility Strip */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {exportToast && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-center gap-1.5 border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-sans text-emerald-600 dark:text-emerald-400"
              >
                <Check className="size-3.5 shrink-0" />
                <span>{exportToast}</span>
              </div>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  disabled={isBusy}
                  onClick={() => {
                    const next = previewTheme === "dark" ? "light" : "dark";
                    setPreviewTheme(next);
                    postToStage({ type: "SET_PREVIEW_THEME", theme: next });
                  }}
                  aria-label="Toggle stage theme"
                  className="size-7 rounded-none border-border/80 bg-background/70"
                >
                  {previewTheme === "dark" ? (
                    <Sun className="size-3.5 text-amber-500" />
                  ) : (
                    <Moon className="size-3.5 text-sky-400" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-sans text-xs">
                Stage theme: {previewTheme === "dark" ? "Dark" : "Light"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  disabled={isBusy}
                  onClick={() => {
                    setStageReady(false);
                    setStageReloadKey((k) => k + 1);
                  }}
                  aria-label="Reload 16:9 stage"
                  className="size-7 rounded-none border-border/80 bg-background/70"
                >
                  <RefreshCw className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-sans text-xs">
                Reset & reload 16:9 stage
              </TooltipContent>
            </Tooltip>
          </div>
        </DialogHeader>

        {/* Main Workspace Split: Primary 16:9 Stage (Left) + Director Inspector (Right) */}
        <div className="flex flex-1 min-h-0 flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
          {/* LEFT: Edge-to-Edge 16:9 Stage Viewport */}
          <div className="flex flex-1 flex-col min-w-0 bg-muted/20 dark:bg-black/40 p-4 sm:p-5 gap-3 justify-between overflow-hidden">
            {/* External Telemetry Bar (Always OUTSIDE the 16:9 captured crop region!) */}
            <div className="flex items-center justify-between gap-3 text-xs font-sans shrink-0">
              <div className="flex items-center gap-2 min-w-0 text-muted-foreground">
                {phase === "recording" ? (
                  <>
                    <span className="inline-block size-2 rounded-full bg-destructive animate-pulse shrink-0" />
                    <span className="font-medium text-foreground">
                      Recording 16:9 Stage
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-[11px] tabular-nums text-foreground">
                      {formatTimecode(elapsedMs)}
                      {recordingConfig.mode === "autopilot"
                        ? ` / ${formatTimecode(recordingConfig.duration * 1000)}`
                        : ""}
                    </span>
                    <span aria-hidden="true" className="hidden sm:inline">
                      ·
                    </span>
                    <span className="hidden sm:inline text-[11px]">
                      {activeEngine === "native-region"
                        ? "Native 60fps Region Capture"
                        : "Direct Stage Compositor"}
                    </span>
                  </>
                ) : phase === "countdown" ? (
                  <span className="font-medium text-foreground">
                    Starting capture in{" "}
                    <span className="font-mono tabular-nums text-primary font-semibold">
                      {countdownValue}
                    </span>
                    ...
                  </span>
                ) : phase === "previewing" ? (
                  <span className="font-medium text-foreground">
                    Previewing Auto-Pilot choreography (dry run)
                  </span>
                ) : phase === "processing" ? (
                  <div className="flex items-center gap-2 text-foreground">
                    <Loader2 className="size-3.5 animate-spin text-primary" />
                    <span>Finalizing 60fps stream...</span>
                  </div>
                ) : phase === "review" && recordingResult ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">
                      Capture Ready
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-[11px] tabular-nums">
                      {recordingResult.width}×{recordingResult.height}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-[11px] tabular-nums">
                      {recordingResult.fps} FPS
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-[11px] tabular-nums">
                      {(recordingResult.durationMs / 1000).toFixed(1)}s
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-[11px] tabular-nums">
                      {formatBytes(recordingResult.blob.size)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-medium text-foreground">
                      Edge-to-Edge 16:9 Stage
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">
                      {discoveredTargets.interactiveCount > 0
                        ? `${discoveredTargets.interactiveCount} interactive targets`
                        : "Surface hover sweep ready"}
                      {discoveredTargets.scrollableDistance > 36
                        ? ` · ${discoveredTargets.scrollableDistance}px scrollable`
                        : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* Live progress / quick action outside the crop frame */}
              <div className="flex items-center gap-2 shrink-0">
                {phase === "recording" && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => void stopRecording()}
                    className="h-7 rounded-none px-3 text-xs font-sans gap-1.5"
                  >
                    <Square className="size-3 fill-current" />
                    <span>Stop</span>
                  </Button>
                )}
                {phase === "previewing" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTogglePreviewRun}
                    className="h-7 rounded-none px-2.5 text-xs font-sans gap-1.5"
                  >
                    <Square className="size-3" />
                    <span>Stop Preview</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Recording Progress Bar (Strictly Outside Captured Region) */}
            {phase === "recording" && (
              <div className="h-1 w-full bg-muted overflow-hidden shrink-0">
                <div
                  className={cn(
                    "h-full bg-destructive transition-[width] duration-100 ease-linear",
                    recordingConfig.mode === "manual" && "animate-pulse"
                  )}
                  style={{ width: `${recordingProgressPct}%` }}
                />
              </div>
            )}

            {/* Centered 16:9 Stage Wrapper */}
            <div className="flex-1 flex items-center justify-center min-h-[260px] w-full overflow-hidden">
              <div className="w-full max-w-[920px] flex flex-col gap-2">
                {phase === "review" && previewVideoUrl ? (
                  /* Post-Capture Review Player */
                  <div className="relative w-full aspect-video border border-border bg-black overflow-hidden">
                    <video
                      ref={reviewVideoRef}
                      src={previewVideoUrl}
                      autoPlay
                      loop
                      playsInline
                      onTimeUpdate={(e) =>
                        setReviewCurrentTime(e.currentTarget.currentTime)
                      }
                      onLoadedMetadata={(e) => {
                        if (Number.isFinite(e.currentTarget.duration)) {
                          setReviewDuration(e.currentTarget.duration);
                        }
                      }}
                      className="w-full h-full object-contain bg-black"
                    />
                  </div>
                ) : (
                  /* LIVE EDGE-TO-EDGE 16:9 RECORDING STAGE (Exact Crop Target) */
                  <div
                    ref={stageContainerRef}
                    data-testid="video-studio-16x9-stage"
                    onPointerMoveCapture={(e) =>
                      forwardBoundaryPointerToStage(e, "move")
                    }
                    onPointerDownCapture={(e) =>
                      forwardBoundaryPointerToStage(e, "down")
                    }
                    onPointerUpCapture={(e) =>
                      forwardBoundaryPointerToStage(e, "up")
                    }
                    className={cn(
                      "relative w-full aspect-video border border-border overflow-hidden",
                      previewTheme === "dark" ? "bg-zinc-950" : "bg-white",
                      recordingConfig.mode === "manual" &&
                        recordingConfig.showCursor &&
                        "cursor-none"
                    )}
                  >
                    {!stageReady && !compileError && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 bg-background/95 text-muted-foreground font-sans text-xs">
                        <Loader2 className="size-5 animate-spin text-primary" />
                        <span>Hydrating 16:9 component stage...</span>
                      </div>
                    )}

                    <iframe
                      ref={stageIframeRef}
                      key={`${stageReloadKey}-${currentTemplateId}`}
                      srcDoc={sandboxHtml}
                      title="16:9 Video Studio Live Stage"
                      sandbox="allow-scripts allow-same-origin allow-modals"
                      className="w-full h-full border-none block"
                    />

                    {/* Top-Layer 60fps Virtual Cursor & Minimal Click Pulse Canvas (Guaranteed visible in Native & Manual Live capture) */}
                    <canvas
                      ref={stageCursorCanvasRef}
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 z-30 w-full h-full block"
                    />
                  </div>
                )}

                {/* Inline Review Scrubber Bar */}
                {phase === "review" && previewVideoUrl && (
                  <div className="flex items-center gap-3 border border-border bg-card px-3 py-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={handleReviewPlayPause}
                      aria-label={isReviewPlaying ? "Pause video" : "Play video"}
                      className="size-7 rounded-none shrink-0"
                    >
                      {isReviewPlaying ? (
                        <Pause className="size-3.5" />
                      ) : (
                        <Play className="size-3.5" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={handleReviewRestart}
                      aria-label="Restart video"
                      className="size-7 rounded-none shrink-0"
                    >
                      <RotateCcw className="size-3.5" />
                    </Button>

                    <div className="flex-1 px-1">
                      <Slider
                        value={[reviewCurrentTime]}
                        min={0}
                        max={Math.max(0.1, reviewDuration)}
                        step={0.05}
                        onValueChange={([val]) => {
                          setReviewCurrentTime(val);
                          if (reviewVideoRef.current) {
                            reviewVideoRef.current.currentTime = val;
                          }
                        }}
                        aria-label="Video playback position"
                      />
                    </div>

                    <span className="font-mono text-[11px] text-muted-foreground tabular-nums shrink-0">
                      {formatTimecode(reviewCurrentTime * 1000)} /{" "}
                      {formatTimecode(reviewDuration * 1000)}
                    </span>
                  </div>
                )}

                {/* Actionable Error / Iframe Permission Fallback Recovery */}
                {errorMessage && (
                  <div
                    role="alert"
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs font-sans"
                  >
                    <div className="flex items-start gap-2 min-w-0 text-destructive">
                      <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{errorMessage}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRecordingConfig({ captureEngine: "direct" });
                        void beginActualRecording("direct");
                      }}
                      className="h-7 rounded-none text-xs shrink-0 bg-background"
                    >
                      Record with Direct Stage
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Subtle Footer Hint Outside Stage */}
            <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground font-sans shrink-0">
              <span>
                {recordingConfig.mode === "autopilot"
                  ? "Auto-Pilot detects interactive buttons, opens & clicks dropdown menus, runs multi-click sequences, and auto-scrolls smoothly."
                  : "Manual Live mode replaces your OS pointer with a spring-smoothed virtual cursor and minimal click feedback."}
              </span>
              <span className="hidden xl:inline font-mono text-[10px] shrink-0">
                16:9 EDGE-TO-EDGE
              </span>
            </div>
          </div>

          {/* RIGHT: Director Inspector Sidebar */}
          <aside className="w-full lg:w-[320px] xl:w-[340px] shrink-0 border-t lg:border-t-0 lg:border-l border-border bg-card flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              {/* Mode Selector */}
              <section className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    INTERACTION MODE
                  </span>
                  <Badge
                    variant="outline"
                    className="rounded-none text-[10px] font-sans font-normal px-1.5 py-0 h-5"
                  >
                    {recordingConfig.mode === "autopilot" ? "Automated" : "Live Input"}
                  </Badge>
                </div>

                <Tabs
                  value={recordingConfig.mode}
                  onValueChange={(val) =>
                    setRecordingConfig({
                      mode: val as RecordingConfig["mode"],
                    })
                  }
                >
                  <TabsList className="grid grid-cols-2 w-full h-8 rounded-none bg-muted/60 p-0.5 border border-border">
                    <TabsTrigger
                      value="autopilot"
                      disabled={isBusy}
                      className="rounded-none text-xs font-sans gap-1.5 h-7"
                    >
                      <Sparkles className="size-3.5" />
                      <span>Auto-Pilot</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="manual"
                      disabled={isBusy}
                      className="rounded-none text-xs font-sans gap-1.5 h-7"
                    >
                      <Hand className="size-3.5" />
                      <span>Manual Live</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </section>

              <Separator />

              {/* Auto-Pilot Choreography Settings OR Manual Live Guide */}
              {recordingConfig.mode === "autopilot" ? (
                <section className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      CHOREOGRAPHY
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isBusy || !stageReady}
                      onClick={() => postToStage({ type: "VIDEO_STUDIO_SCAN" })}
                      className="h-6 px-2 rounded-none text-[11px] text-muted-foreground hover:text-foreground font-sans"
                    >
                      Rescan DOM
                    </Button>
                  </div>

                  {/* Duration Presets */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground font-medium">Duration</span>
                      <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                        {recordingConfig.duration}s clip
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {([5, 8, 12, 15] as const).map((sec) => (
                        <Button
                          key={sec}
                          type="button"
                          variant={
                            recordingConfig.duration === sec ? "default" : "outline"
                          }
                          size="sm"
                          disabled={isBusy}
                          onClick={() => setRecordingConfig({ duration: sec })}
                          className="h-7 rounded-none text-xs font-mono tabular-nums"
                        >
                          {sec}s
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Choreography Toggles */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-foreground">
                          Auto-Hover Sweep
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Glide cursor over interactive cards & controls
                        </div>
                      </div>
                      <Switch
                        checked={recordingConfig.autoHover}
                        disabled={isBusy}
                        onCheckedChange={(checked) =>
                          setRecordingConfig({
                            autoHover: checked,
                            simulateHover: checked,
                          })
                        }
                        aria-label="Toggle auto-hover sweep"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-foreground">
                          Smart Click & Dropdowns
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Opens dropdowns, clicks sub-items & multi-click controls
                        </div>
                      </div>
                      <Switch
                        checked={recordingConfig.autoClick}
                        disabled={isBusy}
                        onCheckedChange={(checked) =>
                          setRecordingConfig({ autoClick: checked })
                        }
                        aria-label="Toggle smart click and dropdown interactions"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
                          <ArrowDownUp className="size-3 text-muted-foreground" />
                          <span>Smooth Auto-Scroll</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {discoveredTargets.scrollableDistance > 36
                            ? `Scrolls ${discoveredTargets.scrollableDistance}px smoothly`
                            : "Triggers if component overflows viewport"}
                        </div>
                      </div>
                      <Switch
                        checked={recordingConfig.autoScroll}
                        disabled={isBusy}
                        onCheckedChange={(checked) =>
                          setRecordingConfig({ autoScroll: checked })
                        }
                        aria-label="Toggle smooth auto-scroll"
                      />
                    </div>

                    {recordingConfig.autoScroll && (
                      <div className="flex items-center justify-between gap-3 pl-3 border-l border-border">
                        <div className="text-xs text-muted-foreground">
                          Return smoothly to top for loop
                        </div>
                        <Switch
                          checked={recordingConfig.loopReturnToTop}
                          disabled={isBusy}
                          onCheckedChange={(checked) =>
                            setRecordingConfig({ loopReturnToTop: checked })
                          }
                          aria-label="Toggle return to top loop"
                        />
                      </div>
                    )}
                  </div>

                  {/* Dry-Run Preview Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isBusy || !stageReady || phase === "review"}
                    onClick={handleTogglePreviewRun}
                    className="w-full h-8 rounded-none text-xs font-sans gap-1.5"
                  >
                    {phase === "previewing" ? (
                      <>
                        <Square className="size-3" />
                        <span>Stop Dry Run</span>
                      </>
                    ) : (
                      <>
                        <Play className="size-3" />
                        <span>Preview Choreography</span>
                      </>
                    )}
                  </Button>
                </section>
              ) : (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      MANUAL LIVE CAPTURE
                    </span>
                    <Badge
                      variant="outline"
                      className="rounded-none text-[10px] font-sans font-normal px-1.5 py-0 h-5"
                    >
                      {recordingConfig.showCursor ? "Cursor Live" : "Cursor Hidden"}
                    </Badge>
                  </div>
                  <div className="border border-border bg-muted/30 p-3 text-xs text-muted-foreground leading-relaxed space-y-2">
                    <p className="text-foreground font-medium">
                      Live spring cursor preview active
                    </p>
                    <p>
                      Move your pointer over the 16:9 stage now to test the spring virtual cursor and minimal click pulse. Hit Record when ready to capture your live clicks, dropdowns, and scrolling at 60fps.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isBusy || !stageReady}
                    onClick={() => postToStage({ type: "VIDEO_STUDIO_RESET" })}
                    className="w-full h-8 rounded-none text-xs font-sans gap-1.5"
                  >
                    <RotateCcw className="size-3" />
                    <span>Reset Stage Position</span>
                  </Button>
                </section>
              )}

              <Separator />

              {/* Cursor & Feedback Section */}
              <section className="space-y-3">
                <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  CURSOR & FEEDBACK
                </span>

                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <MousePointer2 className="size-3 text-muted-foreground" />
                      <span>Spring Virtual Cursor</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Minimal 60fps spring pointer with subtle tilt
                    </div>
                  </div>
                  <Switch
                    checked={recordingConfig.showCursor}
                    disabled={isBusy}
                    onCheckedChange={(checked) =>
                      setRecordingConfig({ showCursor: checked })
                    }
                    aria-label="Toggle spring virtual cursor"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-foreground">
                      Minimal Click Pulse
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Crisp hairline click ring with subtle press feedback
                    </div>
                  </div>
                  <Switch
                    checked={recordingConfig.clickRipples}
                    disabled={isBusy}
                    onCheckedChange={(checked) =>
                      setRecordingConfig({ clickRipples: checked })
                    }
                    aria-label="Toggle minimal click pulse"
                  />
                </div>
              </section>

              <Separator />

              {/* Output & Capture Settings */}
              <section className="space-y-3">
                <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  EXPORT & CAPTURE
                </span>

                {/* Resolution & FPS */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground">
                      Resolution (16:9)
                    </span>
                    <div className="grid grid-cols-2 gap-1">
                      {(["1080p", "720p"] as const).map((res) => (
                        <Button
                          key={res}
                          type="button"
                          variant={
                            recordingConfig.resolution === res
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          disabled={isBusy}
                          onClick={() => setRecordingConfig({ resolution: res })}
                          className="h-7 rounded-none text-[11px] font-mono"
                        >
                          {res}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground">
                      Frame Rate
                    </span>
                    <div className="grid grid-cols-2 gap-1">
                      {([60, 30] as const).map((fpsVal) => (
                        <Button
                          key={fpsVal}
                          type="button"
                          variant={
                            recordingConfig.fps === fpsVal ? "default" : "outline"
                          }
                          size="sm"
                          disabled={isBusy}
                          onClick={() => setRecordingConfig({ fps: fpsVal })}
                          className="h-7 rounded-none text-[11px] font-mono tabular-nums"
                        >
                          {fpsVal}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Default Format */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Preferred Format</span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {serverFfmpegReady || capabilities.supportsNativeMp4
                        ? "H.264 MP4 Ready"
                        : "WebM Direct"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {(["mp4", "webm"] as const).map((fmt) => (
                      <Button
                        key={fmt}
                        type="button"
                        variant={
                          recordingConfig.format === fmt ? "default" : "outline"
                        }
                        size="sm"
                        disabled={isBusy}
                        onClick={() => setRecordingConfig({ format: fmt })}
                        className="h-7 rounded-none text-[11px] font-mono uppercase"
                      >
                        {fmt}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Capture Engine Selector */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Capture Engine</span>
                    <span className="text-[10px] text-muted-foreground">
                      {recordingConfig.captureEngine === "direct"
                        ? "Zero prompt"
                        : "True GPU 60fps"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(
                      [
                        { id: "auto", label: "Auto" },
                        { id: "native", label: "Native" },
                        { id: "direct", label: "Direct" },
                      ] as const
                    ).map((eng) => (
                      <Button
                        key={eng.id}
                        type="button"
                        variant={
                          recordingConfig.captureEngine === eng.id
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        disabled={isBusy}
                        onClick={() =>
                          setRecordingConfig({ captureEngine: eng.id })
                        }
                        className="h-7 rounded-none text-[11px] font-sans"
                      >
                        {eng.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Optional 3-2-1 Countdown */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-foreground">
                      3-2-1 Countdown
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Brief cue before Direct capture begins
                    </div>
                  </div>
                  <Switch
                    checked={recordingConfig.countdown}
                    disabled={isBusy}
                    onCheckedChange={(checked) =>
                      setRecordingConfig({ countdown: checked })
                    }
                    aria-label="Toggle 3-2-1 recording countdown"
                  />
                </div>
              </section>
            </div>

            {/* Pinned Bottom Primary Action Bar */}
            <div className="studio-toolbar-surface border-t border-border p-4 space-y-2 shrink-0">
              {phase === "review" && recordingResult ? (
                <>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    disabled={isTranscodingMp4}
                    onClick={() => {
                      if (
                        recordingConfig.format === "mp4" &&
                        (serverFfmpegReady || capabilities.supportsNativeMp4)
                      ) {
                        void handleDownloadMp4();
                      } else {
                        handleDownloadWebm();
                      }
                    }}
                    className="w-full h-9 rounded-none text-xs font-sans font-medium gap-2"
                  >
                    {isTranscodingMp4 ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Encoding H.264 60fps MP4...</span>
                      </>
                    ) : (
                      <>
                        <Download className="size-3.5" />
                        <span>
                          Download{" "}
                          {recordingConfig.format === "mp4" &&
                          (serverFfmpegReady || capabilities.supportsNativeMp4)
                            ? "MP4"
                            : "WebM"}{" "}
                          ({recordingConfig.resolution} · {recordingConfig.fps}fps)
                        </span>
                      </>
                    )}
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isTranscodingMp4}
                      onClick={
                        recordingConfig.format === "mp4"
                          ? handleDownloadWebm
                          : () => void handleDownloadMp4()
                      }
                      className="h-8 rounded-none text-xs font-sans gap-1.5"
                    >
                      <Download className="size-3" />
                      <span>
                        {recordingConfig.format === "mp4"
                          ? "Save WebM"
                          : "Save MP4"}
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isTranscodingMp4}
                      onClick={handleNewTake}
                      className="h-8 rounded-none text-xs font-sans gap-1.5"
                    >
                      <RotateCcw className="size-3" />
                      <span>New Take</span>
                    </Button>
                  </div>
                </>
              ) : phase === "recording" ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => void stopRecording()}
                  className="w-full h-9 rounded-none text-xs font-sans font-medium gap-2"
                >
                  <Square className="size-3.5 fill-current" />
                  <span>Stop Recording ({formatTimecode(elapsedMs)})</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  disabled={!stageReady || isBusy || Boolean(compileError)}
                  onClick={() => void beginActualRecording()}
                  className="w-full h-9 rounded-none text-xs font-sans font-medium gap-2"
                >
                  {phase === "countdown" || phase === "processing" ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>
                        {phase === "countdown"
                          ? `Starting in ${countdownValue}...`
                          : "Finalizing video..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <Video className="size-3.5" />
                      <span>
                        Record 16:9 Video ({recordingConfig.fps}fps)
                      </span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
