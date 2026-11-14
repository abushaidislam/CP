"use client";

import React from "react";
import { Radio, ShieldCheck, AlertCircle } from "lucide-react";

export interface LivePingStatusPillProps {
  status?: "healthy" | "degraded" | "evaluating";
  serviceName?: string;
  latencyMs?: number;
  region?: string;
}

export default function LivePingStatusPill({
  status = "healthy",
  serviceName = "Edge CDN",
  latencyMs = 12,
  region = "Global Edge",
}: LivePingStatusPillProps) {
  const statusConfig = {
    healthy: {
      color: "bg-emerald-500",
      pingColor: "bg-emerald-400",
      border: "border-emerald-500/30",
      bg: "bg-emerald-950/30 text-emerald-300",
      label: "Operational",
      icon: ShieldCheck,
    },
    degraded: {
      color: "bg-amber-500",
      pingColor: "bg-amber-400",
      border: "border-amber-500/30",
      bg: "bg-amber-950/30 text-amber-300",
      label: "Elevated Latency",
      icon: AlertCircle,
    },
    evaluating: {
      color: "bg-cyan-500",
      pingColor: "bg-cyan-400",
      border: "border-cyan-500/30",
      bg: "bg-cyan-950/30 text-cyan-300",
      label: "Probing",
      icon: Radio,
    },
  }[status];

  const Icon = statusConfig.icon;

  return (
    <div
      className={
        "inline-flex items-center gap-2.5 rounded-full border px-3.5 py-1.5 text-xs font-medium shadow-sm backdrop-blur-md transition-all font-sans " +
        statusConfig.border + " " +
        statusConfig.bg
      }
    >
      {/* Animated Ping Radar */}
      <span className="relative flex h-2 w-2">
        <span
          className={"absolute inline-flex h-full w-full animate-ping rounded-full " + statusConfig.pingColor + " opacity-75"}
        />
        <span
          className={"relative inline-flex h-2 w-2 rounded-full " + statusConfig.color}
        />
      </span>

      {/* Service Name */}
      <span className="font-semibold text-zinc-100">{serviceName}</span>

      <span className="h-3 w-[1px] bg-zinc-700/60" />

      {/* Status Label */}
      <span className="flex items-center gap-1">
        <Icon className="h-3.5 w-3.5" />
        <span>{statusConfig.label}</span>
      </span>

      <span className="h-3 w-[1px] bg-zinc-700/60" />

      {/* Telemetry latency counter */}
      <span className="font-mono text-zinc-400">
        {latencyMs}ms <span className="text-[10px] text-zinc-500">({region})</span>
      </span>
    </div>
  );
}
