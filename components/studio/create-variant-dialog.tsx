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
      <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto overflow-x-hidden font-sans">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-foreground">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
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

        <form onSubmit={handleCreate} className="flex flex-col gap-4 mt-2">
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
              className="text-xs font-sans h-9"
              autoFocus
              maxLength={40}
            />
            {error && <span className="text-[11px] text-destructive font-sans">{error}</span>}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-muted/30">
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

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleOpenChange(false)}
              className="font-sans text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="font-sans text-xs gap-1.5">
              <GitBranch className="size-3.5" />
              Create Variant
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
