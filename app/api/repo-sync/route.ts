import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import type { ComponentVariant, StudioFiles, UserComponent } from "@/lib/store/studio-store";

const execFileAsync = promisify(execFile);

const REGISTRY_ROOT_REL = "registry";
const COMPONENTS_DIR_REL = "registry/components";
const INDEX_FILE_REL = "registry/index.json";

export interface RepoComponentManifest {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  isBuiltIn?: boolean;
  createdAt: number;
  updatedAt: number;
  lastRepoSyncAt: number;
  lastCommitSha?: string;
  lastCommitUrl?: string;
  dependencies: string[];
  previewImage?: string;
  variants?: ComponentVariant[];
  activeVariantId?: string;
}

export interface RepoIndexEntry {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  isBuiltIn?: boolean;
  updatedAt: number;
  lastRepoSyncAt: number;
  path: string;
  files: string[];
  dependencies: string[];
}

export function toComponentSlug(nameOrId: string, fallbackId?: string): string {
  const raw = (nameOrId || fallbackId || "component")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return raw || "custom-component";
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

async function pushFilesToGithubRestApi(params: {
  repo: string;
  branch: string;
  token: string;
  commitMessage: string;
  filesToPush: Array<{ path: string; content: string }>;
}): Promise<{
  pushed: boolean;
  commitSha?: string;
  commitUrl?: string;
  error?: string;
}> {
  const cleanRepo = params.repo
    .trim()
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/\.git$/i, "")
    .replace(/^\/+|\/+$/g, "");

  if (!cleanRepo || !cleanRepo.includes("/")) {
    return {
      pushed: false,
      error: "GitHub repository must be in 'owner/repo' format.",
    };
  }

  const branch = params.branch.trim() || "main";
  const headers: Record<string, string> = {
    Authorization: `Bearer ${params.token.trim()}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Component-Studio-Repo-Sync",
  };

  try {
    // 1. Get reference for target branch
    const refRes = await fetch(
      `https://api.github.com/repos/${cleanRepo}/git/ref/heads/${encodeURIComponent(branch)}`,
      { headers }
    );

    if (!refRes.ok) {
      const errBody = await refRes.text();
      return {
        pushed: false,
        error: `GitHub branch '${branch}' lookup failed (${refRes.status}): ${errBody.slice(0, 180)}`,
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

    // 3. Create a new Git tree with all component files
    const treePayload = {
      base_tree: baseTreeSha,
      tree: params.filesToPush.map((file) => ({
        path: file.path.replace(/^\/+/, ""),
        mode: "100644",
        type: "blob",
        content: file.content,
      })),
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

async function readAllRepoComponents(cwd: string): Promise<{
  components: Array<{
    manifest: RepoComponentManifest;
    files: StudioFiles;
  }>;
  indexEntries: RepoIndexEntry[];
}> {
  const componentsDir = path.join(cwd, COMPONENTS_DIR_REL);
  const results: Array<{
    manifest: RepoComponentManifest;
    files: StudioFiles;
  }> = [];
  const indexEntries: RepoIndexEntry[] = [];

  try {
    const entries = await fs.readdir(componentsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const slug = entry.name;
      const compDir = path.join(componentsDir, slug);
      const manifestPath = path.join(compDir, "manifest.json");
      const compFilePath = path.join(compDir, "component.tsx");
      const defaultFilePath = path.join(compDir, "default.tsx");
      const cssFilePath = path.join(compDir, "index.css");

      try {
        const [manifestRaw, componentTsx] = await Promise.all([
          fs.readFile(manifestPath, "utf-8"),
          fs.readFile(compFilePath, "utf-8"),
        ]);
        const defaultTsx = await fs
          .readFile(defaultFilePath, "utf-8")
          .catch(() => "");
        const indexCss = await fs
          .readFile(cssFilePath, "utf-8")
          .catch(() => "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n");

        const manifest = JSON.parse(manifestRaw) as RepoComponentManifest;
        if (
          manifest.previewImage === "./preview.png" ||
          !manifest.previewImage
        ) {
          const previewPngPath = path.join(compDir, "preview.png");
          try {
            const pngBuf = await fs.readFile(previewPngPath);
            manifest.previewImage = `data:image/png;base64,${pngBuf.toString("base64")}`;
          } catch {
            // No preview.png on disk
          }
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
        if (manifest.previewImage?.startsWith("data:image/png;base64,")) {
          fileList.push("preview.png");
        }

        results.push({ manifest, files });
        indexEntries.push({
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
        });
      } catch {
        // Skip incomplete component directories
      }
    }
  } catch {
    // Directory doesn't exist yet
  }

  indexEntries.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return { components: results, indexEntries };
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

export async function GET() {
  try {
    const cwd = process.cwd();
    const [{ components, indexEntries }, gitInfo] = await Promise.all([
      readAllRepoComponents(cwd),
      getGitWorkspaceInfo(cwd),
    ]);

    const envGithubRepo = process.env.GITHUB_REPO?.trim() || "";
    const envGithubBranch = process.env.GITHUB_BRANCH?.trim() || "main";
    const hasGithubToken = Boolean(process.env.GITHUB_TOKEN?.trim());

    return NextResponse.json({
      success: true,
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
    });
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
  try {
    const cwd = process.cwd();
    const body = (await req.json()) as {
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
    };

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
    const writtenFilesForGithub: Array<{ path: string; content: string }> = [];
    const savedRecords: Array<{
      id: string;
      slug: string;
      repoPath: string;
      lastRepoSyncAt: number;
      writtenFiles: string[];
    }> = [];

    for (const item of itemsToSave) {
      const comp = item.component;
      const slug = toComponentSlug(
        comp.repoSlug || (comp.isBuiltIn ? comp.id : comp.name),
        comp.id
      );
      const compRelDir = `${COMPONENTS_DIR_REL}/${slug}`;
      const compAbsDir = path.join(cwd, compRelDir);
      await fs.mkdir(compAbsDir, { recursive: true });

      const componentTsx = comp.files["component.tsx"] || "";
      const defaultTsx =
        comp.files["default.tsx"] ?? comp.files["demo.tsx"] ?? "";
      const indexCss =
        comp.files["index.css"] ||
        "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n";

      let manifestPreviewRef = comp.previewImage;
      let previewPngBuffer: Buffer | null = null;
      if (comp.previewImage?.startsWith("data:image/png;base64,")) {
        const b64 = comp.previewImage.slice("data:image/png;base64,".length);
        previewPngBuffer = Buffer.from(b64, "base64");
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

      const writePromises: Promise<unknown>[] = [
        fs.writeFile(path.join(compAbsDir, "component.tsx"), componentTsx, "utf-8"),
        fs.writeFile(path.join(compAbsDir, "default.tsx"), defaultTsx, "utf-8"),
        fs.writeFile(path.join(compAbsDir, "index.css"), indexCss, "utf-8"),
        fs.writeFile(path.join(compAbsDir, "manifest.json"), manifestJson, "utf-8"),
      ];

      const writtenFilePaths = [
        `${compRelDir}/component.tsx`,
        `${compRelDir}/default.tsx`,
        `${compRelDir}/index.css`,
        `${compRelDir}/manifest.json`,
      ];

      if (previewPngBuffer) {
        writePromises.push(
          fs.writeFile(path.join(compAbsDir, "preview.png"), previewPngBuffer)
        );
        writtenFilePaths.push(`${compRelDir}/preview.png`);
      }

      await Promise.all(writePromises);

      writtenFilesForGithub.push(
        { path: `${compRelDir}/component.tsx`, content: componentTsx },
        { path: `${compRelDir}/default.tsx`, content: defaultTsx },
        { path: `${compRelDir}/index.css`, content: indexCss },
        { path: `${compRelDir}/manifest.json`, content: manifestJson }
      );

      savedRecords.push({
        id: comp.id,
        slug,
        repoPath: compRelDir,
        lastRepoSyncAt: now,
        writtenFiles: writtenFilePaths,
      });
    }

    // Rebuild master registry/index.json
    const { indexEntries } = await readAllRepoComponents(cwd);
    const indexContent = await writeRegistryIndexFile(cwd, indexEntries);
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
    if (body.commitToGit !== false) {
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

    if (body.pushToGithub && targetGithubRepo && targetGithubToken) {
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
}

export async function DELETE(req: NextRequest) {
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

    const compAbsDir = path.join(cwd, COMPONENTS_DIR_REL, target.manifest.slug);
    await fs.rm(compAbsDir, { recursive: true, force: true });

    const { indexEntries } = await readAllRepoComponents(cwd);
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
}
