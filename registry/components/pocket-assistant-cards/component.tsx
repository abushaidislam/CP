"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type PocketTheme = "auto" | "light" | "dark";

export interface PocketAssistantCardsProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Headline displayed on the center top yellow pocket flap */
  headline?: string;
  /** Tagline displayed on the right bottom pink pocket flap */
  subheadline?: string;
  /** Enables hover peek, drag-to-pull, card shuffling, and in-card interactive tools */
  interactive?: boolean;
  /** Gently cycles a sequential peek animation across the three pocket cards */
  autoPeek?: boolean;
  /** Plays subtle synthesized Web Audio paper-slide and pocket-snap SFX on interaction */
  soundEnabled?: boolean;
  /** Color theme override ("auto" follows Tailwind dark: class) */
  theme?: PocketTheme;
  /** Controlled active (pulled-out) pocket index (0, 1, 2, or null) */
  activeIndex?: number | null;
  /** Callback fired when a user toggles a pocket card open or closed */
  onActiveIndexChange?: (index: number | null) => void;
}

/* -------------------------------------------------------------------------- */
/*  DATA MODELS FOR THE 3 MULTI-CARD POCKET DECKS (9 HAND-CRAFTED NOTES)      */
/* -------------------------------------------------------------------------- */

interface RecipeIngredient {
  id: string;
  amount: number;
  unit: string;
  name: string;
}

interface RecipeNote {
  id: string;
  date: string;
  prompt: string;
  title: string;
  sticker: "cake" | "ramen" | "matcha";
  ingredients: RecipeIngredient[];
}

interface RouteWaypoint {
  id: string;
  label: string;
  distance: string;
  duration: string;
  x: number;
  y: number;
}

interface TravelNote {
  id: string;
  date: string;
  prompt: string;
  routeTitle: string;
  startPoint: string;
  pathD: string;
  waypoints: RouteWaypoint[];
  steps: string[];
}

interface EssaySegment {
  tag: string;
  text: string;
}

interface EssayNote {
  id: string;
  date: string;
  prompt: string;
  title: string;
  sticker: "pages" | "letter" | "wave";
  tags: string[];
  segments: EssaySegment[];
}

const RECIPE_DECK: RecipeNote[] = [
  {
    id: "blueberry-cake",
    date: "Fri, 5 Jul",
    prompt:
      "I want to cook sugar free cake with blueberries, give me the best and easiest recipe",
    title: "Ingredients",
    sticker: "cake",
    ingredients: [
      { id: "almond", amount: 180, unit: "g", name: "almond flour" },
      { id: "coconut", amount: 60, unit: "g", name: "coconut flour" },
      { id: "apple", amount: 60, unit: "ml", name: "unsweetened applesauce" },
      { id: "milk", amount: 120, unit: "ml", name: "unsweetened almond milk" },
      { id: "eggs", amount: 3, unit: "", name: "large eggs" },
    ],
  },
  {
    id: "chili-ramen",
    date: "Sun, 7 Jul",
    prompt:
      "Quick 10-minute garlic chili ramen upgrade using pantry basics?",
    title: "Ingredients",
    sticker: "ramen",
    ingredients: [
      { id: "noodles", amount: 1, unit: "pack", name: "ramen noodles" },
      { id: "garlic", amount: 3, unit: "cloves", name: "minced garlic" },
      { id: "chili", amount: 15, unit: "ml", name: "crispy chili oil" },
      { id: "soy", amount: 15, unit: "ml", name: "low-sodium soy sauce" },
      { id: "egg", amount: 1, unit: "", name: "soft-boiled egg" },
    ],
  },
  {
    id: "iced-matcha",
    date: "Thu, 11 Jul",
    prompt:
      "What is the cleanest iced oat matcha latte ratio without bitterness?",
    title: "Ingredients",
    sticker: "matcha",
    ingredients: [
      { id: "powder", amount: 3, unit: "g", name: "ceremonial matcha" },
      { id: "water", amount: 45, unit: "ml", name: "78°C warm water" },
      { id: "oat", amount: 160, unit: "ml", name: "barista oat milk" },
      { id: "maple", amount: 10, unit: "ml", name: "pure maple syrup" },
      { id: "ice", amount: 6, unit: "", name: "clear ice cubes" },
    ],
  },
];

const TRAVEL_DECK: TravelNote[] = [
  {
    id: "morskie-oko",
    date: "Tue, 9 Jul",
    prompt:
      "I want to explore Tatry in Poland. Plan me a route for beginners",
    routeTitle: "Route: Morskie Oko",
    startPoint: "Start point: Zakopane",
    pathD: "M22 32 C 38 14, 58 14, 74 27 S 108 38, 126 24 S 146 16, 158 23",
    waypoints: [
      { id: "w1", label: "Zakopane", distance: "0 km", duration: "Start", x: 22, y: 32 },
      { id: "w2", label: "Palenica", distance: "25 km", duration: "35m bus", x: 92, y: 30 },
      { id: "w3", label: "Morskie Oko", distance: "8.5 km", duration: "2h walk", x: 158, y: 23 },
    ],
    steps: [
      "Take a bus or drive to Palenica Białczańska parking lot (25 km from Zakopane)",
      "Follow the scenic paved trail to Morskie Oko glacial lake",
    ],
  },
  {
    id: "kyoto-path",
    date: "Sat, 13 Jul",
    prompt:
      "Give me a peaceful morning walking route in Kyoto away from crowds",
    routeTitle: "Route: Philosopher's Path",
    startPoint: "Start point: Ginkaku-ji",
    pathD: "M22 24 C 46 38, 68 34, 92 22 S 134 14, 158 30",
    waypoints: [
      { id: "k1", label: "Ginkaku-ji", distance: "0 km", duration: "7:30 AM", x: 22, y: 24 },
      { id: "k2", label: "Canal Walk", distance: "1.2 km", duration: "20m stroll", x: 92, y: 22 },
      { id: "k3", label: "Nanzen-ji", distance: "2.1 km", duration: "40m total", x: 158, y: 30 },
    ],
    steps: [
      "Begin at Silver Pavilion before 8 AM and follow the stone canal south",
      "Stop by Honen-in mossy gate before finishing at Nanzen-ji aqueduct",
    ],
  },
  {
    id: "lisbon-loop",
    date: "Mon, 15 Jul",
    prompt:
      "Plan a sunset scenic loop through historic Alfama in Lisbon",
    routeTitle: "Route: Alfama Ridge",
    startPoint: "Start point: Martim Moniz",
    pathD: "M22 34 C 44 26, 62 12, 92 18 S 132 36, 158 18",
    waypoints: [
      { id: "l1", label: "Martim Moniz", distance: "0 km", duration: "Tram 28", x: 22, y: 34 },
      { id: "l2", label: "Santa Luzia", distance: "1.6 km", duration: "15m ride", x: 92, y: 18 },
      { id: "l3", label: "São Jorge", distance: "2.4 km", duration: "Sunset", x: 158, y: 18 },
    ],
    steps: [
      "Board vintage Tram 28 or walk uphill past tiled alleys to Miradouro de Santa Luzia",
      "Continue 10 minutes up to Castelo de São Jorge for river views",
    ],
  },
];

const ESSAY_DECK: EssayNote[] = [
  {
    id: "cheetah-essay",
    date: "Wed, 10 Jul",
    prompt: "Can you give me an example of essay using this structure?",
    title: "The world of cheetah",
    sticker: "pages",
    tags: ["Hook", "Fact", "Impact"],
    segments: [
      {
        tag: "Hook",
        text: "Cheetahs are one of the most extraordinary animals in the world.",
      },
      {
        tag: "Fact",
        text: " Known for their incredible speed, these big cats can run faster than any other land animal.",
      },
      {
        tag: "Impact",
        text: "They can reach speeds of up to 60 miles per hour in just a few seconds. This makes them the fastest runners on the planet.",
      },
    ],
  },
  {
    id: "founder-intro",
    date: "Fri, 12 Jul",
    prompt: "Draft a crisp 3-sentence cold intro email for a design partner",
    title: "Design partner note",
    sticker: "letter",
    tags: ["Hook", "Proof", "CTA"],
    segments: [
      {
        tag: "Hook",
        text: "Loved your breakdown of onboarding friction on Tuesday.",
      },
      {
        tag: "Proof",
        text: " We built a lightweight flow engine that cut drop-off by 31% for three seed teams last month.",
      },
      {
        tag: "CTA",
        text: "Open to a 12-minute walkthrough on Thursday afternoon to see if it fits your Q3 roadmap?",
      },
    ],
  },
  {
    id: "quantum-eli5",
    date: "Tue, 16 Jul",
    prompt: "Explain quantum tunneling clearly for a short study card",
    title: "Quantum tunneling",
    sticker: "wave",
    tags: ["Analogy", "Rule", "Result"],
    segments: [
      {
        tag: "Analogy",
        text: "Imagine rolling a ball toward a hill too tall for it to climb.",
      },
      {
        tag: "Rule",
        text: " At the atomic scale, particles behave like probability waves that don't stop sharply at a barrier.",
      },
      {
        tag: "Result",
        text: "A small part of the wave leaks through, letting particles appear on the other side—powering flash memory and fusion in stars.",
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  MOTION & WEB AUDIO TACTILE SFX HELPERS                                    */
/* -------------------------------------------------------------------------- */

const SPRING_CARD = {
  type: "spring" as const,
  stiffness: 340,
  damping: 28,
  mass: 0.85,
};

function usePocketAudio(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      ctxRef.current = new AudioCtx();
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume().catch(() => {});
    }
    return ctxRef.current;
  }, []);

  const playSound = useCallback(
    (kind: "slide" | "snap" | "tick") => {
      if (!enabled) return;
      const ctx = getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      if (kind === "tick") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(640, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.045);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.055);
        return;
      }

      const duration = kind === "slide" ? 0.13 : 0.075;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(kind === "slide" ? 1350 : 620, now);
      filter.frequency.exponentialRampToValueAtTime(
        kind === "slide" ? 2100 : 280,
        now + duration
      );
      filter.Q.value = kind === "slide" ? 1.4 : 2.0;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(kind === "slide" ? 0.07 : 0.09, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + duration + 0.01);
    },
    [enabled, getContext]
  );

  useEffect(() => {
    return () => {
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {});
        ctxRef.current = null;
      }
    };
  }, []);

  return playSound;
}

/* -------------------------------------------------------------------------- */
/*  BESPOKE SVG ILLUSTRATIONS & STITCH OVERLAY                                */
/* -------------------------------------------------------------------------- */

function StitchOverlay({
  className,
  radius = 11,
}: {
  className?: string;
  radius?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-[6px] h-[calc(100%-12px)] w-[calc(100%-12px)] overflow-visible",
        className
      )}
    >
      <rect
        x="0.75"
        y="0.75"
        width="calc(100% - 1.5px)"
        height="calc(100% - 1.5px)"
        rx={radius}
        ry={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="6 5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BrandEmblemSvg({
  className,
  strokeColor = "currentColor",
  fillColor = "currentColor",
}: {
  className?: string;
  strokeColor?: string;
  fillColor?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 40"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle
        cx="22"
        cy="20"
        r="12"
        fill={fillColor}
        fillOpacity="0.32"
        stroke={strokeColor}
        strokeWidth="2.5"
      />
      <circle
        cx="32"
        cy="20"
        r="14.5"
        fill="none"
        stroke={strokeColor}
        strokeWidth="3.5"
      />
      <circle
        cx="42"
        cy="20"
        r="12"
        fill={fillColor}
        fillOpacity="0.32"
        stroke={strokeColor}
        strokeWidth="2.5"
      />
      <circle cx="32" cy="20" r="5" fill={fillColor} />
    </svg>
  );
}

function MiniAvatarBadge({ accent }: { accent: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-black/10 bg-[#2A1D2E] shadow-xs"
    >
      <svg viewBox="0 0 18 18" className="h-full w-full">
        <rect width="18" height="18" fill="#2A1D2E" />
        <circle cx="9" cy="6.8" r="3" fill={accent} />
        <path
          d="M3.5 16.5c.8-3.1 2.9-4.7 5.5-4.7s4.7 1.6 5.5 4.7"
          fill={accent}
          fillOpacity="0.85"
        />
      </svg>
    </span>
  );
}

function CulinarySticker({
  kind,
  uid,
}: {
  kind: RecipeNote["sticker"];
  uid: string;
}) {
  return (
    <div
      aria-hidden="true"
      className="h-[44px] w-[44px] shrink-0 rotate-[3deg] overflow-hidden rounded-[8px] border-2 border-white bg-[#233142] shadow-[0_6px_14px_rgba(74,29,94,0.22)]"
    >
      {kind === "cake" && (
        <svg viewBox="0 0 48 48" className="h-full w-full">
          <defs>
            <linearGradient id={`${uid}-cake-bg`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3B4D61" />
              <stop offset="100%" stopColor="#1B2532" />
            </linearGradient>
          </defs>
          <rect width="48" height="48" fill={`url(#${uid}-cake-bg)`} />
          <ellipse cx="24" cy="39" rx="18" ry="4.5" fill="#E8ECF2" />
          <rect x="11" y="22" width="26" height="15" rx="4" fill="#F2CFA0" />
          <path
            d="M11 24c0-3 2.5-5 5.5-5h15c3 0 5.5 2 5.5 5v2c-2 0-2.5 2.5-4.5 2.5s-2.5-2.5-4.5-2.5-2.5 3-4.5 3-2.5-3-4.5-3-2.5 2-4.5 2-2.5-2-3.5-2v-2z"
            fill="#FFF7EE"
          />
          <circle cx="18" cy="18" r="3" fill="#3B4CCA" />
          <circle cx="24.5" cy="16.5" r="3.4" fill="#2E3BA8" />
          <circle cx="30.5" cy="18.5" r="2.8" fill="#4658D6" />
          <circle cx="21" cy="20" r="2.2" fill="#222C82" />
          <circle cx="27.5" cy="20" r="2.3" fill="#3343B8" />
          <circle cx="23.5" cy="15.5" r="0.9" fill="#9BB0FF" />
        </svg>
      )}
      {kind === "ramen" && (
        <svg viewBox="0 0 48 48" className="h-full w-full">
          <rect width="48" height="48" fill="#2B1C24" />
          <path d="M16 14c0-3 2-4 2-6M24 13c0-3 2-4 2-6M32 14c0-3 2-4 2-6" stroke="#FFD6C2" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          <path d="M8 24h32c0 9-6.5 15-16 15S8 33 8 24z" fill="#FF5637" />
          <ellipse cx="24" cy="24" rx="16" ry="4.5" fill="#F7B267" />
          <circle cx="19" cy="24" r="3.8" fill="#FFF8EC" />
          <circle cx="19" cy="24" r="2" fill="#F29E38" />
          <path d="M25 22c3-1 6 0 9 2" stroke="#5EA352" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )}
      {kind === "matcha" && (
        <svg viewBox="0 0 48 48" className="h-full w-full">
          <rect width="48" height="48" fill="#1E2B24" />
          <rect x="14" y="13" width="20" height="26" rx="4" fill="#F4EDE1" />
          <rect x="16" y="16" width="16" height="10" rx="2" fill="#6BB359" />
          <rect x="16" y="26" width="16" height="11" rx="2" fill="#EADBC8" />
          <rect x="26" y="7" width="2.8" height="14" rx="1.4" fill="#E3F2DD" />
          <rect x="18" y="18" width="4" height="4" rx="1" fill="#A6DC96" fillOpacity="0.8" />
        </svg>
      )}
    </div>
  );
}

function InteractiveTrailMap({
  note,
  uid,
  activeWaypointId,
  onSelectWaypoint,
  interactive,
  prefersReducedMotion,
}: {
  note: TravelNote;
  uid: string;
  activeWaypointId: string;
  onSelectWaypoint: (id: string) => void;
  interactive: boolean;
  prefersReducedMotion: boolean | null;
}) {
  const activeWp =
    note.waypoints.find((w) => w.id === activeWaypointId) ?? note.waypoints[2];

  return (
    <div className="relative overflow-hidden rounded-[8px] border border-[#E7D48C] bg-[#FFF8DB]">
      <svg viewBox="0 0 180 48" className="block h-[46px] w-full">
        <defs>
          <linearGradient id={`${uid}-map-${note.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFBEF" />
            <stop offset="100%" stopColor="#F8ECC1" />
          </linearGradient>
        </defs>
        <rect width="180" height="48" fill={`url(#${uid}-map-${note.id})`} />
        <path
          d="M12 36c8-12 22-22 38-18s24 12 38 10 22-16 38-14 32 8 40 22v12H12V36z"
          fill="#E2EED6"
          fillOpacity="0.85"
        />
        <ellipse cx="92" cy="28" rx="18" ry="10" fill="#D2E6C5" />
        <ellipse cx="144" cy="26" rx="15" ry="11" fill="#CBE2DC" />

        <motion.path
          key={note.id}
          d={note.pathD}
          fill="none"
          stroke="#C84664"
          strokeWidth="2"
          strokeDasharray="3.5 3"
          strokeLinecap="round"
          initial={prefersReducedMotion ? false : { opacity: 0.35 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45 }}
        />

        {note.waypoints.map((wp) => {
          const isSelected = wp.id === activeWp.id;
          return (
            <g
              key={wp.id}
              onClick={(e) => {
                if (!interactive) return;
                e.stopPropagation();
                onSelectWaypoint(wp.id);
              }}
              className={interactive ? "cursor-pointer" : undefined}
            >
              {isSelected && (
                <circle
                  cx={wp.x}
                  cy={wp.y}
                  r="6.5"
                  fill="#E83A76"
                  fillOpacity="0.22"
                />
              )}
              <circle
                cx={wp.x}
                cy={wp.y}
                r={isSelected ? 4 : 3}
                fill={isSelected ? "#E83A76" : "#C84664"}
                stroke="#FFFFFF"
                strokeWidth="1.3"
              />
              {isSelected && (
                <circle cx={wp.x} cy={wp.y} r="1.4" fill="#FFFFFF" />
              )}
            </g>
          );
        })}
      </svg>

      <div className="flex items-center justify-between border-t border-[#E7D48C]/70 bg-[#FFF4C2]/90 px-2 py-0.5 text-[8px] font-semibold text-[#5A2D46] tabular-nums">
        <span className="truncate">{activeWp.label}</span>
        <span>
          {activeWp.distance} · {activeWp.duration}
        </span>
      </div>
    </div>
  );
}

function EssaySticker({ kind }: { kind: EssayNote["sticker"] }) {
  if (kind === "letter") {
    return (
      <div aria-hidden="true" className="relative h-[48px] w-[52px] shrink-0">
        <div className="absolute inset-0 rotate-[6deg] rounded-[6px] border-2 border-white bg-[#F6EDFC] shadow-[0_6px_14px_rgba(74,29,94,0.2)]">
          <svg viewBox="0 0 52 44" className="h-full w-full">
            <path d="M4 6l22 17L48 6" fill="none" stroke="#9A59D1" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="26" cy="23" r="5" fill="#FF6EFB" />
          </svg>
        </div>
      </div>
    );
  }
  if (kind === "wave") {
    return (
      <div aria-hidden="true" className="relative h-[48px] w-[52px] shrink-0">
        <div className="absolute inset-0 -rotate-[4deg] rounded-[6px] border-2 border-white bg-[#28153B] p-1.5 shadow-[0_6px_14px_rgba(74,29,94,0.22)]">
          <svg viewBox="0 0 44 36" className="h-full w-full">
            <rect x="20" y="3" width="5" height="30" rx="1.5" fill="#E4BEF7" fillOpacity="0.35" />
            <path d="M2 18 Q 7 4, 12 18 T 22 18 T 32 18 T 42 18" fill="none" stroke="#FF6EFB" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    );
  }
  return (
    <div aria-hidden="true" className="relative h-[50px] w-[54px] shrink-0">
      <div className="absolute left-0 top-0.5 h-[42px] w-[32px] -rotate-[8deg] rounded-[5px] border border-white bg-[#EFE9F5] p-1.5 shadow-[0_4px_10px_rgba(74,29,94,0.18)]">
        <div className="mb-1 h-1.5 w-4/5 rounded-full bg-[#B7A6C8]" />
        <div className="mb-1 h-1 w-full rounded-full bg-[#D3C6E0]" />
        <div className="mb-1 h-1 w-3/4 rounded-full bg-[#D3C6E0]" />
        <div className="h-1 w-5/6 rounded-full bg-[#D3C6E0]" />
      </div>
      <div className="absolute bottom-0 right-0 h-[44px] w-[34px] rotate-[10deg] rounded-[5px] border border-white bg-[#FAF7FC] p-1.5 shadow-[0_6px_14px_rgba(74,29,94,0.22)]">
        <div className="mb-1 h-1.5 w-3/4 rounded-full bg-[#9D85B5]" />
        <div className="mb-1 h-1 w-full rounded-full bg-[#CFC2DC]" />
        <div className="mb-1 h-1 w-full rounded-full bg-[#CFC2DC]" />
        <div className="mb-1 h-1 w-4/5 rounded-full bg-[#CFC2DC]" />
        <div className="h-1 w-2/3 rounded-full bg-[#CFC2DC]" />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  DECK COUNTER / SHUFFLE PILL ON EACH POCKET FLAP                           */
/* -------------------------------------------------------------------------- */

function DeckCyclePill({
  index,
  total,
  onNext,
  tone,
  label,
}: {
  index: number;
  total: number;
  onNext: () => void;
  tone: "coral" | "lavender" | "pink";
  label: string;
}) {
  const toneClass =
    tone === "coral"
      ? "bg-[#D93D20]/85 text-[#FFF2EE] hover:bg-[#B83017] border-[#FFA290]/40"
      : tone === "pink"
      ? "bg-[#C82FC7]/80 text-white hover:bg-[#A621A5] border-white/35"
      : "bg-[#6C2E9B]/15 text-[#4E236D] hover:bg-[#6C2E9B]/25 border-[#6C2E9B]/25 dark:bg-white/10 dark:text-[#EAD8FF] dark:hover:bg-white/20 dark:border-white/20";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onNext();
      }}
      aria-label={label}
      className={cn(
        "pointer-events-auto absolute bottom-3 right-3 z-30 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9.5px] font-bold tracking-tight tabular-nums backdrop-blur-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white",
        toneClass
      )}
    >
      <span>
        {index + 1}/{total}
      </span>
      <svg
        viewBox="0 0 12 12"
        className="h-2.5 w-2.5"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4.5 2.5L8 6L4.5 9.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  MAIN COMPONENT                                                            */
/* -------------------------------------------------------------------------- */

const PocketAssistantCards = React.forwardRef<
  HTMLDivElement,
  PocketAssistantCardsProps
>(
  (
    {
      headline = "I'm always in your pocket",
      subheadline = "Wherever you are",
      interactive = true,
      autoPeek = false,
      soundEnabled = false,
      theme = "auto",
      activeIndex: controlledActiveIndex,
      onActiveIndexChange,
      className,
      ...rest
    },
    ref
  ) => {
    const rawId = useId();
    const uid = rawId.replace(/:/g, "");
    const prefersReducedMotion = useReducedMotion();
    const playSound = usePocketAudio(soundEnabled);

    const [uncontrolledActive, setUncontrolledActive] = useState<number | null>(
      null
    );
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [autoPeekIndex, setAutoPeekIndex] = useState<number | null>(null);

    const [recipeIdx, setRecipeIdx] = useState(0);
    const [travelIdx, setTravelIdx] = useState(0);
    const [essayIdx, setEssayIdx] = useState(0);

    const [servingScale, setServingScale] = useState<1 | 2>(1);
    const [checkedIngredients, setCheckedIngredients] = useState<
      Record<string, boolean>
    >({});
    const [selectedWaypoints, setSelectedWaypoints] = useState<
      Record<string, string>
    >({});
    const [highlightedTag, setHighlightedTag] = useState<string | null>(null);

    const activeIndex =
      controlledActiveIndex !== undefined
        ? controlledActiveIndex
        : uncontrolledActive;

    const setActiveIndex = useCallback(
      (next: number | null) => {
        if (controlledActiveIndex === undefined) {
          setUncontrolledActive(next);
        }
        onActiveIndexChange?.(next);
      },
      [controlledActiveIndex, onActiveIndexChange]
    );

    useEffect(() => {
      if (activeIndex === null) return;
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          playSound("snap");
          setActiveIndex(null);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activeIndex, playSound, setActiveIndex]);

    useEffect(() => {
      if (
        !autoPeek ||
        prefersReducedMotion ||
        activeIndex !== null ||
        hoveredIndex !== null
      ) {
        setAutoPeekIndex(null);
        return;
      }
      let current = 0;
      setAutoPeekIndex(0);
      const timer = window.setInterval(() => {
        current = (current + 1) % 3;
        setAutoPeekIndex(current);
      }, 2400);
      return () => window.clearInterval(timer);
    }, [autoPeek, prefersReducedMotion, activeIndex, hoveredIndex]);

    const toggleCard = (idx: number) => {
      if (!interactive) return;
      const opening = activeIndex !== idx;
      playSound(opening ? "slide" : "snap");
      setActiveIndex(opening ? idx : null);
    };

    const handleCardDragEnd = (
      idx: number,
      _event: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo
    ) => {
      if (!interactive) return;
      if (info.offset.y < -28 || info.velocity.y < -220) {
        if (activeIndex !== idx) {
          playSound("slide");
          setActiveIndex(idx);
        }
      } else if (info.offset.y > 24 || info.velocity.y > 220) {
        if (activeIndex === idx) {
          playSound("snap");
          setActiveIndex(null);
        }
      }
    };

    const isForcedDark = theme === "dark";
    const isForcedLight = theme === "light";

    const frameBorderClass = isForcedDark
      ? "border-[#A56CE6] bg-[#28183A]"
      : isForcedLight
      ? "border-[#6C2E9B] bg-[#FCEBFF]"
      : "border-[#6C2E9B] bg-[#FCEBFF] dark:border-[#A56CE6] dark:bg-[#28183A]";

    const centerFrameClass = isForcedDark
      ? "border-[#A56CE6] bg-[#361D52]"
      : isForcedLight
      ? "border-[#6C2E9B] bg-[#6C2E9B]"
      : "border-[#6C2E9B] bg-[#6C2E9B] dark:border-[#A56CE6] dark:bg-[#361D52]";

    const lavenderFlapBgClass = isForcedDark
      ? "bg-[#3C2459] ring-1 ring-inset ring-white/10"
      : isForcedLight
      ? "bg-[#FCEBFF]"
      : "bg-[#FCEBFF] dark:bg-[#3C2459] dark:ring-1 dark:ring-inset dark:ring-white/10";

    const stitchColorClass = isForcedDark
      ? "text-[#A777DE]/70"
      : isForcedLight
      ? "text-[#DFB9EB]"
      : "text-[#DFB9EB] dark:text-[#A777DE]/70";

    const getCardMotion = (idx: number, baseRotate: number) => {
      const isExpanded = interactive && activeIndex === idx;
      const isHovered = interactive && hoveredIndex === idx;
      const isAutoPeeking = autoPeekIndex === idx;

      if (prefersReducedMotion) {
        return {
          y: isExpanded ? -30 : 0,
          rotate: isExpanded ? 0 : baseRotate,
          scale: isExpanded ? 1.03 : 1,
        };
      }

      if (isExpanded) {
        return {
          y: -46,
          rotate: 0,
          scale: 1.05,
        };
      }
      if (isHovered) {
        return {
          y: -22,
          rotate: baseRotate * 0.35,
          scale: 1.02,
        };
      }
      if (isAutoPeeking) {
        return {
          y: -16,
          rotate: baseRotate * 0.55,
          scale: 1.015,
        };
      }
      return {
        y: 0,
        rotate: baseRotate,
        scale: 1,
      };
    };

    const currentRecipe = RECIPE_DECK[recipeIdx];
    const currentTravel = TRAVEL_DECK[travelIdx];
    const currentEssay = ESSAY_DECK[essayIdx];

    const headlineLines = headline.split("\n");
    const subheadlineLines = subheadline.split("\n");

    return (
      <div
        ref={ref}
        role="region"
        aria-label="Pocket AI assistant showcase cards"
        className={cn(
          "mx-auto w-full max-w-[850px] select-none py-8",
          className
        )}
        style={{
          fontFamily:
            "'Plus Jakarta Sans', 'Satoshi', 'Inter', ui-sans-serif, system-ui, sans-serif",
        }}
        {...rest}
      >
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
          {/* COLUMN 1: CULINARY / RECIPE POCKET DECK */}
          <div
            className={cn(
              "relative h-[432px] rounded-[20px] border-[3px] transition-shadow duration-200",
              frameBorderClass,
              activeIndex === 0 ? "z-30" : hoveredIndex === 0 ? "z-20" : "z-10"
            )}
            onMouseEnter={() => interactive && setHoveredIndex(0)}
            onMouseLeave={() => interactive && setHoveredIndex(null)}
          >
            <div className="pointer-events-none absolute inset-x-[3px] top-[3px] h-[168px]">
              <StitchOverlay className={stitchColorClass} radius={11} />
            </div>

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-[2px] top-[36px] z-0 h-[120px] -rotate-[4deg] rounded-[14px] border-2 border-white/80 bg-[#FBE2DF] opacity-80 shadow-xs"
            />

            <div
              className={cn(
                "absolute inset-x-[-6px] top-[42px]",
                activeIndex === 0 ? "z-40" : "z-10"
              )}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.article
                  key={currentRecipe.id}
                  role="button"
                  tabIndex={interactive ? 0 : -1}
                  aria-expanded={activeIndex === 0}
                  aria-label={`${currentRecipe.title} recipe note, ${currentRecipe.date}. Click or drag up to pull out of pocket.`}
                  drag={interactive && !prefersReducedMotion ? "y" : false}
                  dragConstraints={{ top: -82, bottom: 14 }}
                  dragElastic={0.18}
                  dragSnapToOrigin
                  onDragEnd={(e, info) => handleCardDragEnd(0, e, info)}
                  onClick={() => toggleCard(0)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleCard(0);
                    }
                  }}
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 28, rotate: -10, scale: 0.96 }
                  }
                  animate={{
                    opacity: 1,
                    ...getCardMotion(0, -7.5),
                  }}
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 36, rotate: -12, scale: 0.94 }
                  }
                  transition={SPRING_CARD}
                  className={cn(
                    "overflow-hidden rounded-[15px] border-[2.5px] border-white bg-[#FCEAE8] text-[#351842] shadow-[0_14px_30px_-10px_rgba(108,46,155,0.28)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5637]",
                    interactive && "cursor-grab active:cursor-grabbing"
                  )}
                >
                  <div className="flex items-center justify-between px-3 pt-2 pb-1.5">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FFD3C8] py-0.5 pl-0.5 pr-2.5">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#FF5637] text-white">
                        <BrandEmblemSvg
                          className="h-2.5 w-3.5"
                          strokeColor="#FFFFFF"
                          fillColor="#FFFFFF"
                        />
                      </span>
                      <span className="tabular-nums text-[10px] font-semibold tracking-tight text-[#4D1E57]">
                        {currentRecipe.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {interactive && activeIndex === 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playSound("tick");
                            setServingScale((s) => (s === 1 ? 2 : 1));
                          }}
                          aria-label={`Toggle serving multiplier, currently ${servingScale}x`}
                          className="rounded-full bg-[#FF5637] px-1.5 py-0.5 text-[8.5px] font-bold text-white tabular-nums transition-transform hover:scale-105"
                        >
                          {servingScale}x
                        </button>
                      )}
                      <MiniAvatarBadge accent="#FFB59E" />
                    </div>
                  </div>

                  <div className="flex justify-end px-3 pb-2">
                    <div className="max-w-[84%] rounded-[10px] rounded-tr-[4px] bg-white px-2.5 py-1.5 text-[9.5px] leading-[1.34] font-medium text-[#351842] shadow-[0_2px_8px_rgba(108,46,155,0.06)]">
                      {currentRecipe.prompt}
                    </div>
                  </div>

                  <div className="relative bg-[#FFD2CD] px-3 pt-2 pb-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <h3 className="text-[10.5px] font-bold tracking-tight text-[#351842]">
                            {currentRecipe.title}
                          </h3>
                          {interactive && activeIndex === 0 && (
                            <span className="text-[8px] font-semibold text-[#7A3530]">
                              Tap to check
                            </span>
                          )}
                        </div>
                        <ul className="space-y-0.5 tabular-nums text-[9px] leading-[1.35] font-medium text-[#472152]">
                          {currentRecipe.ingredients.map((item) => {
                            const key = `${currentRecipe.id}-${item.id}`;
                            const isChecked = Boolean(checkedIngredients[key]);
                            const scaled = item.amount * servingScale;
                            const labelText = item.unit
                              ? `${scaled} ${item.unit} ${item.name}`
                              : `${scaled} ${item.name}`;
                            return (
                              <li key={item.id}>
                                <button
                                  type="button"
                                  disabled={!interactive || activeIndex !== 0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playSound("tick");
                                    setCheckedIngredients((prev) => ({
                                      ...prev,
                                      [key]: !prev[key],
                                    }));
                                  }}
                                  className={cn(
                                    "flex w-full items-center gap-1.5 text-left transition-opacity",
                                    isChecked && "line-through opacity-55",
                                    interactive &&
                                      activeIndex === 0 &&
                                      "cursor-pointer hover:opacity-80"
                                  )}
                                >
                                  <span
                                    aria-hidden="true"
                                    className={cn(
                                      "inline-flex h-2 w-2 shrink-0 items-center justify-center rounded-[2px] transition-colors",
                                      isChecked
                                        ? "bg-[#4D1E57]"
                                        : "bg-[#E56B55]"
                                    )}
                                  />
                                  <span className="truncate">{labelText}</span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      <CulinarySticker kind={currentRecipe.sticker} uid={uid} />
                    </div>
                  </div>
                </motion.article>
              </AnimatePresence>
            </div>

            <div
              onClick={() => toggleCard(0)}
              className={cn(
                "absolute inset-x-[3px] bottom-[3px] z-20 flex h-[148px] items-center justify-center rounded-[15px] bg-[#FF5637] shadow-[0_-6px_16px_rgba(108,46,155,0.16)]",
                interactive && "cursor-pointer"
              )}
            >
              <StitchOverlay className="text-[#FFA290]/90" radius={10} />
              <BrandEmblemSvg
                className="relative z-10 h-10 w-16 text-[#FFD8CE]"
                strokeColor="#FFD8CE"
                fillColor="#FFD8CE"
              />
              {interactive && (
                <DeckCyclePill
                  index={recipeIdx}
                  total={RECIPE_DECK.length}
                  tone="coral"
                  label="Next recipe card"
                  onNext={() => {
                    playSound("slide");
                    setRecipeIdx((i) => (i + 1) % RECIPE_DECK.length);
                  }}
                />
              )}
            </div>
          </div>

          {/* COLUMN 2: TRAVEL ROUTE PLANNER POCKET DECK */}
          <div
            className={cn(
              "relative h-[432px] rounded-[20px] border-[3px] transition-shadow duration-200",
              centerFrameClass,
              activeIndex === 1 ? "z-30" : hoveredIndex === 1 ? "z-20" : "z-10"
            )}
            onMouseEnter={() => interactive && setHoveredIndex(1)}
            onMouseLeave={() => interactive && setHoveredIndex(null)}
          >
            <div
              onClick={() => toggleCard(1)}
              className={cn(
                "absolute inset-x-[3px] top-[3px] z-10 flex h-[132px] items-center justify-center rounded-[15px] bg-[#FCEB5E] px-5 text-center",
                interactive && "cursor-pointer"
              )}
            >
              <StitchOverlay className="text-[#D2BA2E]/90" radius={10} />
              <p className="relative z-10 max-w-[165px] -translate-y-1 text-balance text-[20px] leading-[1.18] font-bold tracking-[-0.02em] text-[#4E236D]">
                {headlineLines.map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i < headlineLines.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </p>
            </div>

            <div
              className={cn(
                "absolute inset-x-[-6px] top-[116px]",
                activeIndex === 1 ? "z-40" : "z-20"
              )}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.article
                  key={currentTravel.id}
                  role="button"
                  tabIndex={interactive ? 0 : -1}
                  aria-expanded={activeIndex === 1}
                  aria-label={`${currentTravel.routeTitle}, ${currentTravel.date}. Click or drag up to pull out of pocket.`}
                  drag={interactive && !prefersReducedMotion ? "y" : false}
                  dragConstraints={{ top: -82, bottom: 14 }}
                  dragElastic={0.18}
                  dragSnapToOrigin
                  onDragEnd={(e, info) => handleCardDragEnd(1, e, info)}
                  onClick={() => toggleCard(1)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleCard(1);
                    }
                  }}
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 28, rotate: 10, scale: 0.96 }
                  }
                  animate={{
                    opacity: 1,
                    ...getCardMotion(1, 7.5),
                  }}
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 36, rotate: 12, scale: 0.94 }
                  }
                  transition={SPRING_CARD}
                  className={cn(
                    "overflow-hidden rounded-[15px] border-[2.5px] border-white bg-[#FEF6C7] text-[#351842] shadow-[0_14px_30px_-10px_rgba(108,46,155,0.3)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FCEB5E]",
                    interactive && "cursor-grab active:cursor-grabbing"
                  )}
                >
                  <div className="flex items-center justify-between px-3 pt-2 pb-1.5">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FFE29A] py-0.5 pl-0.5 pr-2.5">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#E83A76] text-white">
                        <BrandEmblemSvg
                          className="h-2.5 w-3.5"
                          strokeColor="#FFFFFF"
                          fillColor="#FFFFFF"
                        />
                      </span>
                      <span className="tabular-nums text-[10px] font-semibold tracking-tight text-[#4D1E57]">
                        {currentTravel.date}
                      </span>
                    </div>
                    <MiniAvatarBadge accent="#FCE37D" />
                  </div>

                  <div className="flex justify-end px-3 pb-1.5">
                    <div className="max-w-[84%] rounded-[10px] rounded-tr-[4px] bg-white px-2.5 py-1.5 text-[9.5px] leading-[1.32] font-medium text-[#351842] shadow-[0_2px_8px_rgba(108,46,155,0.06)]">
                      {currentTravel.prompt}
                    </div>
                  </div>

                  <div className="bg-[#FCE37D] px-3 pt-1.5 pb-3">
                    <InteractiveTrailMap
                      note={currentTravel}
                      uid={uid}
                      interactive={interactive && activeIndex === 1}
                      prefersReducedMotion={prefersReducedMotion}
                      activeWaypointId={
                        selectedWaypoints[currentTravel.id] ??
                        currentTravel.waypoints[2].id
                      }
                      onSelectWaypoint={(wpId) => {
                        playSound("tick");
                        setSelectedWaypoints((prev) => ({
                          ...prev,
                          [currentTravel.id]: wpId,
                        }));
                      }}
                    />
                    <div className="mt-1.5 flex items-baseline justify-between gap-2">
                      <div>
                        <h3 className="text-[10px] font-bold tracking-tight text-[#351842]">
                          {currentTravel.routeTitle}
                        </h3>
                        <p className="text-[8.5px] font-medium text-[#6B4A35]">
                          {currentTravel.startPoint}
                        </p>
                      </div>
                      {interactive && activeIndex === 1 && (
                        <span className="text-[7.5px] font-semibold text-[#7A3550]">
                          Tap pins
                        </span>
                      )}
                    </div>
                    <ol className="mt-1.5 space-y-1 tabular-nums text-[8.5px] leading-[1.28] font-medium text-[#472152]">
                      {currentTravel.steps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="mt-0.5 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[4px] bg-[#E83A76] text-[8px] font-bold text-white">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </motion.article>
              </AnimatePresence>
            </div>

            <div
              onClick={() => toggleCard(1)}
              className={cn(
                "absolute inset-x-[3px] bottom-[3px] z-30 h-[84px] rounded-[15px] shadow-[0_-6px_16px_rgba(24,10,42,0.22)]",
                lavenderFlapBgClass,
                interactive && "cursor-pointer"
              )}
            >
              <StitchOverlay className={stitchColorClass} radius={10} />
              {interactive && (
                <DeckCyclePill
                  index={travelIdx}
                  total={TRAVEL_DECK.length}
                  tone="lavender"
                  label="Next travel route card"
                  onNext={() => {
                    playSound("slide");
                    setTravelIdx((i) => (i + 1) % TRAVEL_DECK.length);
                  }}
                />
              )}
            </div>
          </div>

          {/* COLUMN 3: WRITING / STUDY ASSISTANT POCKET DECK */}
          <div
            className={cn(
              "relative h-[432px] rounded-[20px] border-[3px] transition-shadow duration-200",
              frameBorderClass,
              activeIndex === 2 ? "z-30" : hoveredIndex === 2 ? "z-20" : "z-10"
            )}
            onMouseEnter={() => interactive && setHoveredIndex(2)}
            onMouseLeave={() => interactive && setHoveredIndex(null)}
          >
            <div className="pointer-events-none absolute inset-x-[3px] top-[3px] h-[168px]">
              <StitchOverlay className={stitchColorClass} radius={11} />
            </div>

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-[2px] top-[56px] z-0 h-[120px] rotate-[2deg] rounded-[14px] border-2 border-white/80 bg-[#F3DAF8] opacity-80 shadow-xs"
            />

            <div
              className={cn(
                "absolute inset-x-[-6px] top-[62px]",
                activeIndex === 2 ? "z-40" : "z-10"
              )}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.article
                  key={currentEssay.id}
                  role="button"
                  tabIndex={interactive ? 0 : -1}
                  aria-expanded={activeIndex === 2}
                  aria-label={`${currentEssay.title} writing note, ${currentEssay.date}. Click or drag up to pull out of pocket.`}
                  drag={interactive && !prefersReducedMotion ? "y" : false}
                  dragConstraints={{ top: -82, bottom: 14 }}
                  dragElastic={0.18}
                  dragSnapToOrigin
                  onDragEnd={(e, info) => handleCardDragEnd(2, e, info)}
                  onClick={() => toggleCard(2)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleCard(2);
                    }
                  }}
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 28, rotate: 8, scale: 0.96 }
                  }
                  animate={{
                    opacity: 1,
                    ...getCardMotion(2, 4.5),
                  }}
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 36, rotate: 9, scale: 0.94 }
                  }
                  transition={SPRING_CARD}
                  className={cn(
                    "overflow-hidden rounded-[15px] border-[2.5px] border-white bg-[#F8E7FA] text-[#351842] shadow-[0_14px_30px_-10px_rgba(108,46,155,0.28)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6EFB]",
                    interactive && "cursor-grab active:cursor-grabbing"
                  )}
                >
                  <div className="flex items-center justify-between px-3 pt-2 pb-1.5">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EBB9F5] py-0.5 pl-0.5 pr-2.5">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#7A2CB5] text-white">
                        <BrandEmblemSvg
                          className="h-2.5 w-3.5"
                          strokeColor="#FFFFFF"
                          fillColor="#FFFFFF"
                        />
                      </span>
                      <span className="tabular-nums text-[10px] font-semibold tracking-tight text-[#4D1E57]">
                        {currentEssay.date}
                      </span>
                    </div>
                    <MiniAvatarBadge accent="#E4BEF7" />
                  </div>

                  <div className="flex justify-end px-3 pb-2">
                    <div className="max-w-[84%] rounded-[10px] rounded-tr-[4px] bg-white px-2.5 py-1.5 text-[9.5px] leading-[1.34] font-medium text-[#351842] shadow-[0_2px_8px_rgba(108,46,155,0.06)]">
                      {currentEssay.prompt}
                    </div>
                  </div>

                  <div className="relative bg-[#E4BEF7] px-3 pt-2 pb-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="mb-1 text-[10px] font-bold tracking-tight text-[#351842]">
                          {currentEssay.title}
                        </h3>
                        <p className="text-[8.8px] leading-[1.36] font-medium text-[#472152]">
                          {currentEssay.segments.slice(0, 2).map((seg) => {
                            const isLit = highlightedTag === seg.tag;
                            return (
                              <span
                                key={seg.tag}
                                className={cn(
                                  "rounded-[3px] transition-colors",
                                  isLit && "bg-white/90 px-0.5 text-[#351842]"
                                )}
                              >
                                {seg.text}
                              </span>
                            );
                          })}
                        </p>
                      </div>
                      <EssaySticker kind={currentEssay.sticker} />
                    </div>

                    <p className="mt-1.5 tabular-nums text-[8.8px] leading-[1.36] font-medium text-[#472152]">
                      <span
                        className={cn(
                          "rounded-[3px] transition-colors",
                          highlightedTag === currentEssay.segments[2].tag &&
                            "bg-white/90 px-0.5 text-[#351842]"
                        )}
                      >
                        {currentEssay.segments[2].text}
                      </span>
                    </p>

                    {interactive && activeIndex === 2 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        {currentEssay.tags.map((tag) => {
                          const active = highlightedTag === tag;
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                playSound("tick");
                                setHighlightedTag(active ? null : tag);
                              }}
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[8px] font-bold transition-colors",
                                active
                                  ? "bg-[#6C2E9B] text-white"
                                  : "bg-white/70 text-[#4D1E57] hover:bg-white"
                              )}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.article>
              </AnimatePresence>
            </div>

            <div
              onClick={() => toggleCard(2)}
              className={cn(
                "absolute inset-x-[3px] bottom-[3px] z-20 flex h-[112px] items-center justify-center rounded-[15px] bg-[#FF6EFB] px-5 text-center shadow-[0_-6px_16px_rgba(108,46,155,0.16)]",
                interactive && "cursor-pointer"
              )}
            >
              <StitchOverlay className="text-[#FFADF9]/90" radius={10} />
              <p className="relative z-10 max-w-[130px] text-balance text-[20px] leading-[1.18] font-bold tracking-[-0.02em] text-[#4E236D]">
                {subheadlineLines.map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i < subheadlineLines.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </p>
              {interactive && (
                <DeckCyclePill
                  index={essayIdx}
                  total={ESSAY_DECK.length}
                  tone="pink"
                  label="Next writing note card"
                  onNext={() => {
                    playSound("slide");
                    setHighlightedTag(null);
                    setEssayIdx((i) => (i + 1) % ESSAY_DECK.length);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

PocketAssistantCards.displayName = "PocketAssistantCards";

export {
  PocketAssistantCards,
  PocketAssistantCards as component,
  PocketAssistantCards as Component,
};
export default PocketAssistantCards;
