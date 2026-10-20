import { mock, describe, it, expect, beforeEach, afterAll } from "bun:test";
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
  (globalThis.window as any).addEventListener = (event: string, cb: any) => {
    listeners[event] = listeners[event] || [];
    listeners[event].push(cb);
  };
  (globalThis.window as any).removeEventListener = (event: string, cb: any) => {
    if (listeners[event]) {
      listeners[event] = listeners[event].filter((l) => l !== cb);
    }
  };
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

// Intercept React.useEffect to capture and manually run effects during test renders
const clientInternals = (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
const previousH = clientInternals?.H;
if (clientInternals) {
  clientInternals.H = {
    useEffect: (fn: any) => {
      capturedEffects.push(fn);
    },
    useState: (init: any) => [typeof init === "function" ? init() : init, () => {}],
    useMemo: (fn: any) => fn(),
    useCallback: (fn: any) => fn,
    useRef: (init: any) => ({ current: init }),
  };
}

const runEffects = () => {
  const effects = [...capturedEffects];
  capturedEffects = [];
  effects.forEach((eff) => eff());
};

// Navigation mocks
const mockPush = mock((path: string) => {});
const mockReplace = mock((path: string) => {});
let mockParams: Record<string, string> = { id: "custom-neon-button" };

mock.module("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: () => {},
    back: () => {},
  }),
  useParams: () => mockParams,
  usePathname: () => `/studio/${mockParams.id || ""}`,
}));

// Registry to capture onClick handlers from rendered Buttons
const buttonClickMap = new Map<string, () => void>();

// Mock @/components/ui/button
mock.module(import.meta.resolve("@/components/ui/button"), () => ({
  Button: ({ children, onClick, className, variant, size, asChild, ...props }: any) => {
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
      if (text.includes("Library")) {
        buttonClickMap.set("Library", onClick);
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

// Mock next/link
mock.module("next/link", () => ({
  default: ({ href, children, className, ...props }: any) => {
    return (
      <a href={href} className={className} data-testid="next-link" {...props}>
        {children}
      </a>
    );
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

// Mock @/components/hub/component-hub for route testing
let hubOnNavigateStudio: ((id: string) => void) | undefined = undefined;
mock.module(import.meta.resolve("@/components/hub/component-hub"), () => ({
  ComponentHub: ({ onNavigateStudio }: any) => {
    hubOnNavigateStudio = onNavigateStudio;
    return <div data-testid="component-hub">Component Hub</div>;
  },
}));

// Mock @/components/studio/studio-container for route testing
let renderedStudioContainerProps: any = null;
mock.module(import.meta.resolve("@/components/studio/studio-container"), () => ({
  StudioContainer: (props: any) => {
    renderedStudioContainerProps = props;
    return <div data-testid="studio-container">Studio Container</div>;
  },
}));

const { useStudioStore } = await import("@/lib/store/studio-store");
const { TooltipProvider } = await import("@/components/ui/tooltip");
const { StudioHeader } = await import("../studio-header");
const HomePage = (await import("@/app/page")).default;
const StudioWorkspacePage = (await import("@/app/studio/[id]/page")).default;
const StudioRedirectPage = (await import("@/app/studio/page")).default;

describe("StudioHeader Navigation & Route Integration", () => {
  beforeEach(() => {
    capturedEffects = [];
    buttonClickMap.clear();
    mockPush.mockClear();
    mockReplace.mockClear();
    hubOnNavigateStudio = undefined;
    renderedStudioContainerProps = null;
    mockParams = { id: "custom-neon-button" };

    for (const key in listeners) {
      delete listeners[key];
    }

    useStudioStore.setState({
      currentTemplateId: "custom-neon-button",
      userComponents: {
        "custom-neon-button": {
          id: "custom-neon-button",
          name: "Neon Glow Button",
          description: "Futuristic neon pulsating button",
          category: "Buttons",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          files: {
            "component.tsx": "// Neon Button",
            "demo.tsx": "// Demo",
            "index.css": "",
          },
          dependencies: [],
        },
      },
      activeVariantByTemplate: {
        "custom-neon-button": "var-neon-cyan",
      },
      variantsByTemplate: {
        "custom-neon-button": [
          {
            id: "var-neon-cyan",
            name: "Cyan Glow",
            createdAt: 1700000000000,
            updatedAt: 1700000000000,
            files: {
              "component.tsx": "// Cyan variant",
              "demo.tsx": "// Demo",
              "index.css": "",
            },
            dependencies: [],
            checkpoints: [
              {
                id: "cp-1",
                name: "Added pulse animation",
                timestamp: "12:00:00 PM",
                createdAt: 1700000000000,
                files: {
                  "component.tsx": "// Cyan",
                  "demo.tsx": "// Demo",
                  "index.css": "",
                },
                dependencies: [],
              },
            ],
          },
        ],
      },
      isSaveCheckpointDialogOpen: false,
      isHistorySheetOpen: false,
    });
  });

  describe("StudioHeader UI", () => {
    it("should render the Library navigation link with back button leading to '/'", () => {
      const html = renderToString(
        <TooltipProvider>
          <StudioHeader />
        </TooltipProvider>
      );

      // Verify Library link exists with href="/"
      expect(html).toContain('href="/"');
      expect(html).toContain("Library");
    });

    it("should display the active component name from userComponents", () => {
      const html = renderToString(
        <TooltipProvider>
          <StudioHeader />
        </TooltipProvider>
      );

      // Component name should be displayed in header
      expect(html).toContain("Neon Glow Button");
    });

    it("should fallback gracefully if component name is not found in userComponents", () => {
      useStudioStore.setState({
        currentTemplateId: "non-existent-id",
        userComponents: {},
      });

      const html = renderToString(
        <TooltipProvider>
          <StudioHeader />
        </TooltipProvider>
      );

      // Should contain fallback name or Component Studio
      expect(html).toMatch(/Component Studio|Interactive Button/);
    });

    it("should preserve variant selector and checkpoint controls alongside navigation", () => {
      const html = renderToString(
        <TooltipProvider>
          <StudioHeader />
        </TooltipProvider>
      );

      // Verify variant name is displayed
      expect(html).toContain("Cyan Glow");

      // Verify Save checkpoint button is present
      expect(html).toContain("Save");

      // Verify History button is present with checkpoint count
      expect(html).toContain("History");
      expect(html).toContain("1"); // 1 checkpoint

      // Clicking Save should open dialog
      const saveClick = buttonClickMap.get("Save");
      expect(saveClick).toBeDefined();
      if (saveClick) {
        saveClick();
        expect(useStudioStore.getState().isSaveCheckpointDialogOpen).toBe(true);
      }

      // Clicking History should open history sheet
      const historyClick = buttonClickMap.get("History");
      expect(historyClick).toBeDefined();
      if (historyClick) {
        historyClick();
        expect(useStudioStore.getState().isHistorySheetOpen).toBe(true);
      }
    });
  });

  describe("Route Integration", () => {
    it("app/page.tsx should render ComponentHub and route to /studio/[id] on navigation", () => {
      const html = renderToString(<HomePage />);
      expect(html).toContain("Component Hub");
      expect(hubOnNavigateStudio).toBeDefined();

      // Trigger navigation callback
      hubOnNavigateStudio!("glass-card");
      expect(mockPush).toHaveBeenCalledWith("/studio/glass-card");
    });

    it("app/studio/[id]/page.tsx should resolve id param, load component, and render StudioContainer", () => {
      mockParams = { id: "custom-neon-button" };
      useStudioStore.setState({ currentTemplateId: "ink-orbit-hero" });

      const element = StudioWorkspacePage();
      expect(element.props.componentId).toBe("custom-neon-button");

      // Run effect
      runEffects();
      expect(useStudioStore.getState().currentTemplateId).toBe("custom-neon-button");
    });

    it("app/studio/page.tsx should redirect to /studio/[currentTemplateId] if template exists", () => {
      useStudioStore.setState({ currentTemplateId: "hero-section" });
      StudioRedirectPage();

      runEffects();
      expect(mockReplace).toHaveBeenCalledWith("/studio/hero-section");
    });

    it("app/studio/page.tsx should redirect to / if no current template exists", () => {
      useStudioStore.setState({ currentTemplateId: "" });
      StudioRedirectPage();

      runEffects();
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  afterAll(() => {
    if (clientInternals) {
      clientInternals.H = previousH;
    }
  });
});
