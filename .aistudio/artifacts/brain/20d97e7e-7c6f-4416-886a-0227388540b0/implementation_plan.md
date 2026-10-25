# Canvas Preview Instant Snapshot Capture & Toolbar Enhancement

Add a dedicated snapshot capture button directly inside the Canvas Preview toolbar (`CanvasPreview`) and fullscreen view, enabling instant one-click capture, automatic PNG download, and clipboard copy with visual feedback.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed in Phase 1 and define this implementation:

- **Confirmed Decision 1 (Feature Scope)**: Snapshot capture button with automatic download and copy action directly integrated into the Canvas Preview toolbar.
- **Confirmed Decision 2 (Execution Behavior)**: Instant capture when clicked, triggering an immediate PNG image download and copying image data to the clipboard, accompanied by a clean success indicator and toast notification.
- **Confirmed Decision 3 (Placement & Visibility)**: Positioned directly in the main preview action strip (between Reload and Fullscreen) with an icon button + quick action dropdown, plus an entry in the compact tablet/mobile overflow (`...`) menu.

---

## 1. Overview & Core Concept

- **What It Does**: Adds an instant, one-click preview capture control directly to the canvas toolbar (`components/studio/canvas-preview.tsx`). When triggered in either split view or fullscreen mode, it requests a clean snapshot render from the sandboxed iframe, automatically downloads a high-fidelity `<component-name>-preview.png`, copies the image data to the user's system clipboard, and updates the component's card thumbnail in the studio template gallery.
- **Target Audience**: Developers, UI engineers, and technical researchers archiving component designs who need instant visual assets for documentation, presentations, GitHub PRs, or sharing.
- **Key Value**: Eliminates the friction of leaving the canvas view or searching through top navigation headers to take a component snapshot.

---

## 2. User Experience & Visual Design

- **Visual Styling & Tone**:
  - Consistent with TechFossil's editorial, polished Google Sans-inspired design language and shadcn/ui primitives.
  - Button uses `variant="ghost"` with size `size="icon"` (`size-7`), matching adjacent buttons (`RefreshCw`, `Maximize2`, `Sun/Moon`).
  - Font styling is strictly `font-sans` for tooltips, labels, and toast messages.
- **Interactive States & Transitions**:
  - **Idle State**: Clean `Camera` icon (`size-3.5`) with hover background and tooltip: *"Capture snapshot (download & copy)"*.
  - **Capturing State**: Spinning `Loader2` icon with disabled state during snapshot rasterization (< 800ms).
  - **Success State**: Smooth transition to an emerald check (`Check` icon) for 2 seconds, alongside a subtle toast notification confirming download and clipboard copy.
  - **Dropdown Options**: A secondary split trigger or dropdown menu item allows users to choose *"Copy to clipboard only"* or *"Download PNG only"* if preferred.
- **Fullscreen Preview Integration**:
  - In fullscreen preview (`isFullscreen = true`), the toolbar remains anchored at the top, allowing seamless capturing without exiting fullscreen.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Direct Toolbar Placement vs. Header Only**:
  - *Chosen Approach*: Embed the capture button directly into the `CanvasPreview` top toolbar and its overflow menu.
  - *Why*: The canvas preview is the direct visual focus of the user. Having capture inside the canvas header is standard practice in premier developer tools (Figma, Framer, Storybook, Linear).
  - *Alternatives Considered*: Leaving capture only in `StudioHeader` caused disconnect when users were focused on preview tweaking or in fullscreen mode.
- **Decision 2: Instant Dual-Action (Download + Clipboard Copy)**:
  - *Chosen Approach*: On click, trigger both automatic PNG file download and write to the browser's `navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])`.
  - *Why*: Gives the user immediate utility regardless of whether they intend to paste into Slack/GitHub or save to disk. Gracefully falls back if clipboard permissions are restricted.

---

## 4. Technical Architecture & Data Strategy

### Component Architecture & Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    CanvasPreview Toolbar                     │
│  [Viewport Tabs] [Badge] ... [Theme] [Camera] [Reload] [Max] │
└───────────────────────────────┬──────────────────────────────┘
                                │ Click "Capture"
                                ▼
┌──────────────────────────────────────────────────────────────┐
│        triggerLocalCapture() in canvas-preview.tsx           │
│  - Sets isLocalCapturing = true                              │
│  - Posts CAPTURE_PREVIEW message to iframe.contentWindow     │
└───────────────────────────────┬──────────────────────────────┘
                                │ postMessage
                                ▼
┌──────────────────────────────────────────────────────────────┐
│                   Sandbox Iframe Runtime                     │
│  - Renders #root via foreignObject / Canvas to PNG dataUrl   │
│  - Posts PREVIEW_CAPTURED { dataUrl, componentId } back      │
└───────────────────────────────┬──────────────────────────────┘
                                │ postMessage
                                ▼
┌──────────────────────────────────────────────────────────────┐
│             Message Receiver in CanvasPreview                │
│  1. Updates component preview thumbnail in Zustand store     │
│  2. Triggers file download (<a> download with dataUrl)       │
│  3. Converts dataUrl -> Blob and copies to clipboard         │
│  4. Sets captureSuccess = true for 2s feedback               │
└──────────────────────────────────────────────────────────────┘
```

### Component & State Mapping

- **Target File**: `components/studio/canvas-preview.tsx`
  - Add state `isLocalCapturing: boolean` and `captureSuccess: boolean`.
  - Add handler `handleCaptureSnapshot(actionType?: 'both' | 'download' | 'copy')`:
    - Dispatches capture request directly to the sandbox iframe.
    - Handles incoming `PREVIEW_CAPTURED` event with robust clipboard blob writing and anchor-based download.
  - Add `Camera` icon button directly in the desktop toolbar action group (between `RefreshCw` and `Maximize2`).
  - Add "Capture Snapshot" entry into the `MoreHorizontal` (`...`) overflow menu for tablet and compact views.
- **Verification**:
  - Verify with TypeScript compile check: `bun x tsc --noEmit`.
  - Verify applet compilation: `compile_applet`.
