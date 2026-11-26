"use client";

import React from "react";
import {
  AccountSwitcherMenu,
  type AccountSwitcherAlign,
  type AccountSwitcherTheme,
} from "@/components/ui/component";

const settings = {
  theme: "auto",
  defaultOpen: true,
  align: "end",
  showHandle: true,
  showSignOutAll: true,
};

const VALID_THEMES: AccountSwitcherTheme[] = ["auto", "dark", "light"];
const VALID_ALIGNS: AccountSwitcherAlign[] = ["start", "center", "end"];

export default function AccountSwitcherMenuDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const theme: AccountSwitcherTheme = VALID_THEMES.includes(
    config.theme as AccountSwitcherTheme
  )
    ? (config.theme as AccountSwitcherTheme)
    : "auto";

  const align: AccountSwitcherAlign = VALID_ALIGNS.includes(
    config.align as AccountSwitcherAlign
  )
    ? (config.align as AccountSwitcherAlign)
    : "end";

  return (
    <div className="flex min-h-[540px] w-full items-start justify-center px-4 pt-10">
      <AccountSwitcherMenu
        theme={theme}
        defaultOpen={Boolean(config.defaultOpen)}
        align={align}
        showHandle={Boolean(config.showHandle)}
        showSignOutAll={Boolean(config.showSignOutAll)}
      />
    </div>
  );
}

export { AccountSwitcherMenuDemo as Demo, AccountSwitcherMenuDemo as demo };