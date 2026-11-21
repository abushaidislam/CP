#!/usr/bin/env bun
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { componentRegistryService } from "../lib/mcp/component-service";
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
} from "../lib/mcp/schemas";

export function createComponentStudioMcpServer(): McpServer {
  const server = new McpServer({
    name: "component-studio-mcp",
    version: "1.1.0",
  });

  // Tool: create_component
  server.tool(
    "create_component",
    "Creates a new component in the Component Studio registry. Writes component.tsx, default.tsx, manifest.json, and index.css, and updates registry/index.json for instant live preview.",
    createComponentSchema.shape,
    async (args) => {
      try {
        const result = await componentRegistryService.createComponent(args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to create component: ${msg}` }],
        };
      }
    }
  );

  // Tool: get_component
  server.tool(
    "get_component",
    "Fetches the full code files, manifest, and metadata for a component by slug or ID.",
    getComponentSchema.shape,
    async (args) => {
      try {
        const result = await componentRegistryService.getComponent(args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to fetch component: ${msg}` }],
        };
      }
    }
  );

  // Tool: list_components
  server.tool(
    "list_components",
    "Lists components in the Component Studio registry with optional category and search filters.",
    listComponentsSchema.shape,
    async (args) => {
      try {
        const result = await componentRegistryService.listComponents(args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to list components: ${msg}` }],
        };
      }
    }
  );

  // Tool: update_component
  server.tool(
    "update_component",
    "Updates files or metadata of an existing component in the registry.",
    updateComponentSchema.shape,
    async (args) => {
      try {
        const result = await componentRegistryService.updateComponent(args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to update component: ${msg}` }],
        };
      }
    }
  );

  // Tool: delete_component
  server.tool(
    "delete_component",
    "Deletes a component from the registry and removes its entry from registry/index.json.",
    deleteComponentSchema.shape,
    async (args) => {
      try {
        const result = await componentRegistryService.deleteComponent(args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to delete component: ${msg}` }],
        };
      }
    }
  );

  // Tool: manage_versions
  server.tool(
    "manage_versions",
    "Manages version history, checkpoints, and revisions of a component. Supports 'list' (view all version snapshots), 'restore' (rollback/switch to a past version), and 'delete' (prune/delete specific versions).",
    manageVersionsSchema.shape,
    async (args) => {
      try {
        const result = await componentRegistryService.manageVersions(args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to manage component versions: ${msg}` }],
        };
      }
    }
  );

  // Tool: patch_component
  server.tool(
    "patch_component",
    "Applies fast, targeted search/replace code patches to an existing component without resending the entire file, and snapshots a new version checkpoint (e.g. v2, v3).",
    patchComponentSchema.shape,
    async (args) => {
      try {
        const result = await componentRegistryService.patchComponent(args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to patch component: ${msg}` }],
        };
      }
    }
  );

  // Tool: diff_versions
  server.tool(
    "diff_versions",
    "Computes a line-by-line unified diff and change statistics between two versions of a component (e.g. 'v1' vs 'v2').",
    diffVersionsSchema.shape,
    async (args) => {
      try {
        const result = await componentRegistryService.diffVersions(args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to diff component versions: ${msg}` }],
        };
      }
    }
  );

  // Tool: validate_component
  server.tool(
    "validate_component",
    "Pre-flight compiler and guideline validator. Checks React 19 TSX syntax via Sucrase, auto-detects imported npm dependencies, and scores 21st.dev guideline compliance (0-100).",
    validateComponentSchema.shape,
    async (args) => {
      try {
        const result = await componentRegistryService.validateComponent(args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to validate component: ${msg}` }],
        };
      }
    }
  );

  // Resource: registry://index
  server.resource(
    "registry-index",
    "registry://index",
    async (uri) => {
      const list = await componentRegistryService.listComponents({ limit: 1000 });
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(list, null, 2),
            mimeType: "application/json",
          },
        ],
      };
    }
  );

  // Resource: component://{slug}
  server.resource(
    "component-source",
    new ResourceTemplate("component://{slug}", { list: undefined }),
    async (uri, { slug }) => {
      const comp = await componentRegistryService.getComponent({ slug: String(slug) });
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(comp, null, 2),
            mimeType: "application/json",
          },
        ],
      };
    }
  );

  // Prompt: create-component-guidelines
  server.prompt(
    "create-component-guidelines",
    "Guidelines and best practices for creating components for Component Studio",
    {},
    () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `You are creating a React 19 UI component for Component Studio.
Rules:
1. 'component.tsx' must export the main component (named or default export).
2. 'default.tsx' must import the component from './component' and export a default function Demo() rendering it with sample props and a centered layout.
3. Use Tailwind CSS v4 classes and Framer Motion for smooth physics and animations when relevant.
4. Specify all required npm packages in the 'dependencies' array (e.g. ['framer-motion', 'lucide-react']).
5. Ensure the component is accessible, responsive, and visually striking.`,
          },
        },
      ],
    })
  );

  return server;
}

export async function runStdioServer() {
  const server = createComponentStudioMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[Component Studio MCP] Server successfully running on stdio");
}

const isEntryFile =
  Boolean((import.meta as { main?: boolean }).main) ||
  (typeof process !== "undefined" && Boolean(process.argv[1]?.includes("mcp-server")));

if (isEntryFile) {
  runStdioServer().catch((err) => {
    console.error("[Component Studio MCP] Fatal error:", err);
    process.exit(1);
  });
}
