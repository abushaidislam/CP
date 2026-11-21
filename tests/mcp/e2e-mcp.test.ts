import { describe, it, expect, afterAll } from "bun:test";
import { POST } from "@/app/api/mcp/route";
import { NextRequest } from "next/server";
import fs from "fs/promises";
import path from "path";

describe("End-to-End MCP Workflow", () => {
  const testSlug = "cosmic-glow-badge";

  afterAll(async () => {
    // Clean up created component
    const delReq = new NextRequest("http://localhost:3000/api/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 99,
        method: "tools/call",
        params: {
          name: "delete_component",
          arguments: { slug: testSlug, confirm: true },
        },
      }),
    });
    await POST(delReq);
  });

  it("should create a component through MCP JSON-RPC tools/call", async () => {
    const createReq = new NextRequest("http://localhost:3000/api/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 101,
        method: "tools/call",
        params: {
          name: "create_component",
          arguments: {
            name: "Cosmic Glow Badge",
            slug: testSlug,
            category: "Badges",
            description: "An animated cosmic badge with rotating aurora border gradient and micro-pulse.",
            componentCode: `import React from "react";
import { motion } from "framer-motion";

export function CosmicGlowBadge({ label = "PRO" }: { label?: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950/80 text-indigo-200 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.25)]"
    >
      <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
      <span>{label}</span>
    </motion.div>
  );
}`,
            defaultCode: `import React from "react";
import { CosmicGlowBadge } from "./component";

export default function Demo() {
  return (
    <div className="flex min-h-[200px] w-full items-center justify-center p-8 bg-black/90">
      <CosmicGlowBadge label="COSMIC LIVE" />
    </div>
  );
}`,
            dependencies: ["framer-motion"],
          },
        },
      }),
    });

    const createRes = await POST(createReq);
    expect(createRes.status).toBe(200);
    const createData = await createRes.json();
    expect(createData.result.content[0].text).toContain('"success": true');
    expect(createData.result.content[0].text).toContain(`"slug": "${testSlug}"`);

    // Verify files on disk
    const compDir = path.join(process.cwd(), "registry", "components", testSlug);
    const compTsx = await fs.readFile(path.join(compDir, "component.tsx"), "utf-8");
    const defaultTsx = await fs.readFile(path.join(compDir, "default.tsx"), "utf-8");
    const manifestJson = await fs.readFile(path.join(compDir, "manifest.json"), "utf-8");

    expect(compTsx).toContain("export function CosmicGlowBadge");
    expect(defaultTsx).toContain("import { CosmicGlowBadge } from");
    expect(manifestJson).toContain('"slug": "cosmic-glow-badge"');
  });

  it("should retrieve the component through MCP resources/read", async () => {
    const readReq = new NextRequest("http://localhost:3000/api/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 102,
        method: "resources/read",
        params: {
          uri: `component://${testSlug}`,
        },
      }),
    });

    const readRes = await POST(readReq);
    expect(readRes.status).toBe(200);
    const readData = await readRes.json();
    expect(readData.result.contents[0].text).toContain("Cosmic Glow Badge");
  });
});
