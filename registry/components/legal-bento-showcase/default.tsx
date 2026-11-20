"use client";

import React from "react";
import { LegalBentoShowcase } from "@/components/ui/component";

const settings = {
  theme: "light",
  brandName: "Bendwick",
  autoCycleResearch: true,
  showEdgeFades: true,
};

export default function LegalBentoShowcaseDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const theme: "light" | "dark" =
    config.theme === "dark" ? "dark" : "light";

  const brandName =
    typeof config.brandName === "string" && config.brandName.trim().length > 0
      ? config.brandName
      : "Bendwick";

  const autoCycleResearch = Boolean(config.autoCycleResearch);
  const showEdgeFades = Boolean(config.showEdgeFades);

  return (
    <div className="w-full min-h-[400px] flex items-center justify-center p-4 sm:p-8 bg-background">
      <LegalBentoShowcase
        theme={theme}
        brandName={brandName}
        autoCycleResearch={autoCycleResearch}
        showEdgeFades={showEdgeFades}
      />
    </div>
  );
}