"use client";

import React, { useState } from "react";
import { useStudioStore } from "@/lib/store/studio-store";
import { DEFAULT_TEMPLATES } from "@/lib/sandbox/default-templates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import {
  Layers,
  ChevronDown,
  UploadCloud,
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
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function StudioHeader() {
  const {
    currentTemplateId,
    loadTemplate,
    setPublishModalOpen,
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
    setCreateVariantDialogOpen,
    setSaveCheckpointDialogOpen,
    isHistorySheetOpen,
    setHistorySheetOpen,
  } = useStudioStore();

  const [isDark, setIsDark] = useState(true);

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
      if ((e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === "s") {
        e.preventDefault();
        setSaveCheckpointDialogOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSaveCheckpointDialogOpen]);

  React.useEffect(() => {
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

  const currentTemplate =
    DEFAULT_TEMPLATES.find((t) => t.id === currentTemplateId) ||
    DEFAULT_TEMPLATES[0];

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-sm select-none z-30">
      {/* Left: Brand & Template Selector */}
      <div className="flex items-center gap-3">
        {/* Vercel Geometric Triangle Mark */}
        <div className="flex size-6 items-center justify-center rounded-md bg-foreground text-background shadow-2xs">
          <svg
            viewBox="0 0 24 24"
            className="size-3 fill-current transform -translate-y-px"
          >
            <polygon points="12,2 22,20 2,20" />
          </svg>
        </div>

        {/* Unified Logical Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-sans">
          <span className="font-semibold text-xs tracking-tight text-foreground">
            Component Studio
          </span>
          <span className="text-muted-foreground/40 font-sans text-xs">/</span>

          {/* Active Template Selector as Breadcrumb Leaf */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 px-2 text-xs font-medium text-foreground hover:bg-muted/70 rounded-md font-sans"
                  >
                    <Layers className="size-3 text-muted-foreground" />
                    <span className="font-medium text-xs">{currentTemplate.name}</span>
                    <ChevronDown className="size-3 text-muted-foreground opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Switch component template</TooltipContent>
            </Tooltip>

            <DropdownMenuContent align="start" className="w-68 font-sans">
              <DropdownMenuLabel className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                Component Templates
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {DEFAULT_TEMPLATES.map((tmpl) => (
                <DropdownMenuItem
                  key={tmpl.id}
                  onClick={() => loadTemplate(tmpl.id)}
                  className="flex flex-col items-start gap-0.5 py-2 cursor-pointer font-sans"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-xs text-foreground">
                      {tmpl.name}
                    </span>
                    <Badge variant="secondary" className="text-[9px] py-0 px-1 font-normal font-sans">
                      {tmpl.category}
                    </Badge>
                  </div>
                  <span className="line-clamp-1 text-[11px] text-muted-foreground">
                    {tmpl.description}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="text-muted-foreground/40 font-sans text-xs">/</span>

          {/* Variant Switcher Dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 px-2 text-xs font-medium text-foreground hover:bg-muted/70 rounded-md font-sans"
                  >
                    <GitBranch className="size-3 text-muted-foreground" />
                    <span className="font-medium text-xs max-w-[120px] truncate">{activeVariant.name}</span>
                    <ChevronDown className="size-3 text-muted-foreground opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Switch or create component variants</TooltipContent>
            </Tooltip>

            <DropdownMenuContent align="start" className="w-56 font-sans">
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
                    className="flex items-center justify-between py-1.5 cursor-pointer font-sans text-xs"
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
                    <Badge
                      variant="outline"
                      className="text-[9px] font-sans py-0 px-1 ml-2 shrink-0 text-muted-foreground"
                    >
                      {v.checkpoints?.length || 0} snaps
                    </Badge>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setCreateVariantDialogOpen(true)}
                className="gap-2 cursor-pointer font-sans text-xs text-primary font-medium"
              >
                <Plus className="size-3.5" />
                <span>Create Variant...</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>

      {/* Center: Layout View Mode Switcher with sliding indicator */}
      <div className="hidden sm:flex items-center">
        <div className="relative flex items-center bg-muted/50 p-0.5 rounded-lg border border-border">
          {(["split", "editor", "preview"] as const).map((mode) => {
            const isActive = layoutMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setLayoutMode(mode)}
                className={cn(
                  "relative z-10 flex h-7 items-center gap-1.5 px-2.5 text-xs font-sans font-medium transition-colors cursor-pointer select-none",
                  isActive
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-header-layout-pill"
                    className="absolute inset-0 rounded-md bg-background shadow-2xs z-[-1]"
                    transition={{ type: "spring", bounce: 0, duration: 0.22 }}
                  />
                )}
                {mode === "split" && <Columns2 className="size-3.5" />}
                {mode === "editor" && <Code2 className="size-3.5" />}
                {mode === "preview" && <Eye className="size-3.5" />}
                <span>
                  {mode === "editor" ? "Code" : mode === "split" ? "Split" : "Preview"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        {/* Save Checkpoint Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSaveCheckpointDialogOpen(true)}
              className="h-8 gap-1.5 px-2.5 text-xs font-sans border-border/80 hover:bg-muted/60"
            >
              <BookmarkPlus className="size-3.5 text-primary" />
              <span className="hidden md:inline">Save</span>
              <kbd className="hidden xl:inline-block ml-0.5 px-1 py-0.2 rounded bg-muted-foreground/10 text-[9px] font-mono text-muted-foreground">
                Ctrl+S
              </kbd>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Save Checkpoint (Ctrl+S)</TooltipContent>
        </Tooltip>

        {/* History Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isHistorySheetOpen ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setHistorySheetOpen(!isHistorySheetOpen)}
              className={cn(
                "h-8 gap-1.5 px-2.5 text-xs font-sans transition-colors",
                isHistorySheetOpen
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <History className="size-3.5 text-primary" />
              <span className="hidden sm:inline">History</span>
              {checkpointCount > 0 && (
                <Badge
                  variant="secondary"
                  className="h-4 px-1 text-[9px] font-sans tabular-nums"
                >
                  {checkpointCount}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Version History & Snapshots
          </TooltipContent>
        </Tooltip>

        {/* Terminal Toggle Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isTerminalOpen ? "secondary" : "ghost"}
              size="sm"
              onClick={toggleTerminal}
              className={`h-8 gap-1.5 px-2.5 text-xs font-sans transition-colors ${
                isTerminalOpen
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Terminal className="size-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Terminal</span>
              {errorCount > 0 ? (
                <Badge
                  variant="destructive"
                  className="h-4 px-1 text-[9px] font-semibold font-sans tabular-nums animate-in zoom-in-75 duration-150"
                >
                  {errorCount}
                </Badge>
              ) : warnCount > 0 ? (
                <Badge
                  variant="secondary"
                  className="h-4 px-1 text-[9px] text-amber-500 bg-amber-500/10 font-sans tabular-nums animate-in zoom-in-75 duration-150"
                >
                  {warnCount}
                </Badge>
              ) : null}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Toggle Terminal & Dev Console (Ctrl+`)
          </TooltipContent>
        </Tooltip>

        {/* AI Copilot Toggle Button with Sparkles */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isAiPanelOpen ? "secondary" : "ghost"}
              size="sm"
              onClick={toggleAiPanel}
              className={`h-8 gap-1.5 px-2.5 text-xs font-sans transition-colors ${
                isAiPanelOpen
                  ? "bg-muted text-foreground font-medium border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="size-3.5 text-sky-400" />
              <span className="hidden sm:inline">Copilot</span>
              <kbd className="hidden lg:inline-block ml-0.5 px-1 py-0.2 rounded bg-muted-foreground/10 text-[9px] font-mono text-muted-foreground">
                Ctrl+I
              </kbd>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Toggle Copilot Assistant (Ctrl+I)
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-4 mx-1" />

        {/* Theme Switcher with motion icon swap */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="size-8 text-muted-foreground hover:text-foreground"
            >
              <motion.div
                key={isDark ? "sun" : "moon"}
                initial={{ scale: 0.5, rotate: -30, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="flex items-center justify-center"
              >
                {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
              </motion.div>
              <span className="sr-only">Toggle theme</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isDark ? "Switch to light mode" : "Switch to dark mode"}
          </TooltipContent>
        </Tooltip>

        {/* 21st.dev Publish Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="sm"
              onClick={() => setPublishModalOpen(true)}
              className="h-8 gap-2 px-3 text-xs font-medium font-sans"
            >
              <UploadCloud className="size-3.5" />
              <span>Publish</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Generate AST metadata & publish package
          </TooltipContent>
        </Tooltip>

        {/* 21st.dev Marketplace External Link */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="size-8 text-muted-foreground hover:text-foreground"
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
          <TooltipContent side="bottom">Browse 21st.dev marketplace</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
