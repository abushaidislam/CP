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
  AnimatePresence,
  motion,
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
  /** Runs the 9-second kinetic typography & camera-pan loop automatically. */
  autoPlay?: boolean;
  /** Enables pointer eye-tracking, subtle head parallax, and click-to-blink/advance. */
  interactive?: boolean;
  /** Playback speed multiplier for the choreography timeline (0.5 to 2.0). */
  speed?: number;
  /** Accessible label describing the character stage. */
  ariaLabel?: string;
}

interface PaletteTokens {
  bgCenter: string;
  bgEdge: string;
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
    ambientGlow: "rgba(185, 28, 28, 0.34)",
    rimGlow: "#c93434",
    rimStroke: "#f4eded",
    headStops: ["#3c3c3c", "#6c6c6c", "#9c9c9c", "#d8d8d8"],
    bodyStops: ["#343434", "#646464", "#adadad", "#f2f2f2"],
    textGlow: "0 0 24px rgba(255, 255, 255, 0.48), 0 2px 12px rgba(70, 0, 0, 0.65)",
  },
  midnight: {
    bgCenter: "#07142b",
    bgEdge: "#030a18",
    ambientGlow: "rgba(59, 130, 246, 0.28)",
    rimGlow: "#3b82f6",
    rimStroke: "#e8f1ff",
    headStops: ["#333b4a", "#5f6c82", "#95a3ba", "#dce4f0"],
    bodyStops: ["#29303d", "#55637a", "#9aa9c2", "#eef4ff"],
    textGlow: "0 0 24px rgba(191, 219, 254, 0.5), 0 2px 12px rgba(3, 10, 24, 0.7)",
  },
  emerald: {
    bgCenter: "#04261c",
    bgEdge: "#021610",
    ambientGlow: "rgba(16, 185, 129, 0.26)",
    rimGlow: "#10b981",
    rimStroke: "#e6faf3",
    headStops: ["#31403b", "#5c736b", "#92aba2", "#d8e8e2"],
    bodyStops: ["#26332e", "#50665e", "#95b0a6", "#edf7f3"],
    textGlow: "0 0 24px rgba(167, 243, 208, 0.48), 0 2px 12px rgba(2, 22, 16, 0.7)",
  },
  violet: {
    bgCenter: "#220a3d",
    bgEdge: "#140526",
    ambientGlow: "rgba(168, 85, 247, 0.3)",
    rimGlow: "#a855f7",
    rimStroke: "#f3e8ff",
    headStops: ["#3b3347", "#6b5f7d", "#a093b5", "#e0d8ed"],
    bodyStops: ["#2f283a", "#5d5270", "#a294ba", "#f2ecfa"],
    textGlow: "0 0 24px rgba(233, 213, 255, 0.5), 0 2px 12px rgba(20, 5, 38, 0.7)",
  },
  obsidian: {
    bgCenter: "#141416",
    bgEdge: "#09090b",
    ambientGlow: "rgba(255, 255, 255, 0.14)",
    rimGlow: "#a1a1aa",
    rimStroke: "#fafafa",
    headStops: ["#333336", "#636369", "#9b9ba3", "#dedee3"],
    bodyStops: ["#29292c", "#59595f", "#a3a3ab", "#f4f4f5"],
    textGlow: "0 0 24px rgba(255, 255, 255, 0.42), 0 2px 12px rgba(0, 0, 0, 0.75)",
  },
};

type BeatId =
  | "enter"
  | "blink"
  | "glanceRight"
  | "centerIdle"
  | "word0"
  | "word1"
  | "word2"
  | "word3"
  | "exit";

interface BeatSpec {
  id: BeatId;
  durationMs: number;
  charX: number;
  charY: number;
  charScale: number;
  eyeX: number;
  eyeY: number;
  eyeScaleY: number;
  activeWordIndex: number | null;
  echoWordVisible: boolean;
  echoAlign: "right" | "left";
}

const TIMELINE: BeatSpec[] = [
  {
    id: "enter",
    durationMs: 650,
    charX: 0,
    charY: 0,
    charScale: 1,
    eyeX: 0,
    eyeY: 0,
    eyeScaleY: 1,
    activeWordIndex: null,
    echoWordVisible: false,
    echoAlign: "right",
  },
  {
    id: "blink",
    durationMs: 280,
    charX: 0,
    charY: 0,
    charScale: 1,
    eyeX: 20,
    eyeY: -2,
    eyeScaleY: 0.12,
    activeWordIndex: null,
    echoWordVisible: false,
    echoAlign: "right",
  },
  {
    id: "glanceRight",
    durationMs: 620,
    charX: 4,
    charY: 0,
    charScale: 1,
    eyeX: 42,
    eyeY: -4,
    eyeScaleY: 1,
    activeWordIndex: null,
    echoWordVisible: false,
    echoAlign: "right",
  },
  {
    id: "centerIdle",
    durationMs: 950,
    charX: 0,
    charY: 0,
    charScale: 1,
    eyeX: 0,
    eyeY: 0,
    eyeScaleY: 1,
    activeWordIndex: null,
    echoWordVisible: false,
    echoAlign: "right",
  },
  {
    id: "word0",
    durationMs: 1300,
    charX: 0,
    charY: 36,
    charScale: 1.03,
    eyeX: 0,
    eyeY: -4,
    eyeScaleY: 1.14,
    activeWordIndex: 0,
    echoWordVisible: false,
    echoAlign: "right",
  },
  {
    id: "word1",
    durationMs: 1150,
    charX: 145,
    charY: 64,
    charScale: 1.12,
    eyeX: -12,
    eyeY: -6,
    eyeScaleY: 1.14,
    activeWordIndex: 1,
    echoWordVisible: true,
    echoAlign: "right",
  },
  {
    id: "word2",
    durationMs: 1250,
    charX: -155,
    charY: 68,
    charScale: 1.14,
    eyeX: 22,
    eyeY: -4,
    eyeScaleY: 1.16,
    activeWordIndex: 2,
    echoWordVisible: true,
    echoAlign: "left",
  },
  {
    id: "word3",
    durationMs: 1850,
    charX: 0,
    charY: 56,
    charScale: 1.2,
    eyeX: 0,
    eyeY: -2,
    eyeScaleY: 1.18,
    activeWordIndex: 3,
    echoWordVisible: false,
    echoAlign: "left",
  },
  {
    id: "exit",
    durationMs: 950,
    charX: 0,
    charY: 290,
    charScale: 0.74,
    eyeX: 0,
    eyeY: 0,
    eyeScaleY: 0.96,
    activeWordIndex: null,
    echoWordVisible: false,
    echoAlign: "left",
  },
];

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
  const blinkTimerRef = useRef<number | null>(null);

  const safeSpeed =
    typeof speed === "number" && Number.isFinite(speed)
      ? Math.min(2, Math.max(0.5, speed))
      : 1;

  const tokens = PALETTES[palette] ?? PALETTES.crimson;
  const words = useMemo(() => parsePhrases(phrases), [phrases]);

  const [beatIndex, setBeatIndex] = useState<number>(autoPlay ? 0 : 3);
  const [manualBlink, setManualBlink] = useState(false);
  const [nodTick, setNodTick] = useState(0);

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

  // Merge forwarded ref and local container ref
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

  // Choreography loop
  useEffect(() => {
    if (prefersReducedMotion) {
      setBeatIndex(4); // Static "HELLO" centered frame
      return;
    }

    if (!autoPlay) {
      setBeatIndex(3); // Centered idle pose ready for pointer tracking
      return;
    }

    const currentBeat = TIMELINE[beatIndex] ?? TIMELINE[0];
    const delay = Math.max(120, currentBeat.durationMs / safeSpeed);

    const timer = window.setTimeout(() => {
      setBeatIndex((prev) => (prev + 1) % TIMELINE.length);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [autoPlay, beatIndex, safeSpeed, prefersReducedMotion]);

  // Clean up manual blink timer on unmount
  useEffect(() => {
    return () => {
      if (blinkTimerRef.current !== null) {
        window.clearTimeout(blinkTimerRef.current);
      }
    };
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!interactive || prefersReducedMotion || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1; // -1..1
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1; // -1..1

      const clampedX = Math.max(-1, Math.min(1, nx));
      const clampedY = Math.max(-1, Math.min(1, ny));

      rawPointerX.set(clampedX * 26);
      rawPointerY.set(clampedY * 16);
      rawHeadX.set(clampedX * 14);
      rawHeadY.set(clampedY * 10);
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
    if (!interactive) return;

    if (!prefersReducedMotion) {
      setManualBlink(true);
      setNodTick((n) => n + 1);
      if (blinkTimerRef.current !== null) {
        window.clearTimeout(blinkTimerRef.current);
      }
      blinkTimerRef.current = window.setTimeout(() => {
        setManualBlink(false);
      }, 170);
    }

    if (autoPlay && !prefersReducedMotion) {
      setBeatIndex((prev) => {
        if (prev < 4) return 4;
        if (prev >= 7) return 0;
        return prev + 1;
      });
    }
  }, [interactive, autoPlay, prefersReducedMotion]);

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

  const beat = TIMELINE[beatIndex] ?? TIMELINE[3];
  const activeWord =
    beat.activeWordIndex !== null ? words[beat.activeWordIndex] : null;
  const effectiveEyeScaleY = manualBlink ? 0.1 : beat.eyeScaleY;

  const transitionDuration = prefersReducedMotion
    ? 0
    : Math.max(0.24, 0.52 / safeSpeed);

  // Word layout positioning matching the reference camera-pan choreography
  const wordLayout = useMemo(() => {
    switch (beat.activeWordIndex) {
      case 0:
        return {
          initial: { opacity: 0, y: -56, x: 0, scale: 0.96 },
          animate: { opacity: 1, y: 0, x: 0, scale: 1 },
          exit: { opacity: 0, y: -12, scale: 0.92 },
          alignClass: "top-[12%] inset-x-0 justify-center",
          fontSize: "clamp(2.25rem, 11cqi, 3.85rem)",
        };
      case 1:
        return {
          initial: { opacity: 0, x: -72, y: 12, scale: 0.94 },
          animate: { opacity: 1, x: 0, y: 0, scale: 1 },
          exit: { opacity: 0, x: -96, scale: 0.94 },
          alignClass: "top-[24%] left-[7%] justify-start",
          fontSize: "clamp(2.5rem, 12.5cqi, 4.35rem)",
        };
      case 2:
        return {
          initial: { opacity: 0, x: 84, y: 8, scale: 0.94 },
          animate: { opacity: 1, x: 0, y: 0, scale: 1 },
          exit: { opacity: 0, x: 96, scale: 0.94 },
          alignClass: "top-[28%] right-[6%] justify-end",
          fontSize: "clamp(2.65rem, 13cqi, 4.5rem)",
        };
      case 3:
        return {
          initial: { opacity: 0, y: -42, x: 0, scale: 0.94 },
          animate: { opacity: 1, y: 0, x: 0, scale: 1.04 },
          exit: { opacity: 0, y: -78, scale: 0.98 },
          alignClass: "top-[10%] inset-x-0 justify-center",
          fontSize: "clamp(2.5rem, 12.5cqi, 4.25rem)",
        };
      default:
        return null;
    }
  }, [beat.activeWordIndex]);

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
      {/* Subtle ambient depth glow behind character */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        animate={{
          opacity: beat.id === "exit" ? 0.35 : 0.95,
          x: beat.charX * 0.22,
          y: beat.charY * 0.12,
        }}
        transition={{
          duration: transitionDuration,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{
          background: `radial-gradient(circle at 50% 62%, ${tokens.ambientGlow} 0%, transparent 62%)`,
        }}
      />

      {/* Depth-of-field blurred background echo word ("HELLO") during camera pans */}
      <AnimatePresence>
        {beat.echoWordVisible && !prefersReducedMotion && (
          <motion.div
            key={`echo-${beat.echoAlign}`}
            aria-hidden="true"
            initial={{
              opacity: 0,
              x: beat.echoAlign === "right" ? 18 : -18,
              scale: 0.9,
            }}
            animate={{
              opacity: 0.72,
              x: 0,
              scale: 0.88,
            }}
            exit={{
              opacity: 0,
              scale: 0.84,
            }}
            transition={{
              duration: transitionDuration,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={cn(
              "pointer-events-none absolute top-[15%] z-10 flex w-full font-extrabold uppercase tracking-[-0.02em] text-white/95",
              beat.echoAlign === "right"
                ? "justify-end pr-0 translate-x-[12%]"
                : "justify-start pl-0 -translate-x-[14%]"
            )}
            style={{
              fontSize: "clamp(2.1rem, 10.5cqi, 3.6rem)",
              filter: "blur(5.5px)",
              textShadow: tokens.textGlow,
            }}
          >
            {words[0]}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Foreground crisp kinetic typography */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none absolute inset-0 z-20"
      >
        <AnimatePresence mode="wait">
          {activeWord && wordLayout && (
            <motion.div
              key={`word-${beat.activeWordIndex}-${activeWord}`}
              initial={prefersReducedMotion ? false : wordLayout.initial}
              animate={wordLayout.animate}
              exit={prefersReducedMotion ? { opacity: 0 } : wordLayout.exit}
              transition={{
                duration: prefersReducedMotion ? 0 : Math.max(0.24, 0.42 / safeSpeed),
                ease: [0.16, 1, 0.3, 1],
              }}
              className={cn(
                "absolute flex items-center font-extrabold uppercase leading-none tracking-[-0.025em] text-white",
                wordLayout.alignClass
              )}
              style={{
                fontSize: wordLayout.fontSize,
                textShadow: tokens.textGlow,
              }}
            >
              {activeWord}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Reactive Gradient Character SVG Stage */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
        initial={
          prefersReducedMotion || !autoPlay
            ? false
            : { y: 240, scale: 0.72, opacity: 0.9 }
        }
        animate={{
          x: `${(beat.charX / 720) * 100}%`,
          y: `${(beat.charY / 900) * 100}%`,
          scale: beat.charScale,
          opacity: 1,
        }}
        transition={{
          duration:
            beat.id === "enter"
              ? Math.max(0.32, 0.62 / safeSpeed)
              : transitionDuration,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <svg
          viewBox="0 0 720 900"
          className="h-full w-full overflow-visible"
          aria-hidden="true"
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
                floodOpacity="0.68"
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
                floodOpacity="0.72"
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
            animate={
              prefersReducedMotion
                ? undefined
                : { y: [0, -3.5, 0] }
            }
            transition={{
              duration: 3.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <circle
              cx="360"
              cy="898"
              r="276"
              fill={`url(#${uid}-body-grad)`}
              stroke={tokens.rimStroke}
              strokeWidth="4"
              strokeOpacity="0.9"
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
                  : { y: [0, -6, 0] }
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
              strokeOpacity="0.9"
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
                animate={{
                  x: beat.eyeX,
                  y: beat.eyeY,
                }}
                transition={{
                  duration: prefersReducedMotion
                    ? 0
                    : Math.max(0.16, 0.32 / safeSpeed),
                  ease: [0.22, 1, 0.36, 1],
                }}
                filter={`url(#${uid}-eye-glow)`}
              >
                {/* Left Eye */}
                <motion.rect
                  x="325"
                  y="428"
                  width="25"
                  height="48"
                  rx="12.5"
                  fill="#ffffff"
                  animate={{ scaleY: effectiveEyeScaleY }}
                  transition={{
                    duration: manualBlink ? 0.08 : 0.14,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{ transformOrigin: "337.5px 452px" }}
                />

                {/* Right Eye */}
                <motion.rect
                  x="370"
                  y="428"
                  width="25"
                  height="48"
                  rx="12.5"
                  fill="#ffffff"
                  animate={{ scaleY: effectiveEyeScaleY }}
                  transition={{
                    duration: manualBlink ? 0.08 : 0.14,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{ transformOrigin: "382.5px 452px" }}
                />
              </motion.g>
            </motion.g>
          </motion.g>
        </svg>
      </motion.div>

      {/* Subtle top-edge specular vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[28px] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
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