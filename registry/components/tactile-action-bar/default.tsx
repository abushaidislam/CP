"use client";

import React from "react";
import {
  TactileActionBar,
  type TactileActionBarTheme,
} from "@/components/ui/component";

const settings = {
  primaryLabel: "Join now",
  secondaryLabel: "Invite",
  defaultEnabled: true,
  showToggle: true,
  theme: "auto",
};

const VALID_THEMES: TactileActionBarTheme[] = ["auto", "light", "dark"];

export function Demo(props: Partial<typeof settings>) {
  const config = { ...settings, ...props };

  const theme: TactileActionBarTheme = VALID_THEMES.includes(
    config.theme as TactileActionBarTheme
  )
    ? (config.theme as TactileActionBarTheme)
    : "auto";

  const primaryLabel =
    typeof config.primaryLabel === "string" && config.primaryLabel.trim().length > 0
      ? config.primaryLabel
      : settings.primaryLabel;

  const secondaryLabel =
    typeof config.secondaryLabel === "string" && config.secondaryLabel.trim().length > 0
      ? config.secondaryLabel
      : settings.secondaryLabel;

  return (
    <div className="flex min-h-[320px] w-full items-center justify-center p-8">
      <TactileActionBar
        primaryLabel={primaryLabel}
        secondaryLabel={secondaryLabel}
        defaultEnabled={Boolean(config.defaultEnabled)}
        showToggle={Boolean(config.showToggle)}
        theme={theme}
      />
    </div>
  );
}

export const demo = Demo;
export default Demo;