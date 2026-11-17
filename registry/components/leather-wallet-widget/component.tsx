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
    accentColor: "#636EEA",
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

function StripeWordmark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 25"
      fill="none"
      aria-hidden="true"
      className={cn("h-[19px] w-auto select-none", className)}
    >
      <text
        x="58"
        y="19"
        textAnchor="end"
        fill="currentColor"
        style={{
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontWeight: 800,
          fontSize: "20px",
          letterSpacing: "-0.045em",
        }}
      >
        stripe
      </text>
    </svg>
  );
}

function PayPalMark({ className }: { className?: string }) {
  return (
    <div
      className={cn("inline-flex items-center gap-1.5 select-none", className)}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 26" className="h-[17px] w-[16px] shrink-0" fill="none">
        <path
          d="M7.6 3.2h6.3c3.1 0 5.1 1.6 4.7 4.6-.5 3.6-2.9 5.5-6.5 5.5H9.6l-1.2 7.5H4.8L7.6 3.2Z"
          fill="#1B4298"
        />
        <path
          d="M10.1 7.6h5.5c2.7 0 4.4 1.4 4.1 4-.4 3.1-2.5 4.8-5.6 4.8h-2.1l-1 6.4H7.9l2.2-15.2Z"
          fill="#2697D4"
          fillOpacity="0.92"
        />
      </svg>
      <span
        className="text-[14.5px] font-extrabold italic tracking-[-0.03em]"
        style={{
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <span className="text-[#183B8C]">Pay</span>
        <span className="text-[#1F8ECE]">Pal</span>
      </span>
    </div>
  );
}

function CardBrandLogo({ card }: { card: WalletAccountCard }) {
  if (card.logo === "stripe") {
    return <StripeWordmark className="text-white" />;
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
        outerFrame: "#141415",
        wellBg: "#0B0B0C",
        pocketFill: "#0D0D0E",
        grainOpacity: 0.22,
      };
    }
    if (leatherFinish === "obsidian") {
      return {
        outerFrame: "#09090B",
        wellBg: "#040405",
        pocketFill: "#060607",
        grainOpacity: 0.16,
      };
    }
    return {
      outerFrame: "#171717",
      wellBg: "#0A0A0B",
      pocketFill: "#0B0B0C",
      grainOpacity: 0.34,
    };
  }, [leatherFinish]);

  return (
    <div
      ref={ref}
      role="region"
      aria-label={activeLabel}
      className={cn(
        "relative select-none overflow-hidden",
        "w-[340px] sm:w-[366px] h-[358px] sm:h-[382px]",
        "rounded-[52px] sm:rounded-[56px]",
        "p-[14px] sm:p-[15px]",
        "transition-shadow duration-300",
        className
      )}
      style={{
        backgroundColor: shellColors.outerFrame,
        boxShadow:
          "0 28px 60px -18px rgba(0, 0, 0, 0.38), 0 8px 20px -8px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.09), inset 0 -2px 4px rgba(0, 0, 0, 0.75)",
      }}
      {...props}
    >
      {/* Procedural pebbled leather texture filter */}
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
              baseFrequency="0.42"
              numOctaves="3"
              seed="14"
              result="noise"
            />
            <feColorMatrix
              type="matrix"
              values="0.33 0.33 0.33 0 0
                      0.33 0.33 0.33 0 0
                      0.33 0.33 0.33 0 0
                      0 0 0 0.55 0"
              in="noise"
              result="monoNoise"
            />
            <feSpecularLighting
              in="monoNoise"
              surfaceScale="1.65"
              specularConstant="0.55"
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
          opacity: shellColors.grainOpacity * 0.7,
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

            // Base vertical slot positions matching the reference geometry
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
                      : "0 -6px 16px -4px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255,255,255,0.8)",
                }}
                className={cn(
                  "group absolute inset-x-0 top-0 h-[196px] w-full text-left",
                  "rounded-t-[34px] sm:rounded-t-[37px] px-5 sm:px-6 pt-3.5 sm:pt-4",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80",
                  interactive ? "cursor-pointer" : "cursor-default"
                )}
              >
                <div className="flex items-center justify-between">
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

                  <div className="ml-auto flex items-center">
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
                "linear-gradient(180deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.01) 14%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.42) 100%)",
            }}
          />

          {/* Balance Readout Block */}
          <div className="relative z-10 flex h-full flex-col justify-end px-7 sm:px-8 pb-7 sm:pb-8">
            <div className="flex items-baseline font-semibold tracking-[-0.035em] leading-none tabular-nums">
              <span className="text-[36px] sm:text-[40px] text-[#F5F5F7]">
                {currencySymbol}
                {formattedBalance.primary}
              </span>
              {formattedBalance.secondary && (
                <span className="text-[36px] sm:text-[40px] text-[#6E6E73]">
                  {formattedBalance.secondary}
                </span>
              )}
              {formattedBalance.cents && (
                <span className="text-[22px] sm:text-[24px] text-[#6E6E73] ml-0.5">
                  {formattedBalance.cents}
                </span>
              )}
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-2">
              <p className="text-[14px] sm:text-[15px] font-normal tracking-[-0.01em] text-[#7D7D82]">
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