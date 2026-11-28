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
      const listeners: Array<() => void> = [];
      proc.stdout.on("data", (chunk) => {
        stdoutData += chunk.toString("utf-8");
        listeners.forEach((fn) => fn());
      });

      const waitForStdout = (predicate: (text: string) => boolean, timeoutMs = 4200) =>
        new Promise<void>((resolve, reject) => {
          if (predicate(stdoutData)) {
            resolve();
            return;
          }
          const timer = setTimeout(() => {
            reject(new Error(`Timed out waiting for MCP stdio output. Got: ${stdoutData}`));
          }, timeoutMs);
          const check = () => {
            if (predicate(stdoutData)) {
              clearTimeout(timer);
              resolve();
            }
          };
          listeners.push(check);
        });

      try {
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
        await waitForStdout((t) => t.includes('"jsonrpc":"2.0"') && t.includes("component-studio-mcp"));

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
        await waitForStdout((t) => t.includes("validate_component"));

        expect(stdoutData).toContain("create_component");
        expect(stdoutData).toContain("get_component");
        expect(stdoutData).toContain("list_components");
        expect(stdoutData).toContain("update_component");
        expect(stdoutData).toContain("delete_component");
        expect(stdoutData).toContain("manage_versions");
        expect(stdoutData).toContain("patch_component");
        expect(stdoutData).toContain("diff_versions");
        expect(stdoutData).toContain("validate_component");
      } finally {
        proc.kill();
      }
  });
});
