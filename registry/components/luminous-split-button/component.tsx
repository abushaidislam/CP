"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  FilePlus2,
  FolderPlus,
  GitBranchPlus,
  Sparkles,
} from "lucide-react";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type SplitButtonSize = "sm" | "md" | "lg";
export type SplitButtonVariant = "violet" | "indigo" | "emerald" | "rose";
export type SplitButtonTheme = "auto" | "dark" | "light";

export interface SplitButtonMenuItem {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  onSelect?: () => void;
}

export interface LuminousSplitButtonProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  /** Primary action label shown in the left segment. */
  label?: string;
  /** Optional custom icon replacing the default filled plus-square badge. */
  icon?: React.ReactNode;
  /** Visual size preset preserving the ~3:1 split proportion. */
  size?: SplitButtonSize;
  /** Color theme preset; "violet" matches the electric purple reference. */
  variant?: SplitButtonVariant;
  /** Surface theme for the dropdown menu and ambient shadow contrast. */
  theme?: SplitButtonTheme;
  /** Enables the radiant ambient backlight glow behind the button. */
  glow?: boolean;
  /** Disables both primary and dropdown trigger segments. */
  disabled?: boolean;
  /** Dropdown menu items shown when clicking the chevron segment. */
  items?: SplitButtonMenuItem[];
  /** Controlled open state for the dropdown menu. */
  open?: boolean;
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean;
  /** Callback fired when dropdown open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** Callback fired when the left primary action segment is clicked. */
  onPrimaryClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Callback fired when a dropdown menu item is selected. */
  onSelectItem?: (item: SplitButtonMenuItem) => void;
  /** Accessible label for the right dropdown trigger button. */
  menuTriggerLabel?: string;
}

const DEFAULT_ITEMS: SplitButtonMenuItem[] = [
  {
    id: "document",
    label: "New Document",
    description: "Start a blank collaborative doc",
    shortcut: "⌘N",
    icon: <FilePlus2 className="h-4 w-4" />,
  },
  {
    id: "workspace",
    label: "New Project",
    description: "Create a structured workspace",
    shortcut: "⇧⌘P",
    icon: <FolderPlus className="h-4 w-4" />,
  },
  {
    id: "branch",
    label: "New Branch",
    description: "Fork from current production state",
    shortcut: "⌘B",
    icon: <GitBranchPlus className="h-4 w-4" />,
  },
  {
    id: "ai-draft",
    label: "Generate with AI",
    description: "Scaffold from a natural prompt",
    shortcut: "⌘K",
    icon: <Sparkles className="h-4 w-4" />,
  },
];

const SIZE_STYLES: Record<
  SplitButtonSize,
  {
    height: string;
    radius: string;
    innerRadius: string;
    primaryPadding: string;
    triggerWidth: string;
    text: string;
    gap: string;
    iconSize: number;
    chevronSize: number;
    menuWidth: string;
  }
> = {
  sm: {
    height: "h-10",
    radius: "rounded-[11px]",
    innerRadius: "rounded-[9.75px]",
    primaryPadding: "pl-3.5 pr-4",
    triggerWidth: "w-9",
    text: "text-[14px] leading-none",
    gap: "gap-2",
    iconSize: 16,
    chevronSize: 14,
    menuWidth: "w-60",
  },
  md: {
    height: "h-12",
    radius: "rounded-[14px]",
    innerRadius: "rounded-[12.75px]",
    primaryPadding: "pl-[18px] pr-[22px]",
    triggerWidth: "w-[44px]",
    text: "text-[16px] leading-none",
    gap: "gap-2.5",
    iconSize: 19,
    chevronSize: 16,
    menuWidth: "w-64",
  },
  lg: {
    height: "h-14",
    radius: "rounded-[16px]",
    innerRadius: "rounded-[14.75px]",
    primaryPadding: "pl-5 pr-6",
    triggerWidth: "w-[52px]",
    text: "text-[18px] leading-none",
    gap: "gap-3",
    iconSize: 22,
    chevronSize: 18,
    menuWidth: "w-72",
  },
};

interface VariantTokens {
  surfaceGradient: string;
  borderGradient: string;
  innerShadow: string;
  glowAutoClass: string;
  glowDarkClass: string;
  glowLightClass: string;
  divider: string;
  plusBadgeFill: string;
  plusStroke: string;
  chevronColor: string;
  segmentHover: string;
  focusRing: string;
  menuAccentText: string;
  menuItemActiveBg: string;
}

const VARIANT_TOKENS: Record<SplitButtonVariant, VariantTokens> = {
  violet: {
    surfaceGradient:
      "linear-gradient(180deg, #7439f5 0%, #6827f2 48%, #6c2cf3 82%, #763df4 100%)",
    borderGradient:
      "linear-gradient(180deg, #b395f8 0%, #8b5cf6 50%, #9970f7 100%)",
    innerShadow:
      "inset 0 1px 1px rgba(255, 255, 255, 0.34), inset 0 -1px 1px rgba(196, 170, 255, 0.38), inset 0 0 12px rgba(167, 137, 236, 0.28)",
    glowAutoClass:
      "shadow-[0_8px_24px_-4px_rgba(104,39,242,0.42),0_2px_8px_-1px_rgba(104,39,242,0.28)] dark:shadow-[0_0_0_1px_rgba(12,8,19,0.9),0_8px_26px_-2px_rgba(107,45,243,0.56),0_0_38px_2px_rgba(114,54,245,0.34)]",
    glowDarkClass:
      "shadow-[0_0_0_1px_rgba(12,8,19,0.9),0_8px_26px_-2px_rgba(107,45,243,0.56),0_0_38px_2px_rgba(114,54,245,0.34)]",
    glowLightClass:
      "shadow-[0_8px_24px_-4px_rgba(104,39,242,0.42),0_2px_8px_-1px_rgba(104,39,242,0.28)]",
    divider: "rgba(215, 196, 255, 0.28)",
    plusBadgeFill: "#d7c4ff",
    plusStroke: "#6726f2",
    chevronColor: "#e3bbff",
    segmentHover: "rgba(255, 255, 255, 0.11)",
    focusRing: "focus-visible:ring-[#c4a8ff]",
    menuAccentText: "text-violet-600 dark:text-[#c7a8ff]",
    menuItemActiveBg: "bg-violet-500/10 dark:bg-violet-500/18",
  },
  indigo: {
    surfaceGradient:
      "linear-gradient(180deg, #5462f6 0%, #434ee8 48%, #4a57ee 82%, #5b68f7 100%)",
    borderGradient:
      "linear-gradient(180deg, #a5b4fc 0%, #6366f1 50%, #818cf8 100%)",
    innerShadow:
      "inset 0 1px 1px rgba(255, 255, 255, 0.32), inset 0 -1px 1px rgba(165, 180, 252, 0.36), inset 0 0 12px rgba(129, 140, 248, 0.26)",
    glowAutoClass:
      "shadow-[0_8px_24px_-4px_rgba(79,70,229,0.38),0_2px_8px_-1px_rgba(79,70,229,0.24)] dark:shadow-[0_0_0_1px_rgba(10,12,24,0.9),0_8px_26px_-2px_rgba(79,70,229,0.54),0_0_38px_2px_rgba(99,102,241,0.32)]",
    glowDarkClass:
      "shadow-[0_0_0_1px_rgba(10,12,24,0.9),0_8px_26px_-2px_rgba(79,70,229,0.54),0_0_38px_2px_rgba(99,102,241,0.32)]",
    glowLightClass:
      "shadow-[0_8px_24px_-4px_rgba(79,70,229,0.38),0_2px_8px_-1px_rgba(79,70,229,0.24)]",
    divider: "rgba(199, 210, 254, 0.28)",
    plusBadgeFill: "#c7d2fe",
    plusStroke: "#434ee8",
    chevronColor: "#dbeafe",
    segmentHover: "rgba(255, 255, 255, 0.11)",
    focusRing: "focus-visible:ring-indigo-300",
    menuAccentText: "text-indigo-600 dark:text-indigo-300",
    menuItemActiveBg: "bg-indigo-500/10 dark:bg-indigo-500/18",
  },
  emerald: {
    surfaceGradient:
      "linear-gradient(180deg, #10b981 0%, #059669 48%, #079f6f 82%, #14b882 100%)",
    borderGradient:
      "linear-gradient(180deg, #6ee7b7 0%, #10b981 50%, #34d399 100%)",
    innerShadow:
      "inset 0 1px 1px rgba(255, 255, 255, 0.32), inset 0 -1px 1px rgba(110, 231, 183, 0.34), inset 0 0 12px rgba(52, 211, 153, 0.24)",
    glowAutoClass:
      "shadow-[0_8px_24px_-4px_rgba(5,150,105,0.36),0_2px_8px_-1px_rgba(5,150,105,0.22)] dark:shadow-[0_0_0_1px_rgba(6,20,16,0.9),0_8px_26px_-2px_rgba(16,185,129,0.46),0_0_36px_2px_rgba(16,185,129,0.26)]",
    glowDarkClass:
      "shadow-[0_0_0_1px_rgba(6,20,16,0.9),0_8px_26px_-2px_rgba(16,185,129,0.46),0_0_36px_2px_rgba(16,185,129,0.26)]",
    glowLightClass:
      "shadow-[0_8px_24px_-4px_rgba(5,150,105,0.36),0_2px_8px_-1px_rgba(5,150,105,0.22)]",
    divider: "rgba(167, 243, 208, 0.28)",
    plusBadgeFill: "#bbf7d0",
    plusStroke: "#059669",
    chevronColor: "#d1fae5",
    segmentHover: "rgba(255, 255, 255, 0.12)",
    focusRing: "focus-visible:ring-emerald-300",
    menuAccentText: "text-emerald-600 dark:text-emerald-300",
    menuItemActiveBg: "bg-emerald-500/10 dark:bg-emerald-500/18",
  },
  rose: {
    surfaceGradient:
      "linear-gradient(180deg, #f43f5e 0%, #e11d48 48%, #e6234e 82%, #f23d60 100%)",
    borderGradient:
      "linear-gradient(180deg, #fda4af 0%, #f43f5e 50%, #fb7185 100%)",
    innerShadow:
      "inset 0 1px 1px rgba(255, 255, 255, 0.32), inset 0 -1px 1px rgba(253, 164, 175, 0.36), inset 0 0 12px rgba(251, 113, 133, 0.25)",
    glowAutoClass:
      "shadow-[0_8px_24px_-4px_rgba(225,29,72,0.38),0_2px_8px_-1px_rgba(225,29,72,0.22)] dark:shadow-[0_0_0_1px_rgba(24,6,12,0.9),0_8px_26px_-2px_rgba(225,29,72,0.5),0_0_36px_2px_rgba(244,63,94,0.28)]",
    glowDarkClass:
      "shadow-[0_0_0_1px_rgba(24,6,12,0.9),0_8px_26px_-2px_rgba(225,29,72,0.5),0_0_36px_2px_rgba(244,63,94,0.28)]",
    glowLightClass:
      "shadow-[0_8px_24px_-4px_rgba(225,29,72,0.38),0_2px_8px_-1px_rgba(225,29,72,0.22)]",
    divider: "rgba(254, 205, 211, 0.28)",
    plusBadgeFill: "#fecdd3",
    plusStroke: "#e11d48",
    chevronColor: "#ffe4e6",
    segmentHover: "rgba(255, 255, 255, 0.12)",
    focusRing: "focus-visible:ring-rose-300",
    menuAccentText: "text-rose-600 dark:text-rose-300",
    menuItemActiveBg: "bg-rose-500/10 dark:bg-rose-500/18",
  },
};

function FilledPlusSquareIcon({
  size,
  badgeFill,
  plusStroke,
}: {
  size: number;
  badgeFill: string;
  plusStroke: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect
        x="1.25"
        y="1.25"
        width="17.5"
        height="17.5"
        rx="4.5"
        fill={badgeFill}
      />
      <path
        d="M10 6.1V13.9M6.1 10H13.9"
        stroke={plusStroke}
        strokeWidth="2.15"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronDownIcon({
  size,
  color,
}: {
  size: number;
  color: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M3.75 6L8 10.25L12.25 6"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const LuminousSplitButton = React.forwardRef<
  HTMLDivElement,
  LuminousSplitButtonProps
>(function LuminousSplitButton(
  {
    label = "New",
    icon,
    size = "md",
    variant = "violet",
    theme = "auto",
    glow = true,
    disabled = false,
    items = DEFAULT_ITEMS,
    open: controlledOpen,
    defaultOpen = false,
    onOpenChange,
    onPrimaryClick,
    onSelectItem,
    menuTriggerLabel = "More options",
    className,
    ...rest
  },
  forwardedRef
) {
  const prefersReducedMotion = useReducedMotion();
  const rawId = React.useId();
  const safeId = React.useMemo(
    () => rawId.replace(/[^a-zA-Z0-9_-]/g, ""),
    [rawId]
  );
  const menuId = `luminous-split-menu-${safeId}`;

  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const [activeIndex, setActiveIndex] = React.useState<number>(-1);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [sheenKey, setSheenKey] = React.useState<number>(0);

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const itemRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  const isControlled = controlledOpen !== undefined;
  const isOpen = disabled
    ? false
    : isControlled
      ? controlledOpen
      : uncontrolledOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (disabled && next) return;
      if (!isControlled) {
        setUncontrolledOpen(next);
      }
      onOpenChange?.(next);
    },
    [disabled, isControlled, onOpenChange]
  );

  const mergeRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    },
    [forwardedRef]
  );

  // Close menu on outside pointer press or Escape
  React.useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, setOpen]);

  // Focus active item when navigating with keyboard
  React.useEffect(() => {
    if (isOpen && activeIndex >= 0) {
      itemRefs.current[activeIndex]?.focus();
    }
  }, [isOpen, activeIndex]);

  const findNextEnabledIndex = React.useCallback(
    (startIndex: number, direction: 1 | -1) => {
      if (items.length === 0) return -1;
      for (let step = 1; step <= items.length; step++) {
        const idx =
          (startIndex + direction * step + items.length) % items.length;
        if (!items[idx]?.disabled) return idx;
      }
      return -1;
    },
    [items]
  );

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex(findNextEnabledIndex(-1, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex(findNextEnabledIndex(0, -1));
    }
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => findNextEnabledIndex(prev, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        findNextEnabledIndex(prev < 0 ? 0 : prev, -1)
      );
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(findNextEnabledIndex(-1, 1));
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(findNextEnabledIndex(0, -1));
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  const handlePrimaryAction = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (!prefersReducedMotion) {
      setSheenKey((k) => k + 1);
    }
    onPrimaryClick?.(e);
  };

  const handleSelect = (item: SplitButtonMenuItem) => {
    if (item.disabled) return;
    setSelectedId(item.id);
    item.onSelect?.();
    onSelectItem?.(item);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const sizeConfig = SIZE_STYLES[size] ?? SIZE_STYLES.md;
  const tokens = VARIANT_TOKENS[variant] ?? VARIANT_TOKENS.violet;

  const isForcedDark = theme === "dark";
  const isForcedLight = theme === "light";

  const glowClass =
    !glow || disabled
      ? ""
      : isForcedDark
        ? tokens.glowDarkClass
        : isForcedLight
          ? tokens.glowLightClass
          : tokens.glowAutoClass;

  const menuSurfaceClass = isForcedDark
    ? "bg-[#13141f]/95 border-[#2c2a42] text-zinc-100 shadow-[0_18px_42px_-8px_rgba(4,4,10,0.82)]"
    : isForcedLight
      ? "bg-white/95 border-zinc-200/90 text-zinc-900 shadow-[0_18px_40px_-10px_rgba(15,23,42,0.16)]"
      : "bg-white/95 dark:bg-[#13141f]/95 border-zinc-200/90 dark:border-[#2c2a42] text-zinc-900 dark:text-zinc-100 shadow-[0_18px_40px_-10px_rgba(15,23,42,0.16)] dark:shadow-[0_18px_42px_-8px_rgba(4,4,10,0.82)]";

  const itemHoverClass = isForcedDark
    ? "hover:bg-white/[0.06] focus-visible:bg-white/[0.08]"
    : isForcedLight
      ? "hover:bg-zinc-100/90 focus-visible:bg-zinc-100"
      : "hover:bg-zinc-100/90 dark:hover:bg-white/[0.06] focus-visible:bg-zinc-100 dark:focus-visible:bg-white/[0.08]";

  const mutedTextClass = isForcedDark
    ? "text-zinc-400"
    : isForcedLight
      ? "text-zinc-500"
      : "text-zinc-500 dark:text-zinc-400";

  const shortcutClass = isForcedDark
    ? "bg-white/[0.06] text-zinc-400 border-white/[0.08]"
    : isForcedLight
      ? "bg-zinc-100 text-zinc-500 border-zinc-200/80"
      : "bg-zinc-100 dark:bg-white/[0.06] text-zinc-500 dark:text-zinc-400 border-zinc-200/80 dark:border-white/[0.08]";

  return (
    <div
      ref={mergeRefs}
      role="group"
      aria-label={`${label} actions`}
      className={cn(
        "relative inline-flex select-none font-sans antialiased",
        className
      )}
      {...rest}
    >
      {/* Gradient Bezel Shell */}
      <motion.div
        whileHover={
          disabled || prefersReducedMotion
            ? undefined
            : { y: -1, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } }
        }
        whileTap={
          disabled || prefersReducedMotion
            ? undefined
            : { scale: 0.985, transition: { duration: 0.1 } }
        }
        onHoverStart={() => {
          if (!disabled && !prefersReducedMotion) {
            setSheenKey((k) => k + 1);
          }
        }}
        className={cn(
          "relative p-[1.25px] transition-shadow duration-200",
          sizeConfig.radius,
          glowClass,
          disabled && "opacity-50 grayscale-[35%] cursor-not-allowed"
        )}
        style={{
          background: tokens.borderGradient,
        }}
      >
        {/* Inner Backlit Surface */}
        <div
          className={cn(
            "relative flex items-stretch overflow-hidden",
            sizeConfig.height,
            sizeConfig.innerRadius
          )}
          style={{
            background: tokens.surfaceGradient,
            boxShadow: tokens.innerShadow,
          }}
        >
          {/* Event-driven specular light sweep (triggers once on hover/click, never loops) */}
          {!prefersReducedMotion && !disabled && sheenKey > 0 && (
            <motion.span
              key={sheenKey}
              aria-hidden="true"
              initial={{ x: "-130%", opacity: 0 }}
              animate={{ x: "230%", opacity: [0, 0.42, 0] }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -skew-x-12"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)",
              }}
            />
          )}

          {/* Primary Action Segment (~74%) */}
          <button
            type="button"
            disabled={disabled}
            onClick={handlePrimaryAction}
            className={cn(
              "relative z-10 inline-flex items-center justify-center font-medium tracking-[-0.012em] text-white transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset",
              sizeConfig.primaryPadding,
              sizeConfig.gap,
              sizeConfig.text,
              tokens.focusRing,
              disabled ? "cursor-not-allowed" : "cursor-pointer"
            )}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.backgroundColor = tokens.segmentHover;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            {icon ?? (
              <FilledPlusSquareIcon
                size={sizeConfig.iconSize}
                badgeFill={tokens.plusBadgeFill}
                plusStroke={tokens.plusStroke}
              />
            )}
            <span className="whitespace-nowrap">{label}</span>
          </button>

          {/* Translucent Vertical Divider */}
          <span
            aria-hidden="true"
            className="relative z-10 w-px self-stretch"
            style={{ backgroundColor: tokens.divider }}
          />

          {/* Dropdown Trigger Segment (~26%) */}
          <button
            ref={triggerRef}
            type="button"
            disabled={disabled}
            aria-label={menuTriggerLabel}
            aria-haspopup="menu"
            aria-expanded={isOpen}
            aria-controls={menuId}
            onClick={() => {
              const next = !isOpen;
              setOpen(next);
              if (next) {
                setActiveIndex(-1);
              }
            }}
            onKeyDown={handleTriggerKeyDown}
            className={cn(
              "relative z-10 inline-flex items-center justify-center transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset",
              sizeConfig.triggerWidth,
              tokens.focusRing,
              disabled ? "cursor-not-allowed" : "cursor-pointer"
            )}
            style={{
              backgroundColor: isOpen ? tokens.segmentHover : "transparent",
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.backgroundColor = tokens.segmentHover;
              }
            }}
            onMouseLeave={(e) => {
              if (!isOpen) {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            <motion.span
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 420, damping: 32 }
              }
              className="inline-flex items-center justify-center"
            >
              <ChevronDownIcon
                size={sizeConfig.chevronSize}
                color={tokens.chevronColor}
              />
            </motion.span>
          </button>
        </div>
      </motion.div>

      {/* Dropdown Menu Popover */}
      <AnimatePresence>
        {isOpen && items.length > 0 && (
          <motion.div
            id={menuId}
            role="menu"
            aria-orientation="vertical"
            onKeyDown={handleMenuKeyDown}
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -6, scale: 0.97 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 1, y: 0, scale: 1 }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -4, scale: 0.98 }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0.1 }
                : { type: "spring", stiffness: 460, damping: 34, mass: 0.75 }
            }
            style={{ transformOrigin: "top right" }}
            className={cn(
              "absolute right-0 top-full z-50 mt-2.5 overflow-hidden rounded-xl border p-1.5 backdrop-blur-xl",
              sizeConfig.menuWidth,
              menuSurfaceClass
            )}
          >
            {items.map((item, idx) => {
              const isSelected = selectedId === item.id;
              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    itemRefs.current[idx] = el;
                  }}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => handleSelect(item)}
                  className={cn(
                    "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-120 focus:outline-none",
                    item.disabled
                      ? "cursor-not-allowed opacity-45"
                      : cn("cursor-pointer", itemHoverClass),
                    isSelected && tokens.menuItemActiveBg
                  )}
                >
                  {item.icon && (
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-transparent transition-colors",
                        isSelected ? tokens.menuAccentText : mutedTextClass
                      )}
                    >
                      {item.icon}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-[13px] font-medium leading-tight">
                      <span className="truncate">{item.label}</span>
                      {isSelected && (
                        <Check
                          className={cn(
                            "h-3.5 w-3.5 shrink-0",
                            tokens.menuAccentText
                          )}
                        />
                      )}
                    </span>
                    {item.description && (
                      <span
                        className={cn(
                          "mt-0.5 block truncate text-[11.5px] leading-snug",
                          mutedTextClass
                        )}
                      >
                        {item.description}
                      </span>
                    )}
                  </span>
                  {item.shortcut && (
                    <kbd
                      className={cn(
                        "shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10.5px] font-medium leading-none",
                        shortcutClass
                      )}
                    >
                      {item.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

LuminousSplitButton.displayName = "LuminousSplitButton";

export {
  LuminousSplitButton,
  LuminousSplitButton as component,
  LuminousSplitButton as Component,
};
export default LuminousSplitButton;