"use client";

import React from "react";
import { PerspectiveStackGallery } from "@/components/ui/component";

const settings = {
  theme: "auto",
  visibleCards: 10,
  enableWheel: true,
  showIndicators: true,
};

export interface PerspectiveStackGalleryDemoProps {
  theme?: string;
  visibleCards?: number;
  enableWheel?: boolean;
  showIndicators?: boolean;
}

export function PerspectiveStackGalleryDemo(
  props: PerspectiveStackGalleryDemoProps
) {
  const config = { ...settings, ...props };

  const resolvedTheme: "auto" | "light" | "dark" =
    config.theme === "light" || config.theme === "dark"
      ? config.theme
      : "auto";

  const resolvedVisibleCards =
    typeof config.visibleCards === "number" &&
    Number.isFinite(config.visibleCards)
      ? Math.max(3, Math.min(12, Math.round(config.visibleCards)))
      : 10;

  return (
    <div className="flex min-h-[580px] w-full items-center justify-center p-4 sm:p-8">
      <PerspectiveStackGallery
        theme={resolvedTheme}
        visibleCards={resolvedVisibleCards}
        enableWheel={Boolean(config.enableWheel)}
        showIndicators={Boolean(config.showIndicators)}
      />
    </div>
  );
}

export {
  PerspectiveStackGalleryDemo as Demo,
  PerspectiveStackGalleryDemo as demo,
};
export default PerspectiveStackGalleryDemo;
