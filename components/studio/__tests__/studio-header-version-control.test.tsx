import { mock, describe, it, expect, beforeEach } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";

// Setup global mock for window, document, and localStorage
const listeners: Record<string, ((e: any) => void)[]> = {};
let capturedEffects: (() => void | (() => void))[] = [];

const storageMap = new Map<string, string>();
const mockStorage = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, value: string) => storageMap.set(key, value),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
  length: 0,
  key: () => null,
};

if (typeof globalThis.window === "undefined") {
  globalThis.window = {
    addEventListener: (event: string, cb: any) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(cb);
    },
    removeEventListener: (event: string, cb: any) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter((l) => l !== cb);
      }
    },
    localStorage: mockStorage,
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
  } as any;
} else {
  (globalThis.window as any).localStorage = mockStorage;
  (globalThis.window as any).setTimeout = globalThis.setTimeout.bind(globalThis);
  (globalThis.window as any).clearTimeout = globalThis.clearTimeout.bind(globalThis);
}

(globalThis as any).localStorage = mockStorage;

if (typeof globalThis.document === "undefined") {
  globalThis.document = {
    documentElement: {
      classList: {
        contains: () => false,
        add: () => {},
        remove: () => {},
      },
    },
  } as any;
}

// Registry to capture onClick handlers from rendered Buttons
const buttonClickMap = new Map<string, () => void>();

// Mock @/components/ui/button to capture onClick handlers by button text
mock.module(import.meta.resolve("@/components/ui/button"), () => ({
  Button: ({ children, onClick, className, variant, size, asChild, ...props }: any) => {
    // Extract text from children
    const extractText = (node: any): string => {
      if (!node) return "";
      if (typeof node === "string") return node;
      if (typeof node === "number") return String(node);
      if (Array.isArray(node)) return node.map(extractText).join(" ");
      if (node.props && node.props.children) return extractText(node.props.children);
      return "";
    };

    const text = extractText(children).trim();
    if (onClick) {
      if (text.includes("Save")) {
        buttonClickMap.set("Save", onClick);
      }
      if (text.includes("History")) {
        buttonClickMap.set("History", onClick);
      }
      buttonClickMap.set(text, onClick);
    }

    return (
      <button onClick={onClick} className={className} {...props}>
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

// Intercept React.useEffect to capture and manually run effects during SSR
const originalUseEffect = React.useEffect;
React.useEffect = (effect: any, deps?: any) => {
  capturedEffects.push(effect);
};

const { useStudioStore } = await import("@/lib/store/studio-store");
const { TooltipProvider } = await import("@/components/ui/tooltip");
const { StudioHeader } = await import("../studio-header");

describe("StudioHeader Version Control Integration", () => {
  beforeEach(() => {
    capturedEffects = [];
    buttonClickMap.clear();
    for (const key in listeners) {
      delete listeners[key];
    }

    useStudioStore.setState({
      currentTemplateId: "button",
      activeVariantByTemplate: {
        button: "var-custom-outline",
      },
      variantsByTemplate: {
        button: [
          {
            id: "var-default",
            name: "Default",
            createdAt: Date.now() - 50000,
            updatedAt: Date.now() - 50000,
            files: {
              "component.tsx": "code",
              "demo.tsx": "demo",
              "index.css": "css",
            },
            dependencies: [],
            checkpoints: [],
          },
          {
            id: "var-custom-outline",
            name: "Neon Glow",
            createdAt: Date.now() - 10000,
            updatedAt: Date.now(),
            files: {
              "component.tsx": "neon code",
              "demo.tsx": "neon demo",
              "index.css": "neon css",
            },
            dependencies: [],
            checkpoints: [
              {
                id: "cp-1",
                name: "Initial Snapshot",
                createdAt: Date.now() - 5000,
                timestamp: "10:00:00 AM",
                files: {
                  "component.tsx": "neon code",
                  "demo.tsx": "neon demo",
                  "index.css": "neon css",
                },
                dependencies: [],
              },
              {
                id: "cp-2",
                name: "Added Shadows",
                createdAt: Date.now() - 1000,
                timestamp: "10:05:00 AM",
                files: {
                  "component.tsx": "neon shadow code",
                  "demo.tsx": "neon demo",
                  "index.css": "neon css",
                },
                dependencies: [],
              },
            ],
          },
        ],
      },
      isHistorySheetOpen: false,
      isSaveCheckpointDialogOpen: false,
      isCreateVariantDialogOpen: false,
    });
  });

  it("should display the active variant name and checkpoint count badge", () => {
    const html = renderToString(
      <TooltipProvider>
        <StudioHeader />
      </TooltipProvider>
    );

    // Variant name in breadcrumbs
    expect(html).toContain("Neon Glow");
    // Checkpoint count on history button (2 checkpoints)
    expect(html).toContain("2");
    // History button label
    expect(html).toContain("History");
    // Save checkpoint button and shortcut kbd
    expect(html).toContain("Save");
    expect(html).toContain("Ctrl+S");
  });

  it("should toggle history sheet when History button is clicked", () => {
    renderToString(
      <TooltipProvider>
        <StudioHeader />
      </TooltipProvider>
    );

    expect(useStudioStore.getState().isHistorySheetOpen).toBe(false);
    const historyClick = buttonClickMap.get("History");
    expect(historyClick).toBeDefined();

    // Click history button
    historyClick!();
    expect(useStudioStore.getState().isHistorySheetOpen).toBe(true);

    // Re-render with updated store state and click history button again to toggle off
    renderToString(
      <TooltipProvider>
        <StudioHeader />
      </TooltipProvider>
    );
    const historyClickClose = buttonClickMap.get("History");
    historyClickClose!();
    expect(useStudioStore.getState().isHistorySheetOpen).toBe(false);
  });

  it("should open save checkpoint dialog when Save button is clicked", () => {
    renderToString(
      <TooltipProvider>
        <StudioHeader />
      </TooltipProvider>
    );

    expect(useStudioStore.getState().isSaveCheckpointDialogOpen).toBe(false);
    const saveClick = buttonClickMap.get("Save");
    expect(saveClick).toBeDefined();

    saveClick!();
    expect(useStudioStore.getState().isSaveCheckpointDialogOpen).toBe(true);
  });

  it("should trigger save dialog when Ctrl+S or Cmd+S is pressed", () => {
    renderToString(
      <TooltipProvider>
        <StudioHeader />
      </TooltipProvider>
    );

    // Run captured effects to attach window keydown listener
    capturedEffects.forEach((eff) => eff());

    expect(useStudioStore.getState().isSaveCheckpointDialogOpen).toBe(false);

    let defaultPrevented = false;
    const keydownHandlers = listeners["keydown"] || [];
    expect(keydownHandlers.length).toBeGreaterThan(0);

    // Simulate pressing Ctrl+S
    for (const handler of keydownHandlers) {
      handler({
        ctrlKey: true,
        metaKey: false,
        key: "s",
        preventDefault: () => {
          defaultPrevented = true;
        },
      });
    }

    expect(defaultPrevented).toBe(true);
    expect(useStudioStore.getState().isSaveCheckpointDialogOpen).toBe(true);

    // Reset and test Cmd+S (Mac)
    useStudioStore.setState({ isSaveCheckpointDialogOpen: false });
    defaultPrevented = false;

    for (const handler of keydownHandlers) {
      handler({
        ctrlKey: false,
        metaKey: true,
        key: "S",
        preventDefault: () => {
          defaultPrevented = true;
        },
      });
    }

    expect(defaultPrevented).toBe(true);
    expect(useStudioStore.getState().isSaveCheckpointDialogOpen).toBe(true);
  });
});
