"use client";

import React from "react";
import {
  ReactiveGradientCharacter,
  type ReactiveCharacterPalette,
} from "@/components/ui/component";

const settings = {
  phrases: "HELLO, HOW, ARE, YOU",
  palette: "crimson",
  autoPlay: true,
  interactive: true,
  speed: 1,
};

const VALID_PALETTES: ReactiveCharacterPalette[] = [
  "crimson",
  "midnight",
  "emerald",
  "violet",
  "obsidian",
];

export default function ReactiveGradientCharacterDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const palette: ReactiveCharacterPalette = VALID_PALETTES.includes(
    config.palette as ReactiveCharacterPalette
  )
    ? (config.palette as ReactiveCharacterPalette)
    : "crimson";

  const speed =
    typeof config.speed === "number" && Number.isFinite(config.speed)
      ? Math.min(2, Math.max(0.5, config.speed))
      : 1;

  const phrases =
    typeof config.phrases === "string" ? config.phrases : settings.phrases;

  return (
    <div className="w-full min-h-[520px] flex items-center justify-center p-6 sm:p-8">
      <ReactiveGradientCharacter
        phrases={phrases}
        palette={palette}
        autoPlay={Boolean(config.autoPlay)}
        interactive={Boolean(config.interactive)}
        speed={speed}
      />
    </div>
  );
}

export {
  ReactiveGradientCharacterDemo as Demo,
  ReactiveGradientCharacterDemo as demo,
};