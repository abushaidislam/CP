"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useStudioStore, UserComponent } from "@/lib/store/studio-store";
import { ComponentCard } from "./component-card";
import { CreateComponentDialog } from "./create-component-dialog";
import { QuickPreviewModal } from "./quick-preview-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  Sun,
  Moon,
  FolderSearch,
  RotateCcw,
  ArrowRight,
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

  // Curated 21st.dev-style showcase sections when viewing "All" with no active search
  const showcaseSections = useMemo(() => {
    const sections: {
      id: string;
      title: string;
      targetCategory: CategoryType;
      items: UserComponent[];
    }[] = [];

    if (newestComponents.length > 0) {
      sections.push({
        id: "newest",
        title: "Newest",
        targetCategory: "Newest",
        items: newestComponents.slice(0, 4),
      });
    }

    if (popularComponents.length > 0) {
      sections.push({
        id: "popular",
        title: "Popular",
        targetCategory: "Popular",
        items: popularComponents.slice(0, 4),
      });
    }

    const categoryGroupings: { title: string; category: CategoryType }[] = [
      { title: "Heroes", category: "Heroes" },
      { title: "Cards", category: "Cards" },
      { title: "Buttons", category: "Buttons" },
      { title: "Badges", category: "Badges" },
      { title: "Custom", category: "Custom" },
    ];

    for (const group of categoryGroupings) {
      const groupItems = allComponents.filter((c) => {
        const cat = c.category?.toLowerCase() || "";
        if (group.category === "Custom") {
          return (
            cat === "custom" ||
            !["heroes", "cards", "buttons", "badges"].includes(cat)
          );
        }
        return cat === group.category.toLowerCase();
      });

      if (groupItems.length > 0) {
        sections.push({
          id: group.category.toLowerCase(),
          title: group.title,
          targetCategory: group.category,
          items: groupItems,
        });
      }
    }

    return sections;
  }, [allComponents, newestComponents, popularComponents]);

  const handleOpenStudio = (id: string) => {
    loadComponent(id);
    onNavigateStudio?.(id);
  };

  const handleCreated = (newId: string) => {
    loadComponent(newId);
    onNavigateStudio?.(newId);
  };

  const renderCardGrid = (items: UserComponent[]) => (
    <div className="rounded-xl border border-border/80 overflow-hidden bg-border/50 shadow-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border/60">
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
    <div className="flex flex-col min-h-screen w-full bg-background text-foreground font-sans selection:bg-primary/20 selection:text-foreground">
      {/* 1. Top Navigation Bar */}
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 sm:px-6 backdrop-blur-sm select-none">
        {/* Brand / Title & Workspace Eyebrow */}
        <div className="flex items-center gap-3">
          <div className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background shadow-2xs">
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
            <Badge variant="eyebrow">21ST WORKSPACE</Badge>
          </div>
        </div>

        {/* Right Actions: Theme Toggle & + New Component */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="size-8 text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => setCreateComponentDialogOpen(true)}
            className="h-8 gap-1.5 px-3 font-sans text-xs font-medium shadow-2xs"
          >
            <Plus className="size-4" />
            <span>+ New Component</span>
          </Button>
        </div>
      </header>

      {/* Main Showcase Area */}
      <main className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-8">
        {/* Streamlined Filter & Search Toolbar */}
        <section
          aria-label="Filter and search toolbar"
          className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between"
        >
          {/* Category Filter Navigation */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
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
                    "h-8 rounded-lg px-3 text-xs font-sans gap-1.5 transition-all select-none shrink-0",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  <span>{category}</span>
                  <Badge
                    variant="secondary"
                    suppressHydrationWarning
                    className={cn(
                      "px-1.5 py-0 text-[10px] font-sans tabular-nums rounded-md",
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
          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search components by name or description"
              placeholder="Search components by name or description..."
              className="pl-9 font-sans text-xs h-8 bg-card"
            />
          </div>
        </section>

        {/* Component Showcase Sections / Grid */}
        <section aria-label="Component cards grid" className="space-y-10">
          {filteredComponents.length > 0 ? (
            showCuratedSections ? (
              showcaseSections.map((section) => (
                <div key={section.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-sans text-base sm:text-lg font-semibold tracking-tight text-foreground">
                      {section.title}
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCategory(section.targetCategory)}
                      className="h-7 px-2.5 text-xs font-sans text-muted-foreground hover:text-foreground gap-1.5"
                    >
                      <span>View all</span>
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                  {renderCardGrid(section.items)}
                </div>
              ))
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-sans text-base sm:text-lg font-semibold tracking-tight text-foreground">
                    {searchQuery.trim()
                      ? `Search results (${filteredComponents.length})`
                      : selectedCategory}
                  </h2>
                  {selectedCategory !== "All" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCategory("All")}
                      className="h-7 px-2.5 text-xs font-sans text-muted-foreground hover:text-foreground gap-1.5"
                    >
                      <span>Back to all</span>
                    </Button>
                  )}
                </div>
                {renderCardGrid(filteredComponents)}
              </div>
            )
          ) : (
            /* Clean Empty State */
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-12 text-center my-6 bg-muted/10">
              <FolderSearch className="size-10 text-muted-foreground/60 mb-3" />
              <h3 className="font-sans font-medium text-base text-foreground">
                No components found
              </h3>
              <p className="font-sans text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                No components match your search query or category filter. Try resetting your search or create a new component.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                  className="font-sans text-xs h-8 gap-1.5"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Reset filters</span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setCreateComponentDialogOpen(true)}
                  className="font-sans text-xs h-8 gap-1.5"
                >
                  <Plus className="size-3.5" />
                  <span>+ New Component</span>
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Modal Integration */}
      <CreateComponentDialog onCreated={handleCreated} />
      <QuickPreviewModal onOpenStudio={handleOpenStudio} />
    </div>
  );
}

