"use client";

import React, { useRef, useEffect } from "react";
import Editor, { Monaco, OnMount } from "@monaco-editor/react";
import { StudioFileName } from "@/lib/store/studio-store";

interface MonacoCodeEditorProps {
  filename: StudioFileName;
  value: string;
  onChange: (value: string) => void;
  onFormat?: () => void;
}

export function MonacoCodeEditor({
  filename,
  value,
  onChange,
  onFormat,
}: MonacoCodeEditorProps) {
  const monacoRef = useRef<Monaco | null>(null);

  const getLanguage = (file: StudioFileName) => {
    if (file.endsWith(".tsx") || file.endsWith(".ts")) return "typescript";
    if (file.endsWith(".css")) return "css";
    return "javascript";
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    monacoRef.current = monaco;

    // Define Vercel Light Theme
    monaco.editor.defineTheme("vercel-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "8f8f8f", fontStyle: "italic" },
        { token: "keyword", foreground: "0070f3", fontStyle: "bold" },
        { token: "string", foreground: "7928ca" },
        { token: "number", foreground: "f5a623" },
        { token: "type", foreground: "0070f3" },
        { token: "identifier", foreground: "171717" },
        { token: "tag", foreground: "eb367f" },
        { token: "attribute.name", foreground: "7928ca" },
        { token: "attribute.value", foreground: "0761d1" },
        { token: "delimiter", foreground: "8f8f8f" },
      ],
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#171717",
        "editor.lineHighlightBackground": "#fafafa",
        "editor.selectionBackground": "#d3e5ff",
        "editorCursor.foreground": "#0070f3",
        "editorLineNumber.foreground": "#a1a1a1",
        "editorLineNumber.activeForeground": "#171717",
        "editorIndentGuide.background": "#ebebeb",
        "editorIndentGuide.activeBackground": "#8f8f8f",
        "editorGutter.background": "#ffffff",
        "editorWidget.background": "#ffffff",
        "editorWidget.border": "#ebebeb",
      },
    });

    // Define Vercel Dark Theme
    monaco.editor.defineTheme("vercel-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "707070", fontStyle: "italic" },
        { token: "keyword", foreground: "ff0080", fontStyle: "bold" },
        { token: "string", foreground: "50e3c2" },
        { token: "number", foreground: "f9cb28" },
        { token: "type", foreground: "00dfd8" },
        { token: "identifier", foreground: "ededed" },
        { token: "tag", foreground: "7928ca" },
        { token: "attribute.name", foreground: "eb367f" },
        { token: "attribute.value", foreground: "aaffec" },
        { token: "delimiter", foreground: "a1a1a1" },
      ],
      colors: {
        "editor.background": "#0a0a0a",
        "editor.foreground": "#ededed",
        "editor.lineHighlightBackground": "#141414",
        "editor.selectionBackground": "#27272a",
        "editorCursor.foreground": "#0070f3",
        "editorLineNumber.foreground": "#52525b",
        "editorLineNumber.activeForeground": "#ededed",
        "editorIndentGuide.background": "#1f1f23",
        "editorIndentGuide.activeBackground": "#52525b",
        "editorGutter.background": "#0a0a0a",
        "editorWidget.background": "#0a0a0a",
        "editorWidget.border": "#27272a",
      },
    });

    const isDark = document.documentElement.classList.contains("dark");
    monaco.editor.setTheme(isDark ? "vercel-dark" : "vercel-light");

    // Configure TypeScript compiler diagnostics
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTextExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
      reactNamespace: "React",
      allowJs: true,
      typeRoots: ["node_modules/@types"],
    });

    // Save and Format shortcut (Ctrl+S / Cmd+S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onFormat) {
        onFormat();
      }
    });
  };

  // Sync theme when html class changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (monacoRef.current) {
        const isDark = document.documentElement.classList.contains("dark");
        monacoRef.current.editor.setTheme(isDark ? "vercel-dark" : "vercel-light");
      }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <Editor
        height="100%"
        width="100%"
        path={filename}
        language={getLanguage(filename)}
        value={value}
        onChange={(val) => onChange(val || "")}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 13,
          fontFamily:
            "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontLigatures: true,
          lineHeight: 22,
          tabSize: 2,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          padding: { top: 12, bottom: 12 },
          renderLineHighlight: "all",
          wordWrap: "on",
          automaticLayout: true,
          bracketPairColorization: { enabled: true },
        }}
        loading={
          <div className="flex h-full w-full items-center justify-center bg-background text-xs text-muted-foreground">
            Initializing Monaco Engine...
          </div>
        }
      />
    </div>
  );
}
