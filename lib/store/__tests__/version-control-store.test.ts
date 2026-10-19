import { describe, it, expect, beforeEach } from "bun:test";
import { useStudioStore } from "../studio-store";

describe("Studio Version Control Slice", () => {
  beforeEach(() => {
    useStudioStore.setState((state) => ({
      ...state,
      variantsByTemplate: {},
      activeVariantByTemplate: {},
      currentTemplateId: "ink-orbit-hero",
      files: {
        "component.tsx": "// initial component",
        "demo.tsx": "// initial demo",
        "index.css": "/* initial css */",
      },
      dependencies: ["lucide-react"],
      isHistorySheetOpen: false,
      selectedCheckpointId: null,
      isCreateVariantDialogOpen: false,
      isSaveCheckpointDialogOpen: false,
    }));
  });

  it("should initialize default variant when accessed or template loaded", () => {
    const store = useStudioStore.getState();
    expect(store.createVariant).toBeDefined();
    store.createVariant("Minimal");
    const state = useStudioStore.getState();
    const variants = state.variantsByTemplate[state.currentTemplateId] || [];
    expect(variants.some((v) => v.name === "Minimal")).toBe(true);
  });

  it("should create manual checkpoints with custom notes and clone files", () => {
    const store = useStudioStore.getState();
    store.saveCheckpoint("v1: initial release", "first checkpoint");
    const state = useStudioStore.getState();
    const currentVariantId = state.activeVariantByTemplate[state.currentTemplateId];
    const variants = state.variantsByTemplate[state.currentTemplateId] || [];
    const activeVar = variants.find((v) => v.id === currentVariantId);
    expect(activeVar?.checkpoints.length).toBeGreaterThan(0);
    expect(activeVar?.checkpoints[0].name).toBe("v1: initial release");
    expect(activeVar?.checkpoints[0].description).toBe("first checkpoint");
    expect(activeVar?.checkpoints[0].files["component.tsx"]).toBe("// initial component");
  });

  it("should restore a checkpoint to working files", () => {
    const store = useStudioStore.getState();
    store.updateFile("component.tsx", "// modified code");
    store.saveCheckpoint("Check 2");

    // change code again
    store.updateFile("component.tsx", "// new temporary code");
    expect(useStudioStore.getState().files["component.tsx"]).toBe("// new temporary code");

    // restore
    const state = useStudioStore.getState();
    const activeVar = state.variantsByTemplate[state.currentTemplateId]?.find(
      (v) => v.id === state.activeVariantByTemplate[state.currentTemplateId]
    );
    const targetCheckpoint = activeVar?.checkpoints[0];
    expect(targetCheckpoint).toBeDefined();
    if (targetCheckpoint) {
      store.restoreCheckpoint(targetCheckpoint.id);
      expect(useStudioStore.getState().files["component.tsx"]).toBe("// modified code");
    }
  });

  it("should fork checkpoint to a new variant and switch to it", () => {
    const store = useStudioStore.getState();
    store.updateFile("component.tsx", "// checkpoint code to fork");
    store.saveCheckpoint("Pre-fork snapshot");

    const stateBefore = useStudioStore.getState();
    const activeVar = stateBefore.variantsByTemplate[stateBefore.currentTemplateId]?.find(
      (v) => v.id === stateBefore.activeVariantByTemplate[stateBefore.currentTemplateId]
    );
    const cp = activeVar?.checkpoints[0];
    expect(cp).toBeDefined();

    store.updateFile("component.tsx", "// post-checkpoint different code");
    store.forkCheckpointToNewVariant(cp!.id, "Forked Variant");

    const stateAfter = useStudioStore.getState();
    const activeVarId = stateAfter.activeVariantByTemplate[stateAfter.currentTemplateId];
    const currentVariants = stateAfter.variantsByTemplate[stateAfter.currentTemplateId] || [];
    const newActiveVar = currentVariants.find((v) => v.id === activeVarId);

    expect(newActiveVar?.name).toBe("Forked Variant");
    expect(stateAfter.files["component.tsx"]).toBe("// checkpoint code to fork");
  });

  it("should switch variants and keep files isolated", () => {
    const store = useStudioStore.getState();
    store.createVariant("Variant A");
    store.updateFile("component.tsx", "// code for variant A");

    store.createVariant("Variant B");
    store.updateFile("component.tsx", "// code for variant B");
    expect(useStudioStore.getState().files["component.tsx"]).toBe("// code for variant B");

    // Switch back to Variant A
    const state = useStudioStore.getState();
    const varA = state.variantsByTemplate[state.currentTemplateId]?.find((v) => v.name === "Variant A");
    expect(varA).toBeDefined();
    store.switchVariant(varA!.id);

    expect(useStudioStore.getState().files["component.tsx"]).toBe("// code for variant A");
  });

  it("should cap checkpoints at 50 per variant", () => {
    const store = useStudioStore.getState();
    for (let i = 1; i <= 55; i++) {
      store.saveCheckpoint(`Checkpoint ${i}`);
    }

    const state = useStudioStore.getState();
    const activeVarId = state.activeVariantByTemplate[state.currentTemplateId];
    const activeVar = state.variantsByTemplate[state.currentTemplateId]?.find((v) => v.id === activeVarId);
    expect(activeVar?.checkpoints.length).toBe(50);
    // Newest first:
    expect(activeVar?.checkpoints[0].name).toBe("Checkpoint 55");
  });

  it("should delete and rename variants", () => {
    const store = useStudioStore.getState();
    store.createVariant("Temp Variant");
    let state = useStudioStore.getState();
    const tempVar = state.variantsByTemplate[state.currentTemplateId]?.find((v) => v.name === "Temp Variant");
    expect(tempVar).toBeDefined();

    store.renameVariant(tempVar!.id, "Renamed Variant");
    state = useStudioStore.getState();
    expect(state.variantsByTemplate[state.currentTemplateId]?.some((v) => v.name === "Renamed Variant")).toBe(true);

    store.deleteVariant(tempVar!.id);
    state = useStudioStore.getState();
    expect(state.variantsByTemplate[state.currentTemplateId]?.some((v) => v.id === tempVar!.id)).toBe(false);
  });

  it("should manage dialog and sheet visibility states", () => {
    const store = useStudioStore.getState();
    store.setHistorySheetOpen(true);
    expect(useStudioStore.getState().isHistorySheetOpen).toBe(true);

    store.setSelectedCheckpointId("cp-123");
    expect(useStudioStore.getState().selectedCheckpointId).toBe("cp-123");

    store.setCreateVariantDialogOpen(true);
    expect(useStudioStore.getState().isCreateVariantDialogOpen).toBe(true);

    store.setSaveCheckpointDialogOpen(true);
    expect(useStudioStore.getState().isSaveCheckpointDialogOpen).toBe(true);
  });

  it("should delete checkpoint and reset selectedCheckpointId if matching", () => {
    const store = useStudioStore.getState();
    store.saveCheckpoint("Checkpoint to Delete");
    let state = useStudioStore.getState();
    const activeVar = state.variantsByTemplate[state.currentTemplateId]?.find(
      (v) => v.id === state.activeVariantByTemplate[state.currentTemplateId]
    );
    const cp = activeVar?.checkpoints[0];
    expect(cp).toBeDefined();

    store.setSelectedCheckpointId(cp!.id);
    expect(useStudioStore.getState().selectedCheckpointId).toBe(cp!.id);

    store.deleteCheckpoint(cp!.id);
    state = useStudioStore.getState();
    const updatedVar = state.variantsByTemplate[state.currentTemplateId]?.find(
      (v) => v.id === state.activeVariantByTemplate[state.currentTemplateId]
    );
    expect(updatedVar?.checkpoints.some((c) => c.id === cp!.id)).toBe(false);
    expect(state.selectedCheckpointId).toBeNull();
  });

  it("should prevent deleting default variant even if renamed", () => {
    const store = useStudioStore.getState();
    store.createVariant("Temp");
    let state = useStudioStore.getState();
    const defaultVar = state.variantsByTemplate[state.currentTemplateId]?.find(
      (v) => v.id.startsWith("var-default-")
    );
    expect(defaultVar).toBeDefined();

    store.renameVariant(defaultVar!.id, "Custom Core Name");
    store.deleteVariant(defaultVar!.id);
    state = useStudioStore.getState();
    expect(state.variantsByTemplate[state.currentTemplateId]?.some((v) => v.id === defaultVar!.id)).toBe(true);
  });

  it("should clear compilerError when restoring checkpoint", () => {
    const store = useStudioStore.getState();
    store.saveCheckpoint("Clean snapshot");
    const stateBefore = useStudioStore.getState();
    const activeVar = stateBefore.variantsByTemplate[stateBefore.currentTemplateId]?.find(
      (v) => v.id === stateBefore.activeVariantByTemplate[stateBefore.currentTemplateId]
    );
    const cpId = activeVar!.checkpoints[0].id;

    store.setCompilerState(true, "SyntaxError: Unexpected token");
    expect(useStudioStore.getState().compilerError).toBe("SyntaxError: Unexpected token");

    store.restoreCheckpoint(cpId);
    expect(useStudioStore.getState().compilerError).toBeNull();
  });

  it("should fallback to 'Checkpoint' if saving with empty name", () => {
    const store = useStudioStore.getState();
    store.saveCheckpoint("   ");
    const state = useStudioStore.getState();
    const activeVar = state.variantsByTemplate[state.currentTemplateId]?.find(
      (v) => v.id === state.activeVariantByTemplate[state.currentTemplateId]
    );
    expect(activeVar?.checkpoints[0].name).toBe("Checkpoint");
  });
});
