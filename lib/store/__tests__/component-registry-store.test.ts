import { describe, it, expect, beforeEach } from "bun:test";
import { useStudioStore, createInitialUserComponents, studioPersistMerge } from "../studio-store";

describe("Component Registry & Work History Store Slice", () => {
  beforeEach(() => {
    useStudioStore.setState((state) => ({
      ...state,
      userComponents: {},
      recentComponentIds: [],
      quickPreviewComponentId: null,
      isCreateComponentDialogOpen: false,
    }));
  });

  it("should create a new component from blank slate and select it", () => {
    const store = useStudioStore.getState();
    const newId = store.createComponent({
      name: "Hero Section",
      description: "My custom animated hero",
      category: "Heroes",
    });

    const state = useStudioStore.getState();
    expect(newId).toBeDefined();
    expect(state.userComponents[newId]).toBeDefined();
    expect(state.userComponents[newId].name).toBe("Hero Section");
    expect(state.userComponents[newId].category).toBe("Heroes");
    expect(state.currentTemplateId).toBe(newId);
    expect(state.recentComponentIds[0]).toBe(newId);
  });

  it("should create a new component by cloning an existing starter template", () => {
    const store = useStudioStore.getState();
    const newId = store.createComponent({
      name: "Custom Spotlight",
      starterTemplateId: "spotlight-card",
      category: "Cards",
    });

    const state = useStudioStore.getState();
    expect(state.userComponents[newId].files["component.tsx"]).toContain("Spotlight");
    expect(state.userComponents[newId].category).toBe("Cards");
  });

  it("should record component visit and maintain recent history order without duplicates", () => {
    const store = useStudioStore.getState();
    const idA = store.createComponent({ name: "Component A" });
    const idB = store.createComponent({ name: "Component B" });
    const idC = store.createComponent({ name: "Component C" });

    store.recordComponentVisit(idA);
    const state = useStudioStore.getState();
    expect(state.recentComponentIds[0]).toBe(idA);
    expect(state.recentComponentIds.filter((id) => id === idA).length).toBe(1);
  });

  it("should duplicate an existing component with clean copies of files", () => {
    const store = useStudioStore.getState();
    const originalId = store.createComponent({ name: "Original Card", category: "Cards" });
    const dupId = store.duplicateUserComponent(originalId, "Original Card Copy");

    const state = useStudioStore.getState();
    expect(dupId).not.toBe(originalId);
    expect(state.userComponents[dupId].name).toBe("Original Card Copy");
    expect(state.userComponents[dupId].category).toBe("Cards");
  });

  it("should delete custom user component and update recent list", () => {
    const store = useStudioStore.getState();
    const customId = store.createComponent({ name: "Temporary Button" });
    expect(useStudioStore.getState().userComponents[customId]).toBeDefined();

    store.deleteUserComponent(customId);
    const state = useStudioStore.getState();
    expect(state.userComponents[customId]).toBeUndefined();
    expect(state.recentComponentIds.includes(customId)).toBe(false);
  });

  it("should toggle create dialog and quick preview state", () => {
    const store = useStudioStore.getState();
    store.setCreateComponentDialogOpen(true);
    expect(useStudioStore.getState().isCreateComponentDialogOpen).toBe(true);

    store.setQuickPreviewComponentId("spotlight-card");
    expect(useStudioStore.getState().quickPreviewComponentId).toBe("spotlight-card");
    store.setQuickPreviewComponentId(null);
    expect(useStudioStore.getState().quickPreviewComponentId).toBeNull();
  });

  it("should load an existing component and synchronize files and history visit", () => {
    const store = useStudioStore.getState();
    const compId = store.createComponent({ name: "Loaded Comp", category: "Test" });
    store.updateFile("component.tsx", "// custom loaded component code");

    // create another component
    const otherId = store.createComponent({ name: "Other Comp" });
    expect(useStudioStore.getState().currentTemplateId).toBe(otherId);

    // load previous component
    store.loadComponent(compId);
    const state = useStudioStore.getState();
    expect(state.currentTemplateId).toBe(compId);
    expect(state.files["component.tsx"]).toBe("// custom loaded component code");
    expect(state.recentComponentIds[0]).toBe(compId);
  });

  it("should sync userComponents[currentTemplateId].files on updateFile", () => {
    const store = useStudioStore.getState();
    const id = store.createComponent({ name: "Sync Component" });
    store.updateFile("component.tsx", "// modified in editor");

    const state = useStudioStore.getState();
    expect(state.files["component.tsx"]).toBe("// modified in editor");
    expect(state.userComponents[id].files["component.tsx"]).toBe("// modified in editor");
  });

  it("should reset current template to component files on resetCurrentTemplate", () => {
    const store = useStudioStore.getState();
    const id = store.createComponent({ name: "Reset Target" });
    const originalCode = useStudioStore.getState().files["component.tsx"];

    useStudioStore.setState((s) => ({
      files: { ...s.files, "component.tsx": "// transient broken edit" },
    }));
    expect(useStudioStore.getState().files["component.tsx"]).toBe("// transient broken edit");

    store.resetCurrentTemplate();
    const state = useStudioStore.getState();
    expect(state.files["component.tsx"]).toBe(originalCode);
  });

  it("should prevent deleting built-in components", () => {
    useStudioStore.setState((state) => ({
      userComponents: {
        ...state.userComponents,
        "test-builtin": {
          id: "test-builtin",
          name: "BuiltIn Comp",
          description: "Built-in",
          category: "Custom",
          isBuiltIn: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          files: {
            "component.tsx": "// builtin",
            "demo.tsx": "// demo",
            "index.css": "",
          },
          dependencies: [],
        },
      },
      currentTemplateId: "test-builtin",
    }));

    const store = useStudioStore.getState();
    expect(useStudioStore.getState().userComponents["test-builtin"]).toBeDefined();

    store.deleteUserComponent("test-builtin");
    const state = useStudioStore.getState();
    expect(state.userComponents["test-builtin"]).toBeDefined();
    expect(state.currentTemplateId).toBe("test-builtin");
  });

  it("should reset selectedCheckpointId and compilerError when deleting active custom component", () => {
    const store = useStudioStore.getState();
    const customId = store.createComponent({ name: "Custom To Delete" });
    useStudioStore.setState({
      selectedCheckpointId: "cp-123",
      compilerError: "SyntaxError: unexpected token",
    });

    store.deleteUserComponent(customId);
    const state = useStudioStore.getState();
    expect(state.currentTemplateId).not.toBe(customId);
    expect(state.selectedCheckpointId).toBeNull();
    expect(state.compilerError).toBeNull();
  });

  it("should sync dependencies changes to userComponents[currentTemplateId].dependencies", () => {
    const store = useStudioStore.getState();
    const id = store.createComponent({ name: "Deps Component" });

    store.addDependency("framer-motion");
    expect(useStudioStore.getState().userComponents[id].dependencies).toContain("framer-motion");

    store.toggleDependency("canvas-confetti");
    expect(useStudioStore.getState().userComponents[id].dependencies).toContain("canvas-confetti");

    store.removeDependency("framer-motion");
    expect(useStudioStore.getState().userComponents[id].dependencies).not.toContain("framer-motion");

    store.clearAllDependencies();
    expect(useStudioStore.getState().userComponents[id].dependencies).toEqual([]);
  });

  it("should cap recentComponentIds at 50", () => {
    const store = useStudioStore.getState();
    for (let i = 0; i < 55; i++) {
      store.recordComponentVisit(`comp-${i}`);
    }
    const state = useStudioStore.getState();
    expect(state.recentComponentIds.length).toBeLessThanOrEqual(50);
  });

  it("should copy from user component files when creating variant with copyFromActive = false", () => {
    const store = useStudioStore.getState();
    const customId = store.createComponent({ name: "Custom Variant Base" });
    store.updateFile("component.tsx", "// custom unique code for variant");

    store.createVariant("Clean Variant", false);
    const state = useStudioStore.getState();
    expect(state.files["component.tsx"]).toBe("// custom unique code for variant");
  });

  it("should update component preview image and persist timestamp", () => {
    const store = useStudioStore.getState();
    const id = store.createComponent({ name: "Preview Target Comp" });
    const initialUpdatedAt = useStudioStore.getState().userComponents[id].updatedAt;

    const sampleSvg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' fill='red'/></svg>";
    store.updateComponentPreview(id, sampleSvg);

    const state = useStudioStore.getState();
    expect(state.userComponents[id].previewImage).toBe(sampleSvg);
    expect(state.userComponents[id].updatedAt).toBeGreaterThanOrEqual(initialUpdatedAt);

    // No-op for non-existent component
    store.updateComponentPreview("non-existent-id", sampleSvg);
    expect(useStudioStore.getState().userComponents["non-existent-id"]).toBeUndefined();
  });

  it("should initialize with clean slate and allow creating and duplicating custom components with previews", () => {
    const initialComponents = createInitialUserComponents();
    expect(Object.keys(initialComponents).length).toBe(0);

    const store = useStudioStore.getState();
    const blankId = store.createComponent({ name: "Blank Slate" });
    const blankComp = useStudioStore.getState().userComponents[blankId];
    expect(blankComp.previewImage).toBeDefined();
    expect(blankComp.previewImage?.startsWith("data:image/svg+xml")).toBe(true);

    const dupId = store.duplicateUserComponent(blankId);
    expect(useStudioStore.getState().userComponents[dupId].previewImage).toBe(blankComp.previewImage);
  });

  it("should merge older persisted state and sanitize removed default IDs", () => {
    const olderPersistedState = {
      userComponents: {
        "custom-old": {
          id: "custom-old",
          name: "Old Custom Card",
          description: "From older app version",
          category: "Cards",
          createdAt: 1690000000000,
          updatedAt: 1690000000000,
          files: {
            "component.tsx": "// old custom",
            "demo.tsx": "// old demo",
            "index.css": "",
          },
          dependencies: [],
        },
        "ink-orbit-hero": {
          id: "ink-orbit-hero",
          name: "Ink Orbit 3D Hero",
          description: "Removed default template",
          category: "Heroes",
          createdAt: 1690000000000,
          updatedAt: 1690000000000,
          files: { "component.tsx": "", "demo.tsx": "", "index.css": "" },
          dependencies: [],
        },
      },
    };

    const merged = studioPersistMerge(olderPersistedState, useStudioStore.getState());
    expect(merged.userComponents["custom-old"]).toBeDefined();
    expect(merged.userComponents["ink-orbit-hero"]).toBeUndefined();
    expect(merged.userComponents["aurora-ambient-hero"]).toBeUndefined();
    expect(merged.userComponents["bento-metric-grid"]).toBeUndefined();
    expect(merged.userComponents["neon-glow-button"]).toBeUndefined();
    expect(merged.userComponents["live-ping-status-pill"]).toBeUndefined();
  });
});


