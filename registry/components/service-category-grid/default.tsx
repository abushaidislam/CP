"use client";

import React from "react";
import {
  ServiceCategoryGrid,
  type ServiceCategoryTheme,
} from "@/components/ui/component";

const settings = {
  theme: "auto",
  columns: 2,
  ctaLabel: "Explore",
  showTags: true,
  showNoise: true,
  interactiveHover: true,
};

const VALID_THEMES: ServiceCategoryTheme[] = ["auto", "light", "dark"];
const VALID_COLUMNS: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4];

export function ServiceCategoryGridDemo(props: Partial<typeof settings>) {
  const config = { ...settings, ...props };

  const theme: ServiceCategoryTheme = VALID_THEMES.includes(
    config.theme as ServiceCategoryTheme
  )
    ? (config.theme as ServiceCategoryTheme)
    : "auto";

  const columns: 1 | 2 | 3 | 4 = VALID_COLUMNS.includes(
    config.columns as 1 | 2 | 3 | 4
  )
    ? (config.columns as 1 | 2 | 3 | 4)
    : 2;

  const ctaLabel =
    typeof config.ctaLabel === "string" && config.ctaLabel.trim().length > 0
      ? config.ctaLabel
      : "Explore";

  return (
    <div className="w-full min-h-[400px] flex items-center justify-center p-6 sm:p-8">
      <ServiceCategoryGrid
        theme={theme}
        columns={columns}
        ctaLabel={ctaLabel}
        showTags={Boolean(config.showTags)}
        showNoise={Boolean(config.showNoise)}
        interactiveHover={Boolean(config.interactiveHover)}
      />
    </div>
  );
}

export {
  ServiceCategoryGridDemo as demo,
  ServiceCategoryGridDemo as Demo,
};
export default ServiceCategoryGridDemo;