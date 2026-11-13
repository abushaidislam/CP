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
        className="relative flex flex-col justify-between overflow-hidden bg-card p-3 sm:p-4 text-card-foreground transition-colors duration-200 hover:bg-muted/10 font-sans h-full group"
      >
        {/* Pure 21st.dev-style Inner Dark Stage */}
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
          className="aspect-[4/3] w-full rounded-xl bg-zinc-950/90 dark:bg-zinc-950/95 border border-border/40 relative overflow-hidden flex items-center justify-center cursor-pointer group/canvas transition-all duration-200 group-hover:border-border/80"
        >
          {/* Fallback / Initial Preview Visual */}
          {component.previewImage ? (
            <img
              src={component.previewImage}
              alt={component.name}
              className={`w-full h-full object-contain p-4 pointer-events-none select-none transition-all duration-300 group-hover:scale-105 drop-shadow-md ${
                isIframeReady ? "opacity-0" : "opacity-100"
              }`}
            />
          ) : (
            !isIframeReady && (
              <div className="flex flex-col items-center justify-center gap-2 select-none pointer-events-none">
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
            )
          )}

          {/* Live Interactive Sandboxed Component Preview */}
          {isInView && compiledPreviewHtml && (
            <div className="absolute inset-0 overflow-hidden">
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

          {/* Top-Right Hover Menu Action */}
          <div
            className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon-sm"
                  className="size-7 rounded-lg bg-zinc-900/90 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-800/80 shadow-sm backdrop-blur-md"
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

          {/* Bottom Hover-Only Title & Quick Actions Bar */}
          <div
            className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-2 p-3 pt-6 bg-gradient-to-t from-zinc-950/95 via-zinc-950/80 to-transparent opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="min-w-0 flex-1 truncate">
              <button
                type="button"
                onClick={handlePreview}
                className="w-full text-left font-sans font-medium text-xs sm:text-sm text-zinc-100 truncate hover:text-white transition-colors focus:outline-hidden cursor-pointer"
              >
                {component.name}
              </button>
            </h3>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                className="font-sans text-xs h-7 px-2.5 gap-1 bg-zinc-900/90 text-zinc-100 border-zinc-700/80 hover:bg-zinc-800 hover:text-white"
              >
                <Eye className="size-3" />
                <span>Preview</span>
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={handleOpenStudio}
                className="font-sans text-xs h-7 px-2.5 gap-1 shadow-sm"
              >
                <ExternalLink className="size-3" />
                <span>Studio</span>
              </Button>
            </div>
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

