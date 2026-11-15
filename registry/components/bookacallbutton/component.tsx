"use client";

import * as React from 'react';
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Transition,
} from 'framer-motion';
import { cn } from '@/lib/utils';

export interface BookACallButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children' | 'ref'> {
  /** Default idle button label */
  label?: string;
  /** Final hover/focus call-to-action text */
  hoverLabel?: string;
  /** Text inside the overlapping white circle */
  badgeText?: string;
  /** Portrait image URL for the host/founder avatar */
  avatarSrc?: string;
  /** Accessible alt text for the avatar */
  avatarAlt?: string;
  /** Optional link URL; if provided alongside onClick, both are supported */
  href?: string;
  /** Delay in ms between initial hover pairing and the "Let's talk!" morph */
  stageDelayMs?: number;
  /** Optional callback fired when the user activates the button */
  onBookCall?: () => void;
  /** Additional CSS classes merged onto the root button */
  className?: string;
}

type InteractionStage = 'idle' | 'paired' | 'engaged';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

const SATOSHI_FONT_STACK =
  "'Satoshi', 'General Sans', 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

/**
 * Critically-damped smooth spring (zero overshoot/bounce)
 * so circles glide and settle cleanly without jarring bumps.
 */
const MORPH_SPRING: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 32,
  mass: 0.85,
};

const SMOOTH_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const INSTANT_TRANSITION: Transition = {
  duration: 0.01,
};

/**
 * Default monochrome SVG avatar fallback so the component renders
 * cleanly out-of-the-box without external image dependencies.
 */
function DefaultMonochromeAvatar({ title }: { title: string }) {
  const clipId = React.useId();
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full select-none"
      role="img"
      aria-label={title}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="32" cy="32" r="32" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width="64" height="64" fill="#E5E5E5" />
        <circle cx="32" cy="24" r="11" fill="#A3A3A3" />
        <path
          d="M12 58C12 46.9543 20.9543 38 32 38C43.0457 38 52 46.9543 52 58V64H12V58Z"
          fill="#FFFFFF"
        />
        <path
          d="M23 39.5C25.5 42.5 28.5 44 32 44C35.5 44 38.5 42.5 41 39.5"
          stroke="#737373"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="32" cy="24" r="10.5" fill="#8C8C8C" opacity="0.25" />
      </g>
    </svg>
  );
}

export const BookACallButton = React.forwardRef<
  HTMLButtonElement,
  BookACallButtonProps
>(
  (
    {
      label = 'BOOK A CALL',
      hoverLabel = "Let's talk!",
      badgeText = 'YOU',
      avatarSrc,
      avatarAlt = 'Host avatar',
      href,
      stageDelayMs = 480,
      onBookCall,
      onClick,
      onPointerEnter,
      onPointerLeave,
      onFocus,
      onBlur,
      disabled = false,
      className,
      style,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const [stage, setStage] = React.useState<InteractionStage>('idle');
    const [imgError, setImgError] = React.useState(false);
    const [ctaWidth, setCtaWidth] = React.useState<number | null>(null);
    const ctaInnerRef = React.useRef<HTMLSpanElement | null>(null);
    const stageTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
      null
    );
    const shouldReduceMotion = useReducedMotion();

    React.useEffect(() => {
      setImgError(false);
    }, [avatarSrc]);

    const clearStageTimer = React.useCallback(() => {
      if (stageTimerRef.current !== null) {
        clearTimeout(stageTimerRef.current);
        stageTimerRef.current = null;
      }
    }, []);

    React.useEffect(() => {
      return () => clearStageTimer();
    }, [clearStageTimer]);

    const beginHoverSequence = React.useCallback(() => {
      if (disabled) return;
      clearStageTimer();
      setStage('paired');
      stageTimerRef.current = setTimeout(() => {
        setStage('engaged');
      }, stageDelayMs);
    }, [disabled, clearStageTimer, stageDelayMs]);

    const resetHoverSequence = React.useCallback(() => {
      clearStageTimer();
      setStage('idle');
    }, [clearStageTimer]);

    const handlePointerEnter = (e: React.PointerEvent<HTMLButtonElement>) => {
      if (e.pointerType !== 'touch') {
        beginHoverSequence();
      }
      onPointerEnter?.(e);
    };

    const handlePointerLeave = (e: React.PointerEvent<HTMLButtonElement>) => {
      if (e.pointerType !== 'touch') {
        resetHoverSequence();
      }
      onPointerLeave?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
      beginHoverSequence();
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLButtonElement>) => {
      resetHoverSequence();
      onBlur?.(e);
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      onBookCall?.();
      onClick?.(e);
      if (href && !e.defaultPrevented) {
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    };

    const morphTransition = shouldReduceMotion
      ? INSTANT_TRANSITION
      : MORPH_SPRING;

    const isIdle = stage === 'idle';
    const isPaired = stage === 'paired';
    const isEngaged = stage === 'engaged';

    const hoverWords = React.useMemo(
      () => hoverLabel.trim().split(/\s+/),
      [hoverLabel]
    );

    useIsomorphicLayoutEffect(() => {
      if (isIdle || !ctaInnerRef.current) return;
      const measured = Math.ceil(
        ctaInnerRef.current.getBoundingClientRect().width
      );
      if (measured > 0) {
        setCtaWidth(measured);
      }
    }, [isIdle, hoverLabel]);

    return (
      <MotionConfig reducedMotion="user">
        <motion.button
          ref={ref}
          type={type}
          disabled={disabled}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onClick={handleClick}
          whileTap={
            disabled || shouldReduceMotion ? undefined : { scale: 0.975 }
          }
          transition={morphTransition}
          aria-label={`${label} — ${hoverLabel}`}
          style={{
            fontFamily: SATOSHI_FONT_STACK,
            fontFeatureSettings: '"ss01", "cv02", "cv03", "cv04"',
            ...style,
          }}
          className={cn(
            'group relative inline-flex h-[68px] min-w-[202px] cursor-pointer items-center justify-center overflow-hidden rounded-full px-3 antialiased select-none',
            'bg-[linear-gradient(180deg,#202020_0%,#050505_24%,#000000_76%,#191919_100%)]',
            'ring-1 ring-black/85 dark:ring-white/15',
            'shadow-[inset_0_1.5px_3px_rgba(255,255,255,0.28),inset_0_-2px_5px_rgba(255,255,255,0.18),0_12px_28px_-6px_rgba(0,0,0,0.42),0_4px_10px_-2px_rgba(0,0,0,0.25)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-4 dark:focus-visible:ring-white dark:focus-visible:ring-offset-neutral-950',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        >
          <AnimatePresence mode="sync" initial={false}>
            {isIdle ? (
              <motion.span
                key="idle-label"
                initial={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : { opacity: 0, y: 18, filter: 'blur(3px)' }
                }
                animate={{
                  opacity: 1,
                  y: 0,
                  filter: 'blur(0px)',
                  transition: shouldReduceMotion
                    ? INSTANT_TRANSITION
                    : {
                        duration: 0.24,
                        delay: 0.1,
                        ease: SMOOTH_EASE,
                      },
                }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : {
                        opacity: 0,
                        y: -28,
                        filter: 'blur(3px)',
                        transition: {
                          duration: 0.16,
                          ease: [0.4, 0, 1, 1],
                        },
                      }
                }
                className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-[14px] font-bold tracking-[0.045em] whitespace-nowrap text-white uppercase tabular-nums"
              >
                {label}
              </motion.span>
            ) : (
              <motion.div
                key="active-morph-stage"
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.14, delay: 0.04 },
                }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : {
                        opacity: 0,
                        scale: 0.94,
                        filter: 'blur(4px)',
                        transition: { duration: 0.14, ease: [0.4, 0, 1, 1] },
                      }
                }
                className="relative flex h-full items-center justify-center"
              >
                {/* Avatar Circle — rolls in from left, then glides cleanly with YOU to its fixed left position */}
                <motion.div
                  initial={
                    shouldReduceMotion
                      ? { opacity: 1 }
                      : {
                          x: -16,
                          scale: 0.65,
                          rotate: -24,
                          opacity: 0,
                          filter: 'blur(5px)',
                        }
                  }
                  animate={{
                    x: 0,
                    scale: 1,
                    rotate: 0,
                    opacity: 1,
                    filter: 'blur(0px)',
                  }}
                  transition={morphTransition}
                  className={cn(
                    'relative z-10 h-[48px] w-[48px] shrink-0 overflow-hidden rounded-full bg-neutral-200',
                    'shadow-[0_2px_10px_rgba(0,0,0,0.45)]'
                  )}
                >
                  {avatarSrc && !imgError ? (
                    <img
                      src={avatarSrc}
                      alt={avatarAlt}
                      onError={() => setImgError(true)}
                      className="h-full w-full object-cover grayscale contrast-110"
                    />
                  ) : (
                    <DefaultMonochromeAvatar title={avatarAlt} />
                  )}
                </motion.div>

                {/* Plus Separator — blooms in center, then collapses cleanly on 'engaged' */}
                <motion.span
                  aria-hidden="true"
                  initial={
                    shouldReduceMotion
                      ? { opacity: 1 }
                      : {
                          width: 14,
                          marginLeft: 10,
                          marginRight: 10,
                          opacity: 0,
                          scale: 0.3,
                          rotate: -90,
                        }
                  }
                  animate={{
                    width: isPaired ? 14 : 0,
                    marginLeft: isPaired ? 10 : 0,
                    marginRight: isPaired ? 10 : 0,
                    opacity: isPaired ? 1 : 0,
                    scale: isPaired ? 1 : 0.25,
                    rotate: isPaired ? 0 : 90,
                  }}
                  transition={morphTransition}
                  className="inline-flex h-3.5 shrink-0 items-center justify-center overflow-hidden text-white"
                >
                  <svg
                    viewBox="0 0 12 12"
                    fill="none"
                    className="h-3 w-3 shrink-0"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  >
                    <path d="M6 1.5V10.5M1.5 6H10.5" />
                  </svg>
                </motion.span>

                {/* YOU Circle — rolls in from right, then glides left to overlap Avatar */}
                <motion.div
                  initial={
                    shouldReduceMotion
                      ? { opacity: 1 }
                      : {
                          x: 16,
                          scale: 0.65,
                          rotate: 22,
                          opacity: 0,
                          filter: 'blur(5px)',
                        }
                  }
                  animate={{
                    x: 0,
                    scale: 1,
                    rotate: 0,
                    opacity: 1,
                    filter: 'blur(0px)',
                    marginLeft: isEngaged ? -22 : 0,
                  }}
                  transition={morphTransition}
                  className={cn(
                    'relative z-20 flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full bg-white text-black',
                    'shadow-[0_2px_12px_rgba(0,0,0,0.52)]'
                  )}
                >
                  <span className="text-[11.5px] font-extrabold tracking-[0.02em] uppercase tabular-nums">
                    {badgeText}
                  </span>
                </motion.div>

                {/* "Let's talk!" CTA — space opens in lockstep with avatar overlap so circles fix cleanly on the left before text fades in */}
                <motion.div
                  initial={false}
                  animate={{
                    width: isEngaged ? (ctaWidth ?? 'auto') : 0,
                  }}
                  transition={morphTransition}
                  className="flex shrink-0 items-center overflow-hidden"
                >
                  <span
                    ref={ctaInnerRef}
                    className="inline-flex shrink-0 items-center gap-1 pr-[6px] pl-[10px] text-[15px] font-semibold tracking-[-0.02em] whitespace-nowrap text-white tabular-nums"
                  >
                    {hoverWords.map((word, index) => (
                      <motion.span
                        key={`${word}-${index}`}
                        initial={false}
                        animate={{
                          opacity: isEngaged ? 1 : 0,
                          x: isEngaged ? 0 : -8,
                          y: isEngaged ? 0 : 2,
                          filter:
                            shouldReduceMotion || isEngaged
                              ? 'blur(0px)'
                              : 'blur(6px)',
                        }}
                        transition={
                          shouldReduceMotion
                            ? INSTANT_TRANSITION
                            : {
                                duration: 0.3,
                                delay: isEngaged ? 0.22 + index * 0.06 : 0,
                                ease: SMOOTH_EASE,
                              }
                        }
                        className="inline-block"
                      >
                        {word}
                      </motion.span>
                    ))}
                  </span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </MotionConfig>
    );
  }
);

BookACallButton.displayName = 'BookACallButton';

export { BookACallButton as Component }
export default BookACallButton;
