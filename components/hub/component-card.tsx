"use client";

import React from "react";
import { UserComponent, useStudioStore } from "@/lib/store/studio-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  ExternalLink,
  MoreVertical,
  Copy,
  Trash2,
  GitBranch,
  Bookmark,
  LayoutTemplate,
  CreditCard,
  MousePointerClick,
  Activity,
  FileCode,
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

function formatRelativeTime(timestamp?: number | string): string {
  if (!timestamp) return "Recently";
  const num = typeof timestamp === "string" ? Number(timestamp) : timestamp;
  const date = !isNaN(num) && num > 0 ? new Date(num) : new Date(timestamp);
  if (isNaN(date.getTime())) return typeof timestamp === "string" ? timestamp : "Recently";

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return "Just now";
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getCategoryIcon(category: string) {
  switch (category.toLowerCase()) {
    case "heroes":
      return LayoutTemplate;
    case "cards":
      return CreditCard;
    case "buttons":
      return MousePointerClick;
    case "badges":
      return Activity;
    default:
      return FileCode;
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
  const store = useStudioStore();
  const CategoryIcon = getCategoryIcon(component.category);

  const handlePreview = () => {
    if (onPreview) {
      onPreview(component.id);
    } else {
      store.setQuickPreviewComponentId(component.id);
    }
  };

  const handleOpenStudio = () => {
    if (onOpenStudio) {
      onOpenStudio(component.id);
    } else {
      store.loadComponent(component.id);
    }
  };

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate(component.id);
    } else {
      store.duplicateUserComponent(component.id);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(component.id);
    } else {
      store.deleteUserComponent(component.id);
    }
  };

  return (
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
                      onClick={handleDelete}
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

        {/* Component Name */}
        <h3
          title={component.name}
          className="font-sans font-medium text-sm text-foreground truncate mt-2.5 mb-1"
        >
          {component.name}
        </h3>
      </div>

      {/* Mini preview frame or visual container */}
      <div
        onClick={handlePreview}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handlePreview();
          }
        }}
        className="relative my-3 flex flex-col justify-between overflow-hidden rounded-lg border border-border/50 bg-muted/20 p-3 min-h-[92px] transition-all duration-200 cursor-pointer group-hover:border-primary/25 group-hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <p className="font-sans text-xs text-muted-foreground line-clamp-3 leading-relaxed relative z-10">
          {component.description || "No description provided."}
        </p>

        {/* Decorative Watermark Icon */}
        <div className="absolute right-2 bottom-1.5 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
          <CategoryIcon className="size-10" />
        </div>
      </div>

      {/* Footer & Actions */}
      <div className="space-y-3 pt-1">
        {/* Counter Pills */}
        <div className="flex items-center gap-1.5">
          <Badge
            variant="secondary"
            className="font-sans text-[11px] font-normal gap-1 px-2 py-0.5 text-muted-foreground"
          >
            <GitBranch className="size-3 text-muted-foreground/70" />
            <span>{`${variantsCount} ${variantsCount === 1 ? "Variant" : "Variants"}`}</span>
          </Badge>
          <Badge
            variant="secondary"
            className="font-sans text-[11px] font-normal gap-1 px-2 py-0.5 text-muted-foreground"
          >
            <Bookmark className="size-3 text-muted-foreground/70" />
            <span>{`${checkpointsCount} ${checkpointsCount === 1 ? "Checkpoint" : "Checkpoints"}`}</span>
          </Badge>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            className="h-7 text-xs font-sans gap-1.5 flex-1 rounded-md"
          >
            <Eye className="size-3" />
            <span>Preview</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleOpenStudio}
            className="h-7 text-xs font-sans gap-1.5 flex-1 rounded-md"
          >
            <ExternalLink className="size-3" />
            <span>Studio</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
