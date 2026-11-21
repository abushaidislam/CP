import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { GET, POST } from "@/app/api/mcp/route";
import { NextRequest } from "next/server";

describe("HTTP / SSE MCP & Gemini Connector Endpoint (/api/mcp)", () => {
  const originalKey = process.env.MCP_API_KEY;

  beforeEach(() => {
    delete process.env.MCP_API_KEY;
  });

  afterEach(() => {
    if (originalKey !== undefined) {
      process.env.MCP_API_KEY = originalKey;
    } else {
      delete process.env.MCP_API_KEY;
    }
  });

  it("should return MCP server info and tools on GET /api/mcp", async () => {
    const req = new NextRequest("http://localhost:3000/api/mcp");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.server.name).toBe("component-studio-mcp");
    expect(body.tools.length).toBe(5);
    expect(body.tools.some((t: { name: string }) => t.name === "create_component")).toBe(true);
  });

  it("should return Gemini-compatible function declarations on GET /api/mcp?format=gemini", async () => {
    const req = new NextRequest("http://localhost:3000/api/mcp?format=gemini");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.functionDeclarations)).toBe(true);
    expect(body.functionDeclarations.length).toBe(5);
    expect(body.functionDeclarations[0].parameters).toBeDefined();
  });

  it("should handle MCP JSON-RPC initialize and tools/list on POST /api/mcp", async () => {
    const initReq = new NextRequest("http://localhost:3000/api/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 10,
        method: "initialize",
        params: {},
      }),
    });

    const initRes = await POST(initReq);
    expect(initRes.status).toBe(200);
    const initBody = await initRes.json();
    expect(initBody.id).toBe(10);
    expect(initBody.result.serverInfo.name).toBe("component-studio-mcp");

    const toolsReq = new NextRequest("http://localhost:3000/api/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 11,
        method: "tools/list",
        params: {},
      }),
    });

    const toolsRes = await POST(toolsReq);
    expect(toolsRes.status).toBe(200);
    const toolsBody = await toolsRes.json();
    expect(toolsBody.result.tools.length).toBe(5);
  });

  it("should handle direct Gemini functionCall format on POST /api/mcp", async () => {
    const req = new NextRequest("http://localhost:3000/api/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        functionCall: {
          name: "list_components",
          args: { limit: 5 },
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.functionResponse).toBeDefined();
    expect(body.functionResponse.name).toBe("list_components");
    expect(body.functionResponse.response.components).toBeDefined();
  });

  it("should enforce authentication when MCP_API_KEY is configured", async () => {
    process.env.MCP_API_KEY = "test-secret-key-123";

    // Unauthorized request
    const unauthReq = new NextRequest("http://localhost:3000/api/mcp");
    const unauthRes = await GET(unauthReq);
    expect(unauthRes.status).toBe(401);

    // Authorized request with Bearer token
    const authReq = new NextRequest("http://localhost:3000/api/mcp", {
      headers: { Authorization: "Bearer test-secret-key-123" },
    });
    const authRes = await GET(authReq);
    expect(authRes.status).toBe(200);

    // Authorized request with custom header x-mcp-key
    const headerReq = new NextRequest("http://localhost:3000/api/mcp", {
      headers: { "x-mcp-key": "test-secret-key-123" },
    });
    const headerRes = await GET(headerReq);
    expect(headerRes.status).toBe(200);
  });
});
