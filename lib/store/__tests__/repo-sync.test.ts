import { describe, it, expect } from "bun:test";
import { NextRequest } from "next/server";
import { GET, POST, toComponentSlug } from "@/app/api/repo-sync/route";
import { DEFAULT_TEMPLATES } from "@/lib/sandbox/default-templates";
import { DEFAULT_TEMPLATE_PREVIEWS } from "@/lib/store/studio-store";

describe("Project Repository & GitHub Component Persistence (/api/repo-sync)", () => {
  it("normalizes component names and IDs into clean repository slugs", () => {
    expect(toComponentSlug("Interactive Neon Button")).toBe(
      "interactive-neon-button"
    );
    expect(toComponentSlug("InkOrbitHero")).toBe("ink-orbit-hero");
  });

  it("saves all default workspace components into registry/components/ and reads them back via GET", async () => {
    const items = DEFAULT_TEMPLATES.map((t) => ({
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

    const postReq = new NextRequest("http://localhost:3000/api/repo-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    expect(postJson.savedCount).toBe(DEFAULT_TEMPLATES.length);
    expect(postJson.totalRepoComponents).toBeGreaterThanOrEqual(
      DEFAULT_TEMPLATES.length
    );

    const getRes = await GET();
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
      DEFAULT_TEMPLATES.length
    );
    const inkOrbit = getJson.components.find(
      (c) => c.manifest.id === "ink-orbit-hero"
    );
    expect(inkOrbit).toBeDefined();
    expect(inkOrbit?.files["component.tsx"].length).toBeGreaterThan(50);
  });
});
