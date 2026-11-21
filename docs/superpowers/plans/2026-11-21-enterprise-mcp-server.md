# Enterprise MCP Server & Gemini Connector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a production-grade Model Context Protocol (MCP) server with dual transports (Stdio and HTTP/SSE) and a UI connector dialog, enabling Google Gemini, Antigravity, Claude, and Cursor to generate and manage components directly in Component Studio.

**Architecture:** A unified core service (`lib/mcp/component-service.ts`) handles validation, safe path resolution, file writing, index updates, and git commits. Two transports expose this service: a Stdio server script (`scripts/mcp-server.ts`) for desktop clients, and an HTTP/SSE API route (`app/api/mcp/route.ts`) for Gemini custom apps and web connectors. An in-app "Connect MCP" dialog provides one-click setup snippets for all major AI clients.

**Tech Stack:** TypeScript, Next.js 16 (App Router), React 19, `@modelcontextprotocol/sdk`, `zod`, `bun`, `framer-motion`, `lucide-react`, Tailwind CSS v4.

**Spec:** `docs/superpowers/specs/2026-11-21-enterprise-mcp-server-design.md`

## Global Constraints
- Typography: default font is Geist Sans (`font-sans`); Geist Mono (`font-mono`) strictly reserved for code blocks, slugs, CLI commands, and eyebrows (per `AGENTS.md`).
- shadcn/ui components (`Dialog`, `Button`, `Badge`, `Tabs`, `Tooltip`) must be used for UI controls—no raw unstyled `<button>` or fake badges.
- Modals must be centered with `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2` and responsive `w-[calc(100vw-2rem)]` (per `AGENTS.md`).
- Path traversal guard: all disk writes must stay strictly inside `registry/components/<slug>/`.
- Zero TypeScript compiler errors: verify with `bun x tsc --noEmit` at every task completion.

## Review Focus
1. Path traversal or directory escaping when generating component slugs.
2. Missing or malformed `default.tsx` imports causing runtime preview breakages in the studio.
3. Concurrency conflicts on `registry/index.json` during rapid or parallel tool invocations.
4. Correct SSE protocol headers and connection lifecycle handling under HTTP transport.
5. Strict adherence to `font-sans` vs `font-mono` typography rules across UI components.

---

## Tasks

### Task 1: Core MCP Registry Service & Schemas
**Deliverable:** `lib/mcp/component-service.ts` and `lib/mcp/schemas.ts` with comprehensive unit tests in `tests/mcp/component-service.test.ts`.

- [ ] **Step 1.1**: Create Zod schemas for all 5 MCP tools (`createComponentSchema`, `updateComponentSchema`, `getComponentSchema`, `listComponentsSchema`, `deleteComponentSchema`) in `lib/mcp/schemas.ts`.
- [ ] **Step 1.2**: Write failing unit tests in `tests/mcp/component-service.test.ts` testing `createComponent`, `getComponent`, `listComponents`, `updateComponent`, and `deleteComponent`, plus path traversal edge cases.
- [ ] **Step 1.3**: Implement `ComponentRegistryService` in `lib/mcp/component-service.ts` using `withRepoWriteLock` and `resolveSafeComponentDir`.
- [ ] **Step 1.4**: Run `bun test tests/mcp/component-service.test.ts` to confirm all tests pass.
- [ ] **Step 1.5**: Run `bun x tsc --noEmit` and commit changes.

---

### Task 2: Stdio MCP Server Runner
**Deliverable:** `scripts/mcp-server.ts` implementing standard `@modelcontextprotocol/sdk` Stdio server with registered Tools, Resources, and Prompts.

- [ ] **Step 2.1**: Implement `scripts/mcp-server.ts` initializing `McpServer` and attaching `StdioServerTransport`.
- [ ] **Step 2.2**: Register the 5 tools (`create_component`, `get_component`, `list_components`, `update_component`, `delete_component`) connecting directly to `ComponentRegistryService`.
- [ ] **Step 2.3**: Register MCP resources (`registry://index` and `component://{slug}`) and the `create-component-guidelines` prompt.
- [ ] **Step 2.4**: Add `"mcp"` script to `package.json` (`"mcp": "bun run scripts/mcp-server.ts"`).
- [ ] **Step 2.5**: Test stdio server execution and protocol handshake with an automated integration test script.
- [ ] **Step 2.6**: Run `bun x tsc --noEmit` and commit changes.

---

### Task 3: HTTP & SSE Remote Connector Endpoint
**Deliverable:** `app/api/mcp/route.ts` supporting both Server-Sent Events (SSE) and HTTP POST JSON-RPC requests for Gemini Custom App Connectors.

- [ ] **Step 3.1**: Create `app/api/mcp/route.ts` handling `GET` (for SSE streaming and health checks) and `POST` (for JSON-RPC tool calls).
- [ ] **Step 3.2**: Add optional API Key validation via `MCP_API_KEY` environment variable and bearer authorization headers.
- [ ] **Step 3.3**: Add Gemini custom tool declaration format endpoint or query parameter (`/api/mcp?format=gemini`) so Gemini web apps can inspect function declarations natively.
- [ ] **Step 3.4**: Write integration tests verifying HTTP POST tool invocation and SSE streaming.
- [ ] **Step 3.5**: Run `bun x tsc --noEmit` and commit changes.

---

### Task 4: In-Studio "Connect MCP" UI Dialog
**Deliverable:** A polished shadcn/ui Dialog component `components/mcp/mcp-connect-dialog.tsx` added to the Component Studio header.

- [ ] **Step 4.1**: Create `components/mcp/mcp-connect-dialog.tsx` using `Dialog`, `Tabs`, `Button`, and `Badge`.
- [ ] **Step 4.2**: Include tabs for:
  - **Gemini App / Web Connector** (HTTP/SSE URL, instructions for custom app / function calling)
  - **Google Antigravity** (JSON snippet for AGY MCP configuration)
  - **Claude Desktop** (`claude_desktop_config.json` snippet)
  - **Cursor / Windsurf** (`.cursor/mcp.json` snippet)
- [ ] **Step 4.3**: Integrate the "Connect MCP" button into the Studio navigation header (`components/studio/studio-header.tsx` or main page toolbar).
- [ ] **Step 4.4**: Enforce strict typography (`font-sans` for tabs, descriptions, labels; `font-mono` exclusively for config snippets and paths).
- [ ] **Step 4.5**: Run `bun x tsc --noEmit` and commit changes.

---

### Task 5: End-to-End Verification & Documentation
**Deliverable:** End-to-end verification creating a sample component via MCP and full documentation in `docs/mcp-setup.md`.

- [ ] **Step 5.1**: Execute an end-to-end test pushing a new component via the MCP tool and verify it renders in Component Studio.
- [ ] **Step 5.2**: Author user-friendly setup documentation in `docs/mcp-setup.md`.
- [ ] **Step 5.3**: Run `bun x tsc --noEmit` and full test suite to ensure 0 errors.
- [ ] **Step 5.4**: Clean git commit on `feature/mcp-integration`.
