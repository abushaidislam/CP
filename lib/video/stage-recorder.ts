"use client";

export type CaptureEngineUsed = "native-region" | "direct-fallback";

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
}

export interface StageRecorderHandle {
  engine: CaptureEngineUsed;
  stop: () => Promise<StageRecordingResult>;
  cancel: () => void;
  updateCursorTelemetry: (telemetry: CursorTelemetryState) => void;
  pushFrameDataUrl: (requestId: number, dataUrl: string | null) => void;
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
  const webmCandidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm;codecs=h264",
    "video/webm",
  ];

  const ordered =
    preferred === "mp4"
      ? [...mp4Candidates, ...webmCandidates]
      : [...webmCandidates, ...mp4Candidates];

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
} {
  if (typeof window === "undefined") {
    return {
      hasMediaRecorder: false,
      hasDisplayMedia: false,
      hasRegionCrop: false,
      supportsNativeMp4: false,
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

  return {
    hasMediaRecorder,
    hasDisplayMedia,
    hasRegionCrop,
    supportsNativeMp4,
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
    // Single crisp hairline ring
    ctx.beginPath();
    ctx.arc(rx, ry, (5 + easeOutQuart * 17) * scaleFactor, 0, Math.PI * 2);
    ctx.lineWidth = 1.45 * scaleFactor;
    ctx.strokeStyle = isDark
      ? `rgba(255, 255, 255, ${(ringAlpha * 0.65).toFixed(3)})`
      : `rgba(9, 9, 11, ${(ringAlpha * 0.55).toFixed(3)})`;
    ctx.stroke();

    // Ultra-subtle micro contact dot
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

  // Geometric high-contrast studio pointer (matches SVG 26x26 silhouette 1:1)
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
 * Primary Engine: Native 60fps Browser Tab/Region Capture (`getDisplayMedia` + `CropTarget`)
 * piped into a locked 16:9 (1920x1080 or 1280x720) 60fps canvas + MediaRecorder.
 */
async function startNativeRegionCapture(
  options: StartRecorderOptions
): Promise<StageRecorderHandle> {
  const { width, height } = getResolutionDimensions(options.resolution);
  const fps = options.fps;
  const mimeType = pickSupportedRecorderMime(options.preferredFormat);

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

  // Attempt exact Region Capture locking to the 16:9 stage element
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
    // Fallback to exact bounding-box cropping on canvas below
    isRegionCropped = false;
  }

  if (options.onTrackEnded) {
    videoTrack.addEventListener("ended", options.onTrackEnded, { once: true });
  }

  const videoEl = document.createElement("video");
  videoEl.srcObject = displayStream;
  videoEl.muted = true;
  videoEl.playsInline = true;
  await videoEl.play();

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) {
    displayStream.getTracks().forEach((t) => t.stop());
    throw new Error("Unable to initialize 2D compositor canvas.");
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  let active = true;
  let rafId = 0;

  const drawFrame = () => {
    if (!active) return;
    if (videoEl.readyState >= 2 && videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
      if (isRegionCropped) {
        ctx.drawImage(videoEl, 0, 0, width, height);
      } else {
        // Compute exact stage crop relative to browser viewport
        const rect = options.stageElement.getBoundingClientRect();
        const scaleX = videoEl.videoWidth / Math.max(1, window.innerWidth);
        const scaleY = videoEl.videoHeight / Math.max(1, window.innerHeight);
        const sx = Math.max(0, Math.round(rect.left * scaleX));
        const sy = Math.max(0, Math.round(rect.top * scaleY));
        const sw = Math.min(videoEl.videoWidth - sx, Math.max(16, Math.round(rect.width * scaleX)));
        const sh = Math.min(videoEl.videoHeight - sy, Math.max(16, Math.round(rect.height * scaleY)));
        ctx.drawImage(videoEl, sx, sy, sw, sh, 0, 0, width, height);
      }
    }
    rafId = requestAnimationFrame(drawFrame);
  };
  drawFrame();

  const canvasStream = canvas.captureStream(fps);
  const bitrate = options.resolution === "1080p" ? 14_000_000 : 8_000_000;
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
  recorder.start(120);

  const cleanup = () => {
    active = false;
    if (rafId) cancelAnimationFrame(rafId);
    displayStream.getTracks().forEach((t) => t.stop());
    canvasStream.getTracks().forEach((t) => t.stop());
    videoEl.srcObject = null;
  };

  return {
    engine: "native-region",
    updateCursorTelemetry: () => {
      // Native capture already records the live in-stage spring cursor at 60fps
    },
    pushFrameDataUrl: () => {},
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
 * Fallback Engine: Zero-Permission Direct Stage 60fps Compositor.
 * Works cleanly even inside sandboxed iframes where `getDisplayMedia` is restricted.
 * Polls live frame images from the sandbox iframe while rendering the Spring Cursor,
 * Click Ripples, and Subtle Auto-Zoom natively at 60fps on the 16:9 canvas.
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
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) {
    throw new Error("Unable to initialize 2D compositor canvas.");
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  let active = true;
  let rafId = 0;
  let frameReqId = 0;
  let inFlightFrame = false;
  let latestFrameImage: HTMLImageElement | null = null;
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

  const requestSandboxFrame = () => {
    if (!active || inFlightFrame || !options.iframeElement?.contentWindow) return;
    inFlightFrame = true;
    frameReqId += 1;
    options.iframeElement.contentWindow.postMessage(
      { type: "VIDEO_STUDIO_CAPTURE_FRAME", requestId: frameReqId },
      "*"
    );
    // Safety release if sandbox doesn't reply in time
    setTimeout(() => {
      inFlightFrame = false;
    }, 220);
  };

  // Seed initial frame before starting recorder
  requestSandboxFrame();
  await new Promise((r) => setTimeout(r, 110));

  const pollTimer = window.setInterval(requestSandboxFrame, 33);

  const drawFrame = () => {
    if (!active) return;

    ctx.fillStyle = isDark ? "#09090b" : "#ffffff";
    ctx.fillRect(0, 0, width, height);

    if (latestFrameImage && latestFrameImage.naturalWidth > 0) {
      ctx.drawImage(latestFrameImage, 0, 0, width, height);
    }

    drawCanvasCursorOverlay(ctx, width, height, cursorTelemetry, isDark);
    rafId = requestAnimationFrame(drawFrame);
  };
  drawFrame();

  const canvasStream = canvas.captureStream(fps);
  const bitrate = options.resolution === "1080p" ? 12_000_000 : 7_000_000;
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
  recorder.start(120);

  const cleanup = () => {
    active = false;
    window.clearInterval(pollTimer);
    if (rafId) cancelAnimationFrame(rafId);
    canvasStream.getTracks().forEach((t) => t.stop());
  };

  return {
    engine: "direct-fallback",
    updateCursorTelemetry: (telemetry) => {
      cursorTelemetry = telemetry;
    },
    pushFrameDataUrl: (_requestId, dataUrl) => {
      inFlightFrame = false;
      if (!dataUrl || !active) return;
      const img = new Image();
      img.onload = () => {
        if (active) {
          latestFrameImage = img;
        }
      };
      img.src = dataUrl;
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
        recorder.stop();
      }),
  };
}

/**
 * Starts 16:9 60fps stage recording using the preferred engine with automatic graceful fallback.
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

  if (options.preferredEngine === "direct") {
    return startDirectStageCapture(options);
  }

  if (caps.hasDisplayMedia) {
    try {
      return await startNativeRegionCapture(options);
    } catch (err) {
      if (options.preferredEngine === "native") {
        throw err;
      }
      // If user explicitly cancelled or iframe blocks display-capture, surface clear fallback error
      // or automatically fall back when in "auto" mode if it's a policy/security block.
      const msg = err instanceof Error ? err.message : String(err);
      const isPolicyOrUnsupported =
        /disallowed by permissions policy|not allowed|not supported|SecurityError/i.test(msg);
      if (isPolicyOrUnsupported) {
        return startDirectStageCapture(options);
      }
      throw err;
    }
  }

  return startDirectStageCapture(options);
}

/**
 * Converts a recorded WebM blob to a universally compatible H.264 60fps MP4
 * via the local FFmpeg server route (`/api/video-transcode`).
 */
export async function transcodeRecordingToMp4(params: {
  blob: Blob;
  fps: 60 | 30;
  resolution: "1080p" | "720p";
}): Promise<Blob> {
  if (params.blob.type.includes("video/mp4")) {
    return params.blob;
  }

  const formData = new FormData();
  formData.append("file", params.blob, "recording.webm");
  formData.append("fps", String(params.fps));
  formData.append("resolution", params.resolution);

  const response = await fetch("/api/video-transcode", {
    method: "POST",
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
