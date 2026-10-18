"use client";

import * as React from "react";
import {
  Brain,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ArrowUp,
  FileCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  TraceCollapsible,
  TraceCollapsibleTrigger,
  TraceCollapsibleContent,
} from "@/components/ui/trace";

// ==========================================
// 1. REASONING (Clean, Polished Thought Process)
// ==========================================
export interface ReasoningStep {
  title: string;
  status: "done" | "running" | "pending";
}

export interface ReasoningProps {
  children?: React.ReactNode;
  isStreaming?: boolean;
  durationSeconds?: number;
  defaultOpen?: boolean;
  activeStep?: string;
  steps?: ReasoningStep[];
  className?: string;
}

export function Reasoning({
  children,
  isStreaming = false,
  durationSeconds,
  defaultOpen = false,
  activeStep,
  steps,
  className,
}: ReasoningProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  React.useEffect(() => {
    if (isStreaming) {
      setIsOpen(true);
    }
  }, [isStreaming]);

  return (
    <div className={cn("w-full my-1.5 select-none font-sans", className)}>
      <TraceCollapsible open={isOpen} onOpenChange={setIsOpen}>
        <TraceCollapsibleTrigger className="group/trigger inline-flex items-center gap-1.5 py-1 px-2 -ml-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer select-none border border-transparent hover:border-border/40">
          <Brain
            className={cn(
              "size-3.5 shrink-0 transition-colors",
              isStreaming ? "text-primary animate-pulse" : "text-muted-foreground/70"
            )}
          />
          <span className="text-xs font-medium text-foreground/80">
            {isStreaming
              ? activeStep || "Thinking..."
              : durationSeconds !== undefined && durationSeconds > 0
              ? `Thought for ${durationSeconds}s`
              : "Thought process"}
          </span>
          <ChevronDown className="size-3 text-muted-foreground/60 transition-transform duration-200 group-data-[state=open]/trigger:rotate-180" />
        </TraceCollapsibleTrigger>

        <TraceCollapsibleContent className="pt-1.5 pb-1">
          <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5 space-y-2 text-xs text-muted-foreground">
            {steps && steps.length > 0 ? (
              <div className="space-y-1.5">
                {steps.map((st, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {st.status === "done" && (
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    )}
                    {st.status === "running" && (
                      <Loader2 className="size-3.5 text-primary animate-spin shrink-0" />
                    )}
                    {st.status === "pending" && (
                      <div className="size-2 rounded-full border border-muted-foreground/40 shrink-0 ml-0.5 mr-1" />
                    )}
                    <span
                      className={cn(
                        "text-[11px] font-sans",
                        st.status === "running" && "text-foreground font-medium",
                        st.status === "done" && "text-muted-foreground",
                        st.status === "pending" && "text-muted-foreground/50"
                      )}
                    >
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}

            {children && (
              <div className="text-[11px] text-muted-foreground leading-relaxed pt-1 border-t border-border/40 font-sans">
                {children}
              </div>
            )}
          </div>
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </div>
  );
}

// ==========================================
// 2. SUGGESTIONS (Subtle, High-Signal Developer Chips)
// ==========================================
export interface SuggestionGroupProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function SuggestionGroup({
  children,
  className,
  ...props
}: SuggestionGroupProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center gap-1.5 overflow-x-auto py-1 scrollbar-none select-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface SuggestionProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: "outline" | "secondary" | "default";
}

export function Suggestion({
  icon,
  children,
  className,
  variant = "outline",
  ...props
}: SuggestionProps) {
  return (
    <Button
      variant={variant}
      size="sm"
      className={cn(
        "h-6.5 shrink-0 gap-1.5 rounded-md px-2.5 text-[11px] font-medium border-border/60 hover:border-border hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-all duration-150 select-none",
        className
      )}
      {...props}
    >
      {icon && <span className="size-3 shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </Button>
  );
}

// ==========================================
// 3. PLAN & STANDARDS AUDIT (Refined & Compact)
// ==========================================
export interface TaskItemProps {
  id: string;
  title: string;
  description?: string;
  status: "done" | "running" | "error" | "pending";
}

export interface PlanProps {
  title: string;
  tasks: TaskItemProps[];
  defaultOpen?: boolean;
  onAutoFix?: () => void;
  className?: string;
}

export function Plan({
  title,
  tasks,
  defaultOpen = false,
  onAutoFix,
  className,
}: PlanProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const completedCount = tasks.filter((t) => t.status === "done").length;
  const totalCount = tasks.length;
  const isDone = completedCount === totalCount;
  const errorCount = tasks.filter((t) => t.status === "error").length;

  return (
    <div
      className={cn(
        "rounded-lg border border-border/70 bg-card/50 p-2.5 font-sans transition-all",
        isDone ? "border-emerald-500/30 bg-emerald-500/5" : "",
        className
      )}
    >
      <TraceCollapsible open={isOpen} onOpenChange={setIsOpen}>
        <TraceCollapsibleTrigger className="group/trigger flex w-full items-center justify-between text-left hover:no-underline select-none cursor-pointer">
          <div className="flex items-center gap-2">
            {isDone ? (
              <CheckCircle2 className="size-3.5 text-emerald-500" />
            ) : errorCount > 0 ? (
              <AlertCircle className="size-3.5 text-amber-500" />
            ) : (
              <FileCode className="size-3.5 text-muted-foreground" />
            )}
            <span className="text-xs font-medium text-foreground">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Badge
              variant={isDone ? "secondary" : "outline"}
              className={cn(
                "text-[10px] px-1.5 py-0 font-normal font-sans",
                isDone && "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
              )}
            >
              {completedCount}/{totalCount} passed
            </Badge>
            <ChevronDown className="size-3 text-muted-foreground/60 transition-transform duration-200 group-data-[state=open]/trigger:rotate-180" />
          </div>
        </TraceCollapsibleTrigger>

        <TraceCollapsibleContent className="pt-2.5 mt-2 border-t border-border/40">
          <div className="space-y-1.5">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-2 rounded-md p-1.5 transition-colors hover:bg-muted/40"
              >
                <div className="mt-0.5 shrink-0">
                  {task.status === "done" && (
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                  )}
                  {task.status === "running" && (
                    <Loader2 className="size-3.5 animate-spin text-primary" />
                  )}
                  {task.status === "error" && (
                    <AlertCircle className="size-3.5 text-amber-500" />
                  )}
                  {task.status === "pending" && (
                    <div className="size-3 rounded-full border border-muted-foreground/40 mt-0.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      "text-xs font-medium text-foreground font-sans",
                      task.status === "done" && "text-muted-foreground"
                    )}
                  >
                    {task.title}
                  </div>
                  {task.description && (
                    <div className="text-[11px] text-muted-foreground/80 leading-normal mt-0.5 font-sans">
                      {task.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!isDone && onAutoFix && (
            <div className="mt-2.5 pt-2 border-t border-border/40">
              <Button
                variant="outline"
                size="sm"
                onClick={onAutoFix}
                className="w-full h-7 text-xs font-medium font-sans gap-1.5"
              >
                Auto-Fix Guidelines
              </Button>
            </div>
          )}
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </div>
  );
}

// ==========================================
// 4. PROMPT INPUT (Command-Grade Workspace Input)
// ==========================================
export interface PromptInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  placeholder?: string;
  modelBadge?: React.ReactNode;
  onModelClick?: () => void;
  className?: string;
}

export function PromptInput({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  placeholder = "Ask Copilot to refactor code, audit guidelines, or add components...",
  modelBadge,
  className,
}: PromptInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading) {
        onSubmit();
      }
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border border-border/70 bg-card/70 p-2 shadow-2xs transition-all duration-150 focus-within:border-border focus-within:ring-1 focus-within:ring-ring/20 focus-within:bg-background",
        className
      )}
    >
      <Textarea
        ref={textareaRef}
        rows={2}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        className="min-h-[48px] max-h-[140px] resize-none border-0 p-1 text-xs bg-transparent shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60 font-sans leading-relaxed text-foreground"
      />

      <div className="flex items-center justify-between pt-1.5 border-t border-border/40 select-none">
        <div className="flex items-center gap-1.5">
          {modelBadge}
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground/80 font-sans">
            <FileCode className="size-3 text-muted-foreground/60" />
            <span className="font-mono text-[10px]">component.tsx</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground/60 hidden sm:inline-block font-sans">
            <kbd className="px-1 py-0.5 rounded bg-muted/80 font-mono text-[9px] border border-border/40">Enter</kbd> to send
          </span>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onSubmit}
            disabled={isLoading || !value.trim()}
            className="size-7 p-0 rounded-lg shrink-0 font-sans transition-transform active:scale-95"
            title="Send prompt (Enter)"
          >
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ArrowUp className="size-3.5 stroke-[2.5]" />
            )}
            <span className="sr-only">Send prompt</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
