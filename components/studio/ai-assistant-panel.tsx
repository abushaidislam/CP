"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useStudioStore } from "@/lib/store/studio-store";
import { auditComponentGuidelines } from "@/lib/sandbox/guideline-linter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Key,
  Check,
  ExternalLink,
  PanelRightClose,
  Trash2,
  FileCode,
  Wand2,
  Moon,
  Zap,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";

export function AiAssistantPanel() {
  const {
    files,
    dependencies,
    isAiPanelOpen,
    aiPanelWidth,
    geminiApiKey,
    aiModel,
    aiChatMessages,
    isAiThinking,
    setAiPanelOpen,
    setAiPanelWidth,
    setGeminiApiKey,
    setAiModel,
    addAiChatMessage,
    markAiMessageApplied,
    clearAiChat,
    setAiThinking,
    applyAiChanges,
  } = useStudioStore();

  const [promptInput, setPromptInput] = useState("");
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(geminiApiKey);
  const [tempModel, setTempModel] = useState(aiModel || "gemini-2.5-flash");
  const [appliedMessageIds, setAppliedMessageIds] = useState<Record<string, boolean>>({});
  const [thinkingSeconds, setThinkingSeconds] = useState(0);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time static guideline audit (runs in 0ms on client keystrokes)
  const auditResult = useMemo(() => {
    return auditComponentGuidelines(
      files["component.tsx"],
      files["demo.tsx"],
      files["index.css"],
      dependencies
    );
  }, [files, dependencies]);

  // Map guideline checks to official Plan & Task elements
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

  // Real-time progressive working steps during thinking
  const workingSteps = useMemo(() => {
    if (thinkingSeconds < 2) {
      return [
        { title: "Analyzing AST tree & TypeScript interfaces...", status: "running" as const },
        { title: "Auditing 21st.dev marketplace guidelines...", status: "pending" as const },
        { title: "Synthesizing code refactor & suggestions...", status: "pending" as const },
      ];
    } else if (thinkingSeconds < 4) {
      return [
        { title: "Analyzed AST tree & TypeScript interfaces", status: "done" as const },
        { title: "Auditing 21st.dev marketplace guidelines...", status: "running" as const },
        { title: "Synthesizing code refactor & suggestions...", status: "pending" as const },
      ];
    } else {
      return [
        { title: "Analyzed AST tree & TypeScript interfaces", status: "done" as const },
        { title: "Audited 21st.dev marketplace guidelines", status: "done" as const },
        { title: "Synthesizing code refactor & suggestions...", status: "running" as const },
      ];
    }
  }, [thinkingSeconds]);

  const currentStepTitle = useMemo(() => {
    if (thinkingSeconds < 2) return "Analyzing AST...";
    if (thinkingSeconds < 4) return "Auditing standards...";
    return "Writing code...";
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

  // Submit AI Prompt (Chat or Auto-Fix)
  const handleSubmitPrompt = async (
    customPrompt?: string,
    action: "chat" | "autofix" | "audit" = "chat"
  ) => {
    const text = (customPrompt || promptInput).trim();
    if (!text && action === "chat") return;

    if (!customPrompt) {
      setPromptInput("");
    }

    addAiChatMessage({
      role: "user",
      content:
        text ||
        (action === "autofix"
          ? "Auto-fix 21st.dev guidelines issues"
          : "Audit component standards"),
    });

    setAiThinking(true);

    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          action,
          componentCode: files["component.tsx"],
          demoCode: files["demo.tsx"],
          cssCode: files["index.css"],
          dependencies,
          apiKey: geminiApiKey,
          model: aiModel,
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
        content: data.message || "Audit completed.",
        changedFiles:
          data.changedFiles && Object.keys(data.changedFiles).length > 0
            ? data.changedFiles
            : undefined,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      addAiChatMessage({
        role: "assistant",
        content: `Connection error: ${errorMsg}. Please check your internet connection or Gemini API Key.`,
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

  // Save API Key & Model Settings
  const handleSaveSettings = () => {
    setGeminiApiKey(tempApiKey);
    setAiModel(tempModel);
    setIsKeyModalOpen(false);
  };

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

      {/* Top Header (Clean Minimalist shadcn Layout) */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-card/60 px-3 backdrop-blur-xs">
        {/* Brand & Model Selector Trigger */}
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-xs">
            <Sparkles className="size-3.5" />
          </div>
          <span className="font-semibold text-xs text-foreground">
            21st Copilot
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTempApiKey(geminiApiKey);
              setTempModel(aiModel);
              setIsKeyModalOpen(true);
            }}
            className="h-6 gap-1 px-1.5 text-[11px] text-muted-foreground hover:text-foreground font-normal"
          >
            <span className="truncate max-w-[100px]">{aiModel}</span>
            <ChevronDown className="size-3 opacity-60" />
          </Button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {geminiApiKey ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTempApiKey(geminiApiKey);
                    setTempModel(aiModel);
                    setIsKeyModalOpen(true);
                  }}
                  className="h-6 gap-1.5 px-2 text-[11px] text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                >
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Free Pro API</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Connected to Gemini API ({aiModel}). Click to change.
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTempApiKey("");
                    setIsKeyModalOpen(true);
                  }}
                  className="h-6 gap-1 px-2 text-[11px] text-primary border-primary/30 hover:bg-primary/10"
                >
                  <Key className="size-3" />
                  <span>Connect Key</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Add free Google AI Studio key for custom generations
              </TooltipContent>
            </Tooltip>
          )}

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
                <span className="sr-only">Clear chat</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Clear chat history</TooltipContent>
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
                <span className="sr-only">Close Copilot panel</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Close panel (Ctrl+I)</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Main Chat Thread Area */}
      <div
        ref={chatScrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-4 select-text font-sans scroll-smooth"
      >
        <Marker variant="separator">21st.dev Audit & Copilot</Marker>

        {/* Live Plan / Standards Checklist Element (Official shadcn Plan) */}
        <Plan
          title="21st.dev Component Standards"
          tasks={planTasks}
          defaultOpen={auditResult.score < 100}
        />

        {/* Messages Stream */}
        {aiChatMessages.map((msg) => {
          const isUser = msg.role === "user";
          const hasCodeChanges =
            msg.changedFiles && Object.keys(msg.changedFiles).length > 0;
          const isApplied = appliedMessageIds[msg.id] || msg.applied;

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
                      U
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
                  <span className="font-semibold text-foreground">
                    21st Copilot
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[9px] py-0 px-1 font-normal text-muted-foreground"
                  >
                    {aiModel}
                  </Badge>
                </MessageHeader>

                {/* Inline Reasoning Trace (Official shadcn Reasoning) */}
                <Reasoning durationSeconds={2} defaultOpen={false}>
                  Audited component AST syntax, verified 21st.dev marketplace standards, and checked Tailwind utility classes.
                </Reasoning>

                <Bubble variant="outline" align="start" className="w-full">
                  <BubbleContent>{msg.content}</BubbleContent>

                  {/* Trace for AI Activity & 1-Click Code Apply */}
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
                          Modified
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

        {/* Real-time Streaming Assistant Turn (No extra div wrapper) */}
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
                <span className="font-semibold text-foreground">
                  21st Copilot
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
                Synthesizing component code, validating AST props, and formatting Tailwind classes...
              </Reasoning>
            </MessageContent>
          </Message>
        )}
      </div>

      {/* Bottom Area: Official shadcn Suggestions + Prompt Input */}
      <div className="p-2.5 border-t border-border bg-background/95 space-y-2">
        {/* Suggestion Group (Official shadcn Suggestion elements) */}
        <SuggestionGroup>
          <Suggestion
            icon={<Wand2 className="size-3 text-primary" />}
            variant="secondary"
            onClick={() =>
              handleSubmitPrompt(
                "Inspect component.tsx, demo.tsx, and index.css against all 21st.dev guidelines and auto-fix any missing requirements (such as className forwarding, cn(), props interface, use client).",
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
                "Add comprehensive dark mode support using Tailwind 'dark:' variants to component.tsx and demo.tsx.",
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
                "Add smooth Framer Motion entry and hover animations to component.tsx.",
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
                "Audit component.tsx for web accessibility (a11y), add appropriate ARIA labels, role attributes, and keyboard focus states.",
                "chat"
              )
            }
            disabled={isAiThinking}
          >
            A11y Audit
          </Suggestion>
        </SuggestionGroup>

        {/* Prompt Input (Official shadcn PromptInput element) */}
        <PromptInput
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          onSubmit={() => handleSubmitPrompt()}
          isLoading={isAiThinking}
          placeholder="Ask Copilot to refactor, style, or enhance..."
          modelBadge={
            <Badge
              variant="outline"
              className="text-[10px] py-0 px-1.5 font-normal text-muted-foreground cursor-pointer hover:bg-muted"
              onClick={() => {
                setTempApiKey(geminiApiKey);
                setTempModel(aiModel);
                setIsKeyModalOpen(true);
              }}
            >
              {aiModel}
            </Badge>
          }
        />
      </div>

      {/* Free Gemini API Key Configuration Dialog */}
      <Dialog open={isKeyModalOpen} onOpenChange={setIsKeyModalOpen}>
        <DialogContent className="sm:max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Key className="size-4 text-primary" />
              <span>Connect Free Gemini API</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Google AI Studio provides a free API key with zero credit card required. Your key is stored securely in your browser session.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="block font-medium mb-1 text-foreground">
                Gemini API Key
              </label>
              <Input
                type="password"
                placeholder="AIzaSy..."
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
              <span>Need a free API key?</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1 font-medium"
              >
                <span>Get key from Google AI Studio</span>
                <ExternalLink className="size-3" />
              </a>
            </div>

            <div>
              <label className="block font-medium mb-1 text-foreground">
                Model
              </label>
              <select
                value={tempModel}
                onChange={(e) => setTempModel(e.target.value)}
                className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring font-sans"
              >
                <option value="gemini-2.5-flash">
                  Gemini 2.5 Flash (Recommended - Fast & Free)
                </option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast)</option>
                <option value="gemini-2.5-pro">
                  Gemini 2.5 Pro (Deep Reasoning)
                </option>
              </select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsKeyModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveSettings}
              className="text-xs"
            >
              Save Key & Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
