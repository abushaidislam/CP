"use client";

import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(" ");
}

export interface SpatialCardItem {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  imageAlt?: string;
  renderContent?: () => React.ReactNode;
}

export interface SpatialCardCarouselProps
  extends React.HTMLAttributes<HTMLDivElement> {
  items?: SpatialCardItem[];
  theme?: "light" | "dark";
  autoPlay?: boolean;
  interval?: number;
  pauseOnHover?: boolean;
  showControls?: boolean;
  initialIndex?: number;
  onActiveChange?: (index: number, item: SpatialCardItem) => void;
  ariaLabel?: string;
}

interface OrbitalSlot {
  xPct: number;
  yPct: number;
  scale: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  opacity: number;
  zIndex: number;
  blur: number;
}

const ORBITAL_SLOTS: OrbitalSlot[] = [
  // Slot 0: Hero focal center
  {
    xPct: 0,
    yPct: 0,
    scale: 1,
    rotateX: 0,
    rotateY: 0,
    rotateZ: 0,
    opacity: 1,
    zIndex: 40,
    blur: 0,
  },
  // Slot 1: Upper-left mid-ground
  {
    xPct: -78,
    yPct: -62,
    scale: 0.44,
    rotateX: 8,
    rotateY: 16,
    rotateZ: -4,
    opacity: 0.94,
    zIndex: 24,
    blur: 0,
  },
  // Slot 2: Lower-left foreground-ish satellite
  {
    xPct: -68,
    yPct: 76,
    scale: 0.46,
    rotateX: -6,
    rotateY: 14,
    rotateZ: 5,
    opacity: 0.96,
    zIndex: 28,
    blur: 0,
  },
  // Slot 3: Mid-right satellite
  {
    xPct: 96,
    yPct: 12,
    scale: 0.42,
    rotateX: 4,
    rotateY: -18,
    rotateZ: 3,
    opacity: 0.92,
    zIndex: 22,
    blur: 0,
  },
  // Slot 4: Upper-right satellite
  {
    xPct: 86,
    yPct: -66,
    scale: 0.38,
    rotateX: 10,
    rotateY: -15,
    rotateZ: 6,
    opacity: 0.88,
    zIndex: 18,
    blur: 0.3,
  },
  // Slot 5: Far-left middle
  {
    xPct: -118,
    yPct: 8,
    scale: 0.34,
    rotateX: -5,
    rotateY: 22,
    rotateZ: -6,
    opacity: 0.82,
    zIndex: 14,
    blur: 0.4,
  },
  // Slot 6: Lower-right satellite
  {
    xPct: 74,
    yPct: 84,
    scale: 0.4,
    rotateX: -8,
    rotateY: -14,
    rotateZ: -3,
    opacity: 0.9,
    zIndex: 20,
    blur: 0.2,
  },
  // Slot 7: Deep upper-center-left
  {
    xPct: -26,
    yPct: -102,
    scale: 0.28,
    rotateX: 12,
    rotateY: 8,
    rotateZ: -2,
    opacity: 0.72,
    zIndex: 10,
    blur: 0.8,
  },
  // Slot 8: Deep lower-center
  {
    xPct: 18,
    yPct: 108,
    scale: 0.3,
    rotateX: -10,
    rotateY: -8,
    rotateZ: 4,
    opacity: 0.75,
    zIndex: 12,
    blur: 0.6,
  },
  // Slot 9: Deep right-back
  {
    xPct: 126,
    yPct: -24,
    scale: 0.26,
    rotateX: 6,
    rotateY: -22,
    rotateZ: 8,
    opacity: 0.68,
    zIndex: 8,
    blur: 1,
  },
];

function getOrbitalSlot(offset: number, total: number): OrbitalSlot {
  if (offset === 0) return ORBITAL_SLOTS[0];
  if (offset < ORBITAL_SLOTS.length) return ORBITAL_SLOTS[offset];

  const angle = ((offset / Math.max(total, 1)) * Math.PI * 2) - Math.PI / 2;
  return {
    xPct: Math.cos(angle) * 110,
    yPct: Math.sin(angle) * 90,
    scale: 0.28,
    rotateX: 6,
    rotateY: Math.cos(angle) * -18,
    rotateZ: Math.sin(angle) * 5,
    opacity: 0.7,
    zIndex: 6,
    blur: 0.8,
  };
}

function createDefaultItems(uid: string): SpatialCardItem[] {
  return [
    {
      id: "silhouette-profile",
      title: "Monochrome Profile",
      subtitle: "Identity Study 01",
      renderContent: () => (
        <div className="relative h-full w-full overflow-hidden bg-[#C4C4C6]">
          <svg
            viewBox="0 0 320 400"
            className="h-full w-full"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id={`${uid}-sil-bg`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#D2D2D4" />
                <stop offset="100%" stopColor="#B5B5B8" />
              </linearGradient>
            </defs>
            <rect width="320" height="400" fill={`url(#${uid}-sil-bg)`} />
            <path
              d="M92 400 L92 315 C92 285 110 268 118 248 C114 236 104 222 100 202 C92 175 94 142 108 116 C122 90 150 74 182 76 C210 78 232 95 240 120 C244 134 242 146 248 156 C255 168 264 176 262 184 C260 190 251 193 251 199 C251 204 257 207 256 213 C255 218 249 221 249 226 C249 233 255 240 250 249 C244 259 226 263 212 264 C205 278 206 296 220 318 L254 400 Z"
              fill="#0A0A0B"
            />
            <path
              d="M196 105 C216 112 226 132 222 152"
              stroke="#262628"
              strokeWidth="2"
              fill="none"
              opacity="0.45"
            />
          </svg>
        </div>
      ),
    },
    {
      id: "acid-dot-cluster",
      title: "Organic Pulse Grid",
      subtitle: "System Pattern",
      renderContent: () => (
        <div className="relative flex h-full w-full items-center justify-center bg-[#D4F742] p-6">
          <svg
            viewBox="0 0 240 240"
            className="h-3/4 w-3/4"
            aria-hidden="true"
          >
            <circle cx="88" cy="74" r="14" fill="#10120B" />
            <circle cx="156" cy="86" r="24" fill="#10120B" />
            <circle cx="52" cy="116" r="9" fill="#10120B" />
            <circle cx="102" cy="126" r="14" fill="#10120B" />
            <circle cx="144" cy="144" r="14" fill="#10120B" />
            <circle cx="64" cy="166" r="15" fill="#10120B" />
            <circle cx="114" cy="176" r="9" fill="#10120B" />
            <circle cx="186" cy="136" r="8" fill="#10120B" />
          </svg>
        </div>
      ),
    },
    {
      id: "neon-hood-editorial",
      title: "Translucent Outerwear",
      subtitle: "Lookbook 02",
      renderContent: () => (
        <div className="relative h-full w-full overflow-hidden bg-[#D9D9D7]">
          <svg
            viewBox="0 0 320 400"
            className="h-full w-full"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id={`${uid}-hood`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#E5FA70" />
                <stop offset="55%" stopColor="#CBEF48" />
                <stop offset="100%" stopColor="#A9CE36" />
              </linearGradient>
            </defs>
            <rect width="320" height="400" fill="#DCDCD9" />
            {/* Hooded coat silhouette */}
            <path
              d="M65 400 L82 246 C86 212 104 190 112 162 C110 118 128 84 162 82 C196 80 218 112 216 158 C224 188 242 212 248 248 L266 400 Z"
              fill={`url(#${uid}-hood)`}
              stroke="#B6DA36"
              strokeWidth="2"
            />
            {/* Inner face & hair frame */}
            <ellipse cx="164" cy="154" rx="34" ry="44" fill="#DFC0AA" />
            <path
              d="M128 150 C128 112 198 112 198 150 C190 134 140 134 128 150 Z"
              fill="#19191B"
            />
            <rect x="134" y="138" width="58" height="12" fill="#19191B" />
            {/* Minimal facial features */}
            <path
              d="M144 160 Q150 157 156 160 M170 160 Q176 157 182 160"
              stroke="#241C18"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M156 178 Q164 182 172 178"
              stroke="#8C594B"
              strokeWidth="2.5"
              fill="none"
            />
            {/* Chest emblem */}
            <g transform="translate(186, 266)" fill="#181B12">
              <circle cx="8" cy="6" r="3" />
              <circle cx="20" cy="8" r="4.5" />
              <circle cx="2" cy="16" r="2.2" />
              <circle cx="13" cy="18" r="3" />
              <circle cx="23" cy="21" r="2.5" />
              <circle cx="8" cy="27" r="3.2" />
            </g>
          </svg>
        </div>
      ),
    },
    {
      id: "dot-matrix-emblem",
      title: "Beacon Glyph",
      subtitle: "Mark Architecture",
      renderContent: () => (
        <div className="relative flex h-full w-full items-center justify-center bg-[#0A0A0B]">
          <svg
            viewBox="0 0 240 300"
            className="h-3/4 w-3/4"
            aria-hidden="true"
          >
            {/* Outer ring of dots */}
            {Array.from({ length: 14 }).map((_, idx) => {
              const angle = (idx / 14) * Math.PI * 2;
              const cx = 120 + Math.cos(angle) * 44;
              const cy = 96 + Math.sin(angle) * 44;
              return (
                <circle key={idx} cx={cx} cy={cy} r="5.5" fill="#F4F4F5" />
              );
            })}
            {/* Vertical stem */}
            {[154, 174, 194, 214, 234].map((y) => (
              <circle key={y} cx="120" cy={y} r="5.5" fill="#F4F4F5" />
            ))}
            {/* Cross arms */}
            {[82, 101, 139, 158].map((x) => (
              <circle key={x} cx={x} cy="194" r="5.5" fill="#F4F4F5" />
            ))}
          </svg>
        </div>
      ),
    },
    {
      id: "audience-pills",
      title: "Generation X & Wellness",
      subtitle: "Segment Tags",
      renderContent: () => (
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-3.5 overflow-hidden bg-[#1D2216] p-6">
          <svg
            viewBox="0 0 320 400"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-55"
            aria-hidden="true"
          >
            <path
              d="M0 120 C90 80 180 190 320 130 L320 400 L0 400 Z"
              fill="#2A3120"
            />
            <path
              d="M0 240 C110 190 210 290 320 220 L320 400 L0 400 Z"
              fill="#14180F"
            />
          </svg>
          {["Generation X", "Wellness"].map((label) => (
            <div
              key={label}
              className="relative z-10 flex w-full max-w-[205px] items-center gap-3 rounded-full border border-white/10 bg-[#2C3124]/85 px-3 py-2 shadow-lg backdrop-blur-md"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#D4F742]">
                <svg
                  viewBox="0 0 20 20"
                  className="h-4 w-4 fill-[#14170E]"
                  aria-hidden="true"
                >
                  <circle cx="10" cy="4.5" r="1.8" />
                  <circle cx="10" cy="15.5" r="1.8" />
                  <circle cx="4.5" cy="10" r="1.8" />
                  <circle cx="15.5" cy="10" r="1.8" />
                </svg>
              </span>
              <span className="text-[13px] font-medium tracking-tight text-white/95">
                {label}
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "parasail-lightbox",
      title: "Parasail Signbox",
      subtitle: "Spatial Wayfinding",
      renderContent: () => (
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#0E0F10] p-4">
          <div className="relative flex w-[88%] -rotate-3 items-center justify-between rounded-sm bg-white px-4 py-4 shadow-[0_0_50px_rgba(255,255,255,0.28)]">
            <span className="font-sans text-[22px] font-semibold tracking-[-0.04em] text-[#0E0F10]">
              parasail
            </span>
            <svg
              viewBox="0 0 36 36"
              className="h-6 w-6 fill-[#0E0F10]"
              aria-hidden="true"
            >
              <circle cx="10" cy="8" r="3" />
              <circle cx="22" cy="10" r="4.5" />
              <circle cx="6" cy="18" r="2.2" />
              <circle cx="16" cy="20" r="3" />
              <circle cx="26" cy="22" r="2.5" />
              <circle cx="11" cy="28" r="3" />
            </svg>
          </div>
        </div>
      ),
    },
    {
      id: "halftone-globe-desk",
      title: "Global Studio",
      subtitle: "Parasail Workspace",
      renderContent: () => (
        <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-gradient-to-br from-[#D0F444] via-[#B4DA35] to-[#87A826] p-5">
          <div className="flex items-center gap-1.5 text-[#11140B]">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 fill-current"
              aria-hidden="true"
            >
              <circle cx="6" cy="6" r="2.2" />
              <circle cx="15" cy="7" r="3" />
              <circle cx="10" cy="14" r="2.2" />
              <circle cx="18" cy="15" r="2" />
              <circle cx="7" cy="20" r="2" />
            </svg>
            <span className="text-[16px] font-semibold tracking-[-0.03em]">
              parasail
            </span>
          </div>
          {/* Halftone globe accent */}
          <svg
            viewBox="0 0 240 240"
            className="pointer-events-none absolute -right-8 top-12 h-56 w-56 opacity-40"
            aria-hidden="true"
          >
            <circle
              cx="120"
              cy="120"
              r="98"
              fill="none"
              stroke="#12160A"
              strokeWidth="2"
              strokeDasharray="3 6"
            />
            <circle
              cx="120"
              cy="120"
              r="72"
              fill="none"
              stroke="#12160A"
              strokeWidth="3"
              strokeDasharray="2 7"
            />
            <ellipse
              cx="120"
              cy="120"
              rx="42"
              ry="96"
              fill="none"
              stroke="#12160A"
              strokeWidth="2"
              strokeDasharray="3 5"
            />
          </svg>
          {/* Minimal desk & monitor silhouette */}
          <svg
            viewBox="0 0 260 110"
            className="relative z-10 w-full"
            aria-hidden="true"
          >
            <rect x="96" y="24" width="66" height="42" rx="3" fill="#0F120A" />
            <rect x="124" y="66" width="10" height="14" fill="#0F120A" />
            <rect x="52" y="80" width="156" height="7" rx="1" fill="#0F120A" />
            <rect x="64" y="87" width="6" height="23" fill="#0F120A" />
            <rect x="190" y="87" width="6" height="23" fill="#0F120A" />
          </svg>
        </div>
      ),
    },
    {
      id: "digital-meets-personal",
      title: "Where Digital Meets Personal",
      subtitle: "Editorial Poster",
      renderContent: () => (
        <div className="flex h-full w-full items-center justify-center bg-[#B6B7BA] p-4">
          <div className="flex h-full w-full flex-col justify-between bg-[#F7F7F7] p-4 text-[#141416] shadow-inner">
            <p className="text-[15px] font-medium leading-[1.15] tracking-[-0.02em]">
              Where digital
              <br />
              meets personal
            </p>
            <svg
              viewBox="0 0 120 120"
              className="mx-auto h-28 w-28"
              aria-hidden="true"
            >
              <circle cx="60" cy="58" r="42" fill="#E4E4E7" />
              <path
                d="M36 96 C38 72 82 72 84 96"
                fill="#1F1F23"
              />
              <circle cx="60" cy="48" r="20" fill="#2A2A2E" />
              <path
                d="M50 52 Q60 62 70 52"
                stroke="#F7F7F7"
                strokeWidth="2.5"
                fill="none"
              />
            </svg>
            <div className="flex items-center justify-center gap-1 text-[10px] font-semibold tracking-tight text-[#27272A]">
              <span className="inline-block h-2 w-2 rounded-full bg-[#18181B]" />
              parasail
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "dotted-vessel",
      title: "Dotted Vessel",
      subtitle: "Commerce Icon",
      renderContent: () => (
        <div className="flex h-full w-full items-center justify-center bg-[#101012] p-6">
          <svg
            viewBox="0 0 200 240"
            className="h-3/4 w-3/4"
            aria-hidden="true"
          >
            <path
              d="M65 88 L65 66 C65 48 135 48 135 66 L135 88"
              fill="none"
              stroke="#E4E4E7"
              strokeWidth="5"
              strokeDasharray="2 9"
              strokeLinecap="round"
            />
            <polygon
              points="46,90 154,90 140,188 60,188"
              fill="none"
              stroke="#FAFAFA"
              strokeWidth="5.5"
              strokeDasharray="2 10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ),
    },
    {
      id: "diamond-matrix",
      title: "Diamond Lattice",
      subtitle: "Geometric Matrix",
      renderContent: () => (
        <div className="flex h-full w-full items-center justify-center bg-[#111113] p-6">
          <svg
            viewBox="0 0 200 200"
            className="h-3/4 w-3/4"
            aria-hidden="true"
          >
            {[-2, -1, 0, 1, 2].map((row) =>
              [-2, -1, 0, 1, 2]
                .filter((col) => Math.abs(row) + Math.abs(col) <= 2)
                .map((col) => (
                  <circle
                    key={`${row}-${col}`}
                    cx={100 + col * 24}
                    cy={100 + row * 24}
                    r={Math.abs(row) + Math.abs(col) === 0 ? 5.5 : 3.5}
                    fill="#F4F4F5"
                    opacity={Math.abs(row) + Math.abs(col) === 2 ? 0.65 : 1}
                  />
                ))
            )}
          </svg>
        </div>
      ),
    },
  ];
}

const SpatialCardCarousel = React.forwardRef<
  HTMLDivElement,
  SpatialCardCarouselProps
>(
  (
    {
      items: propItems,
      theme = "light",
      autoPlay = true,
      interval = 2400,
      pauseOnHover = true,
      showControls = true,
      initialIndex = 0,
      onActiveChange,
      ariaLabel = "3D spatial card showcase",
      className,
      ...rest
    },
    ref
  ) => {
    const uid = useId().replace(/:/g, "");
    const shouldReduceMotion = useReducedMotion();
    const defaultItems = useMemo(() => createDefaultItems(uid), [uid]);
    const items =
      propItems && propItems.length > 0 ? propItems : defaultItems;
    const total = items.length;

    const safeInitial =
      ((initialIndex % total) + total) % total;
    const [activeIndex, setActiveIndex] = useState<number>(safeInitial);
    const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const [pointerTilt, setPointerTilt] = useState<{ x: number; y: number }>({
      x: 0,
      y: 0,
    });
    const stageRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
      setIsPlaying(autoPlay);
    }, [autoPlay]);

    useEffect(() => {
      setActiveIndex(((initialIndex % total) + total) % total);
    }, [initialIndex, total]);

    const selectIndex = useCallback(
      (nextIdx: number) => {
        const normalized = ((nextIdx % total) + total) % total;
        setActiveIndex(normalized);
        onActiveChange?.(normalized, items[normalized]);
      },
      [items, onActiveChange, total]
    );

    const handleNext = useCallback(() => {
      selectIndex(activeIndex + 1);
    }, [activeIndex, selectIndex]);

    const handlePrev = useCallback(() => {
      selectIndex(activeIndex - 1);
    }, [activeIndex, selectIndex]);

    useEffect(() => {
      if (!isPlaying || total <= 1) return;
      if (pauseOnHover && isHovered) return;

      const clampedInterval = Math.max(900, interval);
      const timer = window.setInterval(() => {
        setActiveIndex((prev) => {
          const next = (prev + 1) % total;
          onActiveChange?.(next, items[next]);
          return next;
        });
      }, clampedInterval);

      return () => window.clearInterval(timer);
    }, [
      interval,
      isHovered,
      isPlaying,
      items,
      onActiveChange,
      pauseOnHover,
      total,
    ]);

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (shouldReduceMotion || !stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      setPointerTilt({
        x: Number((-ny * 8).toFixed(2)),
        y: Number((nx * 10).toFixed(2)),
      });
    };

    const handlePointerLeave = () => {
      setIsHovered(false);
      setPointerTilt({ x: 0, y: 0 });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      }
    };

    const isDark = theme === "dark";
    const activeItem = items[activeIndex];

    return (
      <div
        ref={(node) => {
          stageRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        role="region"
        aria-roledescription="carousel"
        aria-label={ariaLabel}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerEnter={() => setIsHovered(true)}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className={cn(
          "relative flex h-[540px] w-full select-none items-center justify-center overflow-hidden rounded-2xl transition-colors duration-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4F742] focus-visible:ring-offset-2 sm:h-[640px]",
          isDark
            ? "bg-[#0B0B0C] text-white"
            : "bg-[#FFFFFF] text-[#111113]",
          className
        )}
        style={{ perspective: "1400px" }}
        {...rest}
      >
        <div className="sr-only" aria-live="polite">
          {`Showing ${activeItem.title} (${activeIndex + 1} of ${total})`}
        </div>

        {/* 3D Orbital Stage */}
        <div
          className="relative flex h-full w-full items-center justify-center"
          style={{ transformStyle: "preserve-3d" }}
        >
          {items.map((item, idx) => {
            const offset = (idx - activeIndex + total) % total;
            const isHero = offset === 0;
            const slot = getOrbitalSlot(offset, total);

            const targetRotateX = isHero
              ? pointerTilt.x
              : slot.rotateX + pointerTilt.x * 0.45;
            const targetRotateY = isHero
              ? pointerTilt.y
              : slot.rotateY + pointerTilt.y * 0.45;

            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => selectIndex(idx)}
                aria-label={`Focus ${item.title}`}
                aria-current={isHero ? "true" : undefined}
                initial={false}
                animate={
                  shouldReduceMotion
                    ? {
                        x: `${slot.xPct}%`,
                        y: `${slot.yPct}%`,
                        scale: slot.scale,
                        opacity: isHero ? 1 : slot.opacity * 0.85,
                      }
                    : {
                        x: `${slot.xPct}%`,
                        y: [
                          `${slot.yPct}%`,
                          `${slot.yPct + (isHero ? 0 : idx % 2 === 0 ? -1.8 : 1.8)}%`,
                          `${slot.yPct}%`,
                        ],
                        scale: slot.scale,
                        rotateX: targetRotateX,
                        rotateY: targetRotateY,
                        rotateZ: slot.rotateZ,
                        opacity: slot.opacity,
                      }
                }
                transition={
                  shouldReduceMotion
                    ? { duration: 0.25 }
                    : {
                        x: { type: "spring", stiffness: 165, damping: 26 },
                        scale: { type: "spring", stiffness: 175, damping: 26 },
                        rotateX: { type: "spring", stiffness: 180, damping: 24 },
                        rotateY: { type: "spring", stiffness: 180, damping: 24 },
                        rotateZ: { type: "spring", stiffness: 165, damping: 26 },
                        opacity: { duration: 0.45, ease: "easeOut" },
                        y: isHero
                          ? { type: "spring", stiffness: 165, damping: 26 }
                          : {
                              duration: 4.5 + (idx % 3) * 0.8,
                              repeat: Infinity,
                              ease: "easeInOut",
                            },
                      }
                }
                whileHover={
                  !isHero && !shouldReduceMotion
                    ? { scale: slot.scale * 1.08, opacity: 1 }
                    : undefined
                }
                style={{
                  zIndex: slot.zIndex,
                  filter:
                    !shouldReduceMotion && slot.blur > 0
                      ? `blur(${slot.blur}px)`
                      : undefined,
                  transformStyle: "preserve-3d",
                }}
                className={cn(
                  "group absolute aspect-[4/5] w-[210px] cursor-pointer overflow-hidden rounded-[14px] border text-left transition-shadow duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4F742] focus-visible:ring-offset-2 sm:w-[270px] md:w-[300px]",
                  isDark
                    ? "border-white/10 shadow-[0_26px_70px_-14px_rgba(0,0,0,0.85)]"
                    : "border-black/10 shadow-[0_24px_60px_-14px_rgba(0,0,0,0.18)]",
                  isHero &&
                    (isDark
                      ? "ring-1 ring-white/15"
                      : "ring-1 ring-black/5")
                )}
              >
                {item.renderContent ? (
                  item.renderContent()
                ) : item.image ? (
                  <img
                    src={item.image}
                    alt={item.imageAlt ?? item.title}
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col justify-end bg-neutral-900 p-5 text-white">
                    <span className="text-sm font-medium">{item.title}</span>
                    {item.subtitle && (
                      <span className="text-xs text-white/60">
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Minimal Floating Navigation Pill */}
        {showControls && (
          <div
            className={cn(
              "absolute bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1.5 rounded-full border px-2 py-1.5 backdrop-blur-md transition-colors duration-300",
              isDark
                ? "border-white/15 bg-black/60 text-white"
                : "border-black/10 bg-white/80 text-neutral-900 shadow-sm"
            )}
          >
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous card"
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4F742]",
                isDark ? "hover:bg-white/10" : "hover:bg-black/5"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsPlaying((prev) => !prev)}
              aria-label={isPlaying ? "Pause showcase" : "Play showcase"}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4F742]",
                isDark ? "hover:bg-white/10" : "hover:bg-black/5"
              )}
            >
              {isPlaying ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5 translate-x-[0.5px]" />
              )}
            </button>

            <span className="min-w-[44px] px-1.5 text-center font-mono text-[11px] tabular-nums opacity-75">
              {String(activeIndex + 1).padStart(2, "0")}/
              {String(total).padStart(2, "0")}
            </span>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Next card"
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4F742]",
                isDark ? "hover:bg-white/10" : "hover:bg-black/5"
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    );
  }
);

SpatialCardCarousel.displayName = "SpatialCardCarousel";

export {
  SpatialCardCarousel,
  SpatialCardCarousel as component,
  SpatialCardCarousel as Component,
};
export default SpatialCardCarousel;