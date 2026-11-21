"use client";

import React from "react";
import { RetainerSolutionShowcase } from "@/components/ui/component";

const settings = {
  eyebrow: "SOLUTION",
  heading: "Offer your clients a better retainer\nexperience, scale your agency",
  hubLabel: "retainable",
  animateBeams: true,
  theme: "auto",
};

const VALID_THEMES = ["auto", "light", "dark"] as const;
type ThemeOption = (typeof VALID_THEMES)[number];

export default function RetainerSolutionShowcaseDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const theme: ThemeOption = VALID_THEMES.includes(config.theme as ThemeOption)
    ? (config.theme as ThemeOption)
    : "auto";

  return (
    <div className="w-full min-h-[400px] flex items-center justify-center p-4 sm:p-6">
      <RetainerSolutionShowcase
        eyebrow={config.eyebrow}
        heading={config.heading}
        hubLabel={config.hubLabel}
        animateBeams={Boolean(config.animateBeams)}
        theme={theme}
      />
    </div>
  );
}

export {
  RetainerSolutionShowcaseDemo as Demo,
  RetainerSolutionShowcaseDemo as demo,
};