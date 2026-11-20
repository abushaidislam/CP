"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Copy, ShieldCheck } from "lucide-react";

interface PublishExportTabProps {
  activeName: string;
  derivedSlug: string;
  defaultDescription?: string;
  customTitle: string;
  onCustomTitleChange: (val: string) => void;
  customSlug: string;
  onCustomSlugChange: (val: string) => void;
  customDescription: string;
  onCustomDescriptionChange: (val: string) => void;
  customTags: string;
  onCustomTagsChange: (val: string) => void;
  visibility: "published" | "private";
  onVisibilityChange: (val: "published" | "private") => void;
  pathStyle: "folder" | "project";
  onPathStyleChange: (val: "folder" | "project") => void;
  cliFormat: "oneline" | "powershell" | "bash";
  onCliFormatChange: (val: "oneline" | "powershell" | "bash") => void;
  publishCommand: string;
  copiedPublishCli: boolean;
  onCopyPublishCli: () => void;
  copiedSetupCli: boolean;
  onCopySetupCli: () => void;
}

export function PublishExportTab({
  activeName,
  derivedSlug,
  defaultDescription,
  customTitle,
  onCustomTitleChange,
  customSlug,
  onCustomSlugChange,
  customDescription,
  onCustomDescriptionChange,
  customTags,
  onCustomTagsChange,
  visibility,
  onVisibilityChange,
  pathStyle,
  onPathStyleChange,
  cliFormat,
  onCliFormatChange,
  publishCommand,
  copiedPublishCli,
  onCopyPublishCli,
  copiedSetupCli,
  onCopySetupCli,
}: PublishExportTabProps) {
  return (
    <div className="space-y-4">
      {/* Component Identity & Metadata */}
      <div className="rounded-none border border-border bg-background p-4 space-y-3 font-sans">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5">
            <label
              htmlFor="publish-component-title"
              className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider font-sans"
            >
              Component Name
            </label>
            <Input
              id="publish-component-title"
              type="text"
              value={customTitle}
              onChange={(e) => onCustomTitleChange(e.target.value)}
              placeholder={activeName}
              className="mt-1 h-8 text-xs rounded-none bg-card font-sans"
            />
          </div>

          <div className="sm:col-span-4">
            <label
              htmlFor="publish-component-slug"
              className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider font-sans"
            >
              Slug / Filename
            </label>
            <Input
              id="publish-component-slug"
              type="text"
              value={customSlug}
              onChange={(e) => onCustomSlugChange(e.target.value)}
              placeholder={derivedSlug}
              className="mt-1 h-8 text-xs rounded-none font-mono bg-card"
            />
          </div>

          <div className="sm:col-span-3">
            <label
              id="publish-visibility-label"
              className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider font-sans"
            >
              Visibility
            </label>
            <div
              role="group"
              aria-labelledby="publish-visibility-label"
              className="mt-1 grid grid-cols-2 gap-px bg-border border border-border h-8 font-sans"
            >
              <Button
                variant={visibility === "published" ? "default" : "ghost"}
                size="sm"
                type="button"
                aria-pressed={visibility === "published"}
                onClick={() => onVisibilityChange("published")}
                className="rounded-none h-full text-[11px] font-sans px-1"
              >
                Public
              </Button>
              <Button
                variant={visibility === "private" ? "default" : "ghost"}
                size="sm"
                type="button"
                aria-pressed={visibility === "private"}
                onClick={() => onVisibilityChange("private")}
                className="rounded-none h-full text-[11px] font-sans px-1"
              >
                Private
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label
              htmlFor="publish-custom-description"
              className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider font-sans"
            >
              Description (Optional)
            </label>
            <Input
              id="publish-custom-description"
              type="text"
              value={customDescription}
              onChange={(e) => onCustomDescriptionChange(e.target.value)}
              placeholder={
                defaultDescription || `Production-ready ${activeName} component`
              }
              className="mt-1 h-8 text-xs rounded-none bg-card font-sans"
            />
          </div>
          <div>
            <label
              htmlFor="publish-custom-tags"
              className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider font-sans"
            >
              Tags (comma separated)
            </label>
            <Input
              id="publish-custom-tags"
              type="text"
              value={customTags}
              onChange={(e) => onCustomTagsChange(e.target.value)}
              placeholder="button, animation, tailwind, ui"
              className="mt-1 h-8 text-xs rounded-none font-mono bg-card"
            />
          </div>
        </div>
      </div>

      {/* 21st CLI Command Generator */}
      <div className="rounded-none border border-border bg-background p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-foreground font-sans">
            21st.dev CLI Publish Command
          </span>

          <div className="flex items-center gap-2">
            <div
              role="group"
              aria-label="CLI file path style"
              className="inline-flex rounded-none border border-border bg-card p-0.5 text-xs font-sans"
            >
              <Button
                variant={pathStyle === "folder" ? "default" : "ghost"}
                size="sm"
                type="button"
                aria-pressed={pathStyle === "folder"}
                onClick={() => onPathStyleChange("folder")}
                className="rounded-none h-6 px-2 text-[10px] font-sans"
              >
                Folder Root
              </Button>
              <Button
                variant={pathStyle === "project" ? "default" : "ghost"}
                size="sm"
                type="button"
                aria-pressed={pathStyle === "project"}
                onClick={() => onPathStyleChange("project")}
                className="rounded-none h-6 px-2 text-[10px] font-sans"
              >
                Next.js Path
              </Button>
            </div>

            <div
              role="group"
              aria-label="CLI shell format"
              className="inline-flex rounded-none border border-border bg-card p-0.5 text-xs font-sans"
            >
              <Button
                variant={cliFormat === "oneline" ? "default" : "ghost"}
                size="sm"
                type="button"
                aria-pressed={cliFormat === "oneline"}
                onClick={() => onCliFormatChange("oneline")}
                className="rounded-none h-6 px-2 text-[10px] font-sans"
              >
                One-Liner
              </Button>
              <Button
                variant={cliFormat === "powershell" ? "default" : "ghost"}
                size="sm"
                type="button"
                aria-pressed={cliFormat === "powershell"}
                onClick={() => onCliFormatChange("powershell")}
                className="rounded-none h-6 px-2 text-[10px] font-sans"
              >
                PowerShell
              </Button>
              <Button
                variant={cliFormat === "bash" ? "default" : "ghost"}
                size="sm"
                type="button"
                aria-pressed={cliFormat === "bash"}
                onClick={() => onCliFormatChange("bash")}
                className="rounded-none h-6 px-2 text-[10px] font-sans"
              >
                Bash
              </Button>
            </div>
          </div>
        </div>

        <div className="relative rounded-none border border-border bg-card p-3.5 pr-24 font-mono text-xs text-foreground">
          <pre className="whitespace-pre-wrap break-all leading-relaxed select-all font-mono">
            {publishCommand}
          </pre>
          <Button
            variant="default"
            size="sm"
            onClick={onCopyPublishCli}
            className="rounded-none absolute top-2.5 right-2.5 h-7 gap-1.5 px-3 text-xs font-sans cursor-pointer"
          >
            {copiedPublishCli ? (
              <Check className="size-3.5 text-emerald-400" />
            ) : (
              <Copy className="size-3.5" />
            )}
            <span>{copiedPublishCli ? "Copied!" : "Copy"}</span>
          </Button>
        </div>

        <div className="rounded-none border border-border bg-card px-3 py-2 flex items-center justify-between gap-3 text-xs font-sans">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="size-3.5 text-primary shrink-0" />
            <span className="text-[11px] text-muted-foreground font-sans shrink-0">
              First time?
            </span>
            <code className="rounded-none bg-background px-2 py-0.5 font-mono text-[11px] border border-border text-foreground truncate">
              npm i -g @21st-dev/cli &amp;&amp; 21st login
            </code>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onCopySetupCli}
            className="rounded-none h-6 text-[11px] gap-1 px-2 font-sans shrink-0"
          >
            {copiedSetupCli ? (
              <Check className="size-3 text-emerald-500" />
            ) : (
              <Copy className="size-3" />
            )}
            <span>{copiedSetupCli ? "Copied" : "Copy Setup"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
