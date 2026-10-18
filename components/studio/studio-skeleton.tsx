import React from "react";
import { Monitor } from "lucide-react";

export function StudioSkeleton() {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground font-sans">
      {/* Top Header Skeleton */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-background px-3">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-foreground text-background shadow-2xs">
            <svg
              viewBox="0 0 24 24"
              className="size-3 fill-current transform -translate-y-px"
            >
              <polygon points="12,2 22,20 2,20" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs tracking-tight text-foreground">
              Component Studio
            </span>
            <span className="text-muted-foreground/40 text-xs font-sans">/</span>
          </div>

          <div className="hidden md:flex h-4 w-px bg-border mx-1" />
          <div className="hidden md:flex h-7 w-36 rounded-md bg-muted/60 animate-shimmer" />
        </div>

        {/* Action Controls Skeleton */}
        <div className="flex items-center gap-1.5">
          <div className="h-7 w-24 rounded-md bg-muted/60 animate-shimmer" />
          <div className="h-7 w-20 rounded-md bg-muted/60 animate-shimmer" />
          <div className="size-7 rounded-md bg-muted/60 animate-shimmer" />
        </div>
      </header>

      {/* Main Two-Column Body Skeleton */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Column Skeleton (Editor) */}
        <div className="w-[48%] h-full flex flex-col border-r border-border bg-background">
          <div className="flex h-11 items-center justify-between border-b border-border bg-muted/10 px-3">
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-24 rounded bg-muted/60 animate-shimmer" />
              <div className="h-6 w-16 rounded bg-muted/40 animate-shimmer" />
              <div className="h-6 w-16 rounded bg-muted/40 animate-shimmer" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-7 w-16 rounded-md bg-muted/60 animate-shimmer" />
              <div className="h-7 w-20 rounded-md bg-muted/60 animate-shimmer" />
            </div>
          </div>

          {/* Editor lines placeholder */}
          <div className="flex-1 p-4 flex flex-col gap-3 font-mono text-xs bg-background">
            <div className="h-4 w-3/4 rounded bg-muted/60 animate-shimmer" />
            <div className="h-4 w-1/2 rounded bg-muted/40 animate-shimmer" />
            <div className="h-4 w-5/6 rounded bg-muted/50 animate-shimmer" />
            <div className="h-4 w-2/3 rounded bg-muted/40 animate-shimmer" />
            <div className="h-4 w-3/5 rounded bg-muted/50 animate-shimmer" />
          </div>

          {/* Bottom status bar skeleton */}
          <div className="h-7 border-t border-border bg-muted/10 px-3 flex items-center justify-between">
            <div className="h-3 w-28 rounded bg-muted/40 animate-shimmer" />
            <div className="h-3 w-24 rounded bg-muted/40 animate-shimmer" />
          </div>
        </div>

        {/* Center Splitter */}
        <div className="w-px bg-border" />

        {/* Right Column Skeleton (Canvas) */}
        <div className="w-[52%] h-full flex flex-col bg-background">
          <div className="flex h-11 items-center justify-between border-b border-border bg-background px-3">
            <div className="h-7 w-48 rounded-md bg-muted/60 animate-shimmer" />
            <div className="flex items-center gap-1.5">
              <div className="size-7 rounded-md bg-muted/60 animate-shimmer" />
              <div className="size-7 rounded-md bg-muted/60 animate-shimmer" />
            </div>
          </div>

          {/* Viewport Frame */}
          <div className="flex-1 p-6 flex items-center justify-center bg-muted/20">
            <div className="w-full max-w-xl h-[70vh] rounded-xl border border-border bg-background shadow-md flex flex-col items-center justify-center gap-3 overflow-hidden">
              <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted/60">
                <Monitor className="size-5 text-muted-foreground animate-pulse" />
              </div>
              <span className="text-xs text-muted-foreground">
                Initializing Sandbox Environment...
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
