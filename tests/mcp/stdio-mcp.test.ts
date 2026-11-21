import { describe, it, expect } from "bun:test";
import { spawn } from "child_process";

describe("Stdio MCP Server Protocol", () => {
  it("should initialize and respond to tools/list via JSON-RPC over stdio", async () => {
    const proc = spawn("bun", ["run", "scripts/mcp-server.ts"], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdoutData = "";
    proc.stdout.on("data", (chunk) => {
      stdoutData += chunk.toString("utf-8");
    });

    // 1. Send JSON-RPC initialize request
    const initRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "test-client",
          version: "1.0.0",
        },
      },
    };

    proc.stdin.write(JSON.stringify(initRequest) + "\n");

    // Wait for response
    await new Promise((resolve) => setTimeout(resolve, 1500));

    expect(stdoutData).toContain('"jsonrpc":"2.0"');
    expect(stdoutData).toContain("component-studio-mcp");

    // 2. Send tools/list request
    const toolsRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {},
    };

    proc.stdin.write(JSON.stringify(toolsRequest) + "\n");

    await new Promise((resolve) => setTimeout(resolve, 800));

    expect(stdoutData).toContain("create_component");
    expect(stdoutData).toContain("get_component");
    expect(stdoutData).toContain("list_components");
    expect(stdoutData).toContain("update_component");
    expect(stdoutData).toContain("delete_component");
    expect(stdoutData).toContain("manage_versions");
    expect(stdoutData).toContain("patch_component");
    expect(stdoutData).toContain("diff_versions");
    expect(stdoutData).toContain("validate_component");

    proc.kill();
  });
});
