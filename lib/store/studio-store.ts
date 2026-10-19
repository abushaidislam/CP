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

export interface ComponentCheckpoint {
  id: string;
  name: string;
  description?: string;
  timestamp: string;
  createdAt: number;
  files: {
    "component.tsx": string;
    "demo.tsx": string;
    "index.css": string;
  };
  dependencies: string[];
}

export interface ComponentVariant {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  files: {
    "component.tsx": string;
    "demo.tsx": string;
    "index.css": string;
  };
  dependencies: string[];
  checkpoints: ComponentCheckpoint[];
}

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

  // Version Control
  variantsByTemplate: Record<string, ComponentVariant[]>;
  activeVariantByTemplate: Record<string, string>;
  isHistorySheetOpen: boolean;
  selectedCheckpointId: string | null;
  isCreateVariantDialogOpen: boolean;
  isSaveCheckpointDialogOpen: boolean;

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

  // Version Control Actions
  createVariant: (name: string, copyFromActive?: boolean) => void;
  switchVariant: (variantId: string) => void;
  deleteVariant: (variantId: string) => void;
  renameVariant: (variantId: string, newName: string) => void;
  saveCheckpoint: (name: string, description?: string) => void;
  restoreCheckpoint: (checkpointId: string) => void;
  forkCheckpointToNewVariant: (checkpointId: string, newVariantName: string) => void;
  deleteCheckpoint: (checkpointId: string) => void;
  setHistorySheetOpen: (open: boolean) => void;
  setSelectedCheckpointId: (id: string | null) => void;
  setCreateVariantDialogOpen: (open: boolean) => void;
  setSaveCheckpointDialogOpen: (open: boolean) => void;

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

const createDefaultVariant = (
  templateId: string,
  files: StudioState["files"],
  dependencies: string[]
): ComponentVariant => ({
  id: `var-default-${templateId}`,
  name: "Default",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  files: {
    "component.tsx": files["component.tsx"],
    "demo.tsx": files["demo.tsx"],
    "index.css": files["index.css"],
  },
  dependencies: [...dependencies],
  checkpoints: [],
});

function syncVariantWithWorking(
  variantsByTemplate: Record<string, ComponentVariant[]> | undefined,
  activeVariantByTemplate: Record<string, string> | undefined,
  templateId: string,
  files: StudioState["files"],
  dependencies: string[]
): {
  variantsByTemplate: Record<string, ComponentVariant[]>;
  activeVariantByTemplate: Record<string, string>;
} {
  const currentVariants = variantsByTemplate?.[templateId] ? [...variantsByTemplate[templateId]] : [];
  let activeId = activeVariantByTemplate?.[templateId];

  let updatedVariants: ComponentVariant[];
  if (currentVariants.length === 0) {
    const defVar = createDefaultVariant(templateId, files, dependencies);
    activeId = defVar.id;
    updatedVariants = [defVar];
  } else {
    if (!activeId || !currentVariants.some((v) => v.id === activeId)) {
      activeId = currentVariants[0].id;
    }
    updatedVariants = currentVariants.map((v) =>
      v.id === activeId
        ? {
            ...v,
            files: { ...files },
            dependencies: [...dependencies],
            updatedAt: Date.now(),
          }
        : v
    );
  }

  return {
    variantsByTemplate: {
      ...(variantsByTemplate || {}),
      [templateId]: updatedVariants,
    },
    activeVariantByTemplate: {
      ...(activeVariantByTemplate || {}),
      [templateId]: activeId,
    },
  };
}

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

      // Version Control
      variantsByTemplate: {
        [initialTemplate.id]: [
          createDefaultVariant(initialTemplate.id, initialTemplate.files, initialTemplate.dependencies),
        ],
      },
      activeVariantByTemplate: {
        [initialTemplate.id]: `var-default-${initialTemplate.id}`,
      },
      isHistorySheetOpen: false,
      selectedCheckpointId: null,
      isCreateVariantDialogOpen: false,
      isSaveCheckpointDialogOpen: false,

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
        set((state) => {
          const nextFiles = {
            ...state.files,
            [name]: content,
          };
          const sync = syncVariantWithWorking(
            state.variantsByTemplate,
            state.activeVariantByTemplate,
            state.currentTemplateId,
            nextFiles,
            state.dependencies
          );
          return {
            files: nextFiles,
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

      setPreviewTheme: (theme) => set({ previewTheme: theme }),

      togglePreviewTheme: () =>
        set((state) => ({
          previewTheme: state.previewTheme === "dark" ? "light" : "dark",
        })),

      setZoom: (zoom) => set({ zoom }),

      toggleDependency: (pkg) =>
        set((state) => {
          const exists = state.dependencies.includes(pkg);
          const nextDeps = exists
            ? state.dependencies.filter((d) => d !== pkg)
            : [...state.dependencies, pkg];
          const sync = syncVariantWithWorking(
            state.variantsByTemplate,
            state.activeVariantByTemplate,
            state.currentTemplateId,
            state.files,
            nextDeps
          );
          return {
            dependencies: nextDeps,
            ...sync,
          };
        }),

      addDependency: (pkg) =>
        set((state) => {
          const clean = pkg.trim();
          if (!clean || state.dependencies.includes(clean)) return state;
          const nextDeps = [...state.dependencies, clean];
          const sync = syncVariantWithWorking(
            state.variantsByTemplate,
            state.activeVariantByTemplate,
            state.currentTemplateId,
            state.files,
            nextDeps
          );
          return {
            dependencies: nextDeps,
            ...sync,
          };
        }),

      addDependencies: (pkgs) =>
        set((state) => {
          const newPkgs = pkgs
            .map((p) => p.trim())
            .filter((p) => p && !state.dependencies.includes(p));
          if (newPkgs.length === 0) return state;
          const nextDeps = [...state.dependencies, ...newPkgs];
          const sync = syncVariantWithWorking(
            state.variantsByTemplate,
            state.activeVariantByTemplate,
            state.currentTemplateId,
            state.files,
            nextDeps
          );
          return {
            dependencies: nextDeps,
            ...sync,
          };
        }),

      removeDependency: (pkg) =>
        set((state) => {
          const nextDeps = state.dependencies.filter((d) => d !== pkg);
          const sync = syncVariantWithWorking(
            state.variantsByTemplate,
            state.activeVariantByTemplate,
            state.currentTemplateId,
            state.files,
            nextDeps
          );
          return {
            dependencies: nextDeps,
            ...sync,
          };
        }),

      syncDependenciesWithCode: (codeImports) =>
        set((state) => {
          const toAdd = codeImports.filter(
            (imp) => !state.dependencies.includes(imp)
          );
          if (toAdd.length === 0) return state;
          const nextDeps = [...state.dependencies, ...toAdd];
          const sync = syncVariantWithWorking(
            state.variantsByTemplate,
            state.activeVariantByTemplate,
            state.currentTemplateId,
            state.files,
            nextDeps
          );
          return {
            dependencies: nextDeps,
            ...sync,
          };
        }),

      pruneUnusedDependencies: (codeImports) =>
        set((state) => {
          const nextDeps = state.dependencies.filter((dep) =>
            codeImports.includes(dep)
          );
          const sync = syncVariantWithWorking(
            state.variantsByTemplate,
            state.activeVariantByTemplate,
            state.currentTemplateId,
            state.files,
            nextDeps
          );
          return {
            dependencies: nextDeps,
            ...sync,
          };
        }),

      clearAllDependencies: () =>
        set((state) => {
          const sync = syncVariantWithWorking(
            state.variantsByTemplate,
            state.activeVariantByTemplate,
            state.currentTemplateId,
            state.files,
            []
          );
          return {
            dependencies: [],
            ...sync,
          };
        }),

      // Version Control Actions
      createVariant: (name, copyFromActive = true) =>
        set((state) => {
          const templateId = state.currentTemplateId;
          const currentVariants = state.variantsByTemplate?.[templateId]
            ? [...state.variantsByTemplate[templateId]]
            : [];

          if (currentVariants.length === 0) {
            const defVar = createDefaultVariant(templateId, state.files, state.dependencies);
            currentVariants.push(defVar);
          }

          let sourceFiles: StudioState["files"];
          let sourceDeps: string[];

          if (copyFromActive !== false) {
            sourceFiles = { ...state.files };
            sourceDeps = [...state.dependencies];
          } else {
            const tmpl = DEFAULT_TEMPLATES.find((t) => t.id === templateId) || DEFAULT_TEMPLATES[0];
            sourceFiles = { ...tmpl.files };
            sourceDeps = [...tmpl.dependencies];
          }

          const trimmedName = name.trim() || "Untitled Variant";
          const newVariant: ComponentVariant = {
            id: `var-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: trimmedName,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            files: {
              "component.tsx": sourceFiles["component.tsx"],
              "demo.tsx": sourceFiles["demo.tsx"],
              "index.css": sourceFiles["index.css"],
            },
            dependencies: [...sourceDeps],
            checkpoints: [],
          };

          const updatedVariants = [...currentVariants, newVariant];

          return {
            files: { ...newVariant.files },
            dependencies: [...newVariant.dependencies],
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

          return {
            files: { ...targetVariant.files },
            dependencies: [...targetVariant.dependencies],
            compilerError: null,
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
          if (!targetVariant || targetVariant.id.startsWith("var-default-") || targetVariant.name === "Default") return state;

          const updatedVariants = variants.filter((v) => v.id !== variantId);
          let activeId = state.activeVariantByTemplate?.[templateId];
          let nextFiles = state.files;
          let nextDeps = state.dependencies;

          if (activeId === variantId) {
            const fallback = updatedVariants[0];
            activeId = fallback.id;
            nextFiles = { ...fallback.files };
            nextDeps = [...fallback.dependencies];
          }

          return {
            files: nextFiles,
            dependencies: nextDeps,
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
            const defVar = createDefaultVariant(templateId, state.files, state.dependencies);
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
            files: {
              "component.tsx": state.files["component.tsx"],
              "demo.tsx": state.files["demo.tsx"],
              "index.css": state.files["index.css"],
            },
            dependencies: [...state.dependencies],
          };

          const updatedVariants = variants.map((v) => {
            if (v.id === activeId) {
              const updatedCheckpoints = [newCheckpoint, ...(v.checkpoints || [])].slice(0, 50);
              return {
                ...v,
                files: { ...state.files },
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

          const targetCheckpoint = (activeVar.checkpoints || []).find((cp) => cp.id === checkpointId);
          if (!targetCheckpoint) return state;

          const restoredFiles = {
            "component.tsx": targetCheckpoint.files["component.tsx"],
            "demo.tsx": targetCheckpoint.files["demo.tsx"],
            "index.css": targetCheckpoint.files["index.css"],
          };
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

          return {
            files: restoredFiles,
            dependencies: restoredDeps,
            compilerError: null,
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

          let targetCheckpoint = (activeVar?.checkpoints || []).find((cp) => cp.id === checkpointId);
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

          const trimmedName = newVariantName.trim() || `Fork of ${targetCheckpoint.name}`;
          const newVariant: ComponentVariant = {
            id: `var-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: trimmedName,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            files: {
              "component.tsx": targetCheckpoint.files["component.tsx"],
              "demo.tsx": targetCheckpoint.files["demo.tsx"],
              "index.css": targetCheckpoint.files["index.css"],
            },
            dependencies: [...targetCheckpoint.dependencies],
            checkpoints: [],
          };

          const updatedVariants = [...variants, newVariant];

          return {
            files: { ...newVariant.files },
            dependencies: [...newVariant.dependencies],
            compilerError: null,
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
                checkpoints: (v.checkpoints || []).filter((cp) => cp.id !== checkpointId),
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
      setSaveCheckpointDialogOpen: (open) => set({ isSaveCheckpointDialogOpen: open }),

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

        const state = get();
        const existingVariants = state.variantsByTemplate?.[template.id] || [];
        let activeVariantId = state.activeVariantByTemplate?.[template.id];
        let nextVariants = existingVariants;
        let filesToLoad = template.files;
        let depsToLoad = template.dependencies;

        if (existingVariants.length === 0) {
          const defaultVar = createDefaultVariant(template.id, template.files, template.dependencies);
          nextVariants = [defaultVar];
          activeVariantId = defaultVar.id;
          filesToLoad = { ...defaultVar.files };
          depsToLoad = [...defaultVar.dependencies];
        } else {
          const activeVar = existingVariants.find((v) => v.id === activeVariantId) || existingVariants[0];
          activeVariantId = activeVar.id;
          filesToLoad = { ...activeVar.files };
          depsToLoad = [...activeVar.dependencies];
        }

        set({
          files: filesToLoad,
          dependencies: depsToLoad,
          currentTemplateId: template.id,
          activeTab: "component.tsx",
          compilerError: null,
          variantsByTemplate: {
            ...(state.variantsByTemplate || {}),
            [template.id]: nextVariants,
          },
          activeVariantByTemplate: {
            ...(state.activeVariantByTemplate || {}),
            [template.id]: activeVariantId,
          },
          selectedCheckpointId: null,
        });
      },

      resetCurrentTemplate: () => {
        const { currentTemplateId, variantsByTemplate, activeVariantByTemplate } = get();
        const template =
          DEFAULT_TEMPLATES.find((t) => t.id === currentTemplateId) ||
          DEFAULT_TEMPLATES[0];

        const nextFiles = { ...template.files };
        const nextDeps = [...template.dependencies];
        const sync = syncVariantWithWorking(
          variantsByTemplate,
          activeVariantByTemplate,
          currentTemplateId,
          nextFiles,
          nextDeps
        );

        set({
          files: nextFiles,
          dependencies: nextDeps,
          compilerError: null,
          ...sync,
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

          const sync = syncVariantWithWorking(
            state.variantsByTemplate,
            state.activeVariantByTemplate,
            state.currentTemplateId,
            nextFiles,
            state.dependencies
          );

          return {
            files: nextFiles,
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

          const sync = syncVariantWithWorking(
            state.variantsByTemplate,
            state.activeVariantByTemplate,
            state.currentTemplateId,
            nextFiles,
            state.dependencies
          );

          return {
            files: nextFiles,
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
          const sync = syncVariantWithWorking(
            state.variantsByTemplate,
            state.activeVariantByTemplate,
            state.currentTemplateId,
            nextFiles,
            state.dependencies
          );
          return {
            files: nextFiles,
            ...sync,
          };
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
        variantsByTemplate: state.variantsByTemplate,
        activeVariantByTemplate: state.activeVariantByTemplate,
      }),
    }
  )
);
