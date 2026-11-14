import React from "react";
import { Activity } from "lucide-react";

export interface StatusRadarBadgeProps {
  status?: "online" | "syncing" | "idle";
  label?: string;
  count?: number;
}

export default function StatusRadarBadge({
  status = "online",
  label = "Operational",
  count = 99.98,
}: StatusRadarBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/80 px-4 py-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 backdrop-blur-md shadow-lg shadow-black/5 dark:shadow-black/40">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span className="tracking-wide">{label}</span>
      <span className="h-3 w-[1px] bg-zinc-200 dark:bg-zinc-800" />
      <span className="font-mono text-zinc-500 dark:text-zinc-400">{count}% SLA</span>
    </div>
  );
}
