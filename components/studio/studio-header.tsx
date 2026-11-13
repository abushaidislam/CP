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
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Trash2,
  ArrowLeft,
  Camera,
  Loader2,
  MoreHorizontal,
  Keyboard,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function StudioHeader() {
  const router = useRouter();
  const {
    currentTemplateId,
    userComponents,
    loadTemplate,
    loadComponent,
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
    deleteVariant,
    setCreateVariantDialogOpen,
    setSaveCheckpointDialogOpen,
    isHistorySheetOpen,
    setHistorySheetOpen,
  } = useStudioStore();

  const [isDark, setIsDark] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedSuccess, setCapturedSuccess] = useState(false);
  const captureTimeoutRef = React.useRef<NodeJS.Timeout | number | null>(null);

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

  const componentName =
    userComponents?.[currentTemplateId]?.name ||
    currentTemplate?.name ||
    "Component Studio";

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

        {/* Geometric Brand Mark */}
        <div className="flex size-7 items-center justify-center rounded-none bg-foreground text-background shrink-0">
          <svg
            viewBox="0 0 24 24"
            className="size-3.5 fill-current transform -translate-y-px"
          >
            <polygon points="12,2 22,20 2,20" />
          </svg>
        </div>

        {/* Unified Logical Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 sm:gap-1.5 text-xs font-sans min-w-0">
          <span className="font-semibold text-xs tracking-tight text-foreground hidden md:inline shrink-0">
            Component Studio
          </span>
          <span className="text-muted-foreground/40 font-sans text-xs hidden md:inline">/</span>

          {/* Active Template Selector as Breadcrumb Leaf */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 px-2 text-xs font-medium text-foreground hover:bg-muted/70 rounded-none border border-transparent hover:border-border/80 font-sans max-w-[130px] sm:max-w-[180px] truncate"
                  >
                    <Layers className="size-3 text-muted-foreground shrink-0" />
                    <span className="font-medium text-xs truncate">{componentName}</span>
                    <ChevronDown className="size-3 text-muted-foreground opacity-60 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Switch component template</TooltipContent>
            </Tooltip>

            <DropdownMenuContent align="start" className="w-68 rounded-none font-sans">
              <DropdownMenuLabel className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                Component Templates
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.values(userComponents || {}).length > 0
                ? Object.values(userComponents).map((comp) => (
                    <DropdownMenuItem
                      key={comp.id}
                      onClick={() => {
                        loadComponent(comp.id);
                        router?.push?.(`/studio/${comp.id}`);
                      }}
                      className="flex flex-col items-start gap-0.5 py-2 cursor-pointer rounded-none font-sans"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium text-xs text-foreground">
                          {comp.name}
                        </span>
                        <Badge variant="secondary" className="rounded-none text-[9px] py-0 px-1 font-normal font-sans">
                          {comp.category}
                        </Badge>
                      </div>
                      {comp.description && (
                        <span className="line-clamp-1 text-[11px] text-muted-foreground">
                          {comp.description}
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))
                : DEFAULT_TEMPLATES.map((tmpl) => (
                    <DropdownMenuItem
                      key={tmpl.id}
                      onClick={() => {
                        loadTemplate(tmpl.id);
                        router?.push?.(`/studio/${tmpl.id}`);
                      }}
                      className="flex flex-col items-start gap-0.5 py-2 cursor-pointer rounded-none font-sans"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium text-xs text-foreground">
                          {tmpl.name}
                        </span>
                        <Badge variant="secondary" className="rounded-none text-[9px] py-0 px-1 font-normal font-sans">
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
        {/* Capture Preview Button (Icon-Only) */}
        <div className="hidden md:flex items-center">
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                className="studio-icon-btn size-8 rounded-none border-border/80 bg-card/60 text-muted-foreground hover:text-foreground"
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
            <TooltipContent side="bottom" className="font-sans text-xs">
              {isDark ? "Switch to light mode" : "Switch to dark mode"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* 21st.dev Publish Button (Icon-Only High-Contrast Primary) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="icon"
              onClick={() => setPublishModalOpen(true)}
              aria-label="Publish component"
              className="size-8 rounded-none shadow-none shrink-0"
            >
              <UploadCloud className="size-3.5" />
              <span className="sr-only">Publish</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="font-sans text-xs">
            Publish Component & Generate AST Metadata
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
                onClick={toggleTheme}
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
    </header>
  );
}
