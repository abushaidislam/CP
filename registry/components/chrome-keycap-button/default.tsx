"use client";

import React from "react";
import {
  ChromeKeycapButton,
  type ChromeKeycapFinish,
  type ChromeKeycapSize,
} from "@/components/ui/component";

const settings = {
  label: "SPACE",
  size: "md",
  finish: "silver",
  orbitSpeed: 6,
  soundEnabled: true,
  bindSpacebar: true,
};

const VALID_SIZES: ChromeKeycapSize[] = ["sm", "md", "lg"];
const VALID_FINISHES: ChromeKeycapFinish[] = [
  "silver",
  "graphite",
  "champagne",
];

export default function ChromeKeycapButtonDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const size: ChromeKeycapSize = VALID_SIZES.includes(
    config.size as ChromeKeycapSize
  )
    ? (config.size as ChromeKeycapSize)
    : "md";

  const finish: ChromeKeycapFinish = VALID_FINISHES.includes(
    config.finish as ChromeKeycapFinish
  )
    ? (config.finish as ChromeKeycapFinish)
    : "silver";

  const label =
    typeof config.label === "string" && config.label.trim().length > 0
      ? config.label
      : "SPACE";

  const orbitSpeed =
    typeof config.orbitSpeed === "number" && Number.isFinite(config.orbitSpeed)
      ? Math.max(0, Math.min(30, config.orbitSpeed))
      : 6;

  return (
    <div className="w-full min-h-[360px] flex items-center justify-center p-8">
      <ChromeKeycapButton
        label={label}
        size={size}
        finish={finish}
        orbitSpeed={orbitSpeed}
        soundEnabled={Boolean(config.soundEnabled)}
        bindSpacebar={Boolean(config.bindSpacebar)}
      />
    </div>
  );
}

export { ChromeKeycapButtonDemo as Demo, ChromeKeycapButtonDemo as demo };
