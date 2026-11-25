"use client";

import React, { useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type LiquidHomeButtonSize = "sm" | "md" | "lg";
export type LiquidHomeButtonTheme = "auto" | "dark" | "light";

export interface LiquidHomeButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"
  > {
  /** Primary button text label */
  label?: string;
  /** Proportional size preset preserving exact concentric pill-to-orb geometry */
  size?: LiquidHomeButtonSize;
  /** Duration in seconds for one full 360-degree chromatic prism orbit */
  orbitDuration?: number;
  /** Intensity multiplier (0 to 1.5) for ambient caustic bloom and prism radiance */
  glowIntensity?: number;
  /** Color theme mode: 'auto' adapts to Tailwind dark mode, or force 'dark' / 'light' */
  theme?: LiquidHomeButtonTheme;
  /** Optional custom icon replacing the default brushed-silver Home glyph */
  icon?: React.ReactNode;
  /** Enable or pause the continuous liquid chromatic orbit */
  animate?: boolean;
  /** Highlights the button as the active navigation item */
  active?: boolean;
}

const SIZE_CONFIG: Record<
  LiquidHomeButtonSize,
  {
    pill: string;
    innerBezel: string;
    orb: string;
    ringInset: string;
    iconBox: string;
    label: string;
    gap: string;
  }
> = {
  sm: {
    pill: "h-12 pl-1.5 pr-6",
    innerBezel: "inset-[2px]",
    orb: "h-9 w-9",
    ringInset: "inset-[3.5px]",
    iconBox: "h-[18px] w-[18px]",
    label: "text-[15px] tracking-[-0.015em]",
    gap: "gap-3",
  },
  md: {
    pill: "h-16 pl-2 pr-8",
    innerBezel: "inset-[3px]",
    orb: "h-12 w-12",
    ringInset: "inset-[4.5px]",
    iconBox: "h-6 w-6",
    label: "text-[20px] tracking-[-0.02em]",
    gap: "gap-4",
  },
  lg: {
    pill: "h-20 pl-2 pr-10",
    innerBezel: "inset-[3.5px]",
    orb: "h-16 w-16",
    ringInset: "inset-[6px]",
    iconBox: "h-8 w-8",
    label: "text-[26px] tracking-[-0.022em]",
    gap: "gap-5",
  },
};

function DefaultHomeGlyph({
  uid,
  isLightOnly,
  isDarkOnly,
  className,
}: {
  uid: string;
  isLightOnly: boolean;
  isDarkOnly: boolean;
  className?: string;
}) {
  const darkGradId = `${uid}-home-metal-dark`;
  const lightGradId = `${uid}-home-metal-light`;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn(
        "transition-transform duration-300 ease-out group-hover/liquid-btn:scale-[1.04]",
        className
      )}
      style={{
        filter: isLightOnly
          ? "drop-shadow(0 1.5px 3px rgba(15, 23, 42, 0.22))"
          : "drop-shadow(0 2px 5px rgba(0, 0, 0, 0.55))",
      }}
    >
      <defs>
        <linearGradient
          id={darkGradId}
          x1="4"
          y1="3"
          x2="20"
          y2="21"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="48%" stopColor="#ECEEF2" />
          <stop offset="100%" stopColor="#B8BCC6" />
        </linearGradient>
        <linearGradient
          id={lightGradId}
          x1="4"
          y1="3"
          x2="20"
          y2="21"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#334155" />
          <stop offset="55%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>
      {isDarkOnly ? (
        <path
          d="M11.12 3.38a1.35 1.35 0 0 1 1.76 0l8.2 7.12c.62.54.24 1.56-.58 1.56H19v7.14c0 .99-.81 1.8-1.8 1.8h-3.15a.65.65 0 0 1-.65-.65v-4.25a.9.9 0 0 0-.9-.9h-1a.9.9 0 0 0-.9.9v4.25a.65.65 0 0 1-.65.65H6.8c-.99 0-1.8-.81-1.8-1.8v-7.14H3.5c-.82 0-1.2-1.02-.58-1.56l8.2-7.12Z"
          fill={`url(#${darkGradId})`}
        />
      ) : isLightOnly ? (
        <path
          d="M11.12 3.38a1.35 1.35 0 0 1 1.76 0l8.2 7.12c.62.54.24 1.56-.58 1.56H19v7.14c0 .99-.81 1.8-1.8 1.8h-3.15a.65.65 0 0 1-.65-.65v-4.25a.9.9 0 0 0-.9-.9h-1a.9.9 0 0 0-.9.9v4.25a.65.65 0 0 1-.65.65H6.8c-.99 0-1.8-.81-1.8-1.8v-7.14H3.5c-.82 0-1.2-1.02-.58-1.56l8.2-7.12Z"
          fill={`url(#${lightGradId})`}
        />
      ) : (
        <>
          <path
            d="M11.12 3.38a1.35 1.35 0 0 1 1.76 0l8.2 7.12c.62.54.24 1.56-.58 1.56H19v7.14c0 .99-.81 1.8-1.8 1.8h-3.15a.65.65 0 0 1-.65-.65v-4.25a.9.9 0 0 0-.9-.9h-1a.9.9 0 0 0-.9.9v4.25a.65.65 0 0 1-.65.65H6.8c-.99 0-1.8-.81-1.8-1.8v-7.14H3.5c-.82 0-1.2-1.02-.58-1.56l8.2-7.12Z"
            fill={`url(#${lightGradId})`}
            className="dark:hidden"
          />
          <path
            d="M11.12 3.38a1.35 1.35 0 0 1 1.76 0l8.2 7.12c.62.54.24 1.56-.58 1.56H19v7.14c0 .99-.81 1.8-1.8 1.8h-3.15a.65.65 0 0 1-.65-.65v-4.25a.9.9 0 0 0-.9-.9h-1a.9.9 0 0 0-.9.9v4.25a.65.65 0 0 1-.65.65H6.8c-.99 0-1.8-.81-1.8-1.8v-7.14H3.5c-.82 0-1.2-1.02-.58-1.56l8.2-7.12Z"
            fill={`url(#${darkGradId})`}
            className="hidden dark:block"
          />
        </>
      )}
    </svg>
  );
}

export const LiquidHomeButton = React.forwardRef<
  HTMLButtonElement,
  LiquidHomeButtonProps
>(function LiquidHomeButton(
  {
    label = "Home",
    size = "md",
    orbitDuration = 5,
    glowIntensity = 1,
    theme = "auto",
    icon,
    animate = true,
    active = false,
    disabled = false,
    className,
    type = "button",
    onMouseEnter,
    onMouseLeave,
    ...props
  },
  ref
) {
  const rawId = useId();
  const uid = rawId.replace(/:/g, "");
  const prefersReducedMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  const safeSize: LiquidHomeButtonSize =
    size === "sm" || size === "md" || size === "lg" ? size : "md";
  const safeTheme: LiquidHomeButtonTheme =
    theme === "auto" || theme === "dark" || theme === "light" ? theme : "auto";
  const safeDuration =
    typeof orbitDuration === "number" && Number.isFinite(orbitDuration)
      ? Math.min(20, Math.max(1.2, orbitDuration))
      : 5;
  const safeGlow =
    typeof glowIntensity === "number" && Number.isFinite(glowIntensity)
      ? Math.min(1.5, Math.max(0, glowIntensity))
      : 1;

  const dims = SIZE_CONFIG[safeSize];
  const shouldOrbit = animate && !prefersReducedMotion && !disabled;
  const isDarkOnly = safeTheme === "dark";
  const isLightOnly = safeTheme === "light";

  const outerShellClasses = isDarkOnly
    ? cn(
        "bg-[#141416] shadow-[0_14px_34px_-10px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(255,255,255,0.03)]",
        active ? "border-white/25" : "border-white/[0.11]"
      )
    : isLightOnly
      ? cn(
          "bg-white/85 shadow-[0_12px_28px_-10px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(15,23,42,0.05)]",
          active ? "border-slate-900/25" : "border-slate-900/[0.11]"
        )
      : cn(
          "bg-white/85 dark:bg-[#141416] shadow-[0_12px_28px_-10px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(15,23,42,0.05)] dark:shadow-[0_14px_34px_-10px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(255,255,255,0.03)]",
          active
            ? "border-slate-900/25 dark:border-white/25"
            : "border-slate-900/[0.11] dark:border-white/[0.11]"
        );

  const innerBezelClasses = isDarkOnly
    ? "bg-gradient-to-b from-[#212022] via-[#1a1a1c] to-[#151517] border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.09),inset_0_-1px_2px_rgba(0,0,0,0.65)]"
    : isLightOnly
      ? "bg-gradient-to-b from-[#fafbfc] via-[#f1f4f8] to-[#e6ebf2] border-slate-900/[0.07] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),inset_0_-1px_2px_rgba(15,23,42,0.06)]"
      : "bg-gradient-to-b from-[#fafbfc] via-[#f1f4f8] to-[#e6ebf2] dark:from-[#212022] dark:via-[#1a1a1c] dark:to-[#151517] border-slate-900/[0.07] dark:border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),inset_0_-1px_2px_rgba(15,23,42,0.06)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.09),inset_0_-1px_2px_rgba(0,0,0,0.65)]";

  const innerDiscClasses = isDarkOnly
    ? "bg-gradient-to-b from-[#343439] via-[#27272b] to-[#1f1f23] border-white/[0.16] shadow-[inset_0_1px_2px_rgba(255,255,255,0.22),inset_0_-3px_6px_rgba(0,0,0,0.7)]"
    : isLightOnly
      ? "bg-gradient-to-b from-[#ffffff] via-[#eef2f6] to-[#dde3ec] border-white/90 shadow-[inset_0_1px_2px_rgba(255,255,255,1),inset_0_-2px_5px_rgba(15,23,42,0.12)]"
      : "bg-gradient-to-b from-[#ffffff] via-[#eef2f6] to-[#dde3ec] dark:from-[#343439] dark:via-[#27272b] dark:to-[#1f1f23] border-white/90 dark:border-white/[0.16] shadow-[inset_0_1px_2px_rgba(255,255,255,1),inset_0_-2px_5px_rgba(15,23,42,0.12)] dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.22),inset_0_-3px_6px_rgba(0,0,0,0.7)]";

  const labelColorClasses = isDarkOnly
    ? "text-[#F5F5F7]"
    : isLightOnly
      ? "text-slate-900"
      : "text-slate-900 dark:text-[#F5F5F7]";

  const effectiveGlowOpacity = Math.min(
    1,
    safeGlow * (isHovered ? 0.92 : active ? 0.85 : 0.72)
  );

  const orbitTransition = shouldOrbit
    ? {
        duration: safeDuration,
        repeat: Infinity,
        ease: "linear" as const,
      }
    : undefined;

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-pressed={active || undefined}
      onMouseEnter={(e) => {
        setIsHovered(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        onMouseLeave?.(e);
      }}
      whileHover={
        disabled || prefersReducedMotion
          ? undefined
          : { y: -1, transition: { type: "spring", stiffness: 420, damping: 28 } }
      }
      whileTap={
        disabled || prefersReducedMotion
          ? undefined
          : { scale: 0.975, transition: { type: "spring", stiffness: 500, damping: 30 } }
      }
      className={cn(
        "group/liquid-btn relative inline-flex select-none items-center rounded-full border backdrop-blur-xl transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/75 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer",
        dims.pill,
        dims.gap,
        outerShellClasses,
        className
      )}
      style={{
        fontFamily:
          '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      }}
      {...props}
    >
      {/* Inner recessed double-bezel glass housing */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute rounded-full border transition-opacity duration-300",
          dims.innerBezel,
          innerBezelClasses
        )}
      />

      {/* Crisp top-edge glass specular highlight across the pill */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-8 top-[1px] h-[1px] rounded-full bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-80"
      />

      {/* Circular Liquid Chromatic Prism Medallion */}
      <span
        className={cn(
          "relative z-10 flex shrink-0 items-center justify-center rounded-full",
          dims.orb
        )}
      >
        {/* Layer 1: Ambient Caustic Halo Spill */}
        {safeGlow > 0 && (
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-2.5 rounded-full will-change-transform"
            animate={shouldOrbit ? { rotate: 360 } : { rotate: 35 }}
            transition={orbitTransition}
            style={{
              opacity: effectiveGlowOpacity * 0.65,
              filter: "blur(10px)",
              background:
                "conic-gradient(from 0deg, transparent 0deg, rgba(56,189,248,0.45) 28deg, rgba(255,255,255,0.82) 52deg, rgba(251,146,60,0.52) 78deg, transparent 115deg, transparent 195deg, rgba(96,165,250,0.42) 225deg, rgba(255,255,255,0.65) 248deg, rgba(249,115,22,0.45) 275deg, transparent 315deg)",
            }}
          />
        )}

        {/* Layer 2: Obsidian Liquid-Glass Ring Channel */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-full bg-[#060609] shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_4px_14px_rgba(0,0,0,0.65)]"
        >
          {/* Layer 2A: Primary Chromatic Dispersion Conic Spectrum */}
          <motion.span
            className="absolute -inset-[12%] rounded-full will-change-transform"
            animate={shouldOrbit ? { rotate: 360 } : { rotate: 35 }}
            transition={orbitTransition}
            style={{
              opacity: Math.min(1, 0.78 + safeGlow * 0.22),
              background:
                "conic-gradient(from 0deg, #050508 0deg, #0a1432 20deg, #1d4ed8 32deg, #38bdf8 42deg, #ffffff 52deg, #fef08a 62deg, #f97316 74deg, #b91c1c 86deg, #07070c 106deg, #050508 178deg, #0c1838 198deg, #2563eb 212deg, #67e8f9 226deg, #ffffff 240deg, #fde047 254deg, #ea580c 268deg, #9a3412 282deg, #060609 304deg, #050508 360deg)",
            }}
          />

          {/* Layer 2B: Offset RGB Chromatic Aberration Fringe */}
          <motion.span
            className="absolute -inset-[12%] rounded-full mix-blend-screen will-change-transform"
            animate={shouldOrbit ? { rotate: 360 } : { rotate: 35 }}
            transition={orbitTransition}
            style={{
              opacity: Math.min(1, 0.55 + safeGlow * 0.35),
              filter: "blur(1.5px)",
              background:
                "conic-gradient(from 10deg, transparent 0deg, #22d3ee 36deg, #ffffff 50deg, #fb923c 66deg, #ef4444 82deg, transparent 102deg, transparent 196deg, #3b82f6 218deg, #ffffff 238deg, #f59e0b 256deg, transparent 288deg)",
            }}
          />

          {/* Layer 2C: Blazing White-Hot Specular Caustic Core */}
          <motion.span
            className="absolute -inset-[8%] rounded-full will-change-transform"
            animate={shouldOrbit ? { rotate: 360 } : { rotate: 35 }}
            transition={orbitTransition}
            style={{
              opacity: Math.min(1, 0.7 + safeGlow * 0.3),
              background:
                "conic-gradient(from 0deg, transparent 0deg, transparent 42deg, rgba(255,255,255,0.98) 51deg, rgba(255,255,255,0.92) 56deg, transparent 66deg, transparent 228deg, rgba(255,255,255,0.9) 239deg, transparent 250deg, transparent 360deg)",
            }}
          />

          {/* Layer 2D: Micro-Fluted Optical Crystal Striations */}
          <span
            className="absolute inset-0 rounded-full opacity-35 mix-blend-overlay"
            style={{
              background:
                "repeating-conic-gradient(from 0deg, rgba(255,255,255,0.55) 0deg 1.2deg, transparent 1.2deg 3.6deg)",
            }}
          />
        </span>

        {/* Layer 3: Inner Smoked-Glass Disc */}
        <span
          className={cn(
            "absolute z-10 flex items-center justify-center overflow-hidden rounded-full border",
            dims.ringInset,
            innerDiscClasses
          )}
        >
          {/* Synchronized Directional Internal Light Bleed */}
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-1 rounded-full will-change-transform"
            animate={shouldOrbit ? { rotate: 360 } : { rotate: 35 }}
            transition={orbitTransition}
            style={{
              opacity: Math.min(0.45, 0.18 + safeGlow * 0.2),
              background:
                "conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.35) 45deg, rgba(254,240,138,0.22) 60deg, transparent 95deg, transparent 215deg, rgba(125,211,252,0.25) 240deg, transparent 275deg)",
              filter: "blur(4px)",
            }}
          />

          {/* Brushed-Silver Home Icon (or developer-supplied icon) */}
          <span className="relative z-10 flex items-center justify-center">
            {icon ? (
              <span
                className={cn(
                  "flex items-center justify-center",
                  isDarkOnly
                    ? "text-white"
                    : isLightOnly
                      ? "text-slate-900"
                      : "text-slate-900 dark:text-white",
                  dims.iconBox
                )}
              >
                {icon}
              </span>
            ) : (
              <DefaultHomeGlyph
                uid={uid}
                isDarkOnly={isDarkOnly}
                isLightOnly={isLightOnly}
                className={dims.iconBox}
              />
            )}
          </span>
        </span>
      </span>

      {/* Label Text */}
      {label ? (
        <span
          className={cn(
            "relative z-10 font-medium leading-none transition-colors duration-200",
            dims.label,
            labelColorClasses
          )}
        >
          {label}
        </span>
      ) : null}
    </motion.button>
  );
});

LiquidHomeButton.displayName = "LiquidHomeButton";

export { LiquidHomeButton as component, LiquidHomeButton as Component };
export default LiquidHomeButton;