"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { CSSProperties, ElementType } from "react";
import {
  Activity,
  Apple,
  Check,
  Copy,
  Dumbbell,
  MapPin,
  Watch,
} from "lucide-react";

/**
 * FlexFit Bento Grid
 *
 * A responsive, data-driven brand-specimen bento layout.
 * Theme is inherited from the host application (shadcn/ui CSS variables).
 * The component intentionally does not provide its own theme switch or
 * override the host's light/dark setting.
 */

export type FlexFitMetricIcon = "watch" | "dumbbell" | "activity";

export interface FlexFitMetric {
  id: string;
  value: string;
  unit?: string;
  label: string;
  icon: FlexFitMetricIcon;
}

export interface FlexFitTrainer {
  id: string | number;
  name: string;
  specialty: string;
  avatarUrl: string;
}

export interface FlexFitPaletteColor {
  name: string;
  hex: string;
  /** Relative width of the segment. Defaults to 1. */
  weight?: number;
}

export interface FlexFitStorySlide {
  imageUrl: string;
  imageAlt: string;
  headline: string;
  ctaLabel: string;
  submittedLabel: string;
}

export interface FlexFitBentoGridContent {
  accessibilityLabel: string;
  heroImage: {
    src: string;
    alt: string;
  };
  metrics: [FlexFitMetric, FlexFitMetric, FlexFitMetric];
  statement: {
    headline: string;
    descriptorTop: string;
    descriptorBottom: string;
  };
  appPromo: {
    headline: string;
    googlePlayKicker: string;
    googlePlayTitle: string;
    googlePlayHref?: string;
    appStoreKicker: string;
    appStoreTitle: string;
    appStoreHref?: string;
  };
  typography: {
    headingLabel: string;
    headingFont: string;
    bodyLabel: string;
    bodyFont: string;
    palette: FlexFitPaletteColor[];
  };
  wordmark: string;
  trainerFeature: {
    image: {
      src: string;
      alt: string;
    };
    headline: string;
    count: string;
    countSuffix: string;
  };
  athleteImage: {
    src: string;
    alt: string;
  };
  location: {
    eyebrow: string;
    headline: string;
    streetAddress: string;
    locality: string;
    website: string;
    copyLabel: string;
    copiedLabel: string;
    copyErrorLabel: string;
  };
  socialStory: {
    username: string;
    postedLabel: string;
    slides: FlexFitStorySlide[];
  };
}

export interface FlexFitBentoGridProps {
  content?: FlexFitBentoGridContent;
  trainers?: FlexFitTrainer[];
  /** Connect the story CTA to a real sign-up action. Without it, the CTA is presentational. */
  onSignUp?: (slide: FlexFitStorySlide) => void;
  className?: string;
}

type StencilHeadingProps = {
  children: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
};

const BRAND = {
  ink: "#111111",
  yellow: "#F7E400",
  peach: "#E7B4A8",
  softYellow: "#FBF7D0",
  mauve: "#C5BECC",
} as const;

const DEFAULT_CONTENT: FlexFitBentoGridContent = {
  accessibilityLabel: "FlexFit fitness brand specimen bento grid",
  heroImage: {
    src: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000&auto=format&fit=crop",
    alt: "Athlete training in a gym",
  },
  metrics: [
    {
      id: "duration",
      value: "35",
      unit: "min",
      label: "Active workout duration: 35 minutes",
      icon: "watch",
    },
    {
      id: "equipment",
      value: "No",
      label: "Equipment required: none",
      icon: "dumbbell",
    },
    {
      id: "distance",
      value: "7",
      unit: "km",
      label: "Target distance: 7 kilometres",
      icon: "activity",
    },
  ],
  statement: {
    headline: "REDEFINE YOUR\nLIMITS, ACHIEVE YOUR\nFITNESS GOALS",
    descriptorTop: "LUXURY FITNESS",
    descriptorBottom: "EXPERIENCE",
  },
  appPromo: {
    headline: "USE OUR APP FOR COMPILING A QUALITY WORKOUT!",
    googlePlayKicker: "GET IT ON",
    googlePlayTitle: "Google Play",
    appStoreKicker: "Download on the",
    appStoreTitle: "App Store",
  },
  typography: {
    headingLabel: "HEADING FONT",
    headingFont: "SUISSE BP INT'L",
    bodyLabel: "BODY",
    bodyFont: "SUISSE INT'L",
    palette: [
      { name: "Peach Blush", hex: "#E7B4A8", weight: 28 },
      { name: "Electric Yellow", hex: "#F7E400", weight: 22 },
      { name: "Pure White", hex: "#FFFFFF", weight: 22 },
      { name: "Charcoal Night", hex: "#111111", weight: 28 },
    ],
  },
  wordmark: "FlexFit",
  trainerFeature: {
    image: {
      src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop",
      alt: "Personal trainer portrait",
    },
    headline: "TRAIN WITH THE\nBEST PERSONAL\nTRAINERS",
    count: "48",
    countSuffix: "+",
  },
  athleteImage: {
    src: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=800&auto=format&fit=crop",
    alt: "Athlete training with battle ropes",
  },
  location: {
    eyebrow: "TIME FOR FITNESS — 23",
    headline: "OWN YOUR\nSTRENGTH,\nOWN YOU",
    streetAddress: "12834 FITNESS LN",
    locality: "BROOKLYN, NY",
    website: "FLEXFIT.COM",
    copyLabel: "COPY",
    copiedLabel: "COPIED",
    copyErrorLabel: "RETRY",
  },
  socialStory: {
    username: "flexfit",
    postedLabel: "2h",
    slides: [
      {
        imageUrl:
          "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=800&auto=format&fit=crop",
        imageAlt: "Athlete wearing a hoodie during training",
        headline: "UNLOCK YOUR\nPOTENTIAL",
        ctaLabel: "SIGN UP",
        submittedLabel: "REQUEST SENT ✓",
      },
      {
        imageUrl:
          "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000&auto=format&fit=crop",
        imageAlt: "Athlete training in a gym",
        headline: "BUILD YOUR\nSTRENGTH",
        ctaLabel: "JOIN THE CLUB",
        submittedLabel: "REQUEST SENT ✓",
      },
      {
        imageUrl:
          "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=800&auto=format&fit=crop",
        imageAlt: "Athlete working with battle ropes",
        headline: "TRAIN WITH\nPURPOSE",
        ctaLabel: "GET STARTED",
        submittedLabel: "REQUEST SENT ✓",
      },
    ],
  },
};

const DEFAULT_TRAINERS: FlexFitTrainer[] = [
  {
    id: "elena-vance",
    name: "Elena Vance",
    specialty: "HIIT & Cardio",
    avatarUrl:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
  },
  {
    id: "marcus-chen",
    name: "Marcus Chen",
    specialty: "Strength & Power",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
  },
  {
    id: "sophia-ray",
    name: "Sophia Ray",
    specialty: "Mobility & Recovery",
    avatarUrl:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop",
  },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function StencilHeading({
  children,
  className = "",
  as: Component = "h2",
}: StencilHeadingProps) {
  const Heading = Component as ElementType;

  return (
    <Heading
      className={`relative inline-block whitespace-pre-line font-black uppercase leading-[0.94] tracking-[-0.035em] ${className}`}
    >
      <span className="relative z-10 select-none">{children}</span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 overflow-hidden opacity-25 mix-blend-overlay"
      >
        <svg
          className="h-full w-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <line
            x1="14"
            y1="0"
            x2="14"
            y2="100"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray="3 9"
          />
          <line
            x1="46"
            y1="0"
            x2="46"
            y2="100"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray="4 8"
          />
          <line
            x1="80"
            y1="0"
            x2="80"
            y2="100"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray="2 10"
          />
        </svg>
      </span>
    </Heading>
  );
}

function FlexFitLogoMark({
  className = "h-10 w-10",
  color = "currentColor",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M15 18 H90 L68 44 H34 L15 18 Z" fill={color} />
      <path d="M28 48 H72 L54 70 H40 L28 84 L14 84 L28 48 Z" fill={color} />
    </svg>
  );
}

function GeometricStarIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={`${className} fill-current`}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
    </svg>
  );
}

function StoreBadge({
  kind,
  kicker,
  title,
  href,
}: {
  kind: "google" | "apple";
  kicker: string;
  title: string;
  href?: string;
}) {
  const contents = (
    <>
      {kind === "google" ? (
        <svg
          className="h-4 w-4 shrink-0 fill-current"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M3 20.5V3.5c0-.8.9-1.25 1.55-.78L14.2 12l-9.65 9.28c-.65.47-1.55.02-1.55-.78Z" />
          <path d="m16.2 14.05 3.05 1.75-2.8 1.63-2.9-2.78 2.65-.6Z" />
          <path d="m16.2 9.95 3.05-1.75-2.8-1.63-2.9 2.78 2.65.6Z" />
          <path d="m14.05 12 3.12-3.02 2.38 1.37c.78.45.78 1.57 0 2.02l-2.38 1.37L14.05 12Z" />
        </svg>
      ) : (
        <Apple
          className="-mt-0.5 h-4 w-4 shrink-0 fill-current"
          aria-hidden="true"
        />
      )}
      <span className="flex flex-col text-left leading-none">
        <span className="text-[8px] font-medium uppercase tracking-wider text-neutral-400">
          {kicker}
        </span>
        <span className="mt-0.5 text-[11px] font-bold tracking-tight text-white">
          {title}
        </span>
      </span>
    </>
  );

  const className =
    "inline-flex min-h-9 items-center gap-2 rounded-xl border border-white/10 bg-[#111111] px-3 py-1.5 text-white shadow-sm transition-colors hover:bg-black";

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={`${className} ${focusRing}`}
        aria-label={`${kicker} ${title}`}
      >
        {contents}
      </a>
    );
  }

  // Keep the store artwork presentational until a real destination is supplied.
  return (
    <span className={className} role="img" aria-label={`${kicker} ${title}`}>
      {contents}
    </span>
  );
}

function PaletteBar({ colors }: { colors: FlexFitPaletteColor[] }) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const safeColors = colors ?? [];

  return (
    <div className="relative w-full pt-2">
      <div className="flex h-5 w-full items-center overflow-hidden rounded-full border border-[#111111]/20 bg-neutral-100 p-0.5 shadow-inner sm:h-6">
        {safeColors.map((color, index) => {
          const tooltip = `${color.name} (${color.hex})`;
          return (
            <button
              key={`${color.name}-${color.hex}`}
              type="button"
              className={`h-full min-w-0 cursor-pointer border-r border-[#111111]/30 transition-opacity last:border-r-0 hover:opacity-85 ${focusRing} ${
                index === 0 ? "rounded-l-full" : ""
              } ${index === safeColors.length - 1 ? "rounded-r-full" : ""}`}
              style={{
                backgroundColor: color.hex,
                flexGrow: color.weight ?? 1,
                flexBasis: 0,
              }}
              aria-label={tooltip}
              title={tooltip}
              onMouseEnter={() => setActiveTooltip(tooltip)}
              onMouseLeave={() => setActiveTooltip(null)}
              onFocus={() => setActiveTooltip(tooltip)}
              onBlur={() => setActiveTooltip(null)}
            />
          );
        })}
      </div>
      {activeTooltip ? (
        <div
          role="status"
          className="pointer-events-none absolute -top-6 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded bg-[#111111] px-2 py-0.5 text-[10px] font-bold text-white shadow-lg"
        >
          {activeTooltip}
        </div>
      ) : null}
    </div>
  );
}

function MetricIcon({ icon }: { icon: FlexFitMetricIcon }) {
  const iconClass = "h-4 w-4 stroke-[2.5]";
  if (icon === "watch")
    return <Watch className={iconClass} aria-hidden="true" />;
  if (icon === "dumbbell")
    return <Dumbbell className={iconClass} aria-hidden="true" />;
  return <Activity className={iconClass} aria-hidden="true" />;
}

function StoryProgress({
  count,
  activeIndex,
  onSelect,
}: {
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const safeCount = Math.max(count, 0);

  return (
    <div
      className="grid w-full gap-1"
      style={{ gridTemplateColumns: `repeat(${safeCount}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: safeCount }, (_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSelect(index)}
          className={`flex h-3 items-center overflow-hidden rounded-full bg-transparent ${focusRing}`}
          aria-label={`Show story ${index + 1} of ${safeCount}`}
          aria-current={index === activeIndex ? "step" : undefined}
        >
          <span
            className={`block h-1 w-full overflow-hidden rounded-full bg-[#111111]/25 after:block after:h-full after:rounded-full after:bg-[#111111] after:transition-[width] after:duration-300 after:content-[''] ${
              index <= activeIndex ? "after:w-full" : "after:w-0"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function FlexFitBentoGrid({
  content = DEFAULT_CONTENT,
  trainers = DEFAULT_TRAINERS,
  onSignUp,
  className = "",
}: FlexFitBentoGridProps) {
  const safeContent = content ?? DEFAULT_CONTENT;
  const safeTrainers = trainers ?? DEFAULT_TRAINERS;
  const metrics = safeContent.metrics ?? DEFAULT_CONTENT.metrics;

  const [selectedMetric, setSelectedMetric] = useState(metrics?.[0]?.id ?? "");
  const [isVisualizerActive, setIsVisualizerActive] = useState(true);
  const [activeTrainer, setActiveTrainer] = useState<string | number | null>(
    null
  );
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle"
  );
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [signedUp, setSignedUp] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const trainerTooltipId = useId();
  const activeTrainerData = safeTrainers.find(
    (trainer) => trainer.id === activeTrainer
  );

  const storySlides = safeContent.socialStory?.slides ?? [];
  const activeStory =
    storySlides.length > 0
      ? storySlides[Math.min(activeStoryIndex, storySlides.length - 1)]
      : undefined;
  const addressToCopy = useMemo(
    () =>
      [safeContent.location?.streetAddress, safeContent.location?.locality]
        .filter(Boolean)
        .join(" "),
    [safeContent.location?.streetAddress, safeContent.location?.locality]
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener?.("change", updatePreference);
    return () => mediaQuery.removeEventListener?.("change", updatePreference);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || storySlides.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveStoryIndex((current) => (current + 1) % storySlides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [prefersReducedMotion, storySlides.length]);

  useEffect(() => {
    if (copyState === "idle") return;
    const timer = window.setTimeout(() => setCopyState("idle"), 2200);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  useEffect(() => {
    if (!signedUp) return;
    const timer = window.setTimeout(() => setSignedUp(false), 2500);
    return () => window.clearTimeout(timer);
  }, [signedUp]);

  const handleCopyAddress = async () => {
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(addressToCopy);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  };

  const handleStorySelect = (index: number) => {
    setActiveStoryIndex(index);
  };

  return (
    <section
      className={`flexfit-bento w-full bg-background p-3 text-foreground sm:p-5 lg:p-6 ${className}`}
      style={
        {
          fontFamily:
            "var(--font-satoshi, 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)",
        } as CSSProperties
      }
      aria-label={safeContent.accessibilityLabel}
    >
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .flexfit-bento *,
          .flexfit-bento *::before,
          .flexfit-bento *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-3.5 lg:aspect-[4/3] lg:grid-cols-[minmax(0,3.13fr)_minmax(260px,1fr)] lg:grid-rows-[minmax(0,1fr)]">
        {/* Main Bento Area */}
        <div className="grid min-w-0 grid-cols-1 gap-3.5 lg:min-h-0 lg:grid-rows-[minmax(0,70.2fr)_minmax(0,29.8fr)]">
          {/* Upper Bento Group */}
          <div className="grid min-w-0 grid-cols-1 gap-3.5 lg:min-h-0 lg:grid-cols-[minmax(0,30.5fr)_minmax(0,69.5fr)]">
            {/* Left column */}
            <div className="grid min-w-0 grid-cols-1 gap-3.5 sm:grid-cols-2 lg:min-h-0 lg:grid-cols-1 lg:grid-rows-[minmax(0,65.5fr)_minmax(0,34.5fr)]">
              {/* Card 1: Hero image and workout metrics */}
              <section className="group relative flex min-h-[340px] flex-col justify-between overflow-hidden rounded-[20px] border border-white/10 bg-[#111111] p-4 shadow-xl lg:min-h-0">
                <img
                  src={safeContent.heroImage.src}
                  alt={safeContent.heroImage.alt}
                  className="absolute inset-0 h-full w-full object-cover object-center brightness-95 contrast-105 transition-transform duration-700 group-hover:scale-105"
                  loading="eager"
                  decoding="async"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                <div className="relative z-10 flex justify-start">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/90 shadow-lg backdrop-blur-md transition-transform group-hover:scale-105">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md border-2 border-white text-white">
                      <GeometricStarIcon className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>

                <div className="relative z-10 flex items-center justify-between gap-1 rounded-full border border-white/15 bg-black/75 p-1.5 shadow-2xl backdrop-blur-md">
                  {metrics.map((metric) => (
                    <button
                      key={metric.id}
                      type="button"
                      onClick={() => setSelectedMetric(metric.id)}
                      aria-pressed={selectedMetric === metric.id}
                      aria-label={metric.label}
                      className={`flex min-h-10 min-w-0 items-center gap-1.5 rounded-full py-0.5 pl-0.5 pr-2.5 transition-colors ${focusRing} ${
                        selectedMetric === metric.id
                          ? "bg-white/20"
                          : "hover:bg-white/10"
                      }`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F7E400] font-bold text-[#111111] shadow-sm">
                        <MetricIcon icon={metric.icon} />
                      </span>
                      <span className="whitespace-nowrap text-xs font-bold tracking-tight text-white">
                        {metric.value}
                        {metric.unit ? (
                          <span className="ml-0.5 text-[10px] font-medium text-white/90">
                            {metric.unit}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Card 2: Statement */}
              <section className="flex min-h-[190px] flex-col justify-between overflow-hidden rounded-[20px] bg-card p-5 text-card-foreground shadow-lg ring-1 ring-border lg:min-h-0">
                <StencilHeading className="text-lg leading-[1.08] sm:text-xl lg:text-[21px]">
                  {safeContent.statement.headline}
                </StencilHeading>
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#111111] shadow-sm">
                    <FlexFitLogoMark className="h-6 w-6" color={BRAND.yellow} />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-[11px] font-black uppercase tracking-wider">
                      {safeContent.statement.descriptorTop}
                    </span>
                    <span className="text-[11px] font-black uppercase tracking-wider">
                      {safeContent.statement.descriptorBottom}
                    </span>
                  </div>
                </div>
              </section>
            </div>

            {/* Center column */}
            <div className="grid min-w-0 grid-cols-1 gap-3.5 lg:min-h-0 lg:grid-rows-[minmax(0,39fr)_minmax(0,61fr)]">
              {/* Top center row */}
              <div className="grid min-w-0 grid-cols-1 gap-3.5 sm:grid-cols-[minmax(0,0.97fr)_minmax(0,1.03fr)] lg:min-h-0">
                {/* Card 3: App promo */}
                <section className="group relative flex min-h-[235px] flex-col justify-between overflow-hidden rounded-[20px] border border-black/5 bg-[#F7E400] p-5 shadow-lg sm:min-h-0">
                  <div className="pointer-events-none absolute -bottom-10 -right-8 scale-150 rotate-12 opacity-20">
                    <FlexFitLogoMark className="h-56 w-56" color="#EFE018" />
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsVisualizerActive((active) => !active)}
                    aria-pressed={isVisualizerActive}
                    aria-label={
                      isVisualizerActive
                        ? "Pause decorative soundwave animation"
                        : "Play decorative soundwave animation"
                    }
                    className={`relative z-10 flex w-fit cursor-pointer items-end gap-1 rounded-lg p-1.5 transition-colors hover:bg-black/10 ${focusRing}`}
                  >
                    {[14, 22, 30, 42, 52, 38, 26, 16].map((height, index) => (
                      <span
                        key={index}
                        className={`w-1 rounded-full bg-[#111111] transition-all duration-300 ${
                          isVisualizerActive && !prefersReducedMotion
                            ? "animate-pulse"
                            : ""
                        }`}
                        style={{
                          height: `${height * 0.65}px`,
                          animationDelay: `${index * 120}ms`,
                        }}
                      />
                    ))}
                  </button>

                  <h3 className="relative z-10 my-auto py-1 text-base font-medium uppercase leading-tight tracking-tight text-[#111111] sm:text-[17px]">
                    {safeContent.appPromo.headline}
                  </h3>

                  <div className="relative z-10 flex flex-wrap items-center gap-2 pt-1">
                    <StoreBadge
                      kind="google"
                      kicker={safeContent.appPromo.googlePlayKicker}
                      title={safeContent.appPromo.googlePlayTitle}
                      href={safeContent.appPromo.googlePlayHref}
                    />
                    <StoreBadge
                      kind="apple"
                      kicker={safeContent.appPromo.appStoreKicker}
                      title={safeContent.appPromo.appStoreTitle}
                      href={safeContent.appPromo.appStoreHref}
                    />
                  </div>
                </section>

                {/* Card 4: Typography specimen */}
                <section className="flex min-h-[235px] flex-col justify-between overflow-hidden rounded-[20px] bg-card p-5 text-card-foreground shadow-lg ring-1 ring-border sm:min-h-0">
                  <div className="space-y-3">
                    <div>
                      <span className="mb-0.5 block text-[11px] font-medium uppercase tracking-wider text-card-foreground/70">
                        {safeContent.typography.headingLabel}
                      </span>
                      <h3 className="text-2xl font-black uppercase leading-none tracking-tight text-card-foreground xl:text-[28px]">
                        {safeContent.typography.headingFont}
                      </h3>
                    </div>
                    <div>
                      <span className="mb-0.5 block text-[11px] font-medium uppercase tracking-wider text-card-foreground/70">
                        {safeContent.typography.bodyLabel}
                      </span>
                      <p className="text-2xl font-normal uppercase leading-none tracking-tight text-card-foreground xl:text-[28px]">
                        {safeContent.typography.bodyFont}
                      </p>
                    </div>
                  </div>
                  <PaletteBar colors={safeContent.typography.palette} />
                </section>
              </div>

              {/* Card 5: Main brand wordmark */}
              <section className="group relative flex min-h-[245px] items-center justify-center overflow-hidden rounded-[20px] bg-[#FBF7D0] p-6 shadow-lg ring-1 ring-black/10 lg:min-h-0">
                <div className="flex items-center justify-center gap-4 transition-transform duration-500 group-hover:scale-105 sm:gap-5">
                  <FlexFitLogoMark
                    className="h-16 w-16 shrink-0 sm:h-20 sm:w-20"
                    color={BRAND.ink}
                  />
                  <h1 className="text-5xl font-black uppercase tracking-tighter text-[#111111] sm:text-6xl lg:text-7xl">
                    {safeContent.wordmark}
                  </h1>
                </div>
              </section>
            </div>
          </div>

          {/* Lower Bento Group */}
          <div className="grid min-w-0 grid-cols-1 gap-3.5 sm:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)] lg:min-h-0">
            {/* Card 6: Trainers */}
            <section className="relative flex min-h-[205px] items-center justify-between gap-4 overflow-hidden rounded-[20px] border border-black/5 bg-[#E7B4A8] p-4 shadow-lg sm:p-5 sm:gap-4 sm:min-h-0">
              <div className="relative flex shrink-0 items-center">
                <div className="absolute -right-2 top-1/2 z-0 hidden h-24 w-4 -translate-y-1/2 rounded-r-[14px] bg-[#111111] sm:block" />
                <div className="relative z-10 h-28 w-28 overflow-hidden rounded-[18px] bg-[#F7E400] p-1 shadow-md sm:h-32 sm:w-32">
                  <img
                    src={safeContent.trainerFeature.image.src}
                    alt={safeContent.trainerFeature.image.alt}
                    className="h-full w-full rounded-[14px] object-cover contrast-105"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>

              <div className="flex h-full min-w-0 w-full flex-col justify-between py-0.5">
                <StencilHeading className="max-w-[280px] text-lg leading-[1.02] sm:text-xl lg:text-2xl">
                  {safeContent.trainerFeature.headline}
                </StencilHeading>

                <div className="flex items-end justify-between gap-2 pt-2">
                  <div className="flex items-baseline gap-0.5 text-[#111111]">
                    <span className="font-black text-4xl tracking-tighter tabular-nums sm:text-5xl">
                      {safeContent.trainerFeature.count}
                    </span>
                    <span className="text-2xl font-black sm:text-3xl">
                      {safeContent.trainerFeature.countSuffix}
                    </span>
                  </div>

                  <div className="relative flex items-center -space-x-2.5">
                    {safeTrainers.map((trainer) => (
                      <button
                        key={trainer.id}
                        type="button"
                        onMouseEnter={() => setActiveTrainer(trainer.id)}
                        onMouseLeave={() => setActiveTrainer(null)}
                        onFocus={() => setActiveTrainer(trainer.id)}
                        onBlur={() => setActiveTrainer(null)}
                        className={`relative z-10 h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-[#111111] bg-black transition-transform duration-300 hover:z-30 hover:scale-110 focus-visible:z-30 focus-visible:scale-110 ${focusRing} ${
                          activeTrainer === trainer.id
                            ? "z-30 scale-125 shadow-xl"
                            : ""
                        }`}
                        aria-label={`${trainer.name}, ${trainer.specialty}`}
                        aria-describedby={
                          activeTrainer === trainer.id
                            ? trainerTooltipId
                            : undefined
                        }
                      >
                        <img
                          src={trainer.avatarUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      </button>
                    ))}
                    {activeTrainer !== null ? (
                      <div
                        id={trainerTooltipId}
                        role="tooltip"
                        className="pointer-events-none absolute -top-10 right-0 z-40 flex flex-col whitespace-nowrap rounded-lg bg-[#111111] px-2.5 py-1 text-[10px] font-bold text-white shadow-xl"
                      >
                        <span>{activeTrainerData?.name}</span>
                        <span className="text-[9px] font-normal text-[#F7E400]">
                          {activeTrainerData?.specialty}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            {/* Card 7: Athlete image */}
            <section className="group relative min-h-[230px] overflow-hidden rounded-[20px] border border-black/5 bg-[#C5BECC] shadow-lg sm:min-h-0">
              <div
                className="absolute inset-0 bg-[#F7E400] opacity-90"
                style={{
                  clipPath: "polygon(0 0, 100% 0, 100% 80%, 60% 100%, 0 100%)",
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-25">
                  <FlexFitLogoMark
                    className="h-64 w-64 translate-x-6 -rotate-12"
                    color={BRAND.ink}
                  />
                </div>
              </div>
              <img
                src={safeContent.athleteImage.src}
                alt={safeContent.athleteImage.alt}
                className="absolute inset-0 h-full w-full object-cover object-top brightness-105 contrast-110 transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </section>
          </div>
        </div>

        {/* Right Bento Column */}
        <aside className="grid min-w-0 grid-cols-1 gap-3.5 lg:min-h-0 lg:grid-rows-[minmax(0,52.2fr)_minmax(0,47.8fr)]">
          {/* Card 8: Location */}
          <section className="group relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-[20px] bg-card p-5 text-card-foreground shadow-lg ring-1 ring-border lg:min-h-0">
            <div className="flex items-center gap-2">
              <div className="flex overflow-hidden rounded border border-black/10 shadow-sm">
                <span className="h-5 w-3 bg-[#111111]" />
                <span className="h-5 w-3 bg-[#F7E400]" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider tabular-nums">
                {safeContent.location.eyebrow}
              </span>
            </div>

            <div className="my-auto py-2">
              <StencilHeading className="text-2xl leading-[0.94] sm:text-3xl lg:text-[34px]">
                {safeContent.location.headline}
              </StencilHeading>
            </div>

            <div className="relative pt-4">
              <div className="absolute left-1/2 top-0.5 z-0 h-5 w-32 -translate-x-1/2 rounded-t-lg bg-[#111111]" />
              <div className="relative z-10 flex flex-col justify-between overflow-hidden rounded-[18px] border border-black/5 bg-[#E7B4A8] p-3.5 shadow-md">
                <div className="pointer-events-none absolute -bottom-4 -right-4 opacity-10">
                  <FlexFitLogoMark className="h-24 w-24" color={BRAND.ink} />
                </div>

                <div className="relative z-10 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#111111] text-[#F7E400] shadow-sm">
                    <MapPin
                      className="h-4 w-4 fill-current stroke-[1.5]"
                      aria-hidden="true"
                    />
                  </div>
                  <address className="not-italic text-xs font-black uppercase leading-tight tracking-tight tabular-nums">
                    {safeContent.location.streetAddress}
                    {safeContent.location.locality ? (
                      <>
                        <br />
                        {safeContent.location.locality}
                      </>
                    ) : null}
                  </address>
                </div>

                <div className="relative z-10 mt-4 flex items-center justify-between gap-2 border-t border-black/10 pt-2.5">
                  <span className="min-w-0 truncate text-[10px] font-black uppercase tracking-widest text-black/80">
                    {safeContent.location.website}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    className={`inline-flex shrink-0 items-center gap-1 rounded bg-black/10 px-2 py-1 text-[10px] font-bold text-black transition-colors hover:bg-black hover:text-white ${focusRing}`}
                    title={
                      copyState === "copied"
                        ? safeContent.location.copiedLabel
                        : copyState === "error"
                          ? safeContent.location.copyErrorLabel
                          : safeContent.location.copyLabel
                    }
                    aria-label={
                      copyState === "copied"
                        ? safeContent.location.copiedLabel
                        : copyState === "error"
                          ? safeContent.location.copyErrorLabel
                          : safeContent.location.copyLabel
                    }
                  >
                    {copyState === "copied" ? (
                      <>
                        <Check
                          className="h-3 w-3 text-emerald-700"
                          aria-hidden="true"
                        />
                        <span>{safeContent.location.copiedLabel}</span>
                      </>
                    ) : copyState === "error" ? (
                      <>
                        <Copy className="h-3 w-3" aria-hidden="true" />
                        <span>{safeContent.location.copyErrorLabel}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" aria-hidden="true" />
                        <span>{safeContent.location.copyLabel}</span>
                      </>
                    )}
                  </button>
                </div>
                <span className="sr-only" role="status" aria-live="polite">
                  {copyState === "copied"
                    ? safeContent.location.copiedLabel
                    : copyState === "error"
                      ? safeContent.location.copyErrorLabel
                      : ""}
                </span>
              </div>
            </div>
          </section>

          {/* Card 9: Social story */}
          <section className="relative flex min-h-[500px] flex-col justify-between overflow-hidden rounded-[20px] border border-black/5 bg-[#E7B4A8] p-4 shadow-lg lg:min-h-0">
            <div className="z-10 space-y-2">
              {storySlides.length > 0 ? (
                <StoryProgress
                  count={storySlides.length}
                  activeIndex={activeStoryIndex}
                  onSelect={handleStorySelect}
                />
              ) : null}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#111111] shadow-sm">
                    <FlexFitLogoMark
                      className="h-3.5 w-3.5"
                      color={BRAND.yellow}
                    />
                  </div>
                  <span className="text-xs font-semibold tracking-tight text-[#111111]">
                    {safeContent.socialStory.username}
                  </span>
                </div>
                <span className="text-xs font-semibold tabular-nums text-black/60">
                  {safeContent.socialStory.postedLabel}
                </span>
              </div>
            </div>

            <div className="group relative mx-auto my-auto flex h-[280px] w-full max-w-[240px] flex-col justify-between overflow-hidden rounded-t-[32px] border-[5px] border-[#111111] bg-[#B8AEB8] p-2 shadow-2xl sm:h-[290px]">
              {activeStory ? (
                <img
                  key={activeStory.imageUrl}
                  src={activeStory.imageUrl}
                  alt={activeStory.imageAlt}
                  className="absolute inset-0 h-full w-full object-cover object-center brightness-90 transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
              ) : null}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

              <div className="relative z-10 mx-auto flex h-2 w-16 items-center justify-center rounded-b-md bg-[#111111]">
                <span className="h-0.5 w-6 rounded-full bg-neutral-700" />
              </div>

              {activeStory ? (
                <div className="relative z-10 space-y-2 p-2 text-center">
                  <h3 className="whitespace-pre-line text-base font-bold uppercase leading-tight tracking-tight text-white">
                    {activeStory.headline}
                  </h3>
                  {onSignUp ? (
                    <button
                      type="button"
                      className={`min-h-10 w-full rounded-full bg-[#F7E400] px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#111111] shadow-md transition-colors hover:bg-yellow-300 ${focusRing}`}
                      onClick={() => {
                        onSignUp(activeStory);
                        setSignedUp(true);
                      }}
                    >
                      {signedUp
                        ? activeStory.submittedLabel
                        : activeStory.ctaLabel}
                    </button>
                  ) : (
                    <span className="flex min-h-10 w-full items-center justify-center rounded-full bg-[#F7E400] px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#111111] shadow-md">
                      {activeStory.ctaLabel}
                    </span>
                  )}
                </div>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

export default FlexFitBentoGrid;
