"use client";

import React from "react";
import {
  QlarkStudioBentoGrid,
  type QlarkBentoTheme,
} from "@/components/ui/component";

const settings = {
  theme: "auto",
  brandName: "QlarK",
  brandSubtitle: "Studio",
  cursorLabel: "You",
  autoPlay: true,
  phraseInterval: 2000,
};

const VALID_THEMES: QlarkBentoTheme[] = ["auto", "dark", "light"];

export default function QlarkStudioBentoGridDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const theme: QlarkBentoTheme = VALID_THEMES.includes(
    config.theme as QlarkBentoTheme
  )
    ? (config.theme as QlarkBentoTheme)
    : "auto";

  const brandName =
    typeof config.brandName === "string" && config.brandName.trim().length > 0
      ? config.brandName
      : settings.brandName;

  const brandSubtitle =
    typeof config.brandSubtitle === "string"
      ? config.brandSubtitle
      : settings.brandSubtitle;

  const cursorLabel =
    typeof config.cursorLabel === "string" &&
    config.cursorLabel.trim().length > 0
      ? config.cursorLabel
      : settings.cursorLabel;

  const autoPlay =
    typeof config.autoPlay === "boolean" ? config.autoPlay : settings.autoPlay;

  const rawInterval = Number(config.phraseInterval);
  const phraseInterval = Number.isFinite(rawInterval)
    ? Math.max(800, Math.min(8000, rawInterval))
    : settings.phraseInterval;

  return (
    <div className="flex w-full items-center justify-center p-4 sm:p-6 md:p-8">
      <QlarkStudioBentoGrid
        theme={theme}
        brandName={brandName}
        brandSubtitle={brandSubtitle}
        cursorLabel={cursorLabel}
        autoPlay={autoPlay}
        phraseInterval={phraseInterval}
      />
    </div>
  );
}

export {
  QlarkStudioBentoGridDemo as Demo,
  QlarkStudioBentoGridDemo as demo,
};