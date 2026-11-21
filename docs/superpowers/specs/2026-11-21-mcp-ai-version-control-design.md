# Design Specification: AI Component Version Control & Checkpoint Engine for MCP

**Date:** 2026-11-21  
**Status:** Approved  
**Author:** Antigravity Engineering

---

## 1. Overview & Problem Statement
Currently, when Gemini updates a component via MCP `update_component`, the previous code is directly overwritten. If a user wishes to compare iterations, revert a hallucination, or branch from an earlier draft (e.g., "modify v2 instead of current v4"), the previous versions are lost.

This specification introduces a **first-class AI Version Control & Checkpoint Engine** into the Component Studio MCP server. Every component update automatically preserves previous revisions as non-destructive checkpoints (`v1`, `v2`, `v3`...), allows targeted edits on any past version, and allows pruning/deleting unwanted versions via conversational prompts.

---

## 2. Core User Stories & Scenarios

1. **Scenario 1: Automated Versioning (`create_component` & `update_component`)**
   - When Gemini generates a component for the first time, it registers `v1` (with an initial checkpoint `v1: Initial AI Creation`).
   - Every subsequent update automatically snapshots the existing code into `v{N}` and sets the new code as active `v{N+1}`.

2. **Scenario 2: Pruning / Deleting Specific Versions**
   - User prompt: *"Delete the first two versions (v1 and v2) of perspective-stack-gallery."*
   - Gemini calls `manage_versions` with `{ action: "delete", versionIds: ["v1", "v2"] }`.
   - The server removes those checkpoints, keeping only the remaining history.

3. **Scenario 3: Modifying a Specific Past Version (`baseVersion`)**
   - User prompt: *"Take version v2 of perspective-stack-gallery and change its border glow to cyan."*
   - Gemini calls `update_component` with `{ slug: "perspective-stack-gallery", baseVersion: "v2", componentCode: "..." }`.
   - The server bases the revision on `v2`, saves the new outcome as a new version, preserving all past revisions.

4. **Scenario 4: Instant Visual Studio Review**
   - When the user opens `/studio/[slug]`, the Studio's **Version History Sheet** and **Side-by-Side Diff Viewer** immediately reflect all versions with diff highlights, one-click restore, and variant branching.

---

## 3. Data Architecture & Types

### 3.1 Checkpoint Structure
Each checkpoint is represented as:
```ts
export interface ComponentCheckpoint {
  id: string; // e.g. "v1", "v2", or "cp-179526..."
  versionNumber: number; // 1, 2, 3...
  name: string; // "v1: Initial AI Creation"
  description?: string; // Change note, e.g. "Added hover spring physics"
  timestamp: string; // "06:45 PM"
  createdAt: number; // epoch ms
  files: StudioFiles; // snapshot of component.tsx, default.tsx, index.css
  dependencies: string[];
}
```

### 3.2 Manifest Integration
Stored inside `RepoComponentManifest`:
```ts
export interface RepoComponentManifest {
  ...
  version?: string; // e.g. "v3" or "3.0.0"
  variants?: ComponentVariant[]; // variants[0].checkpoints holds the version chain
  activeVariantId?: string;
}
```

---

## 4. MCP Tools & Interfaces

### 4.1 Upgraded `update_component`
```ts
export const updateComponentSchema = z.object({
  slug: z.string().min(1),
  name: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  componentCode: z.string().optional(),
  defaultCode: z.string().optional(),
  css: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  changeMessage: z.string().optional().describe("Description of what was changed in this version"),
  baseVersion: z.string().optional().describe("Optional past version (e.g. 'v2') to base this update on"),
  createCheckpoint: z.boolean().default(true).describe("Whether to snapshot the previous state as a version checkpoint"),
});
```

### 4.2 New Tool: `manage_versions`
```ts
export const manageVersionsSchema = z.object({
  slug: z.string().min(1).describe("The component slug"),
  action: z.enum(["list", "restore", "delete"]).describe("Version action to execute"),
  targetVersion: z.string().optional().describe("Version identifier to restore (e.g. 'v2')"),
  versionIds: z.array(z.string()).optional().describe("List of version identifiers to delete (e.g. ['v1', 'v2'])"),
});
```

---

## 5. Storage & Synchronization
- **Upstash Redis:** Sub-50ms writes to `cp:comp:${slug}` preserving full checkpoint lists and active state.
- **Local Filesystem & GitHub:** Stored in `registry/components/${slug}/manifest.json` under `variants[0].checkpoints`.
- **Browser Studio:** Automatically consumed by `StudioRouteClient` -> `useStudioStore` -> `variantsByTemplate` -> `VersionHistorySheet`.
