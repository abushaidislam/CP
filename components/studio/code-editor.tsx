"use client";

import React, { useEffect, useState, useMemo } from "react";
import CodeMirror, { Prec } from "@uiw/react-codemirror";
import { EditorView, keymap } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { javascript } from "@codemirror/lang-javascript";
import { css } from "@codemirror/lang-css";
import { StudioFileName } from "@/lib/store/studio-store";

export interface CodeEditorProps {
  filename: StudioFileName;
  value: string;
  onChange: (value: string) => void;
  onFormat?: () => void;
}

// Base layout & font styling for CodeMirror
const baseEditorTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "13px",
    fontFamily:
      "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily: "inherit",
    lineHeight: "22px",
    WebkitOverflowScrolling: "touch",
    overscrollBehavior: "contain",
  },
  ".cm-content": {
    padding: "12px 0",
    caretColor: "#0070f3",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
  },
  ".cm-line": {
    padding: "0 10px",
  },
  ".cm-cursor": {
    borderLeftColor: "#0070f3",
    borderLeftWidth: "2px",
  },
  ".cm-gutters": {
    borderRight: "none",
    userSelect: "none",
  },
  ".cm-gutterElement": {
    padding: "0 8px 0 10px",
  },
  ".cm-activeLine": {
    backgroundColor: "transparent",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
    backgroundColor: "var(--cm-selection) !important",
  },
});

// Vercel Light Theme
const vercelLightTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "#ffffff",
      color: "#171717",
      "--cm-selection": "#d3e5ff",
    },
    ".cm-gutters": {
      backgroundColor: "#ffffff",
      color: "#a1a1a1",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "#fafafa",
      color: "#171717",
    },
    ".cm-activeLine": {
      backgroundColor: "#fafafa",
    },
    ".cm-selectionMatch": {
      backgroundColor: "rgba(0, 112, 243, 0.15)",
    },
  },
  { dark: false }
);

const vercelLightHighlight = HighlightStyle.define([
  { tag: t.comment, color: "#8f8f8f", fontStyle: "italic" },
  { tag: [t.keyword, t.operatorKeyword, t.modifier], color: "#0070f3", fontWeight: "600" },
  { tag: [t.string, t.special(t.string)], color: "#7928ca" },
  { tag: [t.number, t.bool, t.null], color: "#f5a623" },
  { tag: [t.typeName, t.className, t.standard(t.typeName)], color: "#0070f3" },
  { tag: [t.variableName, t.propertyName], color: "#171717" },
  { tag: [t.tagName, t.standard(t.tagName)], color: "#eb367f", fontWeight: "500" },
  { tag: t.attributeName, color: "#7928ca" },
  { tag: t.attributeValue, color: "#0761d1" },
  { tag: [t.punctuation, t.separator, t.bracket], color: "#8f8f8f" },
  { tag: t.function(t.variableName), color: "#0070f3" },
]);

// Vercel Dark Theme
const vercelDarkTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "#0a0a0a",
      color: "#ededed",
      "--cm-selection": "#27272a",
    },
    ".cm-gutters": {
      backgroundColor: "#0a0a0a",
      color: "#52525b",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "#141414",
      color: "#ededed",
    },
    ".cm-activeLine": {
      backgroundColor: "#141414",
    },
    ".cm-selectionMatch": {
      backgroundColor: "rgba(0, 223, 216, 0.2)",
    },
  },
  { dark: true }
);

const vercelDarkHighlight = HighlightStyle.define([
  { tag: t.comment, color: "#707070", fontStyle: "italic" },
  { tag: [t.keyword, t.operatorKeyword, t.modifier], color: "#ff0080", fontWeight: "600" },
  { tag: [t.string, t.special(t.string)], color: "#50e3c2" },
  { tag: [t.number, t.bool, t.null], color: "#f9cb28" },
  { tag: [t.typeName, t.className, t.standard(t.typeName)], color: "#00dfd8" },
  { tag: [t.variableName, t.propertyName], color: "#ededed" },
  { tag: [t.tagName, t.standard(t.tagName)], color: "#7928ca", fontWeight: "500" },
  { tag: t.attributeName, color: "#eb367f" },
  { tag: t.attributeValue, color: "#aaffec" },
  { tag: [t.punctuation, t.separator, t.bracket], color: "#a1a1a1" },
  { tag: t.function(t.variableName), color: "#00dfd8" },
]);

export function CodeEditor({ filename, value, onChange, onFormat }: CodeEditorProps) {
  const [isDark, setIsDark] = useState(false);

  // Sync theme with document dark mode
  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const extensions = useMemo(() => {
    // Choose language parser based on active file extension
    const langExtension =
      filename.endsWith(".tsx") || filename.endsWith(".ts")
        ? javascript({ jsx: true, typescript: true })
        : filename.endsWith(".css")
        ? css()
        : javascript();

    const activeTheme = isDark ? vercelDarkTheme : vercelLightTheme;
    const activeHighlight = isDark ? vercelDarkHighlight : vercelLightHighlight;

    const customKeymaps = onFormat
      ? [
          Prec.highest(
            keymap.of([
              {
                key: "Mod-s",
                run: () => {
                  onFormat();
                  return true;
                },
              },
            ])
          ),
        ]
      : [];

    return [
      baseEditorTheme,
      activeTheme,
      syntaxHighlighting(activeHighlight),
      langExtension,
      ...customKeymaps,
      EditorView.lineWrapping,
    ];
  }, [filename, isDark, onFormat]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <CodeMirror
        value={value}
        height="100%"
        className="h-full w-full text-[13px]"
        theme="none"
        extensions={extensions}
        onChange={onChange}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          history: true,
          foldGutter: true,
          drawSelection: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          syntaxHighlighting: false, // Managed explicitly via our custom HighlightStyle
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: false,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: true,
          historyKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: false,
        }}
      />
    </div>
  );
}
