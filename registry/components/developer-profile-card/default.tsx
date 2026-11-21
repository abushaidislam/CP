"use client";

import React from "react";
import { DeveloperProfileCard } from "@/components/ui/component";

const settings = {
  name: "Prasanjit Dey",
  role: "Software Engineer",
  statusText: "Available for work",
  bannerText: "Currently High on Creativity",
  email: "prasanjit@example.com",
  liveClock: false,
};

export default function DeveloperProfileCardDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  return (
    <div className="w-full min-h-[340px] flex items-center justify-center p-6 sm:p-10">
      <DeveloperProfileCard
        name={config.name}
        role={config.role}
        statusText={config.statusText}
        bannerText={config.bannerText}
        email={config.email}
        liveClock={Boolean(config.liveClock)}
      />
    </div>
  );
}

export { DeveloperProfileCardDemo as Demo, DeveloperProfileCardDemo as demo };