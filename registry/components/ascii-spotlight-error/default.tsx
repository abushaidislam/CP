"use client";

import React from "react";
import {
  AsciiSpotlightError,
  type AsciiSpotlightTheme,
} from "@/components/ui/component";

const settings = {
  message: "Something went wrong",
  beamLength: 360,
  coneAngle: 56,
  cellSize: 12,
  theme: "auto",
};

const VALID_THEMES: AsciiSpotlightTheme[] = ["auto", "dark", "light"];

export default function AsciiSpotlightErrorDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const theme: AsciiSpotlightTheme = VALID_THEMES.includes(
    config.theme as AsciiSpotlightTheme
  )
    ? (config.theme as AsciiSpotlightTheme)
    : "auto";

  const beamLength =
    typeof config.beamLength === "number" && Number.isFinite(config.beamLength)
      ? Math.min(720, Math.max(140, config.beamLength))
      : settings.beamLength;

  const coneAngle =
    typeof config.coneAngle === "number" && Number.isFinite(config.coneAngle)
      ? Math.min(130, Math.max(16, config.coneAngle))
      : settings.coneAngle;

  const cellSize =
    typeof config.cellSize === "number" && Number.isFinite(config.cellSize)
      ? Math.min(22, Math.max(8, config.cellSize))
      : settings.cellSize;

  const message =
    typeof config.message === "string" && config.message.trim().length > 0
      ? config.message
      : settings.message;

  return (
    <div className="w-full min-h-[540px] flex items-center justify-center">
      <AsciiSpotlightError
        message={message}
        beamLength={beamLength}
        coneAngle={coneAngle}
        cellSize={cellSize}
        theme={theme}
        className="min-h-[540px]"
      />
    </div>
  );
}

export { AsciiSpotlightErrorDemo as Demo, AsciiSpotlightErrorDemo as demo };