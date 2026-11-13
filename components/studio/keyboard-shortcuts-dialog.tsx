"use client";

import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Keyboard } from "lucide-react";

export interface KeyboardShortcutsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface ShortcutGroup {
  category: string;
  items: Array<{
    keys: string[];
    description: string;
  }>;
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    category: "Global & Navigation",
    items: [
      { keys: ["Tab"], description: "Move focus to next interactive control (or Skip to Main Content)" },
      { keys: ["Shift", "Tab"], description: "Move focus to previous interactive control" },
      { keys: ["?"], description: "Open Keyboard Shortcuts reference dialog" },
      { keys: ["Esc"], description: "Close active modal, drawer, or dropdown menu" },
    ],
  },
  {
    category: "Studio Workspace & Editor",
    items: [
      { keys: ["Ctrl / ⌘", "S"], description: "Save version checkpoint snapshot (or format code in editor)" },
      { keys: ["Ctrl / ⌘", "I"], description: "Toggle AI Copilot Assistant drawer" },
      { keys: ["Ctrl / ⌘", "`"], description: "Toggle bottom Terminal & Dev Console" },
      { keys: ["←", "→"], description: "Resize split-pane or viewport width when separator is focused" },
      { keys: ["↑", "↓"], description: "Resize Terminal height or navigate REPL command history" },
    ],
  },
  {
    category: "Component Hub & Cards",
    items: [
      { keys: ["Enter / Space"], description: "Open Quick Preview on focused component card stage" },
      { keys: ["Arrow Keys"], description: "Switch tabs in Quick Preview, Editor, or Version Diff" },
    ],
  },
];

export function KeyboardShortcutsDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: KeyboardShortcutsDialogProps = {}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (controlledOnOpenChange) {
        controlledOnOpenChange(next);
      } else {
        setInternalOpen(next);
      }
    },
    [controlledOnOpenChange]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const target = e.target as HTMLElement | null;
      const isEditable =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.closest?.(".cm-editor"));

      if (!isEditable && e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setOpen(!isOpen);
      }
    };

    const handleOpenEvent = () => {
      setOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("studio:open-shortcuts", handleOpenEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("studio:open-shortcuts", handleOpenEvent);
    };
  }, [isOpen, setOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto overflow-x-hidden flex flex-col font-sans p-0 gap-0 rounded-none border border-border bg-card">
        <DialogHeader className="studio-toolbar-surface border-b border-border px-6 py-4 pr-12 shrink-0">
          <div className="flex items-center gap-2">
            <Badge variant="eyebrow" className="rounded-none">
              ACCESSIBILITY & NAVIGATION
            </Badge>
          </div>
          <div className="flex items-start gap-3 mt-1.5 text-foreground">
            <div className="flex size-8 items-center justify-center rounded-none border border-border bg-background text-primary shrink-0 mt-0.5">
              <Keyboard className="size-4" aria-hidden="true" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold font-sans">
                Keyboard Shortcuts & Accessibility
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-sans">
                Navigate Component Studio, resize split panels, and trigger actions using your keyboard.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {SHORTCUT_GROUPS.map((group) => (
            <section key={group.category} aria-label={group.category} className="space-y-2">
              <h3 className="font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {group.category}
              </h3>
              <div className="divide-y divide-border border border-border bg-background">
                {group.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-4 px-3.5 py-2.5 text-xs font-sans"
                  >
                    <span className="text-foreground">{item.description}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-1.5 py-0.5 text-[10px] font-mono bg-muted border border-border text-foreground rounded-none"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <DialogFooter className="studio-toolbar-surface sticky bottom-0 z-10 flex items-center justify-between border-t border-border px-6 py-3.5 bg-card/95 backdrop-blur-xs">
          <span className="text-[11px] text-muted-foreground font-sans">
            Press <kbd className="px-1 py-0.5 font-mono text-[10px] bg-muted border border-border">?</kbd> anytime outside inputs to toggle this guide
          </span>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => setOpen(false)}
            className="rounded-none font-sans text-xs h-8 px-4"
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
