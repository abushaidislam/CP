"use client";

import React, { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export interface AiSearchHeroProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /** Color theme: "auto" follows Tailwind's .dark class, or force "dark" / "light" */
  theme?: "auto" | "dark" | "light";
  /** Supporting description displayed below the headline */
  subtitle?: string;
  /** Label for the primary gradient CTA pill */
  primaryCtaText?: string;
  /** Label for the secondary outlined CTA pill */
  secondaryCtaText?: string;
  /** Whether to play the staggered blur-to-sharp entrance animation on mount */
  animateOnMount?: boolean;
  /** Base stagger delay (in seconds) between headline lines and inline badges */
  staggerDelay?: number;
  /** Callback fired when the primary CTA button is clicked */
  onPrimaryClick?: () => void;
  /** Callback fired when the secondary CTA button is clicked */
  onSecondaryClick?: () => void;
}

// Quintic ease-out for a long, silky deceleration tail
const EASE_OUT_QUINT: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Critically-damped spring (zeta ~ 1.05): fluid velocity with zero bounce
const SLOT_SPRING = {
  type: "spring" as const,
  stiffness: 240,
  damping: 31,
  mass: 0.9,
};

const HOVER_SPRING = {
  type: "spring" as const,
  stiffness: 420,
  damping: 32,
  mass: 0.6,
};

interface BadgeWrapperProps {
  label: string;
  delay: number;
  animateOnMount: boolean;
  shouldReduceMotion: boolean;
  leading?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

function PlatformBadge({
  label,
  delay,
  animateOnMount,
  shouldReduceMotion,
  leading = false,
  className,
  style,
  children,
}: BadgeWrapperProps) {
  const skipMotion = !animateOnMount || shouldReduceMotion;

  return (
    <motion.span
      role="img"
      aria-label={label}
      title={label}
      initial={
        skipMotion
          ? false
          : {
              width: 0,
              marginLeft: 0,
              marginRight: 0,
            }
      }
      animate={{
        width: "0.94em",
        marginLeft: leading ? "0em" : "0.14em",
        marginRight: "0.14em",
      }}
      transition={skipMotion ? { duration: 0 } : { ...SLOT_SPRING, delay }}
      className="inline-flex items-center justify-center align-middle select-none h-[0.94em] -translate-y-[0.06em] shrink-0"
    >
      <motion.span
        initial={
          skipMotion
            ? false
            : {
                opacity: 0,
                scale: 0.52,
                filter: "blur(5px)",
              }
        }
        animate={{
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
        }}
        transition={
          skipMotion
            ? { duration: 0 }
            : {
                duration: 0.44,
                delay: delay + 0.04,
                ease: EASE_OUT_QUINT,
              }
        }
        whileHover={
          shouldReduceMotion
            ? undefined
            : { scale: 1.08, y: -1, transition: HOVER_SPRING }
        }
        className={cn(
          "flex h-[0.94em] w-[0.94em] shrink-0 items-center justify-center rounded-[0.26em]",
          className
        )}
        style={{
          willChange: skipMotion ? undefined : "transform, opacity, filter",
          ...style,
        }}
      >
        {children}
      </motion.span>
    </motion.span>
  );
}

function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-[56%] h-[56%] shrink-0"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function OpenAiIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="w-[58%] h-[58%] shrink-0 text-white"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5Z"
      />
    </svg>
  );
}

function ClaudeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="w-[58%] h-[58%] shrink-0 text-white"
      aria-hidden="true"
    >
      <path
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        d="M12 2.5v19M2.5 12h19M5.28 5.28l13.44 13.44M18.72 5.28L5.28 18.72M8.36 3.22l7.28 17.56M20.78 8.36L3.22 15.64M15.64 3.22L8.36 20.78M3.22 8.36l17.56 7.28"
      />
    </svg>
  );
}

function CodexIcon({ maskId }: { maskId: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="w-[62%] h-[62%] shrink-0"
      aria-hidden="true"
    >
      <defs>
        <mask id={maskId}>
          <rect width="24" height="24" fill="white" />
          <path
            d="M8.7 10.4L10.7 12L8.7 13.6"
            stroke="black"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12.2 13.8H14.8"
            stroke="black"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </mask>
      </defs>
      <path
        fill="white"
        mask={`url(#${maskId})`}
        d="M17.2 7.2a4.6 4.6 0 0 0-8.6-1.4A4.2 4.2 0 0 0 4.5 10a4.1 4.1 0 0 0 1.4 7.9h10.8a4.3 4.3 0 0 0 .5-8.55z"
      />
    </svg>
  );
}

function PerplexityIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="w-[56%] h-[56%] shrink-0 text-white"
      aria-hidden="true"
    >
      <path
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 2.5v19M5.5 5.5L12 11.5l6.5-6M5.5 5.5v6h13v-6M5.5 11.5l-2.5 3v4h4.5l4.5-7M18.5 11.5l2.5 3v4h-4.5l-4.5-7M7.5 18.5v-7M16.5 18.5v-7"
      />
    </svg>
  );
}

export const AiSearchHero = React.forwardRef<HTMLElement, AiSearchHeroProps>(
  (
    {
      theme = "auto",
      subtitle = "Cited checks what Google and AI assistants say about your brand every day, and shows you which pages to fix so they mention you more.",
      primaryCtaText = "Start for free",
      secondaryCtaText = "See it on your site",
      animateOnMount = true,
      staggerDelay = 0.09,
      onPrimaryClick,
      onSecondaryClick,
      className,
      style,
      ...rest
    },
    ref
  ) => {
    const uid = useId();
    const shouldReduceMotion = Boolean(useReducedMotion());
    const skipMotion = !animateOnMount || shouldReduceMotion;

    const safeStagger = Number.isFinite(staggerDelay)
      ? Math.max(0, Math.min(0.4, staggerDelay))
      : 0.09;

    const lineTransition = (index: number) =>
      skipMotion
        ? { duration: 0 }
        : {
            duration: 0.56,
            delay: index * safeStagger,
            ease: EASE_OUT_QUINT,
          };

    const lineInitial = skipMotion
      ? false
      : { opacity: 0, y: 10, filter: "blur(6px)" };

    const lineAnimate = { opacity: 1, y: 0, filter: "blur(0px)" };
    const iconStartDelay = safeStagger * 4.5;

    const surfaceClasses =
      theme === "dark"
        ? "bg-[#0A0A0A] text-[#F5F5F7]"
        : theme === "light"
          ? "bg-[#FAFAFA] text-[#09090B]"
          : "bg-transparent text-[#09090B] dark:text-[#F5F5F7]";

    const subtitleClasses =
      theme === "dark"
        ? "text-[#8E8E93]"
        : theme === "light"
          ? "text-[#52525B]"
          : "text-[#52525B] dark:text-[#8E8E93]";

    const googleBadgeClasses =
      theme === "dark"
        ? "bg-[#EFEFEF] ring-1 ring-white/15"
        : theme === "light"
          ? "bg-white ring-1 ring-black/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
          : "bg-white ring-1 ring-black/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-[#EFEFEF] dark:ring-white/15 dark:shadow-none";

    const secondaryBtnClasses =
      theme === "dark"
        ? "bg-[#151517] text-[#E5E5EA] border border-white/10 hover:bg-[#1C1C20] hover:border-white/[0.16] focus-visible:ring-offset-[#0A0A0A]"
        : theme === "light"
          ? "bg-white text-[#18181B] border border-black/[0.12] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[#F4F4F5] focus-visible:ring-offset-[#FAFAFA]"
          : "bg-white text-[#18181B] border border-black/[0.12] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-[#F4F4F5] focus-visible:ring-offset-[#FAFAFA] dark:bg-[#151517] dark:text-[#E5E5EA] dark:border-white/10 dark:shadow-none dark:hover:bg-[#1C1C20] dark:hover:border-white/[0.16] dark:focus-visible:ring-offset-[#0A0A0A]";

    return (
      <section
        ref={ref}
        aria-labelledby={`${uid}-heading`}
        className={cn(
          "relative w-full overflow-hidden px-4 py-14 sm:px-8 sm:py-20",
          "flex flex-col items-center justify-center text-center antialiased transition-colors duration-200",
          surfaceClasses,
          className
        )}
        style={{
          fontFamily:
            '"Inter", "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          ...style,
        }}
        {...rest}
      >
        <div className="mx-auto flex w-full max-w-[820px] flex-col items-center">
          <h1
            id={`${uid}-heading`}
            className="font-medium tracking-[-0.032em] leading-[1.18] text-[2rem] sm:text-[2.85rem] md:text-[3.35rem]"
          >
            {/* Line 1 */}
            <motion.span
              initial={lineInitial}
              animate={lineAnimate}
              transition={lineTransition(0)}
              style={{
                willChange: skipMotion ? undefined : "transform, opacity, filter",
              }}
              className="block sm:whitespace-nowrap"
            >
              Get found on{" "}
              <PlatformBadge
                label="Google"
                delay={iconStartDelay}
                animateOnMount={animateOnMount}
                shouldReduceMotion={shouldReduceMotion}
                className={googleBadgeClasses}
              >
                <GoogleIcon />
              </PlatformBadge>
              Google,
            </motion.span>

            {/* Line 2 */}
            <motion.span
              initial={lineInitial}
              animate={lineAnimate}
              transition={lineTransition(1)}
              style={{
                willChange: skipMotion ? undefined : "transform, opacity, filter",
              }}
              className="block sm:whitespace-nowrap"
            >
              <PlatformBadge
                label="ChatGPT"
                leading
                delay={iconStartDelay + safeStagger * 1.3}
                animateOnMount={animateOnMount}
                shouldReduceMotion={shouldReduceMotion}
                className="bg-[#141416] ring-1 ring-black/15 dark:ring-white/15"
              >
                <OpenAiIcon />
              </PlatformBadge>
              ChatGPT,{" "}
              <PlatformBadge
                label="Claude"
                delay={iconStartDelay + safeStagger * 1.7}
                animateOnMount={animateOnMount}
                shouldReduceMotion={shouldReduceMotion}
                className="bg-[#D96B43] shadow-[0_1px_2px_rgba(0,0,0,0.08)] dark:shadow-none"
              >
                <ClaudeIcon />
              </PlatformBadge>
              Claude,{" "}
              <PlatformBadge
                label="Codex"
                delay={iconStartDelay + safeStagger * 2.1}
                animateOnMount={animateOnMount}
                shouldReduceMotion={shouldReduceMotion}
                className="shadow-[0_1px_2px_rgba(0,0,0,0.08)] dark:shadow-none"
                style={{
                  background:
                    "linear-gradient(135deg, #7B96FF 0%, #5263FF 100%)",
                }}
              >
                <CodexIcon maskId={`${uid}-codex-mask`} />
              </PlatformBadge>
              Codex
            </motion.span>

            {/* Line 3 */}
            <motion.span
              initial={lineInitial}
              animate={lineAnimate}
              transition={lineTransition(2)}
              style={{
                willChange: skipMotion ? undefined : "transform, opacity, filter",
              }}
              className="block sm:whitespace-nowrap"
            >
              and{" "}
              <PlatformBadge
                label="Perplexity and AI answers"
                delay={iconStartDelay + safeStagger * 2.9}
                animateOnMount={animateOnMount}
                shouldReduceMotion={shouldReduceMotion}
                className="bg-[#1D7D84] shadow-[0_1px_2px_rgba(0,0,0,0.08)] dark:shadow-none"
              >
                <PerplexityIcon />
              </PlatformBadge>
              every AI answer
            </motion.span>
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <motion.p
              initial={
                skipMotion
                  ? false
                  : { opacity: 0, y: 8, filter: "blur(5px)" }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={
                skipMotion
                  ? { duration: 0 }
                  : {
                      duration: 0.6,
                      delay: safeStagger * 3.1,
                      ease: EASE_OUT_QUINT,
                    }
              }
              className={cn(
                "mt-5 sm:mt-6 max-w-[460px] text-[0.9375rem] sm:text-[1rem] leading-[1.58] tracking-[-0.005em]",
                subtitleClasses
              )}
            >
              {subtitle}
            </motion.p>
          )}

          {/* CTA Row */}
          <motion.div
            initial={
              skipMotion
                ? false
                : { opacity: 0, y: 8, filter: "blur(5px)" }
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={
              skipMotion
                ? { duration: 0 }
                : {
                    duration: 0.6,
                    delay: safeStagger * 3.8,
                    ease: EASE_OUT_QUINT,
                  }
            }
            className="mt-7 sm:mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            {/* Primary Pill CTA */}
            <button
              type="button"
              onClick={onPrimaryClick}
              className={cn(
                "relative inline-flex h-11 items-center justify-center rounded-full px-6",
                "text-[0.875rem] font-medium tracking-[-0.01em] text-white",
                "transition-all duration-150 hover:brightness-110 active:scale-[0.98]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A7AFF] focus-visible:ring-offset-2",
                theme === "dark"
                  ? "focus-visible:ring-offset-[#0A0A0A]"
                  : theme === "light"
                    ? "focus-visible:ring-offset-[#FAFAFA]"
                    : "focus-visible:ring-offset-[#FAFAFA] dark:focus-visible:ring-offset-[#0A0A0A]"
              )}
              style={{
                background:
                  "radial-gradient(120% 100% at 50% 0%, #3E6EFF 0%, #1C3A8A 48%, #101218 100%)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.3), 0 0 0 1px rgba(255,255,255,0.12), 0 4px 12px rgba(16,18,24,0.18)",
              }}
            >
              <span className="relative z-10">{primaryCtaText}</span>
            </button>

            {/* Secondary Pill CTA */}
            <button
              type="button"
              onClick={onSecondaryClick}
              className={cn(
                "group inline-flex h-11 items-center justify-center gap-2 rounded-full px-6",
                "text-[0.875rem] font-medium tracking-[-0.01em]",
                "transition-all duration-150 active:scale-[0.98]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A7AFF] focus-visible:ring-offset-2",
                secondaryBtnClasses
              )}
            >
              <span>{secondaryCtaText}</span>
              <svg
                viewBox="0 0 16 16"
                fill="none"
                className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              >
                <path
                  d="M3.5 8h9m0 0L9 4.5M12.5 8L9 11.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </motion.div>
        </div>
      </section>
    );
  }
);

AiSearchHero.displayName = "AiSearchHero";

export { AiSearchHero as component, AiSearchHero as Component };
export default AiSearchHero;