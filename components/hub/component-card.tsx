"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { UserComponent, useStudioStore } from "@/lib/store/studio-store";
import { compileSandboxHtml } from "@/lib/sandbox/sandbox-compiler";
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
  const className = customClassName || "size-4 text-muted-foreground/60 shrink-0";
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
  onPreview,
  onOpenStudio,
  onDuplicate,
  onDelete,
  isDeleteDialogOpen: controlledOpen,
  onDeleteDialogOpenChange,
}: ComponentCardProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isIframeReady, setIsIframeReady] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const isDeleteDialogOpen = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setIsDeleteDialogOpen = (open: boolean) => {
    setUncontrolledOpen(open);
    onDeleteDialogOpenChange?.(open);
  };

  // Lazy-mount live sandboxed preview when card enters viewport
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const compiledPreviewHtml = useMemo(() => {
    if (!isInView || !component?.files) return "";
    try {
      const res = compileSandboxHtml(
        component.files["component.tsx"] || "",
        component.files["demo.tsx"] || "",
        component.files["index.css"] || "",
        component.dependencies || [],
        "dark",
        "dark"
      );
      return res.error ? "" : res.html;
    } catch {
      return "";
    }
  }, [isInView, component]);

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
      <div
        ref={cardRef}
        className="relative flex flex-col justify-between overflow-hidden rounded-none bg-card text-card-foreground transition-colors duration-200 hover:bg-muted/15 font-sans h-full group"
      >
        {/* Sharp 0px-Radius Visual Stage */}
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
          className="aspect-[4/3] w-full rounded-none bg-zinc-950 border-b border-border/70 relative overflow-hidden flex items-center justify-center cursor-pointer group/canvas transition-colors duration-200"
        >
          {/* Subtle Architectural Grid Backdrop */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:24px_24px]"
          />

          {/* Fallback / Initial Preview Visual */}
          {component.previewImage ? (
            <img
              src={component.previewImage}
              alt={component.name}
              className={`relative z-10 w-full h-full object-contain p-5 pointer-events-none select-none transition-all duration-300 group-hover:scale-105 drop-shadow-md ${
                isIframeReady ? "opacity-0" : "opacity-100"
              }`}
            />
          ) : (
            !isIframeReady && (
              <div className="relative z-10 flex flex-col items-center justify-center gap-2 select-none pointer-events-none">
                <div className="flex size-9 items-center justify-center rounded-none bg-zinc-900 border border-zinc-800 text-zinc-400">
                  {renderCategoryIcon(component.category, "size-4 text-zinc-400")}
                </div>
                <Badge
                  variant="outline"
                  className="font-sans text-[10px] text-zinc-400 font-normal px-2 py-0.5 rounded-none border-zinc-800 bg-zinc-900/80"
                >
                  Preview canvas
                </Badge>
              </div>
            )
          )}

          {/* Live Interactive Sandboxed Component Preview */}
          {isInView && compiledPreviewHtml && (
            <div className="absolute inset-0 z-10 overflow-hidden">
              <iframe
                title={`${component.name} live stage`}
                srcDoc={compiledPreviewHtml}
                onLoad={() => setIsIframeReady(true)}
                sandbox="allow-scripts allow-same-origin"
                className={`w-[200%] h-[200%] origin-top-left scale-50 border-0 transition-opacity duration-300 ${
                  isIframeReady ? "opacity-100" : "opacity-0"
                }`}
              />
            </div>
          )}

          {/* Top-Left Category Tag on Stage */}
          <div className="pointer-events-none absolute top-2.5 left-2.5 z-20">
            <Badge
              variant="secondary"
              className="rounded-none bg-zinc-900/90 text-zinc-300 border border-zinc-800 px-2 py-0.5 text-[10px] font-sans font-medium uppercase tracking-wider backdrop-blur-xs"
            >
              {component.category || "Custom"}
            </Badge>
          </div>

          {/* Top-Right Hover Menu Action */}
          <div
            className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon-sm"
                  className="size-7 rounded-none bg-zinc-900/95 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-700/80 shadow-none"
                  aria-label="More options"
                >
                  <MoreVertical className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 rounded-none font-sans">
                <DropdownMenuItem
                  onClick={handleDuplicate}
                  className="gap-2 cursor-pointer rounded-none font-sans text-xs"
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
                      className="gap-2 cursor-pointer rounded-none font-sans text-xs text-destructive focus:text-destructive focus:bg-destructive/10"
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

        {/* Always-Visible Architectural Footer Bar with Icon-Only Action Buttons */}
        <div
          className="studio-toolbar-surface flex items-center justify-between gap-3 px-3.5 py-3 bg-card rounded-none"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-none border border-border/80 bg-muted/30 text-muted-foreground">
              {renderCategoryIcon(component.category, "size-3.5 text-muted-foreground")}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-sans font-medium text-xs sm:text-sm text-foreground leading-tight">
                {component.name}
              </h3>
              <p className="truncate font-sans text-[11px] text-muted-foreground mt-0.5">
                {component.description || `${component.category || "Custom"} component`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={handlePreview}
              title={`Quick Preview ${component.name}`}
              aria-label={`Quick Preview ${component.name}`}
              className="studio-icon-btn size-7 rounded-none border-border/80 bg-background hover:bg-muted/60 text-muted-foreground hover:text-foreground"
            >
              <Eye className="size-3.5" />
              <span className="sr-only">Preview</span>
            </Button>

            <Button
              variant="default"
              size="icon-sm"
              onClick={handleOpenStudio}
              title={`Open ${component.name} in Studio`}
              aria-label={`Open ${component.name} in Studio`}
              className="size-7 rounded-none shadow-none"
            >
              <ExternalLink className="size-3.5" />
              <span className="sr-only">Studio</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-none font-sans">
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
              className="rounded-none font-sans text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              className="rounded-none font-sans text-xs gap-1.5"
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
