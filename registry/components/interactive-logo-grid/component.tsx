'use client';

import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// --- TYPES & INTERFACES ---

export interface ClientItem {
  id: string;
  name: string;
  badges: string[];
  headline: string;
  subline: string;
  LogoComponent: React.FC<{ className?: string }>;
}

export interface InteractiveLogoGridProps {
  items?: ClientItem[];
  className?: string;
  columns?: 2 | 3 | 4;
}

// --- BESPOKE LOGO SVGs (ADAPTIVE CURRENTCOLOR & VECTOR GEOMETRY) ---

const EightSleepLogo: React.FC<{ className?: string }> = ({ className = 'h-7' }) => (
  <svg viewBox="0 0 160 38" fill="currentColor" className={className} aria-hidden="true">
    <g transform="translate(4, 2)">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14 0C8.477 0 4 4.477 4 10C4 13.067 5.378 15.811 7.559 17.653C5.163 19.539 3.6 22.464 3.6 25.8C3.6 31.433 8.167 36 13.8 36C19.433 36 24 31.433 24 25.8C24 22.464 22.437 19.539 20.041 17.653C22.222 15.811 23.6 13.067 23.6 10C23.6 4.477 19.123 0 13.6 0H14ZM13.8 6C15.899 6 17.6 7.701 17.6 9.8C17.6 11.899 15.899 13.6 13.8 13.6C11.701 13.6 10 11.899 10 9.8C10 7.701 11.701 6 13.8 6ZM13.8 21.6C16.12 21.6 18 23.48 18 25.8C18 28.12 16.12 30 13.8 30C11.48 30 9.6 28.12 9.6 25.8C9.6 23.48 11.48 21.6 13.8 21.6Z"
      />
    </g>
    <text x="36" y="17" fontSize="14" fontWeight="800" letterSpacing="0.08em" fontFamily="system-ui, sans-serif">
      EIGHT
    </text>
    <text x="36" y="32" fontSize="14" fontWeight="800" letterSpacing="0.08em" fontFamily="system-ui, sans-serif">
      SLEEP
    </text>
  </svg>
);

const HeinekenLogo: React.FC<{ className?: string }> = ({ className = 'h-6' }) => (
  <svg viewBox="0 0 170 32" fill="currentColor" className={className} aria-hidden="true">
    <path
      d="M12 2.5L14.7 10.8H23.5L16.4 15.9L19.1 24.2L12 19.1L4.9 24.2L7.6 15.9L0.5 10.8H9.3L12 2.5Z"
      fill="currentColor"
    />
    <text
      x="32"
      y="22"
      fontSize="17.5"
      fontWeight="900"
      letterSpacing="0.14em"
      fontFamily="Impact, system-ui, sans-serif"
    >
      HEINEKEN
    </text>
  </svg>
);

const IPNLogo: React.FC<{ className?: string }> = ({ className = 'h-8' }) => (
  <svg viewBox="0 0 150 42" fill="currentColor" className={className} aria-hidden="true">
    <circle cx="10" cy="8" r="3" />
    <circle cx="18" cy="4" r="3" />
    <circle cx="26" cy="8" r="3" />
    <text x="5" y="32" fontSize="24" fontWeight="800" letterSpacing="-0.03em" fontFamily="system-ui, sans-serif">
      ipn
    </text>
    <line x1="49" y1="12" x2="49" y2="34" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
    <text x="55" y="19" fontSize="6.5" fontWeight="600" letterSpacing="0.02em" fontFamily="system-ui, sans-serif">
      Inspired
    </text>
    <text x="55" y="26.5" fontSize="6.5" fontWeight="600" letterSpacing="0.02em" fontFamily="system-ui, sans-serif">
      Pet
    </text>
    <text x="55" y="34" fontSize="6.5" fontWeight="600" letterSpacing="0.02em" fontFamily="system-ui, sans-serif">
      Nutrition
    </text>
  </svg>
);

const RedingtonLogo: React.FC<{ className?: string }> = ({ className = 'h-6' }) => (
  <svg viewBox="0 0 150 32" fill="currentColor" className={className} aria-hidden="true">
    <g transform="translate(0, 3)">
      <path d="M0 4C0 1.79 1.79 0 4 0H10C14.42 0 18 3.58 18 8C18 11.23 16.08 14.02 13.33 15.28L19.2 24.5C19.8 25.4 19.2 26.6 18.1 26.6H13.6C12.8 26.6 12.1 26.2 11.6 25.5L6.5 17H5V25C5 25.8 4.4 26.5 3.5 26.5H1.5C0.7 26.5 0 25.8 0 25V4ZM5 5.5V12.5H10C11.93 12.5 13.5 10.93 13.5 9C13.5 7.07 11.93 5.5 10 5.5H5Z" />
    </g>
    <text x="28" y="22" fontSize="17.5" fontWeight="700" letterSpacing="-0.02em" fontFamily="system-ui, sans-serif">
      Redington
    </text>
  </svg>
);

const MitsubishiLogo: React.FC<{ className?: string }> = ({ className = 'h-7' }) => (
  <svg viewBox="0 0 165 38" fill="currentColor" className={className} aria-hidden="true">
    <g transform="translate(2, 4)">
      <polygon points="15,0 21,10.39 15,20.78 9,10.39" />
      <polygon points="15,20.78 9,10.39 0,20.78 6,31.18" />
      <polygon points="15,20.78 21,10.39 30,20.78 24,31.18" />
    </g>
    <text x="39" y="17" fontSize="11" fontWeight="800" letterSpacing="0.06em" fontFamily="system-ui, sans-serif">
      MITSUBISHI
    </text>
    <text x="39" y="30" fontSize="11" fontWeight="800" letterSpacing="0.06em" fontFamily="system-ui, sans-serif">
      MOTORS
    </text>
  </svg>
);

const MandaiLogo: React.FC<{ className?: string }> = ({ className = 'h-8' }) => (
  <svg viewBox="0 0 150 40" fill="currentColor" className={className} aria-hidden="true">
    <text
      x="75"
      y="22"
      textAnchor="middle"
      fontSize="20"
      fontWeight="700"
      letterSpacing="0.01em"
      fontFamily="Georgia, Cambria, serif"
    >
      Mandai
    </text>
    <text
      x="75"
      y="34"
      textAnchor="middle"
      fontSize="7.5"
      fontWeight="700"
      letterSpacing="0.22em"
      fontFamily="system-ui, sans-serif"
    >
      WILDLIFE RESERVE
    </text>
  </svg>
);

const SparLogo: React.FC<{ className?: string }> = ({ className = 'h-6' }) => (
  <svg viewBox="0 0 150 30" className={className} aria-hidden="true">
    <rect x="5" y="3" width="138" height="24" rx="2" className="fill-zinc-900 dark:fill-zinc-100" />
    <text
      x="18"
      y="21"
      fontSize="16"
      fontWeight="900"
      letterSpacing="0.1em"
      fontFamily="Impact, sans-serif"
      className="fill-white dark:fill-zinc-950"
    >
      SPAR
    </text>
    <circle cx="118" cy="15" r="9" className="fill-white dark:fill-zinc-950" />
    <path
      d="M118 8L113.5 14H115.5L112.5 18H116L114.5 21H121.5L120 18H123.5L120.5 14H122.5L118 8Z"
      className="fill-zinc-900 dark:fill-zinc-100"
    />
  </svg>
);

const MaterialBankLogo: React.FC<{ className?: string }> = ({ className = 'h-7' }) => (
  <svg viewBox="0 0 160 36" fill="currentColor" className={className} aria-hidden="true">
    <g transform="translate(2, 4)">
      <path d="M0 16L7 22V7L0 1V16Z" fill="currentColor" />
      <path d="M8 23L15 28V13L8 7V23Z" fill="currentColor" opacity="0.8" />
      <path d="M16 13L23 7V22L16 28V13Z" fill="currentColor" />
      <path d="M24 7L31 1V16L24 22V7Z" fill="currentColor" opacity="0.8" />
    </g>
    <text x="40" y="16.5" fontSize="13" fontWeight="800" letterSpacing="-0.01em" fontFamily="system-ui, sans-serif">
      Material
    </text>
    <text x="40" y="30.5" fontSize="13" fontWeight="800" letterSpacing="-0.01em" fontFamily="system-ui, sans-serif">
      Bank
    </text>
  </svg>
);

// --- DEFAULT DATA COLLECTION ---

export const DEFAULT_CLIENTS: ClientItem[] = [
  {
    id: 'eight-sleep',
    name: 'Eight Sleep',
    badges: ['B2C'],
    headline: 'Streamlining global fulfillment',
    subline: 'across 10+ 3PLs',
    LogoComponent: EightSleepLogo,
  },
  {
    id: 'heineken',
    name: 'Heineken',
    badges: ['B2B'],
    headline: 'From distributors to end-customer',
    subline: 'order handling',
    LogoComponent: HeinekenLogo,
  },
  {
    id: 'ipn',
    name: 'Inspired Pet Nutrition',
    badges: ['B2B', 'AI'],
    headline: '80% cost savings with AI-powered',
    subline: 'email to-order flow',
    LogoComponent: IPNLogo,
  },
  {
    id: 'redington',
    name: 'Redington',
    badges: ['B2B'],
    headline: 'Automating enterprise supply chain',
    subline: 'across 38+ markets',
    LogoComponent: RedingtonLogo,
  },
  {
    id: 'mitsubishi',
    name: 'Mitsubishi Motors',
    badges: ['B2C'],
    headline: 'Personalized after-sales for new car',
    subline: 'purchases',
    LogoComponent: MitsubishiLogo,
  },
  {
    id: 'mandai',
    name: 'Mandai Wildlife Reserve',
    badges: ['B2C'],
    headline: 'Handling ticketing sales with over',
    subline: '100k monthly orders',
    LogoComponent: MandaiLogo,
  },
  {
    id: 'spar',
    name: 'SPAR',
    badges: ['B2C'],
    headline: 'Scaling quick commerce across',
    subline: '500+ store locations',
    LogoComponent: SparLogo,
  },
  {
    id: 'material-bank',
    name: 'Material Bank',
    badges: ['B2B'],
    headline: 'Sub-24h architectural material',
    subline: 'sampling for 100k+ designers',
    LogoComponent: MaterialBankLogo,
  },
];

// --- CELL COMPONENT ---

interface GridCellProps {
  item: ClientItem;
}

const GridCell: React.FC<GridCellProps> = ({ item }) => {
  const [isActive, setIsActive] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const { name, badges, headline, subline, LogoComponent } = item;

  const yOffset = shouldReduceMotion ? 0 : 36;
  const transitionConfig = {
    duration: shouldReduceMotion ? 0.15 : 0.38,
    ease: [0.16, 1, 0.3, 1],
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${name} case study: ${headline} ${subline}`}
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
      onFocus={() => setIsActive(true)}
      onBlur={() => setIsActive(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsActive((prev) => !prev);
        }
      }}
      className="group relative flex h-[140px] w-full cursor-pointer select-none items-center justify-center overflow-hidden bg-white px-6 py-5 outline-none transition-colors duration-200 hover:bg-zinc-50/90 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 dark:bg-zinc-950 dark:hover:bg-zinc-900/90 dark:focus-visible:ring-zinc-400 dark:focus-visible:ring-offset-zinc-950"
    >
      {/* Rested State: Adaptive Monochrome Logo */}
      <motion.div
        initial={false}
        animate={
          isActive
            ? { y: -yOffset, opacity: 0 }
            : { y: 0, opacity: 1 }
        }
        transition={transitionConfig}
        className="pointer-events-none absolute inset-0 flex items-center justify-center text-zinc-900 dark:text-zinc-100"
      >
        <LogoComponent />
      </motion.div>

      {/* Hover/Focus State: Badges + Verbatim Case Study */}
      <motion.div
        initial={false}
        animate={
          isActive
            ? { y: 0, opacity: 1 }
            : { y: yOffset, opacity: 0 }
        }
        transition={transitionConfig}
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4"
      >
        {/* Badges Pill Row */}
        <div className="mb-[8px] flex items-center gap-[6px]">
          {badges.map((badge) => (
            <span
              key={badge}
              className="inline-flex items-center rounded-full border border-zinc-200/80 bg-zinc-100 px-[9px] py-[2.5px] text-[10.5px] font-semibold tracking-[0.03em] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/90 dark:text-zinc-300"
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Metric / Case Study Summary */}
        <p className="max-w-[215px] text-center text-[13.5px] font-medium leading-[1.38] text-zinc-900 dark:text-zinc-100">
          {headline}
          <br />
          {subline}
        </p>
      </motion.div>
    </div>
  );
};

// --- REUSABLE MAIN COMPONENT ---

export function InteractiveLogoGrid({
  items = DEFAULT_CLIENTS,
  className = '',
  columns = 4,
}: InteractiveLogoGridProps) {
  const columnClasses = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <div
      className={`w-full max-w-[1080px] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 shadow-sm dark:border-zinc-800 dark:bg-zinc-800 ${className}`}
    >
      {/* 
        Single-pixel border architecture: 
        Outer border + background gap-[1px] guarantees sharp, uniform 1px grid borders without double-stroke overlap.
      */}
      <div className={`grid grid-cols-1 gap-[1px] ${columnClasses}`}>
        {items.map((item) => (
          <GridCell key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

// --- DEMO WRAPPER FOR 21ST.DEV PLAYGROUND / PREVIEW ---

export default function InteractiveLogoGridDemo() {
  return (
    <section className="flex min-h-screen w-full items-center justify-center bg-zinc-50 p-4 transition-colors dark:bg-zinc-950 sm:p-8 lg:p-12">
      <InteractiveLogoGrid />
    </section>
  );
}