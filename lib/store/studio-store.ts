import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_TEMPLATES } from "@/lib/sandbox/default-templates";

export type StudioFileName = "component.tsx" | "demo.tsx" | "index.css";
export type StudioViewport = "desktop" | "tablet" | "mobile" | "responsive";
export type CanvasBackground = "dark" | "black" | "grid" | "light" | "mesh";
export type PreviewTheme = "dark" | "light";

export type TerminalLogLevel =
  | "log"
  | "info"
  | "warn"
  | "error"
  | "system"
  | "command"
  | "result";

export interface TerminalLogEntry {
  id: string;
  type: TerminalLogLevel;
  message: string;
  timestamp: string;
  count: number;
}

export type TerminalFilter = "all" | "logs" | "warnings" | "errors" | "system";

export interface AiReasoningStepItem {
  title: string;
  description?: string;
  detail?: string;
  status: "done" | "running" | "pending";
}

export interface AiReasoningTrace {
  durationSeconds: number;
  steps: AiReasoningStepItem[];
  summary?: string;
}

export interface AttachedImage {
  id: string;
  name: string;
  dataUrl: string;
  mimeType: string;
  sizeBytes?: number;
}

export interface AttachedCodeSnippet {
  id: string;
  title: string;
  language: string;
  code: string;
}

export interface AiChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  authorRole?: string;
  modelUsed?: string;
  reasoning?: AiReasoningTrace;
  attachments?: {
    images?: AttachedImage[];
    codeSnippets?: AttachedCodeSnippet[];
  };
  changedFiles?: Partial<{
    "component.tsx": string;
    "demo.tsx": string;
    "index.css": string;
  }>;
  previousFiles?: Partial<{
    "component.tsx": string;
    "demo.tsx": string;
    "index.css": string;
  }>;
  applied?: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
}

export interface RecordingConfig {
  duration: 3 | 5 | 8;
  fps: 30 | 60;
  format: "webm" | "mp4";
  simulateHover: boolean;
  resolution: "1080p" | "720p" | "square";
}

export type AiChatRole = "copilot" | "architect" | "designer" | "auditor" | "optimizer";

export interface StudioState {
  // Files
  files: {
    "component.tsx": string;
    "demo.tsx": string;
    "index.css": string;
  };
  activeTab: StudioFileName;

  // Canvas & Preview Controls
  layoutMode: "split" | "editor" | "preview";
  viewport: StudioViewport;
  customViewportWidth: number;
  canvasBg: CanvasBackground;
  previewTheme: PreviewTheme;
  zoom: number;

  // Dependencies
  dependencies: string[];

  // Recording
  recordingConfig: RecordingConfig;

  // Status
  isCompiling: boolean;
  compilerError: string | null;
  currentTemplateId: string;
  isRecordingModalOpen: boolean;
  isPublishModalOpen: boolean;
  isDependencyModalOpen: boolean;

  // Terminal & Console
  terminalLogs: TerminalLogEntry[];
  isTerminalOpen: boolean;
  terminalHeight: number;
  terminalFilter: TerminalFilter;

  // AI Assistant Panel
  isAiPanelOpen: boolean;
  aiPanelWidth: number;
  geminiApiKey: string;
  aiModel: string;
  aiRole: AiChatRole;
  aiChatMessages: AiChatMessage[];
  isAiThinking: boolean;

  // Actions
  updateFile: (name: StudioFileName, content: string) => void;
  setActiveTab: (tab: StudioFileName) => void;
  setLayoutMode: (mode: "split" | "editor" | "preview") => void;
  setViewport: (viewport: StudioViewport) => void;
  setCustomViewportWidth: (width: number) => void;
  setCanvasBg: (bg: CanvasBackground) => void;
  setPreviewTheme: (theme: PreviewTheme) => void;
  togglePreviewTheme: () => void;
  setZoom: (zoom: number) => void;

  toggleDependency: (pkg: string) => void;
  addDependency: (pkg: string) => void;
  addDependencies: (pkgs: string[]) => void;
  removeDependency: (pkg: string) => void;
  syncDependenciesWithCode: (codeImports: string[]) => void;
  pruneUnusedDependencies: (codeImports: string[]) => void;
  clearAllDependencies: () => void;

  setRecordingConfig: (config: Partial<RecordingConfig>) => void;
  loadTemplate: (templateId: string) => void;
  resetCurrentTemplate: () => void;

  setCompilerState: (isCompiling: boolean, error?: string | null) => void;
  setRecordingModalOpen: (open: boolean) => void;
  setPublishModalOpen: (open: boolean) => void;
  setDependencyModalOpen: (open: boolean) => void;

  // Terminal Actions
  addTerminalLog: (entry: { type: TerminalLogLevel; message: string }) => void;
  clearTerminalLogs: () => void;
  setTerminalOpen: (open: boolean) => void;
  toggleTerminal: () => void;
  setTerminalHeight: (height: number) => void;
  setTerminalFilter: (filter: TerminalFilter) => void;

  // AI Actions
  setAiPanelOpen: (open: boolean) => void;
  toggleAiPanel: () => void;
  setAiPanelWidth: (width: number) => void;
  setGeminiApiKey: (key: string) => void;
  setAiModel: (model: string) => void;
  setAiRole: (role: AiChatRole) => void;
  addAiChatMessage: (msg: Omit<AiChatMessage, "id" | "timestamp">) => void;
  markAiMessageApplied: (id: string) => void;
  approveAiMessageChanges: (
    id: string,
    changedFiles: Partial<{
      "component.tsx": string;
      "demo.tsx": string;
      "index.css": string;
    }>
  ) => void;
  rejectAiMessageChanges: (id: string) => void;
  revertAiMessageChanges: (id: string) => void;
  clearAiChat: () => void;
  setAiThinking: (thinking: boolean) => void;
  applyAiChanges: (files: Partial<{
    "component.tsx": string;
    "demo.tsx": string;
    "index.css": string;
  }>) => void;
}

const initialTemplate = DEFAULT_TEMPLATES[0];

export const useStudioStore = create<StudioState>()(
  persist(
    (set, get) => ({
      files: {
        "component.tsx": initialTemplate.files["component.tsx"],
        "demo.tsx": initialTemplate.files["demo.tsx"],
        "index.css": initialTemplate.files["index.css"],
      },
      activeTab: "component.tsx",
      layoutMode: "split",
      viewport: "desktop",
      customViewportWidth: 1200,
      canvasBg: "dark",
      previewTheme: "dark",
      zoom: 100,
      dependencies: initialTemplate.dependencies,

      recordingConfig: {
        duration: 5,
        fps: 60,
        format: "webm",
        simulateHover: true,
        resolution: "1080p",
      },

      isCompiling: false,
      compilerError: null,
      currentTemplateId: initialTemplate.id,
      isRecordingModalOpen: false,
      isPublishModalOpen: false,
      isDependencyModalOpen: false,

      terminalLogs: [
        {
          id: "sys-init",
          type: "system",
          message: "Terminal & Console active. Ready for live output and commands.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          count: 1,
        },
      ],
      isTerminalOpen: false,
      terminalHeight: 220,
      terminalFilter: "all",

      isAiPanelOpen: false,
      aiPanelWidth: 380,
      geminiApiKey: "",
      aiModel: "gemini-3.8-flash",
      aiRole: "copilot",
      aiChatMessages: [],
      isAiThinking: false,

      updateFile: (name, content) =>
        set((state) => ({
          files: {
            ...state.files,
            [name]: content,
          },
        })),

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

      setPreviewTheme: (theme) => set({ previewTheme: theme }),

      togglePreviewTheme: () =>
        set((state) => ({
          previewTheme: state.previewTheme === "dark" ? "light" : "dark",
        })),

      setZoom: (zoom) => set({ zoom }),

      toggleDependency: (pkg) =>
        set((state) => {
          const exists = state.dependencies.includes(pkg);
          return {
            dependencies: exists
              ? state.dependencies.filter((d) => d !== pkg)
              : [...state.dependencies, pkg],
          };
        }),

      addDependency: (pkg) =>
        set((state) => {
          const clean = pkg.trim();
          if (!clean || state.dependencies.includes(clean)) return state;
          return { dependencies: [...state.dependencies, clean] };
        }),

      addDependencies: (pkgs) =>
        set((state) => {
          const newPkgs = pkgs
            .map((p) => p.trim())
            .filter((p) => p && !state.dependencies.includes(p));
          if (newPkgs.length === 0) return state;
          return { dependencies: [...state.dependencies, ...newPkgs] };
        }),

      removeDependency: (pkg) =>
        set((state) => ({
          dependencies: state.dependencies.filter((d) => d !== pkg),
        })),

      syncDependenciesWithCode: (codeImports) =>
        set((state) => {
          const toAdd = codeImports.filter(
            (imp) => !state.dependencies.includes(imp)
          );
          if (toAdd.length === 0) return state;
          return { dependencies: [...state.dependencies, ...toAdd] };
        }),

      pruneUnusedDependencies: (codeImports) =>
        set((state) => ({
          dependencies: state.dependencies.filter((dep) =>
            codeImports.includes(dep)
          ),
        })),

      clearAllDependencies: () => set({ dependencies: [] }),

      setRecordingConfig: (config) =>
        set((state) => ({
          recordingConfig: {
            ...state.recordingConfig,
            ...config,
          },
        })),

      loadTemplate: (templateId) => {
        const template =
          DEFAULT_TEMPLATES.find((t) => t.id === templateId) ||
          DEFAULT_TEMPLATES[0];
        set({
          files: { ...template.files },
          dependencies: [...template.dependencies],
          currentTemplateId: template.id,
          activeTab: "component.tsx",
          compilerError: null,
        });
      },

      resetCurrentTemplate: () => {
        const { currentTemplateId } = get();
        const template =
          DEFAULT_TEMPLATES.find((t) => t.id === currentTemplateId) ||
          DEFAULT_TEMPLATES[0];
        set({
          files: { ...template.files },
          dependencies: [...template.dependencies],
          compilerError: null,
        });
      },

      setCompilerState: (isCompiling, error = null) =>
        set({ isCompiling, compilerError: error }),

      setRecordingModalOpen: (open) => set({ isRecordingModalOpen: open }),
      setPublishModalOpen: (open) => set({ isPublishModalOpen: open }),
      setDependencyModalOpen: (open) => set({ isDependencyModalOpen: open }),

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
          const trimmed = logs.length >= 300 ? logs.slice(logs.length - 299) : logs;
          return { terminalLogs: [...trimmed, newEntry] };
        }),

      clearTerminalLogs: () => set({ terminalLogs: [] }),

      setTerminalOpen: (open) => set({ isTerminalOpen: open }),

      toggleTerminal: () =>
        set((state) => ({ isTerminalOpen: !state.isTerminalOpen })),

      setTerminalHeight: (height) =>
        set({ terminalHeight: Math.max(120, Math.min(600, height)) }),

      setTerminalFilter: (filter) => set({ terminalFilter: filter }),

      // AI Actions
      setAiPanelOpen: (open) => set({ isAiPanelOpen: open }),

      toggleAiPanel: () =>
        set((state) => ({ isAiPanelOpen: !state.isAiPanelOpen })),

      setAiPanelWidth: (width) =>
        set({ aiPanelWidth: Math.max(300, Math.min(700, width)) }),

      setGeminiApiKey: (key) => set({ geminiApiKey: key.trim() }),

      setAiModel: (model) => set({ aiModel: model }),

      setAiRole: (role) => set({ aiRole: role }),

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
            "demo.tsx": string;
            "index.css": string;
          }> = {};
          const nextFiles = { ...state.files };

          if (changedFiles["component.tsx"] !== undefined && changedFiles["component.tsx"] !== null) {
            previousSnapshot["component.tsx"] = state.files["component.tsx"];
            nextFiles["component.tsx"] = changedFiles["component.tsx"];
          }
          if (changedFiles["demo.tsx"] !== undefined && changedFiles["demo.tsx"] !== null) {
            previousSnapshot["demo.tsx"] = state.files["demo.tsx"];
            nextFiles["demo.tsx"] = changedFiles["demo.tsx"];
          }
          if (changedFiles["index.css"] !== undefined && changedFiles["index.css"] !== null) {
            previousSnapshot["index.css"] = state.files["index.css"];
            nextFiles["index.css"] = changedFiles["index.css"];
          }

          return {
            files: nextFiles,
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

          const nextFiles = { ...state.files };
          if (targetMsg.previousFiles["component.tsx"] !== undefined) {
            nextFiles["component.tsx"] = targetMsg.previousFiles["component.tsx"];
          }
          if (targetMsg.previousFiles["demo.tsx"] !== undefined) {
            nextFiles["demo.tsx"] = targetMsg.previousFiles["demo.tsx"];
          }
          if (targetMsg.previousFiles["index.css"] !== undefined) {
            nextFiles["index.css"] = targetMsg.previousFiles["index.css"];
          }

          return {
            files: nextFiles,
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
          const nextFiles = { ...state.files };
          if (changedFiles["component.tsx"] !== undefined && changedFiles["component.tsx"] !== null) {
            nextFiles["component.tsx"] = changedFiles["component.tsx"];
          }
          if (changedFiles["demo.tsx"] !== undefined && changedFiles["demo.tsx"] !== null) {
            nextFiles["demo.tsx"] = changedFiles["demo.tsx"];
          }
          if (changedFiles["index.css"] !== undefined && changedFiles["index.css"] !== null) {
            nextFiles["index.css"] = changedFiles["index.css"];
          }
          return { files: nextFiles };
        }),
    }),
    {
      name: "21st-component-studio-storage-v3",
      partialize: (state) => ({
        files: state.files,
        activeTab: state.activeTab,
        layoutMode: state.layoutMode,
        viewport: state.viewport,
        canvasBg: state.canvasBg,
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
        geminiApiKey: state.geminiApiKey,
        aiModel: state.aiModel,
        aiRole: state.aiRole,
      }),
    }
  )
);
