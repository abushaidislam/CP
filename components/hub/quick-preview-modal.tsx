"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useStudioStore, PreviewTheme, StudioFileName } from "@/lib/store/studio-store";
import { DEFAULT_TEMPLATES } from "@/lib/sandbox/default-templates";
import { compileSandboxHtml } from "@/lib/sandbox/sandbox-compiler";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Sun,
  Moon,
  Eye,
  Code2,
  History,
} from "lucide-react";

export interface QuickPreviewModalProps {
  onOpenStudio?: (componentId: string) => void;
  defaultTab?: "preview" | "code" | "history";
  defaultCodeFile?: StudioFileName;
}

function formatDate(timestamp?: number | string): string {
  if (!timestamp) return "Recently";
  const num = typeof timestamp === "string" ? Number(timestamp) : timestamp;
  const date = !isNaN(num) && num > 0 ? new Date(num) : new Date(timestamp);
  if (isNaN(date.getTime())) return typeof timestamp === "string" ? timestamp : "Recently";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function QuickPreviewModal({
  onOpenStudio,
  defaultTab = "preview",
  defaultCodeFile = "component.tsx",
}: QuickPreviewModalProps) {
  const {
    quickPreviewComponentId,
    setQuickPreviewComponentId,
    userComponents,
    variantsByTemplate,
    activeVariantByTemplate,
    loadComponent,
    previewTheme: globalPreviewTheme,
  } = useStudioStore();

  const [activeTab, setActiveTab] = useState<"preview" | "code" | "history">(defaultTab);
  const [selectedCodeFile, setSelectedCodeFile] = useState<StudioFileName>(defaultCodeFile);
  const [previewTheme, setPreviewTheme] = useState<PreviewTheme>(globalPreviewTheme || "dark");
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedCli, setCopiedCli] = useState<boolean>(false);

  // Sync props when changed
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    setSelectedCodeFile(defaultCodeFile);
  }, [defaultCodeFile]);

  // Resolve component from userComponents or default templates
  const component = useMemo(() => {
    if (!quickPreviewComponentId) return null;
    return (
      userComponents[quickPreviewComponentId] ||
      DEFAULT_TEMPLATES.find((t) => t.id === quickPreviewComponentId) ||
      null
    );
  }, [quickPreviewComponentId, userComponents]);

  // Handle open in studio navigation
  const handleOpenStudio = () => {
    if (!component) return;
    loadComponent(component.id);
    setQuickPreviewComponentId(null);
    if (onOpenStudio) {
      onOpenStudio(component.id);
    }
  };

  // Safe clipboard helper
  const copyText = async (text: string): Promise<boolean> => {
    try {
      if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fallback or ignore
    }
    return false;
  };

  const handleCopyCode = async () => {
    if (!component) return;
    const code = component.files[selectedCodeFile] || "";
    await copyText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyCli = async () => {
    if (!component) return;
    const cli = `npx shadcn@latest add ${component.id}`;
    await copyText(cli);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  // Compile preview HTML
  const { compiledHtml, compileError } = useMemo(() => {
    if (!component) return { compiledHtml: "", compileError: null };
    try {
      const res = compileSandboxHtml(
        component.files["component.tsx"] || "",
        component.files["demo.tsx"] || "",
        component.files["index.css"] || "",
        component.dependencies || [],
        previewTheme === "dark" ? "dark" : "light",
        previewTheme
      );
      return { compiledHtml: res.html, compileError: res.error };
    } catch (err) {
      return {
        compiledHtml: "",
        compileError: err instanceof Error ? err.message : String(err),
      };
    }
  }, [component, previewTheme, reloadKey]);

  // Active code lines for Code tab
  const activeCodeContent = component?.files?.[selectedCodeFile] || "";
  const codeLines = useMemo(() => {
    return activeCodeContent.split("\n");
  }, [activeCodeContent]);

  // History variants and checkpoints
  const componentVariants = useMemo(() => {
    if (!component) return [];
    return variantsByTemplate?.[component.id] || [];
  }, [component, variantsByTemplate]);

  const totalCheckpoints = useMemo(() => {
    return componentVariants.reduce(
      (acc, v) => acc + (v.checkpoints?.length || 0),
      0
    );
  }, [componentVariants]);

  const isOpen = Boolean(quickPreviewComponentId && component);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setQuickPreviewComponentId(null);
    }
  };

  if (!isOpen || !component) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-5xl max-h-[90vh] overflow-y-auto overflow-x-hidden flex flex-col font-sans p-6 gap-4">
        {/* Header */}
        <DialogHeader className="gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="eyebrow">21ST QUICK PREVIEW</Badge>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <DialogTitle className="font-sans font-semibold text-lg tracking-tight text-foreground">
                  {component.name}
                </DialogTitle>
                <Badge variant="secondary" className="font-sans text-xs">
                  {component.category || "Custom"}
                </Badge>
              </div>
              <DialogDescription className="font-sans text-xs text-muted-foreground">
                {`Updated ${formatDate(component.updatedAt)}`}
              </DialogDescription>
            </div>
            <Button
              className="gap-2 font-sans self-start sm:self-auto shrink-0"
              size="sm"
              onClick={handleOpenStudio}
            >
              <ExternalLink className="size-3.5" />
              <span>Open in Studio</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Tabbed Content */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "preview" | "code" | "history")}
          className="flex flex-col gap-4 w-full"
        >
          <TabsList className="font-sans w-fit">
            <TabsTrigger value="preview" className="gap-1.5 font-sans text-xs">
              <Eye className="size-3.5" />
              <span>Preview</span>
            </TabsTrigger>
            <TabsTrigger value="code" className="gap-1.5 font-sans text-xs">
              <Code2 className="size-3.5" />
              <span>Code</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5 font-sans text-xs">
              <History className="size-3.5" />
              <span>History</span>
            </TabsTrigger>
          </TabsList>

          {/* Preview Tab */}
          <TabsContent value="preview" className="flex flex-col gap-3 m-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 font-sans h-8 text-xs"
                  onClick={() => setPreviewTheme(previewTheme === "dark" ? "light" : "dark")}
                >
                  {previewTheme === "dark" ? (
                    <Sun className="size-3.5" />
                  ) : (
                    <Moon className="size-3.5" />
                  )}
                  <span>{previewTheme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 font-sans h-8 text-xs"
                  onClick={() => setReloadKey((k) => k + 1)}
                >
                  <RotateCcw className="size-3.5" />
                  <span>Reset Preview</span>
                </Button>
              </div>
              {component.description && (
                <p className="font-sans text-xs text-muted-foreground truncate max-w-md">
                  {component.description}
                </p>
              )}
            </div>

            {compileError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-sans">
                Preview compilation error: {compileError}
              </div>
            )}

            <div className="w-full h-[450px] rounded-lg border border-border bg-background overflow-hidden relative shadow-inner">
              <iframe
                key={`${component.id}-${reloadKey}-${previewTheme}`}
                title={`${component.name} Preview`}
                srcDoc={compiledHtml}
                sandbox="allow-scripts allow-same-origin allow-modals"
                className="w-full h-full border-0"
              />
            </div>
          </TabsContent>

          {/* Code Tab */}
          <TabsContent value="code" className="flex flex-col gap-3 m-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Tabs
                value={selectedCodeFile}
                onValueChange={(val) => setSelectedCodeFile(val as StudioFileName)}
                className="w-auto"
              >
                <TabsList className="font-sans h-8">
                  <TabsTrigger value="component.tsx" className="font-sans text-xs">
                    component.tsx
                  </TabsTrigger>
                  <TabsTrigger value="demo.tsx" className="font-sans text-xs">
                    demo.tsx
                  </TabsTrigger>
                  <TabsTrigger value="index.css" className="font-sans text-xs">
                    index.css
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 font-sans text-xs h-8"
                onClick={handleCopyCode}
              >
                {copiedCode ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                <span>{copiedCode ? "Copied" : "Copy Code"}</span>
              </Button>
            </div>

            {/* CLI Command Block */}
            <div className="flex items-center justify-between bg-muted/60 px-3 py-2 rounded-md font-mono text-xs border border-border/50">
              <span className="truncate select-all">{`npx shadcn@latest add ${component.id}`}</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
                aria-label="Copy CLI command"
                onClick={handleCopyCli}
              >
                {copiedCli ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </Button>
            </div>

            {/* Code Viewer */}
            <div className="relative rounded-lg border border-border bg-muted/30 overflow-hidden">
              <div className="max-h-[380px] overflow-auto p-4">
                <pre className="font-mono text-xs leading-relaxed">
                  <code>
                    {codeLines.map((line, idx) => (
                      <div key={idx} className="flex">
                        <span className="w-8 shrink-0 select-none pr-3 text-right text-muted-foreground/40 text-[11px] font-mono">
                          {idx + 1}
                        </span>
                        <span className="font-mono whitespace-pre text-foreground flex-1">
                          {line || " "}
                        </span>
                      </div>
                    ))}
                  </code>
                </pre>
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="flex flex-col gap-3 m-0">
            {componentVariants.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-lg bg-muted/20">
                <History className="size-8 text-muted-foreground/60 mb-2" />
                <h4 className="font-sans font-medium text-sm text-foreground">
                  No History Recorded
                </h4>
                <p className="font-sans text-xs text-muted-foreground mt-1 max-w-sm">
                  No checkpoints or variants have been saved for this component yet. Open it in
                  Studio to save version snapshots.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-border text-xs text-muted-foreground font-sans">
                  <span>
                    {`${componentVariants.length} ${componentVariants.length === 1 ? "Variant" : "Variants"} • ${totalCheckpoints} ${totalCheckpoints === 1 ? "Checkpoint" : "Checkpoints"} saved`}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {componentVariants.map((variant, idx) => {
                    const isActive = activeVariantByTemplate?.[component.id]
                      ? variant.id === activeVariantByTemplate[component.id]
                      : idx === 0;
                    return (
                      <div
                        key={variant.id}
                        className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="font-sans font-semibold text-sm text-foreground">
                              {variant.name}
                            </h4>
                            {isActive && (
                              <Badge variant="secondary" className="font-sans text-[10px]">
                                Active
                              </Badge>
                            )}
                          </div>
                          <Badge variant="outline" className="font-sans text-xs">
                            {`${variant.checkpoints?.length || 0} ${variant.checkpoints?.length === 1 ? "checkpoint" : "checkpoints"}`}
                          </Badge>
                        </div>
                        <span className="font-sans text-xs text-muted-foreground">
                          {`Created ${formatDate(variant.createdAt)}`}
                        </span>
                        {variant.checkpoints && variant.checkpoints.length > 0 && (
                          <div className="flex flex-col gap-2 mt-1 border-t border-border/50 pt-3">
                            <div className="text-[11px] font-sans font-medium uppercase tracking-wider text-muted-foreground">
                              Checkpoints
                            </div>
                            <div className="flex flex-col gap-2">
                              {variant.checkpoints.map((cp) => (
                                <div
                                  key={cp.id}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-xs gap-1 border border-border/40"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-sans font-medium text-foreground">
                                      {cp.name}
                                    </span>
                                    {cp.description && (
                                      <span className="font-sans text-muted-foreground text-[11px] truncate max-w-xs">
                                        {`— ${cp.description}`}
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-sans text-muted-foreground text-[11px]">
                                    {formatDate(cp.createdAt || cp.timestamp)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
