"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  useStudioStore,
  AttachedImage,
  AttachedCodeSnippet,
  StudioFileName,
} from "@/lib/store/studio-store";
import { auditComponentGuidelines } from "@/lib/sandbox/guideline-linter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageHeader,
} from "@/components/ui/chat";
import {
  Reasoning,
  Plan,
  PromptInput,
  TaskItemProps,
  ReasoningStep,
  AttachCodeDialog,
  ImagePreviewDialog,
  CodePreviewDialog,
  SlashCommandItem,
} from "@/components/ui/ai-elements";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Brain,
  Code2,
  Lock,
  Pin,
  Play,
  Unlock,
  X,
} from "lucide-react";
import type {
  AiBlueprintPlan,
  AiDepthMode,
  AiReasoningStepCategory,
  AiVerificationReport,
  RegistryReferenceDecision,
  RegistryReferenceSummary,
} from "@/lib/ai/types";
import {
  MODEL_OPTIONS,
  REGISTRY_REF_MODE_OPTIONS,
  ROLE_OPTIONS,
} from "./ai/ai-copilot-constants";
import { AiPanelHeader } from "./ai/ai-panel-header";
import { AiWelcomeScreen } from "./ai/ai-welcome-screen";
import { AiMessageItem } from "./ai/ai-message-item";
import { RegistryReferencePicker } from "./ai/registry-reference-picker";

export interface AiAssistantPanelProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function AiAssistantPanel({
  isMobile = false,
  onClose,
}: AiAssistantPanelProps = {}) {
  const {
    files,
    dependencies,
    currentTemplateId,
    userComponents,
    isAiPanelOpen,
    aiPanelWidth,
    aiModel,
    aiRole,
    aiDepthMode,
    registryRefMode,
    pinnedRegistryRefs,
    preserveDesignSkill,
    autoApplyAiChanges,
    aiChatMessages,
    isAiThinking,
    compilerError,
    isOwnerAuthenticated,
    securityTelemetry,
    setSecurityModalOpen,
    setOwnerAuthenticated,
    setSecurityTelemetry,
    setAiPanelOpen,
    setAiPanelWidth,
    setAiModel,
    setAiRole,
    setAiDepthMode,
    setRegistryRefMode,
    togglePinnedRegistryRef,
    clearPinnedRegistryRefs,
    togglePreserveDesignSkill,
    toggleAutoApplyAiChanges,
    addAiChatMessage,
    deleteAiChatMessage,
    approveAiMessageChanges,
    rejectAiMessageChanges,
    revertAiMessageChanges,
    clearAiChat,
    setAiThinking,
    applyAiChanges,
    saveCheckpoint,
    addTerminalLog,
  } = useStudioStore(
    useShallow((state) => ({
      files: state.files,
      dependencies: state.dependencies,
      currentTemplateId: state.currentTemplateId,
      userComponents: state.userComponents,
      isAiPanelOpen: state.isAiPanelOpen,
      aiPanelWidth: state.aiPanelWidth,
      aiModel: state.aiModel,
      aiRole: state.aiRole,
      aiDepthMode: state.aiDepthMode,
      registryRefMode: state.registryRefMode,
      pinnedRegistryRefs: state.pinnedRegistryRefs,
      preserveDesignSkill: state.preserveDesignSkill,
      autoApplyAiChanges: state.autoApplyAiChanges,
      aiChatMessages: state.aiChatMessages,
      isAiThinking: state.isAiThinking,
      compilerError: state.compilerError,
      isOwnerAuthenticated: state.isOwnerAuthenticated,
      securityTelemetry: state.securityTelemetry,
      setSecurityModalOpen: state.setSecurityModalOpen,
      setOwnerAuthenticated: state.setOwnerAuthenticated,
      setSecurityTelemetry: state.setSecurityTelemetry,
      setAiPanelOpen: state.setAiPanelOpen,
      setAiPanelWidth: state.setAiPanelWidth,
      setAiModel: state.setAiModel,
      setAiRole: state.setAiRole,
      setAiDepthMode: state.setAiDepthMode,
      setRegistryRefMode: state.setRegistryRefMode,
      togglePinnedRegistryRef: state.togglePinnedRegistryRef,
      clearPinnedRegistryRefs: state.clearPinnedRegistryRefs,
      togglePreserveDesignSkill: state.togglePreserveDesignSkill,
      toggleAutoApplyAiChanges: state.toggleAutoApplyAiChanges,
      addAiChatMessage: state.addAiChatMessage,
      deleteAiChatMessage: state.deleteAiChatMessage,
      approveAiMessageChanges: state.approveAiMessageChanges,
      rejectAiMessageChanges: state.rejectAiMessageChanges,
      revertAiMessageChanges: state.revertAiMessageChanges,
      clearAiChat: state.clearAiChat,
      setAiThinking: state.setAiThinking,
      applyAiChanges: state.applyAiChanges,
      saveCheckpoint: state.saveCheckpoint,
      addTerminalLog: state.addTerminalLog,
    }))
  );

  const [promptInput, setPromptInput] = useState("");
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [attachedCodeSnippets, setAttachedCodeSnippets] = useState<
    AttachedCodeSnippet[]
  >([]);
  const [isAttachCodeDialogOpen, setIsAttachCodeDialogOpen] = useState(false);
  const [isRegistryPickerOpen, setIsRegistryPickerOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    name?: string;
  } | null>(null);
  const [previewSnippet, setPreviewSnippet] =
    useState<AttachedCodeSnippet | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [checkpointSavedId, setCheckpointSavedId] = useState<string | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [thinkingSeconds, setThinkingSeconds] = useState(0);
  const [showGuidelinesDrawer, setShowGuidelinesDrawer] = useState(false);
  const [attachmentNotice, setAttachmentNotice] = useState<string | null>(null);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const currentWidthRef = useRef(aiPanelWidth);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const requestStartTimeRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Handle uploaded or clipboard-pasted image files
  const handleImageFilesAdded = (fileList: File[]) => {
    const imageFiles = fileList.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0 && fileList.length > 0) {
      setAttachmentNotice(
        "Only image files (PNG, JPG, WebP, GIF) are supported."
      );
      setTimeout(() => setAttachmentNotice(null), 4000);
      return;
    }

    const oversized = imageFiles.filter((f) => f.size > 8 * 1024 * 1024);
    if (oversized.length > 0) {
      setAttachmentNotice(
        `"${oversized[0].name}" exceeds 8MB limit (${(oversized[0].size / (1024 * 1024)).toFixed(1)}MB). Please attach a smaller image.`
      );
      setTimeout(() => setAttachmentNotice(null), 5000);
    }

    const validFiles = imageFiles.filter((f) => f.size <= 8 * 1024 * 1024);
    if (validFiles.length === 0) return;

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          const newImg: AttachedImage = {
            id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name || "image.png",
            dataUrl,
            mimeType: file.type || "image/png",
            sizeBytes: file.size,
          };
          setAttachedImages((prev) => [...prev, newImg]);
          setAttachmentNotice(null);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (id: string) => {
    setAttachedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleRemoveCodeSnippet = (id: string) => {
    setAttachedCodeSnippets((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAttachCodeSnippet = (snippet: {
    title: string;
    language: string;
    code: string;
  }) => {
    const newSnippet: AttachedCodeSnippet = {
      id: `snip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: snippet.title,
      language: snippet.language,
      code: snippet.code,
    };
    setAttachedCodeSnippets((prev) => [...prev, newSnippet]);
  };

  const activeDemoCode = files["default.tsx"] ?? files["demo.tsx"] ?? "";

  // Real-time static guideline audit
  const auditResult = useMemo(() => {
    return auditComponentGuidelines(
      files["component.tsx"],
      activeDemoCode,
      files["index.css"],
      dependencies
    );
  }, [files, activeDemoCode, dependencies]);

  // Guidelines plan checklist
  const planTasks = useMemo<TaskItemProps[]>(() => {
    return auditResult.checks.map((chk) => ({
      id: chk.id,
      title: chk.title,
      description: chk.description,
      status: chk.passed
        ? "done"
        : chk.severity === "error"
        ? "error"
        : "pending",
    }));
  }, [auditResult]);

  const passedCount = planTasks.filter((t) => t.status === "done").length;
  const allPassed = passedCount === planTasks.length;

  const compLinesCount = useMemo(
    () => files["component.tsx"].split("\n").length,
    [files]
  );

  const failingChecks = useMemo(
    () => auditResult.checks.filter((c) => !c.passed),
    [auditResult]
  );

  const passPercentage = Math.round(
    (passedCount / Math.max(1, planTasks.length)) * 100
  );

  const hasCompilerError = !!compilerError;

  const demoLinesCount = useMemo(
    () => (activeDemoCode || "").split("\n").length,
    [activeDemoCode]
  );

  const currentModelObj =
    MODEL_OPTIONS.find((m) => m.id === aiModel) || MODEL_OPTIONS[0];
  const currentRoleObj =
    ROLE_OPTIONS.find((r) => r.id === aiRole) || ROLE_OPTIONS[0];
  const currentRefModeObj =
    REGISTRY_REF_MODE_OPTIONS.find((r) => r.id === registryRefMode) ||
    REGISTRY_REF_MODE_OPTIONS[0];
  const activeComponentMeta = userComponents?.[currentTemplateId];

  // Detailed 6-stage sequential execution pipeline reflecting the re-architected orchestrator
  const workingSteps = useMemo<ReasoningStep[]>(() => {
    const step1: ReasoningStep = {
      title: "Building Workspace AST & File Dossier",
      description: `Analyzing component.tsx (${compLinesCount}L), default.tsx (${demoLinesCount}L), props interface, and ${dependencies.length} package dependencies.`,
      detail: "AST Dossier",
      category: "ast",
      items: [
        `component.tsx (${compLinesCount}L)`,
        `default.tsx (${demoLinesCount}L)`,
        `${dependencies.length} NPM deps`,
      ],
      status: thinkingSeconds < 1 ? "running" : "done",
    };

    const step2: ReasoningStep = {
      title:
        pinnedRegistryRefs.length > 0
          ? "Loading Pinned Registry Visual References"
          : registryRefMode === "off"
          ? "Intent Routing (Local Workspace Only)"
          : "Selective Registry Visual Grounding",
      description:
        pinnedRegistryRefs.length > 0
          ? `Attaching ${pinnedRegistryRefs.length} pinned component preview image(s) and design tokens.`
          : registryRefMode === "off"
          ? "Registry visual grounding disabled; focusing strictly on active editor code."
          : "Evaluating visual design intent and selectively pulling matching registry preview.png & craft tokens.",
      detail:
        pinnedRegistryRefs.length > 0
          ? `${pinnedRegistryRefs.length} pinned`
          : currentRefModeObj.shortLabel,
      category: "reference",
      items:
        pinnedRegistryRefs.length > 0
          ? pinnedRegistryRefs.slice(0, 2)
          : [
              `Mode: ${currentRefModeObj.name}`,
              `Specialist: ${currentRoleObj.name}`,
            ],
      status:
        thinkingSeconds < 1
          ? "pending"
          : thinkingSeconds < 2
          ? "running"
          : "done",
    };

    const step3: ReasoningStep = {
      title: "Auditing 21st.dev & Accessibility Rules",
      description: `Checking cn() merging, dark/light tokens, native demo controls, and WCAG focus states (${passedCount}/${planTasks.length} passed).`,
      detail: `${auditResult.score}/100`,
      category: "audit",
      items: [
        `${passedCount}/${planTasks.length} rules verified`,
        preserveDesignSkill ? "UI Design Lock active" : "Visual edit unlocked",
      ],
      status:
        thinkingSeconds < 2
          ? "pending"
          : thinkingSeconds < 4
          ? "running"
          : "done",
    };

    const step4: ReasoningStep = {
      title:
        aiDepthMode === "deep"
          ? "Deep Blueprint & Code Synthesis"
          : "Fast Code Synthesis",
      description:
        aiDepthMode === "deep"
          ? "Drafting architecture blueprint, visual tokens, motion choreography, and complete compilable files."
          : "Generating focused, type-safe updates for modified workspace files.",
      detail: aiModel.replace("gemini-", ""),
      category: "synthesis",
      items: [
        `Engine: ${aiModel.replace("gemini-", "")}`,
        aiDepthMode === "deep" ? "Deep Architecture" : "Standard Fast",
        "Complete file synthesis",
      ],
      status:
        thinkingSeconds < 4
          ? "pending"
          : thinkingSeconds < 7
          ? "running"
          : "done",
    };

    const step5: ReasoningStep = {
      title: "Sucrase TSX Compile & Auto-Repair Check",
      description:
        "Compiling generated TypeScript/JSX in Sucrase, verifying compliance delta, and auto-repairing syntax if needed.",
      detail: "Compile Check",
      category: "verify",
      items: [
        "Sucrase TSX verification",
        "21st.dev score delta",
        autoApplyAiChanges
          ? "Auto-applying to canvas"
          : "Staging diff for approval",
      ],
      status: thinkingSeconds < 7 ? "pending" : "running",
    };

    return [step1, step2, step3, step4, step5];
  }, [
    thinkingSeconds,
    compLinesCount,
    demoLinesCount,
    dependencies.length,
    pinnedRegistryRefs,
    registryRefMode,
    currentRefModeObj.shortLabel,
    currentRefModeObj.name,
    preserveDesignSkill,
    passedCount,
    planTasks.length,
    auditResult.score,
    aiDepthMode,
    aiModel,
    currentRoleObj.name,
    autoApplyAiChanges,
  ]);

  const currentStepTitle = useMemo(() => {
    if (thinkingSeconds < 1) return "Building Workspace AST & File Dossier...";
    if (thinkingSeconds < 2)
      return pinnedRegistryRefs.length > 0
        ? "Loading pinned registry preview visuals..."
        : "Evaluating selective registry visual grounding...";
    if (thinkingSeconds < 4) return "Auditing 21st.dev & accessibility rules...";
    if (thinkingSeconds < 7)
      return aiDepthMode === "deep"
        ? "Synthesizing deep blueprint & production code..."
        : "Synthesizing code updates...";
    return "Running Sucrase TSX compile & verification check...";
  }, [thinkingSeconds, pinnedRegistryRefs.length, aiDepthMode]);

  // Timer for reasoning duration
  useEffect(() => {
    if (isAiThinking) {
      setThinkingSeconds(0);
      timerRef.current = setInterval(() => {
        setThinkingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isAiThinking]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [aiChatMessages, isAiThinking]);

  // Keep DOM width synced when aiPanelWidth or viewport mode changes
  useEffect(() => {
    if (panelRef.current && !isResizingRef.current) {
      if (isMobile) {
        panelRef.current.style.width = "100%";
      } else {
        const clamped = Math.max(
          340,
          Math.min(aiPanelWidth, Math.max(340, window.innerWidth - 48))
        );
        panelRef.current.style.width = `${clamped}px`;
      }
    }
  }, [aiPanelWidth, isMobile]);

  const handleResizeStart = (e: React.MouseEvent) => {
    if (isMobile) return;
    e.preventDefault();
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = panelRef.current
      ? panelRef.current.offsetWidth
      : aiPanelWidth;
    currentWidthRef.current = startWidthRef.current;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";

    // Disable iframe pointer events during drag so the canvas never intercepts mousemove/mouseup
    document.querySelectorAll("iframe").forEach((frame) => {
      frame.style.pointerEvents = "none";
    });
  };

  useEffect(() => {
    const restoreResizeState = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";

        // Restore iframe pointer events
        document.querySelectorAll("iframe").forEach((frame) => {
          frame.style.pointerEvents = "";
        });

        if (currentWidthRef.current) {
          setAiPanelWidth(currentWidthRef.current);
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const deltaX = startXRef.current - e.clientX;
      const maxAllowedWidth = Math.max(
        340,
        Math.min(800, window.innerWidth - 48)
      );
      const nextWidth = Math.max(
        340,
        Math.min(maxAllowedWidth, startWidthRef.current + deltaX)
      );
      currentWidthRef.current = nextWidth;

      if (panelRef.current) {
        panelRef.current.style.width = `${nextWidth}px`;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", restoreResizeState);
    window.addEventListener("blur", restoreResizeState);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", restoreResizeState);
      window.removeEventListener("blur", restoreResizeState);
      restoreResizeState();
    };
  }, [setAiPanelWidth]);

  // Stop in-flight AI request
  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setAiThinking(false);
    addTerminalLog({
      type: "info",
      message: "AI Copilot generation stopped by user.",
    });
  }, [setAiThinking, addTerminalLog]);

  const handleCopyMessage = useCallback((id: string, content: string) => {
    navigator.clipboard?.writeText(content);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 1800);
  }, []);

  const handleSaveAiCheckpoint = useCallback(
    (msgId: string, label: string) => {
      saveCheckpoint(label);
      setCheckpointSavedId(msgId);
      setTimeout(() => setCheckpointSavedId(null), 2200);
    },
    [saveCheckpoint]
  );

  // Submit AI Prompt
  const handleSubmitPrompt = async (
    customPrompt?: string,
    action: "chat" | "autofix" | "audit" = "chat",
    retryAttachments?: {
      images?: AttachedImage[];
      codeSnippets?: AttachedCodeSnippet[];
    }
  ) => {
    const latestState = useStudioStore.getState();
    if (latestState.isAiThinking) return;

    const text = (customPrompt ?? promptInput).trim();
    const currentImages = retryAttachments?.images
      ? [...retryAttachments.images]
      : [...attachedImages];
    const currentCodeSnippets = retryAttachments?.codeSnippets
      ? [...retryAttachments.codeSnippets]
      : [...attachedCodeSnippets];
    const hasAttachments =
      currentImages.length > 0 || currentCodeSnippets.length > 0;
    if (!text && !hasAttachments && action === "chat") return;

    if (!customPrompt && !retryAttachments) {
      setPromptInput("");
      setAttachedImages([]);
      setAttachedCodeSnippets([]);
    }

    const userMessageContent =
      text ||
      (action === "autofix"
        ? "Auto-fix any guideline violations and polish the component code."
        : action === "audit"
        ? "Perform a full standards and quality audit."
        : "Please review and incorporate the attached images and code references.");

    const requestTemplateId = latestState.currentTemplateId;
    const latestFiles = latestState.files;
    const latestDemoCode =
      latestFiles["default.tsx"] ?? latestFiles["demo.tsx"] ?? "";

    // Capture baseline snapshot before request
    const baselineSnapshot: Partial<Record<StudioFileName, string>> = {
      "component.tsx": latestFiles["component.tsx"],
      "default.tsx": latestDemoCode,
      "demo.tsx": latestDemoCode,
      "index.css": latestFiles["index.css"],
    };

    const historyPayload = latestState.aiChatMessages
      .filter(
        (m) =>
          !m.isError &&
          m.role !== "system" &&
          (!m.templateId || m.templateId === requestTemplateId)
      )
      .slice(-10)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    addAiChatMessage({
      role: "user",
      content: userMessageContent,
      templateId: requestTemplateId,
      actionType: action,
      attachments:
        currentImages.length > 0 || currentCodeSnippets.length > 0
          ? {
              images: currentImages.length > 0 ? currentImages : undefined,
              codeSnippets:
                currentCodeSnippets.length > 0
                  ? currentCodeSnippets
                  : undefined,
            }
          : undefined,
    });

    const controller = new AbortController();
    abortControllerRef.current = controller;
    requestStartTimeRef.current = Date.now();
    setAiThinking(true);

    try {
      const requestHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Studio-Client": "component-studio",
      };
      if (latestState.ownerSessionToken) {
        requestHeaders["X-Studio-Owner-Token"] = latestState.ownerSessionToken;
      }

      const currentComp = latestState.userComponents?.[requestTemplateId];
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: requestHeaders,
        signal: controller.signal,
        body: JSON.stringify({
          prompt: userMessageContent,
          action,
          componentCode: latestFiles["component.tsx"],
          defaultCode: latestDemoCode,
          demoCode: latestDemoCode,
          cssCode: latestFiles["index.css"],
          dependencies: latestState.dependencies,
          model: currentModelObj.id,
          role: latestState.aiRole || "copilot",
          depthMode: latestState.aiDepthMode || "deep",
          registryRefMode: latestState.registryRefMode || "auto",
          pinnedReferenceSlugs: latestState.pinnedRegistryRefs || [],
          currentComponentId: requestTemplateId,
          currentComponentSlug: currentComp?.repoSlug || requestTemplateId,
          currentComponentName: currentComp?.name,
          currentComponentCategory: currentComp?.category,
          preserveDesign: latestState.preserveDesignSkill,
          compilerError: latestState.compilerError || null,
          history: historyPayload,
          images: currentImages.map((img) => ({
            name: img.name,
            dataUrl: img.dataUrl,
            mimeType: img.mimeType,
          })),
          codeSnippets: currentCodeSnippets.map((cs) => ({
            title: cs.title,
            language: cs.language,
            code: cs.code,
          })),
        }),
      });

      const rawText = await res.text();
      type AiAssistantApiResponse = {
        error?: string;
        message?: string;
        modelUsed?: string;
        depthMode?: AiDepthMode;
        requiresOwnerAuth?: boolean;
        quotaExceeded?: boolean;
        rateLimited?: boolean;
        complianceScore?: number;
        addedDependencies?: string[];
        followUpSuggestions?: string[];
        blueprint?: AiBlueprintPlan;
        verification?: AiVerificationReport;
        registryReferences?: RegistryReferenceSummary[];
        referenceDecision?: RegistryReferenceDecision;
        dailyQuota?: {
          used: number;
          limit: number;
          remaining: number;
          resetAt?: string;
          resetAtUtc?: string;
        };
        reasoningSummary?: string;
        reasoningSteps?: Array<{
          title: string;
          description?: string;
          detail?: string;
          category?: AiReasoningStepCategory;
          items?: string[];
        }>;
        changedFiles?: Partial<{
          "component.tsx": string;
          "default.tsx": string;
          "demo.tsx": string;
          "index.css": string;
        }>;
      };
      let data: AiAssistantApiResponse = {};
      try {
        data = rawText ? (JSON.parse(rawText) as AiAssistantApiResponse) : {};
      } catch {
        data = {
          error: res.ok
            ? "Invalid response format from AI server."
            : `Server error (${res.status}). Please try again.`,
        };
      }

      const postFetchState = useStudioStore.getState();
      if (data.dailyQuota && postFetchState.securityTelemetry) {
        setSecurityTelemetry({
          ...postFetchState.securityTelemetry,
          dailyQuota: {
            used: data.dailyQuota.used,
            limit: data.dailyQuota.limit,
            remaining: data.dailyQuota.remaining,
            resetAt:
              data.dailyQuota.resetAt ||
              data.dailyQuota.resetAtUtc ||
              postFetchState.securityTelemetry.dailyQuota.resetAt,
          },
        });
      }

      const elapsedSeconds = Math.max(
        1,
        Math.round((Date.now() - requestStartTimeRef.current) / 1000)
      );

      const effectiveModelUsed = data.modelUsed || currentModelObj.id;

      if (!res.ok) {
        if (res.status === 401 || data.requiresOwnerAuth) {
          setOwnerAuthenticated(false);
          setSecurityModalOpen(true);
        }
        addAiChatMessage({
          role: "assistant",
          templateId: requestTemplateId,
          actionType: action,
          authorRole: currentRoleObj.name,
          modelUsed: effectiveModelUsed,
          isError: true,
          content:
            (typeof data.error === "string" && data.error) ||
            "Failed to process request with Gemini AI.",
        });
        return;
      }

      const changedFileNames = data.changedFiles
        ? Object.keys(data.changedFiles).filter(
            (k) =>
              typeof data.changedFiles?.[
                k as keyof typeof data.changedFiles
              ] === "string" &&
              data.changedFiles![k as keyof typeof data.changedFiles]!.trim()
                .length > 0
          )
        : [];
      const hasChangedFiles = changedFileNames.length > 0;

      const addedDeps = Array.isArray(data.addedDependencies)
        ? data.addedDependencies
            .map((d) => (typeof d === "string" ? d.trim() : ""))
            .filter(
              (d) => d.length > 0 && !latestState.dependencies.includes(d)
            )
        : [];

      const stillOnRequestTemplate =
        postFetchState.currentTemplateId === requestTemplateId;
      const shouldAutoApply =
        hasChangedFiles &&
        postFetchState.autoApplyAiChanges &&
        stillOnRequestTemplate;

      const recordedSteps: ReasoningStep[] =
        Array.isArray(data.reasoningSteps) && data.reasoningSteps.length > 0
          ? data.reasoningSteps.map((st) => ({
              title: st.title,
              description: st.description,
              detail: st.detail,
              category: st.category,
              items: st.items,
              status: "done" as const,
            }))
          : [
              {
                title: "Scanning workspace files & context",
                description: `Read component.tsx (${compLinesCount} lines), default.tsx (${demoLinesCount} lines), and ${dependencies.length} package dependencies.`,
                detail: "component.tsx",
                category: "context" as const,
                items: [
                  `Read component.tsx (${compLinesCount}L)`,
                  `Read default.tsx (${demoLinesCount}L)`,
                  `${dependencies.length} NPM deps loaded`,
                ],
                status: "done" as const,
              },
              {
                title: "Parsing React AST, Props & Hooks",
                description:
                  "Examined exported React 19 component signature, TypeScript Props interface, and DOM hierarchy.",
                detail: "AST & Props",
                category: "ast" as const,
                items: [
                  "Exported component AST",
                  `Role: ${currentRoleObj.name}`,
                  preserveDesignSkill
                    ? "UI Design Lock active"
                    : "Visual edit mode",
                ],
                status: "done" as const,
              },
              {
                title: "Evaluating styling & 21st.dev compliance",
                description: `Verified ${passedCount} of ${planTasks.length} static guideline checks including className merging and dark/light theme support.`,
                detail: `${data.complianceScore ?? auditResult.score}/100`,
                category: "audit" as const,
                items: [
                  `${passedCount}/${planTasks.length} checks passed`,
                  "Tailwind cn() merge",
                  "Dark/light contrast tokens",
                ],
                status: "done" as const,
              },
              {
                title: hasChangedFiles
                  ? "Synthesizing code modifications"
                  : "Formulating architectural response",
                description: hasChangedFiles
                  ? `Generated complete, compilable TypeScript updates for ${changedFileNames.join(", ")}.`
                  : "Synthesized technical guidance aligned with Component Studio Co-Pilot standards.",
                detail: effectiveModelUsed.replace("gemini-", ""),
                category: "synthesis" as const,
                items: hasChangedFiles
                  ? [
                      `Updated ${changedFileNames.join(", ")}`,
                      "TypeScript validation",
                      "Unified diff prepared",
                    ]
                  : [
                      `Model: ${effectiveModelUsed.replace("gemini-", "")}`,
                      "Architectural analysis",
                      "Zero unintended mutations",
                    ],
                status: "done" as const,
              },
            ];

      if (
        hasChangedFiles &&
        !recordedSteps.some((s) => s.category === "verify")
      ) {
        recordedSteps.push({
          title: shouldAutoApply
            ? "Auto-applied changes & verified diff"
            : "Prepared unified diff & sandbox check",
          description: shouldAutoApply
            ? `Applied updates to ${changedFileNames.join(", ")} on the live canvas with 1-click rollback support.`
            : `Computed line-by-line diff across ${changedFileNames.join(", ")} and staged changes for approval.`,
          detail: `${changedFileNames.length} file${changedFileNames.length === 1 ? "" : "s"}`,
          category: "verify",
          items: [
            ...changedFileNames.map((f) =>
              shouldAutoApply ? `Applied ${f}` : `Staged ${f}`
            ),
            "1-click Revert ready",
          ],
          status: "done",
        });
      }

      // Atomically apply files and any added dependencies if autoApplyAiChanges is enabled
      if (shouldAutoApply && data.changedFiles) {
        applyAiChanges(data.changedFiles, addedDeps);
        addTerminalLog({
          type: "system",
          message: `Copilot auto-applied updates to ${changedFileNames.join(", ")}.`,
        });
      }

      addAiChatMessage({
        role: "assistant",
        templateId: requestTemplateId,
        actionType: action,
        authorRole: currentRoleObj.name,
        modelUsed: effectiveModelUsed,
        depthMode: data.depthMode || latestState.aiDepthMode,
        content: data.message || "I've reviewed and updated your component.",
        reasoning: {
          durationSeconds: elapsedSeconds,
          steps: recordedSteps,
          summary: data.reasoningSummary,
        },
        blueprint: data.blueprint,
        verification: data.verification,
        registryReferences:
          Array.isArray(data.registryReferences) &&
          data.registryReferences.length > 0
            ? data.registryReferences
            : undefined,
        referenceDecision: data.referenceDecision,
        changedFiles: hasChangedFiles ? data.changedFiles : undefined,
        previousFiles: hasChangedFiles ? baselineSnapshot : undefined,
        approvalStatus: hasChangedFiles
          ? shouldAutoApply
            ? "approved"
            : "pending"
          : undefined,
        applied: shouldAutoApply,
        addedDependencies: addedDeps.length > 0 ? addedDeps : undefined,
        followUpSuggestions: Array.isArray(data.followUpSuggestions)
          ? data.followUpSuggestions.slice(0, 4)
          : undefined,
        complianceScore:
          typeof data.complianceScore === "number"
            ? data.complianceScore
            : undefined,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      const errorMsg = err instanceof Error ? err.message : String(err);
      addAiChatMessage({
        role: "assistant",
        templateId: requestTemplateId,
        actionType: action,
        authorRole: currentRoleObj.name,
        modelUsed: currentModelObj.id,
        isError: true,
        content: `Connection error: ${errorMsg}. Please verify your network connection and click Retry.`,
      });
    } finally {
      abortControllerRef.current = null;
      setAiThinking(false);
    }
  };

  // Retry a previous assistant response by removing both the assistant turn and its preceding user turn
  const handleRetryTurn = (assistantMsgIndex: number) => {
    if (isAiThinking) return;
    let precedingUserMsg: (typeof aiChatMessages)[number] | undefined;
    for (let i = assistantMsgIndex - 1; i >= 0; i--) {
      if (aiChatMessages[i]?.role === "user") {
        precedingUserMsg = aiChatMessages[i];
        break;
      }
    }
    const targetMsg = aiChatMessages[assistantMsgIndex];
    if (targetMsg) {
      if (targetMsg.applied && targetMsg.previousFiles) {
        revertAiMessageChanges(targetMsg.id);
      }
      deleteAiChatMessage(targetMsg.id);
    }
    if (precedingUserMsg) {
      deleteAiChatMessage(precedingUserMsg.id);
      void handleSubmitPrompt(
        precedingUserMsg.content,
        precedingUserMsg.actionType || targetMsg?.actionType || "chat",
        precedingUserMsg.attachments
      );
    }
  };

  const handleSlashCommandSelect = (cmd: SlashCommandItem) => {
    setPromptInput("");
    handleSubmitPrompt(cmd.prompt, cmd.action || "chat");
  };

  if (!isAiPanelOpen && !isMobile) return null;

  return (
    <div
      ref={panelRef}
      style={
        isMobile
          ? { width: "100%" }
          : { width: `${aiPanelWidth}px`, maxWidth: "calc(100vw - 48px)" }
      }
      className={cn(
        "@container relative flex h-full min-h-0 flex-col overflow-hidden bg-background text-foreground font-sans select-none z-20 shrink-0",
        isMobile ? "w-full border-0" : "border-l border-border"
      )}
    >
      {/* Resizable Left Edge Drag Handle (desktop only) */}
      {!isMobile && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize Copilot panel width"
          aria-valuenow={aiPanelWidth}
          aria-valuemin={340}
          aria-valuemax={800}
          tabIndex={0}
          onMouseDown={handleResizeStart}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 40 : 20;
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              setAiPanelWidth(Math.min(800, aiPanelWidth + step));
            } else if (e.key === "ArrowRight") {
              e.preventDefault();
              setAiPanelWidth(Math.max(340, aiPanelWidth - step));
            }
          }}
          className="absolute -left-1 top-0 bottom-0 w-2 cursor-ew-resize touch-none hover:bg-primary/20 active:bg-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors z-30 group"
          title="Drag left/right or use arrow keys to resize Copilot panel"
        >
          <div className="h-full w-px bg-border group-hover:bg-primary transition-colors mx-auto" />
        </div>
      )}

      <AiPanelHeader
        aiModel={aiModel}
        aiRole={aiRole}
        aiDepthMode={aiDepthMode}
        registryRefMode={registryRefMode}
        pinnedRefsCount={pinnedRegistryRefs.length}
        currentModelObj={currentModelObj}
        currentRoleObj={currentRoleObj}
        autoApplyAiChanges={autoApplyAiChanges}
        preserveDesignSkill={preserveDesignSkill}
        passedCount={passedCount}
        totalChecksCount={planTasks.length}
        allPassed={allPassed}
        showGuidelinesDrawer={showGuidelinesDrawer}
        isOwnerAuthenticated={isOwnerAuthenticated}
        securityTelemetry={securityTelemetry}
        onSelectModel={setAiModel}
        onSelectRole={setAiRole}
        onSelectDepthMode={setAiDepthMode}
        onSelectRegistryRefMode={setRegistryRefMode}
        onOpenRegistryPicker={() => setIsRegistryPickerOpen(true)}
        onToggleAutoApply={toggleAutoApplyAiChanges}
        onTogglePreserveDesign={togglePreserveDesignSkill}
        onToggleGuidelinesDrawer={() =>
          setShowGuidelinesDrawer((prev) => !prev)
        }
        onClearChat={clearAiChat}
        onClosePanel={() => {
          setAiPanelOpen(false);
          onClose?.();
        }}
        onOpenSecurityModal={() => setSecurityModalOpen(true)}
      />

      {/* Collapsible Guidelines Drawer Banner */}
      {showGuidelinesDrawer && (
        <div className="border-b border-border bg-card/70 p-2.5 @[420px]:p-3 select-none font-sans animate-in slide-in-from-top-1 duration-150 max-h-[38vh] overflow-y-auto">
          <Plan
            title="21st.dev Component Standards"
            tasks={planTasks}
            defaultOpen={true}
            onAutoFix={() =>
              handleSubmitPrompt(
                "Audit component.tsx, default.tsx, and index.css against all 21st.dev guidelines and auto-fix all missing requirements (className forwarding, cn(), props interface, use client) while keeping the existing UI design, layout, colors, and styling 100% unchanged.",
                "autofix"
              )
            }
          />
        </div>
      )}

      {/* Main Multi-Turn Chat Thread */}
      <div
        ref={chatScrollRef}
        role="log"
        aria-live="polite"
        aria-label="Copilot conversation history"
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 @[420px]:p-4 space-y-4 select-text font-sans scroll-smooth"
      >
        {/* Empty State / Welcome Screen */}
        {aiChatMessages.length === 0 ? (
          <AiWelcomeScreen
            aiRole={aiRole}
            aiDepthMode={aiDepthMode}
            registryRefMode={registryRefMode}
            currentRoleObj={currentRoleObj}
            compLinesCount={compLinesCount}
            hasCompilerError={hasCompilerError}
            compilerError={compilerError}
            allPassed={allPassed}
            passPercentage={passPercentage}
            failingChecks={failingChecks}
            onSelectRole={setAiRole}
            onOpenRegistryPicker={() => setIsRegistryPickerOpen(true)}
            onSubmitPrompt={(prompt, action) =>
              handleSubmitPrompt(prompt, action)
            }
          />
        ) : null}

        {/* Multi-Turn Messages Stream */}
        {aiChatMessages.map((msg, idx) => (
          <AiMessageItem
            key={msg.id}
            msg={msg}
            index={idx}
            isLatestMessage={idx === aiChatMessages.length - 1}
            isAiThinking={isAiThinking}
            aiModel={aiModel}
            files={files}
            activeDemoCode={activeDemoCode}
            copiedMessageId={copiedMessageId}
            checkpointSavedId={checkpointSavedId}
            onPreviewImage={setPreviewImage}
            onPreviewSnippet={setPreviewSnippet}
            onApproveChanges={approveAiMessageChanges}
            onRejectChanges={rejectAiMessageChanges}
            onRevertChanges={revertAiMessageChanges}
            onSaveCheckpoint={handleSaveAiCheckpoint}
            onSubmitFollowUp={(suggestion) =>
              handleSubmitPrompt(suggestion, "chat")
            }
            onCopyMessage={handleCopyMessage}
            onRetryTurn={handleRetryTurn}
            onDeleteMessage={deleteAiChatMessage}
          />
        ))}

        {/* Real-time Streaming Assistant Turn */}
        {isAiThinking && (
          <Message align="start" className="pt-1.5">
            <MessageAvatar>
              <Avatar className="size-6 rounded-none border border-border bg-foreground text-background">
                <AvatarFallback className="bg-foreground text-background font-semibold rounded-none">
                  <Code2 className="size-3" />
                </AvatarFallback>
              </Avatar>
            </MessageAvatar>

            <MessageContent align="start" className="w-full min-w-0">
              <MessageHeader className="flex-wrap gap-1.5">
                <span className="font-semibold text-foreground text-xs font-sans">
                  {currentRoleObj.name}
                </span>
                <span className="text-[10px] text-muted-foreground/50">•</span>
                <Badge
                  variant="outline"
                  className="rounded-none text-[9px] py-0 px-1.5 font-normal text-muted-foreground font-mono border-border/70 bg-background/60"
                >
                  {aiModel.replace("gemini-", "")}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-none text-[9px] py-0 px-1.5 font-medium text-amber-600 dark:text-amber-400 font-sans border-amber-500/35 bg-amber-500/10"
                >
                  Working •{" "}
                  {workingSteps.filter((s) => s.status === "done").length}/
                  {workingSteps.length}
                </Badge>
              </MessageHeader>

              <Reasoning
                isStreaming={true}
                durationSeconds={thinkingSeconds}
                activeStep={currentStepTitle}
                steps={workingSteps}
                summary={`Executing 5-stage analysis & code synthesis with ${currentModelObj.name} (${currentRoleObj.name}).`}
              />
            </MessageContent>
          </Message>
        )}
      </div>

      {/* Bottom Area: Command-Grade Prompt Input with Attachments & Slash Commands */}
      <div className="studio-toolbar-surface p-2.5 @[420px]:p-3 border-t border-border bg-card/40 select-none shrink-0">
        {attachmentNotice && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-none border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-600 dark:text-amber-400 font-sans animate-in fade-in duration-150">
            <div className="flex items-center gap-1.5 min-w-0">
              <AlertCircle className="size-3.5 shrink-0" />
              <span className="truncate">{attachmentNotice}</span>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setAttachmentNotice(null)}
              className="size-5 rounded-none p-0 text-amber-600 dark:text-amber-400 hover:bg-transparent shrink-0"
            >
              <X className="size-3" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
        )}

        <PromptInput
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          onSubmit={() => handleSubmitPrompt()}
          onStop={handleStopGeneration}
          onSlashCommandSelect={handleSlashCommandSelect}
          isLoading={isAiThinking}
          placeholder="Ask Copilot or type / for commands (/inspire, /architect)..."
          attachedImages={attachedImages}
          onRemoveImage={handleRemoveImage}
          onPreviewImage={(img) =>
            setPreviewImage({ url: img.dataUrl, name: img.name })
          }
          attachedCodeSnippets={attachedCodeSnippets}
          onRemoveCodeSnippet={handleRemoveCodeSnippet}
          onPreviewCodeSnippet={(snip) => setPreviewSnippet(snip)}
          onAttachImageClick={() => fileInputRef.current?.click()}
          onAttachCodeClick={() => setIsAttachCodeDialogOpen(true)}
          onImageFilesPasted={handleImageFilesAdded}
          onOpenRegistryRefsClick={() => setIsRegistryPickerOpen(true)}
          registryRefLabel={
            pinnedRegistryRefs.length > 0
              ? `${pinnedRegistryRefs.length} Pinned`
              : currentRefModeObj.shortLabel
          }
          registryRefActive={
            pinnedRegistryRefs.length > 0 || registryRefMode !== "off"
          }
          pinnedRegistryBar={
            pinnedRegistryRefs.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-1.5 border-b border-border/50 bg-muted/15 font-sans">
                <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  <Pin className="size-2.5" />
                  Pinned Refs:
                </span>
                {pinnedRegistryRefs.map((slug) => (
                  <span
                    key={slug}
                    className="inline-flex items-center gap-1 border border-border bg-background px-1.5 py-0.5 text-[10px] font-mono text-foreground"
                  >
                    <span className="truncate max-w-[120px]">{slug}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => togglePinnedRegistryRef(slug)}
                      className="size-3.5 p-0 rounded-none text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-2.5" />
                      <span className="sr-only">Unpin {slug}</span>
                    </Button>
                  </span>
                ))}
              </div>
            ) : null
          }
          modelBadge={
            <div className="flex items-center gap-1 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setAiDepthMode(aiDepthMode === "deep" ? "standard" : "deep")
                    }
                    className={cn(
                      "h-5 gap-1 px-1.5 text-[10px] font-normal font-sans rounded-none transition-colors shrink-0",
                      aiDepthMode === "deep"
                        ? "border-primary/40 bg-primary/10 text-foreground hover:bg-primary/15"
                        : "border-border/80 bg-background/80 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Brain className="size-2.5 shrink-0" />
                    <span className="hidden @[400px]:inline">
                      {aiDepthMode === "deep" ? "Deep" : "Fast"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="font-sans text-xs">
                  {aiDepthMode === "deep"
                    ? "Deep Architecture ON: High-depth reasoning, design blueprint & compile self-repair"
                    : "Standard Fast: Concise single-pass edits (click for Deep Architecture)"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleAutoApplyAiChanges}
                    className={cn(
                      "h-5 gap-1 px-1.5 text-[10px] font-normal font-sans rounded-none transition-colors shrink-0",
                      autoApplyAiChanges
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15"
                        : "border-border/80 bg-background/80 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Play className="size-2.5 shrink-0" />
                    <span className="hidden @[380px]:inline">
                      {autoApplyAiChanges ? "Auto-Apply" : "Stage Only"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="font-sans text-xs">
                  {autoApplyAiChanges
                    ? "Auto-Apply ON: Code edits apply directly to the live preview canvas with 1-click Revert"
                    : "Stage Only: Code edits wait for manual Approve & Apply"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={togglePreserveDesignSkill}
                    className={cn(
                      "h-5 gap-1 px-1.5 text-[10px] font-normal font-sans rounded-none transition-colors shrink-0",
                      preserveDesignSkill
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15"
                        : "border-border/80 bg-background/80 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {preserveDesignSkill ? (
                      <Lock className="size-2.5 shrink-0" />
                    ) : (
                      <Unlock className="size-2.5 shrink-0" />
                    )}
                    <span className="hidden @[360px]:inline">
                      {preserveDesignSkill ? "UI Locked" : "UI Editable"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="font-sans text-xs">
                  {preserveDesignSkill
                    ? "Preserve UI Skill Active: Code edits & fixes will NOT alter existing design or layout (click to unlock)"
                    : "UI Editable: Copilot may modify visual styling when editing (click to lock UI design)"}
                </TooltipContent>
              </Tooltip>
            </div>
          }
        />

        {/* Hidden File Input for Image Upload */}
        <input
          ref={fileInputRef}
          type="file"
          aria-label="Upload image attachment"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleImageFilesAdded(Array.from(e.target.files));
              e.target.value = "";
            }
          }}
        />

        {/* Registry Visual Reference Grounding Picker Modal */}
        <RegistryReferencePicker
          open={isRegistryPickerOpen}
          onOpenChange={setIsRegistryPickerOpen}
          mode={registryRefMode}
          pinnedSlugs={pinnedRegistryRefs}
          currentSlug={activeComponentMeta?.repoSlug || currentTemplateId}
          onSelectMode={setRegistryRefMode}
          onTogglePin={togglePinnedRegistryRef}
          onClearPins={clearPinnedRegistryRefs}
        />

        {/* Attach Code Snippet Modal */}
        <AttachCodeDialog
          open={isAttachCodeDialogOpen}
          onOpenChange={setIsAttachCodeDialogOpen}
          onAttach={handleAttachCodeSnippet}
          currentDemoCode={activeDemoCode}
          currentCssCode={files["index.css"]}
        />

        {/* Full Image Preview Zoom Modal */}
        <ImagePreviewDialog
          image={previewImage}
          onClose={() => setPreviewImage(null)}
        />

        {/* Code Snippet Preview Modal */}
        <CodePreviewDialog
          snippet={previewSnippet}
          onClose={() => setPreviewSnippet(null)}
        />
      </div>
    </div>
  );
}
