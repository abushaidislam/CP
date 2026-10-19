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
      <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto overflow-x-hidden font-sans">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-foreground">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
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

        <form onSubmit={handleSave} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="checkpoint-name-input" className="text-xs font-medium text-foreground font-sans">
              Checkpoint Name *
            </label>
            <Input
              id="checkpoint-name-input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. Added glassmorphism blur and spring animation"
              className="text-xs font-sans h-9 transition-colors duration-150"
              autoFocus
              maxLength={60}
            />
            {error && (
              <span className="text-[11px] text-destructive font-sans animate-in fade-in-0 slide-in-from-top-1 duration-150">
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
              className="text-xs font-sans min-h-[70px] resize-none transition-colors duration-150"
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleOpenChange(false)}
              className="font-sans text-xs active:scale-[0.98] transition-transform duration-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="font-sans text-xs gap-1.5 active:scale-[0.98] transition-transform duration-100"
            >
              <BookmarkPlus className="size-3.5" />
              Save Checkpoint
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
