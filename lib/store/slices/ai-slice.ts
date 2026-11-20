import { syncVariantWithWorking } from "../default-previews";
import type { StudioFiles, StudioSliceCreator, StudioState } from "../types";

export type AiSlice = Pick<
  StudioState,
  | "isAiPanelOpen"
  | "aiPanelWidth"
  | "geminiApiKey"
  | "aiModel"
  | "aiRole"
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
      const previousSnapshot: Partial<{
        "component.tsx": string;
        "default.tsx": string;
        "demo.tsx": string;
        "index.css": string;
      }> = {};
      const nextFiles: StudioFiles = { ...state.files };

      if (
        changedFiles["component.tsx"] !== undefined &&
        changedFiles["component.tsx"] !== null
      ) {
        previousSnapshot["component.tsx"] = state.files["component.tsx"];
        nextFiles["component.tsx"] = changedFiles["component.tsx"];
      }
      const nextDemoCode = changedFiles["default.tsx"] ?? changedFiles["demo.tsx"];
      if (nextDemoCode !== undefined && nextDemoCode !== null) {
        const prevDemoCode = state.files["default.tsx"] ?? state.files["demo.tsx"];
        previousSnapshot["default.tsx"] = prevDemoCode;
        previousSnapshot["demo.tsx"] = prevDemoCode;
        nextFiles["default.tsx"] = nextDemoCode;
        nextFiles["demo.tsx"] = nextDemoCode;
      }
      if (
        changedFiles["index.css"] !== undefined &&
        changedFiles["index.css"] !== null
      ) {
        previousSnapshot["index.css"] = state.files["index.css"];
        nextFiles["index.css"] = changedFiles["index.css"];
      }

      const sync = syncVariantWithWorking(
        state.variantsByTemplate,
        state.activeVariantByTemplate,
        state.currentTemplateId,
        nextFiles,
        state.dependencies
      );

      const currentComp = state.userComponents?.[state.currentTemplateId];
      const updatedUserComponents = currentComp
        ? {
            ...state.userComponents,
            [state.currentTemplateId]: {
              ...currentComp,
              files: nextFiles,
              updatedAt: Date.now(),
            },
          }
        : state.userComponents;

      return {
        files: nextFiles,
        userComponents: updatedUserComponents,
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

      const nextFiles: StudioFiles = { ...state.files };
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

      const sync = syncVariantWithWorking(
        state.variantsByTemplate,
        state.activeVariantByTemplate,
        state.currentTemplateId,
        nextFiles,
        state.dependencies
      );

      const currentComp = state.userComponents?.[state.currentTemplateId];
      const updatedUserComponents = currentComp
        ? {
            ...state.userComponents,
            [state.currentTemplateId]: {
              ...currentComp,
              files: nextFiles,
              updatedAt: Date.now(),
            },
          }
        : state.userComponents;

      return {
        files: nextFiles,
        userComponents: updatedUserComponents,
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

  applyAiChanges: (changedFiles) =>
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
      const sync = syncVariantWithWorking(
        state.variantsByTemplate,
        state.activeVariantByTemplate,
        state.currentTemplateId,
        nextFiles,
        state.dependencies
      );
      const currentComp = state.userComponents?.[state.currentTemplateId];
      const updatedUserComponents = currentComp
        ? {
            ...state.userComponents,
            [state.currentTemplateId]: {
              ...currentComp,
              files: nextFiles,
              updatedAt: Date.now(),
            },
          }
        : state.userComponents;

      return {
        files: nextFiles,
        userComponents: updatedUserComponents,
        repoSyncStatus: "dirty",
        ...sync,
      };
    }),
});
