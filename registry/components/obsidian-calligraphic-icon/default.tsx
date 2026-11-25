"use client";

import React from "react";
import { ObsidianCalligraphicIcon } from "@/components/ui/component";

const settings = {
  size: 280,
  grainIntensity: 0.46,
  interactive: true,
  tiltStrength: 12,
  showElevation: true,
};

export default function ObsidianCalligraphicIconDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const size =
    typeof config.size === "number" && Number.isFinite(config.size)
      ? Math.min(Math.max(config.size, 64), 480)
      : settings.size;

  const grainIntensity =
    typeof config.grainIntensity === "number" &&
    Number.isFinite(config.grainIntensity)
      ? Math.min(Math.max(config.grainIntensity, 0), 1)
      : settings.grainIntensity;

  const tiltStrength =
    typeof config.tiltStrength === "number" &&
    Number.isFinite(config.tiltStrength)
      ? Math.min(Math.max(config.tiltStrength, 0), 24)
      : settings.tiltStrength;

  const interactive = Boolean(config.interactive);
  const showElevation = Boolean(config.showElevation);

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-8">
      <ObsidianCalligraphicIcon
        size={size}
        grainIntensity={grainIntensity}
        interactive={interactive}
        tiltStrength={tiltStrength}
        showElevation={showElevation}
      />
    </div>
  );
}

export {
  ObsidianCalligraphicIconDemo as Demo,
  ObsidianCalligraphicIconDemo as demo,
};