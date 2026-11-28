"use client";

import React from "react";
import {
  CloudDashboardShell,
  type ShellTheme,
  type WorkspacePlan,
} from "@/components/ui/component";

const settings = {
  theme: "auto",
  workspaceName: "nuvora-cloud",
  workspacePlan: "Hobby",
  projectName: "nuvora.app-main",
  userName: "Alex Rivera",
  hasUnreadNotifications: true,
};

const VALID_THEMES: ShellTheme[] = ["auto", "dark", "light"];
const VALID_PLANS: WorkspacePlan[] = ["Hobby", "Pro", "Enterprise"];

export function Demo(props: Partial<typeof settings>) {
  const config = { ...settings, ...props };

  const theme: ShellTheme = VALID_THEMES.includes(config.theme as ShellTheme)
    ? (config.theme as ShellTheme)
    : "auto";

  const workspacePlan: WorkspacePlan = VALID_PLANS.includes(
    config.workspacePlan as WorkspacePlan
  )
    ? (config.workspacePlan as WorkspacePlan)
    : "Hobby";

  return (
    <div className="w-full p-2 sm:p-4">
      <CloudDashboardShell
        theme={theme}
        workspaceName={config.workspaceName}
        workspacePlan={workspacePlan}
        projectName={config.projectName}
        userName={config.userName}
        hasUnreadNotifications={Boolean(config.hasUnreadNotifications)}
        className="rounded-xl border border-neutral-200 dark:border-[#1f1f1f]"
      />
    </div>
  );
}

export { Demo as demo };
export default Demo;