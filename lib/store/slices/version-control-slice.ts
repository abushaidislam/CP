import { DEFAULT_TEMPLATES } from "@/lib/sandbox/default-templates";
import { createDefaultVariant, normalizeStudioFiles } from "../default-previews";
import type {
  ComponentCheckpoint,
  ComponentVariant,
  StudioSliceCreator,
  StudioState,
} from "../types";

export type VersionControlSlice = Pick<
  StudioState,
  | "variantsByTemplate"
  | "activeVariantByTemplate"
  | "isHistorySheetOpen"
  | "selectedCheckpointId"
  | "isCreateVariantDialogOpen"
  | "isSaveCheckpointDialogOpen"
  | "createVariant"
  | "switchVariant"
  | "deleteVariant"
  | "renameVariant"
  | "saveCheckpoint"
  | "restoreCheckpoint"
  | "forkCheckpointToNewVariant"
  | "deleteCheckpoint"
  | "setHistorySheetOpen"
  | "setSelectedCheckpointId"
  | "setCreateVariantDialogOpen"
  | "setSaveCheckpointDialogOpen"
>;

export const createVersionControlSlice: StudioSliceCreator<VersionControlSlice> = (
  set
) => ({
  variantsByTemplate: DEFAULT_TEMPLATES.reduce<Record<string, ComponentVariant[]>>(
    (acc, tmpl) => {
      acc[tmpl.id] = [createDefaultVariant(tmpl.id, tmpl.files, tmpl.dependencies)];
      return acc;
    },
    {}
  ),
  activeVariantByTemplate: DEFAULT_TEMPLATES.reduce<Record<string, string>>(
    (acc, tmpl) => {
      acc[tmpl.id] = `var-default-${tmpl.id}`;
      return acc;
    },
    {}
  ),

  isHistorySheetOpen: false,
  selectedCheckpointId: null,
  isCreateVariantDialogOpen: false,
  isSaveCheckpointDialogOpen: false,

  createVariant: (name, copyFromActive = true) =>
    set((state) => {
      const templateId = state.currentTemplateId;
      const currentVariants = state.variantsByTemplate?.[templateId]
        ? [...state.variantsByTemplate[templateId]]
        : [];

      if (currentVariants.length === 0) {
        const defVar = createDefaultVariant(
          templateId,
          state.files,
          state.dependencies
        );
        currentVariants.push(defVar);
      }

      let sourceFiles: StudioState["files"];
      let sourceDeps: string[];

      if (copyFromActive !== false) {
        sourceFiles = { ...state.files };
        sourceDeps = [...state.dependencies];
      } else {
        const tmpl =
          DEFAULT_TEMPLATES.find((t) => t.id === templateId) ||
          state.userComponents?.[templateId] ||
          DEFAULT_TEMPLATES[0];
        sourceFiles = { ...tmpl.files };
        sourceDeps = [...tmpl.dependencies];
      }

      const trimmedName = name.trim() || "Untitled Variant";
      const normalizedVariantFiles = normalizeStudioFiles(sourceFiles);
      const newVariant: ComponentVariant = {
        id: `var-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: trimmedName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        files: normalizedVariantFiles,
        dependencies: [...sourceDeps],
        checkpoints: [],
      };

      const updatedVariants = [...currentVariants, newVariant];
      const existingComp = state.userComponents?.[templateId];

      return {
        files: { ...newVariant.files },
        dependencies: [...newVariant.dependencies],
        userComponents: existingComp
          ? {
              ...state.userComponents,
              [templateId]: {
                ...existingComp,
                files: { ...newVariant.files },
                dependencies: [...newVariant.dependencies],
                updatedAt: Date.now(),
              },
            }
          : state.userComponents,
        variantsByTemplate: {
          ...(state.variantsByTemplate || {}),
          [templateId]: updatedVariants,
        },
        activeVariantByTemplate: {
          ...(state.activeVariantByTemplate || {}),
          [templateId]: newVariant.id,
        },
        selectedCheckpointId: null,
      };
    }),

  switchVariant: (variantId) =>
    set((state) => {
      const templateId = state.currentTemplateId;
      const variants = state.variantsByTemplate?.[templateId] || [];
      const targetVariant = variants.find((v) => v.id === variantId);
      if (!targetVariant) return state;

      const normalizedFiles = normalizeStudioFiles(targetVariant.files);
      const existingComp = state.userComponents?.[templateId];

      return {
        files: normalizedFiles,
        dependencies: [...targetVariant.dependencies],
        compilerError: null,
        userComponents: existingComp
          ? {
              ...state.userComponents,
              [templateId]: {
                ...existingComp,
                files: normalizedFiles,
                dependencies: [...targetVariant.dependencies],
                updatedAt: Date.now(),
              },
            }
          : state.userComponents,
        activeVariantByTemplate: {
          ...(state.activeVariantByTemplate || {}),
          [templateId]: targetVariant.id,
        },
        selectedCheckpointId: null,
      };
    }),

  deleteVariant: (variantId) =>
    set((state) => {
      const templateId = state.currentTemplateId;
      const variants = state.variantsByTemplate?.[templateId] || [];
      if (variants.length <= 1) return state;
      const targetVariant = variants.find((v) => v.id === variantId);
      if (
        !targetVariant ||
        targetVariant.id.startsWith("var-default-") ||
        targetVariant.name === "Default"
      ) {
        return state;
      }

      const updatedVariants = variants.filter((v) => v.id !== variantId);
      let activeId = state.activeVariantByTemplate?.[templateId];
      let nextFiles = state.files;
      let nextDeps = state.dependencies;

      if (activeId === variantId) {
        const fallback = updatedVariants[0];
        activeId = fallback.id;
        nextFiles = normalizeStudioFiles(fallback.files);
        nextDeps = [...fallback.dependencies];
      }

      const existingComp = state.userComponents?.[templateId];

      return {
        files: nextFiles,
        dependencies: nextDeps,
        userComponents: existingComp
          ? {
              ...state.userComponents,
              [templateId]: {
                ...existingComp,
                files: nextFiles,
                dependencies: nextDeps,
                updatedAt: Date.now(),
              },
            }
          : state.userComponents,
        variantsByTemplate: {
          ...(state.variantsByTemplate || {}),
          [templateId]: updatedVariants,
        },
        activeVariantByTemplate: {
          ...(state.activeVariantByTemplate || {}),
          [templateId]: activeId,
        },
        selectedCheckpointId: null,
      };
    }),

  renameVariant: (variantId, newName) =>
    set((state) => {
      const templateId = state.currentTemplateId;
      const trimmed = newName.trim();
      if (!trimmed) return state;
      const variants = state.variantsByTemplate?.[templateId] || [];

      return {
        variantsByTemplate: {
          ...(state.variantsByTemplate || {}),
          [templateId]: variants.map((v) =>
            v.id === variantId
              ? { ...v, name: trimmed, updatedAt: Date.now() }
              : v
          ),
        },
      };
    }),

  saveCheckpoint: (name, description) =>
    set((state) => {
      const templateId = state.currentTemplateId;
      let variants = state.variantsByTemplate?.[templateId]
        ? [...state.variantsByTemplate[templateId]]
        : [];
      let activeId = state.activeVariantByTemplate?.[templateId];

      if (variants.length === 0) {
        const defVar = createDefaultVariant(
          templateId,
          state.files,
          state.dependencies
        );
        variants = [defVar];
        activeId = defVar.id;
      } else if (!activeId || !variants.some((v) => v.id === activeId)) {
        activeId = variants[0].id;
      }

      const now = new Date();
      const trimmedName = name.trim() || "Checkpoint";
      const newCheckpoint: ComponentCheckpoint = {
        id: `cp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: trimmedName,
        description: description?.trim() || undefined,
        timestamp: now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        createdAt: Date.now(),
        files: normalizeStudioFiles(state.files),
        dependencies: [...state.dependencies],
      };

      const updatedVariants = variants.map((v) => {
        if (v.id === activeId) {
          const updatedCheckpoints = [newCheckpoint, ...(v.checkpoints || [])].slice(
            0,
            50
          );
          return {
            ...v,
            files: normalizeStudioFiles(state.files),
            dependencies: [...state.dependencies],
            updatedAt: Date.now(),
            checkpoints: updatedCheckpoints,
          };
        }
        return v;
      });

      return {
        variantsByTemplate: {
          ...(state.variantsByTemplate || {}),
          [templateId]: updatedVariants,
        },
        activeVariantByTemplate: {
          ...(state.activeVariantByTemplate || {}),
          [templateId]: activeId,
        },
      };
    }),

  restoreCheckpoint: (checkpointId) =>
    set((state) => {
      const templateId = state.currentTemplateId;
      const variants = state.variantsByTemplate?.[templateId] || [];
      const activeId = state.activeVariantByTemplate?.[templateId];
      const activeVar = variants.find((v) => v.id === activeId);
      if (!activeVar) return state;

      const targetCheckpoint = (activeVar.checkpoints || []).find(
        (cp) => cp.id === checkpointId
      );
      if (!targetCheckpoint) return state;

      const restoredFiles = normalizeStudioFiles(targetCheckpoint.files);
      const restoredDeps = [...targetCheckpoint.dependencies];

      const updatedVariants = variants.map((v) =>
        v.id === activeId
          ? {
              ...v,
              files: restoredFiles,
              dependencies: restoredDeps,
              updatedAt: Date.now(),
            }
          : v
      );

      const existingComp = state.userComponents?.[templateId];

      return {
        files: restoredFiles,
        dependencies: restoredDeps,
        compilerError: null,
        userComponents: existingComp
          ? {
              ...state.userComponents,
              [templateId]: {
                ...existingComp,
                files: restoredFiles,
                dependencies: restoredDeps,
                updatedAt: Date.now(),
              },
            }
          : state.userComponents,
        variantsByTemplate: {
          ...(state.variantsByTemplate || {}),
          [templateId]: updatedVariants,
        },
        selectedCheckpointId: checkpointId,
      };
    }),

  forkCheckpointToNewVariant: (checkpointId, newVariantName) =>
    set((state) => {
      const templateId = state.currentTemplateId;
      const variants = state.variantsByTemplate?.[templateId] || [];
      const activeId = state.activeVariantByTemplate?.[templateId];
      const activeVar = variants.find((v) => v.id === activeId);

      let targetCheckpoint = (activeVar?.checkpoints || []).find(
        (cp) => cp.id === checkpointId
      );
      if (!targetCheckpoint) {
        for (const v of variants) {
          const found = (v.checkpoints || []).find((cp) => cp.id === checkpointId);
          if (found) {
            targetCheckpoint = found;
            break;
          }
        }
      }
      if (!targetCheckpoint) return state;

      const trimmedName =
        newVariantName.trim() || `Fork of ${targetCheckpoint.name}`;
      const forkedFiles = normalizeStudioFiles(targetCheckpoint.files);
      const newVariant: ComponentVariant = {
        id: `var-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: trimmedName,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        files: forkedFiles,
        dependencies: [...targetCheckpoint.dependencies],
        checkpoints: [],
      };

      const updatedVariants = [...variants, newVariant];
      const existingComp = state.userComponents?.[templateId];

      return {
        files: { ...newVariant.files },
        dependencies: [...newVariant.dependencies],
        compilerError: null,
        userComponents: existingComp
          ? {
              ...state.userComponents,
              [templateId]: {
                ...existingComp,
                files: { ...newVariant.files },
                dependencies: [...newVariant.dependencies],
                updatedAt: Date.now(),
              },
            }
          : state.userComponents,
        variantsByTemplate: {
          ...(state.variantsByTemplate || {}),
          [templateId]: updatedVariants,
        },
        activeVariantByTemplate: {
          ...(state.activeVariantByTemplate || {}),
          [templateId]: newVariant.id,
        },
        selectedCheckpointId: null,
      };
    }),

  deleteCheckpoint: (checkpointId) =>
    set((state) => {
      const templateId = state.currentTemplateId;
      const variants = state.variantsByTemplate?.[templateId] || [];
      const activeId = state.activeVariantByTemplate?.[templateId];

      const updatedVariants = variants.map((v) => {
        if (v.id === activeId) {
          return {
            ...v,
            checkpoints: (v.checkpoints || []).filter(
              (cp) => cp.id !== checkpointId
            ),
            updatedAt: Date.now(),
          };
        }
        return v;
      });

      return {
        variantsByTemplate: {
          ...(state.variantsByTemplate || {}),
          [templateId]: updatedVariants,
        },
        selectedCheckpointId:
          state.selectedCheckpointId === checkpointId
            ? null
            : state.selectedCheckpointId,
      };
    }),

  setHistorySheetOpen: (open) => set({ isHistorySheetOpen: open }),
  setSelectedCheckpointId: (id) => set({ selectedCheckpointId: id }),
  setCreateVariantDialogOpen: (open) => set({ isCreateVariantDialogOpen: open }),
  setSaveCheckpointDialogOpen: (open) =>
    set({ isSaveCheckpointDialogOpen: open }),
});
