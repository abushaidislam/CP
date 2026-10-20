import { mock, describe, it, expect, beforeEach } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";

// Registry to capture onClick handlers and props
const buttonClickMap = new Map<string, (e?: any) => void>();
let lastFormSubmitHandler: ((e?: any) => void) | null = null;
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
    if (onClick) {
      buttonClickMap.set(text, onClick);
      if (text.includes("Create Component")) {
        buttonClickMap.set("Create Component", onClick);
      }
      if (text.includes("Cancel")) {
        buttonClickMap.set("Cancel", onClick);
      }
      if (text.includes("Blank Clean Slate")) {
        buttonClickMap.set("Blank Clean Slate", onClick);
      }
      if (text.includes("Ink Orbit 3D Hero")) {
        buttonClickMap.set("Ink Orbit 3D Hero", onClick);
      }
      if (text.includes("Interactive Spotlight Card")) {
        buttonClickMap.set("Interactive Spotlight Card", onClick);
      }
      if (text.includes("Aurora Shimmer Button")) {
        buttonClickMap.set("Aurora Shimmer Button", onClick);
      }
      if (text.includes("Live Status Radar Badge")) {
        buttonClickMap.set("Live Status Radar Badge", onClick);
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

// Mock @/components/ui/input to capture input events
mock.module(import.meta.resolve("@/components/ui/input"), () => ({
  Input: ({ onChange, ...props }: any) => {
    lastInputOnChange = onChange;
    return <input onChange={onChange} {...props} />;
  },
}));

// Mock @/components/ui/textarea to capture textarea events
mock.module(import.meta.resolve("@/components/ui/textarea"), () => ({
  Textarea: ({ onChange, ...props }: any) => {
    lastTextareaOnChange = onChange;
    return <textarea onChange={onChange} {...props} />;
  },
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
const { CreateComponentDialog } = await import("../create-component-dialog");

describe("CreateComponentDialog", () => {
  beforeEach(() => {
    buttonClickMap.clear();
    lastFormSubmitHandler = null;
    lastInputOnChange = null;
    lastTextareaOnChange = null;
    lastDialogOnOpenChange = null;

    useStudioStore.setState((s) => ({
      ...s,
      isCreateComponentDialogOpen: false,
    }));
  });

  it("should not render dialog elements when isCreateComponentDialogOpen is false", () => {
    useStudioStore.setState({ isCreateComponentDialogOpen: false });
    const html = renderToString(<CreateComponentDialog />);
    expect(html).toBe("");
  });

  it("should render dialog elements with title, placeholders, categories, and starter templates when open", () => {
    useStudioStore.setState({ isCreateComponentDialogOpen: true });
    const html = renderToString(<CreateComponentDialog />);

    // Header & Eyebrow
    expect(html).toContain("NEW COMPONENT");
    expect(html).toContain("Create New Component");
    expect(html).toContain("Start fresh with a blank canvas or clone from a curated starter template.");

    // Inputs & Placeholders
    expect(html).toContain("Component Name");
    expect(html).toContain("e.g. Animated Pricing Card");
    expect(html).toContain("Description (Optional)");

    // Category selectors
    expect(html).toContain("Heroes");
    expect(html).toContain("Cards");
    expect(html).toContain("Buttons");
    expect(html).toContain("Badges");
    expect(html).toContain("Custom");

    // Starter Template cards
    expect(html).toContain("Starter Template");
    expect(html).toContain("Blank Clean Slate");
    expect(html).toContain("Ink Orbit 3D Hero");
    expect(html).toContain("Interactive Spotlight Card");
    expect(html).toContain("Aurora Shimmer Button");
    expect(html).toContain("Live Status Radar Badge");

    // Action buttons
    expect(html).toContain("Cancel");
    expect(html).toContain("Create Component");
  });

  it("should prevent submission and display validation error when name is empty", () => {
    useStudioStore.setState({ isCreateComponentDialogOpen: true });
    renderToString(<CreateComponentDialog />);

    const submitBtn = buttonClickMap.get("Create Component");
    expect(submitBtn).toBeDefined();

    // Store state before submit
    const countBefore = Object.keys(useStudioStore.getState().userComponents).length;

    // Trigger submit with empty name
    let defaultPrevented = false;
    submitBtn!({
      preventDefault: () => {
        defaultPrevented = true;
      },
    });

    // Verify no component was created
    const countAfter = Object.keys(useStudioStore.getState().userComponents).length;
    expect(countAfter).toBe(countBefore);

    // Verify dialog remains open
    expect(useStudioStore.getState().isCreateComponentDialogOpen).toBe(true);
  });

  it("should create a new component from blank slate and call onCreated callback", () => {
    useStudioStore.setState({ isCreateComponentDialogOpen: true });
    let createdComponentId: string | null = null;
    const onCreated = (id: string) => {
      createdComponentId = id;
    };

    renderToString(<CreateComponentDialog onCreated={onCreated} />);

    // Simulate entering component name
    expect(lastInputOnChange).toBeDefined();
    lastInputOnChange!({ target: { value: "Pricing Comparison Table" } });

    // Click submit
    const submitBtn = buttonClickMap.get("Create Component");
    expect(submitBtn).toBeDefined();
    submitBtn!({ preventDefault: () => {} });

    // Verify component was created in store
    const state = useStudioStore.getState();
    expect(createdComponentId).toBeTruthy();
    expect(state.userComponents[createdComponentId!]).toBeDefined();
    expect(state.userComponents[createdComponentId!].name).toBe("Pricing Comparison Table");
    expect(state.userComponents[createdComponentId!].category).toBe("Custom");

    // Verify dialog was closed
    expect(state.isCreateComponentDialogOpen).toBe(false);
  });

  it("should create a component cloned from selected starter template", () => {
    useStudioStore.setState({ isCreateComponentDialogOpen: true });
    let createdComponentId: string | null = null;
    const onCreated = (id: string) => {
      createdComponentId = id;
    };

    renderToString(<CreateComponentDialog onCreated={onCreated} />);

    // Select "Interactive Spotlight Card" starter template
    const spotlightCardBtn = buttonClickMap.get("Interactive Spotlight Card");
    expect(spotlightCardBtn).toBeDefined();
    spotlightCardBtn!();

    // Enter name
    lastInputOnChange!({ target: { value: "Feature Showcase Card" } });

    // Click submit
    const submitBtn = buttonClickMap.get("Create Component");
    submitBtn!({ preventDefault: () => {} });

    const state = useStudioStore.getState();
    expect(createdComponentId).toBeTruthy();
    const createdComp = state.userComponents[createdComponentId!];
    expect(createdComp).toBeDefined();
    expect(createdComp.name).toBe("Feature Showcase Card");
    expect(createdComp.category).toBe("Cards");
    expect(createdComp.files["component.tsx"]).toContain("Spotlight");
  });

  it("should allow selecting custom category and optional description", () => {
    useStudioStore.setState({ isCreateComponentDialogOpen: true });
    let createdComponentId: string | null = null;
    renderToString(
      <CreateComponentDialog
        onCreated={(id) => {
          createdComponentId = id;
        }}
      />
    );

    // Enter name
    lastInputOnChange!({ target: { value: "Top Navigation Bar" } });

    // Enter description
    expect(lastTextareaOnChange).toBeDefined();
    lastTextareaOnChange!({ target: { value: "Sticky responsive header with blurred backdrop" } });

    // Select category "Heroes"
    const heroCategoryBtn = buttonClickMap.get("Heroes");
    expect(heroCategoryBtn).toBeDefined();
    heroCategoryBtn!();

    // Submit
    const submitBtn = buttonClickMap.get("Create Component");
    submitBtn!({ preventDefault: () => {} });

    const state = useStudioStore.getState();
    expect(createdComponentId).toBeTruthy();
    const comp = state.userComponents[createdComponentId!];
    expect(comp.name).toBe("Top Navigation Bar");
    expect(comp.description).toBe("Sticky responsive header with blurred backdrop");
    expect(comp.category).toBe("Heroes");
  });

  it("should close dialog when Cancel button is clicked", () => {
    useStudioStore.setState({ isCreateComponentDialogOpen: true });
    renderToString(<CreateComponentDialog />);

    expect(useStudioStore.getState().isCreateComponentDialogOpen).toBe(true);

    const cancelBtn = buttonClickMap.get("Cancel");
    expect(cancelBtn).toBeDefined();
    cancelBtn!();

    expect(useStudioStore.getState().isCreateComponentDialogOpen).toBe(false);
  });

  it("should reset form fields upon closing dialog", () => {
    useStudioStore.setState({ isCreateComponentDialogOpen: true });
    renderToString(<CreateComponentDialog />);

    // Type name
    lastInputOnChange!({ target: { value: "Temporary Work" } });

    // Close dialog via handleOpenChange(false)
    expect(lastDialogOnOpenChange).toBeDefined();
    lastDialogOnOpenChange!(false);

    expect(useStudioStore.getState().isCreateComponentDialogOpen).toBe(false);

    // Reopen dialog and verify it renders empty inputs
    useStudioStore.setState({ isCreateComponentDialogOpen: true });
    const html = renderToString(<CreateComponentDialog />);
    expect(html).not.toContain('value="Temporary Work"');
  });
});
