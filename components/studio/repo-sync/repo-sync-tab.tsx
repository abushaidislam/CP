"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  CheckCircle2,
  AlertCircle,
  FileCode2,
  FileJson,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
  Download,
  FolderDown,
  UploadCloud,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RepoGitInfo } from "@/lib/store/studio-store";

export interface RepoSyncActionResult {
  type: "single" | "all";
  repoPath?: string;
  savedCount?: number;
  commitSha?: string;
  commitUrl?: string;
  pushedToGithub?: boolean;
}

export interface BundleStatus {
  type: "success" | "error";
  message: string;
}

interface RepoSyncTabProps {
  activeName: string;
  derivedSlug: string;
  targetDir: string;
  savedRepoCount: number;
  allComponentsCount: number;
  autoSaveToRepo: boolean;
  onAutoSaveChange: (checked: boolean) => void;
  compCode: string;
  demoCode: string;
  cssCode: string;
  compLines: number;
  demoLines: number;
  cssLines: number;
  dependenciesCount: number;
  copiedFileKey: string | null;
  downloadedAll: boolean;
  onCopyFile: (key: string, content: string) => void;
  onDownloadFile: (filename: string, content: string) => void;
  onDownloadAllFiles: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImportWorkspaceJsonFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportWorkspaceJson: () => void;
  isExportingBundle: boolean;
  bundleStatus: BundleStatus | null;
  showAdvancedGit: boolean;
  onToggleAdvancedGit: () => void;
  commitMessage: string;
  onCommitMessageChange: (val: string) => void;
  defaultCommitMsg: string;
  pushToGithub: boolean;
  onPushToGithubChange: (checked: boolean) => void;
  githubRepoConfig: {
    repo: string;
    branch: string;
    token: string;
  };
  onGithubRepoConfigChange: (
    config: Partial<{ repo: string; branch: string; token: string }>
  ) => void;
  repoGitInfo: RepoGitInfo | null;
  lastRepoSyncError: string | null;
  actionResult: RepoSyncActionResult | null;
}

export function RepoSyncTab({
  activeName,
  derivedSlug,
  targetDir,
  savedRepoCount,
  allComponentsCount,
  autoSaveToRepo,
  onAutoSaveChange,
  compCode,
  demoCode,
  cssCode,
  compLines,
  demoLines,
  cssLines,
  dependenciesCount,
  copiedFileKey,
  downloadedAll,
  onCopyFile,
  onDownloadFile,
  onDownloadAllFiles,
  fileInputRef,
  onImportWorkspaceJsonFile,
  onExportWorkspaceJson,
  isExportingBundle,
  bundleStatus,
  showAdvancedGit,
  onToggleAdvancedGit,
  commitMessage,
  onCommitMessageChange,
  defaultCommitMsg,
  pushToGithub,
  onPushToGithubChange,
  githubRepoConfig,
  onGithubRepoConfigChange,
  repoGitInfo,
  lastRepoSyncError,
  actionResult,
}: RepoSyncTabProps) {
  const hasDemo = demoCode.trim().length > 0;
  const hasCss = cssCode.trim().length > 0;

  return (
    <div className="space-y-4">
      {/* 1. Auto-Save Toggle & Library Status Strip */}
      <div className="flex items-center justify-between gap-4 rounded-none border border-border bg-background px-4 py-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
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
          <p className="text-[11px] text-muted-foreground font-sans leading-relaxed">
            Automatically writes your code and preview snapshot to{" "}
            <span className="font-mono text-foreground/90 break-all">
              {targetDir}/
            </span>{" "}
            as you work.
          </p>
        </div>

        <div className="flex items-center shrink-0">
          <Switch
            checked={autoSaveToRepo}
            onCheckedChange={onAutoSaveChange}
            aria-label="Toggle auto-save to project repository"
          />
        </div>
      </div>

      {/* 2. Target Project Repository File Structure + Quick Copy/Download */}
      <div className="rounded-none border border-border bg-background p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground shrink-0">
              REPO FILES &amp; QUICK EXPORT
            </span>
            <span className="text-border shrink-0">/</span>
            <span
              className="font-mono text-xs font-medium text-foreground truncate"
              title={`${targetDir}/`}
            >
              {targetDir}/
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onDownloadAllFiles}
            className="rounded-none h-7 px-2.5 gap-1.5 text-[11px] font-sans shrink-0"
          >
            {downloadedAll ? (
              <>
                <Check className="size-3 text-emerald-500" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <FolderDown className="size-3 text-primary" />
                <span>Download All</span>
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
                onClick={() => onCopyFile("component.tsx", compCode)}
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
                onClick={() => onDownloadFile(`${derivedSlug}.tsx`, compCode)}
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
                disabled={!hasDemo}
                onClick={() => onCopyFile("default.tsx", demoCode)}
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
                disabled={!hasDemo}
                onClick={() =>
                  onDownloadFile(`${derivedSlug}-demo.tsx`, demoCode)
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
                disabled={!hasCss}
                onClick={() => onCopyFile("index.css", cssCode)}
                aria-label="Copy index.css"
                className="size-6 rounded-none text-muted-foreground hover:text-foreground"
              >
                {copiedFileKey === "index.css" ? (
                  <Check className="size-3 text-emerald-500" />
                ) : (
                  <Copy className="size-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={!hasCss}
                onClick={() => onDownloadFile(`${derivedSlug}.css`, cssCode)}
                aria-label="Download index.css"
                className="size-6 rounded-none text-muted-foreground hover:text-foreground"
              >
                <Download className="size-3" />
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
              {dependenciesCount} deps
            </span>
          </div>
        </div>

        {/* Workspace Backup & Migration Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
          <div className="text-[11px] text-muted-foreground font-sans">
            Workspace Backup Bundle ({allComponentsCount} components):
          </div>
          <div className="flex items-center gap-1.5">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={onImportWorkspaceJsonFile}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              type="button"
              disabled={isExportingBundle}
              onClick={onExportWorkspaceJson}
              className="rounded-none h-6 px-2 text-[11px] font-sans gap-1"
            >
              {isExportingBundle ? (
                <Loader2 className="size-3 animate-spin text-primary" />
              ) : (
                <Download className="size-3 text-primary" />
              )}
              <span>
                {isExportingBundle
                  ? "Exporting..."
                  : `Export All (${allComponentsCount}) .json`}
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-none h-6 px-2 text-[11px] font-sans gap-1"
            >
              <UploadCloud className="size-3 text-sky-500" />
              <span>Import Backup .json</span>
            </Button>
          </div>
        </div>
        {bundleStatus && (
          <div
            className={cn(
              "flex items-start gap-1.5 text-[11px] font-sans pt-0.5",
              bundleStatus.type === "error"
                ? "text-rose-500"
                : "text-emerald-500"
            )}
          >
            {bundleStatus.type === "error" ? (
              <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="size-3.5 shrink-0 mt-0.5" />
            )}
            <span className="min-w-0 break-words">{bundleStatus.message}</span>
          </div>
        )}
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
            onClick={onToggleAdvancedGit}
            className="h-6 px-2 text-[11px] font-sans text-muted-foreground hover:text-foreground rounded-none gap-1 shrink-0"
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
                onChange={(e) => onCommitMessageChange(e.target.value)}
                placeholder={defaultCommitMsg}
                className="mt-1 h-8 text-xs rounded-none bg-card font-sans"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-xs text-foreground font-sans">
                Also push directly to a remote GitHub branch via REST API
              </span>
              <Switch
                checked={pushToGithub}
                onCheckedChange={onPushToGithubChange}
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
                        onGithubRepoConfigChange({ repo: e.target.value })
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
                        onGithubRepoConfigChange({ branch: e.target.value })
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
                      onGithubRepoConfigChange({ token: e.target.value })
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
                  : `Synced ${actionResult.savedCount ?? 0} component${
                      actionResult.savedCount === 1 ? "" : "s"
                    } into Project Repository!`}
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
    </div>
  );
}
