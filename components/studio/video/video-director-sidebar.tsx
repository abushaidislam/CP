"use client";

import React from "react";
import type { RecordingConfig } from "@/lib/store/studio-store";
import type { StageRecordingResult } from "@/lib/video/stage-recorder";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowDownUp,
  Check,
  Download,
  Hand,
  Loader2,
  MousePointer2,
  Play,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Square,
  Video,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DiscoveredTargetsInfo, StudioPhase } from "./video-studio-types";

export interface VideoDirectorSidebarProps {
  phase: StudioPhase;
  isBusy: boolean;
  stageReady: boolean;
  compileError: string | null;
  recordingConfig: RecordingConfig;
  recordingResult: StageRecordingResult | null;
  discoveredTargets: DiscoveredTargetsInfo;
  zeroLagReplay: boolean;
  serverFfmpegReady: boolean;
  supportsNativeMp4: boolean;
  isTranscodingMp4: boolean;
  countdownValue: number;
  exportToast?: string | null;
  stopBtnTimecodeRef: React.RefObject<HTMLSpanElement | null>;
  onUpdateConfig: (partial: Partial<RecordingConfig>) => void;
  onSetZeroLagReplay: (enabled: boolean) => void;
  onRescanDom: () => void;
  onResetStagePosition: () => void;
  onReloadStage: () => void;
  onTogglePreviewRun: () => void;
  onDownloadMp4: () => void;
  onDownloadWebm: () => void;
  onNewTake: () => void;
  onStopCaptureMoves: () => void;
  onStopRecording: () => void;
  onBeginRecording: () => void;
  onClose?: () => void;
  className?: string;
}

export function VideoDirectorSidebar({
  phase,
  isBusy,
  stageReady,
  compileError,
  recordingConfig,
  recordingResult,
  discoveredTargets,
  zeroLagReplay,
  serverFfmpegReady,
  supportsNativeMp4,
  isTranscodingMp4,
  countdownValue,
  exportToast,
  stopBtnTimecodeRef,
  onUpdateConfig,
  onSetZeroLagReplay,
  onRescanDom,
  onResetStagePosition,
  onReloadStage,
  onTogglePreviewRun,
  onDownloadMp4,
  onDownloadWebm,
  onNewTake,
  onStopCaptureMoves,
  onStopRecording,
  onBeginRecording,
  onClose,
  className,
}: VideoDirectorSidebarProps) {
  return (
    <aside
      aria-label="Video Capture Controls"
      className={cn(
        "flex h-full w-72 sm:w-80 shrink-0 flex-col border-l border-border bg-card text-card-foreground font-sans select-none overflow-hidden",
        className
      )}
    >
      {/* Header Strip — Matches DemoControlsPanel */}
      <div className="studio-toolbar-surface flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
        <div className="flex items-center gap-2 min-w-0">
          <Video className="size-3.5 text-muted-foreground shrink-0" />
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-semibold tracking-tight text-foreground truncate">
              Video Capture
            </span>
            <span className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
              · {recordingConfig.resolution}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={isBusy}
                onClick={onReloadStage}
                aria-label="Reload 16:9 stage"
                className="size-7 rounded-none text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-sans text-xs">
              Reset &amp; reload 16:9 stage
            </TooltipContent>
          </Tooltip>

          {onClose && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onClose}
                  aria-label="Close video capture panel"
                  className="size-7 rounded-none text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-sans text-xs">
                Close video capture (Ctrl+Shift+E)
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Inline Export Toast */}
      {exportToast && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-1.5 border-b border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-sans text-emerald-600 dark:text-emerald-400 shrink-0"
        >
          <Check className="size-3.5 shrink-0" />
          <span className="truncate">{exportToast}</span>
        </div>
      )}

      {/* Scrollable Inspector Body — Matches DemoControlsPanel divide-y cadence */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden divide-y divide-border/70">
        {/* Mode Selector */}
        <section className="px-3 py-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              INTERACTION MODE
            </span>
            <Badge
              variant="outline"
              className="rounded-none text-[10px] font-sans font-normal px-1.5 py-0 h-5"
            >
              {recordingConfig.mode === "autopilot"
                ? "Automated"
                : "Live Input"}
            </Badge>
          </div>

          <Tabs
            value={recordingConfig.mode}
            onValueChange={(val) =>
              onUpdateConfig({
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

        {/* Auto-Pilot Choreography Settings OR Manual Live Guide */}
        {recordingConfig.mode === "autopilot" ? (
          <section className="px-3 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                CHOREOGRAPHY
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isBusy || !stageReady}
                onClick={onRescanDom}
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
                    onClick={() => onUpdateConfig({ duration: sec })}
                    className="h-7 rounded-none text-xs font-mono tabular-nums"
                  >
                    {sec}s
                  </Button>
                ))}
              </div>
            </div>

            {/* Choreography Toggles */}
            <div className="space-y-2.5 pt-0.5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-foreground">
                    Auto-Hover Sweep
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Glide cursor over interactive cards &amp; controls
                  </div>
                </div>
                <Switch
                  checked={recordingConfig.autoHover}
                  disabled={isBusy}
                  onCheckedChange={(checked) =>
                    onUpdateConfig({
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
                    Smart Click &amp; Dropdowns
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Opens dropdowns, clicks sub-items &amp; multi-click controls
                  </div>
                </div>
                <Switch
                  checked={recordingConfig.autoClick}
                  disabled={isBusy}
                  onCheckedChange={(checked) =>
                    onUpdateConfig({ autoClick: checked })
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
                    onUpdateConfig({ autoScroll: checked })
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
                      onUpdateConfig({ loopReturnToTop: checked })
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
              onClick={onTogglePreviewRun}
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
          <section className="px-3 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                MANUAL LIVE CAPTURE
              </span>
              <Badge
                variant="outline"
                className="rounded-none text-[10px] font-sans font-normal px-1.5 py-0 h-5"
              >
                {zeroLagReplay ? "Zero-Lag Replay" : "Live Encode"}
              </Badge>
            </div>

            {/* Zero-Lag Replay Toggle */}
            <div className="flex items-center justify-between gap-3 border border-border bg-muted/30 p-2.5">
              <div className="min-w-0">
                <div className="text-xs font-medium text-foreground">
                  Zero-Lag Replay Mode
                </div>
                <div className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                  Interact at full native speed with 0% capture lag;
                  auto-replays and encodes your take after Stop.
                </div>
              </div>
              <Switch
                checked={zeroLagReplay}
                disabled={isBusy}
                onCheckedChange={onSetZeroLagReplay}
                aria-label="Toggle zero-lag replay mode"
              />
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Hover the 16:9 stage to preview the spring virtual cursor and
              minimal click pulse before recording.
            </p>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBusy || !stageReady}
              onClick={onResetStagePosition}
              className="w-full h-8 rounded-none text-xs font-sans gap-1.5"
            >
              <RotateCcw className="size-3" />
              <span>Reset Stage Position</span>
            </Button>
          </section>
        )}

        {/* Cursor & Feedback Section */}
        <section className="px-3 py-3 space-y-2.5">
          <span className="block font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            CURSOR &amp; FEEDBACK
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
                onUpdateConfig({ showCursor: checked })
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
                onUpdateConfig({ clickRipples: checked })
              }
              aria-label="Toggle minimal click pulse"
            />
          </div>
        </section>

        {/* Output & Capture Settings */}
        <section className="px-3 py-3 space-y-3">
          <span className="block font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            EXPORT &amp; CAPTURE
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
                      recordingConfig.resolution === res ? "default" : "outline"
                    }
                    size="sm"
                    disabled={isBusy}
                    onClick={() => onUpdateConfig({ resolution: res })}
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
                    onClick={() => onUpdateConfig({ fps: fpsVal })}
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
                {serverFfmpegReady || supportsNativeMp4
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
                  onClick={() => onUpdateConfig({ format: fmt })}
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
                  ? "Turbo Direct"
                  : "Zero-Copy GPU"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  { id: "auto", label: "Auto" },
                  { id: "native", label: "Hardware" },
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
                  onClick={() => onUpdateConfig({ captureEngine: eng.id })}
                  className="h-7 rounded-none text-[11px] font-sans"
                >
                  {eng.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Optional 3-2-1 Countdown */}
          <div className="flex items-center justify-between gap-3 pt-0.5">
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
                onUpdateConfig({ countdown: checked })
              }
              aria-label="Toggle 3-2-1 recording countdown"
            />
          </div>
        </section>
      </div>

      {/* Pinned Bottom Primary Action Bar — Matches DemoControlsPanel footer */}
      <div className="studio-toolbar-surface border-t border-border p-3 space-y-2 shrink-0">
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
                  (serverFfmpegReady || supportsNativeMp4)
                ) {
                  onDownloadMp4();
                } else {
                  onDownloadWebm();
                }
              }}
              className="w-full h-8 rounded-none text-xs font-sans font-medium gap-2"
            >
              {isTranscodingMp4 ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Encoding H.264 MP4...</span>
                </>
              ) : (
                <>
                  <Download className="size-3.5" />
                  <span>
                    Download{" "}
                    {recordingConfig.format === "mp4" &&
                    (serverFfmpegReady || supportsNativeMp4)
                      ? "MP4"
                      : "WebM"}{" "}
                    ({recordingConfig.resolution} · {recordingConfig.fps}fps)
                  </span>
                </>
              )}
            </Button>

            <div className="grid grid-cols-2 gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isTranscodingMp4}
                onClick={
                  recordingConfig.format === "mp4"
                    ? onDownloadWebm
                    : onDownloadMp4
                }
                className="h-7 rounded-none text-xs font-sans gap-1.5"
              >
                <Download className="size-3" />
                <span>
                  {recordingConfig.format === "mp4" ? "Save WebM" : "Save MP4"}
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isTranscodingMp4}
                onClick={onNewTake}
                className="h-7 rounded-none text-xs font-sans gap-1.5"
              >
                <RotateCcw className="size-3" />
                <span>New Take</span>
              </Button>
            </div>
          </>
        ) : phase === "capturing-moves" ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onStopCaptureMoves}
            className="w-full h-8 rounded-none text-xs font-sans font-medium gap-2"
          >
            <Square className="size-3 fill-current" />
            <span>Finish &amp; Render</span>
            <span ref={stopBtnTimecodeRef} className="font-mono tabular-nums">
              (00:00.00)
            </span>
          </Button>
        ) : phase === "recording" || phase === "rendering-replay" ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onStopRecording}
            className="w-full h-8 rounded-none text-xs font-sans font-medium gap-2"
          >
            <Square className="size-3 fill-current" />
            <span>
              {phase === "rendering-replay"
                ? "Cancel Replay"
                : "Stop Recording"}
            </span>
            <span ref={stopBtnTimecodeRef} className="font-mono tabular-nums">
              (00:00.00)
            </span>
          </Button>
        ) : (
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={!stageReady || isBusy || Boolean(compileError)}
            onClick={onBeginRecording}
            className="w-full h-8 rounded-none text-xs font-sans font-medium gap-2"
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
                  {recordingConfig.mode === "manual" && zeroLagReplay
                    ? `Start Zero-Lag Capture (${recordingConfig.fps}fps)`
                    : `Record 16:9 Video (${recordingConfig.fps}fps)`}
                </span>
              </>
            )}
          </Button>
        )}
      </div>
    </aside>
  );
}
