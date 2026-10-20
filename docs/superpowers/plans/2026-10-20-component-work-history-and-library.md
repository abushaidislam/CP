# Component Work History & 21st.dev-Style Studio Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete 21st.dev-inspired Component Work History Hub at `/` and connect it with dynamic Studio Workspace routes (`/studio/[id]`), enabling users to browse their created and edited components, trigger 21st.dev-style live quick previews and code inspectors, create new components, and return seamlessly between the Studio and the Library.

**Architecture:** Extend Zustand store (`studio-store.ts`) with a `userComponents` registry and `recentComponentIds` tracking. Create `ComponentHub`, `ComponentCard`, `QuickPreviewModal`, and `CreateComponentDialog` under `@/components/hub/`. Mount the Hub on `/` and dynamic Studio on `/studio/[id]`, linking them via a header "Back to Library" control.

**Architecture Diagram:**

```mermaid
flowchart TD
    subgraph "Hub View (/)"
        NB[Hub Navigation & Stats Bar]
        TB[Search & Category Pills Toolbar]
        CG[Component Cards Grid]
        CVD[Create Component Dialog]
        QPM[21st.dev Quick Preview Modal]
    end

    subgraph "Studio Workspace (/studio/[id])"
        SH[Studio Header with Back to Library]
        SC[Studio Container & Editor Panels]
    end

    subgraph "Zustand Store (studio-store.ts)"
        UC[userComponents: Record<string, UserComponent>]
        RC[recentComponentIds: string[]]
        VBT[variantsByTemplate: Record<string, ComponentVariant[]>]
        WF[files: component.tsx, demo.tsx, index.css]
    end

    NB -->|+ New Component| CVD
    CVD -->|createComponent| UC
    CVD -->|Navigate| SC
    TB -->|Filter/Search| CG
    CG -->|Card Click| QPM
    CG -->|Direct Studio Action| SC
    QPM -->|Open in Studio| SC
    SH -->|Back to Library| NB
    UC -->|loadComponent| WF
    WF -->|Sync modifications| UC
    WF -->|Sync variant| VBT
```

**Tech Stack:** Next.js 16 (Turbopack, App Router), React 19, TypeScript 5, Zustand 5 (Persist), Tailwind CSS 4, Framer Motion, Radix UI Primitives, Lucide Icons.

**Spec:** [docs/superpowers/specs/2026-10-20-component-work-history-and-library-design.md](file:///c:/Users/ASUS/Desktop/CP/docs/superpowers/specs/2026-10-20-component-work-history-and-library-design.md)

## Global Constraints

- ALL UI text must use `font-sans` per `AGENTS.md`. `font-mono` is strictly restricted to mono eyebrows (`WORKSPACE LIBRARY`), code snippets, slugs, CLI commands, and `<kbd>`.
- Always use official `@/components/ui/*` primitives (`Button`, `Badge`, `Dialog`, `Input`, `Tabs`, `DropdownMenu`, `Tooltip`). No raw unstyled HTML buttons.
- Modals must be centered with `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`, `w-[calc(100vw-2rem)]`, and `max-h-[90vh]` with `overflow-y-auto`.
- Always run `bun x tsc --noEmit` and `bun test` to guarantee 0 TypeScript errors and passing tests before marking tasks complete.

---

### Task 1: Extend Studio Store with Component Registry & Work History

**Files:**
- Modify: `lib/store/studio-store.ts`
- Test: `lib/store/__tests__/component-registry-store.test.ts`

**Interfaces:**
- Produces:
  - `UserComponent` interface: `{ id: string; name: string; description: string; category: string; isBuiltIn?: boolean; createdAt: number; updatedAt: number; files: { "component.tsx": string; "demo.tsx": string; "index.css": string }; dependencies: string[] }`
  - Store state:
    - `userComponents: Record<string, UserComponent>`
    - `recentComponentIds: string[]`
    - `quickPreviewComponentId: string | null`
    - `isCreateComponentDialogOpen: boolean`
  - Store actions:
    - `createComponent(data: { name: string; description?: string; category?: string; starterTemplateId?: string }): string`
    - `deleteUserComponent(id: string): void`
    - `duplicateUserComponent(id: string, newName?: string): string`
    - `loadComponent(id: string): void`
    - `recordComponentVisit(id: string): void`
    - `setQuickPreviewComponentId(id: string | null): void`
    - `setCreateComponentDialogOpen(open: boolean): void`

- [ ] **Step 1: Write failing test for component registry and work history store**

Create `lib/store/__tests__/component-registry-store.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "bun:test";
import { useStudioStore } from "../studio-store";

describe("Component Registry & Work History Store Slice", () => {
  beforeEach(() => {
    useStudioStore.setState((state) => ({
      ...state,
      userComponents: {},
      recentComponentIds: [],
      quickPreviewComponentId: null,
      isCreateComponentDialogOpen: false,
    }));
  });

  it("should create a new component from blank slate and select it", () => {
    const store = useStudioStore.getState();
    const newId = store.createComponent({
      name: "Hero Section",
      description: "My custom animated hero",
      category: "Heroes",
    });

    const state = useStudioStore.getState();
    expect(newId).toBeDefined();
    expect(state.userComponents[newId]).toBeDefined();
    expect(state.userComponents[newId].name).toBe("Hero Section");
    expect(state.userComponents[newId].category).toBe("Heroes");
    expect(state.currentTemplateId).toBe(newId);
    expect(state.recentComponentIds[0]).toBe(newId);
  });

  it("should create a new component by cloning an existing starter template", () => {
    const store = useStudioStore.getState();
    const newId = store.createComponent({
      name: "Custom Spotlight",
      starterTemplateId: "spotlight-card",
      category: "Cards",
    });

    const state = useStudioStore.getState();
    expect(state.userComponents[newId].files["component.tsx"]).toContain("Spotlight");
    expect(state.userComponents[newId].category).toBe("Cards");
  });

  it("should record component visit and maintain recent history order without duplicates", () => {
    const store = useStudioStore.getState();
    const idA = store.createComponent({ name: "Component A" });
    const idB = store.createComponent({ name: "Component B" });
    const idC = store.createComponent({ name: "Component C" });

    store.recordComponentVisit(idA);
    const state = useStudioStore.getState();
    expect(state.recentComponentIds[0]).toBe(idA);
    expect(state.recentComponentIds.filter((id) => id === idA).length).toBe(1);
  });

  it("should duplicate an existing component with clean copies of files", () => {
    const store = useStudioStore.getState();
    const originalId = store.createComponent({ name: "Original Card", category: "Cards" });
    const dupId = store.duplicateUserComponent(originalId, "Original Card Copy");

    const state = useStudioStore.getState();
    expect(dupId).not.toBe(originalId);
    expect(state.userComponents[dupId].name).toBe("Original Card Copy");
    expect(state.userComponents[dupId].category).toBe("Cards");
  });

  it("should delete custom user component and update recent list", () => {
    const store = useStudioStore.getState();
    const customId = store.createComponent({ name: "Temporary Button" });
    expect(useStudioStore.getState().userComponents[customId]).toBeDefined();

    store.deleteUserComponent(customId);
    const state = useStudioStore.getState();
    expect(state.userComponents[customId]).toBeUndefined();
    expect(state.recentComponentIds.includes(customId)).toBe(false);
  });

  it("should toggle create dialog and quick preview state", () => {
    const store = useStudioStore.getState();
    store.setCreateComponentDialogOpen(true);
    expect(useStudioStore.getState().isCreateComponentDialogOpen).toBe(true);

    store.setQuickPreviewComponentId("spotlight-card");
    expect(useStudioStore.getState().quickPreviewComponentId).toBe("spotlight-card");
    store.setQuickPreviewComponentId(null);
    expect(useStudioStore.getState().quickPreviewComponentId).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test lib/store/__tests__/component-registry-store.test.ts`
Expected: FAIL (missing `userComponents`, `createComponent`, etc. on StudioState)

- [ ] **Step 3: Implement store additions in `lib/store/studio-store.ts`**

Update `StudioState` interface and initial state:
- Add `UserComponent` interface.
- Add `userComponents: Record<string, UserComponent>`.
- Seed `userComponents` initially from `DEFAULT_TEMPLATES` mapping each `template` to a `UserComponent` with `isBuiltIn: true`.
- Implement `createComponent`, `deleteUserComponent`, `duplicateUserComponent`, `loadComponent`, `recordComponentVisit`, `setQuickPreviewComponentId`, and `setCreateComponentDialogOpen`.
- Ensure `updateFile` synchronizes `userComponents[currentTemplateId].files` in addition to active variant files.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test lib/store/__tests__/component-registry-store.test.ts`
Expected: PASS

- [ ] **Step 5: Verify all existing tests still pass**

Run: `bun test`
Expected: All 50+ tests PASS

---

### Task 2: Build Create Component Dialog (`components/hub/create-component-dialog.tsx`)

**Files:**
- Create: `components/hub/create-component-dialog.tsx`
- Test: `components/hub/__tests__/create-component-dialog.test.tsx`

**Interfaces:**
- Props: `{ onCreated?: (id: string) => void }`
- Interacts with: `useStudioStore` (`isCreateComponentDialogOpen`, `setCreateComponentDialogOpen`, `createComponent`)
- Inputs:
  - Name (text input, required, placeholder e.g. "Interactive Pricing Card")
  - Description (optional text input)
  - Category selector (`Heroes`, `Cards`, `Buttons`, `Badges`, `Custom`)
  - Starter template cards (Blank Clean Slate, Ink Orbit, Spotlight Card, Aurora Button, Radar Badge)
  - Submit Button: "Create Component", Cancel Button

- [ ] **Step 1: Write test for `CreateComponentDialog`**

Create `components/hub/__tests__/create-component-dialog.test.tsx`:
```typescript
import { describe, it, expect, beforeEach, mock } from "bun:test";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { CreateComponentDialog } from "../create-component-dialog";
import { useStudioStore } from "@/lib/store/studio-store";

describe("CreateComponentDialog", () => {
  beforeEach(() => {
    useStudioStore.setState((s) => ({
      ...s,
      isCreateComponentDialogOpen: true,
    }));
  });

  it("should render dialog elements when open", () => {
    render(<CreateComponentDialog />);
    expect(screen.getByText("Create New Component")).toBeTruthy();
    expect(screen.getByPlaceholderText(/e\.g\. Animated Pricing Card/i)).toBeTruthy();
    expect(screen.getByText("Starter Template")).toBeTruthy();
  });

  it("should trigger createComponent and callback when submitted with name", () => {
    const onCreated = mock(() => {});
    render(<CreateComponentDialog onCreated={onCreated} />);

    const input = screen.getByPlaceholderText(/e\.g\. Animated Pricing Card/i);
    fireEvent.change(input, { target: { value: "Test Navbar" } });

    const submitBtn = screen.getByRole("button", { name: /create component/i });
    fireEvent.click(submitBtn);

    const state = useStudioStore.getState();
    const created = Object.values(state.userComponents).find((c) => c.name === "Test Navbar");
    expect(created).toBeDefined();
    expect(onCreated).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test components/hub/__tests__/create-component-dialog.test.tsx`
Expected: FAIL (File not found)

- [ ] **Step 3: Implement `CreateComponentDialog`**

Create `components/hub/create-component-dialog.tsx`:
- Use `@/components/ui/dialog` with `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`.
- Use `@/components/ui/input`, `@/components/ui/button`, `@/components/ui/badge`.
- Ensure standard AGENTS.md centered styling and `font-sans` for all UI text.
- Allow selecting starter templates with visual cards.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test components/hub/__tests__/create-component-dialog.test.tsx`
Expected: PASS

---

### Task 3: Build 21st.dev Quick Preview Modal (`components/hub/quick-preview-modal.tsx`)

**Files:**
- Create: `components/hub/quick-preview-modal.tsx`
- Test: `components/hub/__tests__/quick-preview-modal.test.tsx`

**Interfaces:**
- Interacts with: `useStudioStore` (`quickPreviewComponentId`, `setQuickPreviewComponentId`, `userComponents`, `variantsByTemplate`)
- Features:
  - Displays component name, category badge, last modified date.
  - "Open in Studio" button linking/routing to `/studio/[id]`.
  - Tabs:
    - `Preview`: Sandboxed render of component demo in an isolated iframe or container.
    - `Code`: Subtabs for `component.tsx`, `demo.tsx`, `index.css` with 1-click "Copy Code" and `npx shadcn` command.
    - `History`: Timeline displaying saved checkpoints and variants count.

- [ ] **Step 1: Write test for `QuickPreviewModal`**

Create `components/hub/__tests__/quick-preview-modal.test.tsx`:
```typescript
import { describe, it, expect, beforeEach } from "bun:test";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuickPreviewModal } from "../quick-preview-modal";
import { useStudioStore } from "@/lib/store/studio-store";

describe("QuickPreviewModal", () => {
  beforeEach(() => {
    useStudioStore.setState((s) => ({
      ...s,
      userComponents: {
        "test-card": {
          id: "test-card",
          name: "Test Interactive Card",
          description: "A sleek test card component",
          category: "Cards",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          files: {
            "component.tsx": "export default function TestCard() { return <div>Card</div>; }",
            "demo.tsx": "import TestCard from './component'; export default function Demo() { return <TestCard />; }",
            "index.css": "",
          },
          dependencies: [],
        },
      },
      quickPreviewComponentId: "test-card",
    }));
  });

  it("should render component details and preview tabs when active", () => {
    render(<QuickPreviewModal />);
    expect(screen.getByText("Test Interactive Card")).toBeTruthy();
    expect(screen.getByText("Cards")).toBeTruthy();
    expect(screen.getByRole("tab", { name: /preview/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /code/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /open in studio/i })).toBeTruthy();
  });

  it("should switch between preview and code tab", () => {
    render(<QuickPreviewModal />);
    const codeTab = screen.getByRole("tab", { name: /code/i });
    fireEvent.click(codeTab);
    expect(screen.getByText(/export default function TestCard/i)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test components/hub/__tests__/quick-preview-modal.test.tsx`
Expected: FAIL (File not found)

- [ ] **Step 3: Implement `QuickPreviewModal`**

Create `components/hub/quick-preview-modal.tsx`:
- Render with Dialog primitive centered.
- Tab bar with `Preview`, `Code`, `History`.
- In `Code`, provide tab buttons for `component.tsx`, `demo.tsx`, `index.css` with code viewer and copy buttons.
- In `Preview`, compile or render live sandbox preview.
- "Open in Studio" navigation button using `useRouter` or `<Link href={/studio/${component.id}}>`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test components/hub/__tests__/quick-preview-modal.test.tsx`
Expected: PASS

---

### Task 4: Build Component Card & Component Hub (`components/hub/component-card.tsx` & `components/hub/component-hub.tsx`)

**Files:**
- Create: `components/hub/component-card.tsx`
- Create: `components/hub/component-hub.tsx`
- Test: `components/hub/__tests__/component-hub.test.tsx`

**Interfaces:**
- `ComponentCard`:
  - Renders single component: title, category badge, relative time, variant count, checkpoint count.
  - Interactive hover state, "Preview" trigger, "Studio" trigger, and menu for Duplicate/Delete.
- `ComponentHub`:
  - Top header with brand "21st Studio", dark/light toggle, and "+ New Component" button.
  - Metrics row: Total Components, Custom Components, Checkpoints Saved, Recent Activity.
  - Filter bar: Search input + category pills (`All`, `Recent Work`, `Heroes`, `Cards`, `Buttons`, `Badges`, `Custom`).
  - Grid of `ComponentCard`s with empty states.
  - Integrates `CreateComponentDialog` and `QuickPreviewModal`.

- [ ] **Step 1: Write test for `ComponentHub`**

Create `components/hub/__tests__/component-hub.test.tsx`:
```typescript
import { describe, it, expect, beforeEach } from "bun:test";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ComponentHub } from "../component-hub";
import { useStudioStore } from "@/lib/store/studio-store";

describe("ComponentHub", () => {
  beforeEach(() => {
    useStudioStore.setState((s) => ({
      ...s,
      userComponents: {
        "comp-1": {
          id: "comp-1",
          name: "Aurora Button",
          description: "Shimmer button component",
          category: "Buttons",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          files: { "component.tsx": "", "demo.tsx": "", "index.css": "" },
          dependencies: [],
        },
        "comp-2": {
          id: "comp-2",
          name: "Spotlight Card",
          description: "Mouse spotlight card",
          category: "Cards",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          files: { "component.tsx": "", "demo.tsx": "", "index.css": "" },
          dependencies: [],
        },
      },
      recentComponentIds: ["comp-1", "comp-2"],
    }));
  });

  it("should render component cards and metrics in hub", () => {
    render(<ComponentHub />);
    expect(screen.getByText("Aurora Button")).toBeTruthy();
    expect(screen.getByText("Spotlight Card")).toBeTruthy();
    expect(screen.getByRole("button", { name: /new component/i })).toBeTruthy();
  });

  it("should filter components when typing in search box", () => {
    render(<ComponentHub />);
    const search = screen.getByPlaceholderText(/search components/i);
    fireEvent.change(search, { target: { value: "Aurora" } });
    expect(screen.getByText("Aurora Button")).toBeTruthy();
    expect(screen.queryByText("Spotlight Card")).toBeNull();
  });

  it("should filter components when clicking category pill", () => {
    render(<ComponentHub />);
    const cardsPill = screen.getByRole("button", { name: /^Cards/i });
    fireEvent.click(cardsPill);
    expect(screen.getByText("Spotlight Card")).toBeTruthy();
    expect(screen.queryByText("Aurora Button")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test components/hub/__tests__/component-hub.test.tsx`
Expected: FAIL (File not found)

- [ ] **Step 3: Implement `ComponentCard` and `ComponentHub`**

Create `components/hub/component-card.tsx` and `components/hub/component-hub.tsx`:
- Use Geist Sans typography (`font-sans`) across all copy.
- Use shadcn `Button`, `Badge`, `Input`, `DropdownMenu`.
- Connect search query, category selection, and recent sorting.
- Wire "+ New Component" to open `isCreateComponentDialogOpen`.
- Wire card click to `setQuickPreviewComponentId`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test components/hub/__tests__/component-hub.test.tsx`
Expected: PASS

---

### Task 5: Route Integration & Studio Header Navigation

**Files:**
- Modify: `app/page.tsx`
- Create: `app/studio/[id]/page.tsx`
- Create: `app/studio/page.tsx`
- Modify: `components/studio/studio-header.tsx`
- Modify: `components/studio/studio-container.tsx`
- Test: `components/studio/__tests__/studio-header-navigation.test.tsx`

**Interfaces:**
- `/` renders `<ComponentHub />`
- `/studio/[id]` loads component with `id` into `useStudioStore` and renders `<StudioContainer />`
- `/studio` redirects to last active component or default
- `StudioHeader` displays:
  - `<Link href="/"><Button variant="ghost" size="sm" className="gap-2 font-sans"><ArrowLeft className="size-4" /> Library</Button></Link>`
  - Component name badge/title with quick rename or status indicator.

- [ ] **Step 1: Write test for StudioHeader Library navigation button**

Create `components/studio/__tests__/studio-header-navigation.test.tsx`:
```typescript
import { describe, it, expect, beforeEach } from "bun:test";
import React from "react";
import { render, screen } from "@testing-library/react";
import { StudioHeader } from "../studio-header";
import { useStudioStore } from "@/lib/store/studio-store";

describe("StudioHeader Navigation", () => {
  beforeEach(() => {
    useStudioStore.setState((s) => ({
      ...s,
      currentTemplateId: "ink-orbit-hero",
      userComponents: {
        "ink-orbit-hero": {
          id: "ink-orbit-hero",
          name: "Ink Orbit 3D Hero",
          description: "Hero demo",
          category: "Heroes",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          files: { "component.tsx": "", "demo.tsx": "", "index.css": "" },
          dependencies: [],
        },
      },
    }));
  });

  it("should render Back to Library button in StudioHeader", () => {
    render(<StudioHeader />);
    const backBtn = screen.getByRole("link", { name: /library/i }) || screen.getByText(/library/i);
    expect(backBtn).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test components/studio/__tests__/studio-header-navigation.test.tsx`
Expected: FAIL (No Library button in StudioHeader)

- [ ] **Step 3: Update `app/page.tsx`, `components/studio/studio-header.tsx`, and create studio routes**

- Modify `app/page.tsx` to render `<ComponentHub />`.
- Create `app/studio/[id]/page.tsx` (Client component or server wrapper with `use(params)` or `useParams()`) that invokes `loadComponent(id)` and renders `<StudioContainer />`.
- Create `app/studio/page.tsx` with redirect to `/` or the default component.
- Add `<Link href="/">` with `<ArrowLeft className="size-4" /> Library` in `StudioHeader`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test components/studio/__tests__/studio-header-navigation.test.tsx`
Expected: PASS

---

### Task 6: Comprehensive Verification & Type Safety

- [ ] **Step 1: Run full test suite**

Run: `bun test`
Expected: All tests pass (dialogs, diff viewer, history sheet, version control integration, component registry, hub, quick preview).

- [ ] **Step 2: Run TypeScript compiler check**

Run: `bun x tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Verify dev build / linting**

Run: `bun run lint`
Expected: 0 blocking errors.
