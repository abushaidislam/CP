"use client";

import React, { useState, useEffect } from "react";
import { useStudioStore, StudioFileName } from "@/lib/store/studio-store";
import { CodeEditor } from "./code-editor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileCode2,
  FileText,
  Palette,
  AlignLeft,
  Package,
  RotateCcw,
  Check,
  AlertCircle,
  Loader2,
  Copy,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function EditorPanel() {
  const {
    files,
    activeTab,
    dependencies,
    compilerError,
    updateFile,
    setActiveTab,
    resetCurrentTemplate,
    setDependencyModalOpen,
    toggleTerminal,
  } = useStudioStore();

  const [isFormatting, setIsFormatting] = useState(false);
  const [formatSuccess, setFormatSuccess] = useState(false);

  // Global shortcut to toggle terminal (Ctrl+` or Cmd+`)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "`") {
        e.preventDefault();
        toggleTerminal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleTerminal]);

  const tabs: Array<{
    id: StudioFileName;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
  }> = [
    {
      id: "component.tsx",
      label: "component.tsx",
      shortLabel: "component",
      icon: <FileCode2 className="size-3.5 text-muted-foreground" />,
    },
    {
      id: "default.tsx",
      label: "default.tsx",
      shortLabel: "default",
      icon: <FileText className="size-3.5 text-muted-foreground" />,
    },
    {
      id: "index.css",
      label: "index.css",
      shortLabel: "css",
      icon: <Palette className="size-3.5 text-muted-foreground" />,
    },
  ];

  const [copied, setCopied] = useState(false);
  const effectiveTab = (activeTab === "demo.tsx" ? "default.tsx" : activeTab) as StudioFileName;

  const handleCopyFor21st = () => {
    const content = files[effectiveTab] || files[activeTab] || "";
    if (content) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFormat = async () => {
    try {
      setIsFormatting(true);
      const res = await fetch("/api/format-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: files[activeTab],
          filename: activeTab,
        }),
      });

      const data = await res.json();
      if (res.ok && data.formatted) {
        updateFile(activeTab, data.formatted);
        setFormatSuccess(true);
        setTimeout(() => setFormatSuccess(false), 2000);
      }
    } catch (err) {
      console.error("Format error", err);
    } finally {
      setIsFormatting(false);
    }
  };

  const currentFileContent = files[effectiveTab] || files[activeTab] || "";
  const lineCount = currentFileContent.split("\n").length;

  return (
    <div className="@container flex h-full w-full min-w-0 flex-col overflow-hidden border-r-0 md:border-r border-border bg-background">
      {/* File Tabs Header */}
      <div className="studio-toolbar-surface flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border px-2.5 @[420px]:px-3 select-none overflow-hidden">
        {/* Left: File Navigation with sliding active pill & Line Count Badge */}
        <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
          <div
            role="tablist"
            aria-label="Component source files"
            className="relative flex items-center bg-muted/60 p-0.5 rounded-none border border-border/80 min-w-0 max-w-full overflow-x-auto scrollbar-none"
          >
            {tabs.map((tab) => {
              const isActive = effectiveTab === tab.id || activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={tab.label}
                  onClick={() => setActiveTab(tab.id as StudioFileName)}
                  className={cn(
                    "relative z-10 flex h-6 shrink-0 items-center gap-1.5 px-2 @[420px]:px-2.5 text-xs font-sans whitespace-nowrap transition-colors cursor-pointer select-none rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-editor-file-tab-pill"
                      className="absolute inset-0 rounded-none bg-background border border-border/80 shadow-2xs z-[-1]"
                      transition={{ type: "spring", bounce: 0, duration: 0.2 }}
                    />
                  )}
                  <span className="shrink-0">{tab.icon}</span>
                  <span className="hidden @[420px]:inline font-mono text-[11px]">{tab.label}</span>
                  <span className="@[420px]:hidden font-mono text-[11px]">{tab.shortLabel}</span>
                </button>
              );
            })}
          </div>

          <Badge
            variant="outline"
            className="hidden @[540px]:inline-flex h-5 rounded-none px-1.5 text-[11px] font-sans font-normal text-muted-foreground border-border/60 bg-muted/30 tabular-nums whitespace-nowrap shrink-0"
          >
            {lineCount} lines
          </Badge>
        </div>

        {/* Right: Pure Icon-Only Action Controls */}
        <div className="flex items-center gap-1 shrink-0 pl-1 z-10">
          {/* Format (Prettier) - Icon-Only */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={handleFormat}
                disabled={isFormatting}
                aria-label="Format code with Prettier"
                className="studio-icon-btn size-7 shrink-0 rounded-none border-border/80 bg-background/70 text-muted-foreground hover:text-foreground"
              >
                {isFormatting ? (
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                ) : formatSuccess ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <AlignLeft className="size-3.5" />
                )}
                <span className="sr-only">Format</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-sans text-xs">
              Auto-format code with Prettier
            </TooltipContent>
          </Tooltip>

          {/* Dependencies Button - Icon-Only with micro count badge */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setDependencyModalOpen(true)}
                aria-label="Configure NPM packages"
                className="studio-icon-btn relative hidden @[350px]:inline-flex size-7 shrink-0 rounded-none border-border/80 bg-background/70 text-muted-foreground hover:text-foreground"
              >
                <Package className="size-3.5" />
                <span className="sr-only">Packages</span>
                {dependencies.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="pointer-events-none absolute -top-1 -right-1 h-3.5 min-w-3.5 rounded-none px-1 py-0 text-[9px] font-sans font-semibold tabular-nums bg-primary text-primary-foreground"
                  >
                    {dependencies.length}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-sans text-xs">
              Configure NPM dependencies ({dependencies.length})
            </TooltipContent>
          </Tooltip>

          {/* Reset Template Button - Icon-Only */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={resetCurrentTemplate}
                aria-label="Reset template"
                className="studio-icon-btn hidden @[500px]:inline-flex size-7 shrink-0 rounded-none border-border/80 bg-background/70 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3.5" />
                <span className="sr-only">Reset template</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-sans text-xs">
              Reset code to starter blueprint
            </TooltipContent>
          </Tooltip>

          {/* Tablet & Compact Overflow (...) Menu */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="studio-icon-btn size-7 shrink-0 rounded-none border-border/80 bg-background/70 text-muted-foreground hover:text-foreground"
                  >
                    <MoreHorizontal className="size-3.5" />
                    <span className="sr-only">More editor options</span>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-sans text-xs">
                More options
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-52 rounded-none font-sans">
              <DropdownMenuLabel className="text-[10px] uppercase font-sans text-muted-foreground flex items-center justify-between">
                <span>Editor Options</span>
                <span className="text-[10px] text-muted-foreground/80 font-normal tabular-nums">
                  {lineCount} lines
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDependencyModalOpen(true)}
                className="flex items-center justify-between rounded-none text-xs cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Package className="size-3.5" />
                  <span>Packages</span>
                </span>
                <Badge
                  variant="secondary"
                  className="h-4 min-w-4 px-1.5 rounded-none text-[10px] font-sans font-medium tabular-nums"
                >
                  {dependencies.length}
                </Badge>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleFormat}
                disabled={isFormatting}
                className="flex items-center justify-between rounded-none text-xs cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <AlignLeft className="size-3.5" />
                  <span>Format Code</span>
                </span>
                <kbd className="font-mono text-[10px] text-muted-foreground/70 bg-muted px-1 rounded-none border border-border/40">
                  Ctrl+S
                </kbd>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={resetCurrentTemplate}
                className="flex items-center gap-2 rounded-none text-xs text-destructive focus:text-destructive cursor-pointer"
              >
                <RotateCcw className="size-3.5" />
                <span>Reset Starter Blueprint</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Compiler / Lint Error Notification Banner with smooth exit */}
      <AnimatePresence>
        {compilerError && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-center gap-2 border-b border-destructive/20 bg-destructive/10 px-3 py-1.5 text-xs text-destructive"
            >
              <AlertCircle className="size-3.5 shrink-0" />
              <span className="truncate text-[11px] font-sans">{compilerError}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 21st.dev Breadcrumb File Path Header (Container-Responsive) */}
      <div className="flex h-8 shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-muted/20 px-2.5 @[420px]:px-3 font-mono text-[11px] text-muted-foreground select-none overflow-hidden">
        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden whitespace-nowrap">
          {effectiveTab === "index.css" ? (
            <span className="font-bold text-muted-foreground shrink-0">#</span>
          ) : (
            <svg
              className="size-3.5 text-sky-400 shrink-0"
              viewBox="-11.5 -10.23174 23 20.46348"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              aria-hidden="true"
            >
              <circle cx="0" cy="0" r="2.05" fill="currentColor" stroke="none" />
              <ellipse rx="11" ry="4.2" />
              <ellipse rx="11" ry="4.2" transform="rotate(60)" />
              <ellipse rx="11" ry="4.2" transform="rotate(120)" />
            </svg>
          )}
          {/* Full project/sandbox prefix on wide editor containers */}
          <span className="hidden @[480px]:inline-flex items-center gap-1.5 shrink-0">
            <span className="opacity-70">project</span>
            <span className="opacity-40">/</span>
            <span className="opacity-70">sandbox</span>
            <span className="opacity-40">/</span>
          </span>
          {/* Compact ellipsis root indicator on narrower split widths */}
          <span className="@[480px]:hidden inline-flex items-center gap-1.5 shrink-0 opacity-50">
            <span>…</span>
            <span className="opacity-60">/</span>
          </span>
          <span className="hidden @[340px]:inline-flex items-center gap-1.5 shrink-0">
            <span className="opacity-70">src</span>
            <span className="opacity-40">/</span>
          </span>
          {effectiveTab === "component.tsx" && (
            <>
              <span className="hidden @[410px]:inline-flex items-center gap-1.5 shrink-0">
                <span className="opacity-70">components</span>
                <span className="opacity-40">/</span>
                <span className="opacity-70">ui</span>
                <span className="opacity-40">/</span>
              </span>
              <span className="font-semibold text-foreground truncate min-w-0">
                component.tsx
              </span>
            </>
          )}
          {(effectiveTab === "default.tsx" || effectiveTab === "demo.tsx") && (
            <>
              <span className="hidden @[380px]:inline-flex items-center gap-1.5 shrink-0">
                <span className="opacity-70">demos</span>
                <span className="opacity-40">/</span>
              </span>
              <span className="font-semibold text-foreground truncate min-w-0">
                default.tsx
              </span>
            </>
          )}
          {effectiveTab === "index.css" && (
            <span className="font-semibold text-foreground truncate min-w-0">
              index.css
            </span>
          )}
        </div>

        {/* Right: 1-Click Copy for 21st.dev Button & Non-Wrapping Line Count */}
        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap pl-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleCopyFor21st}
                aria-label="Copy for 21st.dev"
                className="studio-icon-btn size-6 shrink-0 rounded-none text-muted-foreground hover:text-foreground"
              >
                {copied ? (
                  <Check className="size-3 text-emerald-500" />
                ) : (
                  <Copy className="size-3" />
                )}
                <span className="sr-only">{copied ? "Copied!" : "Copy for 21st.dev"}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-sans text-xs">
              {copied ? "Copied to clipboard!" : "Copy file code for 21st.dev"}
            </TooltipContent>
          </Tooltip>
          <span className="text-[10px] font-sans text-muted-foreground/70 tabular-nums whitespace-nowrap hidden @[300px]:inline">
            {lineCount} lines
          </span>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 relative overflow-hidden bg-background min-h-0">
        <CodeEditor
          filename={activeTab}
          value={files[activeTab] || files[effectiveTab] || ""}
          onChange={(newVal) => updateFile(activeTab, newVal)}
          onFormat={handleFormat}
        />
      </div>

      {/* Clean Status Footer */}
      <div className="studio-toolbar-surface flex h-7 shrink-0 items-center justify-between gap-2 border-t border-border px-2.5 @[420px]:px-3 text-xs text-muted-foreground select-none overflow-hidden whitespace-nowrap">
        <div className="flex items-center gap-2 text-[11px] min-w-0 overflow-hidden">
          <span className="text-foreground font-mono text-[11px] font-medium truncate">
            {activeTab}
          </span>
          <span className="text-border shrink-0">•</span>
          <span className="font-sans tabular-nums shrink-0">{lineCount} lines</span>
        </div>

        <div className="flex items-center gap-2 text-[11px] shrink-0">
          <span className="hidden @[320px]:inline">TypeScript</span>
          <span className="text-border hidden @[320px]:inline">•</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
}
