"use client";

import React, { useState } from "react";
import { CheckCircle2, Plus, Search } from "lucide-react";
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

const NAV_TABS = [
  "Security",
  "Notifications",
  "Apps",
  "Branding",
  "Refer a friend",
  "Sharing",
];

export default function AccountSwitcherMenuDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };
  const [activeTab, setActiveTab] = useState("Security");
  const [twoStepEnabled, setTwoStepEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

  const isDarkForced = theme === "dark";
  const isLightForced = theme === "light";

  const shellClass = isDarkForced
    ? "border-[#2A2A2E] bg-[#161618] text-[#F4F4F5] shadow-[0_32px_72px_-20px_rgba(0,0,0,0.65)]"
    : isLightForced
      ? "border-zinc-200 bg-white text-zinc-900 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.12)]"
      : "border-zinc-200 bg-white text-zinc-900 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.12)] dark:border-[#2A2A2E] dark:bg-[#161618] dark:text-[#F4F4F5] dark:shadow-[0_32px_72px_-20px_rgba(0,0,0,0.65)]";

  const borderMutedClass = isDarkForced
    ? "border-[#232326]"
    : isLightForced
      ? "border-zinc-200/80"
      : "border-zinc-200/80 dark:border-[#232326]";

  const mutedTextClass = isDarkForced
    ? "text-[#8E8D93]"
    : isLightForced
      ? "text-zinc-500"
      : "text-zinc-500 dark:text-[#8E8D93]";

  return (
    <div className="flex min-h-[640px] w-full items-center justify-center px-4 py-8 sm:px-6">
      <div
        className={`relative w-full max-w-[880px] rounded-[20px] border transition-colors ${shellClass}`}
      >
        {/* Top App Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-6 pb-5 sm:px-8">
          <div className="min-w-0">
            <h2 className="text-[18px] font-semibold tracking-tight">
              Account settings
            </h2>
            <p className={`mt-1 text-[13px] ${mutedTextClass}`}>
              Manage your security and workspace preferences here.
            </p>
          </div>

          {/* Right Toolbar + Account Switcher */}
          <div className="flex items-center gap-2.5">
            <div
              className={`hidden h-9 w-[210px] items-center gap-2 rounded-[10px] border px-3 sm:flex ${
                isDarkForced
                  ? "border-[#2A2A2E] bg-[#141316] text-[#D4D4D8]"
                  : isLightForced
                    ? "border-zinc-200 bg-zinc-50 text-zinc-800"
                    : "border-zinc-200 bg-zinc-50 text-zinc-800 dark:border-[#2A2A2E] dark:bg-[#141316] dark:text-[#D4D4D8]"
              }`}
            >
              <Search
                className={`h-4 w-4 shrink-0 ${mutedTextClass}`}
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                aria-label="Search settings"
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-current placeholder:opacity-55"
              />
            </div>

            <button
              type="button"
              className={`inline-flex h-9 items-center gap-1.5 rounded-[10px] border px-3.5 text-[13px] font-medium transition-colors ${
                isDarkForced
                  ? "border-[#2D2D31] bg-[#1F1F22] text-[#E4E4E6] hover:bg-[#27272B]"
                  : isLightForced
                    ? "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
                    : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-[#2D2D31] dark:bg-[#1F1F22] dark:text-[#E4E4E6] dark:hover:bg-[#27272B]"
              }`}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
              <span>Invite</span>
            </button>

            <button
              type="button"
              className="inline-flex h-9 items-center rounded-[10px] bg-[#8C7CFC] px-4 text-[13px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-colors hover:bg-[#7D6CF6]"
            >
              Upgrade
            </button>

            <AccountSwitcherMenu
              theme={theme}
              defaultOpen={Boolean(config.defaultOpen)}
              align={align}
              showHandle={Boolean(config.showHandle)}
              showSignOutAll={Boolean(config.showSignOutAll)}
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          className={`flex items-center gap-6 overflow-x-auto border-b px-6 sm:px-8 ${borderMutedClass}`}
        >
          {NAV_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`relative shrink-0 pb-3 text-[13px] font-medium transition-colors ${
                  isActive
                    ? isDarkForced
                      ? "text-white"
                      : isLightForced
                        ? "text-zinc-900"
                        : "text-zinc-900 dark:text-white"
                    : `${mutedTextClass} hover:opacity-85`
                }`}
              >
                {tab}
                {isActive && (
                  <span className="absolute right-0 bottom-0 left-0 h-[2px] rounded-full bg-[#8C7CFC]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Settings Content Area */}
        <div className="px-6 py-6 sm:px-8">
          <div className={`border-b pb-5 ${borderMutedClass}`}>
            <p className={`text-[13px] ${mutedTextClass}`}>
              Review your security settings regularly and update your password.
            </p>
          </div>

          {/* Password Row */}
          <div
            className={`flex flex-wrap items-center justify-between gap-4 border-b py-6 ${borderMutedClass}`}
          >
            <div className="flex flex-wrap items-center gap-4">
              <span
                className={`text-[13px] font-medium sm:w-32 ${mutedTextClass}`}
              >
                Password
              </span>
              <div className="flex items-center gap-3">
                <span className="tracking-[0.22em] text-[13px] select-none">
                  ••••••••••••••
                </span>
                <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#66C68D]">
                  <CheckCircle2
                    className="h-4 w-4"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  Very secure
                </span>
              </div>
            </div>
          </div>

          {/* Two-step Verification Row */}
          <div
            className={`flex flex-wrap items-center justify-between gap-4 border-b py-6 ${borderMutedClass}`}
          >
            <div className="flex items-center gap-4">
              <span
                className={`hidden text-[13px] font-medium sm:inline-block sm:w-32 ${mutedTextClass}`}
              >
                Authentication
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={twoStepEnabled}
                onClick={() => setTwoStepEnabled((prev) => !prev)}
                className="inline-flex items-center gap-3 focus:outline-none"
              >
                <span
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    twoStepEnabled
                      ? "bg-[#8C7CFC]"
                      : isDarkForced
                        ? "bg-[#323236]"
                        : isLightForced
                          ? "bg-zinc-200"
                          : "bg-zinc-200 dark:bg-[#323236]"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      twoStepEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </span>
                <span className="text-[14px] font-medium">
                  Two-step verification
                </span>
              </button>
            </div>
          </div>

          {/* Active Sessions Footer Hint */}
          <div className="pt-6 pb-8">
            <p className={`text-[13px] ${mutedTextClass}`}>
              Devices currently signed in to your account. Remove any
              unauthorized devices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export { AccountSwitcherMenuDemo as Demo, AccountSwitcherMenuDemo as demo };
