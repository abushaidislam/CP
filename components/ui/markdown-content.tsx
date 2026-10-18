"use client";

import React, { useState } from "react";
import { Check, Copy, FileCode2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code, language = "tsx" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="my-2.5 overflow-hidden rounded-lg border border-border/70 bg-muted/40 font-mono text-xs">
      <div className="flex h-8 items-center justify-between border-b border-border/60 bg-muted/70 px-3 select-none">
        <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-sans">
          <FileCode2 className="size-3.5" />
          <span className="font-mono text-[10px] uppercase font-semibold text-foreground/80">
            {language}
          </span>
          <span className="text-[10px] text-muted-foreground/60">•</span>
          <span className="text-[10px] text-muted-foreground/80 font-mono">
            {code.trim().split("\n").length} lines
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 gap-1 px-1.5 text-[11px] font-sans text-muted-foreground hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="size-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3" />
              <span>Copy</span>
            </>
          )}
        </Button>
      </div>
      <div className="overflow-x-auto p-3 text-[12px] leading-relaxed text-foreground/90 font-mono select-text bg-background/50">
        <pre className="font-mono whitespace-pre">{code.trim()}</pre>
      </div>
    </div>
  );
}

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  // Parse code blocks vs regular text blocks
  const parts = React.useMemo(() => {
    const raw = content || "";
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const segments: Array<
      | { type: "text"; text: string }
      | { type: "code"; code: string; language: string }
    > = [];

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(raw)) !== null) {
      if (match.index > lastIndex) {
        segments.push({
          type: "text",
          text: raw.slice(lastIndex, match.index),
        });
      }

      segments.push({
        type: "code",
        language: match[1] || "tsx",
        code: match[2] || "",
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < raw.length) {
      segments.push({
        type: "text",
        text: raw.slice(lastIndex),
      });
    }

    return segments;
  }, [content]);

  // Formatter for regular text paragraphs (handles bold, inline code, bullet points, headers)
  const renderTextSegment = (text: string, segmentIdx: number) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];

    lines.forEach((line, lineIdx) => {
      const trimmed = line.trim();

      // Heading 3: ### Title
      if (trimmed.startsWith("### ")) {
        elements.push(
          <h4
            key={`h3-${segmentIdx}-${lineIdx}`}
            className="mt-3 mb-1 text-xs font-semibold text-foreground font-sans tracking-tight"
          >
            {renderInlineMarkdown(trimmed.slice(4))}
          </h4>
        );
        return;
      }

      // Heading 2: ## Title
      if (trimmed.startsWith("## ")) {
        elements.push(
          <h3
            key={`h2-${segmentIdx}-${lineIdx}`}
            className="mt-3.5 mb-1.5 text-xs font-semibold text-foreground font-sans tracking-tight"
          >
            {renderInlineMarkdown(trimmed.slice(3))}
          </h3>
        );
        return;
      }

      // Heading 1: # Title
      if (trimmed.startsWith("# ")) {
        elements.push(
          <h2
            key={`h1-${segmentIdx}-${lineIdx}`}
            className="mt-4 mb-2 text-sm font-semibold text-foreground font-sans tracking-tight"
          >
            {renderInlineMarkdown(trimmed.slice(2))}
          </h2>
        );
        return;
      }

      // Unordered list item: - text or * text
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        elements.push(
          <div
            key={`li-${segmentIdx}-${lineIdx}`}
            className="flex items-start gap-2 my-1 text-xs text-foreground/90 leading-relaxed"
          >
            <span className="size-1.5 rounded-full bg-primary/70 shrink-0 mt-1.5" />
            <div className="flex-1 font-sans">
              {renderInlineMarkdown(trimmed.slice(2))}
            </div>
          </div>
        );
        return;
      }

      // Ordered list item: 1. text
      const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (orderedMatch) {
        elements.push(
          <div
            key={`oli-${segmentIdx}-${lineIdx}`}
            className="flex items-start gap-2 my-1 text-xs text-foreground/90 leading-relaxed"
          >
            <span className="font-mono text-[10px] text-muted-foreground font-medium shrink-0 mt-0.5 min-w-[14px]">
              {orderedMatch[1]}.
            </span>
            <div className="flex-1 font-sans">
              {renderInlineMarkdown(orderedMatch[2])}
            </div>
          </div>
        );
        return;
      }

      // Empty line
      if (!trimmed) {
        elements.push(<div key={`sp-${segmentIdx}-${lineIdx}`} className="h-1.5" />);
        return;
      }

      // Regular paragraph line
      elements.push(
        <p
          key={`p-${segmentIdx}-${lineIdx}`}
          className="my-1 text-xs text-foreground/90 leading-relaxed font-sans"
        >
          {renderInlineMarkdown(line)}
        </p>
      );
    });

    return elements;
  };

  return (
    <div className={cn("space-y-0.5 font-sans leading-relaxed text-xs", className)}>
      {parts.map((segment, idx) => {
        if (segment.type === "code") {
          return (
            <CodeBlock
              key={`code-${idx}`}
              code={segment.code}
              language={segment.language}
            />
          );
        }
        return (
          <React.Fragment key={`text-${idx}`}>
            {renderTextSegment(segment.text, idx)}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Parses inline bold **text** and inline code `code`
function renderInlineMarkdown(str: string): React.ReactNode {
  // Regex to match `code` or **bold**
  const regex = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  const parts = str.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={index}
          className="font-mono px-1.5 py-0.5 rounded-md bg-muted/80 text-[11px] text-foreground font-medium border border-border/50 mx-0.5"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={index} className="font-semibold text-foreground font-sans">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}
