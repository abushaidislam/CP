import { describe, it, expect, beforeEach } from "bun:test";
import { useStudioStore } from "../studio-store";

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
});

