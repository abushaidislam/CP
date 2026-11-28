"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppTheme } from "@/lib/hooks/use-app-theme";
import { cn } from "@/lib/utils";

export interface ThemeToggleProps {
  className?: string;
  iconClassName?: string;
}

/**
 * Half-moon geometric icon whose rotation persists smoothly across atomic theme swaps.
 */
function DarkSideIcon({
  isDark,
  className,
}: {
  isDark: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden="true"
      className={cn("size-4", className)}
    >
      <path
        data-theme-toggle-icon=""
        d="M16 .5C7.4.5.5 7.4.5 16S7.4 31.5 16 31.5 31.5 24.6 31.5 16 24.6.5 16 .5zm0 28.1V3.4C23 3.4 28.6 9 28.6 16S23 28.6 16 28.6z"
        className={cn(
          "origin-center motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[var(--expo-out)]",
          isDark ? "rotate-180" : "rotate-0"
        )}
      />
    </svg>
  );
}

/**
 * Header button that switches light/dark themes using View Transitions API.
 */
export function ThemeToggle({ className, iconClassName }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useAppTheme();
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          onClick={(e) => toggleTheme(e)}
          aria-label={label}
          className={cn(
            "studio-icon-btn size-8 rounded-none border-border/80 bg-card/70 text-muted-foreground hover:text-foreground",
            className
          )}
        >
          <DarkSideIcon isDark={isDark} className={iconClassName} />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="font-sans text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
