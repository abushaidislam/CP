"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_TEMPLATE_PREVIEWS,
  UserComponent,
  useStudioStore,
} from "@/lib/store/studio-store";
import { getCachedPreview } from "@/lib/cache/preview-cache";
import { cn } from "@/lib/utils";
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
  FolderGit2,
  Check,
  Pencil,
  Download,
  Loader2,
  Lock,
} from "lucide-react";
import { downloadComponentTsxZip } from "@/lib/utils/zip-export";

export type DeleteComponentResult =
  | void
  | {
      success: boolean;
      error?: string;
      requiresOwnerAuth?: boolean;
    };

export interface ComponentCardProps {
  component: UserComponent;
  variantsCount?: number;
  checkpointsCount?: number;
  isRecent?: boolean;
  priority?: boolean;
  onPreview?: (id: string) => void;
  onOpenStudio?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => DeleteComponentResult | Promise<DeleteComponentResult>;
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

function ComponentCardInner({
  component,
  priority = false,
  onPreview,
  onOpenStudio,
  onDuplicate,
  onDelete,
  isDeleteDialogOpen: controlledOpen,
  onDeleteDialogOpenChange,
}: ComponentCardProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [failedPreviewSrcs, setFailedPreviewSrcs] = useState<string[]>([]);
  const [cachedBrowserPreview, setCachedBrowserPreview] = useState<string>();
  const [loadedPreviewSrc, setLoadedPreviewSrc] = useState<string>();
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<{
    message: string;
    requiresOwnerAuth?: boolean;
  } | null>(null);

  useEffect(() => {
    let isActive = true;
    void getCachedPreview(component.id).then((preview) => {
      if (isActive && preview) setCachedBrowserPreview(preview);
    });
    return () => {
      isActive = false;
    };
  }, [component.id]);

  const isDeleteDialogOpen = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setIsDeleteDialogOpen = (open: boolean) => {
    if (!open && isDeleting) return;
    setUncontrolledOpen(open);
    if (!open) {
      setDeleteError(null);
    }
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

  const handleDownloadComponentZip = async () => {
    if (isDownloadingZip) return;
    setIsDownloadingZip(true);
    try {
      const store = useStudioStore.getState();
      let resolved: UserComponent | null =
        store.userComponents?.[component.id] || component;

      const needsHydration =
        resolved.filesLoaded === false || !resolved.files?.["component.tsx"];

      if (needsHydration && typeof store.ensureComponentFilesLoaded === "function") {
        const loaded = await store.ensureComponentFilesLoaded(component.id);
        if (loaded) {
          resolved = loaded;
        }
      }

      const componentTsx = resolved.files?.["component.tsx"] || "";
      const defaultTsx =
        resolved.files?.["default.tsx"] || resolved.files?.["demo.tsx"] || "";

      downloadComponentTsxZip({
        slug: resolved.repoSlug || component.repoSlug || component.name || component.id,
        componentTsx,
        defaultTsx,
      });
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (isDeleting) return;
    setDeleteError(null);
    setIsDeleting(true);
    try {
      const result = onDelete
        ? await onDelete(component.id)
        : await useStudioStore
            .getState()
            .deleteUserComponent(component.id, { awaitServer: true });

      if (result && result.success === false) {
        setDeleteError({
          message: result.error || "Failed to delete component.",
          requiresOwnerAuth: result.requiresOwnerAuth,
        });
        setIsDeleting(false);
        return;
      }

      setIsDeleting(false);
      setUncontrolledOpen(false);
      onDeleteDialogOpenChange?.(false);
    } catch (err: unknown) {
      setDeleteError({
        message:
          err instanceof Error ? err.message : "Failed to delete component.",
      });
      setIsDeleting(false);
    }
  };

  const isBlankPlaceholder =
    !component.previewImage ||
    component.previewImage === "./preview.png" ||
    component.previewImage === DEFAULT_TEMPLATE_PREVIEWS["blank"];

  const builtInTemplateFallback =
    DEFAULT_TEMPLATE_PREVIEWS[component.id] &&
    DEFAULT_TEMPLATE_PREVIEWS[component.id] !== DEFAULT_TEMPLATE_PREVIEWS["blank"]
      ? DEFAULT_TEMPLATE_PREVIEWS[component.id]
      : undefined;

  const primaryPreviewImage = isBlankPlaceholder
    ? cachedBrowserPreview || component.previewImage
    : component.previewImage;

  const markPreviewFailed = useCallback((src: string) => {
    if (!src) return;
    setFailedPreviewSrcs((prev) => (prev.includes(src) ? prev : [...prev, src]));
  }, []);

  const effectivePreviewImage =
    primaryPreviewImage &&
    primaryPreviewImage !== "./preview.png" &&
    primaryPreviewImage !== DEFAULT_TEMPLATE_PREVIEWS["blank"] &&
    !failedPreviewSrcs.includes(primaryPreviewImage)
      ? primaryPreviewImage
      : builtInTemplateFallback &&
        !failedPreviewSrcs.includes(builtInTemplateFallback)
      ? builtInTemplateFallback
      : undefined;

  const hasValidPreviewImage = Boolean(effectivePreviewImage);

  const isImageLoaded = loadedPreviewSrc === effectivePreviewImage;

  return (
    <>
      <div className="relative flex flex-col justify-between overflow-hidden rounded-none bg-card text-card-foreground transition-colors duration-200 hover:bg-muted/15 font-sans h-full group">
        {/* Sharp 0px-Radius Static Image Stage (Zero Live Iframes for Low CPU/RAM) */}
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
          className="aspect-[4/3] w-full rounded-none bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border-b border-border/70 relative overflow-hidden flex items-center justify-center cursor-pointer group/canvas transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
        >
          {/* Subtle shimmer while network thumbnail is decoding */}
          {hasValidPreviewImage && !isImageLoaded && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-[5] bg-zinc-900/50 animate-pulse"
            />
          )}

          {/* Keep the full captured composition visible in a consistent thumbnail frame. */}
          {hasValidPreviewImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={effectivePreviewImage}
              alt={component.name}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
              referrerPolicy="no-referrer"
              onLoad={(e) => {
                if (effectivePreviewImage) {
                  setLoadedPreviewSrc(effectivePreviewImage);
                }
              }}
              onError={() => {
                if (effectivePreviewImage) {
                  markPreviewFailed(effectivePreviewImage);
                }
              }}
              className={cn(
                "relative z-10 w-full h-full object-contain pointer-events-none select-none transition-transform duration-300 group-hover:scale-[1.02]",
                isImageLoaded ? "opacity-100" : "opacity-0"
              )}
            />
          ) : (
            <div className="relative z-10 flex flex-col items-center justify-center gap-2.5 px-6 text-center select-none pointer-events-none">
              <div className="flex size-10 items-center justify-center rounded-none bg-zinc-900/90 border border-zinc-800 text-zinc-300 shadow-xs">
                {renderCategoryIcon(component.category, "size-4 text-zinc-300")}
              </div>
              <div className="space-y-1 max-w-[200px]">
                <p className="truncate font-sans text-xs font-medium text-zinc-200">
                  {component.name}
                </p>
                <Badge
                  variant="outline"
                  className="font-sans text-[10px] text-zinc-400 font-normal px-2 py-0.5 rounded-none border-zinc-800 bg-zinc-900/80"
                >
                  Preview canvas
                </Badge>
              </div>
            </div>
          )}

          {/* Subtle Top Contrast Scrim & Inner Hairline so badges stay legible over light-mode screenshots */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-12 z-[15] bg-gradient-to-b from-black/35 via-black/10 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[15] ring-1 ring-inset ring-white/5"
          />

          {/* Top-Left Category Tag & Repo Sync Status on Stage */}
          <div className="pointer-events-none absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5">
            <Badge
              variant="secondary"
              className="rounded-none bg-zinc-950/85 text-zinc-100 border border-white/15 px-2 py-0.5 text-[10px] font-sans font-medium uppercase tracking-wider backdrop-blur-sm shadow-xs"
            >
              {component.category || "Custom"}
            </Badge>
            {component.savedInRepo && (
              <Badge
                variant="outline"
                className="rounded-none bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 text-[9px] font-sans font-medium uppercase tracking-wider backdrop-blur-sm shadow-xs gap-1"
              >
                <Check className="size-2.5" />
                <span>In Repo</span>
              </Badge>
            )}
          </div>

          {/* Top-Right Hover & Focus Menu Action */}
          <div
            className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon-sm"
                  className="size-7 rounded-none bg-zinc-900/95 text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-700/80 shadow-none"
                  aria-label={`More options for ${component.name}`}
                >
                  <MoreVertical className="size-3.5" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-none font-sans">
                <DropdownMenuItem
                  onClick={() => {
                    useStudioStore
                      .getState()
                      .setEditComponentDialogOpen(true, component.id);
                  }}
                  className="gap-2 cursor-pointer rounded-none font-sans text-xs"
                >
                  <Pencil className="size-3.5 text-primary" />
                  <span>Edit Details...</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={isDownloadingZip}
                  onClick={() => {
                    void handleDownloadComponentZip();
                  }}
                  className="gap-2 cursor-pointer rounded-none font-sans text-xs"
                >
                  {isDownloadingZip ? (
                    <Loader2 className="size-3.5 animate-spin text-primary" />
                  ) : (
                    <Download className="size-3.5 text-primary" />
                  )}
                  <span>
                    {isDownloadingZip ? "Preparing ZIP..." : "Download Component"}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    useStudioStore
                      .getState()
                      .saveComponentToProjectRepo?.({ componentId: component.id });
                  }}
                  className="gap-2 cursor-pointer rounded-none font-sans text-xs"
                >
                  <FolderGit2 className="size-3.5 text-primary" />
                  <span>Save to Project Repo</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDuplicate}
                  className="gap-2 cursor-pointer rounded-none font-sans text-xs"
                >
                  <Copy className="size-3.5" />
                  <span>Duplicate Component</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setDeleteError(null);
                    setIsDeleteDialogOpen(true);
                  }}
                  className="gap-2 cursor-pointer rounded-none font-sans text-xs text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2 className="size-3.5" />
                  <span>Delete Component</span>
                </DropdownMenuItem>
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
      {isDeleteDialogOpen && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md rounded-none font-sans">
            <DialogHeader>
              <div className="flex items-center gap-2 text-destructive mb-1">
                <AlertTriangle className="size-5 shrink-0" />
                <DialogTitle className="font-sans text-base">Delete Component</DialogTitle>
              </div>
              <DialogDescription className="font-sans text-xs text-muted-foreground">
                Are you sure you want to delete <strong className="text-foreground">{component.name}</strong>? This action cannot be undone and will permanently remove it from your workspace and project repository.
              </DialogDescription>
            </DialogHeader>

            {deleteError && (
              <div className="rounded-none border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive font-sans space-y-2">
                <p className="leading-relaxed break-words">{deleteError.message}</p>
                {deleteError.requiresOwnerAuth && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsDeleteDialogOpen(false);
                      useStudioStore.getState().setSecurityModalOpen(true);
                    }}
                    className="h-7 rounded-none text-[11px] font-sans gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/15"
                  >
                    <Lock className="size-3" />
                    <span>Unlock Security Shield</span>
                  </Button>
                )}
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 font-sans">
              <Button
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => setIsDeleteDialogOpen(false)}
                className="rounded-none font-sans text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="rounded-none font-sans text-xs gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="size-3.5" />
                    <span>Delete</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export const ComponentCard = React.memo(ComponentCardInner);
ComponentCard.displayName = "ComponentCard";
