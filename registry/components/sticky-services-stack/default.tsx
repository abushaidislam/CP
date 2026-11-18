"use client";

import React from "react";
import {
  StickyServicesStack,
  type StickyServicesTheme,
} from "@/components/ui/component";

const settings = {
  theme: "auto",
  sectionLabel: "(Services)",
  sectionIntro: "From core brand foundations to cross-functional moments.",
  ctaLabel: "Let's work together",
  enableStackDimming: true,
  animatePreviews: true,
};

const VALID_THEMES: StickyServicesTheme[] = ["auto", "light", "dark"];

export default function StickyServicesStackDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const theme: StickyServicesTheme = VALID_THEMES.includes(
    config.theme as StickyServicesTheme
  )
    ? (config.theme as StickyServicesTheme)
    : "auto";

  const sectionLabel =
    typeof config.sectionLabel === "string" && config.sectionLabel.trim()
      ? config.sectionLabel
      : settings.sectionLabel;

  const sectionIntro =
    typeof config.sectionIntro === "string" && config.sectionIntro.trim()
      ? config.sectionIntro
      : settings.sectionIntro;

  const ctaLabel =
    typeof config.ctaLabel === "string" ? config.ctaLabel : settings.ctaLabel;

  return (
    <div className="w-full min-h-[400px]">
      <StickyServicesStack
        theme={theme}
        sectionLabel={sectionLabel}
        sectionIntro={sectionIntro}
        ctaLabel={ctaLabel}
        enableStackDimming={Boolean(config.enableStackDimming)}
        animatePreviews={Boolean(config.animatePreviews)}
      />
    </div>
  );
}