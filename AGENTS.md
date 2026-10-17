<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Component Studio Project Design & Agent Rules

## 1. Typography Standards (Geist Sans vs. Geist Mono)

- **Default Font is Geist Sans (`font-sans`)**:
  - **ALL** user interface text must use `font-sans`. This includes:
    - Navigation headers, titles, subtitles, and descriptions.
    - Buttons, tabs, dropdowns, and menu items.
    - Badges, status pills, count indicators (e.g. error/warning counters), and chip labels.
    - Dialog titles, modals, form inputs, placeholders, and tooltips.
    - Terminal UI chrome (panel header tabs, action buttons, filter pills).
  - **NEVER** apply `font-mono` to entire containers or wrappers (e.g., do not wrap a panel header or modal in `font-mono`).

- **Strictly Limited Geist Mono (`font-mono`) Rules**:
  - `font-mono` is strictly allowed **ONLY** for:
    1. **Mono Eyebrows**: Section eyebrow labels that are uppercase, 10–12px, font-medium, tracking-wider (e.g., `MONACO EDITOR`, `CONSTRUCT REGISTRY`).
    2. **Raw Code & AST Data**: Code blocks, Monaco editor, JSON payloads, AST props, imports/exports.
    3. **CLI Commands & Shell Strings**: e.g., `npx shadcn@latest add ...`, `bun add ...`.
    4. **Terminal Log Message Stream & REPL Prompt**: The actual streaming log output lines and the command prompt input box. (All terminal header tabs, filter buttons, and error count badges MUST remain `font-sans`).
    5. **Identifiers & Slugs**: Component slugs (e.g. `interactive-button`), package names, file paths (e.g. `component.tsx`), and keyboard shortcuts (`<kbd>`).

## 2. Component System & shadcn/ui Standards

- **Always Use Official shadcn/ui Primitives**:
  - Use standard `@/components/ui/*` primitives (`Button`, `Badge`, `Input`, `Dialog`, `Tabs`, `Tooltip`, `DropdownMenu`, etc.).
  - **No Raw HTML Buttons for UI Actions**: Never use raw unstyled `<button>` tags for interactive UI controls. Always use `<Button variant="..." size="...">` with proper styling and accessible focus rings.
  - **No Fake Badges**: Use the official `<Badge variant="...">` component rather than manual `<span className="px-2 py-0.5 rounded-full ...">`.

## 3. Modal & Dialog Rules

- **Dialog Overlay & Positioning**:
  - All modals must be centered with `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`.
  - Max width and responsive sizing must respect `w-[calc(100vw-2rem)]` and `max-h-[90vh]`.
  - Content must have `overflow-y-auto overflow-x-hidden` and use `flex flex-col` rather than unconstrained raw CSS grids that cause modal overflow or clipping.

## 4. Code Quality & Compilation

- Always run `bun x tsc --noEmit` before finishing any task to guarantee 0 TypeScript errors.
- Preserve all existing comments and documentation unless instructed otherwise.
