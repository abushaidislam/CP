"use client";

import React from "react";
import { TactilePagination } from "@/components/ui/component";

const settings = {
  totalPages: 10,
  defaultPage: 1,
  defaultPageSize: 5,
  showPageSizeSelector: true,
  siblingCount: 1,
  theme: "auto",
  disabled: false,
};

const VALID_THEMES = ["auto", "light", "dark"] as const;
type ThemeOption = (typeof VALID_THEMES)[number];

export default function TactilePaginationDemo(props: Partial<typeof settings>) {
  const config = {
    ...settings,
    ...props,
  };

  const theme: ThemeOption = VALID_THEMES.includes(config.theme as ThemeOption)
    ? (config.theme as ThemeOption)
    : "auto";

  const totalPages =
    typeof config.totalPages === "number" && Number.isFinite(config.totalPages)
      ? Math.max(1, Math.min(100, Math.floor(config.totalPages)))
      : 10;

  const defaultPage =
    typeof config.defaultPage === "number" &&
    Number.isFinite(config.defaultPage)
      ? Math.max(1, Math.min(totalPages, Math.floor(config.defaultPage)))
      : 1;

  const siblingCount =
    typeof config.siblingCount === "number" &&
    Number.isFinite(config.siblingCount)
      ? Math.max(0, Math.min(3, Math.floor(config.siblingCount)))
      : 1;

  const canvasBg =
    theme === "light"
      ? "bg-[#f3f3f3]"
      : theme === "dark"
      ? "bg-[#111113]"
      : "bg-[#f3f3f3] dark:bg-[#111113]";

  return (
    <div
      className={`flex min-h-[360px] w-full items-center justify-center p-8 transition-colors duration-300 ${canvasBg}`}
    >
      <TactilePagination
        totalPages={totalPages}
        defaultPage={defaultPage}
        defaultPageSize={
          typeof config.defaultPageSize === "number"
            ? config.defaultPageSize
            : 5
        }
        showPageSizeSelector={Boolean(config.showPageSizeSelector)}
        siblingCount={siblingCount}
        theme={theme}
        disabled={Boolean(config.disabled)}
      />
    </div>
  );
}