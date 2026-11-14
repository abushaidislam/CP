"use client";

import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface FmRadioTunerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** Controlled frequency value */
  value?: number;
  /** Uncontrolled initial frequency (default: 101.4) */
  defaultValue?: number;
  /** Minimum tunable frequency (default: 87.5) */
  min?: number;
  /** Maximum tunable frequency (default: 108.0) */
  max?: number;
  /** Tuning step increment (default: 0.1) */
  step?: number;
  /** Radio band badge text (default: 'FM') */
  band?: string;
  /** Frequency unit label on LCD (default: 'KHz') */
  unit?: string;
  /** Called continuously while tuning */
  onChange?: (frequency: number) => void;
  /** Called when drag/scrubbing or discrete tuning ends */
  onChangeEnd?: (frequency: number) => void;
  /** Optional callback when clicking the band badge (e.g., to toggle FM/AM) */
  onBandClick?: () => void;
  /** Enable subtle Web Audio tactile click on each step (default: false) */
  sound?: boolean;
  /** Disable user interaction */
  disabled?: boolean;
}

const PIXEL_DIGITS: Record<string, string[]> = {
  '0': ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  '1': ['.#.', '#.#', '..#', '..#', '..#', '..#', '..#'],
  '2': ['.###.', '#...#', '....#', '.###.', '#....', '#....', '#####'],
  '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  '4': ['...##', '..#.#', '.#..#', '#...#', '#####', '....#', '....#'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['.###.', '#....', '####.', '#...#', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  '.': ['.', '.', '.', '.', '.', '.', '#'],
  '-': ['...', '...', '...', '###', '...', '...', '...'],
};

const PIXEL_LETTERS: Record<string, string[]> = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  F: ['####', '#...', '#...', '###.', '#...', '#...', '#...'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  K: ['#..#', '#.#.', '##..', '##..', '#.#.', '#..#'],
  k: ['#...', '#..#', '#.#.', '##..', '#.#.', '#..#'],
  H: ['#..#', '#..#', '####', '#..#', '#..#', '#..#'],
  z: ['....', '....', '####', '..#.', '.#..', '####'],
  G: ['.###.', '#....', '#..##', '#...#', '.###.', '.....'],
  m: ['.....', '.....', '##.#.', '#.#.#', '#.#.#', '#...#'],
};

interface PixelTextProps {
  text: string;
  glyphs: Record<string, string[]>;
  pixelSize: number;
  gap?: number;
  color: string;
  className?: string;
}

const PixelText: React.FC<PixelTextProps> = ({
  text,
  glyphs,
  pixelSize,
  gap = 1,
  color,
  className,
}) => {
  const chars = text.split('');
  let cursorX = 0;
  const rects: Array<{ x: number; y: number }> = [];
  let maxRows = 0;

  chars.forEach((ch, idx) => {
    const grid = glyphs[ch];
    if (!grid) return;
    maxRows = Math.max(maxRows, grid.length);
    const charWidth = grid[0]?.length ?? 0;
    grid.forEach((row, r) => {
      for (let c = 0; c < row.length; c++) {
        if (row[c] === '#') {
          rects.push({
            x: (cursorX + c) * pixelSize,
            y: r * pixelSize,
          });
        }
      }
    });
    cursorX += charWidth + (idx < chars.length - 1 ? gap : 0);
  });

  const width = Math.max(1, cursorX * pixelSize);
  const height = Math.max(1, maxRows * pixelSize);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {rects.map((rect, i) => (
        <rect
          key={i}
          x={rect.x}
          y={rect.y}
          width={pixelSize}
          height={pixelSize}
          fill={color}
        />
      ))}
    </svg>
  );
};

const STEP_PX = 24.725;
const UNIT_PX = STEP_PX * 10;
const SPRING_STIFFNESS = 420;
const SPRING_DAMPING = 36;
const SPRING_MASS = 0.7;

function getDecimals(step: number): number {
  const str = step.toString();
  if (str.includes('e-')) {
    return parseInt(str.split('e-')[1] ?? '1', 10);
  }
  return Math.max(1, (str.split('.')[1] ?? '').length);
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

function clampAndRound(val: number, min: number, max: number, step: number): number {
  const clamped = clamp(val, min, max);
  const decimals = getDecimals(step);
  const snapped = Math.round((clamped - min) / step) * step + min;
  return Number(clamp(snapped, min, max).toFixed(decimals));
}

export const FmRadioTuner = forwardRef<HTMLDivElement, FmRadioTunerProps>(
  (
    {
      value,
      defaultValue = 101.4,
      min = 87.5,
      max = 108.0,
      step = 0.1,
      band = 'FM',
      unit = 'KHz',
      onChange,
      onChangeEnd,
      onBandClick,
      sound = false,
      disabled = false,
      className,
      onKeyDown,
      ...rest
    },
    ref
  ) => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState(() =>
      clampAndRound(defaultValue, min, max, step)
    );
    const snappedFreq = isControlled
      ? clampAndRound(value, min, max, step)
      : internalValue;

    const [isDragging, setIsDragging] = useState(false);
    const [visualFreq, setVisualFreq] = useState(snappedFreq);

    const dialRef = useRef<HTMLDivElement | null>(null);
    const dragStartRef = useRef<{ x: number; startFreq: number; moved: boolean } | null>(
      null
    );
    const latestFreqRef = useRef<number>(snappedFreq);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const lastSoundFreqRef = useRef<number>(snappedFreq);
    const springStateRef = useRef({
      value: snappedFreq,
      velocity: 0,
      target: snappedFreq,
      rafId: null as number | null,
      lastTime: 0,
    });

    latestFreqRef.current = snappedFreq;

    useEffect(() => {
      if (typeof window === 'undefined' || !window.matchMedia) return;
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const handleChange = (event: MediaQueryListEvent) => {
        setPrefersReducedMotion(event.matches);
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const stopSpring = useCallback(() => {
      if (springStateRef.current.rafId !== null) {
        cancelAnimationFrame(springStateRef.current.rafId);
        springStateRef.current.rafId = null;
      }
    }, []);

    const jumpSpringTo = useCallback(
      (target: number) => {
        stopSpring();
        springStateRef.current.value = target;
        springStateRef.current.velocity = 0;
        springStateRef.current.target = target;
        setVisualFreq(target);
      },
      [stopSpring]
    );

    const moveSpringTo = useCallback(
      (target: number) => {
        if (prefersReducedMotion) {
          jumpSpringTo(target);
          return;
        }
        springStateRef.current.target = target;
        if (springStateRef.current.rafId !== null) {
          return;
        }
        springStateRef.current.lastTime = performance.now();

        const tick = (now: number) => {
          const state = springStateRef.current;
          const dt = Math.min(0.032, Math.max(0.001, (now - state.lastTime) / 1000));
          state.lastTime = now;

          const steps = Math.max(1, Math.ceil(dt / 0.004));
          const subDt = dt / steps;

          for (let i = 0; i < steps; i++) {
            const displacement = state.value - state.target;
            const accel =
              (-SPRING_STIFFNESS * displacement - SPRING_DAMPING * state.velocity) /
              SPRING_MASS;
            state.velocity += accel * subDt;
            state.value += state.velocity * subDt;
          }

          if (
            Math.abs(state.value - state.target) < 0.0005 &&
            Math.abs(state.velocity) < 0.0005
          ) {
            state.value = state.target;
            state.velocity = 0;
            state.rafId = null;
            setVisualFreq(state.target);
            return;
          }

          setVisualFreq(state.value);
          state.rafId = requestAnimationFrame(tick);
        };

        springStateRef.current.rafId = requestAnimationFrame(tick);
      },
      [jumpSpringTo, prefersReducedMotion]
    );

    useEffect(() => {
      return () => stopSpring();
    }, [stopSpring]);

    useEffect(() => {
      if (!isDragging) {
        moveSpringTo(snappedFreq);
      }
    }, [snappedFreq, isDragging, moveSpringTo]);

    const playTickSound = useCallback(() => {
      if (!sound || typeof window === 'undefined') return;
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (!AudioCtx) return;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          void ctx.resume();
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1100, ctx.currentTime);
        gain.gain.setValueAtTime(0.035, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.018);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.02);
      } catch {
        // Ignore audio errors when blocked by autoplay policy
      }
    }, [sound]);

    useEffect(() => {
      return () => {
        audioCtxRef.current?.close().catch(() => {});
      };
    }, []);

    const commitFrequency = useCallback(
      (nextRaw: number, triggerEnd = false) => {
        const next = clampAndRound(nextRaw, min, max, step);
        if (next !== lastSoundFreqRef.current) {
          lastSoundFreqRef.current = next;
          playTickSound();
        }
        if (!isControlled) {
          setInternalValue(next);
        }
        if (next !== latestFreqRef.current) {
          latestFreqRef.current = next;
          onChange?.(next);
        }
        if (triggerEnd) {
          onChangeEnd?.(next);
        }
      },
      [isControlled, max, min, onChange, onChangeEnd, playTickSound, step]
    );

    useEffect(() => {
      const el = dialRef.current;
      if (!el) return;
      const onWheel = (e: WheelEvent) => {
        if (disabled) return;
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (delta === 0) return;
        e.preventDefault();
        const dir = delta > 0 ? 1 : -1;
        const next = clampAndRound(latestFreqRef.current + dir * step, min, max, step);
        moveSpringTo(next);
        commitFrequency(next, true);
      };
      el.addEventListener('wheel', onWheel, { passive: false });
      return () => el.removeEventListener('wheel', onWheel);
    }, [commitFrequency, disabled, max, min, moveSpringTo, step]);

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        startFreq: visualFreq,
        moved: false,
      };
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || !dragStartRef.current || disabled) return;
      const dx = e.clientX - dragStartRef.current.x;
      if (Math.abs(dx) > 2) {
        dragStartRef.current.moved = true;
      }
      const continuousFreq = clamp(
        dragStartRef.current.startFreq - dx / UNIT_PX,
        min,
        max
      );
      jumpSpringTo(continuousFreq);
      commitFrequency(continuousFreq, false);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      const startInfo = dragStartRef.current;
      setIsDragging(false);
      dragStartRef.current = null;

      if (startInfo && !startInfo.moved && dialRef.current) {
        const rect = dialRef.current.getBoundingClientRect();
        const clickOffsetX = e.clientX - (rect.left + rect.width / 2);
        const targetFreq = clampAndRound(
          visualFreq + clickOffsetX / UNIT_PX,
          min,
          max,
          step
        );
        moveSpringTo(targetFreq);
        commitFrequency(targetFreq, true);
        return;
      }

      const snapped = clampAndRound(latestFreqRef.current, min, max, step);
      moveSpringTo(snapped);
      onChangeEnd?.(snapped);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e);
      if (disabled || e.defaultPrevented) return;
      const multiplier = e.shiftKey ? 10 : 1;
      let next: number | null = null;
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          e.preventDefault();
          next = latestFreqRef.current + step * multiplier;
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          e.preventDefault();
          next = latestFreqRef.current - step * multiplier;
          break;
        case 'PageUp':
          e.preventDefault();
          next = latestFreqRef.current + step * 10;
          break;
        case 'PageDown':
          e.preventDefault();
          next = latestFreqRef.current - step * 10;
          break;
        case 'Home':
          e.preventDefault();
          next = min;
          break;
        case 'End':
          e.preventDefault();
          next = max;
          break;
      }
      if (next !== null) {
        const clamped = clampAndRound(next, min, max, step);
        moveSpringTo(clamped);
        commitFrequency(clamped, true);
      }
    };

    const decimals = getDecimals(step);
    const formattedFreq = snappedFreq.toFixed(decimals);

    const distToNearestInt = Math.abs(visualFreq - Math.round(visualFreq));
    const topCenterTickOpacity = clamp((distToNearestInt - 0.08) / 0.14, 0, 1);

    const visibleStart = Math.max(min, Math.floor((visualFreq - 0.95) * 10) / 10);
    const visibleEnd = Math.min(max, Math.ceil((visualFreq + 0.95) * 10) / 10);
    const ticks: number[] = [];
    for (let t = Math.round(visibleStart * 10); t <= Math.round(visibleEnd * 10); t++) {
      ticks.push(t / 10);
    }

    return (
      <div
        ref={ref}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={`${band} Radio Tuner`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={snappedFreq}
        aria-valuetext={`${formattedFreq} ${unit}`}
        aria-disabled={disabled}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative h-[400px] w-[400px] select-none overflow-hidden rounded-[80px] bg-[#1E1E1E] dark:bg-[#1E1E1E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#52C4B7] focus-visible:ring-offset-4 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950',
          disabled && 'opacity-60',
          className
        )}
        {...rest}
      >
        {/* LCD Display Screen */}
        <div
          className="relative mx-[18px] mt-[17.5px] h-[172px] w-[364px] overflow-hidden rounded-tl-[62px] rounded-tr-[62px] rounded-bl-[50px] rounded-br-[50px]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(105deg, #52C4B7 0%, #44C0B2 55%, #3BBCAF 100%)',
            backgroundSize: '7.5px 7.5px, 7.5px 7.5px, 100% 100%',
            boxShadow: 'inset 0 2px 5px rgba(0, 0, 0, 0.14)',
          }}
        >
          {/* Band Badge */}
          {onBandClick ? (
            <button
              type="button"
              disabled={disabled}
              onClick={onBandClick}
              aria-label={`Band ${band}, switch band`}
              className={cn(
                'absolute left-[27.5px] top-[27.5px] flex h-[30px] w-[49px] cursor-pointer items-center justify-center rounded-[8px] bg-[#2A3A3C] dark:bg-[#2A3A3C] transition-[opacity,transform] duration-150 hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#222828]',
                !prefersReducedMotion && 'active:scale-[0.94]'
              )}
            >
              <PixelText
                text={band}
                glyphs={PIXEL_LETTERS}
                pixelSize={2.5}
                gap={2}
                color="#55C5B5"
              />
            </button>
          ) : (
            <div className="absolute left-[27.5px] top-[27.5px] flex h-[30px] w-[49px] items-center justify-center rounded-[8px] bg-[#2A3A3C] dark:bg-[#2A3A3C]">
              <PixelText
                text={band}
                glyphs={PIXEL_LETTERS}
                pixelSize={2.5}
                gap={2}
                color="#55C5B5"
              />
            </div>
          )}

          {/* Main Frequency Readout + Unit */}
          <div className="absolute left-[32.5px] top-[93px] flex items-end">
            <span className="sr-only">
              {formattedFreq} {unit}
            </span>
            <PixelText
              text={formattedFreq}
              glyphs={PIXEL_DIGITS}
              pixelSize={7.75}
              gap={1.35}
              color="#222828"
            />
            <div className="mb-[0.5px] ml-[17.5px]">
              <PixelText
                text={unit}
                glyphs={PIXEL_LETTERS}
                pixelSize={4.25}
                gap={1.05}
                color="#222828"
              />
            </div>
          </div>
        </div>

        {/* Interactive Analog Dial Scale */}
        <div
          ref={dialRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={cn(
            'relative h-[210.5px] w-full touch-none overflow-hidden',
            disabled ? 'cursor-not-allowed' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
          )}
        >
          {/* Top & Bottom Center Reference Ticks */}
          <div
            aria-hidden="true"
            style={{ opacity: topCenterTickOpacity }}
            className="pointer-events-none absolute left-1/2 top-[23.5px] h-[33px] w-[1.5px] -translate-x-1/2 rounded-full bg-[#343434] dark:bg-[#343434]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[154.5px] h-[32.5px] w-[1.5px] -translate-x-1/2 rounded-full bg-[#343434] dark:bg-[#343434]"
          />

          {/* Dynamic Frequency Ticks & Labels */}
          {ticks.map((tickVal) => {
            const offsetPx = (tickVal - visualFreq) * UNIT_PX;
            const leftPx = 200 + offsetPx;
            const isMajor = Math.abs(tickVal - Math.round(tickVal)) < 0.001;

            const distFromCenter = Math.abs(offsetPx);
            const proximity = prefersReducedMotion
              ? 0
              : Math.max(0, 1 - distFromCenter / 90);
            const tickScaleY = isMajor ? 1 + proximity * 0.08 : 1 + proximity * 0.14;
            const labelScale = 1 + proximity * 0.06;

            return (
              <React.Fragment key={tickVal.toFixed(1)}>
                {isMajor && (
                  <span
                    style={{
                      left: `${leftPx}px`,
                      transform: `translateX(-50%) scale(${labelScale})`,
                    }}
                    className="pointer-events-none absolute top-[37.5px] font-mono text-[19px] font-normal leading-none tracking-[0.04em] text-[#F0F0F0] dark:text-[#F0F0F0] tabular-nums will-change-transform"
                  >
                    {Math.round(tickVal)}
                  </span>
                )}
                <div
                  aria-hidden="true"
                  style={{
                    left: `${leftPx}px`,
                    transform: `translateX(-50%) scaleY(${tickScaleY})`,
                  }}
                  className={cn(
                    'pointer-events-none -translate-x-1/2 rounded-full will-change-transform',
                    isMajor
                      ? 'absolute top-[80.5px] h-[50px] w-[2px] bg-white dark:bg-white'
                      : 'absolute top-[89px] h-[33px] w-[1.5px] bg-[#373737] dark:bg-[#373737]'
                  )}
                />
              </React.Fragment>
            );
          })}

          {/* Center White Tuning Needle Pill */}
          <div
            aria-hidden="true"
            style={{
              transform:
                !prefersReducedMotion && isDragging
                  ? 'translateX(-50%) scaleX(0.92) scaleY(1.07)'
                  : 'translateX(-50%) scaleX(1) scaleY(1)',
            }}
            className="pointer-events-none absolute left-1/2 top-[61.5px] h-[88px] w-[14px] rounded-[7px] bg-white dark:bg-white transition-transform duration-150 ease-out"
          />
        </div>
      </div>
    );
  }
);

FmRadioTuner.displayName = 'FmRadioTuner';

export { FmRadioTuner as Component };
export default FmRadioTuner;
