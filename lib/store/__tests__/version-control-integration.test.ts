import { describe, it, expect, beforeEach } from "bun:test";
import { useStudioStore } from "../studio-store";
import { DEFAULT_TEMPLATES } from "@/lib/sandbox/default-templates";

describe("Version Control Integration & Lifecycle Test Suite", () => {
  const templateId = "ink-orbit-hero";
  const baseTemplate = DEFAULT_TEMPLATES.find((t) => t.id === templateId) || DEFAULT_TEMPLATES[0];

  beforeEach(() => {
    // Reset store state cleanly before each integration test
    useStudioStore.setState({
      files: {
        "component.tsx": baseTemplate.files["component.tsx"],
        "demo.tsx": baseTemplate.files["demo.tsx"],
        "index.css": baseTemplate.files["index.css"],
      },
      activeTab: "component.tsx",
      dependencies: [...baseTemplate.dependencies],
      currentTemplateId: templateId,
      variantsByTemplate: {
        [templateId]: [
          {
            id: `var-default-${templateId}`,
            name: "Default",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            files: {
              "component.tsx": baseTemplate.files["component.tsx"],
              "demo.tsx": baseTemplate.files["demo.tsx"],
              "index.css": baseTemplate.files["index.css"],
            },
            dependencies: [...baseTemplate.dependencies],
            checkpoints: [],
          },
        ],
      },
      activeVariantByTemplate: {
        [templateId]: `var-default-${templateId}`,
      },
      isHistorySheetOpen: false,
      selectedCheckpointId: null,
      isCreateVariantDialogOpen: false,
      isSaveCheckpointDialogOpen: false,
      compilerError: null,
      isCompiling: false,
    });
  });

  describe("Lifecycle Story 1: Default Variant Initialization & Working File Sync", () => {
    it("should initialize with Default variant and sync active file/dependency updates to active variant", () => {
      const store = useStudioStore.getState();

      // 1. Verify variantsByTemplate contains a "Default" variant
      const initialVariants = store.variantsByTemplate[templateId];
      expect(initialVariants).toBeDefined();
      expect(initialVariants.length).toBe(1);

      const defaultVariant = initialVariants[0];
      expect(defaultVariant.name).toBe("Default");
      expect(defaultVariant.id).toBe(`var-default-${templateId}`);
      expect(store.activeVariantByTemplate[templateId]).toBe(defaultVariant.id);

      // 2. Calling updateFile updates state.files and active variant's files
      const newCode = "<NewCode version='1.0' />";
      store.updateFile("component.tsx", newCode);

      let currentState = useStudioStore.getState();
      expect(currentState.files["component.tsx"]).toBe(newCode);

      const activeVarAfterFileUpdate = currentState.variantsByTemplate[templateId]?.find(
        (v) => v.id === currentState.activeVariantByTemplate[templateId]
      );
      expect(activeVarAfterFileUpdate).toBeDefined();
      expect(activeVarAfterFileUpdate?.files["component.tsx"]).toBe(newCode);

      // Also verify css updates sync properly
      const newCss = ".custom-glow { filter: blur(4px); }";
      store.updateFile("index.css", newCss);
      currentState = useStudioStore.getState();
      expect(currentState.files["index.css"]).toBe(newCss);
      const activeVarAfterCssUpdate = currentState.variantsByTemplate[templateId]?.find(
        (v) => v.id === currentState.activeVariantByTemplate[templateId]
      );
      expect(activeVarAfterCssUpdate?.files["index.css"]).toBe(newCss);

      // 3. Calling addDependency updates both state.dependencies and active variant's dependencies
      store.addDependency("canvas-confetti");
      currentState = useStudioStore.getState();
      expect(currentState.dependencies).toContain("canvas-confetti");

      const activeVarAfterDepUpdate = currentState.variantsByTemplate[templateId]?.find(
        (v) => v.id === currentState.activeVariantByTemplate[templateId]
      );
      expect(activeVarAfterDepUpdate?.dependencies).toContain("canvas-confetti");
    });

    it("should initialize default variant when loading a template with empty variant state", () => {
      // Clear out variants
      useStudioStore.setState((prev) => ({
        ...prev,
        variantsByTemplate: {},
        activeVariantByTemplate: {},
      }));

      const store = useStudioStore.getState();
      store.loadTemplate(templateId);

      const state = useStudioStore.getState();
      const variants = state.variantsByTemplate[templateId];
      expect(variants).toBeDefined();
      expect(variants.length).toBeGreaterThanOrEqual(1);
      expect(variants[0].name).toBe("Default");
      expect(variants[0].id).toBe(`var-default-${templateId}`);
      expect(state.activeVariantByTemplate[templateId]).toBe(variants[0].id);
    });
  });

  describe("Lifecycle Story 2: Manual Checkpoint Snapshot & Deep Clone Verification", () => {
    it("should create a snapshot in the active variant and verify deep cloning isolates edits", () => {
      const store = useStudioStore.getState();

      const workingCode = "<InitialWorkingPrototype author='developer' />";
      store.updateFile("component.tsx", workingCode);
      store.addDependency("lucide-react");

      // 1. Save checkpoint
      store.saveCheckpoint("Initial Working Prototype", "Tested locally");

      let state = useStudioStore.getState();
      const activeVariantId = state.activeVariantByTemplate[templateId];
      const activeVariant = state.variantsByTemplate[templateId]?.find(
        (v) => v.id === activeVariantId
      );
      expect(activeVariant).toBeDefined();
      expect(activeVariant?.checkpoints.length).toBe(1);

      const checkpoint = activeVariant!.checkpoints[0];
      expect(checkpoint.name).toBe("Initial Working Prototype");
      expect(checkpoint.description).toBe("Tested locally");
      expect(checkpoint.files["component.tsx"]).toBe(workingCode);
      expect(checkpoint.dependencies).toContain("lucide-react");
      expect(checkpoint.createdAt).toBeDefined();
      expect(checkpoint.timestamp).toBeDefined();

      // 2. Deep clone verification: mutating working files must NOT mutate the saved checkpoint
      const mutatedCode = "<MutatedWorkingCode changed='true' />";
      store.updateFile("component.tsx", mutatedCode);
      store.addDependency("framer-motion");

      state = useStudioStore.getState();
      expect(state.files["component.tsx"]).toBe(mutatedCode);
      expect(state.dependencies).toContain("framer-motion");

      const checkpointAfterEdits = state.variantsByTemplate[templateId]
        ?.find((v) => v.id === activeVariantId)
        ?.checkpoints.find((cp) => cp.id === checkpoint.id);

      expect(checkpointAfterEdits).toBeDefined();
      // Checkpoint files remain frozen at initial snapshot
      expect(checkpointAfterEdits!.files["component.tsx"]).toBe(workingCode);
      expect(checkpointAfterEdits!.dependencies).not.toContain("framer-motion");
    });
  });

  describe("Lifecycle Story 3: Branching / Creating New Variants", () => {
    it("should branch a new variant cloned from active files and maintain isolated edits and checkpoints", () => {
      const store = useStudioStore.getState();

      const defaultCode = "<DefaultHeroComponent />";
      store.updateFile("component.tsx", defaultCode);

      // Create "Glassmorphism" variant copying from active files
      store.createVariant("Glassmorphism", true);

      let state = useStudioStore.getState();
      const variants = state.variantsByTemplate[templateId] || [];
      expect(variants.length).toBe(2);

      const glassVariant = variants.find((v) => v.name === "Glassmorphism");
      expect(glassVariant).toBeDefined();
      expect(state.activeVariantByTemplate[templateId]).toBe(glassVariant!.id);
      expect(state.files["component.tsx"]).toBe(defaultCode);

      // Modify files in "Glassmorphism" variant
      const glassCode = "<GlassmorphicCard backdropBlur='16px' />";
      store.updateFile("component.tsx", glassCode);
      store.addDependency("clsx");

      state = useStudioStore.getState();
      expect(state.files["component.tsx"]).toBe(glassCode);

      // Default variant must remain untouched
      const defaultVariant = state.variantsByTemplate[templateId]?.find(
        (v) => v.id === `var-default-${templateId}`
      );
      expect(defaultVariant?.files["component.tsx"]).toBe(defaultCode);
      expect(defaultVariant?.dependencies).not.toContain("clsx");

      // Save a checkpoint in "Glassmorphism"
      store.saveCheckpoint("Glassmorphism v1", "Initial frosted glass styling");

      state = useStudioStore.getState();
      const updatedGlassVariant = state.variantsByTemplate[templateId]?.find(
        (v) => v.id === glassVariant!.id
      );
      const updatedDefaultVariant = state.variantsByTemplate[templateId]?.find(
        (v) => v.id === `var-default-${templateId}`
      );

      expect(updatedGlassVariant?.checkpoints.length).toBe(1);
      expect(updatedGlassVariant?.checkpoints[0].name).toBe("Glassmorphism v1");
      // Default variant checkpoints should still be empty
      expect(updatedDefaultVariant?.checkpoints.length).toBe(0);
    });
  });

  describe("Lifecycle Story 4: Variant Switching", () => {
    it("should switch between variants and cleanly restore workspace files and dependencies", () => {
      const store = useStudioStore.getState();

      const defaultVariantId = `var-default-${templateId}`;
      store.updateFile("component.tsx", "<DefaultVariantCode />");
      store.addDependency("lodash");

      // Branch to Glassmorphism
      store.createVariant("Glassmorphism", true);
      const glassVariantId = useStudioStore.getState().activeVariantByTemplate[templateId];

      store.updateFile("component.tsx", "<GlassmorphismCode />");
      store.addDependency("tailwind-merge");

      // Verify active state is Glassmorphism
      expect(useStudioStore.getState().files["component.tsx"]).toBe("<GlassmorphismCode />");
      expect(useStudioStore.getState().dependencies).toContain("tailwind-merge");

      // Switch back to Default
      store.switchVariant(defaultVariantId);

      let state = useStudioStore.getState();
      expect(state.activeVariantByTemplate[templateId]).toBe(defaultVariantId);
      expect(state.files["component.tsx"]).toBe("<DefaultVariantCode />");
      expect(state.dependencies).toContain("lodash");
      expect(state.dependencies).not.toContain("tailwind-merge");

      // Switch back to Glassmorphism
      store.switchVariant(glassVariantId);

      state = useStudioStore.getState();
      expect(state.activeVariantByTemplate[templateId]).toBe(glassVariantId);
      expect(state.files["component.tsx"]).toBe("<GlassmorphismCode />");
      expect(state.dependencies).toContain("tailwind-merge");
    });
  });

  describe("Lifecycle Story 5: Checkpoint Comparison & Diff", () => {
    it("should retrieve checkpoints and verify diffable differences against active working files", () => {
      const store = useStudioStore.getState();

      const originalCode = "export default function Button() { return <button>Original</button>; }";
      store.updateFile("component.tsx", originalCode);
      store.saveCheckpoint("Baseline Button", "Original version for diff comparison");

      const state = useStudioStore.getState();
      const activeVariantId = state.activeVariantByTemplate[templateId];
      const activeVariant = state.variantsByTemplate[templateId]?.find((v) => v.id === activeVariantId);
      const checkpoint = activeVariant?.checkpoints[0];

      expect(checkpoint).toBeDefined();

      // Mutate active working files
      const updatedCode = "export default function Button() { return <button className='btn-accent'>Updated</button>; }";
      store.updateFile("component.tsx", updatedCode);

      const currentState = useStudioStore.getState();
      const workingContent = currentState.files["component.tsx"];
      const checkpointContent = checkpoint!.files["component.tsx"];

      // Verify both versions exist and differ
      expect(workingContent).not.toBe(checkpointContent);
      expect(checkpointContent).toContain("<button>Original</button>");
      expect(workingContent).toContain("<button className='btn-accent'>Updated</button>");

      // Select the checkpoint for diff viewing in UI
      store.setSelectedCheckpointId(checkpoint!.id);
      expect(useStudioStore.getState().selectedCheckpointId).toBe(checkpoint!.id);
    });
  });

  describe("Lifecycle Story 6: Checkpoint Restore", () => {
    it("should restore a checkpoint, rollback working files, clear compilerError, and update active variant files", () => {
      const store = useStudioStore.getState();

      const stableCode = "export default function Header() { return <h1>Stable Header</h1>; }";
      store.updateFile("component.tsx", stableCode);
      store.saveCheckpoint("Stable Snapshot", "Known working checkpoint");

      const state = useStudioStore.getState();
      const activeVariantId = state.activeVariantByTemplate[templateId];
      const activeVar = state.variantsByTemplate[templateId]?.find((v) => v.id === activeVariantId);
      const checkpointId = activeVar!.checkpoints[0].id;

      // Break the code and simulate compiler error
      const brokenCode = "export default function Header() { return <h1>Broken Header";
      store.updateFile("component.tsx", brokenCode);
      store.setCompilerState(true, "SyntaxError: Unexpected end of file");

      const brokenState = useStudioStore.getState();
      expect(brokenState.files["component.tsx"]).toBe(brokenCode);
      expect(brokenState.compilerError).toBe("SyntaxError: Unexpected end of file");

      // Restore the checkpoint
      store.restoreCheckpoint(checkpointId);

      const restoredState = useStudioStore.getState();
      expect(restoredState.files["component.tsx"]).toBe(stableCode);
      expect(restoredState.compilerError).toBeNull();
      expect(restoredState.selectedCheckpointId).toBe(checkpointId);

      // Verify active variant files now also match restored files
      const updatedVariant = restoredState.variantsByTemplate[templateId]?.find(
        (v) => v.id === activeVariantId
      );
      expect(updatedVariant?.files["component.tsx"]).toBe(stableCode);
    });
  });

  describe("Lifecycle Story 7: Forking Checkpoint to New Variant", () => {
    it("should fork a checkpoint to a new variant with checkpoint files and automatically switch to it", () => {
      const store = useStudioStore.getState();

      const retroCode = "export function RetroWidget() { return <div className='retro-90s'>Pixel Art</div>; }";
      store.updateFile("component.tsx", retroCode);
      store.saveCheckpoint("Retro Snapshot", "Base for 90s aesthetic");

      const state = useStudioStore.getState();
      const activeVariantId = state.activeVariantByTemplate[templateId];
      const cpId = state.variantsByTemplate[templateId]
        ?.find((v) => v.id === activeVariantId)
        ?.checkpoints[0].id;

      expect(cpId).toBeDefined();

      // Later edits change working files
      store.updateFile("component.tsx", "export function ModernWidget() { return <div>Modern</div>; }");

      // Fork checkpoint to "Retro 90s"
      store.forkCheckpointToNewVariant(cpId!, "Retro 90s");

      const afterForkState = useStudioStore.getState();
      const variants = afterForkState.variantsByTemplate[templateId] || [];
      const forkedVariant = variants.find((v) => v.name === "Retro 90s");

      expect(forkedVariant).toBeDefined();
      expect(afterForkState.activeVariantByTemplate[templateId]).toBe(forkedVariant!.id);
      expect(afterForkState.files["component.tsx"]).toBe(retroCode);
      expect(forkedVariant?.files["component.tsx"]).toBe(retroCode);
      expect(forkedVariant?.checkpoints).toEqual([]);
    });
  });

  describe("Lifecycle Story 8: Variant Safeguards & Deletion", () => {
    it("should reject deletion of Default variant, even when renamed", () => {
      const store = useStudioStore.getState();

      // Create a second variant first so count > 1
      store.createVariant("Variant Beta");

      let state = useStudioStore.getState();
      const variantsBefore = state.variantsByTemplate[templateId] || [];
      expect(variantsBefore.length).toBe(2);

      const defaultVariant = variantsBefore.find((v) => v.id.startsWith("var-default-"));
      expect(defaultVariant).toBeDefined();

      // 1. Attempt to delete default variant directly
      store.deleteVariant(defaultVariant!.id);
      state = useStudioStore.getState();
      expect(state.variantsByTemplate[templateId]?.length).toBe(2);
      expect(state.variantsByTemplate[templateId]?.some((v) => v.id === defaultVariant!.id)).toBe(true);

      // 2. Rename default variant to "Original" and try deleting again
      store.renameVariant(defaultVariant!.id, "Original");
      state = useStudioStore.getState();
      const renamed = state.variantsByTemplate[templateId]?.find((v) => v.id === defaultVariant!.id);
      expect(renamed?.name).toBe("Original");

      store.deleteVariant(defaultVariant!.id);
      state = useStudioStore.getState();
      expect(state.variantsByTemplate[templateId]?.length).toBe(2);
      expect(state.variantsByTemplate[templateId]?.some((v) => v.id === defaultVariant!.id)).toBe(true);
    });

    it("should successfully delete a custom variant and fallback active variant to remaining variant", () => {
      const store = useStudioStore.getState();

      store.createVariant("Glassmorphism");
      let state = useStudioStore.getState();
      const glassVar = state.variantsByTemplate[templateId]?.find((v) => v.name === "Glassmorphism");
      expect(glassVar).toBeDefined();
      expect(state.activeVariantByTemplate[templateId]).toBe(glassVar!.id);

      // Delete the active custom variant
      store.deleteVariant(glassVar!.id);

      state = useStudioStore.getState();
      const remainingVariants = state.variantsByTemplate[templateId] || [];
      expect(remainingVariants.some((v) => v.id === glassVar!.id)).toBe(false);

      // Active variant must fall back to the remaining variant (Default)
      const fallbackId = state.activeVariantByTemplate[templateId];
      expect(fallbackId).toBe(`var-default-${templateId}`);
      expect(state.files["component.tsx"]).toBe(remainingVariants[0].files["component.tsx"]);
    });
  });

  describe("Lifecycle Story 9: FIFO Cap of 50 Checkpoints", () => {
    it("should cap checkpoints at 50, dropping oldest checkpoints in FIFO order", () => {
      const store = useStudioStore.getState();

      for (let i = 1; i <= 55; i++) {
        store.saveCheckpoint(`Checkpoint ${i}`, `Description for ${i}`);
      }

      const state = useStudioStore.getState();
      const activeVariantId = state.activeVariantByTemplate[templateId];
      const activeVariant = state.variantsByTemplate[templateId]?.find((v) => v.id === activeVariantId);

      expect(activeVariant).toBeDefined();
      expect(activeVariant?.checkpoints.length).toBe(50);

      // Newest checkpoint must be at index 0
      expect(activeVariant?.checkpoints[0].name).toBe("Checkpoint 55");
      expect(activeVariant?.checkpoints[0].description).toBe("Description for 55");

      // Oldest remaining checkpoint must be Checkpoint 6 (1 to 5 dropped)
      expect(activeVariant?.checkpoints[49].name).toBe("Checkpoint 6");
      expect(activeVariant?.checkpoints.some((cp) => cp.name === "Checkpoint 1")).toBe(false);
      expect(activeVariant?.checkpoints.some((cp) => cp.name === "Checkpoint 5")).toBe(false);
    });
  });

  describe("Lifecycle Story 10: State UI Modals & Sheet State", () => {
    it("should toggle history sheet, save checkpoint dialog, create variant dialog, and selected checkpoint cleanly", () => {
      const store = useStudioStore.getState();

      // Initial state
      expect(store.isHistorySheetOpen).toBe(false);
      expect(store.isSaveCheckpointDialogOpen).toBe(false);
      expect(store.isCreateVariantDialogOpen).toBe(false);
      expect(store.selectedCheckpointId).toBeNull();

      // Toggle history sheet
      store.setHistorySheetOpen(true);
      expect(useStudioStore.getState().isHistorySheetOpen).toBe(true);
      store.setHistorySheetOpen(false);
      expect(useStudioStore.getState().isHistorySheetOpen).toBe(false);

      // Toggle save checkpoint dialog
      store.setSaveCheckpointDialogOpen(true);
      expect(useStudioStore.getState().isSaveCheckpointDialogOpen).toBe(true);
      store.setSaveCheckpointDialogOpen(false);
      expect(useStudioStore.getState().isSaveCheckpointDialogOpen).toBe(false);

      // Toggle create variant dialog
      store.setCreateVariantDialogOpen(true);
      expect(useStudioStore.getState().isCreateVariantDialogOpen).toBe(true);
      store.setCreateVariantDialogOpen(false);
      expect(useStudioStore.getState().isCreateVariantDialogOpen).toBe(false);

      // Toggle selected checkpoint ID
      store.setSelectedCheckpointId("cp-custom-id");
      expect(useStudioStore.getState().selectedCheckpointId).toBe("cp-custom-id");
      store.setSelectedCheckpointId(null);
      expect(useStudioStore.getState().selectedCheckpointId).toBeNull();
    });
  });
});
