"use client";

import React, { useCallback, useId, useMemo, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type IsometricBrandPlinthTheme = "auto" | "light" | "dark";

export interface IsometricBrandPlinthProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Primary bold brand code that wraps across the front-left face and rounded corner onto the front-right face. */
  brandCode?: string;
  /** Bold trailing monogram letter anchored at the far-right end of the front-right face. */
  endMonogram?: string;
  /** Stacked descriptor lines (pipe-separated string, e.g. "design | systems | academy", or string array). */
  subtitle?: string | string[];
  /** Custom color for the bottom isometric base plate. Defaults to "#acefff". */
  baseColor?: string;
  /** Optional override for the top isometric cap and typography fill color. */
  inkColor?: string;
  /** Color theme handling: "auto" adapts to Tailwind dark mode, or lock to "light" / "dark". */
  theme?: IsometricBrandPlinthTheme;
  /** Enables subtle ambient levitation between the top cap, typography band, and base plate. */
  floating?: boolean;
  /** Enables pointer parallax tilt, hover elevation, and click/keyboard exploded-view inspection. */
  interactive?: boolean;
  /** Controlled exploded-view state separating the three architectural layers. */
  exploded?: boolean;
  /** Initial exploded-view state when uncontrolled. */
  defaultExploded?: boolean;
  /** Callback fired when the exploded-view state toggles. */
  onExplodedChange?: (exploded: boolean) => void;
}

const VIEWBOX_W = 600;
const VIEWBOX_H = 460;
const CX = 300;
const CY_TOP = 160;
const PLATE_OFFSET_Y = 122;
const RIBBON_OFFSET_Y = 82;
const HALF_W = 262;
const HALF_H = 131; // Exact 2:1 isometric projection
const CORNER_R = 0.28; // 14% of side length (matches reference squircle radius)
const KAPPA = 0.55228475;

function isoPoint(x: number, y: number, cy: number): [number, number] {
  return [CX + ((x - y) / 2) * HALF_W, cy + ((x + y) / 2) * HALF_H];
}

function buildIsoRoundedSquarePath(cy: number): string {
  const r = CORNER_R;
  const k = KAPPA * r;

  const p = (x: number, y: number) => {
    const [px, py] = isoPoint(x, y, cy);
    return `${px.toFixed(2)} ${py.toFixed(2)}`;
  };

  return [
    `M ${p(-1 + r, -1)}`,
    `L ${p(1 - r, -1)}`,
    `C ${p(1 - r + k, -1)} ${p(1, -1 + r - k)} ${p(1, -1 + r)}`,
    `L ${p(1, 1 - r)}`,
    `C ${p(1, 1 - r + k)} ${p(1 - r + k, 1)} ${p(1 - r, 1)}`,
    `L ${p(-1 + r, 1)}`,
    `C ${p(-1 + r - k, 1)} ${p(-1, 1 - r + k)} ${p(-1, 1 - r)}`,
    `L ${p(-1, -1 + r)}`,
    `C ${p(-1, -1 + r - k)} ${p(-1 + r - k, -1)} ${p(-1 + r, -1)}`,
    "Z",
  ].join(" ");
}

interface PerimeterSample {
  px: number;
  py: number;
  a: number;
  b: number;
}

function sampleFrontPerimeter(sInput: number, cy: number): PerimeterSample {
  const straightLen = 2 - 2 * CORNER_R;
  const arcLen = (Math.PI / 2) * CORNER_R;
  const totalLen = straightLen * 2 + arcLen;
  const s = Math.max(0, Math.min(totalLen, sInput));

  let x: number;
  let y: number;
  let tx: number;
  let ty: number;

  if (s <= straightLen) {
    x = -1 + CORNER_R + s;
    y = 1;
    tx = 1;
    ty = 0;
  } else if (s <= straightLen + arcLen) {
    const t = (s - straightLen) / arcLen;
    const theta = (Math.PI / 2) * (1 - t);
    x = 1 - CORNER_R + CORNER_R * Math.cos(theta);
    y = 1 - CORNER_R + CORNER_R * Math.sin(theta);
    tx = Math.sin(theta);
    ty = -Math.cos(theta);
  } else {
    const u = s - straightLen - arcLen;
    x = 1;
    y = 1 - CORNER_R - u;
    tx = 0;
    ty = -1;
  }

  const [px, py] = isoPoint(x, y, cy);
  // Orthographic 2:1 isometric tangent projection for true 3D cylindrical wrap foreshortening
  const a = (tx - ty) * 0.85;
  const b = (tx + ty) * 0.425;

  return { px, py, a, b };
}

const CHAR_WIDTH_WEIGHTS: Record<string, number> = {
  "-": 0.24,
  I: 0.22,
  J: 0.28,
  L: 0.3,
  M: 0.42,
  W: 0.44,
  " ": 0.18,
};

function sanitizeColor(value: string | undefined, fallback: string): string {
  if (!value || typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (
    /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed) ||
    /^(rgb|rgba|hsl|hsla)\([^)]+\)$/.test(trimmed) ||
    /^var\(--[a-zA-Z0-9-_]+\)$/.test(trimmed)
  ) {
    return trimmed;
  }
  return fallback;
}

export const IsometricBrandPlinth = React.forwardRef<
  HTMLDivElement,
  IsometricBrandPlinthProps
>(function IsometricBrandPlinth(
  {
    brandCode = "NU-VOR",
    endMonogram = "A",
    subtitle = "design | systems | academy",
    baseColor = "#acefff",
    inkColor,
    theme = "auto",
    floating = true,
    interactive = true,
    exploded,
    defaultExploded = false,
    onExplodedChange,
    className,
    onClick,
    onKeyDown,
    ...rest
  },
  ref
) {
  const rawId = useId();
  const safeId = rawId.replace(/:/g, "");
  const titleId = `iso-plinth-title-${safeId}`;
  const descId = `iso-plinth-desc-${safeId}`;

  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isHovered, setIsHovered] = useState(false);
  const [internalExploded, setInternalExploded] = useState(defaultExploded);

  const isControlled = typeof exploded === "boolean";
  const isExploded = isControlled ? exploded : internalExploded;

  // Pointer parallax motion values (zero React re-renders on pointer move)
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const smoothX = useSpring(pointerX, { stiffness: 180, damping: 24, mass: 0.6 });
  const smoothY = useSpring(pointerY, { stiffness: 180, damping: 24, mass: 0.6 });

  const capShiftX = useTransform(smoothX, [-1, 1], [-8, 8]);
  const capShiftY = useTransform(smoothY, [-1, 1], [-5, 5]);
  const ribbonShiftX = useTransform(smoothX, [-1, 1], [-3, 3]);
  const ribbonShiftY = useTransform(smoothY, [-1, 1], [-2, 2]);
  const baseShiftX = useTransform(smoothX, [-1, 1], [5, -5]);
  const baseShiftY = useTransform(smoothY, [-1, 1], [3, -3]);

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

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!interactive || prefersReducedMotion) return;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      pointerX.set(Math.max(-1, Math.min(1, nx)));
      pointerY.set(Math.max(-1, Math.min(1, ny)));
    },
    [interactive, prefersReducedMotion, pointerX, pointerY]
  );

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
    pointerX.set(0);
    pointerY.set(0);
  }, [pointerX, pointerY]);

  const toggleExploded = useCallback(() => {
    if (!interactive) return;
    const next = !isExploded;
    if (!isControlled) {
      setInternalExploded(next);
    }
    onExplodedChange?.(next);
  }, [interactive, isExploded, isControlled, onExplodedChange]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      toggleExploded();
      onClick?.(e);
    },
    [toggleExploded, onClick]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (interactive && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        toggleExploded();
      }
      onKeyDown?.(e);
    },
    [interactive, toggleExploded, onKeyDown]
  );

  const safeBaseColor = useMemo(
    () => sanitizeColor(baseColor, "#acefff"),
    [baseColor]
  );
  const safeInkColor = useMemo(
    () => (inkColor ? sanitizeColor(inkColor, "") : undefined),
    [inkColor]
  );

  const topPlatePath = useMemo(() => buildIsoRoundedSquarePath(CY_TOP), []);
  const bottomPlatePath = useMemo(
    () => buildIsoRoundedSquarePath(CY_TOP + PLATE_OFFSET_Y),
    []
  );

  const normalizedBrandCode = useMemo(() => {
    const trimmed = (brandCode ?? "").trim();
    return (trimmed.length > 0 ? trimmed : "NU-VOR").slice(0, 10);
  }, [brandCode]);

  const normalizedEndMonogram = useMemo(() => {
    const trimmed = (endMonogram ?? "").trim();
    return trimmed.slice(0, 2);
  }, [endMonogram]);

  const subtitleLines = useMemo(() => {
    if (Array.isArray(subtitle)) {
      return subtitle
        .map((l) => String(l).trim())
        .filter(Boolean)
        .slice(0, 3);
    }
    if (typeof subtitle === "string") {
      return subtitle
        .split("|")
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 3);
    }
    return [];
  }, [subtitle]);

  const brandGlyphs = useMemo(() => {
    const chars = Array.from(normalizedBrandCode);
    const weights = chars.map(
      (ch) => CHAR_WIDTH_WEIGHTS[ch.toUpperCase()] ?? 0.34
    );
    const totalWeight = weights.reduce((acc, w) => acc + w, 0) || 1;
    const hasTrailing = subtitleLines.length > 0 || normalizedEndMonogram.length > 0;
    const sStart = 0.14;
    const sSpan = hasTrailing ? 2.0 : 2.9;
    const scaleS = sSpan / totalWeight;
    const cyRibbon = CY_TOP + RIBBON_OFFSET_Y;

    let cursor = 0;
    return chars.map((ch, idx) => {
      const w = weights[idx];
      const sMid = sStart + (cursor + w * 0.5) * scaleS;
      cursor += w;
      const sample = sampleFrontPerimeter(sMid, cyRibbon);
      return { ch, idx, ...sample };
    });
  }, [normalizedBrandCode, subtitleLines.length, normalizedEndMonogram.length]);

  const subtitleAnchor = useMemo(
    () => sampleFrontPerimeter(2.26, CY_TOP + RIBBON_OFFSET_Y),
    []
  );

  const endMonogramAnchor = useMemo(
    () => sampleFrontPerimeter(3.12, CY_TOP + RIBBON_OFFSET_Y),
    []
  );

  const guideVerts = useMemo(() => {
    const corners: Array<[number, number]> = [
      [-1 + CORNER_R - CORNER_R / Math.SQRT2, 1 - CORNER_R + CORNER_R / Math.SQRT2],
      [1 - CORNER_R + CORNER_R / Math.SQRT2, 1 - CORNER_R + CORNER_R / Math.SQRT2],
      [1 - CORNER_R + CORNER_R / Math.SQRT2, -1 + CORNER_R - CORNER_R / Math.SQRT2],
    ];
    return corners.map(([x, y]) => ({
      top: isoPoint(x, y, CY_TOP),
      bot: isoPoint(x, y, CY_TOP + PLATE_OFFSET_Y),
    }));
  }, []);

  const inkClass = useMemo(() => {
    if (safeInkColor) return "";
    if (theme === "light") return "fill-black text-black";
    if (theme === "dark") return "fill-zinc-50 text-zinc-50";
    return "fill-black text-black dark:fill-zinc-50 dark:text-zinc-50";
  }, [safeInkColor, theme]);

  const guideStrokeClass = useMemo(() => {
    if (theme === "light") return "stroke-black/20";
    if (theme === "dark") return "stroke-white/25";
    return "stroke-black/20 dark:stroke-white/25";
  }, [theme]);

  // Critically-damped spring offsets for hover & exploded states
  const capTargetY = isExploded ? -28 : isHovered && interactive ? -10 : 0;
  const ribbonTargetY = isExploded ? 0 : isHovered && interactive ? -3 : 0;
  const baseTargetY = isExploded ? 22 : isHovered && interactive ? 6 : 0;

  const shouldFloat = floating && !prefersReducedMotion && !isExploded;
  const springTransition = prefersReducedMotion
    ? { duration: 0.01 }
    : { type: "spring" as const, stiffness: 260, damping: 28, mass: 0.8 };

  const accessibleLabel = [
    normalizedBrandCode,
    normalizedEndMonogram,
    subtitleLines.join(" "),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={setRefs}
      role={interactive ? "button" : "img"}
      tabIndex={interactive ? 0 : undefined}
      aria-labelledby={titleId}
      aria-describedby={descId}
      aria-pressed={interactive ? isExploded : undefined}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => interactive && setIsHovered(true)}
      onPointerLeave={handlePointerLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative inline-flex w-full max-w-[460px] select-none items-center justify-center rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent",
        interactive ? "cursor-pointer" : "cursor-default",
        className
      )}
      {...rest}
    >
      <svg
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        className="h-auto w-full overflow-visible"
        aria-hidden="false"
      >
        <title id={titleId}>{accessibleLabel}</title>
        <desc id={descId}>
          Isometric three-layer brand plinth featuring a floating top plate,
          curved wrap-around typography band, and cyan base plate.
          {interactive
            ? " Activate to toggle exploded architectural layer view."
            : ""}
        </desc>

        {/* LAYER 1: Bottom Isometric Cyan Base Plate */}
        <motion.g
          style={
            interactive && !prefersReducedMotion
              ? { x: baseShiftX, y: baseShiftY }
              : undefined
          }
        >
          <motion.g
            animate={{
              y: baseTargetY,
              scale: isExploded ? 0.985 : 1,
            }}
            transition={springTransition}
            style={{ transformOrigin: `${CX}px ${CY_TOP + PLATE_OFFSET_Y}px` }}
          >
            <path d={bottomPlatePath} fill={safeBaseColor} />
          </motion.g>
        </motion.g>

        {/* ARCHITECTURAL GUIDE LINES (Visible only in exploded view) */}
        <motion.g
          initial={false}
          animate={{ opacity: isExploded ? 1 : 0 }}
          transition={
            prefersReducedMotion ? { duration: 0.01 } : { duration: 0.25 }
          }
          className="pointer-events-none"
        >
          {guideVerts.map((v, i) => (
            <line
              key={i}
              x1={v.top[0]}
              y1={v.top[1] - 24}
              x2={v.bot[0]}
              y2={v.bot[1] + 18}
              className={guideStrokeClass}
              strokeWidth="1.25"
              strokeDasharray="4 4"
            />
          ))}
        </motion.g>

        {/* LAYER 2: Floating Wrap-Around Typography Band */}
        <motion.g
          style={
            interactive && !prefersReducedMotion
              ? { x: ribbonShiftX, y: ribbonShiftY }
              : undefined
          }
        >
          <motion.g
            animate={{ y: ribbonTargetY }}
            transition={springTransition}
          >
            <motion.g
              animate={shouldFloat ? { y: [0, -3.5, 0] } : { y: 0 }}
              transition={
                shouldFloat
                  ? {
                      duration: 4.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.2,
                    }
                  : { duration: 0.2 }
              }
            >
              {/* Primary Wrap-Around Brand Code */}
              {brandGlyphs.map((g) => (
                <text
                  key={`${g.idx}-${g.ch}`}
                  x={0}
                  y={0}
                  textAnchor="middle"
                  fontFamily="'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif"
                  fontWeight={800}
                  fontSize={76}
                  letterSpacing="-0.02em"
                  fill={safeInkColor || undefined}
                  className={inkClass}
                  transform={`matrix(${g.a.toFixed(4)} ${g.b.toFixed(4)} 0 1 ${g.px.toFixed(2)} ${g.py.toFixed(2)})`}
                >
                  {g.ch}
                </text>
              ))}

              {/* 3-Line Stacked Descriptor on Front-Right Face */}
              {subtitleLines.map((line, i) => {
                const lineStep = 20.5;
                const startY =
                  subtitleLines.length === 1
                    ? -18
                    : subtitleLines.length === 2
                    ? -32
                    : -43;
                return (
                  <text
                    key={`${i}-${line}`}
                    x={0}
                    y={startY + i * lineStep}
                    textAnchor="start"
                    fontFamily="'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif"
                    fontWeight={600}
                    fontSize={17}
                    letterSpacing="-0.01em"
                    fill={safeInkColor || undefined}
                    className={inkClass}
                    transform={`matrix(${subtitleAnchor.a.toFixed(4)} ${subtitleAnchor.b.toFixed(4)} 0 1 ${subtitleAnchor.px.toFixed(2)} ${subtitleAnchor.py.toFixed(2)})`}
                  >
                    {line}
                  </text>
                );
              })}

              {/* Trailing Bold End Monogram */}
              {normalizedEndMonogram ? (
                <text
                  x={0}
                  y={0}
                  textAnchor="middle"
                  fontFamily="'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif"
                  fontWeight={800}
                  fontSize={76}
                  letterSpacing="-0.02em"
                  fill={safeInkColor || undefined}
                  className={inkClass}
                  transform={`matrix(${endMonogramAnchor.a.toFixed(4)} ${endMonogramAnchor.b.toFixed(4)} 0 1 ${endMonogramAnchor.px.toFixed(2)} ${endMonogramAnchor.py.toFixed(2)})`}
                >
                  {normalizedEndMonogram}
                </text>
              ) : null}
            </motion.g>
          </motion.g>
        </motion.g>

        {/* LAYER 3: Top Isometric Rounded-Square Cap */}
        <motion.g
          style={
            interactive && !prefersReducedMotion
              ? { x: capShiftX, y: capShiftY }
              : undefined
          }
        >
          <motion.g
            animate={{ y: capTargetY }}
            transition={springTransition}
          >
            <motion.g
              animate={shouldFloat ? { y: [0, -6, 0] } : { y: 0 }}
              transition={
                shouldFloat
                  ? {
                      duration: 4.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
                  : { duration: 0.2 }
              }
            >
              <path
                d={topPlatePath}
                fill={safeInkColor || undefined}
                className={inkClass}
              />
            </motion.g>
          </motion.g>
        </motion.g>
      </svg>
    </div>
  );
});

IsometricBrandPlinth.displayName = "IsometricBrandPlinth";

export { IsometricBrandPlinth as component, IsometricBrandPlinth as Component };
export default IsometricBrandPlinth;