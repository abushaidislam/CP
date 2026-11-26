"use client";

import React, { useEffect, useState } from "react";
import {
  AvatarGenderToggle,
  type AvatarGenderToggleSize,
  type AvatarGenderValue,
} from "@/components/ui/component";

const settings = {
  defaultValue: "female",
  size: "md",
  showLabels: true,
  idleAnimations: true,
  disabled: false,
};

const VALID_VALUES: AvatarGenderValue[] = ["female", "male"];
const VALID_SIZES: AvatarGenderToggleSize[] = ["sm", "md", "lg"];

export default function AvatarGenderToggleDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const safeDefaultValue: AvatarGenderValue = VALID_VALUES.includes(
    config.defaultValue as AvatarGenderValue
  )
    ? (config.defaultValue as AvatarGenderValue)
    : "female";

  const safeSize: AvatarGenderToggleSize = VALID_SIZES.includes(
    config.size as AvatarGenderToggleSize
  )
    ? (config.size as AvatarGenderToggleSize)
    : "md";

  const [value, setValue] = useState<AvatarGenderValue>(safeDefaultValue);

  useEffect(() => {
    setValue(safeDefaultValue);
  }, [safeDefaultValue]);

  return (
    <div className="w-full min-h-[380px] flex items-center justify-center p-8">
      <AvatarGenderToggle
        value={value}
        onValueChange={setValue}
        size={safeSize}
        showLabels={Boolean(config.showLabels)}
        idleAnimations={Boolean(config.idleAnimations)}
        disabled={Boolean(config.disabled)}
      />
    </div>
  );
}

export { AvatarGenderToggleDemo as Demo, AvatarGenderToggleDemo as demo };