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
  CornerDownLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Trace,
  TraceLine,
  TraceIcon,
  TraceTitle,
  TraceDescription,
  TraceCollapsible,
  TraceCollapsibleTrigger,
  TraceCollapsibleContent,
} from "@/components/ui/trace";

// ==========================================
// 1. REASONING (Official shadcn AI Element)
// ==========================================
export interface ReasoningProps {
  children?: React.ReactNode;
  isStreaming?: boolean;
  durationSeconds?: number;
  defaultOpen?: boolean;
  className?: string;
}

export function Reasoning({
  children,
  isStreaming = false,
  durationSeconds,
  defaultOpen = false,
  className,
}: ReasoningProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen || isStreaming);

  React.useEffect(() => {
    if (isStreaming) {
      setIsOpen(true);
    }
  }, [isStreaming]);

  if (!children && !isStreaming) return null;

  return (
    <Trace className={cn("border border-border/70 bg-muted/20 my-1 font-sans", className)}>
      <TraceCollapsible open={isOpen} onOpenChange={setIsOpen}>
        <TraceCollapsibleTrigger>
          <TraceLine status={isStreaming ? "running" : undefined}>
            <TraceIcon>
              {isStreaming ? (
                <Brain className="size-3.5 text-primary animate-pulse" />
              ) : (
                <Brain className="size-3.5 text-muted-foreground" />
              )}
            </TraceIcon>
            <TraceTitle className="text-xs font-medium text-foreground">
              {isStreaming ? "Thinking..." : "Thought"}
            </TraceTitle>
            {durationSeconds !== undefined && durationSeconds > 0 && !isStreaming && (
              <TraceDescription>{durationSeconds}s</TraceDescription>
            )}
          </TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent className="whitespace-pre-wrap text-xs text-muted-foreground pt-2 border-t border-border/40 mt-1 font-sans">
          {children || "Analyzing code structure and guidelines..."}
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
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
    <Trace className={cn("border border-border/80 bg-card p-3 my-1 font-sans shadow-2xs", className)}>
      <TraceCollapsible open={isOpen} onOpenChange={setIsOpen}>
        <TraceCollapsibleTrigger className="hover:no-underline">
          <TraceLine>
            <TraceIcon>
              {isDone ? (
                <CheckCircle2 className="size-4 text-emerald-500" />
              ) : (
                <Sparkles className="size-4 text-primary" />
              )}
            </TraceIcon>
            <TraceTitle className="text-xs font-semibold text-foreground">
              {title}
            </TraceTitle>
            <TraceDescription>
              <Badge variant={isDone ? "secondary" : "outline"} className="text-[10px] px-1.5 py-0 font-normal">
                {completedCount} / {totalCount} completed
              </Badge>
            </TraceDescription>
          </TraceLine>
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
    </Trace>
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
