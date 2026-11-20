"use client";

import React, { useEffect, useState } from "react";
import {
  FrequencySelector,
  type FrequencyOption,
  type FrequencySelectorTheme,
  type WeekdayOption,
} from "@/components/ui/component";

const settings = {
  label: "Frequency",
  defaultValue: "Daily",
  defaultDayOfWeek: "Tue",
  theme: "auto",
  disabled: false,
};

const VALID_FREQUENCIES: readonly FrequencyOption[] = [
  "Daily",
  "Weekly",
  "Monthly",
  "Yearly",
];

const VALID_WEEKDAYS: readonly WeekdayOption[] = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

const VALID_THEMES: readonly FrequencySelectorTheme[] = [
  "auto",
  "light",
  "dark",
];

function resolveFrequency(value: string): FrequencyOption {
  return VALID_FREQUENCIES.includes(value as FrequencyOption)
    ? (value as FrequencyOption)
    : "Daily";
}

function resolveWeekday(value: string): WeekdayOption {
  return VALID_WEEKDAYS.includes(value as WeekdayOption)
    ? (value as WeekdayOption)
    : "Tue";
}

function resolveTheme(value: string): FrequencySelectorTheme {
  return VALID_THEMES.includes(value as FrequencySelectorTheme)
    ? (value as FrequencySelectorTheme)
    : "auto";
}

export function FrequencySelectorDemo(props: Partial<typeof settings>) {
  const config = { ...settings, ...props };

  const safeFrequency = resolveFrequency(config.defaultValue);
  const safeWeekday = resolveWeekday(config.defaultDayOfWeek);
  const safeTheme = resolveTheme(config.theme);
  const safeLabel =
    typeof config.label === "string" && config.label.trim().length > 0
      ? config.label
      : "Frequency";

  const [frequency, setFrequency] = useState<FrequencyOption>(safeFrequency);
  const [dayOfWeek, setDayOfWeek] = useState<WeekdayOption>(safeWeekday);

  useEffect(() => {
    setFrequency(safeFrequency);
  }, [safeFrequency]);

  useEffect(() => {
    setDayOfWeek(safeWeekday);
  }, [safeWeekday]);

  return (
    <div className="w-full min-h-[280px] flex items-center justify-center p-6">
      <FrequencySelector
        label={safeLabel}
        value={frequency}
        dayOfWeek={dayOfWeek}
        theme={safeTheme}
        disabled={Boolean(config.disabled)}
        onChange={(next) => {
          setFrequency(next.frequency);
          setDayOfWeek(next.dayOfWeek);
        }}
      />
    </div>
  );
}

export { FrequencySelectorDemo as Demo, FrequencySelectorDemo as demo };
export default FrequencySelectorDemo;