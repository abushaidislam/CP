"use client";

import React from "react";
import {
  MatrixChevronButton,
  type MatrixChevronSize,
  type MatrixChevronTrigger,
} from "@/components/ui/component";

const settings = {
  label: "Book a demo",
  accentColor: "#d2fe00",
  chassisColor: "#1d2129",
  size: "md",
  trigger: "click",
  waveSpeed: 1.6,
  disabled: false,
};

const VALID_SIZES: MatrixChevronSize[] = ["sm", "md", "lg"];
const VALID_TRIGGERS: MatrixChevronTrigger[] = ["click", "hover"];

export default function MatrixChevronButtonDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const size: MatrixChevronSize = VALID_SIZES.includes(
    config.size as MatrixChevronSize
  )
    ? (config.size as MatrixChevronSize)
    : "md";

  const trigger: MatrixChevronTrigger = VALID_TRIGGERS.includes(
    config.trigger as MatrixChevronTrigger
  )
    ? (config.trigger as MatrixChevronTrigger)
    : "click";

  const waveSpeed =
    typeof config.waveSpeed === "number" && Number.isFinite(config.waveSpeed)
      ? Math.min(Math.max(config.waveSpeed, 0.5), 5)
      : 1.6;

  return (
    <div className="flex min-h-[320px] w-full items-center justify-center p-8">
      <MatrixChevronButton
        label={
          typeof config.label === "string" && config.label.trim()
            ? config.label
            : "Book a demo"
        }
        accentColor={
          typeof config.accentColor === "string"
            ? config.accentColor
            : "#d2fe00"
        }
        chassisColor={
          typeof config.chassisColor === "string"
            ? config.chassisColor
            : "#1d2129"
        }
        size={size}
        trigger={trigger}
        waveSpeed={waveSpeed}
        disabled={Boolean(config.disabled)}
      />
    </div>
  );
}

export { MatrixChevronButtonDemo as Demo, MatrixChevronButtonDemo as demo };
