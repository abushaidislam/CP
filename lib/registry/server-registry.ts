import fs from "fs/promises";
import path from "path";
import type {
  ComponentVariant,
  StudioFiles,
  UserComponent,
} from "@/lib/store/studio-store";

export const REGISTRY_ROOT_REL = "registry";
export const COMPONENTS_DIR_REL = "registry/components";
export const INDEX_FILE_REL = "registry/index.json";

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

export interface RepoSummaryComponent {
  id: string;
  repoSlug: string;
  repoPath: string;
  name: string;
  description: string;
  category: string;
  isBuiltIn?: boolean;
  createdAt: number;
  updatedAt: number;
  lastRepoSyncAt: number;
  dependencies: string[];
  previewImage?: string;
  filesLoaded: boolean;
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

export function resolveSafeComponentDir(cwd: string, slug: string): string {
  const cleanSlug = toComponentSlug(slug);
  if (
    !cleanSlug ||
    cleanSlug.includes("..") ||
    cleanSlug.includes("/") ||
    cleanSlug.includes("\\")
  ) {
    throw new Error(`Invalid component slug: ${slug}`);
  }
  const componentsRoot = path.resolve(cwd, COMPONENTS_DIR_REL);
  const targetDir = path.resolve(componentsRoot, cleanSlug);
  if (
    targetDir === componentsRoot ||
    !targetDir.startsWith(componentsRoot + path.sep)
  ) {
    throw new Error(`Resolved component path escapes registry root: ${slug}`);
  }
  return targetDir;
}

export function buildPreviewImageUrl(slug: string, version?: number): string {
  const safeSlug = encodeURIComponent(slug);
  const v = version && Number.isFinite(version) ? Math.floor(version) : 1;
  return `/api/repo-sync/preview/${safeSlug}?v=${v}`;
}

async function hasNonEmptyFile(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile() && stat.size > 0;
  } catch {
    return false;
  }
}

/**
 * Fast summary reader backed directly by registry/index.json (~30 KB)
 * Avoids reading 55 component directories and 6+ MB of base64 PNGs on initial Hub load.
 */
export async function readRegistrySummaries(
  cwd: string = process.cwd()
): Promise<{
  summaries: RepoSummaryComponent[];
  indexEntries: RepoIndexEntry[];
}> {
  const indexPath = path.join(cwd, INDEX_FILE_REL);
  try {
    const raw = await fs.readFile(indexPath, "utf-8");
    const parsed = JSON.parse(raw) as {
      components?: RepoIndexEntry[];
    };
    const entries = Array.isArray(parsed.components) ? parsed.components : [];
    const sorted = [...entries].sort(
      (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
    );

    const summaries: RepoSummaryComponent[] = sorted.map((entry) => {
      const hasPng =
        Array.isArray(entry.files) && entry.files.includes("preview.png");
      const versionStamp = entry.lastRepoSyncAt || entry.updatedAt || 1;
      return {
        id: entry.id,
        repoSlug: entry.slug,
        repoPath: entry.path || `${COMPONENTS_DIR_REL}/${entry.slug}`,
        name: entry.name,
        description: entry.description || "",
        category: entry.category || "Custom",
        isBuiltIn: entry.isBuiltIn,
        createdAt: entry.updatedAt || Date.now(),
        updatedAt: entry.updatedAt || Date.now(),
        lastRepoSyncAt: entry.lastRepoSyncAt || entry.updatedAt || Date.now(),
        dependencies: Array.isArray(entry.dependencies)
          ? entry.dependencies
          : [],
        previewImage: hasPng
          ? buildPreviewImageUrl(entry.slug, versionStamp)
          : undefined,
        filesLoaded: false,
      };
    });

    return { summaries, indexEntries: sorted };
  } catch {
    return { summaries: [], indexEntries: [] };
  }
}

/**
 * Reads a single component's full source files + manifest by ID or slug in ~1-2ms.
 * Uses binary preview URL instead of inline base64 PNG.
 */
export async function readSingleRepoComponent(
  idOrSlug: string,
  cwd: string = process.cwd()
): Promise<{
  manifest: RepoComponentManifest;
  files: StudioFiles;
  component: UserComponent;
} | null> {
  if (!idOrSlug || typeof idOrSlug !== "string") return null;

  // 1. Resolve slug via registry/index.json first (fast O(N) lookup over 30KB JSON)
  const { indexEntries } = await readRegistrySummaries(cwd);
  const matchedEntry = indexEntries.find(
    (entry) => entry.id === idOrSlug || entry.slug === idOrSlug
  );
  const candidateSlug = matchedEntry?.slug || toComponentSlug(idOrSlug);

  let compDir: string;
  try {
    compDir = resolveSafeComponentDir(cwd, candidateSlug);
  } catch {
    return null;
  }

  try {
    const manifestPath = path.join(compDir, "manifest.json");
    const compFilePath = path.join(compDir, "component.tsx");
    const defaultFilePath = path.join(compDir, "default.tsx");
    const cssFilePath = path.join(compDir, "index.css");
    const previewPngPath = path.join(compDir, "preview.png");

    const [manifestRaw, componentTsx, defaultTsx, indexCss, hasPreviewPng] =
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
        hasNonEmptyFile(previewPngPath),
      ]);

    const manifest = JSON.parse(manifestRaw) as RepoComponentManifest;
    const slug = manifest.slug || candidateSlug;
    const versionStamp = manifest.lastRepoSyncAt || manifest.updatedAt || 1;

    if (
      hasPreviewPng &&
      (!manifest.previewImage ||
        manifest.previewImage === "./preview.png" ||
        manifest.previewImage.startsWith("/api/repo-sync/preview/"))
    ) {
      manifest.previewImage = buildPreviewImageUrl(slug, versionStamp);
    }

    const files: StudioFiles = {
      "component.tsx": componentTsx,
      "default.tsx": defaultTsx,
      "demo.tsx": defaultTsx,
      "index.css": indexCss,
    };

    const component: UserComponent = {
      id: manifest.id,
      name: manifest.name,
      description: manifest.description || "",
      category: manifest.category || "Custom",
      isBuiltIn: manifest.isBuiltIn,
      createdAt: manifest.createdAt || Date.now(),
      updatedAt: manifest.updatedAt || Date.now(),
      files,
      dependencies: manifest.dependencies || [],
      previewImage: manifest.previewImage,
      repoSlug: slug,
      repoPath: `${COMPONENTS_DIR_REL}/${slug}`,
      lastRepoSyncAt: manifest.lastRepoSyncAt,
      lastCommitSha: manifest.lastCommitSha,
      lastCommitUrl: manifest.lastCommitUrl,
      filesLoaded: true,
    };

    return { manifest, files, component };
  } catch {
    return null;
  }
}
