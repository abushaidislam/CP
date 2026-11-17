"use client";

import React from "react";
import { SpatialCardCarousel } from "@/components/ui/component";

const settings = {
  theme: "light",
  autoPlay: true,
  interval: 2400,
  pauseOnHover: true,
};

type ThemeMode = "light" | "dark";

export default function SpatialCardCarouselDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const theme: ThemeMode = config.theme === "dark" ? "dark" : "light";

  const interval =
    typeof config.interval === "number" &&
    Number.isFinite(config.interval) &&
    config.interval >= 900
      ? Math.min(config.interval, 10000)
      : 2400;

  return (
    <div
      className={`flex min-h-[580px] w-full items-center justify-center p-4 sm:p-8 transition-colors duration-500 ${
        theme === "dark" ? "bg-[#0B0B0C]" : "bg-[#FFFFFF]"
      }`}
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