"use client";

import React from "react";
import type { PreviewTheme, RecordingConfig } from "@/lib/store/studio-store";
import type {
  CaptureEngineUsed,
  StageRecordingResult,
} from "@/lib/video/stage-recorder";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Square,
} from "lucide-react";
import {
  formatBytes,
  formatTimecode,
  type DiscoveredTargetsInfo,
  type StudioPhase,
} from "./video-studio-types";

export interface VideoStageViewportProps {
  phase: StudioPhase;
  isActiveCapturePhase: boolean;
  countdownValue: number;
  activeEngine: CaptureEngineUsed;
  recordingConfig: RecordingConfig;
  recordingResult: StageRecordingResult | null;
  discoveredTargets: DiscoveredTargetsInfo;
  previewTheme: PreviewTheme;
  previewVideoUrl: string | null;
  stageReady: boolean;
  stageReloadKey: number;
  stageScale?: number;
  currentTemplateId: string;
  sandboxHtml: string;
  compileError: string | null;
  errorMessage: string | null;
  isReviewPlaying: boolean;
  reviewCurrentTime: number;
  reviewDuration: number;
  timecodeTextRef: React.RefObject<HTMLSpanElement | null>;
  progressBarRef: React.RefObject<HTMLDivElement | null>;
  stageContainerRef: React.RefObject<HTMLDivElement | null>;
  stageIframeRef: React.RefObject<HTMLIFrameElement | null>;
  stageCursorCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  reviewVideoRef: React.RefObject<HTMLVideoElement | null>;
  onStopCaptureMoves: () => void;
  onStopRecording: () => void;
  onTogglePreviewRun: () => void;
  onForwardBoundaryPointer: (
    e: React.PointerEvent<HTMLDivElement>,
    eventType: "move" | "down" | "up"
  ) => void;
  onReviewTimeUpdate: (time: number) => void;
  onReviewDurationLoaded: (duration: number) => void;
  onReviewPlayPause: () => void;
  onReviewRestart: () => void;
  onReviewSeek: (time: number) => void;
  onReviewPlayStateChange?: (playing: boolean) => void;
  onStageIframeLoad?: () => void;
  onRecordWithDirectEngine: () => void;
  backdropClassName?: string;
}

export function VideoStageViewport({
  phase,
  isActiveCapturePhase,
  countdownValue,
  activeEngine,
  recordingConfig,
  recordingResult,
  discoveredTargets,
  previewTheme,
  previewVideoUrl,
  stageReady,
  stageReloadKey,
  stageScale = 1,
  currentTemplateId,
  sandboxHtml,
  compileError,
  errorMessage,
  isReviewPlaying,
  reviewCurrentTime,
  reviewDuration,
  timecodeTextRef,
  progressBarRef,
  stageContainerRef,
  stageIframeRef,
  stageCursorCanvasRef,
  reviewVideoRef,
  onStopCaptureMoves,
  onStopRecording,
  onTogglePreviewRun,
  onForwardBoundaryPointer,
  onReviewTimeUpdate,
  onReviewDurationLoaded,
  onReviewPlayPause,
  onReviewRestart,
  onReviewSeek,
  onReviewPlayStateChange,
  onStageIframeLoad,
  onRecordWithDirectEngine,
  backdropClassName,
}: VideoStageViewportProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col min-w-0 p-4 md:p-6 gap-3 justify-between overflow-hidden transition-colors duration-250 ease-smooth-out",
        backdropClassName || "bg-muted/20 dark:bg-black/40"
      )}
    >
      {/* External Telemetry Bar (Always OUTSIDE the 16:9 captured crop region!) */}
      <div className="flex items-center justify-between gap-3 text-xs font-sans shrink-0">
        <div className="flex items-center gap-2 min-w-0 text-muted-foreground">
          {phase === "recording" ||
          phase === "capturing-moves" ||
          phase === "rendering-replay" ? (
            <>
              <span className="inline-block size-2 rounded-full bg-destructive animate-pulse shrink-0" />
              <span className="font-medium text-foreground">
                {phase === "capturing-moves"
                  ? "Zero-Lag Live Input"
                  : phase === "rendering-replay"
                  ? "Rendering 60fps Replay"
                  : "Recording 16:9 Stage"}
              </span>
              <span aria-hidden="true">·</span>
              <span
                ref={timecodeTextRef}
                className="font-mono text-[11px] tabular-nums text-foreground"
              >
                00:00.00
              </span>
              <span aria-hidden="true" className="hidden sm:inline">
                ·
              </span>
              <span className="hidden sm:inline text-[11px]">
                {phase === "capturing-moves"
                  ? "Zero encoding overhead"
                  : activeEngine === "native-zero-copy"
                  ? "Zero-Copy GPU 60fps"
                  : activeEngine === "native-region"
                  ? "Hardware Region Capture"
                  : "Turbo Direct Compositor"}
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
            <>
              <span className="inline-block size-2 rounded-full bg-primary animate-pulse shrink-0" />
              <span className="font-medium text-foreground">
                Previewing Auto-Pilot choreography
              </span>
              <span aria-hidden="true">·</span>
              <span
                ref={timecodeTextRef}
                className="font-mono text-[11px] tabular-nums text-foreground"
              >
                00:00.00
              </span>
            </>
          ) : phase === "processing" ? (
            <div className="flex items-center gap-2 text-foreground">
              <Loader2 className="size-3.5 animate-spin text-primary" />
              <span>Finalizing 60fps stream...</span>
            </div>
          ) : phase === "review" && recordingResult ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-foreground">Capture Ready</span>
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
                {discoveredTargets.scrollableDistance > 96
                  ? ` · ${discoveredTargets.scrollableDistance}px scrollable`
                  : ""}
              </span>
            </div>
          )}
        </div>

        {/* Live progress / quick action outside the crop frame */}
        <div className="flex items-center gap-2 shrink-0">
          {phase === "capturing-moves" && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onStopCaptureMoves}
              className="h-7 rounded-none px-3 text-xs font-sans gap-1.5"
            >
              <Square className="size-3 fill-current" />
              <span>Finish & Render</span>
            </Button>
          )}
          {(phase === "recording" || phase === "rendering-replay") && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onStopRecording}
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
              onClick={onTogglePreviewRun}
              className="h-7 rounded-none px-2.5 text-xs font-sans gap-1.5"
            >
              <Square className="size-3" />
              <span>Stop Preview</span>
            </Button>
          )}
        </div>
      </div>

      {/* Recording / Choreography Preview Progress Bar (Strictly Outside Captured Region, Imperatively Updated) */}
      {(isActiveCapturePhase || phase === "previewing") && (
        <div className="h-1 w-full bg-muted overflow-hidden shrink-0">
          <div
            ref={progressBarRef}
            className={cn(
              "h-full transition-[width] duration-100 ease-linear",
              phase === "previewing" ? "bg-primary" : "bg-destructive",
              (phase === "capturing-moves" ||
                (phase === "recording" && recordingConfig.mode === "manual")) &&
                "animate-pulse"
            )}
            style={{ width: "0%" }}
          />
        </div>
      )}

      {/* Centered 16:9 Stage Wrapper */}
      <div className="flex-1 flex items-center justify-center min-h-[260px] w-full overflow-hidden">
        <div className="w-full max-w-[920px] flex flex-col gap-2">
          {/* LIVE EDGE-TO-EDGE 16:9 RECORDING STAGE (Always mounted so New Take is 0ms instant) */}
          <div
            ref={stageContainerRef}
            data-testid="video-studio-16x9-stage"
            onPointerMoveCapture={(e) => onForwardBoundaryPointer(e, "move")}
            onPointerDownCapture={(e) => onForwardBoundaryPointer(e, "down")}
            onPointerUpCapture={(e) => onForwardBoundaryPointer(e, "up")}
            className={cn(
              "relative w-full aspect-video border border-border overflow-hidden",
              previewTheme === "dark" ? "bg-zinc-950" : "bg-white",
              phase !== "review" &&
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
              onLoad={onStageIframeLoad}
              title="16:9 Video Studio Live Stage"
              sandbox="allow-scripts allow-modals"
              style={{
                width: "1280px",
                height: "720px",
                transform: `scale(${stageScale})`,
                transformOrigin: "0 0",
              }}
              className={cn(
                "absolute top-0 left-0 border-none block",
                phase === "review" && previewVideoUrl && "invisible pointer-events-none"
              )}
            />

            {/* Top-Layer 60fps Virtual Cursor & Minimal Click Pulse Canvas (Guaranteed visible in Native & Manual Live capture) */}
            <canvas
              ref={stageCursorCanvasRef}
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-0 z-30 w-full h-full block",
                phase === "review" && previewVideoUrl && "invisible"
              )}
            />

            {/* Post-Capture Review Player Overlay */}
            {phase === "review" && previewVideoUrl && (
              <div className="
                absolute inset-0 z-40 bg-black overflow-hidden
              ">
                <video
                  ref={reviewVideoRef}
                  src={previewVideoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  onPlay={() => onReviewPlayStateChange?.(true)}
                  onPause={() => onReviewPlayStateChange?.(false)}
                  onTimeUpdate={(e) => {
                    const current = e.currentTarget.currentTime;
                    onReviewTimeUpdate(current);
                    // Chromium WebM loop safeguard: MediaRecorder WebM blobs lack duration/cue points
                    // so native 'loop' often freezes at the final frame instead of restarting.
                    if (reviewDuration > 0 && current >= reviewDuration - 0.08) {
                      e.currentTarget.currentTime = 0;
                      void e.currentTarget.play();
                    }
                  }}
                  onEnded={(e) => {
                    e.currentTarget.currentTime = 0;
                    void e.currentTarget.play();
                  }}
                  onLoadedMetadata={(e) => {
                    const mediaDuration = e.currentTarget.duration;
                    const minExpected = recordingResult?.durationMs
                      ? (recordingResult.durationMs / 1000) * 0.75
                      : 0.4;
                    if (
                      Number.isFinite(mediaDuration) &&
                      mediaDuration > minExpected
                    ) {
                      onReviewDurationLoaded(mediaDuration);
                    }
                  }}
                  className="w-full h-full object-contain bg-black"
                />
              </div>
            )}
          </div>

          {/* Inline Review Scrubber Bar */}
          {phase === "review" && previewVideoUrl && (
            <div className="flex items-center gap-3 border border-border bg-card px-3 py-2">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={onReviewPlayPause}
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
                onClick={onReviewRestart}
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
                  onValueChange={([val]) => onReviewSeek(val)}
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
                onClick={onRecordWithDirectEngine}
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
  );
}
