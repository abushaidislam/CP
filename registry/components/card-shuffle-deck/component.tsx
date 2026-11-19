"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, useReducedMotion, type PanInfo } from "framer-motion";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type CardShuffleTheme = "auto" | "light" | "dark";

export interface ShuffleCardItem {
  /** Unique stable identifier for the card */
  id: string;
  /** Accessible label announced when this card moves to the front */
  label: string;
  /** Card surface background color (CSS color value) */
  backgroundColor?: string;
  /** Optional custom content rendered inside the card */
  content: React.ReactNode;
}

export interface CardShuffleDeckProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Custom cards to render in the deck (defaults to the 4 reference cards) */
  cards?: ShuffleCardItem[];
  /** Automatically cycle cards with the reference fling-and-tuck shuffle */
  autoPlay?: boolean;
  /** Interval in milliseconds between automatic shuffles */
  interval?: number;
  /** Pause automatic shuffling while pointer hovers or focus is within the deck */
  pauseOnHover?: boolean;
  /** Enable click, drag-to-flick, and keyboard shuffling */
  interactive?: boolean;
  /** Initial front card index */
  initialIndex?: number;
  /** Callback fired whenever the active front card index changes */
  onActiveIndexChange?: (index: number) => void;
  /** Theme surface adaptation ("auto" follows Tailwind dark mode) */
  theme?: CardShuffleTheme;
}

type ShufflePhase = "idle" | "fling" | "tuck" | "peek-back" | "land-front";

interface SlotTransform {
  x: number;
  y: number;
  rotate: number;
  scale: number;
}

const SLOT_TRANSFORMS: SlotTransform[] = [
  { x: -16, y: 0, rotate: -14, scale: 1 },
  { x: 20, y: 6, rotate: -4, scale: 0.97 },
  { x: 50, y: 12, rotate: 4, scale: 0.94 },
  { x: 64, y: 16, rotate: 8, scale: 0.91 },
];

function getSlotTransform(slotIndex: number): SlotTransform {
  if (slotIndex < SLOT_TRANSFORMS.length) {
    return SLOT_TRANSFORMS[slotIndex];
  }
  const extra = slotIndex - (SLOT_TRANSFORMS.length - 1);
  return {
    x: 64 + extra * 10,
    y: 16 + extra * 4,
    rotate: 8 + extra * 3,
    scale: Math.max(0.82, 0.91 - extra * 0.03),
  };
}

function GreenAsteriskArtwork() {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[#5af272] select-none">
      <svg
        viewBox="0 0 180 180"
        className="h-[58%] w-[58%]"
        aria-hidden="true"
        focusable="false"
      >
        <g fill="#0a0a0a" transform="translate(90 84)">
          <rect x="-10" y="-52" width="20" height="54" rx="1" transform="rotate(-28)" />
          <rect x="-10" y="-52" width="20" height="54" rx="1" transform="rotate(28)" />
          <rect x="-10" y="-52" width="20" height="54" rx="1" transform="rotate(80)" />
          <rect x="-10" y="-52" width="20" height="54" rx="1" transform="rotate(130)" />
          <rect x="-10" y="-52" width="20" height="54" rx="1" transform="rotate(-130)" />
          <rect x="-10" y="-52" width="20" height="54" rx="1" transform="rotate(-80)" />
          <circle cx="0" cy="0" r="15" />
          {/* Detached bottom vertical stem */}
          <rect x="-10" y="26" width="20" height="40" rx="1" />
        </g>
      </svg>
    </div>
  );
}

function OpenToWorkArtwork() {
  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-[#080808] pt-[28%] select-none">
      <div className="relative z-10 flex flex-col items-center px-4 text-white">
        <span className="font-sans text-[36px] leading-[0.86] font-bold tracking-[-0.06em] sm:text-[40px]">
          Open
        </span>
        <div className="mt-0.5 flex items-center gap-1.5">
          {/* Pixel-block "to" glyph rendered in pure SVG */}
          <svg
            viewBox="0 0 56 30"
            className="h-[24px] w-[44px] shrink-0 sm:h-[26px] sm:w-[48px]"
            aria-hidden="true"
            focusable="false"
          >
            <g fill="#ffffff">
              {/* Pixel "t" */}
              <rect x="6" y="0" width="6" height="6" />
              <rect x="0" y="6" width="18" height="6" />
              <rect x="6" y="12" width="6" height="12" />
              <rect x="12" y="24" width="6" height="6" />
              {/* Pixel connector */}
              <rect x="20" y="18" width="6" height="6" />
              {/* Pixel "o" */}
              <rect x="32" y="6" width="12" height="6" />
              <rect x="26" y="12" width="6" height="12" />
              <rect x="44" y="12" width="6" height="12" />
              <rect x="32" y="24" width="12" height="6" />
            </g>
          </svg>
          <span className="font-sans text-[34px] leading-[0.88] font-bold tracking-[-0.06em] sm:text-[38px]">
            work
          </span>
        </div>
      </div>

      {/* Oversized bottom-bleeding white asterisk */}
      <svg
        viewBox="0 0 220 140"
        className="pointer-events-none w-full translate-y-[6%]"
        aria-hidden="true"
        focusable="false"
      >
        <g fill="#ffffff" transform="translate(110 112)">
          <rect x="-22" y="-96" width="44" height="106" rx="2" transform="rotate(-12)" />
          <rect x="-22" y="-96" width="44" height="106" rx="2" transform="rotate(48)" />
          <rect x="-22" y="-96" width="44" height="106" rx="2" transform="rotate(108)" />
          <rect x="-22" y="-96" width="44" height="106" rx="2" transform="rotate(168)" />
          <rect x="-22" y="-96" width="44" height="106" rx="2" transform="rotate(-132)" />
          <rect x="-22" y="-96" width="44" height="106" rx="2" transform="rotate(-72)" />
          <circle cx="0" cy="0" r="30" />
        </g>
      </svg>
    </div>
  );
}

function BlueAtArtwork() {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[#1d1aee] select-none">
      <svg
        viewBox="0 0 120 120"
        className="h-[58%] w-[58%]"
        aria-hidden="true"
        focusable="false"
      >
        {/* Crisp geometric "@" symbol as pure SVG path */}
        <path
          d="M60 12C33.49 12 12 33.49 12 60C12 86.51 33.49 108 60 108C74.2 108 86.95 101.82 95.74 92.02L86.4 84.3C79.8 91.52 70.44 96 60 96C40.12 96 24 79.88 24 60C24 40.12 40.12 24 60 24C79.88 24 96 40.12 96 60V65.5C96 71.85 91.2 76.5 85.4 76.5C80.1 76.5 76.5 72.7 76.5 66.8V36H64.5V43.4C60.6 38.6 54.7 35.6 48 35.6C35.3 35.6 25.6 46.1 25.6 60C25.6 73.9 35.3 84.4 48 84.4C55.4 84.4 61.8 80.7 65.6 75.2C68.2 82.8 75.3 87.8 84.8 87.8C97.8 87.8 107.6 78.2 107.6 64.5V60C107.6 33.49 86.51 12 60 12ZM50.5 72.8C43.1 72.8 37.6 67.3 37.6 60C37.6 52.7 43.1 47.2 50.5 47.2C57.9 47.2 63.4 52.7 63.4 60C63.4 67.3 57.9 72.8 50.5 72.8Z"
          fill="#ffffff"
        />
      </svg>
    </div>
  );
}

function CrimsonOrbArtwork({ uid }: { uid: string }) {
  const sphereGradId = `${uid}-orb-sphere`;
  const irisGradId = `${uid}-orb-iris`;
  const glossGradId = `${uid}-orb-gloss`;

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[#080808] select-none">
      <svg
        viewBox="0 0 160 160"
        className="h-[64%] w-[64%]"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <radialGradient id={sphereGradId} cx="58%" cy="38%" r="62%">
            <stop offset="0%" stopColor="#ff286c" />
            <stop offset="46%" stopColor="#d40747" />
            <stop offset="80%" stopColor="#750226" />
            <stop offset="100%" stopColor="#26000c" />
          </radialGradient>
          <radialGradient id={irisGradId} cx="46%" cy="46%" r="55%">
            <stop offset="0%" stopColor="#040103" />
            <stop offset="52%" stopColor="#1b020c" />
            <stop offset="82%" stopColor="#42051c" />
            <stop offset="100%" stopColor="#850530" stopOpacity="0.3" />
          </radialGradient>
          <radialGradient id={glossGradId} cx="32%" cy="28%" r="40%">
            <stop offset="0%" stopColor="#ff8fb3" stopOpacity="0.48" />
            <stop offset="100%" stopColor="#ff8fb3" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Main crimson sphere */}
        <circle cx="80" cy="80" r="62" fill={`url(#${sphereGradId})`} />

        {/* Subtle organic surface mottling */}
        <ellipse
          cx="102"
          cy="94"
          rx="26"
          ry="18"
          fill="#4e0119"
          opacity="0.34"
          transform="rotate(-18 102 94)"
        />
        <ellipse
          cx="96"
          cy="56"
          rx="20"
          ry="14"
          fill="#ff4985"
          opacity="0.22"
          transform="rotate(20 96 56)"
        />

        {/* Foreshortened dark iris & pupil oriented slightly left */}
        <ellipse cx="52" cy="82" rx="26" ry="30" fill={`url(#${irisGradId})`} />
        <ellipse cx="48" cy="82" rx="13" ry="16" fill="#050204" />

        {/* Subtle specular highlight */}
        <circle cx="80" cy="80" r="62" fill={`url(#${glossGradId})`} />
      </svg>
    </div>
  );
}

function createDefaultCards(uid: string): ShuffleCardItem[] {
  return [
    {
      id: "green-asterisk",
      label: "Brand mark card",
      backgroundColor: "#5af272",
      content: <GreenAsteriskArtwork />,
    },
    {
      id: "open-to-work",
      label: "Open to work card",
      backgroundColor: "#080808",
      content: <OpenToWorkArtwork />,
    },
    {
      id: "blue-handle",
      label: "Contact handle card",
      backgroundColor: "#1d1aee",
      content: <BlueAtArtwork />,
    },
    {
      id: "crimson-orb",
      label: "Crimson orb card",
      backgroundColor: "#080808",
      content: <CrimsonOrbArtwork uid={uid} />,
    },
  ];
}

export const CardShuffleDeck = forwardRef<HTMLDivElement, CardShuffleDeckProps>(
  function CardShuffleDeck(
    {
      cards,
      autoPlay = true,
      interval = 2100,
      pauseOnHover = true,
      interactive = true,
      initialIndex = 0,
      onActiveIndexChange,
      theme = "auto",
      className,
      ...rest
    },
    ref
  ) {
    const rawId = useId();
    const uid = rawId.replace(/:/g, "");
    const prefersReducedMotion = useReducedMotion();

    const deckCards = useMemo(
      () => (cards && cards.length > 0 ? cards : createDefaultCards(uid)),
      [cards, uid]
    );

    const safeCount = deckCards.length;

    const buildInitialOrder = useCallback(
      (startIdx: number, count: number) => {
        const normalized = ((startIdx % count) + count) % count;
        return Array.from({ length: count }, (_, i) => (normalized + i) % count);
      },
      []
    );

    const [order, setOrder] = useState<number[]>(() =>
      buildInitialOrder(initialIndex, safeCount)
    );
    const [phase, setPhase] = useState<ShufflePhase>("idle");
    const [movingCardIdx, setMovingCardIdx] = useState<number | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const timersRef = useRef<number[]>([]);
    const isAnimatingRef = useRef(false);

    const clearPendingTimers = useCallback(() => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    }, []);

    // Re-sync order if card list length changes
    useEffect(() => {
      clearPendingTimers();
      isAnimatingRef.current = false;
      setPhase("idle");
      setMovingCardIdx(null);
      setOrder(buildInitialOrder(initialIndex, safeCount));
    }, [safeCount, initialIndex, buildInitialOrder, clearPendingTimers]);

    useEffect(() => {
      return () => {
        clearPendingTimers();
      };
    }, [clearPendingTimers]);

    const activeCardIndex = order[0] ?? 0;

    // Notify parent when front card changes
    useEffect(() => {
      onActiveIndexChange?.(activeCardIndex);
    }, [activeCardIndex, onActiveIndexChange]);

    const clampedInterval = Math.max(900, Math.min(interval, 10000));
    const flingDurationMs = Math.min(760, Math.round(clampedInterval * 0.4));
    const tuckDurationMs = Math.min(480, Math.round(clampedInterval * 0.25));

    const shuffleNext = useCallback(() => {
      if (safeCount < 2 || isAnimatingRef.current) return;

      if (prefersReducedMotion) {
        setOrder((prev) => [...prev.slice(1), prev[0]]);
        return;
      }

      isAnimatingRef.current = true;
      const frontIdx = order[0];
      setMovingCardIdx(frontIdx);
      setPhase("fling");

      const t1 = window.setTimeout(() => {
        setPhase("tuck");
      }, flingDurationMs);

      const t2 = window.setTimeout(() => {
        setOrder((prev) => [...prev.slice(1), prev[0]]);
        setMovingCardIdx(null);
        setPhase("idle");
        isAnimatingRef.current = false;
      }, flingDurationMs + tuckDurationMs);

      timersRef.current.push(t1, t2);
    }, [safeCount, prefersReducedMotion, order, flingDurationMs, tuckDurationMs]);

    const shufflePrev = useCallback(() => {
      if (safeCount < 2 || isAnimatingRef.current) return;

      if (prefersReducedMotion) {
        setOrder((prev) => [prev[prev.length - 1], ...prev.slice(0, -1)]);
        return;
      }

      isAnimatingRef.current = true;
      const backIdx = order[order.length - 1];
      setMovingCardIdx(backIdx);
      setPhase("peek-back");

      const t1 = window.setTimeout(() => {
        setPhase("land-front");
      }, Math.round(tuckDurationMs * 0.85));

      const t2 = window.setTimeout(() => {
        setOrder((prev) => [prev[prev.length - 1], ...prev.slice(0, -1)]);
        setMovingCardIdx(null);
        setPhase("idle");
        isAnimatingRef.current = false;
      }, Math.round(tuckDurationMs * 0.85) + Math.round(flingDurationMs * 0.75));

      timersRef.current.push(t1, t2);
    }, [safeCount, prefersReducedMotion, order, flingDurationMs, tuckDurationMs]);

    // Auto-play interval loop
    useEffect(() => {
      if (!autoPlay || prefersReducedMotion || safeCount < 2) return;
      if (pauseOnHover && (isHovered || isFocused)) return;

      const id = window.setInterval(() => {
        shuffleNext();
      }, clampedInterval);

      return () => window.clearInterval(id);
    }, [
      autoPlay,
      prefersReducedMotion,
      safeCount,
      pauseOnHover,
      isHovered,
      isFocused,
      clampedInterval,
      shuffleNext,
    ]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!interactive) return;
      if (
        event.key === "ArrowRight" ||
        event.key === "ArrowDown" ||
        event.key === " " ||
        event.key === "Enter"
      ) {
        event.preventDefault();
        shuffleNext();
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        shufflePrev();
      }
    };

    const handleDragEnd = (
      _event: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo
    ) => {
      if (!interactive) return;
      if (
        info.offset.x < -55 ||
        info.offset.y > 55 ||
        info.velocity.x < -300
      ) {
        shuffleNext();
      } else if (info.offset.x > 70 || info.velocity.x > 350) {
        shufflePrev();
      }
    };

    const cardShadowClass =
      theme === "dark"
        ? "shadow-[0_22px_48px_-12px_rgba(0,0,0,0.72),0_4px_14px_-2px_rgba(0,0,0,0.45)] ring-1 ring-white/10"
        : theme === "light"
          ? "shadow-[0_18px_40px_-12px_rgba(15,23,42,0.22),0_4px_12px_-2px_rgba(15,23,42,0.08)] ring-1 ring-black/5"
          : "shadow-[0_18px_40px_-12px_rgba(15,23,42,0.22),0_4px_12px_-2px_rgba(15,23,42,0.08)] ring-1 ring-black/5 dark:shadow-[0_22px_48px_-12px_rgba(0,0,0,0.72),0_4px_14px_-2px_rgba(0,0,0,0.45)] dark:ring-white/10";

    const activeCard = deckCards[activeCardIndex];

    return (
      <div
        ref={ref}
        role="region"
        aria-roledescription="carousel"
        aria-label="Interactive card shuffle deck"
        tabIndex={interactive ? 0 : -1}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          "relative flex h-[380px] w-full max-w-[440px] items-center justify-center rounded-3xl outline-none sm:h-[420px]",
          interactive &&
            "focus-visible:ring-2 focus-visible:ring-neutral-900/40 focus-visible:ring-offset-4 dark:focus-visible:ring-white/40",
          className
        )}
        {...rest}
      >
        {/* Screen-reader live region announcing active card */}
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          {activeCard
            ? `Showing ${activeCard.label} (${activeCardIndex + 1} of ${safeCount})`
            : ""}
        </span>

        {/* Centered card stage */}
        <div className="relative h-[280px] w-[204px] sm:h-[312px] sm:w-[228px]">
          {order.map((cardIdx, posInOrder) => {
            const card = deckCards[cardIdx];
            if (!card) return null;

            const isMoving = movingCardIdx === cardIdx;
            const isFrontInteractive =
              interactive &&
              !prefersReducedMotion &&
              posInOrder === 0 &&
              phase === "idle";

            // Compute visual slot, target transform, zIndex, and transition curve
            let target: SlotTransform;
            let zIndex: number;
            let transitionDuration = 0.52;
            let transitionEase: [number, number, number, number] = [
              0.22, 1, 0.36, 1,
            ];

            if (isMoving && phase === "fling") {
              target = { x: -168, y: 112, rotate: -41, scale: 0.96 };
              zIndex = safeCount + 20;
              transitionDuration = Math.max(0.38, flingDurationMs / 1000);
              transitionEase = [0.16, 1, 0.3, 1];
            } else if (isMoving && phase === "tuck") {
              target = getSlotTransform(safeCount - 1);
              zIndex = 5;
              transitionDuration = Math.max(0.32, tuckDurationMs / 1000);
              transitionEase = [0.32, 0.72, 0, 1];
            } else if (isMoving && phase === "peek-back") {
              target = { x: -158, y: 102, rotate: -36, scale: 0.95 };
              zIndex = 5;
              transitionDuration = Math.max(0.28, (tuckDurationMs * 0.85) / 1000);
              transitionEase = [0.22, 1, 0.36, 1];
            } else if (isMoving && phase === "land-front") {
              target = getSlotTransform(0);
              zIndex = safeCount + 20;
              transitionDuration = Math.max(
                0.34,
                (flingDurationMs * 0.75) / 1000
              );
              transitionEase = [0.16, 1, 0.3, 1];
            } else {
              // Non-moving cards shift smoothly into their upcoming slot during transitions
              let visualSlot = posInOrder;
              if (phase === "fling" || phase === "tuck") {
                visualSlot = Math.max(0, posInOrder - 1);
              } else if (phase === "land-front") {
                visualSlot = Math.min(safeCount - 1, posInOrder + 1);
              }
              target = getSlotTransform(visualSlot);
              zIndex = (safeCount - visualSlot) * 10;
            }

            return (
              <motion.div
                key={card.id}
                style={{
                  zIndex,
                  backgroundColor: card.backgroundColor,
                  transformOrigin: "50% 50%",
                }}
                initial={false}
                animate={{
                  x: target.x,
                  y: target.y,
                  rotate: target.rotate,
                  scale: target.scale,
                }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0.15 }
                    : {
                        duration: transitionDuration,
                        ease: transitionEase,
                      }
                }
                drag={isFrontInteractive}
                dragSnapToOrigin
                dragElastic={0.18}
                dragConstraints={{ left: -220, right: 120, top: -60, bottom: 160 }}
                onDragEnd={isFrontInteractive ? handleDragEnd : undefined}
                onClick={
                  interactive && posInOrder === 0 && phase === "idle"
                    ? shuffleNext
                    : undefined
                }
                whileTap={
                  isFrontInteractive ? { scale: 0.985 } : undefined
                }
                aria-hidden={posInOrder !== 0}
                className={cn(
                  "absolute inset-0 overflow-hidden rounded-[22px] will-change-transform",
                  cardShadowClass,
                  isFrontInteractive && "cursor-grab active:cursor-grabbing",
                  !isFrontInteractive && interactive && posInOrder === 0 && "cursor-pointer"
                )}
              >
                {card.content}
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }
);

CardShuffleDeck.displayName = "CardShuffleDeck";

export { CardShuffleDeck as component, CardShuffleDeck as Component };
export default CardShuffleDeck;