"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlarmClock, Check, Copy, PlusCircle, Zap } from "lucide-react";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export interface DeveloperProfileCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Display name */
  name?: string;
  /** Role or title shown under the name */
  role?: string;
  /** Availability status label */
  statusText?: string;
  /** Whether the availability indicator dot is active */
  available?: boolean;
  /** Bottom neon-lime banner message */
  bannerText?: string;
  /** Email address copied by Copy Email and used for Hire Me mailto fallback */
  email?: string;
  /** Optional custom avatar image URL (falls back to monochrome ink portrait SVG) */
  avatarUrl?: string;
  /** Static time string displayed when liveClock is false */
  timeLabel?: string;
  /** When true, displays the user's live local time */
  liveClock?: boolean;
  /** Primary button label */
  hireLabel?: string;
  /** Secondary copy button label */
  copyLabel?: string;
  /** Fired when Hire Me is clicked */
  onHireClick?: () => void;
  /** Fired when Copy Email succeeds */
  onCopyEmail?: (email: string) => void;
}

function formatCurrentTime(): string {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const suffix = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes}${suffix}`;
}

function MonochromeInkAvatar({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <rect width="64" height="64" fill="#f4f4f5" />
      <path
        d="M8 64C10 49 18 42 32 42C46 42 54 49 56 64H8Z"
        fill="#141416"
      />
      <path
        d="M16 47C22 50 42 50 48 47M14 53C22 57 42 57 50 53M20 59C26 61 38 61 44 59"
        stroke="#f4f4f5"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M17 34C15 24 19 12 32 11C45 12 49 24 47 34C45 27 42 22 39 20C38 25 35 28 32 28C29 28 26 25 25 20C22 22 19 27 17 34Z"
        fill="#141416"
      />
      <path
        d="M23 24C23 20 27 18 32 18C37 18 41 20 41 24V31C41 36.5 37 41 32 41C27 41 23 36.5 23 31V24Z"
        fill="#fafafa"
        stroke="#141416"
        strokeWidth="2"
      />
      <path
        d="M21 24C24 20 28 19 32 22C36 19 40 20 43 24C41 16 37 13 32 13C27 13 23 16 21 24Z"
        fill="#141416"
      />
      <path
        d="M26.5 28.5H29.5M34.5 28.5H37.5"
        stroke="#141416"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M30 35H34"
        stroke="#141416"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export const DeveloperProfileCard = React.forwardRef<
  HTMLDivElement,
  DeveloperProfileCardProps
>(function DeveloperProfileCard(
  {
    name = "Prasanjit Dey",
    role = "Software Engineer",
    statusText = "Available for work",
    available = true,
    bannerText = "Currently High on Creativity",
    email = "prasanjit@example.com",
    avatarUrl,
    timeLabel = "8:30PM",
    liveClock = false,
    hireLabel = "Hire Me",
    copyLabel = "Copy Email",
    onHireClick,
    onCopyEmail,
    className,
    ...rest
  },
  ref
) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const rawId = useId();
  const uid = rawId.replace(/:/g, "");

  const [copied, setCopied] = useState(false);
  const [hireAck, setHireAck] = useState(false);
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [isBannerHovered, setIsBannerHovered] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [clockText, setClockText] = useState<string>(timeLabel);

  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hireTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setAvatarError(false);
  }, [avatarUrl]);

  useEffect(() => {
    if (!liveClock) {
      setClockText(timeLabel);
      return;
    }
    setClockText(formatCurrentTime());
    const interval = setInterval(() => {
      setClockText(formatCurrentTime());
    }, 15000);
    return () => clearInterval(interval);
  }, [liveClock, timeLabel]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      if (hireTimerRef.current) clearTimeout(hireTimerRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
      }
    } catch {
      // Clipboard API may be restricted in sandboxed iframes
    }
    setCopied(true);
    onCopyEmail?.(email);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => {
      setCopied(false);
    }, 2000);
  }, [email, onCopyEmail]);

  const handleHire = useCallback(() => {
    if (onHireClick) {
      onHireClick();
    } else if (typeof window !== "undefined" && email) {
      window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Project Inquiry for ${name}`)}`;
    }
    setHireAck(true);
    if (hireTimerRef.current) clearTimeout(hireTimerRef.current);
    hireTimerRef.current = setTimeout(() => {
      setHireAck(false);
    }, 1800);
  }, [email, name, onHireClick]);

  const springTransition = prefersReducedMotion
    ? { duration: 0.12 }
    : { type: "spring" as const, stiffness: 380, damping: 30 };

  return (
    <div
      ref={ref}
      role="region"
      aria-labelledby={`${uid}-name`}
      onMouseEnter={() => setIsCardHovered(true)}
      onMouseLeave={() => setIsCardHovered(false)}
      className={cn(
        "relative w-full max-w-[456px] mx-auto select-none",
        className
      )}
      {...rest}
    >
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {copied
          ? `Copied ${email} to clipboard`
          : hireAck
          ? `Starting inquiry for ${name}`
          : ""}
      </div>

      <div
        className={cn(
          "relative rounded-[34px] bg-gradient-to-b from-[#b2fc68] via-[#a7f75b] to-[#9ef250]",
          "ring-1 ring-[#89de3d]/80",
          "shadow-[0_22px_44px_-14px_rgba(0,0,0,0.22),0_4px_12px_-2px_rgba(167,247,91,0.3)]",
          "dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.72),0_0_24px_-6px_rgba(167,247,91,0.18)]"
        )}
      >
        <motion.div
          animate={
            isCardHovered && !prefersReducedMotion ? { y: -3 } : { y: 0 }
          }
          transition={springTransition}
          className={cn(
            "relative z-10 rounded-[32px] bg-[#212121] px-6 sm:px-7 pt-5 pb-6",
            "ring-1 ring-inset ring-white/[0.07]",
            "shadow-[0_14px_26px_-8px_rgba(0,0,0,0.52)]"
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                {available && !prefersReducedMotion && (
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-[#a0ff63]"
                    animate={{ scale: [1, 2.2], opacity: [0.65, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                )}
                <span
                  className={cn(
                    "relative inline-flex h-2 w-2 rounded-full",
                    available ? "bg-[#a0ff63]" : "bg-[#71717a]"
                  )}
                />
              </span>
              <span className="text-[13.5px] font-medium tracking-[-0.01em] text-[#9e9ea4] truncate">
                {statusText}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 shrink-0 text-[13.5px] font-medium tracking-[-0.01em] text-[#9e9ea4] tabular-nums">
              <AlarmClock
                className="h-[14px] w-[14px] opacity-85"
                strokeWidth={1.9}
              />
              <span>{clockText}</span>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-4">
            <div className="relative h-[54px] w-[54px] shrink-0 overflow-hidden rounded-full ring-1 ring-white/15 bg-[#f4f4f5]">
              {avatarUrl && !avatarError ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  onError={() => setAvatarError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <MonochromeInkAvatar className="h-full w-full" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h2
                id={`${uid}-name`}
                className="text-[21px] sm:text-[23px] font-semibold leading-[1.2] tracking-[-0.024em] text-[#f5f5f5] truncate"
              >
                {name}
              </h2>
              <p className="mt-0.5 text-[14px] font-normal leading-[1.3] tracking-[-0.005em] text-[#8d8d93] truncate">
                {role}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <motion.button
              type="button"
              onClick={handleHire}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.975 }}
              transition={{ type: "spring", stiffness: 520, damping: 30 }}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-[15px] px-4 py-3 text-[14.5px] font-medium tracking-[-0.01em] text-white",
                "bg-[#474747] hover:bg-[#525252] transition-colors duration-150",
                "border border-white/[0.16]",
                "shadow-[0_6px_16px_-4px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.14)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a7f75b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#212121]"
              )}
            >
              <AnimatePresence mode="wait" initial={false}>
                {hireAck ? (
                  <motion.span
                    key="hire-ack"
                    initial={
                      prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 4 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }
                    }
                    transition={{ duration: 0.14 }}
                    className="inline-flex items-center gap-2"
                  >
                    <Check
                      className="h-[16px] w-[16px] text-[#a7f75b]"
                      strokeWidth={2.4}
                    />
                    <span>Let&apos;s talk</span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="hire-idle"
                    initial={
                      prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 4 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }
                    }
                    transition={{ duration: 0.14 }}
                    className="inline-flex items-center gap-2"
                  >
                    <PlusCircle
                      className="h-[16px] w-[16px] opacity-90"
                      strokeWidth={1.9}
                    />
                    <span>{hireLabel}</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <motion.button
              type="button"
              onClick={handleCopy}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.975 }}
              transition={{ type: "spring", stiffness: 520, damping: 30 }}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-[15px] px-4 py-3 text-[14.5px] font-medium tracking-[-0.01em] text-[#f2f2f2]",
                "bg-[#2e2e2e] hover:bg-[#383838] transition-colors duration-150",
                "border border-white/[0.11]",
                "shadow-[0_6px_16px_-4px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.08)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a7f75b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#212121]"
              )}
            >
              <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                  <motion.span
                    key="copied"
                    initial={
                      prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 4 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }
                    }
                    transition={{ duration: 0.14 }}
                    className="inline-flex items-center gap-2 text-[#b2fc68]"
                  >
                    <Check className="h-[16px] w-[16px]" strokeWidth={2.4} />
                    <span>Copied!</span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={
                      prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 4 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    exit={
                      prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }
                    }
                    transition={{ duration: 0.14 }}
                    className="inline-flex items-center gap-2"
                  >
                    <Copy
                      className="h-[16px] w-[16px] opacity-85"
                      strokeWidth={1.9}
                    />
                    <span>{copyLabel}</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>

        <div
          onMouseEnter={() => setIsBannerHovered(true)}
          onMouseLeave={() => setIsBannerHovered(false)}
          className="flex items-center justify-center gap-1.5 px-5 py-3 text-[13.5px] font-medium tracking-[-0.01em] text-[#142207]"
        >
          <motion.span
            className="inline-flex items-center justify-center"
            animate={
              (isBannerHovered || isCardHovered) && !prefersReducedMotion
                ? { rotate: [0, -12, 10, 0], scale: [1, 1.15, 1] }
                : { rotate: 0, scale: 1 }
            }
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Zap className="h-[15px] w-[15px]" strokeWidth={2} />
          </motion.span>
          <span className="truncate">{bannerText}</span>
        </div>
      </div>
    </div>
  );
});

DeveloperProfileCard.displayName = "DeveloperProfileCard";

export { DeveloperProfileCard as component, DeveloperProfileCard as Component };
export default DeveloperProfileCard;