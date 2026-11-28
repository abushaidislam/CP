"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type AuthBentoTheme = "auto" | "dark" | "light";

export interface SocialSignOnCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Card heading */
  title?: string;
  /** Supporting description */
  description?: string;
  /** Continuously animate without requiring hover or focus */
  autoPlay?: boolean;
  /** Controlled active state */
  active?: boolean;
  /** Callback fired when active state changes */
  onActiveChange?: (active: boolean) => void;
  /** Color theme mode: auto follows Tailwind dark mode */
  theme?: AuthBentoTheme;
}

export interface ApiKeysCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Primary card heading for API Keys card */
  title?: string;
  /** Supporting description for API Keys card */
  description?: string;
  /** Monospace status text inside the center authentication pill */
  statusText?: string;
  /** Heading for the Social Sign-On card rendered above API Keys */
  ssoTitle?: string;
  /** Description for the Social Sign-On card rendered above API Keys */
  ssoDescription?: string;
  /** Show the Social Sign-On bento card stacked above the API Keys card */
  showSocialSignOn?: boolean;
  /** Continuously animate without requiring hover or focus */
  autoPlay?: boolean;
  /** Controlled active state */
  active?: boolean;
  /** Callback fired when active state changes */
  onActiveChange?: (active: boolean) => void;
  /** Color theme mode: auto follows Tailwind dark mode */
  theme?: AuthBentoTheme;
}

const SPINNER_SPOKES = Array.from({ length: 12 }, (_, i) => i);

const SERVER_LED_PATTERNS: Array<
  Array<{ delay: number; duration: number; peak: number }>
> = [
  [
    { delay: 0.0, duration: 1.5, peak: 0.95 },
    { delay: 0.4, duration: 1.9, peak: 0.85 },
    { delay: 0.9, duration: 1.4, peak: 0.5 },
    { delay: 0.2, duration: 1.7, peak: 0.9 },
    { delay: 0.7, duration: 1.3, peak: 0.95 },
    { delay: 0.1, duration: 2.1, peak: 0.75 },
    { delay: 0.5, duration: 1.6, peak: 0.85 },
    { delay: 1.1, duration: 1.8, peak: 0.6 },
    { delay: 0.3, duration: 1.4, peak: 1.0 },
  ],
  [
    { delay: 0.3, duration: 1.6, peak: 1.0 },
    { delay: 0.8, duration: 1.4, peak: 0.85 },
    { delay: 0.1, duration: 1.9, peak: 0.7 },
    { delay: 0.6, duration: 1.5, peak: 0.95 },
    { delay: 0.0, duration: 1.8, peak: 0.9 },
    { delay: 0.9, duration: 1.3, peak: 0.95 },
    { delay: 0.2, duration: 2.0, peak: 0.65 },
    { delay: 0.5, duration: 1.5, peak: 1.0 },
    { delay: 1.0, duration: 1.7, peak: 0.85 },
  ],
  [
    { delay: 0.5, duration: 1.8, peak: 0.8 },
    { delay: 0.1, duration: 1.5, peak: 0.9 },
    { delay: 0.7, duration: 2.0, peak: 0.55 },
    { delay: 0.3, duration: 1.4, peak: 0.85 },
    { delay: 0.9, duration: 1.7, peak: 0.75 },
    { delay: 0.2, duration: 1.6, peak: 0.9 },
    { delay: 0.8, duration: 1.9, peak: 0.6 },
    { delay: 0.4, duration: 1.3, peak: 0.85 },
    { delay: 0.0, duration: 1.8, peak: 0.7 },
  ],
];

const MATRIX_ACTIVE_CELLS: Array<
  Array<{ idx: number; color: "cyan" | "indigo"; delay: number; duration: number }>
> = [
  [
    { idx: 2, color: "cyan", delay: 0.1, duration: 1.6 },
    { idx: 6, color: "indigo", delay: 0.5, duration: 2.0 },
    { idx: 8, color: "cyan", delay: 0.9, duration: 1.4 },
    { idx: 12, color: "cyan", delay: 0.3, duration: 1.8 },
    { idx: 16, color: "indigo", delay: 0.7, duration: 1.5 },
    { idx: 18, color: "cyan", delay: 1.1, duration: 1.7 },
    { idx: 22, color: "cyan", delay: 0.4, duration: 1.9 },
  ],
  [
    { idx: 1, color: "indigo", delay: 0.2, duration: 1.7 },
    { idx: 7, color: "cyan", delay: 0.6, duration: 1.5 },
    { idx: 11, color: "cyan", delay: 0.0, duration: 1.9 },
    { idx: 13, color: "indigo", delay: 0.8, duration: 1.4 },
    { idx: 17, color: "cyan", delay: 0.4, duration: 1.6 },
    { idx: 21, color: "cyan", delay: 1.0, duration: 1.8 },
    { idx: 23, color: "indigo", delay: 0.3, duration: 2.1 },
  ],
  [
    { idx: 3, color: "cyan", delay: 0.4, duration: 1.9 },
    { idx: 7, color: "indigo", delay: 0.9, duration: 1.6 },
    { idx: 12, color: "cyan", delay: 0.2, duration: 1.7 },
    { idx: 15, color: "cyan", delay: 0.6, duration: 1.5 },
    { idx: 19, color: "indigo", delay: 1.0, duration: 1.8 },
    { idx: 22, color: "cyan", delay: 0.1, duration: 2.0 },
  ],
];

const VENT_SLITS = Array.from({ length: 22 }, (_, i) => i);
const MATRIX_CELLS = Array.from({ length: 25 }, (_, i) => i);

type ProviderId =
  | "google"
  | "discord"
  | "apple"
  | "linear"
  | "notion"
  | "github"
  | "microsoft"
  | "linkedin"
  | "hubspot"
  | "x"
  | "dropbox";

const LEFT_PROVIDERS: ProviderId[] = [
  "google",
  "discord",
  "apple",
  "linear",
  "notion",
  "github",
];

const RIGHT_PROVIDERS: ProviderId[] = [
  "linkedin",
  "microsoft",
  "hubspot",
  "x",
  "dropbox",
];

function ProviderIcon({ id }: { id: ProviderId }) {
  switch (id) {
    case "google":
      return (
        <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden="true">
          <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
        </svg>
      );
    case "discord":
      return (
        <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden="true">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      );
    case "apple":
      return (
        <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden="true">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.33c.64-.78 1.08-1.86.96-2.94-.93.04-2.06.62-2.72 1.4-.58.68-1.1 1.78-.96 2.84 1.04.08 2.09-.52 2.72-1.3z" />
        </svg>
      );
    case "linear":
      return (
        <svg viewBox="0 0 24 24" className="h-[21px] w-[21px]" fill="currentColor" aria-hidden="true">
          <path d="M2.22 13.73l8.05 8.05a10 10 0 0 1-8.05-8.05zm-.22-2.6l10.87 10.87c.64-.08 1.26-.22 1.86-.42L2.42 9.27c-.2.6-.34 1.22-.42 1.86zm1.12-3.65l13.4 13.4c.54-.27 1.05-.6 1.53-.97L4.09 5.95c-.37.48-.7.99-.97 1.53zm2.16-2.74l13.98 13.98A10 10 0 0 0 5.28 4.74z" />
        </svg>
      );
    case "notion":
      return (
        <svg viewBox="0 0 24 24" className="h-[21px] w-[21px]" fill="currentColor" aria-hidden="true">
          <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933z" />
        </svg>
      );
    case "github":
      return (
        <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden="true">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
      );
    case "microsoft":
      return (
        <svg viewBox="0 0 24 24" className="h-[20px] w-[20px]" fill="currentColor" aria-hidden="true">
          <path d="M2 2h9.5v9.5H2V2zm10.5 0H22v9.5h-9.5V2zM2 12.5h9.5V22H2v-9.5zm10.5 0H22V22h-9.5v-9.5z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" className="h-[20px] w-[20px]" fill="currentColor" aria-hidden="true">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case "hubspot":
      return (
        <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden="true">
          <path d="M17.64 9.57V6.69a1.86 1.86 0 1 0-1.72 0v2.88a4.25 4.25 0 0 0-2.21.95L8.65 7.22a2.1 2.1 0 1 0-.96 1.42l4.93 3.22a4.32 4.32 0 0 0-.14 1.07 4.37 4.37 0 0 0 .56 2.13l-1.91 1.91a1.7 1.7 0 1 0 1.2 1.2l1.86-1.86a4.33 4.33 0 1 0 3.45-6.74zm-.86 6.45a2.12 2.12 0 1 1 0-4.24 2.12 2.12 0 0 1 0 4.24z" />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "dropbox":
      return (
        <svg viewBox="0 0 24 24" className="h-[21px] w-[21px]" fill="currentColor" aria-hidden="true">
          <path d="M6.5 2L1 5.6l5.5 3.6L12 5.6 6.5 2zm11 0L12 5.6l5.5 3.6L23 5.6 17.5 2zM1 12.8l5.5 3.6L12 12.8 6.5 9.2 1 12.8zm16.5-3.6L12 12.8l5.5 3.6 5.5-3.6-5.5-3.6zM6.5 17.8L12 21.4l5.5-3.6-5.5-3.6-5.5 3.6z" />
        </svg>
      );
  }
}

interface BusTraceProps {
  d: string;
  maskId: string;
  gradId: string;
  isActive: boolean;
  prefersReducedMotion: boolean;
  delay: number;
  duration: number;
  repeatDelay: number;
  isDarkTheme: boolean | null;
}

function BusTrace({
  d,
  maskId,
  gradId,
  isActive,
  prefersReducedMotion,
  delay,
  duration,
  repeatDelay,
  isDarkTheme,
}: BusTraceProps) {
  const pathRef = useRef<SVGPathElement | null>(null);
  const [totalLength, setTotalLength] = useState<number>(120);

  useEffect(() => {
    if (pathRef.current) {
      const len = pathRef.current.getTotalLength();
      if (Number.isFinite(len) && len > 0) {
        setTotalLength(Math.ceil(len));
      }
    }
  }, [d]);

  const pulseLength = 44;

  const baseStrokeClass =
    isDarkTheme === true
      ? "stroke-[#2f3039]"
      : isDarkTheme === false
        ? "stroke-[#d4d6e0]"
        : "stroke-[#d4d6e0] dark:stroke-[#2f3039]";

  return (
    <g>
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          {isActive && !prefersReducedMotion ? (
            <motion.path
              d={d}
              fill="none"
              stroke="white"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${pulseLength} ${totalLength + pulseLength + 40}`}
              initial={{ strokeDashoffset: pulseLength }}
              animate={{ strokeDashoffset: -(totalLength + 20) }}
              transition={{
                duration,
                delay,
                repeat: Infinity,
                repeatDelay,
                ease: [0.4, 0, 0.2, 1],
              }}
            />
          ) : isActive && prefersReducedMotion ? (
            <path
              d={d}
              fill="none"
              stroke="white"
              strokeWidth="6"
              strokeOpacity="0.65"
            />
          ) : null}
        </mask>
      </defs>

      <path
        ref={pathRef}
        d={d}
        fill="none"
        className={baseStrokeClass}
        strokeWidth="1"
        strokeLinecap="round"
      />

      {isActive && (
        <path
          d={d}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeDasharray="1.4 4.4"
          mask={`url(#${maskId})`}
        />
      )}
    </g>
  );
}

interface ServerBladeProps {
  index: number;
  isActive: boolean;
  prefersReducedMotion: boolean;
  isDarkTheme: boolean | null;
}

function ServerBlade({
  index,
  isActive,
  prefersReducedMotion,
  isDarkTheme,
}: ServerBladeProps) {
  const ledPattern = SERVER_LED_PATTERNS[index % SERVER_LED_PATTERNS.length];
  const activeMatrixMap = useMemo(() => {
    const map = new Map<
      number,
      { color: "cyan" | "indigo"; delay: number; duration: number }
    >();
    const items = MATRIX_ACTIVE_CELLS[index % MATRIX_ACTIVE_CELLS.length];
    for (const item of items) {
      map.set(item.idx, {
        color: item.color,
        delay: item.delay,
        duration: item.duration,
      });
    }
    return map;
  }, [index]);

  const chassisClass =
    isDarkTheme === true
      ? "bg-gradient-to-b from-[#2f3038] to-[#23242b] border-[#15151a] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_12px_rgba(0,0,0,0.45)]"
      : isDarkTheme === false
        ? "bg-gradient-to-b from-[#ffffff] to-[#eceef4] border-[#d3d6e2] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_3px_10px_rgba(15,23,42,0.08)]"
        : "bg-gradient-to-b from-[#ffffff] to-[#eceef4] border-[#d3d6e2] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_3px_10px_rgba(15,23,42,0.08)] dark:from-[#2f3038] dark:to-[#23242b] dark:border-[#15151a] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_12px_rgba(0,0,0,0.45)]";

  const rivetClass =
    isDarkTheme === true
      ? "bg-[#15151a] shadow-[0_0.5px_0_rgba(255,255,255,0.08)]"
      : isDarkTheme === false
        ? "bg-[#c5c9d6] shadow-[0_0.5px_0_rgba(255,255,255,0.9)]"
        : "bg-[#c5c9d6] shadow-[0_0.5px_0_rgba(255,255,255,0.9)] dark:bg-[#15151a] dark:shadow-[0_0.5px_0_rgba(255,255,255,0.08)]";

  const dialOuterClass =
    isDarkTheme === true
      ? "bg-[#1b1c21] border-[#141418] shadow-[inset_0_1px_2px_rgba(0,0,0,0.7),0_1px_0_rgba(255,255,255,0.06)]"
      : isDarkTheme === false
        ? "bg-[#e3e6ef] border-[#cbd0de] shadow-[inset_0_1px_2px_rgba(15,23,42,0.12),0_1px_0_rgba(255,255,255,0.85)]"
        : "bg-[#e3e6ef] border-[#cbd0de] shadow-[inset_0_1px_2px_rgba(15,23,42,0.12),0_1px_0_rgba(255,255,255,0.85)] dark:bg-[#1b1c21] dark:border-[#141418] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.7),0_1px_0_rgba(255,255,255,0.06)]";

  const dialInnerClass =
    isDarkTheme === true
      ? "bg-[#26272e] border-[#383a45]/60"
      : isDarkTheme === false
        ? "bg-[#f6f7fa] border-[#d2d6e3]"
        : "bg-[#f6f7fa] border-[#d2d6e3] dark:bg-[#26272e] dark:border-[#383a45]/60";

  const ventClass =
    isDarkTheme === true
      ? "bg-[#15161b]"
      : isDarkTheme === false
        ? "bg-[#c8ccd8]"
        : "bg-[#c8ccd8] dark:bg-[#15161b]";

  const screenClass =
    isDarkTheme === true
      ? "bg-[#141419] border-[#0f0f13] shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]"
      : isDarkTheme === false
        ? "bg-[#1e2230] border-[#cbd0de] shadow-[inset_0_1px_3px_rgba(0,0,0,0.35)]"
        : "bg-[#1e2230] border-[#cbd0de] shadow-[inset_0_1px_3px_rgba(0,0,0,0.35)] dark:bg-[#141419] dark:border-[#0f0f13] dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]";

  const ledOffClass =
    isDarkTheme === true
      ? "bg-[#1a1b22]"
      : isDarkTheme === false
        ? "bg-[#d4d8e3]"
        : "bg-[#d4d8e3] dark:bg-[#1a1b22]";

  return (
    <div
      className={cn(
        "relative flex h-[50px] w-[196px] sm:w-[252px] items-center justify-between rounded-[6px] border px-2 sm:px-2.5",
        chassisClass
      )}
    >
      <div className="flex flex-col justify-between h-[36px] mr-1.5">
        <span className={cn("h-[3.5px] w-[3.5px] rounded-full", rivetClass)} />
        <span className={cn("h-[3.5px] w-[3.5px] rounded-full", rivetClass)} />
      </div>

      <div
        className={cn(
          "flex h-[22px] w-[22px] sm:h-[24px] sm:w-[24px] shrink-0 items-center justify-center rounded-full border",
          dialOuterClass
        )}
      >
        <div
          className={cn(
            "h-[13px] w-[13px] sm:h-[15px] sm:w-[15px] rounded-full border",
            dialInnerClass
          )}
        />
      </div>

      <div className="ml-2 sm:ml-2.5 grid grid-cols-3 gap-x-[3.5px] sm:gap-x-[4px] gap-y-[3.5px] shrink-0">
        {ledPattern.map((led, ledIdx) => (
          <div
            key={ledIdx}
            className={cn(
              "relative h-[2.5px] w-[7px] sm:w-[8px] rounded-[1px] overflow-hidden",
              ledOffClass
            )}
          >
            {isActive && (
              <motion.span
                className="absolute inset-0 rounded-[1px] bg-[#67e8f9] shadow-[0_0_5px_rgba(56,189,248,0.85)]"
                initial={{ opacity: 0.15 }}
                animate={
                  prefersReducedMotion
                    ? { opacity: led.peak * 0.75 }
                    : { opacity: [0.15, led.peak, 0.2, led.peak * 0.7, 0.15] }
                }
                transition={
                  prefersReducedMotion
                    ? { duration: 0.2 }
                    : {
                        duration: led.duration,
                        delay: led.delay,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }
                }
              />
            )}
          </div>
        ))}
      </div>

      <div className="mx-2 sm:mx-2.5 flex flex-1 items-center justify-center gap-[2px] overflow-hidden">
        {VENT_SLITS.map((slit) => (
          <span
            key={slit}
            className={cn("h-[13px] w-[1.8px] shrink-0 rounded-[0.5px]", ventClass)}
          />
        ))}
      </div>

      <div
        className={cn(
          "grid h-[26px] w-[26px] sm:h-[28px] sm:w-[28px] shrink-0 grid-cols-5 grid-rows-5 gap-[2px] rounded-[4px] border p-[4px]",
          screenClass
        )}
      >
        {MATRIX_CELLS.map((cellIdx) => {
          const activeCell = activeMatrixMap.get(cellIdx);
          return (
            <div
              key={cellIdx}
              className="relative flex items-center justify-center"
            >
              <span className="h-[2px] w-[2px] rounded-full bg-white/[0.06]" />
              {isActive && activeCell && (
                <motion.span
                  className={cn(
                    "absolute h-[2.2px] w-[2.2px] rounded-full",
                    activeCell.color === "cyan"
                      ? "bg-[#67e8f9] shadow-[0_0_4px_rgba(103,232,249,0.9)]"
                      : "bg-[#818cf8] shadow-[0_0_4px_rgba(129,140,248,0.85)]"
                  )}
                  initial={{ opacity: 0.1 }}
                  animate={
                    prefersReducedMotion
                      ? { opacity: 0.8 }
                      : { opacity: [0.1, 1, 0.25, 0.85, 0.1] }
                  }
                  transition={
                    prefersReducedMotion
                      ? { duration: 0.2 }
                      : {
                          duration: activeCell.duration,
                          delay: activeCell.delay,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }
                  }
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col justify-between h-[36px] ml-1.5">
        <span className={cn("h-[3.5px] w-[3.5px] rounded-full", rivetClass)} />
        <span className={cn("h-[3.5px] w-[3.5px] rounded-full", rivetClass)} />
      </div>
    </div>
  );
}

export const SocialSignOnCard = React.forwardRef<
  HTMLDivElement,
  SocialSignOnCardProps
>(
  (
    {
      title = "Social Sign-On",
      description = "Add high-conversion Social Sign-on (SSO) to your application in minutes. 20+ options and growing.",
      autoPlay = false,
      active: controlledActive,
      onActiveChange,
      theme = "auto",
      className,
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
      onClick,
      onKeyDown,
      ...rest
    },
    ref
  ) => {
    const rawId = useId();
    const uid = rawId.replace(/:/g, "");
    const prefersReducedMotion = Boolean(useReducedMotion());

    const [isHovered, setIsHovered] = useState(false);
    const [isPinned, setIsPinned] = useState(false);
    const [step, setStep] = useState(0);

    const isControlled = controlledActive !== undefined;
    const isActive = isControlled
      ? controlledActive
      : autoPlay || isHovered || isPinned;

    useEffect(() => {
      if (!isActive || prefersReducedMotion) return;
      const interval = window.setInterval(() => {
        setStep((prev) => prev + 1);
      }, 1550);
      return () => window.clearInterval(interval);
    }, [isActive, prefersReducedMotion]);

    const isDarkTheme: boolean | null =
      theme === "dark" ? true : theme === "light" ? false : null;

    const handleSetActive = (next: boolean) => {
      if (onActiveChange) {
        onActiveChange(next);
      }
    };

    const cardSurfaceClass =
      isDarkTheme === true
        ? "bg-[#212126] border-[#2e2e36] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_40px_rgba(0,0,0,0.45)]"
        : isDarkTheme === false
          ? "bg-[#f8f9fc] border-[#e2e5ef] text-[#0f172a] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_32px_rgba(15,23,42,0.07)]"
          : "bg-[#f8f9fc] border-[#e2e5ef] text-[#0f172a] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_32px_rgba(15,23,42,0.07)] dark:bg-[#212126] dark:border-[#2e2e36] dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_40px_rgba(0,0,0,0.45)]";

    const descClass =
      isDarkTheme === true
        ? "text-[#9394a1]"
        : isDarkTheme === false
          ? "text-[#575c6e]"
          : "text-[#575c6e] dark:text-[#9394a1]";

    const trackStrokeClass =
      isDarkTheme === true
        ? "stroke-[#2c2d36]"
        : isDarkTheme === false
          ? "stroke-[#d7dae6]"
          : "stroke-[#d7dae6] dark:stroke-[#2c2d36]";

    const hubWellClass =
      isDarkTheme === true
        ? "bg-[#18181d] border-white/[0.04] shadow-[0_10px_28px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(0,0,0,0.75)]"
        : isDarkTheme === false
          ? "bg-[#e9ecf5] border-[#d6dae6] shadow-[0_8px_22px_rgba(15,23,42,0.09),inset_0_2px_4px_rgba(15,23,42,0.08)]"
          : "bg-[#e9ecf5] border-[#d6dae6] shadow-[0_8px_22px_rgba(15,23,42,0.09),inset_0_2px_4px_rgba(15,23,42,0.08)] dark:bg-[#18181d] dark:border-white/[0.04] dark:shadow-[0_10px_28px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(0,0,0,0.75)]";

    const hubTileClass =
      isDarkTheme === true
        ? "bg-gradient-to-b from-[#32333d] to-[#262730] border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
        : isDarkTheme === false
          ? "bg-gradient-to-b from-[#ffffff] to-[#f1f3f9] border-[#cfd4e2] shadow-[inset_0_1px_0_rgba(255,255,255,1)]"
          : "bg-gradient-to-b from-[#ffffff] to-[#f1f3f9] border-[#cfd4e2] shadow-[inset_0_1px_0_rgba(255,255,255,1)] dark:from-[#32333d] dark:to-[#262730] dark:border-white/[0.08] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]";

    const badgeClass =
      isDarkTheme === true
        ? "bg-gradient-to-b from-[#33343e] to-[#272831] border-[#3d3e4a] shadow-[0_6px_16px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]"
        : isDarkTheme === false
          ? "bg-gradient-to-b from-[#ffffff] to-[#f0f2f8] border-[#d2d6e3] shadow-[0_6px_16px_rgba(15,23,42,0.09),inset_0_1px_0_rgba(255,255,255,1)]"
          : "bg-gradient-to-b from-[#ffffff] to-[#f0f2f8] border-[#d2d6e3] shadow-[0_6px_16px_rgba(15,23,42,0.09),inset_0_1px_0_rgba(255,255,255,1)] dark:from-[#33343e] dark:to-[#272831] dark:border-[#3d3e4a] dark:shadow-[0_6px_16px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]";

    const badgeIconClass = isActive
      ? isDarkTheme === true
        ? "text-[#f4f4f8]"
        : isDarkTheme === false
          ? "text-[#0f172a]"
          : "text-[#0f172a] dark:text-[#f4f4f8]"
      : isDarkTheme === true
        ? "text-[#b6b8c4]"
        : isDarkTheme === false
          ? "text-[#475569]"
          : "text-[#475569] dark:text-[#b6b8c4]";

    const cloudRestFill =
      isDarkTheme === true
        ? "#191a20"
        : isDarkTheme === false
          ? "#cbd1e0"
          : undefined;

    const topGradId = `${uid}-sso-top-grad`;
    const botGradId = `${uid}-sso-bot-grad`;
    const cloudGradId = `${uid}-sso-cloud-grad`;

    // Two live conveyor slots per side keyed by slot number so each node glides smoothly
    const visibleSlots = [step, step + 1];

    return (
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        aria-pressed={isActive}
        aria-label={`${title}: ${isActive ? "Active SSO provider sync" : "Hover or press to preview Social Sign-On flow"}`}
        onMouseEnter={(e) => {
          setIsHovered(true);
          handleSetActive(true);
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          setIsHovered(false);
          if (!isPinned && !autoPlay) {
            handleSetActive(false);
          }
          onMouseLeave?.(e);
        }}
        onFocus={(e) => {
          setIsHovered(true);
          handleSetActive(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsHovered(false);
          if (!isPinned && !autoPlay) {
            handleSetActive(false);
          }
          onBlur?.(e);
        }}
        onClick={(e) => {
          if (!isControlled) {
            setIsPinned((prev) => {
              const next = !prev;
              handleSetActive(next || autoPlay);
              return next;
            });
          }
          onClick?.(e);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!isControlled) {
              setIsPinned((prev) => {
                const next = !prev;
                handleSetActive(next || autoPlay);
                return next;
              });
            }
          }
          onKeyDown?.(e);
        }}
        className={cn(
          "group relative w-full max-w-[840px] overflow-hidden rounded-2xl border select-none transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
          cardSurfaceClass,
          className
        )}
        {...rest}
      >
        {/* Top Interactive SSO Hub & Provider Conveyor Stage */}
        <div className="relative w-full h-[220px] sm:h-[246px] overflow-hidden">
          <div className="relative mx-auto h-full w-full max-w-[560px]">
            {/* Background Circuit & Conveyor Track SVG */}
            <svg
              viewBox="0 0 560 246"
              fill="none"
              className="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id={topGradId}
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                  <stop offset="50%" stopColor="#818cf8" stopOpacity="0.95" />
                  <stop offset="85%" stopColor="#38bdf8" stopOpacity="1" />
                  <stop offset="100%" stopColor="#a5f3fc" stopOpacity="1" />
                </linearGradient>
                <linearGradient
                  id={botGradId}
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#a5f3fc" stopOpacity="1" />
                  <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Left stepped provider track */}
              <path
                d="M -140 58 L 78 58 Q 86 58 92 64 L 142 114 Q 148 120 148 128 L 148 214"
                className={trackStrokeClass}
                strokeWidth="1"
              />

              {/* Right stepped provider track (mirror) */}
              <path
                d="M 700 58 L 482 58 Q 474 58 468 64 L 418 114 Q 412 120 412 128 L 412 214"
                className={trackStrokeClass}
                strokeWidth="1"
              />

              {/* Top-left hub feed trace */}
              <BusTrace
                d="M 212 0 L 212 52 Q 212 60 218 66 L 236 84"
                maskId={`${uid}-sso-tl`}
                gradId={topGradId}
                isActive={isActive}
                prefersReducedMotion={prefersReducedMotion}
                delay={0}
                duration={0.9}
                repeatDelay={2.1}
                isDarkTheme={isDarkTheme}
              />

              {/* Top-right hub feed trace */}
              <BusTrace
                d="M 348 0 L 348 52 Q 348 60 342 66 L 324 84"
                maskId={`${uid}-sso-tr`}
                gradId={topGradId}
                isActive={isActive}
                prefersReducedMotion={prefersReducedMotion}
                delay={1.5}
                duration={0.9}
                repeatDelay={2.1}
                isDarkTheme={isDarkTheme}
              />

              {/* Bottom-center hub output trace */}
              <BusTrace
                d="M 280 166 L 280 232"
                maskId={`${uid}-sso-bc`}
                gradId={botGradId}
                isActive={isActive}
                prefersReducedMotion={prefersReducedMotion}
                delay={0.85}
                duration={0.85}
                repeatDelay={2.15}
                isDarkTheme={isDarkTheme}
              />
            </svg>

            {/* LEFT CONVEYOR BADGES: single continuous node per slot */}
            <AnimatePresence initial={false}>
              {visibleSlots.map((slot) => {
                const isUpper = slot === step + 1;
                const providerId = LEFT_PROVIDERS[slot % LEFT_PROVIDERS.length];
                return (
                  <motion.div
                    key={`left-slot-${slot}`}
                    initial={
                      prefersReducedMotion
                        ? { left: "14.5%", top: "23.5%", opacity: 1 }
                        : { left: "-4%", top: "23.5%", opacity: 0, scale: 0.88 }
                    }
                    animate={
                      isUpper
                        ? { left: "14.5%", top: "23.5%", opacity: 1, scale: 1 }
                        : { left: "26.4%", top: "48.8%", opacity: 1, scale: 1 }
                    }
                    exit={
                      prefersReducedMotion
                        ? { opacity: 0 }
                        : { left: "26.4%", top: "84%", opacity: 0, scale: 0.86 }
                    }
                    transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
                    className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                  >
                    <div
                      className={cn(
                        "flex h-[50px] w-[50px] sm:h-[56px] sm:w-[56px] items-center justify-center rounded-full border transition-colors duration-300",
                        badgeClass,
                        badgeIconClass
                      )}
                    >
                      <ProviderIcon id={providerId} />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* RIGHT CONVEYOR BADGES: mirror continuous node per slot */}
            <AnimatePresence initial={false}>
              {visibleSlots.map((slot) => {
                const isUpper = slot === step + 1;
                const providerId = RIGHT_PROVIDERS[slot % RIGHT_PROVIDERS.length];
                return (
                  <motion.div
                    key={`right-slot-${slot}`}
                    initial={
                      prefersReducedMotion
                        ? { left: "85.5%", top: "23.5%", opacity: 1 }
                        : { left: "104%", top: "23.5%", opacity: 0, scale: 0.88 }
                    }
                    animate={
                      isUpper
                        ? { left: "85.5%", top: "23.5%", opacity: 1, scale: 1 }
                        : { left: "73.6%", top: "48.8%", opacity: 1, scale: 1 }
                    }
                    exit={
                      prefersReducedMotion
                        ? { opacity: 0 }
                        : { left: "73.6%", top: "84%", opacity: 0, scale: 0.86 }
                    }
                    transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
                    className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                  >
                    <div
                      className={cn(
                        "flex h-[50px] w-[50px] sm:h-[56px] sm:w-[56px] items-center justify-center rounded-full border transition-colors duration-300",
                        badgeClass,
                        badgeIconClass
                      )}
                    >
                      <ProviderIcon id={providerId} />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* CENTER CLOUD HUB TILE */}
            <div className="absolute left-1/2 top-[48.8%] -translate-x-1/2 -translate-y-1/2">
              <div
                className={cn(
                  "rounded-[16px] border p-[5px] transition-shadow duration-500",
                  hubWellClass
                )}
              >
                <div
                  className={cn(
                    "relative flex h-[78px] w-[78px] sm:h-[88px] sm:w-[88px] items-center justify-center overflow-hidden rounded-[12px] border transition-colors duration-300",
                    hubTileClass
                  )}
                >
                  {/* Subtle top-right active cyan sheen inside hub tile */}
                  <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(56,189,248,0.22),transparent_65%)]"
                    initial={false}
                    animate={{ opacity: isActive ? 1 : 0 }}
                    transition={{ duration: 0.35 }}
                  />

                  {/* Ambient cyan glow behind cloud when active */}
                  <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute h-12 w-14 rounded-full bg-[#38bdf8]/40 blur-md"
                    initial={false}
                    animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 0.7 }}
                    transition={{ duration: 0.35 }}
                  />

                  {/* Cloud Vector Mark */}
                  <svg
                    viewBox="0 0 48 36"
                    className="relative z-10 h-[34px] w-[44px] sm:h-[38px] sm:w-[48px] overflow-visible"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient
                        id={cloudGradId}
                        x1="50%"
                        y1="0%"
                        x2="50%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="55%" stopColor="#5eead4" />
                        <stop offset="100%" stopColor="#cffafe" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M14.5 31h20.5a9 9 0 0 0 1.45-17.88A11.5 11.5 0 0 0 14.3 9.75 8.5 8.5 0 0 0 14.5 31Z"
                      className={cn(
                        "transition-[fill,filter] duration-300",
                        !isActive &&
                          isDarkTheme === null &&
                          "fill-[#cbd1e0] dark:fill-[#191a20]"
                      )}
                      fill={
                        isActive
                          ? `url(#${cloudGradId})`
                          : cloudRestFill
                      }
                      style={{
                        filter: isActive
                          ? "drop-shadow(0 0 10px rgba(56,189,248,0.75))"
                          : "none",
                      }}
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copy */}
        <div className="relative z-10 px-6 pb-6 pt-1 sm:px-7 sm:pb-7">
          <h3 className="text-[15px] sm:text-base font-semibold tracking-[-0.015em] leading-snug">
            {title}
          </h3>
          <p
            className={cn(
              "mt-2 max-w-[440px] text-[13.5px] sm:text-[14px] leading-[1.55]",
              descClass
            )}
          >
            {description}
          </p>
        </div>
      </div>
    );
  }
);

SocialSignOnCard.displayName = "SocialSignOnCard";

const ApiKeysCardInner = React.forwardRef<HTMLDivElement, ApiKeysCardProps>(
  (
    {
      title = "API Keys",
      description = "Give every user secure, production-ready API keys without building any of the underlying boilerplate code or UI.",
      statusText = "Authenticating...",
      autoPlay = false,
      active: controlledActive,
      onActiveChange,
      theme = "auto",
      className,
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
      onClick,
      onKeyDown,
      ...rest
    },
    ref
  ) => {
    const rawId = useId();
    const uid = rawId.replace(/:/g, "");
    const prefersReducedMotion = Boolean(useReducedMotion());

    const [isHovered, setIsHovered] = useState(false);
    const [isPinned, setIsPinned] = useState(false);

    const isControlled = controlledActive !== undefined;
    const isActive = isControlled
      ? controlledActive
      : autoPlay || isHovered || isPinned;

    const isDarkTheme: boolean | null =
      theme === "dark" ? true : theme === "light" ? false : null;

    const handleSetActive = (next: boolean) => {
      if (onActiveChange) {
        onActiveChange(next);
      }
    };

    const cardSurfaceClass =
      isDarkTheme === true
        ? "bg-[#212126] border-[#2e2e36] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_40px_rgba(0,0,0,0.45)]"
        : isDarkTheme === false
          ? "bg-[#f8f9fc] border-[#e2e5ef] text-[#0f172a] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_32px_rgba(15,23,42,0.07)]"
          : "bg-[#f8f9fc] border-[#e2e5ef] text-[#0f172a] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_32px_rgba(15,23,42,0.07)] dark:bg-[#212126] dark:border-[#2e2e36] dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_40px_rgba(0,0,0,0.45)]";

    const descClass =
      isDarkTheme === true
        ? "text-[#9394a1]"
        : isDarkTheme === false
          ? "text-[#575c6e]"
          : "text-[#575c6e] dark:text-[#9394a1]";

    const pillWellClass =
      isDarkTheme === true
        ? "bg-[#17171c] border-white/[0.04] shadow-[inset_0_2px_5px_rgba(0,0,0,0.65)]"
        : isDarkTheme === false
          ? "bg-[#eaedf5] border-[#d6dae6] shadow-[inset_0_2px_4px_rgba(15,23,42,0.08)]"
          : "bg-[#eaedf5] border-[#d6dae6] shadow-[inset_0_2px_4px_rgba(15,23,42,0.08)] dark:bg-[#17171c] dark:border-white/[0.04] dark:shadow-[inset_0_2px_5px_rgba(0,0,0,0.65)]";

    const pillInnerClass =
      isDarkTheme === true
        ? "bg-gradient-to-b from-[#34353e] to-[#292a31] border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_6px_rgba(0,0,0,0.45)]"
        : isDarkTheme === false
          ? "bg-gradient-to-b from-[#ffffff] to-[#f2f4f9] border-[#d2d6e3] shadow-[inset_0_1px_0_rgba(255,255,255,1),0_2px_6px_rgba(15,23,42,0.08)]"
          : "bg-gradient-to-b from-[#ffffff] to-[#f2f4f9] border-[#d2d6e3] shadow-[inset_0_1px_0_rgba(255,255,255,1),0_2px_6px_rgba(15,23,42,0.08)] dark:from-[#34353e] dark:to-[#292a31] dark:border-white/[0.08] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_6px_rgba(0,0,0,0.45)]";

    const pillTextClass = isActive
      ? isDarkTheme === true
        ? "text-[#ededf2]"
        : isDarkTheme === false
          ? "text-[#0f172a]"
          : "text-[#0f172a] dark:text-[#ededf2]"
      : isDarkTheme === true
        ? "text-[#7d7f8c]"
        : isDarkTheme === false
          ? "text-[#646b7d]"
          : "text-[#646b7d] dark:text-[#7d7f8c]";

    const spokeColorClass =
      isDarkTheme === true
        ? "bg-[#e4e4ec]"
        : isDarkTheme === false
          ? "bg-[#334155]"
          : "bg-[#334155] dark:bg-[#e4e4ec]";

    const laptopLidFrameClass =
      isDarkTheme === true
        ? "bg-[#17171c] border-[#444652] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
        : isDarkTheme === false
          ? "bg-[#1a1c24] border-[#b4b9c9] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
          : "bg-[#1a1c24] border-[#b4b9c9] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] dark:bg-[#17171c] dark:border-[#444652] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]";

    const laptopBaseClass =
      isDarkTheme === true
        ? "bg-gradient-to-b from-[#6e707d] via-[#50525e] to-[#3a3b45] shadow-[0_8px_18px_rgba(0,0,0,0.55)]"
        : isDarkTheme === false
          ? "bg-gradient-to-b from-[#d9dde8] via-[#c2c7d6] to-[#a9b0c2] shadow-[0_8px_16px_rgba(15,23,42,0.14)]"
          : "bg-gradient-to-b from-[#d9dde8] via-[#c2c7d6] to-[#a9b0c2] shadow-[0_8px_16px_rgba(15,23,42,0.14)] dark:from-[#6e707d] dark:via-[#50525e] dark:to-[#3a3b45] dark:shadow-[0_8px_18px_rgba(0,0,0,0.55)]";

    const laptopNotchClass =
      isDarkTheme === true
        ? "bg-[#3c3d47]"
        : isDarkTheme === false
          ? "bg-[#9ea5b8]"
          : "bg-[#9ea5b8] dark:bg-[#3c3d47]";

    const bottomFadeClass =
      isDarkTheme === true
        ? "from-[#212126] via-[#212126]/65 to-transparent"
        : isDarkTheme === false
          ? "from-[#f8f9fc] via-[#f8f9fc]/65 to-transparent"
          : "from-[#f8f9fc] via-[#f8f9fc]/65 to-transparent dark:from-[#212126] dark:via-[#212126]/65 dark:to-transparent";

    const leftGradId = `${uid}-left-grad`;
    const rightGradId = `${uid}-right-grad`;

    return (
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        aria-pressed={isActive}
        aria-label={`${title}: ${isActive ? statusText : "Hover or press to preview authentication flow"}`}
        onMouseEnter={(e) => {
          setIsHovered(true);
          handleSetActive(true);
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          setIsHovered(false);
          if (!isPinned && !autoPlay) {
            handleSetActive(false);
          }
          onMouseLeave?.(e);
        }}
        onFocus={(e) => {
          setIsHovered(true);
          handleSetActive(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsHovered(false);
          if (!isPinned && !autoPlay) {
            handleSetActive(false);
          }
          onBlur?.(e);
        }}
        onClick={(e) => {
          if (!isControlled) {
            setIsPinned((prev) => {
              const next = !prev;
              handleSetActive(next || autoPlay);
              return next;
            });
          }
          onClick?.(e);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!isControlled) {
              setIsPinned((prev) => {
                const next = !prev;
                handleSetActive(next || autoPlay);
                return next;
              });
            }
          }
          onKeyDown?.(e);
        }}
        className={cn(
          "group relative w-full max-w-[840px] overflow-hidden rounded-2xl border select-none transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
          cardSurfaceClass,
          className
        )}
        {...rest}
      >
        {/* Header Copy */}
        <div className="relative z-10 px-6 pt-6 sm:px-7 sm:pt-7">
          <h3 className="text-[15px] sm:text-base font-semibold tracking-[-0.015em] leading-snug">
            {title}
          </h3>
          <p
            className={cn(
              "mt-2 max-w-[395px] text-[13.5px] sm:text-[14px] leading-[1.55]",
              descClass
            )}
          >
            {description}
          </p>
        </div>

        {/* Interactive Architecture Diagram */}
        <div className="relative z-0 mt-3 sm:mt-4 pl-4 pr-0 sm:px-6 pb-3 sm:pb-4">
          <div className="relative flex items-center justify-between h-[162px] -mr-10 sm:mr-0">
            {/* LEFT NODE: 3D Perspective Laptop */}
            <div className="relative flex flex-col items-center shrink-0 pt-2">
              <div
                className="relative w-[108px] sm:w-[158px] h-[70px] sm:h-[98px]"
                style={{ perspective: "760px" }}
              >
                <motion.div
                  className={cn(
                    "relative h-full w-full rounded-t-[8px] border-[1.5px] p-[3.5px] sm:p-[4px] overflow-hidden",
                    laptopLidFrameClass
                  )}
                  style={{
                    transformOrigin: "50% 100%",
                    transformStyle: "preserve-3d",
                  }}
                  initial={false}
                  animate={{
                    rotateX: isActive ? 0 : -74,
                    opacity: isActive ? 1 : 0.92,
                  }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0.15 }
                      : {
                          type: "spring",
                          stiffness: 210,
                          damping: 26,
                          mass: 0.9,
                        }
                  }
                >
                  <div className="relative h-full w-full rounded-[4px] bg-[#1b1c22] overflow-hidden flex flex-col items-center justify-center">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -top-6 -right-6 h-[140%] w-[55%] rotate-[24deg] bg-white/[0.025]"
                    />

                    <motion.div
                      aria-hidden="true"
                      className="flex flex-col items-center mb-1.5"
                      initial={false}
                      animate={{ opacity: isActive ? 1 : 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="h-[11px] w-[11px] sm:h-[14px] sm:w-[14px] rounded-full bg-white/[0.045]" />
                      <div className="mt-[2px] h-[8px] w-[20px] sm:h-[10px] sm:w-[26px] rounded-t-full bg-white/[0.04]" />
                    </motion.div>

                    <motion.div
                      aria-hidden="true"
                      className="relative h-[9px] w-[38px] sm:h-[11px] sm:w-[54px] rounded-full bg-[#101015] border border-white/[0.06] overflow-hidden flex items-center px-[3px]"
                      initial={false}
                      animate={{ opacity: isActive ? 1 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.div
                        className="h-[3px] sm:h-[3.5px] rounded-full bg-[#5eead4] shadow-[0_0_8px_rgba(56,189,248,0.9)]"
                        initial={{ width: "42%", x: 0 }}
                        animate={
                          isActive && !prefersReducedMotion
                            ? {
                                width: ["32%", "64%", "38%", "56%", "32%"],
                                x: [0, 6, 2, 8, 0],
                              }
                            : { width: "48%", x: 0 }
                        }
                        transition={
                          isActive && !prefersReducedMotion
                            ? {
                                duration: 2.0,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }
                            : { duration: 0.2 }
                        }
                      />
                    </motion.div>
                  </div>
                </motion.div>
              </div>

              <div
                className={cn(
                  "relative z-10 h-[7px] sm:h-[9px] w-[124px] sm:w-[178px] rounded-b-[6px] rounded-t-[1.5px] flex items-start justify-center",
                  laptopBaseClass
                )}
              >
                <div
                  className={cn(
                    "h-[2.5px] sm:h-[3px] w-[20px] sm:w-[24px] rounded-b-[3px]",
                    laptopNotchClass
                  )}
                />
              </div>
            </div>

            {/* LEFT DATA BUS */}
            <div className="relative flex-1 min-w-[20px] h-[24px] -mx-[2px] -mt-1">
              <svg
                viewBox="0 0 120 24"
                preserveAspectRatio="none"
                className="h-full w-full overflow-visible"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient
                    id={leftGradId}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                    <stop offset="45%" stopColor="#818cf8" stopOpacity="0.9" />
                    <stop offset="85%" stopColor="#38bdf8" stopOpacity="1" />
                    <stop offset="100%" stopColor="#a5f3fc" stopOpacity="1" />
                  </linearGradient>
                </defs>
                <BusTrace
                  d="M 0 12 L 120 12"
                  maskId={`${uid}-left-mask`}
                  gradId={leftGradId}
                  isActive={isActive}
                  prefersReducedMotion={prefersReducedMotion}
                  delay={0}
                  duration={0.85}
                  repeatDelay={1.15}
                  isDarkTheme={isDarkTheme}
                />
              </svg>
            </div>

            {/* CENTER NODE: Recessed Authenticating Status Pill */}
            <div
              className={cn(
                "relative z-10 shrink-0 rounded-[12px] border p-[4px] -mt-1",
                pillWellClass
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-2 sm:gap-3 rounded-[8px] border px-3 sm:px-5 py-2 sm:py-2.5 transition-colors duration-300",
                  pillInnerClass
                )}
              >
                <motion.div
                  aria-hidden="true"
                  className="relative h-[15px] w-[15px] sm:h-[18px] sm:w-[18px] shrink-0"
                  animate={
                    isActive && !prefersReducedMotion
                      ? { rotate: 360 }
                      : { rotate: 0 }
                  }
                  transition={
                    isActive && !prefersReducedMotion
                      ? {
                          duration: 1.1,
                          repeat: Infinity,
                          ease: "linear",
                        }
                      : { duration: 0.2 }
                  }
                >
                  {SPINNER_SPOKES.map((spoke) => {
                    const opacity = isActive
                      ? 0.2 + (spoke / 11) * 0.8
                      : 0.12 + (spoke / 11) * 0.35;
                    return (
                      <span
                        key={spoke}
                        className="absolute inset-0 flex justify-center"
                        style={{ transform: `rotate(${spoke * 30}deg)` }}
                      >
                        <span
                          className={cn(
                            "h-[3.8px] sm:h-[4.2px] w-[1.5px] sm:w-[1.6px] rounded-full transition-opacity duration-300",
                            spokeColorClass
                          )}
                          style={{ opacity }}
                        />
                      </span>
                    );
                  })}
                </motion.div>

                <span
                  className={cn(
                    "font-mono tabular-nums text-[11px] sm:text-[13px] tracking-[0.02em] whitespace-nowrap transition-colors duration-300",
                    pillTextClass
                  )}
                >
                  {statusText}
                </span>
              </div>
            </div>

            {/* RIGHT 3-BRANCH DATA BUS */}
            <div className="relative w-[40px] sm:w-[76px] h-[162px] shrink-0 -mx-[2px]">
              <svg
                viewBox="0 0 76 162"
                preserveAspectRatio="none"
                className="h-full w-full overflow-visible"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient
                    id={rightGradId}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                    <stop offset="50%" stopColor="#818cf8" stopOpacity="0.9" />
                    <stop offset="85%" stopColor="#38bdf8" stopOpacity="1" />
                    <stop offset="100%" stopColor="#a5f3fc" stopOpacity="1" />
                  </linearGradient>
                </defs>

                <BusTrace
                  d="M 0 71 L 34 71 Q 42 71 47 63 L 58 33 Q 62 25 70 25 L 76 25"
                  maskId={`${uid}-right-top-mask`}
                  gradId={rightGradId}
                  isActive={isActive}
                  prefersReducedMotion={prefersReducedMotion}
                  delay={0.85}
                  duration={0.85}
                  repeatDelay={1.15}
                  isDarkTheme={isDarkTheme}
                />

                <BusTrace
                  d="M 0 77 L 26 77 Q 34 77 39 79 L 44 80 Q 49 81 57 81 L 76 81"
                  maskId={`${uid}-right-mid-mask`}
                  gradId={rightGradId}
                  isActive={isActive}
                  prefersReducedMotion={prefersReducedMotion}
                  delay={0.85}
                  duration={0.85}
                  repeatDelay={1.15}
                  isDarkTheme={isDarkTheme}
                />

                <BusTrace
                  d="M 0 83 L 18 83 Q 26 83 31 90 L 54 130 Q 59 137 67 137 L 76 137"
                  maskId={`${uid}-right-bot-mask`}
                  gradId={rightGradId}
                  isActive={isActive}
                  prefersReducedMotion={prefersReducedMotion}
                  delay={0.85}
                  duration={0.85}
                  repeatDelay={1.15}
                  isDarkTheme={isDarkTheme}
                />
              </svg>
            </div>

            {/* RIGHT NODE: Stacked 3U Server Rack */}
            <div className="relative flex flex-col gap-[6px] shrink-0">
              {[0, 1, 2].map((bladeIdx) => (
                <ServerBlade
                  key={bladeIdx}
                  index={bladeIdx}
                  isActive={isActive}
                  prefersReducedMotion={prefersReducedMotion}
                  isDarkTheme={isDarkTheme}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Subtle bottom vignette fade */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t",
            bottomFadeClass
          )}
        />
      </div>
    );
  }
);

ApiKeysCardInner.displayName = "ApiKeysCardInner";

export const ApiKeysCard = React.forwardRef<HTMLDivElement, ApiKeysCardProps>(
  (
    {
      title = "API Keys",
      description = "Give every user secure, production-ready API keys without building any of the underlying boilerplate code or UI.",
      statusText = "Authenticating...",
      ssoTitle = "Social Sign-On",
      ssoDescription = "Add high-conversion Social Sign-on (SSO) to your application in minutes. 20+ options and growing.",
      showSocialSignOn = true,
      autoPlay = false,
      active,
      onActiveChange,
      theme = "auto",
      className,
      ...rest
    },
    ref
  ) => {
    if (!showSocialSignOn) {
      return (
        <ApiKeysCardInner
          ref={ref}
          title={title}
          description={description}
          statusText={statusText}
          autoPlay={autoPlay}
          active={active}
          onActiveChange={onActiveChange}
          theme={theme}
          className={className}
          {...rest}
        />
      );
    }

    return (
      <div
        ref={ref}
        className={cn("flex w-full max-w-[840px] flex-col gap-4", className)}
        {...rest}
      >
        <SocialSignOnCard
          title={ssoTitle}
          description={ssoDescription}
          autoPlay={autoPlay}
          active={active}
          onActiveChange={onActiveChange}
          theme={theme}
        />
        <ApiKeysCardInner
          title={title}
          description={description}
          statusText={statusText}
          autoPlay={autoPlay}
          active={active}
          onActiveChange={onActiveChange}
          theme={theme}
        />
      </div>
    );
  }
);

ApiKeysCard.displayName = "ApiKeysCard";

export { ApiKeysCard as component, ApiKeysCard as Component };
export default ApiKeysCard;
