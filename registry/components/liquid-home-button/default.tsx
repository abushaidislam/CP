"use client";

import React from "react";
import {
  LiquidHomeButton,
  type LiquidHomeButtonSize,
  type LiquidHomeButtonTheme,
} from "@/components/ui/component";

const settings = {
  label: "Home",
  size: "lg",
  orbitDuration: 5,
  glowIntensity: 1,
  theme: "auto",
};

const VALID_SIZES: LiquidHomeButtonSize[] = ["sm", "md", "lg"];
const VALID_THEMES: LiquidHomeButtonTheme[] = ["auto", "dark", "light"];

export default function LiquidHomeButtonDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const safeSize: LiquidHomeButtonSize = VALID_SIZES.includes(
    config.size as LiquidHomeButtonSize
  )
    ? (config.size as LiquidHomeButtonSize)
    : "lg";

  const safeTheme: LiquidHomeButtonTheme = VALID_THEMES.includes(
    config.theme as LiquidHomeButtonTheme
  )
    ? (config.theme as LiquidHomeButtonTheme)
    : "auto";

  const safeOrbitDuration =
    typeof config.orbitDuration === "number" &&
    Number.isFinite(config.orbitDuration)
      ? Math.min(20, Math.max(1.2, config.orbitDuration))
      : 5;

  const safeGlowIntensity =
    typeof config.glowIntensity === "number" &&
    Number.isFinite(config.glowIntensity)
      ? Math.min(1.5, Math.max(0, config.glowIntensity))
      : 1;

  const safeLabel = typeof config.label === "string" ? config.label : "Home";

  return (
    <div className="flex min-h-[320px] w-full items-center justify-center p-8">
      <LiquidHomeButton
        label={safeLabel}
        size={safeSize}
        orbitDuration={safeOrbitDuration}
        glowIntensity={safeGlowIntensity}
        theme={safeTheme}
      />
    </div>
  );
}

export { LiquidHomeButtonDemo as Demo, LiquidHomeButtonDemo as demo };