"use client";

import React, { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type CreativeGridTheme = "auto" | "light" | "dark";

export interface CreativeGridPosterProps
  extends React.HTMLAttributes<HTMLElement> {
  eyebrow?: string;
  sectionTitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  line1?: string;
  line2?: string;
  line3?: string;
  line4?: string;
  attribution?: string;
  theme?: CreativeGridTheme;
  showInspector?: boolean;
  animateEntrance?: boolean;
}

interface GridArtifact {
  id: string;
  label: string;
  year: string;
  category: string;
  note: string;
  colStart: number;
  colSpan: number;
  rowStart: number;
  rowSpan: number;
  render: () => React.ReactNode;
}

const EDITORIAL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const ARTIFACTS: GridArtifact[] = [
  {
    id: "mona-lisa",
    label: "Mona Lisa · Da Vinci",
    year: "1503",
    category: "Fine Art",
    note: "Painted on a modest poplar panel using layered oil glazes—proof that patience and observation outlast eras.",
    colStart: 8,
    colSpan: 2,
    rowStart: 2,
    rowSpan: 3,
    render: () => (
      <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-[#6B7048] via-[#4A492E] to-[#1D1B14]">
        <svg viewBox="0 0 100 150" className="h-full w-full">
          <defs>
            <radialGradient id="ml-face" cx="50%" cy="38%" r="35%">
              <stop offset="0%" stopColor="#E6C296" />
              <stop offset="100%" stopColor="#A97D52" />
            </radialGradient>
          </defs>
          <path
            d="M0 95 Q30 85 50 92 Q75 84 100 96 L100 150 L0 150 Z"
            fill="#2B241A"
          />
          <ellipse cx="50" cy="52" rx="18" ry="24" fill="#1E1812" />
          <ellipse cx="50" cy="50" rx="13" ry="17" fill="url(#ml-face)" />
          <path
            d="M36 42 Q50 30 64 42 Q68 74 62 96 L38 96 Q32 74 36 42 Z"
            fill="#1D1712"
            opacity="0.7"
          />
          <ellipse cx="50" cy="51" rx="11" ry="15" fill="url(#ml-face)" />
          <path
            d="M44 57 Q50 60 56 57"
            fill="none"
            stroke="#6B4429"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M28 110 Q50 95 72 110 L76 150 L24 150 Z"
            fill="#3B3123"
          />
          <ellipse cx="52" cy="126" rx="14" ry="7" fill="#C99B6B" />
        </svg>
      </div>
    ),
  },
  {
    id: "kodak-camera",
    label: "35mm Film Camera",
    year: "1980s",
    category: "Optics",
    note: "Put precision glass and light capture into everyday hands, turning fleeting moments into permanent memory.",
    colStart: 11,
    colSpan: 2,
    rowStart: 2,
    rowSpan: 1,
    render: () => (
      <div className="flex h-full w-full items-center justify-center p-1">
        <svg viewBox="0 0 120 62" className="h-full w-full drop-shadow-xs">
          <rect x="6" y="10" width="108" height="46" rx="4" fill="#EAB308" />
          <rect x="6" y="10" width="108" height="15" rx="3" fill="#18181B" />
          <rect x="16" y="6" width="16" height="6" rx="1.5" fill="#27272A" />
          <rect x="38" y="14" width="18" height="8" rx="1.5" fill="#F4F4F5" />
          <circle cx="62" cy="35" r="16" fill="#18181B" />
          <circle cx="62" cy="35" r="11" fill="#09090B" />
          <circle cx="62" cy="35" r="5" fill="#27272A" />
          <circle cx="59" cy="32" r="2" fill="#71717A" />
          <rect x="93" y="39" width="13" height="13" rx="1.5" fill="#B45309" />
          <text
            x="99.5"
            y="49"
            textAnchor="middle"
            fill="#FEF08A"
            fontSize="9"
            fontWeight="700"
          >
            K
          </text>
        </svg>
      </div>
    ),
  },
  {
    id: "cave-art",
    label: "Lascaux Cave Art",
    year: "15,000 BC",
    category: "Origin",
    note: "Charcoal and ochre on limestone walls—humanity's earliest impulse to tell stories visually.",
    colStart: 12,
    colSpan: 2,
    rowStart: 3,
    rowSpan: 1,
    render: () => (
      <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-[#D99B66] via-[#B4532A] to-[#7C2D12]">
        <svg viewBox="0 0 120 60" className="h-full w-full opacity-85">
          <path
            d="M15 38 Q25 22 38 28 L46 22 L42 32 L48 45 M24 38 L22 48 M33 36 L35 47"
            fill="none"
            stroke="#291208"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M58 32 Q72 18 86 26 L94 20 L88 30 L96 42 M66 33 L64 44 M78 32 L80 43"
            fill="none"
            stroke="#291208"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="104" cy="24" r="4" fill="#291208" />
        </svg>
      </div>
    ),
  },
  {
    id: "campfire",
    label: "Controlled Fire",
    year: "Early Human",
    category: "Survival",
    note: "The first energy technology—transforming raw nature into warmth, light, and community.",
    colStart: 1,
    colSpan: 2,
    rowStart: 4,
    rowSpan: 1,
    render: () => (
      <div className="relative h-full w-full overflow-hidden bg-[#09090B]">
        <svg viewBox="0 0 120 60" className="h-full w-full">
          <path d="M22 54 L96 44 L98 50 L24 58 Z" fill="#451A03" />
          <path d="M34 42 L90 54 L86 58 L30 48 Z" fill="#78350F" />
          <path d="M52 48 Q46 26 60 8 Q70 24 64 48 Z" fill="#F97316" />
          <path d="M54 48 Q51 32 60 18 Q66 32 62 48 Z" fill="#FACC15" />
        </svg>
      </div>
    ),
  },
  {
    id: "tesla",
    label: "Electric Mobility",
    year: "2003",
    category: "Energy",
    note: "Re-engineered the century-old drivetrain from scratch, proving software belongs in physical machines.",
    colStart: 3,
    colSpan: 1,
    rowStart: 5,
    rowSpan: 1,
    render: () => (
      <div className="flex h-full w-full items-center justify-center bg-white p-2">
        <svg viewBox="0 0 64 64" className="h-4/5 w-4/5 fill-[#E31937]">
          <path d="M32 16c9.2 0 17.5 1.8 22 4.6l-2.3 3.7C47.5 22 40.2 20.5 32 20.5S16.5 22 12.3 24.3L10 20.6C14.5 17.8 22.8 16 32 16zm0 7.2c5.4 0 10.6.7 14.5 2L32 54 17.5 25.2c3.9-1.3 9.1-2 14.5-2z" />
        </svg>
      </div>
    ),
  },
  {
    id: "newspaper-sky",
    label: "Print & Journalism",
    year: "1851",
    category: "Media",
    note: "Ink on folded newsprint that carried ideas across continents before a single fiber cable existed.",
    colStart: 5,
    colSpan: 2,
    rowStart: 4,
    rowSpan: 2,
    render: () => (
      <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-[#0284C7] to-[#38BDF8]">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <path
            d="M18 32 L54 22 L82 34 L76 82 L48 72 L24 84 Z"
            fill="#F8FAFC"
            stroke="#CBD5E1"
            strokeWidth="1"
          />
          <path d="M54 22 L48 72" stroke="#94A3B8" strokeWidth="1" />
          <rect
            x="28"
            y="38"
            width="18"
            height="28"
            rx="1"
            fill="url(#sky-print)"
          />
          <defs>
            <linearGradient id="sky-print" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="65%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
          </defs>
          <rect x="54" y="34" width="18" height="3" fill="#475569" />
          <rect x="54" y="40" width="16" height="2" fill="#94A3B8" />
          <rect x="54" y="45" width="18" height="2" fill="#94A3B8" />
        </svg>
      </div>
    ),
  },
  {
    id: "rocket",
    label: "Orbital Spaceflight",
    year: "1969",
    category: "Aerospace",
    note: "Built by engineers with slide rules who refused to accept gravity as a permanent boundary.",
    colStart: 1,
    colSpan: 2,
    rowStart: 6,
    rowSpan: 3,
    render: () => (
      <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-[#0C2D57] via-[#134074] to-[#1D5B9E]">
        <svg viewBox="0 0 100 150" className="h-full w-full">
          <path d="M44 36 L48 16 L52 36 L55 82 L41 82 Z" fill="#E2E8F0" />
          <path d="M41 64 L35 84 L41 82 Z" fill="#CBD5E1" />
          <path d="M55 64 L61 84 L55 82 Z" fill="#CBD5E1" />
          <path
            d="M44 82 Q48 116 42 145 L58 145 Q52 116 52 82 Z"
            fill="#FB923C"
            opacity="0.85"
          />
          <path
            d="M46 82 Q48 104 45 124 L51 124 Q50 104 50 82 Z"
            fill="#FEF08A"
          />
        </svg>
      </div>
    ),
  },
  {
    id: "nike",
    label: "Athletic Design",
    year: "1971",
    category: "Brand",
    note: "A $35 student-drawn curve and a waffle iron reshaped global sport and design culture.",
    colStart: 8,
    colSpan: 1,
    rowStart: 6,
    rowSpan: 1,
    render: () => (
      <div className="flex h-full w-full items-center justify-center bg-white p-1.5">
        <svg viewBox="0 0 64 32" className="h-3/4 w-3/4 fill-[#111111]">
          <path d="M58 6L21.5 21.8c-4.2 1.8-7.6 1.2-9.5-1.4-1.7-2.4-.9-6 2.1-9.6-2.4 2-5.6 5.6-6.2 9.4-.7 4.4 2.2 8 7.6 7.5 3.1-.3 6.8-1.7 10.6-3.3L58 6z" />
        </svg>
      </div>
    ),
  },
  {
    id: "fountain",
    label: "Classical Fountain",
    year: "1600s",
    category: "Civic Craft",
    note: "Stonework and gravity-fed hydraulics turning public squares into living gathering places.",
    colStart: 10,
    colSpan: 3,
    rowStart: 5,
    rowSpan: 3,
    render: () => (
      <div className="flex h-full w-full items-center justify-center p-1">
        <svg viewBox="0 0 120 120" className="h-full w-full drop-shadow-xs">
          <ellipse cx="60" cy="86" rx="46" ry="18" fill="#78716C" />
          <ellipse cx="60" cy="83" rx="40" ry="13" fill="#4D7C0F" opacity="0.65" />
          <rect x="54" y="42" width="12" height="40" fill="#A8A29E" />
          <ellipse cx="60" cy="44" rx="26" ry="9" fill="#D6D3D1" />
          <ellipse cx="60" cy="24" rx="12" ry="4.5" fill="#E7E5E4" />
          <path
            d="M46 46 Q38 64 36 80 M74 46 Q82 64 84 80"
            fill="none"
            stroke="#E0F2FE"
            strokeWidth="2"
            strokeDasharray="3 2"
          />
        </svg>
      </div>
    ),
  },
  {
    id: "instagram",
    label: "Social Photography",
    year: "2010",
    category: "Software",
    note: "Started as a small check-in prototype before pivoting into a global visual language.",
    colStart: 13,
    colSpan: 1,
    rowStart: 7,
    rowSpan: 1,
    render: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#DCEEFF] p-1.5">
        <svg viewBox="0 0 48 48" className="h-4/5 w-4/5">
          <defs>
            <linearGradient id="ig-g" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#FACC15" />
              <stop offset="50%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
          </defs>
          <rect x="6" y="6" width="36" height="36" rx="9" fill="url(#ig-g)" />
          <rect
            x="12"
            y="12"
            width="24"
            height="24"
            rx="6"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.8"
          />
          <circle
            cx="24"
            cy="24"
            r="5.5"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.8"
          />
          <circle cx="31.5" cy="16.5" r="1.8" fill="#FFFFFF" />
        </svg>
      </div>
    ),
  },
  {
    id: "openai",
    label: "Generative Intelligence",
    year: "2015",
    category: "Computing",
    note: "Researchers turning statistical math into conversational tools used by hundreds of millions.",
    colStart: 2,
    colSpan: 1,
    rowStart: 9,
    rowSpan: 1,
    render: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#74AA9C] p-1.5">
        <svg
          viewBox="0 0 48 48"
          className="h-4/5 w-4/5 fill-none stroke-white"
          strokeWidth="2.6"
        >
          <circle cx="24" cy="24" r="11" />
          <path d="M24 10v28M12 17l24 14M36 17L12 31" />
        </svg>
      </div>
    ),
  },
  {
    id: "wheel",
    label: "The Spoked Wheel",
    year: "3500 BC",
    category: "Mechanics",
    note: "One simple rotational insight that unlocked trade, clocks, turbines, and modern transport.",
    colStart: 8,
    colSpan: 2,
    rowStart: 8,
    rowSpan: 2,
    render: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#3F2E36] p-2">
        <svg viewBox="0 0 80 80" className="h-full w-full">
          <circle
            cx="40"
            cy="40"
            r="28"
            fill="none"
            stroke="#D6B084"
            strokeWidth="6"
          />
          <circle cx="40" cy="40" r="6" fill="#C49A6C" />
          {[0, 45, 90, 135].map((deg) => (
            <line
              key={deg}
              x1="40"
              y1="14"
              x2="40"
              y2="66"
              stroke="#C49A6C"
              strokeWidth="3.5"
              transform={`rotate(${deg} 40 40)`}
            />
          ))}
        </svg>
      </div>
    ),
  },
  {
    id: "iphone",
    label: "Original iPhone",
    year: "2007",
    category: "Hardware",
    note: "Replaced rigid plastic keypads with a multi-touch glass canvas that adapts to any idea.",
    colStart: 11,
    colSpan: 2,
    rowStart: 8,
    rowSpan: 2,
    render: () => (
      <div className="flex h-full w-full items-center justify-center p-1">
        <svg viewBox="0 0 90 100" className="h-full w-full drop-shadow-xs">
          <g transform="rotate(-14 45 50)">
            <rect
              x="22"
              y="10"
              width="46"
              height="80"
              rx="7"
              fill="#D4D4D8"
              stroke="#71717A"
              strokeWidth="1.5"
            />
            <path
              d="M22 68 H68 V83 A7 7 0 0 1 61 90 H29 A7 7 0 0 1 22 83 Z"
              fill="#18181B"
            />
            <circle cx="45" cy="39" r="5" fill="#27272A" />
          </g>
        </svg>
      </div>
    ),
  },
  {
    id: "roman-arch",
    label: "Stone Arch",
    year: "1100s",
    category: "Architecture",
    note: "Load-bearing geometry carved by masons that still stands centuries after its builders.",
    colStart: 2,
    colSpan: 2,
    rowStart: 10,
    rowSpan: 2,
    render: () => (
      <div className="flex h-full w-full items-center justify-center p-1">
        <svg viewBox="0 0 90 100" className="h-full w-full">
          <path
            d="M12 85 L18 28 Q45 6 72 28 L78 85 Q45 92 12 85 Z"
            fill="#A8A29E"
          />
          <path d="M28 76 L28 38 Q45 20 62 38 L62 76 Z" fill="#D6D3D1" />
          <rect x="36" y="42" width="4" height="32" fill="#78716C" />
          <rect x="44" y="38" width="4" height="36" fill="#78716C" />
          <rect x="52" y="42" width="4" height="32" fill="#78716C" />
        </svg>
      </div>
    ),
  },
  {
    id: "elon",
    label: "First-Principles Engineering",
    year: "2020s",
    category: "Industry",
    note: "Questioning inherited cost curves in rockets and batteries until the math works.",
    colStart: 6,
    colSpan: 1,
    rowStart: 10,
    rowSpan: 1,
    render: () => (
      <div className="relative h-full w-full overflow-hidden bg-[#F4F4F5]">
        <svg viewBox="0 0 60 60" className="h-full w-full">
          <path d="M12 60 Q30 44 48 60 Z" fill="#18181B" />
          <path d="M26 46 L30 56 L34 46 Z" fill="#FFFFFF" />
          <circle cx="30" cy="28" r="11" fill="#E6B89C" />
          <path
            d="M19 25 Q30 14 41 25 Q38 18 30 17 Q22 18 19 25 Z"
            fill="#3F2E21"
          />
        </svg>
      </div>
    ),
  },
  {
    id: "pyramids",
    label: "Pyramids of Giza",
    year: "2560 BC",
    category: "Monument",
    note: "2.3 million limestone blocks aligned to true north using copper tools and human coordination.",
    colStart: 5,
    colSpan: 3,
    rowStart: 12,
    rowSpan: 2,
    render: () => (
      <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-[#0284C7] to-[#7DD3FC]">
        <svg viewBox="0 0 150 90" className="h-full w-full">
          <polygon points="10,74 44,30 78,74" fill="#D97706" />
          <polygon points="44,30 78,74 58,74" fill="#B45309" />
          <polygon points="62,74 102,20 142,74" fill="#F59E0B" />
          <polygon points="102,20 142,74 116,74" fill="#B45309" />
          <rect x="0" y="72" width="150" height="18" fill="#EAB308" />
        </svg>
      </div>
    ),
  },
  {
    id: "steve-jobs",
    label: "Steve Jobs",
    year: "1994",
    category: "Philosophy",
    note: '"Once you discover that you can poke it and something pops out the other side, you can change it."',
    colStart: 13,
    colSpan: 1,
    rowStart: 12,
    rowSpan: 1,
    render: () => (
      <div className="relative h-full w-full overflow-hidden bg-[#18181B] grayscale">
        <svg viewBox="0 0 60 60" className="h-full w-full">
          <path d="M12 60 Q30 44 48 60 Z" fill="#09090B" />
          <circle cx="30" cy="27" r="11" fill="#D4D4D8" />
          <path
            d="M20 22 Q30 13 40 22"
            fill="none"
            stroke="#52525B"
            strokeWidth="3"
          />
          <circle
            cx="26"
            cy="26"
            r="3"
            fill="none"
            stroke="#18181B"
            strokeWidth="1"
          />
          <circle
            cx="34"
            cy="26"
            r="3"
            fill="none"
            stroke="#18181B"
            strokeWidth="1"
          />
        </svg>
      </div>
    ),
  },
];

export const CreativeGridPoster = React.forwardRef<
  HTMLElement,
  CreativeGridPosterProps
>(
  (
    {
      eyebrow = "(Manifesto)",
      sectionTitle = "On Craft, Invention & Human Agency",
      ctaLabel = "Start building",
      ctaHref = "#contact",
      onCtaClick,
      line1 = "EVERYTHING\nAROUND\nYOU",
      line2 = "THAT YOU\nCALLED LIFE",
      line3 = "WAS\nMADE BY\nPEOPLE",
      line4 = "THAT\nWERE NO\nSMARTER\nTHAN YOU.",
      attribution = "WWW.DREX.ART",
      theme = "auto",
      showInspector = true,
      animateEntrance = true,
      className,
      ...rest
    },
    ref
  ) => {
    const prefersReducedMotion = Boolean(useReducedMotion());
    const headingId = useId();
    const [activeIndex, setActiveIndex] = useState<number>(ARTIFACTS.length - 1);

    const shouldAnimate = animateEntrance && !prefersReducedMotion;
    const isDarkForced = theme === "dark";
    const isLightForced = theme === "light";

    const outerBg = isDarkForced
      ? "bg-[#121210] text-[#F4F1EA]"
      : isLightForced
        ? "bg-[#E7E3DA] text-[#111111]"
        : "bg-[#E7E3DA] text-[#111111] dark:bg-[#121210] dark:text-[#F4F1EA]";

    const borderMuted = isDarkForced
      ? "border-white/12"
      : isLightForced
        ? "border-black/12"
        : "border-black/12 dark:border-white/12";

    const mutedText = isDarkForced
      ? "text-zinc-400"
      : isLightForced
        ? "text-zinc-600"
        : "text-zinc-600 dark:text-zinc-400";

    const cardSurface = isDarkForced
      ? "bg-[#191916] border-white/12"
      : isLightForced
        ? "bg-[#EFECE4] border-black/10"
        : "bg-[#EFECE4] border-black/10 dark:bg-[#191916] dark:border-white/12";

    const gridLineColor = isDarkForced
      ? "rgba(244,241,234,0.12)"
      : isLightForced
        ? "rgba(17,17,17,0.12)"
        : "rgba(128,124,114,0.22)";

    const activeArtifact = ARTIFACTS[activeIndex] ?? ARTIFACTS[0];

    const handleStep = (delta: number) => {
      setActiveIndex(
        (prev) => (prev + delta + ARTIFACTS.length) % ARTIFACTS.length
      );
    };

    const quoteBlocks = [
      {
        id: "q1",
        text: line1,
        colStart: 2,
        colSpan: 5,
        rowStart: 2,
        rowSpan: 2,
        align: "items-center justify-center text-center",
      },
      {
        id: "q2",
        text: line2,
        colStart: 7,
        colSpan: 4,
        rowStart: 4,
        rowSpan: 2,
        align: "items-center justify-start pl-2 text-left",
      },
      {
        id: "q3",
        text: line3,
        colStart: 4,
        colSpan: 3,
        rowStart: 7,
        rowSpan: 2,
        align: "items-center justify-start pl-1 text-left",
      },
      {
        id: "q4",
        text: line4,
        colStart: 8,
        colSpan: 5,
        rowStart: 10,
        rowSpan: 3,
        align: "items-center justify-start pl-2 text-left",
      },
    ];

    return (
      <section
        ref={ref}
        aria-labelledby={headingId}
        className={cn(
          "relative w-full py-12 sm:py-16 lg:py-24",
          outerBg,
          className
        )}
        style={{
          fontFamily:
            '"Plus Jakarta Sans", "Inter", "Helvetica Neue", Arial, sans-serif',
        }}
        {...rest}
      >
        <div className="mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-12">
          <header
            className={cn(
              "mb-10 flex flex-wrap items-center justify-between gap-4 border-b pb-4 text-[12.5px] font-medium tracking-[-0.01em] sm:mb-12",
              borderMuted
            )}
          >
            <div className="flex items-center gap-4">
              <span>{eyebrow}</span>
              <span className={cn("hidden sm:inline", mutedText)}>
                {sectionTitle}
              </span>
            </div>

            <div className="flex items-center gap-6">
              <span className={cn("tabular-nums", mutedText)}>
                {String(activeIndex + 1).padStart(2, "0")} /{" "}
                {String(ARTIFACTS.length).padStart(2, "0")}
              </span>
              {ctaLabel && (
                <a
                  href={ctaHref}
                  onClick={onCtaClick}
                  className="inline-flex items-center gap-1 border-b border-current pb-0.5 transition-opacity hover:opacity-65 focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none"
                >
                  <span>{ctaLabel}</span>
                  <span aria-hidden="true">→</span>
                </a>
              )}
            </div>
          </header>

          <h2 id={headingId} className="sr-only">
            {`${line1} ${line2} ${line3} ${line4}`.replace(/\n/g, " ")}
          </h2>

          <div
            className={cn(
              "grid grid-cols-1 items-start gap-10 lg:gap-14",
              showInspector ? "lg:grid-cols-12" : "lg:grid-cols-1"
            )}
          >
            <div
              className={cn(
                "flex justify-center",
                showInspector ? "lg:col-span-8 lg:justify-start" : ""
              )}
            >
              <div
                className="relative grid w-full max-w-[740px] grid-cols-[repeat(13,minmax(0,1fr))] grid-rows-[repeat(14,minmax(0,1fr))]"
                style={{
                  aspectRatio: "13 / 14",
                  backgroundImage: `linear-gradient(to right, ${gridLineColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridLineColor} 1px, transparent 1px)`,
                  backgroundSize: "calc(100% / 13) calc(100% / 14)",
                  borderRight: `1px solid ${gridLineColor}`,
                  borderBottom: `1px solid ${gridLineColor}`,
                }}
              >
                {quoteBlocks.map((block, idx) => (
                  <motion.div
                    key={block.id}
                    initial={
                      shouldAnimate
                        ? { opacity: 0, y: 12 }
                        : { opacity: 1, y: 0 }
                    }
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.12 }}
                    transition={{
                      duration: 0.65,
                      delay: idx * 0.1,
                      ease: EDITORIAL_EASE,
                    }}
                    className={cn("z-10 flex select-none", block.align)}
                    style={{
                      gridColumn: `${block.colStart} / span ${block.colSpan}`,
                      gridRow: `${block.rowStart} / span ${block.rowSpan}`,
                    }}
                  >
                    <p className="whitespace-pre-line text-[clamp(0.8rem,2.2vw,1.55rem)] leading-[0.98] font-medium tracking-[-0.03em]">
                      {block.text}
                    </p>
                  </motion.div>
                ))}

                {ARTIFACTS.map((artifact, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <motion.button
                      key={artifact.id}
                      type="button"
                      initial={
                        shouldAnimate
                          ? { opacity: 0, scale: 0.94 }
                          : { opacity: 1, scale: 1 }
                      }
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, amount: 0.12 }}
                      transition={{
                        duration: 0.5,
                        delay: 0.12 + idx * 0.025,
                        ease: EDITORIAL_EASE,
                      }}
                      whileHover={
                        prefersReducedMotion
                          ? undefined
                          : { scale: 1.05, zIndex: 30 }
                      }
                      onMouseEnter={() => setActiveIndex(idx)}
                      onFocus={() => setActiveIndex(idx)}
                      onClick={() => setActiveIndex(idx)}
                      aria-label={`${artifact.label} (${artifact.year})`}
                      aria-pressed={isActive}
                      className={cn(
                        "relative cursor-pointer p-0 text-left transition-shadow focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none",
                        isActive &&
                          showInspector &&
                          "z-20 ring-1 ring-current ring-offset-1"
                      )}
                      style={{
                        gridColumn: `${artifact.colStart} / span ${artifact.colSpan}`,
                        gridRow: `${artifact.rowStart} / span ${artifact.rowSpan}`,
                      }}
                    >
                      {artifact.render()}
                    </motion.button>
                  );
                })}

                {attribution && (
                  <div
                    className="flex items-center justify-start pl-1.5 text-[clamp(0.45rem,0.9vw,0.625rem)] font-medium tracking-[0.04em] opacity-75"
                    style={{
                      gridColumn: "1 / span 3",
                      gridRow: "13 / span 1",
                    }}
                  >
                    {attribution}
                  </div>
                )}
              </div>
            </div>

            {showInspector && (
              <aside className="flex flex-col justify-between gap-8 lg:sticky lg:top-10 lg:col-span-4">
                <div
                  className={cn("rounded-lg border p-6 sm:p-7", cardSurface)}
                >
                  <div className="mb-5 flex items-center justify-between text-[11px] font-medium tracking-wider uppercase">
                    <span className={mutedText}>Artifact Index</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStep(-1)}
                        aria-label="Previous artifact"
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded border transition-colors hover:opacity-70 focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none",
                          borderMuted
                        )}
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStep(1)}
                        aria-label="Next artifact"
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded border transition-colors hover:opacity-70 focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none",
                          borderMuted
                        )}
                      >
                        →
                      </button>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeArtifact.id}
                      initial={
                        prefersReducedMotion ? false : { opacity: 0, y: 6 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      exit={
                        prefersReducedMotion
                          ? undefined
                          : { opacity: 0, y: -6 }
                      }
                      transition={{ duration: 0.22, ease: EDITORIAL_EASE }}
                    >
                      <div className="mb-4 h-24 w-28 overflow-hidden rounded border border-black/10 dark:border-white/10">
                        {activeArtifact.render()}
                      </div>

                      <div className="mb-1.5 flex items-baseline justify-between gap-2">
                        <h3 className="text-[18px] font-medium tracking-[-0.02em]">
                          {activeArtifact.label}
                        </h3>
                        <span
                          className={cn(
                            "shrink-0 text-[12px] tabular-nums",
                            mutedText
                          )}
                        >
                          {activeArtifact.year}
                        </span>
                      </div>

                      <p
                        className={cn(
                          "mb-3 text-[11px] font-medium tracking-wide uppercase",
                          mutedText
                        )}
                      >
                        {activeArtifact.category}
                      </p>

                      <p
                        className={cn(
                          "text-[13.5px] leading-[1.55]",
                          mutedText
                        )}
                      >
                        {activeArtifact.note}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className={cn("border-t pt-5", borderMuted)}>
                  <p className={cn("text-[12.5px] leading-[1.55]", mutedText)}>
                    Hover or select any artifact in the grid to inspect how
                    ordinary builders reshaped the world around us.
                  </p>
                </div>
              </aside>
            )}
          </div>
        </div>
      </section>
    );
  }
);

CreativeGridPoster.displayName = "CreativeGridPoster";

export {
  CreativeGridPoster as component,
  CreativeGridPoster as Component,
};
export default CreativeGridPoster;