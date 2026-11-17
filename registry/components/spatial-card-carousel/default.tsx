"use client";

import React from "react";
import {
  SpatialCardCarousel,
  type SpatialCarouselTheme,
} from "@/components/ui/component";

const settings = {
  theme: "auto",
  autoPlay: true,
  interval: 2400,
  pauseOnHover: true,
};

const VALID_THEMES: SpatialCarouselTheme[] = ["auto", "light", "dark"];

export default function SpatialCardCarouselDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const theme: SpatialCarouselTheme = VALID_THEMES.includes(
    config.theme as SpatialCarouselTheme
  )
    ? (config.theme as SpatialCarouselTheme)
    : "auto";

  const interval =
    typeof config.interval === "number" &&
    Number.isFinite(config.interval) &&
    config.interval >= 900
      ? Math.min(config.interval, 10000)
      : 2400;

  const wrapperThemeClass =
    theme === "dark"
      ? "bg-[#0B0B0C]"
      : theme === "light"
        ? "bg-[#FFFFFF]"
        : "bg-[#FFFFFF] dark:bg-[#0B0B0C]";

  return (
    <div
      className={`flex min-h-[580px] w-full items-center justify-center p-4 sm:p-8 transition-colors duration-500 ${wrapperThemeClass}`}
    >
      <div className="w-full max-w-5xl">
        <SpatialCardCarousel
          theme={theme}
          autoPlay={Boolean(config.autoPlay)}
          interval={interval}
          pauseOnHover={Boolean(config.pauseOnHover)}
        />
      </div>
    </div>
  );
}