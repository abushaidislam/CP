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

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type ChromeKeycapSize = "sm" | "md" | "lg";
export type ChromeKeycapFinish = "silver" | "graphite" | "champagne";

export interface ChromeKeycapButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "children" | "onClick"
  > {
  /** Text rendered in the 5x7 dot-matrix legend (e.g. "SPACE", "SEND", "ENTER") */
  label?: string;
  /** Proportional hardware size preset preserving the 1.59:1 keycap geometry */
  size?: ChromeKeycapSize;
  /** Glassmorphic anodized metal & chrome finish */
  finish?: ChromeKeycapFinish;
  /** Full 360-degree orbital glow rotation duration in seconds (0 pauses orbit) */
  orbitSpeed?: number;
  /** Enables synthesized Web Audio tactile mechanical switch feedback on press/release */
  soundEnabled?: boolean;
  /** When true, pressing the physical Spacebar actuates the keycap live */
  bindSpacebar?: boolean;
  /** Optional click/actuation handler triggered by pointer click or Spacebar press */
  onClick?: (event?: React.MouseEvent<HTMLButtonElement> | KeyboardEvent) => void;
  /** Optional callback fired whenever pressed state transitions */
  onPressChange?: (pressed: boolean) => void;
}

/**
 * Authentic 5x7 dot-matrix bitmap font matching industrial laser-perforated keycap legends.
 * Each string represents one row of 5 columns ("1" = dot, "0" = empty).
 */
const DOT_MATRIX_FONT: Record<string, readonly string[]> = {
  A: ["00100", "01010", "10001", "10001", "11111", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01110"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01110", "10001", "10000", "01110", "00001", "10001", "01110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["01110", "10001", "00001", "00110", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["01110", "10000", "11110", "10001", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  ">": ["01000", "00100", "00010", "00001", "00010", "00100", "01000"],
  "<": ["00010", "00100", "01000", "10000", "01000", "00100", "00010"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
};

const SIZE_TOKENS: Record<
  ChromeKeycapSize,
  {
    width: number;
    height: number;
    outerRadius: number;
    bezelPadding: number;
    grooveRadius: number;
    capRadius: number;
    legendMaxWidth: number;
    legendHeight: number;
    pressDepth: number;
    orbitDiameter: number;
  }
> = {
  sm: {
    width: 192,
    height: 120,
    outerRadius: 34,
    bezelPadding: 8,
    grooveRadius: 27,
    capRadius: 25,
    legendMaxWidth: 132,
    legendHeight: 26,
    pressDepth: 2,
    orbitDiameter: 320,
  },
  md: {
    width: 252,
    height: 158,
    outerRadius: 44,
    bezelPadding: 11,
    grooveRadius: 34,
    capRadius: 32,
    legendMaxWidth: 168,
    legendHeight: 33,
    pressDepth: 2.5,
    orbitDiameter: 420,
  },
  lg: {
    width: 312,
    height: 196,
    outerRadius: 54,
    bezelPadding: 13,
    grooveRadius: 42,
    capRadius: 40,
    legendMaxWidth: 210,
    legendHeight: 40,
    pressDepth: 3,
    orbitDiameter: 520,
  },
};

const FINISH_TOKENS: Record<
  ChromeKeycapFinish,
  {
    haloConic: string;
    rimOrbitConic: string;
    bezelOrbitConic: string;
    bezelGlassTint: string;
    seamBorder: string;
    capGlassGradient: string;
    capHighlight: string;
    spotlightColor: string;
    dotColor: string;
    dotPressedColor: string;
    dotSpecular: string;
    dotGlow: string;
  }
> = {
  silver: {
    haloConic:
      "conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0) 0deg, rgba(226,236,255,0.68) 46deg, rgba(255,255,255,0.92) 72deg, rgba(186,214,255,0.22) 115deg, rgba(255,255,255,0) 175deg, rgba(210,224,250,0.52) 225deg, rgba(255,255,255,0.78) 252deg, rgba(255,255,255,0) 310deg, rgba(255,255,255,0) 360deg)",
    rimOrbitConic:
      "conic-gradient(from 0deg at 50% 50%, rgba(160,168,184,0.38) 0deg, rgba(255,255,255,0.98) 58deg, rgba(224,238,255,0.92) 86deg, rgba(95,102,118,0.42) 142deg, rgba(24,26,32,0.75) 182deg, rgba(220,232,250,0.88) 236deg, rgba(255,255,255,0.98) 264deg, rgba(120,126,140,0.4) 320deg, rgba(160,168,184,0.38) 360deg)",
    bezelOrbitConic:
      "conic-gradient(from 0deg at 50% 50%, rgba(18,20,26,0.86) 0deg, rgba(46,50,62,0.72) 28deg, rgba(165,174,190,0.74) 52deg, rgba(242,247,255,0.95) 74deg, rgba(255,255,255,1) 92deg, rgba(218,228,242,0.84) 118deg, rgba(120,126,140,0.68) 148deg, rgba(22,24,30,0.9) 180deg, rgba(58,62,74,0.74) 208deg, rgba(214,224,240,0.86) 236deg, rgba(255,255,255,0.96) 258deg, rgba(132,140,156,0.7) 290deg, rgba(36,40,50,0.8) 328deg, rgba(18,20,26,0.86) 360deg)",
    bezelGlassTint: "rgba(235, 240, 248, 0.14)",
    seamBorder:
      "linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(56,60,72,0.78) 16%, rgba(16,18,24,0.92) 56%, rgba(4,5,8,0.96) 100%)",
    capGlassGradient:
      "linear-gradient(108deg, rgba(138,142,152,0.78) 0%, rgba(162,166,176,0.72) 38%, rgba(188,192,200,0.74) 72%, rgba(214,218,224,0.82) 100%)",
    capHighlight:
      "inset 0 1.5px 2px rgba(255,255,255,0.68), inset 1px 0 1.5px rgba(255,255,255,0.28), inset -1.5px 0 2px rgba(255,255,255,0.48), inset 0 -2.5px 4px rgba(12,14,20,0.34)",
    spotlightColor: "rgba(255, 255, 255, 0.34)",
    dotColor: "#22242a",
    dotPressedColor: "#0e1014",
    dotSpecular: "rgba(255,255,255,0.42)",
    dotGlow: "rgba(255,255,255,0.28)",
  },
  graphite: {
    haloConic:
      "conic-gradient(from 0deg at 50% 50%, rgba(120,165,255,0) 0deg, rgba(148,190,255,0.58) 52deg, rgba(235,244,255,0.88) 78deg, rgba(120,165,255,0.18) 124deg, rgba(120,165,255,0) 180deg, rgba(165,198,255,0.44) 232deg, rgba(240,247,255,0.72) 258deg, rgba(120,165,255,0) 316deg, rgba(120,165,255,0) 360deg)",
    rimOrbitConic:
      "conic-gradient(from 0deg at 50% 50%, rgba(62,68,82,0.45) 0deg, rgba(210,226,255,0.92) 60deg, rgba(255,255,255,0.98) 84deg, rgba(54,60,72,0.42) 144deg, rgba(10,12,16,0.85) 184deg, rgba(178,200,238,0.82) 238deg, rgba(242,248,255,0.95) 264deg, rgba(48,52,64,0.42) 322deg, rgba(62,68,82,0.45) 360deg)",
    bezelOrbitConic:
      "conic-gradient(from 0deg at 50% 50%, rgba(9,10,14,0.92) 0deg, rgba(24,27,36,0.82) 32deg, rgba(84,94,114,0.78) 56deg, rgba(202,216,240,0.94) 78deg, rgba(248,251,255,0.98) 94deg, rgba(114,124,144,0.76) 124deg, rgba(26,29,38,0.86) 158deg, rgba(8,9,13,0.94) 186deg, rgba(64,72,88,0.76) 218deg, rgba(186,202,228,0.88) 244deg, rgba(235,243,255,0.94) 262deg, rgba(68,74,88,0.76) 296deg, rgba(18,20,26,0.88) 332deg, rgba(9,10,14,0.92) 360deg)",
    bezelGlassTint: "rgba(22, 26, 36, 0.34)",
    seamBorder:
      "linear-gradient(180deg, rgba(190,206,232,0.42) 0%, rgba(30,34,44,0.86) 18%, rgba(10,12,16,0.95) 60%, rgba(2,3,5,0.98) 100%)",
    capGlassGradient:
      "linear-gradient(108deg, rgba(36,40,50,0.74) 0%, rgba(48,53,66,0.68) 42%, rgba(62,68,82,0.68) 76%, rgba(80,88,104,0.74) 100%)",
    capHighlight:
      "inset 0 1.5px 2px rgba(255,255,255,0.34), inset 1px 0 1.5px rgba(255,255,255,0.14), inset -1.5px 0 2px rgba(255,255,255,0.22), inset 0 -2.5px 5px rgba(0,0,0,0.68)",
    spotlightColor: "rgba(195, 220, 255, 0.22)",
    dotColor: "#e4eaf6",
    dotPressedColor: "#ffffff",
    dotSpecular: "rgba(0,0,0,0.52)",
    dotGlow: "rgba(180,214,255,0.55)",
  },
  champagne: {
    haloConic:
      "conic-gradient(from 0deg at 50% 50%, rgba(255,235,200,0) 0deg, rgba(255,228,184,0.62) 48deg, rgba(255,250,240,0.92) 74deg, rgba(240,210,165,0.22) 118deg, rgba(255,235,200,0) 176deg, rgba(246,222,184,0.5) 228deg, rgba(255,248,236,0.78) 254deg, rgba(255,235,200,0) 312deg, rgba(255,235,200,0) 360deg)",
    rimOrbitConic:
      "conic-gradient(from 0deg at 50% 50%, rgba(168,154,134,0.4) 0deg, rgba(255,250,238,0.98) 58deg, rgba(255,236,205,0.9) 86deg, rgba(96,86,74,0.44) 144deg, rgba(28,24,20,0.78) 182deg, rgba(244,228,202,0.88) 238deg, rgba(255,252,244,0.98) 264deg, rgba(128,116,100,0.42) 320deg, rgba(168,154,134,0.4) 360deg)",
    bezelOrbitConic:
      "conic-gradient(from 0deg at 50% 50%, rgba(26,22,18,0.86) 0deg, rgba(58,50,42,0.74) 28deg, rgba(178,162,140,0.76) 54deg, rgba(250,240,224,0.95) 76deg, rgba(255,252,245,1) 94deg, rgba(226,210,186,0.84) 120deg, rgba(126,114,98,0.7) 150deg, rgba(30,25,20,0.9) 182deg, rgba(72,62,52,0.74) 210deg, rgba(224,208,184,0.86) 238deg, rgba(255,250,240,0.96) 260deg, rgba(140,126,108,0.72) 292deg, rgba(44,38,32,0.82) 328deg, rgba(26,22,18,0.86) 360deg)",
    bezelGlassTint: "rgba(248, 236, 218, 0.14)",
    seamBorder:
      "linear-gradient(180deg, rgba(255,248,236,0.72) 0%, rgba(68,58,48,0.8) 16%, rgba(24,20,16,0.92) 56%, rgba(8,6,4,0.96) 100%)",
    capGlassGradient:
      "linear-gradient(108deg, rgba(154,144,130,0.78) 0%, rgba(176,166,152,0.72) 38%, rgba(202,192,178,0.74) 72%, rgba(226,216,202,0.82) 100%)",
    capHighlight:
      "inset 0 1.5px 2px rgba(255,250,240,0.68), inset 1px 0 1.5px rgba(255,248,236,0.28), inset -1.5px 0 2px rgba(255,248,236,0.48), inset 0 -2.5px 4px rgba(28,22,16,0.34)",
    spotlightColor: "rgba(255, 246, 230, 0.34)",
    dotColor: "#2c2620",
    dotPressedColor: "#14110e",
    dotSpecular: "rgba(255,248,236,0.42)",
    dotGlow: "rgba(255,236,204,0.32)",
  },
};

function playMechanicalClick(
  ctxRef: React.MutableRefObject<AudioContext | null>,
  phase: "down" | "up"
): void {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    if (!ctxRef.current) {
      ctxRef.current = new AudioCtx();
    }
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const now = ctx.currentTime;
    const duration = phase === "down" ? 0.028 : 0.022;

    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.exp(-i / (bufferSize * 0.24));
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(phase === "down" ? 1650 : 2100, now);
    filter.Q.setValueAtTime(1.8, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(phase === "down" ? 0.14 : 0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + duration);

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(phase === "down" ? 210 : 280, now);
    osc.frequency.exponentialRampToValueAtTime(68, now + duration);
    oscGain.gain.setValueAtTime(phase === "down" ? 0.09 : 0.045, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  } catch {
    // Ignore audio errors when blocked by autoplay policies
  }
}

interface DotMatrixLegendProps {
  text: string;
  maxWidth: number;
  height: number;
  dotColor: string;
  dotSpecular: string;
  dotGlow: string;
  isHighlighted: boolean;
}

const DotMatrixLegend: React.FC<DotMatrixLegendProps> = ({
  text,
  maxWidth,
  height,
  dotColor,
  dotSpecular,
  dotGlow,
  isHighlighted,
}) => {
  const { dots, viewWidth, viewHeight, dotRadius } = useMemo(() => {
    const normalized = (text || "SPACE").toUpperCase().slice(0, 14);
    const chars = Array.from(normalized);
    const pitch = 5;
    const charCols = 5;
    const charGapCols = 1.6;
    const rows = 7;

    const points: Array<{ cx: number; cy: number }> = [];
    let cursorX = 0;

    chars.forEach((ch, idx) => {
      const glyph = DOT_MATRIX_FONT[ch] ?? DOT_MATRIX_FONT[" "];
      for (let r = 0; r < rows; r++) {
        const rowStr = glyph[r] || "00000";
        for (let c = 0; c < charCols; c++) {
          if (rowStr[c] === "1") {
            points.push({
              cx: (cursorX + c + 0.5) * pitch,
              cy: (r + 0.5) * pitch,
            });
          }
        }
      }
      cursorX += charCols + (idx < chars.length - 1 ? charGapCols : 0);
    });

    return {
      dots: points,
      viewWidth: Math.max(cursorX * pitch, pitch * 5),
      viewHeight: rows * pitch,
      dotRadius: 1.62,
    };
  }, [text]);

  const aspectRatio = viewWidth / viewHeight;
  const computedWidth = Math.min(maxWidth, height * aspectRatio);
  const computedHeight = computedWidth / aspectRatio;

  return (
    <svg
      width={computedWidth}
      height={computedHeight}
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      fill="none"
      aria-hidden="true"
      style={{
        filter: isHighlighted ? `drop-shadow(0 0 6px ${dotGlow})` : "none",
      }}
      className="select-none pointer-events-none transition-[filter] duration-200"
    >
      {dots.map((dot, index) => (
        <g key={index}>
          <circle
            cx={dot.cx + 0.25}
            cy={dot.cy + 0.35}
            r={dotRadius}
            fill={dotSpecular}
          />
          <circle cx={dot.cx} cy={dot.cy} r={dotRadius} fill={dotColor} />
        </g>
      ))}
    </svg>
  );
};

export const ChromeKeycapButton = React.forwardRef<
  HTMLButtonElement,
  ChromeKeycapButtonProps
>(function ChromeKeycapButton(
  {
    label = "SPACE",
    size = "md",
    finish = "silver",
    orbitSpeed = 6,
    soundEnabled = true,
    bindSpacebar = true,
    disabled = false,
    className,
    onClick,
    onPressChange,
    type = "button",
    "aria-label": ariaLabel,
    ...rest
  },
  ref
) {
  const prefersReducedMotion = useReducedMotion();
  const rawId = useId();
  const safeId = rawId.replace(/:/g, "");
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const metrics = SIZE_TOKENS[size] ?? SIZE_TOKENS.md;
  const palette = FINISH_TOKENS[finish] ?? FINISH_TOKENS.silver;
  const clampedOrbitSpeed =
    typeof orbitSpeed === "number" && Number.isFinite(orbitSpeed)
      ? Math.max(0, Math.min(30, orbitSpeed))
      : 6;
  const shouldOrbit = !prefersReducedMotion && clampedOrbitSpeed > 0;

  // Zero-rerender pointer-tracking glass spotlight
  const pointerX = useMotionValue(metrics.width * 0.72);
  const pointerY = useMotionValue(metrics.height * 0.32);
  const smoothX = useSpring(pointerX, { stiffness: 260, damping: 28, mass: 0.4 });
  const smoothY = useSpring(pointerY, { stiffness: 260, damping: 28, mass: 0.4 });
  const glassSpotlight = useMotionTemplate`radial-gradient(140px circle at ${smoothX}px ${smoothY}px, ${palette.spotlightColor}, transparent 72%)`;

  const setPressedState = useCallback(
    (next: boolean, triggerSound: boolean) => {
      setIsPressed((prev) => {
        if (prev === next) return prev;
        if (triggerSound && soundEnabled) {
          playMechanicalClick(audioCtxRef, next ? "down" : "up");
        }
        onPressChange?.(next);
        return next;
      });
    },
    [onPressChange, soundEnabled]
  );

  useEffect(() => {
    if (!bindSpacebar || disabled) return;

    const isEditableTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target.isContentEditable
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat) return;
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      setPressedState(true, true);
      onClick?.(event);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      setPressedState(false, true);
    };

    const handleBlur = () => {
      setPressedState(false, false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [bindSpacebar, disabled, onClick, setPressedState]);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        void audioCtxRef.current.close();
      }
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    pointerX.set(e.clientX - rect.left);
    pointerY.set(e.clientY - rect.top);
    rest.onPointerMove?.(e);
  };

  const handlePointerEnter = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!disabled) setIsHovered(true);
    rest.onPointerEnter?.(e);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled || e.button !== 0) return;
    setPressedState(true, true);
    rest.onPointerDown?.(e);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled) return;
    setPressedState(false, true);
    rest.onPointerUp?.(e);
  };

  const handlePointerLeave = (e: React.PointerEvent<HTMLButtonElement>) => {
    setIsHovered(false);
    if (isPressed) {
      setPressedState(false, false);
    }
    rest.onPointerLeave?.(e);
  };

  const handleButtonKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === "Enter" || (!bindSpacebar && e.key === " ")) {
      if (!e.repeat) {
        setPressedState(true, true);
      }
    }
    rest.onKeyDown?.(e);
  };

  const handleButtonKeyUp = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === "Enter" || (!bindSpacebar && e.key === " ")) {
      setPressedState(false, true);
    }
    rest.onKeyUp?.(e);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    onClick?.(e);
  };

  const springTransition = prefersReducedMotion
    ? { duration: 0.05 }
    : { type: "spring" as const, stiffness: 620, damping: 34, mass: 0.55 };

  const orbitAnimation = shouldOrbit ? { rotate: 360 } : { rotate: 0 };
  const orbitTransition = shouldOrbit
    ? { repeat: Infinity, ease: "linear" as const, duration: clampedOrbitSpeed }
    : { duration: 0 };

  const halfOrbit = metrics.orbitDiameter / 2;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-label={ariaLabel || label}
      aria-pressed={isPressed}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={() => setPressedState(false, false)}
      onKeyDown={handleButtonKeyDown}
      onKeyUp={handleButtonKeyUp}
      onClick={handleClick}
      style={{
        width: metrics.width,
        height: metrics.height,
        borderRadius: metrics.outerRadius,
      }}
      className={cn(
        "group relative inline-flex items-center justify-center p-0 border-0 bg-transparent outline-none select-none cursor-pointer touch-manipulation",
        "focus-visible:ring-2 focus-visible:ring-zinc-900/60 dark:focus-visible:ring-white/75 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...rest}
    >
      {/* Synchronized orbiting ambient luminous glow around the rounded perimeter */}
      <motion.span
        aria-hidden="true"
        animate={{
          opacity: isPressed ? 0.32 : isHovered ? 0.68 : 0.44,
          scale: isPressed ? 0.96 : isHovered ? 1.035 : 1,
        }}
        transition={springTransition}
        style={{ borderRadius: metrics.outerRadius + 4 }}
        className="pointer-events-none absolute -inset-1.5 overflow-hidden blur-xl"
      >
        <motion.span
          aria-hidden="true"
          animate={orbitAnimation}
          transition={orbitTransition}
          style={{
            width: metrics.orbitDiameter,
            height: metrics.orbitDiameter,
            left: "50%",
            top: "50%",
            marginLeft: -halfOrbit,
            marginTop: -halfOrbit,
            backgroundImage: palette.haloConic,
          }}
          className="absolute block will-change-transform"
        />
      </motion.span>

      {/* Ground ambient shadow + tactile compression */}
      <motion.span
        aria-hidden="true"
        animate={{
          opacity: isPressed ? 0.72 : 1,
          scale: isPressed ? 0.985 : 1,
        }}
        transition={springTransition}
        style={{ borderRadius: metrics.outerRadius }}
        className={cn(
          "pointer-events-none absolute inset-0 transition-shadow duration-150",
          isPressed
            ? "shadow-[-4px_-4px_14px_rgba(255,255,255,0.35),0_7px_16px_-3px_rgba(0,0,0,0.3),0_2px_6px_rgba(0,0,0,0.22)] dark:shadow-[0_8px_18px_-3px_rgba(0,0,0,0.82)]"
            : "shadow-[-8px_-8px_24px_rgba(255,255,255,0.52),0_18px_38px_-6px_rgba(0,0,0,0.28),0_7px_14px_-2px_rgba(0,0,0,0.22)] dark:shadow-[0_22px_46px_-8px_rgba(0,0,0,0.9),0_8px_20px_-3px_rgba(0,0,0,0.7)]"
        )}
      />

      {/* Crisp 1.5px rotating specular glass outer rim */}
      <span
        aria-hidden="true"
        style={{
          borderRadius: metrics.outerRadius,
          padding: 1.5,
        }}
        className="relative flex h-full w-full items-center justify-center overflow-hidden"
      >
        <motion.span
          aria-hidden="true"
          animate={orbitAnimation}
          transition={orbitTransition}
          style={{
            width: metrics.orbitDiameter,
            height: metrics.orbitDiameter,
            left: "50%",
            top: "50%",
            marginLeft: -halfOrbit,
            marginTop: -halfOrbit,
            backgroundImage: palette.rimOrbitConic,
          }}
          className="pointer-events-none absolute block will-change-transform"
        />

        {/* Rotating liquid-chrome & frosted glass bezel housing */}
        <span
          aria-hidden="true"
          style={{
            borderRadius: metrics.outerRadius - 1.5,
            padding: metrics.bezelPadding,
            backgroundColor: palette.bezelGlassTint,
          }}
          className="relative flex h-full w-full items-center justify-center overflow-hidden backdrop-blur-xl shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.52),inset_0_-1px_2px_rgba(0,0,0,0.38)]"
        >
          {/* Orbiting dark-chrome + luminous glass reflection band inside bezel */}
          <motion.span
            aria-hidden="true"
            animate={orbitAnimation}
            transition={orbitTransition}
            style={{
              width: metrics.orbitDiameter,
              height: metrics.orbitDiameter,
              left: "50%",
              top: "50%",
              marginLeft: -halfOrbit,
              marginTop: -halfOrbit,
              backgroundImage: palette.bezelOrbitConic,
            }}
            className="pointer-events-none absolute block will-change-transform"
          />

          {/* Soft frosted glass diffusion veil over the orbiting chrome ring */}
          <span
            aria-hidden="true"
            style={{
              borderRadius: metrics.outerRadius - 1.5,
              background:
                "linear-gradient(140deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.03) 42%, rgba(0,0,0,0.08) 72%, rgba(255,255,255,0.2) 100%)",
            }}
            className="pointer-events-none absolute inset-0"
          />

          {/* Recessed machined precision groove / glass seam */}
          <span
            aria-hidden="true"
            style={{
              borderRadius: metrics.grooveRadius,
              background: palette.seamBorder,
              padding: 2,
            }}
            className="relative z-10 flex h-full w-full items-center justify-center shadow-[0_1px_2px_rgba(255,255,255,0.36)]"
          >
            {/* Floating frosted-glass anodized keycap face */}
            <motion.span
              animate={{
                y: isPressed ? metrics.pressDepth : 0,
                scale: isPressed ? 0.986 : 1,
              }}
              transition={springTransition}
              style={{
                borderRadius: metrics.capRadius,
                backgroundImage: palette.capGlassGradient,
                boxShadow: isPressed
                  ? "inset 0 2px 7px rgba(0,0,0,0.46), inset 0 -1px 1.5px rgba(255,255,255,0.24)"
                  : palette.capHighlight,
              }}
              className="relative flex h-full w-full items-center justify-center overflow-hidden backdrop-blur-xl"
            >
              {/* Fine bead-blasted frosted glass micro-grain texture */}
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08] mix-blend-overlay"
              >
                <filter id={`grain-${safeId}`}>
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.88"
                    numOctaves="2"
                    stitchTiles="stitch"
                  />
                  <feColorMatrix type="saturate" values="0" />
                </filter>
                <rect
                  width="100%"
                  height="100%"
                  filter={`url(#grain-${safeId})`}
                />
              </svg>

              {/* Interactive pointer-tracking glass refraction sheen */}
              <motion.span
                aria-hidden="true"
                animate={{ opacity: isHovered ? 1 : 0.45 }}
                transition={{ duration: 0.25 }}
                style={{
                  borderRadius: metrics.capRadius,
                  backgroundImage: glassSpotlight,
                }}
                className="pointer-events-none absolute inset-0"
              />

              {/* Crisp upper glass refraction specular arc */}
              <span
                aria-hidden="true"
                style={{
                  borderRadius: metrics.capRadius,
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.04) 24%, rgba(255,255,255,0) 54%, rgba(0,0,0,0.08) 100%)",
                }}
                className="pointer-events-none absolute inset-0"
              />

              {/* Laser-etched 5x7 dot-matrix legend */}
              <span className="relative z-10 flex items-center justify-center">
                <DotMatrixLegend
                  text={label}
                  maxWidth={metrics.legendMaxWidth}
                  height={metrics.legendHeight}
                  dotColor={isPressed ? palette.dotPressedColor : palette.dotColor}
                  dotSpecular={palette.dotSpecular}
                  dotGlow={palette.dotGlow}
                  isHighlighted={isHovered || isPressed}
                />
              </span>
            </motion.span>
          </span>
        </span>
      </span>

      <span className="sr-only">{label}</span>
    </button>
  );
});

ChromeKeycapButton.displayName = "ChromeKeycapButton";

export { ChromeKeycapButton as component, ChromeKeycapButton as Component };
export default ChromeKeycapButton;
