"use client";

import React from "react";
import { IridescentOrb, type OrbState } from "@/components/ui/component";

const settings = {
  size: 320,
  state: "idle",
  speed: 1,
  intensity: 1,
  interactive: true,
};

const VALID_STATES: OrbState[] = ["idle", "listening", "thinking", "speaking"];

export default function IridescentOrbDemo(props: Partial<typeof settings>) {
  const config = {
    ...settings,
    ...props,
  };

  const orbState: OrbState = VALID_STATES.includes(config.state as OrbState)
    ? (config.state as OrbState)
    : "idle";

  const size =
    typeof config.size === "number" && Number.isFinite(config.size)
      ? Math.min(560, Math.max(120, config.size))
      : 320;

  const speed =
    typeof config.speed === "number" && Number.isFinite(config.speed)
      ? Math.min(2.5, Math.max(0.2, config.speed))
      : 1;

  const intensity =
    typeof config.intensity === "number" && Number.isFinite(config.intensity)
      ? Math.min(1.6, Math.max(0.4, config.intensity))
      : 1;

  const interactive = Boolean(config.interactive);

  return (
    <div className="flex min-h-[420px] w-full items-center justify-center p-8">
      <IridescentOrb
        size={size}
        state={orbState}
        speed={speed}
        intensity={intensity}
        interactive={interactive}
      />
    </div>
  );
}

export { IridescentOrbDemo as Demo, IridescentOrbDemo as demo };