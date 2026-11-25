"use client";

import React from "react";
import { IsometricBrandPlinth } from "@/components/ui/component";

const settings = {
  brandCode: "NU-VOR",
  endMonogram: "A",
  subtitle: "design | systems | academy",
  baseColor: "#acefff",
  floating: true,
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
  const baseColor =
    typeof config.baseColor === "string" ? config.baseColor : settings.baseColor;
  const floating =
    typeof config.floating === "boolean" ? config.floating : settings.floating;
  const interactive =
    typeof config.interactive === "boolean"
      ? config.interactive
      : settings.interactive;

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-8">
      <IsometricBrandPlinth
        brandCode={brandCode}
        endMonogram={endMonogram}
        subtitle={subtitle}
        baseColor={baseColor}
        floating={floating}
        interactive={interactive}
      />
    </div>
  );
}

export { IsometricBrandPlinthDemo as Demo, IsometricBrandPlinthDemo as demo };