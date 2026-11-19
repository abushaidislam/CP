"use client";

import React from "react";
import {
  CardShuffleDeck,
  type CardShuffleTheme,
} from "@/components/ui/component";

const settings = {
  autoPlay: true,
  interval: 2100,
  pauseOnHover: true,
  interactive: true,
  theme: "auto",
};

const VALID_THEMES: CardShuffleTheme[] = ["auto", "light", "dark"];

export default function CardShuffleDeckDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const theme: CardShuffleTheme = VALID_THEMES.includes(
    config.theme as CardShuffleTheme
  )
    ? (config.theme as CardShuffleTheme)
    : "auto";

  const safeInterval =
    typeof config.interval === "number" && Number.isFinite(config.interval)
      ? Math.max(900, Math.min(config.interval, 8000))
      : settings.interval;

  return (
    <div className="flex min-h-[440px] w-full items-center justify-center p-6 sm:p-10">
      <CardShuffleDeck
        autoPlay={Boolean(config.autoPlay)}
        interval={safeInterval}
        pauseOnHover={Boolean(config.pauseOnHover)}
        interactive={Boolean(config.interactive)}
        theme={theme}
      />
    </div>
  );
}

export { CardShuffleDeckDemo as Demo, CardShuffleDeckDemo as demo };