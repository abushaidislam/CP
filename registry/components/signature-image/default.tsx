"use client";

import React from "react";
import {
  AnimatedSignature,
  type AnimatedSignatureTheme,
} from "@/components/ui/component";

const settings = {
  name: "",
  imageUrl: "",
  duration: 2,
  strokeWidth: 3.6,
  showPen: true,
  loop: false,
  theme: "auto",
};

const VALID_THEMES: AnimatedSignatureTheme[] = ["auto", "dark", "light"];

export default function AnimatedSignatureDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const name = typeof config.name === "string" ? config.name : settings.name;
  const imageUrl =
    typeof config.imageUrl === "string" ? config.imageUrl : settings.imageUrl;

  const duration =
    typeof config.duration === "number" &&
    Number.isFinite(config.duration) &&
    config.duration > 0
      ? Math.min(Math.max(config.duration, 0.3), 12)
      : settings.duration;

  const strokeWidth =
    typeof config.strokeWidth === "number" &&
    Number.isFinite(config.strokeWidth) &&
    config.strokeWidth > 0
      ? Math.min(Math.max(config.strokeWidth, 1), 12)
      : settings.strokeWidth;

  const showPen =
    typeof config.showPen === "boolean" ? config.showPen : settings.showPen;

  const loop = typeof config.loop === "boolean" ? config.loop : settings.loop;

  const theme: AnimatedSignatureTheme = VALID_THEMES.includes(
    config.theme as AnimatedSignatureTheme
  )
    ? (config.theme as AnimatedSignatureTheme)
    : "auto";

  return (
    <div className="flex min-h-[320px] w-full items-center justify-center p-8">
      <AnimatedSignature
        name={name}
        imageUrl={imageUrl}
        duration={duration}
        strokeWidth={strokeWidth}
        showPen={showPen}
        loop={loop}
        theme={theme}
      />
    </div>
  );
}

export { AnimatedSignatureDemo as Demo, AnimatedSignatureDemo as demo };