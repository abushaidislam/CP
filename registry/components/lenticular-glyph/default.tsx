"use client";

import React from "react";
import { LenticularGlyph } from "@/components/ui/component";
import type { LenticularGlyphTheme } from "@/components/ui/component";

const settings = {
  text: "G",
  speed: 1,
  autoPlay: true,
  interactive: true,
  theme: "auto",
};

const VALID_THEMES: ReadonlyArray<LenticularGlyphTheme> = [
  "auto",
  "dark",
  "light",
];

export default function LenticularGlyphDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const safeText =
    typeof config.text === "string" && config.text.trim().length > 0
      ? config.text.slice(0, 6)
      : "G";

  const safeSpeed =
    typeof config.speed === "number" && Number.isFinite(config.speed)
      ? Math.min(3, Math.max(0.25, config.speed))
      : 1;

  const safeAutoPlay = Boolean(config.autoPlay);
  const safeInteractive = Boolean(config.interactive);

  const safeTheme: LenticularGlyphTheme = VALID_THEMES.includes(
    config.theme as LenticularGlyphTheme
  )
    ? (config.theme as LenticularGlyphTheme)
    : "auto";

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-8">
      <LenticularGlyph
        text={safeText}
        speed={safeSpeed}
        autoPlay={safeAutoPlay}
        interactive={safeInteractive}
        theme={safeTheme}
      />
    </div>
  );
}

export { LenticularGlyphDemo as Demo, LenticularGlyphDemo as demo };