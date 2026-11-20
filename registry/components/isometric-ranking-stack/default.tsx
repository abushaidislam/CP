"use client";

import React from "react";
import { IsometricRankingStack } from "@/components/ui/component";

const settings = {
  theme: "dark",
  headline: "Go from indexed to recommended",
  primaryCtaText: "Start for free",
  secondaryCtaText: "See how scoring works",
  initialStep: -1,
};

export default function IsometricRankingStackDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const theme: "auto" | "dark" | "light" =
    config.theme === "light" || config.theme === "auto"
      ? config.theme
      : "dark";

  const initialStep =
    typeof config.initialStep === "number" && Number.isFinite(config.initialStep)
      ? Math.max(-1, Math.min(3, Math.round(config.initialStep)))
      : -1;

  const canvasBg =
    theme === "light"
      ? "bg-[#FAFAFA]"
      : theme === "dark"
        ? "bg-[#0A0A0A]"
        : "bg-background";

  return (
    <div
      className={`w-full min-h-[520px] flex items-center justify-center p-4 sm:p-8 transition-colors duration-200 ${canvasBg}`}
    >
      <IsometricRankingStack
        key={initialStep}
        theme={theme}
        headline={
          typeof config.headline === "string"
            ? config.headline
            : settings.headline
        }
        primaryCtaText={
          typeof config.primaryCtaText === "string"
            ? config.primaryCtaText
            : settings.primaryCtaText
        }
        secondaryCtaText={
          typeof config.secondaryCtaText === "string"
            ? config.secondaryCtaText
            : settings.secondaryCtaText
        }
        initialStep={initialStep}
      />
    </div>
  );
}