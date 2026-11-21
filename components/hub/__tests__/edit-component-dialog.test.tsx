import { mock, describe, it, expect, beforeEach } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";

const buttonClickMap = new Map<string, (e?: any) => void>();
let lastInputOnChange: ((e: any) => void) | null = null;
let lastTextareaOnChange: ((e: any) => void) | null = null;
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

// Mock @/components/ui/button
mock.module(import.meta.resolve("@/components/ui/button"), () => ({
  Button: ({ children, onClick, type, className, ...props }: any) => {
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
      buttonClickMap.set(text, onClick);
      if (text.includes("Save Changes")) {
        buttonClickMap.set("Save Changes", onClick);
      }
      if (text.includes("Cancel")) {
        buttonClickMap.set("Cancel", onClick);
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

// Mock @/components/ui/input
mock.module(import.meta.resolve("@/components/ui/input"), () => ({
  Input: ({ onChange, ...props }: any) => {
    lastInputOnChange = onChange;
    return <input onChange={onChange} {...props} />;
  },
}));

// Mock @/components/ui/textarea
mock.module(import.meta.resolve("@/components/ui/textarea"), () => ({
  Textarea: ({ onChange, ...props }: any) => {
    lastTextareaOnChange = onChange;
    return <textarea onChange={onChange} {...props} />;
  },
}));

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
const { EditComponentDialog } = await import("../edit-component-dialog");

describe("EditComponentDialog", () => {
  beforeEach(() => {
    buttonClickMap.clear();
    lastInputOnChange = null;
    lastTextareaOnChange = null;
    lastDialogOnOpenChange = null;

    useStudioStore.setState({
      currentTemplateId: "spotlight-card",
      isEditComponentDialogOpen: false,
      editingComponentId: null,
      userComponents: {
        "spotlight-card": {
          id: "spotlight-card",
          name: "Interactive Spotlight Card",
          description: "A high-performance modern card",
          category: "Cards",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          files: {
            "component.tsx": "// code",
            "demo.tsx": "// demo",
            "index.css": "",
          },
          dependencies: [],
        },
      },
    });
  });

  it("should not render dialog elements when isEditComponentDialogOpen is false", () => {
    useStudioStore.setState({ isEditComponentDialogOpen: false });
    const html = renderToString(<EditComponentDialog />);
    expect(html).not.toContain("Edit Component Details");
    expect(html).not.toContain("dialog-content");
  });

  it("should render dialog with component title and fields when open", () => {
    useStudioStore.setState({
      isEditComponentDialogOpen: true,
      editingComponentId: "spotlight-card",
    });
    const html = renderToString(<EditComponentDialog />);
    expect(html).toContain("Edit Component Details");
    expect(html).toContain("Interactive Spotlight Card");
    expect(html).toContain("Save Changes");
    expect(html).toContain("Cancel");
  });

  it("should close dialog when onOpenChange(false) is triggered", () => {
    useStudioStore.setState({
      isEditComponentDialogOpen: true,
      editingComponentId: "spotlight-card",
    });
    renderToString(<EditComponentDialog />);

    expect(lastDialogOnOpenChange).toBeDefined();
    if (lastDialogOnOpenChange) {
      lastDialogOnOpenChange(false);
      expect(useStudioStore.getState().isEditComponentDialogOpen).toBe(false);
    }
  });

  it("should support updating component metadata directly", () => {
    useStudioStore.getState().updateComponentMetadata("spotlight-card", {
      name: "Renamed Modern Card",
      description: "Updated description for test",
      category: "Heroes",
    });

    const updated = useStudioStore.getState().userComponents["spotlight-card"];
    expect(updated.name).toBe("Renamed Modern Card");
    expect(updated.description).toBe("Updated description for test");
    expect(updated.category).toBe("Heroes");
  });
});
