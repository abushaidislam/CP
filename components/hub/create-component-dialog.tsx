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
    const effectiveTemplateId = templateIdRef.current !== undefined ? templateIdRef.current : selectedTemplateId;

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
      <DialogContent className="sm:max-w-xl w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto overflow-x-hidden flex flex-col font-sans p-6 gap-5">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="eyebrow">NEW COMPONENT</Badge>
          </div>
          <div className="flex items-start gap-3 mt-1.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
              <Layers className="size-4.5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-semibold font-sans tracking-tight text-foreground">
                Create New Component
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-sans leading-normal">
                Start fresh with a blank canvas or clone from a curated starter template.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Component Name Field */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="component-name-input"
              className="text-xs font-medium text-foreground font-sans flex items-center justify-between"
            >
              <span>
                Component Name <span className="text-destructive">*</span>
              </span>
              <span className="text-[11px] text-muted-foreground font-sans">
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

          {/* Category Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-foreground font-sans">
              Category
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {COMPONENT_CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <Button
                    key={cat}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      categoryRef.current = cat;
                      setCategory(cat);
                    }}
                    className="font-sans text-xs h-7 px-3 transition-colors duration-150"
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
              <span className="text-[11px] text-muted-foreground font-sans">
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
              className="text-xs font-sans min-h-[64px] resize-none transition-colors duration-150"
              rows={2}
              maxLength={200}
            />
          </div>

          {/* Starter Template Selection */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground font-sans">
                Starter Template
              </label>
              <span className="text-[11px] text-muted-foreground font-sans">
                Select baseline code & dependencies
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {STARTER_TEMPLATES.map((tmpl) => {
                const isSelected = selectedTemplateId === tmpl.id;
                const Icon = tmpl.icon;

                return (
                  <Button
                    key={tmpl.id ?? "blank-slate"}
                    type="button"
                    variant="outline"
                    onClick={() => handleSelectTemplate(tmpl)}
                    className={`h-auto flex flex-col items-start justify-start p-3 text-left border rounded-lg transition-all duration-150 relative ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-2xs"
                        : "border-border hover:border-foreground/20 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex items-center gap-1.5 min-w-0 pr-1">
                        <Icon className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs font-medium font-sans truncate text-foreground">
                          {tmpl.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          variant={isSelected ? "default" : "secondary"}
                          className="text-[10px] px-1.5 py-0 font-sans leading-tight"
                        >
                          {tmpl.badge}
                        </Badge>
                        {isSelected && (
                          <div className="flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="size-2.5" />
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-sans line-clamp-2 leading-relaxed">
                      {tmpl.description}
                    </p>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Dialog Footer Actions */}
          <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-border mt-1">
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
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="font-sans text-xs gap-1.5 active:scale-[0.98] transition-transform duration-100"
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
