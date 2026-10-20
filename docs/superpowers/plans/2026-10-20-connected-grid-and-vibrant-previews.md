# Implementation Plan: Connected 4-Column Grid, 8 Starter Templates & Vibrant Previews

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the component library dashboard into a contiguous 4-column connected border grid (Linear/21st.dev style), expand starter templates from 4 to 8 balanced components (filling Rows 1 & 2), provide vibrant high-fidelity preview thumbnails, and optimize the Quick Preview modal with instant fallback loading and fast rendering.

**User Decisions Confirmed via Q&A:**
1. **Grid Layout:** 4-column connected border grid with 8 total starter templates (filling both rows 1 & 2 seamlessly with 1px border dividers).
2. **Component Preview:** Both vibrant, high-fidelity card preview thumbnails AND faster, robust iframe fallback loading in Quick Preview modal.

---

## Architecture & Deliverables

1. **8 Rich Starter Templates (`lib/sandbox/default-templates.ts`)**:
   - `ink-orbit-hero`: Generative 3D hero with interactive canvas physics (Heroes)
   - `spotlight-card`: Interactive Spotlight Card with dynamic cursor glow (Cards)
   - `shimmer-button`: Aurora Shimmer Button with animated gradient sheen (Buttons)
   - `metric-badge`: Live Status Radar Badge with telemetry pulse (Badges)
   - *NEW* `aurora-ambient-hero`: Ambient Aurora Mesh Hero with responsive headline, gradient blur & dual CTAs (Heroes)
   - *NEW* `bento-metric-grid`: Multi-stat Bento Showcase Card with interactive hover lift & metrics (Cards)
   - *NEW* `neon-glow-button`: Kinetic Neon Glow Button with magnetic hover & ring beam (Buttons)
   - *NEW* `live-ping-status-pill`: Health Status Radar Pill with pulsating live beacon & ping latency (Badges)

2. **Vibrant Preview Thumbnails (`lib/store/studio-store.ts`)**:
   - Upgrade `DEFAULT_TEMPLATE_PREVIEWS` with rich, high-contrast, colorful SVG mockups featuring distinct brand gradients, neon glowing borders, realistic UI elements, and crisp typography.
   - Update `UserComponent` seed logic in `createInitialUserComponents`, `createComponent`, and `loadComponent`.

3. **Connected 4-Column Border Grid (`components/hub/component-card.tsx` & `components/hub/component-hub.tsx`)**:
   - Connected border grid layout matching the user's green-lined diagram:
     - Outer container with `border border-border/80 rounded-xl overflow-hidden bg-border/40`.
     - Inner grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border/60`.
     - Each card cell has `bg-card` and seamlessly fills its cell with no awkward gaps, creating crisp 1px border dividers between all 4 columns and all rows!
     - Top card banner with flush visual preview showcase, title, category, metadata, and quick action buttons.

4. **Fast & Robust Quick Preview Modal (`components/hub/quick-preview-modal.tsx` & `lib/sandbox/sandbox-compiler.ts`)**:
   - Register `./component` and `./component.tsx` directly in the `importmap` as data URIs for immediate browser resolution.
   - Add `allow-popups` to Quick Preview modal iframe.
   - Reduce timeout to 2500ms, and if offline or CDN is slow, provide graceful instant fallback rendering of component rather than hanging on spinner.

---

## Tasks

### Task 1: Expand to 8 Starter Templates with Vibrant Previews
- Files: `lib/sandbox/default-templates.ts`, `lib/store/studio-store.ts`, `lib/store/__tests__/component-registry-store.test.ts`
- Implement 4 new complete templates (`aurora-ambient-hero`, `bento-metric-grid`, `neon-glow-button`, `live-ping-status-pill`) with `component.tsx`, `demo.tsx`, and `index.css`.
- Add vibrant high-contrast SVG preview data URIs for all 8 templates in `DEFAULT_TEMPLATE_PREVIEWS`.
- Update store initialization and tests.

### Task 2: Implement Connected 4-Column Border Grid in `ComponentHub` & `ComponentCard`
- Files: `components/hub/component-card.tsx`, `components/hub/component-hub.tsx`, `components/hub/__tests__/component-hub.test.tsx`
- Implement 4-column connected border grid with `gap-px bg-border/60` and `divide-border`.
- Refine `ComponentCard` surface so preview canvas is prominent, visual-first, and borders merge smoothly into the connected grid.
- Verify 8 cards render in 2 clean 4-card rows.

### Task 3: Optimize Quick Preview Modal & Sandbox Compiler
- Files: `lib/sandbox/sandbox-compiler.ts`, `components/hub/quick-preview-modal.tsx`, `components/hub/__tests__/quick-preview-modal.test.tsx`
- Register `./component` data URI in `importmap` for instant module resolution.
- Enhance iframe error handling, fast fallback rendering, and instant dismissal of loading spinner upon `RENDER_SUCCESS`.

### Task 4: Comprehensive Verification & Linting
- Files: Run full `bun test`, `bun x tsc --noEmit`, `bun run lint`.
