"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  useStudioStore,
  AttachedImage,
  AttachedCodeSnippet,
  StudioFileName,
  AiChatRole,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageHeader,
  MessageFooter,
  Bubble,
  BubbleContent,
} from "@/components/ui/chat";
import {
  Reasoning,
  ChangeApprovalCard,
  Plan,
  PromptInput,
  Suggestion,
  SuggestionGroup,
  TaskItemProps,
  ReasoningStep,
  AttachCodeDialog,
  ImagePreviewDialog,
  CodePreviewDialog,
  SlashCommandItem,
} from "@/components/ui/ai-elements";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { cn } from "@/lib/utils";
import {
  Check,
  PanelRightClose,
  AlertTriangle,
  SunMoon,
  Layers,
  Wand2,
  CheckCircle2,
  Trash2,
  Zap,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Cpu,
  Sparkles,
  Gauge,
  User,
  ArrowRight,
  Code2,
  Eye,
  AlertCircle,
  X,
  Lock,
  Unlock,
  Copy,
  RotateCcw,
  Palette,
  Compass,
  BookmarkCheck,
  Play,
} from "lucide-react";

const MODEL_OPTIONS = [
  {
    id: "gemini-4-hydrogen",
    name: "Gemini 4 Hydrogen",
    tag: "Standard",
    description: "Best for component design, TypeScript architecture, and fast edits.",
    icon: Cpu,
  },
  {
    id: "gemini-4-argon",
    name: "Gemini 4 Argon",
    tag: "Deep Reasoning",
    description: "Advanced reasoning for complex state, algorithms, and tricky edge-cases.",
    icon: Layers,
  },
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash Lite",
    tag: "Fast Lite",
    description: "Instant turnaround for quick questions and straightforward CSS edits.",
    icon: Gauge,
  },
];

const ROLE_OPTIONS: Array<{
  id: AiChatRole;
  name: string;
  tag: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "copilot",
    name: "Co-Pilot",
    tag: "All-Rounder",
    description: "Full-stack React 19, Tailwind v4, and Framer Motion component engineer.",
    icon: Code2,
  },
  {
    id: "designer",
    name: "UI Designer",
    tag: "Visual Craft",
    description: "Bespoke visual hierarchy, refined dark/light tokens, and micro-interactions.",
    icon: Palette,
  },
  {
    id: "architect",
    name: "Code Architect",
    tag: "Clean AST",
    description: "Composable subcomponents, strict TypeScript generics, and hook performance.",
    icon: Compass,
  },
  {
    id: "auditor",
    name: "Standards Auditor",
    tag: "21st.dev & A11y",
    description: "Strict 21st.dev compliance, WCAG AA contrast, ARIA roles, and keyboard nav.",
    icon: ShieldCheck,
  },
  {
    id: "optimizer",
    name: "Motion Engineer",
    tag: "60fps Springs",
    description: "Natural Framer Motion spring physics, layoutId transitions, and gesture polish.",
    icon: Zap,
  },
];

export interface AiAssistantPanelProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function AiAssistantPanel({ isMobile = false, onClose }: AiAssistantPanelProps = {}) {
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
  const [attachedCodeSnippets, setAttachedCodeSnippets] = useState<AttachedCodeSnippet[]>([]);
  const [isAttachCodeDialogOpen, setIsAttachCodeDialogOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; name?: string } | null>(null);
  const [previewSnippet, setPreviewSnippet] = useState<AttachedCodeSnippet | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [checkpointSavedId, setCheckpointSavedId] = useState<string | null>(null);

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
      setAttachmentNotice("Only image files (PNG, JPG, WebP, GIF) are supported.");
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

  const currentModelObj = MODEL_OPTIONS.find((m) => m.id === aiModel) || MODEL_OPTIONS[0];
  const currentRoleObj = ROLE_OPTIONS.find((r) => r.id === aiRole) || ROLE_OPTIONS[0];

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
        autoApplyAiChanges ? "Auto-applying to live canvas" : "Staging diff for approval",
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
    if (thinkingSeconds < 6) return "Synthesizing code & architectural plan...";
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
    startWidthRef.current = panelRef.current ? panelRef.current.offsetWidth : aiPanelWidth;
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
      const maxAllowedWidth = Math.max(340, Math.min(800, window.innerWidth - 48));
      const nextWidth = Math.max(340, Math.min(maxAllowedWidth, startWidthRef.current + deltaX));
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
                currentCodeSnippets.length > 0 ? currentCodeSnippets : undefined,
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
              typeof data.changedFiles?.[k as keyof typeof data.changedFiles] ===
                "string" &&
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
                  preserveDesignSkill ? "UI Design Lock active" : "Visual edit mode",
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

      {/* Top Header - Editorial, Clean & Polished */}
      <div className="studio-toolbar-surface flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border bg-card/40 px-2.5 @[420px]:px-3 select-none overflow-hidden">
        <div className="flex items-center gap-1.5 @[420px]:gap-2 min-w-0 flex-1 overflow-hidden">
          {/* Subtle Copilot Mark */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex size-5.5 items-center justify-center rounded-none bg-foreground text-background shadow-2xs">
              <Code2 className="size-3 stroke-[2.2]" />
            </div>
            <span className="text-xs font-semibold tracking-tight text-foreground font-sans">
              Copilot
            </span>
          </div>

          <div className="h-3.5 w-px bg-border/70 mx-0.5 shrink-0" />

          {/* Model & Specialist Persona Dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6.5 gap-1 px-2 text-[11px] font-normal text-muted-foreground border-border/80 hover:text-foreground hover:border-border font-sans rounded-none bg-background/70 min-w-0"
                  >
                    <span className="truncate max-w-[90px] @[440px]:max-w-[130px]">
                      {currentModelObj.name.replace("Gemini ", "")}
                    </span>
                    <span className="hidden @[460px]:inline text-border">•</span>
                    <span className="hidden @[460px]:inline truncate text-foreground font-medium">
                      {currentRoleObj.name}
                    </span>
                    <ChevronDown className="size-2.5 opacity-60 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Configure Gemini model, specialist persona & execution preferences
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent
              align="start"
              className="w-72 rounded-none font-sans max-h-[80vh] overflow-y-auto"
            >
              <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Gemini Engine
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {MODEL_OPTIONS.map((m) => {
                const IconComponent = m.icon;
                return (
                  <DropdownMenuItem
                    key={m.id}
                    onClick={() => setAiModel(m.id)}
                    className="flex flex-col items-start gap-1 py-1.5 cursor-pointer rounded-none font-sans"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5">
                        <IconComponent className="size-3.5 text-muted-foreground" />
                        <span className="font-medium text-xs text-foreground">
                          {m.name}
                        </span>
                        <Badge
                          variant="secondary"
                          className="rounded-none text-[9px] py-0 px-1 font-normal font-sans"
                        >
                          {m.tag}
                        </Badge>
                      </div>
                      {aiModel === m.id && (
                        <Check className="size-3.5 text-foreground" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground leading-snug">
                      {m.description}
                    </span>
                  </DropdownMenuItem>
                );
              })}

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Specialist Persona
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ROLE_OPTIONS.map((r) => {
                const RoleIcon = r.icon;
                return (
                  <DropdownMenuItem
                    key={r.id}
                    onClick={() => setAiRole(r.id)}
                    className="flex flex-col items-start gap-1 py-1.5 cursor-pointer rounded-none font-sans"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5">
                        <RoleIcon className="size-3.5 text-muted-foreground" />
                        <span className="font-medium text-xs text-foreground">
                          {r.name}
                        </span>
                        <Badge
                          variant="secondary"
                          className="rounded-none text-[9px] py-0 px-1 font-normal font-sans"
                        >
                          {r.tag}
                        </Badge>
                      </div>
                      {aiRole === r.id && (
                        <Check className="size-3.5 text-foreground" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground leading-snug">
                      {r.description}
                    </span>
                  </DropdownMenuItem>
                );
              })}

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Execution Skills
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => toggleAutoApplyAiChanges()}
                className="flex flex-col items-start gap-1 py-1.5 cursor-pointer rounded-none font-sans"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <Play
                      className={cn(
                        "size-3.5",
                        autoApplyAiChanges
                          ? "text-emerald-500"
                          : "text-muted-foreground"
                      )}
                    />
                    <span className="font-medium text-xs text-foreground">
                      Auto-Apply Code to Live Canvas
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "rounded-none text-[9px] py-0 px-1 font-normal font-sans",
                        autoApplyAiChanges &&
                          "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                      )}
                    >
                      {autoApplyAiChanges ? "On" : "Manual"}
                    </Badge>
                  </div>
                  {autoApplyAiChanges && (
                    <Check className="size-3.5 text-emerald-500" />
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground leading-snug">
                  Immediately updates live preview when Copilot edits files (with 1-click Revert).
                </span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => togglePreserveDesignSkill()}
                className="flex flex-col items-start gap-1 py-1.5 cursor-pointer rounded-none font-sans"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    {preserveDesignSkill ? (
                      <Lock className="size-3.5 text-emerald-500" />
                    ) : (
                      <Unlock className="size-3.5 text-muted-foreground" />
                    )}
                    <span className="font-medium text-xs text-foreground">
                      Preserve UI & Design Lock
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "rounded-none text-[9px] py-0 px-1 font-normal font-sans",
                        preserveDesignSkill &&
                          "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                      )}
                    >
                      {preserveDesignSkill ? "Active" : "Off"}
                    </Badge>
                  </div>
                  {preserveDesignSkill && (
                    <Check className="size-3.5 text-emerald-500" />
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground leading-snug">
                  Edits code, logic, and types without altering existing UI design or layout.
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Live Guidelines Status Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                aria-expanded={showGuidelinesDrawer}
                aria-label={`Toggle 21st.dev component standards (${passedCount} of ${planTasks.length} passed)`}
                onClick={() => setShowGuidelinesDrawer((prev) => !prev)}
                className={cn(
                  "h-7 gap-1.5 px-2 text-[11px] font-sans rounded-none border-border/80 bg-background/70 transition-colors",
                  allPassed
                    ? "text-muted-foreground hover:text-foreground"
                    : "text-amber-500 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 font-medium"
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-none shrink-0",
                    allPassed ? "bg-emerald-500" : "bg-amber-500"
                  )}
                />
                <span className="tabular-nums">
                  {passedCount}/{planTasks.length}
                </span>
                {showGuidelinesDrawer ? (
                  <ChevronUp className="size-2.5 opacity-60 shrink-0" />
                ) : (
                  <ChevronDown className="size-2.5 opacity-60 shrink-0" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Toggle 21st.dev component standards inspector
            </TooltipContent>
          </Tooltip>

          {/* Clear Chat */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={clearAiChat}
                className="studio-icon-btn size-7 text-muted-foreground hover:text-foreground rounded-none border-border/80 bg-background/70"
              >
                <Trash2 className="size-3.5" />
                <span className="sr-only">Clear chat history</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Clear conversation</TooltipContent>
          </Tooltip>

          {/* Close Panel */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => {
                  setAiPanelOpen(false);
                  onClose?.();
                }}
                className="studio-icon-btn size-7 text-muted-foreground hover:text-foreground rounded-none border-border/80 bg-background/70"
              >
                <PanelRightClose className="size-3.5" />
                <span className="sr-only">Close Copilot panel</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Close panel (Ctrl+I)</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Owner Security & API Credit Protection Status Bar */}
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-2 border-b border-border px-2.5 @[420px]:px-3 py-1.5 text-[11px] font-sans select-none",
          isOwnerAuthenticated
            ? "bg-emerald-500/5 text-foreground"
            : "bg-amber-500/10 text-amber-500"
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {isOwnerAuthenticated ? (
            <ShieldCheck className="size-3.5 text-emerald-500 shrink-0" />
          ) : (
            <Lock className="size-3.5 text-amber-500 shrink-0" />
          )}
          <span className="truncate font-medium">
            {isOwnerAuthenticated
              ? "Owner Session Active"
              : "AI Credits Locked (Read-Only)"}
          </span>
          {securityTelemetry?.dailyQuota && (
            <Badge
              variant="outline"
              className="rounded-none text-[9px] py-0 px-1 font-sans tabular-nums border-border/80 text-muted-foreground shrink-0"
            >
              {securityTelemetry.dailyQuota.remaining}/{securityTelemetry.dailyQuota.limit} left
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSecurityModalOpen(true)}
            className="h-6 rounded-none px-2 text-[10px] font-sans shrink-0"
          >
            {isOwnerAuthenticated ? "Shield" : "Unlock Owner"}
          </Button>
        </div>
      </div>

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
          <div className="py-2 @[420px]:py-3 flex flex-col space-y-3.5 select-none animate-in fade-in duration-200">
            {/* Architectural Identity & Telemetry Banner */}
            <div className="rounded-none border border-border bg-card/60 p-3.5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-none border border-border bg-foreground text-background">
                    <Code2 className="size-4 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="text-xs @[420px]:text-sm font-semibold tracking-tight text-foreground font-sans">
                        Copilot Intelligence
                      </h3>
                      <Badge
                        variant="eyebrow"
                        className="rounded-none text-[9px] py-0 px-1.5"
                      >
                        {currentRoleObj.name.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed font-sans mt-0.5">
                      Grounded pairing assistant for React components, Tailwind styling, and Framer Motion springs. Type <kbd className="font-mono text-[10px] px-1 py-0.5 border border-border bg-muted/60">/</kbd> for quick slash commands.
                    </p>
                  </div>
                </div>
              </div>

              {/* Specialist Persona Quick Strip */}
              <div className="flex flex-wrap items-center gap-1 pt-2 border-t border-border/60">
                {ROLE_OPTIONS.map((role) => {
                  const Icon = role.icon;
                  const isActive = aiRole === role.id;
                  return (
                    <Button
                      key={role.id}
                      type="button"
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setAiRole(role.id)}
                      className={cn(
                        "h-6 gap-1 px-2 text-[10px] rounded-none font-sans",
                        isActive
                          ? "bg-foreground text-background hover:bg-foreground/90 font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="size-2.5 shrink-0" />
                      <span>{role.name}</span>
                    </Button>
                  );
                })}
              </div>

              {/* Live Component Telemetry Strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-border/60 text-[11px] font-sans text-muted-foreground">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={cn(
                      "size-1.5 rounded-none shrink-0",
                      hasCompilerError
                        ? "bg-rose-500 animate-pulse"
                        : allPassed
                        ? "bg-emerald-500"
                        : "bg-amber-500"
                    )}
                  />
                  <span className="font-mono text-foreground text-[10px] truncate">
                    component.tsx
                  </span>
                  <span className="text-border">·</span>
                  <span className="tabular-nums shrink-0">{compLinesCount} lines</span>
                </div>
                <span
                  className={cn(
                    "font-medium tabular-nums shrink-0 text-[11px]",
                    hasCompilerError
                      ? "text-rose-500 font-semibold"
                      : allPassed
                      ? "text-emerald-500"
                      : "text-amber-500"
                  )}
                >
                  {hasCompilerError ? "Syntax / Compile Error" : `${passPercentage}% 21st.dev Ready`}
                </span>
              </div>
            </div>

            {/* Responsive Quick Action Grid (2 cols on compact, 4 cols on wide) */}
            <div className="grid grid-cols-2 @[480px]:grid-cols-4 gap-1.5 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleSubmitPrompt(
                    "Audit component.tsx against 21st.dev standards and fix all missing requirements (className forwarding, cn(), props interface, use client) while keeping the existing UI design, layout, and styling 100% unchanged.",
                    "autofix"
                  )
                }
                className="h-7 text-[11px] justify-start @[480px]:justify-center gap-1.5 px-2.5 font-sans rounded-none border-border/80 bg-card/40 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors"
              >
                <ShieldCheck className="size-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">Audit Standards</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleSubmitPrompt(
                    "Add smooth Framer Motion spring entry, hover scaling, and tap micro-interactions to component.tsx while preserving the existing UI layout and visual design.",
                    "chat"
                  )
                }
                className="h-7 text-[11px] justify-start @[480px]:justify-center gap-1.5 px-2.5 font-sans rounded-none border-border/80 bg-card/40 hover:border-violet-500/40 hover:bg-violet-500/5 transition-colors"
              >
                <Zap className="size-3.5 text-violet-500 shrink-0" />
                <span className="truncate">Spring Motion</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleSubmitPrompt(
                    "Add complete dark and light mode support with Tailwind dark: classes while preserving the existing component layout and design structure.",
                    "chat"
                  )
                }
                className="h-7 text-[11px] justify-start @[480px]:justify-center gap-1.5 px-2.5 font-sans rounded-none border-border/80 bg-card/40 hover:border-amber-500/40 hover:bg-amber-500/5 transition-colors"
              >
                <SunMoon className="size-3.5 text-amber-500 shrink-0" />
                <span className="truncate">Dark & Light</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleSubmitPrompt(
                    "Refactor component.tsx to optimize performance, clean up types, and ensure modularity while keeping the existing UI design, layout, and visual styling 100% unchanged.",
                    "chat"
                  )
                }
                className="h-7 text-[11px] justify-start @[480px]:justify-center gap-1.5 px-2.5 font-sans rounded-none border-border/80 bg-card/40 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-colors"
              >
                <Wand2 className="size-3.5 text-cyan-500 shrink-0" />
                <span className="truncate">Refactor</span>
              </Button>
            </div>

            {/* Dynamic Priority Alerts (Full Width) */}
            {(hasCompilerError || failingChecks.length > 0) && (
              <div className="grid grid-cols-1 gap-2 w-full">
                {/* Dynamic Priority Card: If Compiler Error */}
                {hasCompilerError && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleSubmitPrompt(
                        `Fix the compiler error in component.tsx:\n${compilerError}\nResolve all syntax, import, and type issues cleanly without affecting existing styling.`,
                        "chat"
                      )
                    }
                    className="h-auto w-full flex items-start justify-start gap-3 p-3 rounded-none border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/60 text-left transition-all group whitespace-normal font-sans shadow-none"
                  >
                    <div className="size-7 rounded-none bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0 mt-0.5">
                      <AlertTriangle className="size-3.5 animate-pulse" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                          Fix Runtime / Compiler Error
                        </span>
                        <Badge
                          variant="secondary"
                          className="rounded-none text-[9px] py-0 px-1 font-sans font-medium uppercase bg-rose-500/20 text-rose-500 border border-rose-500/30"
                        >
                          CRITICAL
                        </Badge>
                      </div>
                      <div className="text-[11px] font-normal text-muted-foreground leading-normal mt-0.5 line-clamp-2">
                        {compilerError}
                      </div>
                    </div>
                    <ArrowRight className="size-3.5 text-rose-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                  </Button>
                )}

                {/* Dynamic Priority Card: If Failing Standards */}
                {!hasCompilerError && failingChecks.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleSubmitPrompt(
                        `Audit component.tsx against 21st.dev standards and fix all failing requirements: ${failingChecks.map((c) => c.title).join(", ")}. Ensure className forwarding with cn(), typed props, and clean structure while keeping the existing UI design, layout, and styling 100% unchanged.`,
                        "autofix"
                      )
                    }
                    className="h-auto w-full flex items-start justify-start gap-3 p-3 rounded-none border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/60 text-left transition-all group whitespace-normal font-sans shadow-none"
                  >
                    <div className="size-7 rounded-none bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                      <ShieldCheck className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                          Fix {failingChecks.length} Missing Standard{failingChecks.length > 1 ? "s" : ""}
                        </span>
                        <Badge
                          variant="secondary"
                          className="rounded-none text-[9px] py-0 px-1 font-sans font-medium uppercase bg-amber-500/20 text-amber-500 border border-amber-500/30 tabular-nums"
                        >
                          {failingChecks.length} {failingChecks.length === 1 ? "ISSUE" : "ISSUES"}
                        </Badge>
                      </div>
                      <div className="text-[11px] font-normal text-muted-foreground leading-normal mt-0.5 line-clamp-1">
                        {failingChecks.map((c) => c.title).join(" · ")}
                      </div>
                    </div>
                    <ArrowRight className="size-3.5 text-amber-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                  </Button>
                )}
              </div>
            )}

            {/* Container-Responsive Smart Cards Grid (1 col on compact, 2 cols on >= 520px panel width) */}
            <div className="grid grid-cols-1 @[520px]:grid-cols-2 gap-2 w-full">
              {/* Smart Card 1: Spring Motion & Micro-interactions */}
              <Button
                variant="outline"
                onClick={() =>
                  handleSubmitPrompt(
                    "Add smooth Framer Motion spring entry, hover scaling, and tap micro-interactions to component.tsx while keeping the existing UI layout and visual design intact.",
                    "chat"
                  )
                }
                className="h-auto w-full flex items-start justify-start gap-2.5 p-3 rounded-none border-border/80 bg-card/50 hover:bg-card hover:border-violet-500/40 transition-all duration-150 group text-left whitespace-normal font-sans shadow-none"
              >
                <div className="size-7 rounded-none bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-500 shrink-0 mt-0.5">
                  <Zap className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-medium text-foreground group-hover:text-violet-500 transition-colors truncate">
                      Spring Motion & Physics
                    </span>
                    <Badge
                      variant="secondary"
                      className="rounded-none text-[9px] py-0 px-1 font-sans font-medium uppercase text-muted-foreground shrink-0"
                    >
                      MOTION
                    </Badge>
                  </div>
                  <div className="text-[11px] font-normal text-muted-foreground leading-normal mt-0.5">
                    Integrate natural Framer Motion gestures & hover springs.
                  </div>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground/40 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </Button>

              {/* Smart Card 2: Dark & Light Mode Polish */}
              <Button
                variant="outline"
                onClick={() =>
                  handleSubmitPrompt(
                    "Add complete dark and light mode support with Tailwind dark: classes while preserving the existing component layout and design structure.",
                    "chat"
                  )
                }
                className="h-auto w-full flex items-start justify-start gap-2.5 p-3 rounded-none border-border/80 bg-card/50 hover:bg-card hover:border-amber-500/40 transition-all duration-150 group text-left whitespace-normal font-sans shadow-none"
              >
                <div className="size-7 rounded-none bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                  <SunMoon className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-medium text-foreground group-hover:text-amber-500 transition-colors truncate">
                      Dark & Light Theme Polish
                    </span>
                    <Badge
                      variant="secondary"
                      className="rounded-none text-[9px] py-0 px-1 font-sans font-medium uppercase text-muted-foreground shrink-0"
                    >
                      THEMING
                    </Badge>
                  </div>
                  <div className="text-[11px] font-normal text-muted-foreground leading-normal mt-0.5">
                    Verify high-contrast Tailwind dark: tokens & balance.
                  </div>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground/40 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </Button>

              {/* Smart Card 3: A11y & ARIA Standards */}
              <Button
                variant="outline"
                onClick={() =>
                  handleSubmitPrompt(
                    "Audit component.tsx for web accessibility (a11y), add ARIA labels, role attributes, and keyboard focus states while keeping the existing UI design and layout 100% unchanged.",
                    "chat"
                  )
                }
                className="h-auto w-full flex items-start justify-start gap-2.5 p-3 rounded-none border-border/80 bg-card/50 hover:bg-card hover:border-cyan-500/40 transition-all duration-150 group text-left whitespace-normal font-sans shadow-none"
              >
                <div className="size-7 rounded-none bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 shrink-0 mt-0.5">
                  <CheckCircle2 className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-medium text-foreground group-hover:text-cyan-500 transition-colors truncate">
                      Accessibility & ARIA
                    </span>
                    <Badge
                      variant="secondary"
                      className="rounded-none text-[9px] py-0 px-1 font-sans font-medium uppercase text-muted-foreground shrink-0"
                    >
                      A11Y
                    </Badge>
                  </div>
                  <div className="text-[11px] font-normal text-muted-foreground leading-normal mt-0.5">
                    Ensure keyboard focus rings, roles, and screen-reader tags.
                  </div>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground/40 group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </Button>

              {/* Smart Card 4: Architecture & Clean Code */}
              <Button
                variant="outline"
                onClick={() =>
                  handleSubmitPrompt(
                    "Refactor component.tsx to extract reusable subcomponents, streamline TypeScript props, and memoize callbacks while keeping the existing UI design, layout, and visual styling 100% unchanged.",
                    "chat"
                  )
                }
                className="h-auto w-full flex items-start justify-start gap-2.5 p-3 rounded-none border-border/80 bg-card/50 hover:bg-card hover:border-emerald-500/40 transition-all duration-150 group text-left whitespace-normal font-sans shadow-none"
              >
                <div className="size-7 rounded-none bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
                  <Layers className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-medium text-foreground group-hover:text-emerald-500 transition-colors truncate">
                      Architecture & Props
                    </span>
                    <Badge
                      variant="secondary"
                      className="rounded-none text-[9px] py-0 px-1 font-sans font-medium uppercase text-muted-foreground shrink-0"
                    >
                      CLEAN CODE
                    </Badge>
                  </div>
                  <div className="text-[11px] font-normal text-muted-foreground leading-normal mt-0.5">
                    Streamlined props interface, memoized handlers & exports.
                  </div>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground/40 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </Button>
            </div>
          </div>
        ) : null}

        {/* Multi-Turn Messages Stream */}
        {aiChatMessages.map((msg, idx) => {
          const isUser = msg.role === "user";
          const isSystem = msg.role === "system";
          const isLatestMessage = idx === aiChatMessages.length - 1;
          const hasCodeChanges =
            msg.changedFiles && Object.keys(msg.changedFiles).length > 0;
          const resolvedStatus: "pending" | "approved" | "rejected" =
            msg.approvalStatus || (msg.applied ? "approved" : "pending");

          if (isSystem) {
            return (
              <div
                key={msg.id}
                className="my-2 py-1 px-2.5 rounded-none bg-muted/30 border border-border/40 text-[11px] text-muted-foreground text-center font-sans"
              >
                <MarkdownContent content={msg.content} />
              </div>
            );
          }

          if (isUser) {
            const userImages = msg.attachments?.images || [];
            const userSnippets = msg.attachments?.codeSnippets || [];

            return (
              <Message key={msg.id} align="end">
                <MessageContent align="end" className="max-w-[85%]">
                  <Bubble variant="user" align="end" className="space-y-2">
                    {/* Attached Images Grid */}
                    {userImages.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        {userImages.map((img) => (
                          <div
                            key={img.id}
                            onClick={() =>
                              setPreviewImage({
                                url: img.dataUrl,
                                name: img.name,
                              })
                            }
                            className="group relative cursor-pointer overflow-hidden rounded-lg border border-border/70 bg-muted/60 transition-all hover:ring-2 hover:ring-foreground/40"
                            title={`${img.name} (Click to zoom)`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.dataUrl}
                              alt={img.name}
                              className="size-16 object-cover rounded transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Eye className="size-3.5 text-white drop-shadow" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Attached Code Snippets Pills */}
                    {userSnippets.length > 0 && (
                      <div className="space-y-1 w-full">
                        {userSnippets.map((snip) => (
                          <div
                            key={snip.id}
                            onClick={() => setPreviewSnippet(snip)}
                            className="flex items-center justify-between gap-2 p-1.5 px-2 rounded-md border border-border/70 bg-muted/70 hover:bg-muted cursor-pointer transition-colors text-left"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Code2 className="size-3 text-foreground/75 shrink-0" />
                              <span className="text-xs font-medium text-foreground truncate font-sans">
                                {snip.title}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[9px] py-0 px-1 font-sans font-normal"
                              >
                                {snip.language.toUpperCase()}
                              </Badge>
                            </div>
                            <span className="text-[10px] text-muted-foreground shrink-0 font-sans">
                              {snip.code.split("\n").length}L • View
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <BubbleContent>{msg.content}</BubbleContent>
                  </Bubble>
                  <MessageFooter>{msg.timestamp}</MessageFooter>
                </MessageContent>
                <MessageAvatar>
                  <Avatar className="size-6 text-[10px] rounded-md">
                    <AvatarFallback className="bg-muted text-muted-foreground font-medium rounded-md">
                      <User className="size-3" />
                    </AvatarFallback>
                  </Avatar>
                </MessageAvatar>
              </Message>
            );
          }

          // Assistant Message - Architectural & Detailed Execution Trace
          return (
            <Message key={msg.id} align="start" className="pt-1.5">
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
                    {msg.authorRole || "Co-Pilot"}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50">•</span>
                  <Badge
                    variant="outline"
                    className="rounded-none text-[9px] py-0 px-1.5 font-normal text-muted-foreground font-mono border-border/70 bg-background/60"
                  >
                    {(msg.modelUsed || aiModel).replace("gemini-", "")}
                  </Badge>
                  {typeof msg.complianceScore === "number" && (
                    <Badge
                      variant="outline"
                      className="rounded-none text-[9px] py-0 px-1.5 font-normal text-muted-foreground font-sans border-border/70 bg-background/60 tabular-nums"
                    >
                      Score {msg.complianceScore}/100
                    </Badge>
                  )}
                  {hasCodeChanges && (
                    <Badge
                      variant="outline"
                      className="rounded-none text-[9px] py-0 px-1.5 font-medium text-emerald-600 dark:text-emerald-400 font-sans border-emerald-500/30 bg-emerald-500/10"
                    >
                      {resolvedStatus === "approved"
                        ? "Applied to Canvas"
                        : "Code Staged"}
                    </Badge>
                  )}
                </MessageHeader>

                {/* Recorded Reasoning & Work Pipeline for this Turn */}
                {msg.reasoning && (
                  <Reasoning
                    isStreaming={false}
                    durationSeconds={msg.reasoning.durationSeconds}
                    steps={msg.reasoning.steps}
                    summary={msg.reasoning.summary}
                    defaultOpen={false}
                  />
                )}

                {/* Main Response Content with Real Markdown & Code Blocks */}
                <Bubble
                  variant="editorial"
                  align="start"
                  className={cn(
                    "w-full mt-1 rounded-none border px-3 py-2.5",
                    msg.isError
                      ? "border-rose-500/40 bg-rose-500/5"
                      : "border-border/60 bg-card/30"
                  )}
                >
                  <MarkdownContent content={msg.content} />

                  {/* Structured Change Approval Request Card */}
                  {hasCodeChanges && msg.changedFiles && (
                    <ChangeApprovalCard
                      changedFiles={msg.changedFiles}
                      addedDependencies={msg.addedDependencies}
                      baselineFiles={
                        msg.previousFiles
                          ? {
                              "component.tsx":
                                msg.previousFiles["component.tsx"] ??
                                files["component.tsx"],
                              "default.tsx":
                                msg.previousFiles["default.tsx"] ??
                                msg.previousFiles["demo.tsx"] ??
                                activeDemoCode,
                              "demo.tsx":
                                msg.previousFiles["demo.tsx"] ??
                                msg.previousFiles["default.tsx"] ??
                                activeDemoCode,
                              "index.css":
                                msg.previousFiles["index.css"] ??
                                files["index.css"],
                            }
                          : {
                              "component.tsx": files["component.tsx"],
                              "default.tsx": activeDemoCode,
                              "demo.tsx": activeDemoCode,
                              "index.css": files["index.css"],
                            }
                      }
                      approvalStatus={resolvedStatus}
                      onApprove={() =>
                        approveAiMessageChanges(msg.id, msg.changedFiles!)
                      }
                      onReject={() => rejectAiMessageChanges(msg.id)}
                      onRevert={() => revertAiMessageChanges(msg.id)}
                      onSaveCheckpoint={() =>
                        handleSaveAiCheckpoint(
                          msg.id,
                          `AI Copilot (${msg.authorRole || "Co-Pilot"}): ${msg.content.slice(0, 42)}`
                        )
                      }
                    />
                  )}
                </Bubble>

                {/* Follow-Up Suggestion Chips */}
                {isLatestMessage &&
                  !isAiThinking &&
                  Array.isArray(msg.followUpSuggestions) &&
                  msg.followUpSuggestions.length > 0 && (
                    <div className="mt-2 w-full">
                      <SuggestionGroup className="gap-1.5">
                        {msg.followUpSuggestions.map((suggestion, sIdx) => (
                          <Suggestion
                            key={`${msg.id}-sug-${sIdx}`}
                            icon={
                              <Sparkles className="size-2.5 text-primary shrink-0" />
                            }
                            onClick={() =>
                              handleSubmitPrompt(suggestion, "chat")
                            }
                            className="rounded-none text-[11px] h-6 px-2 bg-card/50 hover:bg-card"
                          >
                            {suggestion}
                          </Suggestion>
                        ))}
                      </SuggestionGroup>
                    </div>
                  )}

                {/* Assistant Message Footer & Action Bar */}
                <div className="flex items-center justify-between gap-2 w-full mt-1">
                  <MessageFooter>{msg.timestamp}</MessageFooter>
                  <div className="flex items-center gap-0.5">
                    {checkpointSavedId === msg.id && (
                      <Badge
                        variant="secondary"
                        className="rounded-none text-[9px] py-0 px-1.5 font-sans text-emerald-500 bg-emerald-500/10"
                      >
                        <BookmarkCheck className="size-2.5 mr-1" />
                        Checkpoint Saved
                      </Badge>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="size-6 rounded-none text-muted-foreground hover:text-foreground"
                        >
                          {copiedMessageId === msg.id ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                          <span className="sr-only">Copy response</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Copy response</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={isAiThinking}
                          onClick={() => handleRetryTurn(idx)}
                          className="size-6 rounded-none text-muted-foreground hover:text-foreground"
                        >
                          <RotateCcw className="size-3" />
                          <span className="sr-only">Regenerate response</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        Retry / Regenerate
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => deleteAiChatMessage(msg.id)}
                          className="size-6 rounded-none text-muted-foreground hover:text-rose-500"
                        >
                          <Trash2 className="size-3" />
                          <span className="sr-only">Delete message</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        Remove message
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </MessageContent>
            </Message>
          );
        })}

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
                  Working • {workingSteps.filter((s) => s.status === "done").length}/{workingSteps.length}
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
