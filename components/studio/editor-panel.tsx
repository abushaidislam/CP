"use client";

import React, { useState, useEffect } from "react";
import { useStudioStore, StudioFileName } from "@/lib/store/studio-store";
import { CodeEditor } from "./code-editor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      id: "demo.tsx",
      label: "demo.tsx",
      shortLabel: "demo",
      icon: <FileText className="size-3.5 text-muted-foreground" />,
    },
    {
      id: "index.css",
      label: "index.css",
      shortLabel: "css",
      icon: <Palette className="size-3.5 text-muted-foreground" />,
    },
  ];

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

  const currentFileContent = files[activeTab];
  const lineCount = currentFileContent.split("\n").length;

  return (
    <div className="flex h-full w-full flex-col border-r-0 md:border-r border-border bg-background">
      {/* File Tabs Header */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border/70 bg-card/50 dark:bg-card/30 backdrop-blur-xs px-3 select-none transition-colors">
        {/* Left: File Navigation Tabs & Line Count Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as StudioFileName)}
          >
            <TabsList className="h-7 bg-muted/60 dark:bg-muted/40 p-0.5 rounded-lg border border-border/40 gap-0.5">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="h-6 gap-1 sm:gap-1.5 px-2 sm:px-2.5 text-xs font-sans rounded-md transition-colors"
                >
                  {tab.icon}
                  <span className="hidden xl:inline font-sans">{tab.label}</span>
                  <span className="xl:hidden font-sans">{tab.shortLabel}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Badge
            variant="outline"
            className="hidden xl:inline-flex h-5 px-1.5 text-[11px] font-sans font-normal text-muted-foreground border-border/40 bg-muted/30 tabular-nums shrink-0"
          >
            {lineCount} lines
          </Badge>
        </div>

        {/* Right: Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Format (Prettier) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFormat}
                disabled={isFormatting}
                className="h-7 px-2 sm:px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground rounded-md transition-colors"
              >
                {isFormatting ? (
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                ) : formatSuccess ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <AlignLeft className="size-3.5" />
                )}
                <span className="hidden xl:inline text-xs font-sans">Format</span>
                <kbd className="hidden 2xl:inline ml-0.5 font-sans text-[10px] text-muted-foreground/70 bg-muted px-1 py-0.5 rounded border border-border/40">
                  Ctrl+S
                </kbd>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Auto-format code with Prettier
            </TooltipContent>
          </Tooltip>

          {/* Dependencies Button (Desktop / Wide screen) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDependencyModalOpen(true)}
                className="hidden xl:inline-flex h-7 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground rounded-md border-border/50 transition-colors"
              >
                <Package className="size-3.5" />
                <span className="font-sans">Packages</span>
                <Badge
                  variant="secondary"
                  className="h-4 min-w-4 px-1 rounded-full text-[10px] font-sans font-medium flex items-center justify-center"
                >
                  {dependencies.length}
                </Badge>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Configure external NPM dependencies via esm.sh
            </TooltipContent>
          </Tooltip>

          {/* Reset Template Button (Desktop / Wide screen) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={resetCurrentTemplate}
                className="hidden xl:inline-flex size-7 text-muted-foreground hover:text-foreground rounded-md transition-colors"
              >
                <RotateCcw className="size-3.5" />
                <span className="sr-only">Reset template</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Reset code to starter blueprint</TooltipContent>
          </Tooltip>

          {/* Tablet & Compact Overflow (...) Menu */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-foreground rounded-md transition-colors"
                  >
                    <MoreHorizontal className="size-3.5" />
                    <span className="sr-only">More editor options</span>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">More options</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-52 font-sans">
              <DropdownMenuLabel className="text-[10px] uppercase font-sans text-muted-foreground flex items-center justify-between">
                <span>Editor Options</span>
                <span className="text-[10px] text-muted-foreground/80 font-normal">
                  {lineCount} lines
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDependencyModalOpen(true)}
                className="flex items-center justify-between text-xs cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Package className="size-3.5" />
                  <span>Packages</span>
                </span>
                <Badge
                  variant="secondary"
                  className="h-4 min-w-4 px-1.5 rounded-full text-[10px] font-sans font-medium"
                >
                  {dependencies.length}
                </Badge>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleFormat}
                disabled={isFormatting}
                className="flex items-center justify-between text-xs cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <AlignLeft className="size-3.5" />
                  <span>Format Code</span>
                </span>
                <kbd className="font-sans text-[10px] text-muted-foreground/70 bg-muted px-1 rounded border border-border/40">
                  Ctrl+S
                </kbd>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={resetCurrentTemplate}
                className="flex items-center gap-2 text-xs text-destructive focus:text-destructive cursor-pointer"
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
            <div className="flex items-center gap-2 border-b border-destructive/20 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
              <AlertCircle className="size-3.5 shrink-0" />
              <span className="truncate text-[11px] font-sans">{compilerError}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Body */}
      <div className="flex-1 relative overflow-hidden bg-background min-h-0">
        <CodeEditor
          filename={activeTab}
          value={files[activeTab]}
          onChange={(newVal) => updateFile(activeTab, newVal)}
          onFormat={handleFormat}
        />
      </div>

      {/* Clean Status Footer */}
      <div className="flex h-7 shrink-0 items-center justify-between border-t border-border bg-muted/10 px-3 text-xs text-muted-foreground select-none">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-foreground font-medium">{activeTab}</span>
          <span className="text-border">•</span>
          <span>{lineCount} lines</span>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span>TypeScript</span>
          <span className="text-border">•</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
}
