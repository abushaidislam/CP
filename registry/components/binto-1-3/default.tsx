"use client"

import React, { useState } from "react"
import Component from "./component"

type ViewportMode = "responsive" | "desktop" | "tablet" | "mobile"

export default function Demo() {
  const [viewport, setViewport] = useState<ViewportMode>("responsive")
  const [remountKey, setRemountKey] = useState(0)

  // Viewport width constraints for testing responsive layout & text reflow
  const viewportWidths: Record<ViewportMode, string> = {
    responsive: "w-full",
    desktop: "w-[1280px]",
    tablet: "w-[768px]",
    mobile: "w-[390px]",
  }

  return (
    <main className="min-h-screen w-full bg-[#EFECE6] flex flex-col items-center font-sans antialiased text-[#18181B] selection:bg-[#F23F0C] selection:text-white">
      {/* Top Floating Control Toolbar (Component Playground Style) */}
      <header className="sticky top-4 z-50 mb-6 mt-4 flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 py-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-md">
        {/* Viewport Width Selectors */}
        <div className="flex items-center gap-1 border-r border-black/10 pr-2">
          {(["responsive", "desktop", "tablet", "mobile"] as ViewportMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewport(mode)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-all duration-150 ${
                viewport === mode
                  ? "bg-[#18181B] text-white shadow-sm"
                  : "text-[#71717A] hover:bg-black/5 hover:text-[#18181B]"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Reload Animation Trigger */}
        <button
          onClick={() => setRemountKey((prev) => prev + 1)}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-[#71717A] hover:bg-black/5 hover:text-[#18181B] transition-colors"
          title="Re-trigger animations"
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
          </svg>
          <span>Replay</span>
        </button>
      </header>

      {/* Component Frame */}
      <div
        className={`transition-all duration-300 ease-[cubic-bezier(0.2,0.0,0.0,1.0)] ${viewportWidths[viewport]} max-w-full px-4 pb-16`}
      >
        <div className="overflow-hidden rounded-[40px] border border-black/5 bg-[#FAF7F2] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)]">
          <Component key={remountKey} />
        </div>
      </div>
    </main>
  )
}