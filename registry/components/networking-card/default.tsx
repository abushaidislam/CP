"use client";

import React from "react";
import {
  SynapseCard,
  type SynapseCardTheme,
} from "@/components/ui/component";

const settings = {
  title: "SYNAPSE",
  theme: "auto",
  autoPlay: true,
  speed: 1,
  dotDensity: 10,
  dotReach: 3.8,
  lineReach: 2.5,
  soundEnabled: false,
};

const VALID_THEMES: ReadonlyArray<SynapseCardTheme> = [
  "auto",
  "dark",
  "light",
];

function safeNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}

export default function SynapseCardDemo(
  props: Partial<typeof settings> = {}
) {
  const config = { ...settings, ...props };

  const theme: SynapseCardTheme = VALID_THEMES.includes(
    config.theme as SynapseCardTheme
  )
    ? (config.theme as SynapseCardTheme)
    : "auto";

  return (
    <div className="w-full min-h-[400px] flex items-center justify-center p-4 sm:p-8">
      <SynapseCard
        title={typeof config.title === "string" ? config.title : settings.title}
        theme={theme}
        autoPlay={Boolean(config.autoPlay)}
        speed={safeNumber(config.speed, 0.2, 3, 1)}
        dotDensity={safeNumber(config.dotDensity, 6, 18, 10)}
        dotReach={safeNumber(config.dotReach, 2, 8, 3.8)}
        lineReach={safeNumber(config.lineReach, 1.6, 5, 2.5)}
        soundEnabled={Boolean(config.soundEnabled)}
      />
    </div>
  );
}

export { SynapseCardDemo as Demo, SynapseCardDemo as demo };