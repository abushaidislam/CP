"use client";

import React, { useState, useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStudioStore } from "@/lib/store/studio-store";
import { DEFAULT_TEMPLATES } from "@/lib/sandbox/default-templates";
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
import { Pencil, Check, X, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

export const PRESET_CATEGORIES = [
  "Heroes",
  "Cards",
  "Buttons",
  "Badges",
  "Navigation",
  "Footers",
  "Custom",
] as const;

export interface EditComponentDialogProps {
  componentId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onUpdated?: (id: string, name: string) => void;
}

export function EditComponentDialog({
  componentId: propComponentId,
  open: propOpen,
  onOpenChange: propOnOpenChange,
  onUpdated,
}: EditComponentDialogProps = {}) {
  const {
    isEditComponentDialogOpen,
    editingComponentId,
    setEditComponentDialogOpen,
    updateComponentMetadata,
    userComponents,
    currentTemplateId,
  } = useStudioStore(
    useShallow((state) => ({
      isEditComponentDialogOpen: state.isEditComponentDialogOpen,
      editingComponentId: state.editingComponentId,
      setEditComponentDialogOpen: state.setEditComponentDialogOpen,
      updateComponentMetadata: state.updateComponentMetadata,
      userComponents: state.userComponents,
      currentTemplateId: state.currentTemplateId,
    }))
  );

  const effectiveComponentId =
    propComponentId || editingComponentId || currentTemplateId;
  const isControlled = propOpen !== undefined;
  const isOpen = isControlled ? propOpen : isEditComponentDialogOpen;

  const currentComp =
    userComponents?.[effectiveComponentId] ||
    DEFAULT_TEMPLATES.find((t) => t.id === effectiveComponentId);

  const initialCat = currentComp?.category || "Custom";
  const [name, setName] = useState(currentComp?.name || "");
  const [description, setDescription] = useState(currentComp?.description || "");
  const [category, setCategory] = useState(initialCat);
  const [isCustomCategory, setIsCustomCategory] = useState(
    !PRESET_CATEGORIES.includes(initialCat as (typeof PRESET_CATEGORIES)[number])
  );
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && currentComp) {
      setName(currentComp.name || "");
      setDescription(currentComp.description || "");
      const cat = currentComp.category || "Custom";
      setCategory(cat);
      setIsCustomCategory(
        !PRESET_CATEGORIES.includes(cat as (typeof PRESET_CATEGORIES)[number])
      );
      setError("");

      const t = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [isOpen, effectiveComponentId, currentComp]);

  const handleClose = () => {
    if (isControlled) {
      propOnOpenChange?.(false);
    } else {
      setEditComponentDialogOpen(false);
    }
  };

  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    setIsCustomCategory(false);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Component title/name is required.");
      return;
    }

    const trimmedCategory = category.trim() || "Custom";
    const trimmedDescription = description.trim();

    updateComponentMetadata(effectiveComponentId, {
      name: trimmedName,
      description: trimmedDescription,
      category: trimmedCategory,
    });

    onUpdated?.(effectiveComponentId, trimmedName);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden flex flex-col font-sans p-0 gap-0 rounded-none border border-border bg-card shadow-2xl">
        {/* Header Bar */}
        <DialogHeader className="studio-toolbar-surface border-b border-border px-5 py-4 pr-12 shrink-0">
          <div className="flex items-center gap-2">
            <Badge variant="eyebrow" className="rounded-none font-sans">
              COMPONENT DETAILS
            </Badge>
          </div>
          <div className="flex items-start gap-3 mt-1.5">
            <div className="flex size-8 items-center justify-center rounded-none border border-border bg-background text-foreground shrink-0 mt-0.5">
              <Pencil className="size-3.5 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold font-sans tracking-tight text-foreground">
                Edit Component Details
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-sans leading-normal">
                Update the title, description, and category for this component.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="px-5 py-4 space-y-4">
            {/* Title / Name Field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="edit-component-name-input"
                className="text-xs font-medium text-foreground font-sans flex items-center justify-between"
              >
                <span>
                  Title / Name <span className="text-destructive">*</span>
                </span>
                <span className="text-[11px] text-muted-foreground font-sans tabular-nums">
                  {name.length}/60
                </span>
              </label>
              <Input
                ref={inputRef}
                id="edit-component-name-input"
                value={name}
                maxLength={60}
                placeholder="e.g. Bento Brand Footer"
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                className={cn(
                  "h-9 font-sans text-xs rounded-none bg-background",
                  error && "border-destructive focus-visible:ring-destructive"
                )}
                aria-invalid={Boolean(error)}
                aria-required="true"
              />
              {error && (
                <p className="text-[11px] text-destructive font-sans">{error}</p>
              )}
            </div>

            {/* Category Selector */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground font-sans flex items-center gap-1.5">
                  <Tag className="size-3 text-muted-foreground" />
                  <span>Category</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(!isCustomCategory)}
                  className="text-[11px] text-primary hover:underline font-sans cursor-pointer"
                >
                  {isCustomCategory ? "Choose from presets" : "Custom category"}
                </button>
              </div>

              {!isCustomCategory ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {PRESET_CATEGORIES.map((cat) => {
                    const isSelected = category.toLowerCase() === cat.toLowerCase();
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleCategorySelect(cat)}
                        className={cn(
                          "px-2.5 py-1 text-xs font-sans transition-colors cursor-pointer border select-none rounded-none",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary font-medium"
                            : "bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Input
                  id="edit-component-category-input"
                  value={category}
                  placeholder="e.g. Marketing, Footers, AI Tools"
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-8 font-sans text-xs rounded-none bg-background mt-1"
                />
              )}
            </div>

            {/* Description Field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="edit-component-description-input"
                className="text-xs font-medium text-foreground font-sans flex items-center justify-between"
              >
                <span>Description</span>
                <span className="text-[11px] text-muted-foreground font-sans tabular-nums">
                  {description.length}/240
                </span>
              </label>
              <Textarea
                id="edit-component-description-input"
                value={description}
                maxLength={240}
                rows={3}
                placeholder="A high-performance modern card with interactive dynamic lighting..."
                onChange={(e) => setDescription(e.target.value)}
                className="font-sans text-xs rounded-none resize-none bg-background"
              />
              <p className="text-[11px] text-muted-foreground font-sans">
                Shown in the component templates menu and library cards.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <DialogFooter className="border-t border-border px-5 py-3 bg-muted/20 flex flex-row items-center justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="h-8 font-sans text-xs rounded-none"
            >
              <X className="size-3 mr-1" />
              <span>Cancel</span>
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              className="h-8 font-sans text-xs rounded-none gap-1.5"
            >
              <Check className="size-3.5" />
              <span>Save Changes</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
