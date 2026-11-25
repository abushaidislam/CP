"use client";

import React from "react";
import { DailyRoutineChecklist } from "@/components/ui/component";

const settings = {
  theme: "auto",
  allowAdd: true,
  strikeCompleted: false,
  accentColor: "#5d37e6",
};

const VALID_THEMES = ["auto", "light", "dark"] as const;
type ThemeOption = (typeof VALID_THEMES)[number];

export default function DailyRoutineChecklistDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const theme: ThemeOption = VALID_THEMES.includes(config.theme as ThemeOption)
    ? (config.theme as ThemeOption)
    : "auto";

  const accentColor =
    typeof config.accentColor === "string" && config.accentColor.trim().length > 0
      ? config.accentColor
      : "#5d37e6";

  return (
    <div className="flex min-h-[380px] w-full items-center justify-center p-8">
      <DailyRoutineChecklist
        theme={theme}
        allowAdd={Boolean(config.allowAdd)}
        strikeCompleted={Boolean(config.strikeCompleted)}
        accentColor={accentColor}
      />
    </div>
  );
}

export { DailyRoutineChecklistDemo as Demo, DailyRoutineChecklistDemo as demo };