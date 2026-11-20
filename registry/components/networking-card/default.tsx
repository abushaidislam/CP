"use client";

import React from "react";
import {
  SynapseCard,
  type SynapseCardTheme,
} from "@/components/ui/component";

const settings = {
  title: "SYNAPSE",
  description:
    "THE ARCHITECTURE OF LIVING CONNECTIONS. A QUIET SYSTEM THAT ADAPTS ITS STRUCTURE IN REAL TIME AS SIGNALS MOVE.",
  theme: "auto",
  autoPlay: true,
  speed: 1,
  soundEnabled: false,
};

const VALID_THEMES: ReadonlyArray<SynapseCardTheme> = [
  "auto",
  "dark",
  "light",
];

export default function SynapseCardDemo(
  props: Partial<typeof settings> = {}
) {
  const config = { ...settings, ...props };

  const theme: SynapseCardTheme = VALID_THEMES.includes(
    config.theme as SynapseCardTheme
  )
    ? (config.theme as SynapseCardTheme)
    : "auto";

  const speed =
    typeof config.speed === "number" && Number.isFinite(config.speed)
      ? Math.min(Math.max(config.speed, 0.2), 3)
      : 1;

  return (
    <div className="w-full min-h-[400px] flex items-center justify-center p-4 sm:p-8">
      <SynapseCard
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

export { SynapseCardDemo as Demo, SynapseCardDemo as demo };