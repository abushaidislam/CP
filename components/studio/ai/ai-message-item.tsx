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
  AlertTriangle,
  BookmarkCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  Code2,
  Copy,
  Eye,
  Layers,
  RotateCcw,
  Sparkles,
  Trash2,
  User,
  Wrench,
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
  const [showBlueprint, setShowBlueprint] = React.useState(false);
  const isUser = msg.role === "user";
  const isSystem = msg.role === "system";
  const hasCodeChanges =
    msg.changedFiles && Object.keys(msg.changedFiles).length > 0;
  const resolvedStatus: "pending" | "approved" | "rejected" =
    msg.approvalStatus || (msg.applied ? "approved" : "pending");
  const hasRegistryRefs =
    Array.isArray(msg.registryReferences) && msg.registryReferences.length > 0;
  const hasBlueprintContent = Boolean(
    msg.blueprint &&
      (msg.blueprint.architectureNotes.length > 0 ||
        msg.blueprint.designTokens.length > 0 ||
        msg.blueprint.motionStrategy ||
        msg.blueprint.accessibilityNotes.length > 0 ||
        (msg.blueprint.referenceTakeaways &&
          msg.blueprint.referenceTakeaways.length > 0))
  );

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

        {/* Registry Visual References Grounding Strip (shown when selectively consulted) */}
        {hasRegistryRefs && msg.registryReferences && (
          <div className="w-full my-1.5 border border-border/80 bg-card/50 p-2.5 space-y-2 font-sans">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <Layers className="size-3 text-muted-foreground shrink-0" />
                <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  REGISTRY VISUAL REFERENCES
                </span>
              </div>
              {msg.referenceDecision && (
                <span className="text-[10px] text-muted-foreground font-sans truncate">
                  {msg.referenceDecision.mode === "auto"
                    ? "Smart Selective"
                    : msg.referenceDecision.mode === "always"
                    ? "Always Grounded"
                    : "Pinned"}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 @[420px]:grid-cols-2 gap-2">
              {msg.registryReferences.map((ref) => (
                <div
                  key={ref.slug}
                  className="flex items-center gap-2 border border-border/70 bg-background/70 p-1.5 min-w-0"
                >
                  {ref.previewUrl ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        onPreviewImage({
                          url: ref.previewUrl!,
                          name: `${ref.name} (${ref.category} Reference)`,
                        })
                      }
                      className="relative size-11 p-0 rounded-none border border-border/70 overflow-hidden shrink-0 cursor-pointer group"
                      title={`Inspect ${ref.name} preview reference`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ref.previewUrl}
                        alt={`${ref.name} visual reference`}
                        referrerPolicy="no-referrer"
                        className="size-full object-cover transition-transform group-hover:scale-105"
                      />
                    </Button>
                  ) : (
                    <div className="size-11 border border-border/70 bg-muted/50 flex items-center justify-center shrink-0">
                      <Code2 className="size-3.5 text-muted-foreground" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[11px] font-semibold text-foreground truncate">
                        {ref.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        · {ref.category}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {ref.matchReasons.join(" · ") || ref.slug}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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

          {/* Collapsible Architecture & Design Blueprint */}
          {hasBlueprintContent && msg.blueprint && (
            <div className="mt-3 border border-border/70 bg-background/60 font-sans">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowBlueprint((prev) => !prev)}
                className="w-full h-8 px-2.5 justify-between rounded-none text-xs font-medium text-foreground hover:bg-muted/40"
              >
                <span className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    DESIGN &amp; ARCHITECTURE BLUEPRINT
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "size-3.5 text-muted-foreground transition-transform duration-150",
                    showBlueprint && "rotate-180"
                  )}
                />
              </Button>

              {showBlueprint && (
                <div className="border-t border-border/60 px-3 py-2.5 space-y-2.5 text-[11px] text-muted-foreground">
                  {msg.blueprint.referenceTakeaways &&
                    msg.blueprint.referenceTakeaways.length > 0 && (
                      <div className="space-y-1">
                        <div className="font-mono text-[10px] uppercase tracking-wider text-foreground/80">
                          Registry Craft Takeaways
                        </div>
                        <ul className="space-y-0.5 list-disc pl-4">
                          {msg.blueprint.referenceTakeaways.map((item, i) => (
                            <li key={`ref-t-${i}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {msg.blueprint.architectureNotes.length > 0 && (
                    <div className="space-y-1">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-foreground/80">
                        Architecture &amp; Props
                      </div>
                      <ul className="space-y-0.5 list-disc pl-4">
                        {msg.blueprint.architectureNotes.map((item, i) => (
                          <li key={`arch-${i}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {msg.blueprint.designTokens.length > 0 && (
                    <div className="space-y-1">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-foreground/80">
                        Visual Surfaces &amp; Tokens
                      </div>
                      <ul className="space-y-0.5 list-disc pl-4">
                        {msg.blueprint.designTokens.map((item, i) => (
                          <li key={`tok-${i}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {msg.blueprint.motionStrategy && (
                    <div className="space-y-0.5">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-foreground/80">
                        Motion Choreography
                      </div>
                      <p className="leading-relaxed">{msg.blueprint.motionStrategy}</p>
                    </div>
                  )}

                  {msg.blueprint.accessibilityNotes.length > 0 && (
                    <div className="space-y-1">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-foreground/80">
                        Accessibility &amp; Edge Cases
                      </div>
                      <ul className="space-y-0.5 list-disc pl-4">
                        {[
                          ...msg.blueprint.accessibilityNotes,
                          ...msg.blueprint.edgeCasesHandled,
                        ].map((item, i) => (
                          <li key={`a11y-${i}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Real Post-Generation Compile & Compliance Verification Strip */}
          {msg.verification && hasCodeChanges && (
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border border-border/70 bg-muted/20 px-2.5 py-1.5 text-[11px] font-sans">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                {msg.verification.compileValid ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="size-3 shrink-0" />
                    <span>TSX Compile Verified</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                    <AlertTriangle className="size-3 shrink-0" />
                    <span>Syntax Warning</span>
                  </span>
                )}
                {msg.verification.selfRepaired && (
                  <>
                    <span className="text-border">·</span>
                    <span className="inline-flex items-center gap-1 text-foreground">
                      <Wrench className="size-2.5 shrink-0" />
                      <span>Auto-Repaired</span>
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground tabular-nums shrink-0">
                <span>
                  21st.dev {msg.verification.beforeScore} →{" "}
                  <strong className="text-foreground font-semibold">
                    {msg.verification.afterScore}
                  </strong>
                  /100
                </span>
                <span className="text-border">·</span>
                <span>{msg.verification.propsCount} props</span>
              </div>
            </div>
          )}

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
