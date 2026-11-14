"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useId,
  type HTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

export interface CardItem {
  id: string;
  title: string;
  subtitle?: string;
  src: string;
  badge?: string;
}

export interface CardSwapProps extends HTMLAttributes<HTMLDivElement> {
  items?: CardItem[];
  auto?: boolean;
  every?: number;
  pauseOnHover?: boolean;
  showIndicators?: boolean;
  cardWidth?: number;
  cardHeight?: number;
  onCardChange?: (activeCard: CardItem, activeIndex: number) => void;
}

export const DEFAULT_ITEMS: CardItem[] = [
  {
    id: "serenity",
    title: "Alpine Serenity",
    subtitle: "Valais, Switzerland",
    badge: "Europe",
    src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80",
  },
  {
    id: "blossom",
    title: "Floral Whisper",
    subtitle: "Kyoto, Japan",
    badge: "Asia",
    src: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&q=80",
  },
  {
    id: "summit",
    title: "Midnight Summit",
    subtitle: "Tromsø, Norway",
    badge: "Nordic",
    src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
  },
  {
    id: "canopy",
    title: "Verdant Canopy",
    subtitle: "Amazon Basin, Brazil",
    badge: "Tropical",
    src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
  },
];

export function CardSwap({
  items = DEFAULT_ITEMS,
  auto = false,
  every = 4,
  pauseOnHover = true,
  showIndicators = true,
  cardWidth = 240,
  cardHeight = 300,
  onCardChange,
  className,
  ...props
}: CardSwapProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dismissDirection, setDismissDirection] = useState<"left" | "right" | null>(null);
  const [dismissingIndex, setDismissingIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const frontCardRef = useRef<HTMLDivElement | null>(null);
  const componentId = useId();

  const dragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    dx: 0,
    dy: 0,
    startTime: 0,
    pointerId: -1,
  });

  const nextCard = useCallback(() => {
    if (dismissingIndex !== null || items.length <= 1) return;
    setDismissDirection("right");
    setDismissingIndex(activeIndex);

    setTimeout(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % items.length;
        onCardChange?.(items[next], next);
        return next;
      });
      setDismissingIndex(null);
      setDismissDirection(null);
    }, 280);
  }, [activeIndex, dismissingIndex, items, onCardChange]);

  const prevCard = useCallback(() => {
    if (dismissingIndex !== null || items.length <= 1) return;
    setDismissDirection("left");
    setDismissingIndex(activeIndex);

    setTimeout(() => {
      setActiveIndex((prev) => {
        const next = (prev - 1 + items.length) % items.length;
        onCardChange?.(items[next], next);
        return next;
      });
      setDismissingIndex(null);
      setDismissDirection(null);
    }, 280);
  }, [activeIndex, dismissingIndex, items, onCardChange]);

  const jumpTo = (index: number) => {
    if (index === activeIndex || dismissingIndex !== null) return;
    setActiveIndex(index);
    onCardChange?.(items[index], index);
  };

  // 3D Stacking matrix
  const getSlotStyle = (slotIdx: number, isDismissingCurrent: boolean) => {
    if (isDismissingCurrent) {
      const throwX = dismissDirection === "left" ? -280 : 280;
      const throwRot = dismissDirection === "left" ? -14 : 14;
      return {
        transform: `translate3d(${throwX}px, -24px, 60px) rotateZ(${throwRot}deg)`,
        opacity: 0,
        filter: "blur(6px)",
        zIndex: items.length + 10,
        pointerEvents: "none" as const,
      };
    }

    const stepX = 22;
    const stepY = 16;
    const stepZ = 44;

    const x = slotIdx * stepX;
    const y = -slotIdx * stepY;
    const z = -slotIdx * stepZ;
    const blur = slotIdx === 0 ? 0 : Math.min(slotIdx * 1.6, 5);
    const brightness = 1 - slotIdx * 0.12;

    return {
      transform: `translate3d(${x}px, ${y}px, ${z}px) rotateZ(${slotIdx * -1.5}deg) skewY(${Math.max(0, 3 - slotIdx)}deg)`,
      filter: `blur(${blur}px) brightness(${brightness})`,
      zIndex: items.length - slotIdx,
      opacity: 1,
      pointerEvents: (slotIdx === 0 ? "auto" : "none") as "auto" | "none",
    };
  };

  // Pointer & Drag Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || dismissingIndex !== null) return;
    const cardEl = frontCardRef.current;
    if (!cardEl) return;

    cardEl.setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      dx: 0,
      dy: 0,
      startTime: performance.now(),
      pointerId: e.pointerId,
    };
    setIsDragging(true);
    cardEl.style.transition = "none";
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d.active || e.pointerId !== d.pointerId) return;

    d.dx = e.clientX - d.startX;
    d.dy = e.clientY - d.startY;

    // Elastic rubberbanding resistance
    const rubberX = 220 * Math.tanh(d.dx / 220);
    const rubberY = 160 * Math.tanh(d.dy / 160);
    const rotate = rubberX * 0.08;

    if (frontCardRef.current) {
      frontCardRef.current.style.transform = `translate3d(${rubberX}px, ${rubberY}px, 35px) rotate(${rotate}deg)`;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d.active || e.pointerId !== d.pointerId) return;

    d.active = false;
    setIsDragging(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const dist = Math.hypot(d.dx, d.dy);
    const duration = Math.max(1, performance.now() - d.startTime);
    const velocity = dist / duration;

    // Bi-directional swipe gesture check
    if (Math.abs(d.dx) > 65 || (velocity > 0.5 && Math.abs(d.dx) > 25)) {
      if (d.dx < 0) {
        prevCard();
      } else {
        nextCard();
      }
    } else if (frontCardRef.current) {
      frontCardRef.current.style.transition = "transform 0.4s cubic-bezier(0.2, 0.9, 0.3, 1.2)";
      frontCardRef.current.style.transform = "";
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      nextCard();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevCard();
    }
  };

  // Autoplay
  useEffect(() => {
    if (!auto || isDragging || (pauseOnHover && isHovered)) return;

    const interval = setInterval(() => {
      if (!document.hidden) nextCard();
    }, Math.max(1.8, every) * 1000);

    return () => clearInterval(interval);
  }, [auto, every, isDragging, isHovered, nextCard, pauseOnHover]);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Stacked cards showcase"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      className={cn(
        "relative flex flex-col items-center justify-center select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-3xl p-6 transition-colors",
        isDragging ? "cursor-grabbing" : "cursor-default",
        className
      )}
      {...props}
    >
      {/* 3D Viewport Stage */}
      <div
        className="relative"
        style={{
          width: cardWidth,
          height: cardHeight,
          perspective: 1200,
          transformStyle: "preserve-3d",
        }}
      >
        {items.map((card, idx) => {
          const slot = (idx - activeIndex + items.length) % items.length;
          const isFront = slot === 0;
          const isDismissing = dismissingIndex === idx;
          const style = getSlotStyle(slot, isDismissing);

          return (
            <div
              key={card.id}
              ref={isFront ? frontCardRef : null}
              onPointerDown={isFront ? handlePointerDown : undefined}
              onPointerMove={isFront ? handlePointerMove : undefined}
              onPointerUp={isFront ? handlePointerUp : undefined}
              onPointerCancel={isFront ? handlePointerUp : undefined}
              role="group"
              aria-roledescription="slide"
              aria-label={`${idx + 1} of ${items.length}: ${card.title}`}
              aria-hidden={!isFront}
              className={cn(
                "absolute inset-0 rounded-2xl overflow-hidden will-change-transform touch-none",
                "bg-card border border-border/60 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.45)] dark:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.8)]",
                isFront && (isDragging ? "cursor-grabbing" : "cursor-grab hover:border-border")
              )}
              style={{
                ...style,
                transformOrigin: "bottom center",
                transition: getTransition(isDragging && isFront, isDismissing),
              }}
            >
              {/* Media Content */}
              <img
                src={card.src}
                alt={card.title}
                draggable={false}
                loading={idx === 0 ? "eager" : "lazy"}
                className="w-full h-full object-cover select-none pointer-events-none"
              />

              {/* Ambient Vignette Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

              {/* Specular Edge Highlight */}
              <div className="absolute inset-0 ring-1 ring-inset ring-white/15 rounded-2xl pointer-events-none" />

              {/* Metadata / Tags */}
              <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white pointer-events-none">
                <div className="flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm tracking-tight truncate drop-shadow-sm">
                      {card.title}
                    </h4>
                    {card.subtitle && (
                      <p className="text-xs text-white/75 font-medium truncate mt-0.5">
                        {card.subtitle}
                      </p>
                    )}
                  </div>
                  {card.badge && (
                    <span className="shrink-0 text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 font-medium text-white shadow-xs">
                      {card.badge}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Accessible Pagination Indicators */}
      {showIndicators && items.length > 1 && (
        <div
          role="tablist"
          aria-label="Slides navigation"
          className="mt-6 flex items-center gap-1.5 z-20"
        >
          {items.map((c, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={c.id}
                id={`${componentId}-indicator-${idx}`}
                role="tab"
                aria-selected={isActive}
                aria-label={`Slide ${idx + 1}: ${c.title}`}
                type="button"
                onClick={() => jumpTo(idx)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                  isActive
                    ? "w-6 bg-primary shadow-xs"
                    : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                )}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function getTransition(dragging: boolean, dismissing: boolean) {
  if (dragging) return "none";
  if (dismissing) {
    return "transform 0.28s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.28s ease, filter 0.28s ease";
  }
  return "transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1.2), filter 0.45s ease, opacity 0.45s ease";
}

export default CardSwap;
