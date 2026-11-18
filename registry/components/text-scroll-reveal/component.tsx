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

export type TextScrollRevealTheme = "auto" | "light" | "dark";
export type TextRevealMode = "line" | "word" | "character";
export type TextRevealEffect = "mask" | "blur" | "fade-up" | "scale";
export type TextRevealTrigger = "scroll" | "in-view";
export type TextRevealTag = "h1" | "h2" | "h3" | "p" | "div";

export interface TextScrollRevealProps
  extends React.HTMLAttributes<HTMLElement> {
  text?: string;
  as?: TextRevealTag;
  mode?: TextRevealMode;
  effect?: TextRevealEffect;
  trigger?: TextRevealTrigger;
  once?: boolean;
  dimOpacity?: number;
  duration?: number;
  stagger?: number;
  theme?: TextScrollRevealTheme;
}

const DEFAULT_TEXT = `Design is not just what it looks like and feels like.
Design is how it works—shaped by intention, rhythm, and every quiet detail in between.
When typography moves with purpose, every word earns the reader's attention.`;

const EDITORIAL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface ScrubTokenProps {
  token: string;
  progress: MotionValue<number>;
  range: [number, number];
  effect: TextRevealEffect;
  dimOpacity: number;
  isLine?: boolean;
}

function ScrubToken({
  token,
  progress,
  range,
  effect,
  dimOpacity,
  isLine = false,
}: ScrubTokenProps) {
  const opacity = useTransform(progress, range, [dimOpacity, 1]);
  const y = useTransform(
    progress,
    range,
    effect === "mask" || effect === "fade-up" ? [18, 0] : [0, 0]
  );
  const scale = useTransform(
    progress,
    range,
    effect === "scale" ? [0.92, 1] : [1, 1]
  );
  const filter = useTransform(
    progress,
    range,
    effect === "blur" ? ["blur(8px)", "blur(0px)"] : ["blur(0px)", "blur(0px)"]
  );

  return (
    <span
      className={cn(
        "relative inline-block",
        effect === "mask" && "overflow-hidden align-bottom",
        isLine ? "block" : "mr-[0.26em]"
      )}
    >
      <motion.span
        style={{ opacity, y, scale, filter }}
        className="inline-block will-change-transform"
      >
        {token}
      </motion.span>
    </span>
  );
}

interface ScrubWordWithCharsProps {
  word: string;
  progress: MotionValue<number>;
  startIdx: number;
  totalChars: number;
  effect: TextRevealEffect;
  dimOpacity: number;
}

function ScrubWordWithChars({
  word,
  progress,
  startIdx,
  totalChars,
  effect,
  dimOpacity,
}: ScrubWordWithCharsProps) {
  const chars = Array.from(word);
  return (
    <span className="mr-[0.26em] inline-block whitespace-nowrap">
      {chars.map((char, idx) => {
        const globalIdx = startIdx + idx;
        const start = globalIdx / Math.max(1, totalChars);
        const end = Math.min(1, start + 1.4 / Math.max(1, totalChars));
        return (
          <ScrubChar
            key={`${globalIdx}-${char}`}
            char={char}
            progress={progress}
            range={[start, end]}
            effect={effect}
            dimOpacity={dimOpacity}
          />
        );
      })}
    </span>
  );
}

interface ScrubCharProps {
  char: string;
  progress: MotionValue<number>;
  range: [number, number];
  effect: TextRevealEffect;
  dimOpacity: number;
}

function ScrubChar({
  char,
  progress,
  range,
  effect,
  dimOpacity,
}: ScrubCharProps) {
  const opacity = useTransform(progress, range, [dimOpacity, 1]);
  const y = useTransform(
    progress,
    range,
    effect === "mask" || effect === "fade-up" ? [14, 0] : [0, 0]
  );
  const scale = useTransform(
    progress,
    range,
    effect === "scale" ? [0.88, 1] : [1, 1]
  );
  const filter = useTransform(
    progress,
    range,
    effect === "blur" ? ["blur(6px)", "blur(0px)"] : ["blur(0px)", "blur(0px)"]
  );

  return (
    <span
      className={cn(
        "inline-block",
        effect === "mask" && "overflow-hidden align-bottom"
      )}
    >
      <motion.span
        style={{ opacity, y, scale, filter }}
        className="inline-block will-change-transform"
      >
        {char}
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
      text = DEFAULT_TEXT,
      as = "p",
      mode = "word",
      effect = "mask",
      trigger = "scroll",
      once = false,
      dimOpacity = 0.15,
      duration = 0.65,
      stagger = 0.04,
      theme = "auto",
      className,
      ...rest
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const labelId = useId();
    const prefersReducedMotion = Boolean(useReducedMotion());

    const safeDim = Math.max(0, Math.min(0.95, dimOpacity));
    const safeDuration = Math.max(0.15, Math.min(2, duration));
    const safeStagger = Math.max(0.01, Math.min(0.25, stagger));

    const { scrollYProgress } = useScroll({
      target: containerRef,
      offset: ["start 0.85", "end 0.35"],
    });

    const smoothProgress = useSpring(scrollYProgress, {
      stiffness: 160,
      damping: 30,
      mass: 0.25,
    });

    const lines = useMemo(
      () =>
        text
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
      [text]
    );

    const parsedStats = useMemo(() => {
      let wordCount = 0;
      let charCount = 0;
      const lineData = lines.map((line) => {
        const words = line.split(/\s+/).filter(Boolean);
        const wordStart = wordCount;
        const wordEntries = words.map((w) => {
          const charStart = charCount;
          const len = Array.from(w).length;
          charCount += len;
          return { word: w, charStart };
        });
        wordCount += words.length;
        return { line, wordStart, wordEntries };
      });
      return { lineData, totalWords: wordCount, totalChars: charCount };
    }, [lines]);

    const isDarkForced = theme === "dark";
    const isLightForced = theme === "light";

    const themeClasses = isDarkForced
      ? "text-zinc-50"
      : isLightForced
        ? "text-zinc-950"
        : "text-zinc-950 dark:text-zinc-50";

    const Tag = as;

    const getInViewInitial = () => {
      switch (effect) {
        case "mask":
          return { opacity: 0, y: "100%" };
        case "blur":
          return { opacity: 0, filter: "blur(8px)", y: 8 };
        case "scale":
          return { opacity: 0, scale: 0.9 };
        case "fade-up":
        default:
          return { opacity: 0, y: 18 };
      }
    };

    const getInViewTarget = () => ({
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
    });

    return (
      <div
        ref={(node) => {
          containerRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLElement | null>).current = node;
          }
        }}
        className={cn("relative w-full", themeClasses, className)}
        style={{
          fontFamily:
            '"Plus Jakarta Sans", "Inter", "Helvetica Neue", Arial, sans-serif',
        }}
        {...rest}
      >
        <Tag
          id={labelId}
          aria-label={text.replace(/\n/g, " ")}
          className="text-[clamp(1.75rem,4.2vw,3.5rem)] leading-[1.16] font-medium tracking-[-0.03em]"
        >
          {prefersReducedMotion ? (
            lines.map((line, idx) => (
              <span key={idx} className="block">
                {line}
              </span>
            ))
          ) : trigger === "scroll" ? (
            <>
              {mode === "line" &&
                parsedStats.lineData.map((item, idx) => {
                  const total = Math.max(1, parsedStats.lineData.length);
                  const start = idx / total;
                  const end = Math.min(1, start + 1 / total);
                  return (
                    <ScrubToken
                      key={idx}
                      token={item.line}
                      progress={smoothProgress}
                      range={[start, end]}
                      effect={effect}
                      dimOpacity={safeDim}
                      isLine
                    />
                  );
                })}

              {mode === "word" &&
                parsedStats.lineData.map((item, lineIdx) => (
                  <span key={lineIdx} className="block">
                    {item.wordEntries.map((entry, wordIdx) => {
                      const globalIdx = item.wordStart + wordIdx;
                      const total = Math.max(1, parsedStats.totalWords);
                      const start = globalIdx / total;
                      const end = Math.min(1, start + 1.25 / total);
                      return (
                        <ScrubToken
                          key={`${lineIdx}-${wordIdx}`}
                          token={entry.word}
                          progress={smoothProgress}
                          range={[start, end]}
                          effect={effect}
                          dimOpacity={safeDim}
                        />
                      );
                    })}
                  </span>
                ))}

              {mode === "character" &&
                parsedStats.lineData.map((item, lineIdx) => (
                  <span key={lineIdx} className="block">
                    {item.wordEntries.map((entry, wordIdx) => (
                      <ScrubWordWithChars
                        key={`${lineIdx}-${wordIdx}`}
                        word={entry.word}
                        progress={smoothProgress}
                        startIdx={entry.charStart}
                        totalChars={parsedStats.totalChars}
                        effect={effect}
                        dimOpacity={safeDim}
                      />
                    ))}
                  </span>
                ))}
            </>
          ) : (
            <>
              {mode === "line" &&
                parsedStats.lineData.map((item, idx) => (
                  <span
                    key={idx}
                    className={cn(
                      "block",
                      effect === "mask" && "overflow-hidden"
                    )}
                  >
                    <motion.span
                      className="inline-block"
                      initial={getInViewInitial()}
                      whileInView={getInViewTarget()}
                      viewport={{ once, amount: 0.2 }}
                      transition={{
                        duration: safeDuration,
                        delay: idx * safeStagger * 2.5,
                        ease: EDITORIAL_EASE,
                      }}
                    >
                      {item.line}
                    </motion.span>
                  </span>
                ))}

              {mode === "word" &&
                parsedStats.lineData.map((item, lineIdx) => (
                  <span key={lineIdx} className="block">
                    {item.wordEntries.map((entry, wordIdx) => {
                      const globalIdx = item.wordStart + wordIdx;
                      return (
                        <span
                          key={`${lineIdx}-${wordIdx}`}
                          className={cn(
                            "mr-[0.26em] inline-block",
                            effect === "mask" && "overflow-hidden align-bottom"
                          )}
                        >
                          <motion.span
                            className="inline-block"
                            initial={getInViewInitial()}
                            whileInView={getInViewTarget()}
                            viewport={{ once, amount: 0.2 }}
                            transition={{
                              duration: safeDuration,
                              delay: globalIdx * safeStagger,
                              ease: EDITORIAL_EASE,
                            }}
                          >
                            {entry.word}
                          </motion.span>
                        </span>
                      );
                    })}
                  </span>
                ))}

              {mode === "character" &&
                parsedStats.lineData.map((item, lineIdx) => (
                  <span key={lineIdx} className="block">
                    {item.wordEntries.map((entry, wordIdx) => (
                      <span
                        key={`${lineIdx}-${wordIdx}`}
                        className="mr-[0.26em] inline-block whitespace-nowrap"
                      >
                        {Array.from(entry.word).map((char, charIdx) => {
                          const globalChar = entry.charStart + charIdx;
                          return (
                            <span
                              key={`${globalChar}-${char}`}
                              className={cn(
                                "inline-block",
                                effect === "mask" &&
                                  "overflow-hidden align-bottom"
                              )}
                            >
                              <motion.span
                                className="inline-block"
                                initial={getInViewInitial()}
                                whileInView={getInViewTarget()}
                                viewport={{ once, amount: 0.2 }}
                                transition={{
                                  duration: safeDuration,
                                  delay: globalChar * (safeStagger * 0.45),
                                  ease: EDITORIAL_EASE,
                                }}
                              >
                                {char}
                              </motion.span>
                            </span>
                          );
                        })}
                      </span>
                    ))}
                  </span>
                ))}
            </>
          )}
        </Tag>
      </div>
    );
  }
);

TextScrollReveal.displayName = "TextScrollReveal";

export { TextScrollReveal as component, TextScrollReveal as Component };
export default TextScrollReveal;