import type { StateCreator } from "zustand";

export type StudioFileName = "component.tsx" | "default.tsx" | "demo.tsx" | "index.css";

export interface StudioFiles {
  "component.tsx": string;
  "default.tsx"?: string;
  "demo.tsx": string;
  "index.css": string;
}

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
  category?: "context" | "ast" | "audit" | "synthesis" | "verify";
  items?: string[];
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
    "default.tsx": string;
    "demo.tsx": string;
    "index.css": string;
  }>;
  previousFiles?: Partial<{
    "component.tsx": string;
    "default.tsx": string;
    "demo.tsx": string;
    "index.css": string;
  }>;
  applied?: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
  followUpSuggestions?: string[];
  addedDependencies?: string[];
  complianceScore?: number;
  isError?: boolean;
}

export interface RecordingConfig {
  mode: "autopilot" | "manual";
  duration: 5 | 8 | 12 | 15;
  fps: 30 | 60;
  format: "mp4" | "webm";
  simulateHover: boolean;
  resolution: "1080p" | "720p";
  autoHover: boolean;
  autoClick: boolean;
  autoScroll: boolean;
  loopReturnToTop: boolean;
  showCursor: boolean;
  clickRipples: boolean;
  autoZoom: boolean;
  zoomIntensity: number;
  countdown: boolean;
  captureEngine: "auto" | "native" | "direct";
}

export type AiChatRole = "copilot" | "architect" | "designer" | "auditor" | "optimizer";

export interface ComponentCheckpoint {
  id: string;
  name: string;
  description?: string;
  timestamp: string;
  createdAt: number;
  files: StudioFiles;
  dependencies: string[];
}

export interface ComponentVariant {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  files: StudioFiles;
  dependencies: string[];
  checkpoints: ComponentCheckpoint[];
}

export interface UserComponent {
  id: string;
  name: string;
  description: string;
  category: string;
  isBuiltIn?: boolean;
  createdAt: number;
  updatedAt: number;
  files: StudioFiles;
  dependencies: string[];
  previewImage?: string;
  repoSlug?: string;
  repoPath?: string;
  savedInRepo?: boolean;
  lastRepoSyncAt?: number;
  lastCommitSha?: string;
  lastCommitUrl?: string;
  filesLoaded?: boolean;
}

export interface RepoSummaryInput {
  id: string;
  repoSlug: string;
  repoPath?: string;
  name: string;
  description: string;
  category: string;
  isBuiltIn?: boolean;
  createdAt: number;
  updatedAt: number;
  lastRepoSyncAt: number;
  dependencies: string[];
  previewImage?: string;
  filesLoaded?: boolean;
}

export type RepoSyncStatus = "idle" | "syncing" | "synced" | "dirty" | "error";

export interface RepoGitInfo {
  isGitRepo?: boolean;
  branch?: string;
  lastCommitSha?: string;
  remoteOrigin?: string;
  envGithubRepo?: string;
  envGithubBranch?: string;
  hasGithubToken?: boolean;
  totalComponents?: number;
}

export interface StudioState {
  // Files
  files: StudioFiles;
  activeTab: StudioFileName;

  // Component Registry & Work History
  userComponents: Record<string, UserComponent>;
  recentComponentIds: string[];
  quickPreviewComponentId: string | null;
  isCreateComponentDialogOpen: boolean;

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
  isSecurityModalOpen: boolean;
  isOwnerAuthenticated: boolean;
  ownerSessionToken: string | null;
  securityTelemetry: {
    authenticated: boolean;
    sessionToken?: string | null;
    hasEnvPasscode: boolean;
    hasCustomPasscode: boolean;
    requiresPasscodeSetup: boolean;
    dailyQuota: {
      used: number;
      limit: number;
      remaining: number;
      resetAt: string;
    };
    rateLimit: {
      limitPerMinute: number;
      remainingPerMinute: number;
    };
    blockedRequestsCount: number;
  } | null;

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
  preserveDesignSkill: boolean;
  autoApplyAiChanges: boolean;
  aiChatMessages: AiChatMessage[];
  isAiThinking: boolean;

  // Project Repository & GitHub Persistence
  isRepoSyncModalOpen: boolean;
  repoSyncStatus: RepoSyncStatus;
  autoSaveToRepo: boolean;
  lastRepoSyncError: string | null;
  repoGitInfo: RepoGitInfo | null;
  githubRepoConfig: {
    repo: string;
    branch: string;
    token: string;
  };

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

  // Component Registry & Work History Actions
  createComponent: (data: {
    name: string;
    description?: string;
    category?: string;
    starterTemplateId?: string;
  }) => string;
  deleteUserComponent: (id: string) => void;
  duplicateUserComponent: (id: string, newName?: string) => string;
  updateComponentPreview: (id: string, previewImage: string) => void;
  loadComponent: (id: string) => void;
  recordComponentVisit: (id: string) => void;
  setQuickPreviewComponentId: (id: string | null) => void;
  setCreateComponentDialogOpen: (open: boolean) => void;

  setCompilerState: (isCompiling: boolean, error?: string | null) => void;
  setRecordingModalOpen: (open: boolean) => void;
  setPublishModalOpen: (open: boolean) => void;
  setDependencyModalOpen: (open: boolean) => void;
  setSecurityModalOpen: (open: boolean) => void;
  setOwnerAuthenticated: (authenticated: boolean) => void;
  setOwnerSessionToken: (token: string | null) => void;
  setSecurityTelemetry: (
    telemetry: StudioState["securityTelemetry"]
  ) => void;

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
  setPreserveDesignSkill: (preserve: boolean) => void;
  togglePreserveDesignSkill: () => void;
  setAutoApplyAiChanges: (enabled: boolean) => void;
  toggleAutoApplyAiChanges: () => void;
  addAiChatMessage: (msg: Omit<AiChatMessage, "id" | "timestamp">) => void;
  deleteAiChatMessage: (id: string) => void;
  markAiMessageApplied: (id: string) => void;
  approveAiMessageChanges: (
    id: string,
    changedFiles: Partial<{
      "component.tsx": string;
      "default.tsx": string;
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
    "default.tsx": string;
    "demo.tsx": string;
    "index.css": string;
  }>) => void;

  // Project Repository & GitHub Actions
  setRepoSyncModalOpen: (open: boolean) => void;
  setAutoSaveToRepo: (enabled: boolean) => void;
  setGithubRepoConfig: (
    config: Partial<{ repo: string; branch: string; token: string }>
  ) => void;
  hydrateFromBrowserCache: () => Promise<void>;
  hydrateFromProjectRepo: () => Promise<void>;
  seedRepoSummaries: (summaries: RepoSummaryInput[]) => void;
  ensureComponentFilesLoaded: (id: string) => Promise<UserComponent | null>;
  hydrateSingleComponentFromServer: (
    component: UserComponent,
    variants?: ComponentVariant[],
    activeVariantId?: string
  ) => void;
  saveComponentToProjectRepo: (options?: {
    componentId?: string;
    commitMessage?: string;
    pushToGithub?: boolean;
  }) => Promise<{
    success: boolean;
    repoPath?: string;
    commitSha?: string;
    commitUrl?: string;
    error?: string;
  }>;
  syncAllComponentsToProjectRepo: (options?: {
    commitMessage?: string;
    pushToGithub?: boolean;
  }) => Promise<{
    success: boolean;
    savedCount?: number;
    commitSha?: string;
    commitUrl?: string;
    error?: string;
  }>;
  importWorkspaceBundle: (rawJson: string) => {
    success: boolean;
    importedCount: number;
    error?: string;
  };
}

export type StudioSliceCreator<T> = StateCreator<StudioState, [], [], T>;
