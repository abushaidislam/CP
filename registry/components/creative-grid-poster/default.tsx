"use client";

import React from "react";
import {
  CreativeGridPoster,
  type CreativeGridTheme,
} from "@/components/ui/component";

const settings = {
  theme: "auto",
  eyebrow: "(Manifesto)",
  sectionTitle: "On Craft, Invention & Human Agency",
  ctaLabel: "Start building",
  showInspector: true,
  animateEntrance: true,
};

const VALID_THEMES: CreativeGridTheme[] = ["auto", "light", "dark"];

export default function CreativeGridPosterDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const theme: CreativeGridTheme = VALID_THEMES.includes(
    config.theme as CreativeGridTheme
  )
    ? (config.theme as CreativeGridTheme)
    : "auto";

  const eyebrow =
    typeof config.eyebrow === "string" && config.eyebrow.trim()
      ? config.eyebrow
      : settings.eyebrow;

  const sectionTitle =
    typeof config.sectionTitle === "string" && config.sectionTitle.trim()
      ? config.sectionTitle
      : settings.sectionTitle;

  const ctaLabel =
    typeof config.ctaLabel === "string" ? config.ctaLabel : settings.ctaLabel;

  return (
    <div className="w-full min-h-[400px]">
      <CreativeGridPoster
        theme={theme}
        eyebrow={eyebrow}
        sectionTitle={sectionTitle}
        ctaLabel={ctaLabel}
        showInspector={Boolean(config.showInspector)}
        animateEntrance={Boolean(config.animateEntrance)}
      />
    </div>
  );
}