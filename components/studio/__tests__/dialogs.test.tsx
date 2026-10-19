import { mock, describe, it, expect, beforeEach } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";

// Mock @/components/ui/dialog so DialogContent renders inline during SSR/renderToString
mock.module(import.meta.resolve("@/components/ui/dialog"), () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="dialog-root">{children}</div> : null,
  DialogContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  DialogHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  DialogTitle: ({ children, className }: any) => <h2 className={className}>{children}</h2>,
  DialogDescription: ({ children, className }: any) => <p className={className}>{children}</p>,
  DialogFooter: ({ children, className }: any) => <div className={className}>{children}</div>,
  DialogClose: ({ children }: any) => <button>{children}</button>,
}));

// Wrap useStudioStore hook so it returns live state during SSR tests while preserving all store methods
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
const { SaveCheckpointDialog } = await import("../save-checkpoint-dialog");
const { CreateVariantDialog } = await import("../create-variant-dialog");

describe("SaveCheckpointDialog & CreateVariantDialog", () => {
  beforeEach(() => {
    useStudioStore.setState({
      isSaveCheckpointDialogOpen: false,
      isCreateVariantDialogOpen: false,
    });
  });

  describe("SaveCheckpointDialog", () => {
    it("should not render modal content when isSaveCheckpointDialogOpen is false", () => {
      useStudioStore.setState({ isSaveCheckpointDialogOpen: false });
      const html = renderToString(<SaveCheckpointDialog />);
      expect(html).not.toContain("Save Checkpoint");
    });

    it("should render Save Checkpoint dialog with title, description, input, notes, and action buttons when open", () => {
      useStudioStore.setState({ isSaveCheckpointDialogOpen: true });
      const html = renderToString(<SaveCheckpointDialog />);
      expect(html).toContain("Save Checkpoint");
      expect(html).toContain("Take a manual snapshot of your active files and dependencies.");
      expect(html).toContain("Checkpoint Name *");
      expect(html).toContain("Added glassmorphism blur and spring animation");
      expect(html).toContain("Notes (Optional)");
      expect(html).toContain("Describe key visual or functional changes...");
      expect(html).toContain("Cancel");
    });
  });

  describe("CreateVariantDialog", () => {
    it("should not render modal content when isCreateVariantDialogOpen is false", () => {
      useStudioStore.setState({ isCreateVariantDialogOpen: false });
      const html = renderToString(<CreateVariantDialog />);
      expect(html).not.toContain("Create Component Variant");
    });

    it("should render Create Variant dialog with title, description, input, clone switch, and buttons when open", () => {
      useStudioStore.setState({ isCreateVariantDialogOpen: true });
      const html = renderToString(<CreateVariantDialog />);
      expect(html).toContain("Create Component Variant");
      expect(html).toContain(
        "Explore a new visual design or code direction without losing your existing variant."
      );
      expect(html).toContain("Variant Name *");
      expect(html).toContain("Minimal Outline, Neon Glow, Glassmorphism");
      expect(html).toContain("Clone files from active variant");
      expect(html).toContain("Start with current code instead of default template");
      expect(html).toContain("Cancel");
    });
  });
});
