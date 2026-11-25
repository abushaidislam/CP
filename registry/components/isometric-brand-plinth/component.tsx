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
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type IsometricBrandPlinthTheme = "auto" | "light" | "dark";
export type IsometricOrbitDirection = "left" | "right";

export interface IsometricBrandPlinthProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Primary bold brand code that wraps across the rounded isometric perimeter. */
  brandCode?: string;
  /** Bold trailing monogram letter anchored after the stacked descriptor. */
  endMonogram?: string;
  /** Stacked descriptor lines (pipe-separated string, e.g. "design | systems | academy", or string array). */
  subtitle?: string | string[];
  /** Custom color for the bottom isometric base plate. Defaults to "#acefff". */
  baseColor?: string;
  /** Optional override for the top isometric cap and typography fill color. */
  inkColor?: string;
  /** Color theme handling: "auto" adapts to Tailwind dark mode, or lock to "light" / "dark". */
  theme?: IsometricBrandPlinthTheme;
  /** Seconds per full 360-degree 4-sided orbit around the rounded plinth. Set to 0 to pause at the hero pose. */
  orbitSpeed?: number;
  /** Direction of the 360-degree typography orbit across the front faces. */
  orbitDirection?: IsometricOrbitDirection;
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

const STRAIGHT_LEN = 2 - 2 * CORNER_R;
const ARC_LEN = (Math.PI / 2) * CORNER_R;
const QUARTER_LEN = STRAIGHT_LEN + ARC_LEN;
const LOOP_LEN = QUARTER_LEN * 4;

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

interface LoopSample {
  px: number;
  py: number;
  a: number;
  b: number;
}

/**
 * Samples any point s along the closed 4-sided rounded-square perimeter (0..LOOP_LEN).
 * C1-continuous across all 4 straight faces and all 4 rounded corners.
 * When a >= 0 the surface faces the viewer (front); when a < 0 it faces away (back).
 */
function sampleClosedPerimeter(sInput: number, cy: number): LoopSample {
  const s = ((sInput % LOOP_LEN) + LOOP_LEN) % LOOP_LEN;
  const r = CORNER_R;

  let x: number;
  let y: number;
  let tx: number;
  let ty: number;

  if (s < STRAIGHT_LEN) {
    // 0: Front-left straight edge
    x = -1 + r + s;
    y = 1;
    tx = 1;
    ty = 0;
  } else if (s < QUARTER_LEN) {
    // 1: Front rounded corner
    const t = (s - STRAIGHT_LEN) / ARC_LEN;
    const theta = (Math.PI / 2) * (1 - t);
    x = 1 - r + r * Math.cos(theta);
    y = 1 - r + r * Math.sin(theta);
    tx = Math.sin(theta);
    ty = -Math.cos(theta);
  } else if (s < QUARTER_LEN + STRAIGHT_LEN) {
    // 2: Front-right straight edge
    const u = s - QUARTER_LEN;
    x = 1;
    y = 1 - r - u;
    tx = 0;
    ty = -1;
  } else if (s < QUARTER_LEN * 2) {
    // 3: Right rounded corner (front -> back)
    const t = (s - QUARTER_LEN - STRAIGHT_LEN) / ARC_LEN;
    const theta = -(Math.PI / 2) * t;
    x = 1 - r + r * Math.cos(theta);
    y = -1 + r + r * Math.sin(theta);
    tx = Math.sin(theta);
    ty = -Math.cos(theta);
  } else if (s < QUARTER_LEN * 2 + STRAIGHT_LEN) {
    // 4: Back-right straight edge
    const u = s - QUARTER_LEN * 2;
    x = 1 - r - u;
    y = -1;
    tx = -1;
    ty = 0;
  } else if (s < QUARTER_LEN * 3) {
    // 5: Back rounded corner
    const t = (s - QUARTER_LEN * 2 - STRAIGHT_LEN) / ARC_LEN;
    const theta = -Math.PI / 2 - (Math.PI / 2) * t;
    x = -1 + r + r * Math.cos(theta);
    y = -1 + r + r * Math.sin(theta);
    tx = Math.sin(theta);
    ty = -Math.cos(theta);
  } else if (s < QUARTER_LEN * 3 + STRAIGHT_LEN) {
    // 6: Back-left straight edge
    const u = s - QUARTER_LEN * 3;
    x = -1;
    y = -1 + r + u;
    tx = 0;
    ty = 1;
  } else {
    // 7: Left rounded corner (back -> front)
    const t = (s - QUARTER_LEN * 3 - STRAIGHT_LEN) / ARC_LEN;
    const theta = Math.PI - (Math.PI / 2) * t;
    x = -1 + r + r * Math.cos(theta);
    y = 1 - r + r * Math.sin(theta);
    tx = Math.sin(theta);
    ty = -Math.cos(theta);
  }

  const [px, py] = isoPoint(x, y, cy);
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

const SUB_CHAR_WIDTHS: Record<string, number> = {
  i: 0.042,
  l: 0.042,
  t: 0.056,
  f: 0.052,
  r: 0.058,
  m: 0.11,
  w: 0.105,
  " ": 0.045,
};

interface OrbitGlyphSpec {
  id: string;
  ch: string;
  baseS: number;
  yOffset: number;
  fontSize: number;
  fontWeight: number;
  letterSpacing: string;
}

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
    orbitSpeed = 12,
    orbitDirection = "left",
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
  const frontNodesRef = useRef(new Map<string, SVGTextElement>());
  const backNodesRef = useRef(new Map<string, SVGTextElement>());
  const isHoveredRef = useRef(false);
  const phaseRef = useRef(0);

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

  const handlePointerEnter = useCallback(() => {
    if (!interactive) return;
    isHoveredRef.current = true;
    setIsHovered(true);
  }, [interactive]);

  const handlePointerLeave = useCallback(() => {
    isHoveredRef.current = false;
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

  // Build 2 diametrically-opposed copies around the full 4-sided closed rounded loop
  const orbitGlyphs = useMemo<OrbitGlyphSpec[]>(() => {
    const specs: OrbitGlyphSpec[] = [];
    const chars = Array.from(normalizedBrandCode);
    const weights = chars.map(
      (ch) => CHAR_WIDTH_WEIGHTS[ch.toUpperCase()] ?? 0.34
    );
    const totalWeight = weights.reduce((acc, w) => acc + w, 0) || 1;
    const hasTrailing =
      subtitleLines.length > 0 || normalizedEndMonogram.length > 0;
    const sStart = 0.14;
    const sSpan = hasTrailing ? 2.0 : 2.9;
    const scaleS = sSpan / totalWeight;

    const lineStep = 20.5;
    const subStartY =
      subtitleLines.length === 1
        ? -18
        : subtitleLines.length === 2
        ? -32
        : -43;

    const halfLoop = LOOP_LEN / 2;

    for (let copy = 0; copy < 2; copy++) {
      const copyOffset = copy * halfLoop;

      // 1. Primary wrap-around brand code characters
      let cursor = 0;
      chars.forEach((ch, idx) => {
        const w = weights[idx];
        const sMid = sStart + (cursor + w * 0.5) * scaleS;
        cursor += w;
        specs.push({
          id: `c${copy}-b-${idx}`,
          ch,
          baseS: copyOffset + sMid,
          yOffset: 0,
          fontSize: 76,
          fontWeight: 800,
          letterSpacing: "-0.02em",
        });
      });

      // 2. Per-character 3-line stacked subtitle so every line bends smoothly around corners
      subtitleLines.forEach((line, lineIdx) => {
        const lineChars = Array.from(line.slice(0, 14));
        let subCursor = 2.24;
        lineChars.forEach((ch, charIdx) => {
          const cw = SUB_CHAR_WIDTHS[ch.toLowerCase()] ?? 0.075;
          const sMid = subCursor + cw * 0.5;
          subCursor += cw;
          if (ch.trim().length > 0) {
            specs.push({
              id: `c${copy}-s-${lineIdx}-${charIdx}`,
              ch,
              baseS: copyOffset + sMid,
              yOffset: subStartY + lineIdx * lineStep,
              fontSize: 17,
              fontWeight: 600,
              letterSpacing: "-0.01em",
            });
          }
        });
      });

      // 3. Trailing bold monogram letter
      if (normalizedEndMonogram) {
        specs.push({
          id: `c${copy}-e`,
          ch: normalizedEndMonogram,
          baseS: copyOffset + 3.12,
          yOffset: 0,
          fontSize: 76,
          fontWeight: 800,
          letterSpacing: "-0.02em",
        });
      }
    }

    return specs;
  }, [normalizedBrandCode, subtitleLines, normalizedEndMonogram]);

  // Apply transforms directly to SVG DOM nodes at 60fps (zero React re-renders)
  const applyGlyphFrame = useCallback(
    (phase: number) => {
      const cyRibbon = CY_TOP + RIBBON_OFFSET_Y;

      for (let i = 0; i < orbitGlyphs.length; i++) {
        const spec = orbitGlyphs[i];
        const sample = sampleClosedPerimeter(spec.baseS + phase, cyRibbon);
        const frontEl = frontNodesRef.current.get(spec.id);
        const backEl = backNodesRef.current.get(spec.id);

        if (sample.a >= 0) {
          // Front-facing side of the 3D rounded plinth
          const frontOpacity = Math.min(1, sample.a / 0.12);
          if (frontEl) {
            frontEl.setAttribute(
              "transform",
              `matrix(${sample.a.toFixed(4)} ${sample.b.toFixed(4)} 0 1 ${sample.px.toFixed(2)} ${sample.py.toFixed(2)})`
            );
            frontEl.setAttribute("opacity", frontOpacity.toFixed(3));
          }
          if (backEl) {
            backEl.setAttribute("opacity", "0");
          }
        } else {
          // Back-facing side of the 3D rounded plinth (subtle depth ghost passing behind)
          const backOpacity = Math.min(0.14, (Math.abs(sample.a) / 0.85) * 0.14);
          if (frontEl) {
            frontEl.setAttribute("opacity", "0");
          }
          if (backEl) {
            backEl.setAttribute(
              "transform",
              `matrix(${sample.a.toFixed(4)} ${sample.b.toFixed(4)} 0 1 ${sample.px.toFixed(2)} ${sample.py.toFixed(2)})`
            );
            backEl.setAttribute("opacity", backOpacity.toFixed(3));
          }
        }
      }
    },
    [orbitGlyphs]
  );

  // Continuous 60fps requestAnimationFrame 360-degree 4-sided orbit loop
  useEffect(() => {
    const safeSpeed =
      typeof orbitSpeed === "number" && Number.isFinite(orbitSpeed)
        ? Math.max(0, orbitSpeed)
        : 12;

    if (prefersReducedMotion || safeSpeed === 0) {
      phaseRef.current = 0;
      applyGlyphFrame(0);
      return;
    }

    let rafId = 0;
    let lastTime = performance.now();
    const dirSign = orbitDirection === "right" ? 1 : -1;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      // Gently decelerate on hover so users can inspect text effortlessly
      const speedFactor = interactive && isHoveredRef.current ? 0.35 : 1;
      const deltaS = (LOOP_LEN / safeSpeed) * dt * speedFactor * dirSign;
      phaseRef.current =
        (((phaseRef.current + deltaS) % LOOP_LEN) + LOOP_LEN) % LOOP_LEN;

      applyGlyphFrame(phaseRef.current);
      rafId = requestAnimationFrame(tick);
    };

    applyGlyphFrame(phaseRef.current);
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [orbitSpeed, orbitDirection, prefersReducedMotion, interactive, applyGlyphFrame]);

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
      onPointerEnter={handlePointerEnter}
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
          Isometric three-layer brand plinth with 360-degree rounded-square
          orbiting typography wrapping smoothly around all four sides.
          {interactive
            ? " Hover to slow orbit and elevate cap; activate to toggle exploded architectural layer view."
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

        {/* LAYER 2A: Back-Facing Orbiting Typography (passes behind front ribbon & beneath top cap) */}
        <motion.g
          style={
            interactive && !prefersReducedMotion
              ? { x: ribbonShiftX, y: ribbonShiftY }
              : undefined
          }
          className="pointer-events-none"
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
              {orbitGlyphs.map((spec) => (
                <text
                  key={`back-${spec.id}`}
                  ref={(el) => {
                    if (el) {
                      backNodesRef.current.set(spec.id, el);
                    } else {
                      backNodesRef.current.delete(spec.id);
                    }
                  }}
                  x={0}
                  y={spec.yOffset}
                  textAnchor="middle"
                  fontFamily="'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif"
                  fontWeight={spec.fontWeight}
                  fontSize={spec.fontSize}
                  letterSpacing={spec.letterSpacing}
                  fill={safeInkColor || undefined}
                  className={inkClass}
                  opacity={0}
                >
                  {spec.ch}
                </text>
              ))}
            </motion.g>
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

        {/* LAYER 2B: Front-Facing Orbiting Typography (crisp full opacity wrapping front corners) */}
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
              {orbitGlyphs.map((spec) => (
                <text
                  key={`front-${spec.id}`}
                  ref={(el) => {
                    if (el) {
                      frontNodesRef.current.set(spec.id, el);
                    } else {
                      frontNodesRef.current.delete(spec.id);
                    }
                  }}
                  x={0}
                  y={spec.yOffset}
                  textAnchor="middle"
                  fontFamily="'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif"
                  fontWeight={spec.fontWeight}
                  fontSize={spec.fontSize}
                  letterSpacing={spec.letterSpacing}
                  fill={safeInkColor || undefined}
                  className={inkClass}
                  opacity={0}
                >
                  {spec.ch}
                </text>
              ))}
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
