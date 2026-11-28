"use client";

import React, { useEffect, useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

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
  /** Enables hover peek and click-to-pull-out card interaction */
  interactive?: boolean;
  /** Gently cycles a sequential peek animation across the three pocket cards */
  autoPeek?: boolean;
  /** Color theme override ("auto" follows Tailwind dark: class) */
  theme?: PocketTheme;
  /** Controlled active (pulled-out) card index (0, 1, 2, or null) */
  activeIndex?: number | null;
  /** Callback fired when a user toggles a pocket card open or closed */
  onActiveIndexChange?: (index: number | null) => void;
}

const SPRING_TRANSITION = {
  type: "spring" as const,
  stiffness: 340,
  damping: 28,
  mass: 0.85,
};

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

function CakeStickerIllustration({ uid }: { uid: string }) {
  return (
    <div
      aria-hidden="true"
      className="h-[46px] w-[46px] shrink-0 rotate-[3deg] overflow-hidden rounded-[8px] border-2 border-white bg-[#233142] shadow-[0_6px_14px_rgba(74,29,94,0.22)]"
    >
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
        <circle cx="17.2" cy="17.2" r="0.8" fill="#9BB0FF" />
      </svg>
    </div>
  );
}

function TrailMapIllustration({ uid }: { uid: string }) {
  return (
    <div
      aria-hidden="true"
      className="h-[52px] w-full overflow-hidden rounded-[9px] border border-[#E7D48C] bg-[#FFF8DB]"
    >
      <svg viewBox="0 0 180 54" className="h-full w-full">
        <defs>
          <linearGradient id={`${uid}-map-bg`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFBEF" />
            <stop offset="100%" stopColor="#F8ECC1" />
          </linearGradient>
        </defs>
        <rect width="180" height="54" fill={`url(#${uid}-map-bg)`} />
        <path
          d="M12 40c8-14 22-24 38-20s24 14 38 12 22-18 38-16 32 10 40 24v14H12V40z"
          fill="#E2EED6"
          fillOpacity="0.85"
        />
        <ellipse cx="92" cy="31" rx="18" ry="11" fill="#D2E6C5" />
        <ellipse cx="144" cy="29" rx="15" ry="12" fill="#CBE2DC" />
        <path
          d="M22 36 C 36 16, 56 16, 70 30 S 104 44, 122 28 S 146 18, 158 26"
          fill="none"
          stroke="#C84664"
          strokeWidth="2"
          strokeDasharray="3.5 3"
          strokeLinecap="round"
        />
        <circle
          cx="22"
          cy="36"
          r="3.5"
          fill="#E83A76"
          stroke="#FFFFFF"
          strokeWidth="1.4"
        />
        <circle
          cx="92"
          cy="34"
          r="2.6"
          fill="#C84664"
          stroke="#FFFFFF"
          strokeWidth="1.1"
        />
        <circle
          cx="158"
          cy="26"
          r="3.8"
          fill="#E83A76"
          stroke="#FFFFFF"
          strokeWidth="1.4"
        />
        <circle cx="158" cy="26" r="1.4" fill="#FFFFFF" />
      </svg>
    </div>
  );
}

function EssayNoteStickers() {
  return (
    <div aria-hidden="true" className="relative h-[56px] w-[60px] shrink-0">
      <div className="absolute left-0 top-0.5 h-[48px] w-[36px] -rotate-[8deg] rounded-[5px] border border-white bg-[#EFE9F5] p-1.5 shadow-[0_4px_10px_rgba(74,29,94,0.18)]">
        <div className="mb-1 h-1.5 w-4/5 rounded-full bg-[#B7A6C8]" />
        <div className="mb-1 h-1 w-full rounded-full bg-[#D3C6E0]" />
        <div className="mb-1 h-1 w-3/4 rounded-full bg-[#D3C6E0]" />
        <div className="h-1 w-5/6 rounded-full bg-[#D3C6E0]" />
      </div>
      <div className="absolute bottom-0 right-0 h-[50px] w-[38px] rotate-[10deg] rounded-[5px] border border-white bg-[#FAF7FC] p-1.5 shadow-[0_6px_14px_rgba(74,29,94,0.22)]">
        <div className="mb-1 h-1.5 w-3/4 rounded-full bg-[#9D85B5]" />
        <div className="mb-1 h-1 w-full rounded-full bg-[#CFC2DC]" />
        <div className="mb-1 h-1 w-full rounded-full bg-[#CFC2DC]" />
        <div className="mb-1 h-1 w-4/5 rounded-full bg-[#CFC2DC]" />
        <div className="h-1 w-2/3 rounded-full bg-[#CFC2DC]" />
      </div>
    </div>
  );
}

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

    const [uncontrolledActive, setUncontrolledActive] = useState<number | null>(
      null
    );
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [autoPeekIndex, setAutoPeekIndex] = useState<number | null>(null);

    const activeIndex =
      controlledActiveIndex !== undefined
        ? controlledActiveIndex
        : uncontrolledActive;

    const setActiveIndex = (next: number | null) => {
      if (controlledActiveIndex === undefined) {
        setUncontrolledActive(next);
      }
      onActiveIndexChange?.(next);
    };

    useEffect(() => {
      if (activeIndex === null) return;
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setActiveIndex(null);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activeIndex]);

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
      setActiveIndex(activeIndex === idx ? null : idx);
    };

    const isForcedDark = theme === "dark";
    const isForcedLight = theme === "light";

    const frameBorderClass = isForcedDark
      ? "border-[#9C5FE0] bg-[#1E132A]"
      : isForcedLight
      ? "border-[#6C2E9B] bg-[#FCEBFF]"
      : "border-[#6C2E9B] bg-[#FCEBFF] dark:border-[#9C5FE0] dark:bg-[#1E132A]";

    const centerFrameClass = isForcedDark
      ? "border-[#9C5FE0] bg-[#2D1746]"
      : isForcedLight
      ? "border-[#6C2E9B] bg-[#6C2E9B]"
      : "border-[#6C2E9B] bg-[#6C2E9B] dark:border-[#9C5FE0] dark:bg-[#2D1746]";

    const lavenderFlapBgClass = isForcedDark
      ? "bg-[#2A1A3B]"
      : isForcedLight
      ? "bg-[#FCEBFF]"
      : "bg-[#FCEBFF] dark:bg-[#2A1A3B]";

    const stitchBorderClass = isForcedDark
      ? "border-[#5D3B82]"
      : isForcedLight
      ? "border-[#DFB9EB]"
      : "border-[#DFB9EB] dark:border-[#5D3B82]";

    const getCardMotion = (idx: number, baseRotate: number, baseY: number) => {
      const isExpanded = interactive && activeIndex === idx;
      const isHovered = interactive && hoveredIndex === idx;
      const isAutoPeeking = autoPeekIndex === idx;

      if (prefersReducedMotion) {
        return {
          y: isExpanded ? baseY - 24 : baseY,
          rotate: isExpanded ? 0 : baseRotate,
          scale: isExpanded ? 1.03 : 1,
        };
      }

      if (isExpanded) {
        return {
          y: baseY - 46,
          rotate: 0,
          scale: 1.05,
        };
      }
      if (isHovered) {
        return {
          y: baseY - 24,
          rotate: baseRotate * 0.35,
          scale: 1.025,
        };
      }
      if (isAutoPeeking) {
        return {
          y: baseY - 18,
          rotate: baseRotate * 0.55,
          scale: 1.015,
        };
      }
      return {
        y: baseY,
        rotate: baseRotate,
        scale: 1,
      };
    };

    const headlineLines = headline.split("\n");
    const subheadlineLines = subheadline.split("\n");

    return (
      <div
        ref={ref}
        role="region"
        aria-label="Pocket AI assistant showcase cards"
        className={cn(
          "mx-auto w-full max-w-[820px] select-none py-6",
          className
        )}
        style={{
          fontFamily:
            "'Plus Jakarta Sans', 'Satoshi', 'Inter', ui-sans-serif, system-ui, sans-serif",
        }}
        {...rest}
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-5">
          {/* COLUMN 1: RECIPE / COOKING ASSISTANT POCKET */}
          <div
            className={cn(
              "relative h-[412px] rounded-[20px] border-[3px] transition-shadow duration-200",
              frameBorderClass,
              interactive && "cursor-pointer",
              activeIndex === 0 ? "z-30" : hoveredIndex === 0 ? "z-20" : "z-10"
            )}
            onMouseEnter={() => interactive && setHoveredIndex(0)}
            onMouseLeave={() => interactive && setHoveredIndex(null)}
          >
            <button
              type="button"
              disabled={!interactive}
              aria-expanded={activeIndex === 0}
              aria-label="Sugar-free blueberry cake recipe note, Fri 5 Jul. Activate to pull card out of pocket."
              onClick={() => toggleCard(0)}
              className={cn(
                "absolute inset-0 z-40 rounded-[17px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5637] focus-visible:ring-offset-2",
                !interactive && "pointer-events-none"
              )}
            />

            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-x-[7px] top-[7px] h-[155px] rounded-[12px] border-[1.5px] border-dashed",
                stitchBorderClass
              )}
            />

            <div
              className={cn(
                "pointer-events-none absolute inset-x-[-8px] top-[56px]",
                activeIndex === 0 ? "z-30" : "z-10"
              )}
            >
              <motion.article
                initial={
                  prefersReducedMotion
                    ? false
                    : { opacity: 0, y: 18, rotate: -9 }
                }
                animate={{
                  opacity: 1,
                  ...getCardMotion(0, -8.5, 0),
                }}
                transition={SPRING_TRANSITION}
                className="overflow-hidden rounded-[15px] border-[2.5px] border-white bg-[#FCEAE8] text-[#351842] shadow-[0_14px_30px_-10px_rgba(108,46,155,0.26)]"
              >
                <div className="flex items-center justify-between px-3 pt-2.5 pb-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FFD3C8] py-0.5 pl-0.5 pr-2.5">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#FF5637] text-white">
                      <BrandEmblemSvg
                        className="h-2.5 w-3.5"
                        strokeColor="#FFFFFF"
                        fillColor="#FFFFFF"
                      />
                    </span>
                    <span className="tabular-nums text-[10px] font-semibold tracking-tight text-[#4D1E57]">
                      Fri, 5 Jul
                    </span>
                  </div>
                  <MiniAvatarBadge accent="#FFB59E" />
                </div>

                <div className="flex justify-end px-3 pb-2.5">
                  <div className="max-w-[82%] rounded-[10px] rounded-tr-[4px] bg-white px-2.5 py-2 text-[10px] leading-[1.35] font-medium text-[#351842] shadow-[0_2px_8px_rgba(108,46,155,0.06)]">
                    I want to cook sugar free cake with blueberries, give me the
                    best and easiest recipe
                  </div>
                </div>

                <div className="relative bg-[#FFD2CD] px-3 pt-2.5 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-1.5 text-[11px] font-bold tracking-tight text-[#351842]">
                        Ingredients
                      </h3>
                      <ul className="space-y-1 tabular-nums text-[9.5px] leading-[1.3] font-medium text-[#472152]">
                        {[
                          "180 g almond flour",
                          "60 g coconut flour",
                          "60 ml unsweetened applesauce",
                          "120 ml unsweetened almond milk",
                          "3 large eggs",
                        ].map((item) => (
                          <li key={item} className="flex items-center gap-1.5">
                            <span
                              aria-hidden="true"
                              className="h-1.5 w-1.5 shrink-0 rounded-[2px] bg-[#E56B55]"
                            />
                            <span className="truncate">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <CakeStickerIllustration uid={uid} />
                  </div>
                </div>
              </motion.article>
            </div>

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-[3px] bottom-[3px] z-20 flex h-[156px] items-center justify-center rounded-[15px] bg-[#FF5637] shadow-[0_-6px_16px_rgba(108,46,155,0.12)]"
            >
              <div className="pointer-events-none absolute inset-[6px] rounded-[10px] border-[1.5px] border-dashed border-[#FFA290]/85" />
              <BrandEmblemSvg
                className="h-10 w-16 text-[#FFD8CE]"
                strokeColor="#FFD8CE"
                fillColor="#FFD8CE"
              />
            </div>
          </div>

          {/* COLUMN 2: TRAVEL ROUTE PLANNER POCKET */}
          <div
            className={cn(
              "relative h-[412px] rounded-[20px] border-[3px] transition-shadow duration-200",
              centerFrameClass,
              interactive && "cursor-pointer",
              activeIndex === 1 ? "z-30" : hoveredIndex === 1 ? "z-20" : "z-10"
            )}
            onMouseEnter={() => interactive && setHoveredIndex(1)}
            onMouseLeave={() => interactive && setHoveredIndex(null)}
          >
            <button
              type="button"
              disabled={!interactive}
              aria-expanded={activeIndex === 1}
              aria-label="Tatry Poland beginner hiking route note, Tue 9 Jul. Activate to pull card out of pocket."
              onClick={() => toggleCard(1)}
              className={cn(
                "absolute inset-0 z-40 rounded-[17px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FCEB5E] focus-visible:ring-offset-2",
                !interactive && "pointer-events-none"
              )}
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-[3px] top-[3px] z-20 flex h-[138px] items-center justify-center rounded-[15px] bg-[#FCEB5E] px-5 text-center"
            >
              <div className="pointer-events-none absolute inset-[6px] rounded-[10px] border-[1.5px] border-dashed border-[#D6C032]/85" />
              <p className="relative z-10 max-w-[165px] text-balance text-[20px] leading-[1.18] font-bold tracking-[-0.02em] text-[#4E236D]">
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
                "pointer-events-none absolute inset-x-[-8px] top-[128px]",
                activeIndex === 1 ? "z-30" : "z-10"
              )}
            >
              <motion.article
                initial={
                  prefersReducedMotion
                    ? false
                    : { opacity: 0, y: 18, rotate: 9 }
                }
                animate={{
                  opacity: 1,
                  ...getCardMotion(1, 8.5, 0),
                }}
                transition={{
                  ...SPRING_TRANSITION,
                  delay: prefersReducedMotion ? 0 : 0.05,
                }}
                className="overflow-hidden rounded-[15px] border-[2.5px] border-white bg-[#FEF6C7] text-[#351842] shadow-[0_14px_30px_-10px_rgba(108,46,155,0.28)]"
              >
                <div className="flex items-center justify-between px-3 pt-2.5 pb-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FFE29A] py-0.5 pl-0.5 pr-2.5">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#E83A76] text-white">
                      <BrandEmblemSvg
                        className="h-2.5 w-3.5"
                        strokeColor="#FFFFFF"
                        fillColor="#FFFFFF"
                      />
                    </span>
                    <span className="tabular-nums text-[10px] font-semibold tracking-tight text-[#4D1E57]">
                      Tue, 9 Jul
                    </span>
                  </div>
                  <MiniAvatarBadge accent="#FCE37D" />
                </div>

                <div className="flex justify-end px-3 pb-2">
                  <div className="max-w-[82%] rounded-[10px] rounded-tr-[4px] bg-white px-2.5 py-2 text-[10px] leading-[1.35] font-medium text-[#351842] shadow-[0_2px_8px_rgba(108,46,155,0.06)]">
                    I want to explore Tatry in Poland. Plan me a route for
                    beginners
                  </div>
                </div>

                <div className="bg-[#FCE37D] px-3 pt-2 pb-4">
                  <TrailMapIllustration uid={uid} />
                  <div className="mt-2">
                    <h3 className="text-[10.5px] font-bold tracking-tight text-[#351842]">
                      Route: Morskie Oko
                    </h3>
                    <p className="text-[9px] font-medium text-[#6B4A35]">
                      Start point: Zakopane
                    </p>
                  </div>
                  <ol className="mt-2 space-y-1.5 tabular-nums text-[9px] leading-[1.32] font-medium text-[#472152]">
                    <li className="flex items-start gap-1.5">
                      <span className="mt-0.5 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[4px] bg-[#E83A76] text-[8px] font-bold text-white">
                        1
                      </span>
                      <span>
                        Take a bus or drive to the Palenica Białczańska parking
                        lot (about 25 km from Zakopane)
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="mt-0.5 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[4px] bg-[#E83A76] text-[8px] font-bold text-white">
                        2
                      </span>
                      <span>
                        From Palenica Białczańska, follow the scenic paved trail
                        to Morskie Oko
                      </span>
                    </li>
                  </ol>
                </div>
              </motion.article>
            </div>

            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-x-[3px] bottom-[3px] z-20 h-[84px] rounded-[15px] shadow-[0_-6px_16px_rgba(108,46,155,0.14)]",
                lavenderFlapBgClass
              )}
            >
              <div
                className={cn(
                  "pointer-events-none absolute inset-[6px] rounded-[10px] border-[1.5px] border-dashed",
                  stitchBorderClass
                )}
              />
            </div>
          </div>

          {/* COLUMN 3: WRITING / ESSAY ASSISTANT POCKET */}
          <div
            className={cn(
              "relative h-[412px] rounded-[20px] border-[3px] transition-shadow duration-200",
              frameBorderClass,
              interactive && "cursor-pointer",
              activeIndex === 2 ? "z-30" : hoveredIndex === 2 ? "z-20" : "z-10"
            )}
            onMouseEnter={() => interactive && setHoveredIndex(2)}
            onMouseLeave={() => interactive && setHoveredIndex(null)}
          >
            <button
              type="button"
              disabled={!interactive}
              aria-expanded={activeIndex === 2}
              aria-label="Essay example on cheetahs note, Wed 10 Jul. Activate to pull card out of pocket."
              onClick={() => toggleCard(2)}
              className={cn(
                "absolute inset-0 z-40 rounded-[17px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6EFB] focus-visible:ring-offset-2",
                !interactive && "pointer-events-none"
              )}
            />

            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-x-[7px] top-[7px] h-[155px] rounded-[12px] border-[1.5px] border-dashed",
                stitchBorderClass
              )}
            />

            <div
              className={cn(
                "pointer-events-none absolute inset-x-[-8px] top-[86px]",
                activeIndex === 2 ? "z-30" : "z-10"
              )}
            >
              <motion.article
                initial={
                  prefersReducedMotion
                    ? false
                    : { opacity: 0, y: 18, rotate: 5 }
                }
                animate={{
                  opacity: 1,
                  ...getCardMotion(2, 5, 0),
                }}
                transition={{
                  ...SPRING_TRANSITION,
                  delay: prefersReducedMotion ? 0 : 0.1,
                }}
                className="overflow-hidden rounded-[15px] border-[2.5px] border-white bg-[#F8E7FA] text-[#351842] shadow-[0_14px_30px_-10px_rgba(108,46,155,0.26)]"
              >
                <div className="flex items-center justify-between px-3 pt-2.5 pb-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EBB9F5] py-0.5 pl-0.5 pr-2.5">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#7A2CB5] text-white">
                      <BrandEmblemSvg
                        className="h-2.5 w-3.5"
                        strokeColor="#FFFFFF"
                        fillColor="#FFFFFF"
                      />
                    </span>
                    <span className="tabular-nums text-[10px] font-semibold tracking-tight text-[#4D1E57]">
                      Wed, 10 Jul
                    </span>
                  </div>
                  <MiniAvatarBadge accent="#E4BEF7" />
                </div>

                <div className="flex justify-end px-3 pb-2.5">
                  <div className="max-w-[80%] rounded-[10px] rounded-tr-[4px] bg-white px-2.5 py-2 text-[10px] leading-[1.35] font-medium text-[#351842] shadow-[0_2px_8px_rgba(108,46,155,0.06)]">
                    Can you give me an example of essay using this structure?
                  </div>
                </div>

                <div className="relative bg-[#E4BEF7] px-3 pt-2.5 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-1 text-[10.5px] font-bold tracking-tight text-[#351842]">
                        The world of cheetah
                      </h3>
                      <p className="text-[9px] leading-[1.36] font-medium text-[#472152]">
                        Cheetahs are one of the most extraordinary animals in
                        the world. Known for their incredible speed, these big
                        cats can run faster than any other land animal.
                      </p>
                    </div>
                    <EssayNoteStickers />
                  </div>
                  <p className="mt-2 tabular-nums text-[9px] leading-[1.36] font-medium text-[#472152]">
                    They can reach speeds of up to 60 miles per hour in just a
                    few seconds. This makes them the fastest runners on the
                    planet.
                  </p>
                </div>
              </motion.article>
            </div>

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-[3px] bottom-[3px] z-20 flex h-[118px] items-center justify-center rounded-[15px] bg-[#FF6EFB] px-5 text-center shadow-[0_-6px_16px_rgba(108,46,155,0.12)]"
            >
              <div className="pointer-events-none absolute inset-[6px] rounded-[10px] border-[1.5px] border-dashed border-[#FFADF9]/85" />
              <p className="relative z-10 max-w-[130px] text-balance text-[20px] leading-[1.18] font-bold tracking-[-0.02em] text-[#4E236D]">
                {subheadlineLines.map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i < subheadlineLines.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </p>
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