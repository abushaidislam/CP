"use client";

import React from "react";
import { AiSearchHero } from "@/components/ui/component";

const settings = {
  theme: "dark",
  subtitle:
    "Cited checks what Google and AI assistants say about your brand every day, and shows you which pages to fix so they mention you more.",
  primaryCtaText: "Start for free",
  secondaryCtaText: "See it on your site",
  animateOnMount: true,
  staggerDelay: 0.09,
};

export default function AiSearchHeroDemo(props: Partial<typeof settings>) {
  const config = { ...settings, ...props };

  const theme: "auto" | "dark" | "light" =
    config.theme === "light" || config.theme === "auto"
      ? config.theme
      : "dark";

  const staggerDelay =
    typeof config.staggerDelay === "number" &&
    Number.isFinite(config.staggerDelay)
      ? Math.max(0, Math.min(0.4, config.staggerDelay))
      : 0.09;

  const canvasBg =
    theme === "light"
      ? "bg-[#FAFAFA]"
      : theme === "dark"
        ? "bg-[#0A0A0A]"
        : "bg-background";

  return (
    <div
      className={`w-full min-h-[460px] flex items-center justify-center p-4 sm:p-8 transition-colors duration-200 ${canvasBg}`}
    >
      <AiSearchHero
        key={`${String(config.animateOnMount)}-${staggerDelay}`}
        theme={theme}
        subtitle={
          typeof config.subtitle === "string"
            ? config.subtitle
            : settings.subtitle
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
        animateOnMount={Boolean(config.animateOnMount)}
        staggerDelay={staggerDelay}
      />
    </div>
  );
}