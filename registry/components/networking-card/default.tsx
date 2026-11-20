"use client";

import React from "react";
import {
  SynapseMeshCard,
  type SynapseMeshAccent,
  type SynapseMeshTheme,
} from "@/components/ui/component";

const settings = {
  title: "SYNAPSE MESH",
  theme: "auto",
  accent: "emerald",
  autoPlay: true,
  speed: 1,
  soundEnabled: false,
};

const VALID_THEMES: ReadonlyArray<SynapseMeshTheme> = [
  "auto",
  "dark",
  "light",
];

const VALID_ACCENTS: ReadonlyArray<SynapseMeshAccent> = [
  "mono",
  "emerald",
  "cyan",
  "amber",
  "violet",
];

export default function SynapseMeshCardDemo(
  props: Partial<typeof settings> = {}
) {
  const config = { ...settings, ...props };

  const theme: SynapseMeshTheme = VALID_THEMES.includes(
    config.theme as SynapseMeshTheme
  )
    ? (config.theme as SynapseMeshTheme)
    : "auto";

  const accent: SynapseMeshAccent = VALID_ACCENTS.includes(
    config.accent as SynapseMeshAccent
  )
    ? (config.accent as SynapseMeshAccent)
    : "emerald";

  const speed =
    typeof config.speed === "number" && Number.isFinite(config.speed)
      ? Math.min(Math.max(config.speed, 0.2), 3)
      : 1;

  return (
    <div className="w-full min-h-[420px] flex items-center justify-center p-4 sm:p-8">
      <SynapseMeshCard
        title={typeof config.title === "string" ? config.title : settings.title}
        theme={theme}
        accent={accent}
        autoPlay={Boolean(config.autoPlay)}
        speed={speed}
        soundEnabled={Boolean(config.soundEnabled)}
      />
    </div>
  );
}

export { SynapseMeshCardDemo as Demo, SynapseMeshCardDemo as demo };