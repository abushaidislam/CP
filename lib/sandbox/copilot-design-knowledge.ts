/**
 * Component Studio Co-Pilot — Surgical UI Preservation Skill & Design Engineering Knowledge Base
 *
 * Includes:
 * 1. COPILOT_UI_PRESERVATION_SKILL (Zero-UI-Drift / Design Lock Skill - Default Active):
 *    Ensures any code change, logic addition, bug fix, refactor, or standards audit
 *    keeps the existing UI and visual design 100% untouched.
 * 2. COPILOT_PREMIUM_DESIGN_MANIFESTO:
 *    Applied ONLY when the developer explicitly requests new visual styling or UI redesign.
 */

export const COPILOT_UI_PRESERVATION_SKILL = `
================================================================================
ACTIVE SKILL: SURGICAL UI & DESIGN PRESERVATION (ZERO-UI-DRIFT / DESIGN LOCK)
================================================================================

CRITICAL MANDATE — DO NOT CHANGE THE EXISTING VISUAL DESIGN OR UI:
When executing this request, you MUST treat the component's current visual appearance, layout, and styling as LOCKED. Make the requested functional, structural, TypeScript, state, accessibility, or standards changes while keeping the UI looking 100% identical.

1. ZERO VISUAL DRIFT RULES (MANDATORY):
   - DO NOT change, remove, or replace existing Tailwind visual classes for:
     * Colors, backgrounds, text colors, border colors, or gradients ("bg-*", "text-*", "border-*", "from-*", "via-*", "to-*").
     * Layout structure, flex/grid directions, alignment, dimensions, padding, margins, or gaps ("flex", "grid", "p-*", "px-*", "py-*", "m-*", "gap-*", "w-*", "h-*", "max-w-*", "min-h-*").
     * Border radius, shadows, rings, opacity, or backdrop filters ("rounded-*", "shadow-*", "ring-*", "backdrop-blur-*").
     * Typography sizes, weights, tracking, or line-heights ("text-*", "font-*", "tracking-*", "leading-*").
     * Existing animations, keyframes, or Framer Motion visual variants/transitions.
   - DO NOT alter the visual DOM hierarchy, reorder visible elements, change icons, or rewrite visible text/copy unless the user explicitly asks to change that specific text or element.

2. HOW TO APPLY CHANGES WITHOUT ALTERING THE DESIGN:
   - Adding TypeScript Props / State / Logic:
     * Add the requested props, hooks (useState, useEffect, useRef, useMemo, useCallback), event handlers, or data bindings around the existing JSX without changing any visual className strings.
   - Forwarding className with cn():
     * Keep the exact existing className string verbatim as the first argument to cn(), and append the custom className prop at the end:
       Example: className={cn("...exact existing classes untouched...", className)}
   - Refactoring / Extracting Subcomponents:
     * If splitting into subcomponents or cleaning up code, every rendered HTML element must retain its exact original Tailwind classes and DOM nesting so the rendered pixels do not shift by even 1px.
   - Fixing Bugs / Compiler Errors / Standards Audits:
     * Fix only the broken import, syntax, missing "use client" directive, TypeScript interface, or ARIA attribute.
     * NEVER "clean up" or "improve" the component's colors, gradients, shadows, or layout while fixing a bug or auditing standards.

3. WHEN IS VISUAL CHANGE ALLOWED?
   - ONLY modify visual styling (colors, spacing, animations, dark mode classes, or layout) if the user's current prompt EXPLICITLY asks to change that specific visual aspect (e.g., "change color to blue", "add dark mode classes", "add hover spring animation", "redesign the card").
   - Even then, modify ONLY the specific visual property requested and leave the rest of the design 100% intact.
`;

export const COPILOT_PREMIUM_DESIGN_MANIFESTO = `
================================================================================
PREMIUM DESIGN ENGINEERING MANIFESTO & CRAFT FLOOR (ONLY FOR EXPLICIT UI DESIGN REQUESTS)
================================================================================

NOTE: Apply the visual styling guidelines below ONLY when the developer explicitly asks to create a new UI design, restyle the component, add animations, or add dark/light theme styling. NEVER use these rules to overwrite or alter an existing component's visual design during functional edits, refactors, bug fixes, or standard audits.

--------------------------------------------------------------------------------
1. AESTHETIC CRAFT (WHEN DESIGNING OR RESTYLING UI)
--------------------------------------------------------------------------------
- CLEAN VISUAL HIERARCHY:
  * Write realistic, contextual micro-copy suited for real-world software products when creating new elements.
  * Prefer specific transition properties (e.g., "transition-colors", "transition-transform", "transition-opacity") on newly created interactive elements.
  * Include accessible focus-visible states on newly created interactive controls.

--------------------------------------------------------------------------------
2. OPTICAL CRAFT & GEOMETRY (FOR NEW UI ELEMENTS)
--------------------------------------------------------------------------------
- CONCENTRIC BORDER RADII:
  * Outer Radius = Inner Radius + Padding when designing new nested containers.
- TYPOGRAPHY & TABULAR NUMBERS:
  * Use "tabular-nums" on newly created dynamic numerical counters or metrics.
- ELEVATION & BORDERS:
  * Use subtle 1px borders ("border border-border/50") and balanced dark/light contrast when asked to theme a component.

--------------------------------------------------------------------------------
3. FLUID MOTION & SPRING PHYSICS (WHEN MOTION IS REQUESTED)
--------------------------------------------------------------------------------
- SPRINGS OVER ARBITRARY TIMERS:
  * Default UI Motion: Framer Motion spring { type: "spring", stiffness: 380, damping: 30 }.
  * Tactile Press Feedback: "whileTap={{ scale: 0.96 }}" or "active:scale-[0.96]" when adding interactive press states.

--------------------------------------------------------------------------------
4. 21ST.DEV 100% PARITY & FILE CONVENTIONS (MANDATORY)
--------------------------------------------------------------------------------
- DIRECTORY & IMPORT ARCHITECTURE:
  * "default.tsx" (under demos/) MUST import the component using:
    import Component from "../components/ui/component";
  * "default.tsx" MUST export:
    export default function Demo() { return <div className="flex min-h-[350px] w-full items-center justify-center p-4"><Component /></div>; }
  * "component.tsx" MUST start with "use client"; at the very top (line 1) whenever hooks, state, or animations are used.
  * "component.tsx" MUST export as default: export default function Component(...) or export default function <Name>(...).
  * "component.tsx" MUST accept and forward className?: string using cn(...) from "@/lib/utils" while keeping all existing visual classes intact.
- ZERO-MODIFICATION 21ST.DEV COPY-PASTE GUARANTEE:
  * All code must be 100% copy-pasteable directly into 21st.dev's sandbox without requiring any path modifications.
`;