"use client";

import React, { useState } from "react";
import {
  ParsedDemoControls,
  DemoControlDefinition,
  DemoControlValue,
  MAX_COLOR_ARRAY_ITEMS,
  MAX_DEMO_CONTROLS,
} from "@/lib/sandbox/demo-controls";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  SlidersHorizontal,
  RotateCcw,
  Copy,
  Check,
  X,
  Plus,
  Trash2,
  ChevronDown,
  Wand2,
  FileCheck2,
  AlertTriangle,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NumericRangeOverride {
  min: number;
  max: number;
  step: number;
}

export interface DemoControlsPanelProps {
  parsed: ParsedDemoControls;
  values: Record<string, DemoControlValue>;
  modifiedKeys: string[];
  onChangeValue: (key: string, value: DemoControlValue) => void;
  onResetKey: (key: string) => void;
  onResetAll: () => void;
  onCopyBakedCode: () => void;
  onApplyToEditor?: () => void;
  onScaffoldControls?: () => void;
  onClose?: () => void;
  readOnly?: boolean;
  className?: string;
}

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
  const decimals = step && !Number.isInteger(step)
    ? Math.min(4, (String(step).split(".")[1] || "").length)
    : 2;
  return Number(val.toFixed(decimals)).toString();
}

export function DemoControlsPanel({
  parsed,
  values,
  modifiedKeys,
  onChangeValue,
  onResetKey,
  onResetAll,
  onCopyBakedCode,
  onApplyToEditor,
  onScaffoldControls,
  onClose,
  readOnly = false,
  className,
}: DemoControlsPanelProps) {
  const [copiedBaked, setCopiedBaked] = useState(false);
  const [appliedToEditor, setAppliedToEditor] = useState(false);
  const [tuningKey, setTuningKey] = useState<string | null>(null);
  const [rangeOverrides, setRangeOverrides] = useState<
    Record<string, NumericRangeOverride>
  >({});

  const modifiedSet = new Set(modifiedKeys);
  const hasModifications = modifiedKeys.length > 0;

  const handleCopyClick = () => {
    onCopyBakedCode();
    setCopiedBaked(true);
    setTimeout(() => setCopiedBaked(false), 2000);
  };

  const handleApplyClick = () => {
    if (!onApplyToEditor) return;
    onApplyToEditor();
    setAppliedToEditor(true);
    setTimeout(() => setAppliedToEditor(false), 2000);
  };

  const getRangeForControl = (ctrl: DemoControlDefinition): NumericRangeOverride => {
    const custom = rangeOverrides[ctrl.key];
    if (custom) return custom;
    return {
      min: ctrl.min ?? 0,
      max: ctrl.max ?? 100,
      step: ctrl.step ?? 1,
    };
  };

  const updateRangeOverride = (
    ctrl: DemoControlDefinition,
    patch: Partial<NumericRangeOverride>
  ) => {
    const current = getRangeForControl(ctrl);
    const next: NumericRangeOverride = {
      min: patch.min !== undefined && Number.isFinite(patch.min) ? patch.min : current.min,
      max: patch.max !== undefined && Number.isFinite(patch.max) ? patch.max : current.max,
      step:
        patch.step !== undefined && Number.isFinite(patch.step) && patch.step > 0
          ? patch.step
          : current.step,
    };
    setRangeOverrides((prev) => ({ ...prev, [ctrl.key]: next }));
  };

  return (
    <aside
      aria-label="21st.dev Native Component Controls"
      className={cn(
        "flex h-full w-72 sm:w-80 shrink-0 flex-col border-l border-border bg-card text-card-foreground font-sans select-none overflow-hidden",
        className
      )}
    >
      {/* Header Strip */}
      <div className="studio-toolbar-surface flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
        <div className="flex items-center gap-2 min-w-0">
          <SlidersHorizontal className="size-3.5 text-muted-foreground shrink-0" />
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-semibold tracking-tight text-foreground truncate">
              Controls
            </span>
            {parsed.status === "active" && (
              <span className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
                · {parsed.controls.length}/{MAX_DEMO_CONTROLS}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {hasModifications && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onResetAll}
                  aria-label="Reset all controls to defaults"
                  className="size-7 rounded-none text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-sans text-xs">
                Reset all ({modifiedKeys.length} modified)
              </TooltipContent>
            </Tooltip>
          )}
          {onClose && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onClose}
                  aria-label="Close controls panel"
                  className="size-7 rounded-none text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-sans text-xs">
                Close controls
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {parsed.status === "active" ? (
          <div className="divide-y divide-border/70">
            {parsed.controls.map((ctrl) => {
              const currentValue =
                ctrl.key in values ? values[ctrl.key] : ctrl.defaultValue;
              const isModified = modifiedSet.has(ctrl.key);
              const isTuning = tuningKey === ctrl.key;

              return (
                <div
                  key={ctrl.key}
                  className={cn(
                    "px-3 py-3 transition-colors",
                    isModified && "bg-muted/25"
                  )}
                >
                  {/* Control Label Header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-medium text-foreground truncate">
                          {ctrl.label}
                        </span>
                        {isModified && (
                          <span className="text-[10px] font-sans text-primary shrink-0">
                            · Edited
                          </span>
                        )}
                      </div>
                      <span className="block font-mono text-[10px] text-muted-foreground truncate">
                        {ctrl.key}
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      {ctrl.type === "number" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={isTuning ? "secondary" : "ghost"}
                              size="icon-sm"
                              onClick={() =>
                                setTuningKey(isTuning ? null : ctrl.key)
                              }
                              aria-label={`Configure min, max, step for ${ctrl.label}`}
                              className="size-6 rounded-none text-muted-foreground hover:text-foreground"
                            >
                              <Settings2 className="size-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="font-sans text-xs">
                            Tune slider min / max / step
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {isModified && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => onResetKey(ctrl.key)}
                              aria-label={`Reset ${ctrl.label}`}
                              className="size-6 rounded-none text-muted-foreground hover:text-foreground"
                            >
                              <RotateCcw className="size-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="font-sans text-xs">
                            Reset to default
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  {/* BOOLEAN -> Switch */}
                  {ctrl.type === "boolean" && (
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {Boolean(currentValue) ? "true" : "false"}
                      </span>
                      <Switch
                        checked={Boolean(currentValue)}
                        onCheckedChange={(checked) =>
                          onChangeValue(ctrl.key, checked)
                        }
                        aria-label={ctrl.label}
                      />
                    </div>
                  )}

                  {/* NUMBER -> Slider + Tabular Numeric Input + Optional Range Tuner */}
                  {ctrl.type === "number" && (() => {
                    const numVal =
                      typeof currentValue === "number"
                        ? currentValue
                        : Number(ctrl.defaultValue) || 0;
                    const range = getRangeForControl(ctrl);
                    const sliderMin = Math.min(range.min, numVal);
                    const sliderMax = Math.max(range.max, numVal);

                    return (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2.5">
                          <Slider
                            value={[numVal]}
                            min={sliderMin}
                            max={sliderMax}
                            step={range.step}
                            onValueChange={([next]) => {
                              if (typeof next === "number" && Number.isFinite(next)) {
                                onChangeValue(ctrl.key, next);
                              }
                            }}
                            aria-label={ctrl.label}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={formatNumberDisplay(numVal, range.step)}
                            step={range.step}
                            onChange={(e) => {
                              const parsedNum = Number(e.target.value);
                              if (Number.isFinite(parsedNum)) {
                                onChangeValue(ctrl.key, parsedNum);
                              }
                            }}
                            aria-label={`${ctrl.label} numeric value`}
                            className="h-7 w-20 px-2 text-right font-mono text-[11px] tabular-nums rounded-none"
                          />
                        </div>

                        {isTuning && (
                          <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-border/60">
                            <div className="space-y-1">
                              <span className="block text-[10px] text-muted-foreground">
                                Min
                              </span>
                              <Input
                                type="number"
                                value={range.min}
                                onChange={(e) =>
                                  updateRangeOverride(ctrl, {
                                    min: Number(e.target.value),
                                  })
                                }
                                className="h-6 px-1.5 font-mono text-[10px] tabular-nums rounded-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="block text-[10px] text-muted-foreground">
                                Max
                              </span>
                              <Input
                                type="number"
                                value={range.max}
                                onChange={(e) =>
                                  updateRangeOverride(ctrl, {
                                    max: Number(e.target.value),
                                  })
                                }
                                className="h-6 px-1.5 font-mono text-[10px] tabular-nums rounded-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="block text-[10px] text-muted-foreground">
                                Step
                              </span>
                              <Input
                                type="number"
                                value={range.step}
                                min={0.001}
                                step="any"
                                onChange={(e) =>
                                  updateRangeOverride(ctrl, {
                                    step: Number(e.target.value),
                                  })
                                }
                                className="h-6 px-1.5 font-mono text-[10px] tabular-nums rounded-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* COLOR -> Swatch Picker + CSS Color Input */}
                  {ctrl.type === "color" && (() => {
                    const colorStr =
                      typeof currentValue === "string"
                        ? currentValue
                        : String(ctrl.defaultValue || "#6366f1");
                    return (
                      <div className="flex items-center gap-2">
                        <label
                          className="relative flex size-7 shrink-0 cursor-pointer items-center justify-center border border-border overflow-hidden"
                          style={{ backgroundColor: colorStr }}
                          title={`Pick color for ${ctrl.label}`}
                        >
                          <input
                            type="color"
                            value={normalizeHexForColorInput(colorStr)}
                            onChange={(e) =>
                              onChangeValue(ctrl.key, e.target.value)
                            }
                            aria-label={`${ctrl.label} color picker`}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                        </label>
                        <Input
                          type="text"
                          value={colorStr}
                          onChange={(e) =>
                            onChangeValue(ctrl.key, e.target.value)
                          }
                          aria-label={`${ctrl.label} color value`}
                          className="h-7 flex-1 px-2 font-mono text-[11px] rounded-none"
                        />
                      </div>
                    );
                  })()}

                  {/* COLOR ARRAY -> Editable Color Palette (up to 12 swatches) */}
                  {ctrl.type === "color-array" && (() => {
                    const palette = Array.isArray(currentValue)
                      ? currentValue
                      : Array.isArray(ctrl.defaultValue)
                      ? ctrl.defaultValue
                      : [];
                    return (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {palette.map((swatch, idx) => (
                            <div
                              key={`${ctrl.key}-${idx}`}
                              className="group relative flex items-center border border-border bg-background"
                            >
                              <label
                                className="relative block size-6 cursor-pointer"
                                style={{ backgroundColor: swatch }}
                                title={`${swatch} — click to change`}
                              >
                                <input
                                  type="color"
                                  value={normalizeHexForColorInput(swatch)}
                                  onChange={(e) => {
                                    const next = [...palette];
                                    next[idx] = e.target.value;
                                    onChangeValue(ctrl.key, next);
                                  }}
                                  aria-label={`${ctrl.label} swatch ${idx + 1}`}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                              </label>
                              <span className="px-1.5 font-mono text-[10px] text-muted-foreground">
                                {swatch}
                              </span>
                              {palette.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => {
                                    const next = palette.filter((_, i) => i !== idx);
                                    onChangeValue(ctrl.key, next);
                                  }}
                                  aria-label={`Remove color ${idx + 1}`}
                                  className="size-6 rounded-none text-muted-foreground hover:text-destructive"
                                >
                                  <X className="size-2.5" />
                                </Button>
                              )}
                            </div>
                          ))}

                          {palette.length < MAX_COLOR_ARRAY_ITEMS && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                onChangeValue(ctrl.key, [...palette, "#38bdf8"])
                              }
                              className="h-6 px-2 gap-1 rounded-none text-[11px] font-sans"
                            >
                              <Plus className="size-3" />
                              <span>Add</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* SELECT -> Segmented Buttons (<= 4) or DropdownMenu (> 4) */}
                  {ctrl.type === "select" && ctrl.options && (() => {
                    const selected =
                      typeof currentValue === "string"
                        ? currentValue
                        : String(ctrl.defaultValue || ctrl.options[0] || "");

                    if (ctrl.options.length <= 4) {
                      return (
                        <div className="flex flex-wrap gap-1">
                          {ctrl.options.map((opt) => {
                            const active = selected === opt;
                            return (
                              <Button
                                key={opt}
                                variant={active ? "default" : "outline"}
                                size="sm"
                                onClick={() => onChangeValue(ctrl.key, opt)}
                                className="h-7 flex-1 min-w-[60px] px-2 rounded-none text-[11px] font-sans whitespace-nowrap"
                              >
                                {opt}
                              </Button>
                            );
                          })}
                        </div>
                      );
                    }

                    return (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-full justify-between px-2.5 rounded-none text-xs font-sans font-normal"
                          >
                            <span className="truncate">{selected}</span>
                            <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          className="w-56 rounded-none font-sans"
                        >
                          {ctrl.options.map((opt) => (
                            <DropdownMenuItem
                              key={opt}
                              onClick={() => onChangeValue(ctrl.key, opt)}
                              className="flex items-center justify-between rounded-none text-xs cursor-pointer"
                            >
                              <span>{opt}</span>
                              {selected === opt && (
                                <Check className="size-3.5 text-primary" />
                              )}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  })()}

                  {/* STRING -> Single-Line Text Input */}
                  {ctrl.type === "string" && (
                    <Input
                      type="text"
                      value={
                        typeof currentValue === "string"
                          ? currentValue
                          : String(ctrl.defaultValue ?? "")
                      }
                      onChange={(e) => onChangeValue(ctrl.key, e.target.value)}
                      aria-label={ctrl.label}
                      className="h-7 px-2 text-xs rounded-none font-sans"
                    />
                  )}

                  {/* TEXTAREA -> Long String Input */}
                  {ctrl.type === "textarea" && (
                    <Textarea
                      value={
                        typeof currentValue === "string"
                          ? currentValue
                          : String(ctrl.defaultValue ?? "")
                      }
                      onChange={(e) => onChangeValue(ctrl.key, e.target.value)}
                      aria-label={ctrl.label}
                      rows={3}
                      className="min-h-[64px] px-2 py-1.5 text-xs rounded-none font-sans resize-y"
                    />
                  )}

                  {/* STRING ARRAY -> Editable Items List */}
                  {ctrl.type === "string-array" && (() => {
                    const list = Array.isArray(currentValue)
                      ? currentValue
                      : Array.isArray(ctrl.defaultValue)
                      ? ctrl.defaultValue
                      : [];
                    return (
                      <div className="space-y-1.5">
                        {list.map((item, idx) => (
                          <div
                            key={`${ctrl.key}-item-${idx}`}
                            className="flex items-center gap-1"
                          >
                            <Input
                              type="text"
                              value={item}
                              onChange={(e) => {
                                const next = [...list];
                                next[idx] = e.target.value;
                                onChangeValue(ctrl.key, next);
                              }}
                              aria-label={`${ctrl.label} item ${idx + 1}`}
                              className="h-7 flex-1 px-2 text-xs rounded-none font-sans"
                            />
                            {list.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => {
                                  const next = list.filter((_, i) => i !== idx);
                                  onChangeValue(ctrl.key, next);
                                }}
                                aria-label={`Remove item ${idx + 1}`}
                                className="size-7 shrink-0 rounded-none text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="size-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                        {list.length < 10 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              onChangeValue(ctrl.key, [...list, "New Item"])
                            }
                            className="h-6 w-full gap-1 rounded-none text-[11px] font-sans"
                          >
                            <Plus className="size-3" />
                            <span>Add Item</span>
                          </Button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })}

            {/* Diagnostics for skipped exotic keys or 24-control cap */}
            {(parsed.skippedKeys.length > 0 || parsed.truncatedCount > 0) && (
              <div className="px-3 py-2.5 bg-muted/20 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <AlertTriangle className="size-3 text-amber-500 shrink-0" />
                  <span>21st.dev Contract Notes</span>
                </div>
                {parsed.truncatedCount > 0 && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {parsed.truncatedCount} extra key
                    {parsed.truncatedCount > 1 ? "s" : ""} omitted (21st.dev supports up to{" "}
                    {MAX_DEMO_CONTROLS} controls per demo).
                  </p>
                )}
                {parsed.skippedKeys.slice(0, 4).map((item, i) => (
                  <p
                    key={`${item.key}-${i}`}
                    className="text-[11px] text-muted-foreground leading-snug"
                  >
                    <span className="font-mono text-[10px] text-foreground">
                      {item.key}
                    </span>
                    : {item.reason}
                  </p>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Empty / Missing-Props Contract State with 1-Click Scaffolder */
          <div className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Badge variant="eyebrow" className="rounded-none">
                21ST.DEV SETTINGS CONTRACT
              </Badge>
              <h3 className="text-xs font-semibold text-foreground">
                {parsed.status === "missing-props"
                  ? "Default export must accept props"
                  : "No native demo controls detected"}
              </h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {parsed.status === "missing-props"
                  ? "Found a module-level settings object, but your default export in default.tsx does not accept props. Merge incoming props over settings to activate live controls on 21st.dev."
                  : "On 21st.dev, declare a module-level const settings object in default.tsx and merge props in your default export to unlock live sliders, toggles, selects, and color pickers."}
              </p>
            </div>

            <pre className="p-2.5 border border-border bg-muted/30 font-mono text-[10px] leading-relaxed text-foreground/90 overflow-x-auto">
{`const settings = {
  speed: 0.4,
  glow: true,
  accent: "#7c3aed",
}

export default function Demo(
  props: Partial<typeof settings>
) {
  const s = { ...settings, ...props }
  return <Component {...s} />
}`}
            </pre>

            {!readOnly && onScaffoldControls && (
              <Button
                variant="default"
                size="sm"
                onClick={onScaffoldControls}
                className="w-full h-8 gap-1.5 rounded-none text-xs font-sans"
              >
                <Wand2 className="size-3.5" />
                <span>
                  {parsed.status === "missing-props"
                    ? "Fix Demo Props Signature"
                    : "Scaffold 21st.dev Controls"}
                </span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Footer: 21st.dev Native Baked Code Copy & Save-to-Editor Actions */}
      {parsed.status === "active" && (
        <div className="shrink-0 border-t border-border bg-muted/20 p-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
            <span>21st.dev Native Sync</span>
            <span className="font-mono text-[10px] tabular-nums">
              {hasModifications ? `${modifiedKeys.length} tuned` : "defaults"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyClick}
              className="flex-1 h-7 gap-1.5 rounded-none text-[11px] font-sans"
            >
              {copiedBaked ? (
                <Check className="size-3 text-emerald-500" />
              ) : (
                <Copy className="size-3" />
              )}
              <span className="truncate">
                {copiedBaked ? "Copied Baked" : "Copy Baked Code"}
              </span>
            </Button>

            {!readOnly && onApplyToEditor && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={hasModifications ? "default" : "secondary"}
                    size="sm"
                    disabled={!hasModifications}
                    onClick={handleApplyClick}
                    className="h-7 px-2.5 gap-1.5 rounded-none text-[11px] font-sans shrink-0"
                  >
                    {appliedToEditor ? (
                      <Check className="size-3" />
                    ) : (
                      <FileCheck2 className="size-3" />
                    )}
                    <span>{appliedToEditor ? "Applied" : "Apply"}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="font-sans text-xs">
                  Bake tuned control values directly into default.tsx
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
