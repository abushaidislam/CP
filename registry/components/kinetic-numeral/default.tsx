"use client";

import React from "react";
import {
  KineticNumeral,
  type KineticNumeralDigit,
  type KineticNumeralPalette,
  type KineticNumeralSequence,
} from "@/components/ui/component";

const settings = {
  digit: 2,
  autoPlay: true,
  sequence: "pingpong",
  duration: 850,
  palette: "glacial",
  showHeader: true,
};

const VALID_PALETTES: readonly KineticNumeralPalette[] = [
  "glacial",
  "auto",
  "obsidian",
  "paper",
];

const VALID_SEQUENCES: readonly KineticNumeralSequence[] = ["pingpong", "count"];

export default function KineticNumeralDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const digit = Math.min(
    9,
    Math.max(0, Math.round(Number(config.digit) || 0))
  ) as KineticNumeralDigit;

  const palette: KineticNumeralPalette = VALID_PALETTES.includes(
    config.palette as KineticNumeralPalette
  )
    ? (config.palette as KineticNumeralPalette)
    : "glacial";

  const sequence: KineticNumeralSequence = VALID_SEQUENCES.includes(
    config.sequence as KineticNumeralSequence
  )
    ? (config.sequence as KineticNumeralSequence)
    : "pingpong";

  const duration = Number.isFinite(Number(config.duration))
    ? Math.min(2600, Math.max(200, Number(config.duration)))
    : 850;

  return (
    <div className="flex min-h-[480px] w-full items-center justify-center p-6">
      <KineticNumeral
        digit={digit}
        autoPlay={Boolean(config.autoPlay)}
        sequence={sequence}
        duration={duration}
        palette={palette}
        showHeader={Boolean(config.showHeader)}
      />
    </div>
  );
}

export { KineticNumeralDemo as Demo, KineticNumeralDemo as demo };