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
}

function getCategoryIcon(category?: string) {
  switch ((category || "").toLowerCase()) {
    case "heroes":
      return LayoutTemplate;
    case "cards":
      return CreditCard;
    case "buttons":
      return MousePointerClick;
    case "badges":
      return ShieldCheck;
    default:
      return Sparkles;
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
}: ComponentCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const CategoryIcon = getCategoryIcon(component.category);

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
      <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/70 bg-card p-4 text-card-foreground shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md group font-sans">
        {/* Header */}
        <div>
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
              <span className="font-sans text-[11px] text-muted-foreground tabular-nums">
                {formatRelativeTime(component.updatedAt)}
              </span>

              {/* More actions dropdown */}
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
                          if (onDelete) {
                            onDelete(component.id);
                          } else {
                            setIsDeleteDialogOpen(true);
                          }
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

          {/* Interactive preview / card body */}
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
            className="my-3 flex flex-col justify-between h-28 rounded-lg border border-border/50 bg-muted/20 p-3 transition-colors duration-150 hover:bg-muted/40 cursor-pointer overflow-hidden relative group/canvas"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-sans font-medium text-sm text-foreground tracking-tight line-clamp-1 group-hover/canvas:text-primary transition-colors duration-150">
                {component.name}
              </span>
              <CategoryIcon className="size-4 text-muted-foreground/40 shrink-0" />
            </div>

            <p className="font-sans text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {component.description || "Interactive dynamic component."}
            </p>

            <div className="flex items-center gap-1 text-[11px] font-sans text-muted-foreground/80 opacity-0 group-hover/canvas:opacity-100 transition-opacity duration-150">
              <Eye className="size-3" />
              <span>Click for 21st.dev quick preview</span>
            </div>
          </div>
        </div>

        {/* Footer & Actions */}
        <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
          {/* Metadata badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge
              variant="secondary"
              className="gap-1 font-sans text-[10px] font-normal px-1.5 py-0 text-muted-foreground"
              title={`${variantsCount} variant${variantsCount !== 1 ? "s" : ""}`}
            >
              <GitBranch className="size-2.5" />
              <span>{`${variantsCount} ${variantsCount === 1 ? "Variant" : "Variants"}`}</span>
            </Badge>

            {checkpointsCount > 0 && (
              <Badge
                variant="secondary"
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
