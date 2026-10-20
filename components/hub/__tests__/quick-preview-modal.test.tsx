import { mock, describe, it, expect, beforeEach } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";

// Registry to capture onClick handlers and props
const buttonClickMap = new Map<string, (e?: any) => void>();
let lastDialogOnOpenChange: ((open: boolean) => void) | null = null;

// Mock @/components/ui/dialog
mock.module(import.meta.resolve("@/components/ui/dialog"), () => ({
  Dialog: ({ open, onOpenChange, children }: any) => {
    lastDialogOnOpenChange = onOpenChange;
    return open ? <div data-testid="dialog-root">{children}</div> : null;
  },
  DialogContent: ({ children, className }: any) => (
    <div className={className} data-testid="dialog-content">
      {children}
    </div>
  ),
  DialogHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  DialogTitle: ({ children, className }: any) => <h2 className={className}>{children}</h2>,
  DialogDescription: ({ children, className }: any) => <p className={className}>{children}</p>,
  DialogFooter: ({ children, className }: any) => <div className={className}>{children}</div>,
  DialogClose: ({ children }: any) => <button type="button">{children}</button>,
}));

// Mock @/components/ui/button to capture onClick handlers
mock.module(import.meta.resolve("@/components/ui/button"), () => ({
  Button: ({ children, onClick, type, className, variant, size, asChild, ...props }: any) => {
    const extractText = (node: any): string => {
      if (!node) return "";
      if (typeof node === "string") return node;
      if (typeof node === "number") return String(node);
      if (Array.isArray(node)) return node.map(extractText).join(" ");
      if (node.props && node.props.children) return extractText(node.props.children);
      return "";
    };

    const text = extractText(children).trim();
    const ariaLabel = props["aria-label"] || "";

    if (onClick) {
      if (text) {
        buttonClickMap.set(text, onClick);
        if (text.includes("Open in Studio")) buttonClickMap.set("Open in Studio", onClick);
        if (text.includes("Copy Code")) buttonClickMap.set("Copy Code", onClick);
        if (text.includes("Reset Preview")) buttonClickMap.set("Reset Preview", onClick);
        if (text.includes("Retry Preview")) buttonClickMap.set("Retry Preview", onClick);
        if (text.includes("Light Mode")) buttonClickMap.set("Light Mode", onClick);
        if (text.includes("Dark Mode")) buttonClickMap.set("Dark Mode", onClick);
      }
      if (ariaLabel) {
        buttonClickMap.set(ariaLabel, onClick);
      }
    }

    return (
      <button type={type || "button"} onClick={onClick} className={className} {...props}>
        {children}
      </button>
    );
  },
  buttonVariants: () => "",
}));

// Wrap useStudioStore hook so it returns live state during tests
const actualStore = await import("@/lib/store/studio-store");
const storeWrapper = Object.assign(
  (selector?: (state: any) => any) =>
    selector ? selector(actualStore.useStudioStore.getState()) : actualStore.useStudioStore.getState(),
  actualStore.useStudioStore
);

mock.module(import.meta.resolve("@/lib/store/studio-store"), () => ({
  ...actualStore,
  useStudioStore: storeWrapper,
}));

const { useStudioStore } = await import("@/lib/store/studio-store");
const { QuickPreviewModal } = await import("../quick-preview-modal");

describe("QuickPreviewModal", () => {
  beforeEach(() => {
    buttonClickMap.clear();
    lastDialogOnOpenChange = null;

    useStudioStore.setState((s) => ({
      ...s,
      userComponents: {
        "test-card": {
          id: "test-card",
          name: "Test Interactive Card",
          description: "A sleek test card component",
          category: "Cards",
          createdAt: 1700000000000,
          updatedAt: 1700000000000,
          files: {
            "component.tsx": "export default function TestCard() { return <div>Card</div>; }",
            "demo.tsx": "import TestCard from './component'; export default function Demo() { return <TestCard />; }",
            "index.css": ".card { color: red; }",
          },
          dependencies: ["clsx"],
        },
      },
      variantsByTemplate: {
        "test-card": [
          {
            id: "var-1",
            name: "Default Variant",
            createdAt: 1700000000000,
            updatedAt: 1700000000000,
            files: {
              "component.tsx": "export default function TestCard() { return <div>Card</div>; }",
              "demo.tsx": "import TestCard from './component'; export default function Demo() { return <TestCard />; }",
              "index.css": ".card { color: red; }",
            },
            dependencies: ["clsx"],
            checkpoints: [
              {
                id: "cp-1",
                name: "Initial Snapshot",
                description: "Baseline commit for test card",
                timestamp: "1700000000000",
                createdAt: 1700000000000,
                files: {
                  "component.tsx": "export default function TestCard() { return <div>Card</div>; }",
                  "demo.tsx": "import TestCard from './component'; export default function Demo() { return <TestCard />; }",
                  "index.css": ".card { color: red; }",
                },
                dependencies: ["clsx"],
              },
            ],
          },
        ],
      },
      quickPreviewComponentId: "test-card",
    }));
  });

  it("should not render modal content when quickPreviewComponentId is null", () => {
    useStudioStore.setState({ quickPreviewComponentId: null });
    const html = renderToString(<QuickPreviewModal />);
    expect(html).toBe("");
  });

  it("should render component details, eyebrow badge, tabs, and action button when active", () => {
    const html = renderToString(<QuickPreviewModal />);

    // Header & Eyebrow
    expect(html).toContain("21ST QUICK PREVIEW");
    expect(html).toContain("Test Interactive Card");
    expect(html).toContain("Cards");
    expect(html).toContain("Open in Studio");

    // Tab buttons
    expect(html).toContain("Preview");
    expect(html).toContain("Code");
    expect(html).toContain("History");

    // Preview tab default content (iframe)
    expect(html).toContain("<iframe");
    expect(html).toContain("Test Interactive Card Preview");
    expect(html).toContain('sandbox="allow-scripts allow-same-origin allow-modals allow-popups"');
  });

  it("should handle 'Open in Studio' click and invoke loadComponent and onOpenStudio callback", () => {
    let openedId: string | null = null;
    renderToString(<QuickPreviewModal onOpenStudio={(id) => { openedId = id; }} />);

    const openBtn = buttonClickMap.get("Open in Studio");
    expect(openBtn).toBeDefined();

    openBtn!();

    expect(openedId).toBe("test-card");
    expect(useStudioStore.getState().quickPreviewComponentId).toBeNull();
    expect(useStudioStore.getState().currentTemplateId).toBe("test-card");
  });

  it("should render preview canvas controls (theme toggle and reset preview) in toolbar", () => {
    const html = renderToString(<QuickPreviewModal defaultTab="preview" />);

    expect(html).toContain("Reset Preview");
    expect(html).not.toContain("Retry Preview");
    // Should have dark/light theme switch button
    expect(html).toMatch(/Light Mode|Dark Mode/);

    const resetBtn = buttonClickMap.get("Reset Preview");
    expect(resetBtn).toBeDefined();
    expect(() => resetBtn!()).not.toThrow();
  });

  it("should render Retry Preview button in compilation error alert when error occurs", () => {
    useStudioStore.setState((s) => ({
      ...s,
      userComponents: {
        "test-card": {
          id: "test-card",
          name: "Test Interactive Card",
          description: "A sleek test card component",
          category: "Cards",
          createdAt: 1700000000000,
          updatedAt: 1700000000000,
          files: {
            "component.tsx": "export default function Broken( {", // invalid syntax
            "demo.tsx": "",
            "index.css": "",
          },
          dependencies: [],
        },
      },
      quickPreviewComponentId: "test-card",
    }));

    const html = renderToString(<QuickPreviewModal defaultTab="preview" />);
    expect(html).toContain("Preview compilation error:");
    expect(html).toContain("Retry Preview");

    const retryBtn = buttonClickMap.get("Retry Preview");
    expect(retryBtn).toBeDefined();
    expect(() => retryBtn!()).not.toThrow();
  });

  it("should render code viewer, CLI command, and copy buttons in Code tab", () => {
    const html = renderToString(<QuickPreviewModal defaultTab="code" />);

    // Code files subtabs
    expect(html).toContain("component.tsx");
    expect(html).toContain("demo.tsx");
    expect(html).toContain("index.css");

    // Code snippet
    expect(html).toContain("export default function TestCard");

    // CLI command
    expect(html).toContain("npx shadcn@latest add test-card");
    expect(html).toContain("Copy Code");
    expect(buttonClickMap.get("Copy CLI command")).toBeDefined();
  });

  it("should render selected code file when subtab changes", () => {
    const html = renderToString(
      <QuickPreviewModal defaultTab="code" defaultCodeFile="demo.tsx" />
    );

    expect(html).toContain("import TestCard from &#x27;./component&#x27;");
  });

  it("should render checkpoints and variants in History tab", () => {
    const html = renderToString(<QuickPreviewModal defaultTab="history" />);

    expect(html).toContain("Default Variant");
    expect(html).toContain("Initial Snapshot");
    expect(html).toContain("Baseline commit for test card");
    expect(html).toContain("1 Checkpoint");
  });

  it("should render empty history state when no variants exist", () => {
    useStudioStore.setState({ variantsByTemplate: {} });
    const html = renderToString(<QuickPreviewModal defaultTab="history" />);

    expect(html).toContain("No History Recorded");
  });

  it("should reset quickPreviewComponentId when dialog onOpenChange is called with false", () => {
    renderToString(<QuickPreviewModal />);

    expect(lastDialogOnOpenChange).toBeDefined();
    lastDialogOnOpenChange!(false);

    expect(useStudioStore.getState().quickPreviewComponentId).toBeNull();
  });
});
