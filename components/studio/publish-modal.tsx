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
} from "lucide-react";

export function PublishModal() {
  const {
    files,
    dependencies,
    isPublishModalOpen,
    setPublishModalOpen,
  } = useStudioStore();

  const [activeTab, setActiveTab] = useState<"payload" | "ast" | "cli">("payload");
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);

  // Metadata overrides state
  const [authorName, setAuthorName] = useState("Vercel Component Studio");
  const [customTitle, setCustomTitle] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [customDescription, setCustomDescription] = useState("");

  // Parse AST
  const ast = useMemo(() => {
    return parseComponentAST(
      files["component.tsx"],
      files["demo.tsx"],
      files["index.css"]
    );
  }, [files]);

  // Generate 21st.dev payload merging store dependencies and code imports
  const payload: TwentyFirstPublishPayload = useMemo(() => {
    return generateTwentyFirstPayload(
      files["component.tsx"],
      files["demo.tsx"],
      files["index.css"],
      {
        name: customSlug ? customSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-") : undefined,
        title: customTitle || ast.title,
        description: customDescription || ast.description,
        author: authorName,
        dependencies: Array.from(new Set([...ast.dependencies, ...dependencies])),
      }
    );
  }, [files, ast, customSlug, customTitle, customDescription, authorName, dependencies]);

  const jsonString = useMemo(() => {
    return JSON.stringify(payload, null, 2);
  }, [payload]);

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(jsonString);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(files["component.tsx"]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyCli = () => {
    navigator.clipboard.writeText(payload.cliCommand);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

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

  return (
    <Dialog open={isPublishModalOpen} onOpenChange={setPublishModalOpen}>
      <DialogContent className="max-w-3xl border-border bg-background p-6 shadow-xl rounded-xl">
        <DialogHeader className="pr-8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs shrink-0">
              <UploadCloud className="size-4" />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
                <span>Publish Package Generator</span>
                <Badge variant="blue">21st.dev Schema</Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Auto-extracted AST metadata, typed props table, and registry package payload ready for 21st.dev publishing.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Component Metadata & Customization Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-xl border border-border bg-muted/30 p-3 text-xs shadow-xs min-w-0 w-full overflow-hidden">
          <div className="min-w-0">
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Component Slug
            </label>
            <div className="mt-1 flex items-center gap-1.5 min-w-0">
              <Box className="size-3.5 text-primary shrink-0" />
              <Input
                type="text"
                value={customSlug || payload.name}
                onChange={(e) => setCustomSlug(e.target.value)}
                placeholder={payload.name}
                className="h-7 text-xs font-mono w-full min-w-0"
              />
            </div>
          </div>

          <div className="min-w-0">
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Author
            </label>
            <Input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="mt-1 h-7 text-xs w-full min-w-0"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Dependencies ({payload.dependencies.length})
              </label>
            </div>
            <div className="mt-1 flex flex-wrap gap-1 max-h-16 overflow-y-auto pr-0.5">
              {payload.dependencies.length > 0 ? (
                payload.dependencies.map((d) => (
                  <Badge
                    key={d}
                    variant="outline"
                    className="font-mono text-[10px]"
                  >
                    {d}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground text-xs">Zero external dependencies</span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs: Payload vs AST vs CLI */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full min-w-0">
          <TabsList className="grid grid-cols-3 w-full h-8 bg-muted/70 p-0.5">
            <TabsTrigger
              value="payload"
              className="gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
            >
              <FileJson className="size-3.5" />
              <span>Registry JSON</span>
            </TabsTrigger>
            <TabsTrigger
              value="ast"
              className="gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
            >
              <Code className="size-3.5" />
              <span>Parsed Props ({ast.props.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="cli"
              className="gap-1.5 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
            >
              <Terminal className="size-3.5" />
              <span>CLI Command</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: JSON Payload Preview */}
          <TabsContent value="payload" className="flex flex-col gap-2 mt-3 min-w-0 w-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Registry Component Payload
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
            <div className="relative max-h-60 w-full min-w-0 overflow-auto rounded-xl border border-border bg-muted/40 p-4 font-mono text-xs leading-relaxed text-foreground">
              <pre className="whitespace-pre-wrap break-all font-mono text-xs">{jsonString}</pre>
            </div>
          </TabsContent>

          {/* TAB 2: AST & Props Table */}
          <TabsContent value="ast" className="flex flex-col gap-3 mt-3">
            <div className="max-h-64 overflow-y-auto rounded-xl border border-border bg-muted/40 p-3">
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

          {/* TAB 3: CLI Add Command */}
          <TabsContent value="cli" className="flex flex-col gap-3 mt-3 min-w-0 w-full">
            <div className="rounded-xl border border-border bg-muted/40 p-4 font-mono text-xs min-w-0 w-full overflow-hidden">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                Install directly via 21st CLI
              </div>
              <div className="flex items-center justify-between rounded-lg bg-background px-3.5 py-2.5 text-foreground border border-border shadow-xs min-w-0">
                <span className="truncate mr-2">{payload.cliCommand}</span>
                <Button variant="ghost" size="sm" onClick={handleCopyCli} className="shrink-0">
                  {copiedCli ? (
                    <Check className="size-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="size-3.5 text-muted-foreground" />
                  )}
                </Button>
              </div>

              <div className="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                Or add via shadcn CLI
              </div>
              <div className="flex items-center justify-between rounded-lg bg-background px-3.5 py-2.5 text-foreground border border-border shadow-xs min-w-0 overflow-x-auto">
                <span className="truncate">npx shadcn@latest add https://21st.dev/r/{payload.name}.json</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyCode}>
              {copiedCode ? (
                <Check className="size-3.5 text-emerald-500 mr-1" />
              ) : (
                <Code className="size-3.5 mr-1 text-primary" />
              )}
              Copy TSX
            </Button>

            <Button variant="outline" size="sm" onClick={handleDownloadJson}>
              <Download className="size-3.5 mr-1" />
              Download JSON
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setPublishModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="default"
              onClick={handleCopyPayload}
              className="gap-1.5 px-4 h-8 text-xs font-medium"
            >
              {copiedPayload ? (
                <Check className="size-3.5 text-emerald-400" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              {copiedPayload ? "Copied Payload!" : "Copy Publish Payload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
