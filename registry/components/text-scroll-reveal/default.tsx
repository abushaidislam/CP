"use client";

import React from "react";
import {
  TextScrollReveal,
  type TextRevealEffect,
  type TextRevealMode,
  type TextRevealTrigger,
  type TextScrollRevealTheme,
} from "@/components/ui/component";

const settings = {
  theme: "auto",
  mode: "word",
  effect: "mask",
  trigger: "scroll",
  dimOpacity: 0.15,
  once: false,
};

const VALID_THEMES: TextScrollRevealTheme[] = ["auto", "light", "dark"];
const VALID_MODES: TextRevealMode[] = ["line", "word", "character"];
const VALID_EFFECTS: TextRevealEffect[] = ["mask", "blur", "fade-up", "scale"];
const VALID_TRIGGERS: TextRevealTrigger[] = ["scroll", "in-view"];

export default function TextScrollRevealDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const theme: TextScrollRevealTheme = VALID_THEMES.includes(
    config.theme as TextScrollRevealTheme
  )
    ? (config.theme as TextScrollRevealTheme)
    : "auto";

  const mode: TextRevealMode = VALID_MODES.includes(
    config.mode as TextRevealMode
  )
    ? (config.mode as TextRevealMode)
    : "word";

  const effect: TextRevealEffect = VALID_EFFECTS.includes(
    config.effect as TextRevealEffect
  )
    ? (config.effect as TextRevealEffect)
    : "mask";

  const trigger: TextRevealTrigger = VALID_TRIGGERS.includes(
    config.trigger as TextRevealTrigger
  )
    ? (config.trigger as TextRevealTrigger)
    : "scroll";

  const rawDim = Number(config.dimOpacity);
  const dimOpacity = Number.isFinite(rawDim)
    ? Math.max(0, Math.min(0.95, rawDim))
    : settings.dimOpacity;

  return (
    <div className="w-full px-6 sm:px-10">
      <div className="mx-auto flex max-w-4xl flex-col py-28 sm:py-36">
        <p className="mb-10 text-xs font-medium tracking-widest uppercase opacity-50">
          Scroll down to reveal ↓
        </p>

        <TextScrollReveal
          theme={theme}
          mode={mode}
          effect={effect}
          trigger={trigger}
          dimOpacity={dimOpacity}
          once={Boolean(config.once)}
        />

        <div className="h-[45vh]" aria-hidden="true" />
      </div>
    </div>
  );
}