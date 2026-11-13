"use client";

import React, { useState } from "react";
import { useStudioStore } from "@/lib/store/studio-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { GitBranch } from "lucide-react";

export function CreateVariantDialog() {
  const {
    isCreateVariantDialogOpen,
    setCreateVariantDialogOpen,
    createVariant,
  } = useStudioStore();

  const [name, setName] = useState("");
  const [cloneFromActive, setCloneFromActive] = useState(true);
  const [error, setError] = useState("");

  const handleOpenChange = (open: boolean) => {
    setCreateVariantDialogOpen(open);
    if (!open) {
      setName("");
      setCloneFromActive(true);
      setError("");
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter a variant name.");
      return;
    }
    createVariant(trimmedName, cloneFromActive);
    setName("");
    setCloneFromActive(true);
    setError("");
    setCreateVariantDialogOpen(false);
  };

  return (
    <Dialog open={isCreateVariantDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto overflow-x-hidden flex flex-col font-sans p-0 gap-0 rounded-none border border-border bg-card">
        <DialogHeader className="studio-toolbar-surface border-b border-border px-6 py-4 pr-12 shrink-0">
          <div className="flex items-center gap-2">
            <Badge variant="eyebrow" className="rounded-none">
              BRANCH VARIANT
            </Badge>
          </div>
          <div className="flex items-start gap-3 mt-1.5 text-foreground">
            <div className="flex size-8 items-center justify-center rounded-none border border-border bg-background text-primary shrink-0 mt-0.5">
              <GitBranch className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold font-sans">
                Create Component Variant
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-sans">
                Explore a new visual design or code direction without losing your existing variant.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleCreate} className="flex flex-col">
          <div className="px-6 py-5 space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="variant-name-input" className="text-xs font-medium text-foreground font-sans">
                Variant Name *
              </label>
              <Input
                id="variant-name-input"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                placeholder="e.g. Minimal Outline, Neon Glow, Glassmorphism"
                className="text-xs font-sans h-9 rounded-none bg-background border-border"
                autoFocus
                maxLength={40}
              />
              {error && (
                <span className="text-[11px] text-destructive font-sans animate-in fade-in-0 slide-in-from-top-1 duration-150">
                  {error}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between rounded-none border border-border p-3.5 bg-background">
              <div className="flex flex-col gap-0.5 pr-2">
                <label
                  htmlFor="clone-from-active-switch"
                  className="text-xs font-medium text-foreground cursor-pointer font-sans"
                >
                  Clone files from active variant
                </label>
                <p className="text-[11px] text-muted-foreground font-sans">
                  Start with current code instead of default template
                </p>
              </div>
              <Switch
                id="clone-from-active-switch"
                checked={cloneFromActive}
                onCheckedChange={setCloneFromActive}
              />
            </div>
          </div>

          <DialogFooter className="studio-toolbar-surface sticky bottom-0 z-10 flex items-center justify-end gap-2 px-6 py-3.5 border-t border-border bg-card/95 backdrop-blur-xs">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
              className="rounded-none font-sans text-xs h-8 px-3.5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="rounded-none font-sans text-xs h-8 px-4 gap-1.5"
            >
              <GitBranch className="size-3.5" />
              <span>Create Variant</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
