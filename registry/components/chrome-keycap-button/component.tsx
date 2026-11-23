"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, useReducedMotion } from "framer-motion";

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
  /** Text rendered in the 5x7 dot-matrix legend (e.g. "SPACE", "ENTER", "PLAY") */
  label?: string;
  /** Proportional hardware size preset preserving the 1.59:1 keycap geometry */
  size?: ChromeKeycapSize;
  /** Anodized metal & chrome surface finish */
  finish?: ChromeKeycapFinish;
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
  },
};

const FINISH_TOKENS: Record<
  ChromeKeycapFinish,
  {
    bezelConic: string;
    outerRimColor: string;
    seamBorder: string;
    capGradient: string;
    capHighlight: string;
    dotColor: string;
    dotPressedColor: string;
    dotSpecular: string;
  }
> = {
  silver: {
    bezelConic:
      "conic-gradient(from 0deg at 50% 50%, #101116 0deg, #1b1d24 28deg, #686c77 54deg, #ececef 76deg, #ffffff 94deg, #f3f3f5 112deg, #ffffff 134deg, #c6c7cb 152deg, #3c3d42 168deg, #2e2f34 182deg, #43444a 196deg, #b8bac0 214deg, #f5f5f7 228deg, #8b909c 244deg, #595f6d 270deg, #4f5462 296deg, #252832 328deg, #101116 360deg)",
    outerRimColor:
      "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(232,233,238,0.82) 48%, rgba(250,250,252,0.92) 100%)",
    seamBorder:
      "linear-gradient(180deg, #c5c6cc 0%, #31333e 14%, #1c1d24 55%, #050507 100%)",
    capGradient:
      "linear-gradient(96deg, #797c84 0%, #878a92 34%, #9b9da4 68%, #b0b1b5 100%)",
    capHighlight:
      "inset 0 2px 2.5px rgba(255,255,255,0.48), inset 1px 0 1.5px rgba(255,255,255,0.22), inset -1.5px 0 2px rgba(255,255,255,0.44), inset 0 -2px 3.5px rgba(15,16,22,0.34)",
    dotColor: "#2d2e33",
    dotPressedColor: "#17181c",
    dotSpecular: "rgba(255,255,255,0.32)",
  },
  graphite: {
    bezelConic:
      "conic-gradient(from 0deg at 50% 50%, #090a0d 0deg, #13151b 32deg, #3b3f4a 58deg, #a7acb7 82deg, #d7dbe2 96deg, #8f94a0 118deg, #cfd3dc 136deg, #585c67 156deg, #1e2026 176deg, #15161b 192deg, #6b707c 218deg, #b5bac4 232deg, #494e5a 250deg, #2f333d 276deg, #252831 304deg, #12141a 332deg, #090a0d 360deg)",
    outerRimColor:
      "linear-gradient(135deg, rgba(215,220,230,0.65) 0%, rgba(92,96,108,0.55) 50%, rgba(190,196,208,0.7) 100%)",
    seamBorder:
      "linear-gradient(180deg, #5e626e 0%, #1b1d24 18%, #0e0f14 60%, #020203 100%)",
    capGradient:
      "linear-gradient(96deg, #2e3138 0%, #393d46 38%, #474c56 72%, #555b66 100%)",
    capHighlight:
      "inset 0 2px 2.5px rgba(255,255,255,0.24), inset 1px 0 1.5px rgba(255,255,255,0.12), inset -1.5px 0 2px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.62)",
    dotColor: "#d8dce4",
    dotPressedColor: "#ffffff",
    dotSpecular: "rgba(0,0,0,0.45)",
  },
  champagne: {
    bezelConic:
      "conic-gradient(from 0deg at 50% 50%, #1d1a16 0deg, #2b2620 28deg, #7e7365 56deg, #efe7da 78deg, #fffcf6 95deg, #f2eadc 114deg, #fffdf8 134deg, #cabda9 152deg, #4b4339 170deg, #39322a 186deg, #574e43 200deg, #cfc2ae 216deg, #f7f0e4 230deg, #988b7b 246deg, #695f52 272deg, #5c5347 298deg, #2d2822 328deg, #1d1a16 360deg)",
    outerRimColor:
      "linear-gradient(135deg, rgba(255,251,242,0.94) 0%, rgba(226,216,200,0.82) 50%, rgba(255,250,240,0.9) 100%)",
    seamBorder:
      "linear-gradient(180deg, #d0c6b8 0%, #3e372f 16%, #24201b 58%, #0a0806 100%)",
    capGradient:
      "linear-gradient(96deg, #8e8579 0%, #9d9487 36%, #b0a799 70%, #c1b8aa 100%)",
    capHighlight:
      "inset 0 2px 2.5px rgba(255,251,242,0.52), inset 1px 0 1.5px rgba(255,250,240,0.24), inset -1.5px 0 2px rgba(255,250,240,0.45), inset 0 -2px 3.5px rgba(32,26,18,0.34)",
    dotColor: "#332e28",
    dotPressedColor: "#1b1713",
    dotSpecular: "rgba(255,250,240,0.35)",
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
}

const DotMatrixLegend: React.FC<DotMatrixLegendProps> = ({
  text,
  maxWidth,
  height,
  dotColor,
  dotSpecular,
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
      className="select-none pointer-events-none transition-colors duration-100"
    >
      {dots.map((dot, index) => (
        <g key={index}>
          <circle
            cx={dot.cx + 0.25}
            cy={dot.cy + 0.35}
            r={dotRadius}
            fill={dotSpecular}
          />
          <circle
            cx={dot.cx}
            cy={dot.cy}
            r={dotRadius}
            fill={dotColor}
          />
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

  const metrics = SIZE_TOKENS[size] ?? SIZE_TOKENS.md;
  const palette = FINISH_TOKENS[finish] ?? FINISH_TOKENS.silver;

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

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-label={ariaLabel || label}
      aria-pressed={isPressed}
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
        "focus-visible:ring-2 focus-visible:ring-zinc-900/60 dark:focus-visible:ring-white/70 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...rest}
    >
      {/* Ground ambient bounce + directional cast shadow */}
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
            ? "shadow-[-4px_-4px_14px_rgba(255,255,255,0.45),0_7px_16px_-3px_rgba(0,0,0,0.28),0_2px_6px_rgba(0,0,0,0.22)] dark:shadow-[0_6px_14px_-2px_rgba(0,0,0,0.75)]"
            : "shadow-[-10px_-10px_26px_rgba(255,255,255,0.68),0_18px_36px_-6px_rgba(0,0,0,0.28),0_7px_14px_-2px_rgba(0,0,0,0.22)] dark:shadow-[0_20px_42px_-8px_rgba(0,0,0,0.85),0_8px_18px_-3px_rgba(0,0,0,0.65)]"
        )}
      />

      {/* Crisp 1.5px outer bright chrome chamfer lip */}
      <span
        aria-hidden="true"
        style={{
          borderRadius: metrics.outerRadius,
          background: palette.outerRimColor,
          padding: 1.5,
        }}
        className="relative flex h-full w-full items-center justify-center"
      >
        {/* Polished chrome bezel housing */}
        <span
          aria-hidden="true"
          style={{
            borderRadius: metrics.outerRadius - 1.5,
            backgroundImage: palette.bezelConic,
            padding: metrics.bezelPadding,
          }}
          className="relative flex h-full w-full items-center justify-center overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1.5px_rgba(0,0,0,0.35)]"
        >
          {/* Subtle diagonal chrome reflection polish overlay */}
          <span
            aria-hidden="true"
            style={{
              borderRadius: metrics.outerRadius - 1.5,
              background:
                "linear-gradient(128deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 36%, rgba(255,255,255,0) 62%, rgba(255,255,255,0.22) 100%)",
            }}
            className="pointer-events-none absolute inset-0"
          />

          {/* Recessed machined precision groove / seam */}
          <span
            aria-hidden="true"
            style={{
              borderRadius: metrics.grooveRadius,
              background: palette.seamBorder,
              padding: 2,
            }}
            className="relative flex h-full w-full items-center justify-center shadow-[0_1px_1.5px_rgba(255,255,255,0.38)]"
          >
            {/* Floating bead-blasted anodized aluminum keycap face */}
            <motion.span
              animate={{
                y: isPressed ? metrics.pressDepth : 0,
                scale: isPressed ? 0.986 : 1,
              }}
              transition={springTransition}
              style={{
                borderRadius: metrics.capRadius,
                backgroundImage: palette.capGradient,
                boxShadow: isPressed
                  ? "inset 0 2px 6px rgba(0,0,0,0.42), inset 0 -1px 1.5px rgba(255,255,255,0.22)"
                  : palette.capHighlight,
              }}
              className="relative flex h-full w-full items-center justify-center overflow-hidden"
            >
              {/* Fine bead-blasted anodized aluminum micro-grain texture */}
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.09] mix-blend-overlay"
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

              {/* Subtle top-left to bottom-right matte sheen */}
              <span
                aria-hidden="true"
                style={{
                  borderRadius: metrics.capRadius,
                  background:
                    "radial-gradient(120% 90% at 88% 45%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 62%)",
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