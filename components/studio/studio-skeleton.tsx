import React from "react";
import { Monitor } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function StudioSkeleton() {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground font-sans">
      {/* Top Header Skeleton */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-4">
        <div className="flex items-center gap-3">
          <div className="flex size-6 items-center justify-center rounded-md bg-foreground text-background shadow-2xs">
            <svg
              viewBox="0 0 24 24"
              className="size-3 fill-current transform -translate-y-px"
            >
              <polygon points="12,2 22,20 2,20" />
            </svg>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs tracking-tight text-foreground">
              21st Studio
            </span>
            <span className="text-muted-foreground/40 text-xs">/</span>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 hidden sm:inline-flex text-muted-foreground">
              v2.0
            </Badge>
          </div>

          <div className="hidden md:flex h-4 w-px bg-border mx-1" />
          <div className="hidden md:flex h-8 w-44 rounded-md bg-muted animate-pulse" />
        </div>

        {/* Action Controls Skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-28 rounded-md bg-muted animate-pulse" />
          <div className="h-8 w-32 rounded-md bg-muted animate-pulse" />
          <div className="size-8 rounded-md bg-muted animate-pulse" />
        </div>
      </header>

      {/* Main Two-Column Body Skeleton */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Column Skeleton (Editor) */}
        <div className="w-[48%] h-full flex flex-col border-r border-border bg-background">
          <div className="flex h-10 items-center justify-between border-b border-border bg-muted/20 px-3">
            <div className="flex items-center gap-1.5">
              <div className="h-7 w-28 rounded-t-md bg-muted animate-pulse" />
              <div className="h-7 w-20 rounded-t-md bg-muted/50 animate-pulse" />
              <div className="h-7 w-20 rounded-t-md bg-muted/50 animate-pulse" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-7 w-16 rounded-md bg-muted animate-pulse" />
              <div className="h-7 w-20 rounded-md bg-muted animate-pulse" />
            </div>
          </div>

          {/* Editor lines placeholder */}
          <div className="flex-1 p-4 flex flex-col gap-3 font-mono text-xs bg-background">
            <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
            <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
            <div className="h-4 w-3/5 rounded bg-muted animate-pulse" />
          </div>

          {/* Bottom status bar skeleton */}
          <div className="h-7 border-t border-border bg-muted/30 px-3 flex items-center justify-between">
            <div className="h-3 w-32 rounded bg-muted animate-pulse" />
            <div className="h-3 w-28 rounded bg-muted animate-pulse" />
          </div>
        </div>

        {/* Center Splitter */}
        <div className="w-px bg-border" />

        {/* Right Column Skeleton (Canvas) */}
        <div className="w-[52%] h-full flex flex-col bg-background">
          <div className="flex h-10 items-center justify-between border-b border-border bg-background px-3">
            <div className="h-7 w-60 rounded-md bg-muted animate-pulse" />
            <div className="flex items-center gap-1.5">
              <div className="h-7 w-7 rounded-md bg-muted animate-pulse" />
              <div className="h-7 w-12 rounded-md bg-muted animate-pulse" />
            </div>
          </div>

          {/* Viewport Frame */}
          <div className="flex-1 p-6 flex items-center justify-center bg-muted/30">
            <div className="w-full max-w-xl h-[70vh] rounded-xl border border-border bg-background shadow-xl flex flex-col overflow-hidden">
              <div className="flex h-8 items-center justify-between border-b border-border bg-muted/40 px-3">
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-border" />
                  <span className="size-2 rounded-full bg-border" />
                  <span className="size-2 rounded-full bg-border" />
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">
                  sandbox://21st.dev/preview
                </span>
                <span className="text-[10px] text-muted-foreground">1200px</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted">
                  <Monitor className="size-5 text-primary animate-pulse" />
                </div>
                <span className="text-xs text-muted-foreground">
                  Initializing Sandbox Environment...
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
