"use client";

import React, { useCallback, useEffect, useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

export interface PhotoBoxPrint {
  id: string;
  caption: string;
  title: string;
  subtitle: string;
  imageSrc?: string;
  artwork?: "sea" | "cat" | "torii";
}

export interface PhotoBoxProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Primary title displayed on the frosted sleeve (e.g. "写真箱") */
  title?: string;
  /** Secondary label displayed before the print count (e.g. "Photo Box") */
  subtitle?: string;
  /** Collection of keepsake prints stored inside the tray */
  prints?: PhotoBoxPrint[];
  /** Controlled open state of the keepsake tray */
  open?: boolean;
  /** Initial open state when uncontrolled */
  defaultOpen?: boolean;
  /** Callback fired when the tray opens or closes */
  onOpenChange?: (open: boolean) => void;
  /** Accent hex color for the frosted sleeve and pull tab */
  accentColor?: string;
  /** Surface theme */
  theme?: "light" | "dark";
}

const DEFAULT_PRINTS: PhotoBoxPrint[] = [
  {
    id: "summer-sea",
    caption: "夏の海",
    title: "夏の海",
    subtitle: "Summer ocean at sunset",
    artwork: "sea",
  },
  {
    id: "cat-window",
    caption: "ねこ",
    title: "ねこ",
    subtitle: "The cat at the window",
    artwork: "cat",
  },
  {
    id: "torii-journey",
    caption: "旅",
    title: "旅",
    subtitle: "Torii gate on the hill",
    artwork: "torii",
  },
];

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "").trim();
  const normalized =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return `rgba(242, 140, 56, ${alpha})`;
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function darkenHex(hex: string, amount = 0.14): string {
  const clean = hex.replace("#", "").trim();
  const normalized =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return "#D96F2B";
  }
  const factor = Math.max(0, 1 - amount);
  const r = Math.round(parseInt(normalized.slice(0, 2), 16) * factor);
  const g = Math.round(parseInt(normalized.slice(2, 4), 16) * factor);
  const b = Math.round(parseInt(normalized.slice(4, 6), 16) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

function PrintArtwork({
  print,
  uid,
}: {
  print: PhotoBoxPrint;
  uid: string;
}) {
  if (print.imageSrc) {
    return (
      <img
        src={print.imageSrc}
        alt={print.subtitle || print.title}
        className="h-full w-full object-cover"
        draggable={false}
      />
    );
  }

  if (print.artwork === "sea") {
    const gradId = `${uid}-sea-sky`;
    return (
      <svg
        viewBox="0 0 160 160"
        className="h-full w-full select-none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EE8B53" />
            <stop offset="55%" stopColor="#F5BA7A" />
            <stop offset="100%" stopColor="#FCE0A2" />
          </linearGradient>
        </defs>
        <rect width="160" height="102" fill={`url(#${gradId})`} />
        <path
          d="M108 38 Q113 33 118 37 Q123 33 128 38"
          fill="none"
          stroke="#4E3833"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <circle cx="80" cy="102" r="24" fill="#FFF7D6" />
        <rect y="102" width="160" height="58" fill="#2A3B5C" />
        <line
          x1="46"
          y1="112"
          x2="114"
          y2="112"
          stroke="#E8C587"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <line
          x1="56"
          y1="121"
          x2="104"
          y2="121"
          stroke="#D4B582"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="64"
          y1="130"
          x2="96"
          y2="130"
          stroke="#8FA3C4"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <line
          x1="71"
          y1="139"
          x2="89"
          y2="139"
          stroke="#7288AD"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (print.artwork === "torii") {
    return (
      <svg
        viewBox="0 0 160 160"
        className="h-full w-full select-none"
        aria-hidden="true"
      >
        <rect width="160" height="160" fill="#A8D0F4" />
        <ellipse cx="42" cy="40" rx="18" ry="8" fill="#F2F8FE" />
        <ellipse cx="118" cy="36" rx="20" ry="9" fill="#F2F8FE" />
        <path d="M0 116 Q80 94 160 118 L160 160 L0 160 Z" fill="#5FA67A" />
        <path
          d="M36 58 Q80 65 124 58 L120 66 Q80 71 40 66 Z"
          fill="#E5492E"
        />
        <rect x="48" y="75" width="64" height="7" rx="1.5" fill="#E5492E" />
        <rect x="76" y="65" width="8" height="12" fill="#C93B23" />
        <rect x="56" y="65" width="9" height="54" rx="1.5" fill="#E5492E" />
        <rect x="95" y="65" width="9" height="54" rx="1.5" fill="#E5492E" />
        <rect x="54" y="114" width="13" height="6" rx="1" fill="#3B3A3D" />
        <rect x="93" y="114" width="13" height="6" rx="1" fill="#3B3A3D" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 160 160"
      className="h-full w-full select-none"
      aria-hidden="true"
    >
      <rect width="160" height="160" fill="#C8E0D6" />
      <rect
        x="98"
        y="18"
        width="44"
        height="44"
        rx="4"
        fill="#E8F3EE"
        stroke="#AFCBC0"
        strokeWidth="2.5"
      />
      <line
        x1="120"
        y1="18"
        x2="120"
        y2="62"
        stroke="#AFCBC0"
        strokeWidth="2.2"
      />
      <line
        x1="98"
        y1="40"
        x2="142"
        y2="40"
        stroke="#AFCBC0"
        strokeWidth="2.2"
      />
      <path
        d="M32 160 L32 104 L42 66 L62 84 Q80 81 98 84 L118 66 L128 104 L128 160 Z"
        fill="#4D4D56"
      />
      <ellipse cx="62" cy="111" rx="10.5" ry="7.5" fill="#F2C94C" />
      <ellipse cx="98" cy="111" rx="10.5" ry="7.5" fill="#F2C94C" />
      <rect x="60.5" y="104.5" width="3" height="13" rx="1.5" fill="#1E1E24" />
      <rect x="96.5" y="104.5" width="3" height="13" rx="1.5" fill="#1E1E24" />
      <polygon points="76,123 84,123 80,129" fill="#F29CA3" />
      <line
        x1="24"
        y1="124"
        x2="45"
        y2="127"
        stroke="#F4F6F8"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <line
        x1="24"
        y1="133"
        x2="45"
        y2="132"
        stroke="#F4F6F8"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <line
        x1="136"
        y1="124"
        x2="115"
        y2="127"
        stroke="#F4F6F8"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <line
        x1="136"
        y1="133"
        x2="115"
        y2="132"
        stroke="#F4F6F8"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const SPRING_TRAY = {
  type: "spring" as const,
  stiffness: 280,
  damping: 30,
  mass: 0.9,
};

const SPRING_CARD = {
  type: "spring" as const,
  stiffness: 320,
  damping: 28,
  mass: 0.85,
};

export const PhotoBox = React.forwardRef<HTMLDivElement, PhotoBoxProps>(
  (
    {
      title = "写真箱",
      subtitle = "Photo Box",
      prints = DEFAULT_PRINTS,
      open: controlledOpen,
      defaultOpen = false,
      onOpenChange,
      accentColor = "#F28C38",
      theme = "light",
      className,
      ...rest
    },
    ref
  ) => {
    const rawUid = useId();
    const uid = rawUid.replace(/:/g, "");
    const shouldReduceMotion = useReducedMotion();
    const isControlled = controlledOpen !== undefined;
    const [internalOpen, setInternalOpen] = useState(defaultOpen);
    const isOpen = isControlled ? controlledOpen : internalOpen;

    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const setOpen = useCallback(
      (next: boolean) => {
        if (!isControlled) {
          setInternalOpen(next);
        }
        onOpenChange?.(next);
        if (!next) {
          setHoveredId(null);
        }
      },
      [isControlled, onOpenChange]
    );

    useEffect(() => {
      if (!isControlled) {
        setInternalOpen(defaultOpen);
      }
    }, [defaultOpen, isControlled]);

    useEffect(() => {
      if (selectedIndex === null || prints.length === 0) return;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setSelectedIndex(null);
        } else if (e.key === "ArrowRight") {
          setSelectedIndex((prev) =>
            prev === null ? null : (prev + 1) % prints.length
          );
        } else if (e.key === "ArrowLeft") {
          setSelectedIndex((prev) =>
            prev === null ? null : (prev - 1 + prints.length) % prints.length
          );
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedIndex, prints.length]);

    const printCount = prints.length;
    const activePrint =
      selectedIndex !== null ? prints[selectedIndex] ?? null : null;

    const instantTransition = { duration: 0.01 };
    const trayTransition = shouldReduceMotion ? instantTransition : SPRING_TRAY;
    const cardTransition = shouldReduceMotion ? instantTransition : SPRING_CARD;

    const sleeveGradient = `linear-gradient(135deg, ${hexToRgba(
      accentColor,
      0.88
    )} 0%, ${hexToRgba(accentColor, 0.78)} 60%, ${hexToRgba(
      darkenHex(accentColor, 0.1),
      0.82
    )} 100%)`;

    const tabColor = darkenHex(accentColor, 0.14);
    const isDark = theme === "dark";

    const getCardTransform = (idx: number, total: number, hovered: boolean) => {
      const center = (total - 1) / 2;
      const offset = idx - center;
      const baseRotate = offset * 6.5;
      const baseX = offset * 72;
      const baseY = Math.abs(offset) * 5;

      if (!isOpen) {
        return {
          x: offset * 28,
          y: 26,
          rotate: offset * 2,
          scale: 0.9,
          opacity: 0.85,
        };
      }

      if (hovered && !shouldReduceMotion) {
        return {
          x: baseX,
          y: -54,
          rotate: 0,
          scale: 1.07,
          opacity: 1,
        };
      }

      return {
        x: baseX,
        y: -16 + baseY,
        rotate: baseRotate,
        scale: 1,
        opacity: 1,
      };
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full items-center justify-center py-12 select-none",
          isDark ? "text-zinc-100" : "text-zinc-900",
          className
        )}
        {...rest}
      >
        {/* Stage container */}
        <div
          className={cn(
            "relative flex h-[220px] w-[280px] items-center justify-center transition-transform duration-300 sm:w-[300px]",
            isOpen && "max-sm:scale-[0.76]"
          )}
        >
          {/* Inner Tray (slides right when opened) */}
          <motion.div
            initial={false}
            animate={{
              x: isOpen ? 108 : 0,
            }}
            transition={trayTransition}
            className="relative h-[176px] w-[276px] sm:h-[186px] sm:w-[292px]"
          >
            {/* Right Pull Tab */}
            <button
              type="button"
              onClick={() => setOpen(!isOpen)}
              aria-expanded={isOpen}
              aria-label={isOpen ? "Close photo box" : "Open photo box"}
              style={{ backgroundColor: tabColor }}
              className="absolute top-1/2 -right-3 z-10 flex h-12 w-3.5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-r-lg shadow-sm transition-transform hover:translate-x-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
            />

            {/* Tray Back Wall */}
            <div
              className={cn(
                "relative h-full w-full rounded-[14px] shadow-[0_10px_28px_rgba(0,0,0,0.08)]",
                isDark
                  ? "bg-gradient-to-b from-[#3A3229] to-[#2E2720] ring-1 ring-white/10"
                  : "bg-gradient-to-b from-[#CDBB9F] to-[#D9C8AE] ring-1 ring-black/5"
              )}
            >
              {/* Prints Container */}
              <div className="absolute inset-x-0 bottom-[66px] flex items-end justify-center">
                {prints.map((print, idx) => {
                  const isHovered = hoveredId === print.id;
                  const transform = getCardTransform(
                    idx,
                    printCount,
                    isHovered
                  );

                  return (
                    <motion.button
                      key={print.id}
                      type="button"
                      disabled={!isOpen}
                      tabIndex={isOpen ? 0 : -1}
                      aria-label={`View ${print.title} — ${print.subtitle}`}
                      onMouseEnter={() => isOpen && setHoveredId(print.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onFocus={() => isOpen && setHoveredId(print.id)}
                      onBlur={() => setHoveredId(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isOpen) {
                          setOpen(true);
                          return;
                        }
                        setSelectedIndex(idx);
                      }}
                      initial={false}
                      animate={transform}
                      transition={cardTransition}
                      style={{
                        zIndex: isHovered ? 45 : 15 + idx,
                      }}
                      className={cn(
                        "absolute flex w-[92px] flex-col rounded-[6px] bg-[#FAF8F3] p-1.5 pb-2.5 text-left shadow-[0_6px_16px_rgba(0,0,0,0.14)] ring-1 ring-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 sm:w-[98px]",
                        isOpen ? "cursor-pointer" : "pointer-events-none"
                      )}
                    >
                      <div className="aspect-square w-full overflow-hidden rounded-[2px] ring-1 ring-black/10">
                        <PrintArtwork print={print} uid={`${uid}-${idx}`} />
                      </div>
                      <span className="mt-1.5 block w-full truncate text-center text-[10px] font-medium tracking-wide text-[#5E5A54]">
                        {print.caption}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Front Pocket Lip with Semi-Circular Thumb Notch */}
              <div
                onClick={() => setOpen(!isOpen)}
                className="absolute inset-x-0 bottom-0 z-30 h-[84px] cursor-pointer overflow-hidden rounded-b-[14px]"
              >
                <svg
                  viewBox="0 0 292 84"
                  preserveAspectRatio="none"
                  className="h-full w-full"
                  aria-hidden="true"
                >
                  <path
                    d="M0 0 H122 A24 22 0 0 0 170 0 H292 V70 A14 14 0 0 1 278 84 H14 A14 14 0 0 1 0 70 Z"
                    fill={isDark ? "#433A30" : "#EFE5D5"}
                  />
                  <path
                    d="M0 0.5 H122 A24 22 0 0 0 170 0.5 H292"
                    fill="none"
                    stroke={
                      isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)"
                    }
                    strokeWidth="1"
                  />
                </svg>

                <div className="pointer-events-none absolute inset-x-0 bottom-4 flex items-center justify-center">
                  <span
                    className={cn(
                      "text-[9px] font-semibold tracking-[0.24em] uppercase",
                      isDark ? "text-stone-300/75" : "text-[#7D6E5D]"
                    )}
                  >
                    PRINTS · {printCount}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Outer Frosted Sleeve (slides left when opened) */}
          <motion.button
            type="button"
            onClick={() => setOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label={
              isOpen
                ? `Close ${subtitle} (${printCount} prints)`
                : `Open ${subtitle} (${printCount} prints)`
            }
            initial={false}
            animate={{
              x: isOpen ? -108 : 0,
            }}
            transition={trayTransition}
            style={{
              background: sleeveGradient,
              boxShadow: isDark
                ? "0 20px 44px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.35)"
                : "0 18px 36px rgba(0, 0, 0, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
            }}
            className="absolute z-40 flex h-[180px] w-[280px] cursor-pointer flex-col justify-end overflow-hidden rounded-[15px] p-5 text-left backdrop-blur-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500 sm:h-[190px] sm:w-[296px]"
          >
            {/* Subtle frosted inner rim */}
            <div
              className="pointer-events-none absolute inset-0 rounded-[15px] ring-1 ring-inset ring-white/25"
              aria-hidden="true"
            />

            <div className="relative z-10 flex flex-col">
              <span className="text-[19px] leading-tight font-semibold tracking-tight text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]">
                {title}
              </span>
              <span className="mt-1 text-[11.5px] font-normal tracking-wide text-white/90">
                {subtitle} · {printCount}{" "}
                {printCount === 1 ? "print" : "prints"}
              </span>

              {/* Twin horizontal ruled stationery lines */}
              <div className="mt-2.5 flex flex-col gap-[5px]">
                <div className="h-[1px] w-full bg-white/30" />
                <div className="h-[1px] w-full bg-white/25" />
              </div>
            </div>
          </motion.button>
        </div>

        {/* Expanded Print Detail View */}
        <AnimatePresence>
          {activePrint && (
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={`${activePrint.title} — ${activePrint.subtitle}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={
                shouldReduceMotion
                  ? instantTransition
                  : { duration: 0.2, ease: "easeOut" }
              }
              onClick={() => setSelectedIndex(null)}
              className={cn(
                "fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center overflow-y-auto p-6 backdrop-blur-sm",
                isDark ? "bg-black/65" : "bg-[#F4F4F3]/70"
              )}
            >
              <motion.div
                initial={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.84, y: 20 }
                }
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.9, y: 12 }
                }
                transition={cardTransition}
                className="relative flex flex-col items-center"
              >
                {/* Polaroid Frame */}
                <div className="w-[260px] rounded-[8px] bg-[#FAF8F3] p-4 pb-6 shadow-[0_24px_60px_rgba(0,0,0,0.16)] ring-1 ring-black/5 sm:w-[300px]">
                  <div className="aspect-square w-full overflow-hidden rounded-[2px] ring-1 ring-black/10">
                    <PrintArtwork
                      print={activePrint}
                      uid={`${uid}-modal-${activePrint.id}`}
                    />
                  </div>
                  <p className="mt-4 text-center text-[20px] font-medium tracking-wide text-[#57534E]">
                    {activePrint.caption}
                  </p>
                </div>

                {/* Title & Subtitle */}
                <div className="mt-4 flex flex-col items-center text-center">
                  <h3
                    className={cn(
                      "text-[16px] font-semibold tracking-tight",
                      isDark ? "text-zinc-100" : "text-zinc-800"
                    )}
                  >
                    {activePrint.title}
                  </h3>
                  <p
                    className={cn(
                      "mt-0.5 text-[12.5px]",
                      isDark ? "text-zinc-400" : "text-zinc-500"
                    )}
                  >
                    {activePrint.subtitle}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

PhotoBox.displayName = "PhotoBox";

export { PhotoBox as component, PhotoBox as Component };
export default PhotoBox;