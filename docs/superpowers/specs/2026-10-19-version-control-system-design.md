# Design Spec: Version Control & Component Variations System

## 1. Executive Summary

Component Studio currently maintains a single active set of working files (`component.tsx`, `demo.tsx`, `index.css`) per component template. While users can edit code or receive AI modifications, there is no native way to explore multiple variations of a component (e.g. Minimalist, Glassmorphism, Brutalist) or preserve deliberate checkpoints of their work over time.

This specification details the architecture, data models, UI components, and operations for a lightweight, Git-inspired **Hierarchical Variant-Snapshot Version Control System** built directly into Component Studio.

---

## 2. Goals & Non-Goals

### Goals
- **Named Variants (Branches)**: Allow users to fork, create, switch, and maintain multiple parallel variations of a single component template.
- **Manual Checkpoints (Snapshots)**: Enable intentional, user-triggered snapshots with custom commit messages (via UI button or `Ctrl+S`).
- **Visual History Drawer & Code Diff**: Provide a slide-out sheet displaying the timeline of snapshots for the active variant, with color-coded diff comparisons between any snapshot and current working files.
- **Instant Restore & Forking**: Empower users to rollback their active files to any previous checkpoint or branch out a new variant from a historical checkpoint.
- **Persistence & Zero Regressions**: Persist variants and checkpoints in local storage through Zustand with automatic size limits (maximum 50 checkpoints per variant) and maintain 100% compatibility with existing compiler, terminal, and AI workflows.

### Non-Goals
- Full Git CLI integration or remote Git repository hosting (e.g., GitHub push/pull).
- Merge conflict resolution algorithms (switching and restoring are clean whole-state swaps).
- Automatic high-frequency auto-snapshots (per user requirement, snapshots are strictly manual).

---

## 3. Architecture & Data Model

### 3.1 Store Schema (`lib/store/studio-store.ts`)

```typescript
export interface ComponentCheckpoint {
  id: string; // Unique ID, e.g. "chk_1729351234_abc"
  name: string; // Commit message / checkpoint title
  description?: string; // Optional detailed description
  timestamp: string; // Human-readable timestamp, e.g. "8:45 PM"
  createdAt: number; // Unix timestamp for sorting
  files: {
    "component.tsx": string;
    "demo.tsx": string;
    "index.css": string;
  };
  dependencies: string[];
}

export interface ComponentVariant {
  id: string; // Unique ID, e.g. "var_default", "var_glassmorphism"
  name: string; // Variant display name
  createdAt: number;
  updatedAt: number;
  files: {
    "component.tsx": string;
    "demo.tsx": string;
    "index.css": string;
  };
  dependencies: string[];
  checkpoints: ComponentCheckpoint[];
}

export interface StudioVersionControlSlice {
  // Map of templateId -> array of variants
  variantsByTemplate: Record<string, ComponentVariant[]>;
  // Map of templateId -> active variant id
  activeVariantByTemplate: Record<string, string>;

  // UI state
  isHistorySheetOpen: boolean;
  selectedCheckpointId: string | null;
  isCreateVariantDialogOpen: boolean;
  isSaveCheckpointDialogOpen: boolean;

  // Actions
  createVariant: (name: string, copyFromActive?: boolean) => void;
  switchVariant: (variantId: string) => void;
  deleteVariant: (variantId: string) => void;
  renameVariant: (variantId: string, newName: string) => void;

  saveCheckpoint: (name: string, description?: string) => void;
  restoreCheckpoint: (checkpointId: string) => void;
  forkCheckpointToNewVariant: (checkpointId: string, newVariantName: string) => void;
  deleteCheckpoint: (checkpointId: string) => void;

  setHistorySheetOpen: (open: boolean) => void;
  setSelectedCheckpointId: (id: string | null) => void;
  setCreateVariantDialogOpen: (open: boolean) => void;
  setSaveCheckpointDialogOpen: (open: boolean) => void;
}
```

### 3.2 State Initialization & Migration
When loading a template:
- If no variants exist for `currentTemplateId`, an initial variant named `"Default"` is automatically initialized with the current files and dependencies.
- `activeVariantByTemplate[currentTemplateId]` defaults to this initial variant ID.
- Active workspace `files` and `dependencies` are always kept synchronized with the active variant.

---

## 4. User Interface & Layout Specifications

All UI controls strictly conform to `AGENTS.md`:
- `font-sans` for all UI chrome, typography, buttons, tabs, dialogs, and badges.
- `font-mono` strictly limited to code diff content, commit hashes/slugs, and keyboard shortcuts (`<kbd>`).
- Official shadcn/ui components (`Button`, `Badge`, `Dialog`, `Sheet`/`Drawer`, `DropdownMenu`, `Tooltip`, `Input`, `Textarea`).

### 4.1 Header Controls (`components/studio/studio-header.tsx`)
In the top header, immediately to the right of the template selector:
1. **Variant Selector Dropdown**:
   - Trigger: `<Button variant="ghost" size="sm">` with `GitBranch` icon and the active variant's name.
   - Menu items:
     - List of existing variants with checkmark on active variant.
     - Separator.
     - `+ New Variant` item (opens `CreateVariantDialog`).
     - Actions on current variant: Duplicate / Rename / Delete (Default cannot be deleted).
2. **Save Checkpoint Button**:
   - `<Button variant="outline" size="sm">` with `BookmarkPlus` icon and label `"Save Checkpoint"`.
   - Keyboard shortcut: `Ctrl+S` (or `Cmd+S`).
3. **History Button**:
   - `<Button variant="ghost" size="sm">` with `History` icon and label `"History"`.
   - Badge displaying the number of checkpoints in the active variant.
   - Clicking toggles `isHistorySheetOpen`.

### 4.2 Slide-Out History Sheet (`components/studio/version-history-sheet.tsx`)
A right-side sliding sheet overlaying or docking into the workspace:
- **Sheet Header**:
  - Title: "Version History" (`font-sans`).
  - Active Variant indicator: `<Badge variant="outline">`.
  - Close button.
- **Timeline List (Left sub-panel / top section)**:
  - Scrollable timeline items sorted newest first.
  - Each item displays:
    - Checkpoint name (`font-sans font-medium`).
    - Relative or formatted timestamp (`text-xs text-muted-foreground`).
    - Diff summary (e.g., `+18 -4 lines`).
    - Inline actions: "Compare", "Restore", "Fork".
- **Visual Diff Viewer (Right sub-panel / active view)**:
  - Displays side-by-side or unified diff between the selected checkpoint and current working files.
  - File selector tab (`component.tsx`, `demo.tsx`, `index.css`).
  - Additions highlighted in green (`bg-emerald-500/10 text-emerald-400`).
  - Deletions highlighted in red (`bg-rose-500/10 text-rose-400`).
  - Code text formatted with `font-mono text-xs`.

### 4.3 Modal Dialogs
1. **`SaveCheckpointDialog`**:
   - Accessible via Header button or `Ctrl+S`.
   - Fields: Name (required, auto-focused) and Description (optional).
   - Validation: Name cannot be blank or exceed 60 characters.
2. **`CreateVariantDialog`**:
   - Fields: Variant Name (required) and Checkbox `"Clone current files into new variant"` (default checked).

---

## 5. Operations & Lifecycle

### 5.1 Variant Switching
1. User clicks a variant from the dropdown.
2. Store flushes any in-progress changes to the currently active variant object.
3. Store loads the selected variant's files and dependencies into live workspace state.
4. Compiler is notified, triggering re-compilation of preview canvas.
5. Terminal logs: `[system] Switched to variant: <VariantName>`.

### 5.2 Manual Checkpoint Creation
1. User clicks "Save Checkpoint" or presses `Ctrl+S`.
2. Dialog pops up. User inputs name (e.g. "Added hover bounce animation") and submits.
3. Store deep-clones current `files` and `dependencies`.
4. Checkpoint is prepended/appended to `variant.checkpoints`.
5. Terminal logs: `[system] Checkpoint created: <Name>`.
6. Toast confirmation appears.

### 5.3 Restoring Checkpoints
1. User clicks "Restore" on a checkpoint in the History sheet.
2. Confirmation dialog confirms intent.
3. Active variant's files are replaced with the checkpoint's files.
4. History sheet selects current checkpoint as active.
5. Live preview re-renders.

### 5.4 Forking Checkpoints
1. User clicks "Fork as Variant" on any historical checkpoint.
2. Dialog asks for the new variant name.
3. A brand new variant is created initialized with the exact code from that checkpoint.
4. Store switches active variant to the newly created variant.

### 5.5 Storage Limits & Quota Protection
- Maximum 50 checkpoints per variant. When exceeding 50, oldest checkpoints are automatically pruned.
- Stored efficiently in Zustand `persist` (Local Storage).

---

## 6. Implementation Plan & File Touchpoints

| File | Purpose |
|------|---------|
| `lib/store/studio-store.ts` | Add version control state types, slices, actions, and persistence logic. |
| `components/studio/studio-header.tsx` | Add Variant dropdown, Save Checkpoint button, History button, and keyboard listener (`Ctrl+S`). |
| `components/studio/version-history-sheet.tsx` | New component: slide-out timeline, checkpoint listing, actions, and diff viewer. |
| `components/studio/save-checkpoint-dialog.tsx` | New dialog: name and description inputs for saving a checkpoint. |
| `components/studio/create-variant-dialog.tsx` | New dialog: creating or duplicating variants. |
| `components/studio/version-diff-viewer.tsx` | New sub-component: clean visual diff comparison between two file states. |
