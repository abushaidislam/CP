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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BookmarkPlus } from "lucide-react";

export function SaveCheckpointDialog() {
  const {
    isSaveCheckpointDialogOpen,
    setSaveCheckpointDialogOpen,
    saveCheckpoint,
  } = useStudioStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const handleOpenChange = (open: boolean) => {
    setSaveCheckpointDialogOpen(open);
    if (!open) {
      setName("");
      setDescription("");
      setError("");
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter a checkpoint title or note.");
      return;
    }
    saveCheckpoint(trimmedName, description.trim() || undefined);
    setName("");
    setDescription("");
    setError("");
    setSaveCheckpointDialogOpen(false);
  };

  return (
    <Dialog open={isSaveCheckpointDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto overflow-x-hidden flex flex-col font-sans p-0 gap-0 rounded-none border border-border bg-card">
        <DialogHeader className="studio-toolbar-surface border-b border-border px-6 py-4 pr-12 shrink-0">
          <div className="flex items-center gap-2">
            <Badge variant="eyebrow" className="rounded-none">
              SNAPSHOT CHECKPOINT
            </Badge>
          </div>
          <div className="flex items-start gap-3 mt-1.5 text-foreground">
            <div className="flex size-8 items-center justify-center rounded-none border border-border bg-background text-primary shrink-0 mt-0.5">
              <BookmarkPlus className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold font-sans">
                Save Checkpoint
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-sans">
                Take a manual snapshot of your active files and dependencies.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSave} className="flex flex-col">
          <div className="px-6 py-5 space-y-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="checkpoint-name-input" className="text-xs font-medium text-foreground font-sans">
                Checkpoint Name *
              </label>
              <Input
                id="checkpoint-name-input"
                aria-required="true"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "checkpoint-name-error" : undefined}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                placeholder="e.g. Added glassmorphism blur and spring animation"
                className="text-xs font-sans h-9 rounded-none bg-background border-border"
                autoFocus
                maxLength={60}
              />
              {error && (
                <span
                  id="checkpoint-name-error"
                  role="alert"
                  className="text-[11px] text-destructive font-sans animate-in fade-in-0 slide-in-from-top-1 duration-150"
                >
                  {error}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="checkpoint-notes-input" className="text-xs font-medium text-foreground font-sans">
                Notes (Optional)
              </label>
              <Textarea
                id="checkpoint-notes-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe key visual or functional changes..."
                className="text-xs font-sans min-h-[70px] rounded-none resize-none bg-background border-border"
                rows={3}
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
              <BookmarkPlus className="size-3.5" />
              <span>Save Checkpoint</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
