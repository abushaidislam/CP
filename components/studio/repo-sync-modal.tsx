"use client";

import React, { useState, useMemo, useEffect } from "react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  GitCommit,
  GitBranch,
  FolderGit2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCode2,
  FileJson,
  Layers,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Check,
  RefreshCw,
  Copy,
  Download,
  FolderDown,
  UploadCloud,
  Sparkles,
  ShieldCheck,
  Code,
} from "lucide-react";
import { cn } from "@/lib/utils";

function toCleanSlug(raw: string): string {
  return (
    raw
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "custom-component"
  );
}

export function RepoSyncModal() {
  const {
    files,
    dependencies,
    currentTemplateId,
    userComponents,
    isRepoSyncModalOpen,
    isPublishModalOpen,
    setRepoSyncModalOpen,
    repoSyncStatus,
    autoSaveToRepo,
    setAutoSaveToRepo,
    lastRepoSyncError,
    repoGitInfo,
    githubRepoConfig,
    setGithubRepoConfig,
    saveComponentToProjectRepo,
    syncAllComponentsToProjectRepo,
    hydrateFromProjectRepo,
  } = useStudioStore();

  const isOpen = Boolean(isRepoSyncModalOpen || isPublishModalOpen);

  const [activeTab, setActiveTab] = useState<"repo" | "publish">("repo");

  const activeComponent = userComponents?.[currentTemplateId];
  const allComponentsCount = Object.keys(userComponents || {}).length;
  const savedRepoCount = Object.values(userComponents || {}).filter(
    (c) => c.savedInRepo
  ).length;

  const ast = useMemo(() => {
    return parseComponentAST(
      files["component.tsx"] || "",
      files["default.tsx"] || files["demo.tsx"] || "",
      files["index.css"] || ""
    );
  }, [files]);

  // CLI Publish Tab state
  const [customTitle, setCustomTitle] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customTags, setCustomTags] = useState("");
  const [visibility, setVisibility] = useState<"published" | "private">(
    "published"
  );
  const [cliFormat, setCliFormat] = useState<"oneline" | "powershell" | "bash">(
    "oneline"
  );
  const [pathStyle, setPathStyle] = useState<"folder" | "project">("folder");
  const [copiedPublishCli, setCopiedPublishCli] = useState(false);
  const [copiedSetupCli, setCopiedSetupCli] = useState(false);
  const [downloadedAll, setDownloadedAll] = useState(false);

  const activeName =
    customTitle.trim() ||
    activeComponent?.name ||
    ast.title ||
    "Interactive Component";

  const derivedSlug = useMemo(() => {
    return toCleanSlug(
      customSlug.trim() ||
        activeComponent?.repoSlug ||
        (activeComponent?.isBuiltIn ? activeComponent.id : activeName)
    );
  }, [customSlug, activeComponent, activeName]);

  const defaultCommitMsg = `feat(registry): save ${activeName} (${derivedSlug}) to project repo`;
  const [commitMessage, setCommitMessage] = useState("");
  const [pushToGithub, setPushToGithub] = useState(false);
  const [showAdvancedGit, setShowAdvancedGit] = useState(false);
  const [copiedFileKey, setCopiedFileKey] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{
    type: "single" | "all";
    repoPath?: string;
    savedCount?: number;
    commitSha?: string;
    commitUrl?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      hydrateFromProjectRepo();
      setActionResult(null);
    }
  }, [isOpen, hydrateFromProjectRepo]);

  const compCode = files["component.tsx"] || "";
  const demoCode = files["default.tsx"] || files["demo.tsx"] || "";
  const cssCode =
    files["index.css"] ||
    "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n";

  const compLines = compCode.split("\n").length;
  const demoLines = demoCode.split("\n").length;
  const cssLines = cssCode.split("\n").length;

  const targetDir = `registry/components/${derivedSlug}`;

  const compFilename = `${derivedSlug}.tsx`;
  const demoFilename = `${derivedSlug}-demo.tsx`;
  const compPath =
    pathStyle === "folder"
      ? `./${compFilename}`
      : `./components/ui/${compFilename}`;
  const demoPath =
    pathStyle === "folder"
      ? `./${demoFilename}`
      : `./components/demo/${demoFilename}`;
  const hasDemo = demoCode.trim().length > 0;

  const publishCommand = useMemo(() => {
    const demoFlag = hasDemo ? ` --demo ${demoPath}` : "";
    const tagsFlag = customTags ? ` --tags "${customTags}"` : "";

    if (cliFormat === "powershell") {
      return `21st publish ${compPath}${hasDemo ? ` \`\n  --demo ${demoPath}` : ""} \`\n  --name "${activeName}" \`\n  --slug "${derivedSlug}" \`\n  --visibility ${visibility}${tagsFlag ? ` \`\n  ${tagsFlag}` : ""}`;
    }
    if (cliFormat === "bash") {
      return `21st publish ${compPath}${hasDemo ? ` \\\n  --demo ${demoPath}` : ""} \\\n  --name "${activeName}" \\\n  --slug "${derivedSlug}" \\\n  --visibility ${visibility}${tagsFlag ? ` \\\n  ${tagsFlag}` : ""}`;
    }
    return `21st publish ${compPath}${demoFlag} --name "${activeName}" --slug "${derivedSlug}" --visibility ${visibility}${tagsFlag}`;
  }, [
    compPath,
    demoPath,
    hasDemo,
    activeName,
    derivedSlug,
    visibility,
    customTags,
    cliFormat,
  ]);

  const handleCopyFile = (key: string, content: string) => {
    navigator.clipboard?.writeText(content);
    setCopiedFileKey(key);
    setTimeout(() => setCopiedFileKey(null), 1800);
  };

  const handleDownloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllFiles = () => {
    handleDownloadFile(compFilename, compCode);
    if (hasDemo) {
      setTimeout(() => {
        handleDownloadFile(demoFilename, demoCode);
      }, 180);
    }
    setDownloadedAll(true);
    setTimeout(() => setDownloadedAll(false), 2200);
    confetti({
      particleCount: 55,
      spread: 60,
      origin: { y: 0.65 },
    });
  };

  const handleCopyPublishCli = () => {
    navigator.clipboard?.writeText(publishCommand);
    setCopiedPublishCli(true);
    setTimeout(() => setCopiedPublishCli(false), 2000);
    confetti({
      particleCount: 55,
      spread: 60,
      origin: { y: 0.65 },
    });
  };

  const handleCopySetupCli = () => {
    navigator.clipboard?.writeText("npm i -g @21st-dev/cli && 21st login");
    setCopiedSetupCli(true);
    setTimeout(() => setCopiedSetupCli(false), 2000);
  };

  const handleSaveActiveToRepo = async () => {
    setActionResult(null);
    const res = await saveComponentToProjectRepo({
      componentId: currentTemplateId,
      commitMessage: commitMessage.trim() || defaultCommitMsg,
      pushToGithub,
    });
    if (res.success) {
      setActionResult({
        type: "single",
        repoPath: res.repoPath || targetDir,
        commitSha: res.commitSha,
        commitUrl: res.commitUrl,
      });
      setCommitMessage("");
      confetti({
        particleCount: 55,
        spread: 60,
        origin: { y: 0.65 },
      });
    }
  };

  const handleSyncAllToRepo = async () => {
    setActionResult(null);
    const res = await syncAllComponentsToProjectRepo({
      commitMessage:
        commitMessage.trim() ||
        `feat(registry): sync all ${allComponentsCount} workspace components to project repo`,
      pushToGithub,
    });
    if (res.success) {
      setActionResult({
        type: "all",
        savedCount: res.savedCount || allComponentsCount,
        commitSha: res.commitSha,
        commitUrl: res.commitUrl,
      });
      setCommitMessage("");
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.65 },
      });
    }
  };

  const isSyncing = repoSyncStatus === "syncing";

  return (
    <Dialog open={isOpen} onOpenChange={setRepoSyncModalOpen}>
      <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] max-h-[90vh] flex flex-col border border-border bg-card p-0 gap-0 rounded-none overflow-y-auto overflow-x-hidden font-sans">
        {/* Architectural Header Bar */}
        <DialogHeader className="studio-toolbar-surface border-b border-border px-6 py-4 pr-12 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="eyebrow" className="rounded-none font-mono">
              REPO STORAGE &amp; EXPORT PIPELINE
            </Badge>
            <div className="flex items-center gap-1.5">
              {repoGitInfo?.branch && (
                <Badge
                  variant="outline"
                  className="rounded-none text-[10px] py-0 px-1.5 font-mono text-muted-foreground border-border/80 bg-background gap-1"
                >
                  <GitBranch className="size-2.5 text-primary" />
                  <span>{repoGitInfo.branch}</span>
                </Badge>
              )}
              <Badge
                variant="secondary"
                className={cn(
                  "rounded-none text-[10px] py-0 px-1.5 font-sans font-medium",
                  activeComponent?.savedInRepo && repoSyncStatus !== "dirty"
                    ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                )}
              >
                {activeComponent?.savedInRepo && repoSyncStatus !== "dirty"
                  ? "Saved in Project Repo"
                  : "Unsaved Repo Changes"}
              </Badge>
            </div>
          </div>

          <div className="flex items-start gap-3 mt-1.5">
            <div className="flex size-9 items-center justify-center rounded-none border border-border bg-background text-foreground shrink-0 mt-0.5">
              <FolderGit2 className="size-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold tracking-tight text-foreground font-sans">
                <span>Save to Project Repo, Export &amp; Publish</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-sans">
                Sync directly with{" "}
                <span className="font-mono text-foreground">
                  registry/components/{derivedSlug}/
                </span>
                , download <span className="font-mono text-foreground">.tsx</span>{" "}
                files, or publish via CLI from one unified workspace dialog.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "repo" | "publish")}
          className="flex flex-1 flex-col"
        >
          {/* Mode Switcher Strip */}
          <div className="border-b border-border bg-background/60 px-6 py-2.5 flex items-center justify-between gap-3">
            <TabsList className="h-8 rounded-none border border-border bg-card p-0.5 font-sans">
              <TabsTrigger
                value="repo"
                className="rounded-none h-7 px-3 text-xs font-sans gap-1.5"
              >
                <FolderGit2 className="size-3.5 text-primary" />
                <span>Project Repo &amp; Export</span>
              </TabsTrigger>
              <TabsTrigger
                value="publish"
                className="rounded-none h-7 px-3 text-xs font-sans gap-1.5"
              >
                <UploadCloud className="size-3.5 text-sky-500" />
                <span>CLI Publish (21st.dev)</span>
              </TabsTrigger>
            </TabsList>

            <span className="hidden sm:inline font-mono text-[11px] text-muted-foreground truncate">
              {targetDir}/
            </span>
          </div>

          {/* TAB 1: Project Repo Storage & File Export */}
          <TabsContent value="repo" className="flex-1 px-6 py-4 space-y-4 m-0">
            {/* 1. Auto-Save Toggle & Library Status Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-none border border-border bg-background px-4 py-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground font-sans">
                    Auto-Save Edits to Project Repo
                  </span>
                  <Badge
                    variant="outline"
                    className="rounded-none text-[9px] py-0 px-1.5 font-sans text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
                  >
                    {savedRepoCount}/{allComponentsCount} synced in repo
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground font-sans">
                  Automatically writes your code and preview snapshot to{" "}
                  <span className="font-mono text-foreground/90">
                    {targetDir}/
                  </span>{" "}
                  as you work.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={autoSaveToRepo}
                  onCheckedChange={setAutoSaveToRepo}
                  aria-label="Toggle auto-save to project repository"
                />
              </div>
            </div>

            {/* 2. Target Project Repository File Structure + Quick Copy/Download */}
            <div className="rounded-none border border-border bg-background p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    REPO FILES &amp; QUICK EXPORT
                  </span>
                  <span className="text-border">/</span>
                  <span className="font-mono text-xs font-medium text-foreground">
                    {targetDir}/
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadAllFiles}
                  className="rounded-none h-7 px-2.5 gap-1.5 text-[11px] font-sans"
                >
                  {downloadedAll ? (
                    <>
                      <Check className="size-3 text-emerald-500" />
                      <span>Downloaded!</span>
                    </>
                  ) : (
                    <>
                      <FolderDown className="size-3 text-primary" />
                      <span>Download All (.tsx)</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* component.tsx */}
                <div className="flex items-center justify-between rounded-none border border-border/80 bg-card px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode2 className="size-3.5 text-sky-500 shrink-0" />
                    <span className="font-mono text-[11px] text-foreground truncate">
                      component.tsx
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                      ({compLines}L)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleCopyFile("component.tsx", compCode)}
                      aria-label="Copy component.tsx"
                      className="size-6 rounded-none text-muted-foreground hover:text-foreground"
                    >
                      {copiedFileKey === "component.tsx" ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        handleDownloadFile(`${derivedSlug}.tsx`, compCode)
                      }
                      aria-label="Download component.tsx"
                      className="size-6 rounded-none text-muted-foreground hover:text-foreground"
                    >
                      <Download className="size-3" />
                    </Button>
                  </div>
                </div>

                {/* default.tsx */}
                <div className="flex items-center justify-between rounded-none border border-border/80 bg-card px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode2 className="size-3.5 text-violet-500 shrink-0" />
                    <span className="font-mono text-[11px] text-foreground truncate">
                      default.tsx
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                      ({demoLines}L)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleCopyFile("default.tsx", demoCode)}
                      aria-label="Copy default.tsx"
                      className="size-6 rounded-none text-muted-foreground hover:text-foreground"
                    >
                      {copiedFileKey === "default.tsx" ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        handleDownloadFile(`${derivedSlug}-demo.tsx`, demoCode)
                      }
                      aria-label="Download default.tsx"
                      className="size-6 rounded-none text-muted-foreground hover:text-foreground"
                    >
                      <Download className="size-3" />
                    </Button>
                  </div>
                </div>

                {/* index.css */}
                <div className="flex items-center justify-between rounded-none border border-border/80 bg-card px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode2 className="size-3.5 text-emerald-500 shrink-0" />
                    <span className="font-mono text-[11px] text-foreground truncate">
                      index.css
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                      ({cssLines}L)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleCopyFile("index.css", cssCode)}
                      aria-label="Copy index.css"
                      className="size-6 rounded-none text-muted-foreground hover:text-foreground"
                    >
                      {copiedFileKey === "index.css" ? (
                        <Check className="size-3 text-emerald-500" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* manifest.json & preview.png */}
                <div className="flex items-center justify-between rounded-none border border-border/80 bg-card px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileJson className="size-3.5 text-amber-500 shrink-0" />
                    <span className="font-mono text-[11px] text-foreground truncate">
                      manifest.json + preview.png
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                    {dependencies.length} deps
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Optional Collapsible: Direct GitHub API Push */}
            <div className="rounded-none border border-border bg-background px-4 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground font-sans">
                  Optional: Custom Git Commit &amp; Direct Remote GitHub Push
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setShowAdvancedGit((p) => !p)}
                  className="h-6 px-2 text-[11px] font-sans text-muted-foreground hover:text-foreground rounded-none gap-1"
                >
                  <span>{showAdvancedGit ? "Hide Options" : "Configure"}</span>
                  {showAdvancedGit ? (
                    <ChevronUp className="size-3" />
                  ) : (
                    <ChevronDown className="size-3" />
                  )}
                </Button>
              </div>

              {showAdvancedGit && (
                <div className="mt-3 pt-3 border-t border-border/70 space-y-3">
                  <div>
                    <label
                      htmlFor="repo-sync-commit-message"
                      className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider font-sans"
                    >
                      Commit Message (Optional)
                    </label>
                    <Input
                      id="repo-sync-commit-message"
                      type="text"
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      placeholder={defaultCommitMsg}
                      className="mt-1 h-8 text-xs rounded-none bg-card font-sans"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-xs text-foreground font-sans">
                      Also push directly to a remote GitHub branch via REST API
                    </span>
                    <Switch
                      checked={pushToGithub}
                      onCheckedChange={setPushToGithub}
                      aria-label="Also push commit directly to remote GitHub API"
                    />
                  </div>

                  {pushToGithub && (
                    <div className="rounded-none border border-border/80 bg-card p-3 space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-muted-foreground font-sans">
                            Repository (owner/repo)
                          </label>
                          <Input
                            type="text"
                            value={githubRepoConfig.repo}
                            onChange={(e) =>
                              setGithubRepoConfig({ repo: e.target.value })
                            }
                            placeholder={
                              repoGitInfo?.envGithubRepo ||
                              "username/component-studio"
                            }
                            className="mt-0.5 h-7 text-xs rounded-none font-mono bg-background"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground font-sans">
                            Branch
                          </label>
                          <Input
                            type="text"
                            value={githubRepoConfig.branch}
                            onChange={(e) =>
                              setGithubRepoConfig({ branch: e.target.value })
                            }
                            placeholder={repoGitInfo?.envGithubBranch || "main"}
                            className="mt-0.5 h-7 text-xs rounded-none font-mono bg-background"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground font-sans">
                          GitHub Personal Access Token (repo scope)
                        </label>
                        <Input
                          type="password"
                          value={githubRepoConfig.token}
                          onChange={(e) =>
                            setGithubRepoConfig({ token: e.target.value })
                          }
                          placeholder={
                            repoGitInfo?.hasGithubToken
                              ? "Configured via server GITHUB_TOKEN"
                              : "ghp_xxxxxxxxxxxxxxxxxxxx"
                          }
                          className="mt-0.5 h-7 text-xs rounded-none font-mono bg-background"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. Live Status / Error / Success Banner */}
            {lastRepoSyncError && (
              <div className="flex items-start gap-2 rounded-none border border-rose-500/35 bg-rose-500/10 p-3 text-xs text-rose-500 font-sans">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">Repository Sync Error</div>
                  <div className="text-[11px] opacity-90 break-words mt-0.5">
                    {lastRepoSyncError}
                  </div>
                </div>
              </div>
            )}

            {actionResult && !lastRepoSyncError && (
              <div className="flex items-start justify-between gap-3 rounded-none border border-emerald-500/35 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-sans">
                <div className="flex items-start gap-2 min-w-0">
                  <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-500" />
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-semibold">
                      {actionResult.type === "single"
                        ? `Saved "${activeName}" into Project Repository!`
                        : `Synced all ${actionResult.savedCount} components into Project Repository!`}
                    </div>
                    <div className="text-[11px] opacity-90">
                      Written to{" "}
                      <span className="font-mono">
                        {actionResult.repoPath || "registry/components/"}
                      </span>{" "}
                      and indexed in{" "}
                      <span className="font-mono">registry/index.json</span>
                      {actionResult.commitSha
                        ? ` • Commit ${actionResult.commitSha}`
                        : ""}
                    </div>
                  </div>
                </div>

                {actionResult.commitUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="rounded-none h-7 px-2.5 text-[11px] font-sans shrink-0 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                  >
                    <a
                      href={actionResult.commitUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span>View on GitHub</span>
                      <ExternalLink className="size-3 ml-1" />
                    </a>
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          {/* TAB 2: CLI Publish & Metadata */}
          <TabsContent
            value="publish"
            className="flex-1 px-6 py-4 space-y-4 m-0"
          >
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
                    onChange={(e) => setCustomTitle(e.target.value)}
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
                    onChange={(e) => setCustomSlug(e.target.value)}
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
                      onClick={() => setVisibility("published")}
                      className="rounded-none h-full text-[11px] font-sans px-1"
                    >
                      Public
                    </Button>
                    <Button
                      variant={visibility === "private" ? "default" : "ghost"}
                      size="sm"
                      type="button"
                      aria-pressed={visibility === "private"}
                      onClick={() => setVisibility("private")}
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
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder={
                      activeComponent?.description ||
                      `Production-ready ${activeName} component`
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
                    onChange={(e) => setCustomTags(e.target.value)}
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
                      onClick={() => setPathStyle("folder")}
                      className="rounded-none h-6 px-2 text-[10px] font-sans"
                    >
                      Folder Root
                    </Button>
                    <Button
                      variant={pathStyle === "project" ? "default" : "ghost"}
                      size="sm"
                      type="button"
                      aria-pressed={pathStyle === "project"}
                      onClick={() => setPathStyle("project")}
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
                      onClick={() => setCliFormat("oneline")}
                      className="rounded-none h-6 px-2 text-[10px] font-sans"
                    >
                      One-Liner
                    </Button>
                    <Button
                      variant={cliFormat === "powershell" ? "default" : "ghost"}
                      size="sm"
                      type="button"
                      aria-pressed={cliFormat === "powershell"}
                      onClick={() => setCliFormat("powershell")}
                      className="rounded-none h-6 px-2 text-[10px] font-sans"
                    >
                      PowerShell
                    </Button>
                    <Button
                      variant={cliFormat === "bash" ? "default" : "ghost"}
                      size="sm"
                      type="button"
                      aria-pressed={cliFormat === "bash"}
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
                  onClick={handleCopySetupCli}
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
          </TabsContent>
        </Tabs>

        {/* Sticky Footer */}
        <DialogFooter className="studio-toolbar-surface sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-2 border-t border-border px-6 py-3.5 bg-card/95 backdrop-blur-xs font-sans">
          {activeTab === "repo" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={isSyncing}
                onClick={handleSyncAllToRepo}
                className="rounded-none h-8 gap-1.5 text-xs font-sans"
              >
                {isSyncing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Layers className="size-3.5 text-primary" />
                )}
                <span>Sync All ({allComponentsCount}) to Repo</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRepoSyncModalOpen(false)}
                  className="rounded-none h-8 px-3.5 text-xs font-sans"
                >
                  Close
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  disabled={isSyncing}
                  onClick={handleSaveActiveToRepo}
                  className="rounded-none h-8 gap-1.5 px-4 font-medium text-xs font-sans"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin" />
                      <span>Saving to Repo...</span>
                    </>
                  ) : actionResult?.type === "single" ? (
                    <>
                      <Check className="size-3.5 text-emerald-400" />
                      <span>Saved in Project Repo</span>
                    </>
                  ) : (
                    <>
                      <GitCommit className="size-3.5" />
                      <span>
                        {pushToGithub
                          ? "Save to Repo & Push to GitHub"
                          : "Save Active Component to Repo"}
                      </span>
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyFile("component.tsx", compCode)}
                  className="rounded-none h-8 gap-1.5 text-xs font-sans"
                >
                  {copiedFileKey === "component.tsx" ? (
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
                  onClick={() => setRepoSyncModalOpen(false)}
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
                  <span>
                    {copiedPublishCli
                      ? "Command Copied!"
                      : "Copy Publish Command"}
                  </span>
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
