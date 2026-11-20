"use client";

import React from "react";
import { CodeSingularity } from "@/components/ui/component";

const settings = {
  speed: 1,
  autoPlay: true,
  phase: 0,
  interactive: true,
  accretionColor: "#ff7a1a",
  intensity: 1,
};

export default function CodeSingularityDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const safeSpeed =
    typeof config.speed === "number" && Number.isFinite(config.speed)
      ? Math.min(3, Math.max(0.1, config.speed))
      : settings.speed;

  const safePhase =
    typeof config.phase === "number" && Number.isFinite(config.phase)
      ? Math.min(1, Math.max(0, config.phase))
      : settings.phase;

  const safeIntensity =
    typeof config.intensity === "number" && Number.isFinite(config.intensity)
      ? Math.min(1.8, Math.max(0.4, config.intensity))
      : settings.intensity;

  const safeColor =
    typeof config.accretionColor === "string" &&
    /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(config.accretionColor.trim())
      ? config.accretionColor.trim()
      : settings.accretionColor;

  return (
    <div className="w-full min-h-[540px] flex items-center justify-center p-4 sm:p-8">
      <div className="relative w-full max-w-[420px] aspect-[464/688] rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 shadow-2xl">
        <CodeSingularity
          speed={safeSpeed}
          autoPlay={Boolean(config.autoPlay)}
          phase={safePhase}
          interactive={Boolean(config.interactive)}
          accretionColor={safeColor}
          intensity={safeIntensity}
        />
      </div>
    </div>
  );
}

export { CodeSingularityDemo as Demo, CodeSingularityDemo as demo };