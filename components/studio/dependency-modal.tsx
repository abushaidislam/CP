"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useStudioStore } from "@/lib/store/studio-store";
import {
  CURATED_PACKAGES,
  extractCodeImports,
  isValidPackageName,
} from "@/lib/sandbox/package-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  Plus,
  Trash2,
  Check,
  Search,
  ExternalLink,
  Sparkles,
  Loader2,
  AlertCircle,
  FolderMinus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NpmSearchResult {
  name: string;
  version: string;
  description: string;
  publisher?: string;
  npmUrl: string;
}

export function DependencyModal() {
  const {
    files,
    dependencies,
    addDependency,
    removeDependency,
    toggleDependency,
    syncDependenciesWithCode,
    pruneUnusedDependencies,
    clearAllDependencies,
    isDependencyModalOpen,
    setDependencyModalOpen,
  } = useStudioStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchResults, setSearchResults] = useState<NpmSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  const codeImports = useMemo(() => {
    const compImports = extractCodeImports(files["component.tsx"] || "");
    const demoImports = extractCodeImports(files["demo.tsx"] || "");
    return Array.from(new Set([...compImports, ...demoImports]));
  }, [files]);

  const missingImports = useMemo(() => {
    return codeImports.filter((imp) => !dependencies.includes(imp));
  }, [codeImports, dependencies]);

  const unusedDependencies = useMemo(() => {
    return dependencies.filter((dep) => !codeImports.includes(dep));
  }, [dependencies, codeImports]);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(
          `/api/packages/search?q=${encodeURIComponent(trimmed)}`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch (err) {
        console.error("Failed to query npm registry:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = searchQuery.trim();
    if (!clean) return;

    if (!isValidPackageName(clean)) {
      setErrorMessage("Please enter a valid npm package name (e.g. vaul or @radix-ui/react-dialog)");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    addDependency(clean);
    setSearchQuery("");
    setSearchResults([]);
    setErrorMessage(null);
  };

  const handleSyncWithCode = () => {
    if (missingImports.length === 0) return;
    syncDependenciesWithCode(missingImports);
    setSyncSuccessMessage(`Added ${missingImports.length} package(s) detected in your code`);
    setTimeout(() => setSyncSuccessMessage(null), 3000);
  };

  const handlePruneUnused = () => {
    pruneUnusedDependencies(codeImports);
  };

  const filteredCurated = useMemo(() => {
    if (selectedCategory === "all") return CURATED_PACKAGES;
    return CURATED_PACKAGES.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <Dialog open={isDependencyModalOpen} onOpenChange={setDependencyModalOpen}>
      <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto overflow-x-hidden flex flex-col border border-border bg-card p-0 gap-0 rounded-none font-sans">
        {/* Architectural Header Bar */}
        <DialogHeader className="studio-toolbar-surface border-b border-border px-6 py-4 pr-12 shrink-0">
          <div className="flex items-center gap-2">
            <Badge variant="eyebrow" className="rounded-none">
              ESM MODULE REGISTRY
            </Badge>
          </div>
          <div className="flex items-start gap-3 mt-1.5">
            <div className="flex size-9 items-center justify-center rounded-none border border-border bg-background text-foreground shrink-0 mt-0.5">
              <Package className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                  Dependency Manager
                </DialogTitle>
                <Badge variant="outline" className="rounded-none text-[10px]">
                  {dependencies.length} Active
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Manage live ESM modules from npm. Automatically sync packages imported in your TSX code.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Smart Code Import Sync Bar */}
          <div className="rounded-none border border-border bg-background p-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="size-1.5 rounded-none bg-primary" />
                  Code references: <strong className="text-foreground">{codeImports.length}</strong>
                </span>
                <Separator orientation="vertical" className="h-3" />
                {missingImports.length > 0 ? (
                  <span className="text-amber-500 font-medium">
                    {missingImports.length} missing from sandbox
                  </span>
                ) : (
                  <span className="text-emerald-500 font-medium">
                    100% synchronized
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {missingImports.length > 0 && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSyncWithCode}
                    className="rounded-none h-6 px-2.5 text-[11px] gap-1"
                  >
                    <Sparkles className="size-3" />
                    <span>Auto-Sync ({missingImports.length})</span>
                  </Button>
                )}

                {unusedDependencies.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePruneUnused}
                    className="rounded-none h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                    title="Remove packages not imported in current code"
                  >
                    <FolderMinus className="size-3 mr-1" />
                    <span>Prune Unused ({unusedDependencies.length})</span>
                  </Button>
                )}
              </div>
            </div>

            {syncSuccessMessage && (
              <div className="mt-2 text-[11px] text-emerald-500 flex items-center gap-1 animate-in fade-in">
                <Check className="size-3" />
                <span>{syncSuccessMessage}</span>
              </div>
            )}
          </div>

          {/* Live NPM Search Input Bar */}
          <div className="relative">
            <form onSubmit={handleAddCustom} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search npm registry (e.g. vaul, recharts, @radix-ui/react-tooltip)..."
                  className="pl-9 pr-8 h-9 text-xs rounded-none bg-background border-border"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground animate-spin pointer-events-none" />
                )}
              </div>
              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={!searchQuery.trim()}
                className="rounded-none h-9 px-3.5 text-xs"
              >
                <Plus className="size-3.5" />
                <span>Add</span>
              </Button>
            </form>

            {errorMessage && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive font-sans animate-in fade-in">
                <AlertCircle className="size-3.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Live Search Results Dropdown Overlay */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-10 z-50 max-h-56 overflow-y-auto rounded-none border border-border bg-popover p-1 shadow-xl animate-in fade-in">
                <div className="px-2.5 py-1 text-[10px] font-mono uppercase text-muted-foreground">
                  NPM Search Results ({searchResults.length})
                </div>
                <Separator className="my-1" />
                {searchResults.map((result) => {
                  const isInstalled = dependencies.includes(result.name);
                  return (
                    <div
                      key={result.name}
                      className="flex items-center justify-between rounded-none p-2 hover:bg-accent transition-colors duration-150"
                    >
                      <div className="flex-1 pr-3 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-foreground truncate">
                            {result.name}
                          </span>
                          <Badge variant="outline" className="rounded-none text-[9px] px-1 py-0 font-mono">
                            v{result.version}
                          </Badge>
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                          {result.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={result.npmUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-none p-1 text-muted-foreground hover:text-foreground transition-colors"
                          title="View on npmjs.com"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>

                        <Button
                          variant={isInstalled ? "secondary" : "default"}
                          size="sm"
                          onClick={() => toggleDependency(result.name)}
                          className="rounded-none h-7 px-2.5 text-xs"
                        >
                          {isInstalled ? (
                            <>
                              <Check className="size-3 text-emerald-500 mr-1" />
                              <span>Installed</span>
                            </>
                          ) : (
                            <>
                              <Plus className="size-3 mr-1" />
                              <span>Install</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Installed Packages */}
          <div>
            <div className="flex items-center justify-between text-muted-foreground font-sans">
              <span className="font-mono text-[10px] font-medium uppercase tracking-wider">
                Installed Packages ({dependencies.length})
              </span>
              {dependencies.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={clearAllDependencies}
                  className="rounded-none h-5 px-1.5 text-[10px] text-muted-foreground hover:text-destructive cursor-pointer font-sans"
                >
                  Clear all
                </Button>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {dependencies.length > 0 ? (
                dependencies.map((dep) => {
                  const isUsedInCode = codeImports.includes(dep);
                  return (
                    <Badge
                      key={dep}
                      variant="outline"
                      className="group flex items-center gap-1.5 rounded-none bg-background px-2.5 py-1 text-xs text-foreground font-normal border-border"
                    >
                      <span
                        className={`size-1.5 rounded-none ${
                          isUsedInCode ? "bg-emerald-500" : "bg-muted-foreground/50"
                        }`}
                        title={isUsedInCode ? "Referenced in TSX code" : "Not imported in code"}
                      />
                      <Package className="size-3 text-primary" />
                      <span className="font-mono text-[11px]">{dep}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => removeDependency(dep)}
                        className="size-4 rounded-none p-0 ml-1 text-muted-foreground hover:text-destructive cursor-pointer"
                        title={`Remove ${dep}`}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </Badge>
                  );
                })
              ) : (
                <div className="py-2 text-xs text-muted-foreground">
                  No external packages installed. Add from search or curated list below.
                </div>
              )}
            </div>
          </div>

          {/* Curated 21st.dev Ecosystem Catalog */}
          <div className="space-y-2.5 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Curated 21st.dev Libraries
              </span>

              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="h-6 p-0.5 rounded-none border border-border bg-muted/60">
                  {[
                    { id: "all", label: "All" },
                    { id: "animation", label: "Animation" },
                    { id: "ui", label: "UI Primitives" },
                    { id: "icons", label: "Icons" },
                    { id: "utilities", label: "Utils" },
                    { id: "data", label: "Charts" },
                  ].map((cat) => (
                    <TabsTrigger
                      key={cat.id}
                      value={cat.id}
                      className="h-5 px-2 text-[10px] rounded-none data-[state=active]:bg-background"
                    >
                      {cat.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Connected Hairline Curated Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border border border-border max-h-52 overflow-y-auto rounded-none">
              {filteredCurated.map((pkg) => {
                const isInstalled = dependencies.includes(pkg.name);
                const isUsedInCode = codeImports.includes(pkg.name);

                return (
                  <Button
                    key={pkg.name}
                    type="button"
                    variant="ghost"
                    onClick={() => toggleDependency(pkg.name)}
                    className={cn(
                      "h-auto w-full whitespace-normal overflow-hidden text-left flex cursor-pointer items-start justify-between rounded-none p-3 transition-colors select-none",
                      isInstalled
                        ? "bg-muted/80 text-foreground ring-1 ring-inset ring-primary"
                        : "bg-background text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    )}
                  >
                    <div className="flex-1 pr-2 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-foreground truncate">
                          {pkg.name}
                        </span>
                        {isInstalled && (
                          <Badge variant="blue" className="rounded-none text-[9px] px-1 py-0">
                            Active
                          </Badge>
                        )}
                        {isUsedInCode && (
                          <Badge variant="success" className="rounded-none text-[9px] px-1 py-0">
                            In Code
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 line-clamp-1 whitespace-normal break-words text-[11px] text-muted-foreground">
                        {pkg.desc}
                      </div>
                    </div>

                    <div className="mt-0.5 shrink-0">
                      {isInstalled ? (
                        <Check className="size-4 text-primary" />
                      ) : (
                        <Plus className="size-4 text-muted-foreground" />
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky Architectural Footer */}
        <DialogFooter className="studio-toolbar-surface sticky bottom-0 z-10 flex items-center justify-between border-t border-border px-6 py-3.5 bg-card/95 backdrop-blur-xs">
          <div className="text-[11px] text-muted-foreground">
            Runtime CDN: <span className="text-foreground font-medium">esm.sh (React 19)</span>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={() => setDependencyModalOpen(false)}
            className="rounded-none px-5 h-8 text-xs font-medium"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
