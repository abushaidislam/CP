'use client';

import React, { forwardRef, useCallback, useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export interface TimerPreset {
  id: string;
  label: string;
  minutes: number;
}

export type TimerTheme = 'dark' | 'light';
export type TimerSize = 'sm' | 'md' | 'lg';
export type RingDirection = 'counter-clockwise' | 'clockwise';

export interface FocusTimerWidgetProps {
  /** Available duration presets displayed as pills above the timer card */
  presets?: TimerPreset[];
  /** Initial selected preset ID (must match one of the presets) */
  initialPresetId?: string;
  /** Optional initial remaining seconds override (defaults to active preset duration) */
  initialRemainingSeconds?: number;
  /** Whether the timer starts running on mount */
  initialRunning?: boolean;
  /** Whether clicking a preset pill automatically starts the countdown */
  autoStartOnPresetChange?: boolean;
  /** Header label above the digital countdown */
  label?: string;
  /** Label for the stop/reset action button */
  stopLabel?: string;
  /** Visual theme of the widget */
  theme?: TimerTheme;
  /** Proportional size variant */
  size?: TimerSize;
  /** Direction of the circular progress arc */
  ringDirection?: RingDirection;
  /** Show or hide the top duration preset pills */
  showPresets?: boolean;
  /** Show or hide the bottom dock indicator bar */
  showDockBar?: boolean;
  /** Play a subtle synthesized Web Audio chime when the countdown reaches 00:00 */
  soundEnabled?: boolean;
  /** Callback fired when the countdown completes */
  onComplete?: (preset: TimerPreset) => void;
  /** Callback fired when running state or active preset changes */
  onStateChange?: (state: {
    isRunning: boolean;
    remainingSeconds: number;
    activePreset: TimerPreset;
  }) => void;
  /** Additional className for the outer wrapper */
  className?: string;
}

export const DEFAULT_TIMER_PRESETS: TimerPreset[] = [
  { id: '5m', label: '5 mins', minutes: 5 },
  { id: '10m', label: '10 mins', minutes: 10 },
  { id: '20m', label: '20 mins', minutes: 20 },
];

const SIZE_CONFIG: Record<
  TimerSize,
  {
    pillGap: string;
    pillClass: string;
    cardClass: string;
    leftPad: string;
    labelText: string;
    timeText: string;
    stopBtn: string;
    dialSize: number;
    dialRadius: string;
    ringRadius: number;
    ringStroke: number;
    centerBtn: string;
    iconSize: string;
    dockBar: string;
    stackGap: string;
  }
> = {
  sm: {
    pillGap: 'gap-2.5',
    pillClass: 'h-8 px-3.5 rounded-[11px] text-[13px]',
    cardClass: 'w-[340px] h-[170px] rounded-[31px] p-[6.5px]',
    leftPad: 'pl-[21px] pr-2 py-[18px]',
    labelText: 'text-[13px]',
    timeText: 'text-[36px]',
    stopBtn: 'w-[88px] h-[30px] rounded-[9px] text-[12px]',
    dialSize: 157,
    dialRadius: 'rounded-[24.5px]',
    ringRadius: 55.5,
    ringStroke: 15.5,
    centerBtn: 'w-[74px] h-[74px]',
    iconSize: 'w-[18px] h-[18px]',
    dockBar: 'w-[98px] h-[5.5px]',
    stackGap: 'gap-3',
  },
  md: {
    pillGap: 'gap-3.5',
    pillClass: 'h-[39px] px-4 rounded-[13px] text-[15px]',
    cardClass: 'w-[416px] h-[208px] rounded-[38px] p-[8px]',
    leftPad: 'pl-[26px] pr-3 py-[22px]',
    labelText: 'text-[15px]',
    timeText: 'text-[44px]',
    stopBtn: 'w-[108px] h-[36px] rounded-[11px] text-[14px]',
    dialSize: 192,
    dialRadius: 'rounded-[30px]',
    ringRadius: 68,
    ringStroke: 19,
    centerBtn: 'w-[90px] h-[90px]',
    iconSize: 'w-[21px] h-[21px]',
    dockBar: 'w-[120px] h-[7px]',
    stackGap: 'gap-4',
  },
  lg: {
    pillGap: 'gap-4',
    pillClass: 'h-[46px] px-5 rounded-[15px] text-[17px]',
    cardClass: 'w-[496px] h-[248px] rounded-[45px] p-[9.5px]',
    leftPad: 'pl-[32px] pr-4 py-[26px]',
    labelText: 'text-[17px]',
    timeText: 'text-[52px]',
    stopBtn: 'w-[128px] h-[42px] rounded-[13px] text-[16px]',
    dialSize: 229,
    dialRadius: 'rounded-[35.5px]',
    ringRadius: 81,
    ringStroke: 22.5,
    centerBtn: 'w-[108px] h-[108px]',
    iconSize: 'w-[25px] h-[25px]',
    dockBar: 'w-[142px] h-[8px]',
    stackGap: 'gap-5',
  },
};

const THEME_TOKENS: Record<
  TimerTheme,
  {
    pillInactive: string;
    pillActive: string;
    cardBg: string;
    labelText: string;
    timeText: string;
    stopBtn: string;
    dialBg: string;
    ringTrack: string;
    ringActive: string;
    centerBtnBg: string;
    centerIcon: string;
    dockBar: string;
    focusRing: string;
  }
> = {
  dark: {
    pillInactive: 'bg-[#b2b3b7] text-[#ffffff] hover:bg-[#a4a5aa]',
    pillActive: 'bg-[#174d71] text-[#2cf8ff]',
    cardBg: 'bg-[#010101] shadow-[0_20px_48px_-16px_rgba(0,0,0,0.35)]',
    labelText: 'text-[#f0f0f0]',
    timeText: 'text-[#ffffff]',
    stopBtn: 'bg-[#303030] text-[#ffffff] hover:bg-[#3d3d3d]',
    dialBg: 'bg-[#184d6c]',
    ringTrack: '#12364c',
    ringActive: '#0edafb',
    centerBtnBg: 'bg-[#010101] hover:bg-[#0d0d0d]',
    centerIcon: 'text-[#ffffff]',
    dockBar: 'bg-[#010101]',
    focusRing: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0edafb] focus-visible:ring-offset-2 focus-visible:ring-offset-[#010101]',
  },
  light: {
    pillInactive: 'bg-[#e2e4e9] text-[#52555e] hover:bg-[#d6d9e0]',
    pillActive: 'bg-[#0e6b94] text-[#ffffff]',
    cardBg: 'bg-[#ffffff] shadow-[0_20px_48px_-16px_rgba(15,23,42,0.16)] ring-1 ring-black/5',
    labelText: 'text-[#64748b]',
    timeText: 'text-[#0f172a]',
    stopBtn: 'bg-[#f1f5f9] text-[#0f172a] hover:bg-[#e2e8f0]',
    dialBg: 'bg-[#e6f3fa]',
    ringTrack: '#c7e2f0',
    ringActive: '#0284c7',
    centerBtnBg: 'bg-[#ffffff] hover:bg-[#f8fafc] shadow-sm',
    centerIcon: 'text-[#0f172a]',
    dockBar: 'bg-[#0f172a]/85',
    focusRing: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ffffff]',
  },
};

function formatTime(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const FocusTimerWidget = forwardRef<HTMLDivElement, FocusTimerWidgetProps>(
  function FocusTimerWidget(
    {
      presets = DEFAULT_TIMER_PRESETS,
      initialPresetId,
      initialRemainingSeconds,
      initialRunning = true,
      autoStartOnPresetChange = true,
      label = 'Timer',
      stopLabel = 'Stop',
      theme = 'dark',
      size = 'md',
      ringDirection = 'counter-clockwise',
      showPresets = true,
      showDockBar = true,
      soundEnabled = false,
      onComplete,
      onStateChange,
      className,
    },
    ref
  ) {
    const prefersReducedMotion = useReducedMotion();
    const timerHeadingId = useId();
    const audioCtxRef = useRef<AudioContext | null>(null);

    const safePresets = presets.length > 0 ? presets : DEFAULT_TIMER_PRESETS;
    const defaultPreset =
      safePresets.find((p) => p.id === initialPresetId) ??
      safePresets[safePresets.length - 1];

    const [activePresetId, setActivePresetId] = useState<string>(defaultPreset.id);
    const activePreset =
      safePresets.find((p) => p.id === activePresetId) ?? defaultPreset;

    const totalSeconds = Math.max(1, Math.round(activePreset.minutes * 60));

    const [remainingSeconds, setRemainingSeconds] = useState<number>(() =>
      initialRemainingSeconds !== undefined
        ? Math.min(Math.max(0, initialRemainingSeconds), totalSeconds)
        : totalSeconds
    );
    const [isRunning, setIsRunning] = useState<boolean>(
      initialRunning &&
        (initialRemainingSeconds === undefined || initialRemainingSeconds > 0)
    );
    const [statusAnnouncement, setStatusAnnouncement] = useState<string>('');

    const playCompletionChime = useCallback(() => {
      if (!soundEnabled || typeof window === 'undefined') return;
      try {
        const AudioContextCtor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!AudioContextCtor) return;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContextCtor();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          void ctx.resume();
        }
        const now = ctx.currentTime;
        const notes = [523.25, 659.25];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.14);
          gain.gain.setValueAtTime(0.0001, now + idx * 0.14);
          gain.gain.exponentialRampToValueAtTime(0.08, now + idx * 0.14 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 0.42);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.14);
          osc.stop(now + idx * 0.14 + 0.45);
        });
      } catch {
        // Ignore audio errors when blocked by browser autoplay policy
      }
    }, [soundEnabled]);

    useEffect(() => {
      return () => {
        if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
          void audioCtxRef.current.close().catch(() => {});
        }
      };
    }, []);

    useEffect(() => {
      if (!isRunning) return;
      const interval = window.setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            window.clearInterval(interval);
            setIsRunning(false);
            setStatusAnnouncement(`${label} completed`);
            playCompletionChime();
            onComplete?.(activePreset);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => window.clearInterval(interval);
    }, [isRunning, activePreset, label, onComplete, playCompletionChime]);

    useEffect(() => {
      onStateChange?.({ isRunning, remainingSeconds, activePreset });
    }, [isRunning, remainingSeconds, activePreset, onStateChange]);

    const handleSelectPreset = (preset: TimerPreset) => {
      const nextSeconds = Math.max(1, Math.round(preset.minutes * 60));
      setActivePresetId(preset.id);
      setRemainingSeconds(nextSeconds);
      setIsRunning(autoStartOnPresetChange);
      setStatusAnnouncement(
        `${preset.label} selected${autoStartOnPresetChange ? ', timer started' : ''}`
      );
    };

    const handleTogglePlayPause = () => {
      if (remainingSeconds === 0) {
        setRemainingSeconds(totalSeconds);
        setIsRunning(true);
        setStatusAnnouncement(`${label} restarted`);
        return;
      }
      setIsRunning((prev) => {
        const next = !prev;
        setStatusAnnouncement(next ? `${label} resumed` : `${label} paused`);
        return next;
      });
    };

    const handleStopReset = () => {
      setIsRunning(false);
      setRemainingSeconds(totalSeconds);
      setStatusAnnouncement(`${label} reset to ${activePreset.label}`);
    };

    const sz = SIZE_CONFIG[size];
    const th = THEME_TOKENS[theme];
    const progress = Math.min(1, Math.max(0, remainingSeconds / totalSeconds));
    const circumference = 2 * Math.PI * sz.ringRadius;
    const strokeDashoffset = circumference * (1 - progress);
    const center = sz.dialSize / 2;

    const arcTransform =
      ringDirection === 'counter-clockwise'
        ? `rotate(-90 ${center} ${center}) scale(1, -1) translate(0, -${sz.dialSize})`
        : `rotate(-90 ${center} ${center})`;

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex flex-col items-center select-none font-sans antialiased',
          sz.stackGap,
          className
        )}
      >
        <span className="sr-only" aria-live="polite">
          {statusAnnouncement}
        </span>

        {showPresets && (
          <div
            role="group"
            aria-label="Timer duration presets"
            className={cn('flex items-center justify-center', sz.pillGap)}
          >
            {safePresets.map((preset) => {
              const isActive = preset.id === activePreset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleSelectPreset(preset)}
                  className={cn(
                    'inline-flex items-center justify-center font-medium tracking-[-0.01em] transition-colors duration-200 cursor-pointer',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0edafb] focus-visible:ring-offset-2',
                    sz.pillClass,
                    isActive ? th.pillActive : th.pillInactive
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        )}

        <section
          aria-labelledby={timerHeadingId}
          className={cn(
            'relative flex items-center justify-between max-w-full transition-colors duration-200',
            sz.cardClass,
            th.cardBg
          )}
        >
          {/* Left Panel: Label, Digital Readout, Stop Control */}
          <div
            className={cn(
              'flex h-full flex-1 flex-col justify-between min-w-0',
              sz.leftPad
            )}
          >
            <div className="flex flex-col">
              <span
                id={timerHeadingId}
                className={cn(
                  'font-normal leading-none tracking-[-0.01em]',
                  sz.labelText,
                  th.labelText
                )}
              >
                {label}
              </span>
              <time
                role="timer"
                aria-label={`${formatTime(remainingSeconds)} remaining`}
                className={cn(
                  'mt-2 font-normal leading-[1.02] tracking-[-0.03em] tabular-nums',
                  sz.timeText,
                  th.timeText
                )}
              >
                {formatTime(remainingSeconds)}
              </time>
            </div>

            <button
              type="button"
              onClick={handleStopReset}
              aria-label={`${stopLabel} timer and reset to ${activePreset.label}`}
              className={cn(
                'inline-flex items-center justify-center font-medium tracking-[-0.01em] transition-all duration-150 cursor-pointer active:scale-[0.98]',
                sz.stopBtn,
                th.stopBtn,
                th.focusRing
              )}
            >
              {stopLabel}
            </button>
          </div>

          {/* Right Panel: Circular Progress Dial & Play/Pause */}
          <div
            style={{ width: sz.dialSize, height: sz.dialSize }}
            className={cn(
              'relative shrink-0 flex items-center justify-center transition-colors duration-200',
              sz.dialRadius,
              th.dialBg
            )}
          >
            <svg
              width={sz.dialSize}
              height={sz.dialSize}
              viewBox={`0 0 ${sz.dialSize} ${sz.dialSize}`}
              className="absolute inset-0"
              aria-hidden="true"
            >
              <circle
                cx={center}
                cy={center}
                r={sz.ringRadius}
                fill="none"
                stroke={th.ringTrack}
                strokeWidth={sz.ringStroke}
              />
              <motion.circle
                cx={center}
                cy={center}
                r={sz.ringRadius}
                fill="none"
                stroke={th.ringActive}
                strokeWidth={sz.ringStroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                transform={arcTransform}
                initial={false}
                animate={{ strokeDashoffset }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
                }
              />
            </svg>

            <button
              type="button"
              onClick={handleTogglePlayPause}
              aria-label={
                remainingSeconds === 0
                  ? 'Restart timer'
                  : isRunning
                  ? 'Pause timer'
                  : 'Resume timer'
              }
              aria-pressed={isRunning}
              className={cn(
                'relative z-10 flex items-center justify-center rounded-full transition-transform duration-150 cursor-pointer active:scale-[0.96]',
                sz.centerBtn,
                th.centerBtnBg,
                th.centerIcon,
                th.focusRing
              )}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isRunning ? (
                  <motion.svg
                    key="pause"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={sz.iconSize}
                    initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.14 }}
                    aria-hidden="true"
                  >
                    <rect x="6" y="4" width="4.5" height="16" rx="2.25" />
                    <rect x="13.5" y="4" width="4.5" height="16" rx="2.25" />
                  </motion.svg>
                ) : (
                  <motion.svg
                    key="play"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={cn(sz.iconSize, 'translate-x-[1px]')}
                    initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.14 }}
                    aria-hidden="true"
                  >
                    <path d="M7.5 4.86c0-1.15 1.24-1.87 2.24-1.3l10.2 5.89a1.5 1.5 0 0 1 0 2.6l-10.2 5.89a1.5 1.5 0 0 1-2.24-1.3V4.86Z" />
                  </motion.svg>
                )}
              </AnimatePresence>
            </button>
          </div>
        </section>

        {showDockBar && (
          <div
            aria-hidden="true"
            className={cn(
              'rounded-full transition-colors duration-200',
              sz.dockBar,
              th.dockBar
            )}
          />
        )}
      </div>
    );
  }
);

export default FocusTimerWidget;