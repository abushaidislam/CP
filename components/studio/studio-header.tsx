"use client";

import React, { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStudioStore } from "@/lib/store/studio-store";
import { DEFAULT_TEMPLATES } from "@/lib/sandbox/default-templates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { AppLogo } from "@/components/ui/app-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAppTheme } from "@/lib/hooks/use-app-theme";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers,
  ChevronDown,
  Moon,
  Sun,
  ExternalLink,
  Terminal,
  Columns2,
  Code2,
  Eye,
  Sparkles,
  GitBranch,
  BookmarkPlus,
  History,
  Check,
  Plus,
  Trash2,
  ArrowLeft,
  Camera,
  Loader2,
  MoreHorizontal,
  Keyboard,
  ShieldCheck,
  Lock,
  FolderGit2,
  Video,
  Cpu,
  Pencil,
  Search,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { McpConnectDialog } from "@/components/mcp/mcp-connect-dialog";
import { CommandPaletteDialog } from "@/components/hub/command-palette-dialog";
import { useMcpLiveSync } from "@/lib/hooks/use-mcp-live-sync";
import { EditComponentDialog } from "@/components/hub/edit-component-dialog";
import { CreateComponentDialog } from "@/components/hub/create-component-dialog";

export function StudioHeader() {
  const router = useRouter();
  const {
    currentTemplateId,
    userComponents,
    loadComponent,
    setRepoSyncModalOpen,
    repoSyncStatus,
    saveComponentToProjectRepo,
    isTerminalOpen,
    toggleTerminal,
    terminalLogs,
    isAiPanelOpen,
    toggleAiPanel,
    layoutMode,
    setLayoutMode,
    variantsByTemplate,
    activeVariantByTemplate,
    switchVariant,
    deleteVariant,
    setCreateVariantDialogOpen,
    setSaveCheckpointDialogOpen,
    isHistorySheetOpen,
    setHistorySheetOpen,
    isOwnerAuthenticated,
    setSecurityModalOpen,
    isRecordingModalOpen,
    setRecordingModalOpen,
    setCreateComponentDialogOpen,
    setEditComponentDialogOpen,
  } = useStudioStore(
    useShallow((state) => ({
      currentTemplateId: state.currentTemplateId,
      userComponents: state.userComponents,
      loadComponent: state.loadComponent,
      setRepoSyncModalOpen: state.setRepoSyncModalOpen,
      repoSyncStatus: state.repoSyncStatus,
      saveComponentToProjectRepo: state.saveComponentToProjectRepo,
      isTerminalOpen: state.isTerminalOpen,
      toggleTerminal: state.toggleTerminal,
      terminalLogs: state.terminalLogs,
      isAiPanelOpen: state.isAiPanelOpen,
      toggleAiPanel: state.toggleAiPanel,
      layoutMode: state.layoutMode,
      setLayoutMode: state.setLayoutMode,
      variantsByTemplate: state.variantsByTemplate,
      activeVariantByTemplate: state.activeVariantByTemplate,
      switchVariant: state.switchVariant,
      deleteVariant: state.deleteVariant,
      setCreateVariantDialogOpen: state.setCreateVariantDialogOpen,
      setSaveCheckpointDialogOpen: state.setSaveCheckpointDialogOpen,
      isHistorySheetOpen: state.isHistorySheetOpen,
      setHistorySheetOpen: state.setHistorySheetOpen,
      isOwnerAuthenticated: state.isOwnerAuthenticated,
      setSecurityModalOpen: state.setSecurityModalOpen,
      isRecordingModalOpen: state.isRecordingModalOpen,
      setRecordingModalOpen: state.setRecordingModalOpen,
      setCreateComponentDialogOpen: state.setCreateComponentDialogOpen,
      setEditComponentDialogOpen: state.setEditComponentDialogOpen,
    }))
  );

  const { isDark, toggleTheme } = useAppTheme();
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedSuccess, setCapturedSuccess] = useState(false);
  const [isMcpConnectOpen, setIsMcpConnectOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");
  const captureTimeoutRef = React.useRef<NodeJS.Timeout | number | null>(null);

  const activeComp = userComponents?.[currentTemplateId];
  const activeSlug = activeComp
    ? activeComp.repoSlug || activeComp.id
    : currentTemplateId;
  const { lastSyncedEvent } = useMcpLiveSync(activeSlug);

  React.useEffect(() => {
    let successTimer: NodeJS.Timeout | number | undefined;
    const handleCaptured = (e: Event) => {
      const customEvent = e as CustomEvent<{ dataUrl?: string | null; error?: string }>;
      if (captureTimeoutRef.current) {
        clearTimeout(captureTimeoutRef.current);
        captureTimeoutRef.current = null;
      }
      setIsCapturing(false);
      if (customEvent.detail?.dataUrl) {
        if (successTimer) clearTimeout(successTimer);
        setCapturedSuccess(true);
        successTimer = setTimeout(() => {
          setCapturedSuccess(false);
        }, 2000);
      }
    };

    window.addEventListener("studio:preview-captured", handleCaptured);
    return () => {
      window.removeEventListener("studio:preview-captured", handleCaptured);
      if (successTimer) clearTimeout(successTimer);
      if (captureTimeoutRef.current) clearTimeout(captureTimeoutRef.current);
    };
  }, []);

  const handleCapturePreview = () => {
    if (layoutMode === "editor") {
      setLayoutMode("split");
    }
    setCapturedSuccess(false);
    setIsCapturing(true);
    window.dispatchEvent(
      new CustomEvent("studio:request-preview-capture", {
        detail: { componentId: currentTemplateId },
      })
    );
    if (captureTimeoutRef.current) {
      clearTimeout(captureTimeoutRef.current);
    }
    captureTimeoutRef.current = setTimeout(() => {
      setIsCapturing(false);
    }, 3500);
  };

  const templateVariants = variantsByTemplate[currentTemplateId] || [];
  const activeVariantId = activeVariantByTemplate[currentTemplateId];
  const activeVariant =
    templateVariants.find((v) => v.id === activeVariantId) ||
    templateVariants[0] ||
    { id: "default", name: "Default", checkpoints: [] };
  const checkpointCount = activeVariant?.checkpoints?.length || 0;

  const errorCount = terminalLogs.filter((l) => l.type === "error").reduce((acc, l) => acc + l.count, 0);
  const warnCount = terminalLogs.filter((l) => l.type === "warn").reduce((acc, l) => acc + l.count, 0);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key?.toLowerCase() === "s") {
        e.preventDefault();
        saveComponentToProjectRepo?.({ componentId: currentTemplateId });
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === "s") {
        e.preventDefault();
        setSaveCheckpointDialogOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSaveCheckpointDialogOpen, saveComponentToProjectRepo, currentTemplateId]);

  const currentTemplate =
    DEFAULT_TEMPLATES.find((t) => t.id === currentTemplateId) ||
    DEFAULT_TEMPLATES[0];

  const componentName =
    userComponents?.[currentTemplateId]?.name ||
    currentTemplate?.name ||
    "Component Studio";

  const allTemplatesList = React.useMemo(() => {
    const userComps = Object.values(userComponents || {});
    if (userComps.length > 0) {
      return userComps;
    }
    return DEFAULT_TEMPLATES;
  }, [userComponents]);

  const templateCategories = React.useMemo(() => {
    const cats = new Set<string>();
    allTemplatesList.forEach((c) => {
      if (c.category) cats.add(c.category);
    });
    return ["All", ...Array.from(cats)];
  }, [allTemplatesList]);

  const filteredTemplates = React.useMemo(() => {
    const q = templateSearchQuery.trim().toLowerCase();
    return allTemplatesList.filter((comp) => {
      const matchesCategory =
        selectedCategoryFilter === "All" ||
        comp.category?.toLowerCase() === selectedCategoryFilter.toLowerCase();
      if (!matchesCategory) return false;

      if (!q) return true;
      return (
        comp.name?.toLowerCase().includes(q) ||
        comp.description?.toLowerCase().includes(q) ||
        comp.category?.toLowerCase().includes(q)
      );
    });
  }, [allTemplatesList, templateSearchQuery, selectedCategoryFilter]);

  return (
    <header className="studio-glass-header flex h-12 shrink-0 items-center justify-between border-b border-border px-3 sm:px-4 select-none z-30">
      {/* Left: Icon-Only Back Button, Brand Mark & Breadcrumb Selectors */}
      <div className="flex items-center gap-2 min-w-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              asChild
              className="studio-icon-btn size-8 rounded-none border-border/80 bg-card/60 text-muted-foreground hover:text-foreground shrink-0"
            >
              <Link href="/" aria-label="Back to Component Library">
                <ArrowLeft className="size-3.5" />
                <span className="sr-only">Library</span>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="font-sans text-xs">
            Back to Component Library
          </TooltipContent>
        </Tooltip>

        {/* Brand Mark */}
        <AppLogo size="md" priority />

        {/* Unified Logical Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 sm:gap-1.5 text-xs font-sans min-w-0">
          <span className="font-semibold text-xs tracking-tight text-foreground hidden md:inline shrink-0">
            Component Studio
          </span>
          <span className="text-muted-foreground/40 font-sans text-xs hidden md:inline">/</span>

          {/* Active Template Selector as Breadcrumb Leaf */}
          <div className="flex items-center gap-0.5 min-w-0">
            <DropdownMenu
              open={isTemplateMenuOpen}
              onOpenChange={setIsTemplateMenuOpen}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 px-2 text-xs font-medium text-foreground hover:bg-muted/70 rounded-none border border-transparent hover:border-border/80 font-sans max-w-[110px] xs:max-w-[140px] sm:max-w-[180px] md:max-w-[210px] truncate"
                    >
                      <Layers className="size-3 text-muted-foreground shrink-0" />
                      <span className="font-medium text-xs truncate">{componentName}</span>
                      <ChevronDown className="size-3 text-muted-foreground opacity-60 shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="font-sans text-xs">Switch component template</TooltipContent>
              </Tooltip>

              <DropdownMenuContent
                align="start"
                className="w-[calc(100vw-2rem)] xs:w-80 sm:w-96 max-w-sm max-h-[75vh] sm:max-h-[80vh] flex flex-col p-0 overflow-hidden rounded-none font-sans border-border bg-popover shadow-xl z-50"
              >
                {/* Search & Header Section */}
                <div className="p-2.5 pb-2 border-b border-border/80 shrink-0 space-y-2 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <DropdownMenuLabel className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider p-0 font-sans">
                      Component Templates ({filteredTemplates.length})
                    </DropdownMenuLabel>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsTemplateMenuOpen(false);
                        setEditComponentDialogOpen(true, currentTemplateId);
                      }}
                      className="h-6 text-[11px] gap-1 px-1.5 font-sans text-muted-foreground hover:text-foreground rounded-none border border-transparent hover:border-border"
                      title="Edit current component details"
                    >
                      <Pencil className="size-2.5 text-primary" />
                      <span>Edit Current</span>
                    </Button>
                  </div>

                  {/* Filter Search Input */}
                  <div className="relative">
                    <Search className="size-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      value={templateSearchQuery}
                      onChange={(e) => setTemplateSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      placeholder="Search templates or components..."
                      className="h-7 pl-7 pr-7 text-xs font-sans rounded-none bg-background border-border"
                    />
                    {templateSearchQuery && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Clear template search"
                        onClick={() => setTemplateSearchQuery("")}
                        className="absolute right-1 top-1/2 -translate-y-1/2 size-5 rounded-none text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3" />
                      </Button>
                    )}
                  </div>

                  {/* Category Filter Pills */}
                  {templateCategories.length > 2 && (
                    <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[10px]">
                      {templateCategories.map((cat) => {
                        const isCatActive = selectedCategoryFilter.toLowerCase() === cat.toLowerCase();
                        return (
                          <Button
                            key={cat}
                            type="button"
                            variant={isCatActive ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategoryFilter(cat)}
                            className={cn(
                              "h-5 px-2 py-0 text-[10px] rounded-none font-sans whitespace-nowrap select-none shrink-0",
                              isCatActive
                                ? "font-medium"
                                : "bg-card text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {cat}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Scrollable Templates List */}
                <div className="overflow-y-auto overflow-x-hidden flex-1 p-1 max-h-[50vh] divide-y divide-border/20">
                  {filteredTemplates.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground font-sans">
                      No components found matching &ldquo;{templateSearchQuery}&rdquo;
                    </div>
                  ) : (
                    filteredTemplates.map((comp) => {
                      const isActive = comp.id === currentTemplateId;
                      return (
                        <div
                          key={comp.id}
                          role="button"
                          tabIndex={0}
                          className={cn(
                            "group relative flex items-start justify-between gap-2 p-2 hover:bg-muted/70 transition-colors cursor-pointer select-none font-sans focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                            isActive && "bg-muted/50 border-l-2 border-primary"
                          )}
                          onClick={() => {
                            setIsTemplateMenuOpen(false);
                            loadComponent(comp.id);
                            router?.push?.(`/studio/${comp.id}`);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setIsTemplateMenuOpen(false);
                              loadComponent(comp.id);
                              router?.push?.(`/studio/${comp.id}`);
                            }
                          }}
                        >
                          <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={cn(
                                  "font-medium text-xs truncate max-w-[190px]",
                                  isActive ? "text-primary font-semibold" : "text-foreground"
                                )}
                              >
                                {comp.name}
                              </span>
                              <Badge
                                variant="secondary"
                                className="rounded-none text-[9px] py-0 px-1 font-normal font-sans shrink-0"
                              >
                                {comp.category || "Custom"}
                              </Badge>
                              {isActive && (
                                <Badge
                                  variant="outline"
                                  className="rounded-none text-[9px] py-0 px-1 font-normal font-sans border-primary/40 text-primary shrink-0"
                                >
                                  active
                                </Badge>
                              )}
                            </div>
                            {comp.description ? (
                              <span className="line-clamp-2 text-[11px] text-muted-foreground leading-snug">
                                {comp.description}
                              </span>
                            ) : (
                              <span className="text-[11px] text-muted-foreground/50 italic">
                                No description provided
                              </span>
                            )}
                          </div>

                          {/* Quick Edit Action Button for each component */}
                          <div className="flex items-center shrink-0 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setIsTemplateMenuOpen(false);
                                setEditComponentDialogOpen(true, comp.id);
                              }}
                              title={`Edit ${comp.name} title, description & category`}
                              aria-label={`Edit ${comp.name}`}
                              className="size-6 rounded-none text-muted-foreground hover:text-foreground hover:bg-background border border-transparent hover:border-border"
                            >
                              <Pencil className="size-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer Action */}
                <div className="p-2 border-t border-border/80 shrink-0 bg-muted/20">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsTemplateMenuOpen(false);
                      setCreateComponentDialogOpen(true);
                    }}
                    className="h-7 text-xs gap-1.5 rounded-none font-sans font-medium w-full"
                  >
                    <Plus className="size-3 text-primary" />
                    <span>Create New Component...</span>
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Breadcrumb Direct Edit Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditComponentDialogOpen(true, currentTemplateId)}
                  aria-label="Edit active component title and description"
                  className="studio-icon-btn size-7 rounded-none border border-transparent hover:border-border/80 bg-transparent hover:bg-muted/70 text-muted-foreground hover:text-foreground shrink-0"
                >
                  <Pencil className="size-3" />
                  <span className="sr-only">Edit details</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-sans text-xs">
                Edit component name &amp; description
              </TooltipContent>
            </Tooltip>
          </div>

          <span className="text-muted-foreground/40 font-sans text-xs hidden xs:inline">/</span>

          {/* Variant Switcher Dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 px-2 text-xs font-medium text-foreground hover:bg-muted/70 rounded-none border border-transparent hover:border-border/80 font-sans active:scale-[0.98] transition-all duration-100 max-w-[95px] sm:max-w-[140px] truncate hidden xs:inline-flex"
                  >
                    <GitBranch className="size-3 text-muted-foreground shrink-0" />
                    <span className="font-medium text-xs truncate">{activeVariant.name}</span>
                    <ChevronDown className="size-3 text-muted-foreground opacity-60 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Switch or create component variants</TooltipContent>
            </Tooltip>

            <DropdownMenuContent align="start" className="w-56 rounded-none font-sans">
              <DropdownMenuLabel className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider font-sans">
                Component Variants
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {templateVariants.map((v) => {
                const isActive = v.id === activeVariant.id;
                return (
                  <DropdownMenuItem
                    key={v.id}
                    onClick={() => switchVariant(v.id)}
                    className="flex items-center justify-between py-1.5 cursor-pointer rounded-none font-sans text-xs"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isActive ? (
                        <Check className="size-3 text-primary shrink-0" />
                      ) : (
                        <span className="size-3 shrink-0" />
                      )}
                      <span className={cn("truncate", isActive && "font-medium text-foreground")}>
                        {v.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 ml-2 shrink-0">
                      <Badge
                        variant="outline"
                        className="rounded-none text-[9px] font-sans py-0 px-1 text-muted-foreground"
                      >
                        {v.checkpoints?.length || 0} snaps
                      </Badge>
                      {!v.id.startsWith("var-default-") && v.name !== "Default" && templateVariants.length > 1 && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteVariant(v.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.stopPropagation();
                              deleteVariant(v.id);
                            }
                          }}
                          className="p-1 rounded-none text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          title={`Delete variant "${v.name}"`}
                          aria-label={`Delete variant ${v.name}`}
                        >
                          <Trash2 className="size-3" />
                        </span>
                      )}
                    </div>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setCreateVariantDialogOpen(true)}
                className="gap-2 cursor-pointer rounded-none font-sans text-xs text-primary font-medium"
              >
                <Plus className="size-3.5" />
                <span>Create Variant...</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>

      {/* Center: Icon-Only Layout View Mode Switcher with Sliding Indicator */}
      <div className="hidden sm:flex items-center">
        <div
          role="group"
          aria-label="Workspace layout view"
          className="relative flex items-center bg-muted/60 p-0.5 rounded-none border border-border"
        >
          {(["split", "editor", "preview"] as const).map((mode) => {
            const isActive = layoutMode === mode;
            const modeLabel =
              mode === "editor" ? "Code" : mode === "split" ? "Split" : "Preview";
            return (
              <Tooltip key={mode}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setLayoutMode(mode)}
                    aria-label={`${modeLabel} view`}
                    aria-pressed={isActive}
                    className={cn(
                      "relative z-10 flex size-7 items-center justify-center text-xs font-sans font-medium transition-colors cursor-pointer select-none rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive
                        ? "text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-header-layout-pill"
                        className="absolute inset-0 rounded-none bg-background border border-border/80 shadow-2xs z-[-1]"
                        transition={{ type: "spring", bounce: 0, duration: 0.22 }}
                      />
                    )}
                    {mode === "split" && <Columns2 className="size-3.5" />}
                    {mode === "editor" && <Code2 className="size-3.5" />}
                    {mode === "preview" && <Eye className="size-3.5" />}
                    <span className="sr-only">{modeLabel}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="font-sans text-xs">
                  {modeLabel} View
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Right: Pure Icon-Only Studio Action Strip */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Capture Preview Button (Only shown in Editor-only mode when CanvasPreview toolbar is hidden) */}
        <div
          className={cn(
            "items-center",
            layoutMode === "editor" ? "hidden md:flex" : "hidden"
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCapturePreview}
                disabled={isCapturing || capturedSuccess}
                className="studio-icon-btn size-8 rounded-none border-border/80 bg-card/60 text-muted-foreground hover:text-foreground"
                aria-label={
                  capturedSuccess
                    ? "Preview snapshot saved"
                    : isCapturing
                    ? "Capturing preview snapshot..."
                    : "Capture preview snapshot"
                }
              >
                {capturedSuccess ? (
                  <>
                    <Check className="size-3.5 text-emerald-500" />
                    <span className="sr-only">Saved!</span>
                  </>
                ) : isCapturing ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span className="sr-only">Capturing...</span>
                  </>
                ) : (
                  <>
                    <Camera className="size-3.5" />
                    <span className="sr-only">Capture</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-sans text-xs">
              Capture live canvas preview for library card
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Save Checkpoint Button (Icon-Only) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSaveCheckpointDialogOpen(true)}
              aria-label="Save Checkpoint (Ctrl+S)"
              className="studio-icon-btn size-8 rounded-none border-border/80 bg-card/60 text-muted-foreground hover:text-foreground"
            >
              <BookmarkPlus className="size-3.5 text-primary" />
              <span className="sr-only">Save</span>
              <kbd className="sr-only">Ctrl+S</kbd>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="font-sans text-xs">
            Save Checkpoint (Ctrl+S)
          </TooltipContent>
        </Tooltip>

        {/* Version History Button (Icon-Only with micro count badge) */}
        <div className="hidden sm:flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isHistorySheetOpen ? "secondary" : "outline"}
                size="icon"
                onClick={() => setHistorySheetOpen(!isHistorySheetOpen)}
                aria-label="Version History & Snapshots"
                aria-pressed={isHistorySheetOpen}
                className={cn(
                  "studio-icon-btn relative size-8 rounded-none border-border/80",
                  isHistorySheetOpen
                    ? "bg-muted text-foreground border-foreground/30"
                    : "bg-card/60 text-muted-foreground hover:text-foreground"
                )}
              >
                <History className="size-3.5 text-primary" />
                <span className="sr-only">History</span>
                {checkpointCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="pointer-events-none absolute -top-1 -right-1 h-3.5 min-w-3.5 rounded-none px-1 py-0 text-[9px] font-sans font-semibold tabular-nums bg-primary text-primary-foreground"
                  >
                    {checkpointCount}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-sans text-xs">
              Version History & Snapshots ({checkpointCount})
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Terminal Toggle Button (Icon-Only with micro status badge) */}
        <div className="hidden md:flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isTerminalOpen ? "secondary" : "outline"}
                size="icon"
                onClick={toggleTerminal}
                aria-label="Toggle Terminal & Dev Console"
                aria-pressed={isTerminalOpen}
                className={cn(
                  "studio-icon-btn relative size-8 rounded-none border-border/80",
                  isTerminalOpen
                    ? "bg-muted text-foreground border-foreground/30"
                    : "bg-card/60 text-muted-foreground hover:text-foreground"
                )}
              >
                <Terminal className="size-3.5 text-emerald-500" />
                <span className="sr-only">Terminal</span>
                {errorCount > 0 ? (
                  <Badge
                    variant="destructive"
                    className="pointer-events-none absolute -top-1 -right-1 h-3.5 min-w-3.5 rounded-none px-1 py-0 text-[9px] font-semibold font-sans tabular-nums"
                  >
                    {errorCount}
                  </Badge>
                ) : warnCount > 0 ? (
                  <Badge
                    variant="secondary"
                    className="pointer-events-none absolute -top-1 -right-1 h-3.5 min-w-3.5 rounded-none px-1 py-0 text-[9px] text-amber-500 bg-amber-500/20 font-sans tabular-nums"
                  >
                    {warnCount}
                  </Badge>
                ) : null}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-sans text-xs">
              Toggle Terminal & Dev Console (Ctrl+`)
            </TooltipContent>
          </Tooltip>
        </div>

        {/* AI Copilot Toggle Button (Icon-Only) */}
        <div className="hidden md:flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isAiPanelOpen ? "secondary" : "outline"}
                size="icon"
                onClick={toggleAiPanel}
                aria-label="Toggle Copilot Assistant (Ctrl+I)"
                aria-pressed={isAiPanelOpen}
                className={cn(
                  "studio-icon-btn size-8 rounded-none border-border/80",
                  isAiPanelOpen
                    ? "bg-sky-500/15 text-sky-400 border-sky-500/40"
                    : "bg-card/60 text-muted-foreground hover:text-foreground"
                )}
              >
                <Sparkles className="size-3.5 text-sky-400" />
                <span className="sr-only">Copilot</span>
                <kbd className="sr-only">Ctrl+I</kbd>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-sans text-xs">
              Toggle Copilot Assistant (Ctrl+I)
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="hidden md:block h-4 mx-0.5" />

        {/* Owner Security & API Credit Shield Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSecurityModalOpen(true)}
              aria-label={
                isOwnerAuthenticated
                  ? "Security Shield (Owner Session Active)"
                  : "Security Shield (Read-Only · Unlock Owner Session)"
              }
              className={cn(
                "studio-icon-btn relative size-8 rounded-none border-border/80",
                isOwnerAuthenticated
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/40 hover:bg-emerald-500/20"
                  : "bg-card/60 text-amber-500 hover:text-amber-400 border-amber-500/30"
              )}
            >
              {isOwnerAuthenticated ? (
                <ShieldCheck className="size-3.5 text-emerald-500" />
              ) : (
                <Lock className="size-3.5 text-amber-500" />
              )}
              <span className="sr-only">Security Shield</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="font-sans text-xs">
            {isOwnerAuthenticated
              ? "Security Shield: Owner Verified (AI Credits Active)"
              : "Security Shield: Read-Only Mode (Click to Unlock AI Credits)"}
          </TooltipContent>
        </Tooltip>

        {/* Keyboard Shortcuts Button (Icon-Only) */}
        <div className="hidden lg:flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.dispatchEvent(new CustomEvent("studio:open-shortcuts"))}
                aria-label="Keyboard shortcuts (?)"
                className="studio-icon-btn size-8 rounded-none border-border/80 bg-card/60 text-muted-foreground hover:text-foreground"
              >
                <Keyboard className="size-3.5" />
                <span className="sr-only">Keyboard shortcuts</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-sans text-xs">
              Keyboard shortcuts (?)
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Theme Switcher (Icon-Only) */}
        <div className="hidden sm:flex items-center">
          <ThemeToggle className="bg-card/60" iconClassName="size-3.5" />
        </div>

        {/* Unified Project Repo Sync, Export & Publish Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="icon"
              onClick={() => setRepoSyncModalOpen?.(true)}
              aria-label="Project Repo Sync, Export & Publish (Ctrl+Shift+S)"
              className="relative size-8 rounded-none shadow-none shrink-0"
            >
              {repoSyncStatus === "syncing" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <FolderGit2 className="size-3.5" />
              )}
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute top-1 right-1 size-1.5 rounded-none",
                  userComponents?.[currentTemplateId]?.savedInRepo &&
                    repoSyncStatus !== "dirty"
                    ? "bg-emerald-400"
                    : repoSyncStatus === "dirty"
                    ? "bg-amber-400"
                    : "bg-primary-foreground/50"
                )}
              />
              <span className="sr-only">Project Repo Sync &amp; Publish</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="font-sans text-xs">
            {userComponents?.[currentTemplateId]?.savedInRepo &&
            repoSyncStatus !== "dirty"
              ? "Saved in Project Repo • Click to Export, Sync GitHub or Publish"
              : "Project Repo Sync, Export & Publish (Ctrl+Shift+S)"}
          </TooltipContent>
        </Tooltip>

        {/* Model Context Protocol (MCP) Connector Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsMcpConnectOpen(true)}
              aria-label="Connect AI via MCP (Gemini, Antigravity, Claude, Cursor)"
              className="studio-icon-btn size-8 rounded-none border-border/80 bg-card/60 text-muted-foreground hover:text-foreground shrink-0"
            >
              <Cpu className="size-3.5 text-sky-400" />
              <span className="sr-only">Connect AI via MCP</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="font-sans text-xs">
            Connect AI via MCP (Gemini, Antigravity, Claude, Cursor)
          </TooltipContent>
        </Tooltip>

        {/* 21st.dev Marketplace External Link (Icon-Only) */}
        <div className="hidden xl:flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                asChild
                className="studio-icon-btn size-8 rounded-none border-border/80 bg-card/60 text-muted-foreground hover:text-foreground"
              >
                <a
                  href="https://21st.dev"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Visit 21st.dev"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-sans text-xs">
              Browse 21st.dev marketplace
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Responsive Overflow (...) Menu - visible on screens < xl */}
        <div className="xl:hidden flex items-center">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="studio-icon-btn size-8 rounded-none border-border/80 bg-card/60 text-muted-foreground hover:text-foreground"
                    aria-label="More options"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-sans text-xs">
                More options & controls
              </TooltipContent>
            </Tooltip>

            <DropdownMenuContent align="end" className="w-56 rounded-none font-sans">
              <DropdownMenuLabel className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider font-sans">
                Studio Actions
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Save to Project Repo */}
              <DropdownMenuItem
                onClick={() => setRepoSyncModalOpen?.(true)}
                className="gap-2.5 cursor-pointer rounded-none font-sans text-xs"
              >
                <FolderGit2 className="size-3.5 text-primary" />
                <span className="flex-1">Project Repo & GitHub</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "h-4 rounded-none px-1 text-[9px] font-sans",
                    userComponents?.[currentTemplateId]?.savedInRepo &&
                      repoSyncStatus !== "dirty"
                      ? "bg-emerald-500/15 text-emerald-500"
                      : "bg-amber-500/15 text-amber-500"
                  )}
                >
                  {userComponents?.[currentTemplateId]?.savedInRepo &&
                  repoSyncStatus !== "dirty"
                    ? "In Repo"
                    : "Sync"}
                </Badge>
              </DropdownMenuItem>

              {/* Connect MCP */}
              <DropdownMenuItem
                onClick={() => setIsMcpConnectOpen(true)}
                className="gap-2.5 cursor-pointer rounded-none font-sans text-xs"
              >
                <Cpu className="size-3.5 text-sky-400" />
                <span className="flex-1">Connect AI via MCP</span>
                <Badge
                  variant="secondary"
                  className="h-4 rounded-none px-1 text-[9px] font-sans bg-sky-500/15 text-sky-400"
                >
                  Active
                </Badge>
              </DropdownMenuItem>

              {/* Security Shield */}
              <DropdownMenuItem
                onClick={() => setSecurityModalOpen(true)}
                className="gap-2.5 cursor-pointer rounded-none font-sans text-xs"
              >
                {isOwnerAuthenticated ? (
                  <ShieldCheck className="size-3.5 text-emerald-500" />
                ) : (
                  <Lock className="size-3.5 text-amber-500" />
                )}
                <span className="flex-1">Security & Credit Guard</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "h-4 rounded-none px-1 text-[9px] font-sans",
                    isOwnerAuthenticated
                      ? "bg-emerald-500/15 text-emerald-500"
                      : "bg-amber-500/15 text-amber-500"
                  )}
                >
                  {isOwnerAuthenticated ? "Active" : "Locked"}
                </Badge>
              </DropdownMenuItem>

              {/* Capture Snapshot */}
              <DropdownMenuItem
                onClick={handleCapturePreview}
                disabled={isCapturing || capturedSuccess}
                className="gap-2.5 cursor-pointer rounded-none font-sans text-xs"
              >
                {capturedSuccess ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : isCapturing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Camera className="size-3.5" />
                )}
                <span className="flex-1">
                  {capturedSuccess ? "Snapshot Saved!" : isCapturing ? "Capturing..." : "Capture Preview"}
                </span>
              </DropdownMenuItem>

              {/* Video Capture Side Panel */}
              <DropdownMenuItem
                onClick={() => {
                  const nextOpen = !isRecordingModalOpen;
                  if (nextOpen && layoutMode === "editor") {
                    setLayoutMode("split");
                  }
                  setRecordingModalOpen(nextOpen);
                }}
                className="gap-2.5 cursor-pointer rounded-none font-sans text-xs"
              >
                <Video className="size-3.5 text-primary" />
                <span className="flex-1">
                  {isRecordingModalOpen
                    ? "Close Video Capture Panel"
                    : "Video Capture Side Panel"}
                </span>
                <kbd className="px-1 py-0.2 rounded-none bg-muted-foreground/10 text-[9px] font-mono text-muted-foreground">
                  ⇧E
                </kbd>
              </DropdownMenuItem>

              {/* Version History */}
              <DropdownMenuItem
                onClick={() => setHistorySheetOpen(!isHistorySheetOpen)}
                className="gap-2.5 cursor-pointer rounded-none font-sans text-xs sm:hidden"
              >
                <History className="size-3.5 text-primary" />
                <span className="flex-1">Version History</span>
                {checkpointCount > 0 && (
                  <Badge variant="secondary" className="h-4 rounded-none px-1 text-[9px] font-sans tabular-nums">
                    {checkpointCount}
                  </Badge>
                )}
              </DropdownMenuItem>

              {/* Terminal */}
              <DropdownMenuItem
                onClick={toggleTerminal}
                className="gap-2.5 cursor-pointer rounded-none font-sans text-xs md:hidden"
              >
                <Terminal className="size-3.5 text-emerald-500" />
                <span className="flex-1">Terminal</span>
                {errorCount > 0 ? (
                  <Badge variant="destructive" className="h-4 rounded-none px-1 text-[9px] font-sans font-semibold">
                    {errorCount}
                  </Badge>
                ) : warnCount > 0 ? (
                  <Badge variant="secondary" className="h-4 rounded-none px-1 text-[9px] text-amber-500 bg-amber-500/10 font-sans">
                    {warnCount}
                  </Badge>
                ) : null}
              </DropdownMenuItem>

              {/* Copilot Assistant */}
              <DropdownMenuItem
                onClick={toggleAiPanel}
                className="gap-2.5 cursor-pointer rounded-none font-sans text-xs md:hidden"
              >
                <Sparkles className="size-3.5 text-sky-400" />
                <span className="flex-1">AI Copilot</span>
                <kbd className="px-1 py-0.2 rounded-none bg-muted-foreground/10 text-[9px] font-mono text-muted-foreground">
                  Ctrl+I
                </kbd>
              </DropdownMenuItem>

              {/* Responsive Layout Mode Switcher */}
              <DropdownMenuSeparator className="sm:hidden" />
              <DropdownMenuLabel className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider font-sans sm:hidden">
                Layout View
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setLayoutMode("split")}
                className="gap-2.5 cursor-pointer rounded-none font-sans text-xs sm:hidden"
              >
                <Columns2 className="size-3.5" />
                <span className="flex-1">Split View</span>
                {layoutMode === "split" && <Check className="size-3 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLayoutMode("editor")}
                className="gap-2.5 cursor-pointer rounded-none font-sans text-xs sm:hidden"
              >
                <Code2 className="size-3.5" />
                <span className="flex-1">Code Editor</span>
                {layoutMode === "editor" && <Check className="size-3 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLayoutMode("preview")}
                className="gap-2.5 cursor-pointer rounded-none font-sans text-xs sm:hidden"
              >
                <Eye className="size-3.5" />
                <span className="flex-1">Live Preview</span>
                {layoutMode === "preview" && <Check className="size-3 text-primary" />}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="sm:hidden" />

              {/* Theme Toggle (< sm screens) */}
              <DropdownMenuItem
                onClick={(e) => toggleTheme(e)}
                className="gap-2.5 cursor-pointer rounded-none font-sans text-xs sm:hidden"
              >
                {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
                <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
              </DropdownMenuItem>

              {/* Keyboard Shortcuts */}
              <DropdownMenuItem
                onClick={() => window.dispatchEvent(new CustomEvent("studio:open-shortcuts"))}
                className="gap-2.5 cursor-pointer rounded-none font-sans text-xs"
              >
                <Keyboard className="size-3.5" />
                <span className="flex-1">Keyboard Shortcuts</span>
                <kbd className="px-1 py-0.2 rounded-none bg-muted-foreground/10 text-[9px] font-mono text-muted-foreground">
                  ?
                </kbd>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* 21st.dev Link */}
              <DropdownMenuItem asChild className="gap-2.5 cursor-pointer rounded-none font-sans text-xs">
                <a href="https://21st.dev" target="_blank" rel="noreferrer">
                  <ExternalLink className="size-3.5" />
                  <span>Visit 21st.dev</span>
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {lastSyncedEvent && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-card border border-sky-500/40 px-3 py-2 shadow-lg font-sans text-xs text-foreground">
          <Cpu className="size-3.5 text-sky-400 shrink-0" />
          <span>{lastSyncedEvent.message}</span>
        </div>
      )}

      {isMcpConnectOpen && (
        <McpConnectDialog open={isMcpConnectOpen} onOpenChange={setIsMcpConnectOpen} />
      )}
      {isCommandPaletteOpen && (
        <CommandPaletteDialog
          open={isCommandPaletteOpen}
          onOpenChange={setIsCommandPaletteOpen}
          onOpenMcpConnect={() => setIsMcpConnectOpen(true)}
        />
      )}
      <EditComponentDialog />
      <CreateComponentDialog
        onCreated={(newId) => {
          loadComponent(newId);
          router?.push?.(`/studio/${newId}`);
        }}
      />
    </header>
  );
}
