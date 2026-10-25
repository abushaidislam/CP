"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  useStudioStore,
  AttachedImage,
  AttachedCodeSnippet,
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
  TaskItemProps,
  ReasoningStep,
  AttachCodeDialog,
  ImagePreviewDialog,
  CodePreviewDialog,
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
  SlidersHorizontal,
  Moon,
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
} from "lucide-react";

const MODEL_OPTIONS = [
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
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
    aiChatMessages,
    isAiThinking,
    compilerError,
    currentTemplateId,
    geminiApiKey,
    setAiPanelOpen,
    setAiPanelWidth,
    setAiModel,
    addAiChatMessage,
    approveAiMessageChanges,
    rejectAiMessageChanges,
    revertAiMessageChanges,
    clearAiChat,
    setAiThinking,
  } = useStudioStore();

  const [promptInput, setPromptInput] = useState("");
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [attachedCodeSnippets, setAttachedCodeSnippets] = useState<AttachedCodeSnippet[]>([]);
  const [isAttachCodeDialogOpen, setIsAttachCodeDialogOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; name?: string } | null>(null);
  const [previewSnippet, setPreviewSnippet] = useState<AttachedCodeSnippet | null>(null);

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

  // Real-time static guideline audit
  const auditResult = useMemo(() => {
    return auditComponentGuidelines(
      files["component.tsx"],
      files["demo.tsx"],
      files["index.css"],
      dependencies
    );
  }, [files, dependencies]);

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

  // Progressive sequential chain-of-thought (Notion / ChatGPT / Gemini style)
  const workingSteps = useMemo<ReasoningStep[]>(() => {
    const step1: ReasoningStep = {
      title: "Reading component structure & exports",
      description: `Inspecting the exported React component, TypeScript props interface, and layout hierarchy across ${compLinesCount} lines in component.tsx.`,
      status: thinkingSeconds < 2 ? "running" : "done",
    };

    const step2: ReasoningStep = {
      title: "Evaluating styling, motion & 21st.dev compliance",
      description: `Checking className forwarding with cn(), Tailwind dark/light theme tokens, and interactive state transitions (${passedCount}/${planTasks.length} static rules verified).`,
      status:
        thinkingSeconds < 2
          ? "pending"
          : thinkingSeconds < 4
          ? "running"
          : "done",
    };

    const step3: ReasoningStep = {
      title: "Drafting architectural response & code updates",
      description: "Synthesizing complete, compilable code changes and implementation notes aligned with Component Studio Co-Pilot standards.",
      status: thinkingSeconds < 4 ? "pending" : "running",
    };

    return [step1, step2, step3];
  }, [thinkingSeconds, compLinesCount, passedCount, planTasks.length]);

  const currentStepTitle = useMemo(() => {
    if (thinkingSeconds < 2) return "Reading component structure & exports...";
    if (thinkingSeconds < 4) return "Evaluating styling & compliance...";
    return "Drafting architectural response & code updates...";
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

  // Keep DOM width synced when aiPanelWidth changes from store
  useEffect(() => {
    if (panelRef.current && !isResizingRef.current) {
      panelRef.current.style.width = `${aiPanelWidth}px`;
    }
  }, [aiPanelWidth]);

  const handleResizeStart = (e: React.MouseEvent) => {
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
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const deltaX = startXRef.current - e.clientX;
      const nextWidth = Math.max(340, Math.min(800, startWidthRef.current + deltaX));
      currentWidthRef.current = nextWidth;

      if (panelRef.current) {
        panelRef.current.style.width = `${nextWidth}px`;
      }
    };

    const handleMouseUp = () => {
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

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [setAiPanelWidth]);

  const currentModelObj = MODEL_OPTIONS.find((m) => m.id === aiModel) || MODEL_OPTIONS[0];

  // Submit AI Prompt
  const handleSubmitPrompt = async (
    customPrompt?: string,
    action: "chat" | "autofix" | "audit" = "chat"
  ) => {
    const text = (customPrompt || promptInput).trim();
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

    // Capture baseline snapshot before request
    const baselineSnapshot = {
      "component.tsx": files["component.tsx"],
      "demo.tsx": files["demo.tsx"],
      "index.css": files["index.css"],
    };

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

    requestStartTimeRef.current = Date.now();
    setAiThinking(true);

    try {
      const historyPayload = aiChatMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessageContent,
          action,
          componentCode: files["component.tsx"],
          demoCode: files["demo.tsx"],
          cssCode: files["index.css"],
          dependencies,
          model: aiModel,
          role: "copilot",
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
          apiKey: geminiApiKey || undefined,
        }),
      });

      const data = await res.json();
      const elapsedSeconds = Math.max(
        1,
        Math.round((Date.now() - requestStartTimeRef.current) / 1000)
      );

      if (!res.ok) {
        addAiChatMessage({
          role: "assistant",
          authorRole: "Co-Pilot",
          modelUsed: aiModel,
          content: data.error || "Failed to process request with Gemini AI.",
        });
        return;
      }

      const hasChangedFiles =
        data.changedFiles && Object.keys(data.changedFiles).length > 0;

      const recordedSteps: ReasoningStep[] = Array.isArray(data.reasoningSteps)
        ? data.reasoningSteps.map(
            (st: { title: string; description?: string; detail?: string }) => ({
              title: st.title,
              description: st.description,
              detail: st.detail,
              status: "done" as const,
            })
          )
        : [
            {
              title: "Reading component structure & exports",
              description: `Examined exported React component, TypeScript props interface, and layout hierarchy across ${compLinesCount} lines in component.tsx.`,
              status: "done" as const,
            },
            {
              title: "Evaluating styling & 21st.dev compliance",
              description: `Verified ${passedCount} of ${planTasks.length} static guideline checks including className merging and dark/light theme support.`,
              status: "done" as const,
            },
          ];

      addAiChatMessage({
        role: "assistant",
        authorRole: "Co-Pilot",
        modelUsed: aiModel,
        content: data.message || "I've reviewed your component.",
        reasoning: {
          durationSeconds: elapsedSeconds,
          steps: recordedSteps,
          summary: data.reasoningSummary,
        },
        changedFiles: hasChangedFiles ? data.changedFiles : undefined,
        previousFiles: hasChangedFiles ? baselineSnapshot : undefined,
        approvalStatus: hasChangedFiles ? "pending" : undefined,
        applied: false,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      addAiChatMessage({
        role: "assistant",
        authorRole: "Co-Pilot",
        modelUsed: aiModel,
        content: `Connection error: ${errorMsg}. Please verify your network connection and server configuration.`,
      });
    } finally {
      setAiThinking(false);
    }
  };

  if (!isAiPanelOpen && !isMobile) return null;

  return (
    <div
      ref={panelRef}
      style={isMobile ? { width: "100%" } : { width: `${aiPanelWidth}px` }}
      className={cn(
        "relative flex h-full flex-col bg-background text-foreground font-sans select-none z-20 shrink-0",
        isMobile ? "w-full border-0" : "border-l border-border"
      )}
    >
        {/* Resizable Left Edge Drag Handle (desktop only) */}
        {!isMobile && (
          <div
            onMouseDown={handleResizeStart}
            className="absolute left-0 top-0 bottom-0 w-2 -left-1 cursor-ew-resize hover:bg-primary/20 active:bg-primary/30 transition-colors z-30 group"
            title="Drag left/right to resize Copilot panel"
          >
            <div className="h-full w-px bg-border group-hover:bg-primary transition-colors mx-auto" />
          </div>
        )}

      {/* Top Header - Editorial, Clean & Polished */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-card/40 px-3 select-none">
        <div className="flex items-center gap-2">
          {/* Subtle Copilot Mark */}
          <div className="flex items-center gap-1.5">
            <div className="flex size-5.5 items-center justify-center rounded-md bg-foreground text-background shadow-2xs">
              <Code2 className="size-3 stroke-[2.2]" />
            </div>
            <span className="text-xs font-semibold tracking-tight text-foreground font-sans">
              Copilot
            </span>
            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal text-muted-foreground font-sans">
              Co-Assistant
            </Badge>
          </div>

          <div className="h-3.5 w-px bg-border/70 mx-0.5" />

          {/* Model Dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 gap-1 px-1.5 text-[11px] font-normal text-muted-foreground border-border/80 hover:text-foreground hover:border-border font-sans rounded-md bg-transparent"
                  >
                    <span className="truncate max-w-[85px]">
                      {currentModelObj.name.replace("Gemini ", "")}
                    </span>
                    <ChevronDown className="size-2.5 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Active Gemini model</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="w-68 font-sans">
              <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Gemini Model
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {MODEL_OPTIONS.map((m) => {
                const IconComponent = m.icon;
                return (
                  <DropdownMenuItem
                    key={m.id}
                    onClick={() => setAiModel(m.id)}
                    className="flex flex-col items-start gap-1 py-1.5 cursor-pointer font-sans"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5">
                        <IconComponent className="size-3.5 text-muted-foreground" />
                        <span className="font-medium text-xs text-foreground">
                          {m.name}
                        </span>
                        <Badge variant="secondary" className="text-[9px] py-0 px-1 font-normal font-sans">
                          {m.tag}
                        </Badge>
                      </div>
                      {aiModel === m.id && <Check className="size-3.5 text-foreground" />}
                    </div>
                    <span className="text-[10px] text-muted-foreground leading-snug">
                      {m.description}
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {/* Live Guidelines Status Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGuidelinesDrawer((prev) => !prev)}
                className={`h-6.5 gap-1.5 px-2 text-[11px] font-sans rounded-md transition-colors ${
                  allPassed
                    ? "text-muted-foreground hover:text-foreground"
                    : "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 font-medium"
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    allPassed ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                <span className="hidden sm:inline">
                  {passedCount}/{planTasks.length}
                </span>
                {showGuidelinesDrawer ? (
                  <ChevronUp className="size-2.5 opacity-60" />
                ) : (
                  <ChevronDown className="size-2.5 opacity-60" />
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
                variant="ghost"
                size="icon"
                onClick={clearAiChat}
                className="size-7 text-muted-foreground hover:text-foreground rounded-md"
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
                variant="ghost"
                size="icon"
                onClick={() => {
                  setAiPanelOpen(false);
                  onClose?.();
                }}
                className="size-7 text-muted-foreground hover:text-foreground rounded-md"
              >
                <PanelRightClose className="size-3.5" />
                <span className="sr-only">Close Copilot panel</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Close panel (Ctrl+I)</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Collapsible Guidelines Drawer Banner */}
      {showGuidelinesDrawer && (
        <div className="border-b border-border bg-card/70 p-3 select-none font-sans animate-in slide-in-from-top-1 duration-150 max-h-[38vh] overflow-y-auto">
          <Plan
            title="21st.dev Component Standards"
            tasks={planTasks}
            defaultOpen={true}
            onAutoFix={() =>
              handleSubmitPrompt(
                "Audit component.tsx, demo.tsx, and index.css against all 21st.dev guidelines and auto-fix all missing requirements (className forwarding, cn(), props interface, use client).",
                "autofix"
              )
            }
          />
        </div>
      )}

      {/* Main Multi-Turn Chat Thread */}
      <div
        ref={chatScrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 select-text font-sans scroll-smooth"
      >
        {/* Empty State / Welcome Screen */}
        {aiChatMessages.length === 0 ? (
          <div className="py-5 px-1 flex flex-col items-center text-center space-y-4 select-none animate-in fade-in duration-200">
            {/* Ambient Hero Icon with Glowing Aura */}
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/30 to-violet-500/30 blur-md opacity-75 group-hover:opacity-100 transition duration-300" />
              <div className="relative size-12 rounded-2xl bg-card border border-border/80 flex items-center justify-center text-foreground shadow-sm">
                <Code2 className="size-6 text-primary" />
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-1.5 max-w-[320px]">
              <div className="flex items-center justify-center gap-1.5">
                <h3 className="text-sm font-semibold tracking-tight text-foreground font-sans">
                  Copilot Intelligence
                </h3>
                <Badge
                  variant="secondary"
                  className="text-[9px] py-0 px-1.5 font-mono uppercase tracking-wider text-primary bg-primary/10 border-primary/20"
                >
                  AI CO-ENGINEER
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                Grounded pairing assistant for React components, Tailwind styling, and Framer Motion springs.
              </p>
            </div>

            {/* Live Component Context Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/80 bg-muted/40 text-[11px] font-sans text-muted-foreground">
              <span
                className={cn(
                  "size-1.5 rounded-full shrink-0",
                  hasCompilerError
                    ? "bg-rose-500 animate-pulse"
                    : allPassed
                    ? "bg-emerald-500"
                    : "bg-amber-500"
                )}
              />
              <span className="font-mono text-foreground text-[10px]">component.tsx</span>
              <span className="opacity-40">•</span>
              <span>{compLinesCount} lines</span>
              <span className="opacity-40">•</span>
              <span
                className={cn(
                  "font-medium",
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

            {/* Quick Prompt Category Chips */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 w-full pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleSubmitPrompt(
                    "Audit component.tsx against 21st.dev standards and fix all missing requirements (className forwarding, cn(), props interface, use client).",
                    "autofix"
                  )
                }
                className="h-6.5 text-[11px] gap-1 px-2 font-sans rounded-full border-border/60 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors"
              >
                <ShieldCheck className="size-3 text-emerald-500" />
                <span>Audit Standards</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleSubmitPrompt(
                    "Add smooth Framer Motion spring entry, hover scaling, and tap micro-interactions to component.tsx.",
                    "chat"
                  )
                }
                className="h-6.5 text-[11px] gap-1 px-2 font-sans rounded-full border-border/60 hover:border-violet-500/40 hover:bg-violet-500/5 transition-colors"
              >
                <Zap className="size-3 text-violet-500" />
                <span>Spring Motion</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleSubmitPrompt(
                    "Add complete dark and light mode support with Tailwind dark: classes and elegant contrast.",
                    "chat"
                  )
                }
                className="h-6.5 text-[11px] gap-1 px-2 font-sans rounded-full border-border/60 hover:border-amber-500/40 hover:bg-amber-500/5 transition-colors"
              >
                <SunMoon className="size-3 text-amber-500" />
                <span>Dark & Light</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleSubmitPrompt(
                    "Refactor component.tsx to optimize performance, clean up types, and ensure modularity.",
                    "chat"
                  )
                }
                className="h-6.5 text-[11px] gap-1 px-2 font-sans rounded-full border-border/60 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-colors"
              >
                <Wand2 className="size-3 text-cyan-500" />
                <span>Refactor</span>
              </Button>
            </div>

            {/* Dynamic Smart Cards */}
            <div className="grid grid-cols-1 gap-2 w-full pt-1">
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
                  className="h-auto w-full flex items-start justify-start gap-3 p-3 rounded-xl border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/60 text-left transition-all group whitespace-normal font-sans shadow-xs"
                >
                  <div className="size-7 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0 mt-0.5">
                    <AlertTriangle className="size-3.5 animate-pulse" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                        Fix Runtime / Compiler Error
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-[9px] py-0 px-1 font-mono uppercase bg-rose-500/20 text-rose-500 border border-rose-500/30"
                      >
                        CRITICAL
                      </Badge>
                    </div>
                    <div className="text-[11px] font-normal text-muted-foreground leading-normal mt-0.5 line-clamp-2">
                      {compilerError}
                    </div>
                  </div>
                  <ArrowRight className="size-3.5 text-rose-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                </Button>
              )}

              {/* Dynamic Priority Card: If Failing Standards */}
              {!hasCompilerError && failingChecks.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() =>
                    handleSubmitPrompt(
                      `Audit component.tsx against 21st.dev standards and fix all failing requirements: ${failingChecks.map((c) => c.title).join(", ")}. Ensure className forwarding with cn(), typed props, and clean structure.`,
                      "autofix"
                    )
                  }
                  className="h-auto w-full flex items-start justify-start gap-3 p-3 rounded-xl border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/60 text-left transition-all group whitespace-normal font-sans shadow-xs"
                >
                  <div className="size-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                    <ShieldCheck className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                        Fix ${failingChecks.length} Missing Standard${failingChecks.length > 1 ? "s" : ""}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-[9px] py-0 px-1 font-mono uppercase bg-amber-500/20 text-amber-500 border border-amber-500/30"
                      >
                        ${failingChecks.length} ISSUES
                      </Badge>
                    </div>
                    <div className="text-[11px] font-normal text-muted-foreground leading-normal mt-0.5 line-clamp-1">
                      {failingChecks.map((c) => c.title).join(" • ")}
                    </div>
                  </div>
                  <ArrowRight className="size-3.5 text-amber-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                </Button>
              )}

              {/* Smart Card 1: Spring Motion & Micro-interactions */}
              <Button
                variant="outline"
                onClick={() =>
                  handleSubmitPrompt(
                    "Add smooth Framer Motion spring entry, hover scaling, and tap micro-interactions to component.tsx.",
                    "chat"
                  )
                }
                className="h-auto w-full flex items-start justify-start gap-3 p-3 rounded-xl border-border/70 bg-card/40 hover:bg-card/90 hover:border-violet-500/40 hover:shadow-xs transition-all duration-150 group text-left whitespace-normal font-sans"
              >
                <div className="size-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-500 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <Zap className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-medium text-foreground group-hover:text-violet-500 transition-colors">
                      Spring Motion & Physics
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[9px] py-0 px-1 font-mono uppercase text-muted-foreground group-hover:text-foreground"
                    >
                      MOTION
                    </Badge>
                  </div>
                  <div className="text-[11px] font-normal text-muted-foreground leading-normal mt-0.5">
                    Integrate natural Framer Motion gestures & hover springs.
                  </div>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground/40 group-hover:text-violet-500 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
              </Button>

              {/* Smart Card 2: Dark & Light Mode Polish */}
              <Button
                variant="outline"
                onClick={() =>
                  handleSubmitPrompt(
                    "Add complete dark and light mode support with Tailwind dark: classes and elegant contrast.",
                    "chat"
                  )
                }
                className="h-auto w-full flex items-start justify-start gap-3 p-3 rounded-xl border-border/70 bg-card/40 hover:bg-card/90 hover:border-amber-500/40 hover:shadow-xs transition-all duration-150 group text-left whitespace-normal font-sans"
              >
                <div className="size-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <SunMoon className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-medium text-foreground group-hover:text-amber-500 transition-colors">
                      Dark & Light Theme Polish
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[9px] py-0 px-1 font-mono uppercase text-muted-foreground group-hover:text-foreground"
                    >
                      THEMING
                    </Badge>
                  </div>
                  <div className="text-[11px] font-normal text-muted-foreground leading-normal mt-0.5">
                    Verify high-contrast Tailwind dark: tokens & aesthetic balance.
                  </div>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground/40 group-hover:text-amber-500 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
              </Button>

              {/* Smart Card 3: A11y & ARIA Standards */}
              <Button
                variant="outline"
                onClick={() =>
                  handleSubmitPrompt(
                    "Audit component.tsx for web accessibility (a11y), add ARIA labels, role attributes, and keyboard focus states.",
                    "chat"
                  )
                }
                className="h-auto w-full flex items-start justify-start gap-3 p-3 rounded-xl border-border/70 bg-card/40 hover:bg-card/90 hover:border-cyan-500/40 hover:shadow-xs transition-all duration-150 group text-left whitespace-normal font-sans"
              >
                <div className="size-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-medium text-foreground group-hover:text-cyan-500 transition-colors">
                      Accessibility & ARIA Standards
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[9px] py-0 px-1 font-mono uppercase text-muted-foreground group-hover:text-foreground"
                    >
                      A11Y
                    </Badge>
                  </div>
                  <div className="text-[11px] font-normal text-muted-foreground leading-normal mt-0.5">
                    Ensure keyboard focus rings, role attributes, and screen-reader tags.
                  </div>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground/40 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
              </Button>

              {/* Smart Card 4: Architecture & Clean Code */}
              <Button
                variant="outline"
                onClick={() =>
                  handleSubmitPrompt(
                    "Refactor component.tsx to extract reusable subcomponents, streamline TypeScript props, and memoize callbacks.",
                    "chat"
                  )
                }
                className="h-auto w-full flex items-start justify-start gap-3 p-3 rounded-xl border-border/70 bg-card/40 hover:bg-card/90 hover:border-emerald-500/40 hover:shadow-xs transition-all duration-150 group text-left whitespace-normal font-sans"
              >
                <div className="size-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                  <Layers className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-medium text-foreground group-hover:text-emerald-500 transition-colors">
                      Architecture & Props Refactor
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[9px] py-0 px-1 font-mono uppercase text-muted-foreground group-hover:text-foreground"
                    >
                      CLEAN CODE
                    </Badge>
                  </div>
                  <div className="text-[11px] font-normal text-muted-foreground leading-normal mt-0.5">
                    Streamlined props interface, memoized handlers & clean exports.
                  </div>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground/40 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
              </Button>
            </div>
          </div>
        ) : null}

        {/* Multi-Turn Messages Stream */}
        {aiChatMessages.map((msg) => {
          const isUser = msg.role === "user";
          const isSystem = msg.role === "system";
          const hasCodeChanges =
            msg.changedFiles && Object.keys(msg.changedFiles).length > 0;
          const resolvedStatus: "pending" | "approved" | "rejected" =
            msg.approvalStatus || (msg.applied ? "approved" : "pending");

          if (isSystem) {
            return (
              <div
                key={msg.id}
                className="my-2 py-1 px-2.5 rounded-md bg-muted/30 border border-border/40 text-[11px] text-muted-foreground text-center font-sans"
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

          // Assistant Message - Editorial & Clean
          return (
            <Message key={msg.id} align="start" className="pt-1">
              <MessageAvatar>
                <Avatar className="size-6 rounded-md bg-foreground text-background shadow-2xs">
                  <AvatarFallback className="bg-foreground text-background font-semibold rounded-md">
                    <Code2 className="size-3" />
                  </AvatarFallback>
                </Avatar>
              </MessageAvatar>

              <MessageContent align="start">
                <MessageHeader>
                  <span className="font-semibold text-foreground text-xs font-sans">
                    {msg.authorRole || "Co-Pilot"}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">•</span>
                  <Badge
                    variant="outline"
                    className="text-[9px] py-0 px-1 font-normal text-muted-foreground font-sans border-border/60"
                  >
                    {(msg.modelUsed || aiModel).replace("gemini-", "")}
                  </Badge>
                </MessageHeader>

                {/* Recorded Reasoning Trace for this Turn (if present) */}
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
                <Bubble variant="editorial" align="start" className="w-full mt-0.5">
                  <MarkdownContent content={msg.content} />

                  {/* Structured Change Approval Request Card */}
                  {hasCodeChanges && msg.changedFiles && (
                    <ChangeApprovalCard
                      changedFiles={msg.changedFiles}
                      baselineFiles={
                        msg.previousFiles
                          ? {
                              "component.tsx":
                                msg.previousFiles["component.tsx"] ??
                                files["component.tsx"],
                              "demo.tsx":
                                msg.previousFiles["demo.tsx"] ?? files["demo.tsx"],
                              "index.css":
                                msg.previousFiles["index.css"] ??
                                files["index.css"],
                            }
                          : (files as unknown as Record<string, string>)
                      }
                      approvalStatus={resolvedStatus}
                      onApprove={() =>
                        approveAiMessageChanges(msg.id, msg.changedFiles!)
                      }
                      onReject={() => rejectAiMessageChanges(msg.id)}
                      onRevert={() => revertAiMessageChanges(msg.id)}
                    />
                  )}
                </Bubble>

                <MessageFooter>{msg.timestamp}</MessageFooter>
              </MessageContent>
            </Message>
          );
        })}

        {/* Real-time Streaming Assistant Turn */}
        {isAiThinking && (
          <Message align="start" className="pt-1">
            <MessageAvatar>
              <Avatar className="size-6 rounded-md bg-foreground text-background shadow-2xs">
                <AvatarFallback className="bg-foreground text-background font-semibold rounded-md">
                  <Code2 className="size-3" />
                </AvatarFallback>
              </Avatar>
            </MessageAvatar>

            <MessageContent align="start" className="w-full">
              <MessageHeader>
                <span className="font-semibold text-foreground text-xs font-sans">
                  Co-Pilot
                </span>
                <span className="text-[10px] text-muted-foreground/60">•</span>
                <Badge
                  variant="outline"
                  className="text-[9px] py-0 px-1 font-normal text-muted-foreground font-sans border-border/60"
                >
                  {aiModel.replace("gemini-", "")}
                </Badge>
              </MessageHeader>

              <Reasoning
                isStreaming={true}
                durationSeconds={thinkingSeconds}
                activeStep={currentStepTitle}
                steps={workingSteps}
                summary={`Executing multi-turn analysis with ${currentModelObj.name} under Component Studio standards.`}
              />
            </MessageContent>
          </Message>
        )}
      </div>

      {/* Bottom Area: Command-Grade Prompt Input with Attachments */}
      <div className="p-3 border-t border-border bg-card/30 select-none">
        {attachmentNotice && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-600 dark:text-amber-400 font-sans animate-in fade-in duration-150">
            <div className="flex items-center gap-1.5 min-w-0">
              <AlertCircle className="size-3.5 shrink-0" />
              <span className="truncate">{attachmentNotice}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAttachmentNotice(null)}
              className="size-4 p-0 text-amber-600 dark:text-amber-400 hover:bg-transparent shrink-0"
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
          isLoading={isAiThinking}
          placeholder="Ask Copilot... (paste image or code)"
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
            <Badge
              variant="outline"
              className="text-[10px] py-0.5 px-2 font-normal text-muted-foreground border-border/80 font-sans shrink-0 whitespace-nowrap flex items-center gap-1 bg-muted/40"
            >
              <Sparkles className="size-2.5 text-primary shrink-0" />
              <span>{currentModelObj.name.replace("Gemini ", "")}</span>
            </Badge>
          }
        />

        {/* Hidden File Input for Image Upload */}
        <input
          ref={fileInputRef}
          type="file"
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
          currentDemoCode={files["demo.tsx"]}
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
