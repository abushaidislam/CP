"use client";

import React from "react";
import { RadialDissolveBrandCard } from "@/components/ui/component";

const settings = {
  brandName: "ANOTHER AI THING",
  accentColor: "#ED370A",
  autoCycle: true,
  cycleDuration: 5800,
  showMockups: true,
};

export interface DemoProps {
  brandName?: string;
  accentColor?: string;
  autoCycle?: boolean;
  cycleDuration?: number;
  showMockups?: boolean;
}

export function Demo(props: DemoProps) {
  const config = { ...settings, ...props };

  const safeBrandName =
    typeof config.brandName === "string" && config.brandName.trim().length > 0
      ? config.brandName
      : settings.brandName;

  const safeAccentColor =
    typeof config.accentColor === "string" && /^#[0-9a-fA-F]{3,8}$/.test(config.accentColor)
      ? config.accentColor
      : settings.accentColor;

  const safeAutoCycle =
    typeof config.autoCycle === "boolean" ? config.autoCycle : settings.autoCycle;

  const safeCycleDuration =
    typeof config.cycleDuration === "number" && Number.isFinite(config.cycleDuration)
      ? Math.max(2400, Math.min(16000, config.cycleDuration))
      : settings.cycleDuration;

  const safeShowMockups =
    typeof config.showMockups === "boolean" ? config.showMockups : settings.showMockups;

  return (
    <div className="w-full min-h-[400px] flex items-center justify-center p-8 bg-background">
      <RadialDissolveBrandCard
        brandName={safeBrandName}
        accentColor={safeAccentColor}
        autoCycle={safeAutoCycle}
        cycleDuration={safeCycleDuration}
        showMockups={safeShowMockups}
      />
    </div>
  );
}

export { Demo as demo };
export default Demo;