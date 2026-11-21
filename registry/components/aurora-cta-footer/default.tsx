"use client";

import React from "react";
import { AuroraCtaFooter } from "@/components/ui/component";

const settings = {
  headline: "Ready to Take Control\nof Your Health?",
  subheadline:
    "Get expert care for weight loss, sexual health, wellness, and more — all from the comfort of home, no insurance needed.",
  primaryCtaLabel: "Start Now",
  secondaryCtaLabel: "Contact Us",
  brandName: "Nietzsche",
  theme: "auto",
};

type ThemeMode = "auto" | "light" | "dark";

const VALID_THEMES: ThemeMode[] = ["auto", "light", "dark"];

export default function AuroraCtaFooterDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const theme: ThemeMode = VALID_THEMES.includes(config.theme as ThemeMode)
    ? (config.theme as ThemeMode)
    : "auto";

  return (
    <div className="w-full flex items-center justify-center p-4 sm:p-6">
      <AuroraCtaFooter
        headline={config.headline}
        subheadline={config.subheadline}
        primaryCtaLabel={config.primaryCtaLabel}
        secondaryCtaLabel={config.secondaryCtaLabel}
        brandName={config.brandName}
        theme={theme}
      />
    </div>
  );
}

export { AuroraCtaFooterDemo as Demo, AuroraCtaFooterDemo as demo };