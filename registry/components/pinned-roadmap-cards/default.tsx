"use client";

import React from "react";
import { PinnedRoadmapCards } from "@/components/ui/component";

const settings = {
  theme: "auto",
  textureIntensity: "medium",
  brandName: "skale",
  heading: "How to Build Trust on Your Website",
  cardCount: 7,
  showRuledLines: true,
  showConnectors: true,
  interactiveChecklist: true,
  allowAddNote: true,
};

type DemoProps = Partial<typeof settings>;

export function Demo(props: DemoProps) {
  const config = { ...settings, ...props };

  const theme =
    config.theme === "light" || config.theme === "dark"
      ? config.theme
      : "auto";

  const textureIntensity =
    config.textureIntensity === "subtle" || config.textureIntensity === "rich"
      ? config.textureIntensity
      : "medium";

  const cardCount =
    typeof config.cardCount === "number" && Number.isFinite(config.cardCount)
      ? Math.max(1, Math.min(7, Math.round(config.cardCount)))
      : 7;

  return (
    <div className="flex w-full items-center justify-center p-4 sm:p-8">
      <PinnedRoadmapCards
        theme={theme}
        textureIntensity={textureIntensity}
        brandName={String(config.brandName)}
        heading={String(config.heading)}
        cardCount={cardCount}
        showRuledLines={Boolean(config.showRuledLines)}
        showConnectors={Boolean(config.showConnectors)}
        interactiveChecklist={Boolean(config.interactiveChecklist)}
        allowAddNote={Boolean(config.allowAddNote)}
      />
    </div>
  );
}

export { Demo as demo };
export default Demo;
