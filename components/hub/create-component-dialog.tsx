"use client";

import React, { useState, useRef } from "react";
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
import {
  Sparkles,
  Layers,
  Check,
  LayoutTemplate,
  CreditCard,
  MousePointerClick,
  Activity,
  FileCode,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface CreateComponentDialogProps {
  onCreated?: (id: string) => void;
}

export interface StarterTemplateCard {
  id?: string;
  name: string;
  category: string;
  description: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const STARTER_TEMPLATES: StarterTemplateCard[] = [
  {
    id: undefined,
    name: "Blank Clean Slate",
    category: "Custom",
    description: "Minimal clean boilerplate with empty harness and zero styling.",
    badge: "Clean",
    icon: FileCode,
  },
  {
    id: "ink-orbit-hero",
    name: "Ink Orbit 3D Hero",
    category: "Heroes",
    description: "Generative 3D ink sculpture hero with interactive canvas physics.",
    badge: "3D Physics",
    icon: LayoutTemplate,
  },
  {
    id: "spotlight-card",
    name: "Interactive Spotlight Card",
    category: "Cards",
    description: "Dynamic mouse-following radial spotlight with border beam glow.",
    badge: "Spotlight",
    icon: CreditCard,
  },
  {
    id: "shimmer-button",
    name: "Aurora Shimmer Button",
    category: "Buttons",
    description: "Iridescent shimmer sheen with spring hover scale micro-interaction.",
    badge: "Aurora",
    icon: MousePointerClick,
  },
  {
    id: "metric-badge",
    name: "Live Status Radar Badge",
    category: "Badges",
    description: "Pulsing radar ping status indicator with telemetry metrics.",
    badge: "Radar",
    icon: Activity,
  },
];

export const COMPONENT_CATEGORIES = [
  "Heroes",
  "Cards",
  "Buttons",
  "Badges",
  "Custom",
] as const;

export function CreateComponentDialog({ onCreated }: CreateComponentDialogProps) {
  const {
    isCreateComponentDialogOpen,
    setCreateComponentDialogOpen,
    createComponent,
  } = useStudioStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("Custom");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameRef = useRef("");
  const descriptionRef = useRef("");
  const categoryRef = useRef("Custom");
  const templateIdRef = useRef<string | undefined>(undefined);

  const handleOpenChange = (open: boolean) => {
    setCreateComponentDialogOpen(open);
    if (!open) {
      nameRef.current = "";
      descriptionRef.current = "";
      categoryRef.current = "Custom";
      templateIdRef.current = undefined;

      setName("");
      setDescription("");
      setCategory("Custom");
      setSelectedTemplateId(undefined);
      setError("");
    }
  };

  const handleSelectTemplate = (template: StarterTemplateCard) => {
    templateIdRef.current = template.id;
    categoryRef.current = template.category;
    setSelectedTemplateId(template.id);
    setCategory(template.category);
    if (error) setError("");
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault?.();
    const effectiveName = (nameRef.current || name).trim();
    if (!effectiveName) {
      setError("Please enter a component name.");
      return;
    }

    const effectiveCategory = (categoryRef.current || category || "Custom").trim();
    const effectiveDescription = (descriptionRef.current || description).trim() || undefined;
    const effectiveTemplateId =
      templateIdRef.current !== undefined ? templateIdRef.current : selectedTemplateId;

    setIsSubmitting(true);
    try {
      const newId = createComponent({
        name: effectiveName,
        description: effectiveDescription,
        category: effectiveCategory || "Custom",
        starterTemplateId: effectiveTemplateId || undefined,
      });

      if (onCreated && newId) {
        onCreated(newId);
      }

      handleOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isCreateComponentDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto overflow-x-hidden flex flex-col font-sans p-0 gap-0 rounded-none border border-border bg-card">
        {/* Architectural Header Bar */}
        <DialogHeader className="studio-toolbar-surface border-b border-border px-6 py-4 pr-12 shrink-0">
          <div className="flex items-center gap-2">
            <Badge variant="eyebrow" className="rounded-none">
              NEW COMPONENT
            </Badge>
          </div>
          <div className="flex items-start gap-3 mt-1.5">
            <div className="flex size-9 items-center justify-center rounded-none border border-border bg-background text-foreground shrink-0 mt-0.5">
              <Layers className="size-4" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base sm:text-lg font-semibold font-sans tracking-tight text-foreground">
                Create New Component
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-sans leading-normal">
                Start fresh with a blank canvas or clone from a curated starter template.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="px-6 py-5 space-y-4">
            {/* Component Name Field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="component-name-input"
                className="text-xs font-medium text-foreground font-sans flex items-center justify-between"
              >
                <span>
                  Component Name <span className="text-destructive">*</span>
                </span>
                <span className="text-[11px] text-muted-foreground font-sans tabular-nums">
                  {name.length}/60
                </span>
              </label>
              <Input
                id="component-name-input"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "component-name-error" : undefined}
                aria-required="true"
                value={name}
                onChange={(e) => {
                  nameRef.current = e.target.value;
                  setName(e.target.value);
                  if (error) setError("");
                }}
                placeholder="e.g. Animated Pricing Card"
                className="text-xs font-sans h-9 rounded-none bg-background border-border"
                autoFocus
                maxLength={60}
              />
              {error && (
                <span
                  id="component-name-error"
                  role="alert"
                  className="text-[11px] text-destructive font-sans animate-in fade-in-0 slide-in-from-top-1 duration-150"
                >
                  {error}
                </span>
              )}
            </div>

            {/* Category Segmented Hairline Grid */}
            <div className="flex flex-col gap-1.5">
              <label id="component-category-label" className="text-xs font-medium text-foreground font-sans">
                Category
              </label>
              <div
                role="radiogroup"
                aria-labelledby="component-category-label"
                className="grid grid-cols-5 gap-px bg-border border border-border rounded-none overflow-hidden"
              >
                {COMPONENT_CATEGORIES.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <Button
                      key={cat}
                      type="button"
                      variant={isSelected ? "default" : "ghost"}
                      size="sm"
                      aria-pressed={isSelected}
                      onClick={() => {
                        categoryRef.current = cat;
                        setCategory(cat);
                      }}
                      className={cn(
                        "rounded-none font-sans text-xs h-8 px-2 transition-colors duration-150",
                        isSelected
                          ? "bg-primary text-primary-foreground font-medium"
                          : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      )}
                    >
                      {cat}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Description Field (Optional) */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="component-description-input"
                className="text-xs font-medium text-foreground font-sans flex items-center justify-between"
              >
                <span>Description (Optional)</span>
                <span className="text-[11px] text-muted-foreground font-sans tabular-nums">
                  {description.length}/200
                </span>
              </label>
              <Textarea
                id="component-description-input"
                value={description}
                onChange={(e) => {
                  descriptionRef.current = e.target.value;
                  setDescription(e.target.value);
                }}
                placeholder="e.g. Interactive glassmorphic card with dynamic lighting and tilt physics"
                className="text-xs font-sans min-h-[56px] rounded-none resize-none bg-background border-border"
                rows={2}
                maxLength={200}
              />
            </div>

            {/* Starter Template Selection - Connected Hairline Grid with Proper Text Wrapping */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label id="starter-template-label" className="text-xs font-medium text-foreground font-sans">
                  Starter Template
                </label>
                <span className="text-[11px] text-muted-foreground font-sans">
                  Select baseline code & dependencies
                </span>
              </div>

              <div
                role="radiogroup"
                aria-labelledby="starter-template-label"
                className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border border border-border rounded-none overflow-hidden"
              >
                {STARTER_TEMPLATES.map((tmpl, index) => {
                  const isSelected = selectedTemplateId === tmpl.id;
                  const Icon = tmpl.icon;
                  const isFullSpan = index === 0;

                  return (
                    <Button
                      key={tmpl.id ?? "blank-slate"}
                      type="button"
                      variant="ghost"
                      aria-pressed={isSelected}
                      onClick={() => handleSelectTemplate(tmpl)}
                      className={cn(
                        "h-auto w-full whitespace-normal overflow-hidden flex flex-col items-start justify-start p-3.5 text-left rounded-none transition-colors duration-150 relative",
                        isFullSpan && "sm:col-span-2",
                        isSelected
                          ? "bg-muted/80 text-foreground ring-1 ring-inset ring-primary"
                          : "bg-background hover:bg-muted/40 text-foreground"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 w-full mb-1.5">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div
                            className={cn(
                              "flex size-6 shrink-0 items-center justify-center rounded-none border",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-muted/40 text-muted-foreground"
                            )}
                          >
                            <Icon className="size-3.5" />
                          </div>
                          <span className="text-xs font-medium font-sans truncate text-foreground">
                            {tmpl.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge
                            variant={isSelected ? "default" : "secondary"}
                            className="rounded-none text-[10px] px-1.5 py-0 font-sans leading-tight"
                          >
                            {tmpl.badge}
                          </Badge>
                          {isSelected && (
                            <div className="flex size-4 items-center justify-center rounded-none bg-primary text-primary-foreground">
                              <Check className="size-2.5" />
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="w-full text-[11px] text-muted-foreground font-sans whitespace-normal break-words line-clamp-2 leading-relaxed">
                        {tmpl.description}
                      </p>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sticky Architectural Dialog Footer */}
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
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="rounded-none font-sans text-xs h-8 px-4 gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5" />
                  <span>Create Component</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
