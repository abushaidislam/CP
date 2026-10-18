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
  Marker,
  Trace,
  TraceLine,
} from "@/components/ui/chat";
import {
  Reasoning,
  SuggestionGroup,
  Suggestion,
  Plan,
  PromptInput,
  TaskItemProps,
} from "@/components/ui/ai-elements";
import {
  Sparkles,
  Check,
  PanelRightClose,
  Trash2,
  FileCode,
  Wand2,
  Moon,
  Zap,
  ShieldCheck,
  ChevronDown,
  Bot,
  BrainCircuit,
  Gauge,
  User,
} from "lucide-react";

const MODEL_OPTIONS = [
  {
    id: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    tag: "General Tasks",
    description: "Best for general coding, component design, and daily refactoring.",
    icon: Sparkles,
  },
  {
    id: "gemini-4-argon",
    name: "Gemini 4 Argon",
    tag: "Complex Tasks",
    description: "Advanced reasoning for complex architecture, state logic, and intricate algorithms.",
    icon: BrainCircuit,
  },
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash Lite",
    tag: "Fast Tasks",
    description: "Lightning-fast turnaround for quick questions and straightforward edits.",
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
    tagline: "Tailwind aesthetics, typography & Framer Motion springs",
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

  // Progressive reasoning steps
  const workingSteps = useMemo(() => {
    if (thinkingSeconds < 2) {
      return [
        { title: "Analyzing conversation history & editor state...", status: "running" as const },
        { title: "Synthesizing role-specific directives...", status: "pending" as const },
        { title: "Generating response & component code...", status: "pending" as const },
      ];
    } else if (thinkingSeconds < 4) {
      return [
        { title: "Analyzed conversation history & editor state", status: "done" as const },
        { title: "Synthesizing role-specific directives...", status: "running" as const },
        { title: "Generating response & component code...", status: "pending" as const },
      ];
    } else {
      return [
        { title: "Analyzed conversation history & editor state", status: "done" as const },
        { title: "Synthesized role-specific directives", status: "done" as const },
        { title: "Generating response & component code...", status: "running" as const },
      ];
    }
  }, [thinkingSeconds]);

  const currentStepTitle = useMemo(() => {
    if (thinkingSeconds < 2) return "Processing context...";
    if (thinkingSeconds < 4) return "Reasoning...";
    return "Writing response...";
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
      setAiPanelWidth(startWidthRef.current + deltaX);
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

  // Submit AI Prompt (Multi-turn chat)
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

    // 1. Append user turn to local multi-turn history
    addAiChatMessage({
      role: "user",
      content: userMessageContent,
    });

    setAiThinking(true);

    try {
      // 2. Transmit conversation history + current editor state to server API
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

      // 3. Append assistant multi-turn response
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
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-primary/20 transition-colors z-30 group"
        title="Drag left/right to resize AI panel"
      >
        <div className="h-full w-px bg-border group-hover:bg-primary transition-colors" />
      </div>

      {/* Top Header */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-card/60 px-3 backdrop-blur-xs">
        {/* Brand & Multi-Turn Role/Model Controls */}
        <div className="flex items-center gap-1.5">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-xs">
            <Bot className="size-3.5" />
          </div>

          {/* Role Dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs font-medium text-foreground hover:bg-muted/60"
                  >
                    <span>{currentRoleObj.short}</span>
                    <ChevronDown className="size-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Switch Chatbot Persona / Role</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="w-64 font-sans">
              <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Chatbot Role
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ROLE_OPTIONS.map((r) => (
                <DropdownMenuItem
                  key={r.id}
                  onClick={() => {
                    setAiRole(r.id);
                    addAiChatMessage({
                      role: "system",
                      content: `Persona switched to **${r.name}**. System instruction updated for ${r.tagline}.`,
                    });
                  }}
                  className="flex flex-col items-start gap-0.5 py-1.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-xs text-foreground">
                      {r.name}
                    </span>
                    {aiRole === r.id && <Check className="size-3.5 text-primary" />}
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
                    className="h-6 gap-1 px-1.5 text-[11px] font-normal text-muted-foreground border-border hover:text-foreground"
                  >
                    <span className="truncate max-w-[90px]">{currentModelObj.tag}</span>
                    <ChevronDown className="size-2.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Select Gemini Model</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="w-72 font-sans">
              <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Gemini Model Selection
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {MODEL_OPTIONS.map((m) => {
                const IconComponent = m.icon;
                return (
                  <DropdownMenuItem
                    key={m.id}
                    onClick={() => setAiModel(m.id)}
                    className="flex flex-col items-start gap-1 py-2 cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5">
                        <IconComponent className="size-3.5 text-primary" />
                        <span className="font-medium text-xs text-foreground">
                          {m.name}
                        </span>
                        <Badge variant="secondary" className="text-[9px] py-0 px-1 font-normal">
                          {m.tag}
                        </Badge>
                      </div>
                      {aiModel === m.id && <Check className="size-3.5 text-primary" />}
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
          {/* Clear Chat */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearAiChat}
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="size-3.5" />
                <span className="sr-only">Clear chat history</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Clear conversation history</TooltipContent>
          </Tooltip>

          {/* Close Panel */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAiPanelOpen(false)}
                className="size-7 text-muted-foreground hover:text-foreground"
              >
                <PanelRightClose className="size-3.5" />
                <span className="sr-only">Close assistant panel</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Close panel (Ctrl+I)</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Main Multi-Turn Chat Thread */}
      <div
        ref={chatScrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-4 select-text font-sans scroll-smooth"
      >
        <Marker variant="separator">
          Gemini Assistant • {currentRoleObj.name}
        </Marker>

        {/* Standards Checklist Element */}
        <Plan
          title="Component Standards"
          tasks={planTasks}
          defaultOpen={false}
        />

        {/* Multi-Turn Messages Stream */}
        {aiChatMessages.map((msg) => {
          const isUser = msg.role === "user";
          const isSystem = msg.role === "system";
          const hasCodeChanges =
            msg.changedFiles && Object.keys(msg.changedFiles).length > 0;
          const isApplied = appliedMessageIds[msg.id] || msg.applied;

          if (isSystem) {
            return (
              <div
                key={msg.id}
                className="my-2 py-1.5 px-3 rounded-lg bg-muted/40 border border-border/50 text-[11px] text-muted-foreground text-center"
              >
                {msg.content}
              </div>
            );
          }

          if (isUser) {
            return (
              <Message key={msg.id} align="end">
                <MessageContent align="end">
                  <Bubble variant="default" align="end">
                    <BubbleContent>{msg.content}</BubbleContent>
                  </Bubble>
                  <MessageFooter>{msg.timestamp}</MessageFooter>
                </MessageContent>
                <MessageAvatar>
                  <Avatar className="size-6 text-[10px]">
                    <AvatarFallback className="bg-primary/20 text-primary font-medium">
                      <User className="size-3" />
                    </AvatarFallback>
                  </Avatar>
                </MessageAvatar>
              </Message>
            );
          }

          return (
            <Message key={msg.id} align="start">
              <MessageAvatar>
                <Avatar className="size-6 bg-primary text-primary-foreground shadow-2xs">
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    <Sparkles className="size-3" />
                  </AvatarFallback>
                </Avatar>
              </MessageAvatar>

              <MessageContent align="start">
                <MessageHeader>
                  <span className="font-semibold text-foreground text-xs">
                    {currentRoleObj.name}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[9px] py-0 px-1 font-normal text-muted-foreground"
                  >
                    {aiModel}
                  </Badge>
                </MessageHeader>

                {/* Inline Reasoning Trace */}
                <Reasoning durationSeconds={1} defaultOpen={false}>
                  Analyzed multi-turn history, audited AST props and Tailwind classes, and aligned output with {currentRoleObj.name} persona guidelines.
                </Reasoning>

                <Bubble variant="outline" align="start" className="w-full">
                  <BubbleContent>{msg.content}</BubbleContent>

                  {/* Code Diff & 1-Click Code Apply Trace */}
                  {hasCodeChanges && msg.changedFiles && (
                    <Trace className="mt-2 border-border/80 bg-muted/40">
                      <TraceLine status="done">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <FileCode className="size-3.5 text-primary" />
                          <span>{Object.keys(msg.changedFiles).join(", ")}</span>
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-[9px] py-0 px-1 font-mono"
                        >
                          Code Ready
                        </Badge>
                      </TraceLine>

                      <Button
                        variant={isApplied ? "outline" : "default"}
                        size="sm"
                        onClick={() =>
                          handleApplyChanges(msg.id, msg.changedFiles!)
                        }
                        disabled={isApplied}
                        className="w-full h-7 text-xs font-medium gap-1.5 mt-1 rounded-md"
                      >
                        {isApplied ? (
                          <>
                            <Check className="size-3 text-emerald-500" />
                            <span>Applied to Editor</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="size-3" />
                            <span>Apply Changes to Editor</span>
                          </>
                        )}
                      </Button>
                    </Trace>
                  )}
                </Bubble>

                <MessageFooter>{msg.timestamp}</MessageFooter>
              </MessageContent>
            </Message>
          );
        })}

        {/* Real-time Streaming Assistant Turn */}
        {isAiThinking && (
          <Message align="start">
            <MessageAvatar>
              <Avatar className="size-6 bg-primary text-primary-foreground shadow-2xs">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  <Sparkles className="size-3" />
                </AvatarFallback>
              </Avatar>
            </MessageAvatar>

            <MessageContent align="start" className="w-full">
              <MessageHeader>
                <span className="font-semibold text-foreground text-xs">
                  {currentRoleObj.name}
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] py-0 px-1 font-normal text-muted-foreground"
                >
                  {aiModel}
                </Badge>
              </MessageHeader>

              <Reasoning
                isStreaming={true}
                durationSeconds={thinkingSeconds}
                activeStep={currentStepTitle}
                steps={workingSteps}
              >
                Synthesizing response with {currentModelObj.name} in persona of {currentRoleObj.name}...
              </Reasoning>
            </MessageContent>
          </Message>
        )}
      </div>

      {/* Bottom Area: Suggestions + Multi-Turn Prompt Input */}
      <div className="p-2.5 border-t border-border bg-background/95 space-y-2">
        {/* Suggestion Group */}
        <SuggestionGroup>
          <Suggestion
            icon={<Wand2 className="size-3 text-primary" />}
            variant="secondary"
            onClick={() =>
              handleSubmitPrompt(
                "Inspect component.tsx, demo.tsx, and index.css against all 21st.dev guidelines and auto-fix missing requirements (className forwarding, cn(), props interface, use client).",
                "autofix"
              )
            }
            disabled={isAiThinking}
            className="border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
          >
            ⚡ Auto-Fix All
          </Suggestion>

          <Suggestion
            icon={<Moon className="size-3 text-muted-foreground" />}
            onClick={() =>
              handleSubmitPrompt(
                "Add complete dark and light mode support with Tailwind dark: classes and elegant contrast.",
                "chat"
              )
            }
            disabled={isAiThinking}
          >
            Dark Mode
          </Suggestion>

          <Suggestion
            icon={<Zap className="size-3 text-muted-foreground" />}
            onClick={() =>
              handleSubmitPrompt(
                "Add smooth Framer Motion spring entry, hover, and tap micro-interactions to component.tsx.",
                "chat"
              )
            }
            disabled={isAiThinking}
          >
            Spring Motion
          </Suggestion>

          <Suggestion
            icon={<ShieldCheck className="size-3 text-muted-foreground" />}
            onClick={() =>
              handleSubmitPrompt(
                "Audit component.tsx for web accessibility (a11y), add ARIA labels, role attributes, and keyboard focus states.",
                "chat"
              )
            }
            disabled={isAiThinking}
          >
            A11y Audit
          </Suggestion>
        </SuggestionGroup>

        {/* Multi-Turn Prompt Input */}
        <PromptInput
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          onSubmit={() => handleSubmitPrompt()}
          isLoading={isAiThinking}
          placeholder={`Ask ${currentRoleObj.short} (${currentModelObj.tag})...`}
          modelBadge={
            <Badge
              variant="outline"
              className="text-[10px] py-0 px-1.5 font-normal text-muted-foreground"
            >
              {currentModelObj.name}
            </Badge>
          }
        />
      </div>
    </div>
  );
}
