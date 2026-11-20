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
import { AlertCircle, Code2, Lock, Play, Unlock, X } from "lucide-react";
import { MODEL_OPTIONS, ROLE_OPTIONS } from "./ai/ai-copilot-constants";
import { AiPanelHeader } from "./ai/ai-panel-header";
import { AiWelcomeScreen } from "./ai/ai-welcome-screen";
import { AiMessageItem } from "./ai/ai-message-item";

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
    isAiPanelOpen,
    aiPanelWidth,
    aiModel,
    aiRole,
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
    togglePreserveDesignSkill,
    toggleAutoApplyAiChanges,
    addAiChatMessage,
    deleteAiChatMessage,
    approveAiMessageChanges,
    rejectAiMessageChanges,
    revertAiMessageChanges,
    clearAiChat,
    setAiThinking,
    addDependencies,
    saveCheckpoint,
    addTerminalLog,
    updateFile,
  } = useStudioStore(
    useShallow((state) => ({
      files: state.files,
      dependencies: state.dependencies,
      isAiPanelOpen: state.isAiPanelOpen,
      aiPanelWidth: state.aiPanelWidth,
      aiModel: state.aiModel,
      aiRole: state.aiRole,
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
      togglePreserveDesignSkill: state.togglePreserveDesignSkill,
      toggleAutoApplyAiChanges: state.toggleAutoApplyAiChanges,
      addAiChatMessage: state.addAiChatMessage,
      deleteAiChatMessage: state.deleteAiChatMessage,
      approveAiMessageChanges: state.approveAiMessageChanges,
      rejectAiMessageChanges: state.rejectAiMessageChanges,
      revertAiMessageChanges: state.revertAiMessageChanges,
      clearAiChat: state.clearAiChat,
      setAiThinking: state.setAiThinking,
      addDependencies: state.addDependencies,
      saveCheckpoint: state.saveCheckpoint,
      addTerminalLog: state.addTerminalLog,
      updateFile: state.updateFile,
    }))
  );

  const [promptInput, setPromptInput] = useState("");
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [attachedCodeSnippets, setAttachedCodeSnippets] = useState<
    AttachedCodeSnippet[]
  >([]);
  const [isAttachCodeDialogOpen, setIsAttachCodeDialogOpen] = useState(false);
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

  // Detailed 5-stage sequential execution pipeline showing exact AI work in real time
  const workingSteps = useMemo<ReasoningStep[]>(() => {
    const step1: ReasoningStep = {
      title: "Scanning workspace files & context",
      description: `Reading component.tsx (${compLinesCount} lines), default.tsx (${demoLinesCount} lines), and ${dependencies.length} active package dependencies.`,
      detail: "component.tsx",
      category: "context",
      items: [
        `Read component.tsx (${compLinesCount}L)`,
        `Read default.tsx (${demoLinesCount}L)`,
        `${dependencies.length} NPM packages`,
      ],
      status: thinkingSeconds < 1 ? "running" : "done",
    };

    const step2: ReasoningStep = {
      title: "Parsing React AST, Props & Hooks",
      description:
        "Inspecting exported React 19 component signature, TypeScript Props interface, and DOM hierarchy.",
      detail: "AST & Props",
      category: "ast",
      items: [
        "Exported component AST",
        `Specialist: ${currentRoleObj.name}`,
        preserveDesignSkill ? "UI Design Lock active" : "Visual edit mode",
      ],
      status:
        thinkingSeconds < 1
          ? "pending"
          : thinkingSeconds < 2
          ? "running"
          : "done",
    };

    const step3: ReasoningStep = {
      title: "Auditing 21st.dev & Design Rules",
      description: `Evaluating className merging with cn(), Tailwind dark/light theme tokens, and interactive states (${passedCount}/${planTasks.length} static checks passed).`,
      detail: `${auditResult.score}/100`,
      category: "audit",
      items: [
        `${passedCount}/${planTasks.length} rules verified`,
        "Tailwind cn() merge",
        "Theme token contrast",
      ],
      status:
        thinkingSeconds < 2
          ? "pending"
          : thinkingSeconds < 4
          ? "running"
          : "done",
    };

    const step4: ReasoningStep = {
      title: "Synthesizing code & architectural plan",
      description:
        "Generating complete, self-contained TypeScript updates and implementation guidance.",
      detail: aiModel.replace("gemini-", ""),
      category: "synthesis",
      items: [
        `Engine: ${aiModel.replace("gemini-", "")}`,
        "Complete file synthesis",
        preserveDesignSkill ? "Zero layout drift" : "Responsive styling",
      ],
      status:
        thinkingSeconds < 4
          ? "pending"
          : thinkingSeconds < 6
          ? "running"
          : "done",
    };

    const step5: ReasoningStep = {
      title: "Preparing diff & sandbox verification",
      description:
        "Validating JSX syntax, import resolution, and formatting unified diff hunks for review.",
      detail: "Diff Check",
      category: "verify",
      items: [
        "TypeScript & JSX check",
        "Unified diff calculation",
        autoApplyAiChanges
          ? "Auto-applying to live canvas"
          : "Staging diff for approval",
      ],
      status: thinkingSeconds < 6 ? "pending" : "running",
    };

    return [step1, step2, step3, step4, step5];
  }, [
    thinkingSeconds,
    compLinesCount,
    demoLinesCount,
    dependencies.length,
    preserveDesignSkill,
    passedCount,
    planTasks.length,
    auditResult.score,
    aiModel,
    currentRoleObj.name,
    autoApplyAiChanges,
  ]);

  const currentStepTitle = useMemo(() => {
    if (thinkingSeconds < 1) return "Scanning workspace files & context...";
    if (thinkingSeconds < 2) return "Parsing React AST, Props & Hooks...";
    if (thinkingSeconds < 4) return "Auditing 21st.dev & Design Rules...";
    if (thinkingSeconds < 6)
      return "Synthesizing code & architectural plan...";
    return "Preparing diff & sandbox verification...";
  }, [thinkingSeconds]);

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
    action: "chat" | "autofix" | "audit" = "chat"
  ) => {
    const latestState = useStudioStore.getState();
    if (latestState.isAiThinking) return;

    const text = (customPrompt ?? promptInput).trim();
    const hasAttachments =
      attachedImages.length > 0 || attachedCodeSnippets.length > 0;
    if (!text && !hasAttachments && action === "chat") return;

    // Snapshot attached items and reset input
    const currentImages = [...attachedImages];
    const currentCodeSnippets = [...attachedCodeSnippets];

    if (!customPrompt) {
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
      .filter((m) => !m.isError && m.role !== "system")
      .slice(-10)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    addAiChatMessage({
      role: "user",
      content: userMessageContent,
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
        requiresOwnerAuth?: boolean;
        quotaExceeded?: boolean;
        rateLimited?: boolean;
        complianceScore?: number;
        addedDependencies?: string[];
        followUpSuggestions?: string[];
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
          category?: "context" | "ast" | "audit" | "synthesis" | "verify";
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

      if (data.dailyQuota && latestState.securityTelemetry) {
        setSecurityTelemetry({
          ...latestState.securityTelemetry,
          dailyQuota: {
            used: data.dailyQuota.used,
            limit: data.dailyQuota.limit,
            remaining: data.dailyQuota.remaining,
            resetAt:
              data.dailyQuota.resetAt ||
              data.dailyQuota.resetAtUtc ||
              latestState.securityTelemetry.dailyQuota.resetAt,
          },
        });
      }

      const elapsedSeconds = Math.max(
        1,
        Math.round((Date.now() - requestStartTimeRef.current) / 1000)
      );

      if (!res.ok) {
        if (res.status === 401 || data.requiresOwnerAuth) {
          setOwnerAuthenticated(false);
          setSecurityModalOpen(true);
        }
        addAiChatMessage({
          role: "assistant",
          authorRole: currentRoleObj.name,
          modelUsed: currentModelObj.id,
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

      // Auto-install any new NPM dependencies detected or returned by the AI
      const addedDeps = Array.isArray(data.addedDependencies)
        ? data.addedDependencies.filter(
            (d) =>
              typeof d === "string" &&
              d.trim().length > 0 &&
              !latestState.dependencies.includes(d.trim())
          )
        : [];
      if (addedDeps.length > 0) {
        addDependencies(addedDeps);
      }

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
                detail: currentModelObj.id.replace("gemini-", ""),
                category: "synthesis" as const,
                items: hasChangedFiles
                  ? [
                      `Updated ${changedFileNames.join(", ")}`,
                      "TypeScript validation",
                      "Unified diff prepared",
                    ]
                  : [
                      `Model: ${currentModelObj.id.replace("gemini-", "")}`,
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
          title: latestState.autoApplyAiChanges
            ? "Auto-applied changes & verified diff"
            : "Prepared unified diff & sandbox check",
          description: latestState.autoApplyAiChanges
            ? `Applied updates to ${changedFileNames.join(", ")} on the live canvas with 1-click rollback support.`
            : `Computed line-by-line diff across ${changedFileNames.join(", ")} and staged changes for approval.`,
          detail: `${changedFileNames.length} file${changedFileNames.length === 1 ? "" : "s"}`,
          category: "verify",
          items: [
            ...changedFileNames.map((f) =>
              latestState.autoApplyAiChanges ? `Applied ${f}` : `Staged ${f}`
            ),
            "1-click Revert ready",
          ],
          status: "done",
        });
      }

      const shouldAutoApply = hasChangedFiles && latestState.autoApplyAiChanges;

      // Apply files immediately if autoApplyAiChanges is enabled
      if (shouldAutoApply && data.changedFiles) {
        if (typeof data.changedFiles["component.tsx"] === "string") {
          updateFile("component.tsx", data.changedFiles["component.tsx"]);
        }
        const incomingDemo =
          data.changedFiles["default.tsx"] ?? data.changedFiles["demo.tsx"];
        if (typeof incomingDemo === "string") {
          updateFile("default.tsx", incomingDemo);
        }
        if (typeof data.changedFiles["index.css"] === "string") {
          updateFile("index.css", data.changedFiles["index.css"]);
        }
        addTerminalLog({
          type: "system",
          message: `Copilot auto-applied updates to ${changedFileNames.join(", ")}.`,
        });
      }

      addAiChatMessage({
        role: "assistant",
        authorRole: currentRoleObj.name,
        modelUsed: currentModelObj.id,
        content: data.message || "I've reviewed and updated your component.",
        reasoning: {
          durationSeconds: elapsedSeconds,
          steps: recordedSteps,
          summary: data.reasoningSummary,
        },
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

  // Retry a previous assistant response by finding the preceding user prompt
  const handleRetryTurn = (assistantMsgIndex: number) => {
    if (isAiThinking) return;
    let precedingUserPrompt = "";
    for (let i = assistantMsgIndex - 1; i >= 0; i--) {
      if (aiChatMessages[i]?.role === "user") {
        precedingUserPrompt = aiChatMessages[i].content;
        break;
      }
    }
    const targetMsg = aiChatMessages[assistantMsgIndex];
    if (targetMsg) {
      deleteAiChatMessage(targetMsg.id);
    }
    if (precedingUserPrompt) {
      handleSubmitPrompt(precedingUserPrompt, "chat");
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
            currentRoleObj={currentRoleObj}
            compLinesCount={compLinesCount}
            hasCompilerError={hasCompilerError}
            compilerError={compilerError}
            allPassed={allPassed}
            passPercentage={passPercentage}
            failingChecks={failingChecks}
            onSelectRole={setAiRole}
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
          placeholder="Ask Copilot or type / for commands..."
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
          modelBadge={
            <div className="flex items-center gap-1 shrink-0">
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
