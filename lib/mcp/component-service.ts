import fs from "fs/promises";
import path from "path";
import {
  toComponentSlug,
  resolveSafeComponentDir,
  readRegistrySummaries,
  readSingleRepoComponent,
  INDEX_FILE_REL,
  COMPONENTS_DIR_REL,
  REGISTRY_ROOT_REL,
  type RepoComponentManifest,
  type RepoIndexEntry,
} from "@/lib/registry/server-registry";
import {
  createComponentSchema,
  updateComponentSchema,
  getComponentSchema,
  listComponentsSchema,
  deleteComponentSchema,
  type CreateComponentInput,
  type UpdateComponentInput,
  type GetComponentInput,
  type ListComponentsInput,
  type DeleteComponentInput,
} from "./schemas";

let repoWriteMutex: Promise<unknown> = Promise.resolve();

function withWriteLock<T>(task: () => Promise<T>): Promise<T> {
  const next = repoWriteMutex.then(task, task);
  repoWriteMutex = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

export class ComponentRegistryService {
  private cwd: string;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
  }

  private async readIndexFile(): Promise<RepoIndexEntry[]> {
    const indexPath = path.join(this.cwd, INDEX_FILE_REL);
    try {
      const raw = await fs.readFile(indexPath, "utf-8");
      const parsed = JSON.parse(raw) as { components?: RepoIndexEntry[] };
      return Array.isArray(parsed.components) ? parsed.components : [];
    } catch {
      return [];
    }
  }

  private async writeIndexFile(entries: RepoIndexEntry[]): Promise<void> {
    const registryDir = path.join(this.cwd, REGISTRY_ROOT_REL);
    await fs.mkdir(registryDir, { recursive: true });
    const indexPath = path.join(this.cwd, INDEX_FILE_REL);

    const sorted = [...entries].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    const payload = {
      schemaVersion: "1.0.0",
      updatedAt: new Date().toISOString(),
      totalComponents: sorted.length,
      components: sorted,
    };

    await fs.writeFile(indexPath, JSON.stringify(payload, null, 2) + "\n", "utf-8");
  }

  private validateSafeSlug(rawSlug: string): string {
    if (!rawSlug || typeof rawSlug !== "string") {
      throw new Error("Slug must be a non-empty string.");
    }
    if (
      rawSlug.includes("..") ||
      rawSlug.includes("/") ||
      rawSlug.includes("\\") ||
      rawSlug.startsWith(".")
    ) {
      throw new Error(`Invalid slug "${rawSlug}": directory traversal characters are strictly prohibited.`);
    }
    const cleanSlug = toComponentSlug(rawSlug);
    if (!cleanSlug) {
      throw new Error(`Could not generate a valid slug from "${rawSlug}".`);
    }
    return cleanSlug;
  }

  async createComponent(rawInput: CreateComponentInput): Promise<{
    success: boolean;
    slug: string;
    studioUrl: string;
    filesCreated: string[];
    message: string;
  }> {
    const input = createComponentSchema.parse(rawInput);
    const slug = input.slug ? this.validateSafeSlug(input.slug) : toComponentSlug(input.name);

    return withWriteLock(async () => {
      const compDir = resolveSafeComponentDir(this.cwd, slug);
      await fs.mkdir(compDir, { recursive: true });

      const now = Date.now();
      const filesCreated: string[] = ["component.tsx", "default.tsx", "manifest.json"];

      const manifest: RepoComponentManifest = {
        id: slug,
        slug,
        name: input.name,
        description: input.description || "",
        category: input.category || "Custom",
        isBuiltIn: false,
        createdAt: now,
        updatedAt: now,
        lastRepoSyncAt: now,
        dependencies: input.dependencies || [],
      };

      const defaultCss = "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n";
      const finalCss = input.css?.trim() || defaultCss;

      await Promise.all([
        fs.writeFile(path.join(compDir, "component.tsx"), input.componentCode, "utf-8"),
        fs.writeFile(path.join(compDir, "default.tsx"), input.defaultCode, "utf-8"),
        fs.writeFile(path.join(compDir, "index.css"), finalCss, "utf-8"),
        fs.writeFile(path.join(compDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf-8"),
      ]);

      if (input.css?.trim()) {
        filesCreated.push("index.css");
      }

      // Update registry/index.json
      const entries = await this.readIndexFile();
      const existingIdx = entries.findIndex((e) => e.slug === slug || e.id === slug);

      const newEntry: RepoIndexEntry = {
        id: slug,
        slug,
        name: input.name,
        description: input.description || "",
        category: input.category || "Custom",
        isBuiltIn: false,
        updatedAt: now,
        lastRepoSyncAt: now,
        path: `${COMPONENTS_DIR_REL}/${slug}`,
        files: filesCreated,
        dependencies: input.dependencies || [],
      };

      if (existingIdx >= 0) {
        entries[existingIdx] = newEntry;
      } else {
        entries.push(newEntry);
      }

      await this.writeIndexFile(entries);

      return {
        success: true,
        slug,
        studioUrl: `/studio/${slug}`,
        filesCreated,
        message: `Component "${input.name}" (${slug}) successfully created in Component Studio registry.`,
      };
    });
  }

  async getComponent(rawInput: GetComponentInput): Promise<{
    slug: string;
    manifest: RepoComponentManifest;
    files: {
      "component.tsx": string;
      "default.tsx": string;
      "index.css": string;
    };
    studioUrl: string;
  }> {
    const input = getComponentSchema.parse(rawInput);
    const safeSlug = this.validateSafeSlug(input.slug);
    const resolved = await readSingleRepoComponent(safeSlug, this.cwd);

    if (!resolved) {
      throw new Error(`Component with slug or ID "${input.slug}" not found in registry.`);
    }

    return {
      slug: resolved.manifest.slug,
      manifest: resolved.manifest,
      files: {
        "component.tsx": resolved.files["component.tsx"] || "",
        "default.tsx": resolved.files["default.tsx"] || "",
        "index.css": resolved.files["index.css"] || "",
      },
      studioUrl: `/studio/${resolved.manifest.slug}`,
    };
  }

  async listComponents(rawInput: ListComponentsInput = {}): Promise<{
    total: number;
    components: Array<{
      id: string;
      slug: string;
      name: string;
      category: string;
      description: string;
      dependencies: string[];
      previewImage?: string;
    }>;
  }> {
    const input = listComponentsSchema.parse(rawInput);
    const { summaries } = await readRegistrySummaries(this.cwd);

    let filtered = summaries;

    if (input.category) {
      const catLower = input.category.toLowerCase();
      filtered = filtered.filter((c) => c.category.toLowerCase() === catLower);
    }

    if (input.search) {
      const qLower = input.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(qLower) ||
          c.repoSlug.toLowerCase().includes(qLower) ||
          c.description.toLowerCase().includes(qLower)
      );
    }

    const limit = input.limit || 50;
    const paginated = filtered.slice(0, limit);

    return {
      total: filtered.length,
      components: paginated.map((c) => ({
        id: c.id,
        slug: c.repoSlug,
        name: c.name,
        category: c.category,
        description: c.description,
        dependencies: c.dependencies,
        previewImage: c.previewImage,
      })),
    };
  }

  async updateComponent(rawInput: UpdateComponentInput): Promise<{
    success: boolean;
    slug: string;
    updatedAt: number;
    message: string;
  }> {
    const input = updateComponentSchema.parse(rawInput);
    const slug = this.validateSafeSlug(input.slug);

    return withWriteLock(async () => {
      const compDir = resolveSafeComponentDir(this.cwd, slug);
      const manifestPath = path.join(compDir, "manifest.json");

      let manifest: RepoComponentManifest;
      try {
        const raw = await fs.readFile(manifestPath, "utf-8");
        manifest = JSON.parse(raw) as RepoComponentManifest;
      } catch {
        throw new Error(`Cannot update: component "${slug}" does not exist in registry.`);
      }

      const now = Date.now();
      manifest.updatedAt = now;
      manifest.lastRepoSyncAt = now;

      if (input.name) manifest.name = input.name;
      if (input.description !== undefined) manifest.description = input.description;
      if (input.category) manifest.category = input.category;
      if (input.dependencies) manifest.dependencies = input.dependencies;

      const fileWritePromises: Promise<void>[] = [
        fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf-8"),
      ];

      if (input.componentCode !== undefined) {
        fileWritePromises.push(
          fs.writeFile(path.join(compDir, "component.tsx"), input.componentCode, "utf-8")
        );
      }

      if (input.defaultCode !== undefined) {
        fileWritePromises.push(
          fs.writeFile(path.join(compDir, "default.tsx"), input.defaultCode, "utf-8")
        );
      }

      if (input.css !== undefined) {
        fileWritePromises.push(
          fs.writeFile(path.join(compDir, "index.css"), input.css, "utf-8")
        );
      }

      await Promise.all(fileWritePromises);

      // Update registry/index.json
      const entries = await this.readIndexFile();
      const existingIdx = entries.findIndex((e) => e.slug === slug || e.id === slug);
      if (existingIdx >= 0) {
        entries[existingIdx].updatedAt = now;
        entries[existingIdx].lastRepoSyncAt = now;
        if (input.name) entries[existingIdx].name = input.name;
        if (input.description !== undefined) entries[existingIdx].description = input.description;
        if (input.category) entries[existingIdx].category = input.category;
        if (input.dependencies) entries[existingIdx].dependencies = input.dependencies;
        await this.writeIndexFile(entries);
      }

      return {
        success: true,
        slug,
        updatedAt: now,
        message: `Component "${slug}" successfully updated in registry.`,
      };
    });
  }

  async deleteComponent(rawInput: DeleteComponentInput): Promise<{
    success: boolean;
    deleted: boolean;
    slug: string;
    message: string;
  }> {
    const input = deleteComponentSchema.parse(rawInput);
    if (!input.confirm) {
      throw new Error(`Deletion of component "${input.slug}" cancelled: confirm flag must be true.`);
    }

    const slug = this.validateSafeSlug(input.slug);

    return withWriteLock(async () => {
      const compDir = resolveSafeComponentDir(this.cwd, slug);

      try {
        await fs.rm(compDir, { recursive: true, force: true });
      } catch {
        // if directory doesn't exist, proceed to clean index
      }

      const entries = await this.readIndexFile();
      const updatedEntries = entries.filter((e) => e.slug !== slug && e.id !== slug);
      await this.writeIndexFile(updatedEntries);

      return {
        success: true,
        deleted: true,
        slug,
        message: `Component "${slug}" successfully deleted from registry.`,
      };
    });
  }
}

export const componentRegistryService = new ComponentRegistryService();
