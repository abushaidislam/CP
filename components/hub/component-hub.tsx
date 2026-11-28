"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  createInitialUserComponents,
  useStudioStore,
  type ComponentVariant,
  type RepoSummaryInput,
  type UserComponent,
} from "@/lib/store/studio-store";
import { DEFAULT_TEMPLATES } from "@/lib/sandbox/default-templates";
import { useSyncSecuritySession } from "@/lib/hooks/use-sync-security-session";
import { ComponentCard } from "./component-card";
import { CreateComponentDialog } from "./create-component-dialog";
import { EditComponentDialog } from "./edit-component-dialog";
import { QuickPreviewModal } from "./quick-preview-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AppLogo } from "@/components/ui/app-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  FolderSearch,
  RotateCcw,
  ArrowLeft,
  X,
  Keyboard,
  ShieldCheck,
  Lock,
  FolderGit2,
  Cpu,
} from "lucide-react";
import { KeyboardShortcutsDialog } from "@/components/studio/keyboard-shortcuts-dialog";
import { SecurityShieldModal } from "@/components/studio/security-shield-modal";
import { RepoSyncModal } from "@/components/studio/repo-sync-modal";
import { McpConnectDialog } from "@/components/mcp/mcp-connect-dialog";
import { CommandPaletteDialog } from "./command-palette-dialog";
import { useMcpLiveSync } from "@/lib/hooks/use-mcp-live-sync";

export interface ComponentHubProps {
  onNavigateStudio?: (componentId: string) => void;
  initialSearchQuery?: string;
  initialCategory?: CategoryType;
  initialSummaries?: RepoSummaryInput[];
}

const CATEGORIES = [
  "All",
  "Newest",
  "Recent Work",
  "Heroes",
  "Cards",
  "Buttons",
  "Badges",
  "Custom",
] as const;

const COMPONENTS_PER_BATCH = 24;

export type CategoryType = (typeof CATEGORIES)[number];

export function ComponentHub({
  onNavigateStudio,
  initialSearchQuery = "",
  initialCategory = "All",
  initialSummaries,
}: ComponentHubProps) {
  const {
    userComponents,
    recentComponentIds,
    variantsByTemplate,
    quickPreviewComponentId,
    isCreateComponentDialogOpen,
    isEditComponentDialogOpen,
    isSecurityModalOpen,
    isRepoSyncModalOpen,
    isPublishModalOpen,
    setQuickPreviewComponentId,
    setCreateComponentDialogOpen,
    duplicateUserComponent,
    deleteUserComponent,
    loadComponent,
    isOwnerAuthenticated,
    setSecurityModalOpen,
    setRepoSyncModalOpen,
    hydrateFromProjectRepo,
    seedRepoSummaries,
  } = useStudioStore(
    useShallow((state) => ({
      userComponents: state.userComponents,
      recentComponentIds: state.recentComponentIds,
      variantsByTemplate: state.variantsByTemplate,
      quickPreviewComponentId: state.quickPreviewComponentId,
      isCreateComponentDialogOpen: state.isCreateComponentDialogOpen,
      isEditComponentDialogOpen: state.isEditComponentDialogOpen,
      isSecurityModalOpen: state.isSecurityModalOpen,
      isRepoSyncModalOpen: state.isRepoSyncModalOpen,
      isPublishModalOpen: state.isPublishModalOpen,
      setQuickPreviewComponentId: state.setQuickPreviewComponentId,
      setCreateComponentDialogOpen: state.setCreateComponentDialogOpen,
      duplicateUserComponent: state.duplicateUserComponent,
      deleteUserComponent: state.deleteUserComponent,
      loadComponent: state.loadComponent,
      isOwnerAuthenticated: state.isOwnerAuthenticated,
      setSecurityModalOpen: state.setSecurityModalOpen,
      setRepoSyncModalOpen: state.setRepoSyncModalOpen,
      hydrateFromProjectRepo: state.hydrateFromProjectRepo,
      seedRepoSummaries: state.seedRepoSummaries,
    }))
  );

  const hasSeededSummariesRef = useRef(false);
  const [hasHydratedSummaries, setHasHydratedSummaries] = useState(false);

  useSyncSecuritySession();

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>(initialCategory);
  const [visibleComponentCount, setVisibleComponentCount] = useState(COMPONENTS_PER_BATCH);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isMcpConnectOpen, setIsMcpConnectOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const { lastSyncedEvent } = useMcpLiveSync();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Seed/hydrate saved repo components post-render
  useEffect(() => {
    if (initialSummaries && initialSummaries.length > 0) {
      if (!hasSeededSummariesRef.current) {
        hasSeededSummariesRef.current = true;
        seedRepoSummaries(initialSummaries);
      }
    } else {
      hydrateFromProjectRepo?.();
    }
    setHasHydratedSummaries(true);
  }, [hydrateFromProjectRepo, initialSummaries, seedRepoSummaries]);

  // When initialSummaries is passed from SSR (app/page.tsx), use deterministic initial store state
  // on both server and initial client hydration pass so persisted localStorage state never causes a hydration mismatch.
  const isServerSeededInitialPass =
    initialSummaries !== undefined && !hasHydratedSummaries;

  const effectiveRecentComponentIds = useMemo<string[]>(() => {
    if (isServerSeededInitialPass) {
      return [DEFAULT_TEMPLATES[0].id];
    }
    return recentComponentIds || [];
  }, [isServerSeededInitialPass, recentComponentIds]);

  const effectiveVariantsByTemplate = useMemo<
    Record<string, ComponentVariant[]>
  >(() => {
    if (isServerSeededInitialPass) {
      return {};
    }
    return variantsByTemplate || {};
  }, [isServerSeededInitialPass, variantsByTemplate]);

  const effectiveUserComponents = useMemo<Record<string, UserComponent>>(() => {
    if (!isServerSeededInitialPass) {
      return userComponents || {};
    }
    const hasInitialSummaries = Boolean(initialSummaries && initialSummaries.length > 0);
    const merged: Record<string, UserComponent> = hasInitialSummaries
      ? {}
      : createInitialUserComponents();
    for (const s of initialSummaries || []) {
      const existing = merged[s.id];
      if (!existing) {
        merged[s.id] = {
          id: s.id,
          name: s.name,
          description: s.description,
          category: s.category,
          isBuiltIn: s.isBuiltIn,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          files: {
            "component.tsx": "",
            "default.tsx": "",
            "demo.tsx": "",
            "index.css": "",
          },
          dependencies: s.dependencies || [],
          previewImage: s.previewImage,
          repoSlug: s.repoSlug,
          repoPath: s.repoPath,
          savedInRepo: true,
          lastRepoSyncAt: s.lastRepoSyncAt,
          filesLoaded: false,
        };
      }
    }
    return merged;
  }, [userComponents, initialSummaries, isServerSeededInitialPass]);

  const allComponents = useMemo(
    () => Object.values(effectiveUserComponents),
    [effectiveUserComponents]
  );

  const recentCount = useMemo(() => {
    const existingIds = new Set(allComponents.map((c) => c.id));
    return effectiveRecentComponentIds.filter((id) => existingIds.has(id)).length;
  }, [allComponents, effectiveRecentComponentIds]);

  // Keep the root library ordered by most recently updated component.
  const newestComponents = useMemo(
    () =>
      [...allComponents].sort(
        (a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)
      ),
    [allComponents]
  );

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryType, number> = {
      All: allComponents.length,
      Newest: allComponents.length,
      "Recent Work": recentCount,
      Heroes: 0,
      Cards: 0,
      Buttons: 0,
      Badges: 0,
      Custom: 0,
    };

    allComponents.forEach((c) => {
      const cat = c.category?.toLowerCase();
      if (cat === "heroes") counts.Heroes++;
      else if (cat === "cards") counts.Cards++;
      else if (cat === "buttons") counts.Buttons++;
      else if (cat === "badges") counts.Badges++;
      else counts.Custom++;
    });

    return counts;
  }, [allComponents, recentCount]);

  // Filtered and sorted components list
  const filteredComponents = useMemo(() => {
    let list: UserComponent[] = [];

    if (selectedCategory === "Recent Work") {
      const compMap = effectiveUserComponents;
      list = effectiveRecentComponentIds
        .map((id) => compMap[id])
        .filter((c): c is UserComponent => Boolean(c));
    } else if (selectedCategory === "All" || selectedCategory === "Newest") {
      list = newestComponents;
    } else if (selectedCategory === "Custom") {
      list = allComponents
        .filter(
          (c) =>
            c.category?.toLowerCase() === "custom" ||
            !["heroes", "cards", "buttons", "badges"].includes(
              c.category?.toLowerCase()
            )
        )
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    } else {
      list = allComponents
        .filter(
          (c) => c.category?.toLowerCase() === selectedCategory.toLowerCase()
        )
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q)) ||
          (c.category && c.category.toLowerCase().includes(q)) ||
          (c.repoSlug && c.repoSlug.toLowerCase().includes(q)) ||
          c.id.toLowerCase().includes(q)
      );
    }

    return list;
  }, [
    effectiveUserComponents,
    allComponents,
    newestComponents,
    effectiveRecentComponentIds,
    selectedCategory,
    searchQuery,
  ]);

  useEffect(() => {
    setVisibleComponentCount(COMPONENTS_PER_BATCH);
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || visibleComponentCount >= filteredComponents.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleComponentCount((count) =>
            Math.min(count + COMPONENTS_PER_BATCH, filteredComponents.length)
          );
        }
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredComponents.length, visibleComponentCount]);

  const handleOpenStudio = useCallback(
    (id: string) => {
      loadComponent(id);
      onNavigateStudio?.(id);
    },
    [loadComponent, onNavigateStudio]
  );

  const handleCreated = useCallback(
    (newId: string) => {
      loadComponent(newId);
      onNavigateStudio?.(newId);
    },
    [loadComponent, onNavigateStudio]
  );

  const handlePreview = useCallback(
    (id: string) => {
      setQuickPreviewComponentId(id);
    },
    [setQuickPreviewComponentId]
  );

  const handleDuplicate = useCallback(
    (id: string) => {
      duplicateUserComponent(id);
    },
    [duplicateUserComponent]
  );

  const handleDelete = useCallback(
    (id: string) => {
      return deleteUserComponent(id, { awaitServer: true });
    },
    [deleteUserComponent]
  );

  const renderCardGrid = (items: UserComponent[], prioritizeFirstRow = false) => (
    <div className="overflow-hidden bg-transparent">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((component, idx) => {
          const variants = effectiveVariantsByTemplate[component.id] || [];
          const variantsCount = variants.length || 1;
          const checkpointsCount = variants.reduce(
            (acc, v) => acc + (v.checkpoints?.length || 0),
            0
          );
          const isRecent = effectiveRecentComponentIds.includes(component.id);

          return (
            <ComponentCard
              key={component.id}
              component={component}
              variantsCount={variantsCount}
              checkpointsCount={checkpointsCount}
              isRecent={isRecent}
              priority={prioritizeFirstRow && idx < 4}
              onPreview={handlePreview}
              onOpenStudio={handleOpenStudio}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          );
        })}
      </div>
    </div>
  );

  return (
      <div className="flex flex-col min-h-screen w-full bg-background text-foreground font-sans selection:bg-primary/20 selection:text-foreground">
        {/* 1. Top Navigation Bar with Pure Icon Action Buttons */}
        <header className="studio-glass-header sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6 select-none">
          {/* Brand / Title & Workspace Eyebrow */}
          <div className="flex items-center gap-2.5">
            <AppLogo size="md" priority />
            <div className="flex items-center gap-2">
              <h1 className="font-sans font-semibold text-sm sm:text-base tracking-tight text-foreground m-0">
                Component Studio
              </h1>
              <Badge variant="eyebrow" className="rounded-none font-sans">
                21ST WORKSPACE
              </Badge>
            </div>
          </div>

          {/* Right Actions: Command Palette, Security Shield, Keyboard Shortcuts, Theme Toggle & New Component Button */}
          <div className="flex items-center gap-1.5">
            {lastSyncedEvent && (
              <Badge
                variant="secondary"
                className="hidden sm:inline-flex font-sans text-[10px] rounded-none bg-sky-500/10 text-sky-400 border border-sky-500/30 gap-1.5 px-2 py-0.5"
              >
                <Cpu className="size-3" />
                <span>{lastSyncedEvent.message}</span>
              </Badge>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsCommandPaletteOpen(true)}
                  className="sm:hidden studio-icon-btn size-8 rounded-none border-border/80 bg-card/70 text-muted-foreground hover:text-foreground"
                  aria-label="Open Command Palette (Ctrl+K)"
                >
                  <Search className="size-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-sans text-xs">
                Quick Jump (⌘K)
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCommandPaletteOpen(true)}
                  className="hidden sm:inline-flex h-8 rounded-none border-border/80 bg-card/70 text-muted-foreground hover:text-foreground font-sans text-xs gap-2 px-2.5"
                  aria-label="Open Command Palette (Ctrl+K)"
                >
                  <Search className="size-3.5" aria-hidden="true" />
                  <span>Quick Jump</span>
                  <kbd className="font-mono text-[10px] bg-muted px-1 py-0.2 border border-border/60">
                    ⌘K
                  </kbd>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-sans text-xs">
                Command Palette &amp; shadcn CLI Search (⌘K / Ctrl+K)
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSecurityModalOpen(true)}
                  className={cn(
                    "studio-icon-btn size-8 rounded-none border-border/80",
                    isOwnerAuthenticated
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/40 hover:bg-emerald-500/20"
                      : "bg-card/70 text-amber-500 hover:text-amber-400 border-amber-500/30"
                  )}
                  aria-label={
                    isOwnerAuthenticated
                      ? "Security Shield (Owner Session Active)"
                      : "Security Shield (Read-Only · Unlock Owner Session)"
                  }
                >
                  {isOwnerAuthenticated ? (
                    <ShieldCheck className="size-4 text-emerald-500" aria-hidden="true" />
                  ) : (
                    <Lock className="size-4 text-amber-500" aria-hidden="true" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-sans text-xs">
                {isOwnerAuthenticated
                  ? "Security Shield: Owner Verified (AI Credits Active)"
                  : "Security Shield: Read-Only Mode (Click to Unlock AI Credits)"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsShortcutsOpen(true)}
                  className="studio-icon-btn size-8 rounded-none border-border/80 bg-card/70 text-muted-foreground hover:text-foreground"
                  aria-label="Keyboard shortcuts"
                >
                  <Keyboard className="size-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-sans text-xs">
                Keyboard shortcuts (?)
              </TooltipContent>
            </Tooltip>

            <ThemeToggle />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setRepoSyncModalOpen?.(true)}
                  className="studio-icon-btn size-8 rounded-none border-border/80 bg-card/70 text-muted-foreground hover:text-foreground"
                  aria-label="Sync components to project repository & GitHub"
                >
                  <FolderGit2 className="size-4 text-primary" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-sans text-xs">
                Save & Sync Components to Project Repo (registry/components/)
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsMcpConnectOpen(true)}
                  className="studio-icon-btn size-8 rounded-none border-border/80 bg-card/70 text-muted-foreground hover:text-foreground"
                  aria-label="Connect AI via MCP (Gemini, Antigravity, Claude, Cursor)"
                >
                  <Cpu className="size-4 text-sky-400" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-sans text-xs">
                Connect AI via MCP (Gemini, Antigravity, Claude, Cursor)
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="icon"
                  onClick={() => setCreateComponentDialogOpen(true)}
                  aria-label="Create new component"
                  className="size-8 rounded-none shadow-none"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  <span className="sr-only">New Component</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-sans text-xs">
                Create New Component
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* Main Showcase Area */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6 focus:outline-none"
        >
          {/* Screen-reader live region announcing filter/search result count */}
          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {`Showing ${filteredComponents.length} ${
              filteredComponents.length === 1 ? "component" : "components"
            } in ${selectedCategory}${searchQuery.trim() ? ` matching "${searchQuery.trim()}"` : ""}`}
          </div>

          {/* Architectural Filter & Search Control Bar (Zero Radius) */}
          <section
            aria-label="Filter and search toolbar"
            className="studio-toolbar-surface rounded-none border border-border p-2 sm:p-2.5 flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center justify-between"
          >
            {/* Category Filter Navigation */}
            <div
              role="group"
              aria-label="Component category filters"
              className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none"
            >
              {CATEGORIES.map((category) => {
                const isActive = selectedCategory === category;
                const count = categoryCounts[category];
                return (
                  <Button
                    key={category}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    aria-pressed={isActive}
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      "h-8 rounded-none px-3 text-xs font-sans gap-1.5 transition-colors select-none shrink-0",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-none"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    <span>{category}</span>
                    <Badge
                      variant="secondary"
                      suppressHydrationWarning
                      className={cn(
                        "px-1.5 py-0 text-[10px] font-sans tabular-nums rounded-none",
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {count}
                    </Badge>
                  </Button>
                );
              })}
            </div>

            {/* Search Input with Search Icon */}
            <div className="relative w-full lg:w-80 shrink-0">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none"
              />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search components by name or description"
                placeholder="Search components by name or description..."
                className="pl-9 pr-8 rounded-none font-sans text-xs h-8 bg-background border-border"
              />
              {searchQuery.trim().length > 0 && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search query"
                  className="absolute right-1 top-1/2 -translate-y-1/2 size-6 rounded-none text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </Button>
              )}
            </div>
          </section>

          {/* Single time-sorted component library */}
          <section aria-label="Component cards grid" className="space-y-8">
            {filteredComponents.length > 0 ? (
              <div className="rounded-none bg-transparent">
                  {/* Integrated Architectural Filtered Header Bar */}
                  <div className="studio-toolbar-surface flex items-center justify-between border border-b-0 border-border px-4 py-2.5 rounded-none">
                    <div className="flex items-center gap-2.5">
                      <span className="font-sans text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {searchQuery.trim() ? "SEARCH QUERY" : "COMPONENT LIBRARY"}
                      </span>
                      <span className="text-border select-none">/</span>
                      <h2 className="font-sans text-sm sm:text-base font-semibold tracking-tight text-foreground">
                        {searchQuery.trim()
                          ? `Search results (${filteredComponents.length})`
                          : selectedCategory === "All" ? "All Components" : selectedCategory}
                      </h2>
                      <Badge
                        variant="secondary"
                        className="rounded-none px-1.5 py-0 text-[10px] font-sans tabular-nums"
                      >
                        {filteredComponents.length}
                      </Badge>
                    </div>
                    {(selectedCategory !== "All" || searchQuery.trim()) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => {
                              setSelectedCategory("All");
                              setSearchQuery("");
                            }}
                            aria-label="Back to all components"
                            className="studio-icon-btn size-7 rounded-none border-border/80 bg-background/80 text-muted-foreground hover:text-foreground"
                          >
                            <ArrowLeft className="size-3.5" />
                            <span className="sr-only">Back to all</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="font-sans text-xs">
                          Back to all components
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  {renderCardGrid(filteredComponents.slice(0, visibleComponentCount), true)}
                  {visibleComponentCount < filteredComponents.length && (
                    <div
                      ref={loadMoreRef}
                      aria-label="Loading more components as you scroll"
                      className="h-8"
                    />
                  )}
              </div>
            ) : (
              /* Clean Sharp Empty State (Zero Radius) */
              <div className="flex flex-col items-center justify-center rounded-none border border-dashed border-border p-12 text-center my-6 bg-card/60 backdrop-blur-xs">
                <FolderSearch className="size-10 text-muted-foreground/60 mb-3" />
                <h3 className="font-sans font-medium text-base text-foreground">
                  No components found
                </h3>
                <p className="font-sans text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                  No components match your search query or category filter. Try resetting your search or create a new component.
                </p>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedCategory("All");
                        }}
                        aria-label="Reset filters"
                        className="studio-icon-btn size-8 rounded-none"
                      >
                        <RotateCcw className="size-3.5" />
                        <span className="sr-only">Reset filters</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="font-sans text-xs">
                      Reset filters
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="default"
                        size="icon"
                        onClick={() => setCreateComponentDialogOpen(true)}
                        aria-label="Create new component"
                        className="size-8 rounded-none shadow-none"
                      >
                        <Plus className="size-3.5" />
                        <span className="sr-only">New Component</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="font-sans text-xs">
                      Create New Component
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}
          </section>
        </main>

        {/* Modal Integration (Conditionally mounted when active to avoid idle hook/render overhead) */}
        {isCreateComponentDialogOpen && <CreateComponentDialog onCreated={handleCreated} />}
        {isEditComponentDialogOpen && <EditComponentDialog />}
        {Boolean(quickPreviewComponentId) && <QuickPreviewModal onOpenStudio={handleOpenStudio} />}
        <KeyboardShortcutsDialog open={isShortcutsOpen} onOpenChange={setIsShortcutsOpen} />
        {isSecurityModalOpen && <SecurityShieldModal />}
        {(isRepoSyncModalOpen || isPublishModalOpen) && <RepoSyncModal />}
        <McpConnectDialog open={isMcpConnectOpen} onOpenChange={setIsMcpConnectOpen} />
        {isCommandPaletteOpen && (
          <CommandPaletteDialog
            open={isCommandPaletteOpen}
            onOpenChange={setIsCommandPaletteOpen}
            onOpenMcpConnect={() => setIsMcpConnectOpen(true)}
            onOpenCreateComponent={() => setCreateComponentDialogOpen(true)}
          />
        )}
      </div>
  );
}
