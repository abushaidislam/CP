"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const TABS: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
  {
    id: "profile",
    label: "Profile Card",
    icon: (
      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: "post",
    label: "Feed Post",
    icon: (
      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "list",
    label: "Members List",
    icon: (
      <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
];

const springTransition = {
  type: "spring",
  stiffness: 450,
  damping: 32,
};

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
    <main className="min-h-screen bg-[#09090B] p-3 font-sans text-zinc-100 sm:p-5 lg:h-screen lg:overflow-hidden select-none">
      <div className="mx-auto grid min-h-[720px] max-w-[1500px] grid-cols-1 gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main Canvas */}
        <section className="relative flex min-h-[580px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121214] lg:min-h-0">
          {/* Top Bar with Animated Sliding Tabs */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-3.5 backdrop-blur-md">
            <div className="inline-flex items-center rounded-xl bg-white/[0.04] p-1 border border-white/[0.06]">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive ? "text-zinc-950 font-semibold" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabBadgePill"
                        className="absolute inset-0 rounded-lg bg-white shadow-sm"
                        transition={springTransition}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      {tab.icon}
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Direct Copy Button */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                  <motion.span
                    key="copied"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1.5 text-emerald-400"
                  >
                    <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="m5 12 4 4L19 6" />
                    </svg>
                    <span>Copied!</span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1.5"
                  >
                    <svg className="size-3.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                    <span>Copy Snippet</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>

          {/* Main Stage with AnimatePresence transitions */}
          <div className="relative flex flex-1 items-center justify-center overflow-y-auto p-4 sm:p-8">
            <div
              className="pointer-events-none absolute inset-0 opacity-30 transition-all duration-700"
              style={{
                backgroundImage: `radial-gradient(circle at 50% 30%, ${badgeColor}22, transparent 65%)`,
              }}
            />

            <AnimatePresence mode="wait">
              {activeTab === "profile" && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={springTransition}
                  className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.1] bg-[#18181B] shadow-2xl"
                >
                  <div className="relative h-28 w-full bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-900">
                    <div className="absolute inset-0 bg-black/25" />
                  </div>

                  <div className="px-6 pb-6">
                    <div className="-mt-10 mb-4 flex items-end justify-between">
                      <div className="relative size-20 rounded-full border-4 border-[#18181B] bg-gradient-to-tr from-amber-500 to-indigo-600 p-0.5 shadow-md">
                        <div className="flex size-full items-center justify-center rounded-full bg-zinc-900 text-lg font-bold text-white">
                          AR
                        </div>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
                      >
                        Follow
                      </motion.button>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h2 className="text-xl font-bold tracking-tight text-white">Alex Rivera</h2>
                        <motion.div layout transition={springTransition}>
                          <VerifiedBadge
                            size={badgeSize}
                            badgeColor={badgeColor}
                            checkColor={checkColor}
                            className="transition-all"
                          />
                        </motion.div>
                      </div>
                      <p className="text-xs text-zinc-400">@alexrivera • Founder at Synthetix</p>
                    </div>

                    <p className="mt-3.5 text-xs leading-relaxed text-zinc-300">
                      Building modern creative interfaces & high-performance design tools. Exploring micro-typography and tactile interactions.
                    </p>

                    <div className="mt-4 flex items-center gap-4 text-xs text-zinc-400">
                      <span>
                        <strong className="font-semibold text-white">1,420</strong> Following
                      </span>
                      <span>
                        <strong className="font-semibold text-white">48.6K</strong> Followers
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "post" && (
                <motion.div
                  key="post"
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={springTransition}
                  className="relative w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#18181B] p-5 shadow-2xl"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-sm font-semibold text-white shadow-sm">
                      SJ
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-bold text-white">Sarah Jenkins</span>
                        <motion.div layout transition={springTransition} className="shrink-0">
                          <VerifiedBadge
                            size={badgeSize}
                            badgeColor={badgeColor}
                            checkColor={checkColor}
                            className="transition-all"
                          />
                        </motion.div>
                        <span className="text-xs text-zinc-400">@sarahj</span>
                        <span className="text-xs text-zinc-500">• 2h</span>
                      </div>

                      <p className="mt-2.5 text-xs leading-relaxed text-zinc-200">
                        Excited to announce our new component library! Every single badge, tab, and micro-interaction is handcrafted with buttery smooth springs and optical precision. What do you think?
                      </p>

                      <div className="mt-4 flex max-w-xs items-center justify-between text-xs text-zinc-400">
                        <div className="flex cursor-pointer items-center gap-1 transition-colors hover:text-white">
                          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>34</span>
                        </div>
                        <div className="flex cursor-pointer items-center gap-1 transition-colors hover:text-emerald-400">
                          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>182</span>
                        </div>
                        <div className="flex cursor-pointer items-center gap-1 transition-colors hover:text-rose-400">
                          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span>1.4K</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "list" && (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={springTransition}
                  className="w-full max-w-md space-y-1.5 rounded-2xl border border-white/[0.1] bg-[#18181B] p-4 shadow-2xl"
                >
                  <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
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
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-white">{user.name}</span>
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

                      <span className="rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-0.5 text-[11px] font-medium text-zinc-400">
                        {user.handle}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Bar Info */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/[0.06] bg-[#151518] px-5 py-3 text-[11px] text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400" />
              <span>Inline typography aligned</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium">
              <span>size: {badgeSize}px</span>
              <span className="text-zinc-600">•</span>
              <span style={{ color: badgeColor }}>{badgeColor.toUpperCase()}</span>
            </div>
          </div>
        </section>

        {/* Sidebar Controls */}
        <aside className="flex min-h-[580px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121214] lg:min-h-0">
          <div className="border-b border-white/[0.07] px-5 py-4">
            <h2 className="text-sm font-semibold tracking-tight text-white">Badge Appearance</h2>
            <p className="mt-0.5 text-xs text-zinc-400">Customize badge styling & dimensions</p>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto p-5">
            {/* Style Presets with Smooth Spring Border */}
            <div className="space-y-2.5">
              <label className="text-xs font-medium text-zinc-300">Style Presets</label>
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((preset, index) => {
                  const isSelected = presetIndex === index;
                  return (
                    <motion.button
                      key={preset.name}
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      onClick={() => choosePreset(index)}
                      className="relative flex flex-col items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 text-center transition-colors hover:bg-white/[0.04]"
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="selectedPresetBorder"
                          className="absolute inset-0 rounded-xl border border-white/40 bg-white/[0.06] shadow-sm pointer-events-none"
                          transition={springTransition}
                        />
                      )}
                      <span
                        className="relative z-10 flex size-6 items-center justify-center rounded-full border border-white/20 shadow-xs"
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
                      <span className="relative z-10 w-full truncate text-[11px] font-medium text-zinc-300">
                        {preset.name}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Badge Size Slider & Presets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="badge-size-range" className="font-medium text-zinc-300">
                  Badge Size
                </label>
                <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-zinc-300">
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
                className="h-1.5 w-full cursor-pointer rounded-lg bg-zinc-800 accent-white"
              />
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[16, 20, 24, 28].map((s) => {
                  const isCurrent = badgeSize === s;
                  return (
                    <motion.button
                      key={s}
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      onClick={() => setBadgeSize(s)}
                      className="relative rounded-lg border border-white/[0.06] py-1.5 text-[11px] font-medium transition-colors hover:bg-white/[0.03]"
                    >
                      {isCurrent && (
                        <motion.div
                          layoutId="badgeSizePill"
                          className="absolute inset-0 rounded-lg border border-white/30 bg-white/[0.08]"
                          transition={springTransition}
                        />
                      )}
                      <span className={`relative z-10 ${isCurrent ? "text-white font-semibold" : "text-zinc-400"}`}>
                        {s}px
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Custom Color Pickers */}
            <div className="space-y-3 border-t border-white/[0.06] pt-1">
              <label className="block pt-2 text-xs font-medium text-zinc-300">Custom Colors</label>

              <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-black/30 p-2.5">
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={badgeColor}
                    onChange={(e) => setBadgeColor(e.target.value)}
                    className="size-7 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                  />
                  <span className="text-xs text-zinc-300">Badge Fill</span>
                </div>
                <span className="text-[11px] font-medium uppercase text-zinc-400">{badgeColor}</span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-black/30 p-2.5">
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={checkColor}
                    onChange={(e) => setCheckColor(e.target.value)}
                    className="size-7 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                  />
                  <span className="text-xs text-zinc-300">Check Icon</span>
                </div>
                <span className="text-[11px] font-medium uppercase text-zinc-400">{checkColor}</span>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="border-t border-white/[0.07] p-4">
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={handleCopyCode}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200 shadow-sm"
            >
              {copied ? "Copied to Clipboard!" : "Copy Component Code"}
            </motion.button>
          </div>
        </aside>
      </div>
    </main>
  );
}