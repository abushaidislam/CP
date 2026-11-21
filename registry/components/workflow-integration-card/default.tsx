"use client";

import React from "react";
import {
  WorkflowIntegrationCard,
  type WorkflowCardTheme,
} from "@/components/ui/component";

const settings = {
  title: "Built for You",
  description:
    "Every system is fully tailored to your processes, no templates, just precision-built operations.",
  animated: true,
  interactive: true,
  accentColor: "#6400f3",
  theme: "auto",
};

const VALID_THEMES: WorkflowCardTheme[] = ["auto", "light", "dark"];

export default function WorkflowIntegrationCardDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const theme: WorkflowCardTheme = VALID_THEMES.includes(
    config.theme as WorkflowCardTheme
  )
    ? (config.theme as WorkflowCardTheme)
    : "auto";

  return (
    <div className="w-full min-h-[460px] flex items-center justify-center p-6 sm:p-8">
      <WorkflowIntegrationCard
        title={config.title}
        description={config.description}
        animated={Boolean(config.animated)}
        interactive={Boolean(config.interactive)}
        accentColor={config.accentColor}
        theme={theme}
      />
    </div>
  );
}

export {
  WorkflowIntegrationCardDemo as Demo,
  WorkflowIntegrationCardDemo as demo,
};