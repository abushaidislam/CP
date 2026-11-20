"use client";

import React from "react";
import type { AiChatRole } from "@/lib/store/studio-store";
import type { GuidelineCheckItem } from "@/lib/sandbox/guideline-linter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Code2,
  Layers,
  ShieldCheck,
  SunMoon,
  Wand2,
  Zap,
} from "lucide-react";
import { ROLE_OPTIONS, type AiRoleOption } from "./ai-copilot-constants";

export interface AiWelcomeScreenProps {
  aiRole: AiChatRole;
  currentRoleObj: AiRoleOption;
  compLinesCount: number;
  hasCompilerError: boolean;
  compilerError: string | null;
  allPassed: boolean;
  passPercentage: number;
  failingChecks: GuidelineCheckItem[];
  onSelectRole: (role: AiChatRole) => void;
  onSubmitPrompt: (
    customPrompt: string,
    action?: "chat" | "autofix" | "audit"
  ) => void;
}

export function AiWelcomeScreen({
  aiRole,
  currentRoleObj,
  compLinesCount,
  hasCompilerError,
  compilerError,
  allPassed,
  passPercentage,
  failingChecks,
  onSelectRole,
  onSubmitPrompt,
}: AiWelcomeScreenProps) {
  return (
    <div className="py-2 @[420px]:py-3 flex flex-col space-y-3.5 select-none animate-in fade-in duration-200">
      {/* Architectural Identity & Telemetry Banner */}
      <div className="rounded-none border border-border bg-card/60 p-3.5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-none border border-border bg-foreground text-background">
              <Code2 className="size-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="text-xs @[420px]:text-sm font-semibold tracking-tight text-foreground font-sans">
                  Copilot Intelligence
                </h3>
                <Badge
                  variant="eyebrow"
                  className="rounded-none text-[9px] py-0 px-1.5"
                >
                  {currentRoleObj.name.toUpperCase()}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-sans mt-0.5">
                Grounded pairing assistant for React components, Tailwind styling, and Framer Motion springs. Type{" "}
                <kbd className="font-mono text-[10px] px-1 py-0.5 border border-border bg-muted/60">
                  /
                </kbd>{" "}
                for quick slash commands.
              </p>
            </div>
          </div>
        </div>

        {/* Specialist Persona Quick Strip */}
        <div className="flex flex-wrap items-center gap-1 pt-2 border-t border-border/60">
          {ROLE_OPTIONS.map((role) => {
            const Icon = role.icon;
            const isActive = aiRole === role.id;
            return (
              <Button
                key={role.id}
                type="button"
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onSelectRole(role.id)}
                className={cn(
                  "h-6 gap-1 px-2 text-[10px] rounded-none font-sans",
                  isActive
                    ? "bg-foreground text-background hover:bg-foreground/90 font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-2.5 shrink-0" />
                <span>{role.name}</span>
              </Button>
            );
          })}
        </div>

        {/* Live Component Telemetry Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-border/60 text-[11px] font-sans text-muted-foreground">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={cn(
                "size-1.5 rounded-none shrink-0",
                hasCompilerError
                  ? "bg-rose-500 animate-pulse"
                  : allPassed
                  ? "bg-emerald-500"
                  : "bg-amber-500"
              )}
            />
            <span className="font-mono text-foreground text-[10px] truncate">
              component.tsx
            </span>
            <span className="text-border">·</span>
            <span className="tabular-nums shrink-0">{compLinesCount} lines</span>
          </div>
          <span
            className={cn(
              "font-medium tabular-nums shrink-0 text-[11px]",
              hasCompilerError
                ? "text-rose-500 font-semibold"
                : allPassed
                ? "text-emerald-500"
                : "text-amber-500"
            )}
          >
            {hasCompilerError
              ? "Syntax / Compile Error"
              : `${passPercentage}% 21st.dev Ready`}
          </span>
        </div>
      </div>

      {/* Responsive Quick Action Grid (2 cols on compact, 4 cols on wide) */}
      <div className="grid grid-cols-2 @[480px]:grid-cols-4 gap-1.5 w-full">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onSubmitPrompt(
              "Audit component.tsx against 21st.dev standards and fix all missing requirements (className forwarding, cn(), props interface, use client) while keeping the existing UI design, layout, and styling 100% unchanged.",
              "autofix"
            )
          }
          className="h-7 text-[11px] justify-start @[480px]:justify-center gap-1.5 px-2.5 font-sans rounded-none border-border/80 bg-card/40 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors"
        >
          <ShieldCheck className="size-3.5 text-emerald-500 shrink-0" />
          <span className="truncate">Audit Standards</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onSubmitPrompt(
              "Add smooth Framer Motion spring entry, hover scaling, and tap micro-interactions to component.tsx while preserving the existing UI layout and visual design.",
              "chat"
            )
          }
          className="h-7 text-[11px] justify-start @[480px]:justify-center gap-1.5 px-2.5 font-sans rounded-none border-border/80 bg-card/40 hover:border-violet-500/40 hover:bg-violet-500/5 transition-colors"
        >
          <Zap className="size-3.5 text-violet-500 shrink-0" />
          <span className="truncate">Spring Motion</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onSubmitPrompt(
              "Add complete dark and light mode support with Tailwind dark: classes while preserving the existing component layout and design structure.",
              "chat"
            )
          }
          className="h-7 text-[11px] justify-start @[480px]:justify-center gap-1.5 px-2.5 font-sans rounded-none border-border/80 bg-card/40 hover:border-amber-500/40 hover:bg-amber-500/5 transition-colors"
        >
          <SunMoon className="size-3.5 text-amber-500 shrink-0" />
          <span className="truncate">Dark & Light</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onSubmitPrompt(
              "Refactor component.tsx to optimize performance, clean up types, and ensure modularity while keeping the existing UI design, layout, and visual styling 100% unchanged.",
              "chat"
            )
          }
          className="h-7 text-[11px] justify-start @[480px]:justify-center gap-1.5 px-2.5 font-sans rounded-none border-border/80 bg-card/40 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-colors"
        >
          <Wand2 className="size-3.5 text-cyan-500 shrink-0" />
          <span className="truncate">Refactor</span>
        </Button>
      </div>

      {/* Dynamic Priority Alerts (Full Width) */}
      {(hasCompilerError || failingChecks.length > 0) && (
        <div className="grid grid-cols-1 gap-2 w-full">
          {/* Dynamic Priority Card: If Compiler Error */}
          {hasCompilerError && (
            <Button
              variant="outline"
              onClick={() =>
                onSubmitPrompt(
                  `Fix the compiler error in component.tsx:\n${compilerError}\nResolve all syntax, import, and type issues cleanly without affecting existing styling.`,
                  "chat"
                )
              }
              className="h-auto w-full flex items-start justify-start gap-3 p-3 rounded-none border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/60 text-left transition-all group whitespace-normal font-sans shadow-none"
            >
              <div className="size-7 rounded-none bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0 mt-0.5">
                <AlertTriangle className="size-3.5 animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    Fix Runtime / Compiler Error
                  </span>
                  <Badge
                    variant="secondary"
                    className="rounded-none text-[9px] py-0 px-1 font-sans font-medium uppercase bg-rose-500/20 text-rose-500 border border-rose-500/30"
                  >
                    CRITICAL
                  </Badge>
                </div>
                <div className="text-[11px] font-normal text-muted-foreground leading-normal mt-0.5 line-clamp-2">
                  {compilerError}
                </div>
              </div>
              <ArrowRight className="size-3.5 text-rose-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
            </Button>
          )}

          {/* Dynamic Priority Card: If Failing Standards */}
          {!hasCompilerError && failingChecks.length > 0 && (
            <Button
              variant="outline"
              onClick={() =>
                onSubmitPrompt(
                  `Audit component.tsx against 21st.dev standards and fix all failing requirements: ${failingChecks.map((c) => c.title).join(", ")}. Ensure className forwarding with cn(), typed props, and clean structure while keeping the existing UI design, layout, and styling 100% unchanged.`,
                  "autofix"
                )
              }
              className="h-auto w-full flex items-start justify-start gap-3 p-3 rounded-none border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/60 text-left transition-all group whitespace-normal font-sans shadow-none"
            >
              <div className="size-7 rounded-none bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                <ShieldCheck className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    Fix {failingChecks.length} Missing Standard
                    {failingChecks.length > 1 ? "s" : ""}
                  </span>
                  <Badge
                    variant="secondary"
                    className="rounded-none text-[9px] py-0 px-1 font-sans font-medium uppercase bg-amber-500/20 text-amber-500 border border-amber-500/30 tabular-nums"
                  >
                    {failingChecks.length}{" "}
                    {failingChecks.length === 1 ? "ISSUE" : "ISSUES"}
                  </Badge>
                </div>
                <div className="text-[11px] font-normal text-muted-foreground leading-normal mt-0.5 line-clamp-1">
                  {failingChecks.map((c) => c.title).join(" · ")}
                </div>
              </div>
              <ArrowRight className="size-3.5 text-amber-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
            </Button>
          )}
        </div>
      )}

      {/* Container-Responsive Smart Cards Grid (1 col on compact, 2 cols on >= 520px panel width) */}
      <div className="grid grid-cols-1 @[520px]:grid-cols-2 gap-2 w-full">
        {/* Smart Card 1: Spring Motion & Micro-interactions */}
        <Button
          variant="outline"
          onClick={() =>
            onSubmitPrompt(
              "Add smooth Framer Motion spring entry, hover scaling, and tap micro-interactions to component.tsx while keeping the existing UI layout and visual design intact.",
              "chat"
            )
          }
          className="h-auto w-full flex items-start justify-start gap-2.5 p-3 rounded-none border-border/80 bg-card/50 hover:bg-card hover:border-violet-500/40 transition-all duration-150 group text-left whitespace-normal font-sans shadow-none"
        >
          <div className="size-7 rounded-none bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-500 shrink-0 mt-0.5">
            <Zap className="size-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-medium text-foreground group-hover:text-violet-500 transition-colors truncate">
                Spring Motion & Physics
              </span>
              <Badge
                variant="secondary"
                className="rounded-none text-[9px] py-0 px-1 font-sans font-medium uppercase text-muted-foreground shrink-0"
              >
                MOTION
              </Badge>
            </div>
            <div className="text-[11px] font-normal text-muted-foreground leading-normal mt-0.5">
              Integrate natural Framer Motion gestures & hover springs.
            </div>
          </div>
          <ArrowRight className="size-3.5 text-muted-foreground/40 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
        </Button>

        {/* Smart Card 2: Dark & Light Mode Polish */}
        <Button
          variant="outline"
          onClick={() =>
            onSubmitPrompt(
              "Add complete dark and light mode support with Tailwind dark: classes while preserving the existing component layout and design structure.",
              "chat"
            )
          }
          className="h-auto w-full flex items-start justify-start gap-2.5 p-3 rounded-none border-border/80 bg-card/50 hover:bg-card hover:border-amber-500/40 transition-all duration-150 group text-left whitespace-normal font-sans shadow-none"
        >
          <div className="size-7 rounded-none bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
            <SunMoon className="size-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-medium text-foreground group-hover:text-amber-500 transition-colors truncate">
                Dark & Light Theme Polish
              </span>
              <Badge
                variant="secondary"
                className="rounded-none text-[9px] py-0 px-1 font-sans font-medium uppercase text-muted-foreground shrink-0"
              >
                THEMING
              </Badge>
            </div>
            <div className="text-[11px] font-normal text-muted-foreground leading-normal mt-0.5">
              Verify high-contrast Tailwind dark: tokens & balance.
            </div>
          </div>
          <ArrowRight className="size-3.5 text-muted-foreground/40 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
        </Button>

        {/* Smart Card 3: A11y & ARIA Standards */}
        <Button
          variant="outline"
          onClick={() =>
            onSubmitPrompt(
              "Audit component.tsx for web accessibility (a11y), add ARIA labels, role attributes, and keyboard focus states while keeping the existing UI design and layout 100% unchanged.",
              "chat"
            )
          }
          className="h-auto w-full flex items-start justify-start gap-2.5 p-3 rounded-none border-border/80 bg-card/50 hover:bg-card hover:border-cyan-500/40 transition-all duration-150 group text-left whitespace-normal font-sans shadow-none"
        >
          <div className="size-7 rounded-none bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 shrink-0 mt-0.5">
            <CheckCircle2 className="size-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-medium text-foreground group-hover:text-cyan-500 transition-colors truncate">
                Accessibility & ARIA
              </span>
              <Badge
                variant="secondary"
                className="rounded-none text-[9px] py-0 px-1 font-sans font-medium uppercase text-muted-foreground shrink-0"
              >
                A11Y
              </Badge>
            </div>
            <div className="text-[11px] font-normal text-muted-foreground leading-normal mt-0.5">
              Ensure keyboard focus rings, roles, and screen-reader tags.
            </div>
          </div>
          <ArrowRight className="size-3.5 text-muted-foreground/40 group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
        </Button>

        {/* Smart Card 4: Architecture & Clean Code */}
        <Button
          variant="outline"
          onClick={() =>
            onSubmitPrompt(
              "Refactor component.tsx to extract reusable subcomponents, streamline TypeScript props, and memoize callbacks while keeping the existing UI design, layout, and visual styling 100% unchanged.",
              "chat"
            )
          }
          className="h-auto w-full flex items-start justify-start gap-2.5 p-3 rounded-none border-border/80 bg-card/50 hover:bg-card hover:border-emerald-500/40 transition-all duration-150 group text-left whitespace-normal font-sans shadow-none"
        >
          <div className="size-7 rounded-none bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5">
            <Layers className="size-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-medium text-foreground group-hover:text-emerald-500 transition-colors truncate">
                Architecture & Props
              </span>
              <Badge
                variant="secondary"
                className="rounded-none text-[9px] py-0 px-1 font-sans font-medium uppercase text-muted-foreground shrink-0"
              >
                CLEAN CODE
              </Badge>
            </div>
            <div className="text-[11px] font-normal text-muted-foreground leading-normal mt-0.5">
              Streamlined props interface, memoized handlers & exports.
            </div>
          </div>
          <ArrowRight className="size-3.5 text-muted-foreground/40 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
        </Button>
      </div>
    </div>
  );
}
