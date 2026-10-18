# Layout Declutter & Architectural Polish Plan

Refactoring the Component Studio workspace layout to eliminate visual clutter ("hibi-jabi" UI), remove redundant toolbars, resolve the 3-column squeeze, and establish a clean, editorial workspace rhythm.

### User Review & Critical Decisions

> [!IMPORTANT]
> The current layout suffers from three main structural problems:
> 1. **Horizontal Compression**: Having Editor + Canvas + AI Copilot all docked simultaneously squashes the workspace into three cramped columns.
> 2. **Vertical Cramming in Editor**: The Terminal is trapped inside the left column under Monaco Editor, drastically reducing code viewing height.
> 3. **Toolbar Duplication**: Theme toggles, preview viewports, and action badges appear redundantly across the Top Header, Editor Header, and Canvas Toolbar.

- **Workspace AI Copilot**: Converted into a non-destructive slide-over drawer with smooth transition or smart docked panel so the editor and canvas never feel claustrophobic.
- **Terminal & Console**: Repositioned as a full-width bottom shelf across the entire workspace with quick one-click expand/collapse, preserving full Monaco vertical height.
- **Toolbar Consolidation**: Unifying redundant controls, removing nested "card-inside-card" headers, and standardizing all UI typography to clean Google Sans/Geist typography rules.

---

### 1. Overview & Core Concept

TechFossil Component Studio is an editorial, production-grade component engineering sandbox. The interface should feel like an established developer platform (inspired by Vercel, Linear, and Google Developer Tools) with generous breathing room, high information density without clutter, and zero artificial gimmicks.

---

### 2. User Experience & Visual Design

#### Structural Refactoring:
1. **Studio Header (Top Navigation)**:
   - **Zone 1 (Left)**: Single-line brand identity with quiet template selector.
   - **Zone 2 (Center)**: Clean segmented view mode switch (`Split` | `Code` | `Preview`).
   - **Zone 3 (Right)**: Consolidated action zone containing Terminal toggle with status indicator, Copilot toggle, Theme toggle, and a single prominent "Publish Package" action.
   - Eliminates redundant badges and secondary border wrappers.

2. **Editor Workspace (Left Column)**:
   - Clean single-row tab strip (`component.tsx`, `demo.tsx`, `index.css`).
   - Grouped utility actions: Prettier auto-format, package manager trigger, and template reset.
   - Monaco code area receives 100% of the vertical space when Terminal is collapsed.

3. **Canvas Preview (Right Column)**:
   - Removal of duplicate card wrappers: The canvas preview will use an authentic framing approach without double headers.
   - Responsive viewport controls (`Desktop` · `Tablet` · `Mobile` · `Fluid`) streamlined into a quiet segmented switch.
   - Background and Zoom tools combined into a compact display setting menu.

4. **Full-Width Bottom Terminal Shelf**:
   - Spans the full width of the editor/preview workspace rather than being squeezed inside the left column.
   - Collapsible to a quiet 28px bottom status bar showing line counts, runtime health, and error counts.
   - Expandable on demand with smooth height drag handle and REPL prompt.

5. **AI Copilot Presentation**:
   - An elegant side sheet drawer that slides smoothly from the right edge with a floating trigger, or docks cleanly with a smart minimum width constraint.
   - Clean message hierarchy without decorative candy badges or fake telemetry.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Full-width bottom shelf vs. left-column terminal**
  - *Chosen*: Full-width bottom shelf across the workspace.
  - *Why*: Terminal output (stack traces, REPL command logs, object dumps) requires horizontal space. Squeezing it inside the left column underneath Monaco breaks both code readability and log readability.
- **Decision 2: Slide-over AI Copilot vs. static third column**
  - *Chosen*: Smart responsive slide-over drawer that can overlay cleanly and preserve editor and preview widths.
  - *Why*: Eliminates the claustrophobic 3-column squeeze where each panel is rendered nearly unusable on standard laptop displays.
- **Decision 3: Deduplicating the Theme Controls**
  - *Chosen*: A single studio-wide theme switcher in the header, with a focused "Sandbox Preview Dark/Light" toggle inside the canvas settings.
  - *Why*: Eliminates user confusion from having theme toggle buttons in multiple places.

---

### 4. Technical Architecture & Component Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Top Studio Header                               │
│  [Logo / Template]        [ Split | Code | Preview ]    [Term|AI|Publish]│
├───────────────────────────────────┬────────────────────────────────────┤
│                                   │                                    │
│         Editor Panel              │         Canvas Preview             │
│  [Tabs: comp/demo/css] [Actions]  │  [Viewport & Zoom]   [Theme Mode]  │
│                                   │                                    │
│  ┌─────────────────────────────┐  │  ┌──────────────────────────────┐  │
│  │                             │  │  │                              │  │
│  │       Monaco Editor         │  │  │       Live Sandboxed         │  │
│  │   (Full-height surface)     │  │  │        Iframe View           │  │
│  │                             │  │  │                              │  │
│  └─────────────────────────────┘  │  └──────────────────────────────┘  │
│                                   │                                    │
├───────────────────────────────────┴────────────────────────────────────┤
│       Full-Width Terminal & Console Shelf (Collapsible / Resizable)    │
│  [Terminal | Filters: All · Errors · Logs]               [REPL Input]  │
└────────────────────────────────────────────────────────────────────────┘
                    ▲
                    │ Slide-over Drawer (Ctrl+I)
          ┌──────────────────────┐
          │  AI Copilot Drawer   │
          │  Role · Model · Chat │
          └──────────────────────┘
```

### 5. Step-by-Step Implementation Strategy

1. **`components/studio/studio-container.tsx`**: Reorganize the outer flex tree so Terminal is a full-width bottom drawer across the workspace, and AI Copilot behaves as a slide-over drawer.
2. **`components/studio/studio-header.tsx`**: Declutter header items, improve baseline alignment, consolidate buttons, and remove duplicate borders.
3. **`components/studio/editor-panel.tsx`**: Remove the nested terminal from within the editor column, restoring 100% editor height, and simplify tab styling.
4. **`components/studio/canvas-preview.tsx`**: Remove redundant card-within-card headers, simplify the toolbar, and improve viewport spacing.
5. **`components/studio/terminal-panel.tsx`**: Update layout to adapt seamlessly to full-width dock mode with clean font-sans tabs and font-mono output streams.
6. **Verification**: Run TypeScript compile check and `compile_applet` to guarantee 0 regressions.
