"use client";

import React from "react";
import { PinnedRoadmapCards } from "@/components/ui/component";

const settings = {
  theme: "auto",
  brandName: "skale",
  heading: "How to Build Trust on Your Website",
  showRuledLines: true,
  showConnectors: true,
  interactiveChecklist: true,
};

const VALID_THEMES = ["auto", "light", "dark"] as const;

export default function PinnedRoadmapCardsDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const theme = VALID_THEMES.includes(
    config.theme as (typeof VALID_THEMES)[number]
  )
    ? (config.theme as "auto" | "light" | "dark")
    : "auto";

  return (
    <div className="w-full flex items-center justify-center p-4 sm:p-8">
      <PinnedRoadmapCards
        theme={theme}
        brandName={config.brandName}
        heading={config.heading}
        showRuledLines={Boolean(config.showRuledLines)}
        showConnectors={Boolean(config.showConnectors)}
        interactiveChecklist={Boolean(config.interactiveChecklist)}
      />
    </div>
  );
}

export { PinnedRoadmapCardsDemo as Demo, PinnedRoadmapCardsDemo as demo };