import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const SIZE_CONFIG = {
  xs: { px: 20, boxClass: "size-5" },
  sm: { px: 24, boxClass: "size-6" },
  md: { px: 28, boxClass: "size-7" },
  lg: { px: 36, boxClass: "size-9" },
  xl: { px: 48, boxClass: "size-12" },
} as const;

export interface AppLogoProps {
  size?: keyof typeof SIZE_CONFIG;
  /**
   * "mark" renders the transparent brand mark cutout with natural shadows.
   * "tile" renders the icon on a framed tile with subtle depth.
   */
  variant?: "mark" | "tile";
  priority?: boolean;
  className?: string;
}

export function AppLogo({
  size = "md",
  variant = "mark",
  priority = false,
  className,
}: AppLogoProps) {
  const { px, boxClass } = SIZE_CONFIG[size];
  const src =
    variant === "tile" ? "/brand/app-icon-512.png" : "/brand/logo-mark.png";

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center select-none",
        boxClass,
        variant === "tile" &&
          "bg-zinc-900/80 dark:bg-zinc-900 ring-1 ring-inset ring-white/10 dark:ring-white/15 shadow-2xs rounded-[6px] overflow-hidden p-0.5",
        className
      )}
    >
      <Image
        src={src}
        alt="Component Studio"
        width={px * 2}
        height={px * 2}
        priority={priority}
        referrerPolicy="no-referrer"
        className="size-full object-contain"
      />
    </span>
  );
}
