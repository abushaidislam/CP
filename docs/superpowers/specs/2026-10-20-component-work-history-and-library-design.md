# Component Work History & 21st.dev-Style Studio Flow Design

## 1. Context & Motivation

Currently, when a user accesses Component Studio at `/`, the app immediately renders `StudioContainer` locked to whatever template was previously active or the hardcoded default (`ink-orbit-hero`). There is no overarching library, work history view, or gallery where users can:
- See all components they have worked on or added.
- Inspect component metadata (name, category, last edited time, variants, checkpoints).
- Quickly preview a component and inspect its code in a 21st.dev-style modal without loading the heavy Monaco/CodeMirror editor and AI panels.
- Create new blank or template-derived components.
- Easily navigate between the high-level library and the in-depth studio editor with persistent state.

This feature introduces a two-tier navigation flow:
1. **`/` (Component Hub & Work History Dashboard)**: The default landing page displaying work history, search & category filters, interactive cards, "+ New Component" modal, and 21st.dev-style quick preview.
2. **`/studio/[id]` (Studio Workspace)**: The deep studio editor for the selected component, featuring an explicit "← Library" return button in the header.

---

## 2. User Experience & Flows

### 2.1 First-Visit & Hub Flow
1. User opens `/`.
2. They see the **Component Library & Work History**:
   - Header with Studio brand, theme toggle, and a prominent `+ New Component` button.
   - Work history metrics banner (Total Components, Custom Components, Saved Checkpoints).
   - Filter bar with search query input and category pills (`All`, `Recent Work`, `Heroes`, `Cards`, `Buttons`, `Badges`, `Custom`).
   - Responsive grid of component cards displaying live interactive previews, category badges, relative last-edited timestamps, and variant/checkpoint counters.
3. User clicks on any component card:
   - Opens the **21st.dev Quick Preview Modal** showing the live component demo, copyable JSX/CLI code, and an "Open in Studio" button.
   - Alternatively, user can click "Open Studio" directly from the card.

### 2.2 New Component Creation Flow
1. User clicks `+ New Component`.
2. A modal dialog opens prompting for:
   - Component Name (e.g. "Interactive Pricing Card")
   - Category (Heroes, Cards, Buttons, Badges, Custom)
   - Starter Template: Blank Slate, or copy from existing templates (Ink Orbit, Spotlight Card, Aurora Button, Radar Badge).
3. Upon clicking "Create Component":
   - The component is created with unique ID slug in Zustand persistent storage.
   - The user is automatically routed to `/studio/[new-id]`.

### 2.3 Studio Editor & Return Flow
1. User edits the component code, asks AI Copilot, adds checkpoints, or creates variants in `/studio/[id]`.
2. All modifications are automatically synced to the component in Zustand's persistent storage.
3. User clicks the `← Library` button in the Studio header:
   - Returns to `/`.
   - The edited component now appears at the top of the "Recent Work" list with updated timestamps and checkpoint counts.

---

## 3. Data Architecture (`lib/store/studio-store.ts`)

### 3.1 Data Structures
```typescript
export interface UserComponent {
  id: string;
  name: string;
  description: string;
  category: string;
  isBuiltIn?: boolean;
  createdAt: number;
  updatedAt: number;
  files: {
    "component.tsx": string;
    "demo.tsx": string;
    "index.css": string;
  };
  dependencies: string[];
}
```

### 3.2 State Additions
```typescript
userComponents: Record<string, UserComponent>;
recentComponentIds: string[];
quickPreviewComponentId: string | null;
isCreateComponentDialogOpen: boolean;
```

### 3.3 Actions
- `createComponent(data: { name: string; description?: string; category?: string; starterTemplateId?: string }): string`
- `deleteUserComponent(id: string): void`
- `duplicateUserComponent(id: string, newName?: string): string`
- `loadComponent(id: string): void`
- `recordComponentVisit(id: string): void`
- `setQuickPreviewComponentId(id: string | null): void`
- `setCreateComponentDialogOpen(open: boolean): void`

---

## 4. UI Design & AGENTS.md Guidelines

- **Typography**: Strictly Geist Sans (`font-sans`) for all UI copy (titles, buttons, badges, descriptions, filters, modal headers). `font-mono` is strictly restricted to mono eyebrows (`WORKSPACE LIBRARY`), code snippets, slugs, and CLI commands.
- **shadcn/ui**: Official primitives (`Button`, `Badge`, `Dialog`, `Tabs`, `Input`, `Tooltip`, `DropdownMenu`).
- **Modals**: Centered with `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`, responsive max width and max height with `overflow-y-auto`.
