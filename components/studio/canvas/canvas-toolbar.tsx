"use client";

import React from "react";
import type {
  CanvasBackground,
  PreviewTheme,
  StudioViewport,
} from "@/lib/store/studio-store";
import type { PreviewFitMode } from "@/lib/sandbox/sandbox-compiler";
import type { ParsedDemoControls } from "@/lib/sandbox/demo-controls";
import type { SandboxHydrationMode } from "../canvas-preview";
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
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
  Video,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CanvasToolbarProps {
  viewport: StudioViewport;
  isFluidResponsive: boolean;
  draggedWidth: number | null;
  computedWidth: string;
  onSelectViewport: (vp: StudioViewport) => void;
  toastMessage: string | null;
  isSimulatingHover: boolean;
  isSandboxLoading: boolean;
  error: string | null;
  hydrationMode: SandboxHydrationMode;
  isControlsOpen: boolean;
  onToggleControls: () => void;
  parsedDemoControls: ParsedDemoControls;
  modifiedControlKeysCount: number;
  onTriggerTestSimulation: () => void;
  previewTheme: PreviewTheme;
  onThemeChange: (nextTheme: PreviewTheme) => void;
  canvasBg: CanvasBackground;
  onCanvasBgChange: (bg: CanvasBackground) => void;
  isReloading: boolean;
  onReload: () => void;
  isCapturingSnapshot: boolean;
  captureSuccess: boolean;
  currentPreviewImage?: string;
  onCaptureSnapshot: (
    action?: "thumbnail" | "both" | "download" | "copy"
  ) => void;
  isRecordingOpen?: boolean;
  onOpenRecordingModal: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  fitMode: PreviewFitMode;
  onFitModeChange: (fit: PreviewFitMode) => void;
}

export function CanvasToolbar({
  viewport,
  isFluidResponsive,
  draggedWidth,
  computedWidth,
  onSelectViewport,
  toastMessage,
  isSimulatingHover,
  isSandboxLoading,
  error,
  hydrationMode,
  isControlsOpen,
  onToggleControls,
  parsedDemoControls,
  modifiedControlKeysCount,
  onTriggerTestSimulation,
  previewTheme,
  onThemeChange,
  canvasBg,
  onCanvasBgChange,
  isReloading,
  onReload,
  isCapturingSnapshot,
  captureSuccess,
  currentPreviewImage,
  onCaptureSnapshot,
  isRecordingOpen = false,
  onOpenRecordingModal,
  isFullscreen,
  onToggleFullscreen,
  zoom,
  onZoomChange,
  fitMode,
  onFitModeChange,
}: CanvasToolbarProps) {
  return (
    <div className="studio-toolbar-surface flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border px-2.5 @[420px]:px-3 select-none transition-colors overflow-hidden">
      {/* Left: Icon-Only Viewport Switcher & Dimension Badge */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink-0">
        <Tabs
          value={isFluidResponsive ? "responsive" : viewport}
          onValueChange={(val) => onSelectViewport(val as StudioViewport)}
        >
          <TabsList className="h-7 bg-muted/60 dark:bg-muted/40 p-px rounded-none border border-border/80 gap-0.5">
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
          className="hidden @[580px]:inline-flex h-5 rounded-none px-1.5 text-[11px] font-sans font-normal text-muted-foreground border-border/60 bg-muted/30 tabular-nums whitespace-nowrap shrink-0"
        >
          {draggedWidth !== null
            ? `${draggedWidth}px`
            : isFluidResponsive
            ? "100% Fluid"
            : computedWidth}
        </Badge>
      </div>

      {/* Center: Subtle Status & Toast */}
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 min-w-0 overflow-hidden"
      >
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
            <span className="truncate hidden @[360px]:inline">
              Syncing live changes...
            </span>
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
              onClick={onToggleControls}
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
                      modifiedControlKeysCount > 0
                        ? "bg-primary text-primary-foreground"
                        : "bg-foreground/85 text-background"
                    )}
                  >
                    {modifiedControlKeysCount > 0
                      ? modifiedControlKeysCount
                      : parsedDemoControls.controls.length}
                  </Badge>
                )}
              <span className="sr-only">21st.dev Controls</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="font-sans text-xs">
            {parsedDemoControls.status === "active"
              ? `21st.dev Native Controls (${parsedDemoControls.controls.length} active${
                  modifiedControlKeysCount > 0
                    ? `, ${modifiedControlKeysCount} edited`
                    : ""
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
              onClick={onTriggerTestSimulation}
              disabled={isSimulatingHover}
              aria-label="Simulate pointer hover"
              className="studio-icon-btn hidden @[640px]:inline-flex size-7 rounded-none border-border/80 bg-background/70 text-muted-foreground hover:text-foreground"
            >
              <MousePointerClick className="size-3.5" />
              <span className="sr-only">Simulate</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="font-sans text-xs">
            Simulate pointer hover &amp; interactions inside sandbox
          </TooltipContent>
        </Tooltip>

        {/* Component Preview Dark / Light Theme Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() =>
                onThemeChange(previewTheme === "dark" ? "light" : "dark")
              }
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
            Preview theme:{" "}
            {previewTheme === "dark"
              ? "Dark (click for Light)"
              : "Light (click for Dark)"}
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
                  className="studio-icon-btn hidden @[500px]:inline-flex size-7 rounded-none border-border/80 bg-background/70 text-muted-foreground hover:text-foreground"
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
          <DropdownMenuContent
            align="end"
            className="w-40 rounded-none font-sans"
          >
            <DropdownMenuLabel className="text-[10px] uppercase font-sans text-muted-foreground">
              Backdrop
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {[
              { id: "mesh" as const, label: "Subtle Ambient" },
              { id: "grid" as const, label: "Dot Grid" },
              { id: "light" as const, label: "Solid Light" },
              { id: "dark" as const, label: "Neutral Dark" },
              { id: "black" as const, label: "Pure Black" },
            ].map((item) => (
              <DropdownMenuItem
                key={item.id}
                onClick={() => onCanvasBgChange(item.id)}
                className="flex items-center justify-between rounded-none text-xs cursor-pointer font-sans"
              >
                <span>{item.label}</span>
                {canvasBg === item.id && (
                  <Check className="size-3.5 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator
          orientation="vertical"
          className="hidden @[500px]:block h-4 mx-0.5 bg-border/60"
        />

        {/* Refresh Canvas */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={onReload}
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

        {/* Direct Capture & Framing Modal Trigger */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => onCaptureSnapshot("thumbnail")}
              disabled={isCapturingSnapshot}
              aria-label="Capture preview snapshot"
              className={cn(
                "studio-icon-btn relative hidden @[360px]:inline-flex size-7 rounded-none border-border/80 bg-background/70 transition-colors",
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
              {currentPreviewImage &&
                !captureSuccess &&
                !isCapturingSnapshot && (
                  <span
                    className="absolute top-1 right-1 size-1.5 rounded-none bg-emerald-500"
                    aria-hidden="true"
                  />
                )}
              <span className="sr-only">Capture preview snapshot</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="font-sans text-xs">
            {captureSuccess
              ? toastMessage || "Thumbnail updated!"
              : isCapturingSnapshot
              ? "Capturing preview snapshot..."
              : "Capture & frame thumbnail / export PNG"}
          </TooltipContent>
        </Tooltip>

        {/* 16:9 60fps Video Capture Side Panel Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isRecordingOpen ? "secondary" : "outline"}
              size="icon-sm"
              onClick={onOpenRecordingModal}
              aria-label="Toggle 16:9 Video Capture Side Panel"
              aria-pressed={isRecordingOpen}
              className={cn(
                "studio-icon-btn relative hidden @[420px]:inline-flex size-7 rounded-none border-border/80 transition-colors",
                isRecordingOpen
                  ? "bg-muted text-foreground border-foreground/30"
                  : "bg-background/70 text-muted-foreground hover:text-foreground"
              )}
            >
              <Video className="size-3.5" />
              {isRecordingOpen && (
                <span
                  className="pointer-events-none absolute top-1 right-1 size-1.5 rounded-none bg-red-500"
                  aria-hidden="true"
                />
              )}
              <span className="sr-only">Video Capture Side Panel</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="font-sans text-xs">
            {isRecordingOpen
              ? "Close Video Capture side panel (Ctrl+Shift+E)"
              : "Video Capture side panel (Ctrl+Shift+E)"}
          </TooltipContent>
        </Tooltip>

        {/* Fullscreen Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={onToggleFullscreen}
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
          <DropdownMenuContent
            align="end"
            className="w-56 rounded-none font-sans"
          >
            <DropdownMenuLabel className="text-[10px] uppercase font-sans text-muted-foreground flex items-center justify-between">
              <span>Canvas Options</span>
              <span className="text-[10px] text-muted-foreground/80 font-normal">
                {zoom}% zoom
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onTriggerTestSimulation}
              disabled={isSimulatingHover}
              className="flex items-center gap-2 rounded-none text-xs cursor-pointer font-sans"
            >
              <MousePointerClick className="size-3.5" />
              <span>Simulate Interaction</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] uppercase font-sans text-muted-foreground">
              Snapshot &amp; Export
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => onCaptureSnapshot("thumbnail")}
              disabled={isCapturingSnapshot}
              className="flex items-center gap-2 rounded-none text-xs cursor-pointer font-sans"
            >
              <Camera className="size-3.5" />
              <span>Capture &amp; Frame Snapshot...</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onOpenRecordingModal}
              className="flex items-center gap-2 rounded-none text-xs cursor-pointer font-sans"
            >
              <Video className="size-3.5 text-primary" />
              <span>
                {isRecordingOpen
                  ? "Close Video Capture Panel"
                  : "Video Capture Side Panel"}
              </span>
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
                onClick={() => onCanvasBgChange(item.id)}
                className="flex items-center justify-between rounded-none text-xs cursor-pointer"
              >
                <span>{item.label}</span>
                {canvasBg === item.id && (
                  <Check className="size-3.5 text-primary" />
                )}
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
                onClick={() => onFitModeChange(item.id)}
                className="flex items-center justify-between rounded-none text-xs cursor-pointer"
              >
                <span>{item.label}</span>
                {fitMode === item.id && (
                  <Check className="size-3.5 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] uppercase font-sans text-muted-foreground">
              Zoom Level
            </DropdownMenuLabel>
            {[50, 75, 100, 125, 150].map((level) => (
              <DropdownMenuItem
                key={level}
                onClick={() => onZoomChange(level)}
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
  );
}
