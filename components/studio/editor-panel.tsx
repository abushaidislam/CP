"use client";

import React, { useState, useEffect } from "react";
import { useStudioStore, StudioFileName } from "@/lib/store/studio-store";
import { MonacoCodeEditor } from "./monaco-editor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Sparkles,
  Package,
  RotateCcw,
  Check,
  AlertCircle,
  Loader2,
  Terminal,
} from "lucide-react";
import { TerminalPanel } from "./terminal-panel";

export function EditorPanel() {
  const {
    files,
    activeTab,
    dependencies,
    compilerError,
    terminalLogs,
    isTerminalOpen,
    isAiPanelOpen,
    updateFile,
    setActiveTab,
    resetCurrentTemplate,
    setDependencyModalOpen,
    toggleTerminal,
    toggleAiPanel,
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

  const errorCount = terminalLogs.filter((l) => l.type === "error").reduce((acc, l) => acc + l.count, 0);
  const warnCount = terminalLogs.filter((l) => l.type === "warn").reduce((acc, l) => acc + l.count, 0);

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
  const byteCount = new Blob([currentFileContent]).size;

  return (
    <div className="flex h-full w-full flex-col border-r border-border bg-background">
      {/* File Tabs Header */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-muted/10 px-3 select-none">
        {/* Authentic Shadcn Tabs for File Navigation */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as StudioFileName)}
        >
          <TabsList className="h-7 bg-muted/60 p-0.5">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="h-6 gap-1.5 px-2.5 text-xs font-mono"
              >
                {tab.icon}
                <span>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

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
                  <Sparkles className="size-3" />
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

          <Separator orientation="vertical" className="h-3.5 mx-0.5" />

          {/* Terminal / Console Toggle Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isTerminalOpen ? "secondary" : "ghost"}
                size="sm"
                onClick={toggleTerminal}
                className={`h-7 px-2 text-xs gap-1.5 transition-colors ${
                  isTerminalOpen
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Terminal className="size-3 text-emerald-500" />
                <span className="hidden sm:inline">Terminal</span>
                {errorCount > 0 ? (
                  <Badge
                    variant="destructive"
                    className="h-4 px-1 text-[9px] font-bold"
                  >
                    {errorCount}
                  </Badge>
                ) : warnCount > 0 ? (
                  <Badge
                    variant="secondary"
                    className="h-4 px-1 text-[9px] text-amber-500 bg-amber-500/10"
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
                className={`h-7 px-2 text-xs gap-1.5 transition-colors ${
                  isAiPanelOpen
                    ? "bg-primary/10 text-primary border border-primary/25 font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className={`size-3 ${isAiPanelOpen ? "text-primary" : "text-amber-500"}`} />
                <span className="hidden sm:inline">AI Copilot</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Toggle 21st AI Copilot (Ctrl+I)
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Compiler / Lint Error Notification Banner */}
      {compilerError && (
        <div className="flex items-center gap-2 border-b border-destructive/20 bg-destructive/10 px-3 py-1.5 text-xs text-destructive font-mono animate-in fade-in duration-150 ease-smooth-out">
          <AlertCircle className="size-3.5 shrink-0" />
          <span className="truncate text-[11px]">{compilerError}</span>
        </div>
      )}

      {/* Editor Body */}
      <div className="flex-1 relative overflow-hidden bg-background">
        <MonacoCodeEditor
          filename={activeTab}
          value={files[activeTab]}
          onChange={(newVal) => updateFile(activeTab, newVal)}
          onFormat={handleFormat}
        />
      </div>

      {/* Interactive Bottom Terminal & Console Drawer */}
      <TerminalPanel />

      {/* Status Footer */}
      <div className="flex h-7 shrink-0 items-center justify-between border-t border-border bg-muted/20 px-3 text-xs text-muted-foreground select-none">
        <div className="flex items-center gap-2">
          {/* Terminal Toggle Quick Button in Status Bar */}
          <button
            onClick={toggleTerminal}
            className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
              isTerminalOpen
                ? "bg-muted text-foreground font-medium"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
            title="Toggle Console & Terminal (Ctrl+`)"
          >
            <Terminal className="size-3 text-emerald-500" />
            <span>Console</span>
            {errorCount > 0 && (
              <span className="flex items-center gap-0.5 bg-red-500/15 text-red-500 text-[10px] font-bold px-1 rounded-sm">
                <AlertCircle className="size-2.5" />
                {errorCount}
              </span>
            )}
            {warnCount > 0 && errorCount === 0 && (
              <span className="text-amber-500 text-[10px] bg-amber-500/15 font-bold px-1 rounded-sm">
                {warnCount}
              </span>
            )}
          </button>

          <Separator orientation="vertical" className="h-3" />

          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span className="text-foreground font-medium">{activeTab}</span>
          </span>
          <Separator orientation="vertical" className="h-3" />
          <span>{lineCount} lines</span>
          <Separator orientation="vertical" className="h-3" />
          <span>{byteCount} bytes</span>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="hidden sm:inline">Prettier</span>
          <Separator orientation="vertical" className="h-3 hidden sm:block" />
          <span>TypeScript 5.x</span>
          <Separator orientation="vertical" className="h-3" />
          <span className="hidden sm:inline">UTF-8</span>
        </div>
      </div>
    </div>
  );
}
