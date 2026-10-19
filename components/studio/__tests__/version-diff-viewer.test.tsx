import { describe, it, expect } from "bun:test";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  computeLineDiff,
  VersionDiffViewer,
  type DiffLine,
} from "../version-diff-viewer";

describe("VersionDiffViewer & computeLineDiff", () => {
  describe("computeLineDiff algorithm", () => {
    it("returns 0 added and 0 removed for identical content", () => {
      const code = "line 1\nline 2\nline 3";
      const result = computeLineDiff(code, code);

      expect(result.addedCount).toBe(0);
      expect(result.removedCount).toBe(0);
      expect(result.lines.length).toBe(3);
      expect(result.lines.every((l) => l.type === "unchanged")).toBe(true);
      expect(result.lines[0]).toEqual({
        type: "unchanged",
        oldLineNumber: 1,
        newLineNumber: 1,
        content: "line 1",
      });
      expect(result.lines[1]).toEqual({
        type: "unchanged",
        oldLineNumber: 2,
        newLineNumber: 2,
        content: "line 2",
      });
      expect(result.lines[2]).toEqual({
        type: "unchanged",
        oldLineNumber: 3,
        newLineNumber: 3,
        content: "line 3",
      });
    });

    it("detects added lines correctly", () => {
      const oldCode = "line 1\nline 3";
      const newCode = "line 1\nline 2\nline 3";
      const result = computeLineDiff(oldCode, newCode);

      expect(result.addedCount).toBe(1);
      expect(result.removedCount).toBe(0);

      const added = result.lines.find((l) => l.type === "added");
      expect(added).toBeDefined();
      expect(added?.content).toBe("line 2");
      expect(added?.oldLineNumber).toBeNull();
      expect(added?.newLineNumber).toBe(2);

      const lastLine = result.lines[result.lines.length - 1];
      expect(lastLine).toEqual({
        type: "unchanged",
        oldLineNumber: 2,
        newLineNumber: 3,
        content: "line 3",
      });
    });

    it("detects removed lines correctly", () => {
      const oldCode = "line 1\nline 2\nline 3";
      const newCode = "line 1\nline 3";
      const result = computeLineDiff(oldCode, newCode);

      expect(result.addedCount).toBe(0);
      expect(result.removedCount).toBe(1);

      const removed = result.lines.find((l) => l.type === "removed");
      expect(removed).toBeDefined();
      expect(removed?.content).toBe("line 2");
      expect(removed?.oldLineNumber).toBe(2);
      expect(removed?.newLineNumber).toBeNull();
    });

    it("detects modified lines as removed then added", () => {
      const oldCode = "const x = 1;";
      const newCode = "const x = 2;";
      const result = computeLineDiff(oldCode, newCode);

      expect(result.addedCount).toBe(1);
      expect(result.removedCount).toBe(1);
      expect(result.lines).toEqual([
        {
          type: "removed",
          oldLineNumber: 1,
          newLineNumber: null,
          content: "const x = 1;",
        },
        {
          type: "added",
          oldLineNumber: null,
          newLineNumber: 1,
          content: "const x = 2;",
        },
      ]);
    });

    it("handles empty oldCode", () => {
      const oldCode = "";
      const newCode = "first line\nsecond line";
      const result = computeLineDiff(oldCode, newCode);

      expect(result.addedCount).toBe(2);
      expect(result.removedCount).toBe(0);
      expect(result.lines.every((l) => l.type === "added")).toBe(true);
    });

    it("handles empty newCode", () => {
      const oldCode = "deleted 1\ndeleted 2";
      const newCode = "";
      const result = computeLineDiff(oldCode, newCode);

      expect(result.addedCount).toBe(0);
      expect(result.removedCount).toBe(2);
      expect(result.lines.every((l) => l.type === "removed")).toBe(true);
    });

    it("normalizes CRLF (\\r\\n) line endings without false diffs", () => {
      const crlfCode = "line 1\r\nline 2\r\nline 3";
      const lfCode = "line 1\nline 2\nline 3";
      const result = computeLineDiff(crlfCode, lfCode);

      expect(result.addedCount).toBe(0);
      expect(result.removedCount).toBe(0);
      expect(result.lines.length).toBe(3);
      expect(result.lines.every((l) => l.type === "unchanged")).toBe(true);
      expect(result.lines[0].content).toBe("line 1");
      expect(result.lines[1].content).toBe("line 2");
      expect(result.lines[2].content).toBe("line 3");
    });
  });

  describe("VersionDiffViewer UI component", () => {
    it("renders empty state when codes are identical", () => {
      const code = "console.log('hello world');";
      const html = renderToString(
        <VersionDiffViewer
          oldCode={code}
          newCode={code}
          filename="component.tsx"
        />
      );

      expect(html).toContain("No changes detected between this checkpoint and current files.");
      expect(html).toContain("component.tsx");
      expect(html).not.toContain("text-emerald-400");
      expect(html).not.toContain("text-rose-400");
    });

    it("renders line change counters and custom labels when differences exist", () => {
      const oldCode = "const a = 10;\nconst b = 20;";
      const newCode = "const a = 10;\nconst b = 25;\nconst c = 30;";
      const html = renderToString(
        <VersionDiffViewer
          oldCode={oldCode}
          newCode={newCode}
          filename="component.tsx"
          oldLabel="v1.0"
          newLabel="v2.0"
        />
      );

      expect(html).toContain("component.tsx");
      expect(html).toContain("v1.0");
      expect(html).toContain("v2.0");
      // +2 lines added, -1 line removed
      expect(html).toContain("+2");
      expect(html).toContain("-1");
      expect(html).toContain("text-emerald-400");
      expect(html).toContain("text-rose-400");
      // Contains the added and removed content
      expect(html).toContain("const b = 20;");
      expect(html).toContain("const b = 25;");
      expect(html).toContain("const c = 30;");
      // Does not show empty state
      expect(html).not.toContain("No changes detected between this checkpoint and current files.");
      // Wraps in min-w-full w-fit to prevent background clipping on horizontal scroll
      expect(html).toContain("min-w-full w-fit");
    });

    it("renders old and new line numbers and diff prefixes (+/-) with aria-hidden for a11y", () => {
      const oldCode = "import React from 'react';";
      const newCode = "import * as React from 'react';";
      const html = renderToString(
        <VersionDiffViewer
          oldCode={oldCode}
          newCode={newCode}
          filename="demo.tsx"
        />
      );

      expect(html).toContain("demo.tsx");
      expect(html).toContain("Checkpoint");
      expect(html).toContain("Current");
      // Line numbers and indicators
      expect(html).toContain("+");
      expect(html).toContain("-");
      expect(html).toContain("aria-hidden=\"true\"");
      expect(html).toContain("import React from &#x27;react&#x27;;");
      expect(html).toContain("import * as React from &#x27;react&#x27;;");
    });
  });
});
