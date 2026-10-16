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
} from "lucide-react";

export function StudioHeader() {
  const {
    currentTemplateId,
    loadTemplate,
    setPublishModalOpen,
  } = useStudioStore();

  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

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
    <header className="flex h-13 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-sm select-none z-30">
      {/* Left: Brand & Template Selector */}
      <div className="flex items-center gap-3">
        {/* Vercel Geometric Triangle Mark */}
        <div className="flex size-7 items-center justify-center rounded-md bg-foreground text-background shadow-xs">
          <svg
            viewBox="0 0 24 24"
            className="size-3.5 fill-current transform -translate-y-px"
          >
            <polygon points="12,2 22,20 2,20" />
          </svg>
        </div>

        {/* Breadcrumb Title */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs tracking-tight text-foreground">
            21st Studio
          </span>
          <span className="text-muted-foreground/60 text-xs">/</span>
          <Badge variant="outline" className="text-[10px] py-0 px-1.5 hidden sm:inline-flex text-muted-foreground font-mono">
            v2.0
          </Badge>
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
                    className="h-8 gap-2 px-2.5 text-xs text-foreground font-normal hover:bg-muted"
                  >
                    <Layers className="size-3.5 text-primary" />
                    <span className="font-medium text-xs">{currentTemplate.name}</span>
                    <ChevronDown className="size-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Switch component template</TooltipContent>
            </Tooltip>

            <DropdownMenuContent align="start" className="w-68">
              <DropdownMenuLabel className="text-[10px] font-mono uppercase text-muted-foreground">
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
                    <span className="font-mono text-[9px] uppercase text-muted-foreground">
                      {tmpl.category}
                    </span>
                  </div>
                  <span className="line-clamp-1 text-[11px] text-muted-foreground">
                    {tmpl.description}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Center: Live Status Indicator */}
      <div className="hidden lg:flex items-center gap-2">
        <Badge variant="outline" className="gap-1.5 py-0.5 px-2.5 text-[11px] font-mono text-muted-foreground bg-muted/40">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Sandbox Active
        </Badge>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* 21st.dev Publish Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="sm"
              onClick={() => setPublishModalOpen(true)}
              className="h-8 gap-2 px-3 text-xs font-medium"
            >
              <UploadCloud className="size-3.5" />
              <span>Publish Package</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Generate AST metadata & 21st.dev publish package
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="h-4 mx-0.5" />

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
