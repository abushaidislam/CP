"use client";

import React from "react";
import { BentoBrandFooter } from "@/components/ui/component";

const settings = {
  brandName: "Nuvora",
  taglinePrimary: "Smarter workflow automation,",
  taglineSecondary: "powered by AI.",
  showFloatingBadge: true,
  showWatermark: true,
};

export interface DemoProps {
  brandName?: string;
  taglinePrimary?: string;
  taglineSecondary?: string;
  showFloatingBadge?: boolean;
  showWatermark?: boolean;
}

export default function Demo(props: DemoProps) {
  const config = { ...settings, ...props };

  const brandName =
    typeof config.brandName === "string" && config.brandName.trim().length > 0
      ? config.brandName
      : "Nuvora";
  const taglinePrimary =
    typeof config.taglinePrimary === "string"
      ? config.taglinePrimary
      : "Smarter workflow automation,";
  const taglineSecondary =
    typeof config.taglineSecondary === "string"
      ? config.taglineSecondary
      : "powered by AI.";
  const showFloatingBadge = Boolean(config.showFloatingBadge);
  const showWatermark = Boolean(config.showWatermark);

  return (
    <div className="w-full min-h-[400px] flex items-center justify-center p-4 sm:p-8 bg-background">
      <BentoBrandFooter
        brandName={brandName}
        taglinePrimary={taglinePrimary}
        taglineSecondary={taglineSecondary}
        showFloatingBadge={showFloatingBadge}
        showWatermark={showWatermark}
      />
    </div>
  );
}

export { Demo, Demo as demo };
