"use client";

import React, { useEffect, useState, useMemo } from "react";
import type {
  RegistryReferenceMode,
  RegistryReferenceSummary,
} from "@/lib/ai/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Check,
  Image as ImageIcon,
  Layers,
  Loader2,
  Pin,
  Search,
  X,
} from "lucide-react";
import { REGISTRY_REF_MODE_OPTIONS } from "./ai-copilot-constants";

export interface RegistryReferencePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: RegistryReferenceMode;
  pinnedSlugs: string[];
  currentSlug?: string;
  onSelectMode: (mode: RegistryReferenceMode) => void;
  onTogglePin: (slug: string) => void;
  onClearPins: () => void;
}

const CATEGORIES = [
  "All",
  "Cards",
  "Widgets",
  "Buttons",
  "Heroes",
  "Navigation",
  "Effects",
  "Forms",
];

export function RegistryReferencePicker({
  open,
  onOpenChange,
  mode,
  pinnedSlugs,
  currentSlug,
  onSelectMode,
  onTogglePin,
  onClearPins,
}: RegistryReferencePickerProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [items, setItems] = useState<RegistryReferenceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const controller = new AbortController();

    const fetchRefs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        if (category !== "All") params.set("category", category);
        const res = await fetch(`/api/ai-assistant?${params.toString()}`, {
          signal: controller.signal,
          headers: { "X-Studio-Client": "component-studio" },
        });
        const data = (await res.json()) as {
          success?: boolean;
          references?: RegistryReferenceSummary[];
          error?: string;
        };
        if (!cancelled) {
          if (res.ok && Array.isArray(data.references)) {
            setItems(data.references);
          } else {
            setError(data.error || "Unable to load registry references.");
          }
        }
      } catch (err: unknown) {
        if (!cancelled && !(err instanceof Error && err.name === "AbortError")) {
          setError("Could not load component registry.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      void fetchRefs();
    }, 140);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, query, category]);

  const visibleItems = useMemo(
    () =>
      items.filter(
        (item) =>
          !currentSlug ||
          item.slug.toLowerCase() !== currentSlug.toLowerCase() ||
          pinnedSlugs.includes(item.slug)
      ),
    [items, currentSlug, pinnedSlugs]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-none border-border bg-background p-0 font-sans">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-none border border-border bg-muted/60 text-foreground shrink-0">
              <Layers className="size-4" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-semibold text-foreground font-sans">
                Registry Visual Reference Grounding
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-sans mt-0.5">
                Let Copilot selectively consult preview images and design tokens from your registered library components, or pin up to 2 explicit references.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden px-5 py-4 space-y-4">
          {/* Reference Grounding Strategy Selector */}
          <div className="space-y-1.5">
            <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              GROUNDING STRATEGY
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {REGISTRY_REF_MODE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = mode === opt.id;
                return (
                  <Button
                    key={opt.id}
                    type="button"
                    variant="outline"
                    onClick={() => onSelectMode(opt.id)}
                    className={cn(
                      "h-auto flex flex-col items-start justify-start gap-1 p-2.5 rounded-none text-left whitespace-normal font-sans transition-colors shadow-none",
                      active
                        ? "border-foreground bg-foreground/[0.06] text-foreground"
                        : "border-border/80 bg-card/40 text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center justify-between w-full gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <Icon className="size-3.5 shrink-0" />
                        <span className="text-xs font-semibold text-foreground">
                          {opt.name}
                        </span>
                      </div>
                      {active && <Check className="size-3.5 text-foreground shrink-0" />}
                    </div>
                    <span className="text-[11px] font-normal text-muted-foreground leading-snug">
                      {opt.description}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                PIN SPECIFIC REGISTRY DESIGNS (OPTIONAL · MAX 2)
              </span>
              {pinnedSlugs.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClearPins}
                  className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground rounded-none font-sans gap-1"
                >
                  <X className="size-3" />
                  <span>Clear pinned ({pinnedSlugs.length})</span>
                </Button>
              )}
            </div>

            <div className="relative">
              <Search className="size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search registered components by name, style, or description..."
                className="h-8 pl-8 text-xs rounded-none font-sans bg-muted/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  type="button"
                  variant={category === cat ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "h-6 px-2 text-[11px] rounded-none font-sans",
                    category === cat
                      ? "bg-foreground text-background hover:bg-foreground/90 border-foreground"
                      : "border-border/70 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Registry Gallery List */}
          {error ? (
            <div className="border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-xs text-rose-500 font-sans">
              {error}
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-xs text-muted-foreground font-sans">
              <Loader2 className="size-4 animate-spin" />
              <span>Loading registry preview catalog...</span>
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="border border-border/70 bg-muted/20 px-4 py-8 text-center text-xs text-muted-foreground font-sans">
              No matching registered components found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {visibleItems.map((ref) => {
                const isPinned = pinnedSlugs.includes(ref.slug);
                return (
                  <Button
                    key={ref.slug}
                    type="button"
                    variant="outline"
                    onClick={() => onTogglePin(ref.slug)}
                    className={cn(
                      "h-auto flex flex-col items-stretch justify-start p-0 rounded-none overflow-hidden text-left whitespace-normal font-sans transition-colors shadow-none",
                      isPinned
                        ? "border-primary bg-primary/[0.04]"
                        : "border-border/80 bg-card/40 hover:bg-card hover:border-border"
                    )}
                  >
                    {/* Preview Image Banner */}
                    <div className="relative h-24 w-full border-b border-border/60 bg-muted/40 overflow-hidden flex items-center justify-center">
                      {ref.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={ref.previewUrl}
                          alt={ref.name}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-muted-foreground/70">
                          <ImageIcon className="size-4" />
                          <span className="text-[10px] font-sans">Code Pattern Only</span>
                        </div>
                      )}
                      {isPinned && (
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-foreground text-background px-1.5 py-0.5 text-[10px] font-medium">
                          <Pin className="size-2.5" />
                          <span>Pinned</span>
                        </div>
                      )}
                    </div>

                    {/* Metadata Footer */}
                    <div className="p-2.5 space-y-1 w-full">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {ref.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="rounded-none text-[9px] py-0 px-1.5 font-normal font-sans shrink-0"
                        >
                          {ref.category}
                        </Badge>
                      </div>
                      <p className="text-[11px] font-normal text-muted-foreground line-clamp-2 leading-snug">
                        {ref.description || ref.slug}
                      </p>
                    </div>
                  </Button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-row items-center justify-between gap-2 px-5 py-3 border-t border-border/80 bg-muted/20 shrink-0">
          <div className="text-[11px] text-muted-foreground font-sans">
            {pinnedSlugs.length > 0
              ? `${pinnedSlugs.length} pinned reference${pinnedSlugs.length === 1 ? "" : "s"} will be attached to your next prompt.`
              : mode === "auto"
              ? "Auto mode: Copilot will selectively pull preview images when visual craft helps."
              : mode === "always"
              ? "Always mode: Copilot will attach top matching visual references on every turn."
              : "References disabled for purely local workspace edits."}
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 px-3 text-xs rounded-none font-sans shrink-0"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
