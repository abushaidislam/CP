"use client";

import React from "react";
import { ApiKeysCard, type AuthBentoTheme } from "@/components/ui/component";

const settings = {
  ssoTitle: "Social Sign-On",
  ssoDescription:
    "Add high-conversion Social Sign-on (SSO) to your application in minutes. 20+ options and growing.",
  title: "API Keys",
  description:
    "Give every user secure, production-ready API keys without building any of the underlying boilerplate code or UI.",
  statusText: "Authenticating...",
  autoPlay: false,
  theme: "auto",
};

const VALID_THEMES: AuthBentoTheme[] = ["auto", "dark", "light"];

export default function ApiKeysCardDemo(props: Partial<typeof settings>) {
  const config = { ...settings, ...props };

  const theme: AuthBentoTheme = VALID_THEMES.includes(
    config.theme as AuthBentoTheme
  )
    ? (config.theme as AuthBentoTheme)
    : "auto";

  return (
    <div className="w-full min-h-[400px] flex items-center justify-center p-6 sm:p-8">
      <ApiKeysCard
        ssoTitle={String(config.ssoTitle)}
        ssoDescription={String(config.ssoDescription)}
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
