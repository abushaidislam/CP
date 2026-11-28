"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStudioStore } from "@/lib/store/studio-store";
import { cn } from "@/lib/utils";
import {
  Search,
  ArrowRight,
  Check,
  Cpu,
  Plus,
  Terminal,
  Layers,
} from "lucide-react";

function toClientSlug(nameOrId: string, fallbackId?: string): string {
  const raw = (nameOrId || fallbackId || "component")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return raw || "custom-component";
}

export interface CommandPaletteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenMcpConnect?: () => void;
  onOpenCreateComponent?: () => void;
}

export function CommandPaletteDialog({
  open,
  onOpenChange,
  onOpenMcpConnect,
  onOpenCreateComponent,
}: CommandPaletteDialogProps) {
  const router = useRouter();
  const userComponents = useStudioStore((s) => s.userComponents);
  const loadComponent = useStudioStore((s) => s.loadComponent);

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [origin, setOrigin] = useState("https://cp.flinkeo.online");
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.origin) {
      setOrigin(window.location.origin);
    }
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  const allComponents = useMemo(() => {
    const list = Object.values(userComponents || {});
    return list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }, [userComponents]);

  const filteredComponents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allComponents.slice(0, 18);
    return allComponents
      .filter((c) => {
        const slug = c.repoSlug || toClientSlug(c.name, c.id);
        return (
          c.name.toLowerCase().includes(q) ||
          slug.toLowerCase().includes(q) ||
          (c.category || "").toLowerCase().includes(q) ||
          (c.description || "").toLowerCase().includes(q)
        );
      })
      .slice(0, 20);
  }, [allComponents, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const handleOpenInStudio = (compId: string, slug: string) => {
    loadComponent(compId);
    onOpenChange(false);
    router.push(`/studio/${slug || compId}`);
  };

  const handleCopyShadcnCli = (e: React.MouseEvent, slug: string) => {
    e.stopPropagation();
    const cmd = `npx shadcn@latest add ${origin}/api/registry/${slug}`;
    navigator.clipboard?.writeText(cmd);
    setCopiedSlug(slug);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredComponents.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredComponents.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(
        (prev) => (prev - 1 + filteredComponents.length) % filteredComponents.length
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = filteredComponents[activeIndex];
      if (selected) {
        const slug = selected.repoSlug || toClientSlug(selected.name, selected.id);
        handleOpenInStudio(selected.id, slug);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl font-sans p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-3 border-b border-border">
          <div className="flex items-center justify-between gap-2 pr-6">
            <DialogTitle className="font-sans text-sm font-semibold text-foreground flex items-center gap-2">
              <Search className="size-4 text-primary" />
              Quick Command &amp; Registry Search
            </DialogTitle>
            <Badge variant="outline" className="font-sans text-[10px] rounded-none tabular-nums">
              {allComponents.length} Components
            </Badge>
          </div>
          <DialogDescription className="font-sans text-xs text-muted-foreground">
            Use ↑↓ and Enter to jump to any component in Studio, or copy its one-click shadcn CLI install command.
          </DialogDescription>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Search components by name, slug, or category..."
              className="pl-9 h-9 text-xs font-sans rounded-none bg-muted/30"
              autoFocus
            />
          </div>
        </DialogHeader>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-muted/20 border-b border-border">
          <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground mr-1">
            QUICK ACTIONS
          </span>
          {onOpenMcpConnect && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onOpenMcpConnect();
              }}
              className="h-7 px-2.5 text-xs font-sans rounded-none gap-1.5"
            >
              <Cpu className="size-3.5 text-primary" />
              MCP Connector
            </Button>
          )}
          {onOpenCreateComponent && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onOpenCreateComponent();
              }}
              className="h-7 px-2.5 text-xs font-sans rounded-none gap-1.5"
            >
              <Plus className="size-3.5" />
              New Component
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              router.push("/");
            }}
            className="h-7 px-2.5 text-xs font-sans rounded-none gap-1.5"
          >
            <Layers className="size-3.5" />
            Component Hub
          </Button>
        </div>

        {/* Component Results List */}
        <div
          role="listbox"
          aria-label="Component search results"
          className="flex flex-col max-h-[55vh] overflow-y-auto divide-y divide-border/60"
        >
          {filteredComponents.length === 0 ? (
            <div className="py-10 px-4 text-center font-sans text-xs text-muted-foreground">
              No components matched &ldquo;{query}&rdquo;.
            </div>
          ) : (
            filteredComponents.map((comp, index) => {
              const slug = comp.repoSlug || toClientSlug(comp.name, comp.id);
              const isCopied = copiedSlug === slug;
              const isSelected = index === activeIndex;
              return (
                <div
                  key={comp.id}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => handleOpenInStudio(comp.id, slug)}
                  className={cn(
                    "flex items-center justify-between gap-3 px-4 py-2.5 transition-colors cursor-pointer",
                    isSelected ? "bg-muted/60" : "hover:bg-muted/40"
                  )}
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-xs font-medium text-foreground truncate">
                        {comp.name}
                      </span>
                      <Badge
                        variant="secondary"
                        className="font-sans text-[10px] rounded-none px-1.5 py-0 h-4 shrink-0"
                      >
                        {comp.category || "Custom"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[11px] text-muted-foreground truncate">
                        {slug}
                      </span>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-1.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleCopyShadcnCli(e, slug)}
                      className="h-7 px-2 text-[11px] font-sans rounded-none gap-1.5"
                      title={`Copy npx shadcn@latest add ${origin}/api/registry/${slug}`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="size-3 text-emerald-500" />
                          <span>Copied CLI</span>
                        </>
                      ) : (
                        <>
                          <Terminal className="size-3 text-muted-foreground" />
                          <span>shadcn CLI</span>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleOpenInStudio(comp.id, slug)}
                      className="h-7 px-2.5 text-[11px] font-sans rounded-none gap-1"
                    >
                      <span>Open</span>
                      <ArrowRight className="size-3" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
