"use client";

import React from "react";
import {
  PocketAssistantCards,
  type PocketTheme,
} from "@/components/ui/component";

const settings = {
  headline: "I'm always in your pocket",
  subheadline: "Wherever you are",
  interactive: true,
  autoPeek: false,
  theme: "auto",
};

const VALID_THEMES: PocketTheme[] = ["auto", "light", "dark"];

export default function PocketAssistantCardsDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const theme: PocketTheme = VALID_THEMES.includes(config.theme as PocketTheme)
    ? (config.theme as PocketTheme)
    : "auto";

  return (
    <div className="flex w-full items-center justify-center p-4 sm:p-8">
      <PocketAssistantCards
        headline={
          typeof config.headline === "string"
            ? config.headline
            : settings.headline
        }
        subheadline={
          typeof config.subheadline === "string"
            ? config.subheadline
            : settings.subheadline
        }
        interactive={Boolean(config.interactive)}
        autoPeek={Boolean(config.autoPeek)}
        theme={theme}
      />
    </div>
  );
}

export {
  PocketAssistantCardsDemo as Demo,
  PocketAssistantCardsDemo as demo,
};