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
   * "tile" renders the icon on a crisp white framed tile that pops cleanly
   * in both dark and light mode headers. "mark" renders the transparent cutout.
   */
  variant?: "tile" | "mark";
  priority?: boolean;
  className?: string;
}

export function AppLogo({
  size = "md",
  variant = "tile",
  priority = false,
  className,
}: AppLogoProps) {
  const { px, boxClass } = SIZE_CONFIG[size];
  const src =
    variant === "mark" ? "/brand/logo-mark.png" : "/brand/app-icon-512.png";

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden select-none",
        boxClass,
        variant === "tile" &&
          "bg-white ring-1 ring-inset ring-black/10 dark:ring-white/15 shadow-2xs rounded-[4px]",
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
