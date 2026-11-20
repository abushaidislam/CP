"use client"

import React from "react"

export interface ComponentProps {
  title?: string
  accentColor?: string
  showBadge?: boolean
}

export function Component({
  title = "BuiltToScale",
  accentColor = "#6366f1",
  showBadge = true,
}: ComponentProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 text-foreground">
      {showBadge && (
        <span
          className="inline-flex items-center gap-1.5 border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider"
          style={{ borderColor: accentColor, color: accentColor }}
        >
          21st.dev Ready
        </span>
      )}
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
    </div>
  )
}

export default Component
