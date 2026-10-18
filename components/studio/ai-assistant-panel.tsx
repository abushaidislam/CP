"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useStudioStore, AiChatRole } from "@/lib/store/studio-store";
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
  Plan,
  PromptInput,
  TaskItemProps,
} from "@/components/ui/ai-elements";
import { MarkdownContent } from "@/components/ui/markdown-content";
import {
  Check,
  PanelRightClose,
  Trash2,
  FileCode,
  Wand2,
  Moon,
  Zap,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Cpu,
  BrainCircuit,
  Gauge,
  User,
  ArrowRight,
  Code2,
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
    icon: BrainCircuit,
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
  short: string;
  tagline: string;
}> = [
  {
    id: "architect",
    name: "Frontend Architect",
    short: "Architect",
    tagline: "Component APIs, TypeScript interfaces & 21st.dev standards",
  },
  {
    id: "designer",
    name: "UI/UX & Motion Designer",
    short: "Designer",
    tagline: "Tailwind aesthetics, clean typography & Framer Motion springs",
  },
  {
    id: "auditor",
    name: "Code & A11y Auditor",
    short: "Auditor",
    tagline: "Bug prevention, WCAG accessibility & error boundaries",
  },
  {
    id: "optimizer",
    name: "Performance Optimizer",
    short: "Optimizer",
    tagline: "Bundle efficiency, re-render avoidance & speed",
  },
];

export function AiAssistantPanel() {
  const {
    files,
    dependencies,
    isAiPanelOpen,
    aiPanelWidth,
    aiModel,
    aiRole,
    aiChatMessages,
    isAiThinking,
    setAiPanelOpen,
    setAiPanelWidth,
    setAiModel,
    setAiRole,
    addAiChatMessage,
    markAiMessageApplied,
    clearAiChat,
    setAiThinking,
    applyAiChanges,
  } = useStudioStore();

  const [promptInput, setPromptInput] = useState("");
  const [appliedMessageIds, setAppliedMessageIds] = useState<Record<string, boolean>>({});
  const [thinkingSeconds, setThinkingSeconds] = useState(0);
  const [showGuidelinesDrawer, setShowGuidelinesDrawer] = useState(false);
  const [expandedPreviewMsgId, setExpandedPreviewMsgId] = useState<string | null>(null);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Progressive reasoning steps
  const workingSteps = useMemo(() => {
    if (thinkingSeconds < 2) {
      return [
        { title: "Analyzing AST structure & editor files...", status: "running" as const },
        { title: "Validating 21st.dev component guidelines...", status: "pending" as const },
        { title: "Synthesizing code refactor with Gemini...", status: "pending" as const },
      ];
    } else if (thinkingSeconds < 4) {
      return [
        { title: "Analyzed AST structure & editor files", status: "done" as const },
        { title: "Validating 21st.dev component guidelines...", status: "running" as const },
        { title: "Synthesizing code refactor with Gemini...", status: "pending" as const },
      ];
    } else {
      return [
        { title: "Analyzed AST structure & editor files", status: "done" as const },
        { title: "Validated 21st.dev component guidelines", status: "done" as const },
        { title: "Synthesizing code refactor with Gemini...", status: "running" as const },
      ];
    }
  }, [thinkingSeconds]);

  const currentStepTitle = useMemo(() => {
    if (thinkingSeconds < 2) return "Analyzing code...";
    if (thinkingSeconds < 4) return "Auditing standards...";
    return "Generating response...";
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

  // Resizable panel from left border
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = aiPanelWidth;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const deltaX = startXRef.current - e.clientX;
      const newWidth = Math.max(340, Math.min(680, startWidthRef.current + deltaX));
      setAiPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [setAiPanelWidth]);

  // Submit AI Prompt
  const handleSubmitPrompt = async (
    customPrompt?: string,
    action: "chat" | "autofix" | "audit" = "chat"
  ) => {
    const text = (customPrompt || promptInput).trim();
    if (!text && action === "chat") return;

    if (!customPrompt) {
      setPromptInput("");
    }

    const userMessageContent =
      text ||
      (action === "autofix"
        ? "Auto-fix any guideline violations and polish the component code."
        : "Perform a full standards and quality audit.");

    addAiChatMessage({
      role: "user",
      content: userMessageContent,
    });

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
          role: aiRole,
          history: historyPayload,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        addAiChatMessage({
          role: "assistant",
          content: data.error || "Failed to process request with Gemini AI.",
        });
        return;
      }

      addAiChatMessage({
        role: "assistant",
        content: data.message || "I've reviewed your component.",
        changedFiles:
          data.changedFiles && Object.keys(data.changedFiles).length > 0
            ? data.changedFiles
            : undefined,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      addAiChatMessage({
        role: "assistant",
        content: `Connection error: ${errorMsg}. Please verify your network connection and server configuration.`,
      });
    } finally {
      setAiThinking(false);
    }
  };

  // 1-Click Apply Code Fixes to Editor
  const handleApplyChanges = (
    msgId: string,
    changedFiles: Partial<Record<string, string>>
  ) => {
    applyAiChanges(changedFiles);
    setAppliedMessageIds((prev) => ({ ...prev, [msgId]: true }));
    markAiMessageApplied(msgId);
  };

  const currentRoleObj = ROLE_OPTIONS.find((r) => r.id === aiRole) || ROLE_OPTIONS[0];
  const currentModelObj = MODEL_OPTIONS.find((m) => m.id === aiModel) || MODEL_OPTIONS[0];

  if (!isAiPanelOpen) return null;

  return (
    <div
      style={{ width: `${aiPanelWidth}px` }}
      className="relative flex h-full flex-col border-l border-border bg-background text-foreground font-sans select-none z-20 shrink-0"
    >
      {/* Resizable Left Edge Drag Handle */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-border/80 transition-colors z-30 group"
        title="Drag left/right to resize Copilot panel"
      >
        <div className="h-full w-px bg-border group-hover:bg-foreground/30 transition-colors" />
      </div>

      {/* Top Header - Editorial, Clean & Polished */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-card/40 px-3 select-none">
        {/* Brand & Multi-Turn Role/Model Controls */}
        <div className="flex items-center gap-2">
          {/* Subtle Copilot Mark */}
          <div className="flex items-center gap-1.5">
            <div className="flex size-5.5 items-center justify-center rounded-md bg-foreground text-background shadow-2xs">
              <Code2 className="size-3 stroke-[2.2]" />
            </div>
            <span className="text-xs font-semibold tracking-tight text-foreground font-sans">
              Copilot
            </span>
          </div>

          <div className="h-3.5 w-px bg-border/70 mx-0.5" />

          {/* Role Dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6.5 gap-1 px-2 text-xs font-medium text-foreground/90 hover:bg-muted/70 hover:text-foreground font-sans rounded-md"
                  >
                    <span>{currentRoleObj.short}</span>
                    <ChevronDown className="size-2.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Switch Copilot persona</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="w-64 font-sans">
              <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Copilot Persona
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ROLE_OPTIONS.map((r) => (
                <DropdownMenuItem
                  key={r.id}
                  onClick={() => {
                    setAiRole(r.id);
                    addAiChatMessage({
                      role: "system",
                      content: `Persona switched to **${r.name}**. Guidelines focused on ${r.tagline}.`,
                    });
                  }}
                  className="flex flex-col items-start gap-0.5 py-1.5 cursor-pointer font-sans"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-xs text-foreground">
                      {r.name}
                    </span>
                    {aiRole === r.id && <Check className="size-3.5 text-foreground" />}
                  </div>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {r.tagline}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

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
                    <span className="truncate max-w-[85px]">{currentModelObj.name.replace("Gemini ", "")}</span>
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
                onClick={() => setAiPanelOpen(false)}
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
        <div className="border-b border-border bg-card/60 p-3 select-none font-sans animate-in slide-in-from-top-1 duration-150">
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
          <div className="py-6 px-2 flex flex-col items-center text-center space-y-4 select-none">
            <div className="size-10 rounded-xl bg-card border border-border flex items-center justify-center text-foreground shadow-2xs">
              <Code2 className="size-5" />
            </div>

            <div className="space-y-1 max-w-[280px]">
              <h3 className="text-sm font-semibold tracking-tight text-foreground font-sans">
                Copilot
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                Grounded engineering assistant for React components, Tailwind styling, and Framer Motion springs.
              </p>
            </div>

            {/* Quick Starter Cards */}
            <div className="grid grid-cols-1 gap-2 w-full pt-2">
              <button
                type="button"
                onClick={() =>
                  handleSubmitPrompt(
                    "Inspect component.tsx, demo.tsx, and index.css against all 21st.dev guidelines and auto-fix any issues.",
                    "autofix"
                  )
                }
                className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border/70 bg-card/50 hover:bg-card hover:border-border text-left transition-all group cursor-pointer"
              >
                <div className="size-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground group-hover:text-foreground shrink-0 mt-0.5">
                  <Wand2 className="size-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-foreground flex items-center justify-between">
                    <span>Auto-Fix Guidelines</span>
                    <ArrowRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                    Ensure cn(), typed Props, and client directives.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSubmitPrompt(
                    "Add smooth Framer Motion spring entry, hover scaling, and tap micro-interactions to component.tsx.",
                    "chat"
                  )
                }
                className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border/70 bg-card/50 hover:bg-card hover:border-border text-left transition-all group cursor-pointer"
              >
                <div className="size-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground group-hover:text-foreground shrink-0 mt-0.5">
                  <Zap className="size-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-foreground flex items-center justify-between">
                    <span>Spring Motion & Physics</span>
                    <ArrowRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                    Integrate natural Framer Motion gestures.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSubmitPrompt(
                    "Add complete dark and light mode support with Tailwind dark: classes and elegant contrast.",
                    "chat"
                  )
                }
                className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border/70 bg-card/50 hover:bg-card hover:border-border text-left transition-all group cursor-pointer"
              >
                <div className="size-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground group-hover:text-foreground shrink-0 mt-0.5">
                  <Moon className="size-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-foreground flex items-center justify-between">
                    <span>Dark & Light Mode Polish</span>
                    <ArrowRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                    Verify high-contrast dark: variants.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSubmitPrompt(
                    "Audit component.tsx for web accessibility (a11y), add ARIA labels, role attributes, and keyboard focus states.",
                    "chat"
                  )
                }
                className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border/70 bg-card/50 hover:bg-card hover:border-border text-left transition-all group cursor-pointer"
              >
                <div className="size-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground group-hover:text-foreground shrink-0 mt-0.5">
                  <ShieldCheck className="size-3" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-foreground flex items-center justify-between">
                    <span>A11y & ARIA Standards</span>
                    <ArrowRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                  </div>
                  <div className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                    Ensure keyboard focus rings and screen-reader tags.
                  </div>
                </div>
              </button>
            </div>
          </div>
        ) : null}

        {/* Multi-Turn Messages Stream */}
        {aiChatMessages.map((msg) => {
          const isUser = msg.role === "user";
          const isSystem = msg.role === "system";
          const hasCodeChanges =
            msg.changedFiles && Object.keys(msg.changedFiles).length > 0;
          const isApplied = appliedMessageIds[msg.id] || msg.applied;
          const isPreviewExpanded = expandedPreviewMsgId === msg.id;

          if (isSystem) {
            return (
              <div
                key={msg.id}
                className="my-2 py-1 px-2.5 rounded-md bg-muted/30 border border-border/40 text-[11px] text-muted-foreground text-center font-sans"
              >
                {msg.content}
              </div>
            );
          }

          if (isUser) {
            return (
              <Message key={msg.id} align="end">
                <MessageContent align="end">
                  <Bubble variant="user" align="end">
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
                    {currentRoleObj.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">•</span>
                  <Badge
                    variant="outline"
                    className="text-[9px] py-0 px-1 font-normal text-muted-foreground font-sans border-border/60"
                  >
                    {aiModel.replace("gemini-", "")}
                  </Badge>
                </MessageHeader>

                {/* Main Response Content with Real Markdown & Code Blocks */}
                <Bubble variant="editorial" align="start" className="w-full mt-1">
                  <MarkdownContent content={msg.content} />

                  {/* Code Diff & 1-Click Code Apply Card */}
                  {hasCodeChanges && msg.changedFiles && (
                    <div className="mt-3 rounded-lg border border-border/80 bg-card/90 overflow-hidden shadow-2xs font-sans">
                      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/40">
                        <div className="flex items-center gap-2 font-sans text-xs font-medium text-foreground">
                          <FileCode className="size-3.5 text-muted-foreground" />
                          <span>Proposed File Changes</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            ({Object.keys(msg.changedFiles).join(", ")})
                          </span>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedPreviewMsgId(
                              isPreviewExpanded ? null : msg.id
                            )
                          }
                          className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground font-sans gap-1"
                        >
                          <span>{isPreviewExpanded ? "Hide diff" : "Preview diff"}</span>
                          {isPreviewExpanded ? (
                            <ChevronUp className="size-3" />
                          ) : (
                            <ChevronDown className="size-3" />
                          )}
                        </Button>
                      </div>

                      {/* Expandable Preview of Modified Code */}
                      {isPreviewExpanded && (
                        <div className="p-2.5 bg-background/60 border-b border-border/60 max-h-64 overflow-y-auto space-y-2.5">
                          {Object.entries(msg.changedFiles).map(([fname, code]) => (
                            <div key={fname} className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-mono text-foreground/80 px-1">
                                <span className="font-semibold">{fname}</span>
                                <span className="text-[10px] text-muted-foreground">{code.split("\n").length} lines</span>
                              </div>
                              <pre className="p-2.5 rounded-md bg-muted/50 border border-border/50 text-[11px] font-mono leading-relaxed overflow-x-auto whitespace-pre text-foreground/90">
                                {code}
                              </pre>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="p-2 bg-muted/20">
                        <Button
                          variant={isApplied ? "outline" : "default"}
                          size="sm"
                          onClick={() =>
                            handleApplyChanges(msg.id, msg.changedFiles!)
                          }
                          disabled={isApplied}
                          className="w-full h-7 text-xs font-medium gap-1.5 rounded-md font-sans transition-all"
                        >
                          {isApplied ? (
                            <>
                              <Check className="size-3.5 text-emerald-500" />
                              <span className="text-emerald-500 font-medium">
                                Changes Applied to Editor
                              </span>
                            </>
                          ) : (
                            <>
                              <Code2 className="size-3.5" />
                              <span>
                                {Object.keys(msg.changedFiles).length === 1
                                  ? `Apply to ${Object.keys(msg.changedFiles)[0]}`
                                  : `Apply ${Object.keys(msg.changedFiles).length} files to Editor`}
                              </span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
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
                  {currentRoleObj.name}
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
              >
                Synthesizing response with {currentModelObj.name} for {currentRoleObj.name}...
              </Reasoning>
            </MessageContent>
          </Message>
        )}
      </div>

      {/* Bottom Area: Command-Grade Prompt Input */}
      <div className="p-3 border-t border-border bg-card/30 select-none">
        <PromptInput
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          onSubmit={() => handleSubmitPrompt()}
          isLoading={isAiThinking}
          placeholder={`Ask ${currentRoleObj.short}...`}
          modelBadge={
            <Badge
              variant="outline"
              className="text-[10px] py-0 px-1 font-normal text-muted-foreground border-border/60 font-sans"
            >
              {currentModelObj.name.replace("Gemini ", "")}
            </Badge>
          }
        />
      </div>
    </div>
  );
}
