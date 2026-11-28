import { describe, it, expect } from "bun:test";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { NextRequest } from "next/server";
import { GET, POST, toComponentSlug } from "@/app/api/repo-sync/route";
import { DEFAULT_TEMPLATES } from "@/lib/sandbox/default-templates";
import { DEFAULT_TEMPLATE_PREVIEWS } from "@/lib/store/studio-store";
import { createOwnerSessionToken } from "@/lib/security/api-guard";

describe("Project Repository & GitHub Component Persistence (/api/repo-sync)", () => {
  it("normalizes component names and IDs into clean repository slugs", () => {
    expect(toComponentSlug("Interactive Neon Button")).toBe(
      "interactive-neon-button"
    );
    expect(toComponentSlug("InkOrbitHero")).toBe("ink-orbit-hero");
  });

  it("rejects cross-origin or unauthenticated POST writes to /api/repo-sync", async () => {
    const evilPostReq = new NextRequest("http://localhost:3000/api/repo-sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3000",
        origin: "https://evil-attacker.example.com",
      },
      body: JSON.stringify({ action: "sync_all", items: [] }),
    });

    const evilRes = await POST(evilPostReq);
    expect(evilRes.status).toBe(403);
  });

  it("saves workspace components into an isolated registry directory and reads them back via summary, single, and full GET modes", async () => {
      const activeTemplates = DEFAULT_TEMPLATES.filter((t) =>
        ["ink-orbit-hero", "spotlight-card"].includes(t.id)
      );
      const items = activeTemplates.map((t) => ({
        component: {
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.category,
          isBuiltIn: true,
          createdAt: 1700000000000,
          updatedAt: 1700000000000,
          files: {
            "component.tsx": t.files["component.tsx"],
            "default.tsx": t.files["demo.tsx"],
            "demo.tsx": t.files["demo.tsx"],
            "index.css": t.files["index.css"],
          },
          dependencies: t.dependencies,
          previewImage: DEFAULT_TEMPLATE_PREVIEWS[t.id],
        },
        variants: [],
      }));

      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cp-repo-sync-"));
      const originalCwd = process.cwd;
      process.cwd = () => tmpDir;

      try {
        const ownerToken = createOwnerSessionToken();
        const postReq = new NextRequest("http://localhost:3000/api/repo-sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            host: "localhost:3000",
            origin: "http://localhost:3000",
            "x-studio-client": "component-studio",
            cookie: `studio_owner_session=${ownerToken}`,
          },
          body: JSON.stringify({
            action: "sync_all",
            items,
            commitMessage: "feat(registry): seed starter components in project repo",
            commitToGit: false,
            pushToGithub: false,
          }),
        });

        const postRes = await POST(postReq);
        const postJson = (await postRes.json()) as {
          success: boolean;
          savedCount: number;
          totalRepoComponents: number;
        };

        expect(postRes.status).toBe(200);
        expect(postJson.success).toBe(true);
        expect(postJson.savedCount).toBe(activeTemplates.length);
        expect(postJson.totalRepoComponents).toBeGreaterThanOrEqual(
          activeTemplates.length
        );

        // 1. Summary mode (lightweight hub payload)
        const summaryReq = new NextRequest(
          "http://localhost:3000/api/repo-sync?mode=summary"
        );
        const summaryRes = await GET(summaryReq);
        const summaryJson = (await summaryRes.json()) as {
          success: boolean;
          mode: string;
          totalComponents: number;
          summaries: Array<{ id: string; repoSlug: string; previewImage?: string }>;
        };
        expect(summaryRes.status).toBe(200);
        expect(summaryJson.success).toBe(true);
        expect(summaryJson.mode).toBe("summary");
        expect(summaryJson.totalComponents).toBeGreaterThanOrEqual(
          activeTemplates.length
        );
        const summaryInk = summaryJson.summaries.find(
          (s) => s.id === "ink-orbit-hero"
        );
        expect(summaryInk).toBeDefined();
        if (summaryInk?.previewImage) {
          expect(
            summaryInk.previewImage.startsWith("data:image/png;base64,")
          ).toBe(false);
        }

        // 2. Single-component mode (fast studio deep-link payload)
        const singleReq = new NextRequest(
          "http://localhost:3000/api/repo-sync?id=ink-orbit-hero"
        );
        const singleRes = await GET(singleReq);
        const singleJson = (await singleRes.json()) as {
          success: boolean;
          mode: string;
          component: {
            id: string;
            files: { "component.tsx": string; "default.tsx": string };
          };
        };
        expect(singleRes.status).toBe(200);
        expect(singleJson.success).toBe(true);
        expect(singleJson.mode).toBe("single");
        expect(singleJson.component.id).toBe("ink-orbit-hero");
        expect(
          singleJson.component.files["component.tsx"].length
        ).toBeGreaterThan(50);

        // 3. Legacy full mode
        const getRes = await GET(
          new NextRequest("http://localhost:3000/api/repo-sync")
        );
        const getJson = (await getRes.json()) as {
          success: boolean;
          totalComponents: number;
          components: Array<{
            manifest: { id: string; slug: string; name: string };
            files: { "component.tsx": string; "default.tsx": string };
          }>;
        };

        expect(getRes.status).toBe(200);
        expect(getJson.success).toBe(true);
        expect(getJson.totalComponents).toBeGreaterThanOrEqual(
          activeTemplates.length
        );
        const inkOrbit = getJson.components.find(
          (c) => c.manifest.id === "ink-orbit-hero"
        );
        expect(inkOrbit).toBeDefined();
        expect(inkOrbit?.files["component.tsx"].length).toBeGreaterThan(50);
      } finally {
        process.cwd = originalCwd;
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
  });
});
