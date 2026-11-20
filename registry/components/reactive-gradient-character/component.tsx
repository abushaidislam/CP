"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";

function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(" ");
}

export type ReactiveCharacterPalette =
  | "crimson"
  | "midnight"
  | "emerald"
  | "violet"
  | "obsidian";

export interface ReactiveGradientCharacterProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Comma-separated string or array of up to 4 words for the kinetic greeting sequence. */
  phrases?: string | string[];
  /** Color atmosphere for the backdrop, rim glow, and metallic character gradient. */
  palette?: ReactiveCharacterPalette;
  /** Runs the continuous 9-second kinetic camera-pan & depth-of-field choreography. */
  autoPlay?: boolean;
  /** Enables pointer eye-tracking, subtle head parallax, and click-to-blink/jump-beat. */
  interactive?: boolean;
  /** Playback speed multiplier for the choreography timeline (0.5 to 2.0). */
  speed?: number;
  /** Accessible label describing the character stage. */
  ariaLabel?: string;
}

interface PaletteTokens {
  bgCenter: string;
  bgEdge: string;
  bgDark: string;
  ambientGlow: string;
  rimGlow: string;
  rimStroke: string;
  headStops: [string, string, string, string];
  bodyStops: [string, string, string, string];
  textGlow: string;
}

const PALETTES: Record<ReactiveCharacterPalette, PaletteTokens> = {
  crimson: {
    bgCenter: "#4c0202",
    bgEdge: "#380000",
    bgDark: "#0b0000",
    ambientGlow: "rgba(198, 32, 32, 0.36)",
    rimGlow: "#c93434",
    rimStroke: "#f5eeee",
    headStops: ["#3c3c3c", "#6c6c6c", "#9c9c9c", "#d8d8d8"],
    bodyStops: ["#343434", "#646464", "#adadad", "#f4f4f4"],
    textGlow:
      "0 0 18px rgba(255, 255, 255, 0.56), 0 0 38px rgba(255, 255, 255, 0.22)",
  },
  midnight: {
    bgCenter: "#07142b",
    bgEdge: "#030a18",
    bgDark: "#01040a",
    ambientGlow: "rgba(59, 130, 246, 0.3)",
    rimGlow: "#3b82f6",
    rimStroke: "#e8f1ff",
    headStops: ["#333b4a", "#5f6c82", "#95a3ba", "#dce4f0"],
    bodyStops: ["#29303d", "#55637a", "#9aa9c2", "#eef4ff"],
    textGlow:
      "0 0 18px rgba(191, 219, 254, 0.58), 0 0 38px rgba(147, 197, 253, 0.24)",
  },
  emerald: {
    bgCenter: "#04261c",
    bgEdge: "#021610",
    bgDark: "#010a07",
    ambientGlow: "rgba(16, 185, 129, 0.28)",
    rimGlow: "#10b981",
    rimStroke: "#e6faf3",
    headStops: ["#31403b", "#5c736b", "#92aba2", "#d8e8e2"],
    bodyStops: ["#26332e", "#50665e", "#95b0a6", "#edf7f3"],
    textGlow:
      "0 0 18px rgba(167, 243, 208, 0.55), 0 0 38px rgba(110, 231, 183, 0.22)",
  },
  violet: {
    bgCenter: "#220a3d",
    bgEdge: "#140526",
    bgDark: "#090212",
    ambientGlow: "rgba(168, 85, 247, 0.32)",
    rimGlow: "#a855f7",
    rimStroke: "#f3e8ff",
    headStops: ["#3b3347", "#6b5f7d", "#a093b5", "#e0d8ed"],
    bodyStops: ["#2f283a", "#5d5270", "#a294ba", "#f2ecfa"],
    textGlow:
      "0 0 18px rgba(233, 213, 255, 0.58), 0 0 38px rgba(192, 132, 252, 0.24)",
  },
  obsidian: {
    bgCenter: "#151518",
    bgEdge: "#09090b",
    bgDark: "#020203",
    ambientGlow: "rgba(255, 255, 255, 0.14)",
    rimGlow: "#a1a1aa",
    rimStroke: "#fafafa",
    headStops: ["#333336", "#636369", "#9b9ba3", "#dedee3"],
    bodyStops: ["#29292c", "#59595f", "#a3a3ab", "#f4f4f5"],
    textGlow:
      "0 0 18px rgba(255, 255, 255, 0.48), 0 0 36px rgba(255, 255, 255, 0.18)",
  },
};

type EaseName = "linear" | "easeOut" | "easeIn" | "easeInOut" | "expoOut";

interface Keyframe {
  t: number;
  v: number;
  ease?: EaseName;
}

const LOOP_DURATION = 9.0;

function applyEase(p: number, ease: EaseName): number {
  const x = Math.max(0, Math.min(1, p));
  switch (ease) {
    case "linear":
      return x;
    case "easeOut":
      return 1 - Math.pow(1 - x, 3);
    case "easeIn":
      return x * x * x;
    case "expoOut":
      return x === 1 ? 1 : 1 - Math.pow(2, -9 * x);
    case "easeInOut":
    default:
      return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }
}

function sampleTrack(track: Keyframe[], time: number): number {
  if (time <= track[0].t) return track[0].v;
  const last = track[track.length - 1];
  if (time >= last.t) return last.v;

  for (let i = 0; i < track.length - 1; i++) {
    const k0 = track[i];
    const k1 = track[i + 1];
    if (time >= k0.t && time <= k1.t) {
      const span = k1.t - k0.t;
      if (span <= 0) return k1.v;
      const eased = applyEase((time - k0.t) / span, k1.ease ?? "easeInOut");
      return k0.v + (k1.v - k0.v) * eased;
    }
  }
  return last.v;
}

// Frame-matched 9.0s keyframe tracks extracted from the 6fps reference sheets
const TRACK_BG_DIM: Keyframe[] = [
  { t: 0.0, v: 0.78 },
  { t: 0.55, v: 0, ease: "easeOut" },
  { t: 8.35, v: 0, ease: "linear" },
  { t: 8.95, v: 0.88, ease: "easeIn" },
];

const TRACK_CHAR_X: Keyframe[] = [
  { t: 0.0, v: 0 },
  { t: 3.72, v: 0, ease: "linear" },
  { t: 4.32, v: 29, ease: "easeInOut" },
  { t: 4.8, v: 34, ease: "linear" },
  { t: 5.65, v: -30, ease: "easeInOut" },
  { t: 6.12, v: -34, ease: "linear" },
  { t: 6.72, v: 0, ease: "easeInOut" },
  { t: 9.0, v: 0, ease: "linear" },
];

const TRACK_CHAR_Y: Keyframe[] = [
  { t: 0.0, v: 42 },
  { t: 0.62, v: 0, ease: "expoOut" },
  { t: 2.55, v: 0, ease: "linear" },
  { t: 3.15, v: 11, ease: "easeInOut" },
  { t: 3.75, v: 12, ease: "linear" },
  { t: 4.35, v: 16, ease: "easeInOut" },
  { t: 5.65, v: 15, ease: "easeInOut" },
  { t: 6.75, v: 6, ease: "easeInOut" },
  { t: 8.15, v: 3, ease: "easeInOut" },
  { t: 8.95, v: 48, ease: "easeIn" },
];

const TRACK_CHAR_SCALE: Keyframe[] = [
  { t: 0.0, v: 0.64 },
  { t: 0.62, v: 1.0, ease: "expoOut" },
  { t: 2.55, v: 1.0, ease: "linear" },
  { t: 3.15, v: 1.04, ease: "easeInOut" },
  { t: 4.35, v: 1.12, ease: "easeInOut" },
  { t: 5.65, v: 1.14, ease: "easeInOut" },
  { t: 6.75, v: 1.16, ease: "easeInOut" },
  { t: 8.15, v: 1.02, ease: "easeInOut" },
  { t: 8.95, v: 0.66, ease: "easeIn" },
];

const TRACK_EYE_X: Keyframe[] = [
  { t: 0.0, v: 0 },
  { t: 0.88, v: 0, ease: "linear" },
  { t: 1.16, v: 48, ease: "easeInOut" },
  { t: 1.38, v: 52, ease: "linear" },
  { t: 1.72, v: 0, ease: "easeInOut" },
  { t: 3.75, v: 0, ease: "linear" },
  { t: 4.35, v: -18, ease: "easeInOut" },
  { t: 4.82, v: -16, ease: "linear" },
  { t: 5.55, v: 26, ease: "easeInOut" },
  { t: 6.12, v: 24, ease: "linear" },
  { t: 6.68, v: 0, ease: "easeInOut" },
  { t: 9.0, v: 0, ease: "linear" },
];

const TRACK_EYE_Y: Keyframe[] = [
  { t: 0.0, v: 0 },
  { t: 0.9, v: 0, ease: "linear" },
  { t: 1.18, v: -6, ease: "easeInOut" },
  { t: 1.72, v: 0, ease: "easeInOut" },
  { t: 2.6, v: 0, ease: "linear" },
  { t: 3.15, v: -4, ease: "easeInOut" },
  { t: 6.7, v: -2, ease: "easeInOut" },
  { t: 9.0, v: 0, ease: "linear" },
];

const TRACK_EYE_SCALE_Y: Keyframe[] = [
  { t: 0.0, v: 0.86 },
  { t: 0.62, v: 0.9, ease: "easeOut" },
  { t: 0.76, v: 0.9, ease: "linear" },
  { t: 0.84, v: 0.1, ease: "easeInOut" },
  { t: 0.92, v: 0.82, ease: "easeOut" },
  { t: 1.0, v: 0.08, ease: "easeInOut" },
  { t: 1.12, v: 0.94, ease: "easeOut" },
  { t: 2.55, v: 0.94, ease: "linear" },
  { t: 3.05, v: 1.24, ease: "easeInOut" },
  { t: 8.15, v: 1.22, ease: "linear" },
  { t: 8.75, v: 0.96, ease: "easeInOut" },
];

// Word 0 ("HELLO"): Enters top-center -> rack-focuses & pans right -> sweeps across center to top-left -> exits up
const TRACK_W0_X: Keyframe[] = [
  { t: 0.0, v: 0 },
  { t: 3.72, v: 0, ease: "linear" },
  { t: 4.35, v: 29, ease: "easeInOut" },
  { t: 4.8, v: 33, ease: "linear" },
  { t: 5.65, v: -31, ease: "easeInOut" },
  { t: 6.12, v: -34, ease: "linear" },
  { t: 6.55, v: -10, ease: "easeInOut" },
  { t: 9.0, v: 0, ease: "linear" },
];

const TRACK_W0_Y: Keyframe[] = [
  { t: 0.0, v: -20 },
  { t: 2.66, v: -20, ease: "linear" },
  { t: 3.16, v: 12, ease: "expoOut" },
  { t: 6.1, v: 12, ease: "linear" },
  { t: 6.58, v: -22, ease: "easeIn" },
  { t: 9.0, v: -22, ease: "linear" },
];

const TRACK_W0_SCALE: Keyframe[] = [
  { t: 0.0, v: 1 },
  { t: 3.72, v: 1, ease: "linear" },
  { t: 4.32, v: 0.88, ease: "easeInOut" },
  { t: 6.58, v: 0.88, ease: "linear" },
  { t: 9.0, v: 1, ease: "linear" },
];

const TRACK_W0_BLUR: Keyframe[] = [
  { t: 0.0, v: 0 },
  { t: 3.78, v: 0, ease: "linear" },
  { t: 4.32, v: 5.2, ease: "easeInOut" },
  { t: 6.58, v: 5.2, ease: "linear" },
  { t: 9.0, v: 0, ease: "linear" },
];

const TRACK_W0_OPACITY: Keyframe[] = [
  { t: 0.0, v: 0 },
  { t: 2.66, v: 0, ease: "linear" },
  { t: 2.86, v: 1, ease: "easeOut" },
  { t: 3.78, v: 1, ease: "linear" },
  { t: 4.32, v: 0.82, ease: "easeInOut" },
  { t: 6.24, v: 0.82, ease: "linear" },
  { t: 6.58, v: 0, ease: "easeIn" },
  { t: 9.0, v: 0, ease: "linear" },
];

// Word 1 ("HOW"): Crisp foreground plane entering from left, overlapping blurred "HELLO"
const TRACK_W1_X: Keyframe[] = [
  { t: 0.0, v: -90 },
  { t: 3.8, v: -90, ease: "linear" },
  { t: 4.32, v: -13, ease: "expoOut" },
  { t: 4.8, v: -8, ease: "linear" },
  { t: 5.22, v: -92, ease: "easeIn" },
  { t: 9.0, v: -92, ease: "linear" },
];

const TRACK_W1_OPACITY: Keyframe[] = [
  { t: 0.0, v: 0 },
  { t: 3.8, v: 0, ease: "linear" },
  { t: 3.98, v: 1, ease: "easeOut" },
  { t: 4.86, v: 1, ease: "linear" },
  { t: 5.2, v: 0, ease: "easeIn" },
  { t: 9.0, v: 0, ease: "linear" },
];

// Word 2 ("ARE"): Crisp foreground plane sweeping in from right while blurred "HELLO" sits top-left
const TRACK_W2_X: Keyframe[] = [
  { t: 0.0, v: 92 },
  { t: 5.18, v: 92, ease: "linear" },
  { t: 5.72, v: 18, ease: "expoOut" },
  { t: 6.12, v: 22, ease: "linear" },
  { t: 6.52, v: 96, ease: "easeIn" },
  { t: 9.0, v: 96, ease: "linear" },
];

const TRACK_W2_OPACITY: Keyframe[] = [
  { t: 0.0, v: 0 },
  { t: 5.18, v: 0, ease: "linear" },
  { t: 5.36, v: 1, ease: "easeOut" },
  { t: 6.18, v: 1, ease: "linear" },
  { t: 6.5, v: 0, ease: "easeIn" },
  { t: 9.0, v: 0, ease: "linear" },
];

// Word 3 ("YOU"): Physically behind the character head (z-10) so it rises from behind the head sphere
const TRACK_W3_Y: Keyframe[] = [
  { t: 0.0, v: 46 },
  { t: 6.5, v: 46, ease: "linear" },
  { t: 6.94, v: 8.5, ease: "expoOut" },
  { t: 8.12, v: 8.5, ease: "linear" },
  { t: 8.68, v: -20, ease: "easeIn" },
  { t: 9.0, v: -20, ease: "linear" },
];

const TRACK_W3_SCALE: Keyframe[] = [
  { t: 0.0, v: 0.8 },
  { t: 6.5, v: 0.8, ease: "linear" },
  { t: 6.94, v: 1.0, ease: "expoOut" },
  { t: 9.0, v: 1.0, ease: "linear" },
];

const TRACK_W3_OPACITY: Keyframe[] = [
  { t: 0.0, v: 0 },
  { t: 6.5, v: 0, ease: "linear" },
  { t: 6.64, v: 1, ease: "easeOut" },
  { t: 8.38, v: 1, ease: "linear" },
  { t: 8.68, v: 0, ease: "easeIn" },
  { t: 9.0, v: 0, ease: "linear" },
];

const JUMP_TIMESTAMPS = [2.72, 3.92, 5.32, 6.56, 0.0];
const DEFAULT_PHRASES = ["HELLO", "HOW", "ARE", "YOU"];

function parsePhrases(input?: string | string[]): string[] {
  if (!input) return DEFAULT_PHRASES;
  const raw = Array.isArray(input) ? input : input.split(",");
  const cleaned = raw
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 4);
  if (cleaned.length === 0) return DEFAULT_PHRASES;
  while (cleaned.length < 4) {
    cleaned.push(DEFAULT_PHRASES[cleaned.length]);
  }
  return cleaned;
}

const ReactiveGradientCharacter = React.forwardRef<
  HTMLDivElement,
  ReactiveGradientCharacterProps
>(function ReactiveGradientCharacter(
  {
    phrases = "HELLO, HOW, ARE, YOU",
    palette = "crimson",
    autoPlay = true,
    interactive = true,
    speed = 1,
    ariaLabel = "Reactive gradient character animation",
    className,
    style,
    onClick,
    onKeyDown,
    ...rest
  },
  ref
) {
  const prefersReducedMotion = useReducedMotion();
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, "");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const timelineTimeRef = useRef<number>(autoPlay ? 0 : 2.1);
  const manualBlinkUntilRef = useRef<number>(0);

  const safeSpeed =
    typeof speed === "number" && Number.isFinite(speed)
      ? Math.min(2, Math.max(0.5, speed))
      : 1;

  const tokens = PALETTES[palette] ?? PALETTES.crimson;
  const words = useMemo(() => parsePhrases(phrases), [phrases]);

  const [announcedWord, setAnnouncedWord] = useState<string>(words[0]);
  const [nodTick, setNodTick] = useState<number>(0);

  // Zero-rerender 60fps choreography motion values
  const bgDim = useMotionValue(0);
  const charX = useMotionValue(0);
  const charY = useMotionValue(0);
  const charScale = useMotionValue(1);
  const eyeX = useMotionValue(0);
  const eyeY = useMotionValue(0);
  const eyeScaleY = useMotionValue(1);

  const w0X = useMotionValue(0);
  const w0Y = useMotionValue(-20);
  const w0Scale = useMotionValue(1);
  const w0Blur = useMotionValue(0);
  const w0Opacity = useMotionValue(0);

  const w1X = useMotionValue(-90);
  const w1Opacity = useMotionValue(0);

  const w2X = useMotionValue(92);
  const w2Opacity = useMotionValue(0);

  const w3Y = useMotionValue(46);
  const w3Scale = useMotionValue(0.8);
  const w3Opacity = useMotionValue(0);

  // Derived GPU transform/filter templates
  const charTransform = useMotionTemplate`translate3d(${charX}%, ${charY}%, 0) scale(${charScale})`;
  const ambientTransform = useMotionTemplate`translate3d(${charX}%, 0, 0)`;
  const w0Transform = useMotionTemplate`translate3d(${w0X}%, ${w0Y}%, 0) scale(${w0Scale})`;
  const w0Filter = useMotionTemplate`blur(${w0Blur}px)`;
  const w1Transform = useMotionTemplate`translate3d(${w1X}%, 0, 0)`;
  const w2Transform = useMotionTemplate`translate3d(${w2X}%, 0, 0)`;
  const w3Transform = useMotionTemplate`translate3d(0, ${w3Y}%, 0) scale(${w3Scale})`;

  // Zero-rerender pointer tracking springs
  const rawPointerX = useMotionValue(0);
  const rawPointerY = useMotionValue(0);
  const springEyeX = useSpring(rawPointerX, {
    stiffness: 240,
    damping: 26,
    mass: 0.6,
  });
  const springEyeY = useSpring(rawPointerY, {
    stiffness: 240,
    damping: 26,
    mass: 0.6,
  });

  const rawHeadX = useMotionValue(0);
  const rawHeadY = useMotionValue(0);
  const springHeadX = useSpring(rawHeadX, {
    stiffness: 160,
    damping: 24,
    mass: 0.8,
  });
  const springHeadY = useSpring(rawHeadY, {
    stiffness: 160,
    damping: 24,
    mass: 0.8,
  });

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref]
  );

  // Apply a single timestamp cleanly to all motion tracks
  const applyTimelineSample = useCallback(
    (t: number, forceBlink: boolean) => {
      bgDim.set(sampleTrack(TRACK_BG_DIM, t));
      charX.set(sampleTrack(TRACK_CHAR_X, t));
      charY.set(sampleTrack(TRACK_CHAR_Y, t));
      charScale.set(sampleTrack(TRACK_CHAR_SCALE, t));
      eyeX.set(sampleTrack(TRACK_EYE_X, t));
      eyeY.set(sampleTrack(TRACK_EYE_Y, t));
      eyeScaleY.set(forceBlink ? 0.08 : sampleTrack(TRACK_EYE_SCALE_Y, t));

      w0X.set(sampleTrack(TRACK_W0_X, t));
      w0Y.set(sampleTrack(TRACK_W0_Y, t));
      w0Scale.set(sampleTrack(TRACK_W0_SCALE, t));
      w0Blur.set(sampleTrack(TRACK_W0_BLUR, t));
      w0Opacity.set(sampleTrack(TRACK_W0_OPACITY, t));

      w1X.set(sampleTrack(TRACK_W1_X, t));
      w1Opacity.set(sampleTrack(TRACK_W1_OPACITY, t));

      w2X.set(sampleTrack(TRACK_W2_X, t));
      w2Opacity.set(sampleTrack(TRACK_W2_OPACITY, t));

      w3Y.set(sampleTrack(TRACK_W3_Y, t));
      w3Scale.set(sampleTrack(TRACK_W3_SCALE, t));
      w3Opacity.set(sampleTrack(TRACK_W3_OPACITY, t));
    },
    [
      bgDim,
      charX,
      charY,
      charScale,
      eyeX,
      eyeY,
      eyeScaleY,
      w0X,
      w0Y,
      w0Scale,
      w0Blur,
      w0Opacity,
      w1X,
      w1Opacity,
      w2X,
      w2Opacity,
      w3Y,
      w3Scale,
      w3Opacity,
    ]
  );

  // Continuous 60fps animation driver
  useEffect(() => {
    if (prefersReducedMotion) {
      applyTimelineSample(3.35, false); // Static centered "HELLO" frame
      setAnnouncedWord(words[0]);
      return;
    }

    if (!autoPlay) {
      applyTimelineSample(2.0, false); // Centered idle pose ready for cursor tracking
      return;
    }

    let rafId = 0;
    let lastFrameTime = performance.now();
    let lastWordBucket = -1;

    const tick = (now: number) => {
      const dt = Math.min(0.08, (now - lastFrameTime) / 1000);
      lastFrameTime = now;

      const nextT = (timelineTimeRef.current + dt * safeSpeed) % LOOP_DURATION;
      timelineTimeRef.current = nextT;

      const isManualBlinking = now < manualBlinkUntilRef.current;
      applyTimelineSample(nextT, isManualBlinking);

      // Update screen-reader live region only when the active word changes
      const bucket =
        nextT >= 6.55 && nextT < 8.55
          ? 3
          : nextT >= 5.2 && nextT < 6.45
            ? 2
            : nextT >= 3.85 && nextT < 5.15
              ? 1
              : nextT >= 2.7 && nextT < 3.85
                ? 0
                : -1;

      if (bucket !== lastWordBucket) {
        lastWordBucket = bucket;
        if (bucket >= 0) {
          setAnnouncedWord(words[bucket]);
        }
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [autoPlay, prefersReducedMotion, safeSpeed, words, applyTimelineSample]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!interactive || prefersReducedMotion || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const nx = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
      const ny = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1));

      rawPointerX.set(nx * 24);
      rawPointerY.set(ny * 14);
      rawHeadX.set(nx * 12);
      rawHeadY.set(ny * 8);
    },
    [interactive, prefersReducedMotion, rawPointerX, rawPointerY, rawHeadX, rawHeadY]
  );

  const handlePointerLeave = useCallback(() => {
    rawPointerX.set(0);
    rawPointerY.set(0);
    rawHeadX.set(0);
    rawHeadY.set(0);
  }, [rawPointerX, rawPointerY, rawHeadX, rawHeadY]);

  const triggerReaction = useCallback(() => {
    if (!interactive || prefersReducedMotion) return;

    manualBlinkUntilRef.current = performance.now() + 160;
    setNodTick((n) => n + 1);

    if (!autoPlay) {
      eyeScaleY.set(0.08);
      window.setTimeout(() => {
        eyeScaleY.set(0.94);
      }, 160);
      return;
    }

    // Jump smoothly to the next greeting beat on click
    const currentT = timelineTimeRef.current;
    const nextJump =
      JUMP_TIMESTAMPS.find((ts) => ts > currentT + 0.15) ?? JUMP_TIMESTAMPS[0];
    timelineTimeRef.current = nextJump;
  }, [interactive, prefersReducedMotion, autoPlay, eyeScaleY]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      triggerReaction();
      onClick?.(e);
    },
    [triggerReaction, onClick]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (interactive && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        triggerReaction();
      }
      onKeyDown?.(e);
    },
    [interactive, triggerReaction, onKeyDown]
  );

  return (
    <div
      ref={setRefs}
      role={interactive ? "button" : "region"}
      tabIndex={interactive ? 0 : undefined}
      aria-label={ariaLabel}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative w-full max-w-[380px] aspect-[4/5] overflow-hidden rounded-[28px] select-none",
        "shadow-[0_24px_60px_-16px_rgba(0,0,0,0.55)] ring-1 ring-white/10",
        interactive &&
          "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        className
      )}
      style={{
        containerType: "inline-size",
        background: `radial-gradient(circle at 50% 58%, ${tokens.bgCenter} 0%, ${tokens.bgEdge} 88%)`,
        fontFamily:
          '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',
        ...style,
      }}
      {...rest}
    >
      {/* Screen-reader live announcement */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {announcedWord}
      </span>

      {/* Layer 0: Ambient crimson aura */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          transform: ambientTransform,
          background: `radial-gradient(circle at 50% 62%, ${tokens.ambientGlow} 0%, transparent 62%)`,
        }}
      />

      {/* Layer 1 (Back Z-Plane, behind character head): "HELLO" + "YOU" */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      >
        {/* Word 0 ("HELLO"): Enters sharp, then rack-focuses & pans continuously behind HOW and ARE */}
        <motion.div
          className="absolute inset-x-0 top-0 flex justify-center font-bold uppercase leading-none tracking-[-0.02em] text-white will-change-transform"
          style={{
            height: "100%",
            alignItems: "flex-start",
            fontSize: "clamp(2.25rem, 15.8cqi, 4.1rem)",
            textShadow: tokens.textGlow,
            transform: w0Transform,
            filter: w0Filter,
            opacity: w0Opacity,
          }}
        >
          {words[0]}
        </motion.div>

        {/* Word 3 ("YOU"): Emerges upward from behind the character's head sphere */}
        <motion.div
          className="absolute inset-x-0 top-0 flex justify-center font-bold uppercase leading-none tracking-[-0.025em] text-white will-change-transform"
          style={{
            height: "100%",
            alignItems: "flex-start",
            fontSize: "clamp(2.55rem, 18.8cqi, 4.85rem)",
            textShadow: tokens.textGlow,
            transform: w3Transform,
            opacity: w3Opacity,
          }}
        >
          {words[3]}
        </motion.div>
      </div>

      {/* Layer 2 (Mid Z-Plane): Reactive Metallic Gradient Character */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center will-change-transform"
        style={{ transform: charTransform }}
      >
        <svg
          viewBox="0 0 720 900"
          className="h-full w-full overflow-visible"
        >
          <defs>
            <linearGradient
              id={`${uid}-head-grad`}
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor={tokens.headStops[0]} />
              <stop offset="38%" stopColor={tokens.headStops[1]} />
              <stop offset="74%" stopColor={tokens.headStops[2]} />
              <stop offset="100%" stopColor={tokens.headStops[3]} />
            </linearGradient>

            <linearGradient
              id={`${uid}-body-grad`}
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor={tokens.bodyStops[0]} />
              <stop offset="36%" stopColor={tokens.bodyStops[1]} />
              <stop offset="74%" stopColor={tokens.bodyStops[2]} />
              <stop offset="100%" stopColor={tokens.bodyStops[3]} />
            </linearGradient>

            <filter
              id={`${uid}-rim-glow`}
              x="-35%"
              y="-35%"
              width="170%"
              height="170%"
            >
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="18"
                floodColor={tokens.rimGlow}
                floodOpacity="0.7"
              />
            </filter>

            <filter
              id={`${uid}-eye-glow`}
              x="-60%"
              y="-60%"
              width="220%"
              height="220%"
            >
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="5.5"
                floodColor="#ffffff"
                floodOpacity="0.76"
              />
            </filter>
          </defs>

          {/* Torso / Shoulders Dome */}
          <motion.g
            style={
              interactive && !prefersReducedMotion
                ? { x: springHeadX, y: springHeadY }
                : undefined
            }
            animate={prefersReducedMotion ? undefined : { y: [0, -3.5, 0] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <circle
              cx="360"
              cy="898"
              r="276"
              fill={`url(#${uid}-body-grad)`}
              stroke={tokens.rimStroke}
              strokeWidth="4"
              strokeOpacity="0.92"
              filter={`url(#${uid}-rim-glow)`}
            />
          </motion.g>

          {/* Head Sphere + Expressive Eyes */}
          <motion.g
            key={nodTick}
            style={
              interactive && !prefersReducedMotion
                ? { x: springHeadX, y: springHeadY }
                : undefined
            }
            initial={nodTick > 0 ? { y: 0 } : false}
            animate={
              prefersReducedMotion
                ? undefined
                : nodTick > 0
                  ? { y: [0, 8, -3, 0] }
                  : { y: [0, -5.5, 0] }
            }
            transition={
              nodTick > 0
                ? { duration: 0.34, ease: [0.22, 1, 0.36, 1] }
                : { duration: 3.1, repeat: Infinity, ease: "easeInOut" }
            }
          >
            <circle
              cx="360"
              cy="472"
              r="102"
              fill={`url(#${uid}-head-grad)`}
              stroke={tokens.rimStroke}
              strokeWidth="3.5"
              strokeOpacity="0.92"
              filter={`url(#${uid}-rim-glow)`}
            />

            {/* Pointer-reactive eye layer */}
            <motion.g
              style={
                interactive && !prefersReducedMotion
                  ? { x: springEyeX, y: springEyeY }
                  : undefined
              }
            >
              {/* Choreography eye gaze & blink layer */}
              <motion.g
                style={{ x: eyeX, y: eyeY }}
                filter={`url(#${uid}-eye-glow)`}
              >
                <motion.rect
                  x="325"
                  y="428"
                  width="25"
                  height="48"
                  rx="12.5"
                  fill="#ffffff"
                  style={{
                    scaleY: eyeScaleY,
                    transformOrigin: "337.5px 452px",
                  }}
                />
                <motion.rect
                  x="370"
                  y="428"
                  width="25"
                  height="48"
                  rx="12.5"
                  fill="#ffffff"
                  style={{
                    scaleY: eyeScaleY,
                    transformOrigin: "382.5px 452px",
                  }}
                />
              </motion.g>
            </motion.g>
          </motion.g>
        </svg>
      </motion.div>

      {/* Layer 3 (Front Z-Plane): Crisp foreground words "HOW" & "ARE" overlapping blurred "HELLO" */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
      >
        <motion.div
          className="absolute inset-x-0 top-[23%] flex justify-center font-bold uppercase leading-none tracking-[-0.025em] text-white will-change-transform"
          style={{
            fontSize: "clamp(2.65rem, 19.2cqi, 4.95rem)",
            textShadow: tokens.textGlow,
            transform: w1Transform,
            opacity: w1Opacity,
          }}
        >
          {words[1]}
        </motion.div>

        <motion.div
          className="absolute inset-x-0 top-[27%] flex justify-center font-bold uppercase leading-none tracking-[-0.025em] text-white will-change-transform"
          style={{
            fontSize: "clamp(2.7rem, 19.6cqi, 5.1rem)",
            textShadow: tokens.textGlow,
            transform: w2Transform,
            opacity: w2Opacity,
          }}
        >
          {words[2]}
        </motion.div>
      </div>

      {/* Layer 4: Entrance/exit dark atmospheric fade */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-40"
        style={{
          backgroundColor: tokens.bgDark,
          opacity: bgDim,
        }}
      />

      {/* Subtle top-edge specular vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-50 rounded-[28px] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
      />
    </div>
  );
});

ReactiveGradientCharacter.displayName = "ReactiveGradientCharacter";

export {
  ReactiveGradientCharacter,
  ReactiveGradientCharacter as component,
  ReactiveGradientCharacter as Component,
};
export default ReactiveGradientCharacter;