"use client";

import React, { useState, useMemo, useEffect } from "react";
import confetti from "canvas-confetti";
import { useShallow } from "zustand/react/shallow";
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
import {
  GitCommit,
  GitBranch,
  FolderGit2,
  Loader2,
  Layers,
  ExternalLink,
  Check,
  RefreshCw,
  UploadCloud,
  Sparkles,
  Code,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RepoSyncTab,
  type RepoSyncActionResult,
} from "./repo-sync/repo-sync-tab";
import { PublishExportTab } from "./repo-sync/publish-export-tab";

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
    importWorkspaceBundle,
  } = useStudioStore(
    useShallow((state) => ({
      files: state.files,
      dependencies: state.dependencies,
      currentTemplateId: state.currentTemplateId,
      userComponents: state.userComponents,
      isRepoSyncModalOpen: state.isRepoSyncModalOpen,
      isPublishModalOpen: state.isPublishModalOpen,
      setRepoSyncModalOpen: state.setRepoSyncModalOpen,
      repoSyncStatus: state.repoSyncStatus,
      autoSaveToRepo: state.autoSaveToRepo,
      setAutoSaveToRepo: state.setAutoSaveToRepo,
      lastRepoSyncError: state.lastRepoSyncError,
      repoGitInfo: state.repoGitInfo,
      githubRepoConfig: state.githubRepoConfig,
      setGithubRepoConfig: state.setGithubRepoConfig,
      saveComponentToProjectRepo: state.saveComponentToProjectRepo,
      syncAllComponentsToProjectRepo: state.syncAllComponentsToProjectRepo,
      hydrateFromProjectRepo: state.hydrateFromProjectRepo,
      importWorkspaceBundle: state.importWorkspaceBundle,
    }))
  );

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
  const [actionResult, setActionResult] = useState<RepoSyncActionResult | null>(
    null
  );
  const [bundleStatusMsg, setBundleStatusMsg] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      hydrateFromProjectRepo();
      setActionResult(null);
    }
  }, [isOpen, hydrateFromProjectRepo]);

  useEffect(() => {
    if (lastRepoSyncError && /github/i.test(lastRepoSyncError)) {
      setShowAdvancedGit(true);
      setPushToGithub(true);
    }
  }, [lastRepoSyncError]);

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

  const escapeCliArg = (val: string) =>
    val.replace(/[\r\n]/g, " ").replace(/(["`$\\])/g, "\\$1");

  const publishCommand = useMemo(() => {
    const safeName = escapeCliArg(activeName);
    const safeSlug = escapeCliArg(derivedSlug);
    const safeTags = customTags ? escapeCliArg(customTags) : "";
    const demoFlag = hasDemo ? ` --demo ${demoPath}` : "";
    const tagsFlag = safeTags ? ` --tags "${safeTags}"` : "";

    if (cliFormat === "powershell") {
      return `21st publish ${compPath}${hasDemo ? ` \`\n  --demo ${demoPath}` : ""} \`\n  --name "${safeName}" \`\n  --slug "${safeSlug}" \`\n  --visibility ${visibility}${tagsFlag ? ` \`\n  ${tagsFlag}` : ""}`;
    }
    if (cliFormat === "bash") {
      return `21st publish ${compPath}${hasDemo ? ` \\\n  --demo ${demoPath}` : ""} \\\n  --name "${safeName}" \\\n  --slug "${safeSlug}" \\\n  --visibility ${visibility}${tagsFlag ? ` \\\n  ${tagsFlag}` : ""}`;
    }
    return `21st publish ${compPath}${demoFlag} --name "${safeName}" --slug "${safeSlug}" --visibility ${visibility}${tagsFlag}`;
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
    confetti({ particleCount: 55, spread: 60, origin: { y: 0.65 } });
  };

  const handleCopyPublishCli = () => {
    navigator.clipboard?.writeText(publishCommand);
    setCopiedPublishCli(true);
    setTimeout(() => setCopiedPublishCli(false), 2000);
    confetti({ particleCount: 55, spread: 60, origin: { y: 0.65 } });
  };

  const handleCopySetupCli = () => {
    navigator.clipboard?.writeText("npm i -g @21st-dev/cli && 21st login");
    setCopiedSetupCli(true);
    setTimeout(() => setCopiedSetupCli(false), 2000);
  };

  const handleExportWorkspaceJson = () => {
    // Export strictly sanitized component & variant data — never dump raw localStorage or credentials
    const storeState = useStudioStore.getState();
    const payload = JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        state: {
          userComponents: storeState.userComponents || {},
          variantsByTemplate: storeState.variantsByTemplate || {},
          activeVariantByTemplate: storeState.activeVariantByTemplate || {},
        },
      },
      null,
      2
    );
    const blob = new Blob([payload], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `component-studio-backup-${allComponentsCount}-components.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setBundleStatusMsg(
      `Exported all ${allComponentsCount} components to sanitized backup .json`
    );
    setTimeout(() => setBundleStatusMsg(null), 3500);
  };

  const handleImportWorkspaceJsonFile = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === "string" ? reader.result : "";
      const res = importWorkspaceBundle(content);
      if (res.success) {
        setBundleStatusMsg(
          `Imported ${res.importedCount} components! Click 'Sync All to Repo' below to save them to GitHub.`
        );
        confetti({ particleCount: 55, spread: 60, origin: { y: 0.65 } });
      } else {
        setBundleStatusMsg(res.error || "Failed to import JSON backup.");
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
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
      confetti({ particleCount: 55, spread: 60, origin: { y: 0.65 } });
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
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.65 } });
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
          <TabsContent value="repo" className="flex-1 px-6 py-4 m-0">
            <RepoSyncTab
              activeName={activeName}
              derivedSlug={derivedSlug}
              targetDir={targetDir}
              savedRepoCount={savedRepoCount}
              allComponentsCount={allComponentsCount}
              autoSaveToRepo={autoSaveToRepo}
              onAutoSaveChange={setAutoSaveToRepo}
              compCode={compCode}
              demoCode={demoCode}
              cssCode={cssCode}
              compLines={compLines}
              demoLines={demoLines}
              cssLines={cssLines}
              dependenciesCount={dependencies.length}
              copiedFileKey={copiedFileKey}
              downloadedAll={downloadedAll}
              onCopyFile={handleCopyFile}
              onDownloadFile={handleDownloadFile}
              onDownloadAllFiles={handleDownloadAllFiles}
              fileInputRef={fileInputRef}
              onImportWorkspaceJsonFile={handleImportWorkspaceJsonFile}
              onExportWorkspaceJson={handleExportWorkspaceJson}
              bundleStatusMsg={bundleStatusMsg}
              showAdvancedGit={showAdvancedGit}
              onToggleAdvancedGit={() => setShowAdvancedGit((p) => !p)}
              commitMessage={commitMessage}
              onCommitMessageChange={setCommitMessage}
              defaultCommitMsg={defaultCommitMsg}
              pushToGithub={pushToGithub}
              onPushToGithubChange={setPushToGithub}
              githubRepoConfig={githubRepoConfig}
              onGithubRepoConfigChange={setGithubRepoConfig}
              repoGitInfo={repoGitInfo}
              lastRepoSyncError={lastRepoSyncError}
              actionResult={actionResult}
            />
          </TabsContent>

          {/* TAB 2: CLI Publish & Metadata */}
          <TabsContent value="publish" className="flex-1 px-6 py-4 m-0">
            <PublishExportTab
              activeName={activeName}
              derivedSlug={derivedSlug}
              defaultDescription={activeComponent?.description}
              customTitle={customTitle}
              onCustomTitleChange={setCustomTitle}
              customSlug={customSlug}
              onCustomSlugChange={setCustomSlug}
              customDescription={customDescription}
              onCustomDescriptionChange={setCustomDescription}
              customTags={customTags}
              onCustomTagsChange={setCustomTags}
              visibility={visibility}
              onVisibilityChange={setVisibility}
              pathStyle={pathStyle}
              onPathStyleChange={setPathStyle}
              cliFormat={cliFormat}
              onCliFormatChange={setCliFormat}
              publishCommand={publishCommand}
              copiedPublishCli={copiedPublishCli}
              onCopyPublishCli={handleCopyPublishCli}
              copiedSetupCli={copiedSetupCli}
              onCopySetupCli={handleCopySetupCli}
            />
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
