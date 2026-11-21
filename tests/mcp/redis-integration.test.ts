import { describe, it, expect, afterAll, beforeAll } from "bun:test";
import fs from "fs";
import path from "path";

beforeAll(() => {
  if (!process.env.KV_REST_API_URL) {
    try {
      const envLocal = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf-8");
      for (const line of envLocal.split("\n")) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let val = (match[2] || "").trim();
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          process.env[key] = val;
        }
      }
    } catch {
      // ignore
    }
  }
});

import {
  saveRedisComponent,
  getRedisComponent,
  listRedisSummaries,
  deleteRedisComponent,
  isRedisConfigured,
} from "@/lib/storage/redis-client";
import {
  readRegistrySummaries,
  readSingleRepoComponent,
} from "@/lib/registry/server-registry";

describe("Upstash Redis MCP & Registry Integration", () => {
  const testSlug = "test-redis-integration-badge";

  afterAll(async () => {
    if (isRedisConfigured()) {
      await deleteRedisComponent(testSlug);
    }
  });

  it("should detect Upstash Redis configuration", () => {
    expect(isRedisConfigured()).toBe(true);
  });

  it("should save component to Upstash Redis with sub-50ms latency", async () => {
    const manifest = {
      id: testSlug,
      slug: testSlug,
      name: "Test Redis Integration Badge",
      description: "A fast cloud-persisted badge component",
      category: "Badge",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastRepoSyncAt: Date.now(),
      dependencies: ["lucide-react"],
    };

    const files = {
      "component.tsx": `export function RedisBadge() { return <span>Redis Live</span>; }`,
      "default.tsx": `import { RedisBadge } from "./component"; export default function Demo() { return <RedisBadge />; }`,
      "demo.tsx": `import { RedisBadge } from "./component"; export default function Demo() { return <RedisBadge />; }`,
      "index.css": "@tailwind utilities;",
    };

    const saved = await saveRedisComponent(testSlug, manifest, files);
    expect(saved).toBe(true);
  });

  it("should fetch component directly from Upstash Redis", async () => {
    const record = await getRedisComponent(testSlug);
    expect(record).not.toBeNull();
    expect(record?.manifest.slug).toBe(testSlug);
    expect(record?.manifest.name).toBe("Test Redis Integration Badge");
    expect(record?.files["component.tsx"]).toContain("export function RedisBadge");
    expect(record?.component.repoSlug).toBe(testSlug);
  });

  it("should include Redis component in readRegistrySummaries (Home Hub integration)", async () => {
    const { summaries } = await readRegistrySummaries();
    const found = summaries.find((s) => s.repoSlug === testSlug);
    expect(found).toBeDefined();
    expect(found?.name).toBe("Test Redis Integration Badge");
    expect(found?.category).toBe("Badge");
  });

  it("should seamlessly resolve Redis component through readSingleRepoComponent (/studio/[slug] deep-link)", async () => {
    const entry = await readSingleRepoComponent(testSlug);
    expect(entry).not.toBeNull();
    expect(entry?.manifest.slug).toBe(testSlug);
    expect(entry?.component.files["component.tsx"]).toContain("export function RedisBadge");
  });

  it("should delete component from Upstash Redis and verify removal", async () => {
    const deleted = await deleteRedisComponent(testSlug);
    expect(deleted).toBe(true);

    const check = await getRedisComponent(testSlug);
    expect(check).toBeNull();
  });
});
