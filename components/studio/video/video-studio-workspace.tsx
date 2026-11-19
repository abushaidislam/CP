"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStudioStore } from "@/lib/store/studio-store";
import { compileSandboxHtml } from "@/lib/sandbox/sandbox-compiler";
import { DEFAULT_TEMPLATES } from "@/lib/sandbox/default-templates";
import {
  detectCaptureCapabilities,
  drawCanvasCursorOverlay,
  startStageRecording,
  transcodeRecordingToMp4,
  type CaptureEngineUsed,
  type CursorTelemetryState,
  type StageRecorderHandle,
  type StageRecordingResult,
} from "@/lib/video/stage-recorder";
import {
  formatBytes,
  formatTimecode,
  slugifyFilename,
  type DiscoveredTargetsInfo,
  type ReplayEventItem,
  type StudioPhase,
} from "./video-studio-types";
import { VideoStageViewport } from "./video-stage-viewport";
import { VideoDirectorSidebar } from "./video-director-sidebar";

export interface VideoStudioWorkspaceProps {
  backdropClassName?: string;
  reloadTrigger?: number;
  onClose: () => void;
}

export function VideoStudioWorkspace({
  backdropClassName,
  reloadTrigger = 0,
  onClose,
}: VideoStudioWorkspaceProps) {
  const {
    recordingConfig,
    setRecordingConfig,
    files,
    dependencies,
    canvasBg,
    previewTheme,
    currentTemplateId,
    userComponents,
  } = useStudioStore(
    useShallow((state) => ({
      recordingConfig: state.recordingConfig,
      setRecordingConfig: state.setRecordingConfig,
      files: state.files,
      dependencies: state.dependencies,
      canvasBg: state.canvasBg,
      previewTheme: state.previewTheme,
      currentTemplateId: state.currentTemplateId,
      userComponents: state.userComponents,
    }))
  );

  const capabilities = useMemo(() => detectCaptureCapabilities(), []);

  const [phase, setPhase] = useState<StudioPhase>("idle");
  const [countdownValue, setCountdownValue] = useState<number>(3);
  const [zeroLagReplay, setZeroLagReplay] = useState<boolean>(false);
  const [stageReady, setStageReady] = useState<boolean>(false);
  const [stageReloadKey, setStageReloadKey] = useState<number>(0);
  const [stageScale, setStageScale] = useState<number>(1);
  const [discoveredTargets, setDiscoveredTargets] =
    useState<DiscoveredTargetsInfo>({
      interactiveCount: 0,
      scrollableDistance: 0,
      hasCanvas: false,
    });

  const [activeEngine, setActiveEngine] =
    useState<CaptureEngineUsed>("direct-fallback");
  const [recordingResult, setRecordingResult] =
    useState<StageRecordingResult | null>(null);
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
  const cursorCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const stageRectRef = useRef<{
    left: number;
    top: number;
    width: number;
    height: number;
  }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });
  const lastCursorTelemetryRef = useRef<CursorTelemetryState | null>(null);
  const reviewVideoRef = useRef<HTMLVideoElement | null>(null);
  const recorderRef = useRef<StageRecorderHandle | null>(null);
  const previewVideoUrlRef = useRef<string | null>(null);
  const cachedMp4UrlRef = useRef<string | null>(null);
  previewVideoUrlRef.current = previewVideoUrl;
  cachedMp4UrlRef.current = cachedMp4Url;

  // Imperative DOM refs for timecode & progress (0 React re-renders during recording!)
  const timecodeTextRef = useRef<HTMLSpanElement | null>(null);
  const stopBtnTimecodeRef = useRef<HTMLSpanElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordStartTsRef = useRef<number>(0);
  const pendingReplayEngineRef = useRef<"auto" | "native" | "direct">("auto");
  const safetyStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stageReadyFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const previewThemeRef = useRef(previewTheme);
  previewThemeRef.current = previewTheme;

  const currentComponentName = useMemo(() => {
    const userComp = userComponents?.[currentTemplateId];
    if (userComp?.name) return userComp.name;
    const tmpl = DEFAULT_TEMPLATES.find((t) => t.id === currentTemplateId);
    return tmpl?.name || "Component Showcase";
  }, [userComponents, currentTemplateId]);

  const { html: sandboxHtml, error: compileError } = useMemo(() => {
    return compileSandboxHtml(
      files["component.tsx"],
      files["default.tsx"] || files["demo.tsx"] || "",
      files["index.css"],
      dependencies,
      canvasBg,
      previewThemeRef.current,
      { videoStudio: true }
    );
  }, [files, dependencies, canvasBg]);

  // Sync external CanvasToolbar reload triggers
  const lastReloadTriggerRef = useRef(reloadTrigger);
  useEffect(() => {
    if (reloadTrigger !== lastReloadTriggerRef.current) {
      lastReloadTriggerRef.current = reloadTrigger;
      setStageReady(false);
      setStageReloadKey((k) => k + 1);
    }
  }, [reloadTrigger]);

  // Safety hydration fallback when sandboxHtml changes without compile errors
  useEffect(() => {
    if (compileError) return;
    const safetyTimer = setTimeout(() => {
      setStageReady(true);
    }, 2200);
    return () => clearTimeout(safetyTimer);
  }, [sandboxHtml, stageReloadKey, compileError]);

  // Check server FFmpeg availability on mount
  useEffect(() => {
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
  }, []);

  const postToStage = useCallback((message: Record<string, unknown>) => {
    try {
      stageIframeRef.current?.contentWindow?.postMessage(message, "*");
    } catch {
      // Ignore cross-origin post failures
    }
  }, []);

  const handleStageIframeLoad = useCallback(() => {
    if (stageReadyFallbackTimerRef.current) {
      clearTimeout(stageReadyFallbackTimerRef.current);
    }
    postToStage({
      type: "SET_PREVIEW_THEME",
      theme: previewThemeRef.current,
    });
    postToStage({ type: "VIDEO_STUDIO_SCAN" });
    stageReadyFallbackTimerRef.current = setTimeout(() => {
      setStageReady(true);
      postToStage({
        type: "SET_PREVIEW_THEME",
        theme: previewThemeRef.current,
      });
      postToStage({ type: "VIDEO_STUDIO_SCAN" });
    }, 950);
  }, [postToStage]);

  // Keep stage preview theme synced with CanvasToolbar theme toggle without reloading srcDoc
  useEffect(() => {
    if (!stageReady) return;
    postToStage({ type: "SET_PREVIEW_THEME", theme: previewTheme });
  }, [previewTheme, stageReady, postToStage]);

  const isReviewPhase = phase === "review" && Boolean(previewVideoUrl);

  // Observe 16:9 stage dimensions once (zero per-frame getBoundingClientRect layout reflows!)
  useEffect(() => {
    if (isReviewPhase) return;
    const container = stageContainerRef.current;
    if (!container) return;

    const updateCachedRect = () => {
      const rect = container.getBoundingClientRect();
      stageRectRef.current = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      };
      if (rect.width >= 10) {
        const nextScale = Number((rect.width / 1280).toFixed(4));
        setStageScale((prev) => (Math.abs(prev - nextScale) > 0.001 ? nextScale : prev));
      }
      const canvas = stageCursorCanvasRef.current;
      if (canvas && rect.width >= 10 && rect.height >= 10) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const targetW = Math.round(rect.width * dpr);
        const targetH = Math.round(rect.height * dpr);
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }
        cursorCtxRef.current = canvas.getContext("2d");
      }
    };

    updateCachedRect();
    const ro = new ResizeObserver(updateCachedRect);
    ro.observe(container);
    window.addEventListener("resize", updateCachedRect, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateCachedRect);
      cursorCtxRef.current = null;
    };
  }, [isReviewPhase, stageReloadKey]);

  const clearParentCursorCanvas = useCallback(() => {
    const canvas = stageCursorCanvasRef.current;
    if (!canvas) return;
    const ctx = cursorCtxRef.current || canvas.getContext("2d");
    if (ctx) {
      cursorCtxRef.current = ctx;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const drawParentCursorCanvas = useCallback(
    (telemetry: CursorTelemetryState) => {
      const canvas = stageCursorCanvasRef.current;
      if (!canvas) return;

      let width = canvas.width;
      let height = canvas.height;
      if (width < 10 || height < 10) {
        const rect = stageRectRef.current;
        if (rect.width < 10 || rect.height < 10) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = Math.round(rect.width * dpr);
        height = Math.round(rect.height * dpr);
        canvas.width = width;
        canvas.height = height;
        cursorCtxRef.current = canvas.getContext("2d");
      }

      const ctx = cursorCtxRef.current || canvas.getContext("2d");
      if (!ctx) return;
      cursorCtxRef.current = ctx;
      ctx.clearRect(0, 0, width, height);

      if (
        !telemetry.visible &&
        (!telemetry.ripples || telemetry.ripples.length === 0)
      ) {
        return;
      }

      drawCanvasCursorOverlay(
        ctx,
        width,
        height,
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
      const rect = stageRectRef.current;
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
    if (!stageReady) return;
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
      clearParentCursorCanvas();
    }
  }, [
    stageReady,
    recordingConfig,
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
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
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

  /**
   * Updates recording timecode & progress bar directly via DOM refs at 10Hz
   * so React performs ZERO re-renders during active video capture.
   */
  const startImperativeTimer = useCallback((targetTotalMs?: number) => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    recordStartTsRef.current = performance.now();

    const updateDom = () => {
      const elapsed = Math.max(0, performance.now() - recordStartTsRef.current);
      const formatted = formatTimecode(elapsed);
      if (timecodeTextRef.current) {
        timecodeTextRef.current.textContent = targetTotalMs
          ? `${formatted} / ${formatTimecode(targetTotalMs)}`
          : formatted;
      }
      if (stopBtnTimecodeRef.current) {
        stopBtnTimecodeRef.current.textContent = `(${formatted})`;
      }
      if (progressBarRef.current) {
        const pct = targetTotalMs
          ? Math.min(100, (elapsed / targetTotalMs) * 100)
          : 100;
        progressBarRef.current.style.width = `${pct.toFixed(1)}%`;
      }
    };

    updateDom();
    timerIntervalRef.current = setInterval(updateDom, 100);
  }, []);

  const revokeMediaUrls = useCallback(() => {
    if (previewVideoUrlRef.current) {
      URL.revokeObjectURL(previewVideoUrlRef.current);
    }
    if (
      cachedMp4UrlRef.current &&
      cachedMp4UrlRef.current !== previewVideoUrlRef.current
    ) {
      URL.revokeObjectURL(cachedMp4UrlRef.current);
    }
    setPreviewVideoUrl(null);
    setCachedMp4Url(null);
    setRecordingResult(null);
  }, []);

  // Clean up timers, active capture, and blob URLs when workspace unmounts
  useEffect(() => {
    return () => {
      stopTimers();
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      if (stageReadyFallbackTimerRef.current) {
        clearTimeout(stageReadyFallbackTimerRef.current);
      }
      if (recorderRef.current) {
        recorderRef.current.cancel();
        recorderRef.current = null;
      }
      if (previewVideoUrlRef.current) {
        URL.revokeObjectURL(previewVideoUrlRef.current);
      }
      if (
        cachedMp4UrlRef.current &&
        cachedMp4UrlRef.current !== previewVideoUrlRef.current
      ) {
        URL.revokeObjectURL(cachedMp4UrlRef.current);
      }
    };
  }, [stopTimers]);

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
      if (result.mimeType.includes("video/mp4") && !result.needsServerRescale) {
        setCachedMp4Url(url);
      } else {
        setCachedMp4Url(null);
      }
      setReviewDuration(Math.max(0.5, result.durationMs / 1000));
      setReviewCurrentTime(0);
      setIsReviewPlaying(true);
      setPhase("review");
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to finalize video recording."
      );
      setPhase("error");
    }
  }, [postToStage, stopTimers]);

  const startReplayRenderFromTake = useCallback(
    async (events: ReplayEventItem[], durationMs: number) => {
      if (!stageContainerRef.current) return;
      stopTimers();
      setPhase("rendering-replay");
      postToStage({ type: "VIDEO_STUDIO_RESET" });
      await new Promise((r) => setTimeout(r, 120));

      try {
        const handle = await startStageRecording({
          stageElement: stageContainerRef.current,
          iframeElement: stageIframeRef.current,
          resolution: recordingConfig.resolution,
          fps: recordingConfig.fps,
          preferredFormat: recordingConfig.format,
          preferredEngine: pendingReplayEngineRef.current,
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
        startImperativeTimer(durationMs);

        postToStage({
          type: "VIDEO_STUDIO_PLAY_REPLAY",
          events,
          durationMs,
          config: {
            showCursor: recordingConfig.showCursor,
            clickRipples: recordingConfig.clickRipples,
            renderInParentOverlay: true,
          },
        });

        safetyStopTimerRef.current = setTimeout(() => {
          if (recorderRef.current) {
            void stopRecording();
          }
        }, durationMs + 1600);
      } catch (err) {
        stopTimers();
        postToStage({ type: "VIDEO_STUDIO_STOP" });
        const rawMsg = err instanceof Error ? err.message : String(err);
        const friendly = /cancel|denied|NotAllowedError/i.test(rawMsg)
          ? "Screen capture permission was declined or blocked in this preview frame. Switch Capture Engine to Direct or retry."
          : rawMsg;
        setErrorMessage(friendly);
        setPhase("error");
      }
    },
    [
      recordingConfig.resolution,
      recordingConfig.fps,
      recordingConfig.format,
      recordingConfig.showCursor,
      recordingConfig.clickRipples,
      previewTheme,
      postToStage,
      startImperativeTimer,
      stopRecording,
      stopTimers,
    ]
  );

  // Listen to messages from the 16:9 Video Studio sandbox iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        !stageIframeRef.current ||
        event.source !== stageIframeRef.current.contentWindow
      ) {
        return;
      }

      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "RENDER_SUCCESS") {
        setStageReady(true);
        postToStage({
          type: "SET_PREVIEW_THEME",
          theme: previewThemeRef.current,
        });
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

      if (data.type === "VIDEO_STUDIO_FRAME_BITMAP") {
        recorderRef.current?.pushFrameBitmap(
          Number(data.requestId || 0),
          data.bitmap instanceof ImageBitmap ? data.bitmap : null,
          Number(data.captureMs || 8)
        );
      }

      if (data.type === "VIDEO_STUDIO_FRAME_BLOB") {
        recorderRef.current?.pushFrameBlob(
          Number(data.requestId || 0),
          data.blob instanceof Blob ? data.blob : null,
          Number(data.captureMs || 20)
        );
      }

      if (data.type === "VIDEO_STUDIO_FRAME_DATA") {
        recorderRef.current?.pushFrameDataUrl(
          Number(data.requestId || 0),
          typeof data.dataUrl === "string" ? data.dataUrl : null,
          Number(data.captureMs || 25)
        );
      }

      if (data.type === "VIDEO_STUDIO_REPLAY_TAKE") {
        const events = Array.isArray(data.events)
          ? (data.events as ReplayEventItem[])
          : [];
        const durationMs = Math.max(400, Number(data.durationMs || 1500));
        void startReplayRenderFromTake(events, durationMs);
      }

      if (data.type === "VIDEO_STUDIO_CHOREOGRAPHY_COMPLETE") {
        if (data.dryRun) {
          stopTimers();
          clearParentCursorCanvas();
          setPhase((prev) => (prev === "previewing" ? "idle" : prev));
        } else if (recorderRef.current) {
          void stopRecording();
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [
    postToStage,
    stopRecording,
    stopTimers,
    clearParentCursorCanvas,
    drawParentCursorCanvas,
    startReplayRenderFromTake,
  ]);

  const handleTogglePreviewRun = () => {
    if (phase === "previewing") {
      stopTimers();
      postToStage({ type: "VIDEO_STUDIO_RESET" });
      clearParentCursorCanvas();
      setPhase("idle");
      return;
    }
    stopTimers();
    setErrorMessage(null);
    setPhase("previewing");
    startImperativeTimer(recordingConfig.duration * 1000);
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
    safetyStopTimerRef.current = setTimeout(() => {
      stopTimers();
      clearParentCursorCanvas();
      setPhase((prev) => (prev === "previewing" ? "idle" : prev));
    }, recordingConfig.duration * 1000 + 2200);
  };

  const handleStopCaptureMoves = useCallback(() => {
    stopTimers();
    postToStage({ type: "VIDEO_STUDIO_STOP_REPLAY_CAPTURE" });
  }, [postToStage, stopTimers]);

  const beginActualRecording = useCallback(
    async (engineOverride?: "auto" | "native" | "direct") => {
      if (!stageContainerRef.current) return;
      stopTimers();
      setErrorMessage(null);
      revokeMediaUrls();

      const engineToUse = engineOverride || recordingConfig.captureEngine;

      // ZERO-LAG REPLAY PATH (Manual Live)
      if (recordingConfig.mode === "manual" && zeroLagReplay) {
        pendingReplayEngineRef.current = engineToUse;
        setPhase("capturing-moves");
        startImperativeTimer();
        try {
          stageIframeRef.current?.contentWindow?.focus();
        } catch {
          // Ignore focus restriction
        }
        postToStage({
          type: "VIDEO_STUDIO_START_REPLAY_CAPTURE",
          config: {
            showCursor: recordingConfig.showCursor,
            clickRipples: recordingConfig.clickRipples,
            renderInParentOverlay: true,
          },
        });
        return;
      }

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
          startImperativeTimer(
            recordingConfig.mode === "autopilot"
              ? recordingConfig.duration * 1000
              : undefined
          );

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

            safetyStopTimerRef.current = setTimeout(() => {
              if (recorderRef.current) {
                void stopRecording();
              }
            }, recordingConfig.duration * 1000 + 1800);
          } else {
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

      if (recordingConfig.countdown && engineToUse !== "native") {
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
      zeroLagReplay,
      previewTheme,
      postToStage,
      revokeMediaUrls,
      startImperativeTimer,
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
    showExportToast(
      `Downloaded ${ext.toUpperCase()} (${recordingConfig.resolution} · ${recordingConfig.fps}fps)`
    );
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
      showExportToast(
        `Downloaded MP4 (${recordingConfig.resolution} · ${recordingConfig.fps}fps)`
      );
      return;
    }

    setIsTranscodingMp4(true);
    setErrorMessage(null);
    try {
      const mp4Blob = await transcodeRecordingToMp4({
        blob: recordingResult.blob,
        fps: recordingConfig.fps,
        resolution: recordingConfig.resolution,
        forceRescale: Boolean(
          recordingResult.needsServerRescale && serverFfmpegReady
        ),
        ownerSessionToken: useStudioStore.getState().ownerSessionToken,
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
    } catch {
      // Fallback: download the captured video stream directly so the user always gets their file
      handleDownloadWebm();
    } finally {
      setIsTranscodingMp4(false);
    }
  };

  const handleNewTake = () => {
    revokeMediaUrls();
    setErrorMessage(null);
    setExportToast(null);
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

  const handleReviewSeek = (val: number) => {
    setReviewCurrentTime(val);
    if (reviewVideoRef.current) {
      reviewVideoRef.current.currentTime = val;
    }
  };

  const isBusy =
    phase === "recording" ||
    phase === "capturing-moves" ||
    phase === "rendering-replay" ||
    phase === "countdown" ||
    phase === "processing";

  const isActiveCapturePhase =
    phase === "recording" ||
    phase === "capturing-moves" ||
    phase === "rendering-replay";

  const handleClose = () => {
    if (isActiveCapturePhase || phase === "previewing") {
      recorderRef.current?.cancel();
      recorderRef.current = null;
      stopTimers();
      postToStage({ type: "VIDEO_STUDIO_STOP" });
      clearParentCursorCanvas();
    }
    onClose();
  };

  return (
    <>
      <VideoStageViewport
        phase={phase}
        isActiveCapturePhase={isActiveCapturePhase}
        countdownValue={countdownValue}
        activeEngine={activeEngine}
        recordingConfig={recordingConfig}
        recordingResult={recordingResult}
        discoveredTargets={discoveredTargets}
        previewTheme={previewTheme}
        previewVideoUrl={previewVideoUrl}
        stageReady={stageReady}
        stageReloadKey={stageReloadKey}
        stageScale={stageScale}
        currentTemplateId={currentTemplateId}
        sandboxHtml={sandboxHtml}
        compileError={compileError}
        errorMessage={errorMessage}
        isReviewPlaying={isReviewPlaying}
        reviewCurrentTime={reviewCurrentTime}
        reviewDuration={reviewDuration}
        timecodeTextRef={timecodeTextRef}
        progressBarRef={progressBarRef}
        stageContainerRef={stageContainerRef}
        stageIframeRef={stageIframeRef}
        stageCursorCanvasRef={stageCursorCanvasRef}
        reviewVideoRef={reviewVideoRef}
        onStopCaptureMoves={handleStopCaptureMoves}
        onStopRecording={() => void stopRecording()}
        onTogglePreviewRun={handleTogglePreviewRun}
        onForwardBoundaryPointer={forwardBoundaryPointerToStage}
        onReviewTimeUpdate={setReviewCurrentTime}
        onReviewDurationLoaded={setReviewDuration}
        onReviewPlayPause={handleReviewPlayPause}
        onReviewRestart={handleReviewRestart}
        onReviewSeek={handleReviewSeek}
        onReviewPlayStateChange={setIsReviewPlaying}
        onStageIframeLoad={handleStageIframeLoad}
        onRecordWithDirectEngine={() => {
          setRecordingConfig({ captureEngine: "direct" });
          void beginActualRecording("direct");
        }}
        backdropClassName={backdropClassName}
      />

      <VideoDirectorSidebar
        phase={phase}
        isBusy={isBusy}
        stageReady={stageReady}
        compileError={compileError}
        recordingConfig={recordingConfig}
        recordingResult={recordingResult}
        discoveredTargets={discoveredTargets}
        zeroLagReplay={zeroLagReplay}
        serverFfmpegReady={serverFfmpegReady}
        supportsNativeMp4={capabilities.supportsNativeMp4}
        isTranscodingMp4={isTranscodingMp4}
        countdownValue={countdownValue}
        exportToast={exportToast}
        stopBtnTimecodeRef={stopBtnTimecodeRef}
        onUpdateConfig={setRecordingConfig}
        onSetZeroLagReplay={setZeroLagReplay}
        onRescanDom={() => postToStage({ type: "VIDEO_STUDIO_SCAN" })}
        onResetStagePosition={() => postToStage({ type: "VIDEO_STUDIO_RESET" })}
        onReloadStage={() => {
          setStageReady(false);
          setStageReloadKey((k) => k + 1);
        }}
        onTogglePreviewRun={handleTogglePreviewRun}
        onDownloadMp4={() => void handleDownloadMp4()}
        onDownloadWebm={handleDownloadWebm}
        onNewTake={handleNewTake}
        onStopCaptureMoves={handleStopCaptureMoves}
        onStopRecording={() => void stopRecording()}
        onBeginRecording={() => void beginActualRecording()}
        onClose={handleClose}
        className="absolute right-0 top-0 bottom-0 z-30 shadow-2xl @[720px]:static @[720px]:shadow-none"
      />
    </>
  );
}
