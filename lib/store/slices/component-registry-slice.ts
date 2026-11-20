import { DEFAULT_TEMPLATES } from "@/lib/sandbox/default-templates";
import {
  cacheComponentPreview,
  removeCachedComponentPreview,
  setCachedPreviewSync,
} from "@/lib/cache/preview-cache";
import {
  createDefaultVariant,
  createInitialUserComponents,
  DEFAULT_TEMPLATE_PREVIEWS,
  normalizeStudioFiles,
  syncVariantWithWorking,
} from "../default-previews";
import type { StudioSliceCreator, StudioState, UserComponent } from "../types";

export type ComponentRegistrySlice = Pick<
  StudioState,
  | "userComponents"
  | "recentComponentIds"
  | "quickPreviewComponentId"
  | "isCreateComponentDialogOpen"
  | "loadTemplate"
  | "loadComponent"
  | "createComponent"
  | "deleteUserComponent"
  | "duplicateUserComponent"
  | "updateComponentPreview"
  | "recordComponentVisit"
  | "setQuickPreviewComponentId"
  | "setCreateComponentDialogOpen"
  | "resetCurrentTemplate"
>;

const initialTemplate = DEFAULT_TEMPLATES[0];

export const createComponentRegistrySlice: StudioSliceCreator<ComponentRegistrySlice> = (
  set,
  get
) => ({
  userComponents: createInitialUserComponents(),
  recentComponentIds: [initialTemplate.id],
  quickPreviewComponentId: null,
  isCreateComponentDialogOpen: false,

  loadTemplate: (templateId) => {
    get().loadComponent(templateId);
  },

  loadComponent: (id) => {
    const state = get();
    const target =
      state.userComponents?.[id] ||
      DEFAULT_TEMPLATES.find((t) => t.id === id) ||
      DEFAULT_TEMPLATES[0];

    const existingVariants = state.variantsByTemplate?.[target.id] || [];
    let activeVariantId = state.activeVariantByTemplate?.[target.id];
    let nextVariants = existingVariants;
    let filesToLoad = target.files;
    let depsToLoad = target.dependencies;

    if (existingVariants.length === 0) {
      const defaultVar = createDefaultVariant(
        target.id,
        target.files,
        target.dependencies
      );
      nextVariants = [defaultVar];
      activeVariantId = defaultVar.id;
      filesToLoad = normalizeStudioFiles(defaultVar.files);
      depsToLoad = [...defaultVar.dependencies];
    } else {
      const activeVar =
        existingVariants.find((v) => v.id === activeVariantId) ||
        existingVariants[0];
      activeVariantId = activeVar.id;
      filesToLoad = normalizeStudioFiles(activeVar.files);
      depsToLoad = [...activeVar.dependencies];
    }

    const isBuiltIn = DEFAULT_TEMPLATES.some((t) => t.id === target.id);
    const nextUserComponents = state.userComponents?.[target.id]
      ? {
          ...state.userComponents,
          [target.id]: {
            ...state.userComponents[target.id],
            files: normalizeStudioFiles(state.userComponents[target.id].files),
          },
        }
      : {
          ...(state.userComponents || {}),
          [target.id]: {
            id: target.id,
            name: target.name,
            description: target.description,
            category: target.category,
            isBuiltIn,
            createdAt: 1700000000000,
            updatedAt: 1700000000000,
            files: normalizeStudioFiles(target.files),
            dependencies: [...target.dependencies],
            previewImage:
              target.previewImage ||
              DEFAULT_TEMPLATE_PREVIEWS[target.id] ||
              DEFAULT_TEMPLATE_PREVIEWS["blank"],
          },
        };

    set({
      files: filesToLoad,
      dependencies: depsToLoad,
      currentTemplateId: target.id,
      activeTab: "component.tsx",
      compilerError: null,
      userComponents: nextUserComponents,
      variantsByTemplate: {
        ...(state.variantsByTemplate || {}),
        [target.id]: nextVariants,
      },
      activeVariantByTemplate: {
        ...(state.activeVariantByTemplate || {}),
        [target.id]: activeVariantId,
      },
      selectedCheckpointId: null,
      recentComponentIds: [
        target.id,
        ...(state.recentComponentIds || []).filter((cid) => cid !== target.id),
      ].slice(0, 50),
    });

    const loadedComp = nextUserComponents[target.id];
    if (
      loadedComp &&
      (loadedComp.filesLoaded === false || !loadedComp.files?.["component.tsx"])
    ) {
      void get().ensureComponentFilesLoaded(target.id);
    }
  },

  createComponent: (data) => {
    const id = `comp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const name = data.name.trim() || "Untitled Component";
    const category = data.category?.trim() || "Custom";
    const description = data.description?.trim() || "";

    let initialFiles: StudioState["files"];
    let initialDeps: string[];

    const starter = data.starterTemplateId
      ? get().userComponents?.[data.starterTemplateId] ||
        DEFAULT_TEMPLATES.find((t) => t.id === data.starterTemplateId)
      : null;

    const previewImage =
      starter?.previewImage ||
      (data.starterTemplateId && DEFAULT_TEMPLATE_PREVIEWS[data.starterTemplateId]) ||
      DEFAULT_TEMPLATE_PREVIEWS["blank"];

    if (starter) {
      initialFiles = normalizeStudioFiles(starter.files);
      initialDeps = [...starter.dependencies];
    } else {
      const safeNameLiteral = JSON.stringify(name);
      const starterDemo = `"use client";\n\nimport React from "react";\nimport Component from "../components/ui/component";\n\nconst settings = {\n  title: ${safeNameLiteral},\n  accentColor: "#6366f1",\n  showBadge: true,\n};\n\nexport default function Demo(props: Partial<typeof settings>) {\n  const s = { ...settings, ...props };\n\n  return (\n    <div className="flex min-h-[300px] w-full items-center justify-center p-6">\n      <Component\n        title={s.title}\n        accentColor={s.accentColor}\n        showBadge={s.showBadge}\n      />\n    </div>\n  );\n}\n`;
      initialFiles = {
        "component.tsx": `"use client"\n\nimport React from "react"\n\nexport interface ComponentProps {\n  title?: string\n  accentColor?: string\n  showBadge?: boolean\n}\n\nexport function Component({\n  title = ${safeNameLiteral},\n  accentColor = "#6366f1",\n  showBadge = true,\n}: ComponentProps) {\n  return (\n    <div className="flex flex-col items-center justify-center gap-3 p-8 text-foreground">\n      {showBadge && (\n        <span\n          className="inline-flex items-center gap-1.5 border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider"\n          style={{ borderColor: accentColor, color: accentColor }}\n        >\n          21st.dev Ready\n        </span>\n      )}\n      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>\n    </div>\n  )\n}\n\nexport default Component\n`,
        "default.tsx": starterDemo,
        "demo.tsx": starterDemo,
        "index.css": `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n`,
      };
      initialDeps = [];
    }

    const newComponent: UserComponent = {
      id,
      name,
      description,
      category,
      isBuiltIn: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      files: initialFiles,
      dependencies: initialDeps,
      previewImage,
    };

    const defaultVar = createDefaultVariant(id, initialFiles, initialDeps);

    set((state) => ({
      userComponents: {
        ...state.userComponents,
        [id]: newComponent,
      },
      currentTemplateId: id,
      files: initialFiles,
      dependencies: initialDeps,
      activeTab: "component.tsx",
      compilerError: null,
      recentComponentIds: [
        id,
        ...(state.recentComponentIds || []).filter((cid) => cid !== id),
      ].slice(0, 50),
      variantsByTemplate: {
        ...(state.variantsByTemplate || {}),
        [id]: [defaultVar],
      },
      activeVariantByTemplate: {
        ...(state.activeVariantByTemplate || {}),
        [id]: defaultVar.id,
      },
      selectedCheckpointId: null,
      isCreateComponentDialogOpen: false,
    }));

    return id;
  },

  deleteUserComponent: (id) => {
    const compToDelete = get().userComponents?.[id];
    if (compToDelete?.isBuiltIn || DEFAULT_TEMPLATES.some((t) => t.id === id)) {
      return;
    }

    if (typeof window !== "undefined" && typeof fetch === "function") {
      const slug = compToDelete?.repoSlug || "";
      const token = get().ownerSessionToken;
      void removeCachedComponentPreview(id);
      fetch(
        `/api/repo-sync?id=${encodeURIComponent(id)}&slug=${encodeURIComponent(slug)}`,
        {
          method: "DELETE",
          credentials: "same-origin",
          headers: {
            "X-Studio-Client": "component-studio",
            ...(token ? { "X-Studio-Owner-Token": token } : {}),
          },
        }
      ).catch(() => {});
    }

    set((state) => {
      const nextUserComponents = { ...state.userComponents };
      delete nextUserComponents[id];

      const nextRecent = (state.recentComponentIds || [])
        .filter((cid) => cid !== id)
        .slice(0, 50);
      const nextVariants = { ...state.variantsByTemplate };
      delete nextVariants[id];
      const nextActiveVariants = { ...state.activeVariantByTemplate };
      delete nextActiveVariants[id];

      let nextCurrentTemplateId = state.currentTemplateId;
      let nextFiles = state.files;
      let nextDeps = state.dependencies;

      if (state.currentTemplateId === id) {
        const remainingIds = Object.keys(nextUserComponents);
        const fallbackComp =
          remainingIds.length > 0
            ? nextUserComponents[remainingIds[0]]
            : DEFAULT_TEMPLATES[0];
        nextCurrentTemplateId = fallbackComp.id;

        const fallbackVariants = nextVariants[fallbackComp.id] || [];
        const fallbackActiveVarId =
          nextActiveVariants[fallbackComp.id] || fallbackVariants[0]?.id;
        const activeVar = fallbackVariants.find(
          (v) => v.id === fallbackActiveVarId
        );

        if (activeVar) {
          nextFiles = { ...activeVar.files };
          nextDeps = [...activeVar.dependencies];
        } else {
          nextFiles = { ...fallbackComp.files };
          nextDeps = [...fallbackComp.dependencies];
        }
      }

      return {
        userComponents: nextUserComponents,
        recentComponentIds: nextRecent,
        variantsByTemplate: nextVariants,
        activeVariantByTemplate: nextActiveVariants,
        currentTemplateId: nextCurrentTemplateId,
        files: nextFiles,
        dependencies: nextDeps,
        selectedCheckpointId:
          state.currentTemplateId === id ? null : state.selectedCheckpointId,
        compilerError:
          state.currentTemplateId === id ? null : state.compilerError,
        quickPreviewComponentId:
          state.quickPreviewComponentId === id
            ? null
            : state.quickPreviewComponentId,
      };
    });
  },

  duplicateUserComponent: (id, newName) => {
    const state = get();
    const source =
      state.userComponents?.[id] || DEFAULT_TEMPLATES.find((t) => t.id === id);

    if (!source) {
      throw new Error(`Component with ID '${id}' not found`);
    }

    const dupId = `comp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const name = newName?.trim() || `${source.name} Copy`;
    const dupComponent: UserComponent = {
      id: dupId,
      name,
      description: source.description || "",
      category: source.category || "Custom",
      isBuiltIn: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      files: normalizeStudioFiles(source.files),
      dependencies: [...source.dependencies],
      previewImage:
        source.previewImage ||
        DEFAULT_TEMPLATE_PREVIEWS[source.id] ||
        DEFAULT_TEMPLATE_PREVIEWS["blank"],
    };

    const defaultVar = createDefaultVariant(
      dupId,
      dupComponent.files,
      dupComponent.dependencies
    );

    set((s) => ({
      userComponents: {
        ...s.userComponents,
        [dupId]: dupComponent,
      },
      variantsByTemplate: {
        ...(s.variantsByTemplate || {}),
        [dupId]: [defaultVar],
      },
      activeVariantByTemplate: {
        ...(s.activeVariantByTemplate || {}),
        [dupId]: defaultVar.id,
      },
    }));

    return dupId;
  },

  updateComponentPreview: (id, previewImage) => {
    setCachedPreviewSync(id, previewImage);
    void cacheComponentPreview(id, previewImage);
    set((state) => {
      const comp = state.userComponents?.[id];
      if (!comp) return state;
      return {
        repoSyncStatus: "dirty",
        userComponents: {
          ...state.userComponents,
          [id]: {
            ...comp,
            previewImage,
            updatedAt: Date.now(),
          },
        },
      };
    });
  },

  recordComponentVisit: (id) =>
    set((state) => ({
      recentComponentIds: [
        id,
        ...(state.recentComponentIds || []).filter((cid) => cid !== id),
      ].slice(0, 50),
    })),

  setQuickPreviewComponentId: (id) => set({ quickPreviewComponentId: id }),

  setCreateComponentDialogOpen: (open) =>
    set({ isCreateComponentDialogOpen: open }),

  resetCurrentTemplate: () => {
    const {
      currentTemplateId,
      variantsByTemplate,
      activeVariantByTemplate,
      userComponents,
    } = get();
    const builtin = DEFAULT_TEMPLATES.find((t) => t.id === currentTemplateId);
    const template =
      builtin || userComponents?.[currentTemplateId] || DEFAULT_TEMPLATES[0];

    const nextFiles = { ...template.files };
    const nextDeps = [...template.dependencies];
    const sync = syncVariantWithWorking(
      variantsByTemplate,
      activeVariantByTemplate,
      currentTemplateId,
      nextFiles,
      nextDeps
    );

    const updatedUserComponents = userComponents?.[currentTemplateId]
      ? {
          ...userComponents,
          [currentTemplateId]: {
            ...userComponents[currentTemplateId],
            files: { ...template.files },
            dependencies: [...template.dependencies],
            updatedAt: Date.now(),
          },
        }
      : userComponents;

    set({
      files: nextFiles,
      dependencies: nextDeps,
      userComponents: updatedUserComponents,
      compilerError: null,
      ...sync,
    });
  },
});
