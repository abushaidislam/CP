"use client";

import React, { useState } from "react";
import { VerifiedBadge } from "./component";

const PRESETS = [
  { name: "Twitter Blue", badge: "#1D9BF0", check: "#FFFFFF" },
  { name: "Gold Org", badge: "#EAB308", check: "#18181B" },
  { name: "Emerald", badge: "#10B981", check: "#FFFFFF" },
  { name: "Violet", badge: "#8B5CF6", check: "#FFFFFF" },
  { name: "Crimson", badge: "#F43F5E", check: "#FFFFFF" },
  { name: "Monochrome", badge: "#F4F4F5", check: "#09090B" },
];

type ViewTab = "profile" | "post" | "list";

export default function VerifiedBadgeDemo() {
  const [presetIndex, setPresetIndex] = useState(0);
  const [badgeColor, setBadgeColor] = useState(PRESETS[0].badge);
  const [checkColor, setCheckColor] = useState(PRESETS[0].check);
  const [badgeSize, setBadgeSize] = useState(20);
  const [activeTab, setActiveTab] = useState<ViewTab>("profile");
  const [copied, setCopied] = useState(false);

  const choosePreset = (index: number) => {
    setPresetIndex(index);
    setBadgeColor(PRESETS[index].badge);
    setCheckColor(PRESETS[index].check);
  };

  const handleCopyCode = async () => {
    const snippet = `<div className="flex items-center gap-1.5">
  <span className="font-semibold text-white">Alex Rivera</span>
  <VerifiedBadge size={${badgeSize}} badgeColor="${badgeColor}" checkColor="${checkColor}" />
</div>`;
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#09090B] p-3 font-sans text-zinc-100 sm:p-5 lg:h-screen lg:overflow-hidden">
      <div className="mx-auto grid min-h-[720px] max-w-[1500px] grid-cols-1 gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_340px]">
        
        {/* Main Canvas: Realistic Name + Badge contexts */}
        <section className="relative flex min-h-[580px] flex-col overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#121214] lg:min-h-0">
          
          {/* Top Bar */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-3.5 backdrop-blur-md">
            {/* Context switch tabs */}
            <div className="inline-flex items-center rounded-xl bg-white/[0.05] p-1 border border-white/[0.06]">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  activeTab === "profile"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Profile Card
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("post")}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  activeTab === "post"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Feed Post
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("list")}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  activeTab === "list"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                Members List
              </button>
            </div>

            {/* Direct copy button */}
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white active:scale-95"
            >
              {copied ? (
                <>
                  <svg className="size-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m5 12 4 4L19 6" />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg className="size-3.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                  <span>Copy Snippet</span>
                </>
              )}
            </button>
          </div>

          {/* Main Visual Stage */}
          <div className="relative flex flex-1 items-center justify-center overflow-y-auto p-4 sm:p-8">
            {/* Subtle background glow */}
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse at 50% 30%, rgba(29, 155, 240, 0.08), transparent 60%)",
              }}
            />

            {/* Context 1: Profile Card View */}
            {activeTab === "profile" && (
              <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.1] bg-[#18181B] shadow-2xl transition-all">
                {/* Banner Header */}
                <div className="h-28 w-full bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-900 relative">
                  <div className="absolute inset-0 bg-black/20" />
                </div>

                {/* Avatar & Action row */}
                <div className="px-6 pb-6">
                  <div className="flex items-end justify-between -mt-10 mb-4">
                    <div className="relative size-20 rounded-full border-4 border-[#18181B] bg-gradient-to-tr from-amber-500 to-indigo-600 p-0.5 shadow-md">
                      <div className="flex size-full items-center justify-center rounded-full bg-zinc-900 text-lg font-bold text-white">
                        AR
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 active:scale-95"
                    >
                      Follow
                    </button>
                  </div>

                  {/* Name + Badge Showcase */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h2 className="text-xl font-bold tracking-tight text-white">
                        Alex Rivera
                      </h2>
                      {/* Verified Badge next to name */}
                      <VerifiedBadge
                        size={badgeSize}
                        badgeColor={badgeColor}
                        checkColor={checkColor}
                        className="transition-all drop-shadow-xs"
                      />
                    </div>
                    <p className="text-xs text-zinc-400">@alexrivera • Founder at Synthetix</p>
                  </div>

                  {/* Bio */}
                  <p className="mt-3.5 text-xs leading-relaxed text-zinc-300">
                    Building modern creative interfaces & high-performance design tools. Exploring AI interactions & micro-typography.
                  </p>

                  {/* Stats */}
                  <div className="mt-4 flex items-center gap-4 text-xs text-zinc-400">
                    <span>
                      <strong className="text-white font-medium">1,420</strong> Following
                    </span>
                    <span>
                      <strong className="text-white font-medium">48.6K</strong> Followers
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Context 2: Feed Post View */}
            {activeTab === "post" && (
              <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#18181B] p-5 shadow-2xl transition-all">
                <div className="flex items-start gap-3.5">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 font-semibold text-white text-sm shadow-sm">
                    SJ
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Post Header with Badge right beside name */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-white">
                        Sarah Jenkins
                      </span>
                      <VerifiedBadge
                        size={badgeSize}
                        badgeColor={badgeColor}
                        checkColor={checkColor}
                        className="transition-all shrink-0"
                      />
                      <span className="text-xs text-zinc-400">@sarahj</span>
                      <span className="text-xs text-zinc-500">• 2h</span>
                    </div>

                    {/* Post Content */}
                    <p className="mt-2.5 text-xs leading-relaxed text-zinc-200">
                      Excited to announce our new component library! Every single badge, tab, and micro-interaction is handcrafted with buttery smooth springs and optical precision. What do you think?
                    </p>

                    {/* Interactive Post Actions */}
                    <div className="mt-4 flex items-center justify-between text-zinc-400 text-xs max-w-xs">
                      <div className="flex items-center gap-1 hover:text-white cursor-pointer transition-colors">
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>34</span>
                      </div>
                      <div className="flex items-center gap-1 hover:text-emerald-400 cursor-pointer transition-colors">
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>182</span>
                      </div>
                      <div className="flex items-center gap-1 hover:text-rose-400 cursor-pointer transition-colors">
                        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>1.4K</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Context 3: Members Directory List */}
            {activeTab === "list" && (
              <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#18181B] p-4 shadow-2xl transition-all space-y-2">
                <div className="px-2 py-1 text-xs font-semibold text-zinc-400 tracking-wider uppercase">
                  Verified Team Members
                </div>

                {[ 
                  { name: "Elena Rostova", role: "Principal Architect", handle: "@elena_r", initial: "ER", bg: "bg-indigo-600" },
                  { name: "Marcus Chen", role: "Lead Design Engineer", handle: "@mchen", initial: "MC", bg: "bg-cyan-600" },
                  { name: "Devin Vance", role: "Core Contributor", handle: "@devinv", initial: "DV", bg: "bg-amber-600" },
                ].map((user) => (
                  <div
                    key={user.handle}
                    className="flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex size-9 items-center justify-center rounded-full ${user.bg} text-xs font-bold text-white shadow-xs`}>
                        {user.initial}
                      </div>
                      <div>
                        {/* Name + Verified Badge */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-white">
                            {user.name}
                          </span>
                          <VerifiedBadge
                            size={badgeSize}
                            badgeColor={badgeColor}
                            checkColor={checkColor}
                            className="transition-all"
                          />
                        </div>
                        <p className="text-[11px] text-zinc-400">{user.role}</p>
                      </div>
                    </div>

                    <span className="rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-1 font-mono text-[10px] text-zinc-400">
                      {user.handle}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Canvas Info */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/[0.06] bg-[#151518] px-5 py-3 text-[11px] text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Badge rendered inline with typography</span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span>size: {badgeSize}px</span>
              <span className="text-zinc-600">|</span>
              <span style={{ color: badgeColor }}>{badgeColor.toUpperCase()}</span>
            </div>
          </div>
        </section>

        {/* Sidebar Controls */}
        <aside className="flex min-h-[580px] flex-col overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#121214] lg:min-h-0">
          <div className="border-b border-white/[0.07] px-5 py-4">
            <h2 className="text-sm font-semibold tracking-tight text-white">
              Badge Appearance
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Customize badge styling & size
            </p>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto p-5">
            {/* Color Presets */}
            <div className="space-y-2.5">
              <label className="text-xs font-medium text-zinc-300">
                Style Presets
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((preset, index) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => choosePreset(index)}
                    className={`group flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-all active:scale-95 ${
                      presetIndex === index
                        ? "border-white/30 bg-white/[0.08] shadow-xs"
                        : "border-white/[0.06] hover:border-white/15 hover:bg-white/[0.03]"
                    }`}
                  >
                    <span
                      className="flex size-6 items-center justify-center rounded-full border border-white/20 shadow-xs"
                      style={{ backgroundColor: preset.badge }}
                    >
                      <svg
                        className="size-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={preset.check}
                        strokeWidth="3"
                      >
                        <path d="m5 12 4 4L19 6" />
                      </svg>
                    </span>
                    <span className="text-[10px] text-zinc-300 font-medium truncate w-full">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Badge Size Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="badge-size-range" className="font-medium text-zinc-300">
                  Badge Size
                </label>
                <span className="font-mono text-zinc-400 bg-white/[0.05] px-2 py-0.5 rounded text-[11px]">
                  {badgeSize}px
                </span>
              </div>
              <input
                id="badge-size-range"
                type="range"
                min={14}
                max={36}
                step={1}
                value={badgeSize}
                onChange={(e) => setBadgeSize(Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer accent-white bg-zinc-800 rounded-lg"
              />
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[16, 20, 24, 28].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setBadgeSize(s)}
                    className={`rounded-lg border py-1.5 font-mono text-[11px] transition-colors active:scale-95 ${
                      badgeSize === s
                        ? "border-white/25 bg-white/[0.08] text-white"
                        : "border-white/[0.06] text-zinc-400 hover:bg-white/[0.03]"
                    }`}
                  >
                    {s}px
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Color Inputs */}
            <div className="space-y-3 pt-1 border-t border-white/[0.06]">
              <label className="text-xs font-medium text-zinc-300 block pt-2">
                Custom Colors
              </label>

              {/* Badge Background Color */}
              <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-black/20 p-2.5">
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={badgeColor}
                    onChange={(e) => setBadgeColor(e.target.value)}
                    className="size-7 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                  />
                  <span className="text-xs text-zinc-300">Badge Fill</span>
                </div>
                <span className="font-mono text-[11px] text-zinc-500 uppercase">
                  {badgeColor}
                </span>
              </div>

              {/* Checkmark Color */}
              <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-black/20 p-2.5">
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={checkColor}
                    onChange={(e) => setCheckColor(e.target.value)}
                    className="size-7 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                  />
                  <span className="text-xs text-zinc-300">Check Icon</span>
                </div>
                <span className="font-mono text-[11px] text-zinc-500 uppercase">
                  {checkColor}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="border-t border-white/[0.07] p-4">
            <button
              type="button"
              onClick={handleCopyCode}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-xs font-semibold text-zinc-900 transition hover:bg-zinc-200 active:scale-98 shadow-sm"
            >
              {copied ? "Copied to Clipboard!" : "Copy Component Code"}
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}
