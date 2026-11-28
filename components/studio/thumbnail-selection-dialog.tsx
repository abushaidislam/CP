"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Crop, Download, Maximize2, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  computeDefaultCropRect,
  computeDraggedCropRect,
  computeOutputDimensions,
  isPointInsideCropRect,
  mapDisplayCropToNatural,
  MIN_CROP_SIZE,
  moveCropRect,
  type CropAspectPreset,
  type CropPoint,
  type CropRect,
} from "@/lib/sandbox/thumbnail-crop";
import { cn } from "@/lib/utils";

type DragState =
  | { mode: "draw"; anchor: CropPoint }
  | { mode: "move"; startPoint: CropPoint; initialRect: CropRect };

interface ThumbnailSelectionDialogProps {
  image: string | null;
  fileNameBase?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (image: string) => void;
}

const ASPECT_OPTIONS: Array<{ value: CropAspectPreset; label: string }> = [
  { value: "4:3", label: "4:3 Card" },
  { value: "16:9", label: "16:9 Wide" },
  { value: "1:1", label: "1:1 Square" },
  { value: "free", label: "Free" },
];

export function ThumbnailSelectionDialog({
  image,
  fileNameBase = "component",
  open,
  onOpenChange,
  onConfirm,
}: ThumbnailSelectionDialogProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [aspectPreset, setAspectPreset] = useState<CropAspectPreset>("4:3");
  const [selection, setSelection] = useState<CropRect | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredInside, setHoveredInside] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<"copied" | "downloaded" | null>(null);
  const [imageMetrics, setImageMetrics] = useState<{
    displayWidth: number;
    displayHeight: number;
    naturalWidth: number;
    naturalHeight: number;
  } | null>(null);

  const syncImageMetrics = useCallback(
    (presetOverride?: CropAspectPreset) => {
      const img = imageRef.current;
      if (!img || img.clientWidth <= 0 || img.clientHeight <= 0) return;

      const nextMetrics = {
        displayWidth: img.clientWidth,
        displayHeight: img.clientHeight,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      };
      setImageMetrics(nextMetrics);

      const activePreset = presetOverride ?? aspectPreset;
      setSelection(
        computeDefaultCropRect(
          nextMetrics.displayWidth,
          nextMetrics.displayHeight,
          activePreset
        )
      );
    },
    [aspectPreset]
  );

  // Reset transient interaction state whenever dialog closes or source image changes
  useEffect(() => {
    dragRef.current = null;
    setIsDragging(false);
    setHoveredInside(false);
    setExportFeedback(null);
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
    if (!open) {
      setSelection(null);
      setImageMetrics(null);
      setAspectPreset("4:3");
    }
  }, [open, image]);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  // Keep display metrics accurate if dialog/window resizes while open
  useEffect(() => {
    if (!open || !imageRef.current || typeof ResizeObserver === "undefined") {
      return;
    }
    const el = imageRef.current;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth > 0 && el.clientHeight > 0 && !dragRef.current) {
        setImageMetrics((prev) => {
          if (
            prev &&
            prev.displayWidth === el.clientWidth &&
            prev.displayHeight === el.clientHeight
          ) {
            return prev;
          }
          const next = {
            displayWidth: el.clientWidth,
            displayHeight: el.clientHeight,
            naturalWidth: el.naturalWidth,
            naturalHeight: el.naturalHeight,
          };
          setSelection((cur) => {
            if (!cur || !prev || prev.displayWidth <= 0 || prev.displayHeight <= 0) {
              return computeDefaultCropRect(
                next.displayWidth,
                next.displayHeight,
                aspectPreset
              );
            }
            const sx = next.displayWidth / prev.displayWidth;
            const sy = next.displayHeight / prev.displayHeight;
            return {
              left: cur.left * sx,
              top: cur.top * sy,
              width: cur.width * sx,
              height: cur.height * sy,
            };
          });
          return next;
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, image, aspectPreset]);

  const pointFromEvent = (event: React.PointerEvent<HTMLDivElement>): CropPoint => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, event.clientY - rect.top)),
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const img = imageRef.current;
    if (!img || img.clientWidth <= 0 || img.clientHeight <= 0) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointFromEvent(event);

    if (
      selection &&
      selection.width >= MIN_CROP_SIZE &&
      selection.height >= MIN_CROP_SIZE &&
      isPointInsideCropRect(point, selection)
    ) {
      dragRef.current = {
        mode: "move",
        startPoint: point,
        initialRect: selection,
      };
    } else {
      dragRef.current = {
        mode: "draw",
        anchor: point,
      };
      setSelection({ left: point.x, top: point.y, width: 0, height: 0 });
    }
    setIsDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const point = pointFromEvent(event);
    const activeDrag = dragRef.current;

    if (!activeDrag) {
      setHoveredInside(Boolean(selection && isPointInsideCropRect(point, selection)));
      return;
    }

    const img = imageRef.current;
    const boundsW = img?.clientWidth || event.currentTarget.clientWidth;
    const boundsH = img?.clientHeight || event.currentTarget.clientHeight;
    if (boundsW <= 0 || boundsH <= 0) return;

    if (activeDrag.mode === "move") {
      const next = moveCropRect(
        activeDrag.initialRect,
        point.x - activeDrag.startPoint.x,
        point.y - activeDrag.startPoint.y,
        boundsW,
        boundsH
      );
      setSelection(next);
    } else {
      const next = computeDraggedCropRect(
        activeDrag.anchor,
        point,
        boundsW,
        boundsH,
        aspectPreset
      );
      setSelection(next);
    }
  };

  const finishDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const activeDrag = dragRef.current;
    if (!activeDrag) return;

    dragRef.current = null;
    setIsDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore if capture was already released
      }
    }

    // Restore default crop if the user made a tiny accidental click
    if (activeDrag.mode === "draw") {
      setSelection((cur) => {
        if (cur && cur.width >= MIN_CROP_SIZE && cur.height >= MIN_CROP_SIZE) {
          return cur;
        }
        const img = imageRef.current;
        if (!img || img.clientWidth <= 0 || img.clientHeight <= 0) return null;
        return computeDefaultCropRect(img.clientWidth, img.clientHeight, aspectPreset);
      });
    }
  };

  const handleAspectChange = (nextPreset: string) => {
    const preset = nextPreset as CropAspectPreset;
    setAspectPreset(preset);
    syncImageMetrics(preset);
  };

  const handleResetFullFrame = () => {
    setAspectPreset("free");
    syncImageMetrics("free");
  };

  const handleRecenter = () => {
    syncImageMetrics(aspectPreset);
  };

  const exportInfo = useMemo(() => {
    if (
      !selection ||
      !imageMetrics ||
      selection.width < MIN_CROP_SIZE ||
      selection.height < MIN_CROP_SIZE
    ) {
      return null;
    }

    const sourceCrop = mapDisplayCropToNatural(
      selection,
      imageMetrics.displayWidth,
      imageMetrics.displayHeight,
      imageMetrics.naturalWidth,
      imageMetrics.naturalHeight
    );
    if (!sourceCrop) return null;

    const output = computeOutputDimensions(sourceCrop.width, sourceCrop.height);
    return { sourceCrop, output };
  }, [selection, imageMetrics]);

  // Keep miniature Hub Card preview canvas synchronized with active selection
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !exportInfo || !open) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const targetW = 192;
    const targetH = 144;
    canvas.width = targetW;
    canvas.height = targetH;

    ctx.clearRect(0, 0, targetW, targetH);

    // Letterbox inside 4:3 preview stage just like Hub ComponentCard (object-contain)
    const { width: sw, height: sh, left: sx, top: sy } = exportInfo.sourceCrop;
    const fitScale = Math.min(targetW / sw, targetH / sh);
    const drawW = sw * fitScale;
    const drawH = sh * fitScale;
    const drawX = (targetW - drawW) / 2;
    const drawY = (targetH - drawH) / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, sw, sh, drawX, drawY, drawW, drawH);
  }, [exportInfo, open, image]);

  const renderCroppedPngDataUrl = (): string | null => {
    const img = imageRef.current;
    if (!img || !selection) return null;
    if (selection.width < MIN_CROP_SIZE || selection.height < MIN_CROP_SIZE) return null;

    const sourceCrop = mapDisplayCropToNatural(
      selection,
      img.clientWidth,
      img.clientHeight,
      img.naturalWidth,
      img.naturalHeight
    );
    if (!sourceCrop) return null;

    const output = computeOutputDimensions(sourceCrop.width, sourceCrop.height);
    const canvas = document.createElement("canvas");
    canvas.width = output.width;
    canvas.height = output.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      img,
      sourceCrop.left,
      sourceCrop.top,
      sourceCrop.width,
      sourceCrop.height,
      0,
      0,
      canvas.width,
      canvas.height
    );
    return canvas.toDataURL("image/png");
  };

  const triggerFeedback = (kind: "copied" | "downloaded") => {
    setExportFeedback(kind);
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = setTimeout(() => {
      setExportFeedback(null);
    }, 2000);
  };

  const handleDownloadPng = () => {
    const dataUrl = renderCroppedPngDataUrl();
    if (!dataUrl) return;
    try {
      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = `${fileNameBase || "component"}-preview.png`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      triggerFeedback("downloaded");
    } catch {
      // Ignore download errors in restricted environments
    }
  };

  const handleCopyPng = async () => {
    const dataUrl = renderCroppedPngDataUrl();
    if (!dataUrl || typeof window === "undefined" || !navigator.clipboard) return;
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      if (window.ClipboardItem && navigator.clipboard.write) {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      } else {
        await navigator.clipboard.writeText(dataUrl);
      }
      triggerFeedback("copied");
    } catch {
      try {
        await navigator.clipboard.writeText(dataUrl);
        triggerFeedback("copied");
      } catch {
        // Ignore clipboard errors in restricted contexts
      }
    }
  };

  const confirm = () => {
    const dataUrl = renderCroppedPngDataUrl();
    if (!dataUrl) return;
    onConfirm(dataUrl);
    onOpenChange(false);
  };

  const hasValidSelection = Boolean(exportInfo);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl gap-4 p-5 font-sans">
        <DialogHeader className="gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="flex items-center gap-2">
              <Crop className="size-4 text-primary" />
              Frame &amp; Export Snapshot
            </DialogTitle>
            {exportInfo && (
              <Badge
                variant="outline"
                className="rounded-none px-1.5 py-0 h-5 text-[11px] font-sans font-normal tabular-nums text-muted-foreground"
              >
                {exportInfo.output.width} × {exportInfo.output.height} px
              </Badge>
            )}
          </div>
          <DialogDescription>
            Drag anywhere to crop, or drag inside the frame to reposition. Save to Hub card, copy to clipboard, or download PNG.
          </DialogDescription>
        </DialogHeader>

        {/* Aspect Ratio & Quick Framing Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 border border-border/80 bg-muted/25 px-2.5 py-2">
          <Tabs value={aspectPreset} onValueChange={handleAspectChange}>
            <TabsList className="h-7 rounded-none bg-background/80 border border-border/70 p-0.5 gap-0.5">
              {ASPECT_OPTIONS.map((opt) => (
                <TabsTrigger
                  key={opt.value}
                  value={opt.value}
                  className="h-6 rounded-none px-2.5 text-[11px] font-sans"
                >
                  {opt.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRecenter}
              className="h-7 rounded-none px-2.5 text-xs font-sans gap-1.5"
            >
              <RotateCcw className="size-3" />
              Reset Frame
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetFullFrame}
              className="h-7 rounded-none px-2.5 text-xs font-sans gap-1.5"
            >
              <Maximize2 className="size-3" />
              Full Preview
            </Button>
          </div>
        </div>

        {/* Main Workspace: Interactive Crop Stage + Live Hub Card Preview */}
        {image && (
          <div className="flex flex-col md:flex-row gap-3 items-stretch">
            <div className="flex-1 min-w-0 max-h-[58vh] overflow-auto border border-border bg-zinc-950 p-3 flex items-center justify-center">
              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={finishDrag}
                onPointerCancel={finishDrag}
                onPointerLeave={() => {
                  if (!dragRef.current) setHoveredInside(false);
                }}
                className={cn(
                  "relative mx-auto w-fit max-w-full overflow-hidden touch-none select-none",
                  hoveredInside || (isDragging && dragRef.current?.mode === "move")
                    ? "cursor-move"
                    : "cursor-crosshair"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imageRef}
                  src={image}
                  alt="Captured component preview to crop"
                  draggable={false}
                  onLoad={() => syncImageMetrics()}
                  className="block h-auto max-h-[52vh] max-w-full object-contain"
                />

                {selection && selection.width > 0 && selection.height > 0 && (
                  <div
                    className="pointer-events-none absolute border border-white/95 shadow-[0_0_0_9999px_rgba(9,9,11,0.62)] transition-none"
                    style={{
                      left: selection.left,
                      top: selection.top,
                      width: selection.width,
                      height: selection.height,
                    }}
                  >
                    {/* Rule-of-thirds guides while dragging */}
                    {isDragging && (
                      <>
                        <div className="absolute inset-y-0 left-1/3 w-px bg-white/25" />
                        <div className="absolute inset-y-0 left-2/3 w-px bg-white/25" />
                        <div className="absolute inset-x-0 top-1/3 h-px bg-white/25" />
                        <div className="absolute inset-x-0 top-2/3 h-px bg-white/25" />
                      </>
                    )}

                    {/* Architectural corner brackets */}
                    <span className="absolute -top-px -left-px size-2.5 border-t-2 border-l-2 border-primary" />
                    <span className="absolute -top-px -right-px size-2.5 border-t-2 border-r-2 border-primary" />
                    <span className="absolute -bottom-px -left-px size-2.5 border-b-2 border-l-2 border-primary" />
                    <span className="absolute -bottom-px -right-px size-2.5 border-b-2 border-r-2 border-primary" />
                  </div>
                )}
              </div>
            </div>

            {/* Live Hub Card Result Preview */}
            <div className="w-full md:w-52 shrink-0 flex flex-col justify-between gap-3 border border-border/80 bg-muted/20 p-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    HUB CARD PREVIEW
                  </span>
                  <Badge
                    variant="secondary"
                    className="rounded-none px-1.5 py-0 h-4 text-[10px] font-sans"
                  >
                    {aspectPreset === "free" ? "Free" : aspectPreset}
                  </Badge>
                </div>

                <div className="aspect-[4/3] w-full overflow-hidden border border-border/70 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
                  <canvas
                    ref={previewCanvasRef}
                    className="h-full w-full block"
                    aria-label="Live cropped thumbnail preview"
                  />
                </div>

                <p className="text-[11px] leading-relaxed text-muted-foreground font-sans">
                  Aspect ratio is preserved without stretching when saved to{" "}
                  <span className="font-mono text-[10px] text-foreground/85">
                    preview.png
                  </span>
                  .
                </p>
              </div>

              <div className="border-t border-border/60 pt-2 text-[11px] text-muted-foreground font-sans space-y-1">
                <div className="flex items-center justify-between">
                  <span>Export Format</span>
                  <span className="font-mono text-[10px] text-foreground">PNG</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Resolution</span>
                  <span className="tabular-nums text-foreground font-medium">
                    {exportInfo
                      ? `${exportInfo.output.width}×${exportInfo.output.height}`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-2">
          {/* Direct Copy & Download actions for the framed selection */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyPng}
              disabled={!hasValidSelection}
              className="rounded-none font-sans gap-1.5"
            >
              {exportFeedback === "copied" ? (
                <Check className="size-3.5 text-emerald-500" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {exportFeedback === "copied" ? "Copied PNG" : "Copy PNG"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadPng}
              disabled={!hasValidSelection}
              className="rounded-none font-sans gap-1.5"
            >
              {exportFeedback === "downloaded" ? (
                <Check className="size-3.5 text-emerald-500" />
              ) : (
                <Download className="size-3.5" />
              )}
              {exportFeedback === "downloaded" ? "Downloaded" : "Download PNG"}
            </Button>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-none font-sans"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirm}
              disabled={!hasValidSelection}
              className="rounded-none font-sans gap-1.5"
            >
              <Check className="size-3.5" />
              Save Thumbnail
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
