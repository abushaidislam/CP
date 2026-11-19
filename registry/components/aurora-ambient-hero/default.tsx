"use client";

import React, { useState } from "react";
import AuroraAmbientHero from "../components/ui/component";

const settings = {
  badge: "Component Studio 2.0 Released",
  titlePrefix: "Build luminous interfaces with",
  titleGradient: "reactive fluid dynamics",
  primaryCtaText: "Start Building",
  secondaryCtaText: "View Live Demo",
};

export default function Demo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props };
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="min-h-full w-full flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
      <AuroraAmbientHero
        badge={s.badge}
        titlePrefix={s.titlePrefix}
        titleGradient={s.titleGradient}
        primaryCtaText={s.primaryCtaText}
        secondaryCtaText={s.secondaryCtaText}
        onPrimaryCta={() => setMessage("Primary Action triggered: Welcome aboard!")}
        onSecondaryCta={() => setMessage("Workflow preview video opened.")}
      />
      {message && (
        <div className="mt-4 rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-4 py-2 text-xs font-medium text-indigo-300">
          {message}
        </div>
      )}
    </div>
  );
}
