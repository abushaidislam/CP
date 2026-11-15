import { describe, it, expect } from "bun:test";
import { NextRequest } from "next/server";
import { GET, POST, DELETE, toComponentSlug } from "@/app/api/repo-sync/route";
import { DEFAULT_TEMPLATES } from "@/lib/sandbox/default-templates";
import { DEFAULT_TEMPLATE_PREVIEWS } from "@/lib/store/studio-store";

describe("Project Repository & GitHub Component Persistence (/api/repo-sync)", () => {
  it("normalizes component names and IDs into clean repository slugs", () => {
    expect(toComponentSlug("Interactive Neon Button")).toBe(
      "interactive-neon-button"
    );
    expect(toComponentSlug("InkOrbitHero")).toBe("ink-orbit-hero");
  });

  it("saves workspace components into registry/components/ and reads them back via GET", async () => {
    const testSlug = "temp-sync-test-button";
    const items = [
      {
        component: {
          id: testSlug,
          name: "Temp Sync Test Button",
          description: "Temporary test button",
          category: "Buttons",
          isBuiltIn: false,
          createdAt: 1700000000000,
          updatedAt: 1700000000000,
          files: {
            "component.tsx": `"use client";\nimport React from "react";\nexport default function TestBtn() { return <button>Test</button>; }`,
            "default.tsx": `"use client";\nimport React from "react";\nexport default function Demo() { return <div>Demo</div>; }`,
            "demo.tsx": `"use client";\nimport React from "react";\nexport default function Demo() { return <div>Demo</div>; }`,
            "index.css": `@tailwind base;`,
          },
          dependencies: [],
          previewImage: DEFAULT_TEMPLATE_PREVIEWS["blank"],
        },
        variants: [],
      },
    ];

    const postReq = new NextRequest("http://localhost:3000/api/repo-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "sync_all",
        items,
        commitMessage: "feat(registry): test save temp component",
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
    expect(postJson.savedCount).toBe(1);
    expect(postJson.totalRepoComponents).toBeGreaterThanOrEqual(1);

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
    expect(getJson.totalComponents).toBeGreaterThanOrEqual(1);
    const testComp = getJson.components.find(
      (c) => c.manifest.slug === testSlug || c.manifest.id === testSlug
    );
    expect(testComp).toBeDefined();
    expect(testComp?.files["component.tsx"].length).toBeGreaterThan(10);

    // Clean up temporary test component
    const deleteReq = new NextRequest(`http://localhost:3000/api/repo-sync?slug=${testSlug}`, {
      method: "DELETE",
    });
    const deleteRes = await DELETE(deleteReq);
    expect(deleteRes.status).toBe(200);
  });
});
