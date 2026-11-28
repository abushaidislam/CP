"use client";

import React, { useEffect, useId, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type SocialSignOnTheme = "auto" | "dark" | "light";

export interface SocialProviderItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export interface SocialSignOnCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Card heading text */
  title?: string;
  /** Card description text */
  description?: string;
  /** Color theme mode: "auto" adapts via Tailwind dark:, or lock to "dark" / "light" */
  theme?: SocialSignOnTheme;
  /** Keep the central cloud hub and dotted circuit traces illuminated without hover */
  alwaysActive?: boolean;
  /** Interval in milliseconds between stepped provider track advances */
  stepInterval?: number;
  /** Custom provider list for the left stepped track (minimum 2 items) */
  leftProviders?: SocialProviderItem[];
  /** Custom provider list for the right stepped track (minimum 2 items) */
  rightProviders?: SocialProviderItem[];
  /** Optional callback fired when a provider node is clicked */
  onProviderSelect?: (providerId: string) => void;
  /** Optional callback fired when the central cloud hub is clicked */
  onHubClick?: (active: boolean) => void;
}

// Ordered so step 0 shows Apple (top) & Discord (bottom), followed by Linear -> Notion -> GitHub
const DEFAULT_LEFT_PROVIDERS: SocialProviderItem[] = [
  {
    id: "discord",
    label: "Discord",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[42%] w-[42%]" fill="currentColor" aria-hidden="true">
        <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
  {
    id: "apple",
    label: "Apple",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[42%] w-[42%]" fill="currentColor" aria-hidden="true">
        <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
      </svg>
    ),
  },
  {
    id: "linear",
    label: "Linear",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[42%] w-[42%]" fill="currentColor" aria-hidden="true">
        <path d="M2.21 13.86a9.97 9.97 0 0 0 7.93 7.93l-7.93-7.93zm-.19-2.81 10.93 10.93c.6-.07 1.18-.2 1.74-.38L2.4 9.31c-.18.56-.31 1.14-.38 1.74zm1.13-3.52 13.32 13.32c.48-.25.93-.54 1.36-.87L4.02 6.17c-.33.43-.62.88-.87 1.36zm2.06-2.66 13.92 13.92c.38-.36.73-.75 1.04-1.17L6.38 3.83c-.42.31-.81.66-1.17 1.04zm2.98-1.91 12.85 12.85A10 10 0 0 0 8.19 2.96z" />
      </svg>
    ),
  },
  {
    id: "notion",
    label: "Notion",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[38%] w-[38%]" fill="currentColor" aria-hidden="true">
        <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.886l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.22.186c-.094-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933z" />
      </svg>
    ),
  },
  {
    id: "github",
    label: "GitHub",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[42%] w-[42%]" fill="currentColor" aria-hidden="true">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
  },
];

// Ordered so step 0 shows Microsoft (top) & LinkedIn (bottom), stepping upward through HubSpot -> X -> Dropbox
const DEFAULT_RIGHT_PROVIDERS: SocialProviderItem[] = [
  {
    id: "microsoft",
    label: "Microsoft",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[36%] w-[36%]" fill="currentColor" aria-hidden="true">
        <path d="M2 2h9.5v9.5H2V2zm10.5 0H22v9.5h-9.5V2zM2 12.5h9.5V22H2v-9.5zm10.5 0H22V22h-9.5v-9.5z" />
      </svg>
    ),
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[38%] w-[38%]" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    id: "hubspot",
    label: "HubSpot",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[40%] w-[40%]" fill="currentColor" aria-hidden="true">
        <path d="M17.56 14.37a3.48 3.48 0 0 0-2.16.75l-2.64-1.52c.06-.28.1-.57.1-.87 0-.31-.04-.6-.11-.88l2.58-1.49a3.5 3.5 0 1 0-1.08-1.86l-2.58 1.49a4.1 4.1 0 0 0-2.59-1.15V5.74a2.25 2.25 0 1 0-1.7 0v3.1a4.12 4.12 0 0 0-3.26 4.03 4.12 4.12 0 0 0 4.12 4.12c1.1 0 2.09-.43 2.83-1.13l2.63 1.52a3.51 3.51 0 1 0 3.86-3.01zm-9.33.54a2.04 2.04 0 1 1 0-4.08 2.04 2.04 0 0 1 0 4.08zm9.33 4.46a1.48 1.48 0 1 1 0-2.96 1.48 1.48 0 0 1 0 2.96z" />
      </svg>
    ),
  },
  {
    id: "x",
    label: "X",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[36%] w-[36%]" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    id: "dropbox",
    label: "Dropbox",
    icon: (
      <svg viewBox="0 0 24 24" className="h-[40%] w-[40%]" fill="currentColor" aria-hidden="true">
        <path d="M6 2 0 5.875 6 9.75l6-3.875L6 2zm12 0-6 3.875 6 3.875 6-3.875L18 2zM0 13.625 6 17.5l6-3.875L6 9.75 0 13.625zm18-3.875-6 3.875 6 3.875 6-3.875-6-3.875zM6 18.875l6 3.875 6-3.875-6-3.875-6 3.875z" />
      </svg>
    ),
  },
];

// Percentage coordinates locked to the 560x252 SVG stage so mobile & desktop align 1:1
const LEFT_SLOTS = {
  enter: { left: "5.71%", top: "7.14%", opacity: 0, scale: 0.78 },
  top: { left: "14.29%", top: "26.19%", opacity: 1, scale: 1 },
  bottom: { left: "26.07%", top: "52.38%", opacity: 1, scale: 1 },
  exit: { left: "26.07%", top: "82.54%", opacity: 0, scale: 0.78 },
} as const;

const RIGHT_SLOTS = {
  enter: { left: "73.93%", top: "82.54%", opacity: 0, scale: 0.78 },
  bottom: { left: "73.93%", top: "52.38%", opacity: 1, scale: 1 },
  top: { left: "85.71%", top: "26.19%", opacity: 1, scale: 1 },
  exit: { left: "94.29%", top: "7.14%", opacity: 0, scale: 0.78 },
} as const;

const CONVEYOR_TRANSITION = {
  duration: 0.72,
  ease: [0.22, 1, 0.36, 1] as const,
};

export const SocialSignOnCard = React.forwardRef<HTMLDivElement, SocialSignOnCardProps>(
  function SocialSignOnCard(
    {
      title = "Social Sign-On",
      description = "Add high-conversion Social Sign-on (SSO) to your application in minutes. 20+ options and growing.",
      theme = "auto",
      alwaysActive = false,
      stepInterval = 2600,
      leftProviders = DEFAULT_LEFT_PROVIDERS,
      rightProviders = DEFAULT_RIGHT_PROVIDERS,
      onProviderSelect,
      onHubClick,
      className,
      ...rest
    },
    ref
  ) {
    const rawId = useId();
    const uid = useMemo(() => rawId.replace(/[^a-zA-Z0-9_-]/g, ""), [rawId]);
    const prefersReducedMotion = useReducedMotion();

    const [isHovered, setIsHovered] = useState(false);
    const [isLockedActive, setIsLockedActive] = useState(false);
    const [leftStep, setLeftStep] = useState(0);
    const [rightStep, setRightStep] = useState(0);

    const safeInterval = Math.min(
      6000,
      Math.max(1200, Number.isFinite(stepInterval) ? stepInterval : 2600)
    );
    const safeLeft = leftProviders.length >= 2 ? leftProviders : DEFAULT_LEFT_PROVIDERS;
    const safeRight = rightProviders.length >= 2 ? rightProviders : DEFAULT_RIGHT_PROVIDERS;

    const isActive = alwaysActive || isHovered || isLockedActive;

    // Staggered stepped conveyor timers (left & right offset by half a cycle)
    useEffect(() => {
      if (prefersReducedMotion) return;

      const leftTimer = window.setInterval(() => {
        setLeftStep((prev) => prev + 1);
      }, safeInterval);

      let rightIntervalId: number | undefined;
      const rightStartTimeout = window.setTimeout(() => {
        setRightStep((prev) => prev + 1);
        rightIntervalId = window.setInterval(() => {
          setRightStep((prev) => prev + 1);
        }, safeInterval);
      }, Math.round(safeInterval / 2));

      return () => {
        window.clearInterval(leftTimer);
        window.clearTimeout(rightStartTimeout);
        if (rightIntervalId !== undefined) {
          window.clearInterval(rightIntervalId);
        }
      };
    }, [safeInterval, prefersReducedMotion]);

    // Left track moves downward: new provider enters at top, previous top glides to bottom
    const leftBottomIndex = leftStep % safeLeft.length;
    const leftTopIndex = (leftStep + 1) % safeLeft.length;

    // Right track moves upward: new provider enters at bottom, previous bottom glides to top
    const rightTopIndex = rightStep % safeRight.length;
    const rightBottomIndex = (rightStep + 1) % safeRight.length;

    const leftVisible = [
      {
        key: `${safeLeft[leftTopIndex].id}-${leftStep}`,
        provider: safeLeft[leftTopIndex],
        slot: "top" as const,
      },
      {
        key: `${safeLeft[leftBottomIndex].id}-${leftStep - 1}`,
        provider: safeLeft[leftBottomIndex],
        slot: "bottom" as const,
      },
    ];

    const rightVisible = [
      {
        key: `${safeRight[rightTopIndex].id}-${rightStep - 1}`,
        provider: safeRight[rightTopIndex],
        slot: "top" as const,
      },
      {
        key: `${safeRight[rightBottomIndex].id}-${rightStep}`,
        provider: safeRight[rightBottomIndex],
        slot: "bottom" as const,
      },
    ];

    const isForcedDark = theme === "dark";
    const isForcedLight = theme === "light";

    const traceStrokeClass = cn(
      isForcedDark && "stroke-[#2f2e36]",
      isForcedLight && "stroke-[#e2e4ec]",
      !isForcedDark && !isForcedLight && "stroke-[#e2e4ec] dark:stroke-[#2f2e36]"
    );

    const nodeSurfaceClass = cn(
      "flex h-full w-full items-center justify-center rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38e8ff]/70 cursor-pointer",
      isForcedDark &&
        "bg-gradient-to-b from-[#33323a] to-[#28272e] border-white/[0.07] text-[#f4f4f6] shadow-[0_8px_20px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-white/[0.18]",
      isForcedLight &&
        "bg-gradient-to-b from-[#ffffff] to-[#f1f2f6] border-[#dcdde6] text-[#1f2028] shadow-[0_6px_16px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-[#b9bccb]",
      !isForcedDark &&
        !isForcedLight &&
        "bg-gradient-to-b from-[#ffffff] to-[#f1f2f6] border-[#dcdde6] text-[#1f2028] shadow-[0_6px_16px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-[#b9bccb] dark:from-[#33323a] dark:to-[#28272e] dark:border-white/[0.07] dark:text-[#f4f4f6] dark:shadow-[0_8px_20px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] dark:hover:border-white/[0.18]"
    );

    const titleClass = cn(
      "text-[17px] font-semibold tracking-[-0.015em] leading-[1.35]",
      isForcedDark && "text-[#f8f8fa]",
      isForcedLight && "text-[#141419]",
      !isForcedDark && !isForcedLight && "text-[#141419] dark:text-[#f8f8fa]"
    );

    const descClass = cn(
      "mt-2 text-[14.5px] leading-[1.58] max-w-[440px] tabular-nums",
      isForcedDark && "text-[#92919c]",
      isForcedLight && "text-[#5c5c69]",
      !isForcedDark && !isForcedLight && "text-[#5c5c69] dark:text-[#92919c]"
    );

    const stageGradientClass = cn(
      "pointer-events-none absolute inset-x-0 top-0 h-[252px]",
      isForcedDark &&
        "bg-[radial-gradient(ellipse_75%_65%_at_50%_35%,rgba(255,255,255,0.03),transparent_72%)]",
      isForcedLight &&
        "bg-[radial-gradient(ellipse_75%_65%_at_50%_35%,rgba(14,165,233,0.05),transparent_72%)]",
      !isForcedDark &&
        !isForcedLight &&
        "bg-[radial-gradient(ellipse_75%_65%_at_50%_35%,rgba(14,165,233,0.05),transparent_72%)] dark:bg-[radial-gradient(ellipse_75%_65%_at_50%_35%,rgba(255,255,255,0.03),transparent_72%)]"
    );

    const handleHubToggle = () => {
      setIsLockedActive((prev) => {
        const next = !prev;
        onHubClick?.(next);
        return next;
      });
    };

    const cloudGradId = `sso-cloud-grad-${uid}`;
    const cloudGlowId = `sso-cloud-glow-${uid}`;
    const maskLeftPulseId = `sso-mask-left-${uid}`;
    const maskRightPulseId = `sso-mask-right-${uid}`;
    const maskBottomPulseId = `sso-mask-bottom-${uid}`;

    return (
      <div
        ref={ref}
        className={cn(
          "group relative w-full max-w-[560px] overflow-hidden rounded-[22px] border select-none transition-colors duration-300",
          isForcedDark &&
            "bg-[#212025] border-[#2e2d34] text-[#f6f6f8] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.75)]",
          isForcedLight &&
            "bg-[#ffffff] border-[#e4e5ec] text-[#141419] shadow-[0_20px_50px_-22px_rgba(15,23,42,0.14)]",
          !isForcedDark &&
            !isForcedLight &&
            "bg-[#ffffff] border-[#e4e5ec] text-[#141419] shadow-[0_20px_50px_-22px_rgba(15,23,42,0.14)] dark:bg-[#212025] dark:border-[#2e2d34] dark:text-[#f6f6f8] dark:shadow-[0_24px_60px_-20px_rgba(0,0,0,0.75)]",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...rest}
      >
        {/* Subtle top rim highlight */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-px",
            isForcedDark &&
              "bg-gradient-to-r from-transparent via-white/[0.12] to-transparent",
            isForcedLight &&
              "bg-gradient-to-r from-transparent via-white to-transparent",
            !isForcedDark &&
              !isForcedLight &&
              "bg-gradient-to-r from-transparent via-white to-transparent dark:via-white/[0.12]"
          )}
        />

        {/* Ambient stage radial */}
        <div aria-hidden="true" className={stageGradientClass} />

        {/* Interactive Visual Stage */}
        <div className="relative mx-auto w-full aspect-[560/252] max-w-[560px] overflow-hidden">
          {/* Circuit Traces + Animated Dotted Data Pulses */}
          <svg
            viewBox="0 0 560 252"
            className="pointer-events-none absolute inset-0 h-full w-full"
            fill="none"
            aria-hidden="true"
          >
            <defs>
              <mask id={maskLeftPulseId}>
                <path
                  d="M 212 0 L 212 66 L 244 98"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </mask>

              <mask id={maskRightPulseId}>
                <path
                  d="M 348 0 L 348 66 L 316 98"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </mask>

              <mask id={maskBottomPulseId}>
                <path
                  d="M 280 184 L 280 248"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </mask>
            </defs>

            {/* Static Left Conveyor Track */}
            <path
              d="M 0 18 L 32 18 L 146 132 L 146 248"
              className={traceStrokeClass}
              strokeWidth="1.2"
              strokeLinejoin="round"
              opacity="0.85"
            />

            {/* Static Right Conveyor Track */}
            <path
              d="M 414 248 L 414 132 L 528 18 L 560 18"
              className={traceStrokeClass}
              strokeWidth="1.2"
              strokeLinejoin="round"
              opacity="0.85"
            />

            {/* Static Center Top-Left Circuit Trace */}
            <path
              d="M 212 0 L 212 66 L 244 98"
              className={traceStrokeClass}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />

            {/* Static Center Top-Right Circuit Trace */}
            <path
              d="M 348 0 L 348 66 L 316 98"
              className={traceStrokeClass}
              strokeWidth="1.2"
              strokeLinejoin="round"
            />

            {/* Static Center Bottom Circuit Trace */}
            <path
              d="M 280 184 L 280 248"
              className={traceStrokeClass}
              strokeWidth="1.2"
              opacity="0.7"
            />

            {/* Animated Dotted Pulse — Top-Left Trace */}
            {!prefersReducedMotion && (
              <g mask={`url(#${maskLeftPulseId})`}>
                <motion.path
                  d="M 212 0 L 212 66 L 244 98"
                  stroke="#38bdf8"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeDasharray="2.5 5.5"
                  initial={{ strokeDashoffset: 120, opacity: 0 }}
                  animate={
                    isActive
                      ? {
                          strokeDashoffset: [120, -40],
                          opacity: [0, 0.95, 0.95, 0],
                        }
                      : { opacity: 0 }
                  }
                  transition={
                    isActive
                      ? {
                          duration: 2.4,
                          repeat: Infinity,
                          repeatDelay: 0.9,
                          ease: "linear",
                        }
                      : { duration: 0.25 }
                  }
                />
              </g>
            )}

            {/* Animated Dotted Pulse — Top-Right Trace */}
            {!prefersReducedMotion && (
              <g mask={`url(#${maskRightPulseId})`}>
                <motion.path
                  d="M 348 0 L 348 66 L 316 98"
                  stroke="#60a5fa"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeDasharray="2.5 5.5"
                  initial={{ strokeDashoffset: 120, opacity: 0 }}
                  animate={
                    isActive
                      ? {
                          strokeDashoffset: [120, -40],
                          opacity: [0, 0.9, 0.9, 0],
                        }
                      : { opacity: 0 }
                  }
                  transition={
                    isActive
                      ? {
                          duration: 2.4,
                          delay: 1.15,
                          repeat: Infinity,
                          repeatDelay: 0.9,
                          ease: "linear",
                        }
                      : { duration: 0.25 }
                  }
                />
              </g>
            )}

            {/* Animated Dotted Pulse — Bottom-Center Trace */}
            {!prefersReducedMotion && (
              <g mask={`url(#${maskBottomPulseId})`}>
                <motion.path
                  d="M 280 184 L 280 248"
                  stroke="#6366f1"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="2.5 5.5"
                  initial={{ strokeDashoffset: 80, opacity: 0 }}
                  animate={
                    isActive
                      ? {
                          strokeDashoffset: [80, -30],
                          opacity: [0, 0.8, 0.8, 0],
                        }
                      : { opacity: 0 }
                  }
                  transition={
                    isActive
                      ? {
                          duration: 2.1,
                          delay: 0.55,
                          repeat: Infinity,
                          repeatDelay: 1.2,
                          ease: "linear",
                        }
                      : { duration: 0.25 }
                  }
                />
              </g>
            )}
          </svg>

          {/* Left Stepped Conveyor Nodes */}
          <div className="absolute inset-0">
            <AnimatePresence initial={false}>
              {leftVisible.map(({ key, provider, slot }) => {
                const target = slot === "top" ? LEFT_SLOTS.top : LEFT_SLOTS.bottom;
                return (
                  <motion.div
                    key={key}
                    className="absolute w-[9.64%] aspect-square"
                    initial={
                      prefersReducedMotion
                        ? { left: target.left, top: target.top, opacity: 1, scale: 1 }
                        : {
                            left: LEFT_SLOTS.enter.left,
                            top: LEFT_SLOTS.enter.top,
                            opacity: LEFT_SLOTS.enter.opacity,
                            scale: LEFT_SLOTS.enter.scale,
                          }
                    }
                    animate={{
                      left: target.left,
                      top: target.top,
                      opacity: target.opacity,
                      scale: target.scale,
                    }}
                    exit={
                      prefersReducedMotion
                        ? { opacity: 0 }
                        : {
                            left: LEFT_SLOTS.exit.left,
                            top: LEFT_SLOTS.exit.top,
                            opacity: LEFT_SLOTS.exit.opacity,
                            scale: LEFT_SLOTS.exit.scale,
                          }
                    }
                    transition={prefersReducedMotion ? { duration: 0.15 } : CONVEYOR_TRANSITION}
                  >
                    <div className="h-full w-full -translate-x-1/2 -translate-y-1/2">
                      <button
                        type="button"
                        aria-label={`Sign in with ${provider.label}`}
                        title={provider.label}
                        onClick={() => onProviderSelect?.(provider.id)}
                        className={nodeSurfaceClass}
                      >
                        {provider.icon}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Right Stepped Conveyor Nodes */}
            <AnimatePresence initial={false}>
              {rightVisible.map(({ key, provider, slot }) => {
                const target = slot === "bottom" ? RIGHT_SLOTS.bottom : RIGHT_SLOTS.top;
                return (
                  <motion.div
                    key={key}
                    className="absolute w-[9.64%] aspect-square"
                    initial={
                      prefersReducedMotion
                        ? { left: target.left, top: target.top, opacity: 1, scale: 1 }
                        : {
                            left: RIGHT_SLOTS.enter.left,
                            top: RIGHT_SLOTS.enter.top,
                            opacity: RIGHT_SLOTS.enter.opacity,
                            scale: RIGHT_SLOTS.enter.scale,
                          }
                    }
                    animate={{
                      left: target.left,
                      top: target.top,
                      opacity: target.opacity,
                      scale: target.scale,
                    }}
                    exit={
                      prefersReducedMotion
                        ? { opacity: 0 }
                        : {
                            left: RIGHT_SLOTS.exit.left,
                            top: RIGHT_SLOTS.exit.top,
                            opacity: RIGHT_SLOTS.exit.opacity,
                            scale: RIGHT_SLOTS.exit.scale,
                          }
                    }
                    transition={prefersReducedMotion ? { duration: 0.15 } : CONVEYOR_TRANSITION}
                  >
                    <div className="h-full w-full -translate-x-1/2 -translate-y-1/2">
                      <button
                        type="button"
                        aria-label={`Sign in with ${provider.label}`}
                        title={provider.label}
                        onClick={() => onProviderSelect?.(provider.id)}
                        className={nodeSurfaceClass}
                      >
                        {provider.icon}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Central Cloud Hub Tile */}
          <div className="absolute left-1/2 top-[53.17%] w-[17.14%] aspect-square -translate-x-1/2 -translate-y-1/2">
            <motion.button
              type="button"
              onClick={handleHubToggle}
              aria-pressed={isLockedActive}
              aria-label={
                isActive
                  ? "Social Sign-On hub active. Press to toggle lock."
                  : "Social Sign-On hub inactive. Press to activate."
              }
              whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
              className={cn(
                "relative flex h-full w-full items-center justify-center rounded-[14px] border transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38e8ff]/80 cursor-pointer overflow-hidden",
                isForcedDark &&
                  "bg-[#313139] border-white/[0.08] shadow-[0_18px_36px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.1)]",
                isForcedLight &&
                  "bg-[#f5f6fa] border-[#d6d8e3] shadow-[0_14px_28px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.95)]",
                !isForcedDark &&
                  !isForcedLight &&
                  "bg-[#f5f6fa] border-[#d6d8e3] shadow-[0_14px_28px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] dark:bg-[#313139] dark:border-white/[0.08] dark:shadow-[0_18px_36px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.1)]"
              )}
            >
              {/* Active Cyan Illumination Surface inside Tile */}
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                initial={false}
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                style={{
                  background:
                    "radial-gradient(circle at 50% 42%, rgba(56, 232, 255, 0.28) 0%, rgba(36, 152, 185, 0.14) 48%, rgba(30, 34, 42, 0) 82%)",
                }}
              />

              {/* Subtle top specular cyan edge when active */}
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-2 top-0 h-px"
                initial={false}
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={{ duration: 0.35 }}
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(120, 240, 253, 0.55), transparent)",
                }}
              />

              {/* Cloud Mark SVG */}
              <svg
                viewBox="0 0 64 46"
                className="relative z-10 w-[54%] h-auto overflow-visible"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient
                    id={cloudGradId}
                    x1="32"
                    y1="4"
                    x2="32"
                    y2="42"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor="#14e2fa" />
                    <stop offset="55%" stopColor="#4aeafb" />
                    <stop offset="100%" stopColor="#85f3ff" />
                  </linearGradient>
                  <filter id={cloudGlowId} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="5.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Recessed inactive cloud */}
                <path
                  d="M48.8 18.6C47.5 10.4 40.4 4.2 31.8 4.2c-7.1 0-13.2 4.3-15.8 10.5C9.8 15.6 5 20.9 5 27.3c0 7.1 5.8 12.9 12.9 12.9h29.6c6.3 0 11.5-5.1 11.5-11.4 0-5.6-4.1-10.3-10.2-10.2z"
                  className={cn(
                    "transition-opacity duration-300",
                    isForcedDark && "fill-[#212025]",
                    isForcedLight && "fill-[#d8dbe6]",
                    !isForcedDark && !isForcedLight && "fill-[#d8dbe6] dark:fill-[#212025]"
                  )}
                  style={{ opacity: isActive ? 0 : 1 }}
                />

                {/* Illuminated active cyan cloud */}
                <motion.path
                  d="M48.8 18.6C47.5 10.4 40.4 4.2 31.8 4.2c-7.1 0-13.2 4.3-15.8 10.5C9.8 15.6 5 20.9 5 27.3c0 7.1 5.8 12.9 12.9 12.9h29.6c6.3 0 11.5-5.1 11.5-11.4 0-5.6-4.1-10.3-10.2-10.2z"
                  fill={`url(#${cloudGradId})`}
                  filter={`url(#${cloudGlowId})`}
                  initial={false}
                  animate={{ opacity: isActive ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </svg>
            </motion.button>
          </div>
        </div>

        {/* Bottom Text Block */}
        <div className="relative z-10 px-7 pb-7 pt-2 sm:px-8 sm:pb-8">
          <h3 className={titleClass}>{title}</h3>
          <p className={descClass}>{description}</p>
        </div>
      </div>
    );
  }
);

export { SocialSignOnCard as component, SocialSignOnCard as Component };
export default SocialSignOnCard;