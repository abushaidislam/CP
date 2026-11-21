"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, Link2 } from "lucide-react";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type QlarkBentoTheme = "auto" | "dark" | "light";

export interface QlarkProfileStats {
  posts: number;
  followers: number;
}

export interface QlarkAvatarItem {
  src: string;
  alt: string;
  initials: string;
}

export interface QlarkStudioBentoGridProps
  extends React.HTMLAttributes<HTMLElement> {
  /** Color theme mode. "auto" follows Tailwind's dark class. */
  theme?: QlarkBentoTheme;
  /** Primary brand wordmark shown in the logo reveal, vertical marquee, and profile header. */
  brandName?: string;
  /** Secondary brand subtitle shown beneath the primary wordmark. */
  brandSubtitle?: string;
  /** Social handle shown in the profile mockup header. */
  handle?: string;
  /** Role / category label shown on the social profile cards. */
  roleLabel?: string;
  /** Short studio bio shown on the foreground social profile card. */
  bio?: string;
  /** Display URL shown in the social profile bio footer. */
  website?: string;
  /** Profile metrics (posts & followers). */
  stats?: QlarkProfileStats;
  /** Leading word in the interactive Figma-style headline card. */
  headlinePrefix?: string;
  /** Rotating phrases displayed inside the Figma selection frame. */
  headlinePhrases?: string[];
  /** Bottom line of the headline card. */
  headlineSuffix?: string;
  /** Multiplayer cursor badge text next to the selection frame. */
  cursorLabel?: string;
  /** Two-line caption overlaid on the cosmic particle globe. */
  globeCaptionTop?: string;
  globeCaptionBottom?: string;
  /** Two monochrome team/creator portraits displayed in the floating orbit card. */
  avatars?: [QlarkAvatarItem, QlarkAvatarItem];
  /** Enables or pauses all ambient motion (logo morph, marquee, orbit drift, blink, globe, phrase cycle). */
  autoPlay?: boolean;
  /** Interval in milliseconds between rotating headline phrases. */
  phraseInterval?: number;
}

const DEFAULT_PHRASES = [
  "Spark The Next",
  "Design a Techie",
  "Elevate Your",
  "Create an Engaging",
  "Build an Accessible",
];

const DEFAULT_AVATARS: [QlarkAvatarItem, QlarkAvatarItem] = [
  {
    src: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=240&q=80",
    alt: "Creative director portrait",
    initials: "QS",
  },
  {
    src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=320&q=80",
    alt: "Design lead profile portrait",
    initials: "DL",
  },
];

const DEFAULT_STATS: QlarkProfileStats = {
  posts: 29,
  followers: 334,
};

/**
 * Pure SVG Qlark geometric emblem: circle with optional detachable square tail.
 */
function QlarkMarkSvg({
  showTail = true,
  className,
}: {
  showTail?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      aria-hidden="true"
      className={cn("overflow-visible", className)}
    >
      <circle cx="20" cy="20" r="16" fill="currentColor" />
      <motion.rect
        x="29.5"
        y="29.5"
        width="10.5"
        height="10.5"
        rx="1.2"
        fill="currentColor"
        initial={false}
        animate={{
          scale: showTail ? 1 : 0,
          x: showTail ? 0 : -6,
          y: showTail ? 0 : -6,
          opacity: showTail ? 1 : 0,
        }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: "34.75px 34.75px" }}
      />
    </svg>
  );
}

/**
 * Crisp white multiplayer cursor arrow matching the reference Figma selection frame.
 */
function FigmaCursorSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M2.4 1.8L15.4 7.4L9.5 9.5L7.4 15.4L2.4 1.8Z"
        fill="currentColor"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Deterministic monochrome cosmic nebula & starfield sphere rendered on HTML5 Canvas.
 */
function ParticleNebulaGlobe({
  captionTop,
  captionBottom,
  animate,
  isLight,
}: {
  captionTop: string;
  captionBottom: string;
  animate: boolean;
  isLight: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Seeded PRNG for deterministic, organic nebula distribution matching the reference
    let seed = 42197;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    interface Particle {
      angle: number;
      radius: number;
      size: number;
      alpha: number;
      speed: number;
      bandOffset: number;
      layer: number;
    }

    const particles: Particle[] = [];
    const total = 1150;

    for (let i = 0; i < total; i++) {
      const layer = i < 780 ? 0 : 1;
      // Concentrate particles along a sweeping diagonal nebula belt while leaving an upper-right dark void
      const angle = rand() * Math.PI * 2;
      const rBias = Math.pow(rand(), layer === 0 ? 0.62 : 0.45);
      const radius = rBias * 0.96;
      const size = layer === 0 ? 0.55 + rand() * 1.15 : 0.7 + rand() * 1.85;
      const alpha = layer === 0 ? 0.14 + rand() * 0.58 : 0.28 + rand() * 0.65;
      const speed = (0.04 + rand() * 0.08) * (layer === 0 ? 1 : 0.65);
      const bandOffset = rand() * Math.PI * 2;
      particles.push({ angle, radius, size, alpha, speed, bandOffset, layer });
    }

    let rafId = 0;
    let startTime = performance.now();

    const drawFrame = (now: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const size = Math.max(120, Math.round(Math.min(rect.width, rect.height)));
      if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
        canvas.width = size * dpr;
        canvas.height = size * dpr;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;
      const R = size / 2;
      const elapsed = animate ? (now - startTime) * 0.001 : 0;

      // Clip to circular globe
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R - 0.5, 0, Math.PI * 2);
      ctx.clip();

      // Base cosmic void gradient
      const bgGrad = ctx.createRadialGradient(
        cx * 1.18,
        cy * 0.78,
        R * 0.05,
        cx,
        cy,
        R * 1.05
      );
      if (isLight) {
        bgGrad.addColorStop(0, "#100e14");
        bgGrad.addColorStop(0.55, "#191620");
        bgGrad.addColorStop(1, "#27242e");
      } else {
        bgGrad.addColorStop(0, "#050408");
        bgGrad.addColorStop(0.5, "#121016");
        bgGrad.addColorStop(1, "#1e1b23");
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, size, size);

      // Soft nebula cloud glows along the lower-left and right arcs
      const cloud1 = ctx.createRadialGradient(
        cx * 0.72,
        cy * 1.38,
        R * 0.06,
        cx * 0.8,
        cy * 1.32,
        R * 0.78
      );
      cloud1.addColorStop(0, "rgba(255,255,255,0.22)");
      cloud1.addColorStop(0.5, "rgba(220,218,228,0.08)");
      cloud1.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = cloud1;
      ctx.fillRect(0, 0, size, size);

      const cloud2 = ctx.createRadialGradient(
        cx * 1.56,
        cy * 1.05,
        R * 0.04,
        cx * 1.48,
        cy * 1.05,
        R * 0.62
      );
      cloud2.addColorStop(0, "rgba(255,255,255,0.18)");
      cloud2.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = cloud2;
      ctx.fillRect(0, 0, size, size);

      // Draw swirling particles with upper-right dark crater attenuation
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const a = p.angle + elapsed * p.speed;
        const wobble = Math.sin(elapsed * 0.45 + p.bandOffset) * 0.025;
        const r = Math.min(0.98, Math.max(0.05, p.radius + wobble));
        const px = cx + Math.cos(a) * r * R;
        const py = cy + Math.sin(a) * r * R;

        // Distance from the upper-right dark void center (matches reference nebula)
        const vx = (px - cx * 1.16) / R;
        const vy = (py - cy * 0.84) / R;
        const voidDist = Math.sqrt(vx * vx + vy * vy);
        const voidMask = Math.min(1, Math.max(0.08, (voidDist - 0.22) * 1.65));

        // Emphasize lower crescent & outer rim nebula clusters
        const lowerBoost = py > cy * 0.92 ? 1.18 : 0.86;
        const finalAlpha = Math.min(0.95, p.alpha * voidMask * lowerBoost);

        ctx.fillStyle = `rgba(244, 243, 248, ${finalAlpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Subtle inner vignette rim
      const rim = ctx.createRadialGradient(cx, cy, R * 0.72, cx, cy, R);
      rim.addColorStop(0, "rgba(0,0,0,0)");
      rim.addColorStop(1, "rgba(0,0,0,0.42)");
      ctx.fillStyle = rim;
      ctx.fillRect(0, 0, size, size);

      ctx.restore();

      if (animate) {
        rafId = requestAnimationFrame(drawFrame);
      }
    };

    drawFrame(performance.now());

    const handleResize = () => {
      if (!animate) drawFrame(performance.now());
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
    };
  }, [animate, isLight]);

  return (
    <div className="relative flex aspect-square w-full max-w-[232px] items-center justify-center rounded-full overflow-hidden shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="h-full w-full block"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-[21%] flex flex-col items-center justify-center text-center leading-tight">
        <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.34em] text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
          {captionTop}
        </span>
        <span className="mt-0.5 text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.34em] text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
          {captionBottom}
        </span>
      </div>
    </div>
  );
}

/**
 * Monochrome portrait avatar with graceful fallback if image fails to load.
 */
function MonochromePortrait({
  avatar,
  className,
}: {
  avatar: QlarkAvatarItem;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-neutral-200 text-neutral-800 font-semibold select-none",
          className
        )}
        aria-label={avatar.alt}
      >
        {avatar.initials}
      </div>
    );
  }

  return (
    <img
      src={avatar.src}
      alt={avatar.alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn(
        "h-full w-full object-cover object-top grayscale contrast-125 select-none",
        className
      )}
    />
  );
}

export const QlarkStudioBentoGrid = React.forwardRef<
  HTMLElement,
  QlarkStudioBentoGridProps
>(
  (
    {
      theme = "auto",
      brandName = "QlarK",
      brandSubtitle = "Studio",
      handle = "QlarkStudio",
      roleLabel = "Digital creator",
      bio = "Product design, Branding, UI/UX Audit",
      website = "qlark.studio",
      stats = DEFAULT_STATS,
      headlinePrefix = "Lets",
      headlinePhrases = DEFAULT_PHRASES,
      headlineSuffix = "Digital Dreams Together",
      cursorLabel = "You",
      globeCaptionTop = "DIGITAL",
      globeCaptionBottom = "REALITIES",
      avatars = DEFAULT_AVATARS,
      autoPlay = true,
      phraseInterval = 2000,
      className,
      ...rest
    },
    ref
  ) => {
    const uid = useId().replace(/:/g, "");
    const prefersReducedMotion = useReducedMotion();
    const shouldAnimate = autoPlay && !prefersReducedMotion;

    // Safe non-empty phrases array
    const phrases =
      headlinePhrases && headlinePhrases.length > 0
        ? headlinePhrases
        : DEFAULT_PHRASES;

    // Card 1: 5-second logo choreography phase
    // 0: full lockup (QlarK Studio), 1: centered Q-mark with tail, 2: pure centered circle, 3: centered Q-mark with tail
    const [logoPhase, setLogoPhase] = useState<0 | 1 | 2 | 3>(0);

    // Card 6: Rotating Figma-style headline index
    const [phraseIndex, setPhraseIndex] = useState(0);

    // Clamp phrase index if phrases length changes
    const safePhraseIndex = phraseIndex % phrases.length;

    // Drive Card 1 logo choreography (matches 5s cycle in reference video)
    useEffect(() => {
      if (!shouldAnimate) {
        setLogoPhase(0);
        return;
      }

      const durations = [1300, 750, 1450, 650]; // total ~4.15s + transition
      let current: 0 | 1 | 2 | 3 = 0;
      let timer: ReturnType<typeof setTimeout>;

      const step = () => {
        current = ((current + 1) % 4) as 0 | 1 | 2 | 3;
        setLogoPhase(current);
        timer = setTimeout(step, durations[current]);
      };

      timer = setTimeout(step, durations[0]);
      return () => clearTimeout(timer);
    }, [shouldAnimate]);

    // Drive Card 6 rotating headline phrases
    useEffect(() => {
      if (!shouldAnimate || phrases.length <= 1) return;
      const safeMs = Math.max(800, Math.min(10000, phraseInterval));
      const id = setInterval(() => {
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      }, safeMs);
      return () => clearInterval(id);
    }, [shouldAnimate, phraseInterval, phrases.length]);

    const handleCyclePhrase = () => {
      if (phrases.length <= 1) return;
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    };

    // Theme resolution classes (supports "auto" via Tailwind dark:, plus forced "dark" | "light")
    const isForcedLight = theme === "light";
    const isForcedDark = theme === "dark";

    const frameSurface = isForcedDark
      ? "bg-[#040207] text-white"
      : isForcedLight
      ? "bg-[#ecebef] text-[#141218]"
      : "bg-[#ecebef] text-[#141218] dark:bg-[#040207] dark:text-white";

    const cardSurface = isForcedDark
      ? "bg-[#1c191f] border-white/[0.08] text-white"
      : isForcedLight
      ? "bg-white border-black/[0.08] text-[#141218] shadow-[0_1px_2px_rgba(16,14,20,0.04)]"
      : "bg-white border-black/[0.08] text-[#141218] shadow-[0_1px_2px_rgba(16,14,20,0.04)] dark:bg-[#1c191f] dark:border-white/[0.08] dark:text-white dark:shadow-none";

    const innerCardBack = isForcedDark
      ? "bg-[#242129] border-white/[0.07]"
      : isForcedLight
      ? "bg-[#f4f3f7] border-black/[0.08]"
      : "bg-[#f4f3f7] border-black/[0.08] dark:bg-[#242129] dark:border-white/[0.07]";

    const innerCardFront = isForcedDark
      ? "bg-[#2b2831] border-white/[0.09] shadow-[-10px_8px_28px_rgba(0,0,0,0.52)]"
      : isForcedLight
      ? "bg-white border-black/[0.09] shadow-[-10px_8px_24px_rgba(16,14,20,0.10)]"
      : "bg-white border-black/[0.09] shadow-[-10px_8px_24px_rgba(16,14,20,0.10)] dark:bg-[#2b2831] dark:border-white/[0.09] dark:shadow-[-10px_8px_28px_rgba(0,0,0,0.52)]";

    const mutedText = isForcedDark
      ? "text-white/55"
      : isForcedLight
      ? "text-[#141218]/55"
      : "text-[#141218]/55 dark:text-white/55";

    const subtleRingBorder = isForcedDark
      ? "border-white/[0.07]"
      : isForcedLight
      ? "border-black/[0.07]"
      : "border-black/[0.07] dark:border-white/[0.07]";

    const marqueeTextColor = isForcedDark
      ? "text-white/[0.32]"
      : isForcedLight
      ? "text-[#141218]/[0.16]"
      : "text-[#141218]/[0.16] dark:text-white/[0.32]";

    const selectionBoxClasses = isForcedDark
      ? "border-white/[0.18] bg-[#16131a]/80 hover:border-white/30"
      : isForcedLight
      ? "border-black/[0.18] bg-[#f7f6fa] hover:border-black/35"
      : "border-black/[0.18] bg-[#f7f6fa] hover:border-black/35 dark:border-white/[0.18] dark:bg-[#16131a]/80 dark:hover:border-white/30";

    const handleDotClasses = isForcedDark
      ? "border-white/35 bg-[#1c191f]"
      : isForcedLight
      ? "border-black/35 bg-white"
      : "border-black/35 bg-white dark:border-white/35 dark:bg-[#1c191f]";

    const cursorBadgeClasses = isForcedDark
      ? "bg-[#312e36] border-white/[0.12] text-white/85"
      : isForcedLight
      ? "bg-[#18161c] border-black/10 text-white"
      : "bg-[#18161c] border-black/10 text-white dark:bg-[#312e36] dark:border-white/[0.12] dark:text-white/85";

    const showWordmark = logoPhase === 0;
    const showTail = logoPhase !== 2;
    const fullBrandTitle = `${brandName} ${brandSubtitle}`.trim();

    return (
      <section
        ref={ref}
        aria-label={`${fullBrandTitle} brand showcase bento grid`}
        className={cn(
          "relative mx-auto w-full max-w-[920px] overflow-hidden rounded-[22px] p-3 sm:p-5 md:p-7 antialiased",
          frameSurface,
          className
        )}
        style={{
          fontFamily:
            "'Plus Jakarta Sans', 'Satoshi', 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
        }}
        {...rest}
      >
        {/* Subtle diagonal top-left volumetric light beam matching the reference studio lighting */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -top-24 -left-24 z-20 h-[440px] w-[440px] rounded-full blur-2xl",
            isForcedDark
              ? "bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.06)_36%,transparent_72%)]"
              : isForcedLight
              ? "bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.18)_40%,transparent_72%)]"
              : "bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0.18)_40%,transparent_72%)] dark:bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.06)_36%,transparent_72%)]"
          )}
        />

        {/* MAIN BENTO LAYOUT: Top 2-col half + Bottom 30/70 row with uniform 10px (gap-2.5) spacing */}
        <div className="relative z-10 flex flex-col gap-2.5">
          {/* TOP SECTION (Rows 1 & 2) */}
          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
            {/* LEFT HALF: Row 1 (Logo + Portraits) + Row 2 (Vertical Marquee) */}
            <div className="flex flex-col gap-2.5">
              {/* Row 1: Two equal cards */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* CARD 1: Animated Brand Logo Reveal */}
                <div
                  className={cn(
                    "relative flex h-[142px] sm:h-[164px] items-center justify-center overflow-hidden rounded-xl border px-3",
                    cardSurface
                  )}
                >
                  <div className="relative flex items-center justify-center">
                    <motion.div
                      layout={shouldAnimate}
                      transition={{
                        duration: 0.55,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="flex items-center gap-2.5"
                    >
                      <QlarkMarkSvg
                        showTail={showTail}
                        className="h-11 w-11 sm:h-12 sm:w-12 shrink-0"
                      />

                      <AnimatePresence initial={false} mode="popLayout">
                        {showWordmark && (
                          <motion.div
                            key={`${uid}-wordmark`}
                            initial={
                              shouldAnimate
                                ? { opacity: 0, x: -12, width: 0 }
                                : false
                            }
                            animate={{ opacity: 1, x: 0, width: "auto" }}
                            exit={
                              shouldAnimate
                                ? { opacity: 0, x: -10, width: 0 }
                                : undefined
                            }
                            transition={{
                              duration: 0.48,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            className="flex flex-col overflow-hidden whitespace-nowrap leading-none"
                          >
                            <span className="text-[22px] sm:text-[26px] font-bold tracking-[-0.03em]">
                              {brandName}
                            </span>
                            <span className="mt-0.5 text-[18px] sm:text-[21px] font-light tracking-[-0.02em] opacity-85">
                              {brandSubtitle}
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                </div>

                {/* CARD 2: Floating Monochrome Portrait Orbits */}
                <div
                  className={cn(
                    "relative h-[142px] sm:h-[164px] overflow-hidden rounded-xl border",
                    cardSurface
                  )}
                >
                  {/* Subtle concentric geometric orbit ring */}
                  <div
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute left-1/2 top-1/2 h-[138px] w-[138px] -translate-x-[58%] -translate-y-1/2 rounded-full border",
                      subtleRingBorder
                    )}
                  />

                  {/* Top-left smaller circular portrait with Q-notch square accent */}
                  <motion.div
                    animate={
                      shouldAnimate
                        ? { y: [0, 7, -3, 0], x: [0, -3, 3, 0] }
                        : { y: 0, x: 0 }
                    }
                    transition={
                      shouldAnimate
                        ? {
                            duration: 6.4,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }
                        : undefined
                    }
                    className="absolute left-[18%] top-[12%] z-10"
                  >
                    <div className="relative h-[54px] w-[54px] sm:h-[64px] sm:w-[64px]">
                      <div className="h-full w-full overflow-hidden rounded-full bg-white ring-1 ring-black/10">
                        <MonochromePortrait avatar={avatars[0]} />
                      </div>
                      {/* Signature square corner notch */}
                      <span
                        aria-hidden="true"
                        className="absolute -bottom-1.5 -left-1 h-3 w-2.5 bg-white/90 shadow-sm"
                      />
                    </div>
                  </motion.div>

                  {/* Bottom-right larger circular portrait */}
                  <motion.div
                    animate={
                      shouldAnimate
                        ? { y: [0, -6, 4, 0], x: [0, 4, -2, 0] }
                        : { y: 0, x: 0 }
                    }
                    transition={
                      shouldAnimate
                        ? {
                            duration: 7.2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }
                        : undefined
                    }
                    className="absolute -bottom-5 -right-3 z-20 h-[96px] w-[96px] sm:h-[116px] sm:w-[116px] overflow-hidden rounded-full bg-white ring-1 ring-black/10"
                  >
                    <MonochromePortrait avatar={avatars[1]} />
                  </motion.div>
                </div>
              </div>

              {/* CARD 3: Continuous Vertical Stacked Wordmark Marquee */}
              <div
                aria-hidden="true"
                className={cn(
                  "relative h-[146px] sm:h-[168px] overflow-hidden rounded-xl border select-none",
                  cardSurface
                )}
              >
                <motion.div
                  animate={shouldAnimate ? { y: ["0%", "-50%"] } : { y: "0%" }}
                  transition={
                    shouldAnimate
                      ? {
                          duration: 7.5,
                          repeat: Infinity,
                          ease: "linear",
                        }
                      : undefined
                  }
                  className="flex flex-col items-center will-change-transform"
                >
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <div
                      key={`${uid}-marquee-${idx}`}
                      className={cn(
                        "flex w-full items-center justify-center py-0.5 text-[78px] sm:text-[96px] font-bold leading-[0.88] tracking-[-0.04em]",
                        marqueeTextColor
                      )}
                    >
                      {brandName}
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>

            {/* CARD 4: Right Half — Overlapping Social Profile Mockup Cards */}
            <div
              className={cn(
                "relative min-h-[298px] sm:min-h-[342px] overflow-hidden rounded-xl border",
                cardSurface
              )}
            >
              {/* Back / Left Profile Card */}
              <motion.div
                whileHover={shouldAnimate ? { y: -4 } : undefined}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "absolute bottom-0 left-5 sm:left-7 top-[24%] w-[46%] rounded-t-[20px] border border-b-0 p-4 sm:p-5",
                  innerCardBack
                )}
              >
                <ChevronLeft
                  aria-hidden="true"
                  className="h-4 w-4 opacity-75"
                />

                <div className="mt-5 flex h-16 w-16 sm:h-[72px] sm:w-[72px] items-center justify-center rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
                  <QlarkMarkSvg
                    showTail
                    className="h-10 w-10 sm:h-11 sm:w-11"
                  />
                </div>

                <div className="mt-4">
                  <p className="truncate text-[13px] sm:text-sm font-semibold tracking-[-0.01em]">
                    {fullBrandTitle}
                  </p>
                  <p className={cn("mt-0.5 truncate text-[11px] sm:text-xs", mutedText)}>
                    {roleLabel}
                  </p>
                </div>
              </motion.div>

              {/* Front / Right Profile Card with Blinking Eye Avatar */}
              <motion.div
                whileHover={shouldAnimate ? { y: -4 } : undefined}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "absolute bottom-0 right-0 top-[14%] w-[63%] sm:w-[62%] rounded-tl-[22px] border border-b-0 border-r-0 p-4 sm:p-6",
                  innerCardFront
                )}
              >
                {/* Top App Bar */}
                <div className="relative flex items-center justify-center">
                  <ChevronLeft
                    aria-hidden="true"
                    className="absolute left-0 h-4 w-4 opacity-80"
                  />
                  <span className="text-[13px] sm:text-[15px] font-medium tracking-[-0.01em]">
                    {handle}
                  </span>
                </div>

                {/* Avatar + Stats Row */}
                <div className="mt-5 flex items-center gap-4 sm:gap-5">
                  {/* White circular avatar with animated blinking inner pupil & Q-notch */}
                  <div className="relative flex h-16 w-16 sm:h-[74px] sm:w-[74px] shrink-0 items-center justify-center rounded-full bg-white text-[#1a171f] shadow-sm ring-1 ring-black/10">
                    <motion.div
                      aria-hidden="true"
                      animate={
                        shouldAnimate
                          ? { scaleY: [1, 1, 0.1, 1, 1] }
                          : { scaleY: 1 }
                      }
                      transition={
                        shouldAnimate
                          ? {
                              duration: 4.2,
                              times: [0, 0.44, 0.48, 0.52, 1],
                              repeat: Infinity,
                              ease: "easeInOut",
                            }
                          : undefined
                      }
                      className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-[#1a171f]"
                    />
                    {/* Signature square Q-notch */}
                    <span
                      aria-hidden="true"
                      className="absolute bottom-[11px] right-[11px] h-2.5 w-2.5 rounded-[1px] bg-[#1a171f]"
                    />
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-5 sm:gap-7">
                    <div className="text-center">
                      <div className="text-[15px] sm:text-[17px] font-semibold leading-tight tabular-nums">
                        {stats.posts}
                      </div>
                      <div className={cn("mt-0.5 text-[11px] sm:text-xs", mutedText)}>
                        Posts
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[15px] sm:text-[17px] font-semibold leading-tight tabular-nums">
                        {stats.followers}
                      </div>
                      <div className={cn("mt-0.5 text-[11px] sm:text-xs", mutedText)}>
                        Followers
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Bio Details */}
                <div className="mt-4 sm:mt-5 space-y-0.5">
                  <p className="text-[13px] sm:text-[14px] font-semibold tracking-[-0.01em]">
                    {fullBrandTitle}
                  </p>
                  <p className={cn("text-[11px] sm:text-xs", mutedText)}>
                    {roleLabel}
                  </p>
                  <p className="pt-1 text-[11px] sm:text-[12.5px] leading-snug opacity-90">
                    {bio}
                  </p>
                  <div
                    className={cn(
                      "flex items-center gap-1.5 pt-1 text-[11px] sm:text-xs",
                      mutedText
                    )}
                  >
                    <Link2 aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{website}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* BOTTOM SECTION (Row 3: ~30% Square Globe Card + ~70% Interactive Figma Headline Card) */}
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-12">
            {/* CARD 5: Cosmic Particle Nebula Globe */}
            <div
              className={cn(
                "relative flex min-h-[236px] sm:min-h-[258px] items-center justify-center overflow-hidden rounded-xl border p-4 md:col-span-4",
                cardSurface
              )}
            >
              <ParticleNebulaGlobe
                captionTop={globeCaptionTop}
                captionBottom={globeCaptionBottom}
                animate={shouldAnimate}
                isLight={isForcedLight}
              />
            </div>

            {/* CARD 6: Interactive Figma-Style Rotating Headline */}
            <div
              className={cn(
                "relative flex min-h-[236px] sm:min-h-[258px] flex-col items-center justify-center overflow-hidden rounded-xl border px-5 py-8 sm:px-8 md:col-span-8",
                cardSurface
              )}
            >
              <div className="relative flex flex-col items-center justify-center gap-4 sm:gap-5">
                {/* Row 1: Prefix + Figma Selection Box + Multiplayer Cursor */}
                <div className="relative flex flex-wrap items-center justify-center gap-3.5 sm:gap-5">
                  {/* Subtle decorative circle behind prefix word */}
                  <div className="relative flex items-center justify-center">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "pointer-events-none absolute h-[96px] w-[96px] sm:h-[112px] sm:w-[112px] -translate-x-2 rounded-full border",
                        subtleRingBorder
                      )}
                    />
                    <span className="relative z-10 text-[22px] sm:text-[28px] font-bold tracking-[-0.025em]">
                      {headlinePrefix}
                    </span>
                  </div>

                  {/* Interactive Figma Selection Frame */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={handleCyclePhrase}
                      aria-label={`Current phrase: ${phrases[safePhraseIndex]}. Click to show next phrase.`}
                      className={cn(
                        "group relative flex min-w-[218px] sm:min-w-[292px] items-center justify-center border px-5 py-3 sm:px-7 sm:py-3.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 cursor-pointer",
                        selectionBoxClasses
                      )}
                    >
                      {/* 4 Corner Figma Resize Handles */}
                      <span
                        aria-hidden="true"
                        className={cn(
                          "pointer-events-none absolute -top-[3.5px] -left-[3.5px] h-[7px] w-[7px] border",
                          handleDotClasses
                        )}
                      />
                      <span
                        aria-hidden="true"
                        className={cn(
                          "pointer-events-none absolute -top-[3.5px] -right-[3.5px] h-[7px] w-[7px] border",
                          handleDotClasses
                        )}
                      />
                      <span
                        aria-hidden="true"
                        className={cn(
                          "pointer-events-none absolute -bottom-[3.5px] -left-[3.5px] h-[7px] w-[7px] border",
                          handleDotClasses
                        )}
                      />
                      <span
                        aria-hidden="true"
                        className={cn(
                          "pointer-events-none absolute -bottom-[3.5px] -right-[3.5px] h-[7px] w-[7px] border",
                          handleDotClasses
                        )}
                      />

                      {/* Rotating Phrase */}
                      <div
                        aria-live="polite"
                        className="relative flex h-[30px] sm:h-[36px] items-center justify-center overflow-hidden"
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.span
                            key={`${uid}-phrase-${safePhraseIndex}`}
                            initial={
                              prefersReducedMotion
                                ? false
                                : { opacity: 0, y: 10, filter: "blur(3px)" }
                            }
                            animate={{
                              opacity: 1,
                              y: 0,
                              filter: "blur(0px)",
                            }}
                            exit={
                              prefersReducedMotion
                                ? undefined
                                : { opacity: 0, y: -10, filter: "blur(3px)" }
                            }
                            transition={{
                              duration: 0.32,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            className="whitespace-nowrap text-[20px] sm:text-[26px] font-bold tracking-[-0.025em]"
                          >
                            {phrases[safePhraseIndex]}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    </button>

                    {/* Multiplayer Figma Cursor + Pill Badge */}
                    <motion.div
                      aria-hidden="true"
                      animate={
                        shouldAnimate
                          ? { x: [0, 3, -1, 0], y: [0, -2, 2, 0] }
                          : { x: 0, y: 0 }
                      }
                      transition={
                        shouldAnimate
                          ? {
                              duration: 4.6,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }
                          : undefined
                      }
                      className="pointer-events-none absolute -bottom-7 -right-6 sm:-bottom-8 sm:-right-8 z-20 flex flex-col items-start"
                    >
                      <FigmaCursorSvg
                        className={cn(
                          "h-4 w-4 sm:h-[18px] sm:w-[18px]",
                          isForcedLight
                            ? "text-[#141218]"
                            : isForcedDark
                            ? "text-white"
                            : "text-[#141218] dark:text-white"
                        )}
                      />
                      <span
                        className={cn(
                          "ml-3 -mt-0.5 rounded-[5px] border px-2.5 py-0.5 text-[11px] font-medium leading-tight shadow-md",
                          cursorBadgeClasses
                        )}
                      >
                        {cursorLabel}
                      </span>
                    </motion.div>
                  </div>
                </div>

                {/* Row 2: Static Headline Suffix */}
                <p className="text-center text-[24px] sm:text-[31px] font-bold tracking-[-0.025em] leading-tight">
                  {headlineSuffix}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
);

QlarkStudioBentoGrid.displayName = "QlarkStudioBentoGrid";

export {
  QlarkStudioBentoGrid as component,
  QlarkStudioBentoGrid as Component,
};
export default QlarkStudioBentoGrid;