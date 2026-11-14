"use client";

import React, { useState } from "react";
import BentoGridSelector from "./component";

const MicIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="22" />
  </svg>
);

export default function DefaultDemo() {
  const [selectedId, setSelectedId] = useState<string>("study");

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#a9bede] via-[#e2c1d8] to-[#f4b6a2] p-6 antialiased select-none font-sans">
      {/* Intense Sunset Radial Glow Bloom */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-gradient-to-t from-[#ff4d00] via-[#ff7700] to-transparent opacity-95 blur-[105px]"
      />

      {/* Floating Interactive Stage */}
      <div className="relative z-10 flex flex-col items-center gap-7">
        {/* Floating Input Pill Bar */}
        <div className="flex h-[42px] w-[260px] sm:w-[280px] items-center justify-between rounded-full bg-[#17181c]/95 px-4 py-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.28)] backdrop-blur-md border border-white/10 transition-all hover:border-white/20">
          <span className="text-[13.5px] font-normal tracking-tight text-[#989ba8]">
            Ask anything...
          </span>
          <button
            type="button"
            aria-label="Voice input"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#27282e] text-[#e0e2eb] transition-colors hover:bg-[#34363e]"
          >
            <MicIcon />
          </button>
        </div>

        {/* 4-Card Bento Grid Selector */}
        <div className="rounded-[24px] p-2">
          <BentoGridSelector
            value={selectedId}
            onChange={(id) => setSelectedId(id)}
            className="bg-transparent p-0"
          />
        </div>
      </div>
    </main>
  );
}