"use client";

import React from "react";
import { DeveloperProfileGrid } from "@/components/ui/component";

const settings = {
  columns: 2,
  accentMode: "lime",
  showFilter: true,
  showFollowers: true,
  liveClock: false,
};

const VALID_ACCENT_MODES = ["lime", "multicolor"] as const;

export default function DeveloperProfileGridDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const columns =
    typeof config.columns === "number" && Number.isFinite(config.columns)
      ? (Math.max(1, Math.min(3, Math.round(config.columns))) as 1 | 2 | 3)
      : 2;

  const accentMode = VALID_ACCENT_MODES.includes(
    config.accentMode as (typeof VALID_ACCENT_MODES)[number]
  )
    ? (config.accentMode as "lime" | "multicolor")
    : "lime";

  return (
    <div className="w-full min-h-[540px] flex items-center justify-center p-6 sm:p-10">
      <DeveloperProfileGrid
        columns={columns}
        accentMode={accentMode}
        showFilter={Boolean(config.showFilter)}
        showFollowers={Boolean(config.showFollowers)}
        liveClock={Boolean(config.liveClock)}
      />
    </div>
  );
}

export { DeveloperProfileGridDemo as Demo, DeveloperProfileGridDemo as demo };
