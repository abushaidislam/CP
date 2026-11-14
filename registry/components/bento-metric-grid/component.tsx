"use client";

import React, { useState } from "react";
import { TrendingUp, Server, ArrowUpRight } from "lucide-react";

export interface MetricItem {
  id: string;
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  history: number[];
}

export interface BentoMetricGridProps {
  title?: string;
  subtitle?: string;
  metrics?: MetricItem[];
  onSelectMetric?: (metricId: string) => void;
}

const DEFAULT_METRICS: MetricItem[] = [
  {
    id: "latency",
    label: "Global P99 Latency",
    value: "28.4 ms",
    change: "-14.2%",
    isPositive: true,
    history: [42, 38, 35, 31, 29, 28, 28.4],
  },
  {
    id: "throughput",
    label: "Stream Throughput",
    value: "148.6k req/s",
    change: "+28.5%",
    isPositive: true,
    history: [100, 115, 120, 132, 140, 145, 148.6],
  },
  {
    id: "compute",
    label: "Cluster Load",
    value: "42.1%",
    change: "+3.2%",
    isPositive: false,
    history: [30, 32, 35, 38, 40, 41, 42.1],
  },
  {
    id: "cache",
    label: "Edge Cache Hit Rate",
    value: "99.82%",
    change: "+0.14%",
    isPositive: true,
    history: [98.5, 98.9, 99.1, 99.4, 99.6, 99.7, 99.82],
  },
];

export default function BentoMetricGrid({
  title = "Telemetry Node Cluster",
  subtitle = "Real-time edge metrics and distributed health signals",
  metrics = DEFAULT_METRICS,
  onSelectMetric,
}: BentoMetricGridProps) {
  const [selectedId, setSelectedId] = useState<string>(metrics[0]?.id || "latency");

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/90 p-6 shadow-xl backdrop-blur-xl font-sans transition-all">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-mono text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
              LIVE TELEMETRY
            </span>
          </div>
          <h3 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {title}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1 text-xs text-zinc-600 dark:text-zinc-400">
          <Server className="h-3.5 w-3.5 text-indigo-500" />
          <span className="font-mono">us-east-1</span>
        </div>
      </div>

      {/* Grid of Bento Cards */}
      <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {metrics.map((m) => {
          const isSelected = selectedId === m.id;
          const minVal = Math.min(...m.history);
          const maxVal = Math.max(...m.history);
          const range = maxVal - minVal || 1;

          // Generate sparkline SVG coordinates
          const points = m.history
            .map((val, idx) => {
              const x = (idx / (m.history.length - 1)) * 100;
              const y = 30 - ((val - minVal) / range) * 24;
              return x + "," + y;
            })
            .join(" ");

          return (
            <div
              key={m.id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              onClick={() => {
                setSelectedId(m.id);
                onSelectMetric?.(m.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedId(m.id);
                  onSelectMetric?.(m.id);
                }
              }}
              className={
                "group relative cursor-pointer rounded-xl border p-4 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 " +
                (isSelected
                  ? "border-indigo-500 bg-indigo-50/50 dark:border-indigo-500/60 dark:bg-indigo-950/20 shadow-sm"
                  : "border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/80")
              }
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {m.label}
                </span>
                <ArrowUpRight
                  className={
                    "h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 " +
                    (isSelected ? "text-indigo-500 dark:text-indigo-400" : "")
                  }
                />
              </div>

              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {m.value}
                </span>
                <span
                  className={
                    "inline-flex items-center gap-0.5 text-xs font-semibold " +
                    (m.isPositive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400")
                  }
                >
                  <TrendingUp className="h-3 w-3" />
                  {m.change}
                </span>
              </div>

              {/* Sparkline Graphic */}
              <div className="mt-3 h-8 w-full">
                <svg viewBox="0 0 100 32" className="h-full w-full overflow-visible">
                  <polyline
                    fill="none"
                    stroke={isSelected ? "#6366f1" : "#10b981"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
