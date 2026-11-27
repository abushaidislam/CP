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

export type KineticNumeralDigit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type KineticNumeralPalette = "glacial" | "auto" | "obsidian" | "paper";
export type KineticNumeralSequence = "pingpong" | "count";

export interface KineticNumeralProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Controlled or initial numeral (0-9). */
  digit?: KineticNumeralDigit;
  /** Automatically cycle through the kinetic numeral sequence. */
  autoPlay?: boolean;
  /** Sequence pattern used when autoPlay is enabled. */
  sequence?: KineticNumeralSequence;
  /** Morph transition duration in milliseconds. */
  duration?: number;
  /** Pause hold duration between transitions in milliseconds. */
  holdDuration?: number;
  /** Visual color palette. "glacial" reproduces the Swiss slate-blue poster; "auto" follows light/dark mode. */
  palette?: KineticNumeralPalette;
  /** Show the minimalist Swiss specimen header (label + Unicode codepoint). */
  showHeader?: boolean;
  /** Top-left specimen title when showHeader is true. */
  label?: string;
  /** Enable click and keyboard stepping (Arrow keys, 0-9, Space to toggle playback). */
  interactive?: boolean;
  /** Callback fired whenever the displayed digit changes. */
  onDigitChange?: (digit: KineticNumeralDigit) => void;
}

type PoseKey = KineticNumeralDigit | "seed" | "pillar";

interface PoseDefinition {
  rows: ReadonlyArray<readonly number[]>;
  collapsed?: boolean;
  unicode: string;
  spokenLabel: string;
}

interface RectGeom {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Exact 3x8 modular Swiss grid coordinates normalized to 714x952 (3:4) viewBox
const VIEWBOX_W = 714;
const VIEWBOX_H = 952;
const BLOCK_W = 159;
const BLOCK_H = 79;
const COL_X = [104, 278, 452] as const;
const ROW_Y = [107, 202, 296, 390, 484, 578, 673, 767] as const;
const CENTER_Y = 437;

const POSES: Record<PoseKey, PoseDefinition> = {
  seed: {
    rows: [[1], [1], [1], [1], [1], [1], [1], [1]],
    collapsed: true,
    unicode: "0030",
    spokenLabel: "0",
  },
  pillar: {
    rows: [[1], [1], [1], [1], [1], [1], [1], [1]],
    unicode: "0030",
    spokenLabel: "0",
  },
  0: {
    rows: [[1], [0, 2], [0, 2], [0, 2], [0, 2], [0, 2], [0, 2], [1]],
    unicode: "0030",
    spokenLabel: "0",
  },
  1: {
    rows: [[1], [0, 1], [1], [1], [1], [1], [1], [0, 1, 2]],
    unicode: "0031",
    spokenLabel: "1",
  },
  2: {
    rows: [[1], [0, 2], [2], [2], [1], [0], [0], [0, 1, 2]],
    unicode: "0032",
    spokenLabel: "2",
  },
  3: {
    rows: [[1], [0, 2], [2], [1], [2], [2], [0, 2], [1]],
    unicode: "0033",
    spokenLabel: "3",
  },
  4: {
    rows: [[0, 2], [0, 2], [0, 2], [0, 2], [1, 2], [2], [2], [2]],
    unicode: "0034",
    spokenLabel: "4",
  },
  5: {
    rows: [[0, 1, 2], [0], [0], [1, 2], [2], [2], [0, 2], [1]],
    unicode: "0035",
    spokenLabel: "5",
  },
  6: {
    rows: [[1], [0, 2], [0], [0, 1], [0, 2], [0, 2], [0, 2], [1]],
    unicode: "0036",
    spokenLabel: "6",
  },
  7: {
    rows: [[0, 1, 2], [2], [2], [1], [1], [1], [1], [1]],
    unicode: "0037",
    spokenLabel: "7",
  },
  8: {
    rows: [[1], [0, 2], [0, 2], [1], [0, 2], [0, 2], [0, 2], [1]],
    unicode: "0038",
    spokenLabel: "8",
  },
  9: {
    rows: [[1], [0, 2], [0, 2], [0, 2], [1, 2], [2], [0, 2], [1]],
    unicode: "0039",
    spokenLabel: "9",
  },
};

const PINGPONG_SEQUENCE: readonly PoseKey[] = [
  "seed",
  "pillar",
  1,
  2,
  3,
  4,
  5,
  4,
  3,
  2,
  1,
  "pillar",
];

const COUNT_SEQUENCE: readonly PoseKey[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const PERMS_3: ReadonlyArray<[number, number, number]> = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
];

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function expandRowToThree(cols: readonly number[]): [number, number, number] {
  if (cols.length === 1) return [cols[0], cols[0], cols[0]];
  if (cols.length === 2) return [cols[0], cols[1], cols[1]];
  return [cols[0], cols[1], cols[2]];
}

function buildStaticGeoms(poseKey: PoseKey): RectGeom[] {
  const pose = POSES[poseKey];
  const out: RectGeom[] = [];
  for (let r = 0; r < 8; r++) {
    const slots = expandRowToThree(pose.rows[r]);
    const y = pose.collapsed ? CENTER_Y : ROW_Y[r];
    for (let s = 0; s < 3; s++) {
      out.push({ x: COL_X[slots[s]], y, w: BLOCK_W, h: BLOCK_H });
    }
  }
  return out;
}

/**
 * Matches 3 live block X positions in a row against 3 target column X positions
 * to minimize total travel distance and prevent blocks from crossing unnecessarily.
 */
function matchRowTargets(
  startXs: readonly [number, number, number],
  toCols: readonly number[]
): [number, number, number] {
  const toThree = expandRowToThree(toCols);
  const targetXs = [COL_X[toThree[0]], COL_X[toThree[1]], COL_X[toThree[2]]];

  let bestPerm: [number, number, number] = [0, 1, 2];
  let bestCost = Infinity;

  for (const p of PERMS_3) {
    const cost =
      Math.abs(startXs[0] - targetXs[p[0]]) +
      Math.abs(startXs[1] - targetXs[p[1]]) +
      Math.abs(startXs[2] - targetXs[p[2]]);
    if (cost < bestCost) {
      bestCost = cost;
      bestPerm = p;
    }
  }

  return [targetXs[bestPerm[0]], targetXs[bestPerm[1]], targetXs[bestPerm[2]]];
}

const PALETTE_CLASSES: Record<
  KineticNumeralPalette,
  { surface: string; ink: string; focusRing: string }
> = {
  glacial: {
    surface: "bg-[#A2BDD3]",
    ink: "text-[#080A0C]",
    focusRing: "focus-visible:ring-[#080A0C]/60",
  },
  auto: {
    surface: "bg-[#EFECE6] dark:bg-[#0E1013]",
    ink: "text-[#0B0C0E] dark:text-[#F2F4F7]",
    focusRing:
      "focus-visible:ring-[#0B0C0E]/50 dark:focus-visible:ring-[#F2F4F7]/50",
  },
  obsidian: {
    surface: "bg-[#0C0E11]",
    ink: "text-[#F2F4F7]",
    focusRing: "focus-visible:ring-[#F2F4F7]/60",
  },
  paper: {
    surface: "bg-[#EDEBE6]",
    ink: "text-[#0A0A0A]",
    focusRing: "focus-visible:ring-[#0A0A0A]/50",
  },
};

function normalizeDigit(value: number | undefined): KineticNumeralDigit {
  if (typeof value !== "number" || !Number.isFinite(value)) return 2;
  return clamp(Math.round(value), 0, 9) as KineticNumeralDigit;
}

export const KineticNumeral = forwardRef<HTMLDivElement, KineticNumeralProps>(
  function KineticNumeral(
    {
      digit = 2,
      autoPlay = true,
      sequence = "pingpong",
      duration = 850,
      holdDuration = 220,
      palette = "glacial",
      showHeader = true,
      label = "KINETIC NUMERAL",
      interactive = true,
      onDigitChange,
      className,
      onClick,
      onKeyDown,
      ...rest
    },
    ref
  ) {
    const rawId = useId();
    const safeId = useMemo(() => rawId.replace(/[^a-zA-Z0-9_-]/g, ""), [rawId]);
    const prefersReducedMotion = useReducedMotion();

    const safeDigit = normalizeDigit(digit);
    const safeDuration = clamp(
      Number.isFinite(duration) ? duration : 850,
      200,
      2600
    );
    const safeHold = clamp(
      Number.isFinite(holdDuration) ? holdDuration : 220,
      0,
      2000
    );
    const safePalette: KineticNumeralPalette =
      palette in PALETTE_CLASSES ? palette : "glacial";
    const safeSequence: KineticNumeralSequence =
      sequence === "count" ? "count" : "pingpong";

    const initialPose: PoseKey =
      autoPlay && safeSequence === "pingpong" ? "seed" : safeDigit;

    const [activePose, setActivePose] = useState<PoseKey>(initialPose);
    const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);

    // Static initial geometry so React never overwrites rAF-driven rect positions
    const initialGeomsRef = useRef<RectGeom[]>(buildStaticGeoms(initialPose));
    const liveGeomsRef = useRef<RectGeom[]>(
      initialGeomsRef.current.map((g) => ({ ...g }))
    );
    const rectRefs = useRef<Array<SVGRectElement | null>>([]);
    const lastPoseRef = useRef<PoseKey>(initialPose);
    const rafRef = useRef<number | null>(null);
    const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const seqIndexRef = useRef<number>(
      safeSequence === "pingpong" ? 0 : safeDigit
    );

    // Sync external autoPlay prop
    useEffect(() => {
      setIsPlaying(autoPlay);
    }, [autoPlay]);

    // Sync external sequence change
    useEffect(() => {
      if (safeSequence === "pingpong") {
        seqIndexRef.current = 0;
        if (autoPlay) {
          setActivePose("seed");
        }
      } else {
        seqIndexRef.current = safeDigit;
        setActivePose(safeDigit);
      }
    }, [safeSequence]);

    // Sync external digit prop when not auto-playing
    useEffect(() => {
      if (!isPlaying) {
        setActivePose(safeDigit);
        seqIndexRef.current = safeDigit;
      }
    }, [safeDigit, isPlaying]);

    const commitRect = useCallback((idx: number, geom: RectGeom) => {
      liveGeomsRef.current[idx] = geom;
      const el = rectRefs.current[idx];
      if (!el) return;
      el.setAttribute("x", geom.x.toFixed(2));
      el.setAttribute("y", geom.y.toFixed(2));
      el.setAttribute("width", geom.w.toFixed(2));
      el.setAttribute("height", geom.h.toFixed(2));
    }, []);

    const snapToPose = useCallback(
      (poseKey: PoseKey) => {
        const geoms = buildStaticGeoms(poseKey);
        for (let i = 0; i < 24; i++) {
          commitRect(i, geoms[i]);
        }
      },
      [commitRect]
    );

    // Interruptible 60fps elastic inchworm morph between live geometry and target pose
    useEffect(() => {
      const fromKey = lastPoseRef.current;
      const toKey = activePose;

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      if (fromKey === toKey || prefersReducedMotion) {
        snapToPose(toKey);
        lastPoseRef.current = toKey;
        return;
      }

      const startGeoms = liveGeomsRef.current.map((g) => ({ ...g }));
      const fromPose = POSES[fromKey];
      const toPose = POSES[toKey];

      const targetRowXs = Array.from({ length: 8 }, (_, r) =>
        matchRowTargets(
          [
            startGeoms[r * 3].x,
            startGeoms[r * 3 + 1].x,
            startGeoms[r * 3 + 2].x,
          ],
          toPose.rows[r]
        )
      );

      const isVerticalMorph =
        Boolean(fromPose.collapsed) !== Boolean(toPose.collapsed);
      const morphDuration = isVerticalMorph
        ? Math.round(safeDuration * 0.65)
        : safeDuration;
      const startTime = performance.now();

      // Asymmetric lead/trail phase shift creates the exact Swiss elastic stretch
      const phaseShift = 0.2;

      const tick = (now: number) => {
        const rawT = clamp((now - startTime) / morphDuration, 0, 1);
        const leadT = easeInOutCubic(clamp(rawT / (1 - phaseShift), 0, 1));
        const trailT = easeInOutCubic(
          clamp((rawT - phaseShift) / (1 - phaseShift), 0, 1)
        );
        const baseEase = easeInOutCubic(rawT);

        for (let r = 0; r < 8; r++) {
          const yTo = toPose.collapsed ? CENTER_Y : ROW_Y[r];
          const rowTargetXs = targetRowXs[r];

          for (let s = 0; s < 3; s++) {
            const idx = r * 3 + s;
            const sg = startGeoms[idx];
            const x1 = rowTargetXs[s];

            // Vertical interpolation with elastic extrusion during pillar collapse/expand
            let rectY = sg.y + (yTo - sg.y) * baseEase;
            let rectH = sg.h + (BLOCK_H - sg.h) * baseEase;

            if (isVerticalMorph && Math.abs(yTo - sg.y) > 0.5) {
              const topP = yTo < sg.y ? leadT : trailT;
              const botP = yTo > sg.y ? leadT : trailT;
              const top = sg.y + (yTo - sg.y) * topP;
              const bot = sg.y + sg.h + (yTo + BLOCK_H - (sg.y + sg.h)) * botP;
              rectY = top;
              rectH = Math.max(BLOCK_H, bot - top);
            }

            // Horizontal interpolation with elastic inchworm stretch
            const dx = x1 - sg.x;
            let rectX = sg.x;
            let rectW = sg.w + (BLOCK_W - sg.w) * baseEase;

            if (Math.abs(dx) > 0.5) {
              const startRight = sg.x + sg.w;
              const targetRight = x1 + BLOCK_W;
              if (dx > 0) {
                // Moving right: right edge leads, left edge trails
                const left = sg.x + dx * trailT;
                const right = startRight + (targetRight - startRight) * leadT;
                rectX = left;
                rectW = Math.max(BLOCK_W, right - left);
              } else {
                // Moving left: left edge leads, right edge trails
                const left = sg.x + dx * leadT;
                const right = startRight + (targetRight - startRight) * trailT;
                rectX = left;
                rectW = Math.max(BLOCK_W, right - left);
              }
            }

            commitRect(idx, { x: rectX, y: rectY, w: rectW, h: rectH });
          }
        }

        if (rawT < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          snapToPose(toKey);
          lastPoseRef.current = toKey;
          rafRef.current = null;
        }
      };

      lastPoseRef.current = toKey;
      rafRef.current = requestAnimationFrame(tick);

      return () => {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      };
    }, [activePose, safeDuration, prefersReducedMotion, commitRect, snapToPose]);

    // Autoplay scheduler
    useEffect(() => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }

      if (!isPlaying) return;

      const seq =
        safeSequence === "pingpong" ? PINGPONG_SEQUENCE : COUNT_SEQUENCE;
      const isSeedOrPillar = activePose === "seed" || activePose === "pillar";
      const stepDelay = prefersReducedMotion
        ? Math.max(700, safeDuration)
        : (isSeedOrPillar ? Math.round(safeDuration * 0.65) : safeDuration) +
          safeHold;

      holdTimerRef.current = setTimeout(() => {
        const nextIdx = (seqIndexRef.current + 1) % seq.length;
        seqIndexRef.current = nextIdx;
        const nextPose = seq[nextIdx];
        setActivePose(nextPose);
        if (typeof nextPose === "number" && onDigitChange) {
          onDigitChange(nextPose);
        }
      }, stepDelay);

      return () => {
        if (holdTimerRef.current) {
          clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
      };
    }, [
      isPlaying,
      activePose,
      safeSequence,
      safeDuration,
      safeHold,
      prefersReducedMotion,
      onDigitChange,
    ]);

    const stepDigit = useCallback(
      (delta: 1 | -1) => {
        setIsPlaying(false);
        setActivePose((prev) => {
          const base = typeof prev === "number" ? prev : 0;
          const next = (((base + delta) % 10) + 10) % 10;
          const nextDigit = next as KineticNumeralDigit;
          seqIndexRef.current = nextDigit;
          onDigitChange?.(nextDigit);
          return nextDigit;
        });
      },
      [onDigitChange]
    );

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(e);
      if (!interactive || e.defaultPrevented) return;
      stepDigit(1);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e);
      if (!interactive || e.defaultPrevented) return;

      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault();
        stepDigit(1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        stepDigit(-1);
      } else if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        const num = Number(e.key) as KineticNumeralDigit;
        setIsPlaying(false);
        seqIndexRef.current = num;
        setActivePose(num);
        onDigitChange?.(num);
      }
    };

    const poseMeta = POSES[activePose];
    const paletteStyles = PALETTE_CLASSES[safePalette];

    return (
      <div
        ref={ref}
        role={interactive ? "button" : "img"}
        tabIndex={interactive ? 0 : undefined}
        aria-label={`${label}: ${poseMeta.spokenLabel} (Unicode ${poseMeta.unicode})${
          interactive
            ? ". Click or press arrow keys to change numeral, Space to toggle autoplay."
            : ""
        }`}
        aria-live="polite"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative aspect-[3/4] w-full max-w-[420px] select-none overflow-hidden transition-colors duration-300",
          paletteStyles.surface,
          paletteStyles.ink,
          interactive &&
            cn(
              "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              paletteStyles.focusRing
            ),
          className
        )}
        {...rest}
      >
        {showHeader && (
          <header
            className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-[3.5%] pt-[2.2%] font-mono text-[clamp(9px,2.4vw,12px)] font-medium uppercase tracking-[0.08em] leading-none"
            style={{ fontVariantNumeric: "slashed-zero tabular-nums" }}
          >
            <span>{label}</span>
            <span>UNICODE {poseMeta.unicode}</span>
          </header>
        )}

        <svg
          id={`${safeId}-grid`}
          viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
          className="block h-full w-full"
          aria-hidden="true"
        >
          {initialGeomsRef.current.map((geom, idx) => (
            <rect
              key={idx}
              ref={(node) => {
                rectRefs.current[idx] = node;
              }}
              x={geom.x}
              y={geom.y}
              width={geom.w}
              height={geom.h}
              fill="currentColor"
            />
          ))}
        </svg>
      </div>
    );
  }
);

KineticNumeral.displayName = "KineticNumeral";

export { KineticNumeral as component, KineticNumeral as Component };
export default KineticNumeral;