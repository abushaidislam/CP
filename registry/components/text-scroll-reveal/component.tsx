"use client";

import React, { useId, useMemo, useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export type TextScrollTheme = "auto" | "light" | "dark";
export type TextScrollPreset =
  | "blur-reveal"
  | "fade-in"
  | "change-color"
  | "scale-reveal"
  | "random-stagger"
  | "random-scale"
  | "overscale"
  | "slide";

export interface TextScrollRevealProps
  extends React.HTMLAttributes<HTMLElement> {
  text?: string;
  label?: string;
  preset?: TextScrollPreset;
  accentColor?: string;
  dimOpacity?: number;
  theme?: TextScrollTheme;
  as?: "h1" | "h2" | "h3" | "p" | "div";
}

export const DEFAULT_SCROLL_TEXT =
  "Every effect comes fully pre-configured. Just drop it into your page, change the text, adjust a few settings if you want, and it's instantly ready to use, no setup or animation work required.";

export const TEXT_SCROLL_PRESETS: Array<{
  id: TextScrollPreset;
  label: string;
}> = [
  { id: "blur-reveal", label: "001 Blur Reveal" },
  { id: "fade-in", label: "002 Fade in" },
  { id: "change-color", label: "003 Change color" },
  { id: "scale-reveal", label: "004 Scale reveal" },
  { id: "random-stagger", label: "005 Random Stagger" },
  { id: "random-scale", label: "006 Random Scale" },
  { id: "overscale", label: "007 Overscale" },
  { id: "slide", label: "008 Slide" },
];

// Deterministic hash in [0, 1) so SSR and client never mismatch
function seededUnit(index: number, salt = 17): number {
  const x = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

interface WordTokenProps {
  word: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
  preset: TextScrollPreset;
  dimOpacity: number;
  accentColor: string;
  baseColor: string;
  mutedColor: string;
}

function WordToken({
  word,
  index,
  total,
  progress,
  preset,
  dimOpacity,
  accentColor,
  baseColor,
  mutedColor,
}: WordTokenProps) {
  const safeTotal = Math.max(1, total);

  const isRandomOrder =
    preset === "random-stagger" || preset === "random-scale";
  const orderPos = isRandomOrder
    ? seededUnit(index, 31) * 0.72
    : (index / safeTotal) * 0.78;

  const start = orderPos;
  const end = Math.min(1, start + Math.max(0.14, 1.8 / safeTotal));

  const initialScale =
    preset === "scale-reveal"
      ? 0.82
      : preset === "overscale"
        ? 1.5
        : preset === "random-scale"
          ? 0.45 + seededUnit(index, 53) * 0.85
          : 1;

  const initialY =
    preset === "slide" ? 36 : preset === "overscale" ? 6 : 0;

  const initialOpacity =
    preset === "change-color"
      ? 1
      : preset === "blur-reveal" ||
          preset === "random-stagger" ||
          preset === "random-scale" ||
          preset === "slide"
        ? 0
        : dimOpacity;

  const initialBlur =
    preset === "blur-reveal" || preset === "random-scale"
      ? "blur(10px)"
      : "blur(0px)";

  const opacity = useTransform(progress, [start, end], [initialOpacity, 1]);
  const scale = useTransform(progress, [start, end], [initialScale, 1]);
  const y = useTransform(progress, [start, end], [initialY, 0]);
  const filter = useTransform(
    progress,
    [start, end],
    [initialBlur, "blur(0px)"]
  );
  const color = useTransform(
    progress,
    [start, end],
    preset === "change-color"
      ? [mutedColor, accentColor]
      : [baseColor, baseColor]
  );

  return (
    <span
      className={cn(
        "mr-[0.26em] inline-block",
        preset === "slide" && "overflow-hidden align-bottom"
      )}
    >
      <motion.span
        style={{
          opacity,
          scale,
          y,
          filter,
          color: preset === "change-color" ? color : undefined,
        }}
        className="inline-block origin-center will-change-transform"
      >
        {word}
      </motion.span>
    </span>
  );
}

export const TextScrollReveal = React.forwardRef<
  HTMLElement,
  TextScrollRevealProps
>(
  (
    {
      text = DEFAULT_SCROLL_TEXT,
      label,
      preset = "blur-reveal",
      accentColor = "#E04A14",
      dimOpacity = 0.16,
      theme = "auto",
      as = "p",
      className,
      ...rest
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const labelId = useId();
    const prefersReducedMotion = Boolean(useReducedMotion());

    const safeDim = Math.max(0.05, Math.min(0.85, dimOpacity));

    const { scrollYProgress } = useScroll({
      target: containerRef,
      offset: ["start 0.82", "end 0.42"],
    });

    const smoothProgress = useSpring(scrollYProgress, {
      stiffness: 150,
      damping: 28,
      mass: 0.22,
    });

    const lines = useMemo(
      () => text.trim().split(/\s+/).filter(Boolean),
      [text]
    );

    const isDarkForced = theme === "dark";
    const isLightForced = theme === "light";

    const baseColor = isDarkForced ? "#F4F4F5" : "#111111";
    const mutedColor = isDarkForced ? "#52525B" : "#C4C4C4";

    const containerTheme = isDarkForced
      ? "text-zinc-100"
      : isLightForced
        ? "text-zinc-950"
        : "text-zinc-950 dark:text-zinc-100";

    const labelTheme = isDarkForced
      ? "text-zinc-400"
      : isLightForced
        ? "text-zinc-500"
        : "text-zinc-500 dark:text-zinc-400";

    const Tag = as;

    return (
      <section
        ref={(node) => {
          containerRef.current = node as HTMLDivElement | null;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLElement | null>).current = node;
          }
        }}
        aria-labelledby={label ? labelId : undefined}
        className={cn(
          "relative mx-auto flex w-full max-w-[820px] flex-col items-center px-6 py-20 text-center sm:py-28",
          containerTheme,
          className
        )}
        style={{
          fontFamily:
            '"Plus Jakarta Sans", "Inter", "Helvetica Neue", Arial, sans-serif',
        }}
        {...rest}
      >
        {label && (
          <span
            id={labelId}
            className={cn(
              "mb-4 text-[11px] font-medium tracking-[-0.01em]",
              labelTheme
            )}
          >
            {label}
          </span>
        )}

        <Tag
          aria-label={text}
          className="text-[clamp(1.5rem,3.3vw,2.65rem)] leading-[1.16] font-semibold tracking-[-0.03em]"
        >
          {prefersReducedMotion
            ? text
            : lines.map((word, idx) => (
                <WordToken
                  key={`${idx}-${word}`}
                  word={word}
                  index={idx}
                  total={lines.length}
                  progress={smoothProgress}
                  preset={preset}
                  dimOpacity={safeDim}
                  accentColor={accentColor}
                  baseColor={baseColor}
                  mutedColor={mutedColor}
                />
              ))}
        </Tag>
      </section>
    );
  }
);

TextScrollReveal.displayName = "TextScrollReveal";

export { TextScrollReveal as component, TextScrollReveal as Component };
export default TextScrollReveal;