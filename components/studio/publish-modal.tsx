"use client";

import React, { useState, useMemo } from "react";
import confetti from "canvas-confetti";
import { useStudioStore } from "@/lib/store/studio-store";
import { parseComponentAST } from "@/lib/sandbox/ast-parser";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  UploadCloud,
  Check,
  Copy,
  Download,
  Code,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  FolderDown,
  FileCode2,
  ChevronDown,
  ChevronUp,
  Play,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function PublishModal() {
  const { files, isPublishModalOpen, setPublishModalOpen } = useStudioStore();

  const [cliFormat, setCliFormat] = useState<"oneline" | "powershell" | "bash">("oneline");
  const [pathStyle, setPathStyle] = useState<"folder" | "project">("folder");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [copiedPublishCli, setCopiedPublishCli] = useState(false);
  const [copiedSetupCli, setCopiedSetupCli] = useState(false);
  const [copiedComponentCode, setCopiedComponentCode] = useState(false);
  const [copiedDemoCode, setCopiedDemoCode] = useState(false);
  const [downloadedAll, setDownloadedAll] = useState(false);

  const [customTitle, setCustomTitle] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customTags, setCustomTags] = useState("");
  const [visibility, setVisibility] = useState<"published" | "private">("published");

  const ast = useMemo(() => {
    return parseComponentAST(
      files["component.tsx"],
      files["default.tsx"] || files["demo.tsx"] || "",
      files["index.css"]
    );
  }, [files]);

  const derivedSlug = useMemo(() => {
    const raw = customSlug || ast.componentName;
    return (
      raw
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/^-+|-+$/g, "") || "component"
    );
  }, [customSlug, ast.componentName]);

  const activeTitle = customTitle || ast.title || "Custom Component";
  const activeDesc =
    customDescription ||
    `A production-ready ${activeTitle} component authored in Component Studio with Tailwind CSS.`;

  const compFilename = `${derivedSlug}.tsx`;
  const demoFilename = `${derivedSlug}-demo.tsx`;

  const compPath = pathStyle === "folder" ? `./${compFilename}` : `./components/ui/${compFilename}`;
  const demoPath = pathStyle === "folder" ? `./${demoFilename}` : `./components/demo/${demoFilename}`;
  const demoContent = files["default.tsx"] || files["demo.tsx"] || "";
  const hasDemo = !!demoContent && demoContent.trim().length > 0;

  const publishCommand = useMemo(() => {
    const demoFlag = hasDemo ? ` --demo ${demoPath}` : "";
    const tagsFlag = customTags ? ` --tags "${customTags}"` : "";

    if (cliFormat === "powershell") {
      return `21st publish ${compPath}${hasDemo ? ` \`\n  --demo ${demoPath}` : ""} \`\n  --name "${activeTitle}" \`\n  --slug "${derivedSlug}" \`\n  --visibility ${visibility}${tagsFlag ? ` \`\n  ${tagsFlag}` : ""}`;
    }
    if (cliFormat === "bash") {
      return `21st publish ${compPath}${hasDemo ? ` \\\n  --demo ${demoPath}` : ""} \\\n  --name "${activeTitle}" \\\n  --slug "${derivedSlug}" \\\n  --visibility ${visibility}${tagsFlag ? ` \\\n  ${tagsFlag}` : ""}`;
    }
    return `21st publish ${compPath}${demoFlag} --name "${activeTitle}" --slug "${derivedSlug}" --visibility ${visibility}${tagsFlag}`;
  }, [compPath, demoPath, hasDemo, activeTitle, derivedSlug, visibility, customTags, cliFormat]);

  const handleCopyPublishCli = () => {
    navigator.clipboard.writeText(publishCommand);
    setCopiedPublishCli(true);
    setTimeout(() => setCopiedPublishCli(false), 2000);
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.65 },
    });
  };

  const handleCopySetupCli = () => {
    navigator.clipboard.writeText("npm i -g @21st-dev/cli && 21st login");
    setCopiedSetupCli(true);
    setTimeout(() => setCopiedSetupCli(false), 2000);
  };

  const handleCopyComponentCode = () => {
    navigator.clipboard.writeText(files["component.tsx"]);
    setCopiedComponentCode(true);
    setTimeout(() => setCopiedComponentCode(false), 2000);
  };

  const handleCopyDemoCode = () => {
    navigator.clipboard.writeText(demoContent);
    setCopiedDemoCode(true);
    setTimeout(() => setCopiedDemoCode(false), 2000);
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/typescript-jsx" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadComponent = () => {
    downloadFile(compFilename, files["component.tsx"]);
  };

  const handleDownloadDemo = () => {
    downloadFile(demoFilename, demoContent);
  };

  const handleDownloadAllFiles = () => {
    downloadFile(compFilename, files["component.tsx"]);
    if (hasDemo) {
      setTimeout(() => {
        downloadFile(demoFilename, files["demo.tsx"]);
      }, 200);
    }
    setDownloadedAll(true);
    setTimeout(() => setDownloadedAll(false), 2500);
    confetti({
      particleCount: 65,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  return (
    <Dialog open={isPublishModalOpen} onOpenChange={setPublishModalOpen}>
      <DialogContent className="max-w-3xl w-[calc(100vw-2rem)] max-h-[90vh] flex flex-col border border-border bg-card p-0 gap-0 rounded-none overflow-y-auto overflow-x-hidden font-sans">
        {/* Architectural Header Bar */}
        <DialogHeader className="studio-toolbar-surface border-b border-border px-6 py-4 pr-12 shrink-0">
          <div className="flex items-center gap-2">
            <Badge variant="eyebrow" className="rounded-none">
              CREATOR PIPELINE
            </Badge>
          </div>
          <div className="flex items-start gap-3 mt-1.5">
            <div className="flex size-9 items-center justify-center rounded-none border border-border bg-background text-foreground shrink-0 mt-0.5">
              <UploadCloud className="size-4" />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold tracking-tight text-foreground font-sans">
                <span>Publish to 21st.dev</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-sans">
                Export your tested component and publish directly to the 21st.dev creator community.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Workflow Body */}
        <div className="flex-1 px-6 py-5 space-y-4">
          {/* Component Identification Strip */}
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
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder={ast.title || "Interactive Button"}
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
                  onChange={(e) => setCustomSlug(e.target.value)}
                  placeholder={derivedSlug}
                  className="mt-1 h-8 text-xs rounded-none font-mono bg-card"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider font-sans">
                  Visibility
                </label>
                <div className="mt-1 grid grid-cols-2 gap-px bg-border border border-border h-8 font-sans">
                  <Button
                    variant={visibility === "published" ? "default" : "ghost"}
                    size="sm"
                    type="button"
                    onClick={() => setVisibility("published")}
                    className="rounded-none h-full text-[11px] font-sans px-1"
                  >
                    Public
                  </Button>
                  <Button
                    variant={visibility === "private" ? "default" : "ghost"}
                    size="sm"
                    type="button"
                    onClick={() => setVisibility("private")}
                    className="rounded-none h-full text-[11px] font-sans px-1"
                  >
                    Private
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 1: Download Component Files */}
          <div className="rounded-none border border-border bg-background p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-none bg-primary text-primary-foreground text-[10px] font-bold font-sans">
                  1
                </span>
                <span className="text-xs font-semibold text-foreground font-sans">
                  Download Component Files
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground font-sans">
                Auto-routed to your chosen folder
              </span>
            </div>

            <Button
              variant="default"
              size="lg"
              onClick={handleDownloadAllFiles}
              className="rounded-none w-full h-9 gap-2 text-xs font-medium font-sans cursor-pointer"
            >
              {downloadedAll ? (
                <>
                  <Check className="size-4 text-emerald-400" />
                  <span>Files Downloaded to your Folder!</span>
                </>
              ) : (
                <>
                  <FolderDown className="size-4" />
                  <span>Download Component & Demo Files (.tsx)</span>
                </>
              )}
            </Button>

            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between rounded-none border border-border bg-card px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <FileCode2 className="size-3.5 text-sky-500" />
                  <span className="font-mono text-xs text-foreground">{compFilename}</span>
                  <Badge variant="outline" className="rounded-none text-[9px] py-0 px-1 font-sans">
                    Main Component
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyComponentCode}
                    className="rounded-none h-6 gap-1 px-2 text-[11px] font-sans text-muted-foreground hover:text-foreground"
                  >
                    {copiedComponentCode ? (
                      <Check className="size-3 text-emerald-500" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    <span>{copiedComponentCode ? "Copied" : "Copy Code"}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadComponent}
                    className="rounded-none h-6 gap-1 px-2 text-[11px] font-sans"
                  >
                    <Download className="size-3" />
                    <span>Download</span>
                  </Button>
                </div>
              </div>

              {hasDemo && (
                <div className="flex items-center justify-between rounded-none border border-border bg-card px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Play className="size-3.5 text-violet-500" />
                    <span className="font-mono text-xs text-foreground">{demoFilename}</span>
                    <Badge variant="outline" className="rounded-none text-[9px] py-0 px-1 font-sans">
                      Interactive Showcase
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyDemoCode}
                      className="rounded-none h-6 gap-1 px-2 text-[11px] font-sans text-muted-foreground hover:text-foreground"
                    >
                      {copiedDemoCode ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                      <span>{copiedDemoCode ? "Copied" : "Copy Code"}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadDemo}
                      className="rounded-none h-6 gap-1 px-2 text-[11px] font-sans"
                    >
                      <Download className="size-3" />
                      <span>Download</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* STEP 2: Run Publish CLI */}
          <div className="rounded-none border border-border bg-background p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-none bg-primary text-primary-foreground text-[10px] font-bold font-sans">
                  2
                </span>
                <span className="text-xs font-semibold text-foreground font-sans">
                  Run 21st CLI in your Download Folder
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-none border border-border bg-card p-0.5 text-xs font-sans">
                  <Button
                    variant={pathStyle === "folder" ? "default" : "ghost"}
                    size="sm"
                    type="button"
                    onClick={() => setPathStyle("folder")}
                    className="rounded-none h-6 px-2 text-[10px] font-sans"
                  >
                    Folder Root
                  </Button>
                  <Button
                    variant={pathStyle === "project" ? "default" : "ghost"}
                    size="sm"
                    type="button"
                    onClick={() => setPathStyle("project")}
                    className="rounded-none h-6 px-2 text-[10px] font-sans"
                  >
                    Next.js Path
                  </Button>
                </div>

                <div className="inline-flex rounded-none border border-border bg-card p-0.5 text-xs font-sans">
                  <Button
                    variant={cliFormat === "oneline" ? "default" : "ghost"}
                    size="sm"
                    type="button"
                    onClick={() => setCliFormat("oneline")}
                    className="rounded-none h-6 px-2 text-[10px] font-sans"
                  >
                    One-Liner
                  </Button>
                  <Button
                    variant={cliFormat === "powershell" ? "default" : "ghost"}
                    size="sm"
                    type="button"
                    onClick={() => setCliFormat("powershell")}
                    className="rounded-none h-6 px-2 text-[10px] font-sans"
                  >
                    PowerShell
                  </Button>
                  <Button
                    variant={cliFormat === "bash" ? "default" : "ghost"}
                    size="sm"
                    type="button"
                    onClick={() => setCliFormat("bash")}
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
                onClick={handleCopyPublishCli}
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

            <div className="flex items-start gap-2 rounded-none bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-[11px] text-emerald-700 dark:text-emerald-300 font-sans">
              <Sparkles className="size-4 shrink-0 mt-0.5 text-emerald-500" />
              <div>
                <span className="font-semibold">Automatic Browser Review:</span> When you run this command in your folder, the 21st CLI will automatically upload the files, verify your account, and launch the preview in your browser ready to share!
              </div>
            </div>
          </div>

          {/* Quick CLI Setup Reminder */}
          <div className="rounded-none border border-border bg-background px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs font-sans">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary shrink-0" />
              <span className="text-[11px] text-muted-foreground font-sans">
                First time? Install CLI once:
              </span>
              <code className="rounded-none bg-card px-2 py-0.5 font-mono text-[11px] border border-border text-foreground">
                npm i -g @21st-dev/cli && 21st login
              </code>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopySetupCli}
              className="rounded-none h-6 text-[11px] gap-1 px-2 font-sans"
            >
              {copiedSetupCli ? (
                <Check className="size-3 text-emerald-500" />
              ) : (
                <Copy className="size-3" />
              )}
              <span>{copiedSetupCli ? "Copied" : "Copy Setup"}</span>
            </Button>
          </div>

          {/* Optional Collapsible: Advanced Metadata */}
          <div className="pt-0.5">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="rounded-none h-7 px-2 gap-1.5 text-[11px] text-muted-foreground hover:text-foreground font-sans"
            >
              {showAdvanced ? (
                <ChevronUp className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5" />
              )}
              <span>Advanced Registry Options (Tags & Description)</span>
            </Button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 rounded-none border border-border bg-background p-3.5 space-y-3 font-sans text-xs">
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider font-sans">
                        Description
                      </label>
                      <Input
                        type="text"
                        value={customDescription}
                        onChange={(e) => setCustomDescription(e.target.value)}
                        placeholder={activeDesc}
                        className="mt-1 h-8 text-xs rounded-none bg-card font-sans"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider font-sans">
                        Tags (comma separated)
                      </label>
                      <Input
                        type="text"
                        value={customTags}
                        onChange={(e) => setCustomTags(e.target.value)}
                        placeholder="button, animation, tailwind, ui"
                        className="mt-1 h-8 text-xs rounded-none font-mono bg-card"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sticky Architectural Footer */}
        <DialogFooter className="studio-toolbar-surface sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-2 border-t border-border px-6 py-3.5 bg-card/95 backdrop-blur-xs font-sans">
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyComponentCode}
              className="rounded-none h-8 gap-1.5 text-xs font-sans"
            >
              {copiedComponentCode ? (
                <Check className="size-3 text-emerald-500" />
              ) : (
                <Code className="size-3 text-primary" />
              )}
              <span>Copy Component TSX</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              asChild
              className="rounded-none h-8 gap-1.5 text-xs font-sans text-muted-foreground hover:text-foreground"
            >
              <a href="https://21st.dev" target="_blank" rel="noreferrer">
                <span>Visit 21st.dev</span>
                <ExternalLink className="size-3" />
              </a>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPublishModalOpen(false)}
              className="rounded-none h-8 px-3.5 text-xs font-sans"
            >
              Close
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleCopyPublishCli}
              className="rounded-none h-8 gap-1.5 px-4 font-medium text-xs font-sans"
            >
              {copiedPublishCli ? (
                <Check className="size-3.5 text-emerald-400" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              <span>{copiedPublishCli ? "Command Copied!" : "Copy Publish Command"}</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
