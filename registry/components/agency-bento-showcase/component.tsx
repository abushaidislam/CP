"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, Link2 } from "lucide-react";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type ShowcaseTheme = "dark" | "light";

export interface AgencyBentoShowcaseProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Primary brand wordmark displayed across the logo, marquee, and social cards */
  brandName?: string;
  /** Secondary studio suffix displayed alongside the brand name */
  studioSuffix?: string;
  /** Visual color theme */
  theme?: ShowcaseTheme;
  /** Enable or pause synchronized micro-animations */
  autoPlay?: boolean;
  /** Interval in milliseconds between headline phrase transitions */
  phraseInterval?: number;
  /** Custom phrases cycled inside the interactive selection box */
  phrases?: string[];
  /** Headline prefix before the selection box */
  headlinePrefix?: string;
  /** Second line of the hero headline */
  headlineBottom?: string;
  /** Cursor collaborator badge label */
  cursorLabel?: string;
  /** Social profile metrics and metadata */
  socialHandle?: string;
  socialRole?: string;
  socialBio?: string;
  socialWebsite?: string;
  postsCount?: number;
  followersCount?: number;
  /** Optional custom portrait image URLs [smallTopLeft, largeBottomRight] */
  teamAvatars?: [string, string];
  /** Center label overlaid on the rotating cosmic orb */
  orbLabelTop?: string;
  orbLabelBottom?: string;
}

const DEFAULT_PHRASES = [
  "Spark The Next",
  "Design a Techie",
  "Elevate Your",
  "Create an Engaging",
  "Build an Accessible",
];

/**
 * Animated QlarK Logo Mark — cycles between:
 * 0: Left-aligned Q mark + wordmark revealed
 * 1: Centered Q mark (wordmark collapsed)
 * 2: Centered pure circle (tail retracted)
 */
function AnimatedBrandLogo({
  brandName,
  studioSuffix,
  isDark,
  shouldAnimate,
}: {
  brandName: string;
  studioSuffix: string;
  isDark: boolean;
  shouldAnimate: boolean;
}) {
  const [stage, setStage] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    if (!shouldAnimate) {
      setStage(0);
      return;
    }

    const sequence: Array<{ next: 0 | 1 | 2; delay: number }> = [
      { next: 1, delay: 1400 },
      { next: 2, delay: 1300 },
      { next: 0, delay: 1500 },
    ];

    let timeoutId: ReturnType<typeof setTimeout>;
    let stepIndex = 0;

    const run = () => {
      const current = sequence[stepIndex];
      timeoutId = setTimeout(() => {
        setStage(current.next);
        stepIndex = (stepIndex + 1) % sequence.length;
        run();
      }, current.delay);
    };

    run();
    return () => clearTimeout(timeoutId);
  }, [shouldAnimate]);

  const showText = stage === 0;
  const showTail = stage !== 2;

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden px-5 py-6">
      <motion.div
        layout={shouldAnimate}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-center"
      >
        {/* Q Mark */}
        <motion.div
          layout={shouldAnimate}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex h-12 w-12 shrink-0 items-center justify-center sm:h-14 sm:w-14"
        >
          <svg
            viewBox="0 0 64 64"
            className="h-full w-full overflow-visible"
            aria-hidden="true"
          >
            <circle
              cx="30"
              cy="30"
              r="22"
              className={isDark ? "fill-white" : "fill-zinc-950"}
            />
            <motion.rect
              x="40"
              y="40"
              width="12"
              height="12"
              rx="2.5"
              className={isDark ? "fill-white" : "fill-zinc-950"}
              initial={false}
              animate={{
                scale: showTail ? 1 : 0,
                x: showTail ? 0 : -10,
                y: showTail ? 0 : -10,
                opacity: showTail ? 1 : 0,
              }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: "40px 40px" }}
            />
          </svg>
        </motion.div>

        {/* Collapsible Wordmark */}
        <motion.div
          initial={false}
          animate={{
            width: showText ? "auto" : 0,
            opacity: showText ? 1 : 0,
            marginLeft: showText ? 12 : 0,
          }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden whitespace-nowrap"
        >
          <div className="flex flex-col leading-[1.02]">
            <span
              className={cn(
                "text-2xl font-bold tracking-[-0.03em] sm:text-[26px]",
                isDark ? "text-white" : "text-zinc-950"
              )}
            >
              {brandName}
            </span>
            <span
              className={cn(
                "text-lg font-normal tracking-[-0.01em] sm:text-[19px]",
                isDark ? "text-zinc-300" : "text-zinc-600"
              )}
            >
              {studioSuffix}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/**
 * Monochrome Editorial Portraits — uses optional custom URLs or crisp
 * built-in grayscale SVG silhouettes matching the reference composition.
 */
function TeamPortraitsCard({
  isDark,
  teamAvatars,
}: {
  isDark: boolean;
  teamAvatars?: [string, string];
}) {
  const clipA = useId();
  const clipB = useId();

  return (
    <div className="relative h-full min-h-[136px] w-full overflow-hidden">
      {/* Upper-left smaller circular portrait */}
      <div
        className={cn(
          "absolute left-[14%] top-[12%] h-14 w-14 overflow-hidden rounded-full ring-1 transition-transform duration-500 hover:scale-105 sm:h-16 sm:w-16",
          isDark
            ? "bg-zinc-900 ring-white/15"
            : "bg-zinc-100 ring-zinc-900/10"
        )}
      >
        {teamAvatars?.[0] ? (
          <img
            src={teamAvatars[0]}
            alt="Studio team member"
            className="h-full w-full object-cover grayscale contrast-125"
          />
        ) : (
          <svg
            viewBox="0 0 100 100"
            className="h-full w-full"
            role="img"
            aria-label="Studio co-founder portrait"
          >
            <defs>
              <clipPath id={clipA}>
                <circle cx="50" cy="50" r="50" />
              </clipPath>
              <radialGradient id={`${clipA}-bg`} cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#f4f4f5" />
                <stop offset="100%" stopColor="#a1a1aa" />
              </radialGradient>
            </defs>
            <g clipPath={`url(#${clipA})`}>
              <rect width="100" height="100" fill={`url(#${clipA}-bg)`} />
              {/* Shoulders */}
              <path
                d="M14 102 C16 78, 32 72, 50 72 C68 72, 84 78, 86 102 Z"
                fill="#18181b"
              />
              {/* Neck */}
              <rect x="43" y="58" width="14" height="18" rx="6" fill="#d4d4d8" />
              {/* Head */}
              <ellipse cx="50" cy="43" rx="17" ry="20" fill="#e4e4e7" />
              {/* Hair */}
              <path
                d="M32 42 C30 24, 42 16, 54 17 C66 18, 70 28, 67 42 C64 31, 58 26, 48 26 C39 26, 35 32, 32 42 Z"
                fill="#18181b"
              />
              {/* Glasses */}
              <circle
                cx="43"
                cy="42"
                r="5.5"
                fill="none"
                stroke="#18181b"
                strokeWidth="2"
              />
              <circle
                cx="57"
                cy="42"
                r="5.5"
                fill="none"
                stroke="#18181b"
                strokeWidth="2"
              />
              <line
                x1="48.5"
                y1="42"
                x2="51.5"
                y2="42"
                stroke="#18181b"
                strokeWidth="2"
              />
              {/* Smile */}
              <path
                d="M44 52 Q50 56 56 52"
                fill="none"
                stroke="#27272a"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          </svg>
        )}
      </div>

      {/* Lower-right larger circular portrait */}
      <div
        className={cn(
          "absolute -bottom-3 -right-2 h-28 w-28 overflow-hidden rounded-full ring-1 transition-transform duration-500 hover:scale-[1.03] sm:h-32 sm:w-32",
          isDark
            ? "bg-zinc-900 ring-white/15"
            : "bg-zinc-100 ring-zinc-900/10"
        )}
      >
        {teamAvatars?.[1] ? (
          <img
            src={teamAvatars[1]}
            alt="Studio creative director"
            className="h-full w-full object-cover grayscale contrast-125"
          />
        ) : (
          <svg
            viewBox="0 0 120 120"
            className="h-full w-full"
            role="img"
            aria-label="Creative director profile portrait"
          >
            <defs>
              <clipPath id={clipB}>
                <circle cx="60" cy="60" r="60" />
              </clipPath>
              <radialGradient id={`${clipB}-bg`} cx="30%" cy="25%" r="75%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="65%" stopColor="#e4e4e7" />
                <stop offset="100%" stopColor="#a1a1aa" />
              </radialGradient>
            </defs>
            <g clipPath={`url(#${clipB})`}>
              <rect width="120" height="120" fill={`url(#${clipB}-bg)`} />
              {/* Shoulders */}
              <path
                d="M28 124 C32 98, 48 92, 74 92 C98 92, 114 102, 118 124 Z"
                fill="#18181b"
              />
              {/* Profile Head Facing Left */}
              <path
                d="M66 30 C48 30, 38 42, 38 56 L33 65 L39 67 L38 74 C38 82, 46 88, 56 88 L64 98 L82 94 L82 76 C88 66, 86 30, 66 30 Z"
                fill="#d4d4d8"
              />
              {/* Curly Hair & Beard */}
              <path
                d="M42 46 C36 30, 48 16, 68 18 C86 18, 98 32, 96 52 C95 66, 88 76, 80 80 C82 66, 80 54, 72 48 C64 42, 50 42, 42 46 Z"
                fill="#18181b"
              />
              <path
                d="M38 68 C39 82, 48 90, 62 88 C70 86, 76 78, 76 68 C70 72, 62 74, 54 73 C47 72, 42 70, 38 68 Z"
                fill="#27272a"
              />
              {/* Eye */}
              <circle cx="48" cy="54" r="2.2" fill="#18181b" />
            </g>
          </svg>
        )}
      </div>
    </div>
  );
}

/**
 * Vertical Kinetic Typography Marquee ("QlarK")
 */
function TypographyMarqueeCard({
  brandName,
  isDark,
  shouldAnimate,
}: {
  brandName: string;
  isDark: boolean;
  shouldAnimate: boolean;
}) {
  return (
    <div className="relative h-full min-h-[120px] w-full overflow-hidden select-none">
      {/* Soft top & bottom fade masks */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-gradient-to-b to-transparent",
          isDark ? "from-[#141417]" : "from-white"
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 bg-gradient-to-t to-transparent",
          isDark ? "from-[#141417]" : "from-white"
        )}
      />

      <motion.div
        className="flex flex-col items-center"
        animate={shouldAnimate ? { y: ["0%", "-50%"] } : { y: "0%" }}
        transition={
          shouldAnimate
            ? {
                duration: 12,
                ease: "linear",
                repeat: Infinity,
              }
            : { duration: 0 }
        }
      >
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className={cn(
              "w-full text-center text-[64px] font-bold leading-[0.88] tracking-[-0.04em] sm:text-[78px]",
              isDark ? "text-zinc-500/45" : "text-zinc-900/12"
            )}
          >
            {brandName}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/**
 * Animated Social Avatar inside the Front Profile Card
 * Cycles between a bold Q cutout and a subtle playful blink/wink mark.
 */
function AnimatedProfileAvatar({
  isDark,
  shouldAnimate,
}: {
  isDark: boolean;
  shouldAnimate: boolean;
}) {
  const [morph, setMorph] = useState(false);

  useEffect(() => {
    if (!shouldAnimate) {
      setMorph(false);
      return;
    }
    const interval = setInterval(() => {
      setMorph((prev) => !prev);
    }, 2400);
    return () => clearInterval(interval);
  }, [shouldAnimate]);

  return (
    <div
      className={cn(
        "relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full sm:h-[74px] sm:w-[74px]",
        isDark ? "bg-white" : "bg-zinc-950"
      )}
    >
      <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
        {/* Main inner cutout */}
        <motion.rect
          className={isDark ? "fill-[#1A1A1E]" : "fill-white"}
          initial={false}
          animate={
            morph
              ? { x: 18, y: 29, width: 18, height: 6, rx: 3 }
              : { x: 20, y: 20, width: 24, height: 24, rx: 12 }
          }
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
        {/* Accent dot / Q tail notch */}
        <motion.circle
          className={isDark ? "fill-[#1A1A1E]" : "fill-white"}
          initial={false}
          animate={
            morph
              ? { cx: 43, cy: 32, r: 3 }
              : { cx: 46, cy: 46, r: 3.5 }
          }
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
    </div>
  );
}

/**
 * Layered Social Profile Showcase Card
 */
function SocialProfileShowcaseCard({
  brandName,
  studioSuffix,
  socialHandle,
  socialRole,
  socialBio,
  socialWebsite,
  postsCount,
  followersCount,
  isDark,
  shouldAnimate,
}: {
  brandName: string;
  studioSuffix: string;
  socialHandle: string;
  socialRole: string;
  socialBio: string;
  socialWebsite: string;
  postsCount: number;
  followersCount: number;
  isDark: boolean;
  shouldAnimate: boolean;
}) {
  const fullName = `${brandName} ${studioSuffix}`.trim();

  return (
    <div className="relative flex h-full min-h-[268px] w-full items-end justify-end overflow-hidden pt-6 pl-4">
      {/* Back Peeking Mobile Card */}
      <div
        className={cn(
          "absolute bottom-0 left-4 top-16 z-0 w-[46%] rounded-t-[20px] border border-b-0 p-4 transition-transform duration-500",
          isDark
            ? "border-white/[0.08] bg-[#19191D]/90"
            : "border-zinc-200 bg-zinc-50"
        )}
      >
        <ChevronLeft
          className={cn(
            "h-4 w-4",
            isDark ? "text-zinc-400" : "text-zinc-500"
          )}
          aria-hidden="true"
        />
        <div className="mt-5 flex flex-col items-start">
          <div className="mb-3 flex h-11 w-11 items-center justify-center">
            <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
              <circle
                cx="30"
                cy="30"
                r="22"
                className={isDark ? "fill-white" : "fill-zinc-950"}
              />
              <rect
                x="41"
                y="41"
                width="11"
                height="11"
                rx="2"
                className={isDark ? "fill-white" : "fill-zinc-950"}
              />
            </svg>
          </div>
          <p
            className={cn(
              "truncate text-xs font-semibold",
              isDark ? "text-white" : "text-zinc-900"
            )}
          >
            {fullName}
          </p>
          <p
            className={cn(
              "truncate text-[10px]",
              isDark ? "text-zinc-400" : "text-zinc-500"
            )}
          >
            {socialRole}
          </p>
        </div>
      </div>

      {/* Front Overlapping Mobile Card */}
      <div
        className={cn(
          "relative z-10 ml-auto w-[74%] rounded-tl-[24px] rounded-tr-[16px] border border-b-0 border-r-0 p-5 shadow-2xl sm:w-[70%] sm:p-6",
          isDark
            ? "border-white/[0.1] bg-[#1B1B1F] shadow-black/70"
            : "border-zinc-200 bg-white shadow-zinc-300/60"
        )}
      >
        {/* Top Bar */}
        <div className="mb-5 flex items-center justify-between">
          <ChevronLeft
            className={cn(
              "h-4 w-4",
              isDark ? "text-zinc-300" : "text-zinc-600"
            )}
            aria-hidden="true"
          />
          <span
            className={cn(
              "text-xs font-semibold tracking-[-0.01em]",
              isDark ? "text-white" : "text-zinc-900"
            )}
          >
            {socialHandle}
          </span>
        </div>

        {/* Avatar + Stats */}
        <div className="flex items-center gap-5 sm:gap-6">
          <AnimatedProfileAvatar
            isDark={isDark}
            shouldAnimate={shouldAnimate}
          />
          <div className="flex items-center gap-5 sm:gap-6">
            <div>
              <div
                className={cn(
                  "text-base font-semibold tabular-nums leading-tight sm:text-lg",
                  isDark ? "text-white" : "text-zinc-950"
                )}
              >
                {postsCount}
              </div>
              <div
                className={cn(
                  "text-[11px]",
                  isDark ? "text-zinc-400" : "text-zinc-500"
                )}
              >
                Posts
              </div>
            </div>
            <div>
              <div
                className={cn(
                  "text-base font-semibold tabular-nums leading-tight sm:text-lg",
                  isDark ? "text-white" : "text-zinc-950"
                )}
              >
                {followersCount}
              </div>
              <div
                className={cn(
                  "text-[11px]",
                  isDark ? "text-zinc-400" : "text-zinc-500"
                )}
              >
                Followers
              </div>
            </div>
          </div>
        </div>

        {/* Bio Block */}
        <div className="mt-4 space-y-0.5 text-left">
          <p
            className={cn(
              "text-xs font-semibold sm:text-[13px]",
              isDark ? "text-white" : "text-zinc-950"
            )}
          >
            {fullName}
          </p>
          <p
            className={cn(
              "text-[11px]",
              isDark ? "text-zinc-400" : "text-zinc-500"
            )}
          >
            {socialRole}
          </p>
          <p
            className={cn(
              "pt-0.5 text-[11px] leading-snug sm:text-xs",
              isDark ? "text-zinc-200" : "text-zinc-700"
            )}
          >
            {socialBio}
          </p>
          <div className="pt-1">
            <a
              href={`https://${socialWebsite.replace(/^https?:\/\//, "")}`}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "inline-flex items-center gap-1 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded-sm",
                isDark
                  ? "text-zinc-400 hover:text-white"
                  : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              <Link2 className="h-3 w-3" aria-hidden="true" />
              <span>{socialWebsite}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Procedural Monochrome Cosmic Particle Orb ("DIGITAL REALITIES")
 * Drawn on a crisp HiDPI canvas with a deterministic seed so there are
 * zero external image failures and buttery-smooth CSS rotation.
 */
function CosmicOrbCard({
  orbLabelTop,
  orbLabelBottom,
  isDark,
  shouldAnimate,
}: {
  orbLabelTop: string;
  orbLabelBottom: string;
  isDark: boolean;
  shouldAnimate: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 360;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2;

    // Clear & clip to circle
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    // Base dark cosmic void
    const bgGrad = ctx.createRadialGradient(
      cx * 0.85,
      cy * 0.9,
      12,
      cx,
      cy,
      radius
    );
    bgGrad.addColorStop(0, "#050507");
    bgGrad.addColorStop(0.55, "#151519");
    bgGrad.addColorStop(1, "#09090b");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, size, size);

    // Deterministic PRNG for consistent stardust clouds
    let seed = 42197;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    // Soft nebula clouds along a swirling band
    for (let i = 0; i < 42; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = radius * (0.28 + rand() * 0.62);
      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist;
      const r = 24 + rand() * 48;
      const alpha = 0.03 + rand() * 0.07;
      const cloud = ctx.createRadialGradient(x, y, 0, x, y, r);
      cloud.addColorStop(0, `rgba(255,255,255,${alpha})`);
      cloud.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = cloud;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Crisp stardust particles clustered in a crescent/spiral
    for (let i = 0; i < 1400; i++) {
      const t = rand() * Math.PI * 2;
      const spiral = 0.32 + 0.58 * Math.pow(rand(), 0.72);
      const scatter = (rand() - 0.5) * 44;
      const x = cx + Math.cos(t) * (radius * spiral) + scatter;
      const y = cy + Math.sin(t) * (radius * spiral) + scatter;
      const distFromCenter = Math.hypot(x - cx, y - cy);
      if (distFromCenter > radius - 2) continue;

      // Darken central void for high-contrast look
      const voidFactor = Math.min(1, Math.max(0.1, (distFromCenter - 32) / 90));
      const brightness = Math.floor(170 + rand() * 85);
      const alpha = (0.15 + rand() * 0.85) * voidFactor;
      const dotSize = rand() > 0.94 ? 1.7 : rand() > 0.6 ? 1.1 : 0.65;

      ctx.fillStyle = `rgba(${brightness},${brightness},${brightness},${alpha.toFixed(
        3
      )})`;
      ctx.beginPath();
      ctx.arc(x, y, dotSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Subtle rim vignette
    const vignette = ctx.createRadialGradient(
      cx,
      cy,
      radius * 0.72,
      cx,
      cy,
      radius
    );
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.65)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, size, size);

    ctx.restore();
  }, []);

  return (
    <div className="relative flex h-full min-h-[210px] w-full items-center justify-center p-4">
      <div className="relative aspect-square w-full max-w-[205px] overflow-hidden rounded-full shadow-inner">
        <motion.canvas
          ref={canvasRef}
          aria-hidden="true"
          className="h-full w-full rounded-full object-cover"
          animate={shouldAnimate ? { rotate: 360 } : { rotate: 0 }}
          transition={
            shouldAnimate
              ? { duration: 48, ease: "linear", repeat: Infinity }
              : { duration: 0 }
          }
        />

        {/* Subtle ring border */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset",
            isDark ? "ring-white/10" : "ring-black/15"
          )}
        />

        {/* Centered Spaced Typography */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-7 text-center">
          <span className="font-mono text-[9px] font-medium uppercase tracking-[0.32em] text-white/90 drop-shadow">
            {orbLabelTop}
          </span>
          <span className="mt-1 font-mono text-[9px] font-medium uppercase tracking-[0.32em] text-white/80 drop-shadow">
            {orbLabelBottom}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Figma-Style Collaborative Selection Hero Card
 * Smoothly resizes the bounding box with corner handles & cursor badge
 * around cycling phrases. Clicking or pressing Enter/Space advances manually.
 */
function CollaborativeHeroCard({
  headlinePrefix,
  headlineBottom,
  phrases,
  cursorLabel,
  phraseInterval,
  isDark,
  shouldAnimate,
}: {
  headlinePrefix: string;
  headlineBottom: string;
  phrases: string[];
  cursorLabel: string;
  phraseInterval: number;
  isDark: boolean;
  shouldAnimate: boolean;
}) {
  const safePhrases = phrases.length > 0 ? phrases : DEFAULT_PHRASES;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!shouldAnimate || safePhrases.length <= 1) return;
    const clampedMs = Math.max(800, phraseInterval);
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % safePhrases.length);
    }, clampedMs);
    return () => clearInterval(timer);
  }, [shouldAnimate, safePhrases.length, phraseInterval]);

  const activePhrase = safePhrases[index % safePhrases.length];

  const handleAdvance = () => {
    setIndex((prev) => (prev + 1) % safePhrases.length);
  };

  return (
    <div className="relative flex h-full min-h-[210px] w-full flex-col items-center justify-center px-6 py-8 text-center">
      {/* Row 1: Prefix + Animated Figma Selection Box */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        <motion.span
          layout={shouldAnimate}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "text-2xl font-bold tracking-[-0.03em] sm:text-[28px] md:text-[31px]",
            isDark ? "text-white" : "text-zinc-950"
          )}
        >
          {headlinePrefix}
        </motion.span>

        <motion.button
          type="button"
          onClick={handleAdvance}
          layout={shouldAnimate}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          aria-label={`Active headline phrase: ${activePhrase}. Click to cycle phrase.`}
          className={cn(
            "group relative inline-flex cursor-pointer items-center justify-center border px-4 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            isDark
              ? "border-white/25 bg-white/[0.025] hover:border-white/40 focus-visible:ring-white/60 focus-visible:ring-offset-[#141417]"
              : "border-zinc-900/25 bg-zinc-900/[0.03] hover:border-zinc-900/45 focus-visible:ring-zinc-900 focus-visible:ring-offset-white"
          )}
        >
          {/* 4 Corner Resize Handles */}
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute -left-[3.5px] -top-[3.5px] h-[6px] w-[6px] border",
              isDark
                ? "border-white/55 bg-[#141417]"
                : "border-zinc-900/60 bg-white"
            )}
          />
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute -right-[3.5px] -top-[3.5px] h-[6px] w-[6px] border",
              isDark
                ? "border-white/55 bg-[#141417]"
                : "border-zinc-900/60 bg-white"
            )}
          />
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute -bottom-[3.5px] -left-[3.5px] h-[6px] w-[6px] border",
              isDark
                ? "border-white/55 bg-[#141417]"
                : "border-zinc-900/60 bg-white"
            )}
          />
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute -bottom-[3.5px] -right-[3.5px] h-[6px] w-[6px] border",
              isDark
                ? "border-white/55 bg-[#141417]"
                : "border-zinc-900/60 bg-white"
            )}
          />

          {/* Cycling Phrase */}
          <span
            aria-live="polite"
            className="relative inline-flex overflow-hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={activePhrase}
                initial={
                  shouldAnimate
                    ? { opacity: 0, y: 10, filter: "blur(3px)" }
                    : false
                }
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={
                  shouldAnimate
                    ? { opacity: 0, y: -10, filter: "blur(3px)" }
                    : undefined
                }
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "whitespace-nowrap text-2xl font-bold tracking-[-0.03em] sm:text-[28px] md:text-[31px]",
                  isDark ? "text-white" : "text-zinc-950"
                )}
              >
                {activePhrase}
              </motion.span>
            </AnimatePresence>
          </span>

          {/* Collaborative Cursor + "You" Pill */}
          <motion.div
            aria-hidden="true"
            layout={shouldAnimate}
            key={`cursor-${index}`}
            initial={shouldAnimate ? { x: 4, y: 3 } : false}
            animate={{ x: 0, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute -bottom-6 -right-9 z-20 flex items-start"
          >
            <svg
              width="14"
              height="16"
              viewBox="0 0 14 16"
              fill="none"
              className="shrink-0 drop-shadow-sm"
            >
              <path
                d="M1 1.5L12.5 7.5L7.3 9.1L5.2 14.2L1 1.5Z"
                className={
                  isDark
                    ? "fill-white stroke-[#141417]"
                    : "fill-zinc-950 stroke-white"
                }
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
            <span
              className={cn(
                "ml-0.5 mt-3 rounded-[4px] border px-2 py-0.5 text-[10px] font-medium leading-none shadow-sm",
                isDark
                  ? "border-white/10 bg-[#27272C] text-zinc-200"
                  : "border-zinc-300 bg-zinc-900 text-white"
              )}
            >
              {cursorLabel}
            </span>
          </motion.div>
        </motion.button>
      </div>

      {/* Row 2: Static Bottom Headline */}
      <h2
        className={cn(
          "mt-3 text-2xl font-bold tracking-[-0.03em] sm:mt-4 sm:text-[28px] md:text-[31px]",
          isDark ? "text-white" : "text-zinc-950"
        )}
      >
        {headlineBottom}
      </h2>
    </div>
  );
}

export const AgencyBentoShowcase = React.forwardRef<
  HTMLDivElement,
  AgencyBentoShowcaseProps
>(function AgencyBentoShowcase(
  {
    brandName = "QlarK",
    studioSuffix = "Studio",
    theme = "dark",
    autoPlay = true,
    phraseInterval = 2000,
    phrases = DEFAULT_PHRASES,
    headlinePrefix = "Lets",
    headlineBottom = "Digital Dreams Together",
    cursorLabel = "You",
    socialHandle,
    socialRole = "Digital Creator",
    socialBio = "Product design, Branding, UI/UX Audit",
    socialWebsite = "qlark.studio",
    postsCount = 29,
    followersCount = 334,
    teamAvatars,
    orbLabelTop = "DIGITAL",
    orbLabelBottom = "REALITIES",
    className,
    ...rest
  },
  ref
) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = autoPlay && !prefersReducedMotion;
  const isDark = theme === "dark";

  const resolvedHandle =
    socialHandle ?? `${brandName}${studioSuffix}`.replace(/\s+/g, "");

  const cardBase = cn(
    "relative overflow-hidden rounded-[20px] border transition-colors duration-300",
    isDark
      ? "border-white/[0.07] bg-[#141417]"
      : "border-zinc-200/90 bg-white shadow-sm"
  );

  return (
    <section
      ref={ref}
      aria-label={`${brandName} ${studioSuffix} brand showcase`}
      className={cn(
        "relative mx-auto w-full max-w-[920px] overflow-hidden rounded-[28px] p-3.5 sm:p-5",
        isDark ? "bg-[#0B0B0D] text-white" : "bg-[#F4F4F6] text-zinc-950",
        className
      )}
      {...rest}
    >
      {/* Subtle Upper-Left Studio Ambient Light */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full blur-3xl",
          isDark ? "bg-white/[0.07]" : "bg-zinc-400/15"
        )}
      />

      {/* Macro Bento Grid */}
      <div className="relative z-10 flex flex-col gap-3 sm:gap-3.5">
        {/* TOP SECTION */}
        <div className="grid grid-cols-1 gap-3 sm:gap-3.5 md:grid-cols-12">
          {/* Top-Left Column (Logo + Team + Marquee) */}
          <div className="flex flex-col gap-3 sm:gap-3.5 md:col-span-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
              <div className={cn(cardBase, "min-h-[136px]")}>
                <AnimatedBrandLogo
                  brandName={brandName}
                  studioSuffix={studioSuffix}
                  isDark={isDark}
                  shouldAnimate={shouldAnimate}
                />
              </div>

              <div className={cn(cardBase, "min-h-[136px]")}>
                <TeamPortraitsCard isDark={isDark} teamAvatars={teamAvatars} />
              </div>
            </div>

            <div className={cn(cardBase, "flex-1")}>
              <TypographyMarqueeCard
                brandName={brandName}
                isDark={isDark}
                shouldAnimate={shouldAnimate}
              />
            </div>
          </div>

          {/* Top-Right Column (Layered Social Profile Showcase) */}
          <div className={cn(cardBase, "md:col-span-6")}>
            <SocialProfileShowcaseCard
              brandName={brandName}
              studioSuffix={studioSuffix}
              socialHandle={resolvedHandle}
              socialRole={socialRole}
              socialBio={socialBio}
              socialWebsite={socialWebsite}
              postsCount={postsCount}
              followersCount={followersCount}
              isDark={isDark}
              shouldAnimate={shouldAnimate}
            />
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="grid grid-cols-1 gap-3 sm:gap-3.5 md:grid-cols-12">
          {/* Bottom-Left Cosmic Orb Card */}
          <div className={cn(cardBase, "md:col-span-4")}>
            <CosmicOrbCard
              orbLabelTop={orbLabelTop}
              orbLabelBottom={orbLabelBottom}
              isDark={isDark}
              shouldAnimate={shouldAnimate}
            />
          </div>

          {/* Bottom-Right Collaborative Selection Hero Card */}
          <div className={cn(cardBase, "md:col-span-8")}>
            <CollaborativeHeroCard
              headlinePrefix={headlinePrefix}
              headlineBottom={headlineBottom}
              phrases={phrases}
              cursorLabel={cursorLabel}
              phraseInterval={phraseInterval}
              isDark={isDark}
              shouldAnimate={shouldAnimate}
            />
          </div>
        </div>
      </div>
    </section>
  );
});

AgencyBentoShowcase.displayName = "AgencyBentoShowcase";

export {
  AgencyBentoShowcase as component,
  AgencyBentoShowcase as Component,
};
export default AgencyBentoShowcase;