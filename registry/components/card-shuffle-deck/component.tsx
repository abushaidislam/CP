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
  /** Total cycle cadence in milliseconds between automatic shuffles */
  interval?: number;
  /** Pause automatic shuffling while pointer hovers or keyboard focus is on the deck */
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

// Visually centered fan offsets so the 4-card stack sits balanced in its container
const SLOT_TRANSFORMS: SlotTransform[] = [
  { x: -30, y: 0, rotate: -14, scale: 1 },
  { x: 4, y: 6, rotate: -4, scale: 0.97 },
  { x: 34, y: 12, rotate: 4, scale: 0.94 },
  { x: 48, y: 16, rotate: 8, scale: 0.91 },
];

function getSlotTransform(slotIndex: number): SlotTransform {
  if (slotIndex < SLOT_TRANSFORMS.length) {
    return SLOT_TRANSFORMS[slotIndex];
  }
  const extra = slotIndex - (SLOT_TRANSFORMS.length - 1);
  return {
    x: 48 + extra * 10,
    y: 16 + extra * 4,
    rotate: 8 + extra * 3,
    scale: Math.max(0.82, 0.91 - extra * 0.03),
  };
}

function buildInitialOrder(startIdx: number, count: number): number[] {
  if (count <= 0) return [];
  const safeStart = Number.isFinite(startIdx) ? Math.trunc(startIdx) : 0;
  const normalized = ((safeStart % count) + count) % count;
  return Array.from({ length: count }, (_, i) => (normalized + i) % count);
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
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-[#080808] pt-[26%] select-none">
      <div className="relative z-10 flex flex-col items-center px-3 text-white">
        <span className="whitespace-nowrap font-sans text-[34px] leading-[0.86] font-bold tracking-[-0.06em] sm:text-[40px]">
          Open
        </span>
        <div className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap">
          {/* Pixel-block "to" glyph rendered in pure SVG */}
          <svg
            viewBox="0 0 56 30"
            className="h-[22px] w-[40px] shrink-0 sm:h-[26px] sm:w-[48px]"
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
          <span className="font-sans text-[32px] leading-[0.88] font-bold tracking-[-0.06em] sm:text-[38px]">
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
        {/* Balanced geometric "@" symbol as pure SVG path */}
        <path
          d="M60 12C33.49 12 12 33.49 12 60C12 86.51 33.49 108 60 108C74.2 108 86.95 101.82 95.74 92.02L86.4 84.3C79.8 91.52 70.44 96 60 96C40.12 96 24 79.88 24 60C24 40.12 40.12 24 60 24C79.88 24 96 40.12 96 60V64.5C96 70.6 91.6 74.8 86.2 74.8C81.3 74.8 78.2 71.4 78.2 65.8V38.5H67.2V44.6C63.8 40.3 58.6 37.6 52.6 37.6C40.9 37.6 32.4 47.1 32.4 60C32.4 72.9 40.9 82.4 52.6 82.4C59.2 82.4 64.9 79.1 68.2 74.2C70.6 81.1 77.1 85.8 85.8 85.8C98.2 85.8 107.6 76.6 107.6 63.8V60C107.6 33.49 86.51 12 60 12ZM55.2 71.6C48.4 71.6 43.6 66.6 43.6 60C43.6 53.4 48.4 48.4 55.2 48.4C62 48.4 66.8 53.4 66.8 60C66.8 66.6 62 71.6 55.2 71.6Z"
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

    const [order, setOrder] = useState<number[]>(() =>
      buildInitialOrder(initialIndex, safeCount)
    );
    const [phase, setPhase] = useState<ShufflePhase>("idle");
    const [movingCardIdx, setMovingCardIdx] = useState<number | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isKeyboardFocused, setIsKeyboardFocused] = useState(false);

    const orderRef = useRef<number[]>(order);
    orderRef.current = order;

    const timersRef = useRef<number[]>([]);
    const isAnimatingRef = useRef(false);
    const didDragRef = useRef(false);
    const queuedDirRef = useRef<"next" | "prev" | null>(null);
    const lastNotifiedIndexRef = useRef<number | null>(null);

    const clearPendingTimers = useCallback(() => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    }, []);

    // Re-sync deck order only when card count or initialIndex changes
    useEffect(() => {
      clearPendingTimers();
      isAnimatingRef.current = false;
      queuedDirRef.current = null;
      const nextOrder = buildInitialOrder(initialIndex, safeCount);
      orderRef.current = nextOrder;
      setOrder(nextOrder);
      setPhase("idle");
      setMovingCardIdx(null);
    }, [safeCount, initialIndex, clearPendingTimers]);

    useEffect(() => {
      return () => {
        clearPendingTimers();
      };
    }, [clearPendingTimers]);

    // Compute exact timings so total cycle matches `interval` cleanly
    const safeInterval = Number.isFinite(interval)
      ? Math.max(900, Math.min(interval, 10000))
      : 2100;
    const flingDurationMs = Math.min(720, Math.round(safeInterval * 0.36));
    const tuckDurationMs = Math.min(460, Math.round(safeInterval * 0.24));
    const dwellMs = Math.max(240, safeInterval - flingDurationMs - tuckDurationMs);

    // Visually active front card updates immediately as soon as the front card flings out
    const displayedFrontPos =
      safeCount > 1 && (phase === "fling" || phase === "tuck")
        ? 1
        : safeCount > 1 && phase === "land-front"
          ? safeCount - 1
          : 0;
    const activeCardIndex = order[displayedFrontPos] ?? 0;

    useEffect(() => {
      if (lastNotifiedIndexRef.current !== activeCardIndex) {
        lastNotifiedIndexRef.current = activeCardIndex;
        onActiveIndexChange?.(activeCardIndex);
      }
    }, [activeCardIndex, onActiveIndexChange]);

    const runShuffleRef = useRef<(dir: "next" | "prev") => void>(() => {});

    const runShuffle = useCallback(
      (dir: "next" | "prev") => {
        if (safeCount < 2) return;

        if (isAnimatingRef.current) {
          // Queue at most one directional step so fast taps feel responsive
          queuedDirRef.current = dir;
          return;
        }

        if (prefersReducedMotion) {
          setOrder((prev) => {
            const next =
              dir === "next"
                ? [...prev.slice(1), prev[0]]
                : [prev[prev.length - 1], ...prev.slice(0, -1)];
            orderRef.current = next;
            return next;
          });
          return;
        }

        isAnimatingRef.current = true;
        const currentOrder = orderRef.current;

        if (dir === "next") {
          const frontIdx = currentOrder[0];
          setMovingCardIdx(frontIdx);
          setPhase("fling");

          const t1 = window.setTimeout(() => {
            setPhase("tuck");
          }, flingDurationMs);

          const t2 = window.setTimeout(() => {
            setOrder((prev) => {
              const rotated = [...prev.slice(1), prev[0]];
              orderRef.current = rotated;
              return rotated;
            });
            setMovingCardIdx(null);
            setPhase("idle");
            isAnimatingRef.current = false;

            if (queuedDirRef.current) {
              const queued = queuedDirRef.current;
              queuedDirRef.current = null;
              window.requestAnimationFrame(() => runShuffleRef.current(queued));
            }
          }, flingDurationMs + tuckDurationMs);

          timersRef.current.push(t1, t2);
        } else {
          const backIdx = currentOrder[currentOrder.length - 1];
          const peekMs = Math.round(tuckDurationMs * 0.85);
          const landMs = Math.round(flingDurationMs * 0.75);

          setMovingCardIdx(backIdx);
          setPhase("peek-back");

          const t1 = window.setTimeout(() => {
            setPhase("land-front");
          }, peekMs);

          const t2 = window.setTimeout(() => {
            setOrder((prev) => {
              const rotated = [prev[prev.length - 1], ...prev.slice(0, -1)];
              orderRef.current = rotated;
              return rotated;
            });
            setMovingCardIdx(null);
            setPhase("idle");
            isAnimatingRef.current = false;

            if (queuedDirRef.current) {
              const queued = queuedDirRef.current;
              queuedDirRef.current = null;
              window.requestAnimationFrame(() => runShuffleRef.current(queued));
            }
          }, peekMs + landMs);

          timersRef.current.push(t1, t2);
        }
      },
      [safeCount, prefersReducedMotion, flingDurationMs, tuckDurationMs]
    );

    runShuffleRef.current = runShuffle;

    const shuffleNext = useCallback(() => runShuffle("next"), [runShuffle]);
    const shufflePrev = useCallback(() => runShuffle("prev"), [runShuffle]);

    // Exact dwell scheduler: only schedules the next shuffle while idle,
    // so total period = dwellMs + flingDurationMs + tuckDurationMs === safeInterval
    useEffect(() => {
      if (!autoPlay || prefersReducedMotion || safeCount < 2) return;
      if (phase !== "idle") return;
      if (pauseOnHover && (isHovered || isKeyboardFocused)) return;

      const id = window.setTimeout(() => {
        runShuffleRef.current("next");
      }, dwellMs);

      return () => window.clearTimeout(id);
    }, [
      autoPlay,
      prefersReducedMotion,
      safeCount,
      phase,
      pauseOnHover,
      isHovered,
      isKeyboardFocused,
      dwellMs,
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

    const handleFocus = (event: React.FocusEvent<HTMLDivElement>) => {
      // Only pause autoplay on keyboard focus (:focus-visible), never on mouse click focus
      if (event.currentTarget.matches(":focus-visible")) {
        setIsKeyboardFocused(true);
      }
    };

    const handleBlur = () => {
      setIsKeyboardFocused(false);
    };

    const handleDragStart = () => {
      didDragRef.current = true;
    };

    const handleDragEnd = (
      _event: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo
    ) => {
      // Clear drag flag after the browser's synthetic post-drag click window
      window.setTimeout(() => {
        didDragRef.current = false;
      }, 60);

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

    const handleCardClick = () => {
      if (!interactive || didDragRef.current) return;
      shuffleNext();
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
        onFocus={handleFocus}
        onBlur={handleBlur}
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
        <div className="relative h-[276px] w-[200px] sm:h-[312px] sm:w-[228px]">
          {order.map((cardIdx, posInOrder) => {
            const card = deckCards[cardIdx];
            if (!card) return null;

            const isMoving = movingCardIdx === cardIdx;
            const isVisualFront = posInOrder === displayedFrontPos;
            const isFrontDraggable =
              interactive &&
              !prefersReducedMotion &&
              posInOrder === 0 &&
              phase === "idle";

            let target: SlotTransform;
            let zIndex: number;
            let transitionDuration = 0.5;
            let transitionEase: [number, number, number, number] = [
              0.22, 1, 0.36, 1,
            ];

            if (isMoving && phase === "fling") {
              target = { x: -156, y: 108, rotate: -40, scale: 0.96 };
              zIndex = safeCount + 20;
              transitionDuration = Math.max(0.36, flingDurationMs / 1000);
              transitionEase = [0.16, 1, 0.3, 1];
            } else if (isMoving && phase === "tuck") {
              target = getSlotTransform(safeCount - 1);
              zIndex = 5;
              transitionDuration = Math.max(0.3, tuckDurationMs / 1000);
              transitionEase = [0.32, 0.72, 0, 1];
            } else if (isMoving && phase === "peek-back") {
              target = { x: -148, y: 98, rotate: -36, scale: 0.95 };
              zIndex = 5;
              transitionDuration = Math.max(
                0.28,
                (tuckDurationMs * 0.85) / 1000
              );
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
                drag={isFrontDraggable}
                dragSnapToOrigin={!isMoving}
                dragElastic={0.18}
                dragConstraints={{
                  left: -200,
                  right: 110,
                  top: -50,
                  bottom: 150,
                }}
                onDragStart={isFrontDraggable ? handleDragStart : undefined}
                onDragEnd={isFrontDraggable ? handleDragEnd : undefined}
                onClick={interactive && isVisualFront ? handleCardClick : undefined}
                whileTap={isFrontDraggable ? { scale: 0.985 } : undefined}
                aria-hidden={!isVisualFront}
                className={cn(
                  "absolute inset-0 overflow-hidden rounded-[22px] will-change-transform",
                  cardShadowClass,
                  isFrontDraggable && "cursor-grab active:cursor-grabbing",
                  !isFrontDraggable &&
                    interactive &&
                    isVisualFront &&
                    "cursor-pointer"
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