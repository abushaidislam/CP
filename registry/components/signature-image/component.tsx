"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type AnimationPlaybackControls,
} from "framer-motion";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type AnimatedSignatureTheme = "auto" | "dark" | "light";

export interface AnimatedSignatureProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Custom SVG path `d` attribute for the handwritten signature. */
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

const THEME_TEXT_CLASSES: Record<AnimatedSignatureTheme, string> = {
  auto: "text-neutral-900 dark:text-[#fdfdfe]",
  dark: "text-[#fdfdfe]",
  light: "text-neutral-900",
};

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
      path = DEFAULT_SIGNATURE_PATH,
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
      ariaLabel = "Animated handwritten signature",
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

    const prefersReducedMotion = useReducedMotion();
    const pathRef = useRef<SVGPathElement | null>(null);
    const activeAnimationsRef = useRef<AnimationPlaybackControls[]>([]);
    const loopTimerRef = useRef<number | null>(null);
    const runIdRef = useRef<number>(0);

    const [pathLength, setPathLength] = useState<number>(0);
    const [isDrawing, setIsDrawing] = useState<boolean>(false);

    const dashOffset = useMotionValue<number>(9999);
    const penX = useMotionValue<number>(0);
    const penY = useMotionValue<number>(0);
    const penLiftX = useMotionValue<number>(0);
    const penLiftY = useMotionValue<number>(0);
    const penOpacity = useMotionValue<number>(0);

    const safeDuration =
      Number.isFinite(duration) && duration > 0 ? Math.min(Math.max(duration, 0.3), 12) : 2.0;
    const safeStrokeWidth =
      Number.isFinite(strokeWidth) && strokeWidth > 0
        ? Math.min(Math.max(strokeWidth, 1), 12)
        : 3.6;
    const safeLoopDelay =
      Number.isFinite(loopDelay) && loopDelay >= 0 ? Math.min(loopDelay, 15) : 1.8;

    const clearPendingPlayback = useCallback(() => {
      activeAnimationsRef.current.forEach((ctrl) => ctrl.stop());
      activeAnimationsRef.current = [];
      if (loopTimerRef.current !== null) {
        window.clearTimeout(loopTimerRef.current);
        loopTimerRef.current = null;
      }
    }, []);

    const startDrawSequence = useCallback(async () => {
      const pathEl = pathRef.current;
      if (!pathEl) return;

      clearPendingPlayback();
      const currentRunId = ++runIdRef.current;
      const total = pathEl.getTotalLength();

      if (!Number.isFinite(total) || total <= 0) return;
      setPathLength(total);

      if (prefersReducedMotion) {
        dashOffset.set(0);
        penOpacity.set(0);
        setIsDrawing(false);
        return;
      }

      setIsDrawing(true);
      dashOffset.set(total);

      const startPt = pathEl.getPointAtLength(0);
      penX.set(startPt.x);
      penY.set(startPt.y);

      if (showPen) {
        penLiftX.set(8);
        penLiftY.set(-8);
        penOpacity.set(0);

        const enterOpacity = animate(penOpacity, 1, {
          duration: 0.14,
          ease: [0.22, 1, 0.36, 1],
        });
        const enterLiftX = animate(penLiftX, 0, {
          duration: 0.14,
          ease: [0.22, 1, 0.36, 1],
        });
        const enterLiftY = animate(penLiftY, 0, {
          duration: 0.14,
          ease: [0.22, 1, 0.36, 1],
        });
        activeAnimationsRef.current.push(enterOpacity, enterLiftX, enterLiftY);
        await enterOpacity.finished;

        if (runIdRef.current !== currentRunId) return;
      } else {
        penOpacity.set(0);
      }

      const drawAnim = animate(0, 1, {
        duration: safeDuration,
        ease: [0.37, 0, 0.63, 1],
        onUpdate: (progress) => {
          if (runIdRef.current !== currentRunId) return;
          const clamped = Math.min(Math.max(progress, 0), 1);
          const currentDist = clamped * total;
          dashOffset.set(total - currentDist);
          const pt = pathEl.getPointAtLength(currentDist);
          penX.set(pt.x);
          penY.set(pt.y);
        },
      });
      activeAnimationsRef.current.push(drawAnim);
      await drawAnim.finished;

      if (runIdRef.current !== currentRunId) return;

      dashOffset.set(0);
      const endPt = pathEl.getPointAtLength(total);
      penX.set(endPt.x);
      penY.set(endPt.y);

      if (showPen) {
        const exitOpacity = animate(penOpacity, 0, {
          duration: 0.2,
          ease: [0.4, 0, 1, 1],
        });
        const exitLiftX = animate(penLiftX, 14, {
          duration: 0.2,
          ease: [0.4, 0, 1, 1],
        });
        const exitLiftY = animate(penLiftY, -14, {
          duration: 0.2,
          ease: [0.4, 0, 1, 1],
        });
        activeAnimationsRef.current.push(exitOpacity, exitLiftX, exitLiftY);
        await exitOpacity.finished;

        if (runIdRef.current !== currentRunId) return;
      }

      setIsDrawing(false);
      onDrawComplete?.();

      if (loop) {
        loopTimerRef.current = window.setTimeout(() => {
          if (runIdRef.current === currentRunId) {
            void startDrawSequence();
          }
        }, safeLoopDelay * 1000);
      }
    }, [
      clearPendingPlayback,
      dashOffset,
      loop,
      onDrawComplete,
      penLiftX,
      penLiftY,
      penOpacity,
      penX,
      penY,
      prefersReducedMotion,
      safeDuration,
      safeLoopDelay,
      showPen,
    ]);

    useEffect(() => {
      const pathEl = pathRef.current;
      if (!pathEl) return;

      const total = pathEl.getTotalLength();
      if (Number.isFinite(total) && total > 0) {
        setPathLength(total);
      }

      if (prefersReducedMotion || !autoPlay) {
        clearPendingPlayback();
        runIdRef.current += 1;
        dashOffset.set(0);
        penOpacity.set(0);
        setIsDrawing(false);
        return;
      }

      void startDrawSequence();

      return () => {
        runIdRef.current += 1;
        clearPendingPlayback();
      };
    }, [
      autoPlay,
      clearPendingPlayback,
      dashOffset,
      path,
      penOpacity,
      prefersReducedMotion,
      startDrawSequence,
    ]);

    const handleTriggerReplay = useCallback(() => {
      if (!replayOnClick || prefersReducedMotion) return;
      void startDrawSequence();
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

    return (
      <div
        ref={ref}
        role={replayOnClick ? "button" : "img"}
        tabIndex={replayOnClick ? 0 : undefined}
        aria-label={
          replayOnClick
            ? `${ariaLabel}. Click or press Enter to replay.`
            : ariaLabel
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
          viewBox={viewBox}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-labelledby={titleId}
          className="h-auto w-full overflow-visible"
        >
          <title id={titleId}>{ariaLabel}</title>

          <motion.path
            ref={pathRef}
            d={path}
            stroke="currentColor"
            strokeWidth={safeStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={pathLength > 0 ? pathLength : 9999}
            style={{ strokeDashoffset: dashOffset }}
          />

          {showPen && !prefersReducedMotion && (
            <motion.g
              aria-hidden="true"
              className="pointer-events-none"
              style={{
                x: penX,
                y: penY,
                opacity: penOpacity,
              }}
            >
              <motion.g
                style={{
                  x: penLiftX,
                  y: penLiftY,
                }}
              >
                <PenIconGraphic strokeWidth={safeStrokeWidth} />
              </motion.g>
            </motion.g>
          )}
        </svg>
      </div>
    );
  }
);

AnimatedSignature.displayName = "AnimatedSignature";

export { AnimatedSignature as component, AnimatedSignature as Component };
export default AnimatedSignature;