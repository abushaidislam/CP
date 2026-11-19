"use client";

import React from "react";
import Component from "../components/ui/component";

const settings = {
  title: "Split Accordion",
  accentColor: "#6366f1",
  showBadge: true,
};

export default function Demo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props };

  return (
    <div className="flex min-h-[300px] w-full items-center justify-center p-6">
      <Component
        title={s.title}
        accentColor={s.accentColor}
        showBadge={s.showBadge}
      />
    </div>
  );
}
