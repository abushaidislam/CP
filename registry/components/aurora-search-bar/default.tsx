"use client";

import React, { useEffect, useState } from "react";
import {
  AuroraSearchBar,
  type AuroraMode,
  type AuroraSearchTheme,
} from "@/components/ui/component";

const settings = {
  placeholder: "Search",
  auroraMode: "pulse",
  defaultExpanded: false,
  expandedWidth: 340,
  theme: "auto",
};

const VALID_AURORA_MODES: AuroraMode[] = ["pulse", "always", "focus", "off"];
const VALID_THEMES: AuroraSearchTheme[] = ["auto", "light", "dark"];

export default function AuroraSearchBarDemo(
  props: Partial<typeof settings>
) {
  const config = {
    ...settings,
    ...props,
  };

  const auroraMode: AuroraMode = VALID_AURORA_MODES.includes(
    config.auroraMode as AuroraMode
  )
    ? (config.auroraMode as AuroraMode)
    : "pulse";

  const theme: AuroraSearchTheme = VALID_THEMES.includes(
    config.theme as AuroraSearchTheme
  )
    ? (config.theme as AuroraSearchTheme)
    : "auto";

  const expandedWidth =
    typeof config.expandedWidth === "number" && Number.isFinite(config.expandedWidth)
      ? Math.min(640, Math.max(200, config.expandedWidth))
      : 340;

  const [expanded, setExpanded] = useState(Boolean(config.defaultExpanded));

  useEffect(() => {
    setExpanded(Boolean(config.defaultExpanded));
  }, [config.defaultExpanded]);

  return (
    <div className="w-full min-h-[400px] flex items-center justify-center p-8">
      <AuroraSearchBar
        placeholder={
          typeof config.placeholder === "string" && config.placeholder.length > 0
            ? config.placeholder
            : "Search"
        }
        auroraMode={auroraMode}
        expanded={expanded}
        onExpandedChange={setExpanded}
        expandedWidth={expandedWidth}
        theme={theme}
      />
    </div>
  );
}