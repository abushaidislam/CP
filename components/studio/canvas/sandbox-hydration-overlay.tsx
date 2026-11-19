"use client";

import React from "react";
import type { PreviewTheme } from "@/lib/store/studio-store";
import type { SandboxHydrationStage } from "../canvas-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface SandboxHydrationOverlayProps {
  previewTheme: PreviewTheme;
  previewImage?: string;
  hydrationStage: SandboxHydrationStage;
  activeHydrationPackages: string[];
  isHydrationSlow: boolean;
  onRetryHydration: () => void;
}

export function SandboxHydrationOverlay({
  previewTheme,
  previewImage,
  hydrationStage,
  activeHydrationPackages,
  isHydrationSlow,
  onRetryHydration,
}: SandboxHydrationOverlayProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Initializing component sandbox environment"
      data-testid="canvas-progressive-skeleton"
      className={cn(
        "absolute inset-0 z-10 flex flex-col justify-between overflow-hidden select-none font-sans transition-opacity duration-200",
        previewTheme === "dark"
          ? "bg-zinc-950 text-zinc-100"
          : "bg-white text-zinc-900"
      )}
    >
      {/* Subtle Architectural Grid Underlay */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 bg-[size:24px_24px]",
          previewTheme === "dark"
            ? "opacity-25 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)]"
            : "opacity-40 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]"
        )}
      />

      {/* Optional Component Preview Silhouette Underlay */}
      {previewImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewImage}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 w-full h-full object-contain p-10 opacity-10 blur-[1px] select-none"
        />
      )}

      {/* Top Skeletal Chrome Wireframe Bar */}
      <div
        aria-hidden="true"
        className={cn(
          "relative z-10 flex h-12 shrink-0 items-center justify-between border-b px-5",
          previewTheme === "dark"
            ? "border-zinc-800/80 bg-zinc-900/40"
            : "border-zinc-200/80 bg-zinc-100/60"
        )}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "size-5 rounded-none animate-shimmer",
              previewTheme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
            )}
          />
          <div
            className={cn(
              "h-3.5 w-28 rounded-none animate-shimmer",
              previewTheme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
            )}
          />
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <div
            className={cn(
              "h-3 w-14 rounded-none animate-shimmer",
              previewTheme === "dark" ? "bg-zinc-800/70" : "bg-zinc-200/80"
            )}
          />
          <div
            className={cn(
              "h-3 w-14 rounded-none animate-shimmer",
              previewTheme === "dark" ? "bg-zinc-800/70" : "bg-zinc-200/80"
            )}
          />
          <div
            className={cn(
              "h-6 w-20 rounded-none animate-shimmer",
              previewTheme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
            )}
          />
        </div>
      </div>

      {/* Center Stage: Background Wireframe Blocks + Foreground Progressive Hydration HUD */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        {/* Ambient Skeletal Wireframe Silhouette */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-6 flex flex-col items-center justify-center gap-5 opacity-45"
        >
          <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={cn(
                "h-36 rounded-none border p-4 flex flex-col justify-between",
                previewTheme === "dark"
                  ? "border-zinc-800/80 bg-zinc-900/30"
                  : "border-zinc-200 bg-zinc-50/70"
              )}
            >
              <div className="space-y-2">
                <div
                  className={cn(
                    "h-3 w-20 rounded-none animate-shimmer",
                    previewTheme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
                  )}
                />
                <div
                  className={cn(
                    "h-5 w-4/5 rounded-none animate-shimmer",
                    previewTheme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
                  )}
                />
                <div
                  className={cn(
                    "h-3 w-2/3 rounded-none animate-shimmer",
                    previewTheme === "dark"
                      ? "bg-zinc-800/70"
                      : "bg-zinc-200/80"
                  )}
                />
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-7 w-24 rounded-none animate-shimmer",
                    previewTheme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
                  )}
                />
                <div
                  className={cn(
                    "h-7 w-20 rounded-none animate-shimmer",
                    previewTheme === "dark"
                      ? "bg-zinc-800/60"
                      : "bg-zinc-200/70"
                  )}
                />
              </div>
            </div>

            <div
              className={cn(
                "hidden md:flex h-36 rounded-none border p-4 flex-col justify-between",
                previewTheme === "dark"
                  ? "border-zinc-800/80 bg-zinc-900/30"
                  : "border-zinc-200 bg-zinc-50/70"
              )}
            >
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "h-3.5 w-24 rounded-none animate-shimmer",
                    previewTheme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
                  )}
                />
                <div
                  className={cn(
                    "size-6 rounded-none animate-shimmer",
                    previewTheme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
                  )}
                />
              </div>
              <div
                className={cn(
                  "h-16 w-full rounded-none animate-shimmer",
                  previewTheme === "dark" ? "bg-zinc-800/60" : "bg-zinc-200/70"
                )}
              />
            </div>
          </div>
        </div>

        {/* Centered Progressive Initialization HUD Card */}
        <div className="relative z-20 w-full max-w-md rounded-none border border-border bg-card/95 text-card-foreground p-5 shadow-vercel-floating backdrop-blur-md flex flex-col gap-4">
          {/* Eyebrow & Tabular Progress Percentage */}
          <div className="flex items-center justify-between gap-2">
            <Badge variant="eyebrow" className="rounded-none">
              SANDBOX HYDRATION
            </Badge>
            <span className="font-mono text-xs font-medium text-muted-foreground tabular-nums">
              {hydrationStage === "compiling"
                ? "35%"
                : hydrationStage === "hydrating-deps"
                ? "68%"
                : "92%"}
            </span>
          </div>

          {/* Stage Headline & Description */}
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-none border border-border bg-muted/40">
              <Loader2 className="size-3.5 animate-spin text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-sans text-xs sm:text-sm font-semibold text-foreground leading-tight">
                {hydrationStage === "compiling"
                  ? "Initializing sandbox environment..."
                  : hydrationStage === "hydrating-deps"
                  ? "Hydrating sandbox ESM dependencies..."
                  : "Mounting React 19 component tree..."}
              </p>
              <p className="font-sans text-[11px] text-muted-foreground mt-1 leading-relaxed">
                {hydrationStage === "compiling"
                  ? "Transpiling TypeScript AST and assembling import map"
                  : hydrationStage === "hydrating-deps"
                  ? "Streaming browser ES modules and Tailwind runtime"
                  : "Executing component module and hydrating live DOM"}
              </p>
            </div>
          </div>

          {/* 3-Segment Determinate Progress Bar */}
          <div className="flex flex-col gap-2">
            <div
              aria-hidden="true"
              className="grid grid-cols-3 gap-1.5 h-1.5 w-full"
            >
              <div
                className={cn(
                  "h-full rounded-none transition-colors duration-200",
                  hydrationStage === "compiling"
                    ? "bg-primary animate-shimmer"
                    : "bg-primary"
                )}
              />
              <div
                className={cn(
                  "h-full rounded-none transition-colors duration-200",
                  hydrationStage === "compiling"
                    ? "bg-muted"
                    : hydrationStage === "hydrating-deps"
                    ? "bg-primary animate-shimmer"
                    : "bg-primary"
                )}
              />
              <div
                className={cn(
                  "h-full rounded-none transition-colors duration-200",
                  hydrationStage === "mounting"
                    ? "bg-primary animate-shimmer"
                    : "bg-muted"
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-[11px] font-sans">
              <div className="flex items-center gap-1 text-foreground font-medium truncate">
                {hydrationStage !== "compiling" && (
                  <Check className="size-3 text-emerald-500 shrink-0" />
                )}
                <span className="truncate">1. Compile AST</span>
              </div>
              <div
                className={cn(
                  "flex items-center gap-1 truncate",
                  hydrationStage === "compiling"
                    ? "text-muted-foreground"
                    : "text-foreground font-medium"
                )}
              >
                {hydrationStage === "mounting" && (
                  <Check className="size-3 text-emerald-500 shrink-0" />
                )}
                <span className="truncate">2. Hydrate ESM</span>
              </div>
              <div
                className={cn(
                  "flex items-center gap-1 truncate",
                  hydrationStage === "mounting"
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                )}
              >
                <span className="truncate">3. Mount DOM</span>
              </div>
            </div>
          </div>

          {/* Active ESM Dependencies Strip */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-border/70">
            <div className="flex items-center justify-between text-[11px] font-sans text-muted-foreground">
              <span>Hydrating Modules</span>
              <span className="font-mono text-[10px] tabular-nums">
                {activeHydrationPackages.length} packages
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {activeHydrationPackages.map((pkg) => (
                <Badge
                  key={pkg}
                  variant="outline"
                  className="rounded-none px-1.5 py-0.5 text-[10px] font-mono font-normal text-muted-foreground bg-muted/30 border-border/80"
                >
                  {pkg}
                </Badge>
              ))}
            </div>
          </div>

          {/* Slow Hydration Retry Action */}
          {isHydrationSlow && (
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/70">
              <span className="font-sans text-[11px] text-muted-foreground">
                Fetching remote ESM modules...
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onRetryHydration}
                className="h-7 rounded-none font-sans text-xs gap-1.5 shrink-0"
              >
                <RefreshCw className="size-3" />
                <span>Retry Hydration</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Skeletal Footer Strip */}
      <div
        aria-hidden="true"
        className={cn(
          "relative z-10 flex h-9 shrink-0 items-center justify-between border-t px-5",
          previewTheme === "dark"
            ? "border-zinc-800/80 bg-zinc-900/30"
            : "border-zinc-200/80 bg-zinc-100/50"
        )}
      >
        <div
          className={cn(
            "h-2.5 w-32 rounded-none animate-shimmer",
            previewTheme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
          )}
        />
        <div
          className={cn(
            "h-2.5 w-20 rounded-none animate-shimmer",
            previewTheme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
          )}
        />
      </div>
    </div>
  );
}
