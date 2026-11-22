"use client";

import React from "react";
import { ProjectWorkflowTree, type WorkflowTheme } from "@/components/ui/component";

const settings = {
  clientName: "Nuvora",
  taskTitle: "Web Design",
  animateFlow: true,
  interactive: true,
  showGrid: true,
  theme: "auto",
};

const VALID_THEMES: WorkflowTheme[] = ["auto", "light", "dark"];

export default function ProjectWorkflowTreeDemo(
  props: Partial<typeof settings>
) {
  const config = { ...settings, ...props };

  const theme: WorkflowTheme = VALID_THEMES.includes(config.theme as WorkflowTheme)
    ? (config.theme as WorkflowTheme)
    : "auto";

  return (
    <div className="flex min-h-[620px] w-full items-center justify-center p-4 sm:p-8">
      <ProjectWorkflowTree
        clientName={config.clientName}
        taskTitle={config.taskTitle}
        animateFlow={Boolean(config.animateFlow)}
        interactive={Boolean(config.interactive)}
        showGrid={Boolean(config.showGrid)}
        theme={theme}
      />
    </div>
  );
}

export { ProjectWorkflowTreeDemo as Demo, ProjectWorkflowTreeDemo as demo };