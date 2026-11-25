"use client";

import React from "react";
import {
  LiquidMorphText,
  type LiquidMorphTheme,
} from "@/components/ui/component";

const settings = {
  text: "morph",
  fontSize: 136,
  radius: 95,
  intensity: 1,
  italic: true,
  theme: "auto",
};

const VALID_THEMES: LiquidMorphTheme[] = ["auto", "dark", "light"];

export default function LiquidMorphTextDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const safeTheme: LiquidMorphTheme = VALID_THEMES.includes(
    config.theme as LiquidMorphTheme
  )
    ? (config.theme as LiquidMorphTheme)
    : "auto";

  const safeFontSize =
    typeof config.fontSize === "number" && Number.isFinite(config.fontSize)
      ? config.fontSize
      : settings.fontSize;

  const safeRadius =
    typeof config.radius === "number" && Number.isFinite(config.radius)
      ? config.radius
      : settings.radius;

  const safeIntensity =
    typeof config.intensity === "number" && Number.isFinite(config.intensity)
      ? config.intensity
      : settings.intensity;

  return (
    <div className="flex min-h-[360px] w-full flex-col items-center justify-center p-6">
      <LiquidMorphText
        text={typeof config.text === "string" ? config.text : settings.text}
        fontSize={safeFontSize}
        radius={safeRadius}
        intensity={safeIntensity}
        italic={Boolean(config.italic)}
        theme={safeTheme}
      />
    </div>
  );
}

export { LiquidMorphTextDemo as Demo, LiquidMorphTextDemo as demo };