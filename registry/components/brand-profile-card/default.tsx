"use client";

import React from "react";
import { BrandProfileCard } from "@/components/ui/component";

const settings = {
  name: "hushlever",
  handle: "@hushlever",
  verified: true,
  initialFollowing: false,
  showSocials: true,
  theme: "auto",
};

type ThemeMode = "auto" | "light" | "dark";
const VALID_THEMES: ThemeMode[] = ["auto", "light", "dark"];

export function BrandProfileCardDemo(props: Partial<typeof settings>) {
  const config = { ...settings, ...props };

  const theme: ThemeMode = VALID_THEMES.includes(config.theme as ThemeMode)
    ? (config.theme as ThemeMode)
    : "auto";

  const name =
    typeof config.name === "string" && config.name.trim().length > 0
      ? config.name
      : settings.name;

  const handle =
    typeof config.handle === "string" && config.handle.trim().length > 0
      ? config.handle
      : settings.handle;

  return (
    <div className="flex min-h-[600px] w-full items-center justify-center p-6 sm:p-8">
      <BrandProfileCard
        name={name}
        handle={handle}
        verified={Boolean(config.verified)}
        initialFollowing={Boolean(config.initialFollowing)}
        showSocials={Boolean(config.showSocials)}
        theme={theme}
      />
    </div>
  );
}

export { BrandProfileCardDemo as Demo, BrandProfileCardDemo as demo };
export default BrandProfileCardDemo;