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
  type BundleStatus,
  type RepoSyncActionResult,
} from "./repo-sync/repo-sync-tab";
import { PublishExportTab } from "./repo-sync/publish-export-tab";
import type { ComponentVariant, StudioFiles, UserComponent } from "@/lib/store/types";

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

function countLines(code: string): number {
  return code.length === 0 ? 0 : code.split("\n").length;
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
  const syncableComponentsCount = useMemo(
    () =>
      Object.values(userComponents || {}).filter(
        (c) =>
          c &&
          (c.id === currentTemplateId ||
            (c.filesLoaded !== false && Boolean(c.files?.["component.tsx"])))
      ).length,
    [userComponents, currentTemplateId]
  );

  const ast = useMemo(() => {
    return parseComponentAST(
      files["component.tsx"] || "",
      files["default.tsx"] || files["demo.tsx"] || "",
      files["index.css"] || ""
    );
  }, [files]);

  // CLI Publish Tab state (isolated from Project Repo target path)
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

  // Project Repo identity (authoritative, matches what saveComponentToProjectRepo writes)
  const repoComponentName =
    activeComponent?.name || ast.title || "Interactive Component";

  const repoSlug = useMemo(() => {
    return toCleanSlug(
      activeComponent?.repoSlug ||
        (activeComponent?.isBuiltIn ? activeComponent.id : repoComponentName)
    );
  }, [activeComponent, repoComponentName]);

  // CLI Publish identity (optional overrides scoped strictly to Tab 2 CLI command)
  const publishName = customTitle.trim() || repoComponentName;
  const publishSlug = useMemo(() => {
    return toCleanSlug(customSlug.trim() || repoSlug);
  }, [customSlug, repoSlug]);

  const defaultCommitMsg = `feat(registry): save ${repoComponentName} (${repoSlug}) to project repo`;
  const [commitMessage, setCommitMessage] = useState("");
  const [pushToGithub, setPushToGithub] = useState(false);
  const [showAdvancedGit, setShowAdvancedGit] = useState(false);
  const [copiedFileKey, setCopiedFileKey] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<RepoSyncActionResult | null>(
    null
  );
  const [isExportingBundle, setIsExportingBundle] = useState(false);
  const [bundleStatus, setBundleStatus] = useState<BundleStatus | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      hydrateFromProjectRepo();
      setActionResult(null);
    }
  }, [isOpen, hydrateFromProjectRepo]);

  // Reset per-component modal inputs whenever active component changes
  useEffect(() => {
    setCustomTitle("");
    setCustomSlug("");
    setCustomDescription("");
    setCustomTags("");
    setCommitMessage("");
    setActionResult(null);
    setBundleStatus(null);
  }, [currentTemplateId]);

  // Clear stale save banner/button state whenever the component becomes dirty again
  useEffect(() => {
    if (repoSyncStatus === "dirty") {
      setActionResult(null);
    }
  }, [repoSyncStatus]);

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

  const compLines = countLines(compCode);
  const demoLines = countLines(demoCode);
  const cssLines = countLines(cssCode);

  const repoTargetDir = `registry/components/${repoSlug}`;
  const repoCompFilename = `${repoSlug}.tsx`;
  const repoDemoFilename = `${repoSlug}-demo.tsx`;
  const repoCssFilename = `${repoSlug}.css`;

  const publishCompFilename = `${publishSlug}.tsx`;
  const publishDemoFilename = `${publishSlug}-demo.tsx`;
  const compPath =
    pathStyle === "folder"
      ? `./${publishCompFilename}`
      : `./components/ui/${publishCompFilename}`;
  const demoPath =
    pathStyle === "folder"
      ? `./${publishDemoFilename}`
      : `./components/demo/${publishDemoFilename}`;
  const hasDemo = demoCode.trim().length > 0;
  const hasCss = cssCode.trim().length > 0;

  const escapeCliArg = (val: string) =>
    val.replace(/[\r\n]/g, " ").replace(/(["`$\\])/g, "\\$1");

  const publishCommand = useMemo(() => {
    const safeName = escapeCliArg(publishName);
    const safeSlug = escapeCliArg(publishSlug);
    const safeDescription = customDescription.trim()
      ? escapeCliArg(customDescription.trim())
      : "";
    const safeTags = customTags.trim() ? escapeCliArg(customTags.trim()) : "";
    const demoFlag = hasDemo ? ` --demo ${demoPath}` : "";
    const descFlag = safeDescription ? ` --description "${safeDescription}"` : "";
    const tagsFlag = safeTags ? ` --tags "${safeTags}"` : "";

    if (cliFormat === "powershell") {
      return `21st publish ${compPath}${hasDemo ? ` \`\n  --demo ${demoPath}` : ""} \`\n  --name "${safeName}" \`\n  --slug "${safeSlug}" \`\n  --visibility ${visibility}${descFlag ? ` \`\n  ${descFlag.trim()}` : ""}${tagsFlag ? ` \`\n  ${tagsFlag.trim()}` : ""}`;
    }
    if (cliFormat === "bash") {
      return `21st publish ${compPath}${hasDemo ? ` \\\n  --demo ${demoPath}` : ""} \\\n  --name "${safeName}" \\\n  --slug "${safeSlug}" \\\n  --visibility ${visibility}${descFlag ? ` \\\n  ${descFlag.trim()}` : ""}${tagsFlag ? ` \\\n  ${tagsFlag.trim()}` : ""}`;
    }
    return `21st publish ${compPath}${demoFlag} --name "${safeName}" --slug "${safeSlug}" --visibility ${visibility}${descFlag}${tagsFlag}`;
  }, [
    compPath,
    demoPath,
    hasDemo,
    publishName,
    publishSlug,
    customDescription,
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
    const downloads: Array<{ filename: string; content: string }> = [
      { filename: repoCompFilename, content: compCode },
    ];
    if (hasDemo) {
      downloads.push({ filename: repoDemoFilename, content: demoCode });
    }
    if (hasCss) {
      downloads.push({ filename: repoCssFilename, content: cssCode });
    }
    downloads.forEach((item, index) => {
      if (index === 0) {
        handleDownloadFile(item.filename, item.content);
      } else {
        setTimeout(() => {
          handleDownloadFile(item.filename, item.content);
        }, index * 180);
      }
    });
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

  const handleExportWorkspaceJson = async () => {
    setIsExportingBundle(true);
    setBundleStatus(null);
    try {
      // Export strictly sanitized component & variant data — never dump raw localStorage or credentials
      const storeState = useStudioStore.getState();
      const exportComponents: Record<string, UserComponent> = {};
      const exportVariants: Record<string, ComponentVariant[]> = {
        ...(storeState.variantsByTemplate || {}),
      };
      const exportActiveVariants: Record<string, string> = {
        ...(storeState.activeVariantByTemplate || {}),
      };

      const localEntries = Object.entries(storeState.userComponents || {});
      const hasUnloadedSummary = localEntries.some(
        ([, comp]) =>
          comp &&
          (comp.filesLoaded === false || !comp.files?.["component.tsx"])
      );

      const serverFullMap = new Map<
        string,
        {
          manifest: {
            id: string;
            slug: string;
            name: string;
            description?: string;
            category?: string;
            isBuiltIn?: boolean;
            createdAt?: number;
            updatedAt?: number;
            lastRepoSyncAt?: number;
            dependencies?: string[];
            previewImage?: string;
            variants?: ComponentVariant[];
            activeVariantId?: string;
          };
          files: StudioFiles;
        }
      >();
      let fullFetchFailed = false;

      if (hasUnloadedSummary) {
        try {
          const res = await fetch("/api/repo-sync?mode=full", {
            method: "GET",
            credentials: "same-origin",
            headers: { Accept: "application/json" },
          });
          if (res.ok) {
            const data = (await res.json()) as {
              success?: boolean;
              components?: Array<{
                manifest: {
                  id: string;
                  slug: string;
                  name: string;
                  description?: string;
                  category?: string;
                  isBuiltIn?: boolean;
                  createdAt?: number;
                  updatedAt?: number;
                  lastRepoSyncAt?: number;
                  dependencies?: string[];
                  previewImage?: string;
                  variants?: ComponentVariant[];
                  activeVariantId?: string;
                };
                files: StudioFiles;
              }>;
            };
            if (data.success && Array.isArray(data.components)) {
              for (const item of data.components) {
                if (item?.manifest?.id) {
                  serverFullMap.set(item.manifest.id, item);
                }
              }
            } else {
              fullFetchFailed = true;
            }
          } else {
            fullFetchFailed = true;
          }
        } catch {
          fullFetchFailed = true;
        }
      }

      let skippedUnloadedCount = 0;

      for (const [id, comp] of localEntries) {
        if (!comp) continue;
        const isActive = id === storeState.currentTemplateId;
        const hasLocalSource =
          isActive ||
          (comp.filesLoaded !== false && Boolean(comp.files?.["component.tsx"]));

        if (hasLocalSource) {
          const resolvedFiles = isActive
            ? {
                ...storeState.files,
                "default.tsx":
                  storeState.files["default.tsx"] ??
                  storeState.files["demo.tsx"] ??
                  "",
                "demo.tsx":
                  storeState.files["demo.tsx"] ??
                  storeState.files["default.tsx"] ??
                  "",
              }
            : comp.files;
          if (!resolvedFiles?.["component.tsx"]) {
            skippedUnloadedCount++;
            continue;
          }
          exportComponents[id] = {
            ...comp,
            files: resolvedFiles,
            dependencies: isActive
              ? [...storeState.dependencies]
              : comp.dependencies || [],
            filesLoaded: true,
          };
          continue;
        }

        const serverEntry = serverFullMap.get(id);
        if (serverEntry?.files?.["component.tsx"]) {
          exportComponents[id] = {
            ...comp,
            files: serverEntry.files,
            dependencies:
              serverEntry.manifest.dependencies || comp.dependencies || [],
            filesLoaded: true,
          };
          if (
            Array.isArray(serverEntry.manifest.variants) &&
            serverEntry.manifest.variants.length > 0 &&
            !exportVariants[id]
          ) {
            exportVariants[id] = serverEntry.manifest.variants;
          }
          if (
            serverEntry.manifest.activeVariantId &&
            !exportActiveVariants[id]
          ) {
            exportActiveVariants[id] = serverEntry.manifest.activeVariantId;
          }
        } else {
          skippedUnloadedCount++;
        }
      }

      const exportedCount = Object.keys(exportComponents).length;
      if (exportedCount === 0) {
        setBundleStatus({
          type: "error",
          message:
            "Could not load source files for any component. Open a component or verify the server connection and try again.",
        });
        return;
      }

      const payload = JSON.stringify(
        {
          version: 1,
          exportedAt: new Date().toISOString(),
          state: {
            userComponents: exportComponents,
            variantsByTemplate: exportVariants,
            activeVariantByTemplate: exportActiveVariants,
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
      link.download = `component-studio-backup-${exportedCount}-components.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (skippedUnloadedCount > 0 || fullFetchFailed) {
        setBundleStatus({
          type: "error",
          message: `Exported ${exportedCount} complete components (${skippedUnloadedCount} unloaded summary entries skipped because full repo fetch failed).`,
        });
      } else {
        setBundleStatus({
          type: "success",
          message: `Exported all ${exportedCount} complete components to sanitized backup .json`,
        });
      }
    } finally {
      setIsExportingBundle(false);
    }
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
        setBundleStatus({
          type: "success",
          message: `Imported ${res.importedCount} component${
            res.importedCount === 1 ? "" : "s"
          }! Click 'Sync' below to save them to the repository.`,
        });
        confetti({ particleCount: 55, spread: 60, origin: { y: 0.65 } });
      } else {
        setBundleStatus({
          type: "error",
          message: res.error || "Failed to import JSON backup.",
        });
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleSaveActiveToRepo = async () => {
    setActionResult(null);
    const wasPushEnabled = pushToGithub;
    const res = await saveComponentToProjectRepo({
      componentId: currentTemplateId,
      commitMessage: commitMessage.trim() || defaultCommitMsg,
      pushToGithub: wasPushEnabled,
    });
    if (res.success) {
      setActionResult({
        type: "single",
        repoPath: res.repoPath || repoTargetDir,
        commitSha: res.commitSha,
        commitUrl: res.commitUrl,
        pushedToGithub: wasPushEnabled,
      });
      setCommitMessage("");
      confetti({ particleCount: 55, spread: 60, origin: { y: 0.65 } });
    }
  };

  const handleSyncAllToRepo = async () => {
    setActionResult(null);
    const wasPushEnabled = pushToGithub;
    const expectedCount = wasPushEnabled
      ? allComponentsCount
      : syncableComponentsCount;
    const res = await syncAllComponentsToProjectRepo({
      commitMessage:
        commitMessage.trim() ||
        `feat(registry): sync ${expectedCount} workspace component${
          expectedCount === 1 ? "" : "s"
        } to project repo`,
      pushToGithub: wasPushEnabled,
    });
    if (res.success) {
      setActionResult({
        type: "all",
        savedCount: res.savedCount ?? 0,
        commitSha: res.commitSha,
        commitUrl: res.commitUrl,
        pushedToGithub: wasPushEnabled,
      });
      setCommitMessage("");
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.65 } });
    }
  };

  const handleCommitMessageChange = (val: string) => {
    setCommitMessage(val);
    setActionResult(null);
  };

  const handlePushToGithubChange = (checked: boolean) => {
    setPushToGithub(checked);
    setActionResult(null);
  };

  const handleGithubRepoConfigChange = (
    config: Partial<{ repo: string; branch: string; token: string }>
  ) => {
    setGithubRepoConfig(config);
    setActionResult(null);
  };

  const isSyncing = repoSyncStatus === "syncing";
  const isActiveSavedInRepo =
    Boolean(activeComponent?.savedInRepo) && repoSyncStatus !== "dirty";

  const syncAllLabel = pushToGithub
    ? `Sync All (${allComponentsCount}) to GitHub`
    : syncableComponentsCount < allComponentsCount
    ? `Sync Loaded (${syncableComponentsCount}/${allComponentsCount})`
    : `Sync All (${allComponentsCount}) to Repo`;

  const tabBarPathLabel =
    activeTab === "repo" ? `${repoTargetDir}/` : compPath;

  return (
    <Dialog open={isOpen} onOpenChange={setRepoSyncModalOpen}>
      <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] max-h-[90vh] flex flex-col border border-border bg-card p-0 gap-0 rounded-none overflow-hidden font-sans">
        {/* Architectural Header Bar (Fixed) */}
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
                  isActiveSavedInRepo
                    ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                )}
              >
                {isActiveSavedInRepo
                  ? "Saved in Project Repo"
                  : "Unsaved Repo Changes"}
              </Badge>
            </div>
          </div>

          <div className="flex items-start gap-3 mt-1.5">
            <div className="flex size-9 items-center justify-center rounded-none border border-border bg-background text-foreground shrink-0 mt-0.5">
              <FolderGit2 className="size-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold tracking-tight text-foreground font-sans">
                <span>Save to Project Repo, Export &amp; Publish</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-sans">
                Sync directly with{" "}
                <span className="font-mono text-foreground break-all">
                  {repoTargetDir}/
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
          className="flex flex-1 min-h-0 flex-col overflow-hidden"
        >
          {/* Mode Switcher Strip (Fixed) */}
          <div className="shrink-0 border-b border-border bg-background/60 px-6 py-2.5 flex items-center justify-between gap-3">
            <TabsList className="h-8 rounded-none border border-border bg-card p-0.5 font-sans shrink-0">
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

            <span
              className="hidden sm:block min-w-0 flex-1 text-right font-mono text-[11px] text-muted-foreground truncate"
              title={tabBarPathLabel}
            >
              {tabBarPathLabel}
            </span>
          </div>

          {/* TAB 1: Project Repo Storage & File Export (Scrollable Body) */}
          <TabsContent
            value="repo"
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 py-4 m-0"
          >
            <RepoSyncTab
              activeName={repoComponentName}
              derivedSlug={repoSlug}
              targetDir={repoTargetDir}
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
              isExportingBundle={isExportingBundle}
              bundleStatus={bundleStatus}
              showAdvancedGit={showAdvancedGit}
              onToggleAdvancedGit={() => setShowAdvancedGit((p) => !p)}
              commitMessage={commitMessage}
              onCommitMessageChange={handleCommitMessageChange}
              defaultCommitMsg={defaultCommitMsg}
              pushToGithub={pushToGithub}
              onPushToGithubChange={handlePushToGithubChange}
              githubRepoConfig={githubRepoConfig}
              onGithubRepoConfigChange={handleGithubRepoConfigChange}
              repoGitInfo={repoGitInfo}
              lastRepoSyncError={lastRepoSyncError}
              actionResult={actionResult}
            />
          </TabsContent>

          {/* TAB 2: CLI Publish & Metadata (Scrollable Body) */}
          <TabsContent
            value="publish"
            className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 py-4 m-0"
          >
            <PublishExportTab
              activeName={publishName}
              derivedSlug={publishSlug}
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

        {/* Fixed Footer Bar */}
        <DialogFooter className="studio-toolbar-surface shrink-0 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between sm:space-x-0 gap-2 border-t border-border px-6 py-3.5 bg-card font-sans">
          {activeTab === "repo" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={isSyncing || syncableComponentsCount === 0}
                onClick={handleSyncAllToRepo}
                title={
                  pushToGithub
                    ? `Push all ${allComponentsCount} repository components to GitHub in one atomic commit`
                    : syncableComponentsCount < allComponentsCount
                    ? `Sync ${syncableComponentsCount} loaded components (${allComponentsCount - syncableComponentsCount} untouched repo components are already saved on disk)`
                    : `Sync all ${allComponentsCount} workspace components to project repo`
                }
                className="rounded-none h-8 gap-1.5 text-xs font-sans shrink-0"
              >
                {isSyncing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Layers className="size-3.5 text-primary" />
                )}
                <span>{syncAllLabel}</span>
              </Button>

              <div className="flex items-center justify-end gap-2">
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
                      <span>
                        {actionResult.pushedToGithub
                          ? "Saved & Pushed to GitHub"
                          : "Saved in Project Repo"}
                      </span>
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

              <div className="flex items-center justify-end gap-2">
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
