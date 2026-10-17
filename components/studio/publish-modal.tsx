"use client";

import React, { useState, useMemo } from "react";
import confetti from "canvas-confetti";
import { useStudioStore } from "@/lib/store/studio-store";
import {
  parseComponentAST,
  generateTwentyFirstPayload,
  TwentyFirstPublishPayload,
} from "@/lib/sandbox/ast-parser";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  UploadCloud,
  Check,
  Copy,
  Download,
  Terminal,
  Code,
  Box,
  FileJson,
  Sparkles,
  Tag,
  ExternalLink,
  ShieldCheck,
  FileCode2,
  FolderDown,
  Layers,
  Info,
} from "lucide-react";

const QUICK_TAGS = [
  "button",
  "card",
  "modal",
  "input",
  "tabs",
  "dropdown",
  "animation",
  "framer-motion",
  "tailwind",
  "interactive",
  "ui",
  "accessible",
];

export function PublishModal() {
  const {
    files,
    dependencies,
    isPublishModalOpen,
    setPublishModalOpen,
  } = useStudioStore();

  const [activeTab, setActiveTab] = useState<"cli" | "payload" | "ast">("cli");
  const [cliFormat, setCliFormat] = useState<"oneline" | "powershell" | "bash">("oneline");

  // Copy feedbacks
  const [copiedPublishCli, setCopiedPublishCli] = useState(false);
  const [copiedSetupCli, setCopiedSetupCli] = useState(false);
  const [copiedInstallCli, setCopiedInstallCli] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedComponentCode, setCopiedComponentCode] = useState(false);
  const [copiedDemoCode, setCopiedDemoCode] = useState(false);

  // Metadata overrides state
  const [authorName, setAuthorName] = useState("Component Studio Creator");
  const [customTitle, setCustomTitle] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customTags, setCustomTags] = useState("");
  const [targetLibrary, setTargetLibrary] = useState("default");
  const [registryType, setRegistryType] = useState<"ui" | "hooks" | "blocks" | "icons">("ui");
  const [visibility, setVisibility] = useState<"published" | "private">("published");
  const [hasSeparateDemo, setHasSeparateDemo] = useState(true);
  const [customCompPath, setCustomCompPath] = useState("");
  const [customDemoPath, setCustomDemoPath] = useState("");

  // Parse AST
  const ast = useMemo(() => {
    return parseComponentAST(
      files["component.tsx"],
      files["demo.tsx"],
      files["index.css"]
    );
  }, [files]);

  // Derived slug and paths
  const derivedSlug = useMemo(() => {
    const raw = customSlug || ast.componentName;
    return raw
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/^-+|-+$/g, "") || "component";
  }, [customSlug, ast.componentName]);

  const activeCompPath = customCompPath || `./components/ui/${derivedSlug}.tsx`;
  const activeDemoPath = customDemoPath || `./components/demo/${derivedSlug}-demo.tsx`;

  // Parsed tags array
  const parsedTagsArray = useMemo(() => {
    if (!customTags) return undefined;
    return customTags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
  }, [customTags]);

  // Generate 21st.dev payload merging store dependencies and code imports
  const payload: TwentyFirstPublishPayload = useMemo(() => {
    return generateTwentyFirstPayload(
      files["component.tsx"],
      files["demo.tsx"],
      files["index.css"],
      {
        name: derivedSlug,
        title: customTitle || ast.title,
        description: customDescription || ast.description,
        author: authorName,
        tags: parsedTagsArray,
        targetLibrary,
        registry: registryType,
        visibility,
        componentPath: activeCompPath,
        demoPath: activeDemoPath,
        hasSeparateDemo: hasSeparateDemo && !!files["demo.tsx"] && files["demo.tsx"].trim().length > 0,
        dependencies: Array.from(new Set([...ast.dependencies, ...dependencies])),
      }
    );
  }, [
    files,
    ast,
    derivedSlug,
    customTitle,
    customDescription,
    authorName,
    parsedTagsArray,
    targetLibrary,
    registryType,
    visibility,
    activeCompPath,
    activeDemoPath,
    hasSeparateDemo,
    dependencies,
  ]);

  const jsonString = useMemo(() => {
    return JSON.stringify(payload, null, 2);
  }, [payload]);

  // Command to display based on format
  const currentPublishCommand = useMemo(() => {
    if (cliFormat === "powershell") {
      return payload.publishCliCommandPowerShell;
    }
    if (cliFormat === "bash") {
      return payload.publishCliCommandBash;
    }
    return payload.publishCliCommand;
  }, [cliFormat, payload]);

  // Copy handlers
  const handleCopyPublishCli = () => {
    navigator.clipboard.writeText(currentPublishCommand);
    setCopiedPublishCli(true);
    setTimeout(() => setCopiedPublishCli(false), 2000);
    confetti({
      particleCount: 75,
      spread: 60,
      origin: { y: 0.65 },
    });
  };

  const handleCopySetupCli = () => {
    navigator.clipboard.writeText("npm i -g @21st-dev/cli && 21st login");
    setCopiedSetupCli(true);
    setTimeout(() => setCopiedSetupCli(false), 2000);
  };

  const handleCopyInstallCli = () => {
    navigator.clipboard.writeText(`21st add ${payload.author ? `${payload.author}/` : ""}${payload.name}`);
    setCopiedInstallCli(true);
    setTimeout(() => setCopiedInstallCli(false), 2000);
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(jsonString);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleCopyComponentCode = () => {
    navigator.clipboard.writeText(files["component.tsx"]);
    setCopiedComponentCode(true);
    setTimeout(() => setCopiedComponentCode(false), 2000);
  };

  const handleCopyDemoCode = () => {
    navigator.clipboard.writeText(files["demo.tsx"]);
    setCopiedDemoCode(true);
    setTimeout(() => setCopiedDemoCode(false), 2000);
  };

  // Download handlers
  const handleDownloadJson = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${payload.name}-21st-package.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadComponent = () => {
    const blob = new Blob([files["component.tsx"]], { type: "text/typescript-jsx" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${payload.name}.tsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadDemo = () => {
    const blob = new Blob([files["demo.tsx"]], { type: "text/typescript-jsx" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${payload.name}-demo.tsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAddQuickTag = (tag: string) => {
    const currentList = customTags
      ? customTags.split(",").map((t) => t.trim().toLowerCase())
      : (payload.tags || []);
    if (!currentList.includes(tag)) {
      setCustomTags([...currentList, tag].join(", "));
    }
  };

  return (
    <Dialog open={isPublishModalOpen} onOpenChange={setPublishModalOpen}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col border-border bg-background p-6 shadow-2xl rounded-2xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="pr-8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md shadow-primary/20 shrink-0">
              <UploadCloud className="size-5" />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
                <span>Publish to 21st.dev</span>
                <Badge variant="blue" className="font-mono text-[11px] font-normal">
                  CLI & Registry Generator
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Generate optimized 21st CLI commands, configure metadata, and prepare production registry packages.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-w-0">
          {/* Metadata Customization Card */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Box className="size-3.5 text-primary" />
                Component Metadata & Settings
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground font-sans">
                  Visibility:
                </span>
                <div className="inline-flex rounded-md border border-border bg-background p-0.5 text-xs font-sans">
                  <button
                    type="button"
                    onClick={() => setVisibility("published")}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors font-sans ${
                      visibility === "published"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    published
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility("private")}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors font-sans ${
                      visibility === "private"
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    private
                  </button>
                </div>
              </div>
            </div>

            {/* Row 1: Title, Slug, Registry */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider font-sans">
                  Title / Name
                </label>
                <Input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={ast.title || "Interactive Button"}
                  className="mt-1 h-8 text-xs bg-background font-sans"
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider font-sans">
                  Slug
                </label>
                <Input
                  type="text"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  placeholder={derivedSlug}
                  className="mt-1 h-8 text-xs font-mono bg-background"
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider font-sans">
                  Registry Type
                </label>
                <div className="mt-1 flex rounded-md border border-border bg-background p-0.5 h-8 font-sans">
                  {(["ui", "hooks", "blocks", "icons"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setRegistryType(t)}
                      className={`flex-1 rounded text-[11px] font-sans transition-colors ${
                        registryType === t
                          ? "bg-primary text-primary-foreground font-medium shadow-2xs"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Description, Target Library, Author */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  One-Line Description
                </label>
                <Input
                  type="text"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder={ast.description}
                  className="mt-1 h-8 text-xs bg-background"
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Target Library (--to)
                </label>
                <Input
                  type="text"
                  value={targetLibrary}
                  onChange={(e) => setTargetLibrary(e.target.value)}
                  placeholder="default"
                  className="mt-1 h-8 text-xs font-mono bg-background"
                />
              </div>
            </div>

            {/* Row 3: Tags & Quick Tags */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Tag className="size-3" />
                  Tags (comma separated)
                </label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {payload.tags?.length || 0} tags active
                </span>
              </div>
              <Input
                type="text"
                value={customTags}
                onChange={(e) => setCustomTags(e.target.value)}
                placeholder={payload.tags?.join(", ") || "button, animation, tailwind, ui"}
                className="h-8 text-xs font-mono bg-background"
              />

              {/* Quick Tag Pills */}
              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                <span className="text-[10px] text-muted-foreground mr-1">Quick add:</span>
                {QUICK_TAGS.map((tag) => {
                  const isActive = (payload.tags || []).includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddQuickTag(tag)}
                      disabled={isActive}
                      className={`rounded px-1.5 py-0.5 text-[10px] font-mono transition-all ${
                        isActive
                          ? "bg-primary/20 text-primary font-medium opacity-60 cursor-default"
                          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-border/60"
                      }`}
                    >
                      +{tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
            className="w-full min-w-0"
          >
            <TabsList className="grid grid-cols-3 w-full h-9 bg-muted/60 p-1 rounded-xl">
              <TabsTrigger
                value="cli"
                className="gap-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg"
              >
                <Terminal className="size-3.5 text-primary" />
                <span>21st Publish CLI</span>
              </TabsTrigger>
              <TabsTrigger
                value="payload"
                className="gap-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg"
              >
                <FileJson className="size-3.5" />
                <span>Registry Schema JSON</span>
              </TabsTrigger>
              <TabsTrigger
                value="ast"
                className="gap-2 text-xs font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg"
              >
                <Code className="size-3.5" />
                <span>Typed Props ({ast.props.length})</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: CLI PUBLISH COMMAND (STAR FEATURE) */}
            <TabsContent value="cli" className="flex flex-col gap-4 mt-3">
              {/* Step 1: Pre-requisites */}
              <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <ShieldCheck className="size-4 text-emerald-500" />
                    <span>Step 1: Check 21st CLI & Sign In</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    If 21st CLI is not installed or signed in yet, run this once:
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="hidden sm:inline-block rounded bg-background px-2.5 py-1 text-xs font-mono border border-border text-foreground">
                    npm i -g @21st-dev/cli && 21st login
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopySetupCli}
                    className="h-7 text-xs gap-1.5 shrink-0"
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

              {/* Step 2: Main Publish Command */}
              <div className="rounded-xl border border-primary/30 bg-muted/40 p-4 space-y-3 relative overflow-hidden shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                      2
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      Publish Command (Ready to Run)
                    </span>
                  </div>

                  {/* Format Selector Pills */}
                  <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-0.5">
                    <button
                      type="button"
                      onClick={() => setCliFormat("oneline")}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                        cliFormat === "oneline"
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      One-Liner (PowerShell/CMD/Bash)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCliFormat("powershell")}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                        cliFormat === "powershell"
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      PowerShell (`)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCliFormat("bash")}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                        cliFormat === "bash"
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Bash (\)
                    </button>
                  </div>
                </div>

                {/* File Options Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border/50 text-xs">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={hasSeparateDemo}
                      onCheckedChange={setHasSeparateDemo}
                      id="separate-demo"
                    />
                    <label
                      htmlFor="separate-demo"
                      className="text-xs text-muted-foreground cursor-pointer select-none"
                    >
                      Pass separate demo showcase (<code className="font-mono text-foreground">--demo</code>)
                    </label>
                  </div>

                  <div className="text-[11px] text-muted-foreground font-mono">
                    Target: <span className="text-sky-500">{activeCompPath}</span>
                    {hasSeparateDemo && (
                      <> + <span className="text-violet-500">{activeDemoPath}</span></>
                    )}
                  </div>
                </div>

                {/* Command Preview Box */}
                <div className="relative rounded-lg border border-border bg-background/95 p-3.5 font-mono text-xs text-foreground shadow-inner">
                  <pre className="whitespace-pre-wrap break-all leading-relaxed select-all">
                    {currentPublishCommand}
                  </pre>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleCopyPublishCli}
                    className="absolute top-2.5 right-2.5 h-7 gap-1.5 px-3 text-xs shadow-sm"
                  >
                    {copiedPublishCli ? (
                      <Check className="size-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    <span>{copiedPublishCli ? "Copied Command!" : "Copy Command"}</span>
                  </Button>
                </div>

                {/* Step 3: Review notice */}
                <div className="flex items-start gap-2 rounded-lg bg-sky-500/10 border border-sky-500/20 p-2.5 text-[11px] text-sky-700 dark:text-sky-300">
                  <Info className="size-4 shrink-0 mt-0.5 text-sky-500" />
                  <div>
                    <span className="font-semibold">Review Pipeline:</span> When you run this command, 21st CLI will validate dependencies and open a <strong>Review URL</strong> in your browser. Check both light and dark themes before confirming!
                  </div>
                </div>
              </div>

              {/* Bonus Helpers: Quick File Downloader & Install Command */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Local Files Downloader */}
                <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <FolderDown className="size-3.5 text-primary" />
                    <span>Download Source Files (.tsx)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Need the files locally before running the publish command?
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadComponent}
                      className="h-7 text-xs gap-1"
                    >
                      <Download className="size-3" />
                      <span>{payload.name}.tsx</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadDemo}
                      className="h-7 text-xs gap-1"
                    >
                      <Download className="size-3" />
                      <span>{payload.name}-demo.tsx</span>
                    </Button>
                  </div>
                </div>

                {/* Post-Publish Install Commands */}
                <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <Terminal className="size-3.5 text-primary" />
                      <span>Install Once Published</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyInstallCli}
                      className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      {copiedInstallCli ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </Button>
                  </div>
                  <div className="rounded bg-background px-2.5 py-1.5 font-mono text-[11px] border border-border truncate text-muted-foreground">
                    21st add {payload.author ? `${payload.author}/` : ""}{payload.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    or: npx shadcn@latest add https://21st.dev/r/{payload.name}.json
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: JSON Payload Preview */}
            <TabsContent value="payload" className="flex flex-col gap-2 mt-3 min-w-0 w-full">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Official 21st.dev Registry JSON Schema
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyPayload}
                  className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  {copiedPayload ? (
                    <Check className="size-3 text-emerald-500" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  <span>{copiedPayload ? "Copied" : "Copy JSON"}</span>
                </Button>
              </div>
              <div className="relative max-h-72 w-full min-w-0 overflow-auto rounded-xl border border-border bg-muted/40 p-4 font-mono text-xs leading-relaxed text-foreground">
                <pre className="whitespace-pre-wrap break-all font-mono text-xs">{jsonString}</pre>
              </div>
            </TabsContent>

            {/* TAB 3: AST & Props Table */}
            <TabsContent value="ast" className="flex flex-col gap-3 mt-3">
              <div className="max-h-72 overflow-y-auto rounded-xl border border-border bg-muted/40 p-3">
                <div className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
                  TypeScript Prop Interface ({ast.props.length} props parsed)
                </div>
                {ast.props.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground font-mono text-[11px]">
                          <th className="py-2 px-2">Prop</th>
                          <th className="py-2 px-2">Type</th>
                          <th className="py-2 px-2">Required</th>
                          <th className="py-2 px-2">Default</th>
                          <th className="py-2 px-2">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border font-mono text-[11px]">
                        {ast.props.map((p) => (
                          <tr key={p.name} className="hover:bg-muted/50">
                            <td className="py-2 px-2 font-medium text-sky-500">
                              {p.name}
                            </td>
                            <td className="py-2 px-2 text-violet-500">{p.type}</td>
                            <td className="py-2 px-2">
                              {p.optional ? (
                                <Badge variant="secondary" className="text-[10px] font-normal">
                                  optional
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="text-[10px] font-normal">
                                  required
                                </Badge>
                              )}
                            </td>
                            <td className="py-2 px-2 text-muted-foreground">
                              {p.defaultValue || "-"}
                            </td>
                            <td className="py-2 px-2 text-muted-foreground font-sans text-xs">
                              {p.description || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    {"No TypeScript interface found in component.tsx. Define `interface ComponentProps { ... }` to automatically populate."}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 mt-2 shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyComponentCode}>
              {copiedComponentCode ? (
                <Check className="size-3.5 text-emerald-500 mr-1" />
              ) : (
                <Code className="size-3.5 mr-1 text-primary" />
              )}
              Copy Component TSX
            </Button>

            <Button variant="outline" size="sm" onClick={handleDownloadJson}>
              <Download className="size-3.5 mr-1" />
              Download JSON
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setPublishModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleCopyPublishCli}
              className="gap-1.5 px-4 font-medium shadow-md shadow-primary/20"
            >
              {copiedPublishCli ? (
                <Check className="size-3.5 text-emerald-400" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              {copiedPublishCli ? "Copied Command!" : "Copy Publish Command"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
