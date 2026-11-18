"use client";

import React from "react";
import {
  CreativeGridPoster,
  type CreativeGridTheme,
} from "@/components/ui/component";

const settings = {
  theme: "auto",
  showCaptions: true,
  animateEntrance: true,
  attribution: "WWW.DREX.ART",
};

const VALID_THEMES: CreativeGridTheme[] = ["auto", "light", "dark"];

export default function CreativeGridPosterDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const theme: CreativeGridTheme = VALID_THEMES.includes(
    config.theme as CreativeGridTheme
  )
    ? (config.theme as CreativeGridTheme)
    : "auto";

  const attribution =
    typeof config.attribution === "string"
      ? config.attribution
      : settings.attribution;

  return (
    <div className="w-full min-h-[400px] flex items-center justify-center">
      <CreativeGridPoster
        theme={theme}
        showCaptions={Boolean(config.showCaptions)}
        animateEntrance={Boolean(config.animateEntrance)}
        attribution={attribution}
      />
    </div>
  );
}