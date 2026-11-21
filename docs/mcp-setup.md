# Component Studio MCP & Gemini Connector Setup Guide

Welcome to the **Component Studio Model Context Protocol (MCP)** integration. This enterprise-grade MCP server allows AI assistants—such as **Google Gemini**, **Google Antigravity**, **Claude Desktop**, and **Cursor**—to generate, inspect, update, and manage React 19 / Tailwind v4 components directly inside your Component Studio registry.

---

## 1. Quick Overview

Component Studio exposes a **Dual-Transport MCP Server**:

| Transport | Endpoint / Command | Best Suited For |
| :--- | :--- | :--- |
| **HTTP / SSE (Live Production)** | `https://cp.flinkeo.online/api/mcp` | Google Gemini Custom Apps, Web Connectors, Remote Agents, Webhooks |
| **HTTP / SSE (Local Dev)** | `http://localhost:3000/api/mcp` | Local web agents and development testing |
| **Stdio** | `bun run mcp` | Google Antigravity, Claude Desktop, Cursor, Local CLIs |

---

## 2. Connecting with Google Gemini

### Option A: Gemini Custom App / Web Connector
Point your Gemini custom connector or agent to your live URL:
```
https://cp.flinkeo.online/api/mcp
```
*(or `http://localhost:3000/api/mcp` during local testing)*

### Option B: Gemini SDK / Function Calling (`@google/genai`)
To retrieve tool declarations pre-formatted for Google Gemini's `functionDeclarations` API:
```
https://cp.flinkeo.online/api/mcp?format=gemini
```

In your Gemini code:
```typescript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 1. Fetch function declarations from Component Studio
const mcpRes = await fetch("http://localhost:3000/api/mcp?format=gemini");
const { functionDeclarations } = await mcpRes.json();

// 2. Pass tools to Gemini model
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: "Create an Aurora Shimmer Card for Component Studio",
  config: {
    tools: [{ functionDeclarations }],
  },
});

// 3. Forward function calls back to http://localhost:3000/api/mcp
if (response.functionCalls && response.functionCalls.length > 0) {
  for (const call of response.functionCalls) {
    const execRes = await fetch("http://localhost:3000/api/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        functionCall: {
          name: call.name,
          args: call.args,
        },
      }),
    });
    const result = await execRes.json();
    console.log("Component Studio Result:", result);
  }
}
```

---

## 3. Connecting with Google Antigravity IDE

In Antigravity or your agent configuration file, add the Stdio server under `mcpServers`:

```json
{
  "mcpServers": {
    "component-studio": {
      "command": "bun",
      "args": ["run", "scripts/mcp-server.ts"]
    }
  }
}
```

---

## 4. Connecting with Claude Desktop

Add this configuration to `%APPDATA%\Claude\claude_desktop_config.json` (Windows) or `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "component-studio": {
      "command": "bun",
      "args": ["run", "C:\\Users\\ASUS\\Desktop\\CP\\scripts\\mcp-server.ts"]
    }
  }
}
```

---

## 5. Connecting with Cursor / Windsurf

Add this configuration to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "component-studio": {
      "type": "stdio",
      "command": "bun",
      "args": ["run", "scripts/mcp-server.ts"]
    }
  }
}
```

---

## 6. Available MCP Tools Reference

### 1. `create_component`
Creates a new component on disk in `registry/components/<slug>/` and updates `registry/index.json`.
- **Arguments:**
  - `name` (string, required): Component display name (e.g. "Holographic Glass Card").
  - `slug` (string, optional): Kebab-case URL slug (e.g. "holographic-glass-card").
  - `category` (string, required): Component category (e.g. "Cards", "Buttons", "Navigation", "Hero", "Effects").
  - `description` (string, required): Short description of aesthetics and functionality.
  - `componentCode` (string, required): Complete TSX code for `component.tsx`.
  - `defaultCode` (string, required): Complete TSX code for `default.tsx` importing and rendering the component.
  - `dependencies` (array of strings, optional): Required npm packages (e.g. `["framer-motion", "lucide-react"]`).
  - `css` (string, optional): Optional custom CSS for `index.css`.

### 2. `get_component`
Fetches source code, manifest metadata, and dependencies for a component.
- **Arguments:**
  - `slug` (string, required): Component slug or ID.

### 3. `list_components`
Returns summary catalog of all components in the registry.
- **Arguments:**
  - `category` (string, optional): Filter by category.
  - `search` (string, optional): Search query matching name, slug, or description.
  - `limit` (number, optional): Maximum items to return (default 50).

### 4. `update_component`
Updates an existing component's code files or manifest metadata.
- **Arguments:**
  - `slug` (string, required): Component slug to update.
  - `componentCode`, `defaultCode`, `css`, `name`, `description`, `category`, `dependencies` (all optional).

### 5. `delete_component`
Removes a component directory and cleans its entry from `registry/index.json`.
- **Arguments:**
  - `slug` (string, required): Component slug to delete.
  - `confirm` (boolean, required): Safety confirmation flag.

---

## 7. Resources & Prompts

- **`registry://index`**: Read catalog index containing all components and metadata.
- **`component://{slug}`**: Read complete source files (`component.tsx`, `default.tsx`, `manifest.json`, `index.css`) for any component.
- **`create-component-guidelines`**: Guided prompt detailing React 19, Tailwind v4, and default export rules for Component Studio.

---

## 8. Optional Authentication (`MCP_API_KEY`)

By default, local requests require no authentication. To secure the HTTP endpoint when exposing it over a tunnel or public deployment:
1. Set `MCP_API_KEY="your-secret-token"` in your `.env.local`.
2. Clients must then include:
   - Header: `Authorization: Bearer your-secret-token`
   - Or header: `x-mcp-key: your-secret-token`
