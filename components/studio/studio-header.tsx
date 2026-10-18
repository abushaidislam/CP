"use client";

import React, { useState, useEffect } from "react";
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
  Sparkles,
  Terminal,
  Columns2,
  Code2,
  Eye,
} from "lucide-react";

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
  } = useStudioStore();

  const [isDark, setIsDark] = useState(true);

  const errorCount = terminalLogs.filter((l) => l.type === "error").reduce((acc, l) => acc + l.count, 0);
  const warnCount = terminalLogs.filter((l) => l.type === "warn").reduce((acc, l) => acc + l.count, 0);

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

        {/* Breadcrumb Title */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs tracking-tight text-foreground">
            Component Studio
          </span>
          <span className="text-muted-foreground/40 text-xs">/</span>
          <span className="text-xs text-muted-foreground font-normal">Sandbox</span>
        </div>

        <Separator orientation="vertical" className="h-4 hidden md:block" />

        {/* Blueprint Template Selector */}
        <div className="hidden md:flex items-center">
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-2 px-2 text-xs text-foreground font-normal hover:bg-muted"
                  >
                    <Layers className="size-3 text-muted-foreground" />
                    <span className="font-medium text-xs">{currentTemplate.name}</span>
                    <ChevronDown className="size-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Switch component template</TooltipContent>
            </Tooltip>

            <DropdownMenuContent align="start" className="w-68">
              <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">
                Starter Blueprints
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {DEFAULT_TEMPLATES.map((tmpl) => (
                <DropdownMenuItem
                  key={tmpl.id}
                  onClick={() => loadTemplate(tmpl.id)}
                  className="flex flex-col items-start gap-0.5 py-2 cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-xs text-foreground">
                      {tmpl.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {tmpl.category}
                    </span>
                  </div>
                  <span className="line-clamp-1 text-xs text-muted-foreground">
                    {tmpl.description}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Center: Layout View Mode Switcher */}
      <div className="hidden sm:flex items-center">
        <div className="flex items-center bg-muted/50 p-0.5 rounded-lg border border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLayoutMode("split")}
            className={`h-7 px-2.5 text-xs gap-1.5 rounded-md font-sans transition-all ${
              layoutMode === "split"
                ? "bg-background text-foreground shadow-2xs font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-transparent"
            }`}
          >
            <Columns2 className="size-3.5" />
            <span>Split</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLayoutMode("editor")}
            className={`h-7 px-2.5 text-xs gap-1.5 rounded-md font-sans transition-all ${
              layoutMode === "editor"
                ? "bg-background text-foreground shadow-2xs font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-transparent"
            }`}
          >
            <Code2 className="size-3.5" />
            <span>Code</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLayoutMode("preview")}
            className={`h-7 px-2.5 text-xs gap-1.5 rounded-md font-sans transition-all ${
              layoutMode === "preview"
                ? "bg-background text-foreground shadow-2xs font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-transparent"
            }`}
          >
            <Eye className="size-3.5" />
            <span>Preview</span>
          </Button>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
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
                  className="h-4 px-1 text-[9px] font-semibold font-sans"
                >
                  {errorCount}
                </Badge>
              ) : warnCount > 0 ? (
                <Badge
                  variant="secondary"
                  className="h-4 px-1 text-[9px] text-amber-500 bg-amber-500/10 font-sans"
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

        {/* AI Copilot Toggle Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isAiPanelOpen ? "secondary" : "ghost"}
              size="sm"
              onClick={toggleAiPanel}
              className={`h-8 gap-1.5 px-2.5 text-xs font-sans transition-colors ${
                isAiPanelOpen
                  ? "bg-primary/10 text-primary border border-primary/25 font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className={`size-3.5 ${isAiPanelOpen ? "text-primary" : "text-amber-500"}`} />
              <span className="hidden sm:inline">Copilot</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Toggle AI Copilot (Ctrl+I)
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-4 mx-1" />

        {/* Theme Switcher */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="size-8 text-muted-foreground hover:text-foreground"
            >
              {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
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
