"use client";

import React from "react";
import { KineticPosterTypography } from "@/components/ui/component";

const settings = {
  layout: "section",
  topWord: "ENERGY",
  middleWord: "IN",
  bottomWord: "MOTION",
  subtitle: "»Energy in Motion« — Principles of Kinetic Graphic Design & Typography",
  cycleDuration: 4.5,
  autoPlay: true,
  cameraZoom: true,
  theme: "dark",
};

type ThemeOption = "dark" | "light" | "auto";
type LayoutOption = "section" | "poster";

const VALID_THEMES: ThemeOption[] = ["dark", "light", "auto"];
const VALID_LAYOUTS: LayoutOption[] = ["section", "poster"];

export default function KineticPosterTypographyDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const theme: ThemeOption = VALID_THEMES.includes(config.theme as ThemeOption)
    ? (config.theme as ThemeOption)
    : "dark";

  const layout: LayoutOption = VALID_LAYOUTS.includes(config.layout as LayoutOption)
    ? (config.layout as LayoutOption)
    : "section";

  const cycleDuration =
    typeof config.cycleDuration === "number" && Number.isFinite(config.cycleDuration)
      ? Math.max(2.0, Math.min(12, config.cycleDuration))
      : 4.5;

  return (
    <div
      className={
        layout === "section"
          ? "w-full"
          : "flex min-h-[420px] w-full items-center justify-center p-6 sm:p-8"
      }
    >
      <KineticPosterTypography
        layout={layout}
        topWord={String(config.topWord || "ENERGY")}
        middleWord={String(config.middleWord || "IN")}
        bottomWord={String(config.bottomWord || "MOTION")}
        subtitle={String(config.subtitle ?? "")}
        cycleDuration={cycleDuration}
        autoPlay={Boolean(config.autoPlay)}
        cameraZoom={Boolean(config.cameraZoom)}
        theme={theme}
      />
    </div>
  );
}

export { KineticPosterTypographyDemo as Demo, KineticPosterTypographyDemo as demo };
