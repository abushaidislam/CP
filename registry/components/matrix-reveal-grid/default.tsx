"use client";

import React from "react";
import { MatrixRevealGrid } from "@/components/ui/component";

const settings = {
  theme: "auto",
  dotSize: 3,
  dotSpacing: 7,
  animationSpeed: 1,
  showGuideLines: true,
};

type ThemeMode = "auto" | "dark" | "light";
const VALID_THEMES: ThemeMode[] = ["auto", "dark", "light"];

export default function MatrixRevealGridDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const theme: ThemeMode = VALID_THEMES.includes(config.theme as ThemeMode)
    ? (config.theme as ThemeMode)
    : "auto";

  const dotSize =
    typeof config.dotSize === "number" && Number.isFinite(config.dotSize)
      ? Math.min(6, Math.max(2, config.dotSize))
      : 3;

  const dotSpacing =
    typeof config.dotSpacing === "number" && Number.isFinite(config.dotSpacing)
      ? Math.min(14, Math.max(5, config.dotSpacing))
      : 7;

  const animationSpeed =
    typeof config.animationSpeed === "number" &&
    Number.isFinite(config.animationSpeed)
      ? Math.min(2.5, Math.max(0.4, config.animationSpeed))
      : 1;

  const showGuideLines =
    typeof config.showGuideLines === "boolean" ? config.showGuideLines : true;

  return (
    <div className="flex min-h-[480px] w-full items-center justify-center p-4 sm:p-8">
      <MatrixRevealGrid
        theme={theme}
        dotSize={dotSize}
        dotSpacing={dotSpacing}
        animationSpeed={animationSpeed}
        showGuideLines={showGuideLines}
      />
    </div>
  );
}

export { MatrixRevealGridDemo as Demo, MatrixRevealGridDemo as demo };