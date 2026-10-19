import { mock, describe, it, expect, beforeEach } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";

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
const { VersionHistorySheet } = await import("../version-history-sheet");

describe("VersionHistorySheet", () => {
  beforeEach(() => {
    useStudioStore.setState({
      isHistorySheetOpen: false,
      selectedCheckpointId: null,
      currentTemplateId: "button",
      activeVariantByTemplate: { button: "var-default-button" },
      variantsByTemplate: {
        button: [
          {
            id: "var-default-button",
            name: "Default",
            createdAt: Date.now() - 10000,
            updatedAt: Date.now(),
            files: {
              "component.tsx": "export function Button() { return <button>Test</button>; }",
              "demo.tsx": "export default function Demo() { return <Button />; }",
              "index.css": ".btn { color: red; }",
            },
            dependencies: [],
            checkpoints: [],
          },
        ],
      },
    });
  });

  it("should not render sheet content when isHistorySheetOpen is false", () => {
    useStudioStore.setState({ isHistorySheetOpen: false });
    const html = renderToString(<VersionHistorySheet />);
    expect(html).not.toContain("Version History");
  });

  it("should render Version History header, active variant badge, and empty state when checkpoints list is empty", () => {
    useStudioStore.setState({ isHistorySheetOpen: true });
    const html = renderToString(<VersionHistorySheet />);

    expect(html).toContain("Version History");
    expect(html).toContain("Default");
    expect(html).toContain("0 checkpoints");
    expect(html).toContain("No checkpoints saved yet for this variant.");
    expect(html).toContain("Checkpoints allow you to take snapshots of your code and restore them anytime.");
    expect(html).toContain("Create First Checkpoint");
  });

  it("should render checkpoints list with name, description, and action buttons when checkpoints exist", () => {
    const mockCheckpoint = {
      id: "cp-1",
      name: "Added shadow styling",
      description: "Added smooth box-shadow and hover scale transition",
      timestamp: "10:30:00 AM",
      createdAt: Date.now() - 60000,
      files: {
        "component.tsx": "export function Button() { return <button className='shadow'>Test</button>; }",
        "demo.tsx": "export default function Demo() { return <Button />; }",
        "index.css": ".btn { box-shadow: 0 4px 6px rgba(0,0,0,0.1); }",
      },
      dependencies: [],
    };

    const currentVariants = useStudioStore.getState().variantsByTemplate["button"];
    useStudioStore.setState({
      isHistorySheetOpen: true,
      variantsByTemplate: {
        button: [
          {
            ...currentVariants[0],
            checkpoints: [mockCheckpoint],
          },
        ],
      },
    });

    const html = renderToString(<VersionHistorySheet />);
    expect(html).toContain("Version History");
    expect(html).toContain("1 checkpoint");
    expect(html).toContain("Added shadow styling");
    expect(html).toContain("Added smooth box-shadow and hover scale transition");
    expect(html).toContain("Compare");
    expect(html).toContain("Restore");
    expect(html).toContain("Fork");
  });

  it("should render diff inspection view with tabs and diff viewer when selectedCheckpointId is active", () => {
    const mockCheckpoint = {
      id: "cp-diff-test",
      name: "Initial layout",
      timestamp: "11:00:00 AM",
      createdAt: Date.now() - 120000,
      files: {
        "component.tsx": "export function Button() { return <button>Initial</button>; }",
        "demo.tsx": "export default function Demo() { return <Button />; }",
        "index.css": ".initial { color: blue; }",
      },
      dependencies: [],
    };

    const currentVariants = useStudioStore.getState().variantsByTemplate["button"];
    useStudioStore.setState({
      isHistorySheetOpen: true,
      selectedCheckpointId: "cp-diff-test",
      files: {
        "component.tsx": "export function Button() { return <button>Updated</button>; }",
        "demo.tsx": "export default function Demo() { return <Button />; }",
        "index.css": ".initial { color: blue; }",
      },
      variantsByTemplate: {
        button: [
          {
            ...currentVariants[0],
            checkpoints: [mockCheckpoint],
          },
        ],
      },
    });

    const html = renderToString(<VersionHistorySheet />);
    expect(html).toContain("Back to timeline");
    expect(html).toContain("Initial layout");
    expect(html).toContain("Restore Checkpoint");
    expect(html).toContain("component.tsx");
    expect(html).toContain("demo.tsx");
    expect(html).toContain("index.css");
    // Contains diff content
    expect(html).toContain("Initial");
    expect(html).toContain("Updated");
  });

  it("should trigger restoreCheckpoint from store and restore working files", () => {
    const mockCheckpoint = {
      id: "cp-restore-target",
      name: "Working state",
      timestamp: "12:00:00 PM",
      createdAt: Date.now(),
      files: {
        "component.tsx": "export function Button() { return <button>Restored Code</button>; }",
        "demo.tsx": "export default function Demo() { return <Button />; }",
        "index.css": ".restored { color: green; }",
      },
      dependencies: ["framer-motion"],
    };

    const currentVariants = useStudioStore.getState().variantsByTemplate["button"];
    useStudioStore.setState({
      isHistorySheetOpen: true,
      files: {
        "component.tsx": "unwanted change",
        "demo.tsx": "unwanted demo",
        "index.css": "unwanted css",
      },
      dependencies: [],
      variantsByTemplate: {
        button: [
          {
            ...currentVariants[0],
            checkpoints: [mockCheckpoint],
          },
        ],
      },
    });

    // Invoke restoreCheckpoint directly through the store
    useStudioStore.getState().restoreCheckpoint("cp-restore-target");

    expect(useStudioStore.getState().files["component.tsx"]).toBe(
      "export function Button() { return <button>Restored Code</button>; }"
    );
    expect(useStudioStore.getState().dependencies).toEqual(["framer-motion"]);
  });

  it("should trigger forkCheckpointToNewVariant from store creating new variant with checkpoint files", () => {
    const mockCheckpoint = {
      id: "cp-fork-target",
      name: "Checkpoint for Forking",
      timestamp: "1:00:00 PM",
      createdAt: Date.now(),
      files: {
        "component.tsx": "export function Forked() { return <div>Forked</div>; }",
        "demo.tsx": "export default function Demo() { return <Forked />; }",
        "index.css": ".forked { color: purple; }",
      },
      dependencies: ["lucide-react"],
    };

    const currentVariants = useStudioStore.getState().variantsByTemplate["button"];
    useStudioStore.setState({
      variantsByTemplate: {
        button: [
          {
            ...currentVariants[0],
            checkpoints: [mockCheckpoint],
          },
        ],
      },
    });

    useStudioStore.getState().forkCheckpointToNewVariant("cp-fork-target", "Glassmorphic Variant");

    const updatedVariants = useStudioStore.getState().variantsByTemplate["button"];
    expect(updatedVariants.length).toBe(2);
    const forkedVariant = updatedVariants.find((v) => v.name === "Glassmorphic Variant");
    expect(forkedVariant).toBeDefined();
    expect(forkedVariant?.files["component.tsx"]).toBe(
      "export function Forked() { return <div>Forked</div>; }"
    );
    expect(useStudioStore.getState().files["component.tsx"]).toBe(
      "export function Forked() { return <div>Forked</div>; }"
    );
  });

  it("should trigger deleteCheckpoint from store removing checkpoint", () => {
    const mockCheckpoint = {
      id: "cp-to-delete",
      name: "Temporary checkpoint",
      timestamp: "2:00:00 PM",
      createdAt: Date.now(),
      files: {
        "component.tsx": "test",
        "demo.tsx": "test",
        "index.css": "test",
      },
      dependencies: [],
    };

    const currentVariants = useStudioStore.getState().variantsByTemplate["button"];
    useStudioStore.setState({
      variantsByTemplate: {
        button: [
          {
            ...currentVariants[0],
            checkpoints: [mockCheckpoint],
          },
        ],
      },
    });

    useStudioStore.getState().deleteCheckpoint("cp-to-delete");

    const updatedVariants = useStudioStore.getState().variantsByTemplate["button"];
    const activeVar = updatedVariants.find((v) => v.id === "var-default-button");
    expect(activeVar?.checkpoints.find((cp) => cp.id === "cp-to-delete")).toBeUndefined();
  });

  it("should show fallback message when selected checkpoint is not found", () => {
    useStudioStore.setState({
      isHistorySheetOpen: true,
      selectedCheckpointId: "non-existent-id",
    });

    const html = renderToString(<VersionHistorySheet />);
    expect(html).toContain("Checkpoint not found or was removed.");
    expect(html).toContain("Back to timeline");
  });
});

