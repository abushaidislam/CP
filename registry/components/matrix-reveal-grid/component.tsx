"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export interface MatrixRevealItem {
  id: string;
  name: string;
  href?: string;
  colors: string[];
  lightColors?: string[];
  renderMark: (filled: boolean, uid: string, isLight: boolean) => React.ReactNode;
}

export interface MatrixRevealGridProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  /** Custom array of partner/brand showcase cards. Defaults to 3 built-in infrastructure brands. */
  items?: MatrixRevealItem[];
  /** Color theme mode. Defaults to "auto" to follow system/Studio light & dark mode. */
  theme?: "auto" | "dark" | "light";
  /** Square dot size in pixels (2 to 6). */
  dotSize?: number;
  /** Distance between dot centers in pixels (5 to 14). */
  dotSpacing?: number;
  /** Multiplier for radial wave expansion and dot shimmer speed (0.4 to 2.5). */
  animationSpeed?: number;
  /** Show subtle extended dashed architectural guide lines along the grid boundaries. */
  showGuideLines?: boolean;
  /** Optional card index active by default (-1 for none). */
  defaultActiveIndex?: number;
  /** Callback fired when a card is clicked or activated via keyboard. */
  onSelect?: (item: MatrixRevealItem, index: number) => void;
}

function clamp(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.min(max, Math.max(min, val));
}

function fract(x: number): number {
  return x - Math.floor(x);
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1), 0, 1);
  return t * t * (3 - 2 * t);
}

const DEFAULT_ITEMS: MatrixRevealItem[] = [
  {
    id: "voltbase",
    name: "Voltbase",
    colors: ["#3ECF8E", "#24B47E", "#15803D", "#6EE7B7"],
    lightColors: ["#059669", "#10B981", "#047857", "#34D399"],
    renderMark: (filled, uid, isLight) => {
      const stroke = isLight ? "rgba(24,24,27,0.52)" : "rgba(255,255,255,0.68)";
      const gradTop = `${uid}-vb-top`;
      const gradBot = `${uid}-vb-bot`;
      return (
        <svg
          viewBox="0 0 64 64"
          className="h-14 w-14 sm:h-16 sm:w-16"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradTop} x1="14" y1="8" x2="36" y2="38" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6EE7B7" />
              <stop offset="100%" stopColor="#24B47E" />
            </linearGradient>
            <linearGradient id={gradBot} x1="28" y1="26" x2="50" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3ECF8E" />
              <stop offset="100%" stopColor="#12825A" />
            </linearGradient>
          </defs>
          {filled ? (
            <>
              <path
                d="M34.2 10.6C35.3 9.2 37.5 10 37.5 11.8V31.5H16.4C14.7 31.5 13.8 29.5 14.9 28.2L34.2 10.6Z"
                fill={`url(#${gradTop})`}
              />
              <path
                d="M29.8 53.4C28.7 54.8 26.5 54 26.5 52.2V32.5H47.6C49.3 32.5 50.2 34.5 49.1 35.8L29.8 53.4Z"
                fill={`url(#${gradBot})`}
              />
            </>
          ) : (
            <>
              <path
                d="M34.2 10.6C35.3 9.2 37.5 10 37.5 11.8V31.5H16.4C14.7 31.5 13.8 29.5 14.9 28.2L34.2 10.6Z"
                stroke={stroke}
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M29.8 53.4C28.7 54.8 26.5 54 26.5 52.2V32.5H47.6C49.3 32.5 50.2 34.5 49.1 35.8L29.8 53.4Z"
                stroke={stroke}
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </>
          )}
        </svg>
      );
    },
  },
  {
    id: "orbita",
    name: "Orbita",
    colors: ["#F59E0B", "#E11D48", "#9333EA", "#FBBF24"],
    lightColors: ["#D97706", "#E11D48", "#7E22CE", "#EA580C"],
    renderMark: (filled, _uid, isLight) => {
      const stroke = isLight ? "rgba(24,24,27,0.52)" : "rgba(255,255,255,0.68)";
      return (
        <svg
          viewBox="0 0 64 64"
          className="h-14 w-14 sm:h-16 sm:w-16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M24.2 12.1C33.4 8.7 44.1 12.1 49.6 20.4C53.6 26.5 54.2 34 51.6 40.5C49.9 32.3 44.3 25.3 36.2 22.1C32.2 20.5 28.1 20.2 24.2 20.9V12.1Z"
            fill={filled ? "#E11D48" : "none"}
            stroke={filled ? "none" : stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M50.3 43.2C44.9 51.4 34.4 55.3 24.8 52.3C17.8 50.1 12.5 44.5 10.6 37.6C16.9 42.9 25.6 45 33.8 42.2C37.9 40.8 41.3 38.2 43.8 34.9L50.3 43.2Z"
            fill={filled ? "#F5A623" : "none"}
            stroke={filled ? "none" : stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M11.1 34.8C9.8 25.1 14.9 15.6 23.7 11.9C19.6 18.8 18.9 27.6 22.7 35.1C24.5 38.7 27.3 41.5 30.7 43.4C22.4 44.4 14.3 40.9 11.1 34.8Z"
            fill={filled ? "#9333EA" : "none"}
            stroke={filled ? "none" : stroke}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    },
  },
  {
    id: "aether",
    name: "Aether",
    colors: ["#FFFFFF", "#E4E4E7", "#A1A1AA", "#71717A"],
    lightColors: ["#09090B", "#27272A", "#52525B", "#71717A"],
    renderMark: (filled, _uid, isLight) => {
      const stroke = isLight ? "rgba(24,24,27,0.52)" : "rgba(255,255,255,0.72)";
      const fill = isLight ? "#09090B" : "#FFFFFF";
      return (
        <svg
          viewBox="0 0 64 64"
          className="h-14 w-14 sm:h-16 sm:w-16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M32 11L54.5 50H9.5L32 11Z"
            fill={filled ? fill : "none"}
            stroke={filled ? "none" : stroke}
            strokeWidth="1.6"
            strokeLinejoin="miter"
          />
        </svg>
      );
    },
  },
];

interface DotRecord {
  x: number;
  y: number;
  dist: number;
  vertFade: number;
  centerMask: number;
  baseAlpha: number;
  phase: number;
  freq: number;
}

interface MatrixCanvasProps {
  active: boolean;
  colors: string[];
  dotSize: number;
  dotSpacing: number;
  animationSpeed: number;
  reducedMotion: boolean;
}

const MatrixCanvas: React.FC<MatrixCanvasProps> = ({
  active,
  colors,
  dotSize,
  dotSpacing,
  animationSpeed,
  reducedMotion,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bucketsRef = useRef<DotRecord[][]>([]);
  const sizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const activeRef = useRef<boolean>(active);
  const speedRef = useRef<number>(animationSpeed);
  const dotSizeRef = useRef<number>(dotSize);
  const colorsRef = useRef<string[]>(colors);
  const reducedRef = useRef<boolean>(reducedMotion);

  const animStateRef = useRef<{
    rafId: number | null;
    lastTime: number;
    elapsed: number;
    masterOpacity: number;
    waveProgress: number;
  }>({
    rafId: null,
    lastTime: 0,
    elapsed: 0,
    masterOpacity: active ? 1 : 0,
    waveProgress: active ? 1.4 : 0,
  });

  activeRef.current = active;
  speedRef.current = animationSpeed;
  dotSizeRef.current = dotSize;
  colorsRef.current = colors;
  reducedRef.current = reducedMotion;

  const rebuildGrid = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    sizeRef.current = { w, h };

    const pitch = clamp(dotSpacing, 5, 14);
    const cols = Math.ceil(w / pitch);
    const rows = Math.ceil(h / pitch);
    const offsetX = (w - (cols - 1) * pitch) * 0.5;
    const offsetY = (h - (rows - 1) * pitch) * 0.5;
    const cx = w * 0.5;
    const cy = h * 0.5;
    const maxDist = Math.hypot(cx, cy) || 1;
    const paletteLen = Math.max(1, colorsRef.current.length);

    const buckets: DotRecord[][] = Array.from({ length: paletteLen }, () => []);

    for (let r = 0; r < rows; r++) {
      const y = offsetY + r * pitch;
      const yNorm = y / h;
      const vertFade = Math.max(0.06, Math.pow(Math.max(0, 1 - yNorm * 0.86), 1.45));

      for (let c = 0; c < cols; c++) {
        const x = offsetX + c * pitch;
        const h1 = fract(Math.sin(c * 127.1 + r * 311.7) * 43758.5453);
        const h2 = fract(Math.sin(c * 269.5 + r * 183.3) * 43758.5453);

        const dist = Math.hypot(x - cx, y - cy) / maxDist;
        const cDist = Math.hypot((x - cx) / (w * 0.25), (y - cy * 1.04) / (h * 0.17));
        const centerMask = 0.22 + 0.78 * smoothstep(0.45, 1.35, cDist);

        const baseAlpha =
          h2 < 0.24
            ? 0.12
            : h2 < 0.52
              ? 0.28
              : h2 < 0.78
                ? 0.54
                : h2 < 0.93
                  ? 0.8
                  : 1.0;

        const colorIdx = Math.min(paletteLen - 1, Math.floor(h1 * paletteLen));
        buckets[colorIdx].push({
          x,
          y,
          dist,
          vertFade,
          centerMask,
          baseAlpha,
          phase: h2 * Math.PI * 2,
          freq: 1.3 + h1 * 2.5,
        });
      }
    }

    bucketsRef.current = buckets;
  };

  const renderFrame = (now: number) => {
    const state = animStateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) {
      state.rafId = null;
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      state.rafId = null;
      return;
    }

    const dt = state.lastTime ? Math.min(0.05, (now - state.lastTime) / 1000) : 0.016;
    state.lastTime = now;
    state.elapsed += dt;

    const isAct = activeRef.current;
    const spd = clamp(speedRef.current, 0.4, 2.5);
    const isReduced = reducedRef.current;

    if (isAct) {
      if (isReduced) {
        state.masterOpacity = 1;
        state.waveProgress = 1.4;
      } else {
        state.masterOpacity = Math.min(1, state.masterOpacity + dt * 5.2 * spd);
        state.waveProgress = Math.min(1.35, state.waveProgress + dt * 1.85 * spd);
      }
    } else {
      if (isReduced) {
        state.masterOpacity = 0;
        state.waveProgress = 0;
      } else {
        state.masterOpacity = Math.max(0, state.masterOpacity - dt * 3.4 * spd);
        if (state.masterOpacity <= 0.004) {
          state.waveProgress = 0;
        }
      }
    }

    const { w, h } = sizeRef.current;
    ctx.clearRect(0, 0, w, h);

    if (state.masterOpacity > 0.004) {
      const dSize = clamp(dotSizeRef.current, 2, 6);
      const half = dSize * 0.5;
      const palette = colorsRef.current;
      const buckets = bucketsRef.current;
      const t = state.elapsed;

      for (let b = 0; b < buckets.length; b++) {
        const list = buckets[b];
        if (!list.length) continue;
        ctx.fillStyle = palette[b] || palette[0] || "#ffffff";

        for (let i = 0; i < list.length; i++) {
          const d = list[i];
          const wave = isReduced
            ? 1
            : smoothstep(d.dist - 0.16, d.dist + 0.03, state.waveProgress);
          if (wave <= 0.01) continue;

          const twinkle = isReduced
            ? 0.85
            : 0.42 + 0.58 * (0.5 + 0.5 * Math.sin(t * d.freq * spd + d.phase));

          const alpha =
            state.masterOpacity * wave * d.baseAlpha * d.vertFade * d.centerMask * twinkle;
          if (alpha <= 0.015) continue;

          ctx.globalAlpha = alpha;
          ctx.fillRect(d.x - half, d.y - half, dSize, dSize);
        }
      }
      ctx.globalAlpha = 1;
    }

    if (isAct && !isReduced) {
      state.rafId = window.requestAnimationFrame(renderFrame);
    } else if (!isAct && state.masterOpacity > 0.004) {
      state.rafId = window.requestAnimationFrame(renderFrame);
    } else {
      state.rafId = null;
      state.lastTime = 0;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    rebuildGrid();
    const ro = new ResizeObserver(() => {
      rebuildGrid();
      if (activeRef.current || animStateRef.current.masterOpacity > 0.004) {
        renderFrame(performance.now());
      }
    });
    ro.observe(canvas);

    return () => {
      ro.disconnect();
      if (animStateRef.current.rafId !== null) {
        window.cancelAnimationFrame(animStateRef.current.rafId);
        animStateRef.current.rafId = null;
      }
    };
  }, [dotSpacing, colors.join(",")]);

  useEffect(() => {
    const state = animStateRef.current;
    if (active && state.masterOpacity < 0.05) {
      state.waveProgress = 0;
    }
    if (state.rafId === null) {
      state.lastTime = 0;
      state.rafId = window.requestAnimationFrame(renderFrame);
    }
  }, [active, dotSize, animationSpeed, reducedMotion, colors.join(",")]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
};

export const MatrixRevealGrid = React.forwardRef<HTMLDivElement, MatrixRevealGridProps>(
  (
    {
      items = DEFAULT_ITEMS,
      theme = "auto",
      dotSize = 3,
      dotSpacing = 7,
      animationSpeed = 1,
      showGuideLines = true,
      defaultActiveIndex = -1,
      onSelect,
      className,
      ...rest
    },
    ref
  ) => {
    const rawId = useId();
    const uid = rawId.replace(/:/g, "");
    const shouldReduceMotion = Boolean(useReducedMotion());

    const [activeIndex, setActiveIndex] = useState<number>(defaultActiveIndex);
    const [detectedDark, setDetectedDark] = useState<boolean>(true);

    useEffect(() => {
      setActiveIndex(defaultActiveIndex);
    }, [defaultActiveIndex]);

    useEffect(() => {
      if (theme !== "auto") return;
      const checkDark = () => {
        const html = document.documentElement;
        if (html.classList.contains("dark")) {
          setDetectedDark(true);
          return;
        }
        if (html.classList.contains("light")) {
          setDetectedDark(false);
          return;
        }
        setDetectedDark(window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true);
      };
      checkDark();
      const observer = new MutationObserver(checkDark);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
      mql?.addEventListener?.("change", checkDark);
      return () => {
        observer.disconnect();
        mql?.removeEventListener?.("change", checkDark);
      };
    }, [theme]);

    const isLight = theme === "light" || (theme === "auto" && !detectedDark);

    const surfaceClass =
      theme === "dark"
        ? "bg-[#131215] text-white"
        : theme === "light"
          ? "bg-[#FAFAFA] text-zinc-950"
          : "bg-[#FAFAFA] text-zinc-950 dark:bg-[#131215] dark:text-white";

    const borderClass =
      theme === "dark"
        ? "border-white/[0.1]"
        : theme === "light"
          ? "border-zinc-900/[0.1]"
          : "border-zinc-900/[0.1] dark:border-white/[0.1]";

    const divideClass =
      theme === "dark"
        ? "divide-white/[0.1]"
        : theme === "light"
          ? "divide-zinc-900/[0.1]"
          : "divide-zinc-900/[0.1] dark:divide-white/[0.1]";

    const guideBorderClass =
      theme === "dark"
        ? "border-white/[0.08]"
        : theme === "light"
          ? "border-zinc-900/[0.08]"
          : "border-zinc-900/[0.08] dark:border-white/[0.08]";

    const safeDotSize = clamp(dotSize, 2, 6);
    const safeDotSpacing = clamp(dotSpacing, 5, 14);
    const safeSpeed = clamp(animationSpeed, 0.4, 2.5);

    return (
      <div
        ref={ref}
        className={cn(
          "relative mx-auto w-full max-w-[1140px] select-none px-4 py-8 sm:px-6 sm:py-10",
          className
        )}
        {...rest}
      >
        {/* Architectural extended dashed guide lines */}
        {showGuideLines && (
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-x-4 inset-y-0 grid grid-cols-1 border-x border-dashed sm:inset-x-6 md:grid-cols-3",
              guideBorderClass
            )}
          >
            <div className="hidden h-full md:block" />
            <div className={cn("hidden h-full border-x border-dashed md:block", guideBorderClass)} />
            <div className="hidden h-full md:block" />
          </div>
        )}

        {/* Main 3-column showcase grid */}
        <div
          className={cn(
            "relative grid grid-cols-1 divide-y border md:grid-cols-3 md:divide-x md:divide-y-0",
            surfaceClass,
            borderClass,
            divideClass
          )}
        >
          {items.map((item, idx) => {
            const isActive = activeIndex === idx;
            const palette = isLight && item.lightColors ? item.lightColors : item.colors;

            const handleActivate = () => {
              setActiveIndex((prev) => (prev === idx ? -1 : idx));
              onSelect?.(item, idx);
            };

            const cardClassName = cn(
              "group relative flex min-h-[280px] w-full cursor-pointer flex-col items-center justify-center overflow-hidden p-8 text-center outline-none transition-colors duration-300 sm:min-h-[380px] md:min-h-[440px]",
              "focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset",
              theme === "dark"
                ? "focus-visible:ring-white/40"
                : theme === "light"
                  ? "focus-visible:ring-zinc-900/40"
                  : "focus-visible:ring-zinc-900/40 dark:focus-visible:ring-white/40"
            );

            const innerContent = (
              <>
                <MatrixCanvas
                  active={isActive}
                  colors={palette}
                  dotSize={safeDotSize}
                  dotSpacing={safeDotSpacing}
                  animationSpeed={safeSpeed}
                  reducedMotion={shouldReduceMotion}
                />

                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute inset-0 border transition-opacity duration-300",
                    theme === "dark"
                      ? "border-white/[0.14]"
                      : theme === "light"
                        ? "border-zinc-900/[0.14]"
                        : "border-zinc-900/[0.14] dark:border-white/[0.14]",
                    isActive ? "opacity-100" : "opacity-0"
                  )}
                />

                <div className="relative z-10 flex flex-col items-center justify-center">
                  <motion.div
                    className="relative flex h-16 w-16 items-center justify-center"
                    animate={{ y: isActive ? -14 : 0 }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0.01 }
                        : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }
                    }
                  >
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      animate={{ opacity: isActive ? 0 : 1 }}
                      transition={
                        shouldReduceMotion
                          ? { duration: 0.01 }
                          : { duration: 0.24, ease: "easeOut" }
                      }
                    >
                      {item.renderMark(false, `${uid}-${item.id}-o`, isLight)}
                    </motion.div>

                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      animate={{ opacity: isActive ? 1 : 0 }}
                      transition={
                        shouldReduceMotion
                          ? { duration: 0.01 }
                          : { duration: 0.26, ease: "easeOut" }
                      }
                    >
                      {item.renderMark(true, `${uid}-${item.id}-f`, isLight)}
                    </motion.div>
                  </motion.div>

                  <motion.span
                    className={cn(
                      "pointer-events-none absolute top-[62px] whitespace-nowrap text-[21px] font-semibold tracking-[-0.025em] sm:text-[23px]",
                      theme === "dark"
                        ? "text-white"
                        : theme === "light"
                          ? "text-zinc-950"
                          : "text-zinc-950 dark:text-white"
                    )}
                    initial={false}
                    animate={{
                      opacity: isActive ? 1 : 0,
                      y: isActive ? 0 : 6,
                    }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0.01 }
                        : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
                    }
                  >
                    {item.name}
                  </motion.span>
                </div>
              </>
            );

            if (item.href) {
              return (
                <a
                  key={item.id}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex((prev) => (prev === idx ? -1 : prev))}
                  onFocus={() => setActiveIndex(idx)}
                  onBlur={() => setActiveIndex((prev) => (prev === idx ? -1 : prev))}
                  onClick={() => onSelect?.(item, idx)}
                  aria-label={`${item.name} integration`}
                  className={cardClassName}
                >
                  {innerContent}
                </a>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex((prev) => (prev === idx ? -1 : prev))}
                onFocus={() => setActiveIndex(idx)}
                onBlur={() => setActiveIndex((prev) => (prev === idx ? -1 : prev))}
                onClick={handleActivate}
                aria-label={`${item.name} integration`}
                aria-pressed={isActive}
                className={cardClassName}
              >
                {innerContent}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);

MatrixRevealGrid.displayName = "MatrixRevealGrid";

export { MatrixRevealGrid as component, MatrixRevealGrid as Component };
export default MatrixRevealGrid;