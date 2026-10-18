"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  useStudioStore,
  StudioViewport,
  PreviewTheme,
} from "@/lib/store/studio-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Terminal,
  Trash2,
  ChevronDown,
  CornerDownLeft,
  AlertCircle,
  AlertTriangle,
  Copy,
  Check,
  HelpCircle,
} from "lucide-react";

export function TerminalPanel() {
  const {
    terminalLogs,
    isTerminalOpen,
    terminalHeight,
    terminalFilter,
    dependencies,
    clearTerminalLogs,
    toggleTerminal,
    setTerminalHeight,
    setTerminalFilter,
    addTerminalLog,
    addDependency,
    removeDependency,
    setPreviewTheme,
    setViewport,
    setZoom,
    resetCurrentTemplate,
  } = useStudioStore();

  const [inputVal, setInputVal] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isResizingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [terminalLogs, terminalFilter]);

  // Resizing logic for top handle
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    startYRef.current = e.clientY;
    startHeightRef.current = terminalHeight;
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const deltaY = startYRef.current - e.clientY;
      const newHeight = startHeightRef.current + deltaY;
      setTerminalHeight(newHeight);
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [setTerminalHeight]);

  // Filter logs based on active filter
  const filteredLogs = useMemo(() => {
    return terminalLogs.filter((entry) => {
      if (terminalFilter === "all") return true;
      if (terminalFilter === "errors") return entry.type === "error";
      if (terminalFilter === "warnings") return entry.type === "warn";
      if (terminalFilter === "logs") return entry.type === "log" || entry.type === "info";
      if (terminalFilter === "system")
        return entry.type === "system" || entry.type === "command" || entry.type === "result";
      return true;
    });
  }, [terminalLogs, terminalFilter]);

  // Count levels
  const counts = useMemo(() => {
    let errorCount = 0;
    let warnCount = 0;
    let logCount = 0;
    let sysCount = 0;

    for (const log of terminalLogs) {
      if (log.type === "error") errorCount += log.count;
      else if (log.type === "warn") warnCount += log.count;
      else if (log.type === "log" || log.type === "info") logCount += log.count;
      else sysCount += log.count;
    }

    return { errorCount, warnCount, logCount, sysCount };
  }, [terminalLogs]);

  // Execute typed command or JS expression
  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    // Add to command history
    setCommandHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);
    setInputVal("");

    // Log the user command entry
    addTerminalLog({
      type: "command",
      message: cmd,
    });

    const parts = cmd.split(" ").filter(Boolean);
    const primary = parts[0]?.toLowerCase();
    const arg = parts.slice(1).join(" ").trim();

    // Built-in studio CLI commands
    if (primary === "clear" || primary === "cls") {
      clearTerminalLogs();
      return;
    }

    if (primary === "help") {
      addTerminalLog({
        type: "system",
        message: [
          "Available Studio Commands:",
          "  help                          - Show this command reference",
          "  clear                         - Clear all terminal logs",
          "  install <pkg> | add <pkg>     - Add npm package to dependencies (esm.sh)",
          "  remove <pkg>                  - Remove npm package from dependencies",
          "  deps | packages               - List active dependencies",
          "  theme <dark|light>            - Switch canvas preview theme",
          "  viewport <desktop|tablet|mobile|responsive>",
          "  zoom <50|75|100|125|150>      - Change canvas preview zoom",
          "  reset                         - Reset code to initial template",
          "  <any javascript>              - Evaluate JavaScript expression in sandbox",
          "                                  e.g.: 2 + 2, document.title, window.innerWidth",
        ].join("\n"),
      });
      return;
    }

    if (primary === "install" || primary === "add") {
      if (!arg) {
        addTerminalLog({
          type: "warn",
          message: "Usage: install <package-name> (e.g. install canvas-confetti)",
        });
        return;
      }
      addDependency(arg);
      addTerminalLog({
        type: "system",
        message: `Package "${arg}" added to studio dependencies.`,
      });
      return;
    }

    if (primary === "remove") {
      if (!arg) {
        addTerminalLog({
          type: "warn",
          message: "Usage: remove <package-name>",
        });
        return;
      }
      removeDependency(arg);
      addTerminalLog({
        type: "system",
        message: `Package "${arg}" removed from dependencies.`,
      });
      return;
    }

    if (primary === "deps" || primary === "packages") {
      addTerminalLog({
        type: "system",
        message:
          dependencies.length > 0
            ? `Active Dependencies (${dependencies.length}):\n  - ${dependencies.join("\n  - ")}`
            : "No custom external dependencies loaded.",
      });
      return;
    }

    if (primary === "theme") {
      if (arg === "dark" || arg === "light") {
        setPreviewTheme(arg as PreviewTheme);
        addTerminalLog({
          type: "system",
          message: `Preview theme switched to "${arg}".`,
        });
      } else {
        addTerminalLog({
          type: "warn",
          message: "Usage: theme dark | theme light",
        });
      }
      return;
    }

    if (primary === "viewport") {
      if (["desktop", "tablet", "mobile", "responsive"].includes(arg)) {
        setViewport(arg as StudioViewport);
        addTerminalLog({
          type: "system",
          message: `Viewport changed to "${arg}".`,
        });
      } else {
        addTerminalLog({
          type: "warn",
          message: "Usage: viewport desktop | tablet | mobile | responsive",
        });
      }
      return;
    }

    if (primary === "zoom") {
      const z = parseInt(arg, 10);
      if ([50, 75, 100, 125, 150].includes(z)) {
        setZoom(z);
        addTerminalLog({
          type: "system",
          message: `Canvas zoom set to ${z}%.`,
        });
      } else {
        addTerminalLog({
          type: "warn",
          message: "Usage: zoom 50 | 75 | 100 | 125 | 150",
        });
      }
      return;
    }

    if (primary === "reset") {
      resetCurrentTemplate();
      addTerminalLog({
        type: "system",
        message: "Starter blueprint template reset.",
      });
      return;
    }

    // Default: Evaluate as JavaScript expression inside Sandbox Iframe
    try {
      const iframe = document.querySelector<HTMLIFrameElement>(
        'iframe[title="21st.dev Live Component Preview"]'
      );
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          {
            type: "EVAL_COMMAND",
            code: cmd,
            id: Date.now(),
          },
          "*"
        );
      } else {
        addTerminalLog({
          type: "warn",
          message: "Sandbox preview iframe is not currently active.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addTerminalLog({
        type: "error",
        message: `Evaluation Error: ${msg}`,
      });
    }
  };

  // Keyboard navigation for command history
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex =
        historyIndex === -1
          ? commandHistory.length - 1
          : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInputVal(commandHistory[nextIndex]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setInputVal("");
      } else {
        setHistoryIndex(nextIndex);
        setInputVal(commandHistory[nextIndex]);
      }
    }
  };

  const handleCopyLog = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  if (!isTerminalOpen) return null;

  return (
    <div
      style={{ height: `${terminalHeight}px` }}
      className="relative flex w-full flex-col border-t border-border bg-zinc-950 text-zinc-100 font-sans text-xs select-none shadow-2xl z-20 transition-[height] duration-75"
    >
      {/* Resizable Top Drag Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize hover:bg-primary/40 transition-colors z-30 group"
        title="Drag up/down to resize terminal"
      >
        <div className="mx-auto h-0.5 w-12 rounded-full bg-border group-hover:bg-primary transition-colors mt-0.5" />
      </div>

      {/* Terminal Header & Filter Tabs */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-zinc-800/80 bg-zinc-900/90 px-3 pt-1">
        {/* Left: Terminal Title & Filters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-zinc-300 font-semibold text-xs mr-1">
            <Terminal className="size-3.5 text-emerald-400" />
            <span>Terminal</span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-zinc-950/70 p-0.5 rounded-md border border-zinc-800 text-[11px]">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTerminalFilter("all")}
              className={`h-6 px-2 py-0.5 rounded text-[11px] font-sans transition-colors cursor-pointer ${
                terminalFilter === "all"
                  ? "bg-zinc-800 text-white font-medium shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-transparent"
              }`}
            >
              All ({terminalLogs.length})
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTerminalFilter("errors")}
              className={`h-6 px-2 py-0.5 rounded text-[11px] font-sans transition-colors flex items-center gap-1 cursor-pointer ${
                terminalFilter === "errors"
                  ? "bg-red-950/80 text-red-300 font-medium"
                  : "text-zinc-400 hover:text-red-400 hover:bg-transparent"
              }`}
            >
              <AlertCircle className="size-2.5 text-red-400" />
              <span>Errors</span>
              {counts.errorCount > 0 && (
                <span className="text-[10px] bg-red-500/20 text-red-400 px-1 rounded-full font-bold">
                  {counts.errorCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTerminalFilter("warnings")}
              className={`h-6 px-2 py-0.5 rounded text-[11px] font-sans transition-colors flex items-center gap-1 cursor-pointer ${
                terminalFilter === "warnings"
                  ? "bg-amber-950/80 text-amber-300 font-medium"
                  : "text-zinc-400 hover:text-amber-400 hover:bg-transparent"
              }`}
            >
              <AlertTriangle className="size-2.5 text-amber-400" />
              <span>Warnings</span>
              {counts.warnCount > 0 && (
                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1 rounded-full font-bold">
                  {counts.warnCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTerminalFilter("logs")}
              className={`h-6 px-2 py-0.5 rounded text-[11px] font-sans transition-colors cursor-pointer ${
                terminalFilter === "logs"
                  ? "bg-zinc-800 text-white font-medium"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-transparent"
              }`}
            >
              Logs ({counts.logCount})
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTerminalFilter("system")}
              className={`h-6 px-2 py-0.5 rounded text-[11px] font-sans transition-colors cursor-pointer ${
                terminalFilter === "system"
                  ? "bg-zinc-800 text-white font-medium"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-transparent"
              }`}
            >
              System
            </Button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Quick Help */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  addTerminalLog({
                    type: "system",
                    message: [
                      "Available Studio Commands:",
                      "  help                          - Show this command reference",
                      "  clear                         - Clear all terminal logs",
                      "  install <pkg> | add <pkg>     - Add npm package to dependencies (esm.sh)",
                      "  remove <pkg>                  - Remove npm package from dependencies",
                      "  deps | packages               - List active dependencies",
                      "  theme <dark|light>            - Switch canvas preview theme",
                      "  viewport <desktop|tablet|mobile|responsive>",
                      "  zoom <50|75|100|125|150>      - Change canvas preview zoom",
                      "  reset                         - Reset code to initial template",
                      "  <any javascript>              - Evaluate JavaScript expression in sandbox",
                    ].join("\n"),
                  });
                }}
                className="size-6 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              >
                <HelpCircle className="size-3" />
                <span className="sr-only">Commands Help</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">CLI command guide</TooltipContent>
          </Tooltip>

          {/* Clear Logs */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearTerminalLogs}
                className="size-6 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              >
                <Trash2 className="size-3" />
                <span className="sr-only">Clear logs</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Clear console logs</TooltipContent>
          </Tooltip>

          {/* Close Panel */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTerminal}
                className="size-6 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              >
                <ChevronDown className="size-3.5" />
                <span className="sr-only">Close terminal</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Minimize terminal (Ctrl+`)</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Log Output Stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 select-text scroll-smooth"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex h-full items-center justify-center text-zinc-500 text-xs italic select-none">
            No {terminalFilter !== "all" ? terminalFilter : ""} logs recorded yet.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isError = log.type === "error";
            const isWarn = log.type === "warn";
            const isCommand = log.type === "command";
            const isResult = log.type === "result";
            const isSystem = log.type === "system";

            return (
              <div
                key={log.id}
                className={`group relative flex items-start gap-2 rounded px-2 py-1 leading-relaxed transition-colors hover:bg-zinc-900/60 ${
                  isError
                    ? "bg-red-500/10 text-red-300 border-l-2 border-red-500"
                    : isWarn
                    ? "bg-amber-500/10 text-amber-300 border-l-2 border-amber-500"
                    : isCommand
                    ? "text-emerald-400 font-semibold"
                    : isResult
                    ? "text-sky-300 bg-sky-950/20"
                    : isSystem
                    ? "text-purple-300/90 text-[11px]"
                    : "text-zinc-300"
                }`}
              >
                {/* Timestamp */}
                <span className="shrink-0 text-[10px] text-zinc-500 tabular-nums select-none pt-0.5">
                  [{log.timestamp}]
                </span>

                {/* Level Tag / Symbol */}
                <span className="shrink-0 select-none pt-0.5">
                  {isError && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 uppercase">
                      <AlertCircle className="size-3 text-red-400 inline" />
                      ERR
                    </span>
                  )}
                  {isWarn && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 uppercase">
                      <AlertTriangle className="size-3 text-amber-400 inline" />
                      WARN
                    </span>
                  )}
                  {isCommand && (
                    <span className="text-emerald-400 font-bold">&gt;</span>
                  )}
                  {isResult && (
                    <span className="text-sky-400 font-bold">&lt;</span>
                  )}
                  {isSystem && (
                    <span className="text-[10px] text-purple-400 uppercase font-semibold">
                      SYS
                    </span>
                  )}
                  {log.type === "log" && (
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">
                      LOG
                    </span>
                  )}
                  {log.type === "info" && (
                    <span className="text-[10px] text-sky-400 uppercase font-semibold">
                      INFO
                    </span>
                  )}
                </span>

                {/* Message Body */}
                <div className="flex-1 whitespace-pre-wrap break-all text-xs font-mono">
                  {log.message}
                </div>

                {/* Repeat Badge (if repeated) */}
                {log.count > 1 && (
                  <Badge
                    variant="outline"
                    className="shrink-0 text-[10px] px-1 py-0 h-4 bg-zinc-800 border-zinc-700 text-zinc-300 select-none"
                  >
                    {log.count}x
                  </Badge>
                )}

                {/* Copy Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopyLog(log.id, log.message)}
                  className="size-5 opacity-0 group-hover:opacity-100 transition-opacity p-0 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80 select-none cursor-pointer"
                  title="Copy log entry"
                >
                  {copiedId === log.id ? (
                    <Check className="size-3 text-emerald-400" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  <span className="sr-only">Copy log entry</span>
                </Button>
              </div>
            );
          })
        )}
      </div>

      {/* Interactive Command Prompt Line (REPL) */}
      <form
        onSubmit={handleExecute}
        className="flex h-8 shrink-0 items-center gap-2 border-t border-zinc-800/80 bg-zinc-900/90 px-3"
      >
        <span className="text-emerald-400 font-bold select-none">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type JS expression or command (help, clear, install <pkg>, theme dark/light)..."
          className="flex-1 bg-transparent text-xs font-mono text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="size-5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800"
          title="Execute (Enter)"
        >
          <CornerDownLeft className="size-3" />
        </Button>
      </form>
    </div>
  );
}
