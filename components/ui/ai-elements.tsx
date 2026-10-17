"use client";

import * as React from "react";
import {
  Brain,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  ChevronDown,
  Sparkles,
  Send,
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
// 1. REASONING (Official shadcn AI Element)
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
    <div className={cn("w-full my-1 select-none font-sans", className)}>
      <TraceCollapsible open={isOpen} onOpenChange={setIsOpen}>
        <TraceCollapsibleTrigger className="group/trigger inline-flex items-center gap-1.5 py-1 px-2 -ml-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors cursor-pointer select-none">
          <Brain
            className={cn(
              "size-3.5 shrink-0 transition-colors",
              isStreaming ? "text-primary animate-pulse" : "text-muted-foreground/70"
            )}
          />
          <span className="text-xs font-medium">
            {isStreaming ? (activeStep || "Thinking...") : "Thought"}
          </span>
          {durationSeconds !== undefined && durationSeconds > 0 && (
            <span className="text-[11px] text-muted-foreground/70 font-normal">
              {durationSeconds}s
            </span>
          )}
          <ChevronDown className="size-3 text-muted-foreground/60 transition-transform duration-200 group-data-[state=open]/trigger:rotate-180" />
        </TraceCollapsibleTrigger>

        <TraceCollapsibleContent className="pt-1 pb-1">
          <div className="border-l-2 border-primary/30 pl-3 py-1 space-y-2 text-xs text-muted-foreground">
            {steps && steps.length > 0 ? (
              <div className="space-y-1.5">
                {steps.map((st, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {st.status === "done" && (
                      <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                    )}
                    {st.status === "running" && (
                      <Loader2 className="size-3 text-primary animate-spin shrink-0" />
                    )}
                    {st.status === "pending" && (
                      <div className="size-2 rounded-full border border-muted-foreground/40 shrink-0 ml-0.5 mr-0.5" />
                    )}
                    <span
                      className={cn(
                        "text-[11px]",
                        st.status === "running" && "text-foreground font-medium",
                        st.status === "done" && "text-muted-foreground/80",
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
              <div className="text-[11px] text-muted-foreground/90 whitespace-pre-wrap leading-relaxed">
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
// 2. SUGGESTIONS (Official shadcn AI Element)
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
        "flex w-full items-center gap-1.5 overflow-x-auto py-1 scrollbar-none",
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
        "h-7 shrink-0 gap-1.5 rounded-full px-3 text-[11px] font-normal transition-all hover:bg-muted/80",
        className
      )}
      {...props}
    >
      {icon && <span className="size-3.5 shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </Button>
  );
}

// ==========================================
// 3. PLAN & TASK (Official shadcn AI Element)
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
  className?: string;
}

export function Plan({
  title,
  tasks,
  defaultOpen = true,
  className,
}: PlanProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const completedCount = tasks.filter((t) => t.status === "done").length;
  const totalCount = tasks.length;
  const isDone = completedCount === totalCount;

  return (
    <div className={cn("rounded-xl border border-border/70 bg-card/60 p-2.5 my-1 font-sans transition-all", className)}>
      <TraceCollapsible open={isOpen} onOpenChange={setIsOpen}>
        <TraceCollapsibleTrigger className="group/trigger flex w-full items-center justify-between text-left hover:no-underline select-none">
          <div className="flex items-center gap-2">
            {isDone ? (
              <CheckCircle2 className="size-4 text-emerald-500" />
            ) : (
              <Sparkles className="size-4 text-primary" />
            )}
            <span className="text-xs font-semibold text-foreground">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={isDone ? "secondary" : "outline"} className="text-[10px] px-1.5 py-0 font-normal">
              {completedCount} / {totalCount} passed
            </Badge>
            <ChevronDown className="size-3 text-muted-foreground/60 transition-transform duration-200 group-data-[state=open]/trigger:rotate-180" />
          </div>
        </TraceCollapsibleTrigger>

        <TraceCollapsibleContent className="pt-2.5 mt-2 border-t border-border/50">
          <div className="space-y-1.5">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-2.5 rounded-md p-1.5 transition-colors hover:bg-muted/40"
              >
                <div className="mt-0.5 shrink-0">
                  {task.status === "done" && (
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                  )}
                  {task.status === "running" && (
                    <Loader2 className="size-3.5 animate-spin text-primary" />
                  )}
                  {task.status === "error" && (
                    <AlertCircle className="size-3.5 text-destructive" />
                  )}
                  {task.status === "pending" && (
                    <div className="size-3.5 rounded-full border border-muted-foreground/40" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      "text-xs font-medium text-foreground",
                      task.status === "done" && "text-muted-foreground line-through opacity-80"
                    )}
                  >
                    {task.title}
                  </div>
                  {task.description && (
                    <div className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                      {task.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </div>
  );
}

// ==========================================
// 4. PROMPT INPUT (Official shadcn AI Element)
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
  placeholder = "Ask AI to edit, fix guidelines, or add components...",
  modelBadge,
  onModelClick,
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
        "flex flex-col rounded-xl border border-border/80 bg-background p-2 shadow-2xs transition-all focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20",
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
        className="min-h-[50px] resize-none border-0 p-1 text-xs bg-transparent shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60 font-sans"
      />

      <div className="flex items-center justify-between pt-1.5 border-t border-border/40 select-none">
        <div className="flex items-center gap-1.5">
          {modelBadge}
          <span className="text-[10px] text-muted-foreground hidden sm:inline-block">
            <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-[9px]">Enter</kbd> to send
          </span>
        </div>

        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={onSubmit}
          disabled={isLoading || !value.trim()}
          className="h-7 px-2.5 text-xs gap-1.5 font-medium rounded-lg"
        >
          {isLoading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Send className="size-3.5" />
          )}
          <span>Send</span>
        </Button>
      </div>
    </div>
  );
}
