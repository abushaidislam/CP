"use client";

import React, { useState } from "react";
import { UserComponent, useStudioStore } from "@/lib/store/studio-store";
import { formatRelativeTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Eye,
  ExternalLink,
  MoreVertical,
  Copy,
  Trash2,
  GitBranch,
  Bookmark,
  Sparkles,
  LayoutTemplate,
  CreditCard,
  MousePointerClick,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

export interface ComponentCardProps {
  component: UserComponent;
  variantsCount?: number;
  checkpointsCount?: number;
  isRecent?: boolean;
  onPreview?: (id: string) => void;
  onOpenStudio?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  isDeleteDialogOpen?: boolean;
  onDeleteDialogOpenChange?: (open: boolean) => void;
}

function renderCategoryIcon(category?: string, customClassName?: string) {
  const className = customClassName || "size-4 text-muted-foreground/40 shrink-0";
  switch ((category || "").toLowerCase()) {
    case "heroes":
      return <LayoutTemplate className={className} />;
    case "cards":
      return <CreditCard className={className} />;
    case "buttons":
      return <MousePointerClick className={className} />;
    case "badges":
      return <ShieldCheck className={className} />;
    default:
      return <Sparkles className={className} />;
  }
}

export function ComponentCard({
  component,
  variantsCount = 1,
  checkpointsCount = 0,
  isRecent = false,
  onPreview,
  onOpenStudio,
  onDuplicate,
  onDelete,
  isDeleteDialogOpen: controlledOpen,
  onDeleteDialogOpenChange,
}: ComponentCardProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isDeleteDialogOpen = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setIsDeleteDialogOpen = (open: boolean) => {
    setUncontrolledOpen(open);
    onDeleteDialogOpenChange?.(open);
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(component.id);
    } else {
      useStudioStore.getState().setQuickPreviewComponentId(component.id);
    }
  };

  const handleOpenStudio = () => {
    if (onOpenStudio) {
      onOpenStudio(component.id);
    } else {
      useStudioStore.getState().loadComponent(component.id);
    }
  };

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate(component.id);
    } else {
      useStudioStore.getState().duplicateUserComponent(component.id);
    }
  };

  const handleConfirmDelete = () => {
    setIsDeleteDialogOpen(false);
    if (onDelete) {
      onDelete(component.id);
    } else {
      useStudioStore.getState().deleteUserComponent(component.id);
    }
  };

  return (
    <>
      <div className="relative flex flex-col justify-between overflow-hidden bg-card p-4 text-card-foreground transition-colors duration-200 hover:bg-muted/10 font-sans h-full group">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className="font-sans text-[11px] font-normal px-2 py-0.5">
                {component.category}
              </Badge>
              {isRecent && (
                <Badge variant="blue" className="font-sans text-[10px] font-medium px-1.5 py-0">
                  Recent
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span suppressHydrationWarning className="font-sans text-[11px] text-muted-foreground tabular-nums">
                {formatRelativeTime(component.updatedAt)}
              </span>

              {/* More options dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="size-7 text-muted-foreground hover:text-foreground rounded-md"
                    aria-label="More options"
                  >
                    <MoreVertical className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 font-sans">
                  <DropdownMenuItem
                    onClick={handleDuplicate}
                    className="gap-2 cursor-pointer font-sans text-xs"
                  >
                    <Copy className="size-3.5" />
                    <span>Duplicate Component</span>
                  </DropdownMenuItem>
                  {!component.isBuiltIn && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setIsDeleteDialogOpen(true);
                        }}
                        className="gap-2 cursor-pointer font-sans text-xs text-destructive focus:text-destructive focus:bg-destructive/10"
                      >
                        <Trash2 className="size-3.5" />
                        <span>Delete Component</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Visual Showcase Canvas Frame */}
          <div
            role="button"
            tabIndex={0}
            onClick={handlePreview}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handlePreview();
              }
            }}
            aria-label={`Preview ${component.name}`}
            className="aspect-[16/10] w-full rounded-lg bg-zinc-950/80 dark:bg-zinc-950/90 border border-border/40 relative overflow-hidden flex items-center justify-center p-3 my-2.5 cursor-pointer group/canvas transition-colors hover:border-border"
          >
            {component.previewImage ? (
              <img
                src={component.previewImage}
                alt={component.name}
                className="w-full h-full object-contain pointer-events-none select-none transition-transform duration-300 group-hover:scale-105 drop-shadow-md"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 select-none">
                <div className="flex size-9 items-center justify-center rounded-md bg-muted/20 border border-border/30 text-muted-foreground/50">
                  {renderCategoryIcon(component.category, "size-4 text-muted-foreground/60")}
                </div>
                <Badge
                  variant="outline"
                  className="font-sans text-[10px] text-muted-foreground/60 font-normal px-2 py-0 border-border/30"
                >
                  Preview canvas
                </Badge>
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px] opacity-0 group-hover/canvas:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <Badge
                variant="secondary"
                className="gap-1.5 font-sans text-xs px-2.5 py-1 bg-background/90 text-foreground shadow-sm"
              >
                <Eye className="size-3.5" /> <span>Quick Preview</span>
              </Badge>
            </div>
          </div>

          {/* Title & Description */}
          <div className="min-w-0">
            <h3 className="truncate">
              <button
                type="button"
                onClick={handlePreview}
                className="w-full text-left font-sans font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors focus:outline-hidden cursor-pointer"
              >
                {component.name}
              </button>
            </h3>
            <p className="font-sans text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {component.description || "Interactive dynamic component."}
            </p>
          </div>
        </div>

        {/* Footer & Action Bar */}
        <div className="pt-3 border-t border-border/50 flex items-center justify-between gap-2 mt-3">
          {/* Metadata badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge
              variant="secondary"
              suppressHydrationWarning
              className="gap-1 font-sans text-[10px] font-normal px-1.5 py-0 text-muted-foreground"
              title={`${variantsCount} variant${variantsCount !== 1 ? "s" : ""}`}
            >
              <GitBranch className="size-2.5" />
              <span>{`${variantsCount} ${variantsCount === 1 ? "Variant" : "Variants"}`}</span>
            </Badge>

            {checkpointsCount > 0 && (
              <Badge
                variant="secondary"
                suppressHydrationWarning
                className="gap-1 font-sans text-[10px] font-normal px-1.5 py-0 text-muted-foreground"
                title={`${checkpointsCount} saved snapshot${checkpointsCount !== 1 ? "s" : ""}`}
              >
                <Bookmark className="size-2.5" />
                <span>{`${checkpointsCount} ${checkpointsCount === 1 ? "Checkpoint" : "Checkpoints"}`}</span>
              </Badge>
            )}
          </div>

          {/* Quick action buttons */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              className="font-sans text-xs h-7 px-2.5 gap-1.5"
            >
              <Eye className="size-3" />
              <span>Preview</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleOpenStudio}
              className="font-sans text-xs h-7 px-2.5 gap-1.5"
            >
              <ExternalLink className="size-3" />
              <span>Studio</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md font-sans">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-1">
              <AlertTriangle className="size-5" />
              <DialogTitle className="font-sans text-base">Delete Component</DialogTitle>
            </div>
            <DialogDescription className="font-sans text-xs text-muted-foreground">
              Are you sure you want to delete <strong className="text-foreground">{component.name}</strong>? This action cannot be undone and will permanently remove all versions and snapshots.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 font-sans">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="font-sans text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              className="font-sans text-xs gap-1.5"
            >
              <Trash2 className="size-3.5" />
              <span>Delete</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
