"use client";

import React from "react";
import type {
  AiChatMessage,
  AttachedCodeSnippet,
  StudioFileName,
  StudioFiles,
} from "@/lib/store/studio-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  Suggestion,
  SuggestionGroup,
} from "@/components/ui/ai-elements";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { cn } from "@/lib/utils";
import {
  BookmarkCheck,
  Check,
  Code2,
  Copy,
  Eye,
  RotateCcw,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";

export interface AiMessageItemProps {
  msg: AiChatMessage;
  index: number;
  isLatestMessage: boolean;
  isAiThinking: boolean;
  aiModel: string;
  files: StudioFiles;
  activeDemoCode: string;
  copiedMessageId: string | null;
  checkpointSavedId: string | null;
  onPreviewImage: (img: { url: string; name?: string }) => void;
  onPreviewSnippet: (snippet: AttachedCodeSnippet) => void;
  onApproveChanges: (
    msgId: string,
    changedFiles: Partial<Record<StudioFileName, string>>
  ) => void;
  onRejectChanges: (msgId: string) => void;
  onRevertChanges: (msgId: string) => void;
  onSaveCheckpoint: (msgId: string, label: string) => void;
  onSubmitFollowUp: (suggestion: string) => void;
  onCopyMessage: (msgId: string, content: string) => void;
  onRetryTurn: (index: number) => void;
  onDeleteMessage: (msgId: string) => void;
}

export function AiMessageItem({
  msg,
  index,
  isLatestMessage,
  isAiThinking,
  aiModel,
  files,
  activeDemoCode,
  copiedMessageId,
  checkpointSavedId,
  onPreviewImage,
  onPreviewSnippet,
  onApproveChanges,
  onRejectChanges,
  onRevertChanges,
  onSaveCheckpoint,
  onSubmitFollowUp,
  onCopyMessage,
  onRetryTurn,
  onDeleteMessage,
}: AiMessageItemProps) {
  const isUser = msg.role === "user";
  const isSystem = msg.role === "system";
  const hasCodeChanges =
    msg.changedFiles && Object.keys(msg.changedFiles).length > 0;
  const resolvedStatus: "pending" | "approved" | "rejected" =
    msg.approvalStatus || (msg.applied ? "approved" : "pending");

  if (isSystem) {
    return (
      <div className="my-2 py-1 px-2.5 rounded-none bg-muted/30 border border-border/40 text-[11px] text-muted-foreground text-center font-sans">
        <MarkdownContent content={msg.content} />
      </div>
    );
  }

  if (isUser) {
    const userImages = msg.attachments?.images || [];
    const userSnippets = msg.attachments?.codeSnippets || [];

    return (
      <Message align="end">
        <MessageContent align="end" className="max-w-[85%]">
          <Bubble variant="user" align="end" className="space-y-2">
            {/* Attached Images Grid */}
            {userImages.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-end">
                {userImages.map((img) => (
                  <div
                    key={img.id}
                    onClick={() =>
                      onPreviewImage({
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
                    onClick={() => onPreviewSnippet(snip)}
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
                        msg.previousFiles["index.css"] ?? files["index.css"],
                    }
                  : {
                      "component.tsx": files["component.tsx"],
                      "default.tsx": activeDemoCode,
                      "demo.tsx": activeDemoCode,
                      "index.css": files["index.css"],
                    }
              }
              approvalStatus={resolvedStatus}
              onApprove={() => onApproveChanges(msg.id, msg.changedFiles!)}
              onReject={() => onRejectChanges(msg.id)}
              onRevert={() => onRevertChanges(msg.id)}
              onSaveCheckpoint={() =>
                onSaveCheckpoint(
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
                    onClick={() => onSubmitFollowUp(suggestion)}
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
                  onClick={() => onCopyMessage(msg.id, msg.content)}
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
                  onClick={() => onRetryTurn(index)}
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
                  onClick={() => onDeleteMessage(msg.id)}
                  className="size-6 rounded-none text-muted-foreground hover:text-rose-500"
                >
                  <Trash2 className="size-3" />
                  <span className="sr-only">Delete message</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Remove message</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </MessageContent>
    </Message>
  );
}
