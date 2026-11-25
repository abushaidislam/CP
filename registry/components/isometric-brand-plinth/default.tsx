"use client";

import React from "react";
import { IsometricBrandPlinth } from "@/components/ui/component";

const settings = {
  brandCode: "NU-VOR",
  endMonogram: "A",
  subtitle: "design | systems | academy",
  showAsciiFire: true,
  fireIntensity: 0.85,
  orbitSpeed: 12,
  interactive: true,
};

export default function IsometricBrandPlinthDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const brandCode =
    typeof config.brandCode === "string" ? config.brandCode : settings.brandCode;
  const endMonogram =
    typeof config.endMonogram === "string"
      ? config.endMonogram
      : settings.endMonogram;
  const subtitle =
    typeof config.subtitle === "string" ? config.subtitle : settings.subtitle;
  const showAsciiFire =
    typeof config.showAsciiFire === "boolean"
      ? config.showAsciiFire
      : settings.showAsciiFire;
  const fireIntensity =
    typeof config.fireIntensity === "number" &&
    Number.isFinite(config.fireIntensity)
      ? Math.max(0.3, Math.min(1, config.fireIntensity))
      : settings.fireIntensity;
  const orbitSpeed =
    typeof config.orbitSpeed === "number" && Number.isFinite(config.orbitSpeed)
      ? Math.max(0, config.orbitSpeed)
      : settings.orbitSpeed;
  const interactive =
    typeof config.interactive === "boolean"
      ? config.interactive
      : settings.interactive;

  return (
    <div className="flex min-h-[460px] w-full items-center justify-center p-8">
      <IsometricBrandPlinth
        brandCode={brandCode}
        endMonogram={endMonogram}
        subtitle={subtitle}
        showAsciiFire={showAsciiFire}
        fireIntensity={fireIntensity}
        orbitSpeed={orbitSpeed}
        interactive={interactive}
      />
    </div>
  );
}

export { IsometricBrandPlinthDemo as Demo, IsometricBrandPlinthDemo as demo };
