"use client";

import React from "react";
import {
  NetworkingCard,
  type NetworkingCardTheme,
} from "@/components/ui/component";

const settings = {
  title: "NETWORKING",
  description:
    "NETWORKING IS THE ART OF BUILDING CONNECTIONS THAT MOVE YOU FORWARD. IT'S THE BRIDGE BETWEEN WHERE YOU ARE AND WHERE YOU WANT TO GO.",
  theme: "auto",
  autoPlay: true,
  speed: 1,
  soundEnabled: false,
};

const VALID_THEMES: ReadonlyArray<NetworkingCardTheme> = [
  "auto",
  "dark",
  "light",
];

export default function NetworkingCardDemo(
  props: Partial<typeof settings> = {}
) {
  const config = { ...settings, ...props };

  const theme: NetworkingCardTheme = VALID_THEMES.includes(
    config.theme as NetworkingCardTheme
  )
    ? (config.theme as NetworkingCardTheme)
    : "auto";

  const speed =
    typeof config.speed === "number" && Number.isFinite(config.speed)
      ? Math.min(Math.max(config.speed, 0.2), 3)
      : 1;

  return (
    <div className="w-full min-h-[400px] flex items-center justify-center p-4 sm:p-8">
      <NetworkingCard
        title={typeof config.title === "string" ? config.title : settings.title}
        description={
          typeof config.description === "string"
            ? config.description
            : settings.description
        }
        theme={theme}
        autoPlay={Boolean(config.autoPlay)}
        speed={speed}
        soundEnabled={Boolean(config.soundEnabled)}
      />
    </div>
  );
}

export { NetworkingCardDemo as Demo, NetworkingCardDemo as demo };