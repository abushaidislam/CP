"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useStudioStore } from "@/lib/store/studio-store";
import {
  CURATED_PACKAGES,
  CuratedPackage,
  extractCodeImports,
  isValidPackageName,
} from "@/lib/sandbox/package-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Plus,
  Trash2,
  Check,
  Search,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Loader2,
  AlertCircle,
  FolderMinus,
  Layers,
} from "lucide-react";

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

  // Extract all external packages currently referenced in user's TSX code
  const codeImports = useMemo(() => {
    const compImports = extractCodeImports(files["component.tsx"] || "");
    const demoImports = extractCodeImports(files["demo.tsx"] || "");
    return Array.from(new Set([...compImports, ...demoImports]));
  }, [files]);

  // Packages in code that aren't yet in the active dependencies list
  const missingImports = useMemo(() => {
    return codeImports.filter((imp) => !dependencies.includes(imp));
  }, [codeImports, dependencies]);

  // Packages in dependencies list that aren't imported in code
  const unusedDependencies = useMemo(() => {
    return dependencies.filter((dep) => !codeImports.includes(dep));
  }, [dependencies, codeImports]);

  // Live NPM registry search with 300ms debounce
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

  // Filter curated packages by active category
  const filteredCurated = useMemo(() => {
    if (selectedCategory === "all") return CURATED_PACKAGES;
    return CURATED_PACKAGES.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <Dialog open={isDependencyModalOpen} onOpenChange={setDependencyModalOpen}>
      <DialogContent className="max-w-2xl border-border bg-background shadow-xl rounded-xl p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
                <Package className="size-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                    Dependency Manager
                  </DialogTitle>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {dependencies.length} Active
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Manage live ESM modules from npm. Automatically sync packages imported in your TSX code.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Smart Code Import Sync Bar */}
        <div className="mt-2 rounded-lg border border-border bg-muted/40 p-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-1.5 rounded-full bg-primary" />
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
                  className="h-6 px-2.5 text-[11px] gap-1 shadow-xs"
                >
                  <Sparkles className="size-3" />
                  Auto-Sync ({missingImports.length})
                </Button>
              )}

              {unusedDependencies.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePruneUnused}
                  className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  title="Remove packages not imported in current code"
                >
                  <FolderMinus className="size-3 mr-1" />
                  Prune Unused ({unusedDependencies.length})
                </Button>
              )}
            </div>
          </div>

          {syncSuccessMessage && (
            <div className="mt-2 text-[11px] font-mono text-emerald-500 flex items-center gap-1 animate-in fade-in">
              <Check className="size-3" />
              {syncSuccessMessage}
            </div>
          )}
        </div>

        {/* Live NPM Search Input Bar */}
        <div className="mt-3 relative">
          <form onSubmit={handleAddCustom} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search npm registry (e.g. vaul, recharts, @radix-ui/react-tooltip)..."
                className="pl-9 pr-8 h-9 text-xs"
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
              className="h-9 px-3 text-xs"
            >
              <Plus className="size-3.5" />
              Add
            </Button>
          </form>

          {errorMessage && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive font-mono animate-in fade-in">
              <AlertCircle className="size-3.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Live Search Results Dropdown Overlay */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-11 z-50 max-h-56 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-lg backdrop-blur-md animate-in fade-in">
              <div className="px-2.5 py-1 text-[10px] font-mono uppercase text-muted-foreground">
                NPM Search Results ({searchResults.length})
              </div>
              <Separator className="my-1" />
              {searchResults.map((result) => {
                const isInstalled = dependencies.includes(result.name);
                return (
                  <div
                    key={result.name}
                    className="flex items-center justify-between rounded-md p-2 hover:bg-accent transition-colors"
                  >
                    <div className="flex-1 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {result.name}
                        </span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono">
                          v{result.version}
                        </Badge>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                        {result.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={result.npmUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                        title="View on npmjs.com"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>

                      <Button
                        variant={isInstalled ? "secondary" : "default"}
                        size="sm"
                        onClick={() => toggleDependency(result.name)}
                        className="h-7 px-2.5 text-xs"
                      >
                        {isInstalled ? (
                          <>
                            <Check className="size-3 text-emerald-500 mr-1" />
                            Installed
                          </>
                        ) : (
                          <>
                            <Plus className="size-3 mr-1" />
                            Install
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
        <div className="mt-3">
          <div className="flex items-center justify-between font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <span>Installed Packages ({dependencies.length})</span>
            {dependencies.length > 0 && (
              <button
                type="button"
                onClick={clearAllDependencies}
                className="hover:text-destructive transition-colors cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
            {dependencies.length > 0 ? (
              dependencies.map((dep) => {
                const isUsedInCode = codeImports.includes(dep);
                return (
                  <div
                    key={dep}
                    className="group flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs text-foreground shadow-xs transition-colors hover:border-border/80"
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        isUsedInCode ? "bg-emerald-500" : "bg-muted-foreground/50"
                      }`}
                      title={isUsedInCode ? "Referenced in TSX code" : "Not imported in code"}
                    />
                    <Package className="size-3 text-primary" />
                    <span className="font-mono text-[11px]">{dep}</span>
                    <button
                      type="button"
                      onClick={() => removeDependency(dep)}
                      className="ml-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                      title={`Remove ${dep}`}
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="py-2 text-xs text-muted-foreground font-mono">
                No external packages installed. Add from search or curated list below.
              </div>
            )}
          </div>
        </div>

        <Separator className="mt-3" />

        {/* Curated 21st.dev Ecosystem Catalog */}
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Curated 21st.dev Libraries
            </span>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1">
              {[
                { id: "all", label: "All" },
                { id: "animation", label: "Animation" },
                { id: "ui", label: "UI Primitives" },
                { id: "icons", label: "Icons" },
                { id: "utilities", label: "Utils" },
                { id: "data", label: "Charts" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Curated Cards Grid */}
          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {filteredCurated.map((pkg) => {
              const isInstalled = dependencies.includes(pkg.name);
              const isUsedInCode = codeImports.includes(pkg.name);

              return (
                <div
                  key={pkg.name}
                  onClick={() => toggleDependency(pkg.name)}
                  className={`flex cursor-pointer items-start justify-between rounded-lg border p-2.5 transition-all ${
                    isInstalled
                      ? "border-primary/40 bg-primary/5 text-foreground shadow-xs"
                      : "border-border bg-card text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  }`}
                >
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {pkg.name}
                      </span>
                      {isInstalled && (
                        <Badge variant="blue" className="text-[9px] px-1 py-0">
                          Active
                        </Badge>
                      )}
                      {isUsedInCode && (
                        <Badge variant="success" className="text-[9px] px-1 py-0">
                          In Code
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
                      {pkg.desc}
                    </div>
                  </div>

                  <div className="mt-0.5">
                    {isInstalled ? (
                      <Check className="size-4 text-primary" />
                    ) : (
                      <Plus className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <div className="font-mono text-[10px] text-muted-foreground">
            Runtime CDN: <span className="text-foreground">esm.sh (React 19 compatible)</span>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={() => setDependencyModalOpen(false)}
            className="px-5 h-8 text-xs font-medium"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
