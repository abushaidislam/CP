"use client";

import React from "react";
import type { AiChatRole, StudioState } from "@/lib/store/studio-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Code2,
  Lock,
  PanelRightClose,
  Play,
  ShieldCheck,
  Trash2,
  Unlock,
} from "lucide-react";
import {
  MODEL_OPTIONS,
  ROLE_OPTIONS,
  type AiModelOption,
  type AiRoleOption,
} from "./ai-copilot-constants";

export interface AiPanelHeaderProps {
  aiModel: string;
  aiRole: AiChatRole;
  currentModelObj: AiModelOption;
  currentRoleObj: AiRoleOption;
  autoApplyAiChanges: boolean;
  preserveDesignSkill: boolean;
  passedCount: number;
  totalChecksCount: number;
  allPassed: boolean;
  showGuidelinesDrawer: boolean;
  isOwnerAuthenticated: boolean;
  securityTelemetry: StudioState["securityTelemetry"];
  onSelectModel: (model: string) => void;
  onSelectRole: (role: AiChatRole) => void;
  onToggleAutoApply: () => void;
  onTogglePreserveDesign: () => void;
  onToggleGuidelinesDrawer: () => void;
  onClearChat: () => void;
  onClosePanel: () => void;
  onOpenSecurityModal: () => void;
}

export function AiPanelHeader({
  aiModel,
  aiRole,
  currentModelObj,
  currentRoleObj,
  autoApplyAiChanges,
  preserveDesignSkill,
  passedCount,
  totalChecksCount,
  allPassed,
  showGuidelinesDrawer,
  isOwnerAuthenticated,
  securityTelemetry,
  onSelectModel,
  onSelectRole,
  onToggleAutoApply,
  onTogglePreserveDesign,
  onToggleGuidelinesDrawer,
  onClearChat,
  onClosePanel,
  onOpenSecurityModal,
}: AiPanelHeaderProps) {
  return (
    <>
      {/* Top Header - Editorial, Clean & Polished */}
      <div className="studio-toolbar-surface flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border bg-card/40 px-2.5 @[420px]:px-3 select-none overflow-hidden">
        <div className="flex items-center gap-1.5 @[420px]:gap-2 min-w-0 flex-1 overflow-hidden">
          {/* Subtle Copilot Mark */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex size-5.5 items-center justify-center rounded-none bg-foreground text-background shadow-2xs">
              <Code2 className="size-3 stroke-[2.2]" />
            </div>
            <span className="text-xs font-semibold tracking-tight text-foreground font-sans">
              Copilot
            </span>
          </div>

          <div className="h-3.5 w-px bg-border/70 mx-0.5 shrink-0" />

          {/* Model & Specialist Persona Dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6.5 gap-1 px-2 text-[11px] font-normal text-muted-foreground border-border/80 hover:text-foreground hover:border-border font-sans rounded-none bg-background/70 min-w-0"
                  >
                    <span className="truncate max-w-[90px] @[440px]:max-w-[130px]">
                      {currentModelObj.name.replace("Gemini ", "")}
                    </span>
                    <span className="hidden @[460px]:inline text-border">•</span>
                    <span className="hidden @[460px]:inline truncate text-foreground font-medium">
                      {currentRoleObj.name}
                    </span>
                    <ChevronDown className="size-2.5 opacity-60 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Configure Gemini model, specialist persona & execution preferences
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent
              align="start"
              className="w-72 rounded-none font-sans max-h-[80vh] overflow-y-auto"
            >
              <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Gemini Engine
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {MODEL_OPTIONS.map((m) => {
                const IconComponent = m.icon;
                return (
                  <DropdownMenuItem
                    key={m.id}
                    onClick={() => onSelectModel(m.id)}
                    className="flex flex-col items-start gap-1 py-1.5 cursor-pointer rounded-none font-sans"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5">
                        <IconComponent className="size-3.5 text-muted-foreground" />
                        <span className="font-medium text-xs text-foreground">
                          {m.name}
                        </span>
                        <Badge
                          variant="secondary"
                          className="rounded-none text-[9px] py-0 px-1 font-normal font-sans"
                        >
                          {m.tag}
                        </Badge>
                      </div>
                      {aiModel === m.id && (
                        <Check className="size-3.5 text-foreground" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground leading-snug">
                      {m.description}
                    </span>
                  </DropdownMenuItem>
                );
              })}

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Specialist Persona
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ROLE_OPTIONS.map((r) => {
                const RoleIcon = r.icon;
                return (
                  <DropdownMenuItem
                    key={r.id}
                    onClick={() => onSelectRole(r.id)}
                    className="flex flex-col items-start gap-1 py-1.5 cursor-pointer rounded-none font-sans"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5">
                        <RoleIcon className="size-3.5 text-muted-foreground" />
                        <span className="font-medium text-xs text-foreground">
                          {r.name}
                        </span>
                        <Badge
                          variant="secondary"
                          className="rounded-none text-[9px] py-0 px-1 font-normal font-sans"
                        >
                          {r.tag}
                        </Badge>
                      </div>
                      {aiRole === r.id && (
                        <Check className="size-3.5 text-foreground" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground leading-snug">
                      {r.description}
                    </span>
                  </DropdownMenuItem>
                );
              })}

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Execution Skills
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={onToggleAutoApply}
                className="flex flex-col items-start gap-1 py-1.5 cursor-pointer rounded-none font-sans"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <Play
                      className={cn(
                        "size-3.5",
                        autoApplyAiChanges
                          ? "text-emerald-500"
                          : "text-muted-foreground"
                      )}
                    />
                    <span className="font-medium text-xs text-foreground">
                      Auto-Apply Code to Live Canvas
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "rounded-none text-[9px] py-0 px-1 font-normal font-sans",
                        autoApplyAiChanges &&
                          "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                      )}
                    >
                      {autoApplyAiChanges ? "On" : "Manual"}
                    </Badge>
                  </div>
                  {autoApplyAiChanges && (
                    <Check className="size-3.5 text-emerald-500" />
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground leading-snug">
                  Immediately updates live preview when Copilot edits files (with 1-click Revert).
                </span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={onTogglePreserveDesign}
                className="flex flex-col items-start gap-1 py-1.5 cursor-pointer rounded-none font-sans"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    {preserveDesignSkill ? (
                      <Lock className="size-3.5 text-emerald-500" />
                    ) : (
                      <Unlock className="size-3.5 text-muted-foreground" />
                    )}
                    <span className="font-medium text-xs text-foreground">
                      Preserve UI & Design Lock
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "rounded-none text-[9px] py-0 px-1 font-normal font-sans",
                        preserveDesignSkill &&
                          "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                      )}
                    >
                      {preserveDesignSkill ? "Active" : "Off"}
                    </Badge>
                  </div>
                  {preserveDesignSkill && (
                    <Check className="size-3.5 text-emerald-500" />
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground leading-snug">
                  Edits code, logic, and types without altering existing UI design or layout.
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Live Guidelines Status Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                aria-expanded={showGuidelinesDrawer}
                aria-label={`Toggle 21st.dev component standards (${passedCount} of ${totalChecksCount} passed)`}
                onClick={onToggleGuidelinesDrawer}
                className={cn(
                  "h-7 gap-1.5 px-2 text-[11px] font-sans rounded-none border-border/80 bg-background/70 transition-colors",
                  allPassed
                    ? "text-muted-foreground hover:text-foreground"
                    : "text-amber-500 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 font-medium"
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-none shrink-0",
                    allPassed ? "bg-emerald-500" : "bg-amber-500"
                  )}
                />
                <span className="tabular-nums">
                  {passedCount}/{totalChecksCount}
                </span>
                {showGuidelinesDrawer ? (
                  <ChevronUp className="size-2.5 opacity-60 shrink-0" />
                ) : (
                  <ChevronDown className="size-2.5 opacity-60 shrink-0" />
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
                variant="outline"
                size="icon-sm"
                onClick={onClearChat}
                className="studio-icon-btn size-7 text-muted-foreground hover:text-foreground rounded-none border-border/80 bg-background/70"
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
                variant="outline"
                size="icon-sm"
                onClick={onClosePanel}
                className="studio-icon-btn size-7 text-muted-foreground hover:text-foreground rounded-none border-border/80 bg-background/70"
              >
                <PanelRightClose className="size-3.5" />
                <span className="sr-only">Close Copilot panel</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Close panel (Ctrl+I)</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Owner Security & API Credit Protection Status Bar */}
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-2 border-b border-border px-2.5 @[420px]:px-3 py-1.5 text-[11px] font-sans select-none",
          isOwnerAuthenticated
            ? "bg-emerald-500/5 text-foreground"
            : "bg-amber-500/10 text-amber-500"
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {isOwnerAuthenticated ? (
            <ShieldCheck className="size-3.5 text-emerald-500 shrink-0" />
          ) : (
            <Lock className="size-3.5 text-amber-500 shrink-0" />
          )}
          <span className="truncate font-medium">
            {isOwnerAuthenticated
              ? "Owner Session Active"
              : "AI Credits Locked (Read-Only)"}
          </span>
          {securityTelemetry?.dailyQuota && (
            <Badge
              variant="outline"
              className="rounded-none text-[9px] py-0 px-1 font-sans tabular-nums border-border/80 text-muted-foreground shrink-0"
            >
              {securityTelemetry.dailyQuota.remaining}/{securityTelemetry.dailyQuota.limit} left
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSecurityModal}
            className="h-6 rounded-none px-2 text-[10px] font-sans shrink-0"
          >
            {isOwnerAuthenticated ? "Shield" : "Unlock Owner"}
          </Button>
        </div>
      </div>
    </>
  );
}
