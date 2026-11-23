"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useReducedMotion } from "framer-motion";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInCubic(t: number): number {
  return t * t * t;
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

export type AnimatedSignatureTheme = "auto" | "dark" | "light";

export interface AnimatedSignatureProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Any name or text to procedurally convert into a handwritten cursive SVG signature. */
  name?: string;
  /** Optional URL or data URL of a transparent signature image (PNG, WebP, SVG) to animate. */
  imageUrl?: string;
  /** Custom SVG path `d` attribute (overrides `name` and default path when provided). */
  path?: string;
  /** SVG viewBox matching the coordinate space of `path`. */
  viewBox?: string;
  /** Stroke drawing duration in seconds. */
  duration?: number;
  /** Stroke width of the signature ink in SVG user units. */
  strokeWidth?: number;
  /** Optional explicit ink/pen color (overrides `theme` color classes). */
  strokeColor?: string;
  /** Whether to display the tracking outline pen while drawing. */
  showPen?: boolean;
  /** Automatically play the drawing animation on mount. */
  autoPlay?: boolean;
  /** Continuously replay the signature animation after `loopDelay`. */
  loop?: boolean;
  /** Delay in seconds before replaying when `loop` is enabled. */
  loopDelay?: number;
  /** Allow clicking or pressing Enter/Space to replay the animation. */
  replayOnClick?: boolean;
  /** Ink color theme adaptation (`auto` follows Tailwind `dark:` mode). */
  theme?: AnimatedSignatureTheme;
  /** Accessible label describing the signature. */
  ariaLabel?: string;
  /** Callback fired whenever a drawing pass completes. */
  onDrawComplete?: () => void;
}

export const DEFAULT_SIGNATURE_PATH =
  "M 108 86 " +
  "C 118 71, 130 53, 127 46 " +
  "C 123 39, 106 53, 86 80 " +
  "C 65 108, 49 140, 57 152 " +
  "C 66 164, 86 150, 110 112 " +
  "C 134 74, 151 39, 156 36 " +
  "C 161 33, 152 54, 136 82 " +
  "C 125 101, 117 112, 116 114 " +
  "C 124 104, 134 97, 144 98 " +
  "C 155 100, 161 93, 171 71 " +
  "C 183 45, 198 30, 202 29 " +
  "C 205 28, 199 45, 185 69 " +
  "C 172 91, 165 99, 169 100 " +
  "C 174 101, 185 83, 190 79 " +
  "C 194 76, 191 89, 183 114 " +
  "C 176 134, 167 148, 168 148 " +
  "C 171 148, 180 112, 193 88 " +
  "C 203 71, 217 71, 224 79 " +
  "C 231 87, 222 102, 197 124 " +
  "C 172 146, 142 158, 130 156 " +
  "C 120 154, 128 139, 156 121 " +
  "C 185 103, 221 89, 243 89 " +
  "C 255 89, 256 97, 248 101 " +
  "C 240 104, 234 99, 241 94 " +
  "C 248 90, 259 97, 266 89 " +
  "C 271 83, 271 62, 281 45 " +
  "C 289 31, 299 26, 303 32 " +
  "C 307 38, 295 57, 283 72 " +
  "C 273 84, 272 89, 282 93 " +
  "C 300 100, 342 98, 396 92 " +
  "C 436 88, 468 85, 491 82";

const DEFAULT_VIEWBOX = "0 0 540 180";
const VB_WIDTH = 540;
const VB_HEIGHT = 180;

const FALLBACK_IMAGE_GUIDE_PATH =
  "M 56 106 C 120 72, 180 124, 252 88 C 324 56, 394 114, 484 82";

const THEME_TEXT_CLASSES: Record<AnimatedSignatureTheme, string> = {
  auto: "text-neutral-900 dark:text-[#fdfdfe]",
  dark: "text-[#fdfdfe]",
  light: "text-neutral-900",
};

type Point2D = [number, number];
type GlyphSpec = [number, Point2D[]];

const CURSIVE_GLYPHS: Record<string, GlyphSpec> = {
  a: [28, [[0, -6], [10, -26], [20, -24], [14, -4], [4, 0], [10, -16], [21, -22], [22, -4], [28, -6]]],
  b: [28, [[0, -6], [14, -42], [20, -64], [10, -54], [6, -18], [8, 0], [20, -4], [23, -20], [14, -24], [22, -10], [28, -6]]],
  c: [24, [[0, -6], [14, -24], [22, -22], [12, -24], [4, -12], [8, 0], [24, -6]]],
  d: [30, [[0, -6], [12, -24], [18, -22], [8, -10], [6, 0], [18, -10], [26, -62], [20, -52], [18, -14], [22, 0], [30, -6]]],
  e: [22, [[0, -6], [14, -16], [18, -25], [10, -26], [4, -14], [8, 0], [22, -6]]],
  f: [24, [[0, -6], [14, -42], [22, -64], [14, -56], [8, -10], [2, 34], [10, 28], [14, -4], [24, -10]]],
  g: [28, [[0, -6], [12, -24], [20, -22], [10, -12], [6, 0], [18, -10], [20, -22], [14, 14], [4, 36], [0, 28], [12, 8], [28, -6]]],
  h: [30, [[0, -6], [14, -42], [20, -64], [10, -52], [4, -10], [4, 0], [14, -22], [22, -22], [20, -4], [24, 0], [30, -6]]],
  i: [16, [[0, -6], [8, -22], [6, -4], [10, 0], [16, -6]]],
  j: [18, [[0, -6], [10, -22], [8, 14], [0, 36], [-4, 28], [8, 6], [18, -6]]],
  k: [28, [[0, -6], [14, -42], [20, -64], [10, -52], [4, -10], [4, 0], [14, -18], [22, -22], [12, -10], [22, 0], [28, -6]]],
  l: [20, [[0, -6], [12, -42], [18, -64], [10, -54], [4, -14], [8, 0], [20, -6]]],
  m: [40, [[0, -6], [8, -22], [10, -2], [18, -22], [22, -2], [30, -22], [32, -2], [40, -6]]],
  n: [30, [[0, -6], [8, -22], [10, -2], [20, -22], [22, -2], [30, -6]]],
  o: [26, [[0, -6], [12, -24], [22, -18], [18, -2], [8, 0], [6, -14], [16, -22], [26, -12]]],
  p: [28, [[0, -6], [8, -24], [2, 34], [4, 18], [10, -20], [22, -22], [22, -6], [12, -2], [28, -6]]],
  q: [28, [[0, -6], [12, -24], [20, -20], [8, -8], [8, 0], [20, -12], [16, 34], [20, 24], [28, -6]]],
  r: [22, [[0, -6], [8, -24], [14, -20], [14, -6], [16, 0], [22, -6]]],
  s: [24, [[0, -6], [12, -25], [18, -14], [12, 0], [4, -4], [14, -4], [24, -6]]],
  t: [22, [[0, -6], [12, -48], [8, -10], [10, 0], [22, -6]]],
  u: [28, [[0, -6], [8, -22], [8, -2], [16, -2], [22, -22], [22, -2], [28, -6]]],
  v: [26, [[0, -6], [8, -22], [12, 0], [22, -22], [26, -12]]],
  w: [38, [[0, -6], [8, -22], [10, -2], [20, -20], [24, -2], [34, -22], [38, -12]]],
  x: [26, [[0, -6], [10, -22], [20, 0], [12, -10], [22, -22], [10, 0], [26, -6]]],
  y: [28, [[0, -6], [8, -22], [10, -2], [20, -22], [14, 16], [4, 36], [0, 28], [12, 6], [28, -6]]],
  z: [26, [[0, -6], [10, -22], [22, -22], [8, -2], [20, 16], [10, 34], [4, 24], [14, 4], [26, -6]]],
  A: [42, [[-4, 8], [14, -34], [28, -64], [24, -10], [28, 0], [10, -16], [34, -20], [42, -6]]],
  B: [38, [[0, 4], [14, -62], [30, -56], [26, -34], [12, -30], [32, -22], [26, 0], [6, 2], [38, -6]]],
  C: [38, [[30, -48], [24, -62], [8, -46], [-2, -14], [4, 6], [22, -2], [38, -6]]],
  D: [40, [[6, -60], [2, 2], [24, 2], [36, -24], [30, -56], [12, -62], [28, -12], [40, -6]]],
  E: [36, [[28, -54], [16, -62], [6, -44], [20, -32], [6, -28], [2, -6], [18, 2], [36, -6]]],
  F: [36, [[32, -60], [12, -62], [4, 4], [12, -32], [28, -34], [16, -20], [36, -6]]],
  G: [40, [[30, -50], [22, -64], [4, -42], [2, -4], [20, 2], [28, -22], [18, 28], [8, 32], [24, 0], [40, -6]]],
  H: [42, [[6, -62], [0, 4], [12, -28], [32, -32], [34, -62], [26, 2], [42, -6]]],
  I: [28, [[10, -56], [22, -62], [14, -24], [8, 2], [2, 4], [28, -6]]],
  J: [32, [[12, -56], [26, -62], [18, -12], [10, 32], [0, 28], [10, 6], [32, -6]]],
  K: [40, [[8, -62], [0, 4], [10, -28], [32, -58], [12, -24], [28, 2], [40, -6]]],
  L: [36, [[24, -60], [14, -42], [2, 2], [14, 4], [26, 0], [36, -6]]],
  M: [52, [[0, 4], [12, -62], [20, -16], [34, -62], [40, 2], [52, -6]]],
  N: [44, [[0, 4], [12, -62], [28, 2], [36, -60], [34, -4], [44, -6]]],
  O: [40, [[24, -62], [6, -46], [2, -8], [16, 4], [34, -14], [34, -50], [20, -62], [34, -10], [40, -6]]],
  P: [38, [[0, 4], [14, -62], [32, -56], [30, -32], [12, -24], [26, -12], [38, -6]]],
  Q: [40, [[24, -62], [6, -46], [2, -8], [18, 4], [34, -16], [32, -52], [20, -14], [30, 6], [40, -6]]],
  R: [40, [[0, 4], [14, -62], [32, -56], [28, -34], [12, -28], [28, 2], [40, -6]]],
  S: [38, [[28, -54], [18, -64], [6, -52], [10, -32], [26, -14], [18, 4], [2, 4], [8, -12], [38, -6]]],
  T: [36, [[4, -56], [34, -64], [20, -60], [10, 4], [22, -4], [36, -6]]],
  U: [40, [[8, -60], [2, -8], [14, 4], [30, -14], [34, -60], [28, 2], [40, -6]]],
  V: [38, [[6, -60], [14, 4], [32, -60], [30, -12], [38, -6]]],
  W: [52, [[4, -60], [12, 4], [24, -44], [34, 4], [46, -60], [44, -12], [52, -6]]],
  X: [38, [[6, -58], [28, 2], [18, -28], [32, -58], [4, 2], [38, -6]]],
  Y: [38, [[6, -58], [12, -16], [28, -58], [16, 26], [6, 34], [16, 4], [38, -6]]],
  Z: [38, [[6, -58], [32, -60], [4, 2], [30, 2], [38, -6]]],
};

function pointsToCatmullRomSubpath(pts: Point2D[]): string {
  if (pts.length < 2) return "";
  const segs: string[] = [`M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = i > 0 ? pts[i - 1] : pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = i + 2 < pts.length ? pts[i + 2] : pts[i + 1];

    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;

    segs.push(
      `C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
    );
  }
  return segs.join(" ");
}

function buildSignaturePathFromName(rawName: string): string {
  const cleaned = rawName.trim().replace(/\s+/g, " ");
  if (!cleaned) return DEFAULT_SIGNATURE_PATH;

  const words = cleaned.split(" ");
  const wordPolylines: Point2D[][] = [];
  const slant = 0.34;
  let cursorX = 0;

  words.forEach((word, wordIdx) => {
    const pts: Point2D[] = [];
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      const spec = CURSIVE_GLYPHS[ch] ?? CURSIVE_GLYPHS[ch.toLowerCase()];
      if (!spec) {
        cursorX += 14;
        continue;
      }
      const [advance, glyphPts] = spec;
      for (let j = 0; j < glyphPts.length; j++) {
        const [gx, gy] = glyphPts[j];
        pts.push([cursorX + gx - gy * slant, gy]);
      }
      cursorX += advance;
    }

    if (wordIdx === words.length - 1 && pts.length > 0) {
      const [lx, ly] = pts[pts.length - 1];
      pts.push([lx + 34, ly + 4], [lx + 92, ly + 1], [lx + 150, ly - 8]);
    }

    if (pts.length >= 2) {
      wordPolylines.push(pts);
    }
    cursorX += 28;
  });

  const allPts = wordPolylines.flat();
  if (allPts.length < 2) return DEFAULT_SIGNATURE_PATH;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [x, y] of allPts) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const padX = 44;
  const padY = 26;
  const spanX = Math.max(maxX - minX, 1);
  const spanY = Math.max(maxY - minY, 1);
  const scale = Math.min(
    (VB_WIDTH - padX * 2) / spanX,
    (VB_HEIGHT - padY * 2) / spanY
  );
  const offsetX = (VB_WIDTH - spanX * scale) / 2 - minX * scale;
  const offsetY = (VB_HEIGHT - spanY * scale) / 2 - minY * scale;

  return wordPolylines
    .map((poly) =>
      pointsToCatmullRomSubpath(
        poly.map(([x, y]) => [x * scale + offsetX, y * scale + offsetY])
      )
    )
    .join(" ");
}

function extractContourFromImage(img: HTMLImageElement): string | null {
  try {
    const sampleW = 180;
    const sampleH = 60;
    const canvas = document.createElement("canvas");
    canvas.width = sampleW;
    canvas.height = sampleH;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    const imgAspect = (img.naturalWidth || 1) / (img.naturalHeight || 1);
    const boxAspect = sampleW / sampleH;
    let drawW = sampleW;
    let drawH = sampleH;
    let drawX = 0;
    let drawY = 0;

    if (imgAspect > boxAspect) {
      drawH = sampleW / imgAspect;
      drawY = (sampleH - drawH) / 2;
    } else {
      drawW = sampleH * imgAspect;
      drawX = (sampleW - drawW) / 2;
    }

    ctx.clearRect(0, 0, sampleW, sampleH);
    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    const { data } = ctx.getImageData(0, 0, sampleW, sampleH);
    const rawPts: Point2D[] = [];

    for (let x = 0; x < sampleW; x += 3) {
      let sumY = 0;
      let count = 0;
      for (let y = 0; y < sampleH; y++) {
        const alpha = data[(y * sampleW + x) * 4 + 3];
        if (alpha > 24) {
          sumY += y;
          count++;
        }
      }
      if (count > 0) {
        rawPts.push([
          (x / sampleW) * VB_WIDTH,
          (sumY / count / sampleH) * VB_HEIGHT,
        ]);
      }
    }

    if (rawPts.length < 3) return null;

    const smoothed: Point2D[] = rawPts.map((pt, idx) => {
      if (idx === 0 || idx === rawPts.length - 1) return pt;
      const prev = rawPts[idx - 1];
      const next = rawPts[idx + 1];
      return [
        (prev[0] + pt[0] * 2 + next[0]) / 4,
        (prev[1] + pt[1] * 2 + next[1]) / 4,
      ];
    });

    return pointsToCatmullRomSubpath(smoothed);
  } catch {
    return null;
  }
}

interface PenIconGraphicProps {
  strokeWidth: number;
}

const PenIconGraphic: React.FC<PenIconGraphicProps> = ({ strokeWidth }) => {
  const penStroke = Math.max(2.2, Math.min(3.4, strokeWidth * 0.85));

  return (
    <g
      transform="rotate(-45)"
      stroke="currentColor"
      strokeWidth={penStroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      {/* Needle nib tip anchored at (0, 0) */}
      <path d="M 0 0 L 11 -3.2 L 11 3.2 Z" fill="currentColor" />
      {/* Conical nose section */}
      <path d="M 11 -3.2 L 29 -8.5 L 29 8.5 L 11 3.2 Z" />
      {/* Lower grip barrel */}
      <path d="M 29 -8.5 L 50 -8.5 L 50 8.5 L 29 8.5 Z" />
      {/* Solid collar band */}
      <rect
        x={50}
        y={-9.5}
        width={12}
        height={19}
        rx={1.5}
        fill="currentColor"
        stroke="currentColor"
      />
      {/* Upper pen barrel with rounded end cap */}
      <path d="M 62 -8.5 L 118 -8.5 C 121.5 -8.5, 123.5 -6.5, 123.5 -3 L 123.5 3 C 123.5 6.5, 121.5 8.5, 118 8.5 L 62 8.5 Z" />
      {/* Top-left pocket clip hugging the collar & upper grip */}
      <path d="M 82 -8.5 C 76 -14.5, 67 -14.5, 58 -13.5 L 25 -8.5" />
    </g>
  );
};

export const AnimatedSignature = forwardRef<
  HTMLDivElement,
  AnimatedSignatureProps
>(
  (
    {
      name = "",
      imageUrl = "",
      path,
      viewBox = DEFAULT_VIEWBOX,
      duration = 2.0,
      strokeWidth = 3.6,
      strokeColor,
      showPen = true,
      autoPlay = true,
      loop = false,
      loopDelay = 1.8,
      replayOnClick = true,
      theme = "auto",
      ariaLabel,
      onDrawComplete,
      className,
      onClick,
      onKeyDown,
      style,
      ...rest
    },
    ref
  ) => {
    const rawId = useId();
    const safeId = rawId.replace(/:/g, "");
    const titleId = `signature-title-${safeId}`;
    const clipId = `signature-clip-${safeId}`;

    const prefersReducedMotion = useReducedMotion();

    const pathRef = useRef<SVGPathElement | null>(null);
    const penGroupRef = useRef<SVGGElement | null>(null);
    const clipRectRef = useRef<SVGRectElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const loopTimerRef = useRef<number | null>(null);
    const runIdRef = useRef<number>(0);

    const trimmedImageUrl = imageUrl.trim();
    const isImageMode = trimmedImageUrl.length > 0;

    const [imageGuidePath, setImageGuidePath] = useState<string>(
      FALLBACK_IMAGE_GUIDE_PATH
    );
    const [imageLoadFailed, setImageLoadFailed] = useState<boolean>(false);
    const [isDrawing, setIsDrawing] = useState<boolean>(false);

    useEffect(() => {
      if (!isImageMode) {
        setImageLoadFailed(false);
        return;
      }

      let cancelled = false;
      setImageLoadFailed(false);
      setImageGuidePath(FALLBACK_IMAGE_GUIDE_PATH);

      const probe = new window.Image();
      probe.crossOrigin = "anonymous";
      probe.onload = () => {
        if (cancelled) return;
        const extracted = extractContourFromImage(probe);
        if (extracted) {
          setImageGuidePath(extracted);
        }
      };
      probe.onerror = () => {
        if (cancelled) return;
        const fallbackProbe = new window.Image();
        fallbackProbe.onerror = () => {
          if (!cancelled) setImageLoadFailed(true);
        };
        fallbackProbe.src = trimmedImageUrl;
      };
      probe.src = trimmedImageUrl;

      return () => {
        cancelled = true;
      };
    }, [isImageMode, trimmedImageUrl]);

    const resolvedPath = useMemo(() => {
      if (isImageMode && !imageLoadFailed) {
        return imageGuidePath;
      }
      if (path && path.trim().length > 0) {
        return path;
      }
      if (name && name.trim().length > 0) {
        return buildSignaturePathFromName(name);
      }
      return DEFAULT_SIGNATURE_PATH;
    }, [imageGuidePath, imageLoadFailed, isImageMode, name, path]);

    const resolvedAriaLabel =
      ariaLabel ??
      (name.trim()
        ? `Animated handwritten signature for ${name.trim()}`
        : "Animated handwritten signature");

    const safeDuration =
      Number.isFinite(duration) && duration > 0
        ? Math.min(Math.max(duration, 0.3), 12)
        : 2.0;
    const safeStrokeWidth =
      Number.isFinite(strokeWidth) && strokeWidth > 0
        ? Math.min(Math.max(strokeWidth, 1), 12)
        : 3.6;
    const safeLoopDelay =
      Number.isFinite(loopDelay) && loopDelay >= 0
        ? Math.min(loopDelay, 15)
        : 1.8;

    const stopPlayback = useCallback(() => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (loopTimerRef.current !== null) {
        window.clearTimeout(loopTimerRef.current);
        loopTimerRef.current = null;
      }
    }, []);

    const startDrawSequence = useCallback(() => {
      const pathEl = pathRef.current;
      if (!pathEl) return;

      stopPlayback();
      const currentRunId = ++runIdRef.current;

      const total = pathEl.getTotalLength();
      if (!Number.isFinite(total) || total <= 0) return;

      pathEl.style.strokeDasharray = `${total}`;

      if (prefersReducedMotion) {
        pathEl.style.strokeDashoffset = "0";
        if (clipRectRef.current) {
          clipRectRef.current.setAttribute("width", String(VB_WIDTH));
        }
        if (penGroupRef.current) {
          penGroupRef.current.setAttribute("opacity", "0");
        }
        setIsDrawing(false);
        return;
      }

      setIsDrawing(true);
      pathEl.style.strokeDashoffset = `${total}`;
      if (clipRectRef.current) {
        clipRectRef.current.setAttribute("width", "0");
      }

      const startPt = pathEl.getPointAtLength(0);
      const endPt = pathEl.getPointAtLength(total);

      const enterDur = showPen ? 0.14 : 0;
      const drawDur = safeDuration;
      const exitDur = showPen ? 0.22 : 0;
      const totalDur = enterDur + drawDur + exitDur;

      if (penGroupRef.current) {
        penGroupRef.current.setAttribute(
          "transform",
          `translate(${startPt.x + 10}, ${startPt.y - 10})`
        );
        penGroupRef.current.setAttribute("opacity", "0");
      }

      const startTime = performance.now();

      const step = (now: number) => {
        if (runIdRef.current !== currentRunId) return;

        const elapsed = (now - startTime) / 1000;
        const penEl = penGroupRef.current;
        const clipEl = clipRectRef.current;

        if (elapsed < enterDur && enterDur > 0) {
          const e = easeOutCubic(Math.min(Math.max(elapsed / enterDur, 0), 1));
          const liftX = 10 * (1 - e);
          const liftY = -10 * (1 - e);
          if (penEl && showPen) {
            penEl.setAttribute(
              "transform",
              `translate(${(startPt.x + liftX).toFixed(2)}, ${(startPt.y + liftY).toFixed(2)})`
            );
            penEl.setAttribute("opacity", e.toFixed(3));
          }
          rafRef.current = window.requestAnimationFrame(step);
          return;
        }

        if (elapsed < enterDur + drawDur) {
          const rawP = Math.min(Math.max((elapsed - enterDur) / drawDur, 0), 1);
          const p = easeInOutSine(rawP);
          const dist = p * total;

          pathEl.style.strokeDashoffset = `${total - dist}`;
          const pt = pathEl.getPointAtLength(dist);

          if (clipEl) {
            const w = Math.min(VB_WIDTH, Math.max(pt.x + 6, p * VB_WIDTH));
            clipEl.setAttribute("width", w.toFixed(2));
          }
          if (penEl && showPen) {
            penEl.setAttribute(
              "transform",
              `translate(${pt.x.toFixed(2)}, ${pt.y.toFixed(2)})`
            );
            penEl.setAttribute("opacity", "1");
          }

          rafRef.current = window.requestAnimationFrame(step);
          return;
        }

        pathEl.style.strokeDashoffset = "0";
        if (clipEl) {
          clipEl.setAttribute("width", String(VB_WIDTH));
        }

        if (elapsed < totalDur && exitDur > 0) {
          const e = easeInCubic(
            Math.min(Math.max((elapsed - enterDur - drawDur) / exitDur, 0), 1)
          );
          const liftX = 14 * e;
          const liftY = -14 * e;
          if (penEl && showPen) {
            penEl.setAttribute(
              "transform",
              `translate(${(endPt.x + liftX).toFixed(2)}, ${(endPt.y + liftY).toFixed(2)})`
            );
            penEl.setAttribute("opacity", (1 - e).toFixed(3));
          }
          rafRef.current = window.requestAnimationFrame(step);
          return;
        }

        if (penEl) {
          penEl.setAttribute("opacity", "0");
        }
        rafRef.current = null;
        setIsDrawing(false);
        onDrawComplete?.();

        if (loop) {
          loopTimerRef.current = window.setTimeout(() => {
            if (runIdRef.current === currentRunId) {
              startDrawSequence();
            }
          }, safeLoopDelay * 1000);
        }
      };

      rafRef.current = window.requestAnimationFrame(step);
    }, [
      loop,
      onDrawComplete,
      prefersReducedMotion,
      safeDuration,
      safeLoopDelay,
      showPen,
      stopPlayback,
    ]);

    useEffect(() => {
      const pathEl = pathRef.current;
      if (!pathEl) return;

      if (prefersReducedMotion || !autoPlay) {
        stopPlayback();
        runIdRef.current += 1;
        const total = pathEl.getTotalLength();
        pathEl.style.strokeDasharray = `${total}`;
        pathEl.style.strokeDashoffset = "0";
        if (clipRectRef.current) {
          clipRectRef.current.setAttribute("width", String(VB_WIDTH));
        }
        if (penGroupRef.current) {
          penGroupRef.current.setAttribute("opacity", "0");
        }
        setIsDrawing(false);
        return;
      }

      startDrawSequence();

      return () => {
        runIdRef.current += 1;
        stopPlayback();
      };
    }, [
      autoPlay,
      prefersReducedMotion,
      resolvedPath,
      startDrawSequence,
      stopPlayback,
    ]);

    const handleTriggerReplay = useCallback(() => {
      if (!replayOnClick || prefersReducedMotion) return;
      startDrawSequence();
    }, [prefersReducedMotion, replayOnClick, startDrawSequence]);

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          handleTriggerReplay();
        }
      },
      [handleTriggerReplay, onClick]
    );

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event);
        if (
          !event.defaultPrevented &&
          replayOnClick &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault();
          handleTriggerReplay();
        }
      },
      [handleTriggerReplay, onKeyDown, replayOnClick]
    );

    const renderImage = isImageMode && !imageLoadFailed;

    return (
      <div
        ref={ref}
        role={replayOnClick ? "button" : "img"}
        tabIndex={replayOnClick ? 0 : undefined}
        aria-label={
          replayOnClick
            ? `${resolvedAriaLabel}. Click or press Enter to replay.`
            : resolvedAriaLabel
        }
        aria-busy={isDrawing}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        style={{
          color: strokeColor || undefined,
          ...style,
        }}
        className={cn(
          "relative inline-flex w-full max-w-[540px] select-none items-center justify-center rounded-lg transition-opacity",
          !strokeColor && THEME_TEXT_CLASSES[theme],
          replayOnClick &&
            "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-4 focus-visible:ring-offset-transparent",
          className
        )}
        {...rest}
      >
        <svg
          viewBox={renderImage ? DEFAULT_VIEWBOX : viewBox}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-labelledby={titleId}
          className="h-auto w-full overflow-visible"
        >
          <title id={titleId}>{resolvedAriaLabel}</title>

          {renderImage && (
            <defs>
              <clipPath id={clipId}>
                <rect
                  ref={clipRectRef}
                  x={0}
                  y={0}
                  width={0}
                  height={VB_HEIGHT}
                />
              </clipPath>
            </defs>
          )}

          {renderImage && (
            <image
              href={trimmedImageUrl}
              x={0}
              y={0}
              width={VB_WIDTH}
              height={VB_HEIGHT}
              preserveAspectRatio="xMidYMid meet"
              clipPath={`url(#${clipId})`}
            />
          )}

          <path
            ref={pathRef}
            d={resolvedPath}
            stroke={renderImage ? "transparent" : "currentColor"}
            strokeWidth={safeStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {showPen && !prefersReducedMotion && (
            <g
              ref={penGroupRef}
              aria-hidden="true"
              className="pointer-events-none"
              opacity={0}
            >
              <PenIconGraphic strokeWidth={safeStrokeWidth} />
            </g>
          )}
        </svg>
      </div>
    );
  }
);

AnimatedSignature.displayName = "AnimatedSignature";

export { AnimatedSignature as component, AnimatedSignature as Component };
export default AnimatedSignature;