# MCP AI Component Version Control & Checkpoint Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement automated version snapshots, targeted past-version editing, and conversational version pruning/rollback in the Component Studio MCP server.

**Architecture:** Extend `ComponentRegistryService` and Upstash Redis entity records to track revision checkpoints in `manifest.variants[0].checkpoints`. Add a `manage_versions` MCP tool with `list`, `restore`, and `delete` actions, and upgrade `update_component` to automatically snapshot previous code into `v{N}` before setting `v{N+1}` active.

**Tech Stack:** Next.js App Router, Upstash Redis, Zod, TypeScript, Bun Test Suite, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-11-21-mcp-ai-version-control-design.md`

## Global Constraints
- ALL UI text and terminal chrome must use `font-sans`. `font-mono` is strictly restricted to code blocks, JSON payloads, and identifiers per `AGENTS.md`.
- `bun x tsc --noEmit` must pass with 0 errors before completion.
- MCP responses must return HTTP 200 with standard `{ result: { content: [...], isError: boolean } }`.

## Review Focus
- Checkpoint numbering must remain strictly sequential (`v1`, `v2`, `v3`...) without gaps or duplicates.
- Deleting older versions (e.g. `["v1", "v2"]`) must never delete the active version or corrupt remaining checkpoints.
- `baseVersion` targeting must correctly load files from the specified checkpoint, apply modifications, and create a new version.
- Empty or missing `versionMessage` must gracefully fallback to a human-readable default ("AI Revision").
- Upstash Redis and `manifest.json` must stay synchronized in both cloud and local environments.

---

### Task 1: Checkpoint Schemas & Parameter Types

**Files:**
- Modify: `lib/mcp/schemas.ts`
- Test: `tests/mcp/version-control.test.ts`

- [ ] Add `manageVersionsSchema` with `action: z.enum(["list", "restore", "delete"])`, `slug: z.string()`, `targetVersion: z.string().optional()`, and `versionIds: z.array(z.string()).optional()`.
- [ ] Upgrade `updateComponentSchema` with `changeMessage: z.string().optional()`, `baseVersion: z.string().optional()`, and `createCheckpoint: z.boolean().default(true)`.
- [ ] Export corresponding TypeScript input and output types.

---

### Task 2: Service Layer Version Engine in `ComponentRegistryService`

**Files:**
- Modify: `lib/mcp/component-service.ts`
- Test: `tests/mcp/version-control.test.ts`

- [ ] Update `createComponent` to initialize `manifest.variants = [{ id: "var-default", name: "Default", checkpoints: [initialCheckpoint] }]` where `initialCheckpoint` is labeled `v1: Initial AI Creation`.
- [ ] Update `updateComponent` to snapshot the existing files into `v{N}` checkpoint before writing the new code.
- [ ] Implement `baseVersion` resolution in `updateComponent`: if `baseVersion` is passed, retrieve files from that checkpoint as the baseline.
- [ ] Implement `listVersions(slug)`: returns formatted array of versions with change notes and dates.
- [ ] Implement `restoreVersion(slug, targetVersion)`: restores files from the checkpoint to the active state.
- [ ] Implement `deleteVersions(slug, versionIds)`: removes specified checkpoints while keeping active state intact.

---

### Task 3: Upstash Redis & Manifest Version Persistence

**Files:**
- Modify: `lib/storage/redis-client.ts`
- Modify: `lib/registry/server-registry.ts`
- Test: `tests/mcp/version-control.test.ts`

- [ ] Ensure `saveRedisComponent` preserves `manifest.variants` and checkpoints.
- [ ] Verify `readSingleRepoComponent` exports `variants` and `activeVariantId` so Component Studio's `VersionHistorySheet` displays all AI revisions.

---

### Task 4: MCP Protocol Routing & Gemini Function Declarations

**Files:**
- Modify: `app/api/mcp/route.ts`
- Test: `tests/mcp/http-mcp.test.ts`

- [ ] Add `manage_versions` tool metadata to `MCP_TOOLS_METADATA` and Gemini function declarations.
- [ ] Route `tools/call` and Gemini `functionCall` to `executeTool("manage_versions", args)`.
- [ ] Add normalization for `versionIds`, `versions`, `targetVersion`, and `baseVersion`.

---

### Task 5: Comprehensive Automated Testing & Verification

**Files:**
- Create: `tests/mcp/version-control.test.ts`
- Test: `bun test tests/mcp`
- Verification: `bun x tsc --noEmit`

- [ ] Test 1: `createComponent` initializes `v1` in version history.
- [ ] Test 2: `updateComponent` creates `v2` and preserves `v1` in checkpoints.
- [ ] Test 3: `manage_versions(action: "list")` lists `v1` and `v2`.
- [ ] Test 4: `manage_versions(action: "restore", targetVersion: "v1")` restores `v1` code.
- [ ] Test 5: `manage_versions(action: "delete", versionIds: ["v1"])` deletes `v1` and retains active version.
- [ ] Test 6: Verify 0 TypeScript errors via `bun x tsc --noEmit`.
