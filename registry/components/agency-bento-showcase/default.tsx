"use client";

import React from "react";
import {
  AgencyBentoShowcase,
  type ShowcaseTheme,
} from "@/components/ui/component";

const settings = {
  brandName: "QlarK",
  studioSuffix: "Studio",
  theme: "dark",
  autoPlay: true,
  phraseInterval: 2000,
};

const VALID_THEMES: ShowcaseTheme[] = ["dark", "light"];

export default function AgencyBentoShowcaseDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const theme: ShowcaseTheme = VALID_THEMES.includes(
    config.theme as ShowcaseTheme
  )
    ? (config.theme as ShowcaseTheme)
    : "dark";

  const brandName =
    typeof config.brandName === "string" && config.brandName.trim().length > 0
      ? config.brandName.trim()
      : settings.brandName;

  const studioSuffix =
    typeof config.studioSuffix === "string"
      ? config.studioSuffix.trim()
      : settings.studioSuffix;

  const phraseInterval =
    typeof config.phraseInterval === "number" &&
    Number.isFinite(config.phraseInterval)
      ? Math.min(8000, Math.max(800, config.phraseInterval))
      : settings.phraseInterval;

  const autoPlay =
    typeof config.autoPlay === "boolean" ? config.autoPlay : settings.autoPlay;

  return (
    <div className="flex min-h-[540px] w-full items-center justify-center bg-background p-4 sm:p-8">
      <AgencyBentoShowcase
        brandName={brandName}
        studioSuffix={studioSuffix}
        theme={theme}
        autoPlay={autoPlay}
        phraseInterval={phraseInterval}
      />
    </div>
  );
}