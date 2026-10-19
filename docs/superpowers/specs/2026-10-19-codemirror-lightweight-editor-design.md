# Lightweight Code Editor Specification (CodeMirror 6 Replacement for Monaco)

**Date:** 2026-10-19  
**Status:** Approved  
**Author:** Antigravity Pairing Assistant & Engineering Team  

---

## 1. Context & Motivation

In the current Component Studio implementation, the code editor is powered by `@monaco-editor/react` (VS Code's web editor core). While powerful, Monaco introduces significant drawbacks for this project:
- **Bundle Bloat:** Monaco downloads between 5 MB to 7 MB of JavaScript assets and web workers.
- **High Memory Footprint:** Monaco runs multiple Web Workers (`ts.worker.js`, `editor.worker.js`) in the browser, consuming 50 MB to 70 MB of RAM per instance.
- **Cold-Start Delay:** Requires a distinct loading screen ("Initializing Monaco Engine...") before users can type.
- **Disproportionate Complexity:** Component Studio only requires editing three local template files (`component.tsx`, `demo.tsx`, `styles.css`) which are then compiled in-browser via `sucrase`. Full VS Code Language Server Protocol (LSP) and multi-root workspace capabilities are unnecessary.

We are replacing Monaco with **CodeMirror 6** via `@uiw/react-codemirror`, reducing bundle size by ~95% (~300 KB), eliminating Web Worker overhead, and enabling near-instantaneous editor startup.

---

## 2. Technical Requirements

### 2.1 Dependencies
- **Add:**
  - `@uiw/react-codemirror` (React 19 compatible CodeMirror 6 wrapper)
  - `@codemirror/lang-javascript` (TypeScript & JSX/TSX syntax support via Lezer parser)
  - `@codemirror/lang-css` (CSS syntax support)
  - `@codemirror/view` & `@codemirror/state` (Core extensions, keymaps, theming)
- **Remove:**
  - `@monaco-editor/react`

### 2.2 Component Contract
The new editor will be encapsulated in `components/studio/code-editor.tsx` and preserve the existing editor contract:
```typescript
import { StudioFileName } from "@/lib/store/studio-store";

export interface CodeEditorProps {
  filename: StudioFileName;
  value: string;
  onChange: (value: string) => void;
  onFormat?: () => void;
}
```

### 2.3 Syntax & Language Switching
- When `filename.endsWith(".tsx")` or `filename.endsWith(".ts")`, load `javascript({ jsx: true, typescript: true })`.
- When `filename.endsWith(".css")`, load `css()`.
- Default to `javascript()`.

### 2.4 Theming (Vercel Light & Dark)
The theme must faithfully reproduce the project's Vercel-inspired aesthetic:
- **Light Theme:**
  - Background: `#ffffff`, Foreground: `#171717`
  - Active Line: `#fafafa`, Selection: `#d3e5ff`, Cursor: `#0070f3`
  - Line Numbers: `#a1a1a1`, Active Line Number: `#171717`
  - Syntax tokens: Keywords `#0070f3`, Strings `#7928ca`, Numbers `#f5a623`, Tags `#eb367f`, Delimiters `#8f8f8f`
- **Dark Theme:**
  - Background: `#0a0a0a`, Foreground: `#ededed`
  - Active Line: `#141414`, Selection: `#27272a`, Cursor: `#0070f3`
  - Line Numbers: `#52525b`, Active Line Number: `#ededed`
  - Syntax tokens: Keywords `#ff0080`, Strings `#50e3c2`, Numbers `#f9cb28`, Types `#00dfd8`, Tags `#7928ca`
- Automatic switching based on `document.documentElement.classList.contains("dark")`.

### 2.5 Keyboard Shortcuts & Editor Behavior
- <kbd>Ctrl+S</kbd> / <kbd>Cmd+S</kbd> must trigger `onFormat` (save & format callback).
- Typography strictly follows project rules: editor text must use `var(--font-geist-mono)` (13px font size, 22px line height).
- Essential editing capabilities:
  - Line numbers with active line gutter highlight
  - Code folding gutters
  - Bracket matching & auto-closing
  - Indent guides
  - Tab indentation (2 spaces)
  - Smooth scrolling without scrollbar overflow

---

## 3. Architecture & Integration Plan

```mermaid
graph TD
    subgraph "Editor System"
        EP[EditorPanel - components/studio/editor-panel.tsx] --> CE[CodeEditor - components/studio/code-editor.tsx]
        CE --> CM[ReactCodeMirror - @uiw/react-codemirror]
        CM --> EXT_JS[@codemirror/lang-javascript]
        CM --> EXT_CSS[@codemirror/lang-css]
        CM --> THM_V[Vercel Light / Dark Themes]
        CM --> KM_FMT[Save/Format Keymap Mod-s]
    end
    subgraph "State & Preview"
        SS[studio-store - Zustand] <--> EP
        EP --> CP[CanvasPreview - sucrase compiler]
    end
```

---

## 4. Verification & Validation Strategy
1. **Compilation & Type Check:**
   - Execute `bun x tsc --noEmit` to verify 0 TypeScript compiler errors.
2. **Feature Parity:**
   - Verify tab switching between `component.tsx`, `demo.tsx`, and `styles.css`.
   - Verify syntax highlighting renders properly in both light and dark modes.
   - Verify <kbd>Cmd+S</kbd> / <kbd>Ctrl+S</kbd> formats code through existing Prettier pipeline.
   - Verify real-time updates propagate to `canvas-preview.tsx` for instant compilation.
3. **Bundle & Performance:**
   - Confirm `@monaco-editor/react` is removed and bundle size is drastically reduced.
