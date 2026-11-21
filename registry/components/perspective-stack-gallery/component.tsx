"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useId,
  useMemo,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

function getStackOffsetY(offset: number): number {
  let total = 0;
  for (let k = 1; k <= offset; k++) {
    total += 27 * Math.pow(0.915, k - 1);
  }
  return -total;
}

export interface GalleryCardItem {
  id: string;
  category: string;
  title: string;
  image?: string;
  artwork?:
    | "velvet"
    | "warmth"
    | "summit"
    | "dusk"
    | "stripes"
    | "tidal"
    | "sands"
    | "midnight"
    | "horizon"
    | "abyss"
    | "glow"
    | "teal";
}

export interface PerspectiveStackGalleryProps
  extends React.HTMLAttributes<HTMLDivElement> {
  items?: GalleryCardItem[];
  initialIndex?: number;
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  onSelectCard?: (item: GalleryCardItem, index: number) => void;
  visibleCards?: number;
  enableWheel?: boolean;
  showIndicators?: boolean;
  theme?: "auto" | "light" | "dark";
}

interface ExitingCard {
  key: string;
  item: GalleryCardItem;
  direction: 1 | -1;
}

export const DEFAULT_GALLERY_ITEMS: GalleryCardItem[] = [
  { id: "velvet", category: "Chromatic", title: "Velvet", artwork: "velvet" },
  { id: "warmth", category: "Soleil", title: "Warmth", artwork: "warmth" },
  {
    id: "summit",
    category: "Alpine Collective",
    title: "Summit",
    artwork: "summit",
  },
  { id: "dusk", category: "Violet Hour", title: "Dusk", artwork: "dusk" },
  { id: "stripes", category: "Line Form", title: "Stripes", artwork: "stripes" },
  { id: "tidal", category: "Ocean Archive", title: "Tidal", artwork: "tidal" },
  {
    id: "sands",
    category: "Meridian",
    title: "Sands of Time",
    artwork: "sands",
  },
  {
    id: "midnight",
    category: "Urban Lights",
    title: "Midnight City",
    artwork: "midnight",
  },
  {
    id: "horizon",
    category: "Pastel Wave",
    title: "Horizon",
    artwork: "horizon",
  },
  { id: "abyss", category: "Deep Current", title: "Abyss", artwork: "abyss" },
  { id: "glow", category: "Golden Hour", title: "Glow", artwork: "glow" },
  { id: "teal", category: "Nature Studio", title: "Teal", artwork: "teal" },
];

function CardArtwork({
  artwork = "velvet",
  uid,
}: {
  artwork?: GalleryCardItem["artwork"];
  uid: string;
}) {
  switch (artwork) {
    case "velvet":
      return (
        <div
          className="h-full w-full"
          style={{
            background:
              "linear-gradient(112deg, #ba75b3 0%, #9973be 34%, #5c7fc3 68%, #1d75bf 100%)",
          }}
        >
          <div
            className="h-full w-full opacity-45"
            style={{
              background:
                "radial-gradient(ellipse 70% 80% at 22% 72%, rgba(235, 168, 214, 0.55), transparent 65%), radial-gradient(ellipse 65% 75% at 86% 24%, rgba(56, 189, 248, 0.4), transparent 60%)",
            }}
          />
        </div>
      );

    case "warmth":
      return (
        <div
          className="relative h-full w-full overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, #ffe5c8 0%, #ffd0ac 52%, #ffba92 100%)",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle 34% at 34% 66%, rgba(246, 224, 30, 0.88) 0%, rgba(255, 212, 82, 0.35) 52%, transparent 76%), radial-gradient(circle 38% at 69% 68%, rgba(255, 38, 146, 0.86) 0%, rgba(255, 92, 141, 0.36) 54%, transparent 78%)",
            }}
          />
        </div>
      );

    case "summit":
      return (
        <svg
          viewBox="0 0 640 400"
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`${uid}-sum-sky`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c4ccd9" />
              <stop offset="52%" stopColor="#d7dde7" />
              <stop offset="100%" stopColor="#eef1f6" />
            </linearGradient>
            <linearGradient id={`${uid}-sum-m1`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8d99ae" />
              <stop offset="48%" stopColor="#cfd7e3" />
              <stop offset="100%" stopColor="#edf1f7" />
            </linearGradient>
            <linearGradient id={`${uid}-sum-m2`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5e6b82" />
              <stop offset="45%" stopColor="#9aa7bc" />
              <stop offset="100%" stopColor="#dce3ed" />
            </linearGradient>
          </defs>
          <rect width="640" height="400" fill={`url(#${uid}-sum-sky)`} />
          <path
            d="M0 290 L118 196 L220 250 L360 148 L480 232 L640 162 L640 400 L0 400 Z"
            fill={`url(#${uid}-sum-m1)`}
          />
          <path
            d="M0 340 L95 235 L178 292 L286 192 L396 310 L512 246 L640 318 L640 400 L0 400 Z"
            fill={`url(#${uid}-sum-m2)`}
            opacity="0.72"
          />
          <path
            d="M0 360 Q180 295 340 340 T640 330 L640 400 L0 400 Z"
            fill="#eef2f8"
            opacity="0.7"
          />
        </svg>
      );

    case "dusk":
      return (
        <svg
          viewBox="0 0 640 400"
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`${uid}-dusk-bg`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#08041c" />
              <stop offset="50%" stopColor="#1b0947" />
              <stop offset="100%" stopColor="#090524" />
            </linearGradient>
            <linearGradient id={`${uid}-dusk-rib`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4338ca" stopOpacity="0.1" />
              <stop offset="45%" stopColor="#8b5cf6" stopOpacity="0.95" />
              <stop offset="75%" stopColor="#c084fc" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#312e81" stopOpacity="0.1" />
            </linearGradient>
            <filter id={`${uid}-dusk-blur`}>
              <feGaussianBlur stdDeviation="12" />
            </filter>
          </defs>
          <rect width="640" height="400" fill={`url(#${uid}-dusk-bg)`} />
          <path
            d="M-40 340 C120 260 180 110 290 40 C340 160 440 240 680 120"
            fill="none"
            stroke={`url(#${uid}-dusk-rib)`}
            strokeWidth="58"
            filter={`url(#${uid}-dusk-blur)`}
          />
          <path
            d="M-20 370 C150 280 205 140 315 65 C375 180 465 265 670 155"
            fill="none"
            stroke="#e9d5ff"
            strokeOpacity="0.55"
            strokeWidth="10"
            filter={`url(#${uid}-dusk-blur)`}
          />
        </svg>
      );

    case "stripes":
      return (
        <svg
          viewBox="0 0 640 400"
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
          aria-hidden="true"
        >
          <rect width="640" height="400" fill="#2d4745" />
          {[
            { r: 460, c: "#3f5d57" },
            { r: 425, c: "#c66335" },
            { r: 392, c: "#e69a5c" },
            { r: 360, c: "#f7dcb4" },
            { r: 332, c: "#d97b43" },
            { r: 300, c: "#9c4327" },
            { r: 270, c: "#e5a66e" },
            { r: 238, c: "#f4d3a1" },
            { r: 208, c: "#c26236" },
            { r: 175, c: "#8a3a22" },
            { r: 140, c: "#d88a55" },
            { r: 105, c: "#f2cba0" },
          ].map((band, i) => (
            <circle key={i} cx="320" cy="-60" r={band.r} fill={band.c} />
          ))}
        </svg>
      );

    case "tidal":
      return (
        <svg
          viewBox="0 0 640 400"
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`${uid}-tid-bg`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#041c21" />
              <stop offset="48%" stopColor="#0b464b" />
              <stop offset="82%" stopColor="#146367" />
              <stop offset="100%" stopColor="#072227" />
            </linearGradient>
            <linearGradient id={`${uid}-tid-foam`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f0fdfa" stopOpacity="0.95" />
              <stop offset="55%" stopColor="#99f6e4" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#0f4c52" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="640" height="400" fill={`url(#${uid}-tid-bg)`} />
          <path
            d="M0 190 Q120 110 260 155 T530 140 T640 165 L640 400 L0 400 Z"
            fill="#0d5459"
            opacity="0.65"
          />
          <path
            d="M0 295 C90 220 165 255 245 275 C325 295 395 215 480 250 C545 275 595 255 640 285 L640 400 L0 400 Z"
            fill={`url(#${uid}-tid-foam)`}
          />
          <path
            d="M0 325 C110 285 210 345 330 315 C440 288 530 340 640 310 L640 400 L0 400 Z"
            fill="#ecfeff"
            opacity="0.72"
          />
        </svg>
      );

    case "sands":
      return (
        <svg
          viewBox="0 0 640 400"
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`${uid}-snd-sky`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c98b6" />
              <stop offset="46%" stopColor="#e6c3a5" />
              <stop offset="72%" stopColor="#f4b982" />
              <stop offset="100%" stopColor="#c56e43" />
            </linearGradient>
            <linearGradient id={`${uid}-snd-mesa`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b55d3c" />
              <stop offset="100%" stopColor="#7a321d" />
            </linearGradient>
          </defs>
          <rect width="640" height="400" fill={`url(#${uid}-snd-sky)`} />
          <path
            d="M0 255 L110 255 L135 218 L195 218 L215 255 L365 255 L392 170 L465 170 L488 215 L520 215 L542 255 L640 255 L640 400 L0 400 Z"
            fill={`url(#${uid}-snd-mesa)`}
          />
          <path
            d="M0 285 Q180 252 340 292 T640 278 L640 400 L0 400 Z"
            fill="#c96f44"
          />
          <path
            d="M0 332 Q200 302 390 340 T640 326 L640 400 L0 400 Z"
            fill="#9b4426"
          />
        </svg>
      );

    case "midnight":
      return (
        <div
          className="relative h-full w-full overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, #1b050b 0%, #3a0916 42%, #130408 100%)",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 65% 48% at 52% 62%, rgba(244, 63, 94, 0.52), transparent 72%), radial-gradient(ellipse 40% 30% at 24% 78%, rgba(251, 113, 133, 0.45), transparent 65%), radial-gradient(ellipse 36% 28% at 78% 72%, rgba(225, 29, 72, 0.4), transparent 65%)",
            }}
          />
          <svg
            viewBox="0 0 640 400"
            preserveAspectRatio="xMidYMid slice"
            className="relative h-full w-full"
            aria-hidden="true"
          >
            <g fill="#0c0306" opacity="0.88">
              <rect x="28" y="210" width="46" height="190" />
              <rect x="82" y="175" width="54" height="225" />
              <rect x="148" y="230" width="42" height="170" />
              <rect x="202" y="150" width="60" height="250" />
              <rect x="274" y="190" width="48" height="210" />
              <rect x="334" y="125" width="58" height="275" />
              <rect x="404" y="185" width="52" height="215" />
              <rect x="468" y="160" width="64" height="240" />
              <rect x="544" y="205" width="68" height="195" />
            </g>
            <g fill="#fb7185" opacity="0.72">
              <circle cx="110" cy="240" r="3" />
              <circle cx="232" cy="215" r="3.5" />
              <circle cx="358" cy="180" r="4" />
              <circle cx="372" cy="225" r="3" />
              <circle cx="495" cy="235" r="3.5" />
              <circle cx="180" cy="295" r="2.5" />
              <circle cx="425" cy="275" r="3" />
            </g>
          </svg>
        </div>
      );

    case "horizon":
      return (
        <svg
          viewBox="0 0 640 400"
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`${uid}-hor-bg`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f3f4f6" />
              <stop offset="100%" stopColor="#e5e7eb" />
            </linearGradient>
            <linearGradient id={`${uid}-hor-w1`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fbcfe8" />
              <stop offset="45%" stopColor="#a5f3fc" />
              <stop offset="80%" stopColor="#ddd6fe" />
              <stop offset="100%" stopColor="#f9a8d4" />
            </linearGradient>
            <linearGradient id={`${uid}-hor-w2`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#99f6e4" />
              <stop offset="50%" stopColor="#f5d0fe" />
              <stop offset="100%" stopColor="#bae6fd" />
            </linearGradient>
          </defs>
          <rect width="640" height="400" fill={`url(#${uid}-hor-bg)`} />
          <path
            d="M0 240 C120 140 210 155 310 210 C410 265 510 120 640 185 L640 400 L0 400 Z"
            fill={`url(#${uid}-hor-w1)`}
          />
          <path
            d="M0 305 C140 210 260 330 390 250 C490 190 570 260 640 245 L640 400 L0 400 Z"
            fill={`url(#${uid}-hor-w2)`}
            opacity="0.82"
          />
        </svg>
      );

    case "abyss":
      return (
        <div
          className="relative h-full w-full overflow-hidden"
          style={{
            background:
              "radial-gradient(ellipse 85% 85% at 50% 45%, #0a2463 0%, #041033 55%, #020617 100%)",
          }}
        >
          <svg
            viewBox="0 0 640 400"
            preserveAspectRatio="xMidYMid slice"
            className="h-full w-full"
            aria-hidden="true"
          >
            <defs>
              <radialGradient id={`${uid}-aby-j1`} cx="50%" cy="40%" r="55%">
                <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.95" />
                <stop offset="55%" stopColor="#3b82f6" stopOpacity="0.65" />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
              </radialGradient>
              <filter id={`${uid}-aby-glow`}>
                <feGaussianBlur stdDeviation="8" />
              </filter>
            </defs>
            <ellipse
              cx="410"
              cy="175"
              rx="105"
              ry="72"
              fill={`url(#${uid}-aby-j1)`}
              filter={`url(#${uid}-aby-glow)`}
            />
            <ellipse
              cx="195"
              cy="155"
              rx="70"
              ry="50"
              fill={`url(#${uid}-aby-j1)`}
              filter={`url(#${uid}-aby-glow)`}
            />
            <ellipse
              cx="235"
              cy="280"
              rx="58"
              ry="42"
              fill={`url(#${uid}-aby-j1)`}
              filter={`url(#${uid}-aby-glow)`}
            />
            <g
              stroke="#60a5fa"
              strokeOpacity="0.45"
              strokeWidth="2.5"
              fill="none"
            >
              <path d="M380 215 Q365 290 390 365" />
              <path d="M412 220 Q425 295 405 375" />
              <path d="M440 215 Q460 285 435 360" />
              <path d="M180 188 Q165 250 185 325" />
              <path d="M210 188 Q225 255 205 330" />
            </g>
          </svg>
        </div>
      );

    case "glow":
      return (
        <div
          className="h-full w-full"
          style={{
            background:
              "linear-gradient(135deg, #f59e0b 0%, #fbbf24 38%, #d97706 72%, #92400e 100%)",
          }}
        >
          <div
            className="h-full w-full"
            style={{
              background:
                "radial-gradient(ellipse 68% 60% at 32% 45%, rgba(254, 240, 138, 0.72), transparent 68%), radial-gradient(ellipse 60% 55% at 78% 68%, rgba(120, 53, 15, 0.5), transparent 65%)",
            }}
          />
        </div>
      );

    case "teal":
    default:
      return (
        <div
          className="relative h-full w-full overflow-hidden"
          style={{
            background:
              "linear-gradient(155deg, #02080a 0%, #041d21 55%, #02090b 100%)",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 62% 36% at 44% 52%, rgba(45, 212, 191, 0.78) 0%, rgba(20, 184, 166, 0.34) 48%, transparent 78%), radial-gradient(ellipse 46% 48% at 76% 58%, rgba(6, 182, 212, 0.55) 0%, transparent 70%)",
            }}
          />
        </div>
      );
  }
}

export const PerspectiveStackGallery = React.forwardRef<
  HTMLDivElement,
  PerspectiveStackGalleryProps
>(
  (
    {
      items = DEFAULT_GALLERY_ITEMS,
      initialIndex = 0,
      activeIndex: controlledIndex,
      onActiveIndexChange,
      onSelectCard,
      visibleCards = 10,
      enableWheel = true,
      showIndicators = true,
      theme = "auto",
      className,
      ...rest
    },
    ref
  ) => {
    const rawId = useId();
    const uid = useMemo(() => rawId.replace(/:/g, ""), [rawId]);
    const prefersReducedMotion = useReducedMotion();

    const safeItems = items.length > 0 ? items : DEFAULT_GALLERY_ITEMS;
    const total = safeItems.length;
    const clampedVisible = Math.max(3, Math.min(visibleCards, total, 12));

    const [uncontrolledIndex, setUncontrolledIndex] = useState(
      ((initialIndex % total) + total) % total
    );
    const activeIndex =
      controlledIndex !== undefined
        ? ((controlledIndex % total) + total) % total
        : uncontrolledIndex;

    const [hoveredOffset, setHoveredOffset] = useState<number | null>(null);
    const [direction, setDirection] = useState<1 | -1>(1);
    const [exitingCards, setExitingCards] = useState<ExitingCard[]>([]);

    const wheelLockRef = useRef<number>(0);
    const wheelDeltaRef = useRef<number>(0);
    const pointerStartYRef = useRef<number | null>(null);
    const exitCounterRef = useRef<number>(0);

    const setIndex = useCallback(
      (nextIndex: number, dir: 1 | -1) => {
        const normalized = ((nextIndex % total) + total) % total;
        if (normalized === activeIndex) return;

        if (dir === 1 && !prefersReducedMotion) {
          const exitingItem = safeItems[activeIndex];
          const exitKey = `${exitingItem.id}-${++exitCounterRef.current}`;
          setExitingCards((prev) => [
            ...prev.slice(-3),
            { key: exitKey, item: exitingItem, direction: 1 },
          ]);
        }

        setDirection(dir);
        setHoveredOffset(null);

        if (controlledIndex === undefined) {
          setUncontrolledIndex(normalized);
        }
        onActiveIndexChange?.(normalized);
      },
      [
        activeIndex,
        controlledIndex,
        onActiveIndexChange,
        prefersReducedMotion,
        safeItems,
        total,
      ]
    );

    const stepForward = useCallback(() => {
      setIndex(activeIndex + 1, 1);
    }, [activeIndex, setIndex]);

    const stepBackward = useCallback(() => {
      setIndex(activeIndex - 1, -1);
    }, [activeIndex, setIndex]);

    const jumpToIndex = useCallback(
      (targetIdx: number) => {
        const normalized = ((targetIdx % total) + total) % total;
        if (normalized === activeIndex) {
          onSelectCard?.(safeItems[normalized], normalized);
          return;
        }
        const forwardDist = (normalized - activeIndex + total) % total;
        const backwardDist = (activeIndex - normalized + total) % total;
        setIndex(normalized, forwardDist <= backwardDist ? 1 : -1);
        onSelectCard?.(safeItems[normalized], normalized);
      },
      [activeIndex, onSelectCard, safeItems, setIndex, total]
    );

    const handleWheel = useCallback(
      (e: React.WheelEvent<HTMLDivElement>) => {
        if (!enableWheel) return;
        e.preventDefault();

        const now = Date.now();
        wheelDeltaRef.current += e.deltaY;

        if (now - wheelLockRef.current < 135) return;
        if (Math.abs(wheelDeltaRef.current) < 28) return;

        if (wheelDeltaRef.current > 0) {
          stepForward();
        } else {
          stepBackward();
        }
        wheelDeltaRef.current = 0;
        wheelLockRef.current = now;
      },
      [enableWheel, stepBackward, stepForward]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          e.preventDefault();
          stepForward();
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          e.preventDefault();
          stepBackward();
        } else if (e.key === "Home") {
          e.preventDefault();
          setIndex(0, -1);
        } else if (e.key === "End") {
          e.preventDefault();
          setIndex(total - 1, 1);
        }
      },
      [setIndex, stepBackward, stepForward, total]
    );

    const handlePointerDown = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        pointerStartYRef.current = e.clientY;
      },
      []
    );

    const handlePointerUp = useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (pointerStartYRef.current === null) return;
        const dy = e.clientY - pointerStartYRef.current;
        pointerStartYRef.current = null;
        if (Math.abs(dy) > 36) {
          if (dy > 0) {
            stepForward();
          } else {
            stepBackward();
          }
        }
      },
      [stepBackward, stepForward]
    );

    useEffect(() => {
      if (exitingCards.length === 0) return;
      const timer = window.setTimeout(() => {
        setExitingCards((prev) => prev.slice(1));
      }, 480);
      return () => window.clearTimeout(timer);
    }, [exitingCards]);

    const activeItem = safeItems[activeIndex];

    const visibleStack = useMemo(() => {
      const list: { item: GalleryCardItem; index: number; offset: number }[] =
        [];
      for (let offset = clampedVisible - 1; offset >= 0; offset--) {
        const idx = (activeIndex + offset) % total;
        list.push({ item: safeItems[idx], index: idx, offset });
      }
      return list;
    }, [activeIndex, clampedVisible, safeItems, total]);

    const themeClasses =
      theme === "dark"
        ? "dark text-neutral-100"
        : theme === "light"
          ? "text-neutral-900"
          : "text-neutral-900 dark:text-neutral-100";

    const eyebrowColor =
      theme === "dark"
        ? "text-neutral-400"
        : theme === "light"
          ? "text-neutral-400"
          : "text-neutral-400 dark:text-neutral-500";

    const titleColor =
      theme === "dark"
        ? "text-neutral-100"
        : theme === "light"
          ? "text-neutral-900"
          : "text-neutral-900 dark:text-neutral-100";

    const dotActiveColor =
      theme === "dark"
        ? "bg-neutral-100"
        : theme === "light"
          ? "bg-neutral-900"
          : "bg-neutral-900 dark:bg-neutral-100";

    const dotIdleColor =
      theme === "dark"
        ? "bg-neutral-700 hover:bg-neutral-500"
        : theme === "light"
          ? "bg-neutral-300 hover:bg-neutral-500"
          : "bg-neutral-300 hover:bg-neutral-500 dark:bg-neutral-700 dark:hover:bg-neutral-500";

    const floorShadowStyle =
      theme === "dark"
        ? "radial-gradient(ellipse 54% 48% at 50% 50%, rgba(0, 0, 0, 0.62) 0%, rgba(0, 0, 0, 0.28) 52%, transparent 82%)"
        : "radial-gradient(ellipse 54% 48% at 50% 50%, rgba(15, 23, 42, 0.14) 0%, rgba(15, 23, 42, 0.06) 52%, transparent 82%)";

    return (
      <div
        ref={ref}
        role="region"
        aria-roledescription="carousel"
        aria-label="3D Perspective Stack Gallery"
        tabIndex={0}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className={cn(
          "relative flex min-h-[620px] w-full select-none flex-col items-center justify-between overflow-hidden px-4 py-8 outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/60 sm:min-h-[660px] sm:px-8 sm:py-10",
          themeClasses,
          className
        )}
        style={{
          fontFamily:
            "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
        {...rest}
      >
        {/* Top Metadata Header */}
        <header className="relative z-20 flex h-14 flex-col items-center justify-center text-center">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={activeItem.id}
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: direction * 8, filter: "blur(2px)" }
              }
              animate={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 1, y: 0, filter: "blur(0px)" }
              }
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: direction * -8, filter: "blur(2px)" }
              }
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center"
            >
              <span
                className={cn(
                  "text-[10px] font-medium uppercase tracking-[0.26em] sm:text-[11px]",
                  eyebrowColor
                )}
              >
                {activeItem.category}
              </span>
              <h2
                className={cn(
                  "mt-1 text-[15px] font-semibold tracking-[-0.015em] sm:text-[17px]",
                  titleColor
                )}
              >
                {activeItem.title}
              </h2>
            </motion.div>
          </AnimatePresence>
        </header>

        {/* 3D Perspective Stack Stage */}
        <div
          className="relative flex w-full flex-1 items-center justify-center pt-48 pb-16 sm:pt-56 sm:pb-20"
          style={{
            perspective: "1150px",
            perspectiveOrigin: "50% 42%",
          }}
        >
          <div className="relative aspect-[16/10] w-[280px] sm:w-[390px] md:w-[440px]">
            {/* Perspective Floor Shadow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-16 left-1/2 h-24 w-[94%] -translate-x-1/2 blur-xl sm:-bottom-20 sm:h-28"
              style={{
                background: floorShadowStyle,
                transform: "translateX(-50%) perspective(420px) rotateX(58deg)",
              }}
            />

            {/* Stacked Cards */}
            {visibleStack.map(({ item, index, offset }) => {
              const isFront = offset === 0;
              const isHovered = hoveredOffset === offset && !isFront;

              const baseY = getStackOffsetY(offset);
              const scale = Math.pow(0.946, offset);
              const peekLift = isHovered ? -24 : 0;
              const y = baseY + peekLift;
              const opacity = offset >= clampedVisible - 1 ? 0.88 : 1;

              return (
                <motion.button
                  key={item.id}
                  type="button"
                  aria-label={`${item.title} — ${item.category}`}
                  aria-current={isFront ? "true" : undefined}
                  onMouseEnter={() => {
                    if (!isFront) setHoveredOffset(offset);
                  }}
                  onMouseLeave={() => {
                    setHoveredOffset((prev) => (prev === offset ? null : prev));
                  }}
                  onClick={() => {
                    if (isFront) {
                      stepForward();
                      onSelectCard?.(item, index);
                    } else {
                      jumpToIndex(index);
                    }
                  }}
                  initial={
                    prefersReducedMotion
                      ? false
                      : isFront && direction === -1
                        ? {
                            y: 165,
                            scale: 1.04,
                            rotateX: -68,
                            opacity: 0,
                          }
                        : {
                            y: baseY - 16,
                            scale: scale * 0.95,
                            rotateX: 0,
                            opacity: 0,
                          }
                  }
                  animate={{
                    y,
                    scale,
                    rotateX: isHovered ? -3 : 0,
                    opacity,
                  }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0.18 }
                      : {
                          type: "spring",
                          stiffness: 290,
                          damping: 30,
                          mass: 0.88,
                        }
                  }
                  style={{
                    zIndex: clampedVisible - offset,
                    transformOrigin: "50% 0%",
                    boxShadow: isFront
                      ? "0 24px 52px -14px rgba(0, 0, 0, 0.24), 0 -4px 14px -4px rgba(0, 0, 0, 0.12)"
                      : "0 -3px 12px -4px rgba(0, 0, 0, 0.14), 0 12px 24px -10px rgba(0, 0, 0, 0.14)",
                  }}
                  className={cn(
                    "absolute inset-0 h-full w-full cursor-pointer overflow-hidden rounded-[18px] text-left outline-none ring-1 ring-inset ring-black/[0.08] focus-visible:ring-2 focus-visible:ring-neutral-900 dark:ring-white/[0.14] dark:focus-visible:ring-neutral-100 sm:rounded-[22px]"
                  )}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      draggable={false}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <CardArtwork
                      artwork={item.artwork}
                      uid={`${uid}-${item.id}`}
                    />
                  )}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-[inherit]"
                    style={{
                      boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.34)",
                    }}
                  />
                </motion.button>
              );
            })}

            {/* Non-blocking Forward Exit Flight Layer */}
            <AnimatePresence>
              {exitingCards.map((exiting) => (
                <motion.div
                  key={exiting.key}
                  aria-hidden="true"
                  initial={{
                    y: 0,
                    scale: 1,
                    rotateX: 0,
                    opacity: 1,
                  }}
                  animate={{
                    y: 195,
                    scale: 1.05,
                    rotateX: -76,
                    opacity: 0,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.42,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    zIndex: clampedVisible + 10,
                    transformOrigin: "50% 90%",
                  }}
                  className="pointer-events-none absolute inset-0 h-full w-full overflow-hidden rounded-[18px] ring-1 ring-inset ring-black/[0.08] dark:ring-white/[0.12] sm:rounded-[22px]"
                >
                  {exiting.item.image ? (
                    <img
                      src={exiting.item.image}
                      alt=""
                      draggable={false}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <CardArtwork
                      artwork={exiting.item.artwork}
                      uid={`${uid}-exit-${exiting.key}`}
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Vertical Dot Rail Indicator */}
        {showIndicators && (
          <nav
            aria-label="Gallery slide indicators"
            className="absolute right-3 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-1 sm:right-6"
          >
            {safeItems.map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => jumpToIndex(idx)}
                  aria-label={`Go to ${item.title}`}
                  aria-current={isActive ? "true" : undefined}
                  className="group flex h-4 w-4 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-neutral-500"
                >
                  <motion.span
                    animate={{
                      scale: isActive ? 1.5 : 1,
                      opacity: isActive ? 1 : 0.65,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 26,
                    }}
                    className={cn(
                      "block h-[3.5px] w-[3.5px] rounded-full transition-colors",
                      isActive ? dotActiveColor : dotIdleColor
                    )}
                  />
                </button>
              );
            })}
          </nav>
        )}
      </div>
    );
  }
);

PerspectiveStackGallery.displayName = "PerspectiveStackGallery";

export {
  PerspectiveStackGallery as component,
  PerspectiveStackGallery as Component,
};
export default PerspectiveStackGallery;
