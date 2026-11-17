'use client';

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  RotateCcw,
  Flame,
  Sun,
  Wind,
  Snowflake,
  Sparkles,
  Lock,
  Unlock,
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES (21st.dev Ready)
// ============================================================================

export type SeasonMode = 'Summer' | 'Spring' | 'Autumn' | 'Winter';
export type ThermalVariant = 'ember' | 'solar' | 'amber' | 'frost' | 'auto';

export interface ThermalDialWidgetProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Controlled temperature value (in degrees) */
  value?: number;
  /** Initial temperature value for uncontrolled usage (defaults to 38 to match reference) */
  defaultValue?: number;
  /** Minimum selectable temperature on the dial arc (default: 16) */
  min?: number;
  /** Maximum selectable temperature on the dial arc (default: 45) */
  max?: number;
  /** Step increment for keyboard and pointer scrubbing (default: 1) */
  step?: number;
  /** Top label text (defaults to "Summer") */
  label?: string;
  /** Automatically sync season label (Winter/Autumn/Spring/Summer) when temperature changes */
  autoSeason?: boolean;
  /** Thermal horizon glow color theme ('ember' matches reference 1:1; 'auto' adapts to season) */
  variant?: ThermalVariant;
  /** Callback fired when temperature changes */
  onChange?: (temperature: number, derivedSeason: SeasonMode) => void;
  /** Disable interactive dial scrubbing */
  disabled?: boolean;
  /** Size scale factor relative to the reference viewport (default: 1) */
  scale?: number;
  /** Optional unit for accessible screen-reader announcements */
  unit?: 'C' | 'F';
}

// ============================================================================
// UNIFORM 136 x 180 MODULAR ROUNDED-SQUARE DISPLAY DIGITS (0-9)
// Mathematically consistent 26px stroke width, 26px outer corner radius,
// 10px inner counter radius, and balanced negative space across all digits.
// ============================================================================

const DIGIT_PATHS: Record<string, string> = {
  '0': `
    M 0 26 Q 0 0 26 0 H 110 Q 136 0 136 26 V 154 Q 136 180 110 180 H 26 Q 0 180 0 154 Z
    M 26 36 Q 26 26 36 26 H 100 Q 110 26 110 36 V 144 Q 110 154 100 154 H 36 Q 26 154 26 144 Z
  `,
  '1': `
    M 30 12 Q 30 0 42 0 H 84 Q 108 0 108 24 V 154 H 128 Q 136 154 136 162 V 172 Q 136 180 128 180 H 28 Q 20 180 20 172 V 162 Q 20 154 28 154 H 82 V 26 H 42 Q 30 26 30 14 Z
  `,
  '2': `
    M 0 26 Q 0 0 26 0 H 110 Q 136 0 136 26 V 68 Q 136 102 108 102 H 36 Q 26 102 26 112 V 154 H 126 Q 136 154 136 164 V 170 Q 136 180 126 180 H 20 Q 0 180 0 160 V 104 Q 0 78 26 78 H 100 Q 110 78 110 68 V 36 Q 110 26 100 26 H 36 Q 26 26 26 36 V 50 H 0 Z
  `,
  '3': `
    M 0 26 Q 0 0 26 0 H 110 Q 136 0 136 26 V 62 Q 136 84 116 90 Q 136 96 136 118 V 154 Q 136 180 110 180 H 26 Q 0 180 0 154 V 128 H 26 V 144 Q 26 154 36 154 H 100 Q 110 154 110 144 V 112 Q 110 102 100 102 H 44 V 78 H 100 Q 110 78 110 68 V 36 Q 110 26 100 26 H 36 Q 26 26 26 36 V 52 H 0 Z
  `,
  '4': `
    M 0 12 Q 0 0 12 0 H 26 V 80 Q 26 90 36 90 H 102 V 12 Q 102 0 114 0 H 128 V 168 Q 128 180 116 180 H 102 V 116 H 24 Q 0 116 0 92 Z
  `,
  '5': `
    M 2 14 Q 2 0 16 0 H 122 Q 134 0 134 12 V 26 H 28 V 72 Q 28 78 36 78 H 110 Q 136 78 136 104 V 154 Q 136 180 110 180 H 26 Q 0 180 0 154 V 130 H 26 V 144 Q 26 154 36 154 H 100 Q 110 154 110 144 V 112 Q 110 102 100 102 H 24 Q 2 102 2 80 Z
  `,
  '6': `
    M 0 26 Q 0 0 26 0 H 110 Q 134 0 134 24 V 46 H 108 V 36 Q 108 26 98 26 H 36 Q 26 26 26 36 V 78 H 110 Q 136 78 136 104 V 154 Q 136 180 110 180 H 26 Q 0 180 0 154 Z
    M 26 112 Q 26 102 36 102 H 100 Q 110 102 110 112 V 144 Q 110 154 100 154 H 36 Q 26 154 26 144 Z
  `,
  '7': `
    M 4 12 Q 4 0 16 0 H 114 Q 136 0 136 22 V 34 Q 136 52 124 76 L 82 170 Q 78 180 66 180 H 52 L 100 66 Q 108 46 108 32 V 26 H 30 V 46 H 4 Z
  `,
  '8': `
    M 0 26 Q 0 0 26 0 H 110 Q 136 0 136 26 V 62 Q 136 84 116 90 Q 136 96 136 118 V 154 Q 136 180 110 180 H 26 Q 0 180 0 154 V 118 Q 0 96 20 90 Q 0 84 0 62 Z
    M 26 36 Q 26 26 36 26 H 100 Q 110 26 110 36 V 68 Q 110 78 100 78 H 36 Q 26 78 26 68 Z
    M 26 112 Q 26 102 36 102 H 100 Q 110 102 110 112 V 144 Q 110 154 100 154 H 36 Q 26 154 26 144 Z
  `,
  '9': `
    M 0 26 Q 0 0 26 0 H 110 Q 136 0 136 26 V 154 Q 136 180 110 180 H 26 Q 2 180 2 156 V 134 H 28 V 144 Q 28 154 38 154 H 100 Q 110 154 110 144 V 102 H 26 Q 0 102 0 76 Z
    M 26 36 Q 26 26 36 26 H 100 Q 110 26 110 36 V 68 Q 110 78 100 78 H 36 Q 26 78 26 68 Z
  `,
};

// ============================================================================
// THERMAL PALETTE CONFIGURATIONS (Pure CSS Gradients + Rim Glow)
// ============================================================================

interface ThermalPalette {
  /** Inner radial horizon gradient stops (bottom-up smooth blend, zero seams) */
  innerHorizon: string;
  /** Crisp 1.5px specular rim border gradient */
  rimBorder: string;
  /** Subtle ambient rim shadow */
  rimShadow: string;
  /** Digit warm fade tint */
  tensTint1: string;
  tensTint2: string;
  onesTint1: string;
  onesTint2: string;
  tickWarm: string;
}

const PALETTES: Record<Exclude<ThermalVariant, 'auto'>, ThermalPalette> = {
  ember: {
    innerHorizon:
      'radial-gradient(125% 88% at 50% 105%, #fff5e6 0%, #f8a83f 11%, #eb5a04 24%, #b82101 40%, #4a0804 58%, #120201 74%, transparent 90%)',
    rimBorder:
      'linear-gradient(180deg, rgba(198,194,190,0.88) 0%, rgba(136,121,115,0.65) 18%, rgba(152,119,114,0.6) 46%, rgba(216,104,74,0.85) 75%, #f8b26a 92%, #fff6eb 100%)',
    rimShadow:
      '0 0 28px -6px rgba(248, 128, 32, 0.36), inset 0 -18px 36px -14px rgba(248, 150, 48, 0.48)',
    tensTint1: '#a65b55',
    tensTint2: '#c83812',
    onesTint1: '#cd8680',
    onesTint2: '#c45c54',
    tickWarm: '#6d4b46',
  },
  solar: {
    innerHorizon:
      'radial-gradient(125% 88% at 50% 105%, #fffbeb 0%, #facc15 11%, #f97316 24%, #b45309 40%, #451a03 58%, #140801 74%, transparent 90%)',
    rimBorder:
      'linear-gradient(180deg, rgba(198,194,190,0.88) 0%, rgba(156,163,143,0.65) 18%, rgba(180,145,80,0.6) 46%, rgba(234,179,8,0.85) 75%, #fde047 92%, #fef9c3 100%)',
    rimShadow:
      '0 0 28px -6px rgba(250, 204, 21, 0.34), inset 0 -18px 36px -14px rgba(250, 204, 21, 0.45)',
    tensTint1: '#b58d58',
    tensTint2: '#d97706',
    onesTint1: '#dec08e',
    onesTint2: '#ca8a04',
    tickWarm: '#715d43',
  },
  amber: {
    innerHorizon:
      'radial-gradient(125% 88% at 50% 105%, #fff7ed 0%, #fb923c 11%, #ea580c 24%, #7c2d12 40%, #361005 58%, #120402 74%, transparent 90%)',
    rimBorder:
      'linear-gradient(180deg, rgba(198,194,190,0.88) 0%, rgba(140,120,115,0.65) 18%, rgba(150,115,105,0.6) 46%, rgba(234,88,12,0.85) 75%, #fdba74 92%, #ffedd5 100%)',
    rimShadow:
      '0 0 28px -6px rgba(251, 146, 60, 0.32), inset 0 -18px 36px -14px rgba(251, 146, 60, 0.44)',
    tensTint1: '#a86b56',
    tensTint2: '#c2410c',
    onesTint1: '#d49a89',
    onesTint2: '#b85d43',
    tickWarm: '#694e44',
  },
  frost: {
    innerHorizon:
      'radial-gradient(125% 88% at 50% 105%, #f0f9ff 0%, #38bdf8 11%, #0284c7 24%, #075985 40%, #082f49 58%, #020c14 74%, transparent 90%)',
    rimBorder:
      'linear-gradient(180deg, rgba(198,205,212,0.88) 0%, rgba(113,132,148,0.65) 18%, rgba(86,128,160,0.6) 46%, rgba(56,189,248,0.85) 75%, #7dd3fc 92%, #f0f9ff 100%)',
    rimShadow:
      '0 0 28px -6px rgba(56, 189, 248, 0.32), inset 0 -18px 36px -14px rgba(56, 189, 248, 0.44)',
    tensTint1: '#648ca8',
    tensTint2: '#0284c7',
    onesTint1: '#8ab4cf',
    onesTint2: '#38bdf8',
    tickWarm: '#475e6e',
  },
};

export function deriveSeasonFromTemp(temp: number): SeasonMode {
  if (temp >= 30) return 'Summer';
  if (temp >= 23) return 'Spring';
  if (temp >= 19) return 'Autumn';
  return 'Winter';
}

// ============================================================================
// CUSTOM HOOKS: REDUCED MOTION & CRITICALLY DAMPED INTERPOLATION
// ============================================================================

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

function useCriticallyDampedValue(target: number, disabledOrInstant: boolean): number {
  const [current, setCurrent] = useState(target);
  const currentRef = useRef(target);
  const velocityRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (disabledOrInstant) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      currentRef.current = target;
      velocityRef.current = 0;
      setCurrent(target);
      return;
    }

    let lastTime = performance.now();
    const stiffness = 280;
    const damping = 33.5;

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const displacement = currentRef.current - target;
      const acceleration = -stiffness * displacement - damping * velocityRef.current;

      velocityRef.current += acceleration * dt;
      currentRef.current += velocityRef.current * dt;

      if (Math.abs(target - currentRef.current) < 0.02 && Math.abs(velocityRef.current) < 0.05) {
        currentRef.current = target;
        velocityRef.current = 0;
        setCurrent(target);
        return;
      }

      setCurrent(currentRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, disabledOrInstant]);

  return current;
}

// ============================================================================
// MODULAR TECHNO VECTOR GLYPH HEADER ("Summer", "Spring", "Autumn", "Winter")
// ============================================================================

function HeaderLabelSVG({ label }: { label: string }) {
  if (label === 'Summer') {
    return (
      <g fill="#ebebeb" aria-hidden="true">
        <path d="M 155 68 H 170 Q 174 68 174 72 V 74.5 H 169.5 V 72.2 H 155.5 V 79.5 H 170 Q 174 79.5 174 83.5 V 91 Q 174 95 170 95 H 155 Q 151 95 151 91 V 88 H 155.5 V 90.8 H 169.5 V 83.8 H 155 Q 151 83.8 151 79.8 V 72 Q 151 68 155 68 Z" />
        <path d="M 180 75 H 184.4 V 90.8 H 194.6 V 75 H 199 V 95 H 184 Q 180 95 180 91 V 75 Z" />
        <path d="M 205 75 H 232 Q 236 75 236 79 V 95 H 231.6 V 79.2 H 222.7 V 95 H 218.3 V 79.2 H 209.4 V 95 H 205 V 75 Z" />
        <path d="M 241 75 H 267 Q 271 75 271 79 V 95 H 266.6 V 79.2 H 258.2 V 95 H 253.8 V 79.2 H 245.4 V 95 H 241 V 75 Z" />
        <path
          fillRule="evenodd"
          d="M 281 75 H 292 Q 296 75 296 79 V 86.5 H 281.4 V 90.8 H 295.5 V 95 H 281 Q 277 95 277 91 V 79 Q 277 75 281 75 Z M 281.4 79.2 V 82.8 H 291.6 V 79.2 H 281.4 Z"
        />
        <path d="M 302 75 H 314 Q 318 75 318 79 V 82.5 H 313.6 V 79.2 H 306.4 V 95 H 302 V 75 Z" />
      </g>
    );
  }

  if (label === 'Winter') {
    return (
      <g fill="#ebebeb" aria-hidden="true" transform="translate(14, 0)">
        <path d="M 147 68 H 151.5 V 90.5 H 159.8 V 74 H 164.2 V 90.5 H 172.5 V 68 H 177 V 91 Q 177 95 173 95 H 163.5 L 162 92.5 L 160.5 95 H 151 Q 147 95 147 91 V 68 Z" />
        <path d="M 184 68 H 188.5 V 72.2 H 184 V 68 Z M 184 75 H 188.5 V 95 H 184 V 75 Z" />
        <path d="M 196 75 H 211 Q 215 75 215 79 V 95 H 210.6 V 79.2 H 200.4 V 95 H 196 V 75 Z" />
        <path d="M 224 69 H 228.4 V 75 H 235.5 V 79.2 H 228.4 V 90.8 H 236 V 95 H 228 Q 224 95 224 91 V 79.2 H 220.5 V 75 H 224 V 69 Z" />
        <path
          fillRule="evenodd"
          d="M 246 75 H 257 Q 261 75 261 79 V 86.5 H 246.4 V 90.8 H 260.5 V 95 H 246 Q 242 95 242 91 V 79 Q 242 75 246 75 Z M 246.4 79.2 V 82.8 H 256.6 V 79.2 H 246.4 Z"
        />
        <path d="M 267 75 H 279 Q 283 75 283 79 V 82.5 H 278.6 V 79.2 H 271.4 V 95 H 267 V 75 Z" />
      </g>
    );
  }

  if (label === 'Spring') {
    return (
      <g fill="#ebebeb" aria-hidden="true" transform="translate(8, 0)">
        <path d="M 155 68 H 170 Q 174 68 174 72 V 74.5 H 169.5 V 72.2 H 155.5 V 79.5 H 170 Q 174 79.5 174 83.5 V 91 Q 174 95 170 95 H 155 Q 151 95 151 91 V 88 H 155.5 V 90.8 H 169.5 V 83.8 H 155 Q 151 83.8 151 79.8 V 72 Q 151 68 155 68 Z" />
        <path
          fillRule="evenodd"
          d="M 180 75 H 195 Q 199 75 199 79 V 91 Q 199 95 195 95 H 184.4 V 102 H 180 V 75 Z M 184.4 79.2 V 90.8 H 194.6 V 79.2 H 184.4 Z"
        />
        <path d="M 205 75 H 217 Q 221 75 221 79 V 82.5 H 216.6 V 79.2 H 209.4 V 95 H 205 V 75 Z" />
        <path d="M 227 68 H 231.5 V 72.2 H 227 V 68 Z M 227 75 H 231.5 V 95 H 227 V 75 Z" />
        <path d="M 238 75 H 253 Q 257 75 257 79 V 95 H 252.6 V 79.2 H 242.4 V 95 H 238 V 75 Z" />
        <path
          fillRule="evenodd"
          d="M 267 75 H 282 V 98 Q 282 102 278 102 H 266 Q 263 102 263 99 V 97.5 H 277.6 V 95 H 267 Q 263 95 263 91 V 79 Q 263 75 267 75 Z M 267.4 79.2 V 90.8 H 277.6 V 79.2 H 267.4 Z"
        />
      </g>
    );
  }

  if (label === 'Autumn') {
    return (
      <g fill="#ebebeb" aria-hidden="true" transform="translate(2, 0)">
        <path
          fillRule="evenodd"
          d="M 153 68 H 168 Q 172 68 172 72 V 95 H 167.5 V 85.5 H 153.5 V 95 H 149 V 72 Q 149 68 153 68 Z M 153.5 72.2 V 81.3 H 167.5 V 72.2 H 153.5 Z"
        />
        <path d="M 178 75 H 182.4 V 90.8 H 192.6 V 75 H 197 V 95 H 182 Q 178 95 178 91 V 75 Z" />
        <path d="M 205 69 H 209.4 V 75 H 216.5 V 79.2 H 209.4 V 90.8 H 217 V 95 H 209 Q 205 95 205 91 V 79.2 H 201.5 V 75 H 205 V 69 Z" />
        <path d="M 222 75 H 226.4 V 90.8 H 236.6 V 75 H 241 V 95 H 226 Q 222 95 222 91 V 75 Z" />
        <path d="M 247 75 H 273 Q 277 75 277 79 V 95 H 272.6 V 79.2 H 264.2 V 95 H 259.8 V 79.2 H 251.4 V 95 H 247 V 75 Z" />
        <path d="M 283 75 H 298 Q 302 75 302 79 V 95 H 297.6 V 79.2 H 287.4 V 95 H 283 V 75 Z" />
      </g>
    );
  }

  return (
    <text
      x="233"
      y="95"
      textAnchor="middle"
      fill="#ebebeb"
      fontSize="33"
      fontWeight="600"
      letterSpacing="0.08em"
      style={{
        fontFamily: "'Chakra Petch', 'Orbitron', 'Rajdhani', monospace",
      }}
    >
      {label}
    </text>
  );
}

// ============================================================================
// MAIN REUSABLE COMPONENT: ThermalDialWidget
// Card dimensions: 466 x 473 squircle (border-radius: 120px)
// Uses pure GPU CSS gradients & specular rim border (ZERO SVG blur clipping bugs)
// ============================================================================

export const ThermalDialWidget = forwardRef<HTMLDivElement, ThermalDialWidgetProps>(
  (
    {
      value: controlledValue,
      defaultValue = 38,
      min = 16,
      max = 45,
      step = 1,
      label = 'Summer',
      autoSeason = false,
      variant = 'ember',
      onChange,
      disabled = false,
      scale = 1,
      unit = 'C',
      className = '',
      style,
      ...rest
    },
    ref
  ) => {
    const uid = useId().replace(/:/g, '');
    const prefersReducedMotion = useReducedMotion();

    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = useState<number>(defaultValue);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [isFocused, setIsFocused] = useState<boolean>(false);

    const svgRef = useRef<SVGSVGElement | null>(null);

    const rawTemperature = isControlled ? controlledValue! : internalValue;
    const clampedTemp = Math.min(max, Math.max(min, Math.round(rawTemperature)));

    const animatedTemp = useCriticallyDampedValue(
      clampedTemp,
      prefersReducedMotion || isDragging
    );

    const effectiveSeason: SeasonMode = useMemo(() => {
      if (autoSeason) return deriveSeasonFromTemp(clampedTemp);
      if (
        label === 'Summer' ||
        label === 'Spring' ||
        label === 'Autumn' ||
        label === 'Winter'
      ) {
        return label;
      }
      return deriveSeasonFromTemp(clampedTemp);
    }, [autoSeason, clampedTemp, label]);

    const displayLabel = autoSeason ? effectiveSeason : label;

    const palette: ThermalPalette = useMemo(() => {
      if (variant !== 'auto') return PALETTES[variant];
      switch (effectiveSeason) {
        case 'Summer':
          return PALETTES.ember;
        case 'Spring':
          return PALETTES.solar;
        case 'Autumn':
          return PALETTES.amber;
        case 'Winter':
          return PALETTES.frost;
      }
    }, [variant, effectiveSeason]);

    const updateTemperature = useCallback(
      (nextVal: number) => {
        if (disabled) return;
        const snapped = Math.min(max, Math.max(min, Math.round(nextVal / step) * step));
        if (!isControlled) {
          setInternalValue(snapped);
        }
        onChange?.(snapped, deriveSeasonFromTemp(snapped));
      },
      [disabled, isControlled, max, min, onChange, step]
    );

    const tempToAngle = useCallback(
      (t: number) => {
        if (min === 16 && max === 45) {
          return -72 + ((t - 16) / (38 - 16)) * (25.73 - -72);
        }
        const ratio = (t - min) / Math.max(1, max - min);
        return -72 + ratio * 144;
      },
      [min, max]
    );

    const angleToTemp = useCallback(
      (deg: number) => {
        const clampedDeg = Math.max(-75, Math.min(75, deg));
        if (min === 16 && max === 45) {
          return 16 + ((clampedDeg - -72) / (25.73 - -72)) * (38 - 16);
        }
        const ratio = (clampedDeg - -72) / 144;
        return min + ratio * (max - min);
      },
      [min, max]
    );

    const currentNeedleAngle = tempToAngle(animatedTemp);

    const handlePointerToTemp = useCallback(
      (clientX: number, clientY: number) => {
        if (!svgRef.current || disabled) return;
        const rect = svgRef.current.getBoundingClientRect();
        // Card local coordinate space is 466 x 473 (shifted by -49, -17 from 543x511)
        const svgX = ((clientX - rect.left) / rect.width) * 466;
        const svgY = ((clientY - rect.top) / rect.height) * 473;

        const cx = 233.5;
        const cy = 358.0;
        const dx = svgX - cx;
        const dy = cy - svgY;
        const deg = (Math.atan2(dx, dy) * 180) / Math.PI;
        updateTemperature(angleToTemp(deg));
      },
      [angleToTemp, disabled, updateTemperature]
    );

    const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
      if (disabled) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(true);
      handlePointerToTemp(e.clientX, e.clientY);
    };

    const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
      if (!isDragging || disabled) return;
      handlePointerToTemp(e.clientX, e.clientY);
    };

    const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
      if (!isDragging) return;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      setIsDragging(false);
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      const jump = e.shiftKey ? step * 5 : step;
      switch (e.key) {
        case 'ArrowUp':
        case 'ArrowRight':
          e.preventDefault();
          updateTemperature(clampedTemp + jump);
          break;
        case 'ArrowDown':
        case 'ArrowLeft':
          e.preventDefault();
          updateTemperature(clampedTemp - jump);
          break;
        case 'PageUp':
          e.preventDefault();
          updateTemperature(clampedTemp + step * 5);
          break;
        case 'PageDown':
          e.preventDefault();
          updateTemperature(clampedTemp - step * 5);
          break;
        case 'Home':
          e.preventDefault();
          updateTemperature(min);
          break;
        case 'End':
          e.preventDefault();
          updateTemperature(max);
          break;
      }
    };

    const formatted = String(Math.abs(clampedTemp)).padStart(2, '0').slice(-2);
    const tensChar = formatted[0];
    const onesChar = formatted[1];
    const tensPath = DIGIT_PATHS[tensChar] || DIGIT_PATHS['3'];
    const onesPath = DIGIT_PATHS[onesChar] || DIGIT_PATHS['8'];

    // Dial center in 466x473 card space: (233.5, 358.0)
    const needleCoords = useMemo(() => {
      const cx = 233.5;
      const cy = 358.0;
      const rad = (currentNeedleAngle * Math.PI) / 180;
      const rStart = 128;
      const rEnd = 247.5;
      return {
        x1: cx + rStart * Math.sin(rad),
        y1: cy - rStart * Math.cos(rad),
        x2: cx + rEnd * Math.sin(rad),
        y2: cy - rEnd * Math.cos(rad),
      };
    }, [currentNeedleAngle]);

    const radialTicks = useMemo(() => {
      const cx = 233.5;
      const cy = 358.0;
      const rIn = 207;
      const rOut = 223;
      const items: Array<{
        deg: number;
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        stroke: string;
        opacity: number;
      }> = [];

      for (let deg = -90; deg <= 90; deg += 3) {
        if (Math.abs(deg - currentNeedleAngle) < 1.65) continue;

        const rad = (deg * Math.PI) / 180;
        const x1 = cx + rIn * Math.sin(rad);
        const y1 = cy - rIn * Math.cos(rad);
        const x2 = cx + rOut * Math.sin(rad);
        const y2 = cy - rOut * Math.cos(rad);

        const absDeg = Math.abs(deg);
        const stroke = absDeg > 58 ? palette.tickWarm : '#565455';
        const opacity = absDeg > 78 ? Math.max(0.22, 0.88 - (absDeg - 78) * 0.04) : 0.88;

        items.push({ deg, x1, y1, x2, y2, stroke, opacity });
      }
      return items;
    }, [currentNeedleAngle, palette.tickWarm]);

    return (
      <div
        ref={ref}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={`${displayLabel} temperature control`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={clampedTemp}
        aria-valuetext={`${clampedTemp} degrees ${
          unit === 'C' ? 'Celsius' : 'Fahrenheit'
        } (${displayLabel})`}
        aria-disabled={disabled}
        onKeyDown={onKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`relative inline-flex select-none items-center justify-center outline-none ${
          disabled ? 'cursor-not-allowed opacity-70' : 'cursor-grab active:cursor-grabbing'
        } ${className}`}
        style={{
          width: `${Math.round(466 * scale)}px`,
          height: `${Math.round(473 * scale)}px`,
          ...style,
        }}
        {...rest}
      >
        {/*
          PURE CSS SQUIRCLE CONTAINER (466 x 473, radius: 25.5%)
          - Seam-free CSS radial-gradient thermal horizon (no SVG feGaussianBlur seams)
          - Crisp 1.75px specular rim border using CSS mask-composite
          - Smooth inset & subtle outer rim glow
        */}
        <div
          className="relative h-full w-full overflow-hidden rounded-[25.5%] bg-[#020202]"
          style={{
            boxShadow: palette.rimShadow,
          }}
        >
          {/* Top Inner Metallic Sheen */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[16%]"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 45%, transparent 100%)',
            }}
          />

          {/* Seamless Inner Thermal Horizon Glow (Zero horizontal seams, zero blur boxes) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: palette.innerHorizon,
            }}
          />

          {/* Interactive Dial & Display Numerals SVG (466 x 473) */}
          <svg
            ref={svgRef}
            viewBox="0 0 466 473"
            className="relative z-10 h-full w-full touch-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <defs>
{/* Tens Digit Vertical Fill Gradient */}
              <linearGradient
                id={`tensGrad-${uid}`}
                x1="68"
                y1="0"
                x2="68"
                y2="180"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#f2f0f1" stopOpacity="0.97" />
                <stop offset="26%" stopColor="#f8f6f7" stopOpacity="0.98" />
                <stop offset="48%" stopColor="#e5e1e2" stopOpacity="0.92" />
                <stop offset="68%" stopColor="#b8a19f" stopOpacity="0.65" />
                <stop offset="84%" stopColor={palette.tensTint1} stopOpacity="0.34" />
                <stop offset="100%" stopColor={palette.tensTint2} stopOpacity="0.06" />
              </linearGradient>

              {/* Ones Digit Vertical Fill Gradient */}
              <linearGradient
                id={`onesGrad-${uid}`}
                x1="68"
                y1="0"
                x2="68"
                y2="180"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#c8c8c8" stopOpacity="0.96" />
                <stop offset="14%" stopColor="#efedee" stopOpacity="0.99" />
                <stop offset="34%" stopColor="#fbf9fa" stopOpacity="1" />
                <stop offset="56%" stopColor="#f6f4f5" stopOpacity="0.98" />
                <stop offset="72%" stopColor="#eddfdf" stopOpacity="0.92" />
                <stop offset="86%" stopColor="#d9b0ae" stopOpacity="0.78" />
                <stop offset="95%" stopColor={palette.onesTint1} stopOpacity="0.58" />
                <stop offset="100%" stopColor={palette.onesTint2} stopOpacity="0.40" />
              </linearGradient>

              {/* Indicator Needle Gradient */}
              <linearGradient
                id={`needleGrad-${uid}`}
                x1={needleCoords.x2}
                y1={needleCoords.y2}
                x2={needleCoords.x1}
                y2={needleCoords.y1}
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#d9d9d9" />
                <stop offset="55%" stopColor="#969696" />
                <stop offset="100%" stopColor="#424242" />
              </linearGradient>
            </defs>

            {/* Radial Dial Ticks Arc (center: 233.5, 358, R: 207..223) */}
            <g strokeWidth="2.15" strokeLinecap="round">
              {radialTicks.map((t) => (
                <line
                  key={t.deg}
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke={t.stroke}
                  strokeOpacity={t.opacity}
                />
              ))}
            </g>

            {/* Long Pointer Needle Line */}
            <line
              x1={needleCoords.x1}
              y1={needleCoords.y1}
              x2={needleCoords.x2}
              y2={needleCoords.y2}
              stroke={`url(#needleGrad-${uid})`}
              strokeWidth="2.4"
              strokeLinecap="round"
            />

            {/* Top Season Label */}
            <HeaderLabelSVG label={displayLabel} />

            {/* Tens Digit (x=96, y=264 — clean 12px overlap with Ones Digit, never cuts stems) */}
            <g transform="translate(96, 264)">
              <path d={tensPath} fill={`url(#tensGrad-${uid})`} fillRule="evenodd" />
            </g>

            {/* Ones Digit (x=220, y=234 — 30px higher than Tens Digit with soft drop shadow) */}
            <g transform="translate(220, 234)" style={{ filter: "drop-shadow(-10px 6px 8px rgba(0, 0, 0, 0.78))" }}>
              <path d={onesPath} fill={`url(#onesGrad-${uid})`} fillRule="evenodd" />
            </g>

            {/* Hollow Rounded-Square Degree Symbol "°" (x=368, y=229 — 12px clear of Ones Digit) */}
            <rect
              x="368"
              y="229"
              width="17"
              height="14"
              rx="3.6"
              ry="3.6"
              fill="none"
              stroke="#d3d1d2"
              strokeWidth="4.3"
            />
          </svg>

          {/* Crisp 1.75px Specular Rim Border (CSS mask-composite — 100% hugs squircle curve) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 rounded-[25.5%]"
            style={{
              padding: isFocused ? '2.5px' : '1.75px',
              background: palette.rimBorder,
              WebkitMask:
                'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
          />
        </div>
      </div>
    );
  }
);

ThermalDialWidget.displayName = 'ThermalDialWidget';

// ============================================================================
// 21ST.DEV READY DEMO WRAPPER (default.tsx) & STUDIO CONTROLLER
// ============================================================================

interface PresetConfig {
  season: SeasonMode;
  temp: number;
  icon: React.ComponentType<{ className?: string }>;
}

const SEASON_PRESETS: PresetConfig[] = [
  { season: 'Summer', temp: 38, icon: Flame },
  { season: 'Spring', temp: 26, icon: Sun },
  { season: 'Autumn', temp: 20, icon: Wind },
  { season: 'Winter', temp: 16, icon: Snowflake },
];

const DEFAULT_TSX_SNIPPET = `import React, { useState } from "react";
import { ThermalDialWidget, SeasonMode } from "@/components/ui/thermal-dial-widget";

export default function ThermalDialWidgetDemo() {
  const [temperature, setTemperature] = useState<number>(38);
  const [season, setSeason] = useState<SeasonMode>("Summer");

  return (
    <div className="flex min-h-[600px] w-full flex-col items-center justify-center bg-black p-6">
      <ThermalDialWidget
        value={temperature}
        label={season}
        autoSeason={true}
        variant="ember"
        scale={0.85}
        onChange={(nextTemp, nextSeason) => {
          setTemperature(nextTemp);
          setSeason(nextSeason);
        }}
      />
    </div>
  );
}`;

const METADATA_SNIPPET = `Name: Thermal Dial Thermostat Widget
Slug: thermal-dial-widget
Description: A tactile dark-mode squircle climate dial widget featuring a 61-tick radial gauge, staggered modular display typography, critically damped needle physics, and a specular rim-glow horizon.
Tags: thermostat, weather, dial, gauge, widget`;

export default function App() {
  const [temperature, setTemperature] = useState<number>(38);
  const [season, setSeason] = useState<SeasonMode>('Summer');
  const [autoSeason, setAutoSeason] = useState<boolean>(true);
  const [variant, setVariant] = useState<ThermalVariant>('ember');

  const handlePreset = (preset: PresetConfig) => {
    setSeason(preset.season);
    setTemperature(preset.temp);
  };

  const handleTempChange = (nextTemp: number, derivedSeason: SeasonMode) => {
    setTemperature(nextTemp);
    if (autoSeason) {
      setSeason(derivedSeason);
    }
  };

  const handleResetReference = () => {
    setSeason('Summer');
    setTemperature(38);
    setAutoSeason(true);
    setVariant('ember');
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-black text-zinc-100 selection:bg-orange-500/30">


      {/* Main 1:1 Reference Widget Stage */}
      <main className="flex flex-1 items-center justify-center p-4">
        <ThermalDialWidget
          value={temperature}
          label={season}
          autoSeason={autoSeason}
          variant={variant}
          scale={0.86}
          onChange={handleTempChange}
        />
      </main>

      {/* 21st.dev Interactive Controller Dock */}
      
        <aside
          aria-label="21st.dev Demo Controller"
          className="fixed bottom-4 z-20 flex max-w-[95vw] flex-wrap items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-zinc-950/90 px-3.5 py-2.5 shadow-2xl backdrop-blur-xl"
        >
          {/* Season Presets */}
          <div className="flex items-center gap-1">
            {SEASON_PRESETS.map((p) => {
              const Icon = p.icon;
              const currentDisplayedSeason = autoSeason
                ? deriveSeasonFromTemp(temperature)
                : season;
              const isActive = currentDisplayedSeason === p.season;
              return (
                <button
                  key={p.season}
                  type="button"
                  onClick={() => handlePreset(p)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/40'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{p.season}</span>
                  <span className="font-mono text-[11px] opacity-70">{p.temp}°</span>
                </button>
              );
            })}
          </div>

          <div className="h-4 w-px bg-white/10" />

          {/* Temperature Scrubber */}
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="w-9 font-mono text-zinc-200">{temperature}°C</span>
            <input
              type="range"
              min={16}
              max={45}
              step={1}
              value={temperature}
              onChange={(e) => {
                const next = Number(e.target.value);
                handleTempChange(next, deriveSeasonFromTemp(next));
              }}
              className="h-1.5 w-24 cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-orange-500"
            />
          </label>

          <div className="h-4 w-px bg-white/10" />

          {/* Auto-Season Sync Toggle */}
          <button
            type="button"
            onClick={() => setAutoSeason((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              autoSeason
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Automatically sync Season label with Temperature range"
          >
            {autoSeason ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            <span>{autoSeason ? 'Auto Season' : 'Locked Label'}</span>
          </button>

          {/* Glow Theme Mode Toggle */}
          <button
            type="button"
            onClick={() => setVariant((prev) => (prev === 'ember' ? 'auto' : 'ember'))}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              variant === 'auto'
                ? 'border-sky-500/30 bg-sky-500/10 text-sky-300'
                : 'border-orange-500/30 bg-orange-500/10 text-orange-300'
            }`}
            title="Switch between 1:1 Reference Ember Glow and Adaptive Seasonal Glow"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{variant === 'ember' ? '1:1 Ember Glow' : 'Adaptive Glow'}</span>
          </button>

          {/* Reset to Exact 38° Summer Reference */}
          <button
            type="button"
            onClick={handleResetReference}
            className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
            title="Reset to exact reference state (Summer 38°)"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset 38°</span>
          </button>
        </aside>


    </div>
  );
}