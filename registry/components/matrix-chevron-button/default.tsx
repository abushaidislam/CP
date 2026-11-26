"use client";

import React from "react";
import {
  MatrixChevronButton,
  type MatrixChevronAccent,
  type MatrixChevronSize,
} from "@/components/ui/component";

const settings = {
  label: "Book a demo",
  accent: "lime",
  size: "md",
  waveSpeed: 1.6,
  disabled: false,
};

const VALID_ACCENTS: MatrixChevronAccent[] = ["lime", "amber", "cyan", "coral"];
const VALID_SIZES: MatrixChevronSize[] = ["sm", "md", "lg"];

export default function MatrixChevronButtonDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const accent: MatrixChevronAccent = VALID_ACCENTS.includes(
    config.accent as MatrixChevronAccent
  )
    ? (config.accent as MatrixChevronAccent)
    : "lime";

  const size: MatrixChevronSize = VALID_SIZES.includes(
    config.size as MatrixChevronSize
  )
    ? (config.size as MatrixChevronSize)
    : "md";

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
        accent={accent}
        size={size}
        waveSpeed={waveSpeed}
        disabled={Boolean(config.disabled)}
      />
    </div>
  );
}

export { MatrixChevronButtonDemo as Demo, MatrixChevronButtonDemo as demo };