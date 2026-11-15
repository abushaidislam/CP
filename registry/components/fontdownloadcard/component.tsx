'use client';

import React, {
  forwardRef,
  useId,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type HTMLMotionProps,
} from 'framer-motion';
import { cn } from '@/lib/utils';

export interface FontDownloadCardProps
  extends Omit<HTMLMotionProps<'article'>, 'title' | 'children'> {
  /** Custom class names merged onto the root card container */
  className?: string;
  /** Font family display name */
  title?: string;
  /** Foundry or catalog label */
  sourceLabel?: string;
  /** Telemetry metric label */
  metricLabel?: string;
  /** Telemetry metric formatted value */
  metricValue?: string;
  /** Specimen glyph preview text inside the accent tile */
  specimenText?: string;
  /** Available downloadable font formats */
  formats?: string[];
  /** Controlled active format */
  activeFormat?: string;
  /** Uncontrolled default active format */
  defaultActiveFormat?: string;
  /** Callback fired when a format pill is selected */
  onDownloadFormat?: (format: string) => void;
  /** Callback fired when the specimen tile is clicked */
  onSpecimenClick?: () => void;
  /** Enable/disable crisp LED matrix activity animation */
  animateLeds?: boolean;
  /**
   * Optional custom 50x48 dot matrix rows (17 bottom rows or up to 48 rows).
   * Defaults to the exact 50x48 telemetry equalizer pattern from the design.
   */
  activeDotRows?: Array<{ row: number; pattern: string }>;
}

/**
 * Exact 50-column x 48-row active orange dot pattern.
 * Rows 0..30 are unlit (#262425); rows 31..47 form the active telemetry spectrum (#FF5F01).
 */
const DEFAULT_ACTIVE_DOT_ROWS: Array<{ row: number; pattern: string }> = [
  { row: 31, pattern: '.......O..........................................' },
  { row: 32, pattern: '.......O..............................O...........' },
  { row: 33, pattern: '.................O.OO.........................O...' },
  { row: 34, pattern: '.......................O........O.................' },
  { row: 35, pattern: '................O.....O..............O..O.O..O....' },
  { row: 36, pattern: '............OO.O.............O...................O' },
  { row: 37, pattern: '.O....O..................OOO............O......OOO' },
  { row: 38, pattern: '...............O........OOO....O......O........O..' },
  { row: 39, pattern: 'O.....O...O.OO...O........O.....O...O..O....OO..O.' },
  { row: 40, pattern: 'O...OO...O.O..........O..O.......OOOO.O.O...OOO.O.' },
  { row: 41, pattern: 'OO.OOO..O.OOOOO..O.OOO...O....O.......O.O.OOOOOO.O' },
  { row: 42, pattern: '....OO......OO.O.....O...O.O.O.OOO..O..O.OO...OOOO' },
  { row: 43, pattern: 'O.OOOO.O.OOO..O.OOOOO.O..O.O.OOO....OO.O....O.O...' },
  { row: 44, pattern: 'OOOOOOOO.OOO...O......OOOOOOOO.OOOOO..OO.O..O.O.OO' },
  { row: 45, pattern: 'OOOOOOOO.OOO...O......OOOOOOOO.OOOOO..OO.O..O.O.OO' },
  { row: 46, pattern: '..OOOOOOOOOOOOOOOOO...OOOO..O.OOOOOO.O.O.OO.OOOO..' },
  { row: 47, pattern: 'OOOOOOOOOO.O..OO.OOOOOO.OOOOOOOOOOOOOOOOO.OOOOOOOO' },
];

const SPECIMEN_CYCLE = ['Aa', 'Bb', 'Gg', '09'] as const;
const GRID_COLS = 50;
const GRID_ROWS = 48;
const PITCH_X = 6.84;
const PITCH_Y = 7.0;
const DOT_SIZE = 3;
const DOT_OFFSET_X = 9.5;
const DOT_OFFSET_Y = 6.5;

const SATOSHI_FONT_STACK =
  "'Satoshi', 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;

export const FontDownloadCard = forwardRef<HTMLElement, FontDownloadCardProps>(
  (
    {
      title = 'Satoshi Sans',
      sourceLabel = 'FONTSHARE · TYPEHOUSE',
      metricLabel = 'Downloads',
      metricValue = '2,3m.',
      specimenText,
      formats = ['.OTF', '.TTF', '.WOFF2'],
      activeFormat: controlledFormat,
      defaultActiveFormat = '.OTF',
      onDownloadFormat,
      onSpecimenClick,
      animateLeds = true,
      activeDotRows = DEFAULT_ACTIVE_DOT_ROWS,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const rawId = useId();
    const safeId = rawId.replace(/:/g, '');
    const patternId = `dot-matrix-${safeId}`;
    const headingId = `font-title-${safeId}`;
    const pillLayoutId = `format-pill-${safeId}`;
    const prefersReducedMotion = Boolean(useReducedMotion());

    const [uncontrolledFormat, setUncontrolledFormat] = useState<string>(
      defaultActiveFormat
    );
    const [hoveredCol, setHoveredCol] = useState<number | null>(null);
    const [downloadedFormat, setDownloadedFormat] = useState<string | null>(null);
    const [specimenIndex, setSpecimenIndex] = useState(0);
    const [isSurging, setIsSurging] = useState(false);
    const [rimPos, setRimPos] = useState<{ x: number; y: number } | null>(null);

    const surgeTimerRef = useRef<number | null>(null);
    const readyTimerRef = useRef<number | null>(null);

    useEffect(() => {
      return () => {
        if (surgeTimerRef.current !== null) window.clearTimeout(surgeTimerRef.current);
        if (readyTimerRef.current !== null) window.clearTimeout(readyTimerRef.current);
      };
    }, []);

    const shouldAnimate = animateLeds && !prefersReducedMotion;
    const currentFormat =
      controlledFormat !== undefined ? controlledFormat : uncontrolledFormat;
    const activeSpecimen =
      specimenText !== undefined ? specimenText : SPECIMEN_CYCLE[specimenIndex];

    const triggerSurge = useCallback((durationMs: number) => {
      if (surgeTimerRef.current !== null) window.clearTimeout(surgeTimerRef.current);
      setIsSurging(true);
      surgeTimerRef.current = window.setTimeout(() => {
        setIsSurging(false);
      }, durationMs);
    }, []);

    const handleFormatSelect = useCallback(
      (fmt: string) => {
        if (controlledFormat === undefined) {
          setUncontrolledFormat(fmt);
        }
        if (readyTimerRef.current !== null) window.clearTimeout(readyTimerRef.current);
        setDownloadedFormat(fmt);
        triggerSurge(450);
        onDownloadFormat?.(fmt);
        readyTimerRef.current = window.setTimeout(() => {
          setDownloadedFormat((prev) => (prev === fmt ? null : prev));
        }, 1200);
      },
      [controlledFormat, onDownloadFormat, triggerSurge]
    );

    const handleSpecimenPress = useCallback(() => {
      if (specimenText === undefined) {
        setSpecimenIndex((prev) => (prev + 1) % SPECIMEN_CYCLE.length);
      }
      triggerSurge(380);
      onSpecimenClick?.();
    }, [specimenText, onSpecimenClick, triggerSurge]);

    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLElement>) => {
        if (prefersReducedMotion) return;
        const rect = e.currentTarget.getBoundingClientRect();
        setRimPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      },
      [prefersReducedMotion]
    );

    const handleMouseLeave = useCallback(() => {
      setRimPos(null);
      setHoveredCol(null);
    }, []);

    const { columnCounts, activeDots } = useMemo(() => {
      const counts = new Array<number>(GRID_COLS).fill(0);
      const dots: Array<{
        row: number;
        col: number;
        delay: number;
        duration: number;
        tier: 'peak' | 'mid' | 'base';
      }> = [];

      for (const { row, pattern } of activeDotRows) {
        for (let col = 0; col < Math.min(pattern.length, GRID_COLS); col++) {
          if (pattern[col] === 'O') {
            counts[col] += 1;
            const tier = row <= 36 ? 'peak' : row <= 42 ? 'mid' : 'base';
            const hash = ((row * 31 + col * 17) % 23) / 23;
            dots.push({
              row,
              col,
              delay: Number((hash * 2.2).toFixed(2)),
              duration: Number((1.2 + (hash % 0.7) * 1.5).toFixed(2)),
              tier,
            });
          }
        }
      }
      return { columnCounts: counts, activeDots: dots };
    }, [activeDotRows]);

    return (
      <>
        <style>{`
          @import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap');

          @keyframes ledSharpTick {
            0%, 100% {
              opacity: 1;
              fill: #FF5F01;
            }
            45% {
              opacity: 0.25;
              fill: #B84200;
            }
            70% {
              opacity: 1;
              fill: #FF7B29;
            }
          }

          @keyframes ledBaseStep {
            0%, 100% {
              opacity: 0.92;
              fill: #FF5F01;
            }
            50% {
              opacity: 1;
              fill: #FF6E1A;
            }
          }

          .fdc-led-peak {
            animation-name: ledSharpTick;
            animation-timing-function: steps(2, end);
            animation-iteration-count: infinite;
          }

          .fdc-led-mid {
            animation-name: ledSharpTick;
            animation-timing-function: ease-in-out;
            animation-iteration-count: infinite;
          }

          .fdc-led-base {
            animation-name: ledBaseStep;
            animation-timing-function: ease-in-out;
            animation-iteration-count: infinite;
          }
        `}</style>

        <motion.article
          ref={ref}
          aria-labelledby={headingId}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ fontFamily: SATOSHI_FONT_STACK, ...style }}
          className={cn(
            'group/card relative w-full max-w-[371px] select-none rounded-[22px] p-[1px] shadow-[0_20px_48px_-16px_rgba(0,0,0,0.22)] dark:shadow-[0_24px_56px_-16px_rgba(0,0,0,0.65)]',
            className
          )}
          {...props}
        >
          {/* 1px Machined Specular Rim Highlight */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[22px]"
            style={{
              background: rimPos
                ? `radial-gradient(240px circle at ${rimPos.x}px ${rimPos.y}px, rgba(255, 95, 1, 0.55), rgba(255, 255, 255, 0.85) 38%, rgba(0, 0, 0, 0.08) 75%)`
                : 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.35) 35%, rgba(0,0,0,0.1) 100%)',
            }}
          />

          {/* Inner Card Surface (Light & Dark Theme Aware) */}
          <div className="relative rounded-[21px] bg-[#EEEEEE] p-[5px] text-[#121112] dark:bg-[#191819] dark:text-[#F4F4F5]">
            {/* Upper Dark Dot-Matrix Telemetry Display */}
            <div className="relative h-[349px] w-full overflow-hidden rounded-[16px] bg-[#0F0D0E]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-30 rounded-[16px] ring-1 ring-inset ring-white/[0.07]"
              />

              {/* 50x48 Crisp LED Dot Matrix SVG */}
              <svg
                viewBox="0 0 359 349"
                className="pointer-events-none absolute inset-0 h-full w-full"
                aria-hidden="true"
              >
                <defs>
                  <pattern
                    id={patternId}
                    x={DOT_OFFSET_X}
                    y={DOT_OFFSET_Y}
                    width={PITCH_X}
                    height={PITCH_Y}
                    patternUnits="userSpaceOnUse"
                  >
                    <rect
                      x={0}
                      y={0}
                      width={DOT_SIZE}
                      height={DOT_SIZE}
                      rx={0.65}
                      fill="#262425"
                    />
                  </pattern>
                </defs>

                <rect
                  x={DOT_OFFSET_X}
                  y={DOT_OFFSET_Y}
                  width={GRID_COLS * PITCH_X - (PITCH_X - DOT_SIZE)}
                  height={GRID_ROWS * PITCH_Y - (PITCH_Y - DOT_SIZE)}
                  fill={`url(#${patternId})`}
                />

                <g>
                  {activeDots.map(({ row, col, delay, duration, tier }) => {
                    const isColHovered = hoveredCol === col;
                    const animClass = shouldAnimate
                      ? tier === 'peak'
                        ? 'fdc-led-peak'
                        : tier === 'mid'
                          ? 'fdc-led-mid'
                          : 'fdc-led-base'
                      : undefined;

                    return (
                      <rect
                        key={`${row}-${col}`}
                        x={DOT_OFFSET_X + col * PITCH_X}
                        y={DOT_OFFSET_Y + row * PITCH_Y}
                        width={DOT_SIZE}
                        height={DOT_SIZE}
                        rx={0.65}
                        fill={isColHovered || isSurging ? '#FF8B3D' : '#FF5F01'}
                        className={animClass}
                        style={
                          shouldAnimate
                            ? {
                                animationDelay: `${delay}s`,
                                animationDuration: `${
                                  isSurging ? duration * 0.45 : duration
                                }s`,
                              }
                            : undefined
                        }
                      />
                    );
                  })}
                </g>
              </svg>

              {/* Interactive Column Hit Targets for Spectrum Scrubbing */}
              <div
                className="absolute inset-x-[9px] bottom-[6px] top-[190px] z-10 grid"
                style={{
                  gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
                }}
                role="img"
                aria-label={`${title} ${metricLabel.toLowerCase()} spectrum showing ${metricValue}`}
              >
                {columnCounts.map((count, colIdx) => (
                  <div
                    key={colIdx}
                    onMouseEnter={() => setHoveredCol(colIdx)}
                    onMouseLeave={() => setHoveredCol(null)}
                    title={`Band ${colIdx + 1}: ${count} active units`}
                    className="h-full w-full cursor-crosshair"
                  />
                ))}
              </div>

              {/* Metric Header Overlay (Fixed row height prevents any layout shift) */}
              <div className="pointer-events-none relative z-20 px-[20px] pt-[16px]">
                <div className="relative flex h-[16px] items-center justify-between">
                  <span className="text-[13px] font-medium leading-none tracking-[0.01em] text-[#E5E5E5]">
                    {metricLabel}
                  </span>

                  <AnimatePresence>
                    {hoveredCol !== null && (
                      <motion.span
                        initial={prefersReducedMotion ? false : { opacity: 0, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={prefersReducedMotion ? undefined : { opacity: 0, y: -2 }}
                        transition={{ duration: 0.14 }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 rounded bg-[#1D1A1B] px-1.5 py-[2px] font-mono text-[10px] font-medium leading-none text-[#FF7A2E] ring-1 ring-[#FF5F01]/35"
                      >
                        CH {String(hoveredCol + 1).padStart(2, '0')} ·{' '}
                        {columnCounts[hoveredCol]}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                <div
                  className="mt-[10px] font-bold leading-[0.86] tracking-[-0.045em] text-[#FAFAFA] tabular-nums"
                  style={{ fontSize: '94px' }}
                >
                  {metricValue}
                </div>
              </div>
            </div>

            {/* Lower Typehouse Footer Section */}
            <div className="flex items-stretch gap-[20px] pt-[8px]">
              <motion.button
                type="button"
                onClick={handleSpecimenPress}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                transition={{ duration: 0.12 }}
                aria-label={`Cycle ${title} specimen glyph (currently ${activeSpecimen})`}
                className="group/tile relative flex h-[128px] w-[123px] shrink-0 items-end justify-start overflow-hidden rounded-[12px] bg-[#FF5F01] px-[8px] pb-[7px] text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.32)] transition-colors duration-150 hover:bg-[#FF6B14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#121112] focus-visible:ring-offset-2 focus-visible:ring-offset-[#EEEEEE] dark:focus-visible:ring-[#FAFAFA] dark:focus-visible:ring-offset-[#191819]"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={activeSpecimen}
                    initial={
                      prefersReducedMotion
                        ? false
                        : { opacity: 0, y: 6, filter: 'blur(3px)' }
                    }
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={
                      prefersReducedMotion
                        ? undefined
                        : { opacity: 0, y: -6, filter: 'blur(3px)' }
                    }
                    transition={{ duration: 0.18, ease: EASE_OUT_EXPO }}
                    className="inline-block font-black leading-[0.76] tracking-[-0.05em] text-[#111011]"
                    style={{ fontSize: '84px' }}
                  >
                    {activeSpecimen}
                  </motion.span>
                </AnimatePresence>
              </motion.button>

              <div className="flex min-w-0 flex-1 flex-col justify-between pb-[12px] pt-[12px] pr-[6px]">
                <div>
                  <div className="flex items-center gap-[6px]">
                    <span
                      className="inline-block h-[4px] w-[4px] shrink-0 rounded-full bg-[#878586] dark:bg-[#71717A]"
                      aria-hidden="true"
                    />
                    <span className="truncate text-[10px] font-bold uppercase leading-none tracking-[0.09em] text-[#7A7879] dark:text-[#A1A1AA]">
                      {sourceLabel}
                    </span>
                  </div>

                  <h2
                    id={headingId}
                    className="mt-[8px] truncate text-[27px] font-bold leading-[1.08] tracking-[-0.03em] text-[#121112] dark:text-[#FAFAFA]"
                  >
                    {title}
                  </h2>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div
                    className="flex flex-wrap items-center gap-x-[4px] gap-y-1"
                    role="group"
                    aria-label={`Download ${title} font formats`}
                  >
                    {formats.map((fmt) => {
                      const isActive = currentFormat === fmt;
                      const isJustDownloaded = downloadedFormat === fmt;
                      return (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => handleFormatSelect(fmt)}
                          aria-pressed={isActive}
                          aria-label={`Download ${title} in ${fmt.replace('.', '')} format`}
                          className={cn(
                            'relative rounded-[5px] px-[6px] py-[3.5px] text-[10.5px] font-bold uppercase leading-none tracking-[0.06em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5F01]',
                            isActive || isJustDownloaded
                              ? 'text-[#FAFAFA] dark:text-[#121112]'
                              : 'text-[#595959] hover:text-[#121112] dark:text-[#A1A1AA] dark:hover:text-[#FAFAFA]'
                          )}
                        >
                          {isActive && (
                            <motion.span
                              layoutId={pillLayoutId}
                              transition={{
                                type: 'spring',
                                stiffness: 460,
                                damping: 34,
                              }}
                              className={cn(
                                'absolute inset-0 rounded-[5px]',
                                isJustDownloaded
                                  ? 'bg-[#FF5F01]'
                                  : 'bg-[#121112] dark:bg-[#FAFAFA]'
                              )}
                              aria-hidden="true"
                            />
                          )}
                          <span
                            className={cn(
                              'relative z-10',
                              isJustDownloaded && 'text-white'
                            )}
                          >
                            {fmt}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence>
                    {downloadedFormat && (
                      <motion.span
                        role="status"
                        aria-live="polite"
                        initial={prefersReducedMotion ? false : { opacity: 0, x: 4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={prefersReducedMotion ? undefined : { opacity: 0, x: 4 }}
                        transition={{ duration: 0.16 }}
                        className="text-[10px] font-semibold tracking-[0.04em] text-[#D94E00] dark:text-[#FF7A2E]"
                      >
                        Ready
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </motion.article>
      </>
    );
  }
);

FontDownloadCard.displayName = 'FontDownloadCard';

export default FontDownloadCard;
