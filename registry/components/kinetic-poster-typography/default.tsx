"use client";

import React from "react";
import { KineticPosterTypography } from "@/components/ui/component";

const settings = {
  topWord: "ENERGY",
  middleWord: "IN",
  bottomWord: "MOTION",
  cycleDuration: 4.2,
  autoPlay: true,
  theme: "auto",
};

type ThemeOption = "auto" | "dark" | "light";
const VALID_THEMES: ThemeOption[] = ["auto", "dark", "light"];

export default function KineticPosterTypographyDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const theme: ThemeOption = VALID_THEMES.includes(config.theme as ThemeOption)
    ? (config.theme as ThemeOption)
    : "auto";

  const cycleDuration =
    typeof config.cycleDuration === "number" && Number.isFinite(config.cycleDuration)
      ? Math.max(1.6, Math.min(12, config.cycleDuration))
      : 4.2;

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-6 sm:p-8">
      <KineticPosterTypography
        topWord={String(config.topWord || "ENERGY")}
        middleWord={String(config.middleWord || "IN")}
        bottomWord={String(config.bottomWord || "MOTION")}
        cycleDuration={cycleDuration}
        autoPlay={Boolean(config.autoPlay)}
        theme={theme}
      />
    </div>
  );
}

export { KineticPosterTypographyDemo as Demo, KineticPosterTypographyDemo as demo };