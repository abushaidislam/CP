"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type TactileActionBarTheme = "auto" | "light" | "dark";

export interface TactileActionBarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Controlled active state of the tactile emerald toggle switch */
  enabled?: boolean;
  /** Uncontrolled initial state of the tactile toggle switch */
  defaultEnabled?: boolean;
  /** Callback fired when the toggle switch changes state */
  onEnabledChange?: (enabled: boolean) => void;
  /** Optional visible label placed before the toggle switch */
  toggleLabel?: string;
  /** Accessible label for the toggle switch */
  toggleAriaLabel?: string;
  /** Whether to display the tactile toggle switch */
  showToggle?: boolean;
  /** Secondary button label */
  secondaryLabel?: string;
  /** Temporary confirmation label shown after clicking the secondary button */
  secondaryConfirmedLabel?: string;
  /** Callback fired when the secondary button is clicked */
  onSecondaryClick?: () => void;
  /** Primary glossy violet button label */
  primaryLabel?: string;
  /** Label shown when the session/action is in the active joined state */
  primaryActiveLabel?: string;
  /** Controlled active/joined state for the primary button */
  joined?: boolean;
  /** Uncontrolled initial joined state */
  defaultJoined?: boolean;
  /** Callback fired when the primary button is clicked */
  onPrimaryClick?: (nextJoined: boolean) => void;
  /** Color theme mode ("auto" respects Tailwind dark mode) */
  theme?: TactileActionBarTheme;
  /** Disable all interactive controls */
  disabled?: boolean;
}

const SPRING_THUMB = {
  type: "spring" as const,
  stiffness: 520,
  damping: 36,
  mass: 0.85,
};

const SPRING_PRESS = {
  type: "spring" as const,
  stiffness: 600,
  damping: 38,
  mass: 0.7,
};

export const TactileActionBar = React.forwardRef<
  HTMLDivElement,
  TactileActionBarProps
>(
  (
    {
      enabled: controlledEnabled,
      defaultEnabled = true,
      onEnabledChange,
      toggleLabel = "",
      toggleAriaLabel = "Toggle availability",
      showToggle = true,
      secondaryLabel = "Invite",
      secondaryConfirmedLabel = "Copied",
      onSecondaryClick,
      primaryLabel = "Join now",
      primaryActiveLabel = "Joined",
      joined: controlledJoined,
      defaultJoined = false,
      onPrimaryClick,
      theme = "auto",
      disabled = false,
      className,
      ...rest
    },
    ref
  ) => {
    const rawId = useId();
    const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
    const prefersReducedMotion = useReducedMotion();

    const [internalEnabled, setInternalEnabled] = useState<boolean>(defaultEnabled);
    const isEnabled =
      controlledEnabled !== undefined ? controlledEnabled : internalEnabled;

    const [internalJoined, setInternalJoined] = useState<boolean>(defaultJoined);
    const isJoined =
      controlledJoined !== undefined ? controlledJoined : internalJoined;

    const [secondaryConfirmed, setSecondaryConfirmed] = useState(false);
    const [primarySheenKey, setPrimarySheenKey] = useState(0);
    const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      if (controlledEnabled === undefined) {
        setInternalEnabled(defaultEnabled);
      }
    }, [defaultEnabled, controlledEnabled]);

    useEffect(() => {
      if (controlledJoined === undefined) {
        setInternalJoined(defaultJoined);
      }
    }, [defaultJoined, controlledJoined]);

    useEffect(() => {
      return () => {
        if (confirmTimerRef.current) {
          clearTimeout(confirmTimerRef.current);
        }
      };
    }, []);

    const handleToggle = useCallback(() => {
      if (disabled) return;
      const next = !isEnabled;
      if (controlledEnabled === undefined) {
        setInternalEnabled(next);
      }
      onEnabledChange?.(next);
    }, [disabled, isEnabled, controlledEnabled, onEnabledChange]);

    const handleSecondary = useCallback(() => {
      if (disabled) return;
      onSecondaryClick?.();
      setSecondaryConfirmed(true);
      if (confirmTimerRef.current) {
        clearTimeout(confirmTimerRef.current);
      }
      confirmTimerRef.current = setTimeout(() => {
        setSecondaryConfirmed(false);
      }, 1700);
    }, [disabled, onSecondaryClick]);

    const handlePrimary = useCallback(() => {
      if (disabled) return;
      const next = !isJoined;
      if (controlledJoined === undefined) {
        setInternalJoined(next);
      }
      setPrimarySheenKey((k) => k + 1);
      onPrimaryClick?.(next);
    }, [disabled, isJoined, controlledJoined, onPrimaryClick]);

    const isForcedDark = theme === "dark";
    const isForcedLight = theme === "light";

    const labelColorClass = isForcedDark
      ? "text-zinc-200"
      : isForcedLight
      ? "text-[#242328]"
      : "text-[#242328] dark:text-zinc-200";

    const uncheckedTrackClass = isForcedDark
      ? "border-[#3f404a] [background:linear-gradient(180deg,#34353e_0%,#25262d_100%)] shadow-[inset_0_1.5px_2px_rgba(0,0,0,0.45),inset_0_-1px_1px_rgba(255,255,255,0.06)]"
      : isForcedLight
      ? "border-[#c4c5cf] [background:linear-gradient(180deg,#d7d8e0_0%,#c6c7d1_100%)] shadow-[inset_0_1.5px_2px_rgba(0,0,0,0.12),inset_0_-1px_1px_rgba(255,255,255,0.55)]"
      : "border-[#c4c5cf] [background:linear-gradient(180deg,#d7d8e0_0%,#c6c7d1_100%)] shadow-[inset_0_1.5px_2px_rgba(0,0,0,0.12),inset_0_-1px_1px_rgba(255,255,255,0.55)] dark:border-[#3f404a] dark:[background:linear-gradient(180deg,#34353e_0%,#25262d_100%)] dark:shadow-[inset_0_1.5px_2px_rgba(0,0,0,0.45),inset_0_-1px_1px_rgba(255,255,255,0.06)]";

    const secondaryButtonClass = isForcedDark
      ? "border-white/[0.12] text-zinc-100 [background:linear-gradient(180deg,#2a2a32_0%,#202027_100%)] shadow-[0_2px_6px_rgba(0,0,0,0.35),inset_0_1px_0.5px_rgba(255,255,255,0.12),inset_0_-1px_1.5px_rgba(0,0,0,0.28)] hover:border-white/[0.18] hover:[background:linear-gradient(180deg,#30303a_0%,#24242c_100%)]"
      : isForcedLight
      ? "border-[#e7e7ec] text-[#242328] [background:linear-gradient(180deg,#ffffff_0%,#fbfbfc_100%)] shadow-[0_2px_6px_rgba(17,17,24,0.045),0_1px_2px_rgba(17,17,24,0.03),inset_0_1px_0.5px_rgba(255,255,255,0.95),inset_0_-1px_1.5px_rgba(17,17,24,0.025)] hover:border-[#dcdce4] hover:[background:linear-gradient(180deg,#ffffff_0%,#f6f6f9_100%)]"
      : "border-[#e7e7ec] text-[#242328] [background:linear-gradient(180deg,#ffffff_0%,#fbfbfc_100%)] shadow-[0_2px_6px_rgba(17,17,24,0.045),0_1px_2px_rgba(17,17,24,0.03),inset_0_1px_0.5px_rgba(255,255,255,0.95),inset_0_-1px_1.5px_rgba(17,17,24,0.025)] hover:border-[#dcdce4] hover:[background:linear-gradient(180deg,#ffffff_0%,#f6f6f9_100%)] dark:border-white/[0.12] dark:text-zinc-100 dark:[background:linear-gradient(180deg,#2a2a32_0%,#202027_100%)] dark:shadow-[0_2px_6px_rgba(0,0,0,0.35),inset_0_1px_0.5px_rgba(255,255,255,0.12),inset_0_-1px_1.5px_rgba(0,0,0,0.28)] dark:hover:border-white/[0.18] dark:hover:[background:linear-gradient(180deg,#30303a_0%,#24242c_100%)]";

    return (
      <div
        ref={ref}
        role="group"
        aria-label="Session actions"
        className={cn(
          "inline-flex flex-wrap items-center gap-y-3 select-none font-sans antialiased",
          showToggle ? "gap-x-7" : "gap-x-3",
          disabled && "opacity-60 pointer-events-none",
          className
        )}
        {...rest}
      >
        {showToggle && (
          <div className="inline-flex items-center gap-3">
            {toggleLabel ? (
              <label
                htmlFor={`${safeId}-switch`}
                className={cn(
                  "text-[15px] font-medium tracking-[-0.015em] cursor-pointer",
                  labelColorClass
                )}
              >
                {toggleLabel}
              </label>
            ) : null}

            <button
              id={`${safeId}-switch`}
              type="button"
              role="switch"
              aria-checked={isEnabled}
              aria-label={toggleLabel || toggleAriaLabel}
              disabled={disabled}
              onClick={handleToggle}
              className={cn(
                "relative inline-flex h-[28px] w-[50px] shrink-0 cursor-pointer items-center rounded-full border p-[2px] transition-[background,border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8d51fe]/60 focus-visible:ring-offset-2",
                isEnabled
                  ? "border-[#238b59] [background:linear-gradient(180deg,#4dc993_0%,#37b27b_52%,#289d65_100%)] shadow-[inset_0_1.5px_1px_rgba(167,243,208,0.52),inset_0_-1.5px_2px_rgba(15,87,52,0.34),0_2px_5px_rgba(40,157,101,0.28)]"
                  : uncheckedTrackClass
              )}
            >
              <motion.span
                aria-hidden="true"
                initial={false}
                animate={{
                  x: isEnabled ? 22 : 0,
                }}
                transition={
                  prefersReducedMotion ? { duration: 0.01 } : SPRING_THUMB
                }
                className={cn(
                  "pointer-events-none block h-[22px] w-[22px] rounded-full transition-colors duration-200",
                  isEnabled
                    ? "[background:linear-gradient(180deg,#e4f7ef_0%,#c9eadb_100%)] shadow-[0_1.5px_3px_rgba(14,78,47,0.32),inset_0_1px_0.5px_rgba(255,255,255,0.88)]"
                    : "[background:linear-gradient(180deg,#ffffff_0%,#f1f2f6_100%)] shadow-[0_1.5px_3px_rgba(0,0,0,0.22),inset_0_1px_0.5px_rgba(255,255,255,0.95)]"
                )}
              />
            </button>
          </div>
        )}

        <div className="inline-flex items-center gap-3">
          {/* Secondary Tactile White Button */}
          <motion.button
            type="button"
            disabled={disabled}
            onClick={handleSecondary}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.975, y: 0.5 }}
            transition={SPRING_PRESS}
            className={cn(
              "relative inline-flex h-[48px] min-w-[92px] cursor-pointer items-center justify-center overflow-hidden rounded-[14px] border px-[22px] text-[15.5px] font-medium leading-none tracking-[-0.015em] transition-[background,border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8d51fe]/60 focus-visible:ring-offset-2",
              secondaryButtonClass
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              {secondaryConfirmed ? (
                <motion.span
                  key="confirmed"
                  initial={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : { opacity: 0, y: 6, filter: "blur(2px)" }
                  }
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: -6, filter: "blur(2px)" }
                  }
                  transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-flex items-center gap-1.5 text-[#289d65] dark:text-emerald-400"
                >
                  <Check className="h-4 w-4 stroke-[2.4]" aria-hidden="true" />
                  <span>{secondaryConfirmedLabel}</span>
                </motion.span>
              ) : (
                <motion.span
                  key="idle"
                  initial={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : { opacity: 0, y: -6, filter: "blur(2px)" }
                  }
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 6, filter: "blur(2px)" }
                  }
                  transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                >
                  {secondaryLabel}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Primary Glossy Violet Tactile Button */}
          <motion.button
            type="button"
            disabled={disabled}
            aria-pressed={isJoined}
            onClick={handlePrimary}
            onMouseEnter={() => {
              if (!prefersReducedMotion) {
                setPrimarySheenKey((k) => k + 1);
              }
            }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.975, y: 1 }}
            transition={SPRING_PRESS}
            className={cn(
              "group relative inline-flex h-[48px] min-w-[116px] cursor-pointer items-center justify-center overflow-hidden rounded-[14px] border px-6 text-[15.5px] font-medium leading-none tracking-[-0.015em] text-white transition-[filter,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8d51fe] focus-visible:ring-offset-2",
              "border-[#7345cf] [background:linear-gradient(180deg,#aa7bff_0%,#9861ff_24%,#8d51fe_64%,#8448f4_100%)]",
              "shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.42),inset_0_-2px_3px_rgba(79,32,178,0.36),0_3px_8px_rgba(128,67,245,0.28),0_1px_2px_rgba(88,35,194,0.18)]",
              "hover:brightness-[1.03] active:brightness-[0.97]",
              "[text-shadow:0_1px_1px_rgba(76,29,149,0.22)]"
            )}
          >
            {/* Subtle top glossy dome sheen matching reference */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-[1px] top-[1px] h-[44%] rounded-t-[13px] bg-gradient-to-b from-white/[0.22] to-transparent"
            />

            {/* Single event-driven specular reflection sweep on hover/click */}
            {!prefersReducedMotion && primarySheenKey > 0 && (
              <motion.span
                key={primarySheenKey}
                aria-hidden="true"
                initial={{ x: "-130%", opacity: 0 }}
                animate={{ x: "180%", opacity: [0, 0.32, 0] }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-none absolute inset-y-0 w-[45%] -skew-x-12 bg-gradient-to-r from-transparent via-white/70 to-transparent"
              />
            )}

            <AnimatePresence mode="wait" initial={false}>
              {isJoined ? (
                <motion.span
                  key="joined"
                  initial={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : { opacity: 0, y: 6, filter: "blur(2px)" }
                  }
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: -6, filter: "blur(2px)" }
                  }
                  transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  className="relative z-10 inline-flex items-center gap-2"
                >
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full bg-[#7ef0b8] shadow-[0_0_6px_rgba(126,240,184,0.85)]"
                  />
                  <span>{primaryActiveLabel}</span>
                </motion.span>
              ) : (
                <motion.span
                  key="join"
                  initial={
                    prefersReducedMotion
                      ? { opacity: 1 }
                      : { opacity: 0, y: -6, filter: "blur(2px)" }
                  }
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 6, filter: "blur(2px)" }
                  }
                  transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  className="relative z-10"
                >
                  {primaryLabel}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    );
  }
);

TactileActionBar.displayName = "TactileActionBar";

export { TactileActionBar as component, TactileActionBar as Component };
export default TactileActionBar;