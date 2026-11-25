"use client";

import React from "react";
import { LiquidMorphFooter } from "@/components/ui/component";

const settings = {
  brandName: "Nuvora",
  wordmarkText: "nuvora",
  tagline: "Design systems and motion primitives engineered for the modern web.",
  fontSize: 184,
  morphRadius: 105,
  morphIntensity: 1.05,
  italicWordmark: true,
  showNewsletter: true,
  showBackToTop: true,
  theme: "auto",
};

export default function Demo(props: Partial<typeof settings>) {
  const merged = { ...settings, ...props };
  const resolvedTheme =
    merged.theme === "dark" || merged.theme === "light" || merged.theme === "auto"
      ? merged.theme
      : "auto";

  return (
    <div className="flex min-h-[540px] w-full items-end justify-center">
      <LiquidMorphFooter
        brandName={merged.brandName}
        wordmarkText={merged.wordmarkText}
        tagline={merged.tagline}
        fontSize={Number(merged.fontSize) || 184}
        morphRadius={Number(merged.morphRadius) || 105}
        morphIntensity={Number(merged.morphIntensity) || 1.05}
        italicWordmark={Boolean(merged.italicWordmark)}
        showNewsletter={Boolean(merged.showNewsletter)}
        showBackToTop={Boolean(merged.showBackToTop)}
        theme={resolvedTheme}
      />
    </div>
  );
}

export { Demo, Demo as demo };