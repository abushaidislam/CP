"use client";

import React from "react";
import { CaseStudyCarousel } from "@/components/ui/component";

const settings = {
  theme: "light",
  autoPlay: false,
  autoPlayInterval: 5000,
  showMetrics: true,
  showArrows: true,
  showDots: true,
};

type ThemeOption = "light" | "dark";

const VALID_THEMES: ThemeOption[] = ["light", "dark"];

export default function CaseStudyCarouselDemo(
  props: Partial<typeof settings>
) {
  const config = {
    ...settings,
    ...props,
  };

  const theme: ThemeOption = VALID_THEMES.includes(config.theme as ThemeOption)
    ? (config.theme as ThemeOption)
    : "light";

  const autoPlay = Boolean(config.autoPlay);
  const autoPlayInterval =
    typeof config.autoPlayInterval === "number" &&
    Number.isFinite(config.autoPlayInterval)
      ? Math.max(1500, Math.min(15000, config.autoPlayInterval))
      : 5000;

  const showMetrics = Boolean(config.showMetrics);
  const showArrows = Boolean(config.showArrows);
  const showDots = Boolean(config.showDots);

  return (
    <div className="w-full min-h-[600px] flex items-center justify-center p-4 sm:p-8 bg-background">
      <CaseStudyCarousel
        theme={theme}
        autoPlay={autoPlay}
        autoPlayInterval={autoPlayInterval}
        showMetrics={showMetrics}
        showArrows={showArrows}
        showDots={showDots}
      />
    </div>
  );
}