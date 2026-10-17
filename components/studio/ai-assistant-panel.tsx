"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useStudioStore } from "@/lib/store/studio-store";
import { auditComponentGuidelines, GuidelineCheckItem } from "@/lib/sandbox/guideline-linter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
  Sparkles,
  Key,
  Check,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  RotateCcw,
  FileCode,
  ExternalLink,
  ShieldCheck,
  PanelRightClose,
  Wand2,
  Moon,
  Zap,
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
  const [showChecklist, setShowChecklist] = useState(false);
  const [appliedMessageIds, setAppliedMessageIds] = useState<Record<string, boolean>>({});

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Real-time static guideline audit (runs in 0ms on client keystrokes)
  const auditResult = useMemo(() => {
    return auditComponentGuidelines(
      files["component.tsx"],
      files["demo.tsx"],
      files["index.css"],
      dependencies
    );
  }, [files, dependencies]);

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
  const handleSubmitPrompt = async (customPrompt?: string, action: "chat" | "autofix" | "audit" = "chat") => {
    const text = (customPrompt || promptInput).trim();
    if (!text && action === "chat") return;

    if (!customPrompt) {
      setPromptInput("");
    }

    // Add user message to chat
    addAiChatMessage({
      role: "user",
      content: text || (action === "autofix" ? "Auto-fix 21st.dev guidelines issues" : "Audit component standards"),
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

      // Add assistant response to chat
      addAiChatMessage({
        role: "assistant",
        content: data.message || "Audit completed.",
        changedFiles: data.changedFiles && Object.keys(data.changedFiles).length > 0 ? data.changedFiles : undefined,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      addAiChatMessage({
        role: "assistant",
        content: `Connection error: ${errorMsg}. Please check network or your Gemini API Key.`,
      });
    } finally {
      setAiThinking(false);
    }
  };

  // 1-Click Apply Code Fixes to Editor
  const handleApplyChanges = (msgId: string, changedFiles: Partial<Record<string, string>>) => {
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

  const scoreColor =
    auditResult.score >= 90
      ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/30"
      : auditResult.score >= 70
      ? "text-amber-500 bg-amber-500/10 border-amber-500/30"
      : "text-red-500 bg-red-500/10 border-red-500/30";

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
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-muted/20 px-3">
        {/* Left: Brand / Title */}
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="size-3.5" />
          </div>
          <span className="font-semibold text-xs text-foreground">
            21st Copilot
          </span>
          <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal text-muted-foreground">
            AI Assistant
          </Badge>
        </div>

        {/* Right: API Status & Close Button */}
        <div className="flex items-center gap-1.5">
          {/* API Connection Badge / Button */}
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
                  className="h-6 gap-1.5 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span>Gemini Free</span>
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
                  <span>Connect Free API</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Add free Google AI Studio key for AI generation
              </TooltipContent>
            </Tooltip>
          )}

          {/* Close Panel Button */}
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

      {/* 21st.dev Compliance Scorecard */}
      <div className="border-b border-border bg-muted/10 p-3 select-text">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center justify-center font-bold text-xs px-2 py-0.5 rounded-md border ${scoreColor}`}
            >
              {auditResult.score}/100
            </span>
            <div>
              <div className="font-medium text-xs text-foreground">
                {auditResult.score >= 90
                  ? "21st.dev Marketplace Ready"
                  : auditResult.score >= 70
                  ? "Good — Minor Polish Needed"
                  : "Needs Guidelines Attention"}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {auditResult.passedCount} of {auditResult.totalChecks} standards passed
              </div>
            </div>
          </div>

          {/* Checklist Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChecklist(!showChecklist)}
            className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <span>{showChecklist ? "Hide" : "Details"}</span>
            {showChecklist ? (
              <ChevronUp className="size-3 ml-0.5" />
            ) : (
              <ChevronDown className="size-3 ml-0.5" />
            )}
          </Button>
        </div>

        {/* Collapsible Guidelines Detail List */}
        {showChecklist && (
          <div className="mt-3 space-y-1.5 pt-2 border-t border-border/60 text-xs animate-in fade-in duration-150">
            {auditResult.checks.map((chk: GuidelineCheckItem) => (
              <div
                key={chk.id}
                className="flex items-start gap-2 rounded-md p-1.5 hover:bg-muted/30 transition-colors"
              >
                {chk.passed ? (
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                ) : chk.severity === "error" ? (
                  <AlertCircle className="size-3.5 text-red-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-medium text-[11px] text-foreground">
                    {chk.title}
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-normal">
                    {chk.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action Chips Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-2 border-b border-border bg-background no-scrollbar">
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            handleSubmitPrompt(
              "Inspect component.tsx, demo.tsx, and index.css against all 21st.dev guidelines and auto-fix any missing requirements (like className forwarding, cn(), props interface, use client).",
              "autofix"
            )
          }
          disabled={isAiThinking}
          className="h-6 px-2 text-[11px] shrink-0 gap-1 font-normal bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
        >
          <Wand2 className="size-3" />
          <span>⚡ Auto-Fix All</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            handleSubmitPrompt(
              "Add comprehensive dark mode support using Tailwind 'dark:' variants to component.tsx and demo.tsx.",
              "chat"
            )
          }
          disabled={isAiThinking}
          className="h-6 px-2 text-[11px] shrink-0 gap-1 font-normal text-muted-foreground hover:text-foreground"
        >
          <Moon className="size-3" />
          <span>Dark Mode</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            handleSubmitPrompt(
              "Add smooth Framer Motion entry and hover animations to component.tsx.",
              "chat"
            )
          }
          disabled={isAiThinking}
          className="h-6 px-2 text-[11px] shrink-0 gap-1 font-normal text-muted-foreground hover:text-foreground"
        >
          <Zap className="size-3" />
          <span>Spring Motion</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            handleSubmitPrompt(
              "Audit component.tsx for web accessibility (a11y), add appropriate ARIA labels, role attributes, and keyboard focus states.",
              "chat"
            )
          }
          disabled={isAiThinking}
          className="h-6 px-2 text-[11px] shrink-0 gap-1 font-normal text-muted-foreground hover:text-foreground"
        >
          <ShieldCheck className="size-3" />
          <span>A11y Audit</span>
        </Button>
      </div>

      {/* Interactive Chat & Suggestions Stream */}
      <div
        ref={chatScrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-3 select-text"
      >
        {aiChatMessages.map((msg) => {
          const isUser = msg.role === "user";
          const hasCodeChanges =
            msg.changedFiles && Object.keys(msg.changedFiles).length > 0;
          const isApplied = appliedMessageIds[msg.id] || msg.applied;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${
                isUser ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[90%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                  isUser
                    ? "bg-primary text-primary-foreground font-medium"
                    : "bg-muted/50 border border-border text-foreground"
                }`}
              >
                {/* Content */}
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* 1-Click Code Apply Card */}
                {hasCodeChanges && msg.changedFiles && (
                  <div className="mt-2.5 pt-2 border-t border-border/60">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                        <FileCode className="size-3" />
                        <span>
                          {Object.keys(msg.changedFiles).join(", ")}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px] py-0 px-1 text-emerald-500 border-emerald-500/30">
                        Ready
                      </Badge>
                    </div>

                    <Button
                      variant={isApplied ? "outline" : "default"}
                      size="sm"
                      onClick={() =>
                        handleApplyChanges(msg.id, msg.changedFiles!)
                      }
                      disabled={isApplied}
                      className="w-full h-7 text-xs font-medium gap-1.5"
                    >
                      {isApplied ? (
                        <>
                          <Check className="size-3 text-emerald-500" />
                          <span>Applied to Editor</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-3" />
                          <span>Apply to Editor</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          );
        })}

        {/* Thinking Indicator */}
        {isAiThinking && (
          <div className="flex items-center gap-2 rounded-xl bg-muted/40 border border-border p-3 text-xs text-muted-foreground animate-pulse">
            <Loader2 className="size-3.5 animate-spin text-primary" />
            <span>21st Copilot is reviewing and generating code...</span>
          </div>
        )}
      </div>

      {/* Chat Prompt Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmitPrompt();
        }}
        className="flex shrink-0 items-center gap-2 border-t border-border bg-background p-2.5"
      >
        <Input
          type="text"
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          placeholder="Ask AI to modify, fix, or add features..."
          disabled={isAiThinking}
          className="h-8 text-xs bg-muted/40"
        />
        <Button
          type="submit"
          variant="default"
          size="icon"
          disabled={isAiThinking || !promptInput.trim()}
          className="size-8 shrink-0"
        >
          {isAiThinking ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Send className="size-3.5" />
          )}
          <span className="sr-only">Send</span>
        </Button>
      </form>

      {/* Free Gemini API Key Configuration Dialog */}
      <Dialog open={isKeyModalOpen} onOpenChange={setIsKeyModalOpen}>
        <DialogContent className="sm:max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Key className="size-4 text-primary" />
              <span>Connect Free Gemini API</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Google AI Studio provides a free API key for developers with zero credit card required. Your key is stored locally in your browser.
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
                className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended - Fast & Free)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Reasoning)</option>
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
