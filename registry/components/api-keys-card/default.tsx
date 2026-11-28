"use client";

import React from "react";
import { ApiKeysCard, type ApiKeysCardTheme } from "@/components/ui/component";

const settings = {
  title: "API Keys",
  description:
    "Give every user secure, production-ready API keys without building any of the underlying boilerplate code or UI.",
  statusText: "Authenticating...",
  autoPlay: false,
  theme: "auto",
};

const VALID_THEMES: ApiKeysCardTheme[] = ["auto", "dark", "light"];

export default function ApiKeysCardDemo(props: Partial<typeof settings>) {
  const config = { ...settings, ...props };

  const theme: ApiKeysCardTheme = VALID_THEMES.includes(
    config.theme as ApiKeysCardTheme
  )
    ? (config.theme as ApiKeysCardTheme)
    : "auto";

  return (
    <div className="w-full min-h-[400px] flex items-center justify-center p-6 sm:p-8">
      <ApiKeysCard
        title={String(config.title)}
        description={String(config.description)}
        statusText={String(config.statusText)}
        autoPlay={Boolean(config.autoPlay)}
        theme={theme}
      />
    </div>
  );
}

export { ApiKeysCardDemo as Demo, ApiKeysCardDemo as demo };