"use client";

import React, { useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type RoadmapAccent = "orange" | "blue" | "purple";

export interface PinnedRoadmapStep {
  id: string;
  number: string;
  title: string;
  description: string;
  accent: RoadmapAccent;
  rotation: number;
  align: "left" | "right";
}

export interface PinnedRoadmapCardsProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Brand wordmark displayed at the top */
  brandName?: string;
  /** Main display heading */
  heading?: string;
  /** Custom roadmap steps */
  steps?: PinnedRoadmapStep[];
  /** Visual theme mode: "auto" follows Tailwind dark: class */
  theme?: "auto" | "light" | "dark";
  /** Show subtle horizontal notebook ruled lines */
  showRuledLines?: boolean;
  /** Show curved dashed SVG connectors between pinned cards */
  showConnectors?: boolean;
  /** Allow clicking cards to toggle checklist completion */
  interactiveChecklist?: boolean;
  /** Optional footer signature line */
  partnerTagline?: string;
  /** Fired when a step is toggled in checklist mode */
  onToggleStep?: (step: PinnedRoadmapStep, completed: boolean) => void;
}

const DEFAULT_STEPS: PinnedRoadmapStep[] = [
  {
    id: "step-1",
    number: "01",
    title: "Testimonials",
    description:
      "The only way to attract new clients, is to show your experience with the previous ones. Include: real photo, position at company, links their profiles",
    accent: "orange",
    rotation: 6,
    align: "left",
  },
  {
    id: "step-2",
    number: "02",
    title: "Trust Badges",
    description:
      "Show all the achievements you have. Awards, certificates, payment protections, etc.",
    accent: "blue",
    rotation: -9,
    align: "right",
  },
  {
    id: "step-3",
    number: "03",
    title: "Add Contacts",
    description:
      "People need to understand that if something will happen, they can always reach out to you. Leave links to your social media, your email and the phone",
    accent: "purple",
    rotation: 9,
    align: "left",
  },
  {
    id: "step-4",
    number: "04",
    title: "Case Studies",
    description:
      "Share detailed examples of how your product or service solved real problems. This helps visitors imagine their own success.",
    accent: "orange",
    rotation: -6,
    align: "right",
  },
  {
    id: "step-5",
    number: "05",
    title: "Clear Refund Policy",
    description:
      "Offer a transparent money-back guarantee or easy return process",
    accent: "blue",
    rotation: 3,
    align: "left",
  },
];

const ACCENT_TOKENS: Record<
  RoadmapAccent,
  {
    noteLight: string;
    noteDark: string;
    noteAuto: string;
    numLight: string;
    numDark: string;
    numAuto: string;
    pinCapFrom: string;
    pinCapTo: string;
    pinStem: string;
    pinGlow: string;
    checkBg: string;
  }
> = {
  orange: {
    noteLight: "bg-[#ffede3] border-[#f8d7c5]",
    noteDark: "bg-[#fc7351]/[0.13] border-[#fc7351]/25",
    noteAuto:
      "bg-[#ffede3] border-[#f8d7c5] dark:bg-[#fc7351]/[0.13] dark:border-[#fc7351]/25",
    numLight: "text-[#d96126]",
    numDark: "text-[#ff8f6b]",
    numAuto: "text-[#d96126] dark:text-[#ff8f6b]",
    pinCapFrom: "#ff9575",
    pinCapTo: "#e8502a",
    pinStem: "#c93f1d",
    pinGlow: "rgba(252,115,81,0.48)",
    checkBg: "bg-[#f06236]",
  },
  blue: {
    noteLight: "bg-[#dce3ff] border-[#c8d3ff]",
    noteDark: "bg-[#3c73ff]/[0.14] border-[#3c73ff]/25",
    noteAuto:
      "bg-[#dce3ff] border-[#c8d3ff] dark:bg-[#3c73ff]/[0.14] dark:border-[#3c73ff]/25",
    numLight: "text-[#2c5ae0]",
    numDark: "text-[#7fa4ff]",
    numAuto: "text-[#2c5ae0] dark:text-[#7fa4ff]",
    pinCapFrom: "#6998ff",
    pinCapTo: "#2858e6",
    pinStem: "#1f47bf",
    pinGlow: "rgba(60,115,255,0.46)",
    checkBg: "bg-[#3c73ff]",
  },
  purple: {
    noteLight: "bg-[#f3e0fe] border-[#e6c8fb]",
    noteDark: "bg-[#8565ff]/[0.15] border-[#8565ff]/25",
    noteAuto:
      "bg-[#f3e0fe] border-[#e6c8fb] dark:bg-[#8565ff]/[0.15] dark:border-[#8565ff]/25",
    numLight: "text-[#7448e3]",
    numDark: "text-[#b39dff]",
    numAuto: "text-[#7448e3] dark:text-[#b39dff]",
    pinCapFrom: "#a68cff",
    pinCapTo: "#683ee8",
    pinStem: "#522cc7",
    pinGlow: "rgba(133,101,255,0.48)",
    checkBg: "bg-[#7c56f5]",
  },
};

function BrandLogoMark() {
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] bg-gradient-to-b from-[#ff7a45] to-[#e64717] shadow-[0_6px_14px_-2px_rgba(235,84,36,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)]">
      <svg
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
        className="h-4 w-4 text-white"
      >
        <path
          d="M5 13.5L9.2 6.5M10.8 13.5L15 6.5"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function PushPin({ accent }: { accent: RoadmapAccent }) {
  const token = ACCENT_TOKENS[accent];
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
    >
      <span
        className="absolute top-5 h-4 w-7 rounded-full blur-[5px]"
        style={{ backgroundColor: token.pinGlow }}
      />
      <span
        className="relative h-5 w-5 rounded-full"
        style={{
          background: `radial-gradient(circle at 35% 30%, ${token.pinCapFrom}, ${token.pinStem})`,
          boxShadow: `0 6px 10px -2px ${token.pinGlow}, inset 0 1px 2px rgba(255,255,255,0.45)`,
        }}
      />
      <span
        className="absolute -top-2.5 h-[22px] w-[22px] rounded-full"
        style={{
          background: `radial-gradient(circle at 32% 28%, #ffffff 0%, ${token.pinCapFrom} 24%, ${token.pinCapTo} 100%)`,
          boxShadow: `0 4px 8px -1px rgba(0,0,0,0.22), inset 0 -2px 3px rgba(0,0,0,0.18)`,
        }}
      />
    </div>
  );
}

function PartnerAvatarSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className={className}>
      <rect width="64" height="64" fill="#18181b" />
      <path d="M10 64C13 48 21 41 32 41C43 41 51 48 54 64H10Z" fill="#09090b" />
      <path d="M21 25C21 16 26 11 32 11C38 11 43 16 43 25V31C43 36.5 38 40 32 40C26 40 21 36.5 21 31V25Z" fill="#d4b8a8" />
      <path d="M19 25C19 14 25 9 32 9C39 9 45 14 45 25C42 20 38 18 32 18C26 18 22 20 19 25Z" fill="#141416" />
      <circle cx="28" cy="27" r="1.3" fill="#141416" />
      <circle cx="36" cy="27" r="1.3" fill="#141416" />
    </svg>
  );
}

export const PinnedRoadmapCards = React.forwardRef<
  HTMLDivElement,
  PinnedRoadmapCardsProps
>(function PinnedRoadmapCards(
  {
    brandName = "skale",
    heading = "How to Build Trust on Your Website",
    steps = DEFAULT_STEPS,
    theme = "auto",
    showRuledLines = true,
    showConnectors = true,
    interactiveChecklist = true,
    partnerTagline = "Your all in one design partner.",
    onToggleStep,
    className,
    ...rest
  },
  ref
) {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const rawId = useId();
  const uid = rawId.replace(/:/g, "");
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  const toggleStep = (step: PinnedRoadmapStep) => {
    if (!interactiveChecklist) return;
    setCompletedIds((prev) => {
      const exists = prev.includes(step.id);
      const next = exists ? prev.filter((id) => id !== step.id) : [...prev, step.id];
      onToggleStep?.(step, !exists);
      return next;
    });
  };

  const isLight = theme === "light";
  const isDark = theme === "dark";

  const surfaceClass = cn(
    "relative w-full max-w-[680px] mx-auto overflow-hidden rounded-[32px] px-5 sm:px-10 py-10 sm:py-12 transition-colors",
    isLight && "bg-[#f4f4f4] text-[#1d1d1f] ring-1 ring-black/[0.05]",
    isDark && "bg-[#121215] text-[#f4f4f5] ring-1 ring-white/[0.08]",
    !isLight &&
      !isDark &&
      "bg-[#f4f4f4] dark:bg-[#121215] text-[#1d1d1f] dark:text-[#f4f4f5] ring-1 ring-black/[0.05] dark:ring-white/[0.08]"
  );

  const cardFrameClass = cn(
    "relative rounded-[22px] p-3 pt-10 transition-shadow duration-200",
    isLight &&
      "bg-[#fcfcfc] shadow-[0_20px_38px_-14px_rgba(0,0,0,0.16),0_2px_6px_rgba(0,0,0,0.05)] ring-1 ring-black/[0.04]",
    isDark &&
      "bg-[#1d1d21] shadow-[0_22px_40px_-14px_rgba(0,0,0,0.7),0_2px_6px_rgba(0,0,0,0.4)] ring-1 ring-white/[0.08]",
    !isLight &&
      !isDark &&
      "bg-[#fcfcfc] dark:bg-[#1d1d21] shadow-[0_20px_38px_-14px_rgba(0,0,0,0.16),0_2px_6px_rgba(0,0,0,0.05)] dark:shadow-[0_22px_40px_-14px_rgba(0,0,0,0.7),0_2px_6px_rgba(0,0,0,0.4)] ring-1 ring-black/[0.04] dark:ring-white/[0.08]"
  );

  const titleClass = cn(
    "mt-4 text-center text-[28px] sm:text-[38px] font-bold leading-[1.12] tracking-[-0.03em] bg-clip-text text-transparent max-w-[460px] mx-auto",
    isLight && "bg-gradient-to-b from-[#454549] via-[#5d5d63] to-[#3a3a3f]",
    isDark && "bg-gradient-to-b from-[#ffffff] via-[#e4e4e7] to-[#a1a1aa]",
    !isLight &&
      !isDark &&
      "bg-gradient-to-b from-[#454549] via-[#5d5d63] to-[#3a3a3f] dark:from-[#ffffff] dark:via-[#e4e4e7] dark:to-[#a1a1aa]"
  );

  const cardHeadingClass = cn(
    "text-[18px] sm:text-[19px] font-bold leading-[1.2] tracking-[-0.02em]",
    isLight && "text-[#171719]",
    isDark && "text-[#f4f4f5]",
    !isLight && !isDark && "text-[#171719] dark:text-[#f4f4f5]"
  );

  const cardBodyClass = cn(
    "mt-2 text-[12.5px] leading-[1.48] tracking-[-0.005em]",
    isLight && "text-[#3f3f46]",
    isDark && "text-[#c4c4cc]",
    !isLight && !isDark && "text-[#3f3f46] dark:text-[#c4c4cc]"
  );

  const connectorStrokeClass = cn(
    isLight && "stroke-[#b8b8be]",
    isDark && "stroke-[#3f3f46]",
    !isLight && !isDark && "stroke-[#b8b8be] dark:stroke-[#3f3f46]"
  );

  const springTransition = prefersReducedMotion
    ? { duration: 0.14 }
    : { type: "spring" as const, stiffness: 320, damping: 26 };

  return (
    <section
      ref={ref}
      aria-labelledby={`${uid}-heading`}
      className={cn(surfaceClass, className)}
      {...rest}
    >
      {showRuledLines && (
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0",
            isLight &&
              "[background-image:repeating-linear-gradient(to_bottom,transparent_0px,transparent_31px,rgba(0,0,0,0.045)_31px,rgba(0,0,0,0.045)_32px)]",
            isDark &&
              "[background-image:repeating-linear-gradient(to_bottom,transparent_0px,transparent_31px,rgba(255,255,255,0.045)_31px,rgba(255,255,255,0.045)_32px)]",
            !isLight &&
              !isDark &&
              "[background-image:repeating-linear-gradient(to_bottom,transparent_0px,transparent_31px,rgba(0,0,0,0.045)_31px,rgba(0,0,0,0.045)_32px)] dark:[background-image:repeating-linear-gradient(to_bottom,transparent_0px,transparent_31px,rgba(255,255,255,0.045)_31px,rgba(255,255,255,0.045)_32px)]"
          )}
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
          }}
        />
      )}

      <header className="relative z-10 flex flex-col items-center">
        <div className="inline-flex items-center gap-2">
          <BrandLogoMark />
          <span
            className={cn(
              "text-[22px] font-bold tracking-[-0.03em]",
              isLight && "text-[#222225]",
              isDark && "text-[#f4f4f5]",
              !isLight && !isDark && "text-[#222225] dark:text-[#f4f4f5]"
            )}
          >
            {brandName}
          </span>
        </div>

        <h2 id={`${uid}-heading`} className={titleClass}>
          {heading}
        </h2>

        {interactiveChecklist && completedIds.length > 0 && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium tabular-nums",
              isLight && "bg-black/[0.06] text-[#3f3f46]",
              isDark && "bg-white/[0.08] text-[#d4d4d8]",
              !isLight &&
                !isDark &&
                "bg-black/[0.06] dark:bg-white/[0.08] text-[#3f3f46] dark:text-[#d4d4d8]"
            )}
          >
            <Check className="h-3.5 w-3.5 text-[#e85d26]" strokeWidth={2.5} />
            <span>
              {completedIds.length} of {steps.length} completed
            </span>
          </motion.div>
        )}
      </header>

      <div className="relative z-10 mt-10 sm:mt-12">
        {showConnectors && (
          <svg
            aria-hidden="true"
            viewBox="0 0 600 1040"
            fill="none"
            preserveAspectRatio="none"
            className="pointer-events-none hidden sm:block absolute inset-0 h-full w-full z-0"
          >
            <motion.path
              d="M250 140 C315 150, 350 170, 395 205"
              strokeWidth="1.5"
              strokeDasharray="5 6"
              strokeLinecap="round"
              className={connectorStrokeClass}
              initial={prefersReducedMotion ? false : { pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
            />
            <motion.path
              d="M395 280 C310 310, 235 355, 190 420"
              strokeWidth="1.5"
              strokeDasharray="5 6"
              strokeLinecap="round"
              className={connectorStrokeClass}
              initial={prefersReducedMotion ? false : { pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.7, delay: 0.25 }}
            />
            <motion.path
              d="M255 565 C315 580, 360 600, 405 630"
              strokeWidth="1.5"
              strokeDasharray="5 6"
              strokeLinecap="round"
              className={connectorStrokeClass}
              initial={prefersReducedMotion ? false : { pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.7, delay: 0.35 }}
            />
            <motion.path
              d="M400 725 C315 755, 255 790, 215 855"
              strokeWidth="1.5"
              strokeDasharray="5 6"
              strokeLinecap="round"
              className={connectorStrokeClass}
              initial={prefersReducedMotion ? false : { pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.7, delay: 0.45 }}
            />
          </svg>
        )}

        <div className="relative z-10 flex flex-col gap-8 sm:gap-2">
          {steps.map((step, idx) => {
            const token = ACCENT_TOKENS[step.accent];
            const isCompleted = completedIds.includes(step.id);
            const noteSurfaceClass = isLight
              ? token.noteLight
              : isDark
              ? token.noteDark
              : token.noteAuto;
            const numColorClass = isLight
              ? token.numLight
              : isDark
              ? token.numDark
              : token.numAuto;

            return (
              <div
                key={step.id}
                className={cn(
                  "flex w-full justify-center",
                  step.align === "left"
                    ? "sm:justify-start sm:pl-2"
                    : "sm:justify-end sm:pr-2",
                  idx > 0 && "sm:-mt-14"
                )}
              >
                <motion.div
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 24, rotate: step.rotation * 1.3 }
                  }
                  whileInView={{
                    opacity: 1,
                    y: 0,
                    rotate: step.rotation,
                  }}
                  whileHover={
                    prefersReducedMotion
                      ? undefined
                      : { y: -6, rotate: 0, scale: 1.03, zIndex: 30 }
                  }
                  viewport={{ once: true, amount: 0.2 }}
                  transition={springTransition}
                  className="relative w-full max-w-[262px]"
                >
                  <PushPin accent={step.accent} />

                  <button
                    type="button"
                    disabled={!interactiveChecklist}
                    aria-pressed={interactiveChecklist ? isCompleted : undefined}
                    onClick={() => toggleStep(step)}
                    className={cn(
                      cardFrameClass,
                      "w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fc7351] focus-visible:ring-offset-2",
                      interactiveChecklist
                        ? "cursor-pointer"
                        : "cursor-default"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-[14px] border px-4 py-4 transition-opacity duration-200",
                        noteSurfaceClass,
                        isCompleted && "opacity-80"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "font-serif italic text-[20px] font-medium leading-none tracking-tight tabular-nums",
                            numColorClass
                          )}
                        >
                          {step.number}
                        </span>
                        {interactiveChecklist && (
                          <span
                            className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-full transition-transform duration-150",
                              isCompleted
                                ? cn(token.checkBg, "text-white scale-100")
                                : "scale-75 opacity-0"
                            )}
                          >
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                        )}
                      </div>

                      <h3
                        className={cn(
                          cardHeadingClass,
                          "mt-2.5",
                          isCompleted && "line-through opacity-75"
                        )}
                      >
                        {step.title}
                      </h3>

                      <p className={cardBodyClass}>{step.description}</p>
                    </div>
                  </button>
                </motion.div>
              </div>
            );
          })}
        </div>

        <div className="relative z-10 mt-10 sm:-mt-20 flex justify-center sm:justify-end sm:pr-12">
          <div className="flex flex-col items-center text-center">
            <div className="h-11 w-11 overflow-hidden rounded-full ring-2 ring-white dark:ring-[#27272a] shadow-[0_8px_18px_-4px_rgba(0,0,0,0.28)]">
              <PartnerAvatarSvg className="h-full w-full" />
            </div>
            <p
              className={cn(
                "mt-2.5 max-w-[140px] text-[12px] leading-[1.35] font-medium",
                isLight && "text-[#52525b]",
                isDark && "text-[#a1a1aa]",
                !isLight && !isDark && "text-[#52525b] dark:text-[#a1a1aa]"
              )}
            >
              {partnerTagline.includes("all in one") ? (
                <>
                  {partnerTagline.split("all in one")[0]}
                  <span className="text-[#e85d26] font-semibold">all in one</span>
                  {partnerTagline.split("all in one")[1]}
                </>
              ) : (
                partnerTagline
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
});

PinnedRoadmapCards.displayName = "PinnedRoadmapCards";

export { PinnedRoadmapCards as component, PinnedRoadmapCards as Component };
export default PinnedRoadmapCards;