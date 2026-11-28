import { syncVariantWithWorking } from "../default-previews";
import type { StudioFiles, StudioSliceCreator, StudioState } from "../types";

export type AiSlice = Pick<
  StudioState,
  | "isAiPanelOpen"
  | "aiPanelWidth"
  | "geminiApiKey"
  | "aiModel"
  | "aiRole"
  | "aiDepthMode"
  | "registryRefMode"
  | "pinnedRegistryRefs"
  | "preserveDesignSkill"
  | "autoApplyAiChanges"
  | "aiChatMessages"
  | "isAiThinking"
  | "setAiPanelOpen"
  | "toggleAiPanel"
  | "setAiPanelWidth"
  | "setGeminiApiKey"
  | "setAiModel"
  | "setAiRole"
  | "setAiDepthMode"
  | "setRegistryRefMode"
  | "togglePinnedRegistryRef"
  | "clearPinnedRegistryRefs"
  | "setPreserveDesignSkill"
  | "togglePreserveDesignSkill"
  | "setAutoApplyAiChanges"
  | "toggleAutoApplyAiChanges"
  | "addAiChatMessage"
  | "deleteAiChatMessage"
  | "markAiMessageApplied"
  | "approveAiMessageChanges"
  | "rejectAiMessageChanges"
  | "revertAiMessageChanges"
  | "clearAiChat"
  | "setAiThinking"
  | "applyAiChanges"
>;

export const createAiSlice: StudioSliceCreator<AiSlice> = (set) => ({
  isAiPanelOpen: false,
  aiPanelWidth: 380,
  geminiApiKey: "",
  aiModel: "gemini-4-hydrogen",
  aiRole: "copilot",
  aiDepthMode: "deep",
  registryRefMode: "auto",
  pinnedRegistryRefs: [],
  preserveDesignSkill: true,
  autoApplyAiChanges: true,
  aiChatMessages: [],
  isAiThinking: false,

  setAiPanelOpen: (open) => set({ isAiPanelOpen: open }),

  toggleAiPanel: () =>
    set((state) => ({ isAiPanelOpen: !state.isAiPanelOpen })),

  setAiPanelWidth: (width) =>
    set({ aiPanelWidth: Math.max(340, Math.min(800, width)) }),

  setGeminiApiKey: (key) => set({ geminiApiKey: key.trim() }),

  setAiModel: (model) => set({ aiModel: model }),

  setAiRole: (role) => set({ aiRole: role }),

  setAiDepthMode: (mode) => set({ aiDepthMode: mode }),

  setRegistryRefMode: (mode) => set({ registryRefMode: mode }),

  togglePinnedRegistryRef: (slug) =>
    set((state) => {
      const clean = slug.trim();
      if (!clean) return state;
      const exists = state.pinnedRegistryRefs.includes(clean);
      if (exists) {
        return {
          pinnedRegistryRefs: state.pinnedRegistryRefs.filter((s) => s !== clean),
        };
      }
      // Cap at 2 pinned visual references to keep multimodal grounding focused and fast
      const next = [...state.pinnedRegistryRefs.slice(-1), clean];
      return { pinnedRegistryRefs: next };
    }),

  clearPinnedRegistryRefs: () => set({ pinnedRegistryRefs: [] }),

  setPreserveDesignSkill: (preserve) => set({ preserveDesignSkill: preserve }),

  togglePreserveDesignSkill: () =>
    set((state) => ({ preserveDesignSkill: !state.preserveDesignSkill })),

  setAutoApplyAiChanges: (enabled) => set({ autoApplyAiChanges: enabled }),

  toggleAutoApplyAiChanges: () =>
    set((state) => ({ autoApplyAiChanges: !state.autoApplyAiChanges })),

  addAiChatMessage: (msg) =>
    set((state) => ({
      aiChatMessages: [
        ...state.aiChatMessages,
        {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          ...msg,
        },
      ],
    })),

  deleteAiChatMessage: (id) =>
    set((state) => ({
      aiChatMessages: state.aiChatMessages.filter((m) => m.id !== id),
    })),

  markAiMessageApplied: (id) =>
    set((state) => ({
      aiChatMessages: state.aiChatMessages.map((m) =>
        m.id === id
          ? { ...m, applied: true, approvalStatus: "approved" }
          : m
      ),
    })),

  approveAiMessageChanges: (id, changedFiles) =>
    set((state) => {
      const targetMsg = state.aiChatMessages.find((m) => m.id === id);
      const targetTemplateId = targetMsg?.templateId || state.currentTemplateId;
      const isCurrentTemplate = targetTemplateId === state.currentTemplateId;
      const baseFiles: StudioFiles = isCurrentTemplate
        ? { ...state.files }
        : {
            ...(state.userComponents?.[targetTemplateId]?.files || state.files),
          };

      const previousSnapshot: Partial<{
        "component.tsx": string;
        "default.tsx": string;
        "demo.tsx": string;
        "index.css": string;
      }> = {};
      const nextFiles: StudioFiles = { ...baseFiles };

      if (
        changedFiles["component.tsx"] !== undefined &&
        changedFiles["component.tsx"] !== null
      ) {
        previousSnapshot["component.tsx"] = baseFiles["component.tsx"];
        nextFiles["component.tsx"] = changedFiles["component.tsx"];
      }
      const nextDemoCode = changedFiles["default.tsx"] ?? changedFiles["demo.tsx"];
      if (nextDemoCode !== undefined && nextDemoCode !== null) {
        const prevDemoCode = baseFiles["default.tsx"] ?? baseFiles["demo.tsx"];
        previousSnapshot["default.tsx"] = prevDemoCode;
        previousSnapshot["demo.tsx"] = prevDemoCode;
        nextFiles["default.tsx"] = nextDemoCode;
        nextFiles["demo.tsx"] = nextDemoCode;
      }
      if (
        changedFiles["index.css"] !== undefined &&
        changedFiles["index.css"] !== null
      ) {
        previousSnapshot["index.css"] = baseFiles["index.css"];
        nextFiles["index.css"] = changedFiles["index.css"];
      }

      const incomingDeps = Array.isArray(targetMsg?.addedDependencies)
        ? targetMsg.addedDependencies.filter(
            (d) => typeof d === "string" && d.trim().length > 0
          )
        : [];
      const baseDeps = isCurrentTemplate
        ? state.dependencies
        : state.userComponents?.[targetTemplateId]?.dependencies ||
          state.dependencies;
      const nextDeps = Array.from(new Set([...baseDeps, ...incomingDeps]));

      const sync = syncVariantWithWorking(
        state.variantsByTemplate,
        state.activeVariantByTemplate,
        targetTemplateId,
        nextFiles,
        nextDeps
      );

      const currentComp = state.userComponents?.[targetTemplateId];
      const updatedUserComponents = currentComp
        ? {
            ...state.userComponents,
            [targetTemplateId]: {
              ...currentComp,
              files: nextFiles,
              dependencies: nextDeps,
              savedInRepo: false,
              updatedAt: Date.now(),
            },
          }
        : state.userComponents;

      return {
        ...(isCurrentTemplate
          ? { files: nextFiles, dependencies: nextDeps }
          : {}),
        userComponents: updatedUserComponents,
        repoSyncStatus: isCurrentTemplate ? "dirty" : state.repoSyncStatus,
        ...sync,
        aiChatMessages: state.aiChatMessages.map((m) =>
          m.id === id
            ? {
                ...m,
                applied: true,
                approvalStatus: "approved",
                previousFiles: m.previousFiles || previousSnapshot,
              }
            : m
        ),
      };
    }),

  rejectAiMessageChanges: (id) =>
    set((state) => ({
      aiChatMessages: state.aiChatMessages.map((m) =>
        m.id === id
          ? { ...m, applied: false, approvalStatus: "rejected" }
          : m
      ),
    })),

  revertAiMessageChanges: (id) =>
    set((state) => {
      const targetMsg = state.aiChatMessages.find((m) => m.id === id);
      if (!targetMsg || !targetMsg.previousFiles) {
        return {
          aiChatMessages: state.aiChatMessages.map((m) =>
            m.id === id
              ? { ...m, applied: false, approvalStatus: "pending" }
              : m
          ),
        };
      }

      const targetTemplateId = targetMsg.templateId || state.currentTemplateId;
      const isCurrentTemplate = targetTemplateId === state.currentTemplateId;
      const baseFiles: StudioFiles = isCurrentTemplate
        ? { ...state.files }
        : {
            ...(state.userComponents?.[targetTemplateId]?.files || state.files),
          };

      const nextFiles: StudioFiles = { ...baseFiles };
      if (targetMsg.previousFiles["component.tsx"] !== undefined) {
        nextFiles["component.tsx"] = targetMsg.previousFiles["component.tsx"];
      }
      const prevDemoCode =
        targetMsg.previousFiles["default.tsx"] ?? targetMsg.previousFiles["demo.tsx"];
      if (prevDemoCode !== undefined) {
        nextFiles["default.tsx"] = prevDemoCode;
        nextFiles["demo.tsx"] = prevDemoCode;
      }
      if (targetMsg.previousFiles["index.css"] !== undefined) {
        nextFiles["index.css"] = targetMsg.previousFiles["index.css"];
      }

      const targetDeps = isCurrentTemplate
        ? state.dependencies
        : state.userComponents?.[targetTemplateId]?.dependencies ||
          state.dependencies;

      const sync = syncVariantWithWorking(
        state.variantsByTemplate,
        state.activeVariantByTemplate,
        targetTemplateId,
        nextFiles,
        targetDeps
      );

      const currentComp = state.userComponents?.[targetTemplateId];
      const updatedUserComponents = currentComp
        ? {
            ...state.userComponents,
            [targetTemplateId]: {
              ...currentComp,
              files: nextFiles,
              savedInRepo: false,
              updatedAt: Date.now(),
            },
          }
        : state.userComponents;

      return {
        ...(isCurrentTemplate ? { files: nextFiles } : {}),
        userComponents: updatedUserComponents,
        repoSyncStatus: isCurrentTemplate ? "dirty" : state.repoSyncStatus,
        ...sync,
        aiChatMessages: state.aiChatMessages.map((m) =>
          m.id === id
            ? { ...m, applied: false, approvalStatus: "pending" }
            : m
        ),
      };
    }),

  clearAiChat: () =>
    set({
      aiChatMessages: [],
    }),

  setAiThinking: (thinking) => set({ isAiThinking: thinking }),

  applyAiChanges: (changedFiles, addedDependencies) =>
    set((state) => {
      const nextFiles: StudioFiles = { ...state.files };
      if (
        changedFiles["component.tsx"] !== undefined &&
        changedFiles["component.tsx"] !== null
      ) {
        nextFiles["component.tsx"] = changedFiles["component.tsx"];
      }
      const nextDemoCode = changedFiles["default.tsx"] ?? changedFiles["demo.tsx"];
      if (nextDemoCode !== undefined && nextDemoCode !== null) {
        nextFiles["default.tsx"] = nextDemoCode;
        nextFiles["demo.tsx"] = nextDemoCode;
      }
      if (
        changedFiles["index.css"] !== undefined &&
        changedFiles["index.css"] !== null
      ) {
        nextFiles["index.css"] = changedFiles["index.css"];
      }
      const cleanDeps = Array.isArray(addedDependencies)
        ? addedDependencies
            .map((d) => (typeof d === "string" ? d.trim() : ""))
            .filter(Boolean)
        : [];
      const nextDeps =
        cleanDeps.length > 0
          ? Array.from(new Set([...state.dependencies, ...cleanDeps]))
          : state.dependencies;

      const sync = syncVariantWithWorking(
        state.variantsByTemplate,
        state.activeVariantByTemplate,
        state.currentTemplateId,
        nextFiles,
        nextDeps
      );
      const currentComp = state.userComponents?.[state.currentTemplateId];
      const updatedUserComponents = currentComp
        ? {
            ...state.userComponents,
            [state.currentTemplateId]: {
              ...currentComp,
              files: nextFiles,
              dependencies: nextDeps,
              savedInRepo: false,
              updatedAt: Date.now(),
            },
          }
        : state.userComponents;

      return {
        files: nextFiles,
        dependencies: nextDeps,
        userComponents: updatedUserComponents,
        repoSyncStatus: "dirty",
        ...sync,
      };
    }),
});
