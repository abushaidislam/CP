"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface BentoItem {
  id: string;
  title: React.ReactNode;
  description: React.ReactNode;
  icon: React.ReactNode;
  themeClasses: {
    selectedBg: string;
    descText: string;
    border: string;
  };
}

export interface BentoGridSelectorProps {
  defaultValue?: string;
  value?: string;
  onChange?: (id: string) => void;
  className?: string;
}

/* --- SVG Icons --- */

const LightbulbIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 16.2C7.18 15.07 6 13.06 6 10.75C6 7.3 8.69 4.5 12 4.5C15.31 4.5 18 7.3 18 10.75C18 13.06 16.82 15.07 15 16.2H9Z" />
    <line x1="9.5" y1="19" x2="14.5" y2="19" />
    <line x1="11" y1="21.5" x2="13" y2="21.5" />
  </svg>
);

const SchoolCapIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 4L3 8.5L12 13L21 8.5L12 4Z" />
    <path d="M6.5 10.5V15.5L12 18.5L17.5 15.5V10.5" />
    <path d="M21 8.5V15.5" />
  </svg>
);

const CodeIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const CompassIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

const CheckIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ROW_ONE_OPTIONS: BentoItem[] = [
  {
    id: "organise",
    title: (
      <>
        Organise your
        <br />
        ideas
      </>
    ),
    description: (
      <>
        Group chats by topic and
        <br />
        ground on your sources.
      </>
    ),
    icon: <LightbulbIcon />,
    themeClasses: {
      selectedBg: "bg-[#eef2ff] hover:bg-[#e0e7ff] dark:bg-[#182052] dark:hover:bg-[#1b245c]",
      descText: "text-[#4338ca] dark:text-[#949ec2]",
      border: "border-indigo-200/70 dark:border-indigo-500/20",
    },
  },
  {
    id: "study",
    title: "Study and learn",
    description: (
      <>
        Get custom lessons and
        <br />
        track your progress.
      </>
    ),
    icon: <SchoolCapIcon />,
    themeClasses: {
      selectedBg: "bg-[#ecfeff] hover:bg-[#cffafe] dark:bg-[#142a38] dark:hover:bg-[#183243]",
      descText: "text-[#0e7490] dark:text-[#89b0c7]",
      border: "border-cyan-200/70 dark:border-cyan-500/20",
    },
  },
];

const ROW_TWO_OPTIONS: BentoItem[] = [
  {
    id: "build",
    title: (
      <>
        Build & develop
        <br />
        components
      </>
    ),
    description: (
      <>
        Fast prototyping with AI
        <br />
        and production patterns.
      </>
    ),
    icon: <CodeIcon />,
    themeClasses: {
      selectedBg: "bg-[#faf5ff] hover:bg-[#f3e8ff] dark:bg-[#2d163d] dark:hover:bg-[#361b4a]",
      descText: "text-[#7e22ce] dark:text-[#c49ac7]",
      border: "border-purple-200/70 dark:border-purple-500/20",
    },
  },
  {
    id: "explore",
    title: "Explore insights",
    description: (
      <>
        Analyze trends and discover
        <br />
        high-impact workflows.
      </>
    ),
    icon: <CompassIcon />,
    themeClasses: {
      selectedBg: "bg-[#f0fdf4] hover:bg-[#dcfce7] dark:bg-[#1b2c24] dark:hover:bg-[#21362c]",
      descText: "text-[#15803d] dark:text-[#97bea8]",
      border: "border-emerald-200/70 dark:border-emerald-500/20",
    },
  },
];

const SPRING_TRANSITION = {
  type: "spring",
  stiffness: 350,
  damping: 32,
  mass: 1,
} as const;

export const BentoGridSelector: React.FC<BentoGridSelectorProps> = ({
  defaultValue = "study",
  value,
  onChange,
  className,
}) => {
  const [internalSelectedId, setInternalSelectedId] = useState<string>(defaultValue);

  const activeId = value !== undefined ? value : internalSelectedId;

  const handleSelect = (id: string) => {
    if (value === undefined) {
      setInternalSelectedId(id);
    }
    onChange?.(id);
  };

  const isRowOneActive = ROW_ONE_OPTIONS.some((item) => item.id === activeId);
  const isRowTwoActive = ROW_TWO_OPTIONS.some((item) => item.id === activeId);

  const renderCard = (item: BentoItem, isRowActive: boolean) => {
    const isSelected = activeId === item.id;
    const cardWidth = isRowActive ? (isSelected ? 224 : 182) : 203;

    return (
      <motion.button
        key={item.id}
        role="radio"
        aria-checked={isSelected}
        type="button"
        onClick={() => handleSelect(item.id)}
        initial={false}
        animate={{ width: cardWidth }}
        whileTap={{ scale: 0.985 }}
        transition={{
          width: SPRING_TRANSITION,
          scale: { duration: 0.1 },
        }}
        className={cn(
          "relative flex h-[148px] cursor-pointer flex-col items-start justify-start overflow-hidden rounded-[16px] border p-[18px] text-left outline-none select-none transition-colors duration-200",
          "focus-visible:ring-2 focus-visible:ring-indigo-500/40 dark:focus-visible:ring-white/20",
          isSelected
            ? cn(item.themeClasses.selectedBg, item.themeClasses.border)
            : "bg-[#f4f4f6] hover:bg-[#eaebee] border-black/[0.04] dark:bg-[#141416] dark:hover:bg-[#1b1b1e] dark:border-white/[0.04]"
        )}
      >
        {/* Animated Check Badge */}
        <AnimatePresence initial={false}>
          {isSelected && (
            <motion.div
              key="check"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{
                type: "spring",
                stiffness: 450,
                damping: 25,
              }}
              className="absolute top-[16px] right-[16px] flex h-[22px] w-[22px] items-center justify-center rounded-full bg-white text-neutral-900 shadow-[0_1px_3px_rgba(0,0,0,0.12)] border border-black/5 dark:bg-[#111217] dark:text-[#dcdde6] dark:border-transparent dark:shadow-none"
            >
              <CheckIcon />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Icon */}
        <motion.div
          animate={{
            scale: isSelected ? 1.05 : 1,
          }}
          transition={{ duration: 0.2 }}
          className={cn(
            "transition-colors duration-200",
            isSelected
              ? "text-neutral-900 dark:text-white"
              : "text-neutral-600 dark:text-[#e2e3e8]"
          )}
        >
          {item.icon}
        </motion.div>

        {/* Title */}
        <div className="mt-[10px] w-[188px] text-[16.5px] leading-[1.26] font-normal tracking-[-0.01em] text-neutral-900 dark:text-[#e4e5ea]">
          {item.title}
        </div>

        {/* Coordinated Description Reveal */}
        <AnimatePresence initial={false}>
          {isSelected && (
            <motion.div
              key="desc"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 3 }}
              transition={{
                opacity: { duration: 0.16, delay: 0.04, ease: "easeOut" },
                y: { type: "spring", stiffness: 380, damping: 28 },
              }}
              className={cn(
                "mt-[6px] w-[188px] text-[13.2px] leading-[1.34] font-normal tracking-[-0.005em]",
                item.themeClasses.descText
              )}
            >
              {item.description}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    );
  };

  return (
    <div
      role="radiogroup"
      aria-label="Select an option"
      className={cn(
        "flex w-full items-center justify-center bg-neutral-100 dark:bg-[#0b0b0c] p-6 antialiased select-none font-sans transition-colors duration-200",
        className
      )}
    >
      <div className="flex flex-col gap-[12px]">
        {/* Top Row */}
        <div className="flex items-center gap-[12px]">
          {ROW_ONE_OPTIONS.map((item) => renderCard(item, isRowOneActive))}
        </div>

        {/* Bottom Row */}
        <div className="flex items-center gap-[12px]">
          {ROW_TWO_OPTIONS.map((item) => renderCard(item, isRowTwoActive))}
        </div>
      </div>
    </div>
  );
};

export default BentoGridSelector;