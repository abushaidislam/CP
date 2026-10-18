"use client";

import React, { useState, useEffect } from "react";
import { useStudioStore, StudioFileName } from "@/lib/store/studio-store";
import { MonacoCodeEditor } from "./monaco-editor";
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
} from "lucide-react";
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
    icon: React.ReactNode;
  }> = [
    {
      id: "component.tsx",
      label: "component.tsx",
      icon: <FileCode2 className="size-3.5 text-muted-foreground" />,
    },
    {
      id: "demo.tsx",
      label: "demo.tsx",
      icon: <FileText className="size-3.5 text-muted-foreground" />,
    },
    {
      id: "index.css",
      label: "index.css",
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
    <div className="flex h-full w-full flex-col border-r border-border bg-background">
      {/* File Tabs Header */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-muted/10 px-3 select-none">
        {/* File Navigation with sliding active pill */}
        <div className="relative flex items-center bg-muted/60 p-0.5 rounded-md border border-border/40">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as StudioFileName)}
                className={cn(
                  "relative z-10 flex h-6 items-center gap-1.5 px-2.5 text-xs font-mono transition-colors cursor-pointer select-none rounded-sm",
                  isActive
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-editor-file-tab-pill"
                    className="absolute inset-0 rounded-sm bg-background shadow-2xs z-[-1]"
                    transition={{ type: "spring", bounce: 0, duration: 0.2 }}
                  />
                )}
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {/* Format (Prettier) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFormat}
                disabled={isFormatting}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                {isFormatting ? (
                  <Loader2 className="size-3 animate-spin text-primary" />
                ) : formatSuccess ? (
                  <Check className="size-3 text-emerald-500" />
                ) : (
                  <AlignLeft className="size-3" />
                )}
                <span className="hidden sm:inline text-xs">Format</span>
                <kbd className="hidden lg:inline ml-1 font-mono text-[10px] bg-muted px-1 rounded text-muted-foreground">
                  Ctrl+S
                </kbd>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Auto-format code with Prettier
            </TooltipContent>
          </Tooltip>

          {/* Dependencies Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDependencyModalOpen(true)}
                className="h-7 px-2 text-xs gap-1.5"
              >
                <Package className="size-3" />
                <span className="hidden sm:inline">Packages</span>
                <Badge
                  variant="secondary"
                  className="size-4 p-0 flex items-center justify-center text-[10px]"
                >
                  {dependencies.length}
                </Badge>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Configure external NPM dependencies via esm.sh
            </TooltipContent>
          </Tooltip>

          {/* Reset Template Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={resetCurrentTemplate}
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3" />
                <span className="sr-only">Reset template</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Reset code to starter blueprint</TooltipContent>
          </Tooltip>
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
      <div className="flex-1 relative overflow-hidden bg-background">
        <MonacoCodeEditor
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
