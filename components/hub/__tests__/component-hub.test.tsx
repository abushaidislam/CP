import { mock, describe, it, expect, beforeEach } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import type { UserComponent } from "@/lib/store/studio-store";

// Track button clicks and input changes
const buttonClickMap = new Map<string, (e?: any) => void>();
let lastInputOnChange: ((e: any) => void) | null = null;
let lastInputValue: string | undefined = undefined;

// Mock @/components/ui/dialog
mock.module(import.meta.resolve("@/components/ui/dialog"), () => ({
  Dialog: ({ open, children }: any) =>
    open ? <div data-testid="dialog-root">{children}</div> : null,
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

// Mock @/components/ui/dropdown-menu
mock.module(import.meta.resolve("@/components/ui/dropdown-menu"), () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-root">{children}</div>,
  DropdownMenuTrigger: ({ children, asChild }: any) => <div data-testid="dropdown-trigger">{children}</div>,
  DropdownMenuContent: ({ children, className }: any) => (
    <div className={className} data-testid="dropdown-content">
      {children}
    </div>
  ),
  DropdownMenuItem: ({ children, onClick, className, disabled }: any) => {
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
      buttonClickMap.set(`menu:${text}`, onClick);
    }
    return (
      <div
        role="menuitem"
        data-disabled={disabled}
        onClick={onClick}
        className={className}
      >
        {children}
      </div>
    );
  },
  DropdownMenuGroup: ({ children }: any) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
}));

// Mock @/components/ui/button
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
    const testId = props["data-testid"] || "";

    if (onClick) {
      if (text) buttonClickMap.set(text, onClick);
      if (ariaLabel) buttonClickMap.set(ariaLabel, onClick);
      if (testId) buttonClickMap.set(testId, onClick);

      if (text.includes("New Component")) buttonClickMap.set("New Component", onClick);
      if (text.includes("Preview")) buttonClickMap.set("Preview", onClick);
      if (text.includes("Studio")) buttonClickMap.set("Studio", onClick);
      if (text.includes("Reset")) buttonClickMap.set("Reset", onClick);
      if (text.includes("All")) buttonClickMap.set("cat:All", onClick);
      if (text.includes("Recent Work")) buttonClickMap.set("cat:Recent Work", onClick);
      if (text.includes("Heroes")) buttonClickMap.set("cat:Heroes", onClick);
      if (text.includes("Cards")) buttonClickMap.set("cat:Cards", onClick);
      if (text.includes("Buttons")) buttonClickMap.set("cat:Buttons", onClick);
      if (text.includes("Badges")) buttonClickMap.set("cat:Badges", onClick);
      if (text.includes("Custom")) buttonClickMap.set("cat:Custom", onClick);
    }

    return (
      <button type={type || "button"} onClick={onClick} className={className} {...props}>
        {children}
      </button>
    );
  },
}));

// Mock @/components/ui/input
mock.module(import.meta.resolve("@/components/ui/input"), () => ({
  Input: ({ onChange, value, placeholder, className, ...props }: any) => {
    lastInputOnChange = onChange;
    lastInputValue = value;
    return (
      <input
        onChange={onChange}
        value={value}
        placeholder={placeholder}
        className={className}
        {...props}
      />
    );
  },
}));

// Mock @/components/ui/tooltip
mock.module(import.meta.resolve("@/components/ui/tooltip"), () => ({
  TooltipProvider: ({ children }: any) => <>{children}</>,
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
}));

// Wrap useStudioStore hook
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
const { ComponentCard } = await import("../component-card");
const { ComponentHub } = await import("../component-hub");

describe("ComponentCard & ComponentHub", () => {
  beforeEach(() => {
    buttonClickMap.clear();
    lastInputOnChange = null;
    lastInputValue = undefined;

    // Reset store state with initial components
    const initialComponents = actualStore.createInitialUserComponents();
    useStudioStore.setState({
      userComponents: initialComponents,
      recentComponentIds: ["ink-orbit-hero", "spotlight-card"],
      quickPreviewComponentId: null,
      isCreateComponentDialogOpen: false,
      variantsByTemplate: {
        "ink-orbit-hero": [
          {
            id: "var-default-ink-orbit-hero",
            name: "Default",
            createdAt: 1700000000000,
            updatedAt: 1700000000000,
            files: initialComponents["ink-orbit-hero"].files,
            dependencies: [],
            checkpoints: [
              {
                id: "cp-1",
                name: "Init checkpoint",
                createdAt: 1700000000000,
                timestamp: "2024-01-01",
                files: initialComponents["ink-orbit-hero"].files,
                dependencies: [],
              },
            ],
          },
        ],
        "spotlight-card": [
          {
            id: "var-default-spotlight-card",
            name: "Default",
            createdAt: 1700000000000,
            updatedAt: 1700000000000,
            files: initialComponents["spotlight-card"].files,
            dependencies: [],
            checkpoints: [],
          },
          {
            id: "var-v2-spotlight-card",
            name: "Variant 2",
            createdAt: 1700000001000,
            updatedAt: 1700000001000,
            files: initialComponents["spotlight-card"].files,
            dependencies: [],
            checkpoints: [
              {
                id: "cp-spotlight-1",
                name: "V2 Snapshot",
                createdAt: 1700000001000,
                timestamp: "2024-01-02",
                files: initialComponents["spotlight-card"].files,
                dependencies: [],
              },
            ],
          },
        ],
      },
    });
  });

  describe("ComponentCard", () => {
    const mockComponent: UserComponent = {
      id: "test-card-component",
      name: "Interactive Hologram Card",
      description: "A 3D holographic card with multi-layer depth.",
      category: "Cards",
      isBuiltIn: false,
      createdAt: Date.now() - 60000,
      updatedAt: Date.now() - 60000,
      files: {
        "component.tsx": "export default function Comp() {}",
        "demo.tsx": "export default function Demo() {}",
        "index.css": "",
      },
      dependencies: ["framer-motion"],
    };

    it("should render component title, category badge, description, and counters", () => {
      const html = renderToString(
        <ComponentCard
          component={mockComponent}
          variantsCount={2}
          checkpointsCount={3}
          isRecent={true}
        />
      );

      expect(html).toContain("Interactive Hologram Card");
      expect(html).toContain("Cards");
      expect(html).toContain("A 3D holographic card with multi-layer depth.");
      expect(html).toContain("2 Variants");
      expect(html).toContain("3 Checkpoints");
      expect(html).toContain("Preview");
      expect(html).toContain("Studio");
      expect(html).toContain(
        "relative flex flex-col justify-between overflow-hidden bg-card p-4 text-card-foreground transition-colors duration-200 hover:bg-muted/10 font-sans h-full group"
      );
    });

    it("should render preview img element when previewImage is provided with smooth hover zoom", () => {
      const compWithImage: UserComponent = {
        ...mockComponent,
        previewImage: "data:image/svg+xml;utf8,<svg></svg>",
      };
      const html = renderToString(<ComponentCard component={compWithImage} />);
      expect(html).toContain("<img");
      expect(html).toContain("data:image/svg+xml;utf8");
      expect(html).toContain('alt="Interactive Hologram Card"');
      expect(html).toContain("Quick Preview");
      expect(html).toContain("group-hover:scale-105");
    });

    it("should render fallback placeholder when previewImage is missing", () => {
      const html = renderToString(<ComponentCard component={mockComponent} />);
      expect(html).not.toContain("<img");
      expect(html).toContain("Quick Preview");
      expect(html).toContain("Preview canvas");
    });

    it("should render accessible preview canvas with role button and aria-label", () => {
      const html = renderToString(<ComponentCard component={mockComponent} />);
      expect(html).toContain('role="button"');
      expect(html).toContain('aria-label="Preview Interactive Hologram Card"');
      expect(html).toContain("aspect-[16/10]");
    });

    it("should invoke onPreview callback when Preview button is clicked", () => {
      let previewId = "";
      renderToString(
        <ComponentCard
          component={mockComponent}
          onPreview={(id) => {
            previewId = id;
          }}
        />
      );

      const previewBtn = buttonClickMap.get("Preview");
      expect(previewBtn).toBeDefined();
      previewBtn?.();
      expect(previewId).toBe("test-card-component");
    });

    it("should invoke onOpenStudio callback when Studio button is clicked", () => {
      let studioId = "";
      renderToString(
        <ComponentCard
          component={mockComponent}
          onOpenStudio={(id) => {
            studioId = id;
          }}
        />
      );

      const studioBtn = buttonClickMap.get("Studio");
      expect(studioBtn).toBeDefined();
      studioBtn?.();
      expect(studioId).toBe("test-card-component");
    });

    it("should display Duplicate and Delete menu actions for custom components and gate deletion behind confirmation", () => {
      let duplicateId = "";
      let deleteId = "";
      let dialogOpened = false;

      const html = renderToString(
        <ComponentCard
          component={mockComponent}
          onDuplicate={(id) => {
            duplicateId = id;
          }}
          onDelete={(id) => {
            deleteId = id;
          }}
          onDeleteDialogOpenChange={(open) => {
            dialogOpened = open;
          }}
        />
      );

      expect(html).toContain("Duplicate Component");
      expect(html).toContain("Delete Component");

      const dupAction = buttonClickMap.get("menu:Duplicate Component");
      dupAction?.();
      expect(duplicateId).toBe("test-card-component");

      const delAction = buttonClickMap.get("menu:Delete Component");
      delAction?.();
      // Deletion must be gated behind confirmation dialog - not deleted immediately
      expect(dialogOpened).toBe(true);
      expect(deleteId).toBe("");

      // Render dialog open and confirm delete
      renderToString(
        <ComponentCard
          component={mockComponent}
          isDeleteDialogOpen={true}
          onDelete={(id) => {
            deleteId = id;
          }}
        />
      );

      const confirmDeleteBtn = buttonClickMap.get("Delete");
      expect(confirmDeleteBtn).toBeDefined();
      confirmDeleteBtn?.();
      expect(deleteId).toBe("test-card-component");
    });

    it("should omit or guard Delete Component for built-in template components", () => {
      const builtInComponent: UserComponent = {
        ...mockComponent,
        id: "ink-orbit-hero",
        isBuiltIn: true,
      };

      const html = renderToString(
        <ComponentCard
          component={builtInComponent}
          onDuplicate={() => {}}
          onDelete={() => {}}
        />
      );

      expect(html).toContain("Duplicate Component");
      expect(html).not.toContain("Delete Component");
    });
  });

  describe("ComponentHub", () => {
    it("should render Top Navigation Bar with brand, mono eyebrow badge, and New Component button", () => {
      const html = renderToString(<ComponentHub />);

      expect(html).toContain("Component Studio");
      expect(html).toContain("21ST WORKSPACE");
      expect(html).toContain("+ New Component");
    });

    it("should open create component dialog when + New Component is clicked", () => {
      renderToString(<ComponentHub />);
      expect(useStudioStore.getState().isCreateComponentDialogOpen).toBe(false);

      const newBtn = buttonClickMap.get("+ New Component") || buttonClickMap.get("New Component");
      expect(newBtn).toBeDefined();
      newBtn?.();

      expect(useStudioStore.getState().isCreateComponentDialogOpen).toBe(true);
    });

    it("should render Work History & Metrics Bar with 4 stats cards", () => {
      const html = renderToString(<ComponentHub />);

      expect(html).toContain("Total Components");
      expect(html).toContain("Custom Created");
      expect(html).toContain("Saved Checkpoints");
      expect(html).toContain("Recent Activity");

      // Verify stats values
      const totalCount = Object.keys(useStudioStore.getState().userComponents).length;
      expect(html).toContain(String(totalCount));
    });

    it("should render Search & Category Filter toolbar with counts", () => {
      const html = renderToString(<ComponentHub />);

      expect(html).toContain("Search components by name or description...");
      expect(html).toContain("All");
      expect(html).toContain("Recent Work");
      expect(html).toContain("Heroes");
      expect(html).toContain("Cards");
      expect(html).toContain("Buttons");
      expect(html).toContain("Badges");
      expect(html).toContain("Custom");
    });

    it("should render connected 4-column border grid with all 8 starter templates", () => {
      const html = renderToString(<ComponentHub />);

      // Verify connected border grid container and 4-column grid layout
      expect(html).toContain("rounded-xl border border-border/80 overflow-hidden bg-border/50 shadow-xs");
      expect(html).toContain("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border/60");

      // Verify all 8 starter templates are rendered in the hub
      expect(html).toContain("Ink Orbit 3D Hero");
      expect(html).toContain("Interactive Spotlight Card");
      expect(html).toContain("Aurora Shimmer Button");
      expect(html).toContain("Live Status Radar Badge");
      expect(html).toContain("Aurora Ambient Mesh Hero");
      expect(html).toContain("Bento Metric Showcase Card");
      expect(html).toContain("Neon Glow Interactive Button");
      expect(html).toContain("Live Telemetry Health Pill");
    });

    it("should render CreateComponentDialog and QuickPreviewModal modals", () => {
      useStudioStore.setState({ isCreateComponentDialogOpen: true });
      const htmlWithDialog = renderToString(<ComponentHub />);
      expect(htmlWithDialog).toContain("Create New Component");

      useStudioStore.setState({
        isCreateComponentDialogOpen: false,
        quickPreviewComponentId: "ink-orbit-hero",
      });
      const htmlWithPreview = renderToString(<ComponentHub />);
      expect(htmlWithPreview).toContain("21ST QUICK PREVIEW");
      expect(htmlWithPreview).toContain("Open in Studio");
    });

    it("should handle navigation to studio when onNavigateStudio is provided", () => {
      let navigatedId = "";
      renderToString(
        <ComponentHub
          onNavigateStudio={(id) => {
            navigatedId = id;
          }}
        />
      );

      const studioBtn = buttonClickMap.get("Studio");
      studioBtn?.();
      expect(navigatedId).toBeTruthy();
      expect(useStudioStore.getState().currentTemplateId).toBe(navigatedId);
    });

    it("should filter components by search query", () => {
      const htmlFiltered = renderToString(<ComponentHub initialSearchQuery="spotlight" />);
      expect(htmlFiltered).toContain("Interactive Spotlight Card");
      expect(htmlFiltered).not.toContain("Ink Orbit 3D Hero");
    });

    it("should filter components by category", () => {
      const htmlHeroes = renderToString(<ComponentHub initialCategory="Heroes" />);
      expect(htmlHeroes).toContain("Ink Orbit 3D Hero");
      expect(htmlHeroes).not.toContain("Interactive Spotlight Card");

      const htmlCards = renderToString(<ComponentHub initialCategory="Cards" />);
      expect(htmlCards).toContain("Interactive Spotlight Card");
      expect(htmlCards).not.toContain("Ink Orbit 3D Hero");
    });

    it("should render empty state and allow resetting filters when no items match search", () => {
      const htmlEmpty = renderToString(
        <ComponentHub initialSearchQuery="non-existent-xyz-search-query-12345" />
      );
      expect(htmlEmpty).toContain("No components found");
      expect(htmlEmpty).toContain("Reset filters");

      const resetBtn = buttonClickMap.get("Reset filters") || buttonClickMap.get("Reset");
      expect(resetBtn).toBeDefined();
    });

    it("should fallback to store actions in ComponentCard when callbacks are not provided", () => {
      const cardComp = useStudioStore.getState().userComponents["ink-orbit-hero"];
      renderToString(<ComponentCard component={cardComp} />);

      const previewBtn = buttonClickMap.get("Preview");
      previewBtn?.();
      expect(useStudioStore.getState().quickPreviewComponentId).toBe("ink-orbit-hero");

      const studioBtn = buttonClickMap.get("Studio");
      studioBtn?.();
      expect(useStudioStore.getState().currentTemplateId).toBe("ink-orbit-hero");
    });
  });
});
