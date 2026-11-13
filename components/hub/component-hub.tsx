"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useStudioStore, UserComponent } from "@/lib/store/studio-store";
import { ComponentCard } from "./component-card";
import { CreateComponentDialog } from "./create-component-dialog";
import { QuickPreviewModal } from "./quick-preview-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  Sun,
  Moon,
  FolderSearch,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  X,
} from "lucide-react";

export interface ComponentHubProps {
  onNavigateStudio?: (componentId: string) => void;
  initialSearchQuery?: string;
  initialCategory?: CategoryType;
}

const CATEGORIES = [
  "All",
  "Newest",
  "Popular",
  "Recent Work",
  "Heroes",
  "Cards",
  "Buttons",
  "Badges",
  "Custom",
] as const;

export type CategoryType = (typeof CATEGORIES)[number];

export function ComponentHub({
  onNavigateStudio,
  initialSearchQuery = "",
  initialCategory = "All",
}: ComponentHubProps) {
  const {
    userComponents,
    recentComponentIds,
    variantsByTemplate,
    setQuickPreviewComponentId,
    setCreateComponentDialogOpen,
    duplicateUserComponent,
    deleteUserComponent,
    loadComponent,
  } = useStudioStore();

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>(initialCategory);
  const [isDark, setIsDark] = useState(true);

  // Sync theme with document element
  useEffect(() => {
    const root = document.documentElement;
    setIsDark(root.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains("dark")) {
      root.classList.remove("dark");
      setIsDark(false);
    } else {
      root.classList.add("dark");
      setIsDark(true);
    }
  };

  const allComponents = useMemo(
    () => Object.values(userComponents || {}),
    [userComponents]
  );

  const recentCount = useMemo(() => {
    const existingIds = new Set(allComponents.map((c) => c.id));
    return (recentComponentIds || []).filter((id) => existingIds.has(id)).length;
  }, [allComponents, recentComponentIds]);

  // Sorted newest & popular lists
  const newestComponents = useMemo(
    () =>
      [...allComponents].sort(
        (a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0)
      ),
    [allComponents]
  );

  const popularComponents = useMemo(() => {
    return [...allComponents].sort((a, b) => {
      const aVariants = variantsByTemplate?.[a.id]?.length || 0;
      const bVariants = variantsByTemplate?.[b.id]?.length || 0;
      if (bVariants !== aVariants) return bVariants - aVariants;
      const aRecent = (recentComponentIds || []).includes(a.id) ? 1 : 0;
      const bRecent = (recentComponentIds || []).includes(b.id) ? 1 : 0;
      if (bRecent !== aRecent) return bRecent - aRecent;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });
  }, [allComponents, variantsByTemplate, recentComponentIds]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryType, number> = {
      All: allComponents.length,
      Newest: allComponents.length,
      Popular: allComponents.length,
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
      const compMap = userComponents || {};
      list = (recentComponentIds || [])
        .map((id) => compMap[id])
        .filter((c): c is UserComponent => Boolean(c));
    } else if (selectedCategory === "All" || selectedCategory === "Newest") {
      list = newestComponents;
    } else if (selectedCategory === "Popular") {
      list = popularComponents;
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
          (c.description && c.description.toLowerCase().includes(q))
      );
    }

    return list;
  }, [
    userComponents,
    allComponents,
    newestComponents,
    popularComponents,
    recentComponentIds,
    selectedCategory,
    searchQuery,
  ]);

  // Logical, non-repetitive showcase sections when viewing "All" with no active search
  const showcaseSections = useMemo(() => {
    const sections: {
      id: string;
      eyebrow: string;
      title: string;
      targetCategory: CategoryType;
      items: UserComponent[];
    }[] = [];

    const newestSlice = newestComponents.slice(0, 4);
    const newestIds = new Set(newestSlice.map((c) => c.id));

    if (newestSlice.length > 0) {
      sections.push({
        id: "newest",
        eyebrow: "LATEST CONSTRUCTS",
        title: "Newest",
        targetCategory: "Newest",
        items: newestSlice,
      });
    }

    const distinctPopular = popularComponents.filter((c) => !newestIds.has(c.id));
    const popularSlice =
      distinctPopular.length >= 4
        ? distinctPopular.slice(0, 4)
        : [
            ...distinctPopular,
            ...popularComponents.filter((c) => newestIds.has(c.id)),
          ].slice(0, 4);

    if (popularSlice.length > 0) {
      sections.push({
        id: "popular",
        eyebrow: "MOST USED",
        title: "Popular",
        targetCategory: "Popular",
        items: popularSlice,
      });
    }

    const shownIds = new Set([
      ...newestSlice.map((c) => c.id),
      ...popularSlice.map((c) => c.id),
    ]);
    const remainingComponents = newestComponents.filter((c) => !shownIds.has(c.id));

    if (remainingComponents.length > 0) {
      sections.push({
        id: "more-components",
        eyebrow: "EXTENDED LIBRARY",
        title: "More Components",
        targetCategory: "Newest",
        items: remainingComponents,
      });
    }

    return sections;
  }, [newestComponents, popularComponents]);

  const handleOpenStudio = (id: string) => {
    loadComponent(id);
    onNavigateStudio?.(id);
  };

  const handleCreated = (newId: string) => {
    loadComponent(newId);
    onNavigateStudio?.(newId);
  };

  const renderCardGrid = (items: UserComponent[]) => (
    <div className="rounded-none border border-border overflow-hidden bg-border">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
        {items.map((component) => {
          const variants = variantsByTemplate?.[component.id] || [];
          const variantsCount = variants.length || 1;
          const checkpointsCount = variants.reduce(
            (acc, v) => acc + (v.checkpoints?.length || 0),
            0
          );
          const isRecent = (recentComponentIds || []).includes(component.id);

          return (
            <ComponentCard
              key={component.id}
              component={component}
              variantsCount={variantsCount}
              checkpointsCount={checkpointsCount}
              isRecent={isRecent}
              onPreview={(id) => setQuickPreviewComponentId(id)}
              onOpenStudio={handleOpenStudio}
              onDuplicate={(id) => duplicateUserComponent(id)}
              onDelete={(id) => deleteUserComponent(id)}
            />
          );
        })}
      </div>
    </div>
  );

  const showCuratedSections =
    selectedCategory === "All" && !searchQuery.trim() && filteredComponents.length > 0;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="studio-grid-backdrop flex flex-col min-h-screen w-full bg-background text-foreground font-sans selection:bg-primary/20 selection:text-foreground">
        {/* 1. Top Navigation Bar with Pure Icon Action Buttons */}
        <header className="studio-glass-header sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6 select-none">
          {/* Brand / Title & Workspace Eyebrow */}
          <div className="flex items-center gap-3">
            <div className="flex size-7 items-center justify-center rounded-none bg-foreground text-background">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <polygon points="12,2 22,20 2,20" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-sans font-semibold text-sm sm:text-base tracking-tight text-foreground">
                Component Studio
              </span>
              <Badge variant="eyebrow" className="rounded-none">
                21ST WORKSPACE
              </Badge>
            </div>
          </div>

          {/* Right Actions: Pure Icon-Only Theme Toggle & New Component Button */}
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleTheme}
                  className="studio-icon-btn size-8 rounded-none border-border/80 bg-card/70 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle theme"
                >
                  {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-sans text-xs">
                {isDark ? "Switch to light mode" : "Switch to dark mode"}
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
                  <Plus className="size-4" />
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
        <main className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
          {/* Architectural Filter & Search Control Bar (Zero Radius) */}
          <section
            aria-label="Filter and search toolbar"
            className="studio-toolbar-surface rounded-none border border-border p-2 sm:p-2.5 flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center justify-between"
          >
            {/* Category Filter Navigation */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              {CATEGORIES.map((category) => {
                const isActive = selectedCategory === category;
                const count = categoryCounts[category];
                return (
                  <Button
                    key={category}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
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
                  <X className="size-3.5" />
                </Button>
              )}
            </div>
          </section>

          {/* Component Showcase Sections / Grid */}
          <section aria-label="Component cards grid" className="space-y-8">
            {filteredComponents.length > 0 ? (
              showCuratedSections ? (
                showcaseSections.map((section) => (
                  <div key={section.id} className="rounded-none bg-card/80 backdrop-blur-xs">
                    {/* Integrated Architectural Section Header Bar */}
                    <div className="studio-toolbar-surface flex items-center justify-between border border-b-0 border-border px-4 py-2.5 rounded-none">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {section.eyebrow}
                        </span>
                        <span className="text-border select-none">/</span>
                        <h2 className="font-sans text-sm sm:text-base font-semibold tracking-tight text-foreground">
                          {section.title}
                        </h2>
                        <Badge
                          variant="secondary"
                          className="rounded-none px-1.5 py-0 text-[10px] font-sans tabular-nums"
                        >
                          {section.items.length}
                        </Badge>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => setSelectedCategory(section.targetCategory)}
                            aria-label={`View all ${section.title}`}
                            className="studio-icon-btn size-7 rounded-none border-border/80 bg-background/80 text-muted-foreground hover:text-foreground"
                          >
                            <ArrowRight className="size-3.5" />
                            <span className="sr-only">View all</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="font-sans text-xs">
                          View all {section.title}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {renderCardGrid(section.items)}
                  </div>
                ))
              ) : (
                <div className="rounded-none bg-card/80 backdrop-blur-xs">
                  {/* Integrated Architectural Filtered Header Bar */}
                  <div className="studio-toolbar-surface flex items-center justify-between border border-b-0 border-border px-4 py-2.5 rounded-none">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {searchQuery.trim() ? "SEARCH QUERY" : "CATEGORY FILTER"}
                      </span>
                      <span className="text-border select-none">/</span>
                      <h2 className="font-sans text-sm sm:text-base font-semibold tracking-tight text-foreground">
                        {searchQuery.trim()
                          ? `Search results (${filteredComponents.length})`
                          : selectedCategory}
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
                  {renderCardGrid(filteredComponents)}
                </div>
              )
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

        {/* Modal Integration */}
        <CreateComponentDialog onCreated={handleCreated} />
        <QuickPreviewModal onOpenStudio={handleOpenStudio} />
      </div>
    </TooltipProvider>
  );
}
