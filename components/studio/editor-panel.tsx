"use client";

import React, { useState } from "react";
import { useStudioStore, StudioFileName } from "@/lib/store/studio-store";
import { MonacoCodeEditor } from "./monaco-editor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";

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
  } = useStudioStore();

  const [isFormatting, setIsFormatting] = useState(false);
  const [formatSuccess, setFormatSuccess] = useState(false);

  const tabs: Array<{
    id: StudioFileName;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      id: "component.tsx",
      label: "component.tsx",
      icon: <FileCode2 className="size-3.5 text-sky-500" />,
    },
    {
      id: "demo.tsx",
      label: "demo.tsx",
      icon: <FileText className="size-3.5 text-violet-500" />,
    },
    {
      id: "index.css",
      label: "index.css",
      icon: <Palette className="size-3.5 text-pink-500" />,
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
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-muted/20 px-2 select-none">
        {/* File Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex items-center gap-2 rounded-t-md px-3 py-1.5 text-xs font-mono font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-background text-foreground border border-b-transparent border-border shadow-xs border-t-2 border-t-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {tab.icon}
                <span className="text-[11px]">{tab.label}</span>
                {isActive && (
                  <span className="size-1.5 rounded-full bg-primary" />
                )}
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
                  <Loader2 className="size-3.5 animate-spin text-primary" />
                ) : formatSuccess ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <Sparkles className="size-3.5 text-primary" />
                )}
                <span className="hidden sm:inline text-xs">Format</span>
                <kbd className="hidden lg:inline ml-1 font-mono text-[9px] bg-muted px-1 rounded text-muted-foreground">
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
                <Package className="size-3.5 text-primary" />
                <span className="hidden sm:inline">Packages</span>
                <Badge
                  variant="secondary"
                  className="size-4 p-0 flex items-center justify-center font-mono text-[9px]"
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
                <RotateCcw className="size-3.5" />
                <span className="sr-only">Reset template</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Reset code to starter blueprint</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Compiler / Lint Error Notification Banner */}
      {compilerError && (
        <div className="flex items-center gap-2 border-b border-destructive/20 bg-destructive/10 px-3 py-1.5 text-xs text-destructive font-mono animate-in fade-in">
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

      {/* Status Footer */}
      <div className="flex h-7 shrink-0 items-center justify-between border-t border-border bg-muted/30 px-3 text-[11px] text-muted-foreground font-mono select-none">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span className="text-foreground font-medium">{activeTab}</span>
          </span>
          <Separator orientation="vertical" className="h-3" />
          <span>{lineCount} lines</span>
          <Separator orientation="vertical" className="h-3" />
          <span>{byteCount} bytes</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">Prettier 3.x</span>
          <Separator orientation="vertical" className="h-3 hidden sm:block" />
          <span>TypeScript 5.x</span>
          <Separator orientation="vertical" className="h-3" />
          <span className="hidden sm:inline">UTF-8</span>
        </div>
      </div>
    </div>
  );
}
