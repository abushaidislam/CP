import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import type { ComponentVariant, StudioFiles, UserComponent } from "@/lib/store/studio-store";
import {
  checkRateLimit,
  getClientIp,
  isOwnerRequestAuthenticated,
  readJsonWithLimit,
  recordBlockedRequest,
  verifySameOriginRequest,
} from "@/lib/security/api-guard";
import {
  buildPreviewImageUrl,
  COMPONENTS_DIR_REL,
  INDEX_FILE_REL,
  readRegistrySummaries,
  readSingleRepoComponent,
  REGISTRY_ROOT_REL,
  resolveSafeComponentDir,
  toComponentSlug,
  type RepoComponentManifest,
  type RepoIndexEntry,
} from "@/lib/registry/server-registry";

export { toComponentSlug, type RepoComponentManifest, type RepoIndexEntry };

const execFileAsync = promisify(execFile);

let repoWriteQueue: Promise<unknown> = Promise.resolve();

function withRepoWriteLock<T>(task: () => Promise<T>): Promise<T> {
  const next = repoWriteQueue.then(task, task);
  repoWriteQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

async function getGitWorkspaceInfo(cwd: string): Promise<{
  isGitRepo: boolean;
  branch?: string;
  lastCommitSha?: string;
  remoteOrigin?: string;
}> {
  try {
    const { stdout: branchOut } = await execFileAsync(
      "git",
      ["rev-parse", "--abbrev-ref", "HEAD"],
      { cwd, timeout: 3000 }
    );
    let lastCommitSha: string | undefined;
    try {
      const { stdout: shaOut } = await execFileAsync(
        "git",
        ["rev-parse", "--short", "HEAD"],
        { cwd, timeout: 3000 }
      );
      lastCommitSha = shaOut.trim() || undefined;
    } catch {
      // repo might not have commits yet
    }
    let remoteOrigin: string | undefined;
    try {
      const { stdout: remOut } = await execFileAsync(
        "git",
        ["config", "--get", "remote.origin.url"],
        { cwd, timeout: 3000 }
      );
      remoteOrigin = remOut.trim() || undefined;
    } catch {
      // no remote configured
    }
    return {
      isGitRepo: true,
      branch: branchOut.trim() || "main",
      lastCommitSha,
      remoteOrigin,
    };
  } catch {
    return { isGitRepo: false };
  }
}

async function tryLocalGitCommit(
  cwd: string,
  commitMessage: string
): Promise<{ committed: boolean; commitSha?: string }> {
  try {
    await execFileAsync("git", ["add", REGISTRY_ROOT_REL], {
      cwd,
      timeout: 5000,
    });

    // Check if there are staged changes in registry/
    const { stdout: statusOut } = await execFileAsync(
      "git",
      ["status", "--porcelain", REGISTRY_ROOT_REL],
      { cwd, timeout: 4000 }
    );
    if (!statusOut.trim()) {
      const { stdout: shaOut } = await execFileAsync(
        "git",
        ["rev-parse", "--short", "HEAD"],
        { cwd, timeout: 3000 }
      ).catch(() => ({ stdout: "" }));
      return {
        committed: false,
        commitSha: shaOut.trim() || undefined,
      };
    }

    await execFileAsync(
      "git",
      [
        "-c",
        "user.name=Component Studio",
        "-c",
        "user.email=studio@component-studio.local",
        "commit",
        "-m",
        commitMessage,
      ],
      { cwd, timeout: 6000 }
    );

    const { stdout: shaOut } = await execFileAsync(
      "git",
      ["rev-parse", "--short", "HEAD"],
      { cwd, timeout: 3000 }
    );
    return {
      committed: true,
      commitSha: shaOut.trim() || undefined,
    };
  } catch {
    return { committed: false };
  }
}

function normalizeGithubRepoInput(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    .replace(/^github\.com\//i, "")
    .replace(/\.git$/i, "")
    .replace(/^\/+|\/+$/g, "");

  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]}/${parts[1]}`;
  }
  return cleaned;
}

export async function pushFilesToGithubRestApi(params: {
  repo: string;
  branch: string;
  token: string;
  commitMessage: string;
  filesToPush: Array<{
    path: string;
    content: string;
    encoding?: "utf-8" | "base64";
  }>;
}): Promise<{
  pushed: boolean;
  commitSha?: string;
  commitUrl?: string;
  error?: string;
}> {
  let cleanRepo = normalizeGithubRepoInput(params.repo);
  const rawToken = params.token.trim();

  if (!rawToken) {
    return {
      pushed: false,
      error:
        "GitHub Personal Access Token is required to push to GitHub. Configure it under 'Direct Remote GitHub Push'.",
    };
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${rawToken}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Component-Studio-Repo-Sync",
  };

  try {
    // If the user only typed a repository name without 'owner/', resolve their GitHub username from the token
    if (cleanRepo && !cleanRepo.includes("/")) {
      const userRes = await fetch("https://api.github.com/user", { headers });
      if (userRes.ok) {
        const userData = (await userRes.json()) as { login?: string };
        if (userData.login) {
          cleanRepo = `${userData.login}/${cleanRepo}`;
        }
      }
    }

    if (!cleanRepo || !cleanRepo.includes("/")) {
      return {
        pushed: false,
        error:
          "GitHub repository must be in 'owner/repo' format (e.g. 'username/my-components').",
      };
    }

    let branch = params.branch.trim() || "main";

    // 0. Inspect repository metadata & verify permissions / default branch
    let repoRes = await fetch(`https://api.github.com/repos/${cleanRepo}`, {
      headers,
    });

    if (repoRes.status === 401) {
      return {
        pushed: false,
        error:
          "GitHub authentication failed (401 Unauthorized). Please check that your Personal Access Token is valid and not expired.",
      };
    }

    // If repository returns 404, check if the authenticated user owns the namespace and try auto-creating the repo,
    // or return a clear explanation about token permissions / repo name.
    if (repoRes.status === 404) {
      const [repoOwner, repoName] = cleanRepo.split("/");
      const userRes = await fetch("https://api.github.com/user", { headers });
      const userData = userRes.ok
        ? ((await userRes.json()) as { login?: string })
        : null;

      if (
        userData?.login &&
        userData.login.toLowerCase() === repoOwner.toLowerCase()
      ) {
        // Try auto-creating the repository if the token has permission
        const createRepoRes = await fetch("https://api.github.com/user/repos", {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: repoName,
            description: "Component Studio Registry",
            private: false,
            auto_init: true,
          }),
        });
        if (createRepoRes.ok) {
          repoRes = await fetch(`https://api.github.com/repos/${cleanRepo}`, {
            headers,
          });
        }
      }

      if (!repoRes.ok) {
        return {
          pushed: false,
          error: `GitHub repository '${cleanRepo}' was not found (404)${
            userData?.login ? ` for token user '@${userData.login}'` : ""
          }. Please verify: (1) The repository '${cleanRepo}' exists on GitHub, and (2) Your Personal Access Token has 'repo' scope (Classic token) or 'Contents: Read and write' permission for '${cleanRepo}' (Fine-grained token).`,
        };
      }
    }

    const repoData = repoRes.ok
      ? ((await repoRes.json()) as {
          default_branch?: string;
          permissions?: { push?: boolean };
        })
      : null;

    if (repoData?.permissions && repoData.permissions.push === false) {
      return {
        pushed: false,
        error: `Your GitHub token has read-only access to '${cleanRepo}'. Please grant 'repo' scope (Classic token) or 'Contents: Read and write' permission (Fine-grained token).`,
      };
    }

    // 1. Get reference for target branch
    let refRes = await fetch(
      `https://api.github.com/repos/${cleanRepo}/git/ref/heads/${encodeURIComponent(branch)}`,
      { headers }
    );

    // Fallback A: If requested branch (e.g. 'main') was not found, check the repository's default_branch (e.g. 'master')
    if (
      !refRes.ok &&
      repoData?.default_branch &&
      repoData.default_branch !== branch
    ) {
      const defaultBranchRes = await fetch(
        `https://api.github.com/repos/${cleanRepo}/git/ref/heads/${encodeURIComponent(
          repoData.default_branch
        )}`,
        { headers }
      );
      if (defaultBranchRes.ok) {
        branch = repoData.default_branch;
        refRes = defaultBranchRes;
      }
    }

    // Fallback B: If the repository is completely empty (0 commits -> 404 or 409 on git/ref/heads),
    // bootstrap the initial commit using the Contents API so the branch and Git tree exist!
    if (refRes.status === 404 || refRes.status === 409) {
      const readmeInitContent = Buffer.from(
        `# Component Studio Registry\n\nSynced from Component Studio into \`registry/components/\`.\n`,
        "utf-8"
      ).toString("base64");

      const initRes = await fetch(
        `https://api.github.com/repos/${cleanRepo}/contents/registry/README.md`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            message: "chore(registry): initialize Component Studio registry",
            content: readmeInitContent,
            branch,
          }),
        }
      );

      if (initRes.ok) {
        refRes = await fetch(
          `https://api.github.com/repos/${cleanRepo}/git/ref/heads/${encodeURIComponent(branch)}`,
          { headers }
        );
      }
    }

    if (!refRes.ok) {
      const errBody = await refRes.text();
      return {
        pushed: false,
        error: `GitHub branch '${branch}' in '${cleanRepo}' lookup failed (${refRes.status}): ${errBody.slice(0, 180)}`,
      };
    }

    const refData = (await refRes.json()) as {
      object?: { sha?: string };
    };
    const latestCommitSha = refData.object?.sha;
    if (!latestCommitSha) {
      return {
        pushed: false,
        error: "Could not resolve latest commit SHA on GitHub branch.",
      };
    }

    // 2. Get base tree SHA from latest commit
    const commitRes = await fetch(
      `https://api.github.com/repos/${cleanRepo}/git/commits/${latestCommitSha}`,
      { headers }
    );
    if (!commitRes.ok) {
      return {
        pushed: false,
        error: `Failed to inspect latest GitHub commit (${commitRes.status}).`,
      };
    }
    const commitData = (await commitRes.json()) as {
      tree?: { sha?: string };
    };
    const baseTreeSha = commitData.tree?.sha;
    if (!baseTreeSha) {
      return {
        pushed: false,
        error: "Could not resolve base Git tree SHA from GitHub.",
      };
    }

    // 3. Create a new Git tree with all component files (uploading base64 blobs in parallel batches of 6)
    const treeEntries: Array<{
      path: string;
      mode: "100644";
      type: "blob";
      content?: string;
      sha?: string;
    }> = [];

    const textFiles = params.filesToPush.filter((f) => f.encoding !== "base64");
    const binaryFiles = params.filesToPush.filter(
      (f) => f.encoding === "base64"
    );

    for (const file of textFiles) {
      treeEntries.push({
        path: file.path.replace(/^\/+/, ""),
        mode: "100644",
        type: "blob",
        content: file.content,
      });
    }

    const BLOB_CONCURRENCY = 6;
    for (let i = 0; i < binaryFiles.length; i += BLOB_CONCURRENCY) {
      const batch = binaryFiles.slice(i, i + BLOB_CONCURRENCY);
      const uploaded = await Promise.all(
        batch.map(async (file) => {
          const cleanPath = file.path.replace(/^\/+/, "");
          try {
            const blobRes = await fetch(
              `https://api.github.com/repos/${cleanRepo}/git/blobs`,
              {
                method: "POST",
                headers,
                body: JSON.stringify({
                  content: file.content,
                  encoding: "base64",
                }),
              }
            );
            if (blobRes.ok) {
              const blobData = (await blobRes.json()) as { sha?: string };
              if (blobData.sha) {
                return {
                  path: cleanPath,
                  mode: "100644" as const,
                  type: "blob" as const,
                  sha: blobData.sha,
                };
              }
            }
          } catch {
            // Ignore single thumbnail blob failure so code commit still succeeds
          }
          return null;
        })
      );
      for (const item of uploaded) {
        if (item) treeEntries.push(item);
      }
    }

    const treePayload = {
      base_tree: baseTreeSha,
      tree: treeEntries,
    };

    const newTreeRes = await fetch(
      `https://api.github.com/repos/${cleanRepo}/git/trees`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(treePayload),
      }
    );
    if (!newTreeRes.ok) {
      const errBody = await newTreeRes.text();
      return {
        pushed: false,
        error: `Failed to create Git tree on GitHub (${newTreeRes.status}): ${errBody.slice(0, 180)}`,
      };
    }
    const newTreeData = (await newTreeRes.json()) as { sha?: string };
    if (!newTreeData.sha) {
      return {
        pushed: false,
        error: "GitHub tree creation did not return a valid SHA.",
      };
    }

    // 4. Create commit object
    const newCommitRes = await fetch(
      `https://api.github.com/repos/${cleanRepo}/git/commits`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: params.commitMessage,
          tree: newTreeData.sha,
          parents: [latestCommitSha],
        }),
      }
    );
    if (!newCommitRes.ok) {
      const errBody = await newCommitRes.text();
      return {
        pushed: false,
        error: `Failed to create commit on GitHub (${newCommitRes.status}): ${errBody.slice(0, 180)}`,
      };
    }
    const newCommitData = (await newCommitRes.json()) as {
      sha?: string;
      html_url?: string;
    };
    const createdSha = newCommitData.sha;
    if (!createdSha) {
      return {
        pushed: false,
        error: "GitHub commit creation did not return a commit SHA.",
      };
    }

    // 5. Update branch reference to point to new commit
    const updateRefRes = await fetch(
      `https://api.github.com/repos/${cleanRepo}/git/refs/heads/${encodeURIComponent(branch)}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          sha: createdSha,
          force: false,
        }),
      }
    );
    if (!updateRefRes.ok) {
      const errBody = await updateRefRes.text();
      return {
        pushed: false,
        error: `Failed to update branch ref on GitHub (${updateRefRes.status}): ${errBody.slice(0, 180)}`,
      };
    }

    return {
      pushed: true,
      commitSha: createdSha.slice(0, 7),
      commitUrl:
        newCommitData.html_url ||
        `https://github.com/${cleanRepo}/commit/${createdSha}`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      pushed: false,
      error: `GitHub API error: ${msg}`,
    };
  }
}

let cachedRepoComponents: {
  cwd: string;
  timestamp: number;
  data: {
    components: Array<{
      manifest: RepoComponentManifest;
      files: StudioFiles;
    }>;
    indexEntries: RepoIndexEntry[];
  };
} | null = null;

let cachedGitWorkspaceInfo: {
  cwd: string;
  timestamp: number;
  info: {
    isGitRepo: boolean;
    branch?: string;
    lastCommitSha?: string;
    remoteOrigin?: string;
  };
} | null = null;

const SERVER_CACHE_TTL_MS = 60_000;

export function invalidateRepoReadCache(): void {
  cachedRepoComponents = null;
  cachedGitWorkspaceInfo = null;
}

async function getCachedGitWorkspaceInfo(cwd: string) {
  if (
    cachedGitWorkspaceInfo &&
    cachedGitWorkspaceInfo.cwd === cwd &&
    Date.now() - cachedGitWorkspaceInfo.timestamp < SERVER_CACHE_TTL_MS
  ) {
    return cachedGitWorkspaceInfo.info;
  }
  const info = await getGitWorkspaceInfo(cwd);
  cachedGitWorkspaceInfo = { cwd, timestamp: Date.now(), info };
  return info;
}

async function readAllRepoComponents(
  cwd: string,
  forceRefresh = false
): Promise<{
  components: Array<{
    manifest: RepoComponentManifest;
    files: StudioFiles;
  }>;
  indexEntries: RepoIndexEntry[];
}> {
  if (
    !forceRefresh &&
    cachedRepoComponents &&
    cachedRepoComponents.cwd === cwd &&
    Date.now() - cachedRepoComponents.timestamp < SERVER_CACHE_TTL_MS
  ) {
    return cachedRepoComponents.data;
  }

  const componentsDir = path.join(cwd, COMPONENTS_DIR_REL);
  const results: Array<{
    manifest: RepoComponentManifest;
    files: StudioFiles;
  }> = [];
  const indexEntries: RepoIndexEntry[] = [];

  try {
    const entries = await fs.readdir(componentsDir, { withFileTypes: true });
    const dirEntries = entries.filter((e) => e.isDirectory());

    const loadedItems = await Promise.all(
      dirEntries.map(async (entry) => {
        const slug = entry.name;
        const compDir = path.join(componentsDir, slug);
        const manifestPath = path.join(compDir, "manifest.json");
        const compFilePath = path.join(compDir, "component.tsx");
        const defaultFilePath = path.join(compDir, "default.tsx");
        const cssFilePath = path.join(compDir, "index.css");

        try {
          const [manifestRaw, componentTsx, defaultTsx, indexCss] =
            await Promise.all([
              fs.readFile(manifestPath, "utf-8"),
              fs.readFile(compFilePath, "utf-8"),
              fs.readFile(defaultFilePath, "utf-8").catch(() => ""),
              fs
                .readFile(cssFilePath, "utf-8")
                .catch(
                  () =>
                    "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n"
                ),
            ]);

          const manifest = JSON.parse(manifestRaw) as RepoComponentManifest;
          const previewPngPath = path.join(compDir, "preview.png");
          let hasPreviewPng = false;
          try {
            await fs.access(previewPngPath);
            hasPreviewPng = true;
          } catch {
            // No preview.png on disk
          }

          if (
            hasPreviewPng &&
            (!manifest.previewImage ||
              manifest.previewImage === "./preview.png" ||
              manifest.previewImage.startsWith("/api/repo-sync/preview/"))
          ) {
            const versionStamp =
              manifest.lastRepoSyncAt || manifest.updatedAt || 1;
            manifest.previewImage = buildPreviewImageUrl(
              manifest.slug || slug,
              versionStamp
            );
          }

          const files: StudioFiles = {
            "component.tsx": componentTsx,
            "default.tsx": defaultTsx,
            "demo.tsx": defaultTsx,
            "index.css": indexCss,
          };

          const fileList = [
            "component.tsx",
            "default.tsx",
            "index.css",
            "manifest.json",
          ];
          if (
            hasPreviewPng ||
            manifest.previewImage?.startsWith("data:image/png;base64,")
          ) {
            fileList.push("preview.png");
          }

          return {
            componentItem: { manifest, files },
            indexEntry: {
              id: manifest.id,
              slug: manifest.slug || slug,
              name: manifest.name,
              description: manifest.description,
              category: manifest.category,
              isBuiltIn: manifest.isBuiltIn,
              updatedAt: manifest.updatedAt,
              lastRepoSyncAt: manifest.lastRepoSyncAt,
              path: `${COMPONENTS_DIR_REL}/${slug}`,
              files: fileList,
              dependencies: manifest.dependencies || [],
            } as RepoIndexEntry,
          };
        } catch {
          return null;
        }
      })
    );

    for (const item of loadedItems) {
      if (!item) continue;
      results.push(item.componentItem);
      indexEntries.push(item.indexEntry);
    }
  } catch {
    // Directory doesn't exist yet
  }

  indexEntries.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const data = { components: results, indexEntries };
  cachedRepoComponents = { cwd, timestamp: Date.now(), data };
  return data;
}

async function writeRegistryIndexFile(
  cwd: string,
  indexEntries: RepoIndexEntry[]
): Promise<string> {
  const registryDir = path.join(cwd, REGISTRY_ROOT_REL);
  await fs.mkdir(registryDir, { recursive: true });
  const indexPath = path.join(cwd, INDEX_FILE_REL);
  const payload = {
    schemaVersion: "1.0.0",
    updatedAt: new Date().toISOString(),
    totalComponents: indexEntries.length,
    components: indexEntries,
  };
  const content = JSON.stringify(payload, null, 2) + "\n";
  await fs.writeFile(indexPath, content, "utf-8");
  return content;
}

export async function GET(req?: NextRequest) {
  try {
    const cwd = process.cwd();
    const searchParams = req ? req.nextUrl.searchParams : null;
    const mode = searchParams?.get("mode") || "full";
    const idParam = searchParams?.get("id")?.trim() || "";
    const slugParam = searchParams?.get("slug")?.trim() || "";

    const envGithubRepo = process.env.GITHUB_REPO?.trim() || "";
    const envGithubBranch = process.env.GITHUB_BRANCH?.trim() || "main";
    const hasGithubToken = Boolean(process.env.GITHUB_TOKEN?.trim());

    // Fast single-component read (~5 KB JSON) for Studio deep-links and lazy editing
    if (idParam || slugParam) {
      const single = await readSingleRepoComponent(idParam || slugParam, cwd);
      if (!single) {
        return NextResponse.json(
          { success: false, error: "Component not found in repository." },
          { status: 404 }
        );
      }
      return NextResponse.json(
        {
          success: true,
          mode: "single",
          component: single.component,
          manifest: single.manifest,
          files: single.files,
        },
        {
          headers: {
            "Cache-Control": "private, max-age=15, stale-while-revalidate=120",
          },
        }
      );
    }

    // Fast summary read (~30 KB JSON) for Hub grid — ZERO base64 PNGs, ZERO full source code
    if (mode === "summary") {
      const [{ summaries, indexEntries }, gitInfo] = await Promise.all([
        readRegistrySummaries(cwd),
        getCachedGitWorkspaceInfo(cwd),
      ]);

      return NextResponse.json(
        {
          success: true,
          mode: "summary",
          registryPath: COMPONENTS_DIR_REL,
          totalComponents: summaries.length,
          summaries,
          indexEntries,
          gitInfo: {
            ...gitInfo,
            envGithubRepo,
            envGithubBranch,
            hasGithubToken,
          },
        },
        {
          headers: {
            "Cache-Control": "private, max-age=15, stale-while-revalidate=300",
          },
        }
      );
    }

    // Full mode (uses lightweight preview URLs instead of 8MB inline base64 PNGs)
    const [{ components, indexEntries }, gitInfo] = await Promise.all([
      readAllRepoComponents(cwd),
      getCachedGitWorkspaceInfo(cwd),
    ]);

    return NextResponse.json(
      {
        success: true,
        mode: "full",
        registryPath: COMPONENTS_DIR_REL,
        totalComponents: components.length,
        components,
        indexEntries,
        gitInfo: {
          ...gitInfo,
          envGithubRepo,
          envGithubBranch,
          hasGithubToken,
        },
      },
      {
        headers: {
          "Cache-Control": "private, max-age=15, stale-while-revalidate=300",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to read project repository registry: ${message}`,
      },
      { status: 500 }
    );
  }
}

interface SaveComponentInput {
  component: UserComponent;
  variants?: ComponentVariant[];
  activeVariantId?: string;
}

export async function POST(req: NextRequest) {
  const originCheck = verifySameOriginRequest(req);
  if (!originCheck.valid) {
    return NextResponse.json(
      {
        success: false,
        error: originCheck.reason || "Cross-origin request rejected.",
      },
      { status: 403 }
    );
  }

  if (!isOwnerRequestAuthenticated(req)) {
    recordBlockedRequest();
    return NextResponse.json(
      {
        success: false,
        requiresOwnerAuth: true,
        error: "Owner authentication required to save components to the repository.",
      },
      { status: 401 }
    );
  }

  const clientIp = getClientIp(req);
  const rateCheck = checkRateLimit(clientIp, "repo-sync-write", 60, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Repository write rate limit reached. Try again in ${rateCheck.retryAfterSeconds}s.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateCheck.retryAfterSeconds) },
      }
    );
  }

  const parsed = await readJsonWithLimit<{
    action?: "save_component" | "sync_all";
    component?: UserComponent;
    variants?: ComponentVariant[];
    activeVariantId?: string;
    items?: SaveComponentInput[];
    commitMessage?: string;
    commitToGit?: boolean;
    pushToGithub?: boolean;
    githubConfig?: {
      repo?: string;
      branch?: string;
      token?: string;
    };
  }>(req, 25 * 1024 * 1024);

  if (!parsed.ok) {
    return parsed.errorResponse;
  }

  const body = parsed.data;

  return withRepoWriteLock(async () => {
    try {
      const cwd = process.cwd();

      const itemsToSave: SaveComponentInput[] = [];
      if (body.action === "sync_all" && Array.isArray(body.items)) {
        itemsToSave.push(...body.items);
      } else if (body.component) {
        itemsToSave.push({
          component: body.component,
          variants: body.variants,
          activeVariantId: body.activeVariantId,
        });
      }

      if (itemsToSave.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "No component payload provided to save into the repository.",
          },
          { status: 400 }
        );
      }

      const now = Date.now();
      const writtenFilesForGithub: Array<{
        path: string;
        content: string;
        encoding?: "utf-8" | "base64";
      }> = [];
      const savedRecords: Array<{
        id: string;
        slug: string;
        repoPath: string;
        lastRepoSyncAt: number;
        writtenFiles: string[];
      }> = [];
      const inMemoryIndexEntries: RepoIndexEntry[] = [];
      let localFsWriteError: string | null = null;

      for (const item of itemsToSave) {
        const comp = item.component;
        const slug = toComponentSlug(
          comp.repoSlug || (comp.isBuiltIn ? comp.id : comp.name),
          comp.id
        );
        const compRelDir = `${COMPONENTS_DIR_REL}/${slug}`;
        const compAbsDir = resolveSafeComponentDir(cwd, slug);

        const componentTsx = comp.files["component.tsx"] || "";
        const defaultTsx =
          comp.files["default.tsx"] ?? comp.files["demo.tsx"] ?? "";
        const indexCss =
          comp.files["index.css"] ||
          "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n";

        let manifestPreviewRef = comp.previewImage;
        let previewPngBuffer: Buffer | null = null;
        let previewPngBase64: string | null = null;
        if (comp.previewImage?.startsWith("data:image/png;base64,")) {
          previewPngBase64 = comp.previewImage.slice(
            "data:image/png;base64,".length
          );
          previewPngBuffer = Buffer.from(previewPngBase64, "base64");
          manifestPreviewRef = "./preview.png";
        } else if (comp.previewImage?.startsWith("/api/repo-sync/preview/")) {
          manifestPreviewRef = "./preview.png";
        }

      // Only persist variants in manifest.json when there are multiple variants or saved checkpoints
      const hasMeaningfulVariants =
        Array.isArray(item.variants) &&
        (item.variants.length > 1 ||
          item.variants.some((v) => (v.checkpoints?.length || 0) > 0));

      const manifest: RepoComponentManifest = {
        id: comp.id,
        slug,
        name: comp.name,
        description: comp.description || "",
        category: comp.category || "Custom",
        isBuiltIn: comp.isBuiltIn,
        createdAt: comp.createdAt || now,
        updatedAt: comp.updatedAt || now,
        lastRepoSyncAt: now,
        dependencies: comp.dependencies || [],
        previewImage: manifestPreviewRef,
        ...(hasMeaningfulVariants
          ? {
              variants: item.variants,
              activeVariantId: item.activeVariantId,
            }
          : {}),
      };

      const manifestJson = JSON.stringify(manifest, null, 2) + "\n";

      const writtenFilePaths = [
        `${compRelDir}/component.tsx`,
        `${compRelDir}/default.tsx`,
        `${compRelDir}/index.css`,
        `${compRelDir}/manifest.json`,
      ];

      if (previewPngBuffer) {
        writtenFilePaths.push(`${compRelDir}/preview.png`);
      }

      try {
        await fs.mkdir(compAbsDir, { recursive: true });
        const writePromises: Promise<unknown>[] = [
          fs.writeFile(
            path.join(compAbsDir, "component.tsx"),
            componentTsx,
            "utf-8"
          ),
          fs.writeFile(
            path.join(compAbsDir, "default.tsx"),
            defaultTsx,
            "utf-8"
          ),
          fs.writeFile(path.join(compAbsDir, "index.css"), indexCss, "utf-8"),
          fs.writeFile(
            path.join(compAbsDir, "manifest.json"),
            manifestJson,
            "utf-8"
          ),
        ];

        if (previewPngBuffer) {
          writePromises.push(
            fs.writeFile(path.join(compAbsDir, "preview.png"), previewPngBuffer)
          );
        }

        await Promise.all(writePromises);
      } catch (fsErr: unknown) {
        localFsWriteError =
          fsErr instanceof Error ? fsErr.message : String(fsErr);
      }

      writtenFilesForGithub.push(
        { path: `${compRelDir}/component.tsx`, content: componentTsx },
        { path: `${compRelDir}/default.tsx`, content: defaultTsx },
        { path: `${compRelDir}/index.css`, content: indexCss },
        { path: `${compRelDir}/manifest.json`, content: manifestJson }
      );

      if (previewPngBase64) {
        writtenFilesForGithub.push({
          path: `${compRelDir}/preview.png`,
          content: previewPngBase64,
          encoding: "base64",
        });
      }

      const fileList = [
        "component.tsx",
        "default.tsx",
        "index.css",
        "manifest.json",
        ...(previewPngBase64 ? ["preview.png"] : []),
      ];

      inMemoryIndexEntries.push({
        id: manifest.id,
        slug,
        name: manifest.name,
        description: manifest.description,
        category: manifest.category,
        isBuiltIn: manifest.isBuiltIn,
        updatedAt: manifest.updatedAt,
        lastRepoSyncAt: manifest.lastRepoSyncAt,
        path: compRelDir,
        files: fileList,
        dependencies: manifest.dependencies || [],
      });

      savedRecords.push({
        id: comp.id,
        slug,
        repoPath: compRelDir,
        lastRepoSyncAt: now,
        writtenFiles: writtenFilePaths,
      });
    }

    // Rebuild master registry/index.json and refresh server cache
    invalidateRepoReadCache();
    const { indexEntries: diskIndexEntries } = await readAllRepoComponents(
      cwd,
      true
    );
    const mergedIndexMap = new Map<string, RepoIndexEntry>();
    for (const entry of diskIndexEntries) {
      mergedIndexMap.set(entry.slug, entry);
    }
    for (const entry of inMemoryIndexEntries) {
      mergedIndexMap.set(entry.slug, entry);
    }
    const indexEntries = Array.from(mergedIndexMap.values()).sort(
      (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
    );

    let indexContent = "";
    try {
      indexContent = await writeRegistryIndexFile(cwd, indexEntries);
    } catch {
      indexContent =
        JSON.stringify(
          {
            schemaVersion: "1.0.0",
            updatedAt: new Date().toISOString(),
            totalComponents: indexEntries.length,
            components: indexEntries,
          },
          null,
          2
        ) + "\n";
    }
    writtenFilesForGithub.push({
      path: INDEX_FILE_REL,
      content: indexContent,
    });

    const defaultCommitMsg =
      itemsToSave.length === 1
        ? `feat(registry): save ${itemsToSave[0].component.name} (${savedRecords[0].slug}) to project repo`
        : `feat(registry): sync ${itemsToSave.length} components to project repo`;
    const commitMessage = (body.commitMessage || "").trim() || defaultCommitMsg;

    // 1. Perform local Git commit in project repo if enabled
    let localGitResult: { committed: boolean; commitSha?: string } = {
      committed: false,
    };
    if (body.commitToGit !== false && !localFsWriteError) {
      localGitResult = await tryLocalGitCommit(cwd, commitMessage);
    }

    // 2. Optionally push commit directly to GitHub via REST API if configured/requested
    const targetGithubRepo =
      body.githubConfig?.repo?.trim() || process.env.GITHUB_REPO?.trim() || "";
    const targetGithubBranch =
      body.githubConfig?.branch?.trim() ||
      process.env.GITHUB_BRANCH?.trim() ||
      "main";
    const targetGithubToken =
      body.githubConfig?.token?.trim() ||
      process.env.GITHUB_TOKEN?.trim() ||
      "";

    let githubPushResult: {
      pushed: boolean;
      commitSha?: string;
      commitUrl?: string;
      error?: string;
    } | null = null;

    const shouldPushToGithub =
      Boolean(body.pushToGithub) ||
      Boolean(localFsWriteError && targetGithubRepo && targetGithubToken);

    if (shouldPushToGithub && targetGithubRepo && targetGithubToken) {
      githubPushResult = await pushFilesToGithubRestApi({
        repo: targetGithubRepo,
        branch: targetGithubBranch,
        token: targetGithubToken,
        commitMessage,
        filesToPush: writtenFilesForGithub,
      });
    } else if (body.pushToGithub && (!targetGithubRepo || !targetGithubToken)) {
      githubPushResult = {
        pushed: false,
        error:
          "To push directly to a remote GitHub branch via API, provide a GitHub Repository (owner/repo) and Personal Access Token (or set GITHUB_REPO and GITHUB_TOKEN in .env).",
      };
    }

    if (localFsWriteError && !githubPushResult?.pushed) {
      return NextResponse.json(
        {
          success: false,
          error:
            githubPushResult?.error ||
            `Server filesystem is read-only (${localFsWriteError}). Expand 'Optional: Custom Git Commit & Direct Remote GitHub Push' below and enter your GitHub Repository (owner/repo) + Personal Access Token to push directly to GitHub.`,
        },
        { status: 500 }
      );
    }

    const finalCommitSha =
      githubPushResult?.commitSha || localGitResult.commitSha;
    const finalCommitUrl = githubPushResult?.commitUrl;

    return NextResponse.json({
      success: true,
      savedCount: savedRecords.length,
      savedRecords,
      indexFile: INDEX_FILE_REL,
      totalRepoComponents: indexEntries.length,
      commitMessage,
      localGitCommitted: localGitResult.committed,
      commitSha: finalCommitSha,
      commitUrl: finalCommitUrl,
      githubPush: githubPushResult,
    });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to save component to project repository: ${message}`,
        },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(req: NextRequest) {
  const originCheck = verifySameOriginRequest(req);
  if (!originCheck.valid) {
    return NextResponse.json(
      {
        success: false,
        error: originCheck.reason || "Cross-origin request rejected.",
      },
      { status: 403 }
    );
  }

  if (!isOwnerRequestAuthenticated(req)) {
    recordBlockedRequest();
    return NextResponse.json(
      {
        success: false,
        requiresOwnerAuth: true,
        error: "Owner authentication required to delete components from the repository.",
      },
      { status: 401 }
    );
  }

  const clientIp = getClientIp(req);
  const rateCheck = checkRateLimit(clientIp, "repo-sync-write", 60, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Repository write rate limit reached. Try again in ${rateCheck.retryAfterSeconds}s.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateCheck.retryAfterSeconds) },
      }
    );
  }

  return withRepoWriteLock(async () => {
    try {
      const cwd = process.cwd();
      const { searchParams } = new URL(req.url);
      const id = searchParams.get("id") || "";
      const slugParam = searchParams.get("slug") || "";

      const { components } = await readAllRepoComponents(cwd);
      const target = components.find(
        (c) =>
          (id && c.manifest.id === id) ||
          (slugParam && c.manifest.slug === slugParam)
      );

      if (!target) {
        return NextResponse.json({
          success: true,
          removed: false,
        });
      }

      const compAbsDir = resolveSafeComponentDir(cwd, target.manifest.slug);
      await fs.rm(compAbsDir, { recursive: true, force: true });

      invalidateRepoReadCache();
      const { indexEntries } = await readAllRepoComponents(cwd, true);
      await writeRegistryIndexFile(cwd, indexEntries);
      await tryLocalGitCommit(
        cwd,
        `chore(registry): remove ${target.manifest.name} from project repo`
      );

      return NextResponse.json({
        success: true,
        removed: true,
        slug: target.manifest.slug,
        totalRepoComponents: indexEntries.length,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to delete component from project repository: ${message}`,
        },
        { status: 500 }
      );
    }
  });
}
