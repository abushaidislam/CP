import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_TEMPLATES } from "@/lib/sandbox/default-templates";
import { syncVariantWithWorking } from "./default-previews";
import { resilientStudioStorage, studioPersistMerge } from "./storage";
import { createVersionControlSlice } from "./slices/version-control-slice";
import { createAiSlice } from "./slices/ai-slice";
import { createComponentRegistrySlice } from "./slices/component-registry-slice";
import { createRepoSyncSlice } from "./slices/repo-sync-slice";
import type { StudioFiles, StudioState, TerminalLogEntry } from "./types";

export * from "./types";
export * from "./default-previews";
export { studioPersistMerge } from "./storage";

const initialTemplate = DEFAULT_TEMPLATES[0];

function applyDependencyUpdate(state: StudioState, nextDeps: string[]) {
  const sync = syncVariantWithWorking(
    state.variantsByTemplate,
    state.activeVariantByTemplate,
    state.currentTemplateId,
    state.files,
    nextDeps
  );
  const currentComp = state.userComponents?.[state.currentTemplateId];
  const updatedUserComponents = currentComp
    ? {
        ...state.userComponents,
        [state.currentTemplateId]: {
          ...currentComp,
          dependencies: nextDeps,
          savedInRepo: false,
          updatedAt: Date.now(),
        },
      }
    : state.userComponents;

  return {
    dependencies: nextDeps,
    userComponents: updatedUserComponents,
    repoSyncStatus: "dirty" as const,
    ...sync,
  };
}

export const useStudioStore = create<StudioState>()(
  persist(
    (set, get, api) => ({
      // Composed Domain Slices
      ...createComponentRegistrySlice(set, get, api),
      ...createVersionControlSlice(set, get, api),
      ...createAiSlice(set, get, api),
      ...createRepoSyncSlice(set, get, api),

      // Editor, Canvas & Workspace State
      files: {
        "component.tsx": initialTemplate.files["component.tsx"],
        "default.tsx":
          initialTemplate.files["default.tsx"] ||
          initialTemplate.files["demo.tsx"] ||
          "",
        "demo.tsx":
          initialTemplate.files["demo.tsx"] ||
          initialTemplate.files["default.tsx"] ||
          "",
        "index.css": initialTemplate.files["index.css"],
      },
      activeTab: "component.tsx",
      layoutMode: "split",
      viewport: "desktop",
      customViewportWidth: 1200,
      canvasBg: "dark",
      appTheme: "dark",
      previewTheme: "dark",
      zoom: 100,
      dependencies: initialTemplate.dependencies,

      recordingConfig: {
        mode: "autopilot",
        duration: 8,
        fps: 60,
        format: "mp4",
        simulateHover: true,
        resolution: "1080p",
        autoHover: true,
        autoClick: true,
        autoScroll: true,
        loopReturnToTop: true,
        showCursor: true,
        clickRipples: true,
        autoZoom: false,
        zoomIntensity: 1,
        countdown: true,
        captureEngine: "auto",
      },

      isCompiling: false,
      compilerError: null,
      currentTemplateId: initialTemplate.id,
      isRecordingModalOpen: false,
      isPublishModalOpen: false,
      isDependencyModalOpen: false,
      isSecurityModalOpen: false,
      isOwnerAuthenticated: true,
      ownerSessionToken: null,
      securityTelemetry: null,

      terminalLogs: [
        {
          id: "sys-init",
          type: "system",
          message:
            "Terminal & Console active. Ready for live output and commands.",
          timestamp: "12:00:00 AM",
          count: 1,
        },
      ],
      isTerminalOpen: false,
      terminalHeight: 220,
      terminalFilter: "all",

      // Editor & Canvas Actions
      updateFile: (name, content) =>
        set((state) => {
          const nextFiles: StudioFiles = {
            ...state.files,
            [name]: content,
          };
          if (name === "default.tsx") {
            nextFiles["demo.tsx"] = content;
          } else if (name === "demo.tsx") {
            nextFiles["default.tsx"] = content;
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
                  savedInRepo: false,
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

      setActiveTab: (tab) => set({ activeTab: tab }),
      setLayoutMode: (mode) => set({ layoutMode: mode }),

      setViewport: (viewport) => {
        let width = 1200;
        if (viewport === "tablet") width = 768;
        if (viewport === "mobile") width = 375;
        if (viewport === "responsive") width = 0;
        set({ viewport, customViewportWidth: width });
      },

      setCustomViewportWidth: (width) => set({ customViewportWidth: width }),
      setCanvasBg: (bg) => set({ canvasBg: bg }),
      setAppTheme: (theme) => set({ appTheme: theme }),

      toggleAppTheme: () =>
        set((state) => ({
          appTheme: state.appTheme === "dark" ? "light" : "dark",
        })),

      setPreviewTheme: (theme) => set({ previewTheme: theme }),

      togglePreviewTheme: () =>
        set((state) => ({
          previewTheme: state.previewTheme === "dark" ? "light" : "dark",
        })),

      setZoom: (zoom) => set({ zoom }),

      // Dependency Actions
      toggleDependency: (pkg) =>
        set((state) => {
          const exists = state.dependencies.includes(pkg);
          const nextDeps = exists
            ? state.dependencies.filter((d) => d !== pkg)
            : [...state.dependencies, pkg];
          return applyDependencyUpdate(state, nextDeps);
        }),

      addDependency: (pkg) =>
        set((state) => {
          const clean = pkg.trim();
          if (!clean || state.dependencies.includes(clean)) return state;
          return applyDependencyUpdate(state, [...state.dependencies, clean]);
        }),

      addDependencies: (pkgs) =>
        set((state) => {
          const newPkgs = pkgs
            .map((p) => p.trim())
            .filter((p) => p && !state.dependencies.includes(p));
          if (newPkgs.length === 0) return state;
          return applyDependencyUpdate(state, [...state.dependencies, ...newPkgs]);
        }),

      removeDependency: (pkg) =>
        set((state) =>
          applyDependencyUpdate(
            state,
            state.dependencies.filter((d) => d !== pkg)
          )
        ),

      syncDependenciesWithCode: (codeImports) =>
        set((state) => {
          const toAdd = codeImports.filter(
            (imp) => !state.dependencies.includes(imp)
          );
          if (toAdd.length === 0) return state;
          return applyDependencyUpdate(state, [...state.dependencies, ...toAdd]);
        }),

      pruneUnusedDependencies: (codeImports) =>
        set((state) =>
          applyDependencyUpdate(
            state,
            state.dependencies.filter((dep) => codeImports.includes(dep))
          )
        ),

      clearAllDependencies: () =>
        set((state) => applyDependencyUpdate(state, [])),

      // Recording, Compiler & Security Modal Actions
      setRecordingConfig: (config) =>
        set((state) => ({
          recordingConfig: {
            ...state.recordingConfig,
            ...config,
          },
        })),

      setCompilerState: (isCompiling, error = null) =>
        set({ isCompiling, compilerError: error }),

      setRecordingModalOpen: (open) => set({ isRecordingModalOpen: open }),
      setPublishModalOpen: (open) =>
        set({ isPublishModalOpen: open, isRepoSyncModalOpen: open }),
      setDependencyModalOpen: (open) => set({ isDependencyModalOpen: open }),
      setSecurityModalOpen: (open) => set({ isSecurityModalOpen: open }),
      setOwnerAuthenticated: (authenticated) =>
        set({ isOwnerAuthenticated: authenticated }),
      setOwnerSessionToken: (token) => set({ ownerSessionToken: token }),
      setSecurityTelemetry: (telemetry) =>
        set((state) => ({
          securityTelemetry: telemetry,
          isOwnerAuthenticated: Boolean(telemetry?.authenticated),
          ownerSessionToken: !telemetry?.authenticated
            ? null
            : telemetry.sessionToken !== undefined
            ? telemetry.sessionToken
            : state.ownerSessionToken,
        })),

      // Terminal Actions
      addTerminalLog: ({ type, message }) =>
        set((state) => {
          const logs = state.terminalLogs;
          const lastLog = logs[logs.length - 1];
          const time = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

          // Group repeated identical logs
          if (lastLog && lastLog.type === type && lastLog.message === message) {
            const updated = [...logs];
            updated[updated.length - 1] = {
              ...lastLog,
              count: lastLog.count + 1,
              timestamp: time,
            };
            return { terminalLogs: updated };
          }

          const newEntry: TerminalLogEntry = {
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            type,
            message,
            timestamp: time,
            count: 1,
          };

          // Limit logs to last 300 entries to prevent memory buildup
          const trimmed =
            logs.length >= 300 ? logs.slice(logs.length - 299) : logs;
          return { terminalLogs: [...trimmed, newEntry] };
        }),

      clearTerminalLogs: () => set({ terminalLogs: [] }),
      setTerminalOpen: (open) => set({ isTerminalOpen: open }),
      toggleTerminal: () =>
        set((state) => ({ isTerminalOpen: !state.isTerminalOpen })),
      setTerminalHeight: (height) =>
        set({ terminalHeight: Math.max(120, Math.min(600, height)) }),
      setTerminalFilter: (filter) => set({ terminalFilter: filter }),
    }),
    {
      name: "21st-component-studio-storage-v3",
      storage: createJSONStorage(() => resilientStudioStorage),
      partialize: (state) => ({
        files: state.files,
        activeTab: state.activeTab,
        layoutMode: state.layoutMode,
        viewport: state.viewport,
        canvasBg: state.canvasBg,
        appTheme: state.appTheme,
        previewTheme: state.previewTheme,
        zoom: state.zoom,
        dependencies: state.dependencies,
        recordingConfig: state.recordingConfig,
        currentTemplateId: state.currentTemplateId,
        isTerminalOpen: state.isTerminalOpen,
        terminalHeight: state.terminalHeight,
        terminalFilter: state.terminalFilter,
        isAiPanelOpen: state.isAiPanelOpen,
        aiPanelWidth: state.aiPanelWidth,
        aiModel: state.aiModel,
        aiRole: state.aiRole,
        aiDepthMode: state.aiDepthMode,
        registryRefMode: state.registryRefMode,
        preserveDesignSkill: state.preserveDesignSkill,
        autoApplyAiChanges: state.autoApplyAiChanges,
        variantsByTemplate: state.variantsByTemplate,
        activeVariantByTemplate: state.activeVariantByTemplate,
        userComponents: state.userComponents,
        deletedBuiltInIds: state.deletedBuiltInIds,
        recentComponentIds: state.recentComponentIds,
        autoSaveToRepo: state.autoSaveToRepo,
        // Never persist GitHub Personal Access Tokens or session secrets to localStorage
        githubRepoConfig: {
          repo: state.githubRepoConfig?.repo || "",
          branch: state.githubRepoConfig?.branch || "main",
          token: "",
        },
      }),
      merge: studioPersistMerge,
    }
  )
);
