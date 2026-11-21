"use client";

import React, { useEffect, useState } from "react";
import { DEFAULT_SPLIT_ACCORDION_ITEMS, SplitAccordion, type SplitAccordionTheme } from "@/components/ui/component";

const settings = { defaultOpenIndex: 1, splitGap: 12, allowMultiple: false, collapsible: true, duration: 0.36, theme: "auto" };
const VALID_THEMES: SplitAccordionTheme[] = ["auto", "light", "dark"];

export default function SplitAccordionDemo(props: Partial<typeof settings>) {
  const config = { ...settings, ...props };
  const maxIndex = DEFAULT_SPLIT_ACCORDION_ITEMS.length - 1;
  const safeDefaultIndex = typeof config.defaultOpenIndex === "number" && Number.isFinite(config.defaultOpenIndex) ? Math.max(-1, Math.min(maxIndex, Math.round(config.defaultOpenIndex))) : 1;
  const safeSplitGap = typeof config.splitGap === "number" && Number.isFinite(config.splitGap) ? Math.max(4, Math.min(32, config.splitGap)) : 12;
  const safeDuration = typeof config.duration === "number" && Number.isFinite(config.duration) ? Math.max(0.1, Math.min(1.0, config.duration)) : 0.36;
  const safeAllowMultiple = Boolean(config.allowMultiple);
  const safeCollapsible = Boolean(config.collapsible);
  const safeTheme: SplitAccordionTheme = VALID_THEMES.includes(config.theme as SplitAccordionTheme) ? (config.theme as SplitAccordionTheme) : "auto";
  const [openIndices, setOpenIndices] = useState<number[]>(() => (safeDefaultIndex >= 0 ? [safeDefaultIndex] : []));
  useEffect(() => { setOpenIndices(safeDefaultIndex >= 0 ? [safeDefaultIndex] : []); }, [safeDefaultIndex, safeAllowMultiple]);
  return (
    <div className="flex min-h-[440px] w-full items-center justify-center p-6 sm:p-8">
      <SplitAccordion openIndices={openIndices} onOpenChange={setOpenIndices} allowMultiple={safeAllowMultiple} collapsible={safeCollapsible} splitGap={safeSplitGap} duration={safeDuration} theme={safeTheme} />
    </div>
  );
}

export { SplitAccordionDemo as Demo, SplitAccordionDemo as demo };