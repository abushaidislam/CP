"use client";

import React, { useId, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

export interface WalletAccountCard {
  id: string;
  name: string;
  balance: number;
  accentColor: string;
  textColor?: string;
  logo: "stripe" | "paypal" | "mercury" | "custom";
  customBadge?: string;
  last4?: string;
  status?: string;
}

export interface LeatherWalletWidgetProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  cards?: WalletAccountCard[];
  currencySymbol?: string;
  balanceLabel?: string;
  totalBalanceOverride?: number;
  selectedCardId?: string | null;
  onCardSelect?: (card: WalletAccountCard | null) => void;
  interactive?: boolean;
  showCents?: boolean;
  leatherFinish?: "pebbled" | "matte" | "obsidian";
  className?: string;
}

const DEFAULT_CARDS: WalletAccountCard[] = [
  {
    id: "stripe",
    name: "Stripe",
    balance: 84500,
    accentColor: "#6372E8",
    textColor: "#FFFFFF",
    logo: "stripe",
    last4: "4821",
    status: "Connected",
  },
  {
    id: "paypal",
    name: "PayPal",
    balance: 35500,
    accentColor: "#FFFFFF",
    textColor: "#0F172A",
    logo: "paypal",
    last4: "9034",
    status: "Verified",
  },
];

/**
 * Pure vector SVG paths for Stripe wordmark (no <text> font dependency)
 */
function StripeWordmark({ className }: { className?: string }) {
  return (
    <svg
      width="52"
      height="22"
      viewBox="0 0 60 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("block shrink-0 select-none", className)}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M59.64 14.28C59.64 10.04 57.58 6.69 53.65 6.69C49.7 6.69 47.31 10.04 47.31 14.24C47.31 19.22 50.12 21.74 54.16 21.74C56.13 21.74 57.62 21.29 58.75 20.66V17.44C57.62 18.01 56.32 18.36 54.68 18.36C53.07 18.36 51.64 17.79 51.46 15.83H59.6C59.6 15.61 59.64 14.76 59.64 14.28ZM51.41 12.71C51.41 10.83 52.56 10.05 53.63 10.05C54.67 10.05 55.76 10.83 55.76 12.71H51.41ZM40.82 6.69C39.24 6.69 38.22 7.43 37.65 7.95L37.44 6.95H33.84V26.25L37.93 25.38L37.95 20.7C38.54 21.13 39.41 21.74 40.85 21.74C43.78 21.74 46.45 19.38 46.45 14.17C46.43 9.41 43.72 6.69 40.82 6.69ZM39.84 18.23C38.88 18.23 38.31 17.89 37.95 17.46L37.93 11.16C38.32 10.69 38.91 10.36 39.84 10.36C41.3 10.36 42.31 11.99 42.31 14.28C42.31 16.63 41.32 18.23 39.84 18.23ZM28.24 5.71L32.35 4.83V1.5L28.24 2.37V5.71ZM28.24 6.96H32.35V21.46H28.24V6.96ZM23.83 8.17L23.57 6.96H20.03V21.46H24.12V11.63C25.09 10.36 26.73 10.6 27.24 10.78V6.96C26.71 6.76 24.8 6.4 23.83 8.17ZM15.65 3.37L11.66 4.22L11.64 17.33C11.64 19.75 13.46 21.54 15.88 21.54C17.22 21.54 18.2 21.29 18.74 21V17.68C18.22 17.89 15.63 18.64 15.63 16.23V10.45H18.74V6.96H15.63L15.65 3.37ZM4.46 11.17C4.46 10.53 4.99 10.28 5.86 10.28C7.11 10.28 8.69 10.66 9.94 11.33V7.47C8.57 6.93 7.22 6.71 5.86 6.71C2.52 6.71 0.3 8.45 0.3 11.37C0.3 15.92 6.56 15.19 6.56 17.16C6.56 17.92 5.9 18.17 4.98 18.17C3.61 18.17 1.86 17.61 0.48 16.85V20.76C2.01 21.42 3.56 21.7 4.98 21.7C8.4 21.7 10.75 20.01 10.75 17.05C10.73 12.14 4.46 13.02 4.46 11.17Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

/**
 * Pure vector SVG PayPal icon + wordmark (guaranteed visibility across all browsers)
 */
function PayPalMark({ className }: { className?: string }) {
  return (
    <svg
      width="82"
      height="21"
      viewBox="0 0 96 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("block shrink-0 select-none", className)}
    >
      {/* Overlapping P monogram */}
      <path
        d="M6.4 2.2H12.9C16.1 2.2 18.1 3.8 17.6 7.0C17.1 10.7 14.6 12.7 10.9 12.7H8.4L7.2 20.4H3.5L6.4 2.2Z"
        fill="#173A8A"
      />
      <path
        d="M9.1 6.8H14.8C17.6 6.8 19.4 8.2 19.0 11.0C18.6 14.2 16.4 16.0 13.2 16.0H11.0L10.0 22.5H6.8L9.1 6.8Z"
        fill="#228CE0"
        fillOpacity="0.94"
      />
      {/* Pay */}
      <path
        d="M26.5 5.4H31.8C34.4 5.4 36.0 6.7 35.6 9.3C35.2 12.2 33.2 13.8 30.2 13.8H28.1L27.2 19.4H24.3L26.5 5.4ZM28.6 11.4H30.1C31.6 11.4 32.5 10.6 32.7 9.4C32.9 8.3 32.2 7.7 30.8 7.7H29.2L28.6 11.4Z"
        fill="#173A8A"
      />
      <path
        d="M43.9 9.2H46.6L45.0 19.4H42.4L42.6 18.1C41.8 19.0 40.7 19.6 39.4 19.6C37.0 19.6 35.6 17.8 36.0 14.8C36.4 11.6 38.6 9.0 41.3 9.0C42.5 9.0 43.4 9.5 43.8 10.3L43.9 9.2ZM40.5 17.3C42.0 17.3 43.2 16.0 43.4 14.3C43.7 12.6 42.8 11.3 41.4 11.3C39.9 11.3 38.8 12.6 38.5 14.3C38.3 16.0 39.1 17.3 40.5 17.3Z"
        fill="#173A8A"
      />
      <path
        d="M50.5 9.2L51.8 15.8L54.9 9.2H57.7L51.3 22.8H48.5L50.3 19.1L47.8 9.2H50.5Z"
        fill="#173A8A"
      />
      {/* Pal */}
      <path
        d="M60.2 5.4H65.5C68.1 5.4 69.7 6.7 69.3 9.3C68.9 12.2 66.9 13.8 63.9 13.8H61.8L60.9 19.4H58.0L60.2 5.4ZM62.3 11.4H63.8C65.3 11.4 66.2 10.6 66.4 9.4C66.6 8.3 65.9 7.7 64.5 7.7H62.9L62.3 11.4Z"
        fill="#1D8AD8"
      />
      <path
        d="M77.6 9.2H80.3L78.7 19.4H76.1L76.3 18.1C75.5 19.0 74.4 19.6 73.1 19.6C70.7 19.6 69.3 17.8 69.7 14.8C70.1 11.6 72.3 9.0 75.0 9.0C76.2 9.0 77.1 9.5 77.5 10.3L77.6 9.2ZM74.2 17.3C75.7 17.3 76.9 16.0 77.1 14.3C77.4 12.6 76.5 11.3 75.1 11.3C73.6 11.3 72.5 12.6 72.2 14.3C72.0 16.0 72.8 17.3 74.2 17.3Z"
        fill="#1D8AD8"
      />
      <path
        d="M83.7 5.0H86.4L84.1 19.4H81.4L83.7 5.0Z"
        fill="#1D8AD8"
      />
    </svg>
  );
}

function CardBrandLogo({ card }: { card: WalletAccountCard }) {
  if (card.logo === "stripe") {
    return <StripeWordmark />;
  }
  if (card.logo === "paypal") {
    return <PayPalMark />;
  }
  return (
    <span className="text-[15px] font-bold tracking-tight">
      {card.customBadge || card.name}
    </span>
  );
}

const LeatherWalletWidget = React.forwardRef<
  HTMLDivElement,
  LeatherWalletWidgetProps
>(function LeatherWalletWidget(
  {
    cards = DEFAULT_CARDS,
    currencySymbol = "$",
    balanceLabel = "Total Balance",
    totalBalanceOverride,
    selectedCardId: controlledSelectedId,
    onCardSelect,
    interactive = true,
    showCents = false,
    leatherFinish = "pebbled",
    className,
    ...props
  },
  ref
) {
  const uid = useId();
  const prefersReducedMotion = useReducedMotion();
  const [uncontrolledSelectedId, setUncontrolledSelectedId] = useState<
    string | null
  >(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  const activeCardId =
    controlledSelectedId !== undefined
      ? controlledSelectedId
      : uncontrolledSelectedId;

  const safeCards = useMemo(
    () => (cards && cards.length > 0 ? cards.slice(0, 3) : DEFAULT_CARDS),
    [cards]
  );

  const selectedCard = useMemo(
    () => safeCards.find((c) => c.id === activeCardId) ?? null,
    [safeCards, activeCardId]
  );

  const computedTotal = useMemo(() => {
    if (
      typeof totalBalanceOverride === "number" &&
      Number.isFinite(totalBalanceOverride)
    ) {
      return totalBalanceOverride;
    }
    if (selectedCard) {
      return selectedCard.balance;
    }
    return safeCards.reduce(
      (sum, item) => sum + (Number.isFinite(item.balance) ? item.balance : 0),
      0
    );
  }, [totalBalanceOverride, selectedCard, safeCards]);

  // Reference dual-tone split: "$120," in bright white (#F5F5F7) and "000" in muted gray (#7E7E83)
  const formattedBalance = useMemo(() => {
    const abs = Math.max(0, computedTotal);
    const fixed = showCents ? abs.toFixed(2) : Math.round(abs).toString();
    const [intRaw, decPart] = fixed.split(".");
    const withCommas = intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    if (withCommas.length > 3) {
      const splitIdx = withCommas.length - 3;
      return {
        primary: withCommas.slice(0, splitIdx),
        secondary: withCommas.slice(splitIdx),
        cents: decPart ? `.${decPart}` : "",
      };
    }

    return {
      primary: withCommas,
      secondary: "",
      cents: decPart ? `.${decPart}` : "",
    };
  }, [computedTotal, showCents]);

  const activeLabel = selectedCard ? `${selectedCard.name} Balance` : balanceLabel;

  const handleCardToggle = (card: WalletAccountCard) => {
    if (!interactive) return;
    const nextId = activeCardId === card.id ? null : card.id;
    if (controlledSelectedId === undefined) {
      setUncontrolledSelectedId(nextId);
    }
    onCardSelect?.(nextId ? card : null);
  };

  const grainFilterId = `${uid}-leather-grain`;
  const pocketClipId = `${uid}-pocket-clip`;

  const shellColors = useMemo(() => {
    if (leatherFinish === "matte") {
      return {
        outerFrame: "#19191A",
        wellBg: "#0D0D0E",
        pocketFill: "#111112",
        grainOpacity: 0.28,
      };
    }
    if (leatherFinish === "obsidian") {
      return {
        outerFrame: "#111113",
        wellBg: "#070708",
        pocketFill: "#0A0A0B",
        grainOpacity: 0.22,
      };
    }
    return {
      outerFrame: "#1B1B1C",
      wellBg: "#0C0C0D",
      pocketFill: "#0E0E0F",
      grainOpacity: 0.42,
    };
  }, [leatherFinish]);

  return (
    <div
      ref={ref}
      role="region"
      aria-label={activeLabel}
      className={cn(
        "relative select-none overflow-hidden",
        "w-[344px] sm:w-[366px] h-[360px] sm:h-[382px]",
        "rounded-[52px] sm:rounded-[56px]",
        "p-[14px] sm:p-[15px]",
        "transition-shadow duration-300",
        className
      )}
      style={{
        backgroundColor: shellColors.outerFrame,
        boxShadow:
          "0 26px 56px -18px rgba(0, 0, 0, 0.34), 0 8px 20px -8px rgba(0, 0, 0, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.09), inset 0 -2px 4px rgba(0, 0, 0, 0.72)",
      }}
      {...props}
    >
      {/* Procedural pebbled leather grain & pocket notch clipPath */}
      <svg
        width="0"
        height="0"
        className="pointer-events-none absolute opacity-0"
        aria-hidden="true"
      >
        <defs>
          <filter
            id={grainFilterId}
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.46"
              numOctaves="3"
              seed="14"
              result="noise"
            />
            <feColorMatrix
              type="matrix"
              values="0.33 0.33 0.33 0 0
                      0.33 0.33 0.33 0 0
                      0.33 0.33 0.33 0 0
                      0 0 0 0.62 0"
              in="noise"
              result="monoNoise"
            />
            <feSpecularLighting
              in="monoNoise"
              surfaceScale="1.8"
              specularConstant="0.62"
              specularExponent="18"
              lightingColor="#FFFFFF"
              result="specular"
            >
              <feDistantLight azimuth="225" elevation="58" />
            </feSpecularLighting>
            <feComposite
              in="specular"
              in2="SourceAlpha"
              operator="in"
              result="clippedSpecular"
            />
          </filter>

          {/* Front leather pocket silhouette with symmetrical center thumb notch */}
          <clipPath id={pocketClipId} clipPathUnits="objectBoundingBox">
            <path
              d="
                M 0,0.068
                L 0.145,0.068
                C 0.215,0.068 0.242,0.002 0.312,0.002
                L 0.688,0.002
                C 0.758,0.002 0.785,0.068 0.855,0.068
                L 1,0.068
                L 1,1
                L 0,1
                Z
              "
            />
          </clipPath>
        </defs>
      </svg>

      {/* Outer leather rim grain overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[52px] sm:rounded-[56px]"
        style={{
          filter: `url(#${grainFilterId})`,
          opacity: shellColors.grainOpacity * 0.75,
          mixBlendMode: "screen",
        }}
      />

      {/* Inner recessed card chamber */}
      <div
        className="relative h-full w-full overflow-hidden rounded-[40px] sm:rounded-[43px]"
        style={{
          backgroundColor: shellColors.wellBg,
          boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.9)",
        }}
      >
        {/* Stacked Payment Provider Cards */}
        <div className="relative h-full w-full">
          {safeCards.map((card, index) => {
            const isSelected = activeCardId === card.id;
            const isHovered = hoveredCardId === card.id;

            const baseTop = index === 0 ? 4 : index === 1 ? 56 : 104;
            const hoverOffset =
              !interactive || prefersReducedMotion
                ? 0
                : isSelected
                ? -10
                : isHovered
                ? -7
                : 0;

            return (
              <motion.button
                key={card.id}
                type="button"
                disabled={!interactive}
                aria-pressed={interactive ? isSelected : undefined}
                aria-label={`${card.name}: ${currencySymbol}${card.balance.toLocaleString()}`}
                onClick={() => handleCardToggle(card)}
                onMouseEnter={() => interactive && setHoveredCardId(card.id)}
                onMouseLeave={() => interactive && setHoveredCardId(null)}
                onFocus={() => interactive && setHoveredCardId(card.id)}
                onBlur={() => interactive && setHoveredCardId(null)}
                initial={false}
                animate={{
                  y: baseTop + hoverOffset,
                  scale: isSelected && !prefersReducedMotion ? 1.008 : 1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 32,
                  mass: 0.8,
                }}
                style={{
                  backgroundColor: card.accentColor,
                  color: card.textColor || "#FFFFFF",
                  zIndex: index + 1,
                  boxShadow:
                    index === 0
                      ? "inset 0 1px 0 rgba(255,255,255,0.28), 0 4px 12px rgba(0,0,0,0.35)"
                      : "0 -6px 16px -4px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255,255,255,0.85)",
                }}
                className={cn(
                  "group absolute inset-x-0 top-0 h-[196px] w-full text-left",
                  "rounded-t-[34px] sm:rounded-t-[37px] px-5 sm:px-6 pt-3.5 sm:pt-4",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80",
                  interactive ? "cursor-pointer" : "cursor-default"
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span
                    className={cn(
                      "text-[11px] font-medium tracking-wide transition-opacity duration-200",
                      interactive && (isHovered || isSelected)
                        ? "opacity-80"
                        : "opacity-0"
                    )}
                  >
                    {card.last4 ? `•••• ${card.last4}` : card.status || ""}
                  </span>

                  <div className="ml-auto flex shrink-0 items-center justify-end pr-0.5">
                    <CardBrandLogo card={card} />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Front Leather Pocket Overlay with Center Notch */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[214px] sm:h-[228px]"
          style={{
            clipPath: `url(#${pocketClipId})`,
            backgroundColor: shellColors.pocketFill,
          }}
        >
          {/* Pebbled leather grain texture across the pocket face */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              filter: `url(#${grainFilterId})`,
              opacity: shellColors.grainOpacity,
              mixBlendMode: "screen",
            }}
          />

          {/* Subtle top edge highlight & inner depth gradient */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.01) 14%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.44) 100%)",
            }}
          />

          {/* Balance Readout Block — calibrated typography scale, weight & dual-tone colors */}
          <div className="relative z-10 flex h-full flex-col justify-end px-7 sm:px-8 pb-7 sm:pb-8">
            <div
              className="flex items-baseline font-medium tracking-[-0.03em] leading-none tabular-nums"
              style={{
                fontFamily:
                  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              <span className="text-[38px] sm:text-[42px] text-[#F5F5F7]">
                {currencySymbol}
                {formattedBalance.primary}
              </span>
              {formattedBalance.secondary && (
                <span className="text-[38px] sm:text-[42px] text-[#8E8E93]">
                  {formattedBalance.secondary}
                </span>
              )}
              {formattedBalance.cents && (
                <span className="ml-0.5 text-[22px] sm:text-[24px] text-[#8E8E93]">
                  {formattedBalance.cents}
                </span>
              )}
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-2">
              <p
                className="text-[14.5px] sm:text-[15.5px] font-normal tracking-[-0.01em] text-[#8E8E93]"
                style={{
                  fontFamily:
                    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
              >
                {activeLabel}
              </p>

              {selectedCard && interactive && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardToggle(selectedCard);
                  }}
                  className="pointer-events-auto rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-neutral-300 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60"
                >
                  All accounts
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Inner pocket perimeter rim shadow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 rounded-[40px] sm:rounded-[43px]"
          style={{
            boxShadow:
              "inset 0 0 0 1px rgba(255, 255, 255, 0.045), inset 0 -10px 22px -12px rgba(0, 0, 0, 0.85)",
          }}
        />
      </div>
    </div>
  );
});

export {
  LeatherWalletWidget,
  LeatherWalletWidget as component,
  LeatherWalletWidget as Component,
};
export default LeatherWalletWidget;