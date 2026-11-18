"use client";

import React from "react";
import {
  TEXT_SCROLL_PRESETS,
  TextScrollReveal,
  type TextScrollPreset,
  type TextScrollTheme,
} from "@/components/ui/component";

const settings = {
  theme: "auto",
  preset: "blur-reveal",
  accentColor: "#E04A14",
  dimOpacity: 0.16,
  showAllPresets: true,
};

const VALID_THEMES: TextScrollTheme[] = ["auto", "light", "dark"];
const VALID_PRESETS: TextScrollPreset[] = [
  "blur-reveal",
  "fade-in",
  "change-color",
  "scale-reveal",
  "random-stagger",
  "random-scale",
  "overscale",
  "slide",
];

export default function TextScrollRevealDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const theme: TextScrollTheme = VALID_THEMES.includes(
    config.theme as TextScrollTheme
  )
    ? (config.theme as TextScrollTheme)
    : "auto";

  const preset: TextScrollPreset = VALID_PRESETS.includes(
    config.preset as TextScrollPreset
  )
    ? (config.preset as TextScrollPreset)
    : "blur-reveal";

  const rawDim = Number(config.dimOpacity);
  const dimOpacity = Number.isFinite(rawDim)
    ? Math.max(0.05, Math.min(0.85, rawDim))
    : settings.dimOpacity;

  const accentColor =
    typeof config.accentColor === "string" && config.accentColor.trim()
      ? config.accentColor
      : settings.accentColor;

  const showAll = Boolean(config.showAllPresets);

  return (
    <div className="w-full">
      <div className="mx-auto max-w-[1100px] px-4 pt-20 pb-8 text-center">
        <p className="text-xs font-medium tracking-widest uppercase opacity-50">
          Scroll down to preview ↓
        </p>
      </div>

      {showAll ? (
        <div className="mx-auto max-w-[1100px] divide-y divide-black/10 dark:divide-white/10">
          {TEXT_SCROLL_PRESETS.map((item) => (
            <TextScrollReveal
              key={item.id}
              label={item.label}
              preset={item.id}
              theme={theme}
              accentColor={accentColor}
              dimOpacity={dimOpacity}
            />
          ))}
        </div>
      ) : (
        <div className="py-24">
          <TextScrollReveal
            label={
              TEXT_SCROLL_PRESETS.find((p) => p.id === preset)?.label ??
              "001 Blur Reveal"
            }
            preset={preset}
            theme={theme}
            accentColor={accentColor}
            dimOpacity={dimOpacity}
          />
        </div>
      )}

      <div className="h-[35vh]" aria-hidden="true" />
    </div>
  );
}