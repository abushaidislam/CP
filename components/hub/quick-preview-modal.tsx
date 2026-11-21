"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  useStudioStore,
  PreviewTheme,
  StudioFileName,
  UserComponent,
  DEFAULT_TEMPLATE_PREVIEWS,
} from "@/lib/store/studio-store";
import { DEFAULT_TEMPLATES } from "@/lib/sandbox/default-templates";
import { compileSandboxHtml } from "@/lib/sandbox/sandbox-compiler";
import {
  parseDemoControls,
  bakeSettingsIntoDemoCode,
  MAX_COLOR_ARRAY_ITEMS,
  type DemoControlDefinition,
  type DemoControlValue,
} from "@/lib/sandbox/demo-controls";
import { ComponentCard } from "@/components/hub/component-card";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Sun,
  Moon,
  Eye,
  Code2,
  History,
  Loader2,
  SlidersHorizontal,
  ChevronsRight,
  ChevronDown,
  Sparkles,
  Bookmark,
  Link2,
  Plus,
  Trash2,
  X,
} from "lucide-react";

export interface QuickPreviewModalProps {
  onOpenStudio?: (componentId: string) => void;
  defaultTab?: "preview" | "code" | "history";
  defaultCodeFile?: StudioFileName;
}

const formatDate = (t?: number | string) => formatRelativeTime(t);

function normalizeHexForColorInput(value: string): string {
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed;
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const r = trimmed[1];
    const g = trimmed[2];
    const b = trimmed[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  if (/^#[0-9a-fA-F]{8}$/.test(trimmed)) {
    return trimmed.slice(0, 7);
  }
  return "#6366f1";
}

function formatNumberDisplay(val: number, step?: number): string {
  if (!Number.isFinite(val)) return "0";
  if (Number.isInteger(val) && (!step || Number.isInteger(step))) {
    return String(val);
  }
  const decimals =
    step && !Number.isInteger(step)
      ? Math.min(4, (String(step).split(".")[1] || "").length)
      : 2;
  return Number(val.toFixed(decimals)).toString();
}

function formatOptionLabel(opt: string): string {
  if (!opt) return opt;
  if (opt.toLowerCase() === "auto") return "Auto";
  if (opt.toLowerCase() === "light") return "Light";
  if (opt.toLowerCase() === "dark") return "Dark";
  return opt.charAt(0).toUpperCase() + opt.slice(1);
}

export function QuickPreviewModal({
  onOpenStudio,
  defaultTab = "preview",
  defaultCodeFile = "component.tsx",
}: QuickPreviewModalProps) {
  const {
    quickPreviewComponentId,
    setQuickPreviewComponentId,
    userComponents,
    variantsByTemplate,
    activeVariantByTemplate,
    recentComponentIds,
    loadComponent,
    ensureComponentFilesLoaded,
    previewTheme: globalPreviewTheme,
  } = useStudioStore(
    useShallow((s) => ({
      quickPreviewComponentId: s.quickPreviewComponentId,
      setQuickPreviewComponentId: s.setQuickPreviewComponentId,
      userComponents: s.userComponents,
      variantsByTemplate: s.variantsByTemplate,
      activeVariantByTemplate: s.activeVariantByTemplate,
      recentComponentIds: s.recentComponentIds,
      loadComponent: s.loadComponent,
      ensureComponentFilesLoaded: s.ensureComponentFilesLoaded,
      previewTheme: s.previewTheme,
    }))
  );

  const [activeTab, setActiveTab] = useState<"preview" | "code" | "history">(defaultTab);
  const [selectedCodeFile, setSelectedCodeFile] = useState<StudioFileName>(defaultCodeFile);
  const [previewTheme, setPreviewTheme] = useState<PreviewTheme>(globalPreviewTheme || "dark");
  const [stageThemeSelect, setStageThemeSelect] = useState<"auto" | "dark" | "light">("auto");
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedCli, setCopiedCli] = useState<boolean>(false);
  const [copiedFloatingCode, setCopiedFloatingCode] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isIframeLoading, setIsIframeLoading] = useState<boolean>(true);
  const [previewHydrationStage, setPreviewHydrationStage] = useState<
    "compiling" | "hydrating-deps" | "mounting"
  >("compiling");
  const [showControls, setShowControls] = useState<boolean>(true);
  const [controlOverrides, setControlOverrides] = useState<Record<string, DemoControlValue>>({});
  const quickIframeRef = useRef<HTMLIFrameElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const similarSectionRef = useRef<HTMLDivElement | null>(null);
  const controlOverridesRef = useRef<Record<string, DemoControlValue>>({});
  controlOverridesRef.current = controlOverrides;
  const copyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cliTimerRef = useRef<NodeJS.Timeout | null>(null);
  const floatingCopyTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      if (cliTimerRef.current) clearTimeout(cliTimerRef.current);
      if (floatingCopyTimerRef.current) clearTimeout(floatingCopyTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    setSelectedCodeFile(defaultCodeFile);
  }, [defaultCodeFile]);

  const component = useMemo(() => {
    if (!quickPreviewComponentId) return null;
    return (
      userComponents?.[quickPreviewComponentId] ||
      DEFAULT_TEMPLATES.find((t) => t.id === quickPreviewComponentId) ||
      null
    );
  }, [quickPreviewComponentId, userComponents]);

  // Lazily hydrate full source files when opening Quick Preview on a summary-only repo component
  useEffect(() => {
    if (!quickPreviewComponentId) return;
    const target = userComponents?.[quickPreviewComponentId];
    if (target && (target.filesLoaded === false || !target.files?.["component.tsx"])) {
      void ensureComponentFilesLoaded(quickPreviewComponentId);
    }
  }, [quickPreviewComponentId, userComponents, ensureComponentFilesLoaded]);

  const similarComponents = useMemo((): UserComponent[] => {
    if (!component) return [];
    const fallbackTemplates: UserComponent[] = DEFAULT_TEMPLATES.filter(
      (t) => !userComponents?.[t.id]
    ).map((t) => ({
      ...t,
      isBuiltIn: true,
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
      previewImage: DEFAULT_TEMPLATE_PREVIEWS[t.id],
    }));

    const allItems: UserComponent[] = [
      ...Object.values(userComponents || {}),
      ...fallbackTemplates,
    ].filter((item) => item.id !== component.id);

    const sameCategory = allItems.filter(
      (item) =>
        (item.category || "").toLowerCase() === (component.category || "").toLowerCase()
    );
    const others = allItems.filter(
      (item) =>
        (item.category || "").toLowerCase() !== (component.category || "").toLowerCase()
    );
    return [...sameCategory, ...others].slice(0, 16);
  }, [component, userComponents]);

  const handleOpenStudio = () => {
    if (!component) return;
    loadComponent(component.id);
    setQuickPreviewComponentId(null);
    if (onOpenStudio) {
      onOpenStudio(component.id);
    }
  };

  const handleSelectSimilarComponent = (nextId: string) => {
    setQuickPreviewComponentId(nextId);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleOpenSimilarInStudio = (targetId: string) => {
    loadComponent(targetId);
    setQuickPreviewComponentId(null);
    if (onOpenStudio) {
      onOpenStudio(targetId);
    }
  };

  const handleScrollToSimilar = () => {
    if (similarSectionRef.current) {
      similarSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const copyText = async (text: string): Promise<boolean> => {
    try {
      if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fallback or ignore
    }
    return false;
  };

  const resolveComponentFile = (fileKey: StudioFileName): string => {
    if (!component?.files) return "";
    if (fileKey === "default.tsx" || fileKey === "demo.tsx") {
      return (
        component.files["default.tsx"] ?? component.files["demo.tsx"] ?? ""
      );
    }
    return component.files[fileKey] || "";
  };

  const handleCopyCode = async () => {
    if (!component) return;
    const code = resolveComponentFile(selectedCodeFile);
    await copyText(code);
    setCopiedCode(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopiedCode(false), 2000);
  };

  const cliSlug =
    component && "repoSlug" in component && component.repoSlug
      ? component.repoSlug
      : component?.id || "";

  const handleCopyCli = async () => {
    if (!component) return;
    const cli = `npx shadcn@latest add ${cliSlug}`;
    await copyText(cli);
    setCopiedCli(true);
    if (cliTimerRef.current) clearTimeout(cliTimerRef.current);
    cliTimerRef.current = setTimeout(() => setCopiedCli(false), 2000);
  };

  const demoSourceForControls = useMemo(() => {
    if (!component?.files) return "";
    return component.files["default.tsx"] || component.files["demo.tsx"] || "";
  }, [component]);

  const parsedDemoControls = useMemo(() => {
    if (!component?.files) {
      return parseDemoControls("");
    }
    return parseDemoControls(demoSourceForControls, component.files["component.tsx"]);
  }, [component, demoSourceForControls]);

  const hasNativeThemeControl = useMemo(() => {
    return parsedDemoControls.controls.some(
      (c) => c.key.toLowerCase() === "theme"
    );
  }, [parsedDemoControls.controls]);

  useEffect(() => {
    setControlOverrides({});
    controlOverridesRef.current = {};
    setStageThemeSelect("auto");
    setShowControls(
      parsedDemoControls.status === "active" && parsedDemoControls.controls.length > 0
    );
  }, [component?.id, parsedDemoControls.status, parsedDemoControls.controls.length]);

  const effectiveControlValues = useMemo(() => {
    return {
      ...parsedDemoControls.defaultValues,
      ...controlOverrides,
    };
  }, [parsedDemoControls.defaultValues, controlOverrides]);

  const pushQuickDemoProps = (nextOverrides: Record<string, DemoControlValue>) => {
    if (quickIframeRef.current?.contentWindow) {
      quickIframeRef.current.contentWindow.postMessage(
        { type: "SET_DEMO_PROPS", props: nextOverrides },
        "*"
      );
    }
  };

  const handleQuickControlChange = (key: string, value: DemoControlValue) => {
    if (key.toLowerCase() === "theme" && typeof value === "string") {
      if (value === "light" || value === "dark") {
        setPreviewTheme(value);
      } else if (value === "auto") {
        setPreviewTheme("dark");
      }
    }
    setControlOverrides((prev) => {
      const next = { ...prev };
      if (JSON.stringify(parsedDemoControls.defaultValues[key]) === JSON.stringify(value)) {
        delete next[key];
      } else {
        next[key] = value;
      }
      controlOverridesRef.current = next;
      pushQuickDemoProps(next);
      return next;
    });
  };

  const handleQuickResetAll = () => {
    setControlOverrides({});
    controlOverridesRef.current = {};
    setStageThemeSelect("auto");
    setPreviewTheme("dark");
    if (quickIframeRef.current?.contentWindow) {
      quickIframeRef.current.contentWindow.postMessage({ type: "RESET_DEMO_PROPS" }, "*");
    }
  };

  const handleFloatingCopyPrimary = async () => {
    if (!component) return;
    const compCode = resolveComponentFile("component.tsx");
    const hasTuned = Object.keys(controlOverrides).length > 0;
    const payload =
      hasTuned && demoSourceForControls
        ? bakeSettingsIntoDemoCode(demoSourceForControls, controlOverrides)
        : compCode || demoSourceForControls;
    await copyText(payload);
    setCopiedFloatingCode(true);
    if (floatingCopyTimerRef.current) clearTimeout(floatingCopyTimerRef.current);
    floatingCopyTimerRef.current = setTimeout(() => setCopiedFloatingCode(false), 2000);
  };

  const handleCopyBakedDemo = async () => {
    const baked = bakeSettingsIntoDemoCode(demoSourceForControls, controlOverrides);
    await copyText(baked);
    setCopiedFloatingCode(true);
    if (floatingCopyTimerRef.current) clearTimeout(floatingCopyTimerRef.current);
    floatingCopyTimerRef.current = setTimeout(() => setCopiedFloatingCode(false), 2000);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { compiledHtml, compileError } = useMemo(() => {
    if (!component) return { compiledHtml: "", compileError: null };
    try {
      const res = compileSandboxHtml(
        component.files["component.tsx"] || "",
        demoSourceForControls,
        component.files["index.css"] || "",
        component.dependencies || [],
        previewTheme === "dark" ? "dark" : "light",
        previewTheme
      );
      return { compiledHtml: res.html, compileError: res.error };
    } catch (err) {
      return {
        compiledHtml: "",
        compileError: err instanceof Error ? err.message : String(err),
      };
    }
  }, [component, demoSourceForControls, previewTheme, reloadKey]);

  const activeCodeContent = resolveComponentFile(selectedCodeFile);
  const codeLines = useMemo(() => {
    return activeCodeContent.split("\n");
  }, [activeCodeContent]);

  const componentVariants = useMemo(() => {
    if (!component) return [];
    return variantsByTemplate?.[component.id] || [];
  }, [component, variantsByTemplate]);

  const totalCheckpoints = useMemo(() => {
    return componentVariants.reduce(
      (acc, v) => acc + (v.checkpoints?.length || 0),
      0
    );
  }, [componentVariants]);

  const isOpen = Boolean(quickPreviewComponentId && component);

  useEffect(() => {
    if (!isOpen) return;
    setIsIframeLoading(true);
    setPreviewHydrationStage("compiling");
    const advanceTimer = setTimeout(() => {
      setPreviewHydrationStage((prev) =>
        prev === "compiling" ? "hydrating-deps" : prev
      );
    }, 90);
    const handleMsg = (e: MessageEvent) => {
      if (quickIframeRef.current && e.source !== quickIframeRef.current.contentWindow) {
        return;
      }
      if (
        e.data?.type === "SANDBOX_STAGE" &&
        (e.data.stage === "hydrating-deps" || e.data.stage === "mounting")
      ) {
        setPreviewHydrationStage(e.data.stage);
      }
      if (e.data?.type === "RENDER_SUCCESS" || e.data?.type === "RUNTIME_ERROR") {
        setIsIframeLoading(false);
        if (e.data?.type === "RENDER_SUCCESS" && Object.keys(controlOverridesRef.current).length > 0) {
          pushQuickDemoProps(controlOverridesRef.current);
        }
      }
    };
    window.addEventListener("message", handleMsg);
    const timer = setTimeout(() => setIsIframeLoading(false), 2500);
    return () => {
      window.removeEventListener("message", handleMsg);
      clearTimeout(advanceTimer);
      clearTimeout(timer);
    };
  }, [isOpen, component?.id, reloadKey, previewTheme]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setQuickPreviewComponentId(null);
    }
  };

  if (!isOpen || !component) {
    return null;
  }

  const renderFloatingControlRow = (ctrl: DemoControlDefinition) => {
    const currentValue =
      ctrl.key in effectiveControlValues
        ? effectiveControlValues[ctrl.key]
        : ctrl.defaultValue;

    if (ctrl.type === "boolean") {
      return (
        <div
          key={ctrl.key}
          className="flex items-center justify-between gap-3 rounded-none border border-border bg-muted/35 px-3 py-2.5 transition-colors hover:bg-muted/55"
        >
          <span className="text-xs font-medium text-foreground truncate">
            {ctrl.label}
          </span>
          <Switch
            checked={Boolean(currentValue)}
            onCheckedChange={(checked) =>
              handleQuickControlChange(ctrl.key, checked)
            }
            aria-label={ctrl.label}
          />
        </div>
      );
    }

    if (ctrl.type === "number") {
      const numVal =
        typeof currentValue === "number"
          ? currentValue
          : Number(ctrl.defaultValue) || 0;
      const min = Math.min(ctrl.min ?? 0, numVal);
      const max = Math.max(ctrl.max ?? 100, numVal);
      const step = ctrl.step ?? 1;
      const ratio =
        max > min
          ? Math.max(0, Math.min(100, ((numVal - min) / (max - min)) * 100))
          : 0;

      return (
        <div
          key={ctrl.key}
          className="relative h-9 rounded-none border border-border bg-muted/35 overflow-hidden flex items-center justify-between gap-2 px-3 select-none transition-colors hover:bg-muted/55"
        >
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-0 bg-foreground/[0.08] border-r border-border/60 pointer-events-none transition-all duration-75"
            style={{ width: `${ratio}%` }}
          />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={numVal}
            aria-label={`${ctrl.label} slider`}
            onChange={(e) => {
              const nextNum = Number(e.target.value);
              if (Number.isFinite(nextNum)) {
                handleQuickControlChange(ctrl.key, nextNum);
              }
            }}
            className="absolute inset-y-0 left-0 w-[65%] opacity-0 cursor-ew-resize z-10"
          />
          <span className="relative z-0 text-xs font-medium text-foreground truncate pointer-events-none">
            {ctrl.label}
          </span>
          <input
            type="number"
            value={formatNumberDisplay(numVal, step)}
            step={step}
            aria-label={ctrl.label}
            onChange={(e) => {
              const parsedNum = Number(e.target.value);
              if (Number.isFinite(parsedNum)) {
                handleQuickControlChange(ctrl.key, parsedNum);
              }
            }}
            className="relative z-20 w-20 bg-transparent text-right font-mono text-xs font-medium text-foreground tabular-nums focus:outline-none focus:ring-1 focus:ring-ring rounded-none px-1"
          />
        </div>
      );
    }

    if (ctrl.type === "select" && ctrl.options) {
      const selected =
        typeof currentValue === "string"
          ? currentValue
          : String(ctrl.defaultValue || ctrl.options[0] || "");
      return (
        <div
          key={ctrl.key}
          className="flex items-center justify-between gap-2 rounded-none border border-border bg-muted/35 px-3 py-1.5 transition-colors hover:bg-muted/55"
        >
          <span className="text-xs font-medium text-foreground truncate">
            {ctrl.label}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 rounded-none text-xs font-semibold text-foreground hover:bg-muted gap-1"
              >
                <span>{formatOptionLabel(selected)}</span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-36 rounded-none border-border bg-popover text-popover-foreground font-sans"
            >
              {ctrl.options.map((opt) => (
                <DropdownMenuItem
                  key={opt}
                  onClick={() => handleQuickControlChange(ctrl.key, opt)}
                  className="flex items-center justify-between rounded-none text-xs cursor-pointer"
                >
                  <span>{formatOptionLabel(opt)}</span>
                  {selected === opt && (
                    <Check className="size-3.5 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }

    if (ctrl.type === "color") {
      const colorStr =
        typeof currentValue === "string"
          ? currentValue
          : String(ctrl.defaultValue || "#6366f1");
      return (
        <div
          key={ctrl.key}
          className="flex items-center justify-between gap-2 rounded-none border border-border bg-muted/35 px-3 py-2 transition-colors hover:bg-muted/55"
        >
          <span className="text-xs font-medium text-foreground truncate">
            {ctrl.label}
          </span>
          <div className="flex items-center gap-1.5">
            <label
              className="relative flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-none border border-border overflow-hidden"
              style={{ backgroundColor: colorStr }}
              title={`Pick color for ${ctrl.label}`}
            >
              <input
                type="color"
                value={normalizeHexForColorInput(colorStr)}
                onChange={(e) =>
                  handleQuickControlChange(ctrl.key, e.target.value)
                }
                aria-label={`${ctrl.label} color picker`}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </label>
            <input
              type="text"
              value={colorStr}
              onChange={(e) =>
                handleQuickControlChange(ctrl.key, e.target.value)
              }
              aria-label={`${ctrl.label} color value`}
              className="w-20 bg-transparent text-right font-mono text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring rounded-none px-1"
            />
          </div>
        </div>
      );
    }

    if (ctrl.type === "color-array") {
      const palette = Array.isArray(currentValue)
        ? currentValue
        : Array.isArray(ctrl.defaultValue)
        ? ctrl.defaultValue
        : [];
      return (
        <div
          key={ctrl.key}
          className="rounded-none border border-border bg-muted/35 px-3 py-2 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground truncate">
              {ctrl.label}
            </span>
            {palette.length < MAX_COLOR_ARRAY_ITEMS && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleQuickControlChange(ctrl.key, [...palette, "#38bdf8"])
                }
                className="h-5 px-1.5 rounded-none text-[10px] gap-0.5"
              >
                <Plus className="size-2.5" />
                <span>Add</span>
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {palette.map((swatch, idx) => (
              <div
                key={`${ctrl.key}-${idx}`}
                className="flex items-center gap-1 rounded-none bg-background border border-border pl-1 pr-1 py-0.5"
              >
                <label
                  className="relative block size-4 rounded-none cursor-pointer"
                  style={{ backgroundColor: swatch }}
                >
                  <input
                    type="color"
                    value={normalizeHexForColorInput(swatch)}
                    onChange={(e) => {
                      const next = [...palette];
                      next[idx] = e.target.value;
                      handleQuickControlChange(ctrl.key, next);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </label>
                {palette.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      const next = palette.filter((_, i) => i !== idx);
                      handleQuickControlChange(ctrl.key, next);
                    }}
                    className="size-4 rounded-none text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-2.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (ctrl.type === "textarea") {
      return (
        <div
          key={ctrl.key}
          className="rounded-none border border-border bg-muted/35 px-3 py-2 space-y-1.5"
        >
          <span className="block text-xs font-medium text-foreground truncate">
            {ctrl.label}
          </span>
          <Textarea
            value={
              typeof currentValue === "string"
                ? currentValue
                : String(ctrl.defaultValue ?? "")
            }
            onChange={(e) => handleQuickControlChange(ctrl.key, e.target.value)}
            aria-label={ctrl.label}
            rows={2}
            className="min-h-[48px] bg-background border-border text-xs text-foreground rounded-none font-sans resize-y"
          />
        </div>
      );
    }

    if (ctrl.type === "string-array") {
      const list = Array.isArray(currentValue)
        ? currentValue
        : Array.isArray(ctrl.defaultValue)
        ? ctrl.defaultValue
        : [];
      return (
        <div
          key={ctrl.key}
          className="rounded-none border border-border bg-muted/35 px-3 py-2 space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground truncate">
              {ctrl.label}
            </span>
            {list.length < 10 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleQuickControlChange(ctrl.key, [...list, "Item"])
                }
                className="h-5 px-1.5 rounded-none text-[10px] gap-0.5"
              >
                <Plus className="size-2.5" />
                <span>Add</span>
              </Button>
            )}
          </div>
          <div className="space-y-1">
            {list.map((item, idx) => (
              <div key={`${ctrl.key}-${idx}`} className="flex items-center gap-1">
                <Input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const next = [...list];
                    next[idx] = e.target.value;
                    handleQuickControlChange(ctrl.key, next);
                  }}
                  className="h-6 flex-1 px-2 text-xs bg-background border-border text-foreground rounded-none font-sans"
                />
                {list.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      const next = list.filter((_, i) => i !== idx);
                      handleQuickControlChange(ctrl.key, next);
                    }}
                    className="size-6 rounded-none text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div
        key={ctrl.key}
        className="flex items-center justify-between gap-2 rounded-none border border-border bg-muted/35 px-3 py-2 transition-colors hover:bg-muted/55"
      >
        <span className="text-xs font-medium text-foreground truncate shrink-0">
          {ctrl.label}
        </span>
        <input
          type="text"
          value={
            typeof currentValue === "string"
              ? currentValue
              : String(ctrl.defaultValue ?? "")
          }
          onChange={(e) => handleQuickControlChange(ctrl.key, e.target.value)}
          aria-label={ctrl.label}
          className="w-32 bg-transparent text-right text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring rounded-none px-1.5 py-0.5"
        />
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="w-screen max-w-none h-screen max-h-screen overflow-hidden flex flex-col font-sans p-0 gap-0 rounded-none border-0 bg-transparent shadow-none">
        {/* 1. PINNED VIEWPORT TOP BAR: Top-Left Component Identity & Top-Right Action Icons */}
        <DialogHeader className="w-full px-4 py-4 pr-13 shrink-0 z-10 pointer-events-none">
          <div className="sr-only">
            <Badge variant="eyebrow" className="rounded-none">
              21ST QUICK PREVIEW
            </Badge>
            <DialogDescription>
              {`Updated ${formatRelativeTime(component.updatedAt)}`}
            </DialogDescription>
          </div>

          <div className="flex items-center justify-between gap-4 w-full">
            {/* Top-Left Corner of Screen: Creator Avatar + Title + Category */}
            <div className="flex items-center gap-2.5 min-w-0 pointer-events-auto">
              <div className="size-6 rounded-none border border-border bg-card flex items-center justify-center text-[11px] font-semibold text-foreground shrink-0">
                {component.name.charAt(0).toUpperCase()}
              </div>
              <DialogTitle className="font-sans font-semibold text-sm tracking-tight text-foreground truncate">
                {component.name}
              </DialogTitle>
              <Badge variant="secondary" className="rounded-none font-sans text-[11px]">
                {component.category || "Custom"}
              </Badge>
            </div>

            {/* Top-Right Corner of Screen (next to Dialog Close X at top-4 right-4): Utility Action Icons */}
            <div className="flex items-center gap-1 shrink-0 pointer-events-auto">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 rounded-none border-border/80 bg-background/80 gap-1.5 font-sans text-xs"
                onClick={handleOpenStudio}
              >
                <ExternalLink className="size-3.5" />
                <span className="hidden sm:inline">Open in Studio</span>
              </Button>

              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7 rounded-none border border-border/80 bg-background/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={handleCopyCli}
                title="Copy npx shadcn CLI command"
              >
                {copiedCli ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <Link2 className="size-3.5" />
                )}
                <span className="sr-only">Copy CLI link</span>
              </Button>

              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7 rounded-none border border-border/80 bg-background/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() =>
                  setPreviewTheme(previewTheme === "dark" ? "light" : "dark")
                }
                title={
                  previewTheme === "dark"
                    ? "Switch to Light Mode"
                    : "Switch to Dark Mode"
                }
              >
                {previewTheme === "dark" ? (
                  <Sun className="size-3.5" />
                ) : (
                  <Moon className="size-3.5" />
                )}
                <span className="sr-only">
                  {previewTheme === "dark" ? "Light Mode" : "Dark Mode"}
                </span>
              </Button>

              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7 rounded-none border border-border/80 bg-background/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => {
                  setReloadKey((k) => k + 1);
                  setIsIframeLoading(true);
                }}
                title="Reset Preview"
              >
                <RotateCcw className="size-3.5" />
                <span className="sr-only">Reset Preview</span>
              </Button>

              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7 rounded-none border border-border/80 bg-background/80 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setIsSaved((v) => !v)}
                title={isSaved ? "Saved" : "Save component"}
              >
                <Bookmark
                  className={cn(
                    "size-3.5",
                    isSaved && "fill-current text-foreground"
                  )}
                />
                <span className="sr-only">Bookmark</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* SCROLLABLE VIEWPORT BODY: First Screen (Preview Stage + Bottom Bar) + Below-the-Fold 4-Column Similar Components Grid */}
        <div
          ref={scrollContainerRef}
          className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col"
        >
          {/* FIRST FOLD: Standalone Center Preview Stage + Bottom Floating Action Bar */}
          <Tabs
            value={activeTab}
            onValueChange={(val) =>
              setActiveTab(val as "preview" | "code" | "history")
            }
            className="min-h-[calc(100vh-3.75rem)] shrink-0 flex flex-col items-center justify-between w-full px-4 sm:px-10 md:px-16 pb-4 pt-2 gap-3"
          >
            {/* Standalone Center Stage Card + Side-by-Side Controls */}
            <div className="w-full max-w-5xl flex-1 min-h-[420px] max-h-[660px] flex flex-col justify-center mx-auto my-auto">
              {/* PREVIEW STAGE */}
              <TabsContent
                value="preview"
                className="w-full h-full flex flex-col gap-2 m-0"
              >
                {compileError && (
                  <div
                    role="alert"
                    className="rounded-none border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-sans flex items-center justify-between gap-2 shrink-0"
                  >
                    <span>Preview compilation error: {compileError}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-none gap-1.5 font-sans h-8 text-xs shrink-0"
                      onClick={() => {
                        setReloadKey((k) => k + 1);
                        setIsIframeLoading(true);
                      }}
                    >
                      <RotateCcw className="size-3.5" />
                      <span>Retry Preview</span>
                    </Button>
                  </div>
                )}

                <div className="w-full flex-1 min-h-[420px] flex flex-col lg:flex-row items-stretch gap-3 overflow-hidden">
                  {/* Left: Standalone Preview Stage Box (Never covered by Controls) */}
                  <div className="relative flex-1 min-w-0 h-full min-h-[380px] rounded-none border border-border bg-background shadow-2xl overflow-hidden">
                    {isIframeLoading && !compileError && (
                      <div
                        role="status"
                        aria-live="polite"
                        aria-busy="true"
                        className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/85 backdrop-blur-xs gap-3 font-sans select-none pointer-events-none p-6"
                      >
                        <div className="w-full max-w-sm rounded-none border border-border bg-card/95 p-4 shadow-vercel-floating flex flex-col gap-3">
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="eyebrow" className="rounded-none">
                              SANDBOX HYDRATION
                            </Badge>
                            <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                              {previewHydrationStage === "compiling"
                                ? "35%"
                                : previewHydrationStage === "hydrating-deps"
                                ? "68%"
                                : "92%"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <Loader2 className="size-4 animate-spin text-primary shrink-0" />
                            <span className="font-sans text-xs font-medium text-foreground">
                              {previewHydrationStage === "compiling"
                                ? "Initializing sandbox environment..."
                                : previewHydrationStage === "hydrating-deps"
                                ? "Hydrating sandbox ESM dependencies..."
                                : "Rendering live component preview..."}
                            </span>
                          </div>
                          <div
                            aria-hidden="true"
                            className="grid grid-cols-3 gap-1 h-1 w-full"
                          >
                            <div className="h-full bg-primary animate-shimmer" />
                            <div
                              className={
                                previewHydrationStage === "compiling"
                                  ? "h-full bg-muted"
                                  : "h-full bg-primary animate-shimmer"
                              }
                            />
                            <div
                              className={
                                previewHydrationStage === "mounting"
                                  ? "h-full bg-primary animate-shimmer"
                                  : "h-full bg-muted"
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <iframe
                      ref={quickIframeRef}
                      key={`${component.id}-${reloadKey}-${previewTheme}`}
                      title={`${component.name} Preview`}
                      srcDoc={compiledHtml}
                      sandbox="allow-scripts allow-modals allow-popups"
                      className="w-full h-full border-0"
                    />

                    {/* Collapsed Controls Trigger (Top-Right inside Preview Stage when Controls panel is closed) */}
                    {!showControls && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowControls(true)}
                        aria-label="Open controls"
                        title="Show Controls"
                        className="absolute top-3 right-3 z-20 size-9 rounded-none border-border bg-card/95 text-muted-foreground hover:bg-muted hover:text-foreground backdrop-blur-xs shadow-vercel-floating"
                      >
                        <SlidersHorizontal className="size-4" />
                      </Button>
                    )}
                  </div>

                  {/* Right: Separate Side-by-Side Controls Container (Does not overlap or hide the preview) */}
                  {showControls && (
                    <aside
                      aria-label="Component Controls"
                      className="w-full lg:w-72 shrink-0 h-full rounded-none border border-border bg-card shadow-2xl flex flex-col overflow-hidden select-none"
                    >
                      <div className="studio-toolbar-surface flex h-10 shrink-0 items-center justify-between border-b border-border px-3.5">
                        <span className="text-xs font-semibold tracking-tight text-foreground">
                          Controls
                        </span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setShowControls(false)}
                          aria-label="Collapse controls"
                          title="Collapse controls"
                          className="size-7 rounded-none text-muted-foreground hover:text-foreground"
                        >
                          <ChevronsRight className="size-4" />
                        </Button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
                        {parsedDemoControls.controls.map((ctrl) =>
                          renderFloatingControlRow(ctrl)
                        )}

                        {!hasNativeThemeControl && (
                          <div className="flex items-center justify-between gap-2 rounded-none border border-border bg-muted/35 px-3 py-1.5 transition-colors hover:bg-muted/55">
                            <span className="text-xs font-medium text-foreground truncate">
                              Theme
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 rounded-none text-xs font-semibold text-foreground hover:bg-muted gap-1"
                                >
                                  <span>{formatOptionLabel(stageThemeSelect)}</span>
                                  <ChevronDown className="size-3.5 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-36 rounded-none border-border bg-popover text-popover-foreground font-sans"
                              >
                                {(["auto", "dark", "light"] as const).map((opt) => (
                                  <DropdownMenuItem
                                    key={opt}
                                    onClick={() => {
                                      setStageThemeSelect(opt);
                                      setPreviewTheme(opt === "light" ? "light" : "dark");
                                    }}
                                    className="flex items-center justify-between rounded-none text-xs cursor-pointer"
                                  >
                                    <span>{formatOptionLabel(opt)}</span>
                                    {stageThemeSelect === opt && (
                                      <Check className="size-3.5 text-primary" />
                                    )}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </div>

                      <div className="p-2.5 pt-2 border-t border-border bg-muted/20 mt-auto shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleQuickResetAll}
                          className="w-full h-8 rounded-none text-muted-foreground hover:text-foreground text-xs font-medium gap-1.5"
                        >
                          <RotateCcw className="size-3.5" />
                          <span>Reset all</span>
                        </Button>
                      </div>
                    </aside>
                  )}
                </div>
              </TabsContent>

              {/* CODE STAGE */}
              <TabsContent
                value="code"
                className="w-full h-full flex flex-col gap-3 m-0 rounded-none border border-border bg-card p-5 shadow-2xl overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
                  <Tabs
                    value={selectedCodeFile}
                    onValueChange={(val) =>
                      setSelectedCodeFile(val as StudioFileName)
                    }
                    className="w-auto"
                  >
                    <TabsList className="font-sans h-8 rounded-none border border-border bg-muted/50 p-0.5">
                      <TabsTrigger
                        value="component.tsx"
                        className="rounded-none font-sans text-xs"
                      >
                        component.tsx
                      </TabsTrigger>
                      <TabsTrigger
                        value="default.tsx"
                        className="rounded-none font-sans text-xs"
                      >
                        default.tsx
                      </TabsTrigger>
                      <TabsTrigger
                        value="index.css"
                        className="rounded-none font-sans text-xs"
                      >
                        index.css
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-none gap-1.5 font-sans text-xs h-8"
                    onClick={handleCopyCode}
                  >
                    {copiedCode ? (
                      <Check className="size-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                  </Button>
                </div>

                <div className="flex items-center justify-between bg-muted/60 px-3 py-2 rounded-none font-mono text-xs border border-border shrink-0">
                  <span className="truncate select-all">{`npx shadcn@latest add ${cliSlug}`}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 rounded-none shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="Copy CLI command"
                    onClick={handleCopyCli}
                  >
                    {copiedCli ? (
                      <Check className="size-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </Button>
                  <span className="sr-only" role="status" aria-live="polite">
                    {copiedCode
                      ? `${selectedCodeFile} copied to clipboard`
                      : copiedCli
                      ? "CLI command copied to clipboard"
                      : ""}
                  </span>
                </div>

                <div className="relative flex-1 min-h-0 rounded-none border border-border bg-muted/30 overflow-hidden">
                  <div className="h-full max-h-[420px] overflow-auto p-4">
                    <pre className="font-mono text-xs leading-relaxed">
                      <code>
                        {codeLines.map((line: string, idx: number) => (
                          <div key={idx} className="flex">
                            <span className="w-8 shrink-0 select-none pr-3 text-right text-muted-foreground/40 text-[11px] font-mono">
                              {idx + 1}
                            </span>
                            <span className="font-mono whitespace-pre text-foreground flex-1">
                              {line || " "}
                            </span>
                          </div>
                        ))}
                      </code>
                    </pre>
                  </div>
                </div>
              </TabsContent>

              {/* HISTORY STAGE */}
              <TabsContent
                value="history"
                className="w-full h-full flex flex-col gap-3 m-0 rounded-none border border-border bg-card p-5 shadow-2xl overflow-y-auto"
              >
                {componentVariants.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center p-8 text-center border border-dashed border-border rounded-none bg-muted/20">
                    <History className="size-8 text-muted-foreground/60 mb-2" />
                    <h4 className="font-sans font-medium text-sm text-foreground">
                      No History Recorded
                    </h4>
                    <p className="font-sans text-xs text-muted-foreground mt-1 max-w-sm">
                      No checkpoints or variants have been saved for this component yet. Open it in
                      Studio to save version snapshots.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border text-xs text-muted-foreground font-sans">
                      <span>
                        {`${componentVariants.length} ${componentVariants.length === 1 ? "Variant" : "Variants"} • ${totalCheckpoints} ${totalCheckpoints === 1 ? "Checkpoint" : "Checkpoints"} saved`}
                      </span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {componentVariants.map((variant, idx) => {
                        const isActive = activeVariantByTemplate?.[component.id]
                          ? variant.id === activeVariantByTemplate[component.id]
                          : idx === 0;
                        return (
                          <div
                            key={variant.id}
                            className="rounded-none border border-border bg-background p-4 flex flex-col gap-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <h4 className="font-sans font-semibold text-sm text-foreground">
                                  {variant.name}
                                </h4>
                                {isActive && (
                                  <Badge variant="secondary" className="rounded-none font-sans text-[10px]">
                                    Active
                                  </Badge>
                                )}
                              </div>
                              <Badge variant="outline" className="rounded-none font-sans text-xs">
                                {`${variant.checkpoints?.length || 0} ${variant.checkpoints?.length === 1 ? "checkpoint" : "checkpoints"}`}
                              </Badge>
                            </div>
                            <span className="font-sans text-xs text-muted-foreground">
                              {`Created ${formatDate(variant.createdAt)}`}
                            </span>
                            {variant.checkpoints && variant.checkpoints.length > 0 && (
                              <div className="flex flex-col gap-2 mt-1 border-t border-border/50 pt-3">
                                <div className="text-[11px] font-sans font-medium uppercase tracking-wider text-muted-foreground">
                                  Checkpoints
                                </div>
                                <div className="flex flex-col gap-2">
                                  {variant.checkpoints.map((cp) => (
                                    <div
                                      key={cp.id}
                                      className="flex flex-col sm:flex-row sm:items-center justify-between rounded-none bg-muted/40 px-3 py-2 text-xs gap-1 border border-border/60"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="font-sans font-medium text-foreground">
                                          {cp.name}
                                        </span>
                                        {cp.description && (
                                          <span className="font-sans text-muted-foreground text-[11px] truncate max-w-xs">
                                            {`— ${cp.description}`}
                                          </span>
                                        )}
                                      </div>
                                      <span className="font-sans text-muted-foreground text-[11px]">
                                        {formatDate(cp.createdAt || cp.timestamp)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>
            </div>

            {/* Bottom Floating Action Bar (Remix · Save · Copy code | v · Preview/Code/History · See similar v) */}
            <div className="w-full max-w-5xl flex flex-col items-center gap-2.5 shrink-0">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenStudio}
                  className="h-8 px-3 rounded-none border border-transparent hover:border-border bg-background/60 hover:bg-card gap-1.5 text-xs font-medium"
                >
                  <Sparkles className="size-3.5" />
                  <span>Remix</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSaved((v) => !v)}
                  className="h-8 px-3 rounded-none border border-transparent hover:border-border bg-background/60 hover:bg-card gap-1.5 text-xs font-medium"
                >
                  <Bookmark
                    className={cn(
                      "size-3.5",
                      isSaved && "fill-current text-foreground"
                    )}
                  />
                  <span>{isSaved ? "Saved" : "Save"}</span>
                </Button>

                {/* Split Primary "Copy code | v" Button */}
                <div className="inline-flex items-center rounded-none border border-border overflow-hidden shadow-lg">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleFloatingCopyPrimary}
                    className="h-8 pl-3.5 pr-3 rounded-none text-xs font-medium gap-1.5 border-0"
                  >
                    {copiedFloatingCode ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    <span>{copiedFloatingCode ? "Copied" : "Copy code"}</span>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                        aria-label="More copy options"
                        className="h-8 px-2 rounded-none border-l border-primary-foreground/20"
                      >
                        <ChevronDown className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56 rounded-none border-border bg-popover text-popover-foreground font-sans"
                    >
                      <DropdownMenuItem
                        onClick={async () => {
                          await copyText(resolveComponentFile("component.tsx"));
                          setCopiedFloatingCode(true);
                        }}
                        className="rounded-none text-xs cursor-pointer gap-2"
                      >
                        <Copy className="size-3.5 text-muted-foreground" />
                        <span>Copy component.tsx</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleCopyBakedDemo}
                        className="rounded-none text-xs cursor-pointer gap-2"
                      >
                        <SlidersHorizontal className="size-3.5 text-muted-foreground" />
                        <span>Copy default.tsx (baked controls)</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleCopyCli}
                        className="rounded-none text-xs cursor-pointer gap-2"
                      >
                        <Link2 className="size-3.5 text-muted-foreground" />
                        <span>Copy npx shadcn CLI</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setActiveTab("code")}
                        className="rounded-none text-xs cursor-pointer gap-2"
                      >
                        <Code2 className="size-3.5 text-muted-foreground" />
                        <span>Inspect source files</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Preview / Code / History Switcher */}
                <TabsList className="font-sans h-8 w-fit rounded-none border border-border bg-card/90 p-0.5">
                  <TabsTrigger
                    value="preview"
                    className="rounded-none gap-1.5 font-sans text-xs h-7 px-2.5"
                  >
                    <Eye className="size-3.5" />
                    <span>Preview</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="code"
                    className="rounded-none gap-1.5 font-sans text-xs h-7 px-2.5"
                  >
                    <Code2 className="size-3.5" />
                    <span>Code</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="rounded-none gap-1.5 font-sans text-xs h-7 px-2.5"
                  >
                    <History className="size-3.5" />
                    <span>History</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* "See similar v" Button — Smooth-scrolls down to the 4-Column Connected ComponentCard Grid below */}
              {similarComponents.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleScrollToSimilar}
                  className="h-7 px-3.5 rounded-none border-border bg-card/90 text-xs font-medium gap-1.5"
                >
                  <span>See similar</span>
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </Button>
              )}
            </div>
          </Tabs>

          {/* SECOND FOLD (BELOW THE PREVIEW): 21st.dev Connected 4-Column Visual Component Cards Grid */}
          {similarComponents.length > 0 && (
            <section
              ref={similarSectionRef}
              aria-label="Similar components"
              className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 pt-6 pb-16 shrink-0"
            >
              <div className="rounded-none border border-border overflow-hidden bg-border shadow-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border">
                  {similarComponents.map((sim, idx) => {
                    const variants = variantsByTemplate?.[sim.id] || [];
                    const variantsCount = variants.length || 1;
                    const checkpointsCount = variants.reduce(
                      (acc, v) => acc + (v.checkpoints?.length || 0),
                      0
                    );
                    const isRecent = (recentComponentIds || []).includes(sim.id);

                    return (
                      <ComponentCard
                        key={sim.id}
                        component={sim}
                        variantsCount={variantsCount}
                        checkpointsCount={checkpointsCount}
                        isRecent={isRecent}
                        priority={idx < 4}
                        onPreview={handleSelectSimilarComponent}
                        onOpenStudio={handleOpenSimilarInStudio}
                      />
                    );
                  })}
                </div>
              </div>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
