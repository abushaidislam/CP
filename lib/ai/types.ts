/**
 * Shared types for the re-architected Component Studio AI Assistant.
 * Used across server-side orchestration (`lib/ai/*`, `app/api/ai-assistant`)
 * and client-side Copilot UI (`components/studio/ai/*`, `lib/store/*`).
 */

export type RegistryReferenceMode = "auto" | "always" | "off";

export type AiDepthMode = "standard" | "deep";

export type AiIntentType =
  | "visual_design"
  | "new_component"
  | "motion_polish"
  | "refactor_architecture"
  | "bugfix"
  | "audit_standards"
  | "demo_controls"
  | "question";

export type AiReasoningStepCategory =
  | "context"
  | "reference"
  | "ast"
  | "audit"
  | "synthesis"
  | "verify";

export interface AiReasoningStepPayload {
  title: string;
  description?: string;
  detail?: string;
  category?: AiReasoningStepCategory;
  items?: string[];
}

export interface RegistryReferenceSummary {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  score: number;
  matchReasons: string[];
  previewUrl?: string;
  hasPreviewImage: boolean;
  hasCodeSample: boolean;
  dependencies: string[];
  pinnedByUser?: boolean;
}

export interface RegistryReferenceDecision {
  used: boolean;
  mode: RegistryReferenceMode;
  reason: string;
  intent: AiIntentType;
  visualConfidence: number;
  candidateCount: number;
}

export interface AiBlueprintPlan {
  architectureNotes: string[];
  designTokens: string[];
  motionStrategy?: string;
  accessibilityNotes: string[];
  edgeCasesHandled: string[];
  referenceTakeaways?: string[];
}

export interface AiVerificationReport {
  beforeScore: number;
  afterScore: number;
  scoreDelta: number;
  astComponentName: string;
  propsCount: number;
  compileValid: boolean;
  compileError?: string | null;
  changedFiles: string[];
  dependencyDelta: string[];
  selfRepaired: boolean;
  verificationNotes: string[];
}

export interface IntentClassification {
  primaryIntent: AiIntentType;
  shouldUseRegistryReferences: boolean;
  referenceDecisionReason: string;
  visualConfidence: number;
  targetCategories: string[];
  keywords: string[];
  allowVisualMutations: boolean;
}

export interface AttachedImagePayload {
  name?: string;
  dataUrl: string;
  mimeType?: string;
}

export interface AttachedCodePayload {
  title?: string;
  language?: string;
  code: string;
}

export interface ChatHistoryItem {
  role: "user" | "assistant" | "model" | "system";
  content: string;
}

export interface AiAssistantRequestBody {
  prompt?: string;
  action?: "audit" | "chat" | "autofix";
  componentCode: string;
  defaultCode?: string;
  demoCode?: string;
  cssCode?: string;
  dependencies?: string[];
  compilerError?: string | null;
  model?: string;
  role?: string;
  preserveDesign?: boolean;
  depthMode?: AiDepthMode;
  registryRefMode?: RegistryReferenceMode;
  pinnedReferenceSlugs?: string[];
  currentComponentId?: string;
  currentComponentSlug?: string;
  currentComponentName?: string;
  currentComponentCategory?: string;
  history?: ChatHistoryItem[];
  images?: AttachedImagePayload[];
  codeSnippets?: AttachedCodePayload[];
}
