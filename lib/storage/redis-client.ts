import fs from "fs";
import path from "path";
import { Redis } from "@upstash/redis";
import type {
  RepoComponentManifest,
  RepoSummaryComponent,
} from "@/lib/registry/server-registry";
import type { StudioFiles, UserComponent } from "@/lib/store/studio-store";
import { COMPONENTS_DIR_REL } from "@/lib/registry/server-registry";

interface RedisLikeClient {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: string): Promise<unknown>;
  del(key: string): Promise<unknown>;
  hset(key: string, kv: Record<string, string>): Promise<unknown>;
  hgetall<T extends Record<string, unknown> = Record<string, unknown>>(
    key: string
  ): Promise<T | null>;
  hdel(key: string, ...fields: string[]): Promise<unknown>;
}

const memoryKvStore = new Map<string, string>();
const memoryHashStore = new Map<string, Map<string, string>>();

const inMemoryRedisFallback: RedisLikeClient = {
  async get<T = unknown>(key: string): Promise<T | null> {
    const val = memoryKvStore.get(key);
    return (val !== undefined ? (val as unknown as T) : null);
  },
  async set(key: string, value: string): Promise<string> {
    memoryKvStore.set(key, value);
    return "OK";
  },
  async del(key: string): Promise<number> {
    return memoryKvStore.delete(key) ? 1 : 0;
  },
  async hset(key: string, kv: Record<string, string>): Promise<number> {
    let hash = memoryHashStore.get(key);
    if (!hash) {
      hash = new Map<string, string>();
      memoryHashStore.set(key, hash);
    }
    let added = 0;
    for (const [field, val] of Object.entries(kv)) {
      if (!hash.has(field)) added++;
      hash.set(field, val);
    }
    return added;
  },
  async hgetall<T extends Record<string, unknown> = Record<string, unknown>>(
    key: string
  ): Promise<T | null> {
    const hash = memoryHashStore.get(key);
    if (!hash || hash.size === 0) return null;
    const obj: Record<string, string> = {};
    for (const [k, v] of hash.entries()) {
      obj[k] = v;
    }
    return obj as unknown as T;
  },
  async hdel(key: string, ...fields: string[]): Promise<number> {
    const hash = memoryHashStore.get(key);
    if (!hash) return 0;
    let removed = 0;
    for (const f of fields) {
      if (hash.delete(f)) removed++;
    }
    return removed;
  },
};

let redisInstance: RedisLikeClient | null = null;
let redisInitialized = false;

export function getRedisClient(): RedisLikeClient | null {
  if (redisInitialized) {
    return redisInstance;
  }

  let url =
    process.env.KV_REST_API_URL?.trim() ||
    process.env.UPSTASH_REDIS_REST_URL?.trim();
  let token =
    process.env.KV_REST_API_TOKEN?.trim() ||
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  // If running in local CLI or tests without preloaded .env.local, attempt graceful loading
  if ((!url || !token) && typeof process !== "undefined" && typeof process.cwd === "function") {
    try {
      const envPath = path.join(process.cwd(), ".env.local");
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8") as string;
        for (const line of content.split("\n")) {
          const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (match) {
            const k = match[1];
            let v = (match[2] || "").trim();
            if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
            if (!process.env[k]) process.env[k] = v;
          }
        }
        url =
          process.env.KV_REST_API_URL?.trim() ||
          process.env.UPSTASH_REDIS_REST_URL?.trim();
        token =
          process.env.KV_REST_API_TOKEN?.trim() ||
          process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
      }
    } catch {
      // ignore
    }
  }

  if (url && token) {
    try {
      redisInstance = new Redis({
        url,
        token,
      });
    } catch (err) {
      console.warn("[Redis] Failed to initialize Upstash Redis client, using in-memory fallback:", err);
      redisInstance = inMemoryRedisFallback;
    }
  } else {
    redisInstance = inMemoryRedisFallback;
  }

  redisInitialized = true;
  return redisInstance;
}

export function isRedisConfigured(): boolean {
  return Boolean(getRedisClient());
}

export interface RedisComponentRecord {
  manifest: RepoComponentManifest;
  files: StudioFiles;
  savedAt: number;
}

const REDIS_COMPONENT_KEY_PREFIX = "cp:comp:";
const REDIS_SUMMARIES_HASH = "cp:summaries";

/**
 * Save component draft to Upstash Redis.
 */
export async function saveRedisComponent(
  slug: string,
  manifest: RepoComponentManifest,
  files: StudioFiles
): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;

  const now = Date.now();
  const record: RedisComponentRecord = {
    manifest: {
      ...manifest,
      slug,
      id: manifest.id || slug,
      updatedAt: manifest.updatedAt || now,
      lastRepoSyncAt: manifest.lastRepoSyncAt || now,
    },
    files: {
      "component.tsx": files["component.tsx"] || "",
      "default.tsx": files["default.tsx"] || files["demo.tsx"] || "",
      "demo.tsx": files["demo.tsx"] || files["default.tsx"] || "",
      "index.css": files["index.css"] || "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n",
    },
    savedAt: now,
  };

  const summary: RepoSummaryComponent = {
    id: record.manifest.id,
    repoSlug: slug,
    repoPath: `${COMPONENTS_DIR_REL}/${slug}`,
    name: record.manifest.name,
    description: record.manifest.description || "",
    category: record.manifest.category || "Custom",
    isBuiltIn: false,
    createdAt: record.manifest.createdAt || now,
    updatedAt: record.manifest.updatedAt || now,
    lastRepoSyncAt: record.manifest.lastRepoSyncAt || now,
    dependencies: record.manifest.dependencies || [],
    previewImage: record.manifest.previewImage,
    filesLoaded: true,
  };

  try {
    await Promise.all([
      redis.set(`${REDIS_COMPONENT_KEY_PREFIX}${slug}`, JSON.stringify(record)),
      redis.hset(REDIS_SUMMARIES_HASH, {
        [slug]: JSON.stringify(summary),
      }),
    ]);
    return true;
  } catch (err) {
    console.error(`[Redis] Error saving component ${slug}:`, err);
    return false;
  }
}

/**
 * Read component from Upstash Redis by slug.
 */
export async function getRedisComponent(
  slugOrId: string
): Promise<{
  manifest: RepoComponentManifest;
  files: StudioFiles;
  component: UserComponent;
} | null> {
  const redis = getRedisClient();
  if (!redis || !slugOrId) return null;

  try {
    // 1. Direct slug fetch
    let raw = await redis.get<string | RedisComponentRecord>(
      `${REDIS_COMPONENT_KEY_PREFIX}${slugOrId}`
    );

    // 2. If not found directly, check summaries hash in case slugOrId is an id
    if (!raw) {
      const summaries = await listRedisSummaries();
      const matched = summaries.find(
        (s) => s.id === slugOrId || s.repoSlug === slugOrId
      );
      if (matched) {
        raw = await redis.get<string | RedisComponentRecord>(
          `${REDIS_COMPONENT_KEY_PREFIX}${matched.repoSlug}`
        );
      }
    }

    if (!raw) return null;

    const record: RedisComponentRecord =
      typeof raw === "string" ? JSON.parse(raw) : raw;

    const manifest = record.manifest;
    const files = record.files;

    const component: UserComponent = {
      id: manifest.id,
      name: manifest.name,
      description: manifest.description || "",
      category: manifest.category || "Custom",
      isBuiltIn: false,
      createdAt: manifest.createdAt || Date.now(),
      updatedAt: manifest.updatedAt || Date.now(),
      files: {
        "component.tsx": files["component.tsx"] || "",
        "default.tsx": files["default.tsx"] || files["demo.tsx"] || "",
        "demo.tsx": files["demo.tsx"] || files["default.tsx"] || "",
        "index.css": files["index.css"] || "",
      },
      dependencies: manifest.dependencies || [],
      previewImage: manifest.previewImage,
      repoSlug: manifest.slug,
      repoPath: `${COMPONENTS_DIR_REL}/${manifest.slug}`,
      lastRepoSyncAt: manifest.lastRepoSyncAt,
      lastCommitSha: manifest.lastCommitSha,
      lastCommitUrl: manifest.lastCommitUrl,
      filesLoaded: true,
    };

    return { manifest, files, component };
  } catch (err) {
    console.warn(`[Redis] Error reading component ${slugOrId}:`, err);
    return null;
  }
}

/**
 * List all component summaries stored in Upstash Redis.
 */
export async function listRedisSummaries(): Promise<RepoSummaryComponent[]> {
  const redis = getRedisClient();
  if (!redis) return [];

  try {
    const rawMap = await redis.hgetall<Record<string, string | RepoSummaryComponent>>(
      REDIS_SUMMARIES_HASH
    );
    if (!rawMap) return [];

    const summaries: RepoSummaryComponent[] = [];
    for (const val of Object.values(rawMap)) {
      if (val) {
        const item: RepoSummaryComponent =
          typeof val === "string" ? JSON.parse(val) : val;
        summaries.push(item);
      }
    }

    return summaries.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  } catch (err) {
    console.warn("[Redis] Error listing summaries from Upstash Redis:", err);
    return [];
  }
}

/**
 * Delete a component from Upstash Redis.
 */
export async function deleteRedisComponent(
  slug: string,
  componentId?: string
): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis || (!slug && !componentId)) return false;

  try {
    const slugsToDelete = new Set<string>();
    if (slug) slugsToDelete.add(slug);

    if (componentId) {
      const summaries = await listRedisSummaries();
      for (const s of summaries) {
        if (s.id === componentId || s.repoSlug === slug) {
          slugsToDelete.add(s.repoSlug);
        }
      }
    }

    const keys = Array.from(slugsToDelete).filter(Boolean);
    if (keys.length === 0) return false;

    await Promise.all([
      ...keys.map((k) => redis.del(`${REDIS_COMPONENT_KEY_PREFIX}${k}`)),
      redis.hdel(REDIS_SUMMARIES_HASH, ...keys),
    ]);
    return true;
  } catch (err) {
    console.warn(`[Redis] Error deleting component ${slug || componentId}:`, err);
    return false;
  }
}
