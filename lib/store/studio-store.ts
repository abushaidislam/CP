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

export interface UserComponent {
  id: string;
  name: string;
  description: string;
  category: string;
  isBuiltIn?: boolean;
  createdAt: number;
  updatedAt: number;
  files: {
    "component.tsx": string;
    "demo.tsx": string;
    "index.css": string;
  };
  dependencies: string[];
  previewImage?: string;
}

export interface StudioState {
  // Files
  files: {
    "component.tsx": string;
    "demo.tsx": string;
    "index.css": string;
  };
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

export function createSvgDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;
}

export const DEFAULT_TEMPLATE_PREVIEWS: Record<string, string> = {
  "ink-orbit-hero": createSvgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="400" height="225" fill="none">
  <defs>
    <radialGradient id="io-bg" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#09090b"/>
    </radialGradient>
    <linearGradient id="io-orbit-1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="50%" stop-color="#818cf8"/>
      <stop offset="100%" stop-color="#c084fc"/>
    </linearGradient>
    <linearGradient id="io-orbit-2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="100%" stop-color="#38bdf8"/>
    </linearGradient>
    <filter id="io-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="400" height="225" fill="url(#io-bg)"/>
  <path d="M0 112.5 H400 M200 0 V225" stroke="#27272a" stroke-width="0.75" stroke-dasharray="4 4" opacity="0.6"/>
  <g transform="translate(28, 52)">
    <rect width="76" height="14" rx="7" fill="#27272a" stroke="#3f3f46" stroke-width="0.8"/>
    <circle cx="10" cy="7" r="2.5" fill="#38bdf8"/>
    <rect x="18" y="4.5" width="48" height="5" rx="2.5" fill="#a1a1aa"/>
    <rect x="0" y="24" width="130" height="14" rx="3" fill="#f4f4f5"/>
    <rect x="0" y="44" width="105" height="14" rx="3" fill="#a1a1aa"/>
    <rect x="0" y="68" width="140" height="5" rx="2.5" fill="#71717a"/>
    <rect x="0" y="78" width="115" height="5" rx="2.5" fill="#52525b"/>
    <rect x="0" y="96" width="68" height="22" rx="4" fill="#fafafa"/>
    <rect x="14" y="104" width="40" height="6" rx="3" fill="#18181b"/>
    <rect x="76" y="96" width="64" height="22" rx="4" fill="#18181b" stroke="#3f3f46" stroke-width="1"/>
    <rect x="90" y="104" width="36" height="6" rx="3" fill="#a1a1aa"/>
  </g>
  <g transform="translate(285, 112.5)">
    <circle cx="0" cy="0" r="28" fill="#18181b" stroke="#3f3f46" stroke-width="1.2" opacity="0.85"/>
    <circle cx="-6" cy="-6" r="10" fill="#ffffff" opacity="0.12"/>
    <circle cx="0" cy="0" r="6" fill="#38bdf8" filter="url(#io-glow)" opacity="0.9"/>
    <ellipse cx="0" cy="0" rx="68" ry="24" stroke="url(#io-orbit-1)" stroke-width="2.2" transform="rotate(-28)" fill="none" opacity="0.95" filter="url(#io-glow)"/>
    <ellipse cx="0" cy="0" rx="54" ry="18" stroke="url(#io-orbit-2)" stroke-width="1.8" transform="rotate(42)" fill="none" opacity="0.85"/>
    <ellipse cx="0" cy="0" rx="76" ry="32" stroke="#6366f1" stroke-width="1" stroke-dasharray="3 3" transform="rotate(12)" fill="none" opacity="0.5"/>
    <circle cx="48" cy="-22" r="4.5" fill="#38bdf8" filter="url(#io-glow)"/>
    <circle cx="-38" cy="24" r="3.5" fill="#c084fc" filter="url(#io-glow)"/>
    <circle cx="20" cy="30" r="2.5" fill="#34d399"/>
    <circle cx="-45" cy="-16" r="2" fill="#fafafa"/>
  </g>
</svg>`
  ),
  "aurora-ambient-hero": createSvgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="400" height="225" fill="none">
  <defs>
    <radialGradient id="aah-bg" cx="50%" cy="30%" r="85%">
      <stop offset="0%" stop-color="#1e1035"/>
      <stop offset="60%" stop-color="#0c0714"/>
      <stop offset="100%" stop-color="#050308"/>
    </radialGradient>
    <radialGradient id="aah-aurora-1" cx="35%" cy="35%" r="60%">
      <stop offset="0%" stop-color="#818cf8" stop-opacity="0.85"/>
      <stop offset="50%" stop-color="#c084fc" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#ec4899" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="aah-aurora-2" cx="70%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.8"/>
      <stop offset="55%" stop-color="#3b82f6" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="aah-title-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#c7d2fe"/>
      <stop offset="40%" stop-color="#e0e7ff"/>
      <stop offset="70%" stop-color="#f472b6"/>
      <stop offset="100%" stop-color="#fb7185"/>
    </linearGradient>
    <linearGradient id="aah-btn-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="50%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
    <filter id="aah-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="400" height="225" fill="url(#aah-bg)"/>
  <circle cx="150" cy="80" r="110" fill="url(#aah-aurora-1)" filter="url(#aah-glow)" opacity="0.7"/>
  <circle cx="280" cy="95" r="95" fill="url(#aah-aurora-2)" filter="url(#aah-glow)" opacity="0.65"/>
  <path d="M0 75 H400 M0 150 H400 M100 0 V225 M200 0 V225 M300 0 V225" stroke="#312e81" stroke-width="0.5" stroke-dasharray="3 3" opacity="0.35"/>
  <g transform="translate(142, 28)">
    <rect width="116" height="18" rx="9" fill="#1e1b4b" stroke="#818cf8" stroke-width="1"/>
    <circle cx="12" cy="9" r="3" fill="#a855f7"/>
    <rect x="22" y="6.5" width="76" height="5" rx="2.5" fill="#e0e7ff"/>
    <circle cx="104" cy="9" r="2" fill="#38bdf8"/>
  </g>
  <rect x="65" y="58" width="270" height="16" rx="4" fill="#ffffff" opacity="0.95"/>
  <rect x="100" y="80" width="200" height="14" rx="4" fill="url(#aah-title-grad)"/>
  <rect x="90" y="104" width="220" height="6" rx="3" fill="#94a3b8" opacity="0.8"/>
  <rect x="125" y="115" width="150" height="5" rx="2.5" fill="#64748b" opacity="0.7"/>
  <g transform="translate(115, 134)">
    <rect width="95" height="26" rx="8" fill="url(#aah-btn-grad)"/>
    <rect x="18" y="10" width="58" height="6" rx="3" fill="#ffffff"/>
    <path d="M82 13 L86 13 M84 11 L86 13 L84 15" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
  </g>
  <g transform="translate(220, 134)">
    <rect width="68" height="26" rx="8" fill="#18181b" stroke="#3f3f46" stroke-width="1"/>
    <polygon points="12,9 12,17 19,13" fill="#a1a1aa"/>
    <rect x="26" y="10" width="30" height="6" rx="3" fill="#d4d4d8"/>
  </g>
  <g transform="translate(60, 178)">
    <rect width="80" height="26" rx="6" fill="#130e26" stroke="#2e1065" stroke-width="0.8"/>
    <circle cx="14" cy="13" r="3" fill="#10b981"/>
    <rect x="24" y="10" width="46" height="5.5" rx="2" fill="#c7d2fe"/>
  </g>
  <g transform="translate(160, 178)">
    <rect width="80" height="26" rx="6" fill="#130e26" stroke="#2e1065" stroke-width="0.8"/>
    <circle cx="14" cy="13" r="3" fill="#38bdf8"/>
    <rect x="24" y="10" width="46" height="5.5" rx="2" fill="#c7d2fe"/>
  </g>
  <g transform="translate(260, 178)">
    <rect width="80" height="26" rx="6" fill="#130e26" stroke="#2e1065" stroke-width="0.8"/>
    <circle cx="14" cy="13" r="3" fill="#f472b6"/>
    <rect x="24" y="10" width="46" height="5.5" rx="2" fill="#c7d2fe"/>
  </g>
</svg>`
  ),
  "spotlight-card": createSvgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="400" height="225" fill="none">
  <defs>
    <radialGradient id="sc-spotlight" cx="50%" cy="15%" r="65%">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.45"/>
      <stop offset="60%" stop-color="#3b82f6" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#09090b" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="sc-card-border" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#60a5fa" stop-opacity="0.8"/>
      <stop offset="40%" stop-color="#3b82f6" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#1e293b" stop-opacity="0.2"/>
    </linearGradient>
    <linearGradient id="sc-card-bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#0f1115"/>
    </linearGradient>
  </defs>
  <rect width="400" height="225" fill="#09090b"/>
  <circle cx="200" cy="50" r="160" fill="url(#sc-spotlight)"/>
  <g transform="translate(100, 32)">
    <rect width="200" height="160" rx="14" fill="url(#sc-card-bg)" stroke="url(#sc-card-border)" stroke-width="1.5"/>
    <rect x="22" y="22" width="34" height="34" rx="8" fill="#1e293b" stroke="#3b82f6" stroke-width="1.2"/>
    <path d="M33 39 L39 33 L45 39 M39 34 V45" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="136" y="24" width="42" height="16" rx="8" fill="#1e3a5f" stroke="#2563eb" stroke-width="0.8"/>
    <circle cx="144" cy="32" r="2.5" fill="#60a5fa"/>
    <rect x="151" y="29.5" width="20" height="5" rx="2.5" fill="#93c5fd"/>
    <rect x="22" y="70" width="110" height="12" rx="3" fill="#f4f4f5"/>
    <rect x="22" y="90" width="156" height="5" rx="2.5" fill="#71717a"/>
    <rect x="22" y="100" width="130" height="5" rx="2.5" fill="#52525b"/>
    <rect x="22" y="120" width="156" height="24" rx="6" fill="#18181b" stroke="#3f3f46" stroke-width="1"/>
    <rect x="74" y="129" width="52" height="6" rx="3" fill="#e4e4e7"/>
  </g>
</svg>`
  ),
  "bento-metric-grid": createSvgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="400" height="225" fill="none">
  <defs>
    <radialGradient id="bmg-bg" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="#0e1726"/>
      <stop offset="100%" stop-color="#040810"/>
    </radialGradient>
    <linearGradient id="bmg-card-border" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="50%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="bmg-spark-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
    <linearGradient id="bmg-spark-emerald" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#34d399"/>
    </linearGradient>
  </defs>
  <rect width="400" height="225" fill="url(#bmg-bg)"/>
  <g transform="translate(45, 18)">
    <rect width="310" height="188" rx="14" fill="#0b1120" stroke="url(#bmg-card-border)" stroke-width="1.4"/>
    <circle cx="22" cy="22" r="3.5" fill="#10b981"/>
    <rect x="32" y="18.5" width="85" height="7" rx="3.5" fill="#34d399"/>
    <rect x="238" y="14" width="56" height="16" rx="8" fill="#1e293b" stroke="#334155" stroke-width="0.8"/>
    <rect x="248" y="19" width="36" height="6" rx="3" fill="#94a3b8"/>
    <line x1="16" y1="36" x2="294" y2="36" stroke="#1e293b" stroke-width="1"/>
    <g transform="translate(16, 46)">
      <rect width="134" height="62" rx="9" fill="#111c33" stroke="#3b82f6" stroke-width="1"/>
      <rect x="10" y="8" width="54" height="5" rx="2.5" fill="#93c5fd"/>
      <rect x="10" y="20" width="46" height="12" rx="3" fill="#f8fafc"/>
      <rect x="86" y="8" width="38" height="12" rx="6" fill="#064e3b"/>
      <rect x="92" y="12" width="26" height="4" rx="2" fill="#34d399"/>
      <path d="M12 50 L34 46 L58 52 L84 41 L108 43 L122 36" fill="none" stroke="url(#bmg-spark-cyan)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <g transform="translate(160, 46)">
      <rect width="134" height="62" rx="9" fill="#0f1f2e" stroke="#059669" stroke-width="1"/>
      <rect x="10" y="8" width="58" height="5" rx="2.5" fill="#6ee7b7"/>
      <rect x="10" y="20" width="52" height="12" rx="3" fill="#f8fafc"/>
      <rect x="86" y="8" width="38" height="12" rx="6" fill="#064e3b"/>
      <rect x="92" y="12" width="26" height="4" rx="2" fill="#34d399"/>
      <path d="M12 52 L36 48 L60 42 L82 38 L104 32 L122 28" fill="none" stroke="url(#bmg-spark-emerald)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <g transform="translate(16, 116)">
      <rect width="134" height="60" rx="9" fill="#161b2e" stroke="#334155" stroke-width="0.9"/>
      <rect x="10" y="8" width="48" height="5" rx="2.5" fill="#94a3b8"/>
      <rect x="10" y="20" width="40" height="12" rx="3" fill="#f1f5f9"/>
      <rect x="88" y="8" width="36" height="12" rx="6" fill="#451a03"/>
      <rect x="94" y="12" width="24" height="4" rx="2" fill="#fb923c"/>
      <path d="M12 48 L38 45 L62 48 L86 42 L110 44 L122 41" fill="none" stroke="#f59e0b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <g transform="translate(160, 116)">
      <rect width="134" height="60" rx="9" fill="#151b36" stroke="#4f46e5" stroke-width="1"/>
      <rect x="10" y="8" width="52" height="5" rx="2.5" fill="#a5b4fc"/>
      <rect x="10" y="20" width="52" height="12" rx="3" fill="#f8fafc"/>
      <rect x="88" y="8" width="36" height="12" rx="6" fill="#1e1b4b"/>
      <rect x="94" y="12" width="24" height="4" rx="2" fill="#818cf8"/>
      <path d="M12 50 L36 44 L62 38 L88 35 L108 30 L122 26" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>
</svg>`
  ),
  "shimmer-button": createSvgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="400" height="225" fill="none">
  <defs>
    <linearGradient id="sb-aurora" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="30%" stop-color="#818cf8"/>
      <stop offset="70%" stop-color="#c084fc"/>
      <stop offset="100%" stop-color="#f472b6"/>
    </linearGradient>
    <linearGradient id="sb-btn-bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="sb-shimmer-beam" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <filter id="sb-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <clipPath id="sb-clip">
      <rect width="190" height="50" rx="25"/>
    </clipPath>
  </defs>
  <rect width="400" height="225" fill="#090a0f"/>
  <ellipse cx="200" cy="112.5" rx="130" ry="36" fill="url(#sb-aurora)" opacity="0.3" filter="url(#sb-glow)"/>
  <g transform="translate(105, 87)">
    <rect width="190" height="50" rx="25" fill="url(#sb-btn-bg)" stroke="url(#sb-aurora)" stroke-width="2"/>
    <g clip-path="url(#sb-clip)">
      <rect x="50" y="-10" width="45" height="70" fill="url(#sb-shimmer-beam)" transform="skewX(-24)"/>
    </g>
    <path d="M42 25 L44 20 L49 22 L45 26 L47 31 L42 28 L37 31 L39 26 L35 22 L40 20 Z" fill="#38bdf8" opacity="0.9"/>
    <rect x="58" y="21" width="84" height="8" rx="4" fill="#f8fafc"/>
    <path d="M152 22 L157 25 L152 28" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`
  ),
  "neon-glow-button": createSvgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="400" height="225" fill="none">
  <defs>
    <radialGradient id="ngb-bg" cx="50%" cy="50%" r="80%">
      <stop offset="0%" stop-color="#0a1226"/>
      <stop offset="60%" stop-color="#050811"/>
      <stop offset="100%" stop-color="#020408"/>
    </radialGradient>
    <radialGradient id="ngb-ambient-cyan" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.6"/>
      <stop offset="60%" stop-color="#06b6d4" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#06b6d4" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="ngb-ambient-pink" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ec4899" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#ec4899" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ngb-btn-border" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22d3ee"/>
      <stop offset="50%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <linearGradient id="ngb-inner-bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#083344"/>
      <stop offset="100%" stop-color="#041620"/>
    </linearGradient>
    <filter id="ngb-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="400" height="225" fill="url(#ngb-bg)"/>
  <ellipse cx="200" cy="112.5" rx="140" ry="60" fill="url(#ngb-ambient-cyan)" filter="url(#ngb-glow)"/>
  <ellipse cx="200" cy="112.5" rx="90" ry="40" fill="url(#ngb-ambient-pink)" filter="url(#ngb-glow)"/>
  <rect x="80" y="70" width="240" height="85" rx="20" stroke="#06b6d4" stroke-width="0.8" opacity="0.3"/>
  <rect x="65" y="55" width="270" height="115" rx="26" stroke="#22d3ee" stroke-width="0.5" stroke-dasharray="4 4" opacity="0.2"/>
  <g transform="translate(100, 86)">
    <rect width="200" height="52" rx="14" fill="url(#ngb-inner-bg)" stroke="url(#ngb-btn-border)" stroke-width="2" filter="url(#ngb-glow)"/>
    <circle cx="8" cy="8" r="1.5" fill="#22d3ee"/>
    <circle cx="192" cy="44" r="1.5" fill="#22d3ee"/>
    <circle cx="34" cy="26" r="3.5" fill="#22d3ee" filter="url(#ngb-glow)"/>
    <path d="M52 26 L58 17 L56 25 L63 25 L54 35 L56 27 Z" fill="#67e8f9" filter="url(#ngb-glow)"/>
    <rect x="74" y="21" width="94" height="10" rx="5" fill="#e0f2fe"/>
  </g>
</svg>`
  ),
  "metric-badge": createSvgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="400" height="225" fill="none">
  <defs>
    <radialGradient id="mb-radar-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="mb-pill-bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#111827"/>
      <stop offset="0%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#0b0f19"/>
    </linearGradient>
    <filter id="mb-dot-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="400" height="225" fill="#080c10"/>
  <circle cx="200" cy="112.5" r="90" stroke="#1f2937" stroke-width="0.75" stroke-dasharray="4 4" opacity="0.5"/>
  <circle cx="200" cy="112.5" r="60" stroke="#1f2937" stroke-width="0.75" opacity="0.4"/>
  <circle cx="200" cy="112.5" r="30" stroke="#1f2937" stroke-width="0.75" opacity="0.3"/>
  <g transform="translate(95, 92)">
    <rect width="210" height="42" rx="21" fill="url(#mb-pill-bg)" stroke="#1f2937" stroke-width="1.2"/>
    <circle cx="24" cy="21" r="10" stroke="#10b981" stroke-width="1" opacity="0.35"/>
    <circle cx="24" cy="21" r="15" fill="url(#mb-radar-glow)"/>
    <circle cx="24" cy="21" r="4.5" fill="#10b981" filter="url(#mb-dot-glow)"/>
    <rect x="44" y="14" width="70" height="6.5" rx="3.25" fill="#f3f4f6"/>
    <rect x="44" y="23.5" width="46" height="4.5" rx="2.25" fill="#9ca3af"/>
    <line x1="124" y1="12" x2="124" y2="30" stroke="#374151" stroke-width="1"/>
    <path d="M136 24 L144 24 L149 14 L154 28 L159 18 L164 24 L172 24" fill="none" stroke="#10b981" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="178" y="13" width="22" height="15" rx="4" fill="#064e3b" stroke="#059669" stroke-width="0.75"/>
    <rect x="182" y="18" width="14" height="5" rx="2" fill="#a7f3d0"/>
  </g>
</svg>`
  ),
  "live-ping-status-pill": createSvgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="400" height="225" fill="none">
  <defs>
    <radialGradient id="lpp-bg" cx="50%" cy="50%" r="80%">
      <stop offset="0%" stop-color="#041a14"/>
      <stop offset="60%" stop-color="#020d0a"/>
      <stop offset="100%" stop-color="#010604"/>
    </radialGradient>
    <radialGradient id="lpp-beacon-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="#10b981" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="lpp-pill-border" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399"/>
      <stop offset="50%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <linearGradient id="lpp-pill-bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#064e3b" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#022c22" stop-opacity="0.8"/>
    </linearGradient>
    <filter id="lpp-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="400" height="225" fill="url(#lpp-bg)"/>
  <circle cx="200" cy="112.5" r="95" stroke="#065f46" stroke-width="0.75" stroke-dasharray="4 4" opacity="0.4"/>
  <circle cx="200" cy="112.5" r="70" stroke="#059669" stroke-width="0.8" opacity="0.45"/>
  <circle cx="200" cy="112.5" r="45" stroke="#10b981" stroke-width="1" opacity="0.5"/>
  <circle cx="200" cy="112.5" r="25" fill="url(#lpp-beacon-glow)"/>
  <g transform="translate(85, 90)">
    <rect width="230" height="45" rx="22.5" fill="url(#lpp-pill-bg)" stroke="url(#lpp-pill-border)" stroke-width="1.6" filter="url(#lpp-glow)"/>
    <circle cx="24" cy="22.5" r="9" stroke="#34d399" stroke-width="1" opacity="0.6"/>
    <circle cx="24" cy="22.5" r="4.5" fill="#34d399" filter="url(#lpp-glow)"/>
    <rect x="42" y="16.5" width="56" height="12" rx="4" fill="#ecfdf5"/>
    <line x1="108" y1="14" x2="108" y2="31" stroke="#065f46" stroke-width="1.2"/>
    <path d="M120 17 L126 14 L132 17 L132 23 C132 27 126 29 126 29 C126 29 120 27 120 23 Z" fill="#10b981" opacity="0.9"/>
    <rect x="138" y="17" width="34" height="10" rx="3" fill="#6ee7b7"/>
    <line x1="182" y1="14" x2="182" y2="31" stroke="#065f46" stroke-width="1.2"/>
    <rect x="192" y="18" width="24" height="9" rx="3" fill="#a7f3d0"/>
  </g>
</svg>`
  ),
  "blank": createSvgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 225" width="400" height="225" fill="none">
  <defs>
    <pattern id="bl-grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e222a" stroke-width="0.75"/>
    </pattern>
    <linearGradient id="bl-border" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#6366f1" stop-opacity="0.2"/>
    </linearGradient>
  </defs>
  <rect width="400" height="225" fill="#0d1117"/>
  <rect width="400" height="225" fill="url(#bl-grid)"/>
  <g transform="translate(80, 36)">
    <rect width="240" height="152" rx="10" fill="#161b22" fill-opacity="0.7" stroke="url(#bl-border)" stroke-width="1.5" stroke-dasharray="6 4"/>
    <path d="M-6 0 H6 M0 -6 V6" stroke="#60a5fa" stroke-width="1.5"/>
    <path d="M234 0 H246 M240 -6 V6" stroke="#60a5fa" stroke-width="1.5"/>
    <path d="M-6 152 H6 M0 146 V158" stroke="#60a5fa" stroke-width="1.5"/>
    <path d="M234 152 H246 M240 146 V158" stroke="#60a5fa" stroke-width="1.5"/>
    <rect x="96" y="44" width="48" height="40" rx="8" fill="#1f2937" stroke="#374151" stroke-width="1"/>
    <path d="M112 59 L107 64 L112 69" stroke="#93c5fd" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M128 59 L133 64 L128 69" stroke="#93c5fd" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M122 57 L118 71" stroke="#60a5fa" stroke-width="1.5" stroke-linecap="round"/>
    <rect x="76" y="96" width="88" height="8" rx="4" fill="#e2e8f0"/>
    <rect x="92" y="110" width="56" height="5" rx="2.5" fill="#64748b"/>
  </g>
</svg>`
  ),
};

export function createInitialUserComponents(): Record<string, UserComponent> {
  const map: Record<string, UserComponent> = {};
  for (const tmpl of DEFAULT_TEMPLATES) {
    map[tmpl.id] = {
      id: tmpl.id,
      name: tmpl.name,
      description: tmpl.description,
      category: tmpl.category,
      isBuiltIn: true,
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
      files: {
        "component.tsx": tmpl.files["component.tsx"],
        "demo.tsx": tmpl.files["demo.tsx"],
        "index.css": tmpl.files["index.css"],
      },
      dependencies: [...tmpl.dependencies],
      previewImage: DEFAULT_TEMPLATE_PREVIEWS[tmpl.id] || DEFAULT_TEMPLATE_PREVIEWS["blank"],
    };
  }
  return map;
}

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

export function studioPersistMerge(
  persistedState: unknown,
  currentState: StudioState
): StudioState {
  const persisted = (persistedState || {}) as Partial<StudioState>;
  const initialComponents = createInitialUserComponents();
  return {
    ...currentState,
    ...persisted,
    userComponents: {
      ...initialComponents,
      ...(persisted.userComponents || {}),
    },
    variantsByTemplate: {
      ...currentState.variantsByTemplate,
      ...(persisted.variantsByTemplate || {}),
    },
    activeVariantByTemplate: {
      ...currentState.activeVariantByTemplate,
      ...(persisted.activeVariantByTemplate || {}),
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

      // Component Registry & Work History
      userComponents: createInitialUserComponents(),
      recentComponentIds: [initialTemplate.id],
      quickPreviewComponentId: null,
      isCreateComponentDialogOpen: false,

      // Version Control
      variantsByTemplate: DEFAULT_TEMPLATES.reduce<Record<string, ComponentVariant[]>>((acc, tmpl) => {
        acc[tmpl.id] = [createDefaultVariant(tmpl.id, tmpl.files, tmpl.dependencies)];
        return acc;
      }, {}),
      activeVariantByTemplate: DEFAULT_TEMPLATES.reduce<Record<string, string>>((acc, tmpl) => {
        acc[tmpl.id] = `var-default-${tmpl.id}`;
        return acc;
      }, {}),

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
          const currentComp = state.userComponents?.[state.currentTemplateId];
          const updatedUserComponents = currentComp
            ? {
                ...state.userComponents,
                [state.currentTemplateId]: {
                  ...currentComp,
                  dependencies: nextDeps,
                  updatedAt: Date.now(),
                },
              }
            : state.userComponents;

          return {
            dependencies: nextDeps,
            userComponents: updatedUserComponents,
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
          const currentComp = state.userComponents?.[state.currentTemplateId];
          const updatedUserComponents = currentComp
            ? {
                ...state.userComponents,
                [state.currentTemplateId]: {
                  ...currentComp,
                  dependencies: nextDeps,
                  updatedAt: Date.now(),
                },
              }
            : state.userComponents;

          return {
            dependencies: nextDeps,
            userComponents: updatedUserComponents,
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
          const currentComp = state.userComponents?.[state.currentTemplateId];
          const updatedUserComponents = currentComp
            ? {
                ...state.userComponents,
                [state.currentTemplateId]: {
                  ...currentComp,
                  dependencies: nextDeps,
                  updatedAt: Date.now(),
                },
              }
            : state.userComponents;

          return {
            dependencies: nextDeps,
            userComponents: updatedUserComponents,
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
          const currentComp = state.userComponents?.[state.currentTemplateId];
          const updatedUserComponents = currentComp
            ? {
                ...state.userComponents,
                [state.currentTemplateId]: {
                  ...currentComp,
                  dependencies: nextDeps,
                  updatedAt: Date.now(),
                },
              }
            : state.userComponents;

          return {
            dependencies: nextDeps,
            userComponents: updatedUserComponents,
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
          const currentComp = state.userComponents?.[state.currentTemplateId];
          const updatedUserComponents = currentComp
            ? {
                ...state.userComponents,
                [state.currentTemplateId]: {
                  ...currentComp,
                  dependencies: nextDeps,
                  updatedAt: Date.now(),
                },
              }
            : state.userComponents;

          return {
            dependencies: nextDeps,
            userComponents: updatedUserComponents,
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
          const currentComp = state.userComponents?.[state.currentTemplateId];
          const updatedUserComponents = currentComp
            ? {
                ...state.userComponents,
                [state.currentTemplateId]: {
                  ...currentComp,
                  dependencies: nextDeps,
                  updatedAt: Date.now(),
                },
              }
            : state.userComponents;

          return {
            dependencies: nextDeps,
            userComponents: updatedUserComponents,
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
          const currentComp = state.userComponents?.[state.currentTemplateId];
          const updatedUserComponents = currentComp
            ? {
                ...state.userComponents,
                [state.currentTemplateId]: {
                  ...currentComp,
                  dependencies: [],
                  updatedAt: Date.now(),
                },
              }
            : state.userComponents;

          return {
            dependencies: [],
            userComponents: updatedUserComponents,
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
            const tmpl =
              DEFAULT_TEMPLATES.find((t) => t.id === templateId) ||
              state.userComponents?.[templateId] ||
              DEFAULT_TEMPLATES[0];
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
          const defaultVar = createDefaultVariant(target.id, target.files, target.dependencies);
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

        const isBuiltIn = DEFAULT_TEMPLATES.some((t) => t.id === target.id);
        const nextUserComponents = state.userComponents?.[target.id]
          ? state.userComponents
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
                files: { ...target.files },
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
          recentComponentIds: [target.id, ...(state.recentComponentIds || []).filter((cid) => cid !== target.id)].slice(0, 50),
        });
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
          initialFiles = {
            "component.tsx": starter.files["component.tsx"],
            "demo.tsx": starter.files["demo.tsx"],
            "index.css": starter.files["index.css"],
          };
          initialDeps = [...starter.dependencies];
        } else {
          initialFiles = {
            "component.tsx": `"use client"\n\nimport React from "react"\n\nexport function Component() {\n  return (\n    <div className="flex items-center justify-center p-8 text-foreground">\n      <h2 className="text-xl font-semibold">${name}</h2>\n    </div>\n  )\n}\n\nexport default Component\n`,
            "demo.tsx": `"use client"\n\nimport React from "react"\nimport Component from "./component"\n\nexport default function Demo() {\n  return (\n    <div className="flex min-h-[300px] w-full items-center justify-center p-6">\n      <Component />\n    </div>\n  )\n}\n`,
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
          recentComponentIds: [id, ...(state.recentComponentIds || []).filter((cid) => cid !== id)].slice(0, 50),
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

      deleteUserComponent: (id) =>
        set((state) => {
          if (state.userComponents?.[id]?.isBuiltIn || DEFAULT_TEMPLATES.some((t) => t.id === id)) {
            return state;
          }

          const nextUserComponents = { ...state.userComponents };
          delete nextUserComponents[id];

          const nextRecent = (state.recentComponentIds || []).filter((cid) => cid !== id).slice(0, 50);
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
            const fallbackActiveVarId = nextActiveVariants[fallbackComp.id] || fallbackVariants[0]?.id;
            const activeVar = fallbackVariants.find((v) => v.id === fallbackActiveVarId);

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
            selectedCheckpointId: state.currentTemplateId === id ? null : state.selectedCheckpointId,
            compilerError: state.currentTemplateId === id ? null : state.compilerError,
            quickPreviewComponentId:
              state.quickPreviewComponentId === id ? null : state.quickPreviewComponentId,
          };
        }),

      duplicateUserComponent: (id, newName) => {
        const state = get();
        const source =
          state.userComponents?.[id] ||
          DEFAULT_TEMPLATES.find((t) => t.id === id);

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
          files: {
            "component.tsx": source.files["component.tsx"],
            "demo.tsx": source.files["demo.tsx"],
            "index.css": source.files["index.css"],
          },
          dependencies: [...source.dependencies],
          previewImage:
            source.previewImage ||
            DEFAULT_TEMPLATE_PREVIEWS[source.id] ||
            DEFAULT_TEMPLATE_PREVIEWS["blank"],
        };

        const defaultVar = createDefaultVariant(dupId, dupComponent.files, dupComponent.dependencies);

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

      updateComponentPreview: (id, previewImage) =>
        set((state) => {
          const comp = state.userComponents?.[id];
          if (!comp) return state;
          return {
            userComponents: {
              ...state.userComponents,
              [id]: {
                ...comp,
                previewImage,
                updatedAt: Date.now(),
              },
            },
          };
        }),

      recordComponentVisit: (id) =>
        set((state) => ({
          recentComponentIds: [id, ...(state.recentComponentIds || []).filter((cid) => cid !== id)].slice(0, 50),
        })),

      setQuickPreviewComponentId: (id) => set({ quickPreviewComponentId: id }),

      setCreateComponentDialogOpen: (open) => set({ isCreateComponentDialogOpen: open }),

      resetCurrentTemplate: () => {
        const { currentTemplateId, variantsByTemplate, activeVariantByTemplate, userComponents } = get();
        const builtin = DEFAULT_TEMPLATES.find((t) => t.id === currentTemplateId);
        const template = builtin || userComponents?.[currentTemplateId] || DEFAULT_TEMPLATES[0];

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
        userComponents: state.userComponents,
        recentComponentIds: state.recentComponentIds,
      }),
      merge: studioPersistMerge,
    }
  )
);
