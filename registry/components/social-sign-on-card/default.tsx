"use client";

import React from "react";
import { SocialSignOnCard } from "@/components/ui/component";

const settings = {
  theme: "auto",
  title: "Social Sign-On",
  description:
    "Add high-conversion Social Sign-on (SSO) to your application in minutes. 20+ options and growing.",
  alwaysActive: false,
  stepInterval: 2600,
};

type ValidTheme = "auto" | "dark" | "light";
const VALID_THEMES: ValidTheme[] = ["auto", "dark", "light"];

export default function SocialSignOnCardDemo(props: Partial<typeof settings>) {
  const config = { ...settings, ...props };

  const theme: ValidTheme = VALID_THEMES.includes(config.theme as ValidTheme)
    ? (config.theme as ValidTheme)
    : "auto";

  const stepInterval =
    typeof config.stepInterval === "number" && Number.isFinite(config.stepInterval)
      ? Math.min(6000, Math.max(1200, config.stepInterval))
      : 2600;

  return (
    <div className="w-full min-h-[420px] flex items-center justify-center p-6 sm:p-8">
      <SocialSignOnCard
        theme={theme}
        title={typeof config.title === "string" ? config.title : settings.title}
        description={
          typeof config.description === "string"
            ? config.description
            : settings.description
        }
        alwaysActive={Boolean(config.alwaysActive)}
        stepInterval={stepInterval}
      />
    </div>
  );
}

export { SocialSignOnCardDemo as Demo, SocialSignOnCardDemo as demo };