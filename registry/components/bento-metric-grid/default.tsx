"use client";

import React, { useState } from "react";
import BentoMetricGrid from "./component";

export default function Demo() {
  const [selected, setSelected] = useState<string>("latency");

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
      <BentoMetricGrid onSelectMetric={(id) => setSelected(id)} />
      <div className="mt-4 font-sans text-xs text-zinc-500 dark:text-zinc-400">
        Active Node Inspection: <span className="font-mono text-indigo-400 font-semibold">{selected}</span>
      </div>
    </div>
  );
}
