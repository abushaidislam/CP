# Version Control & Component Variations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete Git-inspired Version Control & Component Variations System in Component Studio, enabling users to maintain named branches (variants), save manual snapshots (checkpoints), inspect visual code diffs, and restore or fork states seamlessly.

**Architecture:** Extend the Zustand store (`studio-store.ts`) with a `variantsByTemplate` and `activeVariantByTemplate` state model. Integrate a Variant Switcher and Checkpoint controls into `studio-header.tsx`, backed by two dialogs (`CreateVariantDialog`, `SaveCheckpointDialog`) and a slide-out `VersionHistorySheet` featuring an interactive line-by-line `VersionDiffViewer`.

**Architecture Diagram:**

```mermaid
graph TD
    subgraph "Studio Header"
        VS[Variant Selector Dropdown]
        SCB[Save Checkpoint Button Ctrl+S]
        HB[History Button & Badge]
    end

    subgraph "Modals & Drawer"
        CVD[Create Variant Dialog]
        SCD[Save Checkpoint Dialog]
        VHS[Version History Sheet]
        VDV[Version Diff Viewer]
    end

    subgraph "Zustand Studio Store"
        ST[variantsByTemplate: Record<string, ComponentVariant[]>]
        AV[activeVariantByTemplate: Record<string, string>]
        AF[Live Workspace Files & Dependencies]
    end

    VS -->|Select Variant| AV
    VS -->|+ New Variant| CVD
    CVD -->|createVariant| ST
    SCB -->|Open| SCD
    SCD -->|saveCheckpoint| ST
    HB -->|Open Drawer| VHS
    VHS -->|Select Snapshot| VDV
    VHS -->|Restore| AF
    VHS -->|Fork as Variant| ST
    AV -->|Syncs to/from| AF
```

**Tech Stack:** Next.js 16 (Turbopack), React 19, TypeScript 5, Zustand 5, Tailwind CSS 4, Framer Motion, Radix UI Primitives, Lucide Icons.

**Spec:** [docs/superpowers/specs/2026-10-19-version-control-system-design.md](file:///c:/Users/ASUS/Desktop/CP/docs/superpowers/specs/2026-10-19-version-control-system-design.md)

## Global Constraints

- ALL UI text must use `font-sans` per `AGENTS.md`. `font-mono` is strictly restricted to code diff chunks, timestamps/IDs, and keyboard shortcuts (`<kbd>`).
- Always use official `@/components/ui/*` primitives (`Button`, `Badge`, `Dialog`, `Input`, `DropdownMenu`, `Tooltip`).
- Modals must be centered with `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`, `w-[calc(100vw-2rem)]`, and `max-h-[90vh]`.
- Always run `bun x tsc --noEmit` to verify 0 TypeScript errors before completing any task.

---

### Task 1: Extend Zustand Store with Version Control State & Actions

**Files:**
- Modify: `lib/store/studio-store.ts`
- Test: `lib/store/__tests__/version-control-store.test.ts`

**Interfaces:**
- Produces:
  - `ComponentCheckpoint` interface: `{ id, name, description?, timestamp, createdAt, files, dependencies }`
  - `ComponentVariant` interface: `{ id, name, createdAt, updatedAt, files, dependencies, checkpoints: ComponentCheckpoint[] }`
  - Store state: `variantsByTemplate`, `activeVariantByTemplate`, `isHistorySheetOpen`, `selectedCheckpointId`, `isCreateVariantDialogOpen`, `isSaveCheckpointDialogOpen`
  - Actions: `createVariant`, `switchVariant`, `deleteVariant`, `renameVariant`, `saveCheckpoint`, `restoreCheckpoint`, `forkCheckpointToNewVariant`, `deleteCheckpoint`, `setHistorySheetOpen`, `setSelectedCheckpointId`, `setCreateVariantDialogOpen`, `setSaveCheckpointDialogOpen`

- [ ] **Step 1: Write test verifying version control store methods**

Create `lib/store/__tests__/version-control-store.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "bun:test";
import { useStudioStore } from "../studio-store";

describe("Studio Version Control Slice", () => {
  beforeEach(() => {
    useStudioStore.setState((state) => ({
      ...state,
      variantsByTemplate: {},
      activeVariantByTemplate: {},
      currentTemplateId: "ink-orbit",
    }));
  });

  it("should initialize default variant when accessed or template loaded", () => {
    const store = useStudioStore.getState();
    expect(store.createVariant).toBeDefined();
    store.createVariant("Minimal");
    const state = useStudioStore.getState();
    const variants = state.variantsByTemplate[state.currentTemplateId] || [];
    expect(variants.some((v) => v.name === "Minimal")).toBe(true);
  });

  it("should create manual checkpoints with custom notes and clone files", () => {
    const store = useStudioStore.getState();
    store.saveCheckpoint("v1: initial release", "first checkpoint");
    const state = useStudioStore.getState();
    const currentVariantId = state.activeVariantByTemplate[state.currentTemplateId];
    const variants = state.variantsByTemplate[state.currentTemplateId] || [];
    const activeVar = variants.find((v) => v.id === currentVariantId);
    expect(activeVar?.checkpoints.length).toBeGreaterThan(0);
    expect(activeVar?.checkpoints[0].name).toBe("v1: initial release");
  });

  it("should restore a checkpoint to working files", () => {
    const store = useStudioStore.getState();
    store.updateFile("component.tsx", "// modified code");
    store.saveCheckpoint("Check 2");
    
    // change code again
    store.updateFile("component.tsx", "// new temporary code");
    expect(useStudioStore.getState().files["component.tsx"]).toBe("// new temporary code");
    
    // restore
    const state = useStudioStore.getState();
    const activeVar = state.variantsByTemplate[state.currentTemplateId]?.find(
      (v) => v.id === state.activeVariantByTemplate[state.currentTemplateId]
    );
    const targetCheckpoint = activeVar?.checkpoints[0];
    if (targetCheckpoint) {
      store.restoreCheckpoint(targetCheckpoint.id);
      expect(useStudioStore.getState().files["component.tsx"]).toBe("// modified code");
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test lib/store/__tests__/version-control-store.test.ts`
Expected: FAIL due to missing actions and properties on store.

- [ ] **Step 3: Implement Version Control Slice in `lib/store/studio-store.ts`**

Update `lib/store/studio-store.ts` to add interfaces, initial states, and slice actions:
- Auto-initialize `variantsByTemplate` with a `"Default"` variant for the template if absent.
- Synchronize live file edits to the active variant.
- Cap checkpoints at 50 per variant (FIFO).
- Implement `createVariant`, `switchVariant`, `deleteVariant`, `renameVariant`, `saveCheckpoint`, `restoreCheckpoint`, `forkCheckpointToNewVariant`, `deleteCheckpoint`, and UI modal state toggles.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test lib/store/__tests__/version-control-store.test.ts`
Expected: PASS with 3 passing tests.

- [ ] **Step 5: Typecheck & Commit**

Run: `bun x tsc --noEmit`
```bash
git add lib/store/studio-store.ts lib/store/__tests__/version-control-store.test.ts
git commit -m "feat(store): add hierarchical variant and checkpoint version control slice"
```

---

### Task 2: Create Save Checkpoint & Create Variant Dialogs

**Files:**
- Create: `components/studio/save-checkpoint-dialog.tsx`
- Create: `components/studio/create-variant-dialog.tsx`
- Modify: `components/studio/studio-container.tsx`

**Interfaces:**
- Consumes:
  - `useStudioStore`: `isSaveCheckpointDialogOpen`, `setSaveCheckpointDialogOpen`, `saveCheckpoint`
  - `useStudioStore`: `isCreateVariantDialogOpen`, `setCreateVariantDialogOpen`, `createVariant`
  - Shadcn Dialog primitives: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`
- Produces:
  - Accessible modal dialogs with autofocus, input validation (non-empty string <= 60 chars), error feedback, and keyboard shortcuts (`Enter` to submit, `Esc` to cancel).

- [ ] **Step 1: Build `components/studio/save-checkpoint-dialog.tsx`**

```tsx
"use client";

import React, { useState } from "react";
import { useStudioStore } from "@/lib/store/studio-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BookmarkPlus } from "lucide-react";

export function SaveCheckpointDialog() {
  const {
    isSaveCheckpointDialogOpen,
    setSaveCheckpointDialogOpen,
    saveCheckpoint,
  } = useStudioStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter a checkpoint title or note.");
      return;
    }
    saveCheckpoint(trimmed, description.trim() || undefined);
    setName("");
    setDescription("");
    setError("");
    setSaveCheckpointDialogOpen(false);
  };

  return (
    <Dialog open={isSaveCheckpointDialogOpen} onOpenChange={setSaveCheckpointDialogOpen}>
      <DialogContent className="sm:max-w-md font-sans">
        <DialogHeader>
          <div className="flex items-center gap-2 text-foreground">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <BookmarkPlus className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Save Checkpoint</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Take a manual snapshot of your active files and dependencies.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSave} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Checkpoint Name *</label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. Added glassmorphism blur and spring animation"
              className="text-xs font-sans h-9"
              autoFocus
              maxLength={60}
            />
            {error && <span className="text-[11px] text-destructive">{error}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground">Notes (Optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe key visual or functional changes..."
              className="text-xs font-sans min-h-[70px] resize-none"
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSaveCheckpointDialogOpen(false)}
              className="font-sans text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="font-sans text-xs gap-1.5">
              <BookmarkPlus className="size-3.5" />
              Save Checkpoint
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Build `components/studio/create-variant-dialog.tsx`**

Implement `CreateVariantDialog` with:
- Input for Variant Name (e.g. `Minimal Outline`, `Neon Glow`).
- Checkbox: "Clone files from active variant".
- Submit handler calls `createVariant(name, cloneFromActive)` and closes dialog.

- [ ] **Step 3: Mount Dialogs in `components/studio/studio-container.tsx`**

Add `<SaveCheckpointDialog />` and `<CreateVariantDialog />` to `StudioContainer` so they render centrally.

- [ ] **Step 4: Typecheck & Commit**

Run: `bun x tsc --noEmit`
```bash
git add components/studio/save-checkpoint-dialog.tsx components/studio/create-variant-dialog.tsx components/studio/studio-container.tsx
git commit -m "feat(ui): add save checkpoint and create variant modal dialogs"
```

---

### Task 3: Build Visual Code Diff Viewer Component

**Files:**
- Create: `components/studio/version-diff-viewer.tsx`

**Interfaces:**
- Consumes:
  - `oldCode: string`, `newCode: string`, `filename: StudioFileName`
- Produces:
  - Clean side-by-side or unified line-by-line diff view highlighting insertions (`+` emerald) and deletions (`-` rose).
  - Preserves exact indentation with `font-mono text-xs whitespace-pre`.
  - Header showing line count changes (`+X / -Y lines`).

- [ ] **Step 1: Implement line diff utility & `components/studio/version-diff-viewer.tsx`**

Implement a pure, robust Myers or line-by-line diff calculator that splits lines, detects additions/deletions, and renders:
- Line number gutters.
- Color badges: `+` for added lines in `bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500`, `-` for removed lines in `bg-rose-500/10 text-rose-400 border-l-2 border-rose-500`.
- Empty state: "No changes detected between this checkpoint and current files."

- [ ] **Step 2: Typecheck & Commit**

Run: `bun x tsc --noEmit`
```bash
git add components/studio/version-diff-viewer.tsx
git commit -m "feat(ui): add visual code diff viewer component"
```

---

### Task 4: Build Slide-Out Version History Drawer / Sheet

**Files:**
- Create: `components/studio/version-history-sheet.tsx`
- Modify: `components/studio/studio-container.tsx`

**Interfaces:**
- Consumes:
  - `useStudioStore`: `variantsByTemplate`, `activeVariantByTemplate`, `currentTemplateId`, `isHistorySheetOpen`, `setHistorySheetOpen`, `selectedCheckpointId`, `setSelectedCheckpointId`, `restoreCheckpoint`, `forkCheckpointToNewVariant`, `deleteCheckpoint`
  - `VersionDiffViewer`
- Produces:
  - Framer-motion animated slide-out sheet from the right (`w-full sm:w-[540px] lg:w-[680px]`).
  - Header displaying active variant name, total checkpoints count, and close trigger.
  - Timeline of checkpoints:
    - Title, formatted timestamp, notes.
    - Quick actions: "View Diff", "Restore to Workspace", "Fork as Variant", "Delete".
  - Embedded `VersionDiffViewer` when a checkpoint is selected.

- [ ] **Step 1: Implement `components/studio/version-history-sheet.tsx`**

Implement with:
- AnimatePresence and motion.div overlay (`fixed inset-0 bg-black/50 z-40 backdrop-blur-xs`) and slide-in panel (`fixed right-0 top-0 bottom-0 z-50 bg-background border-l border-border shadow-2xl flex flex-col`).
- Tab switcher to toggle between `component.tsx`, `demo.tsx`, and `index.css` diffs.
- Confirm dialog before restoring so unsaved changes aren't accidentally blown away without confirmation.
- Fork action that opens `CreateVariantDialog` pre-filled or directly creates a new variant from the checkpoint.

- [ ] **Step 2: Mount Sheet in `components/studio/studio-container.tsx`**

Add `<VersionHistorySheet />` to `StudioContainer`.

- [ ] **Step 3: Typecheck & Commit**

Run: `bun x tsc --noEmit`
```bash
git add components/studio/version-history-sheet.tsx components/studio/studio-container.tsx
git commit -m "feat(ui): add slide-out version history drawer with timeline and diff inspection"
```

---

### Task 5: Integrate Variant Selector & Controls into Studio Header

**Files:**
- Modify: `components/studio/studio-header.tsx`

**Interfaces:**
- Consumes:
  - `useStudioStore`: `variantsByTemplate`, `activeVariantByTemplate`, `currentTemplateId`, `switchVariant`, `setCreateVariantDialogOpen`, `setSaveCheckpointDialogOpen`, `setHistorySheetOpen`, `deleteVariant`, `renameVariant`
  - Official shadcn primitives: `Button`, `Badge`, `DropdownMenu`, `Tooltip`
- Produces:
  - Variant Switcher dropdown placed right after the Component Template selector.
  - "Save Checkpoint" button with `Ctrl+S` indicator.
  - "History" button with checkpoint count badge.
  - Keyboard listener: `Ctrl+S` or `Cmd+S` triggers `setSaveCheckpointDialogOpen(true)` globally.

- [ ] **Step 1: Update `components/studio/studio-header.tsx`**

- Add `GitBranch`, `BookmarkPlus`, `History`, `Plus`, `Trash2`, `Copy` icons.
- Add `useEffect` for `Ctrl+S` / `Cmd+S` event listener with `e.preventDefault()`.
- Add Variant Switcher dropdown menu displaying all variants for `currentTemplateId`, with checkmark next to active variant.
- Add "Save Checkpoint" outline button.
- Add "History" button with counter badge.

- [ ] **Step 2: Verify zero TypeScript errors**

Run: `bun x tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/studio/studio-header.tsx
git commit -m "feat(header): integrate variant switcher, checkpoint trigger, and history controls"
```

---

### Task 6: End-to-End Verification & Sanity Testing

**Files:**
- Test: `lib/store/__tests__/version-control-integration.test.ts`

- [ ] **Step 1: Write integration test covering full user workflow**

Verify:
1. Initialize template -> has default variant.
2. User makes code changes -> saves checkpoint "Check 1".
3. User creates new variant "Variant B" -> switches to it.
4. User modifies code in "Variant B" -> switches back to "Default" -> verifies original files remain intact.
5. User restores "Check 1" in "Default" -> files correctly rollback.
6. User forks "Check 1" into "Variant C" -> new variant created with "Check 1" code.

- [ ] **Step 2: Run test suite**

Run: `bun test`
Expected: ALL tests pass.

- [ ] **Step 3: Run Full Next.js TypeScript check & lint**

Run: `bun x tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Final commit**

```bash
git add lib/store/__tests__/version-control-integration.test.ts
git commit -m "test: add integration test suite for version control and component variations"
```
