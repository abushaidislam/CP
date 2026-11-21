"use client";

import React from "react";
import { FollowersTrendCard } from "@/components/ui/component";

const settings = {
  title: "Followers",
  subtitle: "Trend",
  totalLabel: "TOTAL FOLLOWERS",
  newLabel: "NEW FOLLOWERS",
  showActionButton: true,
  theme: "auto",
};

const VALID_THEMES = ["auto", "light", "dark"] as const;
type ValidTheme = (typeof VALID_THEMES)[number];

export default function FollowersTrendCardDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const theme: ValidTheme = VALID_THEMES.includes(config.theme as ValidTheme)
    ? (config.theme as ValidTheme)
    : "auto";

  return (
    <div className="flex min-h-[480px] w-full items-center justify-center p-6 sm:p-8">
      <FollowersTrendCard
        title={String(config.title ?? settings.title)}
        subtitle={String(config.subtitle ?? settings.subtitle)}
        totalLabel={String(config.totalLabel ?? settings.totalLabel)}
        newLabel={String(config.newLabel ?? settings.newLabel)}
        showActionButton={Boolean(config.showActionButton)}
        theme={theme}
      />
    </div>
  );
}