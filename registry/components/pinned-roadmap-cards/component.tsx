"use client";

import React, { useId, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Plus, RotateCcw, Sparkles, X } from "lucide-react";

function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(" ");
}

export type PinColor =
  | "orange"
  | "blue"
  | "purple"
  | "emerald"
  | "rose"
  | "amber";

export type CardTone =
  | "peach"
  | "periwinkle"
  | "lavender"
  | "mint"
  | "rose"
  | "butter";

export interface RoadmapStep {
  id: string;
  number: string;
  title: string;
  description: string;
  pinColor: PinColor;
  cardTone: CardTone;
  tilt: number;
  side: "left" | "right";
}

export interface PinnedRoadmapCardsProps
  extends React.HTMLAttributes<HTMLElement> {
  brandName?: string;
  heading?: string;
  partnerTagline?: string;
  partnerAccent?: string;
  theme?: "auto" | "light" | "dark";
  textureIntensity?: "subtle" | "medium" | "rich";
  showRuledLines?: boolean;
  showConnectors?: boolean;
  interactiveChecklist?: boolean;
  allowAddNote?: boolean;
  cardCount?: number;
  steps?: RoadmapStep[];
  onStepToggle?: (stepId: string, completed: boolean) => void;
}

const DEFAULT_STEPS: RoadmapStep[] = [
  {
    id: "testimonials",
    number: "01",
    title: "Testimonials",
    description:
      "The only way to attract new clients, is to show your experience with the previous ones. Include: real photo, position at company, links their profiles",
    pinColor: "orange",
    cardTone: "peach",
    tilt: 4.5,
    side: "left",
  },
  {
    id: "trust-badges",
    number: "02",
    title: "Trust Badges",
    description:
      "Show all the achievements you have. Awards, certificates, payment protections, etc.",
    pinColor: "blue",
    cardTone: "periwinkle",
    tilt: -5.5,
    side: "right",
  },
  {
    id: "add-contacts",
    number: "03",
    title: "Add Contacts",
    description:
      "People need to understand that if something will happen, they can always reach out to you. Leave links to your social media, your email and the phone",
    pinColor: "purple",
    cardTone: "lavender",
    tilt: 6.5,
    side: "left",
  },
  {
    id: "case-studies",
    number: "04",
    title: "Case Studies",
    description:
      "Share detailed examples of how your product or service solved real problems. This helps visitors imagine their own success.",
    pinColor: "orange",
    cardTone: "peach",
    tilt: -4.2,
    side: "right",
  },
  {
    id: "clear-refund-policy",
    number: "05",
    title: "Clear Refund Policy",
    description:
      "Offer a transparent money-back guarantee or easy return process",
    pinColor: "blue",
    cardTone: "periwinkle",
    tilt: 2.2,
    side: "left",
  },
  {
    id: "live-support",
    number: "06",
    title: "Fast Human Support",
    description:
      "Display realistic response times and live chat or email support so visitors know real people stand behind the product.",
    pinColor: "emerald",
    cardTone: "mint",
    tilt: -4.8,
    side: "right",
  },
  {
    id: "security-privacy",
    number: "07",
    title: "Security & Privacy",
    description:
      "Explain how customer data is encrypted, never sold, and protected with clear SSL, SOC 2, or GDPR commitments.",
    pinColor: "rose",
    cardTone: "rose",
    tilt: 3.6,
    side: "left",
  },
];

const EXTRA_NOTE_PRESETS: Array<{
  title: string;
  description: string;
  pinColor: PinColor;
  cardTone: CardTone;
}> = [
  {
    title: "Transparent Pricing",
    description:
      "Eliminate hidden fees and surprise checkout charges. Clearly show what is included in every plan upfront.",
    pinColor: "amber",
    cardTone: "butter",
  },
  {
    title: "Real Team Photos",
    description:
      "Replace generic stock imagery with genuine photos of your founders, makers, and workspace to humanize your brand.",
    pinColor: "purple",
    cardTone: "lavender",
  },
  {
    title: "Verified Metrics",
    description:
      "Highlight concrete customer counts, uptime stats, and third-party review ratings with verifiable links.",
    pinColor: "emerald",
    cardTone: "mint",
  },
];

const PIN_PALETTE: Record<
  PinColor,
  {
    top: string;
    mid: string;
    deep: string;
    glow: string;
    rim: string;
    numeralClass: string;
    darkNumeralClass: string;
  }
> = {
  orange: {
    top: "#ff9b7d",
    mid: "#fc7351",
    deep: "#d94a26",
    glow: "rgba(252, 115, 81, 0.38)",
    rim: "rgba(255, 196, 176, 0.85)",
    numeralClass: "text-[#df602c] dark:text-[#ff9d78]",
    darkNumeralClass: "text-[#ff9d78]",
  },
  blue: {
    top: "#7da2ff",
    mid: "#3c73ff",
    deep: "#1e4fd6",
    glow: "rgba(60, 115, 255, 0.38)",
    rim: "rgba(186, 207, 255, 0.85)",
    numeralClass: "text-[#396ce8] dark:text-[#8fb0ff]",
    darkNumeralClass: "text-[#8fb0ff]",
  },
  purple: {
    top: "#b69eff",
    mid: "#8565ff",
    deep: "#5e3bd6",
    glow: "rgba(133, 101, 255, 0.40)",
    rim: "rgba(215, 201, 255, 0.85)",
    numeralClass: "text-[#7b56eb] dark:text-[#c1adff]",
    darkNumeralClass: "text-[#c1adff]",
  },
  emerald: {
    top: "#6ee7b7",
    mid: "#10b981",
    deep: "#047857",
    glow: "rgba(16, 185, 129, 0.36)",
    rim: "rgba(187, 247, 208, 0.85)",
    numeralClass: "text-[#0f9668] dark:text-[#6ee7b7]",
    darkNumeralClass: "text-[#6ee7b7]",
  },
  rose: {
    top: "#fda4af",
    mid: "#f43f5e",
    deep: "#be123c",
    glow: "rgba(244, 63, 94, 0.36)",
    rim: "rgba(254, 205, 211, 0.85)",
    numeralClass: "text-[#d93654] dark:text-[#fda4af]",
    darkNumeralClass: "text-[#fda4af]",
  },
  amber: {
    top: "#fcd34d",
    mid: "#f59e0b",
    deep: "#b45309",
    glow: "rgba(245, 158, 11, 0.36)",
    rim: "rgba(254, 240, 138, 0.85)",
    numeralClass: "text-[#c97a07] dark:text-[#fcd34d]",
    darkNumeralClass: "text-[#fcd34d]",
  },
};

const CARD_TONE_CLASSES: Record<
  CardTone,
  {
    auto: string;
    light: string;
    dark: string;
  }
> = {
  peach: {
    auto: "bg-gradient-to-br from-[#fff1e8] via-[#feece0] to-[#fde4d4] border-[#ea9b72]/25 dark:from-[#40261c] dark:via-[#331f17] dark:to-[#2b1a13] dark:border-[#fc7351]/30",
    light: "bg-gradient-to-br from-[#fff1e8] via-[#feece0] to-[#fde4d4] border-[#ea9b72]/25",
    dark: "bg-gradient-to-br from-[#40261c] via-[#331f17] to-[#2b1a13] border-[#fc7351]/30",
  },
  periwinkle: {
    auto: "bg-gradient-to-br from-[#e4eaff] via-[#dbe2ff] to-[#d2dcff] border-[#7491f0]/25 dark:from-[#1c2542] dark:via-[#171e38] dark:to-[#13192f] dark:border-[#608cff]/30",
    light: "bg-gradient-to-br from-[#e4eaff] via-[#dbe2ff] to-[#d2dcff] border-[#7491f0]/25",
    dark: "bg-gradient-to-br from-[#1c2542] via-[#171e38] to-[#13192f] border-[#608cff]/30",
  },
  lavender: {
    auto: "bg-gradient-to-br from-[#f4e6ff] via-[#ede1f7] to-[#e8d5f9] border-[#a780ec]/25 dark:from-[#2e1f44] dark:via-[#251938] dark:to-[#1e142f] dark:border-[#9b7dff]/30",
    light: "bg-gradient-to-br from-[#f4e6ff] via-[#ede1f7] to-[#e8d5f9] border-[#a780ec]/25",
    dark: "bg-gradient-to-br from-[#2e1f44] via-[#251938] to-[#1e142f] border-[#9b7dff]/30",
  },
  mint: {
    auto: "bg-gradient-to-br from-[#e4faee] via-[#d8f6e6] to-[#ccf1dd] border-[#34b982]/25 dark:from-[#14342a] dark:via-[#102a22] dark:to-[#0d221b] dark:border-[#34d399]/30",
    light: "bg-gradient-to-br from-[#e4faee] via-[#d8f6e6] to-[#ccf1dd] border-[#34b982]/25",
    dark: "bg-gradient-to-br from-[#14342a] via-[#102a22] dark:to-[#0d221b] border-[#34d399]/30",
  },
  rose: {
    auto: "bg-gradient-to-br from-[#ffe7ec] via-[#fddce3] to-[#fbd1da] border-[#ea708a]/25 dark:from-[#401a26] dark:via-[#33141e] dark:to-[#291018] dark:border-[#fb7185]/30",
    light: "bg-gradient-to-br from-[#ffe7ec] via-[#fddce3] to-[#fbd1da] border-[#ea708a]/25",
    dark: "bg-gradient-to-br from-[#401a26] via-[#33141e] to-[#291018] border-[#fb7185]/30",
  },
  butter: {
    auto: "bg-gradient-to-br from-[#fef6db] via-[#fdf0c8] to-[#fbe8b2] border-[#e1ae41]/25 dark:from-[#3c2e14] dark:via-[#302410] dark:to-[#261c0c] dark:border-[#fbbf24]/30",
    light: "bg-gradient-to-br from-[#fef6db] via-[#fdf0c8] to-[#fbe8b2] border-[#e1ae41]/25",
    dark: "bg-gradient-to-br from-[#3c2e14] via-[#302410] to-[#261c0c] border-[#fbbf24]/30",
  },
};

function SkaleBrandMark({ uid }: { uid: string }) {
  return (
    <span
      className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]"
      style={{
        background:
          "linear-gradient(145deg, #ff7a3d 0%, #f1521a 55%, #db3f0e 100%)",
        boxShadow:
          "0 8px 18px -4px rgba(241, 82, 26, 0.55), inset 0 1px 1px rgba(255,255,255,0.45)",
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
        <defs>
          <linearGradient id={`${uid}-mark`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ffe5d8" />
          </linearGradient>
        </defs>
        <path
          d="M5.2 15.6L9.7 8.4C10.1 7.8 11.1 8 11.1 8.8V11.3L14.4 8.3C15 7.7 16 8.2 15.8 9L14.3 15.4C14.1 16.2 13.1 16.3 12.7 15.6L11.7 13.8L8.4 16.4C7.6 17 6.4 16.5 6.4 15.6H5.2Z"
          fill={`url(#${uid}-mark)`}
        />
        <path
          d="M15.6 14.9L18.2 9.4C18.5 8.8 19.4 9 19.4 9.7V14.6C19.4 15.4 18.6 16 17.8 16H16.2C15.6 16 15.3 15.4 15.6 14.9Z"
          fill={`url(#${uid}-mark)`}
          fillOpacity="0.92"
        />
      </svg>
    </span>
  );
}

function GlossyPushpin({
  color,
  uid,
  isHovered,
  isCompleted,
  reducedMotion,
}: {
  color: PinColor;
  uid: string;
  isHovered: boolean;
  isCompleted: boolean;
  reducedMotion: boolean;
}) {
  const p = PIN_PALETTE[color];

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none relative mx-auto -mt-[22px] mb-[6px] flex h-[34px] w-[34px] items-center justify-center"
      animate={
        reducedMotion
          ? undefined
          : isCompleted
            ? {
                y: [0, -5, 1, 0],
                rotate: [0, -10, 6, 0],
                scale: [1, 1.12, 0.96, 1],
              }
            : isHovered
              ? { y: -2, rotate: -7, scale: 1.07 }
              : { y: 0, rotate: 0, scale: 1 }
      }
      transition={{ type: "spring", stiffness: 380, damping: 18 }}
    >
      <span
        className="absolute left-1/2 top-[56%] h-[28px] w-[36px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[6px]"
        style={{ background: p.glow }}
      />
      <span
        className="absolute left-[46%] top-[62%] h-[13px] w-[20px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[2px]"
        style={{ background: "rgba(15, 23, 42, 0.24)" }}
      />
      <svg
        viewBox="0 0 40 40"
        className="relative h-[32px] w-[32px] overflow-visible"
      >
        <defs>
          <radialGradient id={`${uid}-base`} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor={p.top} />
            <stop offset="52%" stopColor={p.mid} />
            <stop offset="100%" stopColor={p.deep} />
          </radialGradient>
          <radialGradient id={`${uid}-dome`} cx="32%" cy="26%" r="72%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
            <stop offset="18%" stopColor={p.top} />
            <stop offset="62%" stopColor={p.mid} />
            <stop offset="100%" stopColor={p.deep} />
          </radialGradient>
        </defs>
        <ellipse
          cx="20"
          cy="24.5"
          rx="11.2"
          ry="8.4"
          fill={`url(#${uid}-base)`}
        />
        <ellipse
          cx="20"
          cy="23.8"
          rx="10.2"
          ry="7.4"
          fill="none"
          stroke={p.rim}
          strokeOpacity="0.45"
          strokeWidth="0.9"
        />
        <ellipse
          cx="20"
          cy="21.2"
          rx="6.4"
          ry="4.2"
          fill={p.deep}
          fillOpacity="0.6"
        />
        <circle cx="20.4" cy="14.6" r="8.6" fill={`url(#${uid}-dome)`} />
        <ellipse
          cx="17.2"
          cy="11.2"
          rx="3.4"
          ry="2.1"
          transform="rotate(-28 17.2 11.2)"
          fill="#ffffff"
          fillOpacity="0.58"
        />
        <path
          d="M15.4 20.6C18.4 22.3 23.2 21.8 25.8 19.2"
          stroke={p.rim}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeOpacity="0.55"
          fill="none"
        />
      </svg>
    </motion.div>
  );
}

function CurvedConnector({
  fromSide,
  reducedMotion,
  theme,
}: {
  fromSide: "left" | "right";
  reducedMotion: boolean;
  theme: "auto" | "light" | "dark";
}) {
  const path =
    fromSide === "left"
      ? "M 150 6 C 215 18, 260 36, 305 64"
      : "M 300 6 C 230 22, 180 42, 145 72";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative -my-5 hidden h-[72px] w-full sm:block"
    >
      <svg
        viewBox="0 0 460 78"
        className="mx-auto h-full w-full max-w-[460px] overflow-visible"
        fill="none"
      >
        <motion.path
          d={path}
          className={cn(
            theme === "dark"
              ? "stroke-white/25"
              : theme === "light"
                ? "stroke-slate-500/45"
                : "stroke-slate-500/45 dark:stroke-white/25"
          )}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="4 6"
          initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
    </div>
  );
}

function PartnerAvatarStamp({
  uid,
  partnerTagline,
  partnerAccent,
  theme,
}: {
  uid: string;
  partnerTagline: string;
  partnerAccent: string;
  theme: "auto" | "light" | "dark";
}) {
  return (
    <div className="relative mt-6 flex items-center justify-end gap-3 pr-2 sm:mt-2 sm:pr-6">
      <svg
        viewBox="0 0 72 24"
        className="hidden h-5 w-16 shrink-0 sm:block"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4 16 C 22 9, 44 9, 66 15"
          className={cn(
            theme === "dark"
              ? "stroke-white/25"
              : theme === "light"
                ? "stroke-slate-500/45"
                : "stroke-slate-500/45 dark:stroke-white/25"
          )}
          strokeWidth="1.25"
          strokeLinecap="round"
        />
      </svg>
      <div className="flex flex-col items-center text-center">
        <div
          className={cn(
            "relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full ring-2",
            theme === "dark"
              ? "bg-zinc-800 ring-white/20"
              : theme === "light"
                ? "bg-zinc-900 ring-white shadow-md"
                : "bg-zinc-900 ring-white shadow-md dark:bg-zinc-800 dark:ring-white/20"
          )}
          aria-hidden="true"
        >
          <svg viewBox="0 0 44 44" className="h-full w-full">
            <defs>
              <radialGradient
                id={`${uid}-partner-bg`}
                cx="50%"
                cy="35%"
                r="65%"
              >
                <stop offset="0%" stopColor="#404045" />
                <stop offset="100%" stopColor="#141417" />
              </radialGradient>
            </defs>
            <rect width="44" height="44" fill={`url(#${uid}-partner-bg)`} />
            <circle cx="22" cy="17.5" r="6.8" fill="#d4b5a0" />
            <path
              d="M15.2 16.5C15.5 11.4 18.6 9.4 22.3 9.4C26 9.4 29 11.8 28.9 16.8C27.5 14.3 25.1 13.4 22.1 13.5C19.2 13.6 16.8 14.6 15.2 16.5Z"
              fill="#1b1817"
            />
            <path
              d="M10.5 39C11.6 31.2 15.8 27.6 22 27.6C28.2 27.6 32.4 31.2 33.5 39Z"
              fill="#18181b"
            />
          </svg>
        </div>
        <p
          className={cn(
            "mt-2 rotate-[4deg] text-[12px] leading-[1.28] tracking-[-0.01em]",
            theme === "dark"
              ? "text-zinc-300"
              : theme === "light"
                ? "text-zinc-600"
                : "text-zinc-600 dark:text-zinc-300"
          )}
        >
          Your{" "}
          <span className="font-semibold text-[#db6327] dark:text-[#ff8a54]">
            {partnerAccent}
          </span>
          <br />
          {partnerTagline}
        </p>
      </div>
    </div>
  );
}

export const PinnedRoadmapCards = React.forwardRef<
  HTMLElement,
  PinnedRoadmapCardsProps
>(function PinnedRoadmapCards(
  {
    brandName = "skale",
    heading = "How to Build Trust on Your Website",
    partnerAccent = "all in one",
    partnerTagline = "design partner.",
    theme = "auto",
    textureIntensity = "medium",
    showRuledLines = true,
    showConnectors = true,
    interactiveChecklist = true,
    allowAddNote = true,
    cardCount = 7,
    steps: customSteps,
    onStepToggle,
    className,
    ...rest
  },
  ref
) {
  const rawId = useId();
  const uid = rawId.replace(/:/g, "");
  const reducedMotion = Boolean(useReducedMotion());

  const clampedCount = Math.max(
    1,
    Math.min(DEFAULT_STEPS.length, Math.round(cardCount))
  );

  const baseSteps = useMemo(() => {
    if (customSteps && customSteps.length > 0) return customSteps;
    return DEFAULT_STEPS.slice(0, clampedCount);
  }, [customSteps, clampedCount]);

  const [addedSteps, setAddedSteps] = useState<RoadmapStep[]>([]);
  const [completedIds, setCompletedIds] = useState<Record<string, boolean>>({});
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [draftPinColor, setDraftPinColor] = useState<PinColor>("orange");

  const allSteps = useMemo(
    () => [...baseSteps, ...addedSteps],
    [baseSteps, addedSteps]
  );

  const completedCount = useMemo(
    () => allSteps.filter((s) => completedIds[s.id]).length,
    [allSteps, completedIds]
  );

  const isForcedDark = theme === "dark";
  const isForcedLight = theme === "light";

  const grainOpacity =
    textureIntensity === "rich"
      ? 0.085
      : textureIntensity === "subtle"
        ? 0.028
        : 0.052;

  const ruledLineOpacity =
    textureIntensity === "rich"
      ? 0.105
      : textureIntensity === "subtle"
        ? 0.045
        : 0.072;

  const handleToggleStep = (stepId: string) => {
    if (!interactiveChecklist) return;
    setCompletedIds((prev) => {
      const next = !prev[stepId];
      onStepToggle?.(stepId, next);
      return { ...prev, [stepId]: next };
    });
  };

  const handleQuickPinNote = () => {
    const nextIndex = allSteps.length + 1;
    const preset =
      EXTRA_NOTE_PRESETS[addedSteps.length % EXTRA_NOTE_PRESETS.length];
    const side: "left" | "right" = nextIndex % 2 === 1 ? "left" : "right";
    const tilt = side === "left" ? 3.8 : -4.4;

    const toneByPin: Record<PinColor, CardTone> = {
      orange: "peach",
      blue: "periwinkle",
      purple: "lavender",
      emerald: "mint",
      rose: "rose",
      amber: "butter",
    };

    const newStep: RoadmapStep = {
      id: `custom-${nextIndex}-${Date.now()}`,
      number: String(nextIndex).padStart(2, "0"),
      title: draftTitle.trim() || preset.title,
      description: draftDesc.trim() || preset.description,
      pinColor: draftTitle.trim() ? draftPinColor : preset.pinColor,
      cardTone: draftTitle.trim() ? toneByPin[draftPinColor] : preset.cardTone,
      tilt,
      side,
    };

    setAddedSteps((prev) => [...prev, newStep]);
    setDraftTitle("");
    setDraftDesc("");
    setComposerOpen(false);
  };

  const handleReset = () => {
    setCompletedIds({});
    setAddedSteps([]);
  };

  return (
    <section
      ref={ref}
      aria-label={heading}
      className={cn(
        "relative mx-auto w-full max-w-[640px] overflow-hidden rounded-[28px] px-5 py-10 sm:px-9 sm:py-12",
        isForcedDark
          ? "bg-[#121316] text-zinc-100 ring-1 ring-white/10 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.65)]"
          : isForcedLight
            ? "bg-[#f2f2f2] text-zinc-900 ring-1 ring-black/[0.06] shadow-[0_24px_60px_-24px_rgba(15,23,42,0.14)]"
            : "bg-[#f2f2f2] text-zinc-900 ring-1 ring-black/[0.06] shadow-[0_24px_60px_-24px_rgba(15,23,42,0.14)] dark:bg-[#121316] dark:text-zinc-100 dark:ring-white/10 dark:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.65)]",
        className
      )}
      {...rest}
    >
      {/* Subtle studio lighting vignette on notebook sheet */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0",
          isForcedDark
            ? "bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04)_0%,transparent_65%)]"
            : isForcedLight
              ? "bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.85)_0%,rgba(241,241,241,0)_62%)]"
              : "bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.85)_0%,rgba(241,241,241,0)_62%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.04)_0%,transparent_65%)]"
        )}
      />

      {/* Tactile fine paper micro-grain overlay */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ opacity: grainOpacity }}
      >
        <filter id={`${uid}-paper-grain`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.82"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect
          width="100%"
          height="100%"
          filter={`url(#${uid}-paper-grain)`}
        />
      </svg>

      {/* Authentic etched horizontal notebook ruled lines */}
      {showRuledLines && (
        <>
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-8 top-36",
              isForcedDark ? "hidden" : isForcedLight ? "block" : "block dark:hidden"
            )}
            style={{
              backgroundImage: `repeating-linear-gradient(to bottom, transparent 0px, transparent 52px, rgba(15,23,42,${ruledLineOpacity}) 52px, rgba(15,23,42,${ruledLineOpacity}) 53px, rgba(255,255,255,0.72) 53px, rgba(255,255,255,0.72) 54px)`,
              maskImage:
                "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
            }}
          />
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-8 top-36",
              isForcedDark ? "block" : isForcedLight ? "hidden" : "hidden dark:block"
            )}
            style={{
              backgroundImage: `repeating-linear-gradient(to bottom, transparent 0px, transparent 52px, rgba(255,255,255,${ruledLineOpacity}) 52px, rgba(255,255,255,${ruledLineOpacity}) 53px, transparent 53px, transparent 54px)`,
              maskImage:
                "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
            }}
          />
        </>
      )}

      {/* Header */}
      <header className="relative z-10 mx-auto mb-10 flex max-w-[440px] flex-col items-center text-center">
        <div className="mb-4 inline-flex items-center gap-2.5">
          <SkaleBrandMark uid={uid} />
          <span
            className={cn(
              "text-[22px] font-semibold tracking-[-0.03em]",
              isForcedDark
                ? "text-zinc-100"
                : isForcedLight
                  ? "text-[#3a3b3f]"
                  : "text-[#3a3b3f] dark:text-zinc-100"
            )}
          >
            {brandName}
          </span>
        </div>

        <h2
          className={cn(
            "bg-clip-text text-[28px] font-bold leading-[1.14] tracking-[-0.03em] text-transparent sm:text-[36px]",
            isForcedDark
              ? "bg-gradient-to-b from-zinc-100 via-zinc-200 to-zinc-400"
              : isForcedLight
                ? "bg-gradient-to-b from-[#696b70] via-[#4a4c51] to-[#2e3034]"
                : "bg-gradient-to-b from-[#696b70] via-[#4a4c51] to-[#2e3034] dark:from-zinc-100 dark:via-zinc-200 dark:to-zinc-400"
          )}
        >
          {heading}
        </h2>

        {interactiveChecklist && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium tabular-nums",
                isForcedDark
                  ? "bg-white/[0.06] text-zinc-300 ring-1 ring-white/10"
                  : isForcedLight
                    ? "bg-white/80 text-zinc-600 shadow-xs ring-1 ring-black/[0.06]"
                    : "bg-white/80 text-zinc-600 shadow-xs ring-1 ring-black/[0.06] dark:bg-white/[0.06] dark:text-zinc-300 dark:ring-white/10"
              )}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#fc7351]" />
              <span>
                {completedCount} of {allSteps.length} completed
              </span>
            </span>

            {(completedCount > 0 || addedSteps.length > 0) && (
              <button
                type="button"
                onClick={handleReset}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fc7351]",
                  isForcedDark
                    ? "text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
                    : isForcedLight
                      ? "text-zinc-500 hover:bg-black/5 hover:text-zinc-800"
                      : "text-zinc-500 hover:bg-black/5 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
                )}
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>
        )}
      </header>

      {/* Zig-zag pinned roadmap stack */}
      <ol className="relative z-10 flex flex-col gap-6 sm:gap-2">
        <AnimatePresence initial={false}>
          {allSteps.map((step, index) => {
            const isCompleted = Boolean(completedIds[step.id]);
            const isHovered = hoveredId === step.id;
            const palette = PIN_PALETTE[step.pinColor];
            const toneClass = CARD_TONE_CLASSES[step.cardTone][theme];
            const isLast = index === allSteps.length - 1;

            return (
              <li key={step.id} className="relative">
                <div
                  className={cn(
                    "flex w-full",
                    step.side === "left"
                      ? "justify-center sm:justify-start sm:pl-2"
                      : "justify-center sm:justify-end sm:pr-2"
                  )}
                >
                  <motion.article
                    layout
                    initial={
                      reducedMotion
                        ? { opacity: 1 }
                        : {
                            opacity: 0,
                            y: 22,
                            rotate: step.tilt * 1.4,
                            scale: 0.94,
                          }
                    }
                    whileInView={{
                      opacity: 1,
                      y: 0,
                      rotate: isHovered ? 0 : step.tilt,
                      scale: isHovered ? 1.03 : 1,
                    }}
                    viewport={{ once: true, amount: 0.25 }}
                    whileHover={
                      reducedMotion
                        ? undefined
                        : { y: -6, rotate: 0, scale: 1.03 }
                    }
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 22,
                    }}
                    onMouseEnter={() => setHoveredId(step.id)}
                    onMouseLeave={() =>
                      setHoveredId((cur) => (cur === step.id ? null : cur))
                    }
                    onClick={() => handleToggleStep(step.id)}
                    onKeyDown={(e) => {
                      if (
                        interactiveChecklist &&
                        (e.key === "Enter" || e.key === " ")
                      ) {
                        e.preventDefault();
                        handleToggleStep(step.id);
                      }
                    }}
                    role={interactiveChecklist ? "button" : undefined}
                    tabIndex={interactiveChecklist ? 0 : undefined}
                    aria-pressed={interactiveChecklist ? isCompleted : undefined}
                    className={cn(
                      "group relative w-full max-w-[276px] select-none rounded-[24px] p-[12px] pt-[16px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fc7351] focus-visible:ring-offset-2",
                      interactiveChecklist && "cursor-pointer",
                      isForcedDark
                        ? "bg-gradient-to-b from-[#23252b] to-[#1a1c21] ring-1 ring-white/10 shadow-[0_20px_38px_-14px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.08)]"
                        : isForcedLight
                          ? "bg-gradient-to-b from-[#ffffff] to-[#f7f7f8] ring-1 ring-black/[0.04] shadow-[0_20px_40px_-14px_rgba(15,23,42,0.14),0_6px_14px_-4px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.95)]"
                          : "bg-gradient-to-b from-[#ffffff] to-[#f7f7f8] ring-1 ring-black/[0.04] shadow-[0_20px_40px_-14px_rgba(15,23,42,0.14),0_6px_14px_-4px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] dark:from-[#23252b] dark:to-[#1a1c21] dark:ring-white/10 dark:shadow-[0_20px_38px_-14px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.08)]"
                    )}
                  >
                    <GlossyPushpin
                      color={step.pinColor}
                      uid={`${uid}-${step.id}`}
                      isHovered={isHovered}
                      isCompleted={isCompleted}
                      reducedMotion={reducedMotion}
                    />

                    {/* Inner Pastel Paper Sheet */}
                    <div
                      className={cn(
                        "relative overflow-hidden rounded-[14px] border px-[16px] pb-[18px] pt-[14px]",
                        toneClass
                      )}
                    >
                      <svg
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 h-full w-full"
                        style={{ opacity: grainOpacity * 0.9 }}
                      >
                        <rect
                          width="100%"
                          height="100%"
                          filter={`url(#${uid}-paper-grain)`}
                        />
                      </svg>

                      <div className="relative z-10 mb-2.5 flex items-center justify-between">
                        <span
                          className={cn(
                            "font-serif text-[21px] font-semibold italic leading-none tracking-[-0.02em] tabular-nums",
                            isForcedDark
                              ? palette.darkNumeralClass
                              : palette.numeralClass
                          )}
                        >
                          {step.number}
                        </span>

                        {interactiveChecklist && (
                          <motion.span
                            aria-hidden="true"
                            animate={{
                              scale: isCompleted ? 1 : 0.85,
                              opacity: isCompleted
                                ? 1
                                : isHovered
                                  ? 0.65
                                  : 0.28,
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 420,
                              damping: 22,
                            }}
                            className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-full border",
                              isCompleted
                                ? "border-transparent bg-emerald-500 text-white shadow-xs"
                                : isForcedDark
                                  ? "border-white/25 bg-black/20 text-transparent"
                                  : "border-black/15 bg-white/60 text-transparent dark:border-white/25 dark:bg-black/20"
                            )}
                          >
                            <Check className="h-3 w-3 stroke-[3]" />
                          </motion.span>
                        )}
                      </div>

                      <h3
                        className={cn(
                          "relative z-10 mb-2 text-[19px] font-bold leading-[1.2] tracking-[-0.02em] transition-opacity",
                          isForcedDark
                            ? "text-zinc-50"
                            : isForcedLight
                              ? "text-[#17181c]"
                              : "text-[#17181c] dark:text-zinc-50",
                          isCompleted && "line-through opacity-65"
                        )}
                      >
                        {step.title}
                      </h3>

                      <p
                        className={cn(
                          "relative z-10 text-[12.5px] leading-[1.48] tracking-[-0.005em] transition-opacity",
                          isForcedDark
                            ? "text-zinc-300"
                            : isForcedLight
                              ? "text-[#46474d]"
                              : "text-[#46474d] dark:text-zinc-300",
                          isCompleted && "opacity-60"
                        )}
                      >
                        {step.description}
                      </p>
                    </div>
                  </motion.article>
                </div>

                {showConnectors && !isLast && (
                  <CurvedConnector
                    fromSide={step.side}
                    reducedMotion={reducedMotion}
                    theme={theme}
                  />
                )}
              </li>
            );
          })}
        </AnimatePresence>
      </ol>

      {/* Interactive "+ Pin Another Note" composer */}
      {allowAddNote && (
        <div className="relative z-10 mt-8 flex flex-col items-center">
          <AnimatePresence mode="wait">
            {!composerOpen ? (
              <motion.button
                key="add-trigger"
                type="button"
                onClick={() => setComposerOpen(true)}
                initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -4 }}
                whileHover={reducedMotion ? undefined : { y: -2, scale: 1.02 }}
                whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fc7351]",
                  isForcedDark
                    ? "bg-white/[0.08] text-zinc-100 ring-1 ring-white/15 hover:bg-white/[0.14]"
                    : isForcedLight
                      ? "bg-white text-zinc-800 shadow-sm ring-1 ring-black/[0.08] hover:bg-zinc-50"
                      : "bg-white text-zinc-800 shadow-sm ring-1 ring-black/[0.08] hover:bg-zinc-50 dark:bg-white/[0.08] dark:text-zinc-100 dark:ring-white/15 dark:hover:bg-white/[0.14]"
                )}
              >
                <Plus className="h-4 w-4 text-[#fc7351]" />
                Pin Another Note
              </motion.button>
            ) : (
              <motion.div
                key="add-form"
                initial={
                  reducedMotion ? false : { opacity: 0, y: 10, scale: 0.97 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={
                  reducedMotion ? undefined : { opacity: 0, y: 6, scale: 0.97 }
                }
                className={cn(
                  "w-full max-w-[340px] rounded-[20px] p-4 shadow-lg",
                  isForcedDark
                    ? "bg-[#1e2026] ring-1 ring-white/12"
                    : isForcedLight
                      ? "bg-white ring-1 ring-black/[0.08]"
                      : "bg-white ring-1 ring-black/[0.08] dark:bg-[#1e2026] dark:ring-white/12"
                )}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[13px] font-semibold">
                    Pin a new roadmap note
                  </span>
                  <button
                    type="button"
                    onClick={() => setComposerOpen(false)}
                    aria-label="Close note form"
                    className="rounded-full p-1 text-zinc-400 transition-colors hover:bg-black/5 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  <input
                    type="text"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="Title (leave blank for curated tip)"
                    className={cn(
                      "w-full rounded-[10px] px-3 py-2 text-[13px] outline-none ring-1 transition-shadow focus:ring-2 focus:ring-[#fc7351]",
                      isForcedDark
                        ? "bg-black/30 text-zinc-100 ring-white/10 placeholder:text-zinc-500"
                        : isForcedLight
                          ? "bg-zinc-50 text-zinc-900 ring-black/10 placeholder:text-zinc-400"
                          : "bg-zinc-50 text-zinc-900 ring-black/10 placeholder:text-zinc-400 dark:bg-black/30 dark:text-zinc-100 dark:ring-white/10 dark:placeholder:text-zinc-500"
                    )}
                  />
                  <textarea
                    rows={2}
                    value={draftDesc}
                    onChange={(e) => setDraftDesc(e.target.value)}
                    placeholder="Short description..."
                    className={cn(
                      "w-full resize-none rounded-[10px] px-3 py-2 text-[13px] outline-none ring-1 transition-shadow focus:ring-2 focus:ring-[#fc7351]",
                      isForcedDark
                        ? "bg-black/30 text-zinc-100 ring-white/10 placeholder:text-zinc-500"
                        : isForcedLight
                          ? "bg-zinc-50 text-zinc-900 ring-black/10 placeholder:text-zinc-400"
                          : "bg-zinc-50 text-zinc-900 ring-black/10 placeholder:text-zinc-400 dark:bg-black/30 dark:text-zinc-100 dark:ring-white/10 dark:placeholder:text-zinc-500"
                    )}
                  />
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      {(
                        [
                          "orange",
                          "blue",
                          "purple",
                          "emerald",
                          "rose",
                          "amber",
                        ] as PinColor[]
                      ).map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setDraftPinColor(color)}
                          aria-label={`Select ${color} pin`}
                          className={cn(
                            "h-5 w-5 rounded-full transition-transform",
                            draftPinColor === color
                              ? "scale-110 ring-2 ring-zinc-900 ring-offset-2 dark:ring-white dark:ring-offset-[#1e2026]"
                              : "opacity-75 hover:opacity-100"
                          )}
                          style={{ background: PIN_PALETTE[color].mid }}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleQuickPinNote}
                      className="rounded-full bg-[#fc7351] px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-xs transition-colors hover:bg-[#e85e3c]"
                    >
                      Pin Note
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Bottom Partner Signature Stamp */}
      <div className="relative z-10">
        <PartnerAvatarStamp
          uid={uid}
          partnerAccent={partnerAccent}
          partnerTagline={partnerTagline}
          theme={theme}
        />
      </div>
    </section>
  );
});

export {
  PinnedRoadmapCards as component,
  PinnedRoadmapCards as Component,
};
export default PinnedRoadmapCards;
