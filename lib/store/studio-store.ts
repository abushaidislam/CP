import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_TEMPLATES } from "@/lib/sandbox/default-templates";

export type StudioFileName = "component.tsx" | "demo.tsx" | "index.css";
export type StudioViewport = "desktop" | "tablet" | "mobile" | "responsive";
export type CanvasBackground = "dark" | "black" | "grid" | "light" | "mesh";
export type PreviewTheme = "dark" | "light";

export interface RecordingConfig {
  duration: 3 | 5 | 8;
  fps: 30 | 60;
  format: "webm" | "mp4";
  simulateHover: boolean;
  resolution: "1080p" | "720p" | "square";
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

  // Actions
  updateFile: (name: StudioFileName, content: string) => void;
  setActiveTab: (tab: StudioFileName) => void;
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

      updateFile: (name, content) =>
        set((state) => ({
          files: {
            ...state.files,
            [name]: content,
          },
        })),

      setActiveTab: (tab) => set({ activeTab: tab }),

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
    }),
    {
      name: "21st-component-studio-storage-v2",
      partialize: (state) => ({
        files: state.files,
        activeTab: state.activeTab,
        viewport: state.viewport,
        canvasBg: state.canvasBg,
        previewTheme: state.previewTheme,
        zoom: state.zoom,
        dependencies: state.dependencies,
        recordingConfig: state.recordingConfig,
        currentTemplateId: state.currentTemplateId,
      }),
    }
  )
);
