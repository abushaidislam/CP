import { describe, it, expect, afterAll } from "bun:test";
import { componentRegistryService } from "@/lib/mcp/component-service";

describe("MCP AI Version Control & Checkpoint Engine", () => {
  const testSlug = "test-ai-versioning-card";

  afterAll(async () => {
    try {
      await componentRegistryService.deleteComponent({ slug: testSlug, confirm: true });
    } catch {
      // ignore
    }
  });

  it("should create component and initialize version v1 in checkpoints", async () => {
    const created = await componentRegistryService.createComponent({
      name: "Test AI Versioning Card",
      slug: testSlug,
      componentCode: `export function VersionCard() { return <div>Version 1 Content</div>; }`,
      defaultCode: `import { VersionCard } from "./component"; export default function Demo() { return <VersionCard />; }`,
      category: "Card",
      description: "Initial AI component",
    });

    expect(created.success).toBe(true);
    expect(created.slug).toBe(testSlug);

    // List versions to verify v1
    const listRes = await componentRegistryService.manageVersions({
      slug: testSlug,
      action: "list",
    });

    expect(listRes.success).toBe(true);
    expect(listRes.totalVersions).toBe(1);
    expect(listRes.activeVersion).toBe("v1");
    expect(listRes.versions?.[0].id).toBe("v1");
  });

  it("should update component, auto-increment to v2, and preserve v1 in history", async () => {
    const updated = await componentRegistryService.updateComponent({
      slug: testSlug,
      componentCode: `export function VersionCard() { return <div>Version 2 with Glow Effect</div>; }`,
      changeMessage: "Added glow effect and border",
    });

    expect(updated.success).toBe(true);
    expect(updated.version).toBe("v2");
    expect(updated.totalVersions).toBe(2);

    const listRes = await componentRegistryService.manageVersions({
      slug: testSlug,
      action: "list",
    });

    expect(listRes.totalVersions).toBe(2);
    expect(listRes.activeVersion).toBe("v2");
    expect(listRes.versions?.some((v) => v.id === "v1")).toBe(true);
    expect(listRes.versions?.some((v) => v.id === "v2")).toBe(true);
  });

  it("should update component targeting a past baseVersion (v1) and create v3", async () => {
    const updated = await componentRegistryService.updateComponent({
      slug: testSlug,
      baseVersion: "v1",
      componentCode: `export function VersionCard() { return <div>Version 3 Based on V1 Clean Style</div>; }`,
      changeMessage: "Restyled based on v1 minimalist aesthetic",
    });

    expect(updated.success).toBe(true);
    expect(updated.version).toBe("v3");
    expect(updated.totalVersions).toBe(3);

    const listRes = await componentRegistryService.manageVersions({
      slug: testSlug,
      action: "list",
    });

    expect(listRes.totalVersions).toBe(3);
    expect(listRes.activeVersion).toBe("v3");
  });

  it("should restore a previous version (v1) and verify active code restoration", async () => {
    const restoreRes = await componentRegistryService.manageVersions({
      slug: testSlug,
      action: "restore",
      targetVersion: "v1",
    });

    expect(restoreRes.success).toBe(true);
    expect(restoreRes.restoredVersion).toBe("v1");
    expect(restoreRes.activeVersion).toBe("v4");

    const activeComp = await componentRegistryService.getComponent({ slug: testSlug });
    expect(activeComp.files["component.tsx"]).toContain("Version 1 Content");
  });

  it("should prune/delete older versions (v1, v2) when requested by user prompt", async () => {
    const deleteRes = await componentRegistryService.manageVersions({
      slug: testSlug,
      action: "delete",
      versionIds: ["v1", "v2"],
    });

    expect(deleteRes.success).toBe(true);
    expect(deleteRes.deletedVersions).toEqual(["v1", "v2"]);

    const listRes = await componentRegistryService.manageVersions({
      slug: testSlug,
      action: "list",
    });

    expect(listRes.versions?.some((v) => v.id === "v1")).toBe(false);
    expect(listRes.versions?.some((v) => v.id === "v2")).toBe(false);
    expect(listRes.totalVersions).toBe(2); // v3 and v4 remain
  });
});
