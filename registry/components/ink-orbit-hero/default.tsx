"use client";

import React from "react";
import Component from "../components/ui/component";

const settings = {
  theme: "auto" as "light" | "dark" | "auto",
  titleTop: "Build Faster With",
  titleAccent: ["Intelligent Automation", "Adaptive Workflows", "Autonomous Agents"],
  primaryCta: "Start Free Trial",
  secondaryCta: "Watch Demo",
  sculptureSeed: 7,
  sculptureLabel: "FORGE · 3D",
};

export default function Demo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props };

  return (
    <div className="w-full min-h-screen">
      <Component
        theme={s.theme}
        titleTop={s.titleTop}
        titleAccent={s.titleAccent}
        primaryCta={s.primaryCta}
        secondaryCta={s.secondaryCta}
        sculptureSeed={s.sculptureSeed}
        sculptureLabel={s.sculptureLabel}
        minHeight="min(620px, 100%)"
      />
    </div>
  );
}
