"use client";

import React from "react";
import {
  DailyRitualChecklist,
  type DailyRitualTheme,
} from "@/components/ui/component";

const settings = {
  theme: "auto",
  allowAdd: true,
  strikethroughCompleted: false,
  accentColor: "#4b22e0",
};

const VALID_THEMES: DailyRitualTheme[] = ["auto", "light", "dark"];

export default function DailyRitualChecklistDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const theme: DailyRitualTheme = VALID_THEMES.includes(
    config.theme as DailyRitualTheme
  )
    ? (config.theme as DailyRitualTheme)
    : "auto";

  const allowAdd =
    typeof config.allowAdd === "boolean" ? config.allowAdd : true;

  const strikethroughCompleted =
    typeof config.strikethroughCompleted === "boolean"
      ? config.strikethroughCompleted
      : false;

  const accentColor =
    typeof config.accentColor === "string" &&
    config.accentColor.trim().length > 0
      ? config.accentColor
      : "#4b22e0";

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-8">
      <DailyRitualChecklist
        theme={theme}
        allowAdd={allowAdd}
        strikethroughCompleted={strikethroughCompleted}
        accentColor={accentColor}
      />
    </div>
  );
}

export {
  DailyRitualChecklistDemo as Demo,
  DailyRitualChecklistDemo as demo,
};