"use client";

export type CaptureEngineUsed = "native-zero-copy" | "native-region" | "direct-fallback";

export interface CursorTelemetryState {
  nx: number;
  ny: number;
  visible: boolean;
  scale: number;
  tilt: number;
  hoveringInteractive?: boolean;
  isPressed?: boolean;
  ripples: Array<{ nx: number; ny: number; progress: number }>;
}

export interface StageRecordingResult {
  blob: Blob;
  mimeType: string;
  durationMs: number;
  width: number;
  height: number;
  fps: number;
  engine: CaptureEngineUsed;
  /** True when zero-copy hardware capture recorded native stage dimensions and MP4 export should Lanczos-scale to exact 1080p/720p. */
  needsServerRescale?: boolean;
}

export interface StageRecorderHandle {
  engine: CaptureEngineUsed;
  stop: () => Promise<StageRecordingResult>;
  cancel: () => void;
  updateCursorTelemetry: (telemetry: CursorTelemetryState) => void;
  pushFrameDataUrl: (requestId: number, dataUrl: string | null, captureMs?: number) => void;
  pushFrameBlob: (requestId: number, blob: Blob | null, captureMs?: number) => void;
  pushFrameBitmap: (requestId: number, bitmap: ImageBitmap | null, captureMs?: number) => void;
}

export interface StartRecorderOptions {
  stageElement: HTMLElement;
  iframeElement: HTMLIFrameElement | null;
  resolution: "1080p" | "720p";
  fps: 60 | 30;
  preferredFormat: "mp4" | "webm";
  preferredEngine: "auto" | "native" | "direct";
  previewTheme: "dark" | "light";
  showCursor?: boolean;
  initialCursorTelemetry?: CursorTelemetryState | null;
  onTrackEnded?: () => void;
}

export function getResolutionDimensions(resolution: "1080p" | "720p"): {
  width: number;
  height: number;
} {
  return resolution === "720p"
    ? { width: 1280, height: 720 }
    : { width: 1920, height: 1080 };
}

/**
 * Selects a low-latency, GPU/hardware-accelerated MediaRecorder MIME type.
 * Deliberately prefers H.264 (avc1/h264) and VP8 over software CPU-heavy VP9
 * so live component animations never stutter during 60fps capture.
 */
export function pickSupportedRecorderMime(preferred: "mp4" | "webm"): string {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return "video/webm";
  }

  const mp4Candidates = [
    "video/mp4;codecs=avc1.42E01E",
    "video/mp4;codecs=avc1.4d002a",
    "video/mp4;codecs=h264",
    "video/mp4",
  ];
  const webmFastCandidates = [
    "video/webm;codecs=h264",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/webm;codecs=vp9",
  ];

  const ordered =
    preferred === "mp4"
      ? [...mp4Candidates, ...webmFastCandidates]
      : [...webmFastCandidates, ...mp4Candidates];

  for (const mime of ordered) {
    try {
      if (MediaRecorder.isTypeSupported(mime)) {
        return mime;
      }
    } catch {
      // Ignore unsupported probe
    }
  }
  return "video/webm";
}

export function detectCaptureCapabilities(): {
  hasMediaRecorder: boolean;
  hasDisplayMedia: boolean;
  hasRegionCrop: boolean;
  supportsNativeMp4: boolean;
  isLikelyCrossOriginIframe: boolean;
} {
  if (typeof window === "undefined") {
    return {
      hasMediaRecorder: false,
      hasDisplayMedia: false,
      hasRegionCrop: false,
      supportsNativeMp4: false,
      isLikelyCrossOriginIframe: false,
    };
  }

  const hasMediaRecorder = typeof MediaRecorder !== "undefined";
  const hasDisplayMedia =
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getDisplayMedia === "function";

  const cropTargetGlobal = (window as unknown as { CropTarget?: { fromElement?: unknown } })
    .CropTarget;
  const hasRegionCrop =
    typeof cropTargetGlobal !== "undefined" &&
    typeof cropTargetGlobal.fromElement === "function";

  let supportsNativeMp4 = false;
  if (hasMediaRecorder) {
    try {
      supportsNativeMp4 =
        MediaRecorder.isTypeSupported("video/mp4;codecs=avc1.42E01E") ||
        MediaRecorder.isTypeSupported("video/mp4");
    } catch {
      supportsNativeMp4 = false;
    }
  }

  let isLikelyCrossOriginIframe = false;
  try {
    isLikelyCrossOriginIframe = window.self !== window.top;
  } catch {
    isLikelyCrossOriginIframe = true;
  }

  return {
    hasMediaRecorder,
    hasDisplayMedia,
    hasRegionCrop,
    supportsNativeMp4,
    isLikelyCrossOriginIframe,
  };
}

/**
 * Draws the refined minimal studio cursor, subtle interactive hover halo, and whisper-quiet hairline click pulse onto a 2D canvas.
 * Shared by both the live top-layer stage overlay and the Direct Stage 60fps compositor for 1:1 visual parity.
 */
export function drawCanvasCursorOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  telemetry: CursorTelemetryState,
  isDark: boolean
) {
  const scaleFactor = (width / 1280) * 1.25;

  // Draw minimal hairline click pulses
  for (const ripple of telemetry.ripples) {
    const rx = ripple.nx * width;
    const ry = ripple.ny * height;
    const p = Math.max(0, Math.min(1, ripple.progress));
    const easeOutQuart = 1 - Math.pow(1 - p, 4);
    const ringAlpha = Math.max(0, Math.pow(1 - p, 1.4));

    ctx.save();
    ctx.beginPath();
    ctx.arc(rx, ry, (5 + easeOutQuart * 17) * scaleFactor, 0, Math.PI * 2);
    ctx.lineWidth = 1.45 * scaleFactor;
    ctx.strokeStyle = isDark
      ? `rgba(255, 255, 255, ${(ringAlpha * 0.65).toFixed(3)})`
      : `rgba(9, 9, 11, ${(ringAlpha * 0.55).toFixed(3)})`;
    ctx.stroke();

    const dotProgress = Math.min(1, p * 2.4);
    const dotAlpha = Math.max(0, 1 - dotProgress);
    if (dotAlpha > 0.01) {
      ctx.beginPath();
      ctx.arc(rx, ry, (3.2 - dotProgress * 1.3) * scaleFactor, 0, Math.PI * 2);
      ctx.fillStyle = isDark
        ? `rgba(255, 255, 255, ${(dotAlpha * 0.48).toFixed(3)})`
        : `rgba(9, 9, 11, ${(dotAlpha * 0.36).toFixed(3)})`;
      ctx.fill();
    }
    ctx.restore();
  }

  if (!telemetry.visible) return;

  const cx = telemetry.nx * width;
  const cy = telemetry.ny * height;
  const pointerScale = scaleFactor * telemetry.scale;

  // Whisper-subtle interactive hover halo around cursor tip
  if (telemetry.hoveringInteractive && !telemetry.isPressed) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 12 * scaleFactor, 0, Math.PI * 2);
    ctx.lineWidth = 1.15 * scaleFactor;
    ctx.strokeStyle = isDark
      ? "rgba(255, 255, 255, 0.28)"
      : "rgba(9, 9, 11, 0.22)";
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((telemetry.tilt * Math.PI) / 180);
  ctx.scale(pointerScale, pointerScale);

  // Refined studio drop shadow for crisp visibility on both light & dark components
  ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 3.5;

  // Geometric high-contrast studio pointer
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(16.8, 10.4);
  ctx.lineTo(9.4, 11.7);
  ctx.lineTo(6.2, 18.6);
  ctx.closePath();

  ctx.fillStyle = "#09090b";
  ctx.fill();
  ctx.lineWidth = 1.85;
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();
  ctx.restore();
}

interface ExtendedDisplayVideoConstraints extends MediaTrackConstraints {
  displaySurface?: string;
  cursor?: "always" | "motion" | "never";
}

interface ExtendedDisplayMediaOptions extends DisplayMediaStreamOptions {
  preferCurrentTab?: boolean;
  selfBrowserSurface?: "include" | "exclude";
  surfaceSwitching?: "include" | "exclude";
}

/**
 * Primary Engine: Zero-Copy Hardware GPU Region Capture (`getDisplayMedia` + `CropTarget`).
 *
 * When Region Capture (`CropTarget`) is supported (Chrome/Edge), pipes the cropped GPU
 * MediaStream DIRECTLY into hardware-accelerated MediaRecorder with ZERO `<video>` copy,
 * ZERO 2D `<canvas>` drawImage, and ZERO main-thread rAF overhead (true 0% lag!).
 */
async function startNativeRegionCapture(
  options: StartRecorderOptions
): Promise<StageRecorderHandle> {
  const { width, height } = getResolutionDimensions(options.resolution);
  const fps = options.fps;
  const mimeType = pickSupportedRecorderMime(options.preferredFormat);
  const bitrate = options.resolution === "1080p" ? 8_500_000 : 5_000_000;

  const videoConstraints: ExtendedDisplayVideoConstraints = {
    frameRate: { ideal: fps, max: fps },
    width: { ideal: width },
    height: { ideal: height },
    displaySurface: "browser",
    cursor: "never",
  };

  const displayOptions: ExtendedDisplayMediaOptions = {
    video: videoConstraints,
    audio: false,
    preferCurrentTab: true,
    selfBrowserSurface: "include",
    surfaceSwitching: "exclude",
  };

  const displayStream = await navigator.mediaDevices.getDisplayMedia(displayOptions);

  const videoTrack = displayStream.getVideoTracks()[0];
  if (!videoTrack) {
    displayStream.getTracks().forEach((t) => t.stop());
    throw new Error("No video track available from screen capture.");
  }

  // Attempt exact GPU Region Capture locking to the 16:9 stage element
  let isRegionCropped = false;
  try {
    const winWithCrop = window as unknown as {
      CropTarget?: { fromElement: (el: Element) => Promise<unknown> };
    };
    const trackWithCrop = videoTrack as MediaStreamTrack & {
      cropTo?: (target: unknown) => Promise<void>;
    };
    if (winWithCrop.CropTarget?.fromElement && typeof trackWithCrop.cropTo === "function") {
      const cropTarget = await winWithCrop.CropTarget.fromElement(options.stageElement);
      await trackWithCrop.cropTo(cropTarget);
      isRegionCropped = true;
    }
  } catch {
    isRegionCropped = false;
  }

  if (options.onTrackEnded) {
    videoTrack.addEventListener("ended", options.onTrackEnded, { once: true });
  }

  // FASTEST ZERO-COPY PATH: Record the GPU-cropped MediaStream directly without canvas readback!
  if (isRegionCropped) {
    const recorder = new MediaRecorder(displayStream, {
      mimeType,
      videoBitsPerSecond: bitrate,
    });

    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) {
        chunks.push(ev.data);
      }
    };

    const startedAt = performance.now();
    recorder.start(250);

    const cleanup = () => {
      displayStream.getTracks().forEach((t) => t.stop());
    };

    return {
      engine: "native-zero-copy",
      updateCursorTelemetry: () => {},
      pushFrameDataUrl: () => {},
      pushFrameBlob: () => {},
      pushFrameBitmap: () => {},
      cancel: () => {
        try {
          if (recorder.state !== "inactive") recorder.stop();
        } catch {
          // Ignore
        }
        cleanup();
      },
      stop: () =>
        new Promise<StageRecordingResult>((resolve, reject) => {
          const durationMs = Math.max(200, Math.round(performance.now() - startedAt));
          if (recorder.state === "inactive") {
            cleanup();
            resolve({
              blob: new Blob(chunks, { type: mimeType }),
              mimeType,
              durationMs,
              width,
              height,
              fps,
              engine: "native-zero-copy",
              needsServerRescale: true,
            });
            return;
          }
          recorder.onstop = () => {
            cleanup();
            const finalMime = recorder.mimeType || mimeType;
            resolve({
              blob: new Blob(chunks, { type: finalMime }),
              mimeType: finalMime,
              durationMs,
              width,
              height,
              fps,
              engine: "native-zero-copy",
              needsServerRescale: true,
            });
          };
          recorder.onerror = () => {
            cleanup();
            reject(new Error("Zero-copy GPU recorder encountered an encoding error."));
          };
          recorder.stop();
        }),
    };
  }

  // Fallback for browsers without CropTarget: bounding-box crop driven by requestVideoFrameCallback
  const videoEl = document.createElement("video");
  videoEl.srcObject = displayStream;
  videoEl.muted = true;
  videoEl.playsInline = true;
  await videoEl.play();

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
  if (!ctx) {
    displayStream.getTracks().forEach((t) => t.stop());
    throw new Error("Unable to initialize 2D compositor canvas.");
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "medium";

  // Cache stage bounding box (updated on resize only, avoiding per-frame forced layout reflow)
  let cachedRect = options.stageElement.getBoundingClientRect();
  const resizeObserver = new ResizeObserver(() => {
    cachedRect = options.stageElement.getBoundingClientRect();
  });
  resizeObserver.observe(options.stageElement);

  let active = true;
  let rafId = 0;
  let vfcId = 0;

  const drawSingleFrame = () => {
    if (!active) return;
    if (videoEl.readyState >= 2 && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
      const scaleX = videoEl.videoWidth / Math.max(1, window.innerWidth);
      const scaleY = videoEl.videoHeight / Math.max(1, window.innerHeight);
      const sx = Math.max(0, Math.round(cachedRect.left * scaleX));
      const sy = Math.max(0, Math.round(cachedRect.top * scaleY));
      const sw = Math.min(
        videoEl.videoWidth - sx,
        Math.max(16, Math.round(cachedRect.width * scaleX))
      );
      const sh = Math.min(
        videoEl.videoHeight - sy,
        Math.max(16, Math.round(cachedRect.height * scaleY))
      );
      ctx.drawImage(videoEl, sx, sy, sw, sh, 0, 0, width, height);
    }
    if (typeof videoEl.requestVideoFrameCallback === "function") {
      vfcId = videoEl.requestVideoFrameCallback(drawSingleFrame);
    } else {
      rafId = requestAnimationFrame(drawSingleFrame);
    }
  };
  drawSingleFrame();

  const canvasStream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(canvasStream, {
    mimeType,
    videoBitsPerSecond: bitrate,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (ev) => {
    if (ev.data && ev.data.size > 0) {
      chunks.push(ev.data);
    }
  };

  const startedAt = performance.now();
  recorder.start(250);

  const cleanup = () => {
    active = false;
    resizeObserver.disconnect();
    if (rafId) cancelAnimationFrame(rafId);
    if (vfcId && typeof videoEl.cancelVideoFrameCallback === "function") {
      videoEl.cancelVideoFrameCallback(vfcId);
    }
    displayStream.getTracks().forEach((t) => t.stop());
    canvasStream.getTracks().forEach((t) => t.stop());
    videoEl.srcObject = null;
  };

  return {
    engine: "native-region",
    updateCursorTelemetry: () => {},
    pushFrameDataUrl: () => {},
    pushFrameBlob: () => {},
    pushFrameBitmap: () => {},
    cancel: () => {
      try {
        if (recorder.state !== "inactive") recorder.stop();
      } catch {
        // Ignore
      }
      cleanup();
    },
    stop: () =>
      new Promise<StageRecordingResult>((resolve, reject) => {
        const durationMs = Math.max(200, Math.round(performance.now() - startedAt));
        if (recorder.state === "inactive") {
          cleanup();
          resolve({
            blob: new Blob(chunks, { type: mimeType }),
            mimeType,
            durationMs,
            width,
            height,
            fps,
            engine: "native-region",
          });
          return;
        }
        recorder.onstop = () => {
          cleanup();
          const finalMime = recorder.mimeType || mimeType;
          resolve({
            blob: new Blob(chunks, { type: finalMime }),
            mimeType: finalMime,
            durationMs,
            width,
            height,
            fps,
            engine: "native-region",
          });
        };
        recorder.onerror = () => {
          cleanup();
          reject(new Error("MediaRecorder encountered an encoding error."));
        };
        recorder.stop();
      }),
  };
}

/**
 * Turbo Zero-Permission Direct Stage Compositor:
 * - Uses zero-copy GPU `ImageBitmap` transfer for `<canvas>` / WebGL components.
 * - Uses fast SVG `Blob` transfer + cached stylesheets (no `encodeURIComponent` main-thread stalls).
 * - Uses adaptive frame-budgeted scheduling so the live UI never lags or freezes while
 *   compositing the spring cursor & minimal click pulses at a locked 60fps.
 */
async function startDirectStageCapture(
  options: StartRecorderOptions
): Promise<StageRecorderHandle> {
  const { width, height } = getResolutionDimensions(options.resolution);
  const fps = options.fps;
  const mimeType = pickSupportedRecorderMime(options.preferredFormat);
  const isDark = options.previewTheme === "dark";

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
  if (!ctx) {
    throw new Error("Unable to initialize 2D compositor canvas.");
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Dedicated backing frame buffer so SVG foreignObject blobs are rasterized ONCE while their
  // object URL is still valid (never revoked prematurely!) and blitted at 60fps in <0.1ms.
  const frameBufferCanvas = document.createElement("canvas");
  frameBufferCanvas.width = width;
  frameBufferCanvas.height = height;
  const frameBufferCtx = frameBufferCanvas.getContext("2d", { alpha: false });
  if (frameBufferCtx) {
    frameBufferCtx.fillStyle = isDark ? "#09090b" : "#ffffff";
    frameBufferCtx.fillRect(0, 0, width, height);
    frameBufferCtx.imageSmoothingEnabled = true;
    frameBufferCtx.imageSmoothingQuality = "high";
  }

  let active = true;
  let rafId = 0;
  let frameReqId = 0;
  let inFlightFrame = false;
  let hasDrawnFrame = false;
  let nextPollTimer: ReturnType<typeof setTimeout> | null = null;
  let safetyTimer: ReturnType<typeof setTimeout> | null = null;

  let cursorTelemetry: CursorTelemetryState = options.initialCursorTelemetry
    ? {
        ...options.initialCursorTelemetry,
        visible: options.showCursor !== false,
      }
    : {
        nx: 0.5,
        ny: 0.5,
        visible: options.showCursor !== false,
        scale: 1,
        tilt: 0,
        hoveringInteractive: false,
        isPressed: false,
        ripples: [],
      };

  const closeBitmapIfNeeded = (src: ImageBitmap | null) => {
    if (src && typeof ImageBitmap !== "undefined" && src instanceof ImageBitmap) {
      try {
        src.close();
      } catch {
        // Ignore already closed bitmap
      }
    }
  };

  const scheduleNextCapture = (lastCaptureMs = 16) => {
    if (!active) return;
    if (nextPollTimer) clearTimeout(nextPollTimer);
    const delay = Math.max(28, Math.min(90, Math.round(lastCaptureMs * 1.45)));
    nextPollTimer = setTimeout(requestSandboxFrame, delay);
  };

  const requestSandboxFrame = () => {
    if (!active || inFlightFrame || !options.iframeElement?.contentWindow) return;
    inFlightFrame = true;
    frameReqId += 1;
    options.iframeElement.contentWindow.postMessage(
      { type: "VIDEO_STUDIO_CAPTURE_FRAME", requestId: frameReqId },
      "*"
    );
    if (safetyTimer) clearTimeout(safetyTimer);
    safetyTimer = setTimeout(() => {
      if (!active) return;
      inFlightFrame = false;
      scheduleNextCapture(35);
    }, 260);
  };

  const drawFrame = () => {
    if (!active) return;

    if (hasDrawnFrame) {
      ctx.drawImage(frameBufferCanvas, 0, 0, width, height);
    } else {
      ctx.fillStyle = isDark ? "#09090b" : "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }

    drawCanvasCursorOverlay(ctx, width, height, cursorTelemetry, isDark);
    rafId = requestAnimationFrame(drawFrame);
  };
  drawFrame();

  const canvasStream = canvas.captureStream(fps);
  const bitrate = options.resolution === "1080p" ? 8_000_000 : 4_800_000;
  const recorder = new MediaRecorder(canvasStream, {
    mimeType,
    videoBitsPerSecond: bitrate,
  });

  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (ev) => {
    if (ev.data && ev.data.size > 0) {
      chunks.push(ev.data);
    }
  };

  const startedAt = performance.now();
  recorder.start(200);

  // Trigger initial frame request on next tick so caller's recorderRef.current is guaranteed assigned
  nextPollTimer = setTimeout(requestSandboxFrame, 0);

  const cleanup = () => {
    active = false;
    if (nextPollTimer) clearTimeout(nextPollTimer);
    if (safetyTimer) clearTimeout(safetyTimer);
    if (rafId) cancelAnimationFrame(rafId);
    canvasStream.getTracks().forEach((t) => t.stop());
  };

  const loadImageUrlIntoFrame = (url: string, shouldRevoke: boolean, captureMs: number) => {
    const img = new Image();
    img.onload = () => {
      if (active && frameBufferCtx) {
        try {
          frameBufferCtx.fillStyle = isDark ? "#09090b" : "#ffffff";
          frameBufferCtx.fillRect(0, 0, width, height);
          frameBufferCtx.drawImage(img, 0, 0, width, height);
          hasDrawnFrame = true;
        } catch {
          // Ignore transient draw error
        }
      }
      // Revoke blob URL ONLY AFTER drawImage has rasterized the SVG onto frameBufferCanvas
      if (shouldRevoke) {
        URL.revokeObjectURL(url);
      }
      if (active) {
        scheduleNextCapture(captureMs);
      }
    };
    img.onerror = () => {
      if (shouldRevoke) {
        URL.revokeObjectURL(url);
      }
      if (active) {
        scheduleNextCapture(Math.max(captureMs, 45));
      }
    };
    img.src = url;
  };

  return {
    engine: "direct-fallback",
    updateCursorTelemetry: (telemetry) => {
      cursorTelemetry = telemetry;
    },
    pushFrameBitmap: (_requestId, bitmap, captureMs = 8) => {
      inFlightFrame = false;
      if (safetyTimer) clearTimeout(safetyTimer);
      if (!active) {
        closeBitmapIfNeeded(bitmap);
        return;
      }
      if (bitmap && frameBufferCtx) {
        try {
          frameBufferCtx.fillStyle = isDark ? "#09090b" : "#ffffff";
          frameBufferCtx.fillRect(0, 0, width, height);
          frameBufferCtx.drawImage(bitmap, 0, 0, width, height);
          hasDrawnFrame = true;
        } catch {
          // Ignore
        }
      }
      closeBitmapIfNeeded(bitmap);
      if (nextPollTimer) clearTimeout(nextPollTimer);
      nextPollTimer = setTimeout(
        requestSandboxFrame,
        Math.max(24, Math.min(75, Math.round(captureMs * 1.5)))
      );
    },
    pushFrameBlob: (_requestId, blob, captureMs = 20) => {
      inFlightFrame = false;
      if (safetyTimer) clearTimeout(safetyTimer);
      if (!blob || !active) {
        scheduleNextCapture(captureMs);
        return;
      }
      const objectUrl = URL.createObjectURL(blob);
      loadImageUrlIntoFrame(objectUrl, true, captureMs);
    },
    pushFrameDataUrl: (_requestId, dataUrl, captureMs = 25) => {
      inFlightFrame = false;
      if (safetyTimer) clearTimeout(safetyTimer);
      if (!dataUrl || !active) {
        scheduleNextCapture(captureMs);
        return;
      }
      loadImageUrlIntoFrame(dataUrl, false, captureMs);
    },
    cancel: () => {
      try {
        if (recorder.state !== "inactive") recorder.stop();
      } catch {
        // Ignore
      }
      cleanup();
    },
    stop: () =>
      new Promise<StageRecordingResult>((resolve, reject) => {
        const durationMs = Math.max(200, Math.round(performance.now() - startedAt));
        if (recorder.state === "inactive") {
          cleanup();
          resolve({
            blob: new Blob(chunks, { type: mimeType }),
            mimeType,
            durationMs,
            width,
            height,
            fps,
            engine: "direct-fallback",
          });
          return;
        }
        recorder.onstop = () => {
          cleanup();
          const finalMime = recorder.mimeType || mimeType;
          resolve({
            blob: new Blob(chunks, { type: finalMime }),
            mimeType: finalMime,
            durationMs,
            width,
            height,
            fps,
            engine: "direct-fallback",
          });
        };
        recorder.onerror = () => {
          cleanup();
          reject(new Error("Direct Stage recorder encountered an encoding error."));
        };
        try {
          if (recorder.state === "recording") {
            recorder.requestData();
          }
        } catch {
          // Ignore requestData if unsupported
        }
        recorder.stop();
      }),
  };
}

/**
 * Starts 16:9 60fps stage recording using the preferred engine with automatic graceful fallback.
 * - In "auto" mode or inside embedded preview iframes, uses the zero-permission Direct Stage Compositor
 *   so recording starts immediately without browser screen-share permission dialogs or NotAllowedError failures.
 * - In "native" ("Hardware") mode, attempts getDisplayMedia + CropTarget and falls back to Direct Stage if blocked by iframe policy.
 */
export async function startStageRecording(
  options: StartRecorderOptions
): Promise<StageRecorderHandle> {
  const caps = detectCaptureCapabilities();
  if (!caps.hasMediaRecorder) {
    throw new Error(
      "This browser does not support MediaRecorder video capture. Please try Chrome, Edge, or Firefox."
    );
  }

  // Zero-permission Direct Stage Compositor is used for "direct" and "auto" so clicking Record
  // works 100% of the time without system screen-share popups or iframe permission failures.
  if (
    options.preferredEngine === "direct" ||
    options.preferredEngine === "auto" ||
    caps.isLikelyCrossOriginIframe ||
    !caps.hasDisplayMedia
  ) {
    if (options.preferredEngine === "native" && caps.hasDisplayMedia) {
      try {
        return await startNativeRegionCapture(options);
      } catch {
        return startDirectStageCapture(options);
      }
    }
    return startDirectStageCapture(options);
  }

  try {
    return await startNativeRegionCapture(options);
  } catch {
    return startDirectStageCapture(options);
  }
}

/**
 * Converts a recorded WebM/native blob to a universally compatible H.264 60fps MP4
 * via the local FFmpeg server route (`/api/video-transcode`).
 */
export async function transcodeRecordingToMp4(params: {
  blob: Blob;
  fps: 60 | 30;
  resolution: "1080p" | "720p";
  forceRescale?: boolean;
  ownerSessionToken?: string | null;
}): Promise<Blob> {
  if (params.blob.type.includes("video/mp4") && !params.forceRescale) {
    return params.blob;
  }

  const formData = new FormData();
  formData.append("file", params.blob, "recording.webm");
  formData.append("fps", String(params.fps));
  formData.append("resolution", params.resolution);

  const headers: Record<string, string> = {
    "X-Studio-Client": "component-studio",
  };
  if (params.ownerSessionToken) {
    headers["X-Studio-Owner-Token"] = params.ownerSessionToken;
  }

  const response = await fetch("/api/video-transcode", {
    method: "POST",
    headers,
    credentials: "same-origin",
    body: formData,
  });

  if (!response.ok) {
    let message = "MP4 transcoding failed on server.";
    try {
      const json = await response.json();
      if (json?.error) message = json.error;
    } catch {
      // Ignore JSON parse fallback
    }
    throw new Error(message);
  }

  return await response.blob();
}
