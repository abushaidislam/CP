import { NextRequest, NextResponse } from "next/server";
import {
  componentRegistryService,
  getRecentMcpSyncEvents,
} from "@/lib/mcp/component-service";
import {
  createComponentSchema,
  updateComponentSchema,
  getComponentSchema,
  listComponentsSchema,
  deleteComponentSchema,
  manageVersionsSchema,
  validateComponentSchema,
  patchComponentSchema,
  diffVersionsSchema,
} from "@/lib/mcp/schemas";

const MCP_SERVER_INFO = {
  name: "component-studio-mcp",
  version: "1.1.0",
  protocolVersion: "2024-11-05",
  capabilities: {
    tools: { listChanged: false },
    resources: { subscribe: false, listChanged: false },
    prompts: { listChanged: false },
  },
};

const MCP_TOOLS_METADATA = [
  {
    name: "create_component",
    description:
      "Creates a new component in the Component Studio registry and saves it instantly to Cloud Storage (Upstash Redis) for live preview at /studio/[slug]. Also exposes a shadcn registry endpoint at /api/registry/[slug].",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Human-readable component display name (e.g. 'Aurora Glow Card')" },
        slug: { type: "string", description: "URL-safe kebab-case slug (e.g. 'aurora-glow-card'). If omitted, derived from name" },
        category: { type: "string", description: "Category (e.g. 'Buttons', 'Cards', 'Navigation', 'Hero', 'Effects')" },
        description: { type: "string", description: "Short description of what the component does and its design style" },
        componentCode: { type: "string", description: "Complete React TSX code for component.tsx. Export the component (named or default export)." },
        defaultCode: { type: "string", description: "Optional React TSX code for default.tsx importing and rendering the component in a preview container. If omitted, generated automatically." },
        dependencies: { type: "array", items: { type: "string" }, description: "Required npm packages, e.g. ['framer-motion', 'lucide-react']" },
        css: { type: "string", description: "Optional custom CSS rules for index.css" },
      },
      required: ["name", "componentCode"],
    },
  },
  {
    name: "get_component",
    description: "Fetches the full code files, manifest, metadata, and npx shadcn@latest add command for a component by slug or ID.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Slug or ID of the component to fetch" },
      },
      required: ["slug"],
    },
  },
  {
    name: "list_components",
    description: "Lists components in the Component Studio registry with optional category and search filters.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Filter components by category" },
        search: { type: "string", description: "Search query matching name, slug, or description" },
        limit: { type: "number", description: "Maximum number of components to return (default: 50)" },
      },
    },
  },
  {
    name: "update_component",
    description:
      "Updates files or metadata of an existing component in the registry, automatically preserving the previous version as a checkpoint in history.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "The slug of the component to update" },
        name: { type: "string", description: "Updated display name" },
        description: { type: "string", description: "Updated description" },
        category: { type: "string", description: "Updated category" },
        componentCode: { type: "string", description: "Updated component.tsx code" },
        defaultCode: { type: "string", description: "Updated default.tsx code" },
        css: { type: "string", description: "Updated index.css code" },
        dependencies: { type: "array", items: { type: "string" }, description: "Updated dependencies list" },
        changeMessage: { type: "string", description: "Description of what was changed in this version (e.g. 'Added spring animation')" },
        baseVersion: { type: "string", description: "Optional past version identifier (e.g. 'v1' or 'v2') to base this update on" },
      },
      required: ["slug"],
    },
  },
  {
    name: "patch_component",
    description:
      "Applies fast, targeted search/replace code patches to an existing component without resending the entire file, and snapshots a new version checkpoint (e.g. v2, v3).",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "The slug of the component to patch" },
        patches: {
          type: "array",
          description: "Ordered list of search/replace blocks to apply",
          items: {
            type: "object",
            properties: {
              file: {
                type: "string",
                enum: ["component.tsx", "default.tsx", "index.css"],
                description: "Target file to patch (default: 'component.tsx')",
              },
              search: { type: "string", description: "Exact code block to find" },
              replace: { type: "string", description: "Replacement code block" },
            },
            required: ["search", "replace"],
          },
        },
        changeMessage: { type: "string", description: "Description of what was changed in this patched version" },
        baseVersion: { type: "string", description: "Optional past version identifier (e.g. 'v1') to base this patch on" },
      },
      required: ["slug", "patches"],
    },
  },
  {
    name: "diff_versions",
    description:
      "Computes a line-by-line unified diff and change statistics between two versions of a component (e.g. 'v1' vs 'v2').",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "The component slug" },
        fromVersion: { type: "string", description: "Base version ID (e.g. 'v1'). Defaults to previous version" },
        toVersion: { type: "string", description: "Target version ID (e.g. 'v2'). Defaults to active version" },
        file: {
          type: "string",
          enum: ["component.tsx", "default.tsx", "index.css", "all"],
          description: "Which file to diff (default: 'all')",
        },
      },
      required: ["slug"],
    },
  },
  {
    name: "validate_component",
    description:
      "Pre-flight compiler and guideline validator. Checks React 19 TSX syntax via Sucrase, auto-detects imported npm dependencies, and scores 21st.dev guideline compliance (0-100) before or after saving.",
    inputSchema: {
      type: "object",
      properties: {
        componentCode: { type: "string", description: "React TSX source code for component.tsx to validate" },
        defaultCode: { type: "string", description: "Optional default.tsx demo code to validate" },
        css: { type: "string", description: "Optional index.css rules" },
        dependencies: { type: "array", items: { type: "string" }, description: "Declared npm packages" },
      },
      required: ["componentCode"],
    },
  },
  {
    name: "delete_component",
    description: "Deletes a component from the registry and removes its entry from registry/index.json.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Slug of the component to delete" },
        confirm: { type: "boolean", description: "Explicit confirmation flag to prevent accidental deletion" },
      },
      required: ["slug"],
    },
  },
  {
    name: "manage_versions",
    description:
      "Manages version history, checkpoints, and revisions of a component. Supports 'list' (view all version snapshots), 'restore' (rollback/switch to a past version), and 'delete' (prune/delete specific versions).",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "The component slug" },
        action: {
          type: "string",
          enum: ["list", "restore", "delete"],
          description: "Version action to perform: 'list', 'restore', or 'delete'",
        },
        targetVersion: {
          type: "string",
          description: "Version identifier to restore (e.g. 'v2' or 'v1') - required when action is 'restore'",
        },
        versionIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of version identifiers to delete (e.g. ['v1', 'v2']) - required when action is 'delete'",
        },
      },
      required: ["slug", "action"],
    },
  },
];

function checkAuth(req: NextRequest): { authorized: boolean; reason?: string } {
  const configuredKey = process.env.MCP_API_KEY?.trim();
  if (!configuredKey) {
    return { authorized: true }; // No auth required if MCP_API_KEY is unset (standard for local dev)
  }

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const customHeader = req.headers.get("x-mcp-key")?.trim() || "";

  if (token === configuredKey || customHeader === configuredKey) {
    return { authorized: true };
  }

  return { authorized: false, reason: "Unauthorized: Invalid or missing MCP API Key." };
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-mcp-key",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

/**
 * GET /api/mcp
 * - If Accept header is text/event-stream or ?transport=sse: Establishes SSE stream.
 * - If ?format=gemini: Returns Gemini-compatible Function Declarations.
 * - Otherwise: Returns MCP Server Manifest and available tools/resources metadata.
 */
export async function GET(req: NextRequest) {
  const auth = checkAuth(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.reason }, { status: 401, headers: corsHeaders() });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format");
  const mode = searchParams.get("mode");
  const transport = searchParams.get("transport");
  const acceptHeader = req.headers.get("accept") || "";

  // 0. Live Sync Events query for Studio & Hub auto-reload (?mode=events&since=...&slug=...)
  if (mode === "events") {
    const since = Number(searchParams.get("since") || "0") || 0;
    const slugFilter = searchParams.get("slug")?.trim() || undefined;
    const events = getRecentMcpSyncEvents(since, slugFilter);
    return NextResponse.json(
      {
        events,
        serverTime: Date.now(),
      },
      { headers: corsHeaders() }
    );
  }

  // 1. SSE Stream for MCP SSE Clients
  if (transport === "sse" || acceptHeader.includes("text/event-stream")) {
    const sessionId = `mcp_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        // Send initial endpoint announcement per MCP SSE spec
        const postEndpoint = `/api/mcp?sessionId=${encodeURIComponent(sessionId)}`;
        controller.enqueue(encoder.encode(`event: endpoint\ndata: ${postEndpoint}\n\n`));

        // Periodic keep-alive ping
        const pingInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          } catch {
            clearInterval(pingInterval);
          }
        }, 15000);

        req.signal.addEventListener("abort", () => {
          clearInterval(pingInterval);
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders(),
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  // 2. Gemini Function Declarations format (?format=gemini)
  if (format === "gemini") {
    const functionDeclarations = MCP_TOOLS_METADATA.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    }));

    return NextResponse.json(
      {
        server: MCP_SERVER_INFO,
        functionDeclarations,
      },
      { headers: corsHeaders() }
    );
  }

  // 3. Default JSON Server Info & Tool Catalog
  return NextResponse.json(
    {
      server: MCP_SERVER_INFO,
      tools: MCP_TOOLS_METADATA,
      resources: [
        {
          uri: "registry://index",
          name: "Component Catalog Index",
          mimeType: "application/json",
        },
        {
          uri: "component://{slug}",
          name: "Component Source Package",
          mimeType: "application/json",
        },
      ],
      prompts: [
        {
          name: "create-component-guidelines",
          description: "Guidelines and best practices for creating components for Component Studio",
        },
      ],
    },
    { headers: corsHeaders() }
  );
}

/**
 * POST /api/mcp
 * Handles:
 * 1. Standard MCP JSON-RPC 2.0 requests (initialize, tools/list, tools/call, resources/list, resources/read).
 * 2. Direct Gemini function call payloads ({ functionCall: { name, args } }).
 */
export async function POST(req: NextRequest) {
  const auth = checkAuth(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.reason }, { status: 401, headers: corsHeaders() });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error: Invalid JSON." } },
      { status: 400, headers: corsHeaders() }
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid Request." } },
      { status: 400, headers: corsHeaders() }
    );
  }

  const payload = body as Record<string, unknown>;

  // A. Direct Gemini Function Call format: { functionCall: { name: string, args: Record<string, unknown> } }
  if (payload.functionCall && typeof payload.functionCall === "object") {
    const fc = payload.functionCall as { name: string; args?: Record<string, unknown> };
    try {
      const toolName = fc.name;
      const toolArgs = fc.args || {};
      const result = await executeTool(toolName, toolArgs);
      return NextResponse.json(
        {
          functionResponse: {
            name: toolName,
            response: result,
          },
        },
        { headers: corsHeaders() }
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        {
          functionResponse: {
            name: fc.name,
            response: { success: false, error: msg },
          },
        },
        { headers: corsHeaders() }
      );
    }
  }

  // B. Standard MCP JSON-RPC 2.0 Format
  const id = payload.id ?? null;
  const method = typeof payload.method === "string" ? payload.method : "";
  const params = (payload.params as Record<string, unknown>) || {};

  try {
    switch (method) {
      case "initialize": {
        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id,
            result: {
              protocolVersion: MCP_SERVER_INFO.protocolVersion,
              capabilities: MCP_SERVER_INFO.capabilities,
              serverInfo: {
                name: MCP_SERVER_INFO.name,
                version: MCP_SERVER_INFO.version,
              },
            },
          },
          { headers: corsHeaders() }
        );
      }

      case "notifications/initialized": {
        return NextResponse.json({ jsonrpc: "2.0", id, result: {} }, { headers: corsHeaders() });
      }

      case "tools/list": {
        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id,
            result: {
              tools: MCP_TOOLS_METADATA,
            },
          },
          { headers: corsHeaders() }
        );
      }

      case "tools/call": {
        const toolName = String(params.name || "");
        const toolArgs = ((params.arguments || params.args || params.input || {}) as Record<string, unknown>);

        try {
          const toolResult = await executeTool(toolName, toolArgs);
          return NextResponse.json(
            {
              jsonrpc: "2.0",
              id,
              result: {
                content: [
                  {
                    type: "text",
                    text: typeof toolResult === "string" ? toolResult : JSON.stringify(toolResult, null, 2),
                  },
                ],
                isError: false,
              },
            },
            { headers: corsHeaders() }
          );
        } catch (toolErr: unknown) {
          const msg = toolErr instanceof Error ? toolErr.message : String(toolErr);
          return NextResponse.json(
            {
              jsonrpc: "2.0",
              id,
              result: {
                content: [
                  {
                    type: "text",
                    text: `Error executing tool "${toolName}": ${msg}`,
                  },
                ],
                isError: true,
              },
            },
            { headers: corsHeaders() }
          );
        }
      }

      case "resources/list": {
        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id,
            result: {
              resources: [
                {
                  uri: "registry://index",
                  name: "Component Catalog Index",
                  mimeType: "application/json",
                },
              ],
            },
          },
          { headers: corsHeaders() }
        );
      }

      case "resources/read": {
        const uri = String(params.uri || "");
        if (uri === "registry://index") {
          const list = await componentRegistryService.listComponents({ limit: 1000 });
          return NextResponse.json(
            {
              jsonrpc: "2.0",
              id,
              result: {
                contents: [
                  {
                    uri,
                    text: JSON.stringify(list, null, 2),
                    mimeType: "application/json",
                  },
                ],
              },
            },
            { headers: corsHeaders() }
          );
        }

        if (uri.startsWith("component://")) {
          const slug = uri.replace(/^component:\/\//, "").trim();
          const comp = await componentRegistryService.getComponent({ slug });
          return NextResponse.json(
            {
              jsonrpc: "2.0",
              id,
              result: {
                contents: [
                  {
                    uri,
                    text: JSON.stringify(comp, null, 2),
                    mimeType: "application/json",
                  },
                ],
              },
            },
            { headers: corsHeaders() }
          );
        }

        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id,
            error: { code: -32602, message: `Resource not found: ${uri}` },
          },
          { status: 404, headers: corsHeaders() }
        );
      }

      case "prompts/list": {
        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id,
            result: {
              prompts: [
                {
                  name: "create-component-guidelines",
                  description: "Guidelines and best practices for creating components for Component Studio",
                },
              ],
            },
          },
          { headers: corsHeaders() }
        );
      }

      case "prompts/get": {
        const promptName = String(params.name || "");
        if (promptName === "create-component-guidelines") {
          return NextResponse.json(
            {
              jsonrpc: "2.0",
              id,
              result: {
                messages: [
                  {
                    role: "user",
                    content: {
                      type: "text",
                      text: "Follow Component Studio rules: component.tsx exports primary component, default.tsx renders preview, use Tailwind CSS v4, specify dependencies in manifest.",
                    },
                  },
                ],
              },
            },
            { headers: corsHeaders() }
          );
        }

        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id,
            error: { code: -32602, message: `Prompt not found: ${promptName}` },
          },
          { status: 404, headers: corsHeaders() }
        );
      }

      default: {
        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id,
            error: { code: -32601, message: `Method not found: ${method}` },
          },
          { status: 404, headers: corsHeaders() }
        );
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id,
        error: { code: -32000, message: msg },
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}

function normalizeArgs(toolName: string, raw: Record<string, unknown>): Record<string, unknown> {
  if (toolName === "create_component") {
    const compCode =
      raw.componentCode ||
      raw.component_code ||
      raw.code ||
      raw.component ||
      "";

    const defCode =
      raw.defaultCode ||
      raw.default_code ||
      raw.demoCode ||
      raw.demo_code ||
      raw.previewCode ||
      raw.preview_code ||
      raw.demo ||
      "";

    return {
      ...raw,
      name: String(raw.name || raw.title || "Custom Component").trim(),
      componentCode: String(compCode).trim(),
      defaultCode: String(defCode).trim(),
      slug: raw.slug || raw.id || undefined,
      category: raw.category || "Custom",
      description: raw.description || "",
      dependencies: raw.dependencies || [],
      css: raw.css || "",
    };
  }

  if (toolName === "get_component") {
    return {
      ...raw,
      slug: raw.slug || raw.id || "",
    };
  }

  if (toolName === "delete_component") {
    return {
      ...raw,
      slug: raw.slug || raw.id || "",
      confirm: raw.confirm !== undefined ? Boolean(raw.confirm) : true,
    };
  }

  if (toolName === "update_component") {
    return {
      ...raw,
      slug: raw.slug || raw.id || "",
      name: raw.name || raw.title || undefined,
      componentCode: raw.componentCode || raw.component_code || raw.code || undefined,
      defaultCode: raw.defaultCode || raw.default_code || raw.demoCode || raw.previewCode || undefined,
      changeMessage: raw.changeMessage || raw.change_message || raw.message || raw.versionMessage || undefined,
      baseVersion: raw.baseVersion || raw.base_version || raw.targetVersion || raw.target_version || undefined,
    };
  }

  if (toolName === "manage_versions") {
    let vIds = raw.versionIds || raw.version_ids || raw.versions || [];
    if (typeof vIds === "string") {
      vIds = vIds.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
    }
    return {
      ...raw,
      slug: raw.slug || raw.id || "",
      action: raw.action || "list",
      targetVersion: raw.targetVersion || raw.target_version || raw.version || undefined,
      versionIds: Array.isArray(vIds) ? vIds : [],
    };
  }

  if (toolName === "validate_component") {
    return {
      ...raw,
      componentCode:
        raw.componentCode ||
        raw.component_code ||
        raw.code ||
        raw.component ||
        "",
      defaultCode:
        raw.defaultCode ||
        raw.default_code ||
        raw.demoCode ||
        raw.previewCode ||
        "",
      css: raw.css || "",
      dependencies: raw.dependencies || [],
    };
  }

  if (toolName === "patch_component") {
    return {
      ...raw,
      slug: raw.slug || raw.id || "",
      patches: Array.isArray(raw.patches) ? raw.patches : [],
      changeMessage: raw.changeMessage || raw.change_message || raw.message || undefined,
      baseVersion: raw.baseVersion || raw.base_version || undefined,
    };
  }

  if (toolName === "diff_versions") {
    return {
      ...raw,
      slug: raw.slug || raw.id || "",
      fromVersion: raw.fromVersion || raw.from_version || raw.from || undefined,
      toVersion: raw.toVersion || raw.to_version || raw.to || undefined,
      file: raw.file || "all",
    };
  }

  return raw;
}

async function executeTool(name: string, rawArgs: Record<string, unknown>): Promise<unknown> {
  const normalized = normalizeArgs(name, rawArgs);
  switch (name) {
    case "create_component": {
      const parsed = createComponentSchema.parse(normalized);
      return await componentRegistryService.createComponent(parsed);
    }
    case "get_component": {
      const parsed = getComponentSchema.parse(normalized);
      return await componentRegistryService.getComponent(parsed);
    }
    case "list_components": {
      const parsed = listComponentsSchema.parse(normalized);
      return await componentRegistryService.listComponents(parsed);
    }
    case "update_component": {
      const parsed = updateComponentSchema.parse(normalized);
      return await componentRegistryService.updateComponent(parsed);
    }
    case "patch_component": {
      const parsed = patchComponentSchema.parse(normalized);
      return await componentRegistryService.patchComponent(parsed);
    }
    case "diff_versions": {
      const parsed = diffVersionsSchema.parse(normalized);
      return await componentRegistryService.diffVersions(parsed);
    }
    case "validate_component": {
      const parsed = validateComponentSchema.parse(normalized);
      return await componentRegistryService.validateComponent(parsed);
    }
    case "delete_component": {
      const parsed = deleteComponentSchema.parse(normalized);
      return await componentRegistryService.deleteComponent(parsed);
    }
    case "manage_versions": {
      const parsed = manageVersionsSchema.parse(normalized);
      return await componentRegistryService.manageVersions(parsed);
    }
    default:
      throw new Error(`Unknown tool "${name}". Available tools: ${MCP_TOOLS_METADATA.map((t) => t.name).join(", ")}`);
  }
}
