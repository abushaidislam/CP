"use client";

import * as React from "react";
import {
  LuminousSplitButton,
  type SplitButtonMenuItem,
  type SplitButtonSize,
  type SplitButtonTheme,
  type SplitButtonVariant,
} from "@/components/ui/component";

const settings = {
  label: "New",
  size: "md",
  variant: "violet",
  glow: true,
  disabled: false,
  theme: "auto",
};

const VALID_SIZES: SplitButtonSize[] = ["sm", "md", "lg"];
const VALID_VARIANTS: SplitButtonVariant[] = [
  "violet",
  "indigo",
  "emerald",
  "rose",
];
const VALID_THEMES: SplitButtonTheme[] = ["auto", "dark", "light"];

export default function LuminousSplitButtonDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };
  const [lastAction, setLastAction] = React.useState<string | null>(null);

  const size: SplitButtonSize = VALID_SIZES.includes(
    config.size as SplitButtonSize
  )
    ? (config.size as SplitButtonSize)
    : "md";

  const variant: SplitButtonVariant = VALID_VARIANTS.includes(
    config.variant as SplitButtonVariant
  )
    ? (config.variant as SplitButtonVariant)
    : "violet";

  const theme: SplitButtonTheme = VALID_THEMES.includes(
    config.theme as SplitButtonTheme
  )
    ? (config.theme as SplitButtonTheme)
    : "auto";

  const label =
    typeof config.label === "string" && config.label.trim().length > 0
      ? config.label
      : "New";

  const handlePrimaryClick = () => {
    setLastAction(`Created "${label}"`);
  };

  const handleSelectItem = (item: SplitButtonMenuItem) => {
    setLastAction(`Selected: ${item.label}`);
  };

  return (
    <div className="flex min-h-[340px] w-full flex-col items-center justify-center gap-4 p-8">
      <LuminousSplitButton
        label={label}
        size={size}
        variant={variant}
        glow={Boolean(config.glow)}
        disabled={Boolean(config.disabled)}
        theme={theme}
        onPrimaryClick={handlePrimaryClick}
        onSelectItem={handleSelectItem}
      />
      <p
        aria-live="polite"
        className="min-h-[18px] text-xs font-medium tracking-tight text-zinc-500 dark:text-zinc-400"
      >
        {lastAction ?? ""}
      </p>
    </div>
  );
}

export {
  LuminousSplitButtonDemo as Demo,
  LuminousSplitButtonDemo as demo,
};