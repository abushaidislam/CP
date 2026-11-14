"use client";

import React, { useState } from "react";
import { ArrowRight, Sparkles, Play, ShieldCheck, Zap } from "lucide-react";

export interface AuroraAmbientHeroProps {
  badge?: string;
  titlePrefix?: string;
  titleGradient?: string;
  description?: string;
  primaryCtaText?: string;
  secondaryCtaText?: string;
  onPrimaryCta?: () => void;
  onSecondaryCta?: () => void;
  metrics?: Array<{ label: string; value: string }>;
}

export default function AuroraAmbientHero({
  badge = "Component Studio 2.0 Released",
  titlePrefix = "Build luminous interfaces with",
  titleGradient = "reactive fluid dynamics",
  description = "A hyper-optimized design engineering environment with real-time AST synthesis, interactive previews, and next-generation motion primitives.",
  primaryCtaText = "Start Crafting Free",
  secondaryCtaText = "Explore Interactive Demos",
  onPrimaryCta,
  onSecondaryCta,
  metrics = [
    { label: "Sub-millisecond", value: "<1.2ms AST latency" },
    { label: "Production Grade", value: "99.98% uptime" },
    { label: "Developer Loved", value: "45k+ components" },
  ],
}: AuroraAmbientHeroProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="relative isolate w-full min-h-[520px] overflow-hidden rounded-3xl bg-zinc-950 px-6 py-16 text-zinc-100 sm:px-12 sm:py-24 font-sans">
      {/* Background Aurora Mesh Gradients */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-600/30 via-purple-500/30 to-pink-500/20 blur-3xl animate-aurora"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 right-10 -z-10 h-[400px] w-[500px] rounded-full bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-purple-600/20 blur-3xl"
      />

      {/* Decorative Grid Lines */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,#27272a15_1px,transparent_1px),linear-gradient(to_bottom,#27272a15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
      />

      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        {/* Release Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-medium text-indigo-300 backdrop-blur-md transition-colors hover:border-indigo-400/50">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
          <span>{badge}</span>
          <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-400" />
        </div>

        {/* Hero Title */}
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
          <span>{titlePrefix} </span>
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            {titleGradient}
          </span>
        </h1>

        {/* Lede Description */}
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
          {description}
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={onPrimaryCta}
            className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[1px] font-medium text-white shadow-lg shadow-indigo-500/25 transition-transform duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
          >
            <span className="flex items-center gap-2 rounded-[11px] bg-zinc-950/80 px-6 py-2.5 backdrop-blur-md transition-colors group-hover:bg-zinc-900/60">
              <Zap className="h-4 w-4 text-amber-300" />
              <span>{primaryCtaText}</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(!isPlaying);
              onSecondaryCta?.();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-5 py-2.5 text-sm font-medium text-zinc-200 backdrop-blur-sm transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-800/80 hover:text-white active:scale-95 focus:outline-none focus:ring-2 focus:ring-zinc-600"
          >
            <Play className={"h-4 w-4 text-zinc-400 transition-transform " + (isPlaying ? "scale-110 text-indigo-400" : "")} />
            <span>{secondaryCtaText}</span>
          </button>
        </div>

        {/* Metrics Row */}
        <div className="mt-14 grid w-full grid-cols-1 gap-4 border-t border-zinc-800/80 pt-8 sm:grid-cols-3 sm:gap-6">
          {metrics.map((m, idx) => (
            <div key={idx} className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
                {m.label}
              </span>
              <span className="mt-1 text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                {m.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
