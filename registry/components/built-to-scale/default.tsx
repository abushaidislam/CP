"use client";

import React from "react";
import {
  BuiltToScale,
  type BuiltToScaleTheme,
} from "@/components/ui/component";

const settings = {
  theme: "auto",
  autoRotate: true,
  liveEvents: true,
  rotationSpeed: 0.35,
  eventInterval: 3800,
};

const VALID_THEMES: BuiltToScaleTheme[] = ["auto", "light", "dark"];

export default function BuiltToScaleDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const theme: BuiltToScaleTheme = VALID_THEMES.includes(
    config.theme as BuiltToScaleTheme
  )
    ? (config.theme as BuiltToScaleTheme)
    : "auto";

  const rotationSpeed =
    typeof config.rotationSpeed === "number" &&
    Number.isFinite(config.rotationSpeed)
      ? Math.max(0, Math.min(2, config.rotationSpeed))
      : 0.35;

  const eventInterval =
    typeof config.eventInterval === "number" &&
    Number.isFinite(config.eventInterval)
      ? Math.max(1200, Math.min(15000, config.eventInterval))
      : 3800;

  return (
    <div className="flex min-h-[540px] w-full items-center justify-center p-4 sm:p-6">
      <BuiltToScale
        theme={theme}
        autoRotate={Boolean(config.autoRotate)}
        liveEvents={Boolean(config.liveEvents)}
        rotationSpeed={rotationSpeed}
        eventInterval={eventInterval}
      />
    </div>
  );
}

export { BuiltToScaleDemo as Demo, BuiltToScaleDemo as demo };