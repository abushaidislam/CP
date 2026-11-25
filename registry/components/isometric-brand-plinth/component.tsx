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
  /** Primary bold brand code that orbits around all four rounded sides. */
  brandCode?: string;
  /** Bold trailing monogram letter anchored after the stacked descriptor. */
  endMonogram?: string;
  /** Stacked descriptor lines (pipe-separated string, e.g. "design | systems | academy", or string array). */
  subtitle?: string | string[];
  /** Toggles the live animated ASCII fire burning on top of the isometric cap. */
  showAsciiFire?: boolean;
  /** Controls flame height and ember density (0.3 to 1.0). */
  fireIntensity?: number;
  /** Color theme handling: "auto" adapts materials and fire palette to Tailwind dark mode, or lock to "light" / "dark". */
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
const VIEWBOX_H = 540;
const CX = 300;
const CY_TOP = 228;
const PLATE_OFFSET_Y = 124;
const RIBBON_OFFSET_Y = 84;
const CAP_THICKNESS = 11;
const BASE_THICKNESS = 9;
const HALF_W = 262;
const HALF_H = 131; // Exact 2:1 isometric projection
const CORNER_R = 0.28; // 14% of side length
const KAPPA = 0.55228475;

const STRAIGHT_LEN = 2 - 2 * CORNER_R;
const ARC_LEN = (Math.PI / 2) * CORNER_R;
const QUARTER_LEN = STRAIGHT_LEN + ARC_LEN;
const LOOP_LEN = QUARTER_LEN * 4;

// ASCII Fire Simulation Grid
const FIRE_COLS = 30;
const FIRE_ROWS = 13;
const NBSP = "\u00A0";
const FIRE_CHARS = [NBSP, ".", ":", "-", "=", "+", "*", "#", "%", "@"];
const FIRE_ROW_INDICES = Array.from({ length: FIRE_ROWS }, (_, i) => i);

function isoPoint(
  x: number,
  y: number,
  cy: number,
  scale = 1
): [number, number] {
  return [
    CX + ((x - y) / 2) * HALF_W * scale,
    cy + ((x + y) / 2) * HALF_H * scale,
  ];
}

function buildIsoRoundedSquarePath(cy: number, scale = 1): string {
  const r = CORNER_R;
  const k = KAPPA * r;

  const p = (x: number, y: number) => {
    const [px, py] = isoPoint(x, y, cy, scale);
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
    x = -1 + r + s;
    y = 1;
    tx = 1;
    ty = 0;
  } else if (s < QUARTER_LEN) {
    const t = (s - STRAIGHT_LEN) / ARC_LEN;
    const theta = (Math.PI / 2) * (1 - t);
    x = 1 - r + r * Math.cos(theta);
    y = 1 - r + r * Math.sin(theta);
    tx = Math.sin(theta);
    ty = -Math.cos(theta);
  } else if (s < QUARTER_LEN + STRAIGHT_LEN) {
    const u = s - QUARTER_LEN;
    x = 1;
    y = 1 - r - u;
    tx = 0;
    ty = -1;
  } else if (s < QUARTER_LEN * 2) {
    const t = (s - QUARTER_LEN - STRAIGHT_LEN) / ARC_LEN;
    const theta = -(Math.PI / 2) * t;
    x = 1 - r + r * Math.cos(theta);
    y = -1 + r + r * Math.sin(theta);
    tx = Math.sin(theta);
    ty = -Math.cos(theta);
  } else if (s < QUARTER_LEN * 2 + STRAIGHT_LEN) {
    const u = s - QUARTER_LEN * 2;
    x = 1 - r - u;
    y = -1;
    tx = -1;
    ty = 0;
  } else if (s < QUARTER_LEN * 3) {
    const t = (s - QUARTER_LEN * 2 - STRAIGHT_LEN) / ARC_LEN;
    const theta = -Math.PI / 2 - (Math.PI / 2) * t;
    x = -1 + r + r * Math.cos(theta);
    y = -1 + r + r * Math.sin(theta);
    tx = Math.sin(theta);
    ty = -Math.cos(theta);
  } else if (s < QUARTER_LEN * 3 + STRAIGHT_LEN) {
    const u = s - QUARTER_LEN * 3;
    x = -1;
    y = -1 + r + u;
    tx = 0;
    ty = 1;
  } else {
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

function createInitialFireBuffer(intensity: number): Float32Array {
  const buf = new Float32Array(FIRE_ROWS * FIRE_COLS);
  const center = (FIRE_COLS - 1) / 2;
  for (let r = 0; r < FIRE_ROWS; r++) {
    const verticalFalloff = (r + 1) / FIRE_ROWS;
    for (let c = 0; c < FIRE_COLS; c++) {
      const dist = Math.abs(c - center) / center;
      const cone = Math.max(0, 1 - dist * (1.28 - verticalFalloff * 0.48));
      const wave =
        0.5 + 0.5 * Math.sin(c * 0.72 + r * 0.45) * Math.cos(c * 0.31 - r * 0.3);
      const heat =
        cone * Math.pow(verticalFalloff, 1.15) * (0.7 + 0.3 * wave) * intensity;
      buf[r * FIRE_COLS + c] = Math.max(0, Math.min(1, heat));
    }
  }
  return buf;
}

export const IsometricBrandPlinth = React.forwardRef<
  HTMLDivElement,
  IsometricBrandPlinthProps
>(function IsometricBrandPlinth(
  {
    brandCode = "NU-VOR",
    endMonogram = "A",
    subtitle = "design | systems | academy",
    showAsciiFire = true,
    fireIntensity = 0.85,
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
  const capGradId = `iso-cap-grad-${safeId}`;
  const capRimGradId = `iso-cap-rim-${safeId}`;
  const baseGradId = `iso-base-grad-${safeId}`;
  const baseRimGradId = `iso-base-rim-${safeId}`;
  const emberGlowGradId = `iso-ember-glow-${safeId}`;
  const baseClipId = `iso-base-clip-${safeId}`;
  const capClipId = `iso-cap-clip-${safeId}`;
  const shadowFilterId = `iso-soft-shadow-${safeId}`;

  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frontNodesRef = useRef(new Map<string, SVGTextElement>());
  const backNodesRef = useRef(new Map<string, SVGTextElement>());
  const fireNodesRef = useRef(new Map<string, SVGTextElement>());
  const isHoveredRef = useRef(false);
  const phaseRef = useRef(0);

  const [isHovered, setIsHovered] = useState(false);
  const [internalExploded, setInternalExploded] = useState(defaultExploded);

  const isControlled = typeof exploded === "boolean";
  const isExploded = isControlled ? exploded : internalExploded;

  const clampedIntensity = useMemo(() => {
    if (typeof fireIntensity !== "number" || !Number.isFinite(fireIntensity)) {
      return 0.85;
    }
    return Math.max(0.3, Math.min(1, fireIntensity));
  }, [fireIntensity]);

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

  // Machined 3D isometric slab paths
  const topCapSurfacePath = useMemo(
    () => buildIsoRoundedSquarePath(CY_TOP),
    []
  );
  const topCapBevelPath = useMemo(
    () => buildIsoRoundedSquarePath(CY_TOP + CAP_THICKNESS),
    []
  );
  const baseSurfacePath = useMemo(
    () => buildIsoRoundedSquarePath(CY_TOP + PLATE_OFFSET_Y),
    []
  );
  const baseBevelPath = useMemo(
    () => buildIsoRoundedSquarePath(CY_TOP + PLATE_OFFSET_Y + BASE_THICKNESS),
    []
  );
  const castShadowPath = useMemo(
    () => buildIsoRoundedSquarePath(CY_TOP + PLATE_OFFSET_Y + 4, 0.78),
    []
  );
  const groundShadowPath = useMemo(
    () => buildIsoRoundedSquarePath(CY_TOP + PLATE_OFFSET_Y + 24, 0.96),
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

  // Apply 360-degree orbiting glyph transforms directly to SVG DOM nodes at 60fps
  const applyGlyphFrame = useCallback(
    (phase: number) => {
      const cyRibbon = CY_TOP + RIBBON_OFFSET_Y;

      for (let i = 0; i < orbitGlyphs.length; i++) {
        const spec = orbitGlyphs[i];
        const sample = sampleClosedPerimeter(spec.baseS + phase, cyRibbon);
        const frontEl = frontNodesRef.current.get(spec.id);
        const backEl = backNodesRef.current.get(spec.id);

        if (sample.a >= 0) {
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

  // Paint 4 color-bucketed ASCII fire tiers directly to SVG textContent using NBSP for exact column lock
  const paintFireBuffer = useCallback((buf: Float32Array) => {
    for (let r = 0; r < FIRE_ROWS; r++) {
      let tier0 = "";
      let tier1 = "";
      let tier2 = "";
      let tier3 = "";
      const rowOffset = r * FIRE_COLS;

      for (let c = 0; c < FIRE_COLS; c++) {
        const h = buf[rowOffset + c];
        if (h < 0.14) {
          tier0 += NBSP;
          tier1 += NBSP;
          tier2 += NBSP;
          tier3 += NBSP;
          continue;
        }
        const idx = Math.min(
          FIRE_CHARS.length - 1,
          Math.max(1, Math.floor(h * FIRE_CHARS.length))
        );
        const ch = FIRE_CHARS[idx];
        if (h >= 0.78) {
          tier0 += NBSP;
          tier1 += NBSP;
          tier2 += NBSP;
          tier3 += ch;
        } else if (h >= 0.54) {
          tier0 += NBSP;
          tier1 += NBSP;
          tier2 += ch;
          tier3 += NBSP;
        } else if (h >= 0.32) {
          tier0 += NBSP;
          tier1 += ch;
          tier2 += NBSP;
          tier3 += NBSP;
        } else {
          tier0 += ch;
          tier1 += NBSP;
          tier2 += NBSP;
          tier3 += NBSP;
        }
      }

      const n0 = fireNodesRef.current.get(`f-${r}-0`);
      const n1 = fireNodesRef.current.get(`f-${r}-1`);
      const n2 = fireNodesRef.current.get(`f-${r}-2`);
      const n3 = fireNodesRef.current.get(`f-${r}-3`);
      if (n0) n0.textContent = tier0;
      if (n1) n1.textContent = tier1;
      if (n2) n2.textContent = tier2;
      if (n3) n3.textContent = tier3;
    }
  }, []);

  // Continuous 60fps orbit loop
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
  }, [
    orbitSpeed,
    orbitDirection,
    prefersReducedMotion,
    interactive,
    applyGlyphFrame,
  ]);

  // Real-time Cellular Automata ASCII Fire simulation loop (~24fps crisp flame flicker)
  useEffect(() => {
    if (!showAsciiFire) return;

    const buf = createInitialFireBuffer(clampedIntensity);
    const next = new Float32Array(FIRE_ROWS * FIRE_COLS);
    paintFireBuffer(buf);

    if (prefersReducedMotion) return;

    let rafId = 0;
    let lastStep = performance.now();
    let tickCount = 0;
    const center = (FIRE_COLS - 1) / 2;

    const stepFire = (now: number) => {
      if (now - lastStep >= 42) {
        lastStep = now;
        tickCount += 1;

        // Stoke bottom row with sculpted ember profile matching the isometric cap width
        const baseRow = (FIRE_ROWS - 1) * FIRE_COLS;
        for (let c = 0; c < FIRE_COLS; c++) {
          const dist = Math.abs(c - center) / center;
          const footprint = Math.max(0, 1 - Math.pow(dist, 1.55) * 1.12);
          const pulse =
            0.74 +
            0.26 * Math.sin(tickCount * 0.24 + c * 0.58) * Math.cos(c * 0.27);
          const spark = 0.72 + Math.random() * 0.42;
          buf[baseRow + c] = Math.min(
            1,
            footprint * pulse * spark * clampedIntensity * 1.2
          );
        }

        // Propagate heat upward with gentle organic turbulence & cooling
        for (let r = 0; r < FIRE_ROWS - 1; r++) {
          const rowStart = r * FIRE_COLS;
          const belowStart = (r + 1) * FIRE_COLS;
          const below2Start = Math.min(FIRE_ROWS - 1, r + 2) * FIRE_COLS;

          for (let c = 0; c < FIRE_COLS; c++) {
            const cLeft = Math.max(0, c - 1);
            const cRight = Math.min(FIRE_COLS - 1, c + 1);
            const avg =
              buf[belowStart + cLeft] * 0.22 +
              buf[belowStart + c] * 0.44 +
              buf[belowStart + cRight] * 0.22 +
              buf[below2Start + c] * 0.12;

            const edgeDist = Math.abs(c - center) / center;
            const cooling =
              0.068 +
              (1 - clampedIntensity) * 0.055 +
              edgeDist * 0.048 +
              Math.random() * 0.075;

            next[rowStart + c] = Math.max(0, Math.min(1, avg - cooling));
          }
        }

        for (let i = 0; i < baseRow; i++) {
          buf[i] = next[i];
        }

        paintFireBuffer(buf);
      }

      rafId = requestAnimationFrame(stepFire);
    };

    rafId = requestAnimationFrame(stepFire);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [showAsciiFire, clampedIntensity, prefersReducedMotion, paintFireBuffer]);

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

  // Dual-theme CSS variable tokens so Day (Light) & Night (Dark) both look flagship-grade
  const themeTokenClasses = useMemo(() => {
    const lightTokens = [
      "[--plinth-cap-1:#27272a]",
      "[--plinth-cap-2:#141417]",
      "[--plinth-cap-3:#09090b]",
      "[--plinth-cap-bevel:#030406]",
      "[--plinth-cap-rim:rgba(255,255,255,0.28)]",
      "[--plinth-base-1:#ffffff]",
      "[--plinth-base-2:#f4f4f6]",
      "[--plinth-base-3:#e2e4ea]",
      "[--plinth-base-bevel:#c8ccd6]",
      "[--plinth-base-rim:rgba(255,255,255,0.92)]",
      "[--plinth-ink:#09090b]",
      "[--plinth-guide:rgba(9,9,11,0.18)]",
      "[--plinth-cast-opacity:0.15]",
      "[--plinth-ground-opacity:0.12]",
      "[--plinth-ember-core:rgba(249,115,22,0.34)]",
      "[--plinth-ember-edge:rgba(234,88,12,0)]",
      "[--fire-t0:#9a3412]",
      "[--fire-t1:#dc2626]",
      "[--fire-t2:#ea580c]",
      "[--fire-t3:#f59e0b]",
    ].join(" ");

    const darkTokens = [
      "[--plinth-cap-1:#2e3445]",
      "[--plinth-cap-2:#151923]",
      "[--plinth-cap-3:#090b10]",
      "[--plinth-cap-bevel:#040508]",
      "[--plinth-cap-rim:rgba(255,255,255,0.24)]",
      "[--plinth-base-1:#2b3142]",
      "[--plinth-base-2:#1b1f2b]",
      "[--plinth-base-3:#11141d]",
      "[--plinth-base-bevel:#080a0f]",
      "[--plinth-base-rim:rgba(255,255,255,0.18)]",
      "[--plinth-ink:#f4f4f5]",
      "[--plinth-guide:rgba(255,255,255,0.22)]",
      "[--plinth-cast-opacity:0.42]",
      "[--plinth-ground-opacity:0.35]",
      "[--plinth-ember-core:rgba(251,146,60,0.42)]",
      "[--plinth-ember-edge:rgba(234,88,12,0)]",
      "[--fire-t0:#b91c1c]",
      "[--fire-t1:#f97316]",
      "[--fire-t2:#fbbf24]",
      "[--fire-t3:#fffbeb]",
    ].join(" ");

    const autoDarkTokens = [
      "dark:[--plinth-cap-1:#2e3445]",
      "dark:[--plinth-cap-2:#151923]",
      "dark:[--plinth-cap-3:#090b10]",
      "dark:[--plinth-cap-bevel:#040508]",
      "dark:[--plinth-cap-rim:rgba(255,255,255,0.24)]",
      "dark:[--plinth-base-1:#2b3142]",
      "dark:[--plinth-base-2:#1b1f2b]",
      "dark:[--plinth-base-3:#11141d]",
      "dark:[--plinth-base-bevel:#080a0f]",
      "dark:[--plinth-base-rim:rgba(255,255,255,0.18)]",
      "dark:[--plinth-ink:#f4f4f5]",
      "dark:[--plinth-guide:rgba(255,255,255,0.22)]",
      "dark:[--plinth-cast-opacity:0.42]",
      "dark:[--plinth-ground-opacity:0.35]",
      "dark:[--plinth-ember-core:rgba(251,146,60,0.42)]",
      "dark:[--plinth-ember-edge:rgba(234,88,12,0)]",
      "dark:[--fire-t0:#b91c1c]",
      "dark:[--fire-t1:#f97316]",
      "dark:[--fire-t2:#fbbf24]",
      "dark:[--fire-t3:#fffbeb]",
    ].join(" ");

    if (theme === "light") return lightTokens;
    if (theme === "dark") return darkTokens;
    return `${lightTokens} ${autoDarkTokens}`;
  }, [theme]);

  const capTargetY = isExploded ? -28 : isHovered && interactive ? -10 : 0;
  const ribbonTargetY = isExploded ? 0 : isHovered && interactive ? -3 : 0;
  const baseTargetY = isExploded ? 20 : isHovered && interactive ? 5 : 0;

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
        "relative inline-flex w-full max-w-[480px] select-none items-center justify-center rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/70 focus-visible:ring-offset-4 focus-visible:ring-offset-transparent",
        themeTokenClasses,
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
          Dual-theme isometric brand plinth with animated ASCII fire burning on
          top of a machined obsidian slab and 360-degree rounded-square orbiting
          typography underneath.
          {interactive
            ? " Hover to slow orbit and elevate cap; activate to toggle exploded architectural layer view."
            : ""}
        </desc>

        <defs>
          {/* Top Machined Obsidian Surface Gradient */}
          <linearGradient id={capGradId} x1="12%" y1="0%" x2="88%" y2="100%">
            <stop offset="0%" stopColor="var(--plinth-cap-1)" />
            <stop offset="52%" stopColor="var(--plinth-cap-2)" />
            <stop offset="100%" stopColor="var(--plinth-cap-3)" />
          </linearGradient>

          {/* Crisp 1px Specular Rim Highlight on Top Cap */}
          <linearGradient id={capRimGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--plinth-cap-rim)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.14)" />
          </linearGradient>

          {/* Bottom Architectural Ceramic / Slate Base Gradient */}
          <linearGradient id={baseGradId} x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="var(--plinth-base-1)" />
            <stop offset="50%" stopColor="var(--plinth-base-2)" />
            <stop offset="100%" stopColor="var(--plinth-base-3)" />
          </linearGradient>

          {/* Crisp 1px Specular Rim Highlight on Base Plate */}
          <linearGradient
            id={baseRimGradId}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="var(--plinth-base-rim)" />
            <stop offset="60%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.2)" />
          </linearGradient>

          {/* Subtle Warm Ember Reflection Seated on Top Cap Under ASCII Fire */}
          <radialGradient id={emberGlowGradId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--plinth-ember-core)" />
            <stop offset="65%" stopColor="rgba(249,115,22,0.1)" />
            <stop offset="100%" stopColor="var(--plinth-ember-edge)" />
          </radialGradient>

          <clipPath id={baseClipId}>
            <path d={baseSurfacePath} />
          </clipPath>

          <clipPath id={capClipId}>
            <path d={topCapSurfacePath} />
          </clipPath>

          <filter
            id={shadowFilterId}
            x="-25%"
            y="-25%"
            width="150%"
            height="150%"
          >
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>

        {/* LAYER 0: Soft Grounded Ambient Contact Shadow */}
        <motion.g
          animate={{
            scale: isExploded ? 0.92 : isHovered && interactive ? 0.96 : 1,
          }}
          transition={springTransition}
          style={{
            transformOrigin: `${CX}px ${CY_TOP + PLATE_OFFSET_Y + 24}px`,
            opacity: "var(--plinth-ground-opacity)",
          }}
          className="pointer-events-none"
        >
          <path
            d={groundShadowPath}
            fill="#020617"
            filter={`url(#${shadowFilterId})`}
          />
        </motion.g>

        {/* LAYER 1: Bottom Isometric Machined Base Plinth */}
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
            {/* 3D Extruded Bevel Lip */}
            <path d={baseBevelPath} fill="var(--plinth-base-bevel)" />
            {/* Top Satin Surface */}
            <path
              d={baseSurfacePath}
              fill={`url(#${baseGradId})`}
              stroke={`url(#${baseRimGradId})`}
              strokeWidth="1.25"
            />
            {/* Projected Depth Shadow Cast by Floating Top Cap */}
            <g clipPath={`url(#${baseClipId})`} className="pointer-events-none">
              <motion.path
                d={castShadowPath}
                fill="#020617"
                filter={`url(#${shadowFilterId})`}
                animate={{
                  scale: isExploded ? 0.85 : isHovered && interactive ? 0.92 : 1,
                }}
                transition={springTransition}
                style={{
                  transformOrigin: `${CX}px ${CY_TOP + PLATE_OFFSET_Y + 4}px`,
                  opacity: "var(--plinth-cast-opacity)",
                }}
              />
            </g>
          </motion.g>
        </motion.g>

        {/* LAYER 2A: Back-Facing Orbiting Typography */}
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
                  fill="var(--plinth-ink)"
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
              stroke="var(--plinth-guide)"
              strokeWidth="1.25"
              strokeDasharray="4 4"
            />
          ))}
        </motion.g>

        {/* LAYER 2B: Front-Facing Orbiting Typography */}
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
                  fill="var(--plinth-ink)"
                  opacity={0}
                >
                  {spec.ch}
                </text>
              ))}
            </motion.g>
          </motion.g>
        </motion.g>

        {/* LAYER 3: Top Machined Obsidian Cap + Seated Real-Time ASCII Fire */}
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
              {/* 3D Machined Bottom Bevel */}
              <path d={topCapBevelPath} fill="var(--plinth-cap-bevel)" />

              {/* Top Matte Directional Surface + 1px Specular Rim */}
              <path
                d={topCapSurfacePath}
                fill={`url(#${capGradId})`}
                stroke={`url(#${capRimGradId})`}
                strokeWidth="1.25"
              />

              {/* Warm Ember Reflection on Cap Surface Underneath the Fire */}
              {showAsciiFire ? (
                <g clipPath={`url(#${capClipId})`} className="pointer-events-none">
                  <ellipse
                    cx={CX}
                    cy={CY_TOP - 8}
                    rx={145}
                    ry={68}
                    fill={`url(#${emberGlowGradId})`}
                  />
                </g>
              ) : null}

              {/* Real-Time 4-Tier Multi-Color Vector ASCII Fire */}
              {showAsciiFire ? (
                <g
                  className="pointer-events-none"
                  aria-hidden="true"
                  fontFamily="'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, monospace"
                  fontSize={13.5}
                  fontWeight={700}
                  textAnchor="middle"
                  style={{ whiteSpace: "pre" }}
                >
                  {FIRE_ROW_INDICES.map((r) => {
                    const rowY = CY_TOP - 178 + r * 14.5;
                    return (
                      <g key={`fire-row-${r}`}>
                        <text
                          ref={(el) => {
                            const key = `f-${r}-0`;
                            if (el) fireNodesRef.current.set(key, el);
                            else fireNodesRef.current.delete(key);
                          }}
                          x={CX}
                          y={rowY}
                          fill="var(--fire-t0)"
                          opacity={0.72}
                          xmlSpace="preserve"
                        />
                        <text
                          ref={(el) => {
                            const key = `f-${r}-1`;
                            if (el) fireNodesRef.current.set(key, el);
                            else fireNodesRef.current.delete(key);
                          }}
                          x={CX}
                          y={rowY}
                          fill="var(--fire-t1)"
                          opacity={0.92}
                          xmlSpace="preserve"
                        />
                        <text
                          ref={(el) => {
                            const key = `f-${r}-2`;
                            if (el) fireNodesRef.current.set(key, el);
                            else fireNodesRef.current.delete(key);
                          }}
                          x={CX}
                          y={rowY}
                          fill="var(--fire-t2)"
                          opacity={0.98}
                          xmlSpace="preserve"
                        />
                        <text
                          ref={(el) => {
                            const key = `f-${r}-3`;
                            if (el) fireNodesRef.current.set(key, el);
                            else fireNodesRef.current.delete(key);
                          }}
                          x={CX}
                          y={rowY}
                          fill="var(--fire-t3)"
                          opacity={1}
                          xmlSpace="preserve"
                        />
                      </g>
                    );
                  })}
                </g>
              ) : null}
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
