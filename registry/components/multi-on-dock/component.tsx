'use client';

import * as React from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utility for Tailwind class consolidation */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// -----------------------------------------------------------------------------
// Types & Interfaces
// -----------------------------------------------------------------------------

export interface DockItemData {
  id: string;
  label: string;
  icon?: React.ReactNode;
  avatarUrl?: string;
  isAvatar?: boolean;
  hasStatusRing?: boolean;
  statusColor?: string;
  onClick?: () => void;
}

export interface FloatingDockProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: DockItemData[];
  activeId?: string;
  defaultActiveId?: string;
  onItemSelect?: (id: string) => void;
  tooltipSide?: 'right' | 'left';
}

// -----------------------------------------------------------------------------
// Motion Spring Presets
// -----------------------------------------------------------------------------

const SPRING_DOCK_ITEM: Transition = {
  type: 'spring',
  stiffness: 450,
  damping: 24,
  mass: 0.8,
};

const SPRING_TOOLTIP: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 28,
  mass: 0.6,
};

// -----------------------------------------------------------------------------
// Bespoke Vector Icons
// -----------------------------------------------------------------------------

export function MultiOnIcon({
  isHovered = false,
  className,
}: {
  isHovered?: boolean;
  className?: string;
}) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-5 h-5 text-neutral-800 dark:text-neutral-200', className)}
      animate={{
        rotate: isHovered ? 120 : 0,
        scale: isHovered ? 1.05 : 1,
      }}
      transition={SPRING_DOCK_ITEM}
    >
      <g transform="translate(12, 12)">
        {[0, 120, 240].map((angle) => (
          <path
            key={angle}
            transform={`rotate(${angle}) translate(-12, -12)`}
            d="M12 3.8C14.6 3.8 17.1 5.3 18.2 7.8C18.6 8.8 18.7 9.9 18.3 10.9L15.9 9.8C16.1 9.2 16.1 8.5 15.8 7.9C15.1 6.4 13.5 5.5 11.9 5.7C10.8 5.8 9.9 6.4 9.3 7.3L7.4 5.9C8.4 4.5 10.2 3.8 12 3.8Z"
          />
        ))}
      </g>
    </motion.svg>
  );
}

export function PlusIcon({
  isHovered = false,
  className,
}: {
  isHovered?: boolean;
  className?: string;
}) {
  return (
    <motion.svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className={cn('w-4 h-4 text-neutral-900 dark:text-neutral-100', className)}
      animate={{
        rotate: isHovered ? 90 : 0,
        scale: isHovered ? 1.08 : 1,
      }}
      transition={SPRING_DOCK_ITEM}
    >
      <line x1="8" y1="2.75" x2="8" y2="13.25" />
      <line x1="2.75" y1="8" x2="13.25" y2="8" />
    </motion.svg>
  );
}

function StatusProgressRing({
  size = 48,
  strokeWidth = 2.6,
  color = '#1E8E3E',
}: {
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const perimeter = 2 * Math.PI * radius;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute inset-0 -rotate-90 pointer-events-none"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${perimeter * 0.77} ${perimeter * 0.23}`}
        strokeDashoffset={-perimeter * 0.08}
      />
    </svg>
  );
}

function DefaultAvatar() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full object-cover">
      <rect width="100" height="100" fill="#E8ECEF" />
      <path d="M15 100C16 82 28 72 44 71L50 82L56 71C72 72 84 82 85 100Z" fill="#26282B" />
      <polygon points="46,71 54,71 50,81" fill="#C59B7D" />
      <ellipse cx="50" cy="53" rx="14" ry="16" fill="#CFA788" />
      <path d="M38 48C38 62 43 69 50 69C57 69 62 62 62 48Z" fill="#B88E70" />
      <path d="M39 52C39 63 43 68 50 68C57 68 61 63 61 52C61 55 58 64 50 64C42 64 39 55 39 52Z" fill="#232428" />
      <rect x="36" y="44" width="12.5" height="9" rx="3.5" fill="#151618" />
      <rect x="51.5" y="44" width="12.5" height="9" rx="3.5" fill="#151618" />
      <line x1="48" y1="47.5" x2="52" y2="47.5" stroke="#151618" strokeWidth="1.8" />
      <path d="M38 46L45 51" stroke="#474A51" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M53.5 46L60.5 51" stroke="#474A51" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M47 60Q50 62 53 60" stroke="#2E241F" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M37 46C36 34 40 28 50 28C60 28 64 34 63 46C60 36 56 33 50 33C44 33 40 36 37 46Z" fill="#212226" />
    </svg>
  );
}

// -----------------------------------------------------------------------------
// Master Floating Dock Component
// -----------------------------------------------------------------------------

export function FloatingDock({
  items,
  activeId,
  defaultActiveId = 'multion',
  onItemSelect,
  tooltipSide = 'right',
  className,
  ...props
}: FloatingDockProps) {
  const [selectedId, setSelectedId] = React.useState<string>(defaultActiveId);
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const [tooltipCenterY, setTooltipCenterY] = React.useState<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const currentActiveId = activeId ?? selectedId;

  const defaultItems: DockItemData[] = [
    {
      id: 'multion',
      label: 'MultiOn',
      icon: <MultiOnIcon isHovered={hoveredId === 'multion'} />,
    },
    {
      id: 'add',
      label: 'New Action',
      icon: <PlusIcon isHovered={hoveredId === 'add'} />,
    },
    {
      id: 'profile',
      label: 'Abu Sayeed',
      isAvatar: true,
      hasStatusRing: true,
      statusColor: '#1E8E3E',
    },
  ];

  const dockItems = items ?? defaultItems;

  const handleItemHover = (id: string, el: HTMLElement) => {
    setHoveredId(id);
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      // আইটেমের সুনির্দিষ্ট উল্লম্ব কেন্দ্র নির্ণয়
      setTooltipCenterY(elRect.top - containerRect.top + elRect.height / 2);
    }
  };

  const handleItemLeave = () => {
    setHoveredId(null);
    setTooltipCenterY(null);
  };

  const activeHoveredItem = dockItems.find((i) => i.id === hoveredId);

  return (
    <div
      ref={containerRef}
      role="toolbar"
      aria-orientation="vertical"
      aria-label="Application dock"
      className={cn('relative inline-flex items-center select-none', className)}
      {...props}
    >
      {/* Pill Capsule Container */}
      <nav
        className={cn(
          'relative w-[72px] min-h-[72px] rounded-full py-[14px]',
          'bg-white dark:bg-[#18181B]',
          'flex flex-col items-center gap-3',
          'shadow-[0_10px_35px_-4px_rgba(0,0,0,0.08),0_2px_8px_-2px_rgba(0,0,0,0.04)]',
          'ring-1 ring-black/[0.04] dark:ring-white/[0.08]',
          'transition-all duration-300'
        )}
      >
        {dockItems.map((item) => {
          const isAvatar = item.isAvatar ?? (!!item.avatarUrl || item.id === 'profile');
          const isSelected = currentActiveId === item.id;

          const sharedProps = {
            onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) =>
              handleItemHover(item.id, e.currentTarget),
            onMouseLeave: handleItemLeave,
            onFocus: (e: React.FocusEvent<HTMLButtonElement>) =>
              handleItemHover(item.id, e.currentTarget),
            onBlur: handleItemLeave,
            onClick: () => {
              item.onClick?.();
              setSelectedId(item.id);
              onItemSelect?.(item.id);
            },
          };

          if (isAvatar) {
            return (
              <motion.button
                key={item.id}
                type="button"
                aria-label={item.label}
                aria-pressed={isSelected}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                transition={SPRING_DOCK_ITEM}
                className={cn(
                  'relative w-[48px] h-[48px] rounded-full flex items-center justify-center',
                  'cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-500'
                )}
                {...sharedProps}
              >
                {item.hasStatusRing && (
                  <StatusProgressRing
                    size={48}
                    strokeWidth={2.6}
                    color={item.statusColor || '#1E8E3E'}
                  />
                )}
                <div className="w-[38px] h-[38px] rounded-full overflow-hidden bg-neutral-200 ring-[1.5px] ring-white dark:ring-neutral-900 shadow-sm flex items-center justify-center">
                  {item.avatarUrl ? (
                    <img
                      src={item.avatarUrl}
                      alt={item.label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <DefaultAvatar />
                  )}
                </div>
              </motion.button>
            );
          }

          return (
            <motion.button
              key={item.id}
              type="button"
              aria-label={item.label}
              aria-pressed={isSelected}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              transition={SPRING_DOCK_ITEM}
              className={cn(
                'relative w-[44px] h-[44px] rounded-full',
                'bg-[#EFF0F4] hover:bg-[#E5E7ED] active:bg-[#DCE0E8]',
                'dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:active:bg-neutral-600',
                isSelected && 'ring-2 ring-neutral-400 dark:ring-neutral-500 bg-[#E5E7ED] dark:bg-neutral-700',
                'flex items-center justify-center cursor-pointer outline-none',
                'transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-neutral-400'
              )}
              {...sharedProps}
            >
              {item.icon}
            </motion.button>
          );
        })}
      </nav>

      {/* Hover & Focus Activated Tooltip */}
      <AnimatePresence>
        {hoveredId && tooltipCenterY !== null && activeHoveredItem && (
          <motion.div
            key="dock-floating-tooltip"
            initial={{ opacity: 0, x: tooltipSide === 'right' ? -6 : 6, scale: 0.94 }}
            animate={{
              opacity: 1,
              x: 0,
              y: tooltipCenterY - 17, // 34px উচ্চতার অর্ধেক বাদ দিয়ে নিখুঁত উল্লম্ব অ্যালাইনমেন্ট
              scale: 1,
            }}
            exit={{ opacity: 0, x: tooltipSide === 'right' ? -6 : 6, scale: 0.94 }}
            transition={SPRING_TOOLTIP}
            className={cn(
              'absolute top-0 z-50 pointer-events-none',
              tooltipSide === 'right' ? 'left-[80px]' : 'right-[80px]'
            )}
          >
            <div
              className={cn(
                'h-[34px] px-[13px] rounded-[11px]',
                'bg-[#8A8C93] dark:bg-neutral-700',
                'flex items-center justify-center',
                'shadow-[0_4px_16px_rgba(0,0,0,0.14)] border border-white/10'
              )}
            >
              <span className="text-white text-[13.5px] font-[450] tracking-[-0.015em] leading-none whitespace-nowrap">
                {activeHoveredItem.label}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Interactive Playground Preview
// -----------------------------------------------------------------------------

export default function FloatingDockDemo() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#E5E5E5] dark:bg-[#0D0D0E] p-8 antialiased">
      <FloatingDock />
    </main>
  );
}