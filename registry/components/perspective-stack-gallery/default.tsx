"use client";

import React from "react";
import { PerspectiveStackGallery } from "@/components/ui/component";

const settings = {
  theme: "auto",
  visibleCards: 11,
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
      : 11;

  return (
    <div className="flex min-h-[620px] w-full flex-col items-center justify-center overflow-hidden">
      <div className="relative flex w-full max-w-4xl flex-col items-center justify-center">
        <PerspectiveStackGallery
          theme={resolvedTheme}
          visibleCards={resolvedVisibleCards}
          enableWheel={Boolean(config.enableWheel)}
          showIndicators={Boolean(config.showIndicators)}
          className="min-h-[580px] py-6 sm:min-h-[620px] sm:py-8"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none mx-auto h-px w-[min(78%,520px)] bg-neutral-200/80 dark:bg-neutral-800/80"
        />
      </div>
    </div>
  );
}

export {
  PerspectiveStackGalleryDemo as Demo,
  PerspectiveStackGalleryDemo as demo,
};
export default PerspectiveStackGalleryDemo;
