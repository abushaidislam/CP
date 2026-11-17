"use client";

import React, { useEffect, useState } from "react";
import { ThermalDialWidget } from "@/components/ui/component";

/**
 * 21st.dev reads this top-level settings object and creates
 * the interactive Controls panel beside the component preview.
 *
 * Keep these values literal so the registry can detect them.
 */
const settings = {
  value: 38,
  min: 16,
  max: 45,
  step: 1,
  label: "Summer",
  autoSeason: true,
  variant: "ember",
  disabled: false,
  scale: 0.86,
  unit: "C",
};

const VALID_VARIANTS: ThermalVariant[] = [
  "ember",
  "solar",
  "amber",
  "frost",
  "auto",
];

export default function ThermalDialWidgetDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  // Keep the dial interactive while still allowing the 21st.dev
  // Controls panel to update its initial temperature.
  const [temperature, setTemperature] = useState(config.value);

  useEffect(() => {
    setTemperature(config.value);
  }, [config.value]);

  // Guard text-field values so invalid entries cannot break the palette.
  const variant: ThermalVariant = VALID_VARIANTS.includes(
    config.variant as ThermalVariant
  )
    ? (config.variant as ThermalVariant)
    : "ember";

  const unit: "C" | "F" = config.unit === "F" ? "F" : "C";

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-black text-zinc-100 selection:bg-orange-500/30">
      <main className="flex flex-1 items-center justify-center p-4">
        <ThermalDialWidget
          value={temperature}
          min={config.min}
          max={config.max}
          step={config.step}
          label={config.label}
          autoSeason={config.autoSeason}
          variant={variant}
          disabled={config.disabled}
          scale={config.scale}
          unit={unit}
          onChange={(nextTemperature) => {
            setTemperature(nextTemperature);
          }}
        />
      </main>
    </div>
  );
}
