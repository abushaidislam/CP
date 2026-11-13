"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useStudioStore } from "@/lib/store/studio-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Activity,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SecurityShieldModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DAILY_LIMIT_PRESETS = [25, 50, 100, 250] as const;

export function SecurityShieldModal({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: SecurityShieldModalProps = {}) {
  const {
    isSecurityModalOpen,
    setSecurityModalOpen,
    isOwnerAuthenticated,
    securityTelemetry,
    setSecurityTelemetry,
  } = useStudioStore();

  const isOpen =
    controlledOpen !== undefined ? controlledOpen : isSecurityModalOpen;

  const handleOpenChange = (nextOpen: boolean) => {
    setSecurityModalOpen(nextOpen);
    controlledOnOpenChange?.(nextOpen);
    if (!nextOpen) {
      setErrorMsg(null);
      setStatusNotice(null);
      setPasscode("");
    }
  };

  const [passcode, setPasscode] = useState("");
  const [showPasscode, setShowPasscode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const fetchSessionStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch("/api/auth/session", {
        method: "GET",
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setSecurityTelemetry(data);
      }
    } catch {
      // Ignore network fetch errors during background sync
    } finally {
      setIsLoadingStatus(false);
    }
  }, [setSecurityTelemetry]);

  useEffect(() => {
    fetchSessionStatus();
  }, [fetchSessionStatus]);

  useEffect(() => {
    if (isOpen) {
      fetchSessionStatus();
    }
  }, [isOpen, fetchSessionStatus]);

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = passcode.trim();
    if (clean.length < 4) {
      setErrorMsg("Owner passcode must be at least 4 characters.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setStatusNotice(null);

    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Studio-Client": "component-studio",
        },
        body: JSON.stringify({
          action: "unlock",
          passcode: clean,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(
          data.error || "Invalid owner passcode. Please check your credentials."
        );
        return;
      }

      setSecurityTelemetry(data);
      setPasscode("");
      setStatusNotice("Owner session unlocked. Signed HttpOnly cookie active.");
    } catch {
      setErrorMsg("Failed to verify owner passcode. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLockSession = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setStatusNotice(null);

    try {
      const res = await fetch("/api/auth/session", {
        method: "DELETE",
        headers: {
          "X-Studio-Client": "component-studio",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSecurityTelemetry(data);
        setStatusNotice(
          "Owner session locked. Workspace is now in Read-Only Visitor Mode."
        );
      }
    } catch {
      setErrorMsg("Failed to lock session.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDailyLimit = async (newLimit: number) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Studio-Client": "component-studio",
        },
        body: JSON.stringify({
          action: "update-settings",
          dailyLimit: newLimit,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSecurityTelemetry(data);
        setStatusNotice(`Daily AI credit cap updated to ${newLimit} requests/day.`);
      }
    } catch {
      setErrorMsg("Failed to update daily credit cap.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetQuotaCounter = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Studio-Client": "component-studio",
        },
        body: JSON.stringify({
          action: "update-settings",
          resetQuota: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSecurityTelemetry(data);
        setStatusNotice("Daily AI request counter reset to 0.");
      }
    } catch {
      setErrorMsg("Failed to reset daily counter.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const dailyUsed = securityTelemetry?.dailyQuota?.used ?? 0;
  const dailyLimit = securityTelemetry?.dailyQuota?.limit ?? 100;
  const dailyRemaining = securityTelemetry?.dailyQuota?.remaining ?? dailyLimit;
  const quotaPercent = Math.min(
    100,
    Math.round((dailyUsed / Math.max(1, dailyLimit)) * 100)
  );
  const requiresSetup = Boolean(securityTelemetry?.requiresPasscodeSetup);
  const blockedCount = securityTelemetry?.blockedRequestsCount ?? 0;
  const limitPerMin = securityTelemetry?.rateLimit?.limitPerMinute ?? 10;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden flex flex-col font-sans p-0 gap-0 rounded-none border border-border bg-card">
        {/* Architectural Header */}
        <DialogHeader className="studio-toolbar-surface border-b border-border px-6 py-4 pr-12 gap-1.5 shrink-0">
          <div className="flex items-center gap-2">
            <Badge variant="eyebrow" className="rounded-none">
              SECURITY & CREDIT SHIELD
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "rounded-none font-sans text-[11px] px-2 py-0",
                isOwnerAuthenticated
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
              )}
            >
              {isOwnerAuthenticated ? "Owner Verified" : "Locked · Read-Only"}
            </Badge>
          </div>
          <DialogTitle className="font-sans font-semibold text-base sm:text-lg tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary shrink-0" />
            <span>Personal API Credit & Access Protection</span>
          </DialogTitle>
          <DialogDescription className="font-sans text-xs text-muted-foreground leading-relaxed">
            Protects your server-side Gemini API credits with an HMAC-signed{" "}
            <code className="font-mono text-[11px] text-foreground">HttpOnly</code>{" "}
            session cookie, per-IP rate limiting, and a daily request cap.
          </DialogDescription>
        </DialogHeader>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-5">
          {/* Status / Error Banner */}
          {errorMsg && (
            <div
              id="security-passcode-error"
              role="alert"
              className="flex items-start gap-2.5 rounded-none border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive font-sans"
            >
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {statusNotice && !errorMsg && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-start gap-2.5 rounded-none border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-sans"
            >
              <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
              <span>{statusNotice}</span>
            </div>
          )}

          {/* Owner Authentication Gate Section */}
          {!isOwnerAuthenticated ? (
            <form
              onSubmit={handleUnlockSubmit}
              className="rounded-none border border-border bg-background/60 p-4 flex flex-col gap-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Lock className="size-4 text-amber-500 shrink-0" />
                  <h3 className="font-sans text-xs sm:text-sm font-semibold text-foreground">
                    {requiresSetup
                      ? "Set Your Personal Owner Passcode"
                      : "Unlock Owner Session"}
                  </h3>
                </div>
                {isLoadingStatus && (
                  <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                )}
              </div>

              <p className="font-sans text-xs text-muted-foreground leading-relaxed">
                {requiresSetup ? (
                  <>
                    Create a secret passcode (4+ characters) to lock AI API credit usage to your browser session. For permanent deployment protection, you can also set{" "}
                    <code className="font-mono text-[11px] text-foreground">
                      STUDIO_ACCESS_CODE
                    </code>{" "}
                    in <strong>Settings &gt; Secrets</strong>.
                  </>
                ) : (
                  <>
                    Visitors can browse components in read-only mode. Enter your secret owner passcode to unlock Gemini AI Copilot generation and workspace mutations.
                  </>
                )}
              </p>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="owner-passcode-input"
                  className="font-sans text-xs font-medium text-foreground"
                >
                  {requiresSetup ? "New Owner Passcode" : "Owner Passcode"}
                </label>
                <div className="relative flex items-center">
                  <KeyRound
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 size-3.5 text-muted-foreground"
                  />
                  <Input
                    id="owner-passcode-input"
                    type={showPasscode ? "text" : "password"}
                    value={passcode}
                    onChange={(e) => {
                      setPasscode(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder={
                      requiresSetup
                        ? "Create secret passcode (min 4 chars)..."
                        : "Enter secret owner passcode..."
                    }
                    aria-required="true"
                    aria-invalid={Boolean(errorMsg)}
                    aria-describedby={errorMsg ? "security-passcode-error" : undefined}
                    className="pl-9 pr-9 h-9 rounded-none font-sans text-xs bg-background"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowPasscode((prev) => !prev)}
                    aria-label={showPasscode ? "Hide passcode" : "Show passcode"}
                    className="absolute right-1 size-7 rounded-none text-muted-foreground hover:text-foreground"
                  >
                    {showPasscode ? (
                      <EyeOff className="size-3.5" />
                    ) : (
                      <Eye className="size-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || passcode.trim().length < 4}
                  className="rounded-none font-sans text-xs gap-1.5"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Unlock className="size-3.5" />
                  )}
                  <span>
                    {requiresSetup
                      ? "Activate Passcode & Unlock"
                      : "Unlock Owner Session"}
                  </span>
                </Button>
              </div>
            </form>
          ) : (
            <div className="rounded-none border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Unlock className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-sans text-xs sm:text-sm font-semibold text-foreground">
                    Owner Session Unlocked
                  </h3>
                  <p className="font-sans text-xs text-muted-foreground mt-0.5">
                    Authenticated via HMAC-signed{" "}
                    <code className="font-mono text-[11px]">HttpOnly</code>{" "}
                    cookie. Lock your session anytime when sharing or stepping away.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLockSession}
                disabled={isSubmitting}
                className="rounded-none font-sans text-xs gap-1.5 shrink-0 border-border"
              >
                <Lock className="size-3.5" />
                <span>Lock Session</span>
              </Button>
            </div>
          )}

          {/* Daily AI Credit Quota Guard Section */}
          <div className="rounded-none border border-border bg-background/60 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-primary shrink-0" />
                <h3 className="font-sans text-xs sm:text-sm font-semibold text-foreground">
                  Daily AI Credit Quota Guard
                </h3>
              </div>
              <span className="font-mono text-xs font-medium text-foreground tabular-nums">
                {dailyUsed} / {dailyLimit} used ({dailyRemaining} left)
              </span>
            </div>

            {/* Quota Progress Bar */}
            <div
              aria-hidden="true"
              className="h-1.5 w-full bg-muted overflow-hidden rounded-none"
            >
              <div
                style={{ width: `${quotaPercent}%` }}
                className={cn(
                  "h-full transition-all duration-200",
                  quotaPercent >= 90
                    ? "bg-destructive"
                    : quotaPercent >= 70
                    ? "bg-amber-500"
                    : "bg-primary"
                )}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="font-sans text-[11px] text-muted-foreground">
                Daily Request Cap (24h UTC):
              </span>
              <div
                role="group"
                aria-label="Daily AI request limit presets"
                className="flex items-center gap-1"
              >
                {DAILY_LIMIT_PRESETS.map((preset) => {
                  const isActive = dailyLimit === preset;
                  return (
                    <Button
                      key={preset}
                      type="button"
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      disabled={!isOwnerAuthenticated || isSubmitting}
                      aria-pressed={isActive}
                      onClick={() => handleUpdateDailyLimit(preset)}
                      className="h-6 px-2 rounded-none font-mono text-[11px] tabular-nums"
                    >
                      {preset}
                    </Button>
                  );
                })}
                {isOwnerAuthenticated && dailyUsed > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetQuotaCounter}
                    disabled={isSubmitting}
                    title="Reset today's used request counter"
                    className="h-6 px-2 rounded-none font-sans text-[11px] text-muted-foreground hover:text-foreground gap-1"
                  >
                    <RefreshCw className="size-3" />
                    <span>Reset</span>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Active Backend Security Shields Matrix */}
          <div className="rounded-none border border-border bg-background/40 p-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                ACTIVE BACKEND SHIELDS
              </span>
              <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                {blockedCount} unauthorized reqs blocked
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs font-sans">
              <div className="flex items-center justify-between border border-border/70 bg-card/70 px-3 py-2">
                <span className="text-muted-foreground">Server-Only API Key</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  Enforced
                </span>
              </div>
              <div className="flex items-center justify-between border border-border/70 bg-card/70 px-3 py-2">
                <span className="text-muted-foreground">Burst Rate Limit</span>
                <span className="font-mono text-[11px] text-foreground tabular-nums">
                  {limitPerMin} req/min
                </span>
              </div>
              <div className="flex items-center justify-between border border-border/70 bg-card/70 px-3 py-2">
                <span className="text-muted-foreground">Same-Origin & CSRF</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  Verified
                </span>
              </div>
              <div className="flex items-center justify-between border border-border/70 bg-card/70 px-3 py-2">
                <span className="text-muted-foreground">Brute-Force Lockout</span>
                <span className="font-mono text-[11px] text-foreground tabular-nums">
                  5 tries / 15m
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border px-6 py-3 bg-muted/20 flex items-center justify-between sm:justify-between font-sans">
          <span className="font-sans text-[11px] text-muted-foreground">
            {securityTelemetry?.hasEnvPasscode
              ? "Passcode locked via STUDIO_ACCESS_CODE secret"
              : "Configure STUDIO_ACCESS_CODE in Settings > Secrets"}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
            className="rounded-none font-sans text-xs h-8"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
