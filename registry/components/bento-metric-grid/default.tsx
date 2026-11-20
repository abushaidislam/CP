"use client";

import React, { useState } from "react";
import BentoMetricGrid from "../components/ui/component";

const settings = {
  title: "System Telemetry Matrix",
  subtitle: "Real-time edge performance & cluster health",
  showInspector: true,
};

export default function Demo(props: Partial<typeof settings>) {
  const s = { ...settings, ...props };
  const [selected, setSelected] = useState<string>("latency");

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
      <BentoMetricGrid
        title={s.title}
        subtitle={s.subtitle}
        onSelectMetric={(id) => setSelected(id)}
      />
      {s.showInspector && (
        <div className="mt-4 font-sans text-xs text-zinc-500 dark:text-zinc-400">
          Active Node Inspection: <span className="font-mono text-indigo-400 font-semibold">{selected}</span>
        </div>
      )}
    </div>
  );
}
