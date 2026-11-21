import { describe, it, expect, afterAll } from "bun:test";
import { ComponentRegistryService } from "@/lib/mcp/component-service";
import fs from "fs/promises";
import path from "path";

describe("ComponentRegistryService (MCP Core Service)", () => {
  const service = new ComponentRegistryService();
  const testSlug = "mcp-test-aurora-card";

  afterAll(async () => {
    // Cleanup test component if left behind
    try {
      await service.deleteComponent({ slug: testSlug, confirm: true });
    } catch {
      // ignore
    }
  });

  it("should create a new component with valid files and index entry", async () => {
    const result = await service.createComponent({
      name: "MCP Test Aurora Card",
      slug: testSlug,
      category: "Cards",
      description: "A test card generated through MCP with gradient aura.",
      componentCode: `export function McpAuroraCard() { return <div className="p-4 bg-black text-white">Aurora</div>; }`,
      defaultCode: `import { McpAuroraCard } from "./component";\nexport default function Demo() { return <McpAuroraCard />; }`,
      dependencies: ["framer-motion"],
      css: ".mcp-aurora { backdrop-filter: blur(8px); }",
    });

    expect(result.success).toBe(true);
    expect(result.slug).toBe(testSlug);
    expect(result.studioUrl).toBe(`/studio/${testSlug}`);
    expect(result.filesCreated).toContain("component.tsx");
    expect(result.filesCreated).toContain("default.tsx");
    expect(result.filesCreated).toContain("manifest.json");

    // Verify files on disk
    const compDir = path.join(process.cwd(), "registry", "components", testSlug);
    const compExists = await fs.stat(path.join(compDir, "component.tsx")).then(() => true).catch(() => false);
    const defaultExists = await fs.stat(path.join(compDir, "default.tsx")).then(() => true).catch(() => false);
    const manifestExists = await fs.stat(path.join(compDir, "manifest.json")).then(() => true).catch(() => false);

    expect(compExists).toBe(true);
    expect(defaultExists).toBe(true);
    expect(manifestExists).toBe(true);
  });

  it("should fetch the newly created component via getComponent", async () => {
    const result = await service.getComponent({ slug: testSlug });

    expect(result).not.toBeNull();
    expect(result.slug).toBe(testSlug);
    expect(result.manifest.name).toBe("MCP Test Aurora Card");
    expect(result.files["component.tsx"]).toContain("export function McpAuroraCard");
    expect(result.files["default.tsx"]).toContain("export default function Demo");
    expect(result.manifest.dependencies).toContain("framer-motion");
  });

  it("should list the component in listComponents with search and category filtering", async () => {
    const listByCategory = await service.listComponents({ category: "Cards" });
    expect(listByCategory.components.some((c) => c.slug === testSlug)).toBe(true);

    const listBySearch = await service.listComponents({ search: "Aurora Card" });
    expect(listBySearch.components.some((c) => c.slug === testSlug)).toBe(true);
  });

  it("should safely update the component via updateComponent", async () => {
    const updateResult = await service.updateComponent({
      slug: testSlug,
      description: "Updated description via MCP",
      componentCode: `export function McpAuroraCard() { return <div className="p-6 bg-slate-900 text-white">Updated Aurora</div>; }`,
    });

    expect(updateResult.success).toBe(true);

    const fetched = await service.getComponent({ slug: testSlug });
    expect(fetched.manifest.description).toBe("Updated description via MCP");
    expect(fetched.files["component.tsx"]).toContain("Updated Aurora");
  });

  it("should reject path traversal in slug", async () => {
    await expect(
      service.createComponent({
        name: "Malicious Traversal",
        slug: "../../escaped-dir",
        category: "Exploit",
        description: "Bad",
        componentCode: "code",
        defaultCode: "demo",
      })
    ).rejects.toThrow();
  });

  it("should delete the component and clean up index via deleteComponent", async () => {
    const deleteResult = await service.deleteComponent({
      slug: testSlug,
      confirm: true,
    });

    expect(deleteResult.success).toBe(true);
    expect(deleteResult.deleted).toBe(true);

    // Verify directory is removed
    const compDir = path.join(process.cwd(), "registry", "components", testSlug);
    const compExists = await fs.stat(compDir).then(() => true).catch(() => false);
    expect(compExists).toBe(false);

    // Verify index no longer contains slug
    const listAfter = await service.listComponents({ search: testSlug });
    expect(listAfter.components.some((c) => c.slug === testSlug)).toBe(false);
  });
});
